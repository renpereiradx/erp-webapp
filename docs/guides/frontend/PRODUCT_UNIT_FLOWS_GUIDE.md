# Guía de Flujos: Productos con Unidad de Medida

**Versión:** 1.0.0
**Fecha:** 9 de Junio de 2026
**Audiencia:** Frontend / Integradores

---

## Resumen Ejecutivo

Esta guía documenta los flujos operativos end-to-end para productos con unidades de medida: desde la creación del producto, pasando por la configuración de precios y conversiones, hasta la compra y venta en diferentes unidades. No es una referencia de endpoints (ver guías individuales), sino una guía práctica de **cómo combinar los endpoints** para cada escenario de negocio.

**Guías de referencia:**
- [PRODUCT_API_GUIDE.md](./PRODUCT_API_GUIDE.md) — CRUD de productos
- [UNIT_CONVERSIONS_API_GUIDE.md](./UNIT_CONVERSIONS_API_GUIDE.md) — Factores de conversión
- [PURCHASE_ORDERS_API_GUIDE.md](./PURCHASE_ORDERS_API_GUIDE.md) — Compras
- [SALES_API_GUIDE.md](./SALES_API_GUIDE.md) — Ventas
- [WEIGHABLE_PRODUCTS_GUIDE.md](./WEIGHABLE_PRODUCTS_GUIDE.md) — Productos pesables + balanza EAN-13
- [COST_PRICING_API_GUIDE.md](./COST_PRICING_API_GUIDE.md) — Costos y precios
- [PURCHASE_PRICING_INTEGRATION_GUIDE.md](./PURCHASE_PRICING_INTEGRATION_GUIDE.md) — Pricing en compras

---

## Conceptos Clave del Sistema

| Concepto | Descripción |
|----------|-------------|
| `base_unit` | Unidad canónica del producto. **Obligatorio** al crear, **inmutable** después. El stock **siempre** se maneja en esta unidad. |
| `unit` (en transacciones) | Unidad en la que se compra/vende. Puede diferir del `base_unit`. El sistema convierte automáticamente. |
| `unit_prices` | Tabla de precios por `(product_id, unit)`. Un producto puede tener precio en kg Y en box Y en g simultáneamente. |
| `unit_conversions` | Factores de conversión entre unidades. Tabla extensible vía API sin migraciones. |
| `is_variable_measure` | Booleano. `true` = producto de medida variable (tomate por kg, piso por m²). `false` = producto discreto (lata). |
| `scale_code` | Código corto para balanza EAN-13. Solo aplica si `is_variable_measure=true`. |

### Reglas Fundamentales

| Regla | Descripción |
|-------|-------------|
| Stock siempre en `base_unit` | Sin importar cómo se compre/venda, el stock se almacena y descuenta en `base_unit` |
| Conversión automática | Si `unit` ≠ `base_unit`, el sistema busca factor en `unit_conversions` |
| Factor inverso automático | Si no existe `A→B`, intenta `B→A` y calcula 1/factor |
| Sin conversión = rechazo | Si no hay factor posible, la transacción se rechaza con error `NO_CONVERSION` |
| Precio por unidad de búsqueda | `get_active_price(product_id, unit)` busca en `unit_prices` la unidad solicitada |
| Derivación automática de precio | Si no hay precio en la unidad solicitada, deriva del `base_unit` usando conversión |
| Unidad original preservada | `sales_order_details` y `purchase_order_details` guardan la unidad y cantidad **original** |
| Metadata de trazabilidad | `stock_transactions` registra `original_unit`, `original_quantity`, `converted_quantity` |

---

## FLUJO 1: Producto discreto (sin variable measure)

**Caso:** Coca-Cola 500ml, lata de atún, paquete de galletas.

### 1.1 Creación

```
POST /products
{
  "name": "Coca-Cola 500ml",
  "category_id": 7,
  "product_type": "PHYSICAL",
  "base_unit": "unit",
  "is_variable_measure": false,
  "scale_code": null
}
```

**Resultado:** Producto con `base_unit="unit"`. Stock se maneja en unidades enteras.

> `is_variable_measure` default es `false`, puede omitirse. `scale_code` no aplica para productos discretos.

### 1.2 Establecer precio

```
POST /pricing/unit-prices
{
  "product_id": "A-7oarkDR",
  "unit": "unit",
  "price_per_unit": 10000
}
```

**Resultado:** `unit_prices` tiene 1 fila: `(A-7oarkDR, unit, 10000)`.

> Para productos discretos, `unit` del precio debe coincidir con `base_unit`.

### 1.3 Compra

```
POST /purchase/complete
{
  "supplier_id": "SUP_001",
  "status": "COMPLETED",
  "order_details": [
    {
      "product_id": "A-7oarkDR",
      "quantity": 24,
      "unit_price": 7000,
      "unit": "unit",
      "price_includes_tax": true
    }
  ],
  "auto_update_prices": true,
  "default_profit_margin": 30
}
```

**Lo que pasa internamente:**

1. `unit` ("unit") = `base_unit` ("unit") → **sin conversión**
2. Stock += 24 unidades
3. Se registra costo: `unit_costs(A-7oarkDR, unit, 7000)`
4. Con `auto_update_prices=true` + margen 30%: `unit_prices(A-7oarkDR, unit, 9100)` actualizado
5. Metadata en `stock_transactions`:
   ```json
   {
     "original_unit": "unit",
     "original_quantity": 24,
     "converted_quantity": 24,
     "base_unit": "unit"
   }
   ```

### 1.4 Venta

```
POST /sale/
{
  "client_id": "CLI_001",
  "product_details": [
    {
      "product_id": "A-7oarkDR",
      "quantity": 3,
      "unit": "unit"
    }
  ]
}
```

**Resultado:**
- Precio buscado: `get_active_price(A-7oarkDR, "unit")` → 10000
- `unit` = `base_unit` → sin conversión
- Stock -= 3
- Subtotal: 3 × 10000 = 30000

---

## FLUJO 2: Producto pesable — kilogramos (variable measure)

**Caso:** Tomate por kg, carne por kg, queso por kg.

### 2.1 Creación

