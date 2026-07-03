# Guia de API de Costos y Precios para Frontend

**Versión:** 1.1

## 🔧 Configuración General

### Base URL
http://localhost:5050

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

> **Nota:** `?branch_id` tiene prioridad sobre `X-Branch-ID`. Ver [MULTI_BRANCH_CONTEXT_GUIDE.md](./MULTI_BRANCH_CONTEXT_GUIDE.md).

### Formato de Respuesta Estándar
`{ success: bool, data?, message?, error?, pagination? }`

### Formato de Fechas
- Payloads: ISO 8601 (`2026-03-24T15:30:00Z`)

### Resolución de Unidad (`unit`)

> **Nota:** Cuando el campo `unit` está vacío o no se envía, el sistema resuelve la unidad en el siguiente orden:
> 1. `unit` enviado en el request (si existe)
> 2. `base_unit` del producto (configurado en el catálogo)
> 3. `"unit"` como fallback final
>
> **Recomendación frontend:** Siempre que sea posible, enviar el `base_unit` del producto como valor de `unit` para evitar ambigüedades.
- Query params: `YYYY-MM-DD`

### Paginación Estándar
`{ page, page_size, total_items, total_pages, has_next, has_prev }`

### Contexto de Sucursal (BI)

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restriccion: sucursal debe estar en `allowed_branches`

> **Nota:** Los endpoints de costos y precios usan `resolveBIContextFromAuth`. Ver [Guia de Contexto Multi-Sucursal](./MULTI_BRANCH_CONTEXT_GUIDE.md) para reglas detalladas de BI.

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

## Endpoints

### GET /products/{product_id}/pricing-info

**Descripcion:** Obtiene informacion completa de precios y costos de un producto.

#### Query Parameters

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explicita |

#### Response 200

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| product_id | string | ID del producto |
| product_name | string | Nombre del producto |
| unit | string | Unidad de medida |
| current_cost | decimal | Costo actual (ultima compra) |
| weighted_avg_cost | decimal | Costo promedio ponderado |
| selling_price | decimal | Precio de venta actual |
| margin_amount | decimal | Margen en valor absoluto |
| margin_percent | decimal | Margen en porcentaje |
| cost_source | string | Fuente del costo |
| price_source | string | Fuente del precio |

#### Errores

| Codigo | Condicion |
|--------|-----------|
| 400 | `branch_id` invalido |
| 401 | Token ausente o invalido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### GET /products/{product_id}/pricing-info/{unit}

**Descripcion:** Obtiene informacion de precios para una unidad especifica.

#### Query Parameters

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explicita |

#### Response 200

Igual estructura que `GET /products/{product_id}/pricing-info`.

---

### POST /products/{product_id}/costs

**Descripcion:** Registra un cambio de costo para un producto via `register_cost_transaction()`.
Este endpoint actualiza `unit_costs` (estado actual unico por producto+unidad) y crea auditoria en `price_transactions` con `price_type='cost_price'`.

> **Migracion 2026-05-25:** `unit_costs` ahora almacena solo el estado actual (1 fila por producto+unidad).
> Las columnas `effective_from`, `effective_to` fueron eliminadas; el historial completo de costos vive en `price_transactions`.
> Los campos `supplier_id`, `purchase_order_id`, `purchase_date`, `quantity_purchased` fueron removidos de `unit_costs`.
> Para datos de proveedor y cantidad de compra, consulte `purchase_order_details`.

#### Headers

| Header | Requerido | Descripcion |
|--------|-----------|-------------|
| Authorization | Si | Bearer token |
| X-Branch-ID | Condicional | Si no se envia `?branch_id` |
| Content-Type | Si | `application/json` |

#### Query Parameters

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explicita |

#### Request Body

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| unit | string | Si | Unidad de medida (`kg`, `caja`, `unit`, etc.). Si se omite, se usa `base_unit` del producto |
| cost_per_unit | decimal | Si | Costo por unidad (> 0) |
| source | string | No | Fuente del costo (`PURCHASE`, `MANUAL`) |
| source_id | string | No | ID de referencia (purchase_order_id, etc.) |
| effective_date | datetime | No | Fecha de la transaccion de auditoria (default: NOW()). Se guarda en `price_transactions`; `unit_costs` refleja solo el estado actual. |
| metadata | object | No | Metadatos adicionales |

#### Response 201

Registro de transaccion de costo (`PriceTransaction`):

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| transaction_id | int | ID de la transaccion en price_transactions |
| product_id | string | ID del producto |
| old_price | decimal | Costo anterior |
| new_price | decimal | Nuevo costo |
| price_change | decimal | Cambio en el costo |
| price_change_percent | decimal | Cambio porcentual |
| price_type | string | `cost_price` |
| message | string | Mensaje de confirmacion |
| metadata | object | Metadatos enriquecidos |

