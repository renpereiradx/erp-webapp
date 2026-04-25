# Guía de API de Cajas Registradoras para Frontend

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

### POST /cash-registers/open

**Descripción:** Abre una nueva caja registradora.

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

| Campo             | Tipo   | Requerido | Descripción                                               |
| ----------------- | ------ | --------- | --------------------------------------------------------- |
| name              | string | Sí        | Nombre de la caja                                         |
| branch_id         | int    | No        | ID de sucursal. Si se omite, usa branch context resuelto. |
| initial_balance   | float  | Sí        | Balance inicial                                           |
| max_balance_limit | float  | No        | Límite máximo de balance                                  |
| location          | string | No        | Ubicación física de la caja                               |
| notes             | string | No        | Notas adicionales                                         |

#### Response 201

| Campo           | Tipo     | Descripción              |
| --------------- | -------- | ------------------------ |
| id              | int      | ID de la caja            |
| name            | string   | Nombre                   |
| status          | string   | `OPEN`                   |
| branch_id       | int      | ID de sucursal           |
| opened_by       | string   | ID del usuario que abrió |
| opened_at       | datetime | Fecha de apertura        |
| initial_balance | float    | Balance inicial          |
| current_balance | float    | Balance actual           |

#### Errores

| Código | Condición                                                                       |
| ------ | ------------------------------------------------------------------------------- |
| 400    | Body inválido, `name` vacío, `initial_balance` inválido, o `branch_id` inválido |
| 401    | Token ausente o inválido                                                        |
| 403    | `branch_id` fuera de `allowed_branches`                                         |
| 409    | Ya existe una caja activa para esta sucursal                                    |
| 500    | Error interno                                                                   |

---

### GET /cash-registers/active

**Descripción:** Obtiene la caja activa para el usuario/sucursal actual.

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

| Campo           | Tipo     | Descripción       |
| --------------- | -------- | ----------------- |
| id              | int      | ID de la caja     |
| name            | string   | Nombre            |
| status          | string   | `OPEN`            |
| branch_id       | int      | ID de sucursal    |
| opened_by       | string   | ID del usuario    |
| opened_at       | datetime | Fecha de apertura |
| initial_balance | float    | Balance inicial   |
| current_balance | float    | Balance actual    |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | No hay caja activa                      |
| 500    | Error interno                           |

---

### GET /cash-registers

**Descripción:** Lista todas las cajas registradoras.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo   | Requerido | Descripción                                       |
| --------- | ------ | --------- | ------------------------------------------------- |
| branch_id | int    | No        | ID de sucursal explícita                          |
| status    | string | No        | Filtrar por estado: `OPEN`, `CLOSED`, `SUSPENDED` |
| page      | int    | No        | Número de página                                  |
| page_size | int    | No        | Elementos por página                              |

#### Response 200

| Campo      | Tipo   | Descripción               |
| ---------- | ------ | ------------------------- |
| data       | array  | Lista de `CashRegister`   |
| pagination | object | Información de paginación |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 500    | Error interno                           |

---

### GET /cash-registers/{id}

**Descripción:** Obtiene una caja por ID.

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

| Campo             | Tipo     | Descripción                  |
| ----------------- | -------- | ---------------------------- |
| id                | int      | ID de la caja                |
| name              | string   | Nombre                       |
| status            | string   | Estado actual                |
| branch_id         | int      | ID de sucursal               |
| opened_by         | string   | Usuario que abrió            |
| opened_at         | datetime | Fecha de apertura            |
| closed_by         | string   | Usuario que cerró (nullable) |
| closed_at         | datetime | Fecha de cierre (nullable)   |
| initial_balance   | float    | Balance inicial              |
| current_balance   | float    | Balance actual               |
| final_balance     | float    | Balance final (nullable)     |
| expected_balance  | float    | Balance esperado (nullable)  |
| difference        | float    | Diferencia (nullable)        |
| max_balance_limit | float    | Límite máximo (nullable)     |
| location          | string   | Ubicación (nullable)         |
| notes             | string   | Notas                        |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `id` inválido o `branch_id` inválido    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | Caja no encontrada                      |
| 500    | Error interno                           |

---

### PUT /cash-registers/{id}/close

**Descripción:** Cierra una caja registradora.

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

| Campo         | Tipo   | Requerido | Descripción           |
| ------------- | ------ | --------- | --------------------- |
| final_balance | float  | Sí        | Balance final contado |
| notes         | string | No        | Notas de cierre       |

