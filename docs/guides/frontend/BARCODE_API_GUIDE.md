# Guía de Barcodes para Frontend

**Versión:** 2.0.0  
**Fecha:** 27 de Mayo de 2026  
**Endpoint Base:** `http://localhost:5050/api/v1`

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `products:read` |
| POST / PUT / DELETE / PATCH | `products:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

> **Ver guía end-to-end:** [WEIGHABLE_PRODUCTS_GUIDE.md](./WEIGHABLE_PRODUCTS_GUIDE.md) para el flujo completo de productos pesables (registro → precio → balanza → POS), incluyendo el formato EAN-13 de balanza y los errores frecuentes del flujo.

---

## ¿QUÉ ENDPOINT USO?

Esta es la pregunta que todo frontend developer debe hacerse al implementar escaneo de barcodes. La respuesta depende de **qué tipo de barcode** estás escaneando y **qué información necesitas**.

### Tabla de decisión rápida

| Estoy escaneando... | Necesito... | Endpoint | Método |
|---------------------|-------------|----------|--------|
| Cualquier barcode en el POS | Info completa para agregar a venta (precio, stock, IVA, cantidad ya calculada) | `/sales/scan` | POST |
| Cualquier barcode (fuera del POS) | Solo decodificar: tipo de barcode, product_id, scale_code, precio/peso embebido | `/barcode/decode` | POST |
| Barcode **estático** de un producto | Info completa del producto (stock, precios, categoría, tax) | `/products/barcode/{barcode}` | GET |
| Barcode **estático** de un producto | Info financiera del producto (márgenes, costos, rentabilidad) | `/products/financial/barcode/{barcode}` | GET |
| Producto de **medida variable** (balanza) | Generar un barcode EAN-13 con precio/peso embebido | `/barcode/generate` | POST |
| Producto en **balanza** | Pesar y obtener precio, IVA, y barcode listo para imprimir | `/scale/weigh-item` | POST |

### ¿Por qué hay tantos endpoints?

Hay **dos tipos de barcodes** en el sistema, y **se comportan distinto**:

| | Barcode Estático | Barcode Variable (EAN-13 catch-weight) |
|---|---|---|
| **Formato** | El que sea (EAN-13, UPC-A, CODE128, etc.) | **Solo EAN-13** de exactamente 13 dígitos |
| **Prefijo** | Cualquiera | **20-29** (indica precio/peso variable) |
| **Dónde se busca** | Columna `products.barcode` | Columna `products.scale_code` |
| **Precio** | Fijo, determinado por `unit_prices` | **Embebido en el barcode** (ej: Gs. 24.625) |
| **Cantidad** | 1 unidad por escaneo | **Variable**: se calcula como total_price / price_per_unit |
| **Quién lo usa** | Cajera escanea Coca-Cola | Cajera escanea etiqueta de balanza (Tomate 1.97 kg) |

**IMPORTANTE:** Si escaneás un barcode variable (prefijo 20-29) en los endpoints GET `/products/barcode/{barcode}`, **no lo va a encontrar** porque esos endpoints buscan en `products.barcode`, no en `products.scale_code`.

---

## ENDPOINTS DE BARCODE (NUEVOS — Fase 4)

> Estos endpoints **decodifican EAN-13 real**. Validan check digit, detectan prefijo 20-29, y buscan el producto correcto (por `barcode` o por `scale_code` según corresponda).

### POST /barcode/decode

**Decodifica** un barcode EAN-13 y devuelve los datos extraídos + el producto asociado.
**NO** incluye precio, stock, ni IVA. Solo decodifica la estructura del barcode.

**Cuándo usarlo:**
- Querés saber qué tipo de barcode es (STANDARD, VARIABLE_PRICE, VARIABLE_WEIGHT)
- Querés el `product_id` y `scale_code` sin hacer lookup de precios
- Estás en un flujo que no es de venta (inventario, recepción, auditoría)

**Request:**
```json
POST /api/v1/barcode/decode
Authorization: Bearer <token>
Content-Type: application/json

