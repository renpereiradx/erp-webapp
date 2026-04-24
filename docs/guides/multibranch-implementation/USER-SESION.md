# Guía de API de Usuarios y Sesiones para Frontend

## Base URL

`http://localhost:5050`

## Autenticación

- Header: `Authorization: Bearer <jwt_token>`

## Contexto de Sucursal

Los endpoints de autenticación (`/login`, `/auth/*`) no requieren `branch_id`. Sin embargo, el token JWT devuelto incluye claims de sucursal (`allowed_branches`, `active_branch`) que el frontend debe usar para endpoints transaccionales y BI. Ver `MULTI_BRANCH_CONTEXT_GUIDE.md`.

---

## Endpoints

### POST /login

**Descripción:** Autentica un usuario y devuelve tokens JWT con claims de sucursal.

#### Headers

| Header       | Requerido | Descripción        |
| ------------ | --------- | ------------------ |
| Content-Type | Sí        | `application/json` |

#### Request Body

| Campo    | Tipo   | Requerido   | Descripción                                          |
| -------- | ------ | ----------- | ---------------------------------------------------- |
| username | string | Condicional | Nombre de usuario (requerido si no se envía `email`) |
| email    | string | Condicional | Email (requerido si no se envía `username`)          |
| password | string | Sí          | Contraseña                                           |

#### Response 200

| Campo            | Tipo        | Descripción                                         |
| ---------------- | ----------- | --------------------------------------------------- |
| token            | string      | JWT de acceso                                       |
| role_id          | string      | ID del rol principal del usuario                    |
| role_name        | string      | Nombre legible del rol (ej: `ADMIN`, `Vendedor`)    |
| allowed_branches | int[]       | IDs de sucursales a las que el usuario tiene acceso |
| active_branch    | int \| null | Sucursal activa/default del usuario                 |

#### Errores

| Código | Condición                         |
| ------ | --------------------------------- |
| 400    | Ni `username` ni `email` enviados |
| 404    | Usuario no encontrado             |
| 500    | Error interno de autenticación    |

#### Notas

- `allowed_branches` y `active_branch` se resuelen desde `users.user_branch_access` en el momento del login.
- `active_branch` apunta a la sucursal marcada como `is_default_branch = true`; si no hay default, es la primera de `allowed_branches` ordenada ascendentemente.
- Si el usuario no tiene accesos configurados, ambos campos pueden ser `null` o ausentes (legacy).

---

### POST /auth/refresh

**Descripción:** Renueva el access token usando el refresh token.

#### Headers

| Header       | Requerido | Descripción        |
| ------------ | --------- | ------------------ |
| Content-Type | Sí        | `application/json` |

#### Request Body

| Campo         | Tipo   | Requerido | Descripción       |
| ------------- | ------ | --------- | ----------------- |
| refresh_token | string | Sí        | JWT refresh token |

#### Response 200

| Campo         | Tipo   | Descripción                                          |
| ------------- | ------ | ---------------------------------------------------- |
| success       | bool   | `true` si la operación fue exitosa                   |
| access_token  | string | Nuevo JWT de acceso                                  |
| refresh_token | string | Nuevo JWT refresh                                    |
| token_type    | string | `"Bearer"`                                           |
| expires_in    | int64  | Duración del access token en segundos (default: 900) |

#### Response 400/401

| Campo   | Tipo   | Descripción           |
| ------- | ------ | --------------------- |
| success | bool   | `false`               |
| error   | string | Descripción del error |

#### Errores

| Código | Condición                                                    |
| ------ | ------------------------------------------------------------ |
| 400    | `refresh_token` faltante                                     |
| 401    | Token inválido, expirado, revocado, o no es un refresh token |
| 500    | Error al generar nuevo token pair o al actualizar sesión     |

#### Notas

- Al refrescar, `allowed_branches` y `active_branch` se recalculan desde la base de datos.
- El refresh token anterior se invalida (blacklist) y se genera un par nuevo.

---

