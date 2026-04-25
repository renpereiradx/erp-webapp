# Guía de API de Seguridad para Frontend

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

### POST /login

**Descripción:** Inicia sesión y obtiene tokens de acceso.

#### Headers

| Header       | Requerido | Descripción        |
| ------------ | --------- | ------------------ |
| Content-Type | Sí        | `application/json` |

#### Request Body

| Campo    | Tipo   | Requerido | Descripción        |
| -------- | ------ | --------- | ------------------ |
| email    | string | Sí        | Correo electrónico |
| password | string | Sí        | Contraseña         |

#### Response 200

| Campo            | Tipo   | Descripción                          |
| ---------------- | ------ | ------------------------------------ |
| token            | string | Access token JWT (válido 15 minutos) |
| role_id          | string | ID del rol del usuario               |
| role_name        | string | Nombre del rol                       |
| allowed_branches | int[]  | Sucursales permitidas                |
| active_branch    | int    | Sucursal default del usuario         |

#### Response 429 (Rate Limit)

| Campo         | Tipo   | Descripción              |
| ------------- | ------ | ------------------------ |
| success       | bool   | `false`                  |
| error.code    | string | `RATE_LIMIT_EXCEEDED`    |
| error.message | string | Mensaje descriptivo      |
| retry_after   | int    | Segundos para reintentar |

#### Errores

| Código | Condición                                               |
| ------ | ------------------------------------------------------- |
| 400    | Body inválido o campos requeridos faltantes             |
| 401    | Credenciales inválidas                                  |
| 429    | Rate limit excedido (5 intentos por IP cada 15 minutos) |
| 500    | Error interno                                           |

#### Notas

- Rate limit de login: 5 intentos por IP cada 15 minutos.
- Headers de rate limit en respuestas exitosas:
  - `X-RateLimit-Limit`: 5
  - `X-RateLimit-Remaining`: intentos restantes
  - `X-RateLimit-Reset`: timestamp de reset

---

### POST /auth/refresh

**Descripción:** Obtiene un nuevo access token usando el refresh token.

#### Headers

| Header        | Requerido | Descripción              |
| ------------- | --------- | ------------------------ |
| Authorization | Sí        | `Bearer <refresh_token>` |
| Content-Type  | Sí        | `application/json`       |

#### Request Body (alternativa)

| Campo         | Tipo   | Requerido | Descripción                              |
| ------------- | ------ | --------- | ---------------------------------------- |
| refresh_token | string | No        | Refresh token (si no se envía en header) |

#### Response 200

| Campo         | Tipo   | Descripción                        |
| ------------- | ------ | ---------------------------------- |
| success       | bool   | `true`                             |
| access_token  | string | Nuevo access token                 |
| refresh_token | string | Nuevo refresh token (rotación)     |
| token_type    | string | `Bearer`                           |
| expires_in    | int    | Segundos de validez (default: 900) |

#### Response 401

| Campo   | Tipo   | Descripción                                        |
| ------- | ------ | -------------------------------------------------- |
| success | bool   | `false`                                            |
| error   | string | `invalid refresh token` o `token has been revoked` |

#### Errores

| Código | Condición                                   |
| ------ | ------------------------------------------- |
| 400    | Refresh token faltante                      |
| 401    | Refresh token inválido, expirado o revocado |
| 500    | Error interno                               |

---

### POST /auth/logout

**Descripción:** Cierra la sesión actual.

#### Headers

| Header        | Requerido | Descripción             |
| ------------- | --------- | ----------------------- |
| Authorization | Sí        | `Bearer <access_token>` |

#### Response 200

| Campo   | Tipo   | Descripción  |
| ------- | ------ | ------------ |
| success | bool   | `true`       |
| message | string | Confirmación |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token ausente o inválido |
| 500    | Error interno            |

---

### POST /auth/logout-all

**Descripción:** Cierra todas las sesiones activas del usuario.

#### Headers

| Header        | Requerido | Descripción             |
| ------------- | --------- | ----------------------- |
| Authorization | Sí        | `Bearer <access_token>` |