```
POST /products
{
  "name": "Tomate por Kg",
  "category_id": 5,
  "product_type": "PHYSICAL",
  "base_unit": "kg",
  "is_variable_measure": true,
  "scale_code": "0001"
}
```

**Resultado:** Producto con `base_unit="kg"`, `is_variable_measure=true`, `scale_code="0001"`.

**Validaciones frontend (reglas de coherencia):**

- Si `is_variable_measure=true` → `base_unit` debe ser una unidad medible (kg, g, lb, oz, l, ml, gal, meter, cm, sqm, sqft)
- Si `scale_code` está informado → `is_variable_measure` debe ser `true`
- `scale_code` debe tener entre 1 y 5 dígitos numéricos
- `scale_code` debe ser único entre productos activos con `is_variable_measure=true`

### 2.2 Establecer precio por kg

```
POST /pricing/unit-prices
{
  "product_id": "TOM_KG",
  "unit": "kg",
  "price_per_unit": 12500
}
```

**Alternativa con IVA explícito:**

```
POST /pricing/set-manual-price
{
  "product_id": "TOM_KG",
  "unit": "kg",
  "price_with_tax": 12500
}
```

> El sistema calcula `price_without_tax` y `tax_amount` automáticamente según la tasa de IVA aplicable.

### 2.3 Compra en kg (misma unidad que base_unit)

```
POST /purchase/complete
{
  "supplier_id": "SUP_FRUTAS",
  "status": "COMPLETED",
  "order_details": [
    {
      "product_id": "TOM_KG",
      "quantity": 50,
      "unit_price": 8000,
      "unit": "kg",
      "price_includes_tax": true
    }
  ],
  "auto_update_prices": true,
  "default_profit_margin": 30
}
```

**Resultado:**
- Stock += 50 kg (sin conversión)
- Costo registrado: Gs. 8.000/kg
- Precio actualizado con margen: 8000 × 1.30 = Gs. 10.400/kg (o se mantiene 12500 si ya existía precio)

### 2.4 Compra en gramos (unidad distinta a base_unit)

**Escenario:** El proveedor vende empaques de 500g de tomate cherry.

```
POST /purchase/complete
{
  "supplier_id": "SUP_FRUTAS",
  "status": "COMPLETED",
  "order_details": [
    {
      "product_id": "TOM_KG",
      "quantity": 20,
      "unit_price": 5000,
      "unit": "g",
      "price_includes_tax": true
    }
  ],
  "auto_update_prices": true
}
```

**Lo que pasa internamente:**

1. `unit` ("g") ≠ `base_unit` ("kg") → buscar conversión
2. Factor encontrado: `g → kg` = 0.001 (pre-cargado en DB)
3. Cantidad convertida: 20 × 500g = 10000g → 10000 × 0.001 = 10 kg
4. Stock += 10 kg
5. Metadata:
   ```json
   {
     "original_unit": "g",
     "original_quantity": 10000,
     "converted_quantity": 10,
     "base_unit": "kg"
   }
   ```
6. Costo por kg derivado: (5000 / 500) × 1000 = Gs. 10.000/kg

> **Nota:** El `unit_price` es **por empaque** (500g), no por gramo. El sistema entiende que `quantity=20` × `unit_price=5000` = 100000 total, y que eso equivale a 10 kg en stock.

### 2.5 Venta en kg (misma unidad)

```
POST /sale/
{
  "client_id": "CLI_001",
  "product_details": [
    {
      "product_id": "TOM_KG",
      "quantity": 1.97,
      "unit": "kg"
    }
  ]
}
```

**Resultado:**
- Precio buscado: `get_active_price(TOM_KG, "kg")` → 12500
- Stock -= 1.97 kg
- Subtotal: 1.97 × 12500 = 24625

### 2.6 Venta en gramos (unidad distinta)

```
POST /sale/
{
  "client_id": "CLI_001",
  "product_details": [
    {
      "product_id": "TOM_KG",
      "quantity": 500,
      "unit": "g"
    }
  ]
}
```

**Lo que pasa internamente:**

1. Busca precio: `get_active_price(TOM_KG, "g")`
   - Si existe precio en "g" → lo usa directamente
   - Si NO existe → busca en `base_unit` ("kg") y deriva: 12500 / 1000 = 12.50 por gramo
2. Conversión para stock: 500g × 0.001 = 0.5 kg
3. Stock -= 0.5 kg
4. Detalle de venta guarda: `quantity=500, unit="g"` (unidad original)

### 2.7 Flujo con balanza EAN-13 (pesado + escaneo)

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  1. PESAR        │ → │  2. GENERAR      │ → │  3. IMPRIMIR     │ → │  4. ESCANEAR     │
│                  │   │     BARCODE      │   │     ETIQUETA     │   │     EN POS       │
│ POST /scale/     │   │ POST /barcode/   │   │ POST /scale/     │   │ POST /sales/     │
│   weigh-item     │   │   generate       │   │   generate-label │   │   scan           │
│ {product_id:     │   │ {scale_code:     │   │ {product_id:     │   │ {barcode:        │
│   "TOM_KG",      │   │   "0001",        │   │   "TOM_KG",      │   │   "200001..."}   │
│   weight: 1.97}  │   │   value: 24625}  │   │   weight: 1.97}  │   │                  │
│                  │   │                  │   │                  │   │                  │
│ Resp:            │   │ Resp:            │   │ Resp:            │   │ Resp:            │
│  subtotal: 24625 │   │  barcode:        │   │  LabelData       │   │  quantity: 1.97  │
│  scale_code:     │   │  "20000100246250"│   │  (listo para     │   │  unit: "kg"      │
│   "0001"         │   │                  │   │   imprimir)      │   │  total: 24625    │
└──────────────────┘   └──────────────────┘   └──────────────────┘   └──────────────────┘
```

**Paso 1 — Pesar:**

```
POST /scale/weigh-item
{ "product_id": "TOM_KG", "weight": 1.97 }
```

Respuesta: `{weight: "1.97", price_per_unit: "12500", subtotal: "24625", scale_code: "0001"}`

**Paso 2 — Generar barcode:**

```
POST /barcode/generate
{ "scale_code": "0001", "value": 24625, "format_id": 1 }
```

Respuesta: `{barcode: "20000100246250", format: "EAN13_VARIABLE_PRICE"}`

**Paso 3 — Generar etiqueta:**

```
POST /scale/generate-label
{ "product_id": "TOM_KG", "weight": 1.97, "barcode": "20000100246250" }
```

Respuesta: Objeto `LabelData` con todos los datos para imprimir.

**Paso 4 — Escanear en POS:**

```
POST /sales/scan
{ "barcode": "20000100246250", "branch_id": 1 }
```

Respuesta decodifica:
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
  "subtotal_with_tax": "24625",
  "is_variable_measure": true
}
```

