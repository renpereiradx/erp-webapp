# Guía de API de Ventas para Frontend

**Versión:** 1.5  
**Fecha:** 5 de Junio de 2026

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `sales:read` |
| POST / PUT / DELETE / PATCH | `sales:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

> **Ver guía end-to-end:** [WEIGHABLE_PRODUCTS_GUIDE.md](./WEIGHABLE_PRODUCTS_GUIDE.md) para el flujo completo de productos pesables (registro con `scale_code` → precio por unidad → pesaje en balanza → escaneo en POS con `/sales/scan`).

## Unidades Permitidas

El campo `unit` en `product_details` se valida contra la siguiente lista de unidades permitidas:

| Categoría | Unidades |
|-----------|----------|
| **Discretas** | `unit`, `pair`, `set`, `dozen`, `box`, `pack`, `bag`, `case`, `bundle`, `tray`, `bottle`, `can`, `jar`, `carton`, `stick`, `slice`, `portion` |
| **Peso** | `kg`, `g`, `lb`, `oz`, `ton` |
| **Volumen** | `l`, `ml`, `gal` |
| **Longitud** | `meter`, `cm` |
| **Área** | `sqm`, `sqft` |
| **Tiempo** | `hour`, `day`, `month`, `roll` |

> **Nota:** Si el campo `unit` está vacío o no se envía, el sistema busca el precio usando el `base_unit` del producto. Si el producto tampoco tiene `base_unit`, usa `"unit"` como fallback.

## Conversión de Unidad en Ventas

Cuando el `unit` del detalle de venta es diferente al `base_unit` del producto, el sistema **convierte automáticamente** la cantidad a `base_unit` para validar y descontar stock.

### Comportamiento

| Escenario | Ejemplo | Resultado en stock |
|-----------|---------|-------------------|
| `unit` = `base_unit` | Venta 5 kg de Papa (`base_unit=kg`) | stock -= 5 kg |
| `unit` ≠ `base_unit` (conversión existe) | Venta 0.5 box de Papa (`base_unit=kg`, conversión box→kg=20) | stock -= 10 kg |
| `unit` ≠ `base_unit` (sin conversión) | Venta 1 box de Papa sin conversión registrada | **Error: transacción rechazada** |

### Importante

- El **detalle de venta** (`sales_order_details`) guarda la cantidad y unidad **original** (lo que el cliente pidió): `quantity=0.5`, `unit='box'`
- El **stock** se descuenta en `base_unit`: `-10 kg`
- El trigger `trg_auto_reduce_stock_on_sale` se encarga de la conversión automáticamente

### Error cuando falta conversión

```json
{
  "success": false,
  "error": "NO_CONVERSION: No existe conversion de box a kg para producto PAPA (Papa). Registre en POST /unit-conversions"
}
```

**Solución:** Registrar la conversión vía `POST /unit-conversions`. Ver [UNIT_CONVERSIONS_API_GUIDE.md](./UNIT_CONVERSIONS_API_GUIDE.md).

### Trazabilidad de Unidad en Stock

El sistema registra la unidad original en el metadata de `stock_transactions`:

```json
{
  "source": "trg_auto_reduce_stock_on_sale",
  "original_unit": "box",
  "original_quantity": 0.5,
  "converted_quantity": 10,
  "base_unit": "kg"
}
```

## Base URL
`http://localhost:5050`

## Autenticación
- Header: `Authorization: Bearer <jwt_token>`

## Contexto de Sucursal
- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restricción: sucursal debe estar en `allowed_branches`

---

## Endpoints

### POST /sale/
**Descripción:** Crea una venta simple.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |
| Content-Type | Sí | `application/json` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| sale_id | string | No | ID opcional. Se genera automáticamente si no se envía. |
| client_id | string | Sí | ID del cliente (Party ID) |
| branch_id | int | No | ID de sucursal. Si se omite, usa branch context resuelto. |
| reserve_id | int | No | ID de reserva asociada |
| product_details | array | Sí | Lista de productos. Ver detalle abajo. |
| payment_method_id | int | No | ID del método de pago |
| currency_id | int | No | ID de la moneda |
| allow_price_modifications | bool | No | Permitir cambios de precio. Default: `false` |

**Product Detail:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto |
| variant_id | string | No | ID de la variante (requerido si el producto tiene variantes activas) |
| quantity | float | Sí | Cantidad (> 0) |
| unit | string | No | Unidad de medida (`kg`, `l`, `unit`, etc.). Default: `base_unit` del producto |
| reserve_id | int | No | ID de reserva para este item |
| tax_rate_id | int | No | Tasa de impuesto explícita |
| sale_price | float | No | Precio modificado (requiere `allow_price_modifications`) |
| price_change_reason | string | No | Razón del cambio de precio |
| discount_amount | float | No | Descuento en valor absoluto |
| discount_percent | float | No | Descuento en porcentaje |
| discount_reason | string | No | Razón del descuento |