#### Response 200

| Campo   | Tipo   | Descripción  |
| ------- | ------ | ------------ |
| success | bool   | `true`       |
| message | string | Confirmación |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token ausente o inválido |
| 500    | Error interno            |

---

### GET /api/v1/users/me

**Descripción:** Obtiene el perfil y permisos del usuario autenticado.

#### Headers

| Header        | Requerido | Descripción             |
| ------------- | --------- | ----------------------- |
| Authorization | Sí        | `Bearer <access_token>` |

#### Response 200

| Campo            | Tipo     | Descripción                          |
| ---------------- | -------- | ------------------------------------ |
| id               | string   | ID del usuario                       |
| email            | string   | Correo electrónico                   |
| username         | string   | Nombre de usuario                    |
| role_id          | string   | ID del rol                           |
| role_name        | string   | Nombre del rol                       |
| permissions      | array    | Lista de permisos (`recurso:acción`) |
| allowed_branches | int[]    | Sucursales permitidas                |
| active_branch    | int      | Sucursal default                     |
| created_at       | datetime | Fecha de creación                    |
| updated_at       | datetime | Fecha de actualización               |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token ausente o inválido |
| 500    | Error interno            |

---

### PUT /api/v1/users/me

**Descripción:** Actualiza el perfil del usuario autenticado.

#### Headers

| Header        | Requerido | Descripción             |
| ------------- | --------- | ----------------------- |
| Authorization | Sí        | `Bearer <access_token>` |
| Content-Type  | Sí        | `application/json`      |

#### Request Body

| Campo    | Tipo   | Requerido | Descripción             |
| -------- | ------ | --------- | ----------------------- |
| email    | string | No        | Nuevo correo            |
| username | string | No        | Nuevo nombre de usuario |

#### Response 200

Perfil actualizado.

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 400    | Body inválido            |
| 401    | Token ausente o inválido |
| 409    | Email ya existe          |
| 500    | Error interno            |

---

### POST /api/v1/users/me/change-password

**Descripción:** Cambia la contraseña del usuario autenticado.

#### Headers

| Header        | Requerido | Descripción             |
| ------------- | --------- | ----------------------- |
| Authorization | Sí        | `Bearer <access_token>` |
| Content-Type  | Sí        | `application/json`      |

#### Request Body

| Campo            | Tipo   | Requerido | Descripción                            |
| ---------------- | ------ | --------- | -------------------------------------- |
| current_password | string | Sí        | Contraseña actual                      |
| new_password     | string | Sí        | Nueva contraseña (mínimo 6 caracteres) |

#### Response 200

| Campo   | Tipo   | Descripción  |
| ------- | ------ | ------------ |
| success | bool   | `true`       |
| message | string | Confirmación |

#### Errores

| Código | Condición                                                |
| ------ | -------------------------------------------------------- |
| 400    | Contraseña actual incorrecta o nueva contraseña inválida |
| 401    | Token ausente o inválido                                 |
| 429    | Rate limit excedido (3 cambios por hora)                 |
| 500    | Error interno                                            |

---

## Rate Limiting

### Configuración por Endpoint

| Endpoint                                | Límite        | Ventana    | Identificador |
| --------------------------------------- | ------------- | ---------- | ------------- |
| `POST /login`                           | 5 intentos    | 15 minutos | IP            |
| `POST /api/v1/users/me/change-password` | 3 cambios     | 1 hora     | Usuario       |
| `POST /api/v1/users`                    | 10 creaciones | 1 hora     | Usuario admin |
| API general                             | 100 requests  | 1 minuto   | IP            |

### Headers de Rate Limit

En respuestas exitosas, la API incluye:

| Header                  | Descripción        |
| ----------------------- | ------------------ |
| `X-RateLimit-Limit`     | Límite total       |
| `X-RateLimit-Remaining` | Requests restantes |
| `X-RateLimit-Reset`     | Timestamp de reset |

### Response 429