{
  "barcode": "2000010246250"
}
```

**Response — DecodedBarcode:**

| Campo | Tipo | Siempre presente? | Descripción |
|-------|------|-------------------|-------------|
| `type` | string | SI | `STANDARD`, `VARIABLE_PRICE`, o `VARIABLE_WEIGHT` |
| `product_id` | string | SI | ID del producto encontrado |
| `scale_code` | string | SI | Código de balanza. Vacío (`""`) para barcode estándar |
| `total_price` | string (decimal) | SOLO `VARIABLE_PRICE` | Precio total embebido en el barcode (guaraníes) |
| `weight` | string (decimal) | SOLO `VARIABLE_WEIGHT` | Peso embebido en el barcode |
| `quantity` | string (decimal) | NO | Cantidad calculada. Solo se llena en `/sales/scan` |
| `unit` | string | SI | Unidad base del producto (ej: `"kg"`, `"unit"`) |

**Ejemplo: Barcode de precio variable (Tomate, prefix 20)**

Request: `{"barcode": "2000010246250"}` → `20|0001|024625|0`
- Prefijo `20` → barcode variable
- `scale_code = "0001"` → producto TOM_KG (Tomate por Kg)
- `total_price = "24625"` → Gs. 24.625 (6 dígitos del valor)

```json
{
  "type": "VARIABLE_PRICE",
  "product_id": "TOM_KG",
  "scale_code": "0001",
  "total_price": "24625",
  "unit": "kg"
}
```

**Ejemplo: Barcode estándar (producto normal)**

Request: `{"barcode": "1234567890128"}` → prefijo `12`, no es 20-29

```json
{
  "type": "STANDARD",
  "product_id": "PROD_001",
  "scale_code": "",
  "unit": "unit"
}
```

**Errores:**
| Código | Significado |
|--------|-------------|
| 400 | Barcode vacío, no son 13 dígitos, check digit inválido, o producto no encontrado |
| 401 | Token ausente o inválido |

---

### POST /barcode/generate

**Genera** un barcode EAN-13 de precio/peso variable para imprimir en etiqueta de balanza.

**Cuándo usarlo:**
- La balanza pesó un producto y necesitás generar la etiqueta con barcode
- El producto ya tiene `scale_code` asignado
- El valor a embeber es el precio total (en guaraníes) o el peso

**Request:**
```json
POST /api/v1/barcode/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "scale_code": "0001",
  "value": 24625
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `scale_code` | string | SI | Código de balanza del producto (1-4 dígitos) |
| `value` | int | SI | Valor a embeber: precio total en Gs. o peso (sin decimales) |

**Response:**
```json
{
  "barcode": "2000010246250"
}
```

**Estructura del barcode generado:**
```
┌──────────┬───────────────┬─────────────────┬──────────────┐
│ Prefijo  │  Scale Code   │     Valor       │ Check Digit  │
│  2 díg   │  4 díg (def)  │  6 díg (10-N)   │   1 díg      │
└──────────┴───────────────┴─────────────────┴──────────────┘
```
- Prefijo: `20` (configurable en `config.label_formats`)
- Scale Code: tu `scale_code` rellenado con ceros a la izquierda (ej: `0001`)
- Valor: tu `value` rellenado con ceros a la izquierda (ej: `024625` para 24625)
- Check Digit: calculado automáticamente según estándar EAN-13

**Errores:**
| Código | Significado |
|--------|-------------|
| 400 | `scale_code` vacío o excede 4 dígitos, `value` excede 6 dígitos |
| 401 | Token ausente o inválido |

---

## ENDPOINT DE ESCANEO EN POS

### POST /sales/scan

**Endpoint universal de escaneo para el punto de venta.** Este es el endpoint recomendado para la caja registradora.