> **Importante:** `/sales/scan` **no** agrega el producto a la venta. El frontend decide si llamar después a `POST /sale/{id}/products` con el `product_id` y `quantity` resultantes.

---

## FLUJO 3: Producto por m² (área)

**Caso:** Piso laminado, vidrio, tela, pasto sintético.

### 3.1 Creación

```
POST /products
{
  "name": "Piso Laminado Roble",
  "category_id": 12,
  "product_type": "PHYSICAL",
  "base_unit": "sqm",
  "is_variable_measure": true,
  "scale_code": null
}
```

> `is_variable_measure=true` aplica para cualquier producto de medida variable (área, longitud, peso, volumen). No significa exclusivamente "pesable con balanza". El `scale_code` es opcional y solo se usa si el producto pasa por balanza EAN-13.

### 3.2 Precio por m²

```
POST /pricing/unit-prices
{ "product_id": "PISO_ROBLE", "unit": "sqm", "price_per_unit": 45000 }
```

### 3.3 Compra en m²

```
POST /purchase/complete
{
  "supplier_id": "SUP_PISOS",
  "status": "COMPLETED",
  "order_details": [
    {
      "product_id": "PISO_ROBLE",
      "quantity": 100,
      "unit_price": 30000,
      "unit": "sqm",
      "price_includes_tax": true
    }
  ]
}
```

Stock += 100 m² (sin conversión, `unit` = `base_unit`).

### 3.4 Compra en sqft (unidad distinta)

Si el proveedor vende en pies cuadrados:

```
POST /purchase/complete
{
  "supplier_id": "SUP_USA",
  "status": "COMPLETED",
  "order_details": [
    {
      "product_id": "PISO_ROBLE",
      "quantity": 500,
      "unit_price": 2800,
      "unit": "sqft",
      "price_includes_tax": true
    }
  ]
}
```

**Lo que pasa:**

1. Factor: `sqft → sqm` = 0.092903 (pre-cargado)
2. Cantidad convertida: 500 × 0.092903 = 46.45 m²
3. Stock += 46.45 m²
4. Detalle guarda: `quantity=500, unit="sqft"` (unidad original)

### 3.5 Venta en m²

```
POST /sale/
{
  "client_id": "CLI_001",
  "product_details": [
    { "product_id": "PISO_ROBLE", "quantity": 12.5, "unit": "sqm" }
  ]
}
```

Stock -= 12.5 m². Precio: 12.5 × 45000 = 562500.

---

## FLUJO 4: Conversión de empaque — box → kg

**Caso:** Se compra papa en cajas de 20 kg y se vende por kg suelto. Este es el flujo más complejo porque requiere un paso previo (registrar la conversión) que no existe en los otros flujos.

### 4.0 Pre-requisito: Registrar la conversión

> **Las conversiones de empaque NO vienen pre-cargadas en el sistema.** El administrador debe registrarlas manualmente antes de poder comprar/vender en unidades de empaque.

**Consultar ejemplos sugeridos:**

```
GET /unit-conversions/template
```

Respuesta:
```json
{
  "message": "Plantilla de conversiones comunes de empaque",
  "template": [
    { "from_unit": "box", "to_unit": "kg", "factor": "20", "example": "1 caja de papas = 20 kg" },
    { "from_unit": "bag", "to_unit": "kg", "factor": "5",  "example": "1 bolsa de arroz = 5 kg" },
    { "from_unit": "case", "to_unit": "l",  "factor": "12", "example": "1 cajon de gaseosas = 12 litros" },
    { "from_unit": "dozen", "to_unit": "unit", "factor": "12", "example": "1 docena de huevos = 12 unidades" }
  ]
}
```

**Registrar la conversión:**

```
POST /unit-conversions
{
  "from_unit": "box",
  "to_unit": "kg",
  "factor": "20"
}
```

**Verificar que se creó:**

```
GET /unit-conversions
```

Debe retornar la fila `(box → kg, factor=20)`.

> **Si no se registra la conversión, TODAS las transacciones con `unit="box"` para productos con `base_unit="kg"` se rechazarán con error `NO_CONVERSION`.**

### 4.1 Crear producto

```
POST /products
{
  "name": "Papa",
  "category_id": 5,
  "product_type": "PHYSICAL",
  "base_unit": "kg",
  "is_variable_measure": false
}
```

> La papa se compra en cajas pero se maneja el stock en kg. No es `is_variable_measure` porque no se pesa en balanza — se vende por kg pero en empaques predefinidos.

### 4.2 Establecer precios (en AMBAS unidades)

**Precio por kg (unidad de venta más común):**

```
POST /pricing/unit-prices
{ "product_id": "PAPA", "unit": "kg", "price_per_unit": 2600 }
```

**Precio por box (para venta a restaurantes/mayoristas):**

```
POST /pricing/unit-prices
{ "product_id": "PAPA", "unit": "box", "price_per_unit": 52000 }
```

**Resultado en `unit_prices`:**

| product_id | unit | price_per_unit |
|------------|------|----------------|
| PAPA | kg | 2600 |
| PAPA | box | 52000 |

> 20 × 2600 = 52000 — los precios son consistentes. El frontend puede calcular esto como preview, pero el backend es la fuente de verdad.

### 4.3 Compra en cajas

```
POST /purchase/complete
{
  "supplier_id": "SUP_AGRICOLA",
  "status": "COMPLETED",
  "order_details": [
    {
      "product_id": "PAPA",
      "quantity": 10,
      "unit_price": 35000,
      "unit": "box",
      "profit_pct": 30,
      "price_includes_tax": true
    }
  ],
  "auto_update_prices": true
}
```

**Lo que pasa internamente (paso a paso):**