### POST /auth/logout

**Descripción:** Cierra la sesión actual invalidando el token.

#### Headers

| Header        | Requerido | Descripción                        |
| ------------- | --------- | ---------------------------------- |
| Authorization | Sí        | Bearer token (access token actual) |

#### Response 200

| Campo   | Tipo   | Descripción                 |
| ------- | ------ | --------------------------- |
| success | bool   | `true`                      |
| message | string | `"logged out successfully"` |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token inválido o ausente |

---

### POST /auth/logout-all

**Descripción:** Cierra todas las sesiones activas del usuario.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 200

| Campo            | Tipo   | Descripción                           |
| ---------------- | ------ | ------------------------------------- |
| success          | bool   | `true`                                |
| sessions_revoked | int    | Cantidad de sesiones revocadas        |
| message          | string | `"all sessions revoked successfully"` |

#### Errores

| Código | Condición                 |
| ------ | ------------------------- |
| 401    | Token inválido o ausente  |
| 500    | Error al revocar sesiones |

---

## Claims JWT

### Claims presentes en el token de acceso

| Claim            | Tipo        | Descripción                |
| ---------------- | ----------- | -------------------------- |
| user_id          | string      | ID del usuario autenticado |
| role_id          | string      | ID del rol principal       |
| session_id       | int64       | ID de sesión activa        |
| token_type       | string      | `"access"` o `"refresh"`   |
| allowed_branches | int[]       | Sucursales permitidas      |
| active_branch    | int \| null | Sucursal activa/default    |
| exp              | int64       | Timestamp de expiración    |
| iat              | int64       | Timestamp de emisión       |
| jti              | string      | ID único del token         |

### Uso de claims de sucursal en frontend

- **Almacenar** `allowed_branches` y `active_branch` tras el login para usar en UI de selección de sucursal.
- **Enviar** `branch_id` como query param o `X-Branch-ID` como header en endpoints transaccionales y BI.
- **Cambiar** de sucursal enviando un `branch_id` diferente sin necesidad de refrescar el token.
- **Validar** que la sucursal seleccionada esté en `allowed_branches` antes de enviarla (evita 403).

---

## Endpoints de Usuarios (Administración)

Base path: `/api/v1/users`

### GET /api/v1/users

**Descripción:** Lista usuarios con filtros y paginación.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Query Parameters

| Parámetro    | Tipo   | Requerido | Descripción                                  |
| ------------ | ------ | --------- | -------------------------------------------- |
| search       | string | No        | Búsqueda por nombre, email o username        |
| status       | string | No        | `active`, `inactive`, `suspended`, `pending` |
| role_id      | string | No        | Filtrar por rol                              |
| created_from | string | No        | Fecha inicio (YYYY-MM-DD)                    |
| created_to   | string | No        | Fecha fin (YYYY-MM-DD)                       |
| sort_by      | string | No        | Campo de ordenamiento                        |
| sort_order   | string | No        | `asc` o `desc`                               |
| page         | int    | No        | Número de página (default: 1)                |
| page_size    | int    | No        | Items por página (max: 100, default: 20)     |

#### Response 200

| Campo      | Tipo     | Descripción                                                         |
| ---------- | -------- | ------------------------------------------------------------------- |
| success    | bool     | `true`                                                              |
| data       | object[] | Lista de usuarios                                                   |
| pagination | object   | `{ page, page_size, total_items, total_pages, has_next, has_prev }` |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token inválido o ausente |
| 500    | Error interno            |

---

### GET /api/v1/users/{id}

**Descripción:** Obtiene un usuario por ID.

#### Response 200

| Campo   | Tipo   | Descripción      |
| ------- | ------ | ---------------- |
| success | bool   | `true`           |
| data    | object | Usuario completo |

#### Errores

| Código | Condición             |
| ------ | --------------------- |
| 401    | Token inválido        |
| 404    | Usuario no encontrado |
| 500    | Error interno         |

---

### POST /api/v1/users