#### Errores

| Codigo | Condicion |
|--------|-----------|
| 400 | Body invalido, campos requeridos faltantes, o `branch_id` invalido |
| 401 | Token ausente o invalido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### GET /products/{product_id}/costs/history

**Descripcion:** Obtiene el historial de costos de un producto.

#### Query Parameters

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explicita |
| unit | string | No | Filtrar por unidad |
| months | int | No | Periodo en meses (3, 6, 12) |

#### Response 200

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| product_id | string | ID del producto |
| unit | string | Unidad de medida |
| cost_history | array | Lista de entradas de costo |
| weighted_average | decimal | Promedio ponderado del periodo |
| cost_trend | string | Tendencia: `increasing`, `decreasing`, `stable` |

**Cost History Entry:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | int | ID del costo |
| cost_per_unit | decimal | Costo por unidad |
| updated_at | datetime | Fecha de ultima actualizacion del estado actual |
| source | string | Fuente del costo (`PURCHASE`, `MANUAL`) |
| source_id | string | ID de referencia |
| created_by | string | Usuario creador |
| created_at | datetime | Fecha de creacion |
| metadata | object | Metadatos adicionales |

> **Migracion 2026-05-25:** `unit_costs` ya no almacena historial. El historial completo de costos vive en `price_transactions` (`price_type='cost_price'`).
> Las columnas `effective_from` y `effective_to` fueron eliminadas de `unit_costs`.
> Para estadisticas de cantidad y proveedor, usar `GET /products/{id}/costs/weighted-average` que consulta `purchase_order_details`.

#### Errores

| Codigo | Condicion |
|--------|-----------|
| 400 | `branch_id` invalido |
| 401 | Token ausente o invalido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### GET /products/{product_id}/costs/last

**Descripcion:** Obtiene el ultimo costo de compra de un producto.

#### Query Parameters

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explicita |

#### Response 200

Estructura `ProductCost`:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | int | ID del costo |
| product_id | string | ID del producto |
| unit | string | Unidad |
| cost_per_unit | decimal | Costo por unidad |
| updated_at | datetime | Fecha de ultima actualizacion |
| source | string | Fuente del costo (`PURCHASE`, `MANUAL`) |
| source_id | string | ID de referencia |
| created_by | string | Usuario que registro |
| created_at | datetime | Fecha de registro |
| metadata | object | Metadatos adicionales |

> **Migracion 2026-05-25:** `unit_costs` almacena solo el estado actual (1 fila por producto+unidad).
> Las columnas `effective_from` y `effective_to` fueron eliminadas; el historial completo vive en `price_transactions`.
> **Migracion 2026-05-23:** `supplier_id`, `purchase_order_id`, `purchase_date`, `quantity_purchased` fueron removidos.
> La fuente canonica para datos de proveedor y cantidades es `transactions.purchase_order_details`.

#### Errores

| Codigo | Condicion |
|--------|-----------|
| 400 | `branch_id` invalido |
| 401 | Token ausente o invalido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### GET /products/{product_id}/costs/last-record

**Descripcion:** Obtiene el ultimo registro de compra completo.

#### Query Parameters

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explicita |

#### Response 200

Registro de compra completo con detalles adicionales.

#### Errores

| Codigo | Condicion |
|--------|-----------|
| 400 | `branch_id` invalido |
| 401 | Token ausente o invalido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### GET /products/{product_id}/costs/summary

**Descripcion:** Obtiene un resumen de costos de un producto.

#### Query Parameters

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explicita |

#### Response 200

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| product_id | string | ID del producto |
| total_entries | int | Total de entradas de costo en unit_costs |
| min_cost | decimal | Costo minimo (desde unit_costs) |
| max_cost | decimal | Costo maximo (desde unit_costs) |
| weighted_avg_cost | decimal | Promedio ponderado (desde purchase_order_details) |

> **Migracion 2026-05-23:** `total_quantity` y `last_purchase_date` ya no se computan directamente desde `unit_costs`.
> Para datos de cantidad y fechas de compra, use `GET /purchase/` con filtro por producto.

#### Errores

| Codigo | Condicion |
|--------|-----------|
| 400 | `branch_id` invalido |
| 401 | Token ausente o invalido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### GET /products/{product_id}/cost-trends

**Descripcion:** Obtiene tendencias de costos de un producto.

#### Query Parameters

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explicita |
| months | int | No | Periodo en meses |