1. **Validación de conversión:** Busca factor `box → kg` → encontrado (factor=20)
2. **Procesamiento de la línea:**
   - `quantity` = 10 box
   - `unit_price` = 35000 (por box)
   - `subtotal` = 10 × 35000 = 350000
3. **Conversión para stock:**
   - 10 box × 20 = 200 kg
   - Stock += 200 kg
4. **Registro de costo:**
   - `unit_costs(PAPA, box, 35000)` ← costo directo en box
   - Costo derivado en kg: 35000 / 20 = 1750 → `unit_costs(PAPA, kg, 1750)` ← derivado
5. **Precio de venta (con auto_update + margen 30%):**
   - Precio box: 35000 × 1.30 = 45500 → `unit_prices(PAPA, box, 45500)`
   - Precio kg derivado: 45500 / 20 = 2275 → `unit_prices(PAPA, kg, 2275)`
6. **Metadata en `stock_transactions`:**
   ```json
   {
     "source": "process_complete_purchase_order",
     "original_unit": "box",
     "original_quantity": 10,
     "converted_quantity": 200,
     "base_unit": "kg"
   }
   ```

### 4.4 Venta en kg (unidad más común para el cliente final)

```
POST /sale/
{
  "client_id": "CLI_001",
  "product_details": [
    {
      "product_id": "PAPA",
      "quantity": 2.5,
      "unit": "kg"
    }
  ]
}
```

**Resultado:**
- Precio: `get_active_price(PAPA, "kg")` → 2600
- Stock -= 2.5 kg
- Detalle: `quantity=2.5, unit="kg"`
- Subtotal: 2.5 × 2600 = 6500

### 4.5 Venta en cajas (mayorista/restaurante)

```
POST /sale/
{
  "client_id": "CLI_RESTAURANT",
  "product_details": [
    {
      "product_id": "PAPA",
      "quantity": 0.5,
      "unit": "box"
    }
  ]
}
```

**Lo que pasa:**

1. Busca precio: `get_active_price(PAPA, "box")` → 52000
   - Si no hay precio en "box", deriva de kg: 2600 × 20 = 52000
2. Conversión para stock: 0.5 box × 20 = 10 kg
3. Stock -= 10 kg
4. Detalle: `quantity=0.5, unit="box"` (unidad original preservada)
5. Subtotal: 0.5 × 52000 = 26000

### 4.6 Escenario problemático: Sin conversión registrada

Si el admin NO registró `box → kg`:

```
POST /sale/
{
  "product_details": [
    { "product_id": "PAPA", "quantity": 1, "unit": "box" }
  ]
}
```

**Respuesta del servidor:**

```json
{
  "success": false,
  "error": "NO_CONVERSION: No existe conversion de box a kg para producto PAPA (Papa). Registre en POST /unit-conversions"
}
```

**Solución:** Registrar la conversión (`POST /unit-conversions`) y reintentar la transacción.

---

## FLUJO 5: Múltiples unidades de precio en un mismo producto

**Caso:** Un producto se vende por kg al público, por caja a restaurantes, y por gramo a chefs.

### 5.1 Configurar múltiples precios

Producto "Papa" con `base_unit="kg"`:

```
POST /pricing/unit-prices  →  { "unit": "kg",  "price_per_unit": 2600   }
POST /pricing/unit-prices  →  { "unit": "box", "price_per_unit": 45000  }
POST /pricing/unit-prices  →  { "unit": "g",   "price_per_unit": 2.60   }
```

**Resultado en `unit_prices`:**

| product_id | unit | price_per_unit |
|------------|------|----------------|
| PAPA | kg | 2600 |
| PAPA | box | 45000 |
| PAPA | g | 2.60 |

### 5.2 Venta usa el precio de la unidad solicitada

```
Venta 1: { quantity: 3,   unit: "kg"  } → precio kg = 2600  → total = 7800
Venta 2: { quantity: 2,   unit: "box" } → precio box = 45000 → total = 90000
Venta 3: { quantity: 500, unit: "g"   } → precio g = 2.60   → total = 1300
```

> El sistema busca el precio de la unidad que se envía en el detalle de venta. Si no existe, intenta derivar del `base_unit` usando la conversión.

### 5.3 Flujo recomendado para el frontend

1. Al seleccionar un producto en el POS, mostrar las unidades disponibles (de `unit_prices`)
2. Si el usuario selecciona una unidad sin precio, mostrar precio derivado como preview
3. Enviar la unidad seleccionada en el campo `unit` del detalle de venta

---

## FLUJO 6: Múltiples proveedores con diferentes unidades de compra

**Caso:** Se compra Banana por kg del proveedor A, y por caja del proveedor B.

### 6.1 Producto

```
POST /products
{ "name": "Banana", "base_unit": "kg", "is_variable_measure": true }
```

### 6.2 Precio de venta

```
POST /pricing/unit-prices  →  { "unit": "kg", "price_per_unit": 5000 }
```

### 6.3 Compra del proveedor A (en kg)

```
POST /purchase/complete
{
  "supplier_id": "SUP_A",
  "order_details": [
    { "product_id": "BAN_KG", "quantity": 100, "unit_price": 3000, "unit": "kg" }
  ]
}
```

Stock += 100 kg. Costo: Gs. 3.000/kg.

### 6.4 Compra del proveedor B (en cajas)

**Pre-requisito:** Registrar conversión.

```
POST /unit-conversions
{ "from_unit": "box", "to_unit": "kg", "factor": "18" }
```

**Compra:**

```
POST /purchase/complete
{
  "supplier_id": "SUP_B",
  "order_details": [
    { "product_id": "BAN_KG", "quantity": 5, "unit_price": 50000, "unit": "box" }
  ]
}
```

Stock += 5 × 18 = 90 kg. Costo box: 50000. Costo kg derivado: 50000/18 = 2778.

---

## FLUJO 7: Venta de servicio por hora/día

**Caso:** Alquiler de cancha de fútbol, consultoría por hora.

### 7.1 Creación

```
POST /products
{
  "name": "Cancha Fútbol 5 - Hora",
  "category_id": 20,
  "product_type": "SERVICE",
  "base_unit": "hour",
  "is_variable_measure": false
}
```

### 7.2 Precio

