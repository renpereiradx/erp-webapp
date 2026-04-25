# Guía de API de Presupuestos para Frontend

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

### POST /budgets

**Descripción:** Crea un nuevo presupuesto/cotización.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |
| Content-Type  | Sí          | `application/json`          |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción                                       |
| --------- | ---- | --------- | ------------------------------------------------- |
| branch_id | int  | No        | ID de sucursal explícita. Prioridad sobre header. |

#### Request Body

| Campo             | Tipo     | Requerido | Descripción                                                  |
| ----------------- | -------- | --------- | ------------------------------------------------------------ |
| client_id         | string   | Sí        | ID del cliente (Party ID)                                    |
| branch_id         | int      | No        | ID de sucursal. Si se omite, usa el branch context resuelto. |
| valid_until       | datetime | No        | Fecha de vencimiento del presupuesto                         |
| budget_details    | array    | Sí        | Mínimo 1 item. Ver detalle abajo.                            |
| payment_method_id | int      | No        | ID del método de pago                                        |
| currency_id       | int      | No        | ID de la moneda                                              |
| notes             | string   | No        | Notas adicionales                                            |

**Budget Detail Item:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto |
| quantity | float | Sí | Cantidad (> 0) |
| unit | string | No | Unidad de medida: `kg`, `l`, `meter`, `unit`, etc. |
| unit_price | float | Sí | Precio unitario (>= 0) |
| discount_amount | float | No | Monto de descuento |
| discount_percent | float | No | Porcentaje de descuento |
| tax_rate_id | int | No | ID de tasa de impuesto |
| notes | string | No | Notas del item |

#### Response 201

| Campo        | Tipo   | Descripción                  |
| ------------ | ------ | ---------------------------- |
| success      | bool   | `true`                       |
| budget_id    | string | ID generado del presupuesto  |
| total_amount | float  | Monto total calculado        |
| items_count  | int    | Cantidad de líneas           |
| message      | string | Mensaje de éxito             |
| created_at   | string | Fecha de creación (ISO 8601) |

#### Errores

| Código | Condición                                                                        |
| ------ | -------------------------------------------------------------------------------- |
| 400    | Body inválido, `client_id` vacío, `budget_details` vacío, o `branch_id` inválido |
| 401    | Token ausente o inválido                                                         |
| 403    | `branch_id` explícito fuera de `allowed_branches`                                |
| 404    | Cliente o producto no encontrado                                                 |
| 409    | -                                                                                |
| 500    | Error interno del servidor                                                       |

#### Notas

- El `branch_id` en el body tiene prioridad sobre el branch context resuelto del request.

---

### GET /budgets

