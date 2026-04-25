# Guía de API de Requisiciones de Compra para Frontend

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

### POST /purchase-requisitions

**Descripción:** Crea una nueva requisición de compra.

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

| Campo       | Tipo   | Requerido | Descripción                                                  |
| ----------- | ------ | --------- | ------------------------------------------------------------ |
| supplier_id | string | No        | ID del proveedor sugerido (Party ID)                         |
| branch_id   | int    | No        | ID de sucursal. Si se omite, usa el branch context resuelto. |
| notes       | string | No        | Notas generales                                              |
| details     | array  | Sí        | Mínimo 1 item. Ver detalle abajo.                            |
| metadata    | object | No        | Metadatos adicionales                                        |

**Detail Item:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto |
| quantity | float | Sí | Cantidad (> 0) |
| unit | string | No | Unidad de medida (`kg`, `l`, `unit`, etc.) |
| priority | string | No | `LOW`, `MEDIUM`, `HIGH`. Default: `MEDIUM` |
| notes | string | No | Notas del ítem |

#### Response 201

| Campo       | Tipo   | Descripción                   |
| ----------- | ------ | ----------------------------- |
| success     | bool   | `true`                        |
| id          | string | ID generado de la requisición |
| items_count | int    | Cantidad de líneas            |
| message     | string | Mensaje de éxito              |
| created_at  | string | Fecha de creación (ISO 8601)  |

#### Errores

| Código | Condición                                                                                   |
| ------ | ------------------------------------------------------------------------------------------- |
| 400    | Body inválido, `details` vacío, `product_id` vacío, `quantity` <= 0, o `branch_id` inválido |
| 401    | Token ausente o inválido                                                                    |
| 403    | `branch_id` fuera de `allowed_branches`                                                     |
| 404    | Producto no encontrado                                                                      |
| 500    | Error interno                                                                               |

---

### GET /purchase-requisitions

**Descripción:** Lista requisiciones con filtros.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro   | Tipo   | Requerido | Descripción                     |
| ----------- | ------ | --------- | ------------------------------- |
| branch_id   | int    | No        | ID de sucursal explícita        |
| status      | string | No        | Filtrar por estado              |
| user_id     | string | No        | Filtrar por solicitante         |
| supplier_id | string | No        | Filtrar por proveedor sugerido  |
| start_date  | date   | No        | Fecha inicio (YYYY-MM-DD)       |
| end_date    | date   | No        | Fecha fin (YYYY-MM-DD)          |
| page        | int    | No        | Número de página (default: 1)   |
| page_size   | int    | No        | Elementos por página (max: 100) |

#### Response 200

| Campo   | Tipo  | Descripción                    |
| ------- | ----- | ------------------------------ |
| success | bool  | `true`                         |
| data    | array | Lista de `PurchaseRequisition` |
| count   | int   | Total de registros             |

**PurchaseRequisition:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | ID de la requisición |
| user_id | string | ID del solicitante |
| user_name | string | Nombre del solicitante |
| branch_id | int | ID de sucursal |
| status | string | Estado actual |
| supplier_id | string | ID del proveedor sugerido |
| supplier_name | string | Nombre del proveedor sugerido |
| notes | string | Notas |
| created_at | datetime | Fecha de creación |
| updated_at | datetime | Fecha de última modificación |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 500    | Error interno                           |

---

### GET /purchase-requisitions/{id}

**Descripción:** Obtiene una requisición completa con sus detalles.

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

| Campo   | Tipo   | Descripción                      |
| ------- | ------ | -------------------------------- |
| success | bool   | `true`                           |
| data    | object | `PurchaseRequisitionWithDetails` |
| message | string | Mensaje opcional                 |
| error   | string | Solo en caso de error            |

**PurchaseRequisitionWithDetails:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| requisition | PurchaseRequisition | Cabecera de la requisición |
| details | array | Lista de `PurchaseRequisitionDetail` |

**PurchaseRequisitionDetail:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del detalle |
| purchase_requisition_id | string | ID de la requisición padre |
| product_id | string | ID del producto |
| product_name | string | Nombre del producto |
| quantity | float | Cantidad requerida |
| unit | string | Unidad de medida |
| priority | string | Prioridad (`LOW`, `MEDIUM`, `HIGH`) |
| notes | string | Notas del ítem |
| created_at | datetime | Fecha de creación |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `id` vacío o `branch_id` inválido       |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | Requisición no encontrada               |
| 500    | Error interno                           |

---

### GET /purchase-requisitions/status/{status}

**Descripción:** Lista requisiciones filtradas por estado.

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

| Parámetro | Tipo   | Requerido | Descripción                                                     |
| --------- | ------ | --------- | --------------------------------------------------------------- |
| status    | string | Sí        | Estado: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |

#### Response 200

| Campo   | Tipo  | Descripción                    |
| ------- | ----- | ------------------------------ |
| success | bool  | `true`                         |
| data    | array | Lista de `PurchaseRequisition` |
| count   | int   | Total de registros             |

#### Errores