#### Response 200

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| product_id | string | ID del producto |
| product_name | string | Nombre del producto |
| trend_analysis.direction | string | `increasing`, `decreasing`, `stable` |
| trend_analysis.change_percent | decimal | Porcentaje de cambio |
| trend_analysis.volatility | string | `low`, `medium`, `high` |
| monthly_averages | array | Promedios mensuales |

**Monthly Average:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| month | string | Mes (YYYY-MM) |
| average_cost | decimal | Costo promedio |
| purchase_count | int | Cantidad de compras |
| total_quantity | decimal | Cantidad total |

#### Errores

| Codigo | Condicion |
|--------|-----------|
| 400 | `branch_id` invalido |
| 401 | Token ausente o invalido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### GET /products/{product_id}/cost-methods

**Descripcion:** Obtiene los metodos de calculo de costos disponibles.

#### Headers

| Header | Requerido | Descripcion |
|--------|-----------|-------------|
| Authorization | Si | Bearer token |

#### Response 200

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| methods | array | Lista de metodos de calculo |

**Method:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| code | string | Codigo del metodo |
| name | string | Nombre del metodo |
| description | string | Descripcion |

#### Errores

| Codigo | Condicion |
|--------|-----------|
| 401 | Token ausente o invalido |
| 500 | Error interno |

---

### GET /suppliers/{supplier_id}/cost-analysis

**Descripcion:** Analisis de costos por proveedor desde `purchase_order_details` JOIN `purchase_orders` (fuente canonica).

#### Query Parameters

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explicita |
| product_id | string | No | Filtrar por producto especifico |
| months | int | No | Periodo en meses (default: 6) |

#### Response 200

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| supplier_id | string | ID del proveedor |
| supplier_name | string | Nombre del proveedor (desde parties) |
| period_months | int | Periodo analizado |
| total_purchases | int | Total de lineas de compra |
| total_spent | decimal | Gasto total (Σ cost_per_unit × quantity) |
| total_quantity | decimal | Cantidad total comprada |
| average_cost | decimal | Costo promedio ponderado |
| min_cost | decimal | Costo unitario minimo |
| max_cost | decimal | Costo unitario maximo |
| cost_stability | decimal | Rango de variacion (max - min) |
| product_count | int | Productos distintos comprados |
| product_ids | array | IDs de productos comprados |
| recent_purchases | array | Ultimas compras (max 5) |

#### Errores

| Codigo | Condicion |
|--------|-----------|
| 400 | `supplier_id` invalido o `branch_id` invalido |
| 401 | Token ausente o invalido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 404 | Proveedor no encontrado |
| 500 | Error interno |

---

### GET /products/{product_id}/supplier-comparison

**Descripcion:** Compara proveedores para un producto agrupando por supplier_id desde `purchase_order_details` JOIN `purchase_orders`. Calcula estadisticas por proveedor y detecta el mejor (menor costo promedio).

#### Query Parameters

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| unit | string | No | Unidad de medida |
| months | int | No | Periodo en meses (default: 6) |

#### Response 200

Por proveedor (`suppliers` object, key: supplier_id):
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| supplier_id | string | ID del proveedor |
| supplier_name | string | Nombre del proveedor |
| total_quantity | decimal | Cantidad total comprada |
| total_spent | decimal | Gasto total |
| min_cost | decimal | Costo unitario minimo |
| max_cost | decimal | Costo unitario maximo |
| avg_cost | decimal | Costo promedio ponderado |
| last_purchase | datetime | Fecha de ultima compra |

Globales:
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| product_id | string | ID del producto |
| period_months | int | Periodo analizado |
| suppliers | object | Mapa por supplier_id con estadisticas |
| best_supplier | string | supplier_id con menor avg_cost |
| best_avg_cost | decimal | Costo promedio del mejor proveedor |

### GET /margin-alerts

**Descripcion:** Alertas globales de margen para todos los productos.

#### Query Parameters

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explicita |
| min_margin | decimal | No | Filtrar productos con margen menor a este valor |

#### Response 200

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| alerts | array | Lista de alertas de margen |

---

### GET /cost-trends

**Descripcion:** Tendencias globales de costos.

#### Query Parameters

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explicita |
| period | string | No | Periodo: `month`, `quarter`, `year` |

#### Response 200

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| trends | array | Lista de tendencias |

**Trend:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| period | string | Periodo |
| avg_cost_change | decimal | Cambio promedio de costo |
| products_affected | int | Productos afectados |
| top_increases | array | Mayores aumentos |
| top_decreases | array | Mayores disminuciones |

#### Errores

| Codigo | Condicion |
|--------|-----------|
| 400 | `branch_id` invalido |
| 401 | Token ausente o invalido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 500 | Error interno |

---

## Modelo de Datos

