# Guía de Productos Pesables y Balanzas EAN-13

**Versión:** 1.1
**Fecha:** 05 de Junio de 2026
**Audiencia:** Frontend / Integradores

---

## Resumen Ejecutivo

Esta guía consolida el flujo end-to-end para vender productos por peso o precio variable (ej: tomate por kg, queso por g) usando balanzas EAN-13 y lectores de código de barras en el POS.

El sistema soporta tres tipos de barcode:

| Tipo | Prefijo EAN-13 | Codifica | Uso típico |
|------|----------------|----------|------------|
| `STANDARD` | `0`-`19`, `30`-`99` | ID de producto fijo | Unidades discretas (latas, packs) |
| `VARIABLE_PRICE` | `20`-`29` | `scale_code` + **precio total** | Frutas/verduras por kg con precio variable |
| `VARIABLE_WEIGHT` | `20`-`29` | `scale_code` + **peso** | Carnes, quesos con peso fijo y precio variable |

### Diagrama del flujo

```
┌─────────────────┐   ┌──────────────────┐   ┌─────────────────┐   ┌────────────────┐
│  1. REGISTRAR   │ → │  2. SETEAR       │ → │  3. IMPRIMIR    │ → │  4. ESCANEAR   │
│     PRODUCTO    │   │     PRECIO       │   │     ETIQUETA    │   │     EN POS     │
│                 │   │                  │   │                 │   │                │
│ POST /products  │   │ POST /pricing/   │   │ POST /scale/    │   │ POST /sales/   │
│ {base_unit:kg,  │   │   unit-prices    │   │   weigh-item    │   │   scan         │
│  is_variable_   │   │ {unit:kg,        │   │ {weight:1.97}   │   │ {barcode:      │
│  measure:true,  │   │  price:12500}    │   │      ↓          │   │  2000010...}   │
│  scale_code:    │   │                  │   │ POST /barcode/  │   │      ↓         │
│   "0001"}       │   │                  │   │   generate      │   │ ScanResult     │
└─────────────────┘   └──────────────────┘   │ POST /scale/    │   │ {quantity,     │
                                             │   generate-     │   │  price,tax}    │
                                             │   label         │   └────────────────┘
                                             └─────────────────┘
```

---

## 1. Modelo de Datos

### 1.1 Columnas del producto (`products.products`)

| Columna | Tipo | Nullable | Default | Restricciones |
|---------|------|----------|---------|---------------|
| `base_unit` | `VARCHAR(20)` | no | `NULL` | CHECK en lista de unidades permitidas. **Obligatorio** desde FASE 1. Inmutable post-creación. |
| `is_variable_measure` | `BOOLEAN` | no | `FALSE` | — |
| `scale_code` | `VARCHAR(5)` | sí | `NULL` | UNIQUE parcial cuando `is_variable_measure=TRUE` |

**Índice único parcial** (creado en la migración `20260526100000_add_variable_measure_to_products.up.sql`):

```sql
CREATE UNIQUE INDEX idx_products_scale_code
  ON products.products (scale_code)
  WHERE is_variable_measure = TRUE AND scale_code IS NOT NULL AND state = TRUE;
```

> El `scale_code` se almacena en el producto (no en una tabla separada). Esto simplifica el lookup por barcode pero exige unicidad por índice.

### 1.2 Precios por unidad (`products.unit_prices`)

Una fila por par `(product_id, unit)`. Para un producto "Tomate por Kg" vendido a Gs. 12.500/kg:

```sql
INSERT INTO products.unit_prices (id_product, unit, price_per_unit)
VALUES ('TOM_KG', 'kg', 12500)
ON CONFLICT (id_product, unit) DO UPDATE
   SET price_per_unit = EXCLUDED.price_per_unit;
```

La tabla también almacena el desglose de IVA (`price_with_tax`, `price_without_tax`, `tax_amount`, `tax_rate_id`) que completa `services/pricing.go:393 SetManualPrice`.

### 1.3 Configuración de balanzas (`config.scales`, `config.label_formats`)

**`config.label_formats`** define la estructura del EAN-13:

| Campo | Default | Significado |
|-------|---------|-------------|
| `prefix` | `20` | Primeros 2 dígitos del EAN-13 variable |
| `scale_code_digits` | `4` | Dígitos reservados para `scale_code` |
| `value_digits` | `5` | Dígitos para el valor embebido (precio o peso) |
| `barcode_type` | `EAN13_VARIABLE_PRICE` | Cómo se interpreta el valor |

> El EAN-13 siempre tiene 13 dígitos: `2 (prefijo) + 4 (scale_code) + 5 (valor) + 1 (check digit) = 12 + 1`.