#### Response 200

| Campo            | Tipo     | Descripción                   |
| ---------------- | -------- | ----------------------------- |
| id               | int      | ID de la caja                 |
| status           | string   | `CLOSED`                      |
| closed_by        | string   | Usuario que cerró             |
| closed_at        | datetime | Fecha de cierre               |
| final_balance    | float    | Balance final                 |
| expected_balance | float    | Balance esperado              |
| difference       | float    | Diferencia (final - esperado) |

#### Errores

| Código | Condición                                                       |
| ------ | --------------------------------------------------------------- |
| 400    | `id` inválido, `final_balance` inválido, o `branch_id` inválido |
| 401    | Token ausente o inválido                                        |
| 403    | `branch_id` fuera de `allowed_branches`                         |
| 404    | Caja no encontrada                                              |
| 409    | La caja ya está cerrada                                         |
| 500    | Error interno                                                   |

---

### GET /cash-registers/{id}/movements

**Descripción:** Lista los movimientos de una caja.

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

| Campo | Tipo  | Descripción             |
| ----- | ----- | ----------------------- |
| data  | array | Lista de `CashMovement` |

**CashMovement:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del movimiento |
| cash_register_id | int | ID de la caja |
| branch_id | int | ID de sucursal |
| movement_type | string | `INCOME`, `EXPENSE`, `ADJUSTMENT`, `REFUND`, `OPENING`, `CLOSING`, `TRANSFER_IN`, `TRANSFER_OUT` |
| amount | float | Monto |
| concept | string | Concepto (nullable) |
| category | string | `SALE`, `PURCHASE`, `ADJUSTMENT`, `REFUND`, `OPENING`, `CLOSING`, `WITHDRAWAL`, `DEPOSIT`, `TRANSFER` |
| reference_type | string | Tipo de referencia (nullable) |
| reference_id | string | ID de referencia (nullable) |
| related_payment_id | int | ID de pago relacionado (nullable) |
| related_sale_id | string | ID de venta relacionada (nullable) |
| related_purchase_id | int | ID de compra relacionada (nullable) |
| created_by | string | Usuario que creó |
| created_at | datetime | Fecha de creación |
| voided_by | string | Usuario que anuló (nullable) |
| voided_at | datetime | Fecha de anulación (nullable) |
| void_reason | string | Razón de anulación (nullable) |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `id` inválido o `branch_id` inválido    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | Caja no encontrada                      |
| 500    | Error interno                           |

---

### GET /cash-registers/{id}/movements/filter

**Descripción:** Lista movimientos filtrados de una caja.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro     | Tipo     | Requerido | Descripción              |
| ------------- | -------- | --------- | ------------------------ |
| branch_id     | int      | No        | ID de sucursal explícita |
| movement_type | string   | No        | Filtrar por tipo         |
| category      | string   | No        | Filtrar por categoría    |
| start_date    | datetime | No        | Fecha inicio             |
| end_date      | datetime | No        | Fecha fin                |
| page          | int      | No        | Número de página         |
| page_size     | int      | No        | Elementos por página     |

#### Response 200

| Campo      | Tipo   | Descripción               |
| ---------- | ------ | ------------------------- |
| data       | array  | Lista de `CashMovement`   |
| pagination | object | Información de paginación |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `id` inválido o `branch_id` inválido    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 500    | Error interno                           |

---

### GET /cash-registers/{id}/report

**Descripción:** Genera un reporte completo de la caja.

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

| Campo            | Tipo     | Descripción                   |
| ---------------- | -------- | ----------------------------- |
| cash_register_id | int      | ID de la caja                 |
| name             | string   | Nombre                        |
| opened_by        | string   | Usuario que abrió             |
| opened_at        | datetime | Fecha de apertura             |
| closed_by        | string   | Usuario que cerró (nullable)  |
| closed_at        | datetime | Fecha de cierre (nullable)    |
| initial_balance  | float    | Balance inicial               |
| final_balance    | float    | Balance final (nullable)      |
| total_income     | float    | Total de ingresos             |
| total_expense    | float    | Total de egresos              |
| net_balance      | float    | Balance neto                  |
| movements        | array    | Lista de `CashMovementReport` |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `id` inválido o `branch_id` inválido    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | Caja no encontrada                      |
| 500    | Error interno                           |

