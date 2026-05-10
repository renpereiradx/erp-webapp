# Guía de API de Ventas para Frontend

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
| quantity | float | Sí | Cantidad (> 0) |
| unit | string | No | Unidad de medida (`kg`, `l`, `unit`, etc.) |
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
| product_name | string | Nombre del producto |
| product_type | string | `PHYSICAL` o `SERVICE` |
| quantity | float | Cantidad |
| unit | string | Unidad de medida |
| base_price | float | Precio base sin descuento |
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
| unit | string | No | Unidad de medida |

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

---

*Última actualización: 2026-05-08 — Post-bugfix multi-branch: branch_id en todas las responses, validación de branch ownership en cancelación, discount_amount y product_type en todos los detalles.*