### ProductCost

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | int | ID unico |
| product_id | string | ID del producto |
| unit | string | Unidad de medida |
| cost_per_unit | decimal | Costo por unidad |
| updated_at | datetime | Fecha de ultima actualizacion del estado actual |
| source | string | Fuente (`PURCHASE`, `MANUAL`) |
| source_id | string | ID de referencia |
| created_by | string | Usuario creador |
| created_at | datetime | Fecha de creacion |
| metadata | object | Metadatos adicionales |

### PricingInfo

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| product_id | string | ID del producto |
| product_name | string | Nombre del producto |
| unit | string | Unidad |
| current_cost | decimal | Costo actual |
| weighted_avg_cost | decimal | Costo promedio ponderado |
| selling_price | decimal | Precio de venta |
| margin_amount | decimal | Margen en valor |
| margin_percent | decimal | Margen en porcentaje |
| cost_source | string | Fuente del costo |
| price_source | string | Fuente del precio |

---

## Cost Transactions API (Nuevo 2026-05-23)

Los endpoints de `cost-transactions` gestionan el registro, consulta y ajuste manual de costos con
auditoria unificada en `price_transactions` (`price_type='cost_price'`).

### POST /cost-transactions

**Descripcion:** Registra un cambio de costo via `register_cost_transaction()` (SQL function).
Actualiza `unit_costs` (estado actual unico por producto+unidad) y escribe auditoria en `price_transactions`.

#### Request Body

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| product_id | string | Si | ID del producto |
| unit | string | Si | Unidad de medida. Si se omite, se usa `base_unit` del producto |
| transaction_type | string | Si | `COST_UPDATE` \| `MANUAL_ADJUSTMENT` |
| new_cost | decimal | Si | Nuevo costo por unidad (> 0) |
| effective_date | datetime | No | Fecha de la transaccion de auditoria (default: NOW()). Se guarda en `price_transactions`; `unit_costs` refleja solo el estado actual. |
| reference_type | string | No | Tipo de referencia |
| reference_id | string | No | ID de referencia |
| reason | string | No | Motivo del cambio |
| metadata | object | No | Metadatos adicionales |

#### Response 201

`PriceTransaction` con `price_type: "cost_price"`. Ver [PriceTransactionResponse](PRICE_TRANSACTIONS_API_GUIDE.md).

---

### POST /cost-transactions/manual-adjustment

**Descripcion:** Ajuste manual de costo via `manage_cost_adjustment()` (SQL function).
Valida, audita y rota el costo activo con `source='MANUAL'`.

#### Request Body

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| product_id | string | Si | ID del producto |
| unit | string | Si | Unidad de medida. Si se omite, se usa `base_unit` del producto |
| new_cost | decimal | Si | Nuevo costo (>= 0) |
| reason | string | Si | Motivo del ajuste |
| metadata | object | No | Metadatos adicionales |

---

### GET /cost-transactions/product/{product_id}/history

**Descripcion:** Historial de transacciones de costo para un producto.

Query params: `unit`, `limit`, `offset`.

---

### GET /cost-transactions/by-date

**Descripcion:** Transacciones de costo por rango de fechas.

Query params: `start_date`, `end_date`, `limit`, `offset`.

---

### GET /cost-transactions/{id}

**Descripcion:** Obtiene una transaccion de costo por ID.

---

## Resumen de Endpoints

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/products/{id}/pricing-info` | Info completa de precios |
| GET | `/products/{id}/pricing-info/{unit}` | Info de precios por unidad |
| POST | `/products/{id}/costs` | Registrar nuevo costo |
| GET | `/products/{id}/costs/history` | Historial de costos |
| GET | `/products/{id}/costs/last` | Ultimo costo |
| GET | `/products/{id}/costs/last-record` | Ultimo registro completo |
| GET | `/products/{id}/costs/summary` | Resumen de costos |
| GET | `/products/{id}/costs/weighted-average` | Promedio ponderado (desde purchase_order_details) |
| GET | `/products/{id}/cost-trends` | Tendencias de costos |
| GET | `/products/{id}/cost-methods` | Metodos de calculo |
| GET | `/suppliers/{id}/cost-analysis` | Analisis por proveedor (desde purchase_order_details) |
| GET | `/products/{id}/supplier-comparison` | Comparacion de proveedores con mejor proveedor |
| GET | `/cost-trends` | Tendencias globales |
| POST | `/cost-transactions` | Registrar transaccion de costo |
| POST | `/cost-transactions/manual-adjustment` | Ajuste manual de costo |
| GET | `/cost-transactions/{id}` | Obtener transaccion de costo |
| GET | `/cost-transactions/product/{id}/history` | Historial de costo del producto |
| GET | `/cost-transactions/by-date` | Costos por rango de fechas |

---

_Ultima actualizacion: 2026-05-23_