**`config.scales`** modela el dispositivo físico (IP, puerto, protocolo, formato de etiqueta por defecto).

---

## 2. Formato del Barcode EAN-13

```
Posición:  1 2  |  3 4 5 6  |  7 8 9 10 11  |  12
           ─────┼───────────┼─────────────────┼─────
Contenido:  20  |  0 0 0 1  |  2 4 6 2  5    |  3
           ↑        ↑              ↑              ↑
        prefijo  scale_code      valor       check digit
        (2)      (4)             (5)         (1)
                                      ┌──┬──┐
                                      │2 │3 │  <- VARIABLE_PRICE: precio total en centavos/unidad
                                      └──┴──┘
                                      ó
                                      peso en gramos/100
                                      (VARIABLE_WEIGHT)
```

### Tipos de barcode

| Tipo | `type` en respuesta | `quantity` calculado | Caso de uso |
|------|---------------------|---------------------|-------------|
| Estándar | `STANDARD` | `1` | Producto con precio fijo y cantidad fija |
| Precio variable | `VARIABLE_PRICE` | `total_price / price_per_unit` | Góndola: 1.97 kg a Gs. 24.625 |
| Peso variable | `VARIABLE_WEIGHT` | `weight` (en `base_unit`) | Carne: 0.500 kg a precio/kg |

### Cálculo del check digit

Algoritmo módulo-10 estándar EAN-13 (implementado en `services/barcode.go:39`):

1. Multiplicar por 3 las posiciones pares (2, 4, 6, 8, 10, 12)
2. Sumar con las posiciones impares (1, 3, 5, 7, 9, 11)
3. Check digit = `(10 - (suma % 10)) % 10`

---

## 3. Flujo End-to-End

### Fase 1: Registrar el producto pesable

**Endpoint:** `POST /products` (ver [PRODUCT_API_GUIDE.md](./PRODUCT_API_GUIDE.md) sección "1. Crear Producto")

```bash
POST /products
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Tomate por Kg",
  "category_id": 1,
  "product_type": "PHYSICAL",
  "base_unit": "kg",
  "is_variable_measure": true,
  "scale_code": "0001"
}
```

**Respuesta 201:**

```json
{
  "id": "TOM_KG",
  "name": "Tomate por Kg",
  "base_unit": "kg",
  "is_variable_measure": true,
  "scale_code": "0001",
  "state": true
}
```

> El `scale_code` debe ser **único** entre todos los productos activos con `is_variable_measure=true`. Si ya existe, el servidor retorna `500` por violación del índice `idx_products_scale_code`.

### Fase 2: Setear el precio por kg

**Endpoint:** `POST /pricing/unit-prices` (ver [PRODUCT_API_GUIDE.md](./PRODUCT_API_GUIDE.md) sección "20. Crear Precio por Unidad")

```bash
POST /pricing/unit-prices
{
  "product_id": "TOM_KG",
  "unit": "kg",
  "price_per_unit": 12500
}
```

Alternativa con desglose de IVA automático (`services/pricing.go:393 SetManualPrice`):

```bash
POST /pricing/set-manual-price
{
  "product_id": "TOM_KG",
  "unit": "kg",
  "price_with_tax": 12500
}
```

> El sistema calculará automáticamente `price_without_tax` y `tax_amount` según la tasa de IVA aplicable al producto.

### Fase 3: En la balanza — pesar y generar etiqueta

**Endpoints:** ver [SCALE_API_GUIDE.md](./SCALE_API_GUIDE.md)

#### Paso 3.1: Pesar el producto

```bash
POST /scale/weigh-item
{
  "product_id": "TOM_KG",
  "weight": 1.97
}
```

**Respuesta 200:**

```json
{
  "product_id": "TOM_KG",
  "product_name": "Tomate por Kg",
  "unit": "kg",
  "weight": "1.97",
  "price_per_unit": "12500",
  "subtotal": "24625",
  "tax_amount": "2238.64",
  "total_with_tax": "24625",
  "scale_code": "0001"
}
```

#### Paso 3.2: Generar el código de barras

```bash
POST /barcode/generate
{
  "scale_code": "0001",
  "value": 24625,
  "format_id": 1
}
```

**Respuesta 200:**

```json
{
  "barcode": "20000100246250",
  "format": "EAN13_VARIABLE_PRICE",
  "scale_code": "0001",
  "value": 24625,
  "check_digit": 0
}
```

> **Decisión de UX:** El frontend puede llamar a `/barcode/generate` por sí solo (etiquetas pre-impresas con peso manual) o recibir el barcode ya generado dentro de `/scale/generate-label`.

