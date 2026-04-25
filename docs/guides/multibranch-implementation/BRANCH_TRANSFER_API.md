# Guía de API de Transferencias entre Sucursales para Frontend

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

### POST /branch-transfers

**Descripción:** Crea una solicitud de transferencia entre sucursales.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo                 | Tipo   | Requerido | Descripción                                                       |
| --------------------- | ------ | --------- | ----------------------------------------------------------------- |
| source_branch_id      | int    | Sí        | ID de sucursal origen                                             |
| destination_branch_id | int    | Sí        | ID de sucursal destino                                            |
| transfer_type         | string | No        | `STANDARD`, `URGENT`, `RETURN`, `ADJUSTMENT`. Default: `STANDARD` |
| notes                 | string | No        | Notas generales                                                   |
| items                 | array  | Sí        | Lista de productos a transferir                                   |

**Item:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto |
| quantity_requested | float | Sí | Cantidad solicitada |
| unit_cost | float | No | Costo unitario |
| notes | string | No | Notas del item |

#### Response 201

| Campo                 | Tipo     | Descripción                   |
| --------------------- | -------- | ----------------------------- |
| id                    | int      | ID de la transferencia        |
| transfer_code         | string   | Código generado               |
| source_branch_id      | int      | Sucursal origen               |
| destination_branch_id | int      | Sucursal destino              |
| status                | string   | `PENDING`                     |
| transfer_type         | string   | Tipo de transferencia         |
| requested_by          | string   | Usuario solicitante           |
| requested_date        | datetime | Fecha de solicitud            |
| items                 | array    | Lista de `BranchTransferItem` |

#### Errores

| Código | Condición                                                                             |
| ------ | ------------------------------------------------------------------------------------- |
| 400    | Body inválido, `source_branch_id` o `destination_branch_id` inválidos, o items vacíos |
| 401    | Token ausente o inválido                                                              |
| 403    | Sucursal origen o destino no autorizada                                               |
| 500    | Error interno                                                                         |

---

### GET /branch-transfers

**Descripción:** Lista transferencias con filtros.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro             | Tipo   | Requerido | Descripción                             |
| --------------------- | ------ | --------- | --------------------------------------- |
| branch_id             | int    | No        | Filtrar por sucursal (origen o destino) |
| status                | string | No        | Filtrar por estado                      |
| source_branch_id      | int    | No        | Filtrar por origen                      |
| destination_branch_id | int    | No        | Filtrar por destino                     |
| page                  | int    | No        | Número de página                        |
| page_size             | int    | No        | Elementos por página                    |

#### Response 200

| Campo      | Tipo   | Descripción               |
| ---------- | ------ | ------------------------- |
| data       | array  | Lista de `BranchTransfer` |
| pagination | object | Información de paginación |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 400    | Parámetros inválidos     |
| 401    | Token ausente o inválido |
| 403    | Sucursal no autorizada   |
| 500    | Error interno            |

---

### GET /branch-transfers/{id}

**Descripción:** Obtiene una transferencia completa con sus items.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 200

| Campo    | Tipo           | Descripción                   |
| -------- | -------------- | ----------------------------- |
| transfer | BranchTransfer | Cabecera de la transferencia  |
| items    | array          | Lista de `BranchTransferItem` |

**BranchTransferItem:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del item |
| transfer_id | int | ID de la transferencia |
| product_id | string | ID del producto |
| quantity_requested | float | Cantidad solicitada |
| quantity_approved | float | Cantidad aprobada (nullable) |
| quantity_shipped | float | Cantidad enviada (nullable) |
| quantity_received | float | Cantidad recibida (nullable) |
| unit_cost | float | Costo unitario (nullable) |
| notes | string | Notas (nullable) |

#### Errores

| Código | Condición                   |
| ------ | --------------------------- |
| 400    | `id` inválido               |
| 401    | Token ausente o inválido    |
| 403    | Sucursal no autorizada      |
| 404    | Transferencia no encontrada |
| 500    | Error interno               |

---

### PUT /branch-transfers/{id}/status

**Descripción:** Actualiza el estado de una transferencia (workflow).

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo                    | Tipo   | Requerido | Descripción                          |
| ------------------------ | ------ | --------- | ------------------------------------ |
| new_status               | string | Sí        | Nuevo estado                         |
| notes                    | string | No        | Notas adicionales                    |
| rejection_reason         | string | No        | Razón de rechazo (si aplica)         |
| shipping_tracking_number | string | No        | Número de seguimiento (si aplica)    |
| items                    | array  | No        | Actualización de cantidades por item |

**Item Update:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto |
| quantity_approved | float | No | Cantidad aprobada |
| quantity_shipped | float | No | Cantidad enviada |
| quantity_received | float | No | Cantidad recibida |
| notes | string | No | Notas |

#### Response 200

| Campo      | Tipo     | Descripción            |
| ---------- | -------- | ---------------------- |
| id         | int      | ID de la transferencia |
| status     | string   | Nuevo estado           |
| updated_at | datetime | Fecha de actualización |

#### Errores

| Código | Condición                                                       |
| ------ | --------------------------------------------------------------- |
| 400    | `id` inválido, `new_status` inválido, o transición no permitida |
| 401    | Token ausente o inválido                                        |
| 403    | Sin permisos para realizar esta transición                      |
| 404    | Transferencia no encontrada                                     |
| 409    | Transición inválida para el estado actual                       |
| 500    | Error interno                                                   |

#### Notas

**Workflow de Estados:**

- `PENDING` → `APPROVED`, `REJECTED`, `CANCELLED`
- `APPROVED` → `SHIPPED`, `CANCELLED`
- `SHIPPED` → `IN_TRANSIT`, `RECEIVED`
- `IN_TRANSIT` → `RECEIVED`, `CANCELLED`
- `REJECTED` → `PENDING` (reconsideración)
- `RECEIVED` → (final)
- `CANCELLED` → (final)

**Permisos por transición:**

- `APPROVED`: Requiere rol ADMIN o SUPPLIES
- `SHIPPED`: Requiere rol ADMIN o SUPPLIES
- `RECEIVED`: Requiere rol ADMIN o BUYER en sucursal destino
- `REJECTED`: Requiere rol ADMIN
- `CANCELLED`: Requiere rol ADMIN

---

## Estados de Transferencia

| Estado       | Descripción                               |
| ------------ | ----------------------------------------- |
| `PENDING`    | Solicitud creada, pendiente de aprobación |
| `APPROVED`   | Aprobada, lista para envío                |
| `REJECTED`   | Rechazada                                 |
| `SHIPPED`    | Enviada desde origen                      |
| `IN_TRANSIT` | En tránsito                               |
| `RECEIVED`   | Recibida en destino                       |
| `CANCELLED`  | Cancelada                                 |

---

## Tipos de Transferencia

| Tipo         | Descripción            |
| ------------ | ---------------------- |
| `STANDARD`   | Transferencia estándar |
| `URGENT`     | Transferencia urgente  |
| `RETURN`     | Devolución             |
| `ADJUSTMENT` | Ajuste de inventario   |

---

## Resumen de Endpoints

| Método | Endpoint                        | Descripción           |
| ------ | ------------------------------- | --------------------- |
| POST   | `/branch-transfers`             | Crear transferencia   |
| GET    | `/branch-transfers`             | Listar transferencias |
| GET    | `/branch-transfers/{id}`        | Obtener transferencia |
| PUT    | `/branch-transfers/{id}/status` | Actualizar estado     |

---

_Última actualización: 2026-04-22 — Creada desde cero post-Multi-Branch + Party Model._