| Campo         | Tipo   | Descripción              |
| ------------- | ------ | ------------------------ |
| success       | bool   | `false`                  |
| error.code    | string | `RATE_LIMIT_EXCEEDED`    |
| error.message | string | Mensaje descriptivo      |
| retry_after   | int    | Segundos para reintentar |

---

## Autorización RBAC

### Permisos Granulares

El sistema usa permisos en formato `recurso:acción`:

| Permiso             | Descripción                   |
| ------------------- | ----------------------------- |
| `users:read`        | Ver usuarios                  |
| `users:create`      | Crear usuarios                |
| `users:update`      | Actualizar usuarios           |
| `users:delete`      | Eliminar usuarios             |
| `users:assign-role` | Asignar roles                 |
| `roles:read`        | Ver roles                     |
| `roles:create`      | Crear roles                   |
| `roles:update`      | Actualizar roles              |
| `roles:delete`      | Eliminar roles                |
| `sessions:admin`    | Ver/revocar sesiones de otros |
| `audit:read`        | Ver logs de auditoría         |

### Roles del Sistema

| Rol        | Descripción                    | Acceso BI                              |
| ---------- | ------------------------------ | -------------------------------------- |
| `ADMIN`    | Acceso total                   | Todas las sucursales (sin `branch_id`) |
| `BUYER`    | Compras y pagos                | Lectura en BI                          |
| `SUPPLIES` | Inventario y aprovisionamiento | Denegado en reportes financieros       |
| `VENDOR`   | Ventas                         | Denegado en BI financiero              |
| `CLIENT`   | Cliente externo                | Denegado                               |

> **Nota:** El frontend debe verificar permisos para UX, pero el backend es la fuente de verdad para seguridad.

---

## Auditoría

### GET /api/v1/audit/logs

**Descripción:** Lista logs de auditoría.

#### Headers

| Header        | Requerido | Descripción          |
| ------------- | --------- | -------------------- |
| Authorization | Sí        | `Bearer <jwt_token>` |

#### Query Parameters

| Parámetro  | Tipo     | Requerido | Descripción                                                |
| ---------- | -------- | --------- | ---------------------------------------------------------- |
| user_id    | string   | No        | Filtrar por usuario                                        |
| category   | string   | No        | Filtrar por categoría (`AUTH`, `USER`, `SALE`, `PURCHASE`) |
| action     | string   | No        | Filtrar por acción (`user:create`, `user:update`, etc.)    |
| start_date | datetime | No        | Fecha inicio                                               |
| end_date   | datetime | No        | Fecha fin                                                  |
| page       | int      | No        | Número de página                                           |
| page_size  | int      | No        | Tamaño de página (max: 100)                                |

#### Response 200

| Campo      | Tipo   | Descripción               |
| ---------- | ------ | ------------------------- |
| data       | array  | Lista de logs             |
| pagination | object | Información de paginación |

**Log Entry:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del log |
| user_id | string | Usuario que ejecutó la acción |
| action | string | Acción realizada |
| category | string | Categoría |
| entity_type | string | Tipo de entidad afectada |
| entity_id | string | ID de la entidad |
| old_values | object | Valores anteriores (nullable) |
| new_values | object | Valores nuevos (nullable) |
| ip_address | string | IP del cliente |
| user_agent | string | User agent |
| created_at | datetime | Fecha del evento |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token ausente o inválido |
| 403    | Sin permiso `audit:read` |
| 500    | Error interno            |

---

### GET /api/v1/audit/entity/{entity_type}/{entity_id}/history

**Descripción:** Historial de cambios de una entidad específica.

#### Headers

| Header        | Requerido | Descripción          |
| ------------- | --------- | -------------------- |
| Authorization | Sí        | `Bearer <jwt_token>` |

#### Path Parameters

| Parámetro   | Tipo   | Requerido | Descripción                           |
| ----------- | ------ | --------- | ------------------------------------- |
| entity_type | string | Sí        | Tipo: `USER`, `SALE`, `PRODUCT`, etc. |
| entity_id   | string | Sí        | ID de la entidad                      |