---

### GET /cash-registers/{id}/balance-summary

**Descripción:** Obtiene un resumen del balance de la caja.

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

| Campo             | Tipo  | Descripción                        |
| ----------------- | ----- | ---------------------------------- |
| cash_register_id  | int   | ID de la caja                      |
| current_balance   | float | Balance actual                     |
| total_income      | float | Total ingresos                     |
| total_expense     | float | Total egresos                      |
| pending_movements | int   | Cantidad de movimientos pendientes |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `id` inválido o `branch_id` inválido    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | Caja no encontrada                      |
| 500    | Error interno                           |

---

### GET /cash-registers/{id}/audits

**Descripción:** Lista los arqueos de una caja.

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

| Campo | Tipo  | Descripción          |
| ----- | ----- | -------------------- |
| data  | array | Lista de `CashAudit` |

**CashAudit:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del arqueo |
| cash_register_id | int | ID de la caja |
| audited_by | string | Usuario que realizó el arqueo |
| audited_at | datetime | Fecha del arqueo |
| expected_amount | float | Monto esperado |
| counted_amount | float | Monto contado |
| difference | float | Diferencia |
| status | string | Estado del arqueo |
| notes | string | Notas |
| denominations | array | Detalle por denominación |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `id` inválido o `branch_id` inválido    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | Caja no encontrada                      |
| 500    | Error interno                           |

---

### POST /cash-registers/payments/sale

**Descripción:** Procesa un pago de venta usando la caja activa.

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

| Campo             | Tipo   | Requerido | Descripción           |
| ----------------- | ------ | --------- | --------------------- |
| sale_id           | string | Sí        | ID de la venta        |
| amount            | float  | Sí        | Monto del pago        |
| payment_method_id | int    | No        | ID del método de pago |
| notes             | string | No        | Notas                 |

#### Response 200

| Campo      | Tipo   | Descripción            |
| ---------- | ------ | ---------------------- |
| success    | bool   | `true`                 |
| payment_id | int    | ID del pago registrado |
| sale_id    | string | ID de la venta         |
| amount     | float  | Monto pagado           |
| message    | string | Mensaje de éxito       |

#### Errores

| Código | Condición                                                  |
| ------ | ---------------------------------------------------------- |
| 400    | `sale_id` vacío, `amount` inválido, o `branch_id` inválido |
| 401    | Token ausente o inválido                                   |
| 403    | `branch_id` fuera de `allowed_branches`                    |
| 404    | Venta o caja activa no encontrada                          |
| 500    | Error interno                                              |

---

### POST /cash-registers/payments/purchase

**Descripción:** Procesa un pago de compra usando la caja activa.

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

| Campo             | Tipo   | Requerido | Descripción           |
| ----------------- | ------ | --------- | --------------------- |
| purchase_id       | int    | Sí        | ID de la compra       |
| amount            | float  | Sí        | Monto del pago        |
| payment_method_id | int    | No        | ID del método de pago |
| notes             | string | No        | Notas                 |

#### Response 200

| Campo       | Tipo   | Descripción            |
| ----------- | ------ | ---------------------- |
| success     | bool   | `true`                 |
| payment_id  | int    | ID del pago registrado |
| purchase_id | int    | ID de la compra        |
| amount      | float  | Monto pagado           |
| message     | string | Mensaje de éxito       |

#### Errores

| Código | Condición                                                         |
| ------ | ----------------------------------------------------------------- |
| 400    | `purchase_id` inválido, `amount` inválido, o `branch_id` inválido |
| 401    | Token ausente o inválido                                          |
| 403    | `branch_id` fuera de `allowed_branches`                           |
| 404    | Compra o caja activa no encontrada                                |
| 500    | Error interno                                                     |

---

### POST /cash-movements/

**Descripción:** Registra un movimiento de efectivo manual.

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

| Campo            | Tipo   | Requerido | Descripción                                                                     |
| ---------------- | ------ | --------- | ------------------------------------------------------------------------------- |
| cash_register_id | int    | Sí        | ID de la caja                                                                   |
| movement_type    | string | Sí        | `INCOME`, `EXPENSE`, `ADJUSTMENT`, `REFUND`, `TRANSFER_IN`, `TRANSFER_OUT`      |
| amount           | float  | Sí        | Monto (> 0)                                                                     |
| concept          | string | No        | Concepto del movimiento                                                         |
| category         | string | No        | `SALE`, `PURCHASE`, `ADJUSTMENT`, `REFUND`, `WITHDRAWAL`, `DEPOSIT`, `TRANSFER` |
| reference_type   | string | No        | Tipo de documento de referencia                                                 |
| reference_id     | string | No        | ID de referencia                                                                |