**Descripción:** Lista presupuestos con filtros y paginación.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro       | Tipo     | Requerido | Descripción                                                                                 |
| --------------- | -------- | --------- | ------------------------------------------------------------------------------------------- |
| branch_id       | int      | No        | ID de sucursal explícita                                                                    |
| client_id       | string   | No        | Filtrar por cliente                                                                         |
| status          | string   | No        | Filtrar por estado (`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `CONVERTED`, `CANCELLED`) |
| start_date      | datetime | No        | Fecha inicio                                                                                |
| end_date        | datetime | No        | Fecha fin                                                                                   |
| page            | int      | No        | Número de página (default: 1)                                                               |
| page_size       | int      | No        | Elementos por página (default: 10)                                                          |
| include_expired | bool     | No        | Incluir presupuestos expirados                                                              |

#### Response 200

| Campo      | Tipo   | Descripción                                                                     |
| ---------- | ------ | ------------------------------------------------------------------------------- |
| data       | array  | Lista de `BudgetSummary`                                                        |
| pagination | object | `page`, `page_size`, `total_records`, `total_pages`, `has_next`, `has_previous` |

**BudgetSummary:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | ID del presupuesto |
| client_id | string | ID del cliente |
| client_name | string | Nombre del cliente |
| budget_date | string | Fecha de creación |
| valid_until | string | Fecha de vencimiento |
| total_amount | float | Monto total |
| status | string | Estado actual |
| items_count | int | Cantidad de items |
| is_expired | bool | Si está expirado |
| days_until_expiry | int | Días restantes hasta vencimiento |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 500    | Error interno                           |

---

### GET /budgets/{id}

**Descripción:** Obtiene un presupuesto completo con sus detalles.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción              |
| --------- | ---- | --------- | ------------------------ |
| branch_id | int  | No        | ID de sucursal explícita |

#### Response 200

| Campo   | Tipo   | Descripción              |
| ------- | ------ | ------------------------ |
| success | bool   | `true`                   |
| data    | object | `BudgetOrderWithDetails` |
| error   | string | Solo en caso de error    |

**BudgetOrderWithDetails.budget (BudgetOrderRiched):**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | ID del presupuesto |
| client_id | string | ID del cliente |
| client_name | string | Nombre del cliente |
| budget_date | string | Fecha de creación |
| valid_until | string | Fecha de vencimiento |
| total_amount | float | Monto total |
| status | string | Estado actual |
| user_id | string | ID del usuario creador |
| user_name | string | Nombre del usuario creador |
| payment_method_id | int | ID método de pago |
| payment_method | string | Nombre del método de pago |
| currency_id | int | ID de moneda |
| currency | string | Nombre de la moneda |
| notes | string | Notas |
| converted_to_sale_id | string | ID de venta si fue convertido |
| converted_at | string | Fecha de conversión |
| created_at | string | Fecha de creación |
| updated_at | string | Fecha de última modificación |
| is_expired | bool | Si está expirado |
| days_until_expiry | int | Días hasta vencimiento |
| metadata | object | Metadatos adicionales |

**BudgetOrderWithDetails.details (array de BudgetOrderDetailRiched):**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del detalle |
| budget_order_id | string | ID del presupuesto padre |
| product_id | string | ID del producto |
| product_name | string | Nombre del producto |
| quantity | float | Cantidad |
| unit | string | Unidad de medida |
| unit_price | float | Precio unitario |
| discount_amount | float | Monto de descuento |
| discount_percent | float | Porcentaje de descuento |
| subtotal | float | Subtotal (cantidad × precio - descuento) |
| tax_rate_id | int | ID de tasa de impuesto |
| tax_rate | float | Porcentaje de impuesto |
| tax_amount | float | Monto del impuesto |
| total_with_tax | float | Subtotal + impuesto |
| notes | string | Notas del item |
| has_discount | bool | Si tiene descuento aplicado |

#### Errores

| Código | Condición                                |
| ------ | ---------------------------------------- |
| 400    | `budget_id` vacío o `branch_id` inválido |
| 401    | Token ausente o inválido                 |
| 403    | `branch_id` fuera de `allowed_branches`  |
| 404    | Presupuesto no encontrado                |
| 500    | Error interno                            |

---

### GET /budgets/client/{client_id}

**Descripción:** Lista presupuestos de un cliente específico.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro       | Tipo | Requerido | Descripción              |
| --------------- | ---- | --------- | ------------------------ |
| branch_id       | int  | No        | ID de sucursal explícita |
| include_expired | bool | No        | Incluir expirados        |

#### Response 200

| Campo | Tipo  | Descripción              |
| ----- | ----- | ------------------------ |
| data  | array | Lista de `BudgetSummary` |

#### Errores

| Código | Condición                                |
| ------ | ---------------------------------------- |
| 400    | `client_id` vacío o `branch_id` inválido |
| 401    | Token ausente o inválido                 |
| 403    | `branch_id` fuera de `allowed_branches`  |
| 500    | Error interno                            |

---

### GET /budgets/status/{status}

**Descripción:** Lista presupuestos filtrados por estado.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción              |
| --------- | ---- | --------- | ------------------------ |
| branch_id | int  | No        | ID de sucursal explícita |

#### Path Parameters

| Parámetro | Tipo   | Requerido | Descripción                                                                    |
| --------- | ------ | --------- | ------------------------------------------------------------------------------ |
| status    | string | Sí        | Estado: `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `CONVERTED`, `CANCELLED` |

#### Response 200

| Campo | Tipo  | Descripción              |
| ----- | ----- | ------------------------ |
| data  | array | Lista de `BudgetSummary` |

#### Errores

| Código | Condición                                               |
| ------ | ------------------------------------------------------- |
| 400    | `status` vacío, estado inválido, o `branch_id` inválido |
| 401    | Token ausente o inválido                                |
| 403    | `branch_id` fuera de `allowed_branches`                 |
| 500    | Error interno                                           |

---

### PUT /budgets/{id}/status

**Descripción:** Actualiza el estado de un presupuesto.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |
| Content-Type  | Sí          | `application/json`          |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción              |
| --------- | ---- | --------- | ------------------------ |
| branch_id | int  | No        | ID de sucursal explícita |

#### Request Body

| Campo      | Tipo   | Requerido | Descripción       |
| ---------- | ------ | --------- | ----------------- |
| new_status | string | Sí        | Nuevo estado      |
| notes      | string | No        | Notas adicionales |

#### Response 200

| Campo           | Tipo   | Descripción            |
| --------------- | ------ | ---------------------- |
| success         | bool   | `true`                 |
| budget_id       | string | ID del presupuesto     |
| previous_status | string | Estado anterior        |
| new_status      | string | Estado nuevo           |
| message         | string | Descripción del cambio |
| updated_at      | string | Fecha de actualización |

#### Errores

| Código | Condición                                                                             |
| ------ | ------------------------------------------------------------------------------------- |
| 400    | `budget_id` vacío, `new_status` inválido, transición inválida, o `branch_id` inválido |
| 401    | Token ausente o inválido                                                              |
| 403    | `branch_id` fuera de `allowed_branches`                                               |
| 404    | Presupuesto no encontrado                                                             |
| 500    | Error interno                                                                         |

#### Notas

**Transiciones válidas:**

- `PENDING` → `APPROVED`, `REJECTED`, `EXPIRED`, `CANCELLED`
- `APPROVED` → `CONVERTED`, `REJECTED`, `EXPIRED`, `CANCELLED`
- `REJECTED` → `PENDING`
- `EXPIRED` → `PENDING`
- `CANCELLED` → `PENDING`
- `CONVERTED` → (ninguna)

---

### POST /budgets/{id}/convert

**Descripción:** Convierte un presupuesto aprobado en una venta.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |
| Content-Type  | Sí          | `application/json`          |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción              |
| --------- | ---- | --------- | ------------------------ |
| branch_id | int  | No        | ID de sucursal explícita |

#### Request Body

| Campo                     | Tipo | Requerido | Descripción                                                                           |
| ------------------------- | ---- | --------- | ------------------------------------------------------------------------------------- |
| branch_id                 | int  | No        | ID de sucursal para la venta resultante. Si se omite, usa el branch context resuelto. |
| allow_price_modifications | bool | No        | Permitir cambios de precio en la venta. Default: `false`                              |

#### Response 200

| Campo        | Tipo   | Descripción             |
| ------------ | ------ | ----------------------- |
| success      | bool   | `true`                  |
| budget_id    | string | ID del presupuesto      |
| sale_id      | string | ID de la venta generada |
| message      | string | Mensaje de éxito        |
| converted_at | string | Fecha de conversión     |

#### Errores

| Código | Condición                                                          |
| ------ | ------------------------------------------------------------------ |
| 400    | Presupuesto expirado, cancelado, rechazado, o `branch_id` inválido |
| 401    | Token ausente o inválido                                           |
| 403    | `branch_id` fuera de `allowed_branches`                            |
| 404    | Presupuesto no encontrado                                          |
| 409    | Presupuesto ya convertido                                          |
| 500    | Error interno                                                      |

#### Notas

- Validaciones previas: el presupuesto debe estar en estado `PENDING` o `APPROVED`, y no debe estar expirado.
- La venta hereda: `client_id`, `payment_method_id`, `currency_id`, y todos los items del presupuesto.

---

### POST /budgets/mark-expired

**Descripción:** Marca automáticamente los presupuestos cuya fecha de validez ha pasado.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 200

| Campo           | Tipo   | Descripción                            |
| --------------- | ------ | -------------------------------------- |
| success         | bool   | `true`                                 |
| expired_count   | int    | Cantidad de presupuestos marcados      |
| expired_budgets | array  | Lista de IDs de presupuestos expirados |
| message         | string | Mensaje de éxito                       |
| executed_at     | string | Fecha de ejecución                     |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token ausente o inválido |
| 500    | Error interno            |

---

## Estados del Presupuesto

| Estado      | Descripción        | Transiciones Válidas                            |
| ----------- | ------------------ | ----------------------------------------------- |
| `PENDING`   | En espera          | `APPROVED`, `REJECTED`, `EXPIRED`, `CANCELLED`  |
| `APPROVED`  | Aprobado           | `CONVERTED`, `REJECTED`, `EXPIRED`, `CANCELLED` |
| `REJECTED`  | Rechazado          | `PENDING`                                       |
| `EXPIRED`   | Expirado           | `PENDING`                                       |
| `CONVERTED` | Convertido a venta | Ninguna                                         |
| `CANCELLED` | Cancelado          | `PENDING`                                       |

---

## Modelo de Datos

### BudgetOrder

| Campo                | Tipo     | Descripción                              |
| -------------------- | -------- | ---------------------------------------- |
| id                   | string   | ID único del presupuesto                 |
| client_id            | string   | ID del cliente (Party ID)                |
| budget_date          | datetime | Fecha de creación                        |
| valid_until          | datetime | Fecha de vencimiento (nullable)          |
| total_amount         | float    | Monto total                              |
| status               | string   | Estado actual                            |
| user_id              | string   | ID del usuario creador                   |
| payment_method_id    | int      | ID método de pago (nullable)             |
| currency_id          | int      | ID de moneda (nullable)                  |
| notes                | string   | Notas (nullable)                         |
| metadata             | jsonb    | Metadatos adicionales                    |
| converted_to_sale_id | string   | ID de venta si fue convertido (nullable) |
| converted_at         | datetime | Fecha de conversión (nullable)           |
| created_at           | datetime | Fecha de creación                        |
| updated_at           | datetime | Fecha de última modificación             |

### BudgetOrderDetail

| Campo            | Tipo   | Descripción                       |
| ---------------- | ------ | --------------------------------- |
| id               | int    | ID único del detalle              |
| budget_order_id  | string | ID del presupuesto padre          |
| product_id       | string | ID del producto                   |
| quantity         | float  | Cantidad                          |
| unit             | string | Unidad de medida (nullable)       |
| unit_price       | float  | Precio unitario                   |
| discount_amount  | float  | Monto de descuento                |
| discount_percent | float  | Porcentaje de descuento           |
| tax_rate_id      | int    | ID de tasa de impuesto (nullable) |
| notes            | string | Notas (nullable)                  |

---

## Resumen de Endpoints

| Método | Endpoint                      | Descripción                     |
| ------ | ----------------------------- | ------------------------------- |
| POST   | `/budgets`                    | Crear presupuesto               |
| GET    | `/budgets`                    | Listar presupuestos con filtros |
| GET    | `/budgets/{id}`               | Obtener presupuesto por ID      |
| GET    | `/budgets/client/{client_id}` | Listar por cliente              |
| GET    | `/budgets/status/{status}`    | Listar por estado               |
| PUT    | `/budgets/{id}/status`        | Actualizar estado               |
| POST   | `/budgets/{id}/convert`       | Convertir a venta               |
| POST   | `/budgets/mark-expired`       | Marcar expirados                |

---

_Última actualización: 2026-04-22 — Reescrita post-Party Model + Multi-Branch._