#### Paso 3.3: Obtener datos de etiqueta

```bash
POST /scale/generate-label
{
  "product_id": "TOM_KG",
  "weight": 1.97,
  "barcode": "20000100246250"
}
```

**Respuesta 200:** Objeto `LabelData` con todos los datos listos para imprimir (PLU, nombre, peso, precio, IVA, código de barras en base64, etc.).

### Fase 4: En el POS — escanear

**Endpoint:** `POST /sales/scan` (ver [SALES_API_GUIDE.md](./SALES_API_GUIDE.md) sección "POST /sales/scan")

```bash
POST /sales/scan
{
  "barcode": "20000100246250",
  "branch_id": 1
}
```

**Respuesta 200 (VARIABLE_PRICE):**

```json
{
  "decoded_barcode": {
    "type": "VARIABLE_PRICE",
    "product_id": "TOM_KG",
    "scale_code": "0001",
    "total_price": "24625",
    "quantity": "1.97",
    "unit": "kg"
  },
  "product_name": "Tomate por Kg",
  "price_per_unit": "12500",
  "subtotal": "22386.36",
  "subtotal_with_tax": "24625",
  "tax_amount": "2238.64",
  "in_stock": true,
  "stock_quantity": "48.03",
  "is_variable_measure": true
}
```

> **Importante:** `/sales/scan` **no** agrega el producto a la venta. El frontend decide si llamar después a `POST /sale/{id}/products` con el `product_id` y `quantity` resultantes.

### Fase 5: Compra y Venta con Unidades Diferentes

El sistema soporta comprar y vender en unidades diferentes al `base_unit` del producto. El stock siempre se maneja en `base_unit`.

#### Flujo completo: compra caja → stock en kg → venta en kg

```
┌─────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│  1. REGISTRAR       │ → │  2. CARGAR           │ → │  3. COMPRAR          │
│     PRODUCTO        │   │     CONVERSIÓN       │   │     EN BOX           │
│                     │   │                      │   │                      │
│ POST /products      │   │ POST /unit-          │  │ POST /purchase/      │
│ {base_unit: "kg"}   │   │   conversions        │  │   complete           │
│                     │   │ {from:"box",         │  │ {unit:"box",         │
│                     │   │  to:"kg",            │  │  quantity:1,         │
│                     │   │  factor:20}          │  │  unit_price:40000}   │
│                     │   │                      │  │                      │
│                     │   │                      │  │ Resultado:           │
│                     │   │                      │  │ stock += 20 kg       │
└─────────────────────┘   └──────────────────────┘   └──────────────────────┘

┌─────────────────────┐   ┌──────────────────────┐
│  4. VENDER          │ → │  5. RESULTADO        │
│     EN BOX          │   │                      │
│                     │   │ Detalle venta:       │
│ POST /sale/         │  │  quantity=0.5        │
│ {unit:"box",        │  │  unit="box"          │
│  quantity:0.5}      │  │                      │
│                     │  │ Stock:               │
│ Trigger convierte:  │  │  -= 10 kg            │
│ 0.5 box × 20 = 10  │  │                      │
│                     │  │ Metadata:            │
│                     │  │  original_unit="box" │
│                     │  │  original_qty=0.5    │
│                     │  │  converted_qty=10    │
└─────────────────────┘   └──────────────────────┘
```

#### Reglas importantes

1. **Stock siempre en `base_unit`:** Las conversiones son automáticas. El admin no necesita calcular.
2. **Detalle mantiene unidad original:** La venta registra `0.5 box`, no `10 kg`.
3. **Conversión debe existir:** Si no hay factor de conversión registrado, la transacción se rechaza con error claro.
4. **Precio se busca por unidad:** `get_active_price(product_id, 'box', product_type)` busca precio en `box`.
5. **Precio derivado automático:** En compras con `auto_update_prices=true`, se deriva precio en `base_unit` (ver [PURCHASE_ORDERS_API_GUIDE.md](./PURCHASE_ORDERS_API_GUIDE.md)).

#### Conversiones de empaque NO vienen pre-cargadas

El sistema NO incluye conversiones de empaque (`box→kg`, `bag→kg`, etc.) por defecto. El administrador debe cargarlas vía `POST /unit-conversions`.

Usar `GET /unit-conversions/template` para ver ejemplos de conversiones comunes. Ver [UNIT_CONVERSIONS_API_GUIDE.md](./UNIT_CONVERSIONS_API_GUIDE.md).

---

## 4. Endpoints por Fase