A diferencia de `/barcode/decode`, este endpoint:
- **Sí** busca precio del producto (vía `unit_prices` y jerarquía fiscal)
- **Sí** calcula subtotal, IVA, subtotal con IVA
- **Sí** calcula la cantidad para barcodes de precio variable: `quantity = total_price / price_per_unit`
- **Sí** verifica disponibilidad de stock
- Funciona **exactamente igual** para barcodes estándar y variables

**Request:**
```json
POST /api/v1/sales/scan
Authorization: Bearer <token>
Content-Type: application/json

{
  "barcode": "2000010246250",
  "branch_id": 1
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `barcode` | string | SI | Barcode EAN-13 de 13 dígitos escaneado |
| `branch_id` | int | NO | Sucursal. Default: sucursal activa del token |

**Response — ScanResult:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `decoded_barcode` | DecodedBarcode | Datos extraídos del barcode (misma estructura que `/barcode/decode`) |
| `product_name` | string | Nombre del producto |
| `price_per_unit` | string (decimal) | Precio por unidad (sin IVA) |
| `subtotal` | string (decimal) | Subtotal de la línea (sin IVA) |
| `subtotal_with_tax` | string (decimal) | Subtotal con IVA incluido |
| `tax_amount` | string (decimal) | Monto del IVA |
| `in_stock` | boolean | ¿Hay stock disponible? |
| `stock_quantity` | string (decimal) | Cantidad en stock |
| `is_variable_measure` | boolean | ¿Es producto de medida variable? |

**IMPORTANTE sobre `subtotal` vs `subtotal_with_tax`:**
- Si el precio **incluye IVA** (default en Paraguay): `subtotal_with_tax` es el monto que se cobra al cliente. `subtotal` y `tax_amount` son valores desglosados.
- Si el precio **no incluye IVA**: `subtotal_with_tax = subtotal + tax_amount`.

**Ejemplo: Tomate por Kg (barcode variable de precio)**

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

**Interpretación de este ejemplo:**
- El barcode dice: producto `0001`, precio total `Gs. 24.625`
- El precio por kg es `Gs. 12.500`
- Cantidad = `24625 / 12500 = 1.97 kg`
- El frontend debe crear un `product_detail` con `quantity: 1.97, unit: "kg"`

**Ejemplo: Coca-Cola 500ml (barcode estándar)**

```json
{
  "decoded_barcode": {
    "type": "STANDARD",
    "product_id": "PROD_001",
    "scale_code": "",
    "quantity": "1",
    "unit": "unit"
  },
  "product_name": "Coca-Cola 500ml",
  "price_per_unit": "7000",
  "subtotal": "6363.64",
  "subtotal_with_tax": "7000",
  "tax_amount": "636.36",
  "in_stock": true,
  "stock_quantity": "150",
  "is_variable_measure": false
}
```

**Interpretación:**
- Barcode estándar → 1 unidad
- El frontend debe crear un `product_detail` con `quantity: 1`
- Si ya existe en la venta: incrementar quantity en 1

**Errores:**
| Código | Significado |
|--------|-------------|
| 400 | Barcode inválido o producto no encontrado |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` del usuario |

---

## ENDPOINTS DE PRODUCTO POR BARCODE (EXISTENTES — pre-Fase 4)

> Estos endpoints **NO decodifican EAN-13**. Solo buscan el barcode literal en la columna `products.products.barcode`. No reconocen prefijos 20-29 ni buscan por `scale_code`.

### GET /products/barcode/{barcode}

Busca un producto por su **barcode estático** (el que está en la ficha del producto).

**Response:** `ProductEnriched` — incluye stock, precios, categoría, clasificación fiscal.

**⚠️ No usar para escanear etiquetas de balanza.** Si pasás `2000010246250`, devuelve 404.

### GET /products/financial/barcode/{barcode}

Similar al anterior pero incluye información financiera (márgenes, costos, rentabilidad).