```
POST /pricing/unit-prices
{ "product_id": "CANCHA_F5", "unit": "hour", "price_per_unit": 150000 }
```

### 7.3 Venta

```
POST /sale/
{
  "client_id": "CLI_001",
  "product_details": [
    { "product_id": "CANCHA_F5", "quantity": 2, "unit": "hour" }
  ]
}
```

Subtotal: 2 × 150000 = 300000.

### 7.4 Venta en días (conversión)

La conversión `day → hour` = 24 está pre-cargada.

```
POST /sale/
{
  "client_details": [
    { "product_id": "CANCHA_F5", "quantity": 1, "unit": "day" }
  ]
}
```

**Lo que pasa:**
- Busca precio en "day": si no existe, deriva de "hour": 150000 × 24 = 3600000
- Conversión para stock: 1 × 24 = 24 horas
- Stock -= 24 horas

---

## FLUJO 8: Producto con base_unit pequeña (gramos como base)

**Caso:** Azafrán, especias finas, oro.

### 8.1 Creación

```
POST /products
{
  "name": "Azafrán Premium",
  "base_unit": "g",
  "is_variable_measure": true
}
```

### 8.2 Precio

```
POST /pricing/unit-prices
{ "product_id": "AZAFRAN", "unit": "g", "price_per_unit": 15000 }
```

### 8.3 Compra en gramos

```
POST /purchase/complete
{
  "order_details": [
    { "product_id": "AZAFRAN", "quantity": 500, "unit_price": 10000, "unit": "g" }
  ]
}
```

Stock += 500g. Sin conversión (`unit` = `base_unit`).

### 8.4 Venta en kg (si el cliente compra cantidades grandes)

La conversión `kg → g` = 1000 está pre-cargada.

```
POST /sale/
{
  "product_details": [
    { "product_id": "AZAFRAN", "quantity": 0.1, "unit": "kg" }
  ]
}
```

**Lo que pasa:**

1. Conversión: 0.1 kg × 1000 = 100g
2. Stock -= 100g
3. Precio: busca `get_active_price(AZAFRAN, "kg")`
   - Si no existe, deriva de "g": 15000 × 1000 = 15000000/kg
4. Subtotal: 0.1 × 15000000 = 1500000

---

## FLUJO 9: Producto con empaque múltiple (bag, case, bundle)

**Caso:** Arroz se compra en bolsas de 5kg y se vende por kg.

### 9.1 Setup

```
POST /products
{ "name": "Arroz Blanco", "base_unit": "kg" }

POST /unit-conversions
{ "from_unit": "bag", "to_unit": "kg", "factor": "5" }

POST /pricing/unit-prices
{ "product_id": "ARROZ", "unit": "kg", "price_per_unit": 4000 }
```

### 9.2 Compra en bolsas

```
POST /purchase/complete
{
  "order_details": [
    { "product_id": "ARROZ", "quantity": 40, "unit_price": 18000, "unit": "bag" }
  ]
}
```

Stock += 40 × 5 = 200 kg.

### 9.3 Venta por kg

```
POST /sale/
{ "product_details": [{ "product_id": "ARROZ", "quantity": 2.5, "unit": "kg" }] }
```

Stock -= 2.5 kg. Precio: 2.5 × 4000 = 10000.

---

## FLUJO 10: Compra en una unidad, venta en otra (sin empaque)

**Caso:** Se compra tinta de impresora en litros, se vende en mililitros.

### 10.1 Setup

```
POST /products
{ "name": "Tinta Negra Epson", "base_unit": "ml" }

POST /pricing/unit-prices
{ "product_id": "TINTA_NEGRA", "unit": "ml", "price_per_unit": 50 }
```

> La conversión `l → ml` = 1000 ya está pre-cargada.

### 10.2 Compra en litros

```
POST /purchase/complete
{
  "order_details": [
    { "product_id": "TINTA_NEGRA", "quantity": 5, "unit_price": 35000, "unit": "l" }
  ]
}
```

**Lo que pasa:**
- Factor: `l → ml` = 1000
- Stock += 5 × 1000 = 5000 ml
- Costo ml derivado: 35000 / 1000 = 35/ml

### 10.3 Venta en mililitros

```
POST /sale/
{ "product_details": [{ "product_id": "TINTA_NEGRA", "quantity": 250, "unit": "ml" }] }
```

Stock -= 250 ml. Precio: 250 × 50 = 12500.

---

## Tabla de Conversiones Pre-cargadas

Estas vienen con el sistema (no requieren acción del admin):

| De | A | Factor | Ejemplo |
|----|---|--------|---------|
| kg | g | 1000 | 1 kg = 1000 g |
| kg | lb | 2.20462 | 1 kg ≈ 2.2 lb |
| kg | oz | 35.274 | 1 kg ≈ 35.27 oz |
| kg | ton | 0.001 | 1 kg = 0.001 ton |
| l | ml | 1000 | 1 L = 1000 ml |
| l | gal | 0.264172 | 1 L ≈ 0.26 gal |
| meter | cm | 100 | 1 m = 100 cm |
| sqm | sqft | 10.7639 | 1 m² ≈ 10.76 sqft |
| pair | unit | 2 | 1 par = 2 unidades |
| dozen | unit | 12 | 1 docena = 12 unidades |
| day | hour | 24 | 1 día = 24 horas |
| month | hour | 720 | 1 mes = 720 horas |

## Conversiones que el ADMIN debe Registrar (NO vienen pre-cargadas)

| De | A | Factor típico | Ejemplo |
|----|---|---------------|---------|
| box | kg | Variable | 1 caja de papas = 20 kg (varía por proveedor) |
| bag | kg | Variable | 1 bolsa de arroz = 5 kg |
| case | l | Variable | 1 cajón de gaseosas = 12 litros |
| bundle | kg | Variable | 1 atado de leña = 10 kg |
| pack | unit | Variable | 1 paquete = 6 unidades |
| tray | kg | Variable | 1 bandeja de carne = 1.5 kg |

> **Usar `GET /unit-conversions/template` para ver ejemplos sugeridos.**

---

## Errores Comunes y Cómo Prevenirlos