| Fase | Método | Endpoint | Guía de referencia |
|------|--------|----------|---------------------|
| Registro | POST | `/products` | [PRODUCT_API_GUIDE.md](./PRODUCT_API_GUIDE.md) §1 |
| Registro | PUT | `/products/{id}` | [PRODUCT_API_GUIDE.md](./PRODUCT_API_GUIDE.md) §2 |
| Precio | POST | `/pricing/unit-prices` | [PRODUCT_API_GUIDE.md](./PRODUCT_API_GUIDE.md) §20 |
| Precio | POST | `/pricing/set-manual-price` | [PRICE_TRANSACTIONS_API_GUIDE.md](./PRICE_TRANSACTIONS_API_GUIDE.md) |
| Catálogo | GET | `/scale/catalog` | [SCALE_API_GUIDE.md](./SCALE_API_GUIDE.md) |
| Pesaje | POST | `/scale/weigh-item` | [SCALE_API_GUIDE.md](./SCALE_API_GUIDE.md) |
| Etiqueta | POST | `/scale/generate-label` | [SCALE_API_GUIDE.md](./SCALE_API_GUIDE.md) |
| Barcode | POST | `/barcode/generate` | [BARCODE_API_GUIDE.md](./BARCODE_API_GUIDE.md) |
| Barcode | POST | `/barcode/decode` | [BARCODE_API_GUIDE.md](./BARCODE_API_GUIDE.md) |
| POS | POST | `/sales/scan` | [SALES_API_GUIDE.md](./SALES_API_GUIDE.md) |
| POS | POST | `/sale/{id}/products` | [SALES_API_GUIDE.md](./SALES_API_GUIDE.md) |
| Conversiones | GET/POST | `/unit-conversions` | [UNIT_CONVERSIONS_API_GUIDE.md](./UNIT_CONVERSIONS_API_GUIDE.md) |
| Configuración | GET/POST | `/scales` | [SCALE_API_GUIDE.md](./SCALE_API_GUIDE.md) |
| Configuración | GET/POST | `/label-formats` | [SCALE_API_GUIDE.md](./SCALE_API_GUIDE.md) |

---

## 5. Errores Frecuentes y Advertencias

Esta sección documenta comportamientos conocidos del sistema que el frontend debe manejar proactivamente.

### 5.1 `scale_code` duplicado

| Síntoma | HTTP 500 con mensaje de constraint `idx_products_scale_code` |
|---------|---|
| Causa | Dos productos con el mismo `scale_code` intentando registrarse |
| Mitigación | Validar unicidad en el form antes de enviar. Hacer `GET /products?scale_code=X` antes del POST |

### 5.2 Producto pesable sin unidad natural

| Síntoma | Fallback silencioso a `unit="unit"` en `/scale/weigh-item` y `/sales/scan` |
|---------|---|
| Causa | `is_variable_measure=true` con `base_unit=null` o `base_unit="unit"` |
| Mitigación | `base_unit` es **obligatorio** desde FASE 1. El sistema rechaza productos sin `base_unit`. |

### 5.2b Conversión de empaque faltante

| Síntoma | Error `NO_CONVERSION` en compra o venta con unidad de empaque (`box`, `bag`, `case`) |
|---------|---|
| Causa | No se registró factor de conversión entre la unidad de empaque y el `base_unit` del producto |
| Mitigación | Cargar conversión vía `POST /unit-conversions`. Usar `GET /unit-conversions/template` para ejemplos. |

### 5.3 Cambio de `scale_code` post-creación

| Síntoma | Etiquetas ya impresas quedan con barcode apuntando al producto anterior |
|---------|---|
| Causa | `PUT /products/{id}` permite modificar `scale_code` sin advertencia |
| Mitigación | No exponer `scale_code` como campo editable. Si se requiere cambio, mostrar warning explícito + reprint de etiquetas |

### 5.4 Producto sin `unit_price` para la unidad

| Síntoma | `null` o precio `0` en `GetProductPrice` |
|---------|---|
| Causa | No se cargó precio en `unit_prices` para el `base_unit` del producto |
| Mitigación | Validar antes de habilitar el botón "Pesar" en la UI. Bloquear `weigh-item` si no hay precio |

### 5.5 Check digit inválido en scan

| Síntoma | HTTP 400 "check digit inválido" desde `/sales/scan` |
|---------|---|
| Causa | Barcode mal impreso, rayado, o lector descalibrado |
| Mitigación | Mostrar mensaje "Vuelva a escanear" sin reintento automático |

### 5.6 `branch_id` fuera de sucursales permitidas

