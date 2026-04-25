# Guía de API de Sucursales para Frontend

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

### POST /branches

**Descripción:** Crea una nueva sucursal.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo            | Tipo   | Requerido | Descripción                           |
| ---------------- | ------ | --------- | ------------------------------------- |
| code             | string | Sí        | Código único de la sucursal           |
| name             | string | Sí        | Nombre de la sucursal                 |
| branch_type      | string | Sí        | Tipo de sucursal                      |
| legal_name       | string | No        | Razón social                          |
| trade_name       | string | No        | Nombre comercial                      |
| ruc              | string | No        | RUC (Registro Único de Contribuyente) |
| address          | string | No        | Dirección                             |
| city             | string | No        | Ciudad                                |
| state            | string | No        | Departamento/Estado                   |
| country          | string | No        | País                                  |
| phone            | string | No        | Teléfono                              |
| email            | string | No        | Correo electrónico                    |
| allows_sales     | bool   | No        | Permite ventas. Default: `true`       |
| allows_purchases | bool   | No        | Permite compras. Default: `true`      |
| is_warehouse     | bool   | No        | Es depósito. Default: `false`         |
| manager_user_id  | string | No        | ID del usuario gestor                 |

#### Response 201

| Campo       | Tipo     | Descripción       |
| ----------- | -------- | ----------------- |
| id          | int      | ID de la sucursal |
| code        | string   | Código            |
| name        | string   | Nombre            |
| branch_type | string   | Tipo              |
| is_active   | bool     | Estado activo     |
| created_at  | datetime | Fecha de creación |

#### Errores

| Código | Condición                                   |
| ------ | ------------------------------------------- |
| 400    | Body inválido o campos requeridos faltantes |
| 401    | Token ausente o inválido                    |
| 409    | Código de sucursal ya existe                |
| 500    | Error interno                               |

---

### GET /branches

**Descripción:** Lista todas las sucursales.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción               |
| --------- | ---- | --------- | ------------------------- |
| is_active | bool | No        | Filtrar por estado activo |
| page      | int  | No        | Número de página          |
| page_size | int  | No        | Elementos por página      |

#### Response 200

| Campo      | Tipo   | Descripción               |
| ---------- | ------ | ------------------------- |
| data       | array  | Lista de `Branch`         |
| pagination | object | Información de paginación |

**Branch:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID de la sucursal |
| code | string | Código único |
| name | string | Nombre |
| branch_type | string | Tipo de sucursal |
| legal_name | string | Razón social (nullable) |
| trade_name | string | Nombre comercial (nullable) |
| ruc | string | RUC (nullable) |
| address | string | Dirección (nullable) |
| city | string | Ciudad (nullable) |
| state | string | Departamento (nullable) |
| country | string | País (nullable) |
| phone | string | Teléfono (nullable) |
| email | string | Correo (nullable) |
| is_active | bool | Estado activo |
| allows_sales | bool | Permite ventas |
| allows_purchases | bool | Permite compras |
| is_warehouse | bool | Es depósito |
| manager_user_id | string | ID del gestor (nullable) |
| created_at | datetime | Fecha de creación |
| updated_at | datetime | Fecha de actualización |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token ausente o inválido |
| 500    | Error interno            |

---

### GET /branches/{id}

**Descripción:** Obtiene una sucursal por ID.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 200

Estructura `Branch` completa.

#### Errores

| Código | Condición                              |
| ------ | -------------------------------------- |
| 400    | `id` inválido                          |
| 401    | Token ausente o inválido               |
| 403    | Sucursal no autorizada para el usuario |
| 404    | Sucursal no encontrada                 |
| 500    | Error interno                          |

---

### PUT /branches/{id}

**Descripción:** Actualiza una sucursal existente.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo            | Tipo   | Requerido | Descripción      |
| ---------------- | ------ | --------- | ---------------- |
| name             | string | No        | Nombre           |
| branch_type      | string | No        | Tipo             |
| legal_name       | string | No        | Razón social     |
| trade_name       | string | No        | Nombre comercial |
| ruc              | string | No        | RUC              |
| address          | string | No        | Dirección        |
| city             | string | No        | Ciudad           |
| state            | string | No        | Departamento     |
| country          | string | No        | País             |
| phone            | string | No        | Teléfono         |
| email            | string | No        | Correo           |
| is_active        | bool   | No        | Estado activo    |
| allows_sales     | bool   | No        | Permite ventas   |
| allows_purchases | bool   | No        | Permite compras  |
| is_warehouse     | bool   | No        | Es depósito      |
| manager_user_id  | string | No        | ID del gestor    |