| Error | Causa | Prevención |
|-------|-------|------------|
| `NO_CONVERSION: box a kg` | Falta registrar conversión de empaque | Registrar `POST /unit-conversions` ANTES de comprar/vender en esa unidad |
| `base_unit cannot be changed` | Intento de editar `base_unit` en PUT | No exponer `base_unit` como campo editable en UI de edición |
| `idx_products_scale_code` (500) | `scale_code` duplicado | Validar unicidad en frontend antes de enviar |
| Precio `null` en venta | Producto sin `unit_prices` para esa unidad | Validar `has_valid_price` antes de permitir venta |
| `check digit inválido` en scan | Barcode mal impreso/leído | Mostrar "Vuelva a escanear" sin reintento automático |
| `branch_id` fuera de allowed_branches | Usuario opera en sucursal no autorizada | Respetar `allowed_branches` del JWT |

---

## Cantidades Fraccionarias en Compras, Ventas y Ajustes

El sistema **sí soporta** cantidades decimales en compras y ventas. Esto es fundamental para productos con unidades de peso, volumen, longitud o área.

### Tipos de datos en el sistema

| Componente | Tipo SQL | Ejemplo válido |
|------------|----------|----------------|
| `sale.Quantity` | `NUMERIC(10,2)` | 0.5, 1.75, 10.25 |
| `purchase.Quantity` | `DECIMAL(15,4)` | 0.5, 1.75, 10.25, 0.0001 |
| `stock.stock_quantity` | `NUMERIC(10,2)` | 19.50, 0.25 |
| `stock_transaction.QuantityChange` | `NUMERIC` | -0.5, +10.25, -4.75 |
| `inventory.QuantityChecked` | `float64` | 45.5, 0.75 |
| `ManualAdjustment.NewQuantity` | `INTEGER` | 45, 20 (NO acepta decimales) |

### Ejemplo: Venta fraccionaria

Producto: Tomate por Kg, stock = 20.00 kg, precio = Gs. 12.500/kg

```
POST /sale/
{
  "product_details": [
    { "product_id": "TOM_KG", "quantity": 0.5, "unit": "kg" }
  ]
}
```

**Resultado:**
- Subtotal: 0.5 × 12500 = 6250
- Stock: 20.00 - 0.5 = **19.50 kg**

### Ejemplo: Compra fraccionaria

Producto: Tomate por Kg, stock = 19.50 kg

```
POST /purchase/complete
{
  "order_details": [
    { "product_id": "TOM_KG", "quantity": 2.75, "unit_price": 8000, "unit": "kg" }
  ]
}
```

**Resultado:**
- Costo total: 2.75 × 8000 = 22000
- Stock: 19.50 + 2.75 = **22.25 kg**

### Recomendaciones frontend por tipo de unidad

| `base_unit` | Tipo de input | `step` | Valida |
|-------------|---------------|--------|--------|
| `kg`, `g`, `lb`, `oz`, `ton` | `number` | `0.01` | > 0, max 2 decimales |
| `l`, `ml`, `gal` | `number` | `0.01` | > 0, max 2 decimales |
| `meter`, `cm`, `sqm`, `sqft` | `number` | `0.01` | > 0, max 2 decimales |
| `month` | `number` | `0.01` | > 0, max 2 decimales |
| `unit`, `pair`, `set` | `number` | `1` | > 0, enteros |
| `box`, `pack`, `bag`, `case`, `dozen`, `bundle` | `number` | `1` | > 0, enteros |
| `hour`, `day` | `number` | `1` | > 0, enteros |
| `tray`, `bottle`, `can`, `jar`, `carton`, `stick`, `slice`, `portion` | `number` | `1` | > 0, enteros |

### Validación de stock insuficiente

El sistema valida que haya stock suficiente **antes** de descontar. Si se intenta vender 20.5 kg pero solo hay 19.50 kg:

```json
{
  "success": false,
  "error": "Insufficient stock for product TOM_KG: available 19.50, requested 20.50"
}
```

El frontend debe mostrar el stock disponible y deshabilitar el botón de venta si la cantidad excede el stock.

---

## FLUJO 11: Ajuste manual de stock

**Caso:** El admin encuentra diferencia física en el estante — hay 19.5 kg de tomate pero el sistema dice 20 kg.

### Limitación importante

> **`POST /manual_adjustment/` NO acepta cantidades decimales.** El campo `new_quantity` es `int` (entero). El stock en sí es `NUMERIC(10,2)` y soporta decimales (por compras/ventas), pero el endpoint de ajuste manual solo puede establecer valores enteros.
>
> **Para productos con `base_unit` decimal (kg, l, m²), usar `POST /stock-transactions/` como alternativa** — acepta `float64` en `quantity_change`.

### 11.1 Ajuste con `POST /manual_adjustment/` (solo enteros)

```
POST /manual_adjustment/
{
  "product_id": "A-7oarkDR",
  "new_quantity": 24,
  "reason": "Conteo físico: había 24 unidades, sistema mostraba 20"
}
```

**Lo que pasa internamente:**

1. Stock actual: 20 unidades
2. Diferencia: 24 - 20 = +4
3. Registra en `manual_adjustments`: `{old_quantity: 20, new_quantity: 24}`
4. Genera `stock_transaction` tipo `ADJUSTMENT` con `quantity_change: +4`
5. Stock actualizado a 24 unidades

**Response:**
```json
{ "message": "Manual adjustment successful" }
```

**Adecuado para:** Productos con `base_unit` entero (unit, pair, set, box, etc.)

### 11.2 Ajuste con `POST /stock-transactions/` (decimales) — RECOMENDADO para pesables

Para productos con `base_unit` decimal, usar directamente la transacción de stock:

```
POST /stock-transactions/
{
  "product_id": "TOM_KG",
  "transaction_type": "ADJUSTMENT",
  "quantity_change": -0.5,
  "reason": "Ajuste por conteo físico: stock real 19.5 kg, sistema mostraba 20 kg",
  "reference_type": "manual_adjustment",
  "metadata": {
    "adjustment_type": "INVENTORY_COUNT",
    "location": "Almacén Principal",
    "verified_by": "supervisor_01",
    "previous_stock": 20.0,
    "new_stock": 19.5,
    "stock_difference": -0.5
  }
}
```

**Lo que pasa internamente:**