#### Response 200

| Campo | Tipo  | Descripción      |
| ----- | ----- | ---------------- |
| data  | array | Lista de cambios |

**Change Entry:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del cambio |
| action | string | Acción realizada |
| user_id | string | Usuario que realizó el cambio |
| user_name | string | Nombre del usuario |
| created_at | datetime | Fecha del cambio |
| old_values | object | Valores anteriores |
| new_values | object | Valores nuevos |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token ausente o inválido |
| 403    | Sin permiso `audit:read` |
| 404    | Entidad no encontrada    |
| 500    | Error interno            |

---

### GET /api/v1/audit/dashboard

**Descripción:** Dashboard de auditoría con resumen de eventos.

#### Headers

| Header        | Requerido | Descripción          |
| ------------- | --------- | -------------------- |
| Authorization | Sí        | `Bearer <jwt_token>` |

#### Response 200

| Campo                     | Tipo   | Descripción              |
| ------------------------- | ------ | ------------------------ |
| summary.total_events      | int    | Total de eventos         |
| summary.events_today      | int    | Eventos hoy              |
| summary.events_this_week  | int    | Eventos esta semana      |
| summary.events_this_month | int    | Eventos este mes         |
| by_category               | object | Conteo por categoría     |
| by_action                 | object | Conteo por acción        |
| top_users                 | array  | Usuarios con más eventos |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token ausente o inválido |
| 403    | Sin permiso `audit:read` |
| 500    | Error interno            |

---

## Claims JWT

El payload del JWT contiene:

| Claim              | Tipo   | Descripción             |
| ------------------ | ------ | ----------------------- |
| `user_id`          | string | ID del usuario          |
| `role_id`          | string | Rol del usuario         |
| `session_id`       | int64  | ID de sesión            |
| `token_type`       | string | `access` o `refresh`    |
| `allowed_branches` | int[]  | Sucursales permitidas   |
| `active_branch`    | int    | Sucursal default        |
| `exp`              | int64  | Timestamp de expiración |
| `iat`              | int64  | Timestamp de emisión    |

---

## Errores Comunes

| Código HTTP | Código Error            | Descripción                               |
| ----------- | ----------------------- | ----------------------------------------- |
| 400         | `INVALID_PASSWORD`      | Contraseña inválida (mínimo 6 caracteres) |
| 401         | `UNAUTHORIZED`          | Token inválido o expirado                 |
| 401         | `INVALID_REFRESH_TOKEN` | Refresh token inválido o revocado         |
| 403         | `FORBIDDEN`             | Sin permisos suficientes                  |
| 403         | `forbidden branch_id`   | Sucursal fuera de `allowed_branches`      |
| 400         | `invalid branch_id`     | `branch_id` no es entero positivo         |
| 429         | `RATE_LIMIT_EXCEEDED`   | Límite de requests excedido               |

---

## Resumen de Endpoints

| Método | Endpoint                                   | Descripción               |
| ------ | ------------------------------------------ | ------------------------- |
| POST   | `/login`                                   | Iniciar sesión            |
| POST   | `/auth/refresh`                            | Refrescar access token    |
| POST   | `/auth/logout`                             | Cerrar sesión actual      |
| POST   | `/auth/logout-all`                         | Cerrar todas las sesiones |
| GET    | `/api/v1/users/me`                         | Perfil y permisos         |
| PUT    | `/api/v1/users/me`                         | Actualizar perfil         |
| POST   | `/api/v1/users/me/change-password`         | Cambiar contraseña        |
| GET    | `/api/v1/audit/logs`                       | Logs de auditoría         |
| GET    | `/api/v1/audit/entity/{type}/{id}/history` | Historial de entidad      |
| GET    | `/api/v1/audit/dashboard`                  | Dashboard de auditoría    |

---

_Última actualización: 2026-04-22 — Reescrita post-Party Model + Multi-Branch. Eliminados ejemplos de código JS/TS._