| Síntoma | HTTP 403 desde `/sales/scan`, `/products`, `/scale/*` |
|---------|---|
| Causa | Usuario intenta operar con una sucursal no incluida en su `allowed_branches` del JWT |
| Mitigación | Frontend debe respetar la lista `allowed_branches` del token y forzar selección de sucursal activa |

### 5.7 `is_variable_measure=false` pero con `scale_code`

| Síntoma | `scale_code` se persiste pero `/barcode/decode` no encuentra el producto (filtra por `is_variable_measure=TRUE`) |
|---------|---|
| Causa | Inconsistencia en datos al crear/actualizar producto |
| Mitigación | Si `scale_code` viene informado, forzar `is_variable_measure=true` en el form (regla de coherencia) |

### 5.8 Confusión entre barcode estándar y de balanza

| Síntoma | `GET /products/barcode/{barcode}` retorna 404 para barcodes de balanza |
|---------|---|
| Causa | El endpoint busca por `products.barcode`, no por `scale_code` |
| Mitigación | **Nunca** usar `GET /products/barcode/{barcode}` para códigos de balanza. Usar siempre `/sales/scan` o `/barcode/decode` |

---

## 6. Reglas de Coherencia (a enforcear en UI)

El backend **no valida** estas reglas a nivel de servicio; el frontend debe garantizarlas:

1. Si `is_variable_measure=true` → `base_unit` debe estar en `{kg, g, lb, oz, l, ml, gal, …}` (unidades medibles)
2. Si `scale_code` está informado → `is_variable_measure` debe ser `true`
3. `scale_code` debe tener entre 1 y 5 dígitos numéricos
4. `scale_code` debe ser único entre productos activos con `is_variable_measure=true`
5. Cada producto pesable debe tener al menos un `unit_prices` para su `base_unit` antes de poder ser pesado

---

## 7. Permisos RBAC

Todos los endpoints de este flujo están bajo RBAC por módulo. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md).

| Módulo | Permisos | Endpoints afectados |
|--------|----------|---------------------|
| `products` | `products:read` / `products:write` | `/products/*`, `/pricing/*`, `/barcode/*`, `/scale/*` |
| `sales` | `sales:read` / `sales:write` | `/sales/scan`, `/sale/*` |

Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación.

---

## 8. Ver También

### Guías frontend

- [PRODUCT_UNIT_FLOWS_GUIDE.md](./PRODUCT_UNIT_FLOWS_GUIDE.md) — Flujos operativos de productos con unidades de medida (creación, compra, venta, conversiones)
- [PRODUCT_API_GUIDE.md](./PRODUCT_API_GUIDE.md) — CRUD de productos, incluyendo `base_unit`, `is_variable_measure`, `scale_code`
- [BARCODE_API_GUIDE.md](./BARCODE_API_GUIDE.md) — `/barcode/decode`, `/barcode/generate`, formato EAN-13
- [SCALE_API_GUIDE.md](./SCALE_API_GUIDE.md) — `/scale/weigh-item`, `/scale/generate-label`, `/scale/catalog`, CRUD `/scales` y `/label-formats`
- [SALES_API_GUIDE.md](./SALES_API_GUIDE.md) — `/sales/scan`, `/sale/*`
- [UNIT_CONVERSIONS_API_GUIDE.md](./UNIT_CONVERSIONS_API_GUIDE.md) — Conversiones kg ↔ g ↔ lb
- [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) — Matriz de permisos RBAC

### Documentación de implementación

- [docs/implementation/weighable-products/IMPLEMENTATION_STATUS.md](../../implementation/weighable-products/IMPLEMENTATION_STATUS.md) — Log de Milestone A (unidades) + Milestone B (barcode + balanza)
- [docs/implementation/weighable-products/PLAN_IMPLEMENTACION_V3.md](../../implementation/weighable-products/PLAN_IMPLEMENTACION_V3.md) — Plan detallado de la feature

### Código fuente relevante

| Componente | Path |
|------------|------|
| Modelo `Product` | `models/product.go:11-30` |
| Servicio barcode | `services/barcode.go:237` (`ScanBarcode`) |
| Servicio scale | `services/scale.go:34` (`WeighItem`) |
| Servicio pricing | `services/pricing.go:26` (`GetProductPrice`) |
| Repo: lookup por scale_code | `database/postgres/product.go:1153` (`GetProductByScaleCode`) |
| Handler scan | `handlers/sale.go:1148` (`ScanBarcodeHandler`) |

---

*Última actualización: 2026-06-05 — Fase 5: flujo de compra/venta con unidades diferentes, conversiones de empaque, `base_unit` obligatorio.*