1. Stock actual: 20.00 kg
2. `quantity_change`: -0.5
3. Genera `stock_transaction` con `quantity_before: 20.00`, `quantity_after: 19.50`
4. Stock actualizado a 19.50 kg

**Response (201):**
```json
{
  "id": 123,
  "product_id": "TOM_KG",
  "transaction_type": "ADJUSTMENT",
  "quantity_change": -0.5,
  "quantity_before": 20.00,
  "quantity_after": 19.50,
  "reason": "Ajuste por conteo físico: stock real 19.5 kg, sistema mostraba 20 kg",
  "user_id": "USR_789",
  "transaction_date": "2026-06-09T15:00:00Z"
}
```

### 11.3 Cuándo usar cada endpoint

| Escenario | Endpoint | Razón |
|-----------|----------|-------|
| Producto discreto (unit, pair, box) | `POST /manual_adjustment/` | `int` es suficiente, genera `manual_adjustments` record |
| Producto pesable (kg, l, m²) | `POST /stock-transactions/` | Acepta `float64`, permite -0.5, +1.75, etc. |
| Hallazgo de stock (FOUND) | `POST /stock-transactions/` | Tipos: `ADJUSTMENT`, `LOSS`, `FOUND` |
| Pérdida de stock (LOSS) | `POST /stock-transactions/` | `quantity_change` negativo |

> **Nota:** `POST /stock-transactions/` NO genera registro en `products.manual_adjustments`, solo en `products.stock_transactions`. Si se necesita trazabilidad completa en ambas tablas, se pueden hacer ambas llamadas (primero el ajuste con `manual_adjustment` redondeado, luego un stock-transaction con la diferencia decimal).

### 11.4 Consultar historial de transacciones de stock

```
GET /stock-transactions/product/TOM_KG?limit=10
```

**Response:**
```json
[
  {
    "id": 123,
    "product_id": "TOM_KG",
    "product_name": "Tomate por Kg",
    "transaction_type": "ADJUSTMENT",
    "quantity_change": -0.5,
    "quantity_before": 20.00,
    "quantity_after": 19.50,
    "reference_type": "manual_adjustment",
    "user_id": "USR_789",
    "user_name": "Juan Perez",
    "transaction_date": "2026-06-09T15:00:00Z",
    "reason": "Ajuste por conteo físico",
    "metadata": { "adjustment_type": "INVENTORY_COUNT", "location": "Almacén" }
  }
]
```

### 11.5 Ajuste con metadata (ambos endpoints soportan)

**Para `POST /manual_adjustment/`:**
```json
{
  "product_id": "A-7oarkDR",
  "new_quantity": 24,
  "reason": "Conteo físico mensual",
  "metadata": {
    "adjustment_type": "INVENTORY_COUNT",
    "location": "Almacén Principal",
    "verified_by": "supervisor_01",
    "notes": "Conteo físico realizado al final del turno"
  }
}
```

**Para `POST /stock-transactions/`:**
```json
{
  "product_id": "TOM_KG",
  "transaction_type": "ADJUSTMENT",
  "quantity_change": -0.5,
  "reason": "Conteo físico mensual",
  "metadata": {
    "adjustment_type": "INVENTORY_COUNT",
    "location": "Almacén Principal",
    "verified_by": "supervisor_01",
    "previous_stock": 20.0,
    "new_stock": 19.5
  }
}
```

**Tipos de ajuste válidos en metadata:**

| `adjustment_type` | Uso |
|-------------------|-----|
| `INVENTORY_COUNT` | Conteo de inventario físico |
| `DAMAGE` | Producto dañado |
| `EXPIRY` | Producto vencido |
| `THEFT` | Pérdida/robo |
| `RETURN` | Devolución |
| `CORRECTION` | Corrección de error |
| `INITIAL_COUNT` | Stock inicial |

**Tipos de transacción válidos para `POST /stock-transactions/`:**

| `transaction_type` | Descripción |
|--------------------|-------------|
| `ADJUSTMENT` | Ajuste manual |
| `LOSS` | Pérdida |
| `FOUND` | Hallazgo (stock encontrado) |
| `INITIAL` | Stock inicial |

---

## FLUJO 12: Inventario físico (ajuste masivo)

**Caso:** Conteo mensual de inventario — se contaron 50 productos de una vez.

### Limitación importante

> **El inventario físico SIEMPRE trabaja en `base_unit`.** El endpoint `POST /inventory/` no acepta campo `unit`. El `quantity_checked` es `float64` (sí acepta decimales), pero se interpreta directamente como cantidad en `base_unit`.
>
> **Implicación:** Si el admin contó "3 cajas de papas" pero el `base_unit` del producto es "kg", debe convertir manualmente: 3 box × 20 = 60 kg, y enviar `quantity_checked: 60`.

### 12.1 Crear inventario físico

```
POST /inventory/
{
  "items": [
    { "product_id": "TOM_KG", "quantity_checked": 45.5 },
    { "product_id": "PAPA", "quantity_checked": 180 },
    { "product_id": "A-7oarkDR", "quantity_checked": 24 }
  ],
  "metadata": {
    "inventory_type": "MONTHLY",
    "location": "Almacén Central",
    "verified_by": "supervisor_01",
    "status": "COMPLETED"
  }
}
```

**Lo que pasa internamente:**

Para cada item:
1. Obtiene stock actual del producto (en `base_unit`)
2. Compara con `quantity_checked` (acepta decimales: 45.5)
3. Si hay diferencia → genera `stock_transaction` de tipo `ADJUSTMENT`
4. Actualiza stock al valor de `quantity_checked`

**Response:**
```json
{ "message": "Inventory added", "inventory_id": 42 }
```

### 12.2 Flujo frontend recomendado para productos con unidad de empaque

Cuando el producto tiene `base_unit="kg"` pero el conteo físico fue en cajas:

```
Producto: Papa (base_unit = kg, conversión box→kg = 20)
Conteo físico: 3 cajas

Frontend debe:
1. Mostrar: "Producto: Papa | Unidad base: kg | Factor: 1 box = 20 kg"
2. Pedir conteo: "¿Cuántas cajas contó?" → admin ingresa: 3
3. Calcular: 3 × 20 = 60 kg
4. Mostrar confirmación: "Se registrará: 60 kg (3 cajas × 20 kg/caja)"
5. Enviar: { "product_id": "PAPA", "quantity_checked": 60 }
```