| Código | Condición                                               |
| ------ | ------------------------------------------------------- |
| 400    | `status` vacío, estado inválido, o `branch_id` inválido |
| 401    | Token ausente o inválido                                |
| 403    | `branch_id` fuera de `allowed_branches`                 |
| 500    | Error interno                                           |

---

### GET /purchase-requisitions/my

**Descripción:** Lista las requisiciones del usuario autenticado.

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

| Campo   | Tipo  | Descripción                    |
| ------- | ----- | ------------------------------ |
| success | bool  | `true`                         |
| data    | array | Lista de `PurchaseRequisition` |
| count   | int   | Total de registros             |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 500    | Error interno                           |

---

### GET /purchase-requisitions/user/{user_id}

**Descripción:** Lista requisiciones de un usuario específico.

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

| Parámetro | Tipo   | Requerido | Descripción    |
| --------- | ------ | --------- | -------------- |
| user_id   | string | Sí        | ID del usuario |

#### Response 200

| Campo   | Tipo  | Descripción                    |
| ------- | ----- | ------------------------------ |
| success | bool  | `true`                         |
| data    | array | Lista de `PurchaseRequisition` |
| count   | int   | Total de registros             |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 500    | Error interno                           |

---

### PUT /purchase-requisitions/{id}/status

**Descripción:** Actualiza el estado de una requisición.

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
| id              | string | ID de la requisición   |
| previous_status | string | Estado anterior        |
| new_status      | string | Estado nuevo           |
| message         | string | Descripción del cambio |
| updated_at      | string | Fecha de actualización |

#### Errores

| Código | Condición                                                                      |
| ------ | ------------------------------------------------------------------------------ |
| 400    | `id` vacío, `new_status` inválido, transición inválida, o `branch_id` inválido |
| 401    | Token ausente o inválido                                                       |
| 403    | `branch_id` fuera de `allowed_branches`                                        |
| 404    | Requisición no encontrada                                                      |
| 500    | Error interno                                                                  |

#### Notas

**Transiciones válidas:**

- `DRAFT` → `PENDING`, `CANCELLED`
- `PENDING` → `APPROVED`, `REJECTED`, `CANCELLED`
- `APPROVED` → `CANCELLED`
- `REJECTED` → `DRAFT`, `PENDING`
- `CANCELLED` → `DRAFT`

---

## Estados de la Requisición

| Estado      | Descripción                 | Transiciones Válidas                |
| ----------- | --------------------------- | ----------------------------------- |
| `DRAFT`     | Borrador inicial            | `PENDING`, `CANCELLED`              |
| `PENDING`   | Pendiente de aprobación     | `APPROVED`, `REJECTED`, `CANCELLED` |
| `APPROVED`  | Aprobado, listo para compra | `CANCELLED`                         |
| `REJECTED`  | Rechazado                   | `DRAFT`, `PENDING`                  |
| `CANCELLED` | Cancelado                   | `DRAFT`                             |

---

## Modelo de Datos

### PurchaseRequisition

| Campo         | Tipo     | Descripción                                    |
| ------------- | -------- | ---------------------------------------------- |
| id            | string   | ID único de la requisición                     |
| user_id       | string   | ID del usuario solicitante                     |
| user_name     | string   | Nombre del solicitante                         |
| branch_id     | int      | ID de sucursal (nullable)                      |
| status        | string   | Estado actual                                  |
| supplier_id   | string   | ID del proveedor sugerido (Party ID, nullable) |
| supplier_name | string   | Nombre del proveedor sugerido                  |
| notes         | string   | Notas adicionales (nullable)                   |
| metadata      | jsonb    | Metadatos adicionales                          |
| created_at    | datetime | Fecha de creación                              |
| updated_at    | datetime | Fecha de última modificación                   |

### PurchaseRequisitionDetail

| Campo                   | Tipo     | Descripción                        |
| ----------------------- | -------- | ---------------------------------- |
| id                      | int      | ID único del detalle               |
| purchase_requisition_id | string   | ID de la requisición padre         |
| product_id              | string   | ID del producto                    |
| product_name            | string   | Nombre del producto                |
| quantity                | float    | Cantidad requerida                 |
| unit                    | string   | Unidad de medida (nullable)        |
| priority                | string   | Prioridad: `LOW`, `MEDIUM`, `HIGH` |
| notes                   | string   | Notas del ítem (nullable)          |
| created_at              | datetime | Fecha de creación                  |

---

## Resumen de Endpoints

| Método | Endpoint                                 | Descripción        |
| ------ | ---------------------------------------- | ------------------ |
| POST   | `/purchase-requisitions`                 | Crear requisición  |
| GET    | `/purchase-requisitions`                 | Listar con filtros |
| GET    | `/purchase-requisitions/{id}`            | Obtener por ID     |
| GET    | `/purchase-requisitions/status/{status}` | Listar por estado  |
| GET    | `/purchase-requisitions/my`              | Mis requisiciones  |
| GET    | `/purchase-requisitions/user/{user_id}`  | Listar por usuario |
| PUT    | `/purchase-requisitions/{id}/status`     | Actualizar estado  |

---

_Última actualización: 2026-04-22 — Reescrita post-Party Model + Multi-Branch. `supplier_id` corregido a `string`._