#### Response 201
| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `true` |
| sale_id | string | ID de la venta generada |
| total_amount | float | Monto total |
| items_processed | int | Cantidad de items procesados |
| price_modifications_enabled | bool | Si se permitieron cambios de precio |
| has_price_changes | bool | Si hubo cambios de precio |
| has_discounts | bool | Si se aplicaron descuentos |
| reserve_processed | bool | Si se procesó una reserva |
| reserve_id | int | ID de la reserva procesada |
| message | string | Mensaje de éxito |
| validation_summary | object | Resumen de validaciones aplicadas |
| timestamp | string | Fecha de procesamiento |

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | Body inválido, `client_id` vacío, `product_details` vacío, o `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Cliente o producto no encontrado |
| 500 | Error interno |

---

### POST /sale/with-units
**Descripción:** Crea una venta con soporte completo de unidades de medida.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |
| Content-Type | Sí | `application/json` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |

#### Request Body
Igual que `POST /sale/`, con énfasis en el campo `unit` en cada producto.

#### Response 201
Igual estructura que `POST /sale/`.

---

### GET /sale/{id}
**Descripción:** Obtiene una venta por ID con sus detalles enriquecidos.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |

#### Response 200
| Campo | Tipo | Descripción |
|-------|------|-------------|
| sale_id | string | ID de la venta |
| client_id | string | ID del cliente |
| client_name | string | Nombre del cliente |
| sale_date | string | Fecha de venta |
| total_amount | float | Monto total |
| status | string | Estado de la venta |
| branch_id | int | ID de sucursal |
| user_id | string | ID del vendedor |
| user_name | string | Nombre del vendedor |
| payment_method_id | int | ID del método de pago |
| payment_method | string | Nombre del método de pago |
| currency_id | int | ID de la moneda |
| currency | string | Nombre de la moneda |
| metadata | object | Metadatos adicionales |
| details | array | Lista de `SaleDetailRiched` |

**SaleDetailRiched:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del detalle |
| order_id | string | ID de la venta |
| product_id | string | ID del producto |
| variant_id | string \| null | ID de la variante (si aplica) |
| product_name | string | Nombre del producto |
| product_type | string | `PHYSICAL` o `SERVICE` |
| quantity | float | Cantidad |
| unit | string | Unidad de medida |
| base_price | float | Precio base sin descuento (calculado respetando la unidad del producto) |
| unit_price | float | Precio unitario final |
| unit_price_with_tax | float | Precio con IVA |
| unit_price_without_tax | float | Precio sin IVA |
| discount_amount | float | Monto de descuento calculado (`base_price * qty - unit_price * qty`) |
| subtotal | float | Subtotal sin IVA |
| tax_amount | float | Monto del impuesto |
| total_with_tax | float | Total de la línea |
| applied_tax_rate | float | Tasa de impuesto aplicada (%) |
| price_modified | bool | Si el precio fue modificado |
| reserve_id | int | ID de reserva |
| tax_rate_id | int | ID de la tasa de impuesto |
| tax_rate | float | Alias de `applied_tax_rate` |

> **Nota técnica (v1.3):** El cálculo del `base_price` y totales de la venta ahora respeta el campo `unit` de cada detalle. Esto significa que para productos de medida variable (ej: `unit: "kg"`), el sistema busca el precio correspondiente a esa unidad específica en lugar de usar siempre la unidad por defecto.

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `id` vacío o `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Venta no encontrada |
| 500 | Error interno |

---

### GET /sale/{id}/with-metadata
**Descripción:** Obtiene una venta con metadata extendida.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |

#### Response 200
Estructura similar a `GET /sale/{id}` con campo `metadata` expandido.

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `id` vacío o `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Venta no encontrada |
| 500 | Error interno |

---

### GET /sale/date_range
**Descripción:** Lista ventas en un rango de fechas.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |
| start_date | string | Sí | Fecha inicio (YYYY-MM-DD) |
| end_date | string | Sí | Fecha fin (YYYY-MM-DD) |
| page | int | No | Número de página (default: 1) |
| page_size | int | No | Elementos por página (default: 10) |

#### Response 200
| Campo | Tipo | Descripción |
|-------|------|-------------|
| data | array | Lista de `SaleWithDetails` con `branch_id` incluido en cada item |
| pagination | object | `page`, `page_size`, `total_records`, `total_pages`, `has_next`, `has_previous` |

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `branch_id` inválido o fechas inválidas |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 500 | Error interno |

---

### GET /sale/date_range/payment-status
**Descripción:** Lista ventas en rango de fechas con estado de pago.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |
| start_date | string | Sí | Fecha inicio |
| end_date | string | Sí | Fecha fin |
| page | int | No | Número de página |
| page_size | int | No | Elementos por página |

#### Response 200
Estructura paginada con datos de estado de pago incluidos.

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `branch_id` inválido o fechas inválidas |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 500 | Error interno |

---

### GET /sale/client_id/{client_id}
**Descripción:** Lista ventas de un cliente por ID.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |

#### Response 200
| Campo | Tipo | Descripción |
|-------|------|-------------|
| data | array | Lista de `SaleRiched` con `branch_id` incluido |

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `client_id` vacío o `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 500 | Error interno |

---

### GET /sale/client_id/{client_id}/pending
**Descripción:** Lista ventas pendientes de pago de un cliente.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |

#### Response 200
| Campo | Tipo | Descripción |
|-------|------|-------------|
| data | array | Lista de ventas pendientes con `branch_id`, `product_type` y `discount_amount` en detalles |

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `client_id` vacío o `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 500 | Error interno |

---

### GET /sale/client_name/{name}
**Descripción:** Lista ventas de un cliente por nombre.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |

#### Response 200
| Campo | Tipo | Descripción |
|-------|------|-------------|
| data | array | Lista de `SaleRiched` con `branch_id` incluido |

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `name` vacío o `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 500 | Error interno |

---

### GET /sale/client_name/{name}/payment-status
**Descripción:** Lista ventas de un cliente por nombre con estado de pago.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |

#### Response 200
Estructura paginada con estado de pago.

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `name` vacío o `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 500 | Error interno |

---

### PUT /sale/{id}
**Descripción:** Cancela una venta. Valida que la venta pertenezca a la sucursal del usuario autenticado.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |
| reason | string | No | Razón de cancelación |

#### Response 200
| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `true` |
| sale_id | string | ID de la venta cancelada |
| message | string | Mensaje de confirmación |

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `id` vacío o `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Venta no encontrada o no pertenece a la sucursal del usuario |
| 500 | Error interno |

---

### GET /sale/{id}/preview-cancellation
**Descripción:** Obtiene una vista previa de los efectos de cancelar una venta, filtrada por sucursal.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita. Filtra los resultados a esta sucursal. |

#### Response 200
| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `true` |
| sale_id | string | ID de la venta |
| can_cancel | bool | Si es posible cancelar |
| affected_items | array | Items que se verían afectados |
| warnings | array | Advertencias |

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `id` vacío o `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Venta no encontrada |
| 500 | Error interno |

---

### GET /sale/{id}/payment-status
**Descripción:** Obtiene el estado de pago de una venta.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |

#### Response 200
| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `true` |
| sale_id | string | ID de la venta |
| total_amount | float | Monto total |
| paid_amount | float | Monto pagado |
| remaining_amount | float | Monto pendiente |
| status | string | Estado de pago (`PAID`, `PARTIAL`, `PENDING`) |
| branch_id | int | ID de sucursal de la venta |
| payments | array | Lista de pagos realizados, filtrados por sucursal |

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `id` vacío o `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Venta no encontrada |
| 500 | Error interno |

---

### PUT /sale/{id}/confirm-payment
**Descripción:** Confirma el pago de una venta.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |

#### Response 200
| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `true` |
| sale_id | string | ID de la venta |
| status | string | Estado actualizado |
| message | string | Mensaje de confirmación |

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `id` vacío o `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Venta no encontrada |
| 500 | Error interno |

---

### POST /sale/{id}/products
**Descripción:** Agrega productos a una venta existente.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |
| Content-Type | Sí | `application/json` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| products | array | Sí | Lista de productos a agregar |

**Producto a agregar:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto |
| quantity | float | Sí | Cantidad (> 0) |
| unit | string | No | Unidad de medida. Default: `base_unit` del producto |

#### Response 200
| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `true` |
| sale_id | string | ID de la venta |
| added_items | int | Cantidad de items agregados |
| new_total_amount | float | Nuevo monto total |
| message | string | Mensaje de éxito |

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `id` vacío, productos inválidos, o `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Venta o producto no encontrado |
| 500 | Error interno |

---

### GET /sale/price-changes/report
**Descripción:** Reporte de cambios de precio en ventas.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita |
| start_date | string | No | Fecha inicio |
| end_date | string | No | Fecha fin |