### 12.3 Detalles de un inventario

```
GET /inventory/42
```

**Response:**
```json
{
  "inventory": {
    "id": 42,
    "user_id": "USR_789",
    "check_date": "2026-06-09T12:00:00Z",
    "state": true,
    "metadata": { "inventory_type": "MONTHLY", "status": "COMPLETED" }
  },
  "items": [
    { "id": 100, "inventory_id": 42, "product_id": "TOM_KG", "quantity_checked": 45.5, "previous_quantity": 50.0 },
    { "id": 101, "inventory_id": 42, "product_id": "PAPA", "quantity_checked": 180, "previous_quantity": 200 }
  ]
}
```

### 12.4 Invalidar un inventario

Si el inventario fue erróneo, se puede invalidar. El sistema **revierte automáticamente** todas las transacciones de stock que generó:

```
PUT /inventory/42
```

**Response:**
```json
{ "message": "Inventory invalidated" }
```

---

## FLUJO 13: Ajuste manual de precio (con soporte de unidad)

**Caso:** El admin quiere cambiar el precio de venta del tomate a Gs. 13.000/kg.

### Este endpoint SÍ soporta `unit`

A diferencia de los ajustes de stock, el ajuste de precio sí acepta el campo `unit`:

```
POST /manual_adjustment/price
{
  "product_id": "TOM_KG",
  "new_price": 13000,
  "unit": "kg",
  "reason": "Ajuste por aumento de costo de proveedor",
  "metadata": {
    "adjustment_type": "COST_CHANGE",
    "approved_by": "manager_01"
  }
}
```

**Lo que pasa internamente:**

1. Normaliza `unit` a minúsculas ("KG" → "kg")
2. Si `unit` está vacío → usa `base_unit` del producto
3. Busca precio existente en `unit_prices(TOM_KG, kg)`
4. Si existe → actualiza (UPSERT)
5. Si no existe → crea nuevo registro
6. Registra en `manual_price_adjustments`
7. Genera `price_transactions` de tipo `MANUAL_ADJUSTMENT`

**Response:**
```json
{
  "success": true,
  "message": "Manual price adjustment applied successfully",
  "adjustment_id": 25,
  "product_id": "TOM_KG",
  "adjustment_details": {
    "old_price": 12500,
    "new_price": 13000,
    "price_change": 500,
    "price_change_percent": 4.0,
    "unit": "kg",
    "effective_date": "2026-06-09T15:00:00Z"
  }
}
```

### 13.1 Ajustar precio en múltiples unidades

Si el producto tiene precio en kg y en box, se puede ajustar cada uno independientemente:

```
POST /manual_adjustment/price
{ "product_id": "PAPA", "new_price": 2800, "unit": "kg", "reason": "Ajuste mercado" }

POST /manual_adjustment/price
{ "product_id": "PAPA", "new_price": 56000, "unit": "box", "reason": "Ajuste mercado (coherente con kg)" }
```

> **Nota:** El sistema NO valida coherencia entre precios de diferentes unidades. Si kg = 2800 y box = 56000, el admin debe asegurar que 2800 × 20 = 56000. El frontend puede mostrar esta validación como hint.

### 13.2 Consultar historial de ajustes de precio

```
GET /manual_adjustment/product/PAPA/history?limit=5
```

**Response:** Incluye tanto ajustes de stock como de precio, con `adjustment_type: "stock"` o `"price"`.

### 13.3 Ajustes recientes del sistema

```
GET /manual_adjustment/price/recent?days=7&limit=10
```

---

## Resumen: Dónde se acepta `unit` y dónde no

| Endpoint | Acepta `unit` | Conversión automática | Soporta decimales | Nota |
|----------|---------------|----------------------|-------------------|------|
| `POST /products` | `base_unit` (obligatorio) | N/A | N/A | Define la unidad canónica |
| `POST /purchase/complete` | SÍ | SÍ | SÍ (`DECIMAL(15,4)`) | Compra en cualquier unidad |
| `POST /sale/` | SÍ | SÍ | SÍ (`NUMERIC(10,2)`) | Venta en cualquier unidad |
| `POST /pricing/unit-prices` | SÍ | N/A | SÍ | Precio por unidad |
| `POST /manual_adjustment/price` | SÍ (default: `base_unit`) | N/A | SÍ | Ajuste de precio |
| `POST /manual_adjustment/` | **NO** | **NO** | **NO** (`int`) | Solo para unidades enteras |
| `POST /stock-transactions/` | **NO** | **NO** | **SÍ** (`NUMERIC`) | Alternativa decimal a manual_adjustment |
| `POST /inventory/` | **NO** | **NO** | SÍ (`float64`) | Siempre en `base_unit` |
| `GET /unit-conversions` | N/A | N/A | N/A | Solo lectura de factores |

---

## Reglas de Coherencia (a enforcear en UI)

El backend **no valida** estas reglas a nivel de servicio; el frontend debe garantizarlas:

1. Si `is_variable_measure=true` → `base_unit` debe estar en `{kg, g, lb, oz, l, ml, gal, meter, cm, sqm, sqft}` (unidades medibles)
2. Si `scale_code` está informado → `is_variable_measure` debe ser `true`
3. `scale_code` debe tener entre 1 y 5 dígitos numéricos
4. `scale_code` debe ser único entre productos activos con `is_variable_measure=true`
5. Cada producto debe tener al menos un `unit_prices` para su `base_unit` antes de poder ser vendido
6. Antes de comprar/vender en unidad de empaque (box, bag, case), verificar que la conversión existe (`GET /unit-conversions`)
7. Para productos con `base_unit` decimal (kg, l, m²), usar inputs con `step="0.01"` en ventas/compras
8. Para productos con `base_unit` entero (unit, box, pair), usar inputs con `step="1"` y validar enteros
9. En ajustes manuales de stock, usar `POST /manual_adjustment/` para productos con unidades enteras, y `POST /stock-transactions/` para productos con unidades decimales (kg, l, m²)
10. En inventario físico, el `quantity_checked` acepta decimales — siempre enviar en `base_unit`

---

*Última actualización: 2026-06-09*