#### Response 201

| Campo            | Tipo     | Descripción        |
| ---------------- | -------- | ------------------ |
| id               | int      | ID del movimiento  |
| cash_register_id | int      | ID de la caja      |
| movement_type    | string   | Tipo de movimiento |
| amount           | float    | Monto              |
| concept          | string   | Concepto           |
| created_by       | string   | Usuario creador    |
| created_at       | datetime | Fecha de creación  |

#### Errores

| Código | Condición                                                                         |
| ------ | --------------------------------------------------------------------------------- |
| 400    | Body inválido, `cash_register_id` inválido, `amount` <= 0, o `branch_id` inválido |
| 401    | Token ausente o inválido                                                          |
| 403    | `branch_id` fuera de `allowed_branches`                                           |
| 404    | Caja no encontrada                                                                |
| 500    | Error interno                                                                     |

---

### POST /cash-movements/{id}/void

**Descripción:** Anula un movimiento de efectivo.

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

| Campo  | Tipo   | Requerido | Descripción           |
| ------ | ------ | --------- | --------------------- |
| reason | string | Sí        | Razón de la anulación |

#### Response 200

| Campo       | Tipo     | Descripción               |
| ----------- | -------- | ------------------------- |
| success     | bool     | `true`                    |
| movement_id | int      | ID del movimiento anulado |
| voided_by   | string   | Usuario que anuló         |
| voided_at   | datetime | Fecha de anulación        |
| reason      | string   | Razón                     |

#### Errores

| Código | Condición                                             |
| ------ | ----------------------------------------------------- |
| 400    | `id` inválido, `reason` vacío, o `branch_id` inválido |
| 401    | Token ausente o inválido                              |
| 403    | `branch_id` fuera de `allowed_branches`               |
| 404    | Movimiento no encontrado                              |
| 409    | El movimiento ya fue anulado                          |
| 500    | Error interno                                         |

---

## Estados de Caja

| Estado      | Descripción                   |
| ----------- | ----------------------------- |
| `OPEN`      | Caja abierta y operativa      |
| `CLOSED`    | Caja cerrada                  |
| `SUSPENDED` | Caja suspendida temporalmente |

---

## Tipos de Movimiento

| Tipo           | Descripción            |
| -------------- | ---------------------- |
| `INCOME`       | Ingreso de efectivo    |
| `EXPENSE`      | Egreso de efectivo     |
| `ADJUSTMENT`   | Ajuste de balance      |
| `REFUND`       | Reembolso              |
| `OPENING`      | Apertura de caja       |
| `CLOSING`      | Cierre de caja         |
| `TRANSFER_IN`  | Transferencia entrante |
| `TRANSFER_OUT` | Transferencia saliente |

---

## Resumen de Endpoints

| Método | Endpoint                                | Descripción           |
| ------ | --------------------------------------- | --------------------- |
| POST   | `/cash-registers/open`                  | Abrir caja            |
| GET    | `/cash-registers/active`                | Caja activa           |
| GET    | `/cash-registers`                       | Listar cajas          |
| GET    | `/cash-registers/{id}`                  | Obtener caja por ID   |
| PUT    | `/cash-registers/{id}/close`            | Cerrar caja           |
| GET    | `/cash-registers/{id}/movements`        | Movimientos de caja   |
| GET    | `/cash-registers/{id}/movements/filter` | Movimientos filtrados |
| GET    | `/cash-registers/{id}/report`           | Reporte de caja       |
| GET    | `/cash-registers/{id}/balance-summary`  | Resumen de balance    |
| GET    | `/cash-registers/{id}/audits`           | Arqueos de caja       |
| POST   | `/cash-registers/payments/sale`         | Pago de venta         |
| POST   | `/cash-registers/payments/purchase`     | Pago de compra        |
| POST   | `/cash-movements/`                      | Registrar movimiento  |
| POST   | `/cash-movements/{id}/void`             | Anular movimiento     |

---

_Última actualización: 2026-04-22 — Creada desde cero post-Multi-Branch + Party Model._