#### Response 200

Estructura `Branch` actualizada.

#### Errores

| Código | Condición                     |
| ------ | ----------------------------- |
| 400    | `id` inválido o body inválido |
| 401    | Token ausente o inválido      |
| 403    | Sucursal no autorizada        |
| 404    | Sucursal no encontrada        |
| 500    | Error interno                 |

---

### POST /branches/{branch_id}/fiscal-config

**Descripción:** Crea configuración fiscal para una sucursal.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo               | Tipo     | Requerido | Descripción                       |
| ------------------- | -------- | --------- | --------------------------------- |
| establishment_code  | string   | Sí        | Código de establecimiento (SIFEN) |
| expedition_point    | string   | Sí        | Punto de expedición               |
| document_type       | string   | Sí        | Tipo de documento fiscal          |
| timbrado            | string   | Sí        | Número de timbrado                |
| valid_from          | datetime | No        | Fecha inicio de validez           |
| valid_to            | datetime | No        | Fecha fin de validez              |
| invoice_prefix      | string   | No        | Prefijo de factura                |
| next_invoice_number | int      | No        | Próximo número de factura         |
| is_active           | bool     | No        | Estado activo                     |

#### Response 201

| Campo               | Tipo     | Descripción               |
| ------------------- | -------- | ------------------------- |
| id                  | int      | ID de la config           |
| branch_id           | int      | ID de la sucursal         |
| establishment_code  | string   | Código de establecimiento |
| expedition_point    | string   | Punto de expedición       |
| document_type       | string   | Tipo de documento         |
| timbrado            | string   | Timbrado                  |
| next_invoice_number | int      | Próximo número            |
| is_active           | bool     | Estado                    |
| created_at          | datetime | Fecha de creación         |

#### Errores

| Código | Condición                                   |
| ------ | ------------------------------------------- |
| 400    | Body inválido o campos requeridos faltantes |
| 401    | Token ausente o inválido                    |
| 404    | Sucursal no encontrada                      |
| 500    | Error interno                               |

---

### GET /branches/{branch_id}/fiscal-config

**Descripción:** Lista configuraciones fiscales de una sucursal.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 200

| Campo | Tipo  | Descripción                   |
| ----- | ----- | ----------------------------- |
| data  | array | Lista de `BranchFiscalConfig` |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 400    | `branch_id` inválido     |
| 401    | Token ausente o inválido |
| 404    | Sucursal no encontrada   |
| 500    | Error interno            |

---

### PUT /branches/fiscal-config/{id}

**Descripción:** Actualiza una configuración fiscal.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo               | Tipo     | Requerido | Descripción               |
| ------------------- | -------- | --------- | ------------------------- |
| establishment_code  | string   | No        | Código de establecimiento |
| expedition_point    | string   | No        | Punto de expedición       |
| document_type       | string   | No        | Tipo de documento         |
| timbrado            | string   | No        | Timbrado                  |
| valid_from          | datetime | No        | Fecha inicio              |
| valid_to            | datetime | No        | Fecha fin                 |
| invoice_prefix      | string   | No        | Prefijo                   |
| next_invoice_number | int      | No        | Próximo número            |
| is_active           | bool     | No        | Estado                    |

#### Response 200

Estructura `BranchFiscalConfig` actualizada.

#### Errores

| Código | Condición                     |
| ------ | ----------------------------- |
| 400    | `id` inválido o body inválido |
| 401    | Token ausente o inválido      |
| 404    | Configuración no encontrada   |
| 500    | Error interno                 |

---

### POST /branches/{branch_id}/access

**Descripción:** Otorga acceso a un usuario sobre una sucursal.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo             | Tipo   | Requerido | Descripción                                    |
| ----------------- | ------ | --------- | ---------------------------------------------- |
| user_id           | string | Sí        | ID del usuario                                 |
| access_type       | string | Sí        | Tipo de acceso: `ADMIN`, `OPERATOR`, `VIEWER`  |
| is_default_branch | bool   | No        | Marcar como sucursal default. Default: `false` |

#### Response 201