**Descripción:** Crea un nuevo usuario.

#### Request Body

| Campo      | Tipo     | Requerido | Descripción                      |
| ---------- | -------- | --------- | -------------------------------- |
| first_name | string   | Sí        | Nombre                           |
| last_name  | string   | Sí        | Apellido                         |
| email      | string   | Sí        | Email                            |
| username   | string   | Sí        | Nombre de usuario                |
| password   | string   | Sí        | Contraseña (mínimo 6 caracteres) |
| phone      | string   | No        | Teléfono                         |
| status     | string   | No        | `active`, `inactive`, etc.       |
| role_ids   | string[] | No        | IDs de roles a asignar           |

#### Response 201/200

| Campo   | Tipo   | Descripción             |
| ------- | ------ | ----------------------- |
| success | bool   | `true`                  |
| data    | object | Usuario creado          |
| message | string | Mensaje de confirmación |

---

### PUT /api/v1/users/{id}

**Descripción:** Actualiza un usuario.

#### Request Body

| Campo      | Tipo   | Requerido | Descripción   |
| ---------- | ------ | --------- | ------------- |
| first_name | string | No        | Nombre        |
| last_name  | string | No        | Apellido      |
| email      | string | No        | Email         |
| phone      | string | No        | Teléfono      |
| avatar_url | string | No        | URL de avatar |

---

### DELETE /api/v1/users/{id}

**Descripción:** Elimina un usuario (soft delete).

#### Response 200

| Campo   | Tipo   | Descripción  |
| ------- | ------ | ------------ |
| success | bool   | `true`       |
| message | string | Confirmación |

---

### POST /api/v1/users/{id}/activate

**Descripción:** Activa un usuario.

#### Response 200

| Campo   | Tipo   | Descripción      |
| ------- | ------ | ---------------- |
| success | bool   | `true`           |
| data    | object | `{ id, status }` |
| message | string | Confirmación     |

---

### POST /api/v1/users/{id}/deactivate

**Descripción:** Desactiva un usuario.

#### Response 200

Igual schema que activate.

---

### POST /api/v1/users/{id}/change-password

**Descripción:** Cambia la contraseña de un usuario (admin).

#### Request Body

| Campo        | Tipo   | Requerido | Descripción                                      |
| ------------ | ------ | --------- | ------------------------------------------------ |
| new_password | string | Sí        | Nueva contraseña                                 |
| force_logout | bool   | No        | Si `true`, revoca todas las sesiones del usuario |

#### Response 200

| Campo            | Tipo   | Descripción                    |
| ---------------- | ------ | ------------------------------ |
| success          | bool   | `true`                         |
| message          | string | Confirmación                   |
| sessions_revoked | int    | Cantidad de sesiones revocadas |

---

### GET /api/v1/users/{id}/roles

**Descripción:** Obtiene los roles de un usuario.

#### Response 200

| Campo   | Tipo     | Descripción                   |
| ------- | -------- | ----------------------------- |
| success | bool     | `true`                        |
| data    | object[] | Lista de roles `{ id, name }` |

---

### POST /api/v1/users/{id}/roles

**Descripción:** Asigna un rol a un usuario.

#### Request Body

| Campo   | Tipo   | Requerido | Descripción |
| ------- | ------ | --------- | ----------- |
| role_id | string | Sí        | ID del rol  |

---

### DELETE /api/v1/users/{id}/roles/{roleId}

**Descripción:** Remueve un rol de un usuario.

---

### GET /api/v1/users/me

**Descripción:** Obtiene el perfil del usuario autenticado.

#### Response 200

| Campo   | Tipo   | Descripción                             |
| ------- | ------ | --------------------------------------- |
| success | bool   | `true`                                  |
| data    | object | Perfil completo del usuario autenticado |

---

### PUT /api/v1/users/me

**Descripción:** Actualiza el perfil del usuario autenticado.

---

### POST /api/v1/users/me/change-password

**Descripción:** Cambia la contraseña del usuario autenticado.