**Response:** `ProductFinancialEnriched`

---

## FLUJOS COMPLETOS PARA EL FRONTEND

### Flujo A: Escanear producto en caja (POS)

```
Paso 1: Cajera escanea cualquier barcode con el lector
        ↓
Paso 2: Frontend llama POST /sales/scan
        Body: { "barcode": "<lo que leyó el lector>", "branch_id": 1 }
        ↓
Paso 3: Recibe ScanResult
        ↓
        ├── is_variable_measure == true?
        │   ├── SI → quantity = decoded_barcode.quantity (ej: 0.197)
        │   └── NO  → quantity = 1 (o +1 si ya está en la venta)
        ↓
Paso 4: Frontend agrega a la venta actual:
        {
          "product_id": result.decoded_barcode.product_id,
          "quantity":   result.is_variable_measure ? result.decoded_barcode.quantity : 1,
          "unit":       result.decoded_barcode.unit
        }
        ↓
Paso 5: Si el producto ya existe en la venta, sumar quantity.
        (Para productos de medida variable: agregar como línea separada)
```

### Flujo B: Balanza pesa y genera etiqueta

```
Paso 1: Operario coloca producto en balanza
        Balanza reporta weight (hardware, fuera del sistema)
        ↓
Paso 2: Frontend llama POST /scale/weigh-item
        Body: { "product_id": "TOM_KG", "weight": 1.97 }
        ↓
Paso 3: Recibe WeighItemResponse:
        - price_per_unit, subtotal, tax_amount
        - barcode: "2000010246250" (ya generado, listo para imprimir)
        - label_data: { product_name, weight, total_price, date, template }
        ↓
Paso 4: Frontend envía barcode y label_data a la balanza para imprimir etiqueta
```

### Flujo C: Solo necesito saber qué producto es (sin precios)

```
Paso 1: Escaneo en recepción de mercadería, inventario, etc.
        ↓
Paso 2: Frontend llama POST /barcode/decode
        Body: { "barcode": "<lo que leyó el lector>" }
        ↓
Paso 3: Recibe DecodedBarcode → type, product_id, scale_code
        ↓
Paso 4: Si necesitás más datos del producto:
        GET /products/{product_id} para info completa
        o GET /products/financial/barcode/{barcode} si es barcode estándar
```

### Flujo D: Generar barcode para etiqueta (sin pesar)

```
Paso 1: Ya tengo el producto y el precio total
        ↓
Paso 2: Frontend llama POST /barcode/generate
        Body: { "scale_code": "0001", "value": 24625 }
        ↓
Paso 3: Recibe { "barcode": "2000010246250" }
        ↓
Paso 4: Usar con POST /scale/generate-label para datos completos de etiqueta
```

---

## RESUMEN DE TODOS LOS ENDPOINTS DE BARCODE

| Endpoint | Método | Permiso | Busca en | Maneja EAN-13 variable? | Incluye precio/stock/IVA? |
|----------|--------|---------|----------|-------------------------|---------------------------|
| `/sales/scan` | POST | `sales:read` | `barcode` O `scale_code` | **SI** | **SI** |
| `/barcode/decode` | POST | `products:read` | `barcode` O `scale_code` | **SI** | **NO** |
| `/barcode/generate` | POST | `products:read` | — (genera) | **SI** | — |
| `/products/barcode/{b}` | GET | `products:read` | Solo `barcode` | **NO** | SI (ProductEnriched) |
| `/products/financial/barcode/{b}` | GET | `products:read` | Solo `barcode` | **NO** | SI (ProductFinancialEnriched) |

**Regla de oro:** Si el barcode puede venir de una etiqueta de balanza (producto de medida variable), **siempre** usá `/sales/scan` o `/barcode/decode`. **Nunca** uses los endpoints GET para eso.

---

*Última actualización: 2026-05-27 — Fase 4: endpoints de barcode EAN-13 y guía de decisión para frontend.*