| Campo             | Tipo     | Descripción           |
| ----------------- | -------- | --------------------- |
| id                | int      | ID del acceso         |
| user_id           | string   | ID del usuario        |
| branch_id         | int      | ID de la sucursal     |
| access_type       | string   | Tipo de acceso        |
| is_default_branch | bool     | Es default            |
| granted_at        | datetime | Fecha de otorgamiento |

#### Errores

| Código | Condición                                   |
| ------ | ------------------------------------------- |
| 400    | Body inválido o campos requeridos faltantes |
| 401    | Token ausente o inválido                    |
| 404    | Sucursal o usuario no encontrado            |
| 409    | El usuario ya tiene acceso a esta sucursal  |
| 500    | Error interno                               |

---

### GET /branches/{branch_id}/access

**Descripción:** Lista accesos de usuarios para una sucursal.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 200

| Campo | Tipo  | Descripción                 |
| ----- | ----- | --------------------------- |
| data  | array | Lista de `UserBranchAccess` |

**UserBranchAccess:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del acceso |
| user_id | string | ID del usuario |
| branch_id | int | ID de la sucursal |
| access_type | string | Tipo de acceso |
| is_default_branch | bool | Es default |
| granted_at | datetime | Fecha de otorgamiento |
| granted_by | string | ID del usuario que otorgó (nullable) |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 400    | `branch_id` inválido     |
| 401    | Token ausente o inválido |
| 404    | Sucursal no encontrada   |
| 500    | Error interno            |

---

### PUT /branches/{branch_id}/access/{user_id}

**Descripción:** Actualiza el acceso de un usuario a una sucursal.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo             | Tipo   | Requerido | Descripción    |
| ----------------- | ------ | --------- | -------------- |
| access_type       | string | No        | Tipo de acceso |
| is_default_branch | bool   | No        | Es default     |

#### Response 200

Estructura `UserBranchAccess` actualizada.

#### Errores

| Código | Condición                         |
| ------ | --------------------------------- |
| 400    | `branch_id` o `user_id` inválidos |
| 401    | Token ausente o inválido          |
| 404    | Acceso no encontrado              |
| 500    | Error interno                     |

---

### DELETE /branches/{branch_id}/access/{user_id}

**Descripción:** Revoca el acceso de un usuario a una sucursal.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 204

Sin contenido.

#### Errores

| Código | Condición                         |
| ------ | --------------------------------- |
| 400    | `branch_id` o `user_id` inválidos |
| 401    | Token ausente o inválido          |
| 404    | Acceso no encontrado              |
| 500    | Error interno                     |

---

### GET /users/{user_id}/branches

**Descripción:** Lista las sucursales a las que un usuario tiene acceso.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 200

| Campo | Tipo  | Descripción                 |
| ----- | ----- | --------------------------- |
| data  | array | Lista de `UserBranchAccess` |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 400    | `user_id` inválido       |
| 401    | Token ausente o inválido |
| 404    | Usuario no encontrado    |
| 500    | Error interno            |

---

## Tipos de Acceso

| Tipo       | Descripción                |
| ---------- | -------------------------- |
| `ADMIN`    | Acceso total a la sucursal |
| `OPERATOR` | Puede operar transacciones |
| `VIEWER`   | Solo lectura               |

---

## Resumen de Endpoints

| Método | Endpoint                                 | Descripción              |
| ------ | ---------------------------------------- | ------------------------ |
| POST   | `/branches`                              | Crear sucursal           |
| GET    | `/branches`                              | Listar sucursales        |
| GET    | `/branches/{id}`                         | Obtener sucursal         |
| PUT    | `/branches/{id}`                         | Actualizar sucursal      |
| POST   | `/branches/{branch_id}/fiscal-config`    | Crear config fiscal      |
| GET    | `/branches/{branch_id}/fiscal-config`    | Listar configs fiscales  |
| PUT    | `/branches/fiscal-config/{id}`           | Actualizar config fiscal |
| POST   | `/branches/{branch_id}/access`           | Otorgar acceso           |
| GET    | `/branches/{branch_id}/access`           | Listar accesos           |
| PUT    | `/branches/{branch_id}/access/{user_id}` | Actualizar acceso        |
| DELETE | `/branches/{branch_id}/access/{user_id}` | Revocar acceso           |
| GET    | `/users/{user_id}/branches`              | Sucursales del usuario   |

---

_Última actualización: 2026-04-22 — Creada desde cero post-Multi-Branch + Party Model._