#### Response 200
| Campo | Tipo | Descripción |
|-------|------|-------------|
| data | array | Lista de cambios de precio |

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 500 | Error interno |

---

### POST /sales/scan
**Descripción:** Escanea un barcode EAN-13 (estándar o de precio/peso variable) y devuelve la información completa del producto decodificado para agregarlo a una venta. **No** agrega automáticamente el producto a la venta — el frontend decide si agregarlo.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |
| Content-Type | Sí | `application/json` |

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| barcode | string | Sí | Barcode EAN-13 de 13 dígitos |
| branch_id | int | No | ID de sucursal. Default: sucursal activa del token |

#### Response 200 — ScanResult
| Campo | Tipo | Descripción |
|-------|------|-------------|
| decoded_barcode | object | `DecodedBarcode` con tipo, product_id, scale_code, total_price, quantity, unit |
| decoded_barcode.type | string | `STANDARD`, `VARIABLE_PRICE`, o `VARIABLE_WEIGHT` |
| decoded_barcode.product_id | string | ID del producto |
| decoded_barcode.scale_code | string | Código de balanza (solo barcode variable) |
| decoded_barcode.total_price | decimal | Precio total embebido (solo barcode de precio variable) |
| decoded_barcode.weight | decimal | Peso embebido (solo barcode de peso variable) |
| decoded_barcode.quantity | decimal | Cantidad calculada (variable price: total_price / price_per_unit) |
| decoded_barcode.unit | string | Unidad de medida |
| product_name | string | Nombre del producto |
| price_per_unit | decimal | Precio por unidad |
| subtotal | decimal | Subtotal sin IVA |
| subtotal_with_tax | decimal | Subtotal con IVA |
| tax_amount | decimal | Monto del IVA |
| in_stock | bool | Si hay stock disponible |
| stock_quantity | decimal | Cantidad en stock |
| is_variable_measure | bool | Si el producto es de medida variable |

#### Ejemplo de Request
```json
{
  "barcode": "2000010246250",
  "branch_id": 1
}
```

#### Ejemplo de Response (barcode de precio variable)
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

#### Ejemplo de Response (barcode estándar)
```json
{
  "decoded_barcode": {
    "type": "STANDARD",
    "product_id": "PROD_001",
    "scale_code": "",
    "total_price": "0",
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

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `barcode` vacío, check digit inválido, o producto no encontrado |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 500 | Error interno |

---

## Modelo de Datos

### Sale
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | ID único de la venta |
| client_id | string | ID del cliente (Party ID) |
| branch_id | int | ID de sucursal (nullable) |
| sale_date | string | Fecha de venta |
| total_amount | float | Monto total |
| status | string | Estado de la venta |
| user_id | string | ID del vendedor |
| payment_method_id | int | ID del método de pago (nullable) |
| currency_id | int | ID de la moneda (nullable) |
| metadata | jsonb | Metadatos adicionales |

### SaleDetail
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del detalle |
| sales_order_id | string | ID de la venta |
| product_id | string | ID del producto |
| quantity | float | Cantidad |
| unit | string | Unidad de medida (nullable) |
| unit_price | float | Precio unitario |
| reserve_id | int | ID de reserva |
| tax_rate_id | int | ID de tasa de impuesto |

---

## Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/sale/` | Crear venta |
| POST | `/sale/with-units` | Crear venta con unidades |
| GET | `/sale/{id}` | Obtener venta por ID |
| GET | `/sale/{id}/with-metadata` | Obtener venta con metadata |
| GET | `/sale/date_range` | Listar por rango de fechas |
| GET | `/sale/date_range/payment-status` | Listar con estado de pago |
| GET | `/sale/client_id/{client_id}` | Listar por cliente (ID) |
| GET | `/sale/client_id/{client_id}/pending` | Ventas pendientes por cliente |
| GET | `/sale/client_name/{name}` | Listar por cliente (nombre) |
| GET | `/sale/client_name/{name}/payment-status` | Listar por nombre con pago |
| PUT | `/sale/{id}` | Cancelar venta |
| GET | `/sale/{id}/preview-cancellation` | Previsualizar cancelación |
| GET | `/sale/{id}/payment-status` | Estado de pago |
| PUT | `/sale/{id}/confirm-payment` | Confirmar pago |
| POST | `/sale/{id}/products` | Agregar productos a venta |
| GET | `/sale/price-changes/report` | Reporte de cambios de precio |
| POST | `/sales/scan` | Escanear barcode EAN-13 para POS |

---

*Última actualización: 2026-06-05 — Fase 5: conversión de unidad en ventas, trazabilidad de stock.*