#### Request Body

| Campo                 | Tipo   | Requerido | Descripción                      |
| --------------------- | ------ | --------- | -------------------------------- |
| current_password      | string | Sí        | Contraseña actual                |
| new_password          | string | Sí        | Nueva contraseña                 |
| logout_other_sessions | bool   | No        | Si `true`, cierra otras sesiones |

---

## Endpoints de Sesiones

Base path: `/sessions`

### GET /sessions/active

**Descripción:** Obtiene las sesiones activas del usuario actual.

#### Response 200

| Campo   | Tipo     | Descripción               |
| ------- | -------- | ------------------------- |
| success | bool     | `true`                    |
| data    | object[] | Lista de sesiones activas |
| count   | int      | Cantidad de sesiones      |

---

### GET /sessions/history

**Descripción:** Obtiene el historial de sesiones del usuario.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción                    |
| --------- | ---- | --------- | ------------------------------ |
| page      | int  | No        | Página (default: 1)            |
| page_size | int  | No        | Items por página (default: 20) |

---

### POST /sessions/{id}/revoke

**Descripción:** Revoca una sesión específica del usuario actual.

---

### POST /sessions/revoke-all

**Descripción:** Revoca todas las sesiones del usuario excepto la actual.

#### Response 200

| Campo         | Tipo   | Descripción                    |
| ------------- | ------ | ------------------------------ |
| success       | bool   | `true`                         |
| message       | string | Confirmación                   |
| revoked_count | int    | Cantidad de sesiones revocadas |

---

### GET /sessions/activity

**Descripción:** Obtiene el log de actividad del usuario.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción                    |
| --------- | ---- | --------- | ------------------------------ |
| page      | int  | No        | Página (default: 1)            |
| page_size | int  | No        | Items por página (default: 20) |

---

### GET /sessions/config

**Descripción:** Obtiene la configuración de sesión para el rol del usuario.

#### Response 200

| Campo   | Tipo   | Descripción                                                                                                                                                                         |
| ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| success | bool   | `true`                                                                                                                                                                              |
| data    | object | `{ role_id, max_concurrent_sessions, session_timeout_minutes, inactivity_timeout_minutes, require_device_verification, allow_multiple_locations, force_logout_on_password_change }` |

---

### POST /sessions/cleanup

**Descripción:** Limpia sesiones expiradas (requiere permiso `sessions:admin`).

#### Response 200

| Campo         | Tipo   | Descripción                    |
| ------------- | ------ | ------------------------------ |
| success       | bool   | `true`                         |
| message       | string | Confirmación                   |
| cleaned_count | int    | Cantidad de sesiones limpiadas |

---

## Administración de Sesiones (Admin)

Base path: `/admin/sessions`

### GET /admin/sessions/all

**Descripción:** Obtiene todas las sesiones activas (solo admin, requiere permiso `sessions:admin`).

---

### POST /admin/sessions/{id}/revoke

**Descripción:** Revoca una sesión de cualquier usuario (solo admin).

---

## Notas

- **Auto-registro:** `/signup` está deshabilitado. Los usuarios solo pueden ser creados por administradores via `POST /api/v1/users`.
- **Base URL:** Todos los endpoints usan `http://localhost:5050` como base. No hay prefijo `/api` global; cada grupo de endpoints tiene su propio path.
- **Claims de sucursal:** El login response incluye `allowed_branches` y `active_branch`. El frontend debe almacenarlos para usar en otros módulos.
- **Header X-Branch-ID:** Ver `MULTI_BRANCH_CONTEXT_GUIDE.md` para detalles de cómo enviar contexto de sucursal en otros endpoints.
- **Token refresh:** Implementar interceptor que capture 401, llame a `/auth/refresh`, y reintente la request original.
- **Paginación:** `page_size` máximo recomendado: 100.
- **Permisos de admin:** Los endpoints bajo `/admin/*` y `/api/v1/users` requieren rol administrativo.

---

_Última actualización: 2026-04-22_
