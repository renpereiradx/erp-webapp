# Guía de API de Seguridad para Frontend

## 🔧 Configuración General

### Base URL

```
http://localhost:5050
```

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
- Query params: `YYYY-MM-DD`

### Paginación Estándar

`{ page, page_size, total_items, total_pages, has_next, has_prev }`

---

## Endpoints

### POST /login

**Descripción:** Inicia sesión y obtiene tokens de acceso.

#### Headers

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Content-Type | Sí | `application/json` |

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| email | string | Sí | Correo electrónico |
| password | string | Sí | Contraseña |

#### Response 200

| Campo | Tipo | Descripción |
|-------|------|-------------|
| token | string | Access token JWT (válido 15 minutos) |
| role_id | string | ID del rol del usuario |
| role_name | string | Nombre del rol |
| allowed_branches | int[] | Sucursales permitidas |
| active_branch | int \| null | Sucursal default del usuario |

#### Response 429 (Rate Limit)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `false` |
| error.code | string | `RATE_LIMIT_EXCEEDED` |
| error.message | string | Mensaje descriptivo |
| retry_after | int | Segundos para reintentar |

#### Errores

| Código | Condición |
|--------|-----------|
| 400 | Body inválido o campos requeridos faltantes |
| 401 | Credenciales inválidas |
| 429 | Rate limit excedido (5 intentos por IP cada 15 minutos) |
| 500 | Error interno |

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

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | `Bearer <refresh_token>` |
| Content-Type | Sí | `application/json` |

#### Request Body (alternativa)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| refresh_token | string | No | Refresh token (si no se envía en header) |

#### Response 200

| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `true` |
| access_token | string | Nuevo access token |
| refresh_token | string | Nuevo refresh token (rotación) |
| token_type | string | `Bearer` |
| expires_in | int | Segundos de validez (default: 900) |

#### Response 401

| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `false` |
| error | string | `invalid refresh token` o `token has been revoked` |

#### Errores

| Código | Condición |
|--------|-----------|
| 400 | Refresh token faltante |
| 401 | Refresh token inválido, expirado o revocado |
| 500 | Error interno |

---

### POST /auth/logout

**Descripción:** Cierra la sesión actual.

#### Headers

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | `Bearer <access_token>` |

#### Response 200

| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `true` |
| message | string | Confirmación |

#### Errores

| Código | Condición |
|--------|-----------|
| 401 | Token ausente o inválido |
| 500 | Error interno |

---

### POST /auth/logout-all

**Descripción:** Cierra todas las sesiones activas del usuario.

#### Headers

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | `Bearer <access_token>` |

#### Response 200

| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `true` |
| message | string | Confirmación |

#### Errores

| Código | Condición |
|--------|-----------|
| 401 | Token ausente o inválido |
| 500 | Error interno |

---

### GET /api/v1/users/me

**Descripción:** Obtiene el perfil y permisos del usuario autenticado.

#### Headers

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | `Bearer <access_token>` |

#### Response 200

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | ID del usuario |
| email | string | Correo electrónico |
| username | string | Nombre de usuario |
| role_id | string | ID del rol |
| role_name | string | Nombre del rol |
| permissions | array | Lista de permisos (`recurso:acción`) |
| allowed_branches | int[] | Sucursales permitidas |
| active_branch | int \| null | Sucursal default |
| created_at | datetime | Fecha de creación |
| updated_at | datetime | Fecha de actualización |

#### Errores

| Código | Condición |
|--------|-----------|
| 401 | Token ausente o inválido |
| 500 | Error interno |

---

### PUT /api/v1/users/me

**Descripción:** Actualiza el perfil del usuario autenticado.

#### Headers

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | `Bearer <access_token>` |
| Content-Type | Sí | `application/json` |

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| email | string | No | Nuevo correo |
| username | string | No | Nuevo nombre de usuario |

#### Response 200

Perfil actualizado.

#### Errores

| Código | Condición |
|--------|-----------|
| 400 | Body inválido |
| 401 | Token ausente o inválido |
| 409 | Email ya existe |
| 500 | Error interno |

---

### POST /api/v1/users/me/change-password

**Descripción:** Cambia la contraseña del usuario autenticado.

#### Headers

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | `Bearer <access_token>` |
| Content-Type | Sí | `application/json` |

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| current_password | string | Sí | Contraseña actual |
| new_password | string | Sí | Nueva contraseña (mínimo 6 caracteres) |

#### Response 200

| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `true` |
| message | string | Confirmación |

#### Errores

| Código | Condición |
|--------|-----------|
| 400 | Contraseña actual incorrecta o nueva contraseña inválida |
| 401 | Token ausente o inválido |
| 429 | Rate limit excedido (3 cambios por hora) |
| 500 | Error interno |

---

## Rate Limiting

### Configuración por Endpoint

| Endpoint | Límite | Ventana | Identificador |
|----------|--------|---------|---------------|
| `POST /login` | 5 intentos | 15 minutos | IP |
| `POST /api/v1/users/me/change-password` | 3 cambios | 1 hora | Usuario |
| `POST /api/v1/users` | 10 creaciones | 1 hora | Usuario admin |
| API general | 100 requests | 1 minuto | IP |

### Headers de Rate Limit

En respuestas exitosas, la API incluye:

| Header | Descripción |
|--------|-------------|
| `X-RateLimit-Limit` | Límite total |
| `X-RateLimit-Remaining` | Requests restantes |
| `X-RateLimit-Reset` | Timestamp de reset |

### Response 429

| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | bool | `false` |
| error.code | string | `RATE_LIMIT_EXCEEDED` |
| error.message | string | Mensaje descriptivo |
| retry_after | int | Segundos para reintentar |

---

## Autorización RBAC

### Roles del Sistema (6 roles)

| Rol | ID | Tipo | Descripción |
|-----|----|------|-------------|
| `ADMIN` | `F2VLso` | Interno | Acceso total a todo el sistema |
| `VENDOR` | `VNDR01` | Interno | Ventas, caja, reservas, presupuestos |
| `BUYER` | `BUYR01` | Interno | Compras, procurement, reportes financieros |
| `INVENTORY` | `SUPL01` | Interno | Stock, manufactura, transferencias entre sucursales |
| `SUPPLIER` | `SUPLR01` | Externo | Ver sus órdenes de compra y pagos recibidos |
| `CLIENT` | `CLNT01` | Externo | Ver productos, sus ventas, dashboard |

> **Nota histórica:** El rol `INVENTORY` (ID `SUPL01`) anteriormente se llamaba `SUPPLIES`. El ID canónico no cambia para no romper tokens JWT ni foreign keys.

### Permisos de Módulo (35 permisos, IDs 106-140)

El backend protege cada módulo de la API con permisos en formato `recurso:acción`:

| Permiso | Descripción |
|---------|-------------|
| `products:read` | Ver productos, categorías, precios |
| `products:write` | Crear/editar/eliminar productos, precios, costos |
| `sales:read` | Ver ventas y detalles de ventas |
| `sales:write` | Crear/editar/cancelar ventas |
| `purchases:read` | Ver compras y detalles de compras |
| `purchases:write` | Crear/editar/cancelar compras |
| `inventory:read` | Ver stock, inventario, transacciones de stock |
| `inventory:write` | Gestionar inventario, ajustes manuales |
| `dashboard:read` | Ver dashboard, KPIs, tendencias |
| `receivables:read` | Ver cuentas por cobrar, aging, estadísticas |
| `payables:read` | Ver cuentas por pagar, cash-flow, proveedores |
| `reports:read` | Ver reportes financieros, IVA, márgenes |
| `analytics:read` | Ver analíticas: ventas, inventario, rentabilidad |
| `parties:read` | Ver clientes/proveedores (parties) |
| `parties:write` | Crear/editar clientes/proveedores |
| `cash:read` | Ver cajas, movimientos, arqueos |
| `cash:write` | Abrir/cerrar cajas, procesar pagos en caja |
| `reserves:read` | Ver reservas, horarios disponibles |
| `reserves:write` | Crear/confirmar/cancelar reservas |
| `manufacturing:read` | Ver manufactura, recetas, insumos |
| `manufacturing:write` | Operar manufactura, producción, compras de insumos |
| `budgets:read` | Ver presupuestos/cotizaciones |
| `budgets:write` | Crear/editar/convertir presupuestos |
| `transfers:read` | Ver transferencias entre sucursales |
| `transfers:write` | Crear/gestionar transferencias |
| `branches:read` | Ver sucursales, config fiscal |
| `branches:write` | Crear/editar sucursales (ADMIN only) |
| `tax:read` | Ver tasas y clasificaciones fiscales |
| `tax:write` | Crear/editar tasas fiscales |
| `payments:read` | Ver pagos, métodos, monedas, tipos de cambio |
| `payments:write` | Procesar pagos, crear métodos/monedas |
| `schedules:read` | Ver horarios y configuración de horarios |
| `schedules:write` | Generar/editar horarios |
| `audit:read` | Ver registros de auditoría, actividad de usuarios |
| `users:write` | Crear/editar/eliminar usuarios y asignar roles |

### Matriz Rol × Permiso

| Permiso | ADMIN | VENDOR | BUYER | INVENTORY | SUPPLIER | CLIENT |
|---------|:-----:|:------:|:-----:|:---------:|:--------:|:------:|
| `products:read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `products:write` | ✓ | | ✓ | | | |
| `sales:read` | ✓ | ✓ | | | | ✓ |
| `sales:write` | ✓ | ✓ | | | | |
| `purchases:read` | ✓ | | ✓ | | ✓ | |
| `purchases:write` | ✓ | | ✓ | | | |
| `inventory:read` | ✓ | | ✓ | ✓ | | |
| `inventory:write` | ✓ | | | ✓ | | |
| `dashboard:read` | ✓ | ✓ | ✓ | ✓ | | ✓ |
| `receivables:read` | ✓ | ✓ | | | | ✓ |
| `payables:read` | ✓ | | ✓ | | | |
| `reports:read` | ✓ | ✓ | ✓ | | | |
| `analytics:read` | ✓ | ✓ | ✓ | ✓ | | |
| `parties:read` | ✓ | ✓ | ✓ | ✓ | | |
| `parties:write` | ✓ | | ✓ | | | |
| `cash:read` | ✓ | ✓ | | | | |
| `cash:write` | ✓ | ✓ | | | | |
| `reserves:read` | ✓ | ✓ | ✓ | ✓ | | ✓ |
| `reserves:write` | ✓ | ✓ | | | | |
| `manufacturing:read` | ✓ | | ✓ | ✓ | | |
| `manufacturing:write` | ✓ | | ✓ | ✓ | | |
| `budgets:read` | ✓ | ✓ | | | | |
| `budgets:write` | ✓ | ✓ | | | | |
| `transfers:read` | ✓ | | ✓ | ✓ | | |
| `transfers:write` | ✓ | | ✓ | | | |
| `branches:read` | ✓ | ✓ | ✓ | ✓ | | |
| `branches:write` | ✓ | | | | | |
| `tax:read` | ✓ | | ✓ | | | |
| `tax:write` | ✓ | | | | | |
| `payments:read` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `payments:write` | ✓ | ✓ | ✓ | | | |
| `schedules:read` | ✓ | ✓ | ✓ | ✓ | | |
| `schedules:write` | ✓ | ✓ | | | | |
| `audit:read` | ✓ | | | | | |
| `users:read` | ✓ | | | | | |
| `users:write` | ✓ | | | | | |
| `sessions:admin` | ✓ | | | | | |

> **Nota:** `users:read` es heredado de los permisos legacy 100-104. Los middleware de módulo solo verifican permisos `resource:action` (106+). Los permisos legacy 1-9 se mantienen para retrocompatibilidad con handlers que verifican inline.

### Cómo Funciona el Middleware de Permisos

Cada módulo de la API tiene un middleware `RequireModulePermission` aplicado por subrouter. El flujo de un request es:

```
Request → CheckAuthMiddleware (global, JWT + branch)
       → RequireModulePermission (subrouter, permisos)
       → Handler
```

#### Reglas del Middleware

1. `OPTIONS` → skip (CORS preflight)
2. Sin claims en contexto → skip (ruta whitelisteada en `NO_AUTH_NEEDED`)
3. `claims.RoleID == "F2VLso"` → skip (admin bypass total)
4. `GET` / `HEAD` → verifica `readPerm`
5. `POST` / `PUT` / `DELETE` / `PATCH` → verifica `writePerm`
6. `writePerm == ""` y método de escritura → `405 Method Not Allowed`
7. Sin permiso → `403 Forbidden`

#### Módulos de Solo Lectura

Algunos módulos son solo lectura (no tienen `writePerm`). Si un rol con `read` intenta escribir:

| Módulo | Read Perm | Write Perm |
|--------|-----------|------------|
| `/dashboard` | `dashboard:read` | — |
| `/receivables` | `receivables:read` | — |
| `/payables` | `payables:read` | — |
| `/financial-reports` | `reports:read` | — |
| `/sales-analytics` | `analytics:read` | — |
| `/inventory-analytics` | `analytics:read` | — |
| `/profitability` | `analytics:read` | — |
| `/forecast` | `analytics:read` | — |
| `/api/v1/forecast` | `analytics:read` | — |
| `/api/v1/audit` | `audit:read` | — |
| `/api/v1/permissions` | `users:read` | — |

### Rutas Públicas (Sin Permiso de Módulo)

Estas rutas no pasan por `RequireModulePermission`:

| Ruta | Requiere |
|------|----------|
| `/login` | Sin auth |
| `/health` | Sin auth |
| `/setup/status`, `/setup/initialize` | Sin auth |
| `/auth/refresh`, `/auth/logout`, `/auth/logout-all` | Auth (JWT) |
| `/categories` | Auth (whitelisted) |
| `/payments/bootstrap` | Auth |
| `/sessions/*` (gestión propia) | Auth |
| `/api/v1/users/me`, `/api/v1/users/me/change-password` | Auth |

### Errores de Autorización

| Código HTTP | Cuándo Ocurre | Respuesta del Backend |
|-------------|---------------|----------------------|
| `401` | Token ausente, inválido o expirado | `{"success":false,"error":{"code":"UNAUTHORIZED","message":"..."}}` |
| `403` | Usuario autenticado pero sin permiso para el módulo | `{"success":false,"error":{"code":"FORBIDDEN","message":"Sin permisos suficientes para acceder a este módulo"}}` |
| `405` | Módulo de solo lectura + intento de escritura | `{"success":false,"error":{"code":"FORBIDDEN","message":"Método no permitido para este módulo"}}` |

### Recomendaciones para el Frontend

#### 1. Obtener Permisos del Usuario

Use `GET /api/v1/users/me` para obtener los permisos del usuario autenticado:

```json
{
    "id": "abc123",
    "email": "john@example.com",
    "username": "johndoe",
    "role_id": "VNDR01",
    "role_name": "VENDOR",
    "permissions": [
        "products:read",
        "sales:read",
        "sales:write",
        "dashboard:read",
        "cash:read",
        "cash:write",
        "reserves:read",
        "reserves:write",
        "budgets:read",
        "budgets:write",
        "analytics:read",
        "parties:read",
        "payments:read",
        "payments:write",
        "schedules:read",
        "schedules:write",
        "branches:read"
    ],
    "allowed_branches": [1, 2],
    "active_branch": 1
}
```

#### 2. Ocultar/Mostrar Menús y Botones

El frontend debe usar los permisos del usuario para controlar la UI **sin depender exclusivamente del backend**:

| Si el usuario tiene... | Mostrar... |
|------------------------|-----------|
| `products:read` | Menú Productos, vista de lista |
| `products:write` | Botón "Nuevo Producto", "Editar", "Eliminar" |
| `sales:read` | Menú Ventas, vista de lista |
| `sales:write` | Botón "Nueva Venta", "Cancelar" |
| `purchases:read` | Menú Compras |
| `purchases:write` | Botón "Nueva Compra" |
| `inventory:read` | Menú Inventario, Stock |
| `inventory:write` | Botón "Ajustar Stock", "Nueva Transacción" |
| `cash:read` | Menú Cajas |
| `cash:write` | Botón "Abrir Caja", "Registrar Movimiento" |
| `dashboard:read` | Dashboard principal |
| `analytics:read` | Menú BI: analytics, reportes, pronósticos |
| `reports:read` | Reportes financieros |
| `audit:read` | Menú Auditoría |
| `users:read` | Menú Administración de Usuarios |
| `users:write` | Botón "Crear Usuario", "Asignar Rol" |

> **Regla de oro:** El frontend puede ocultar elementos de UI para mejor UX, pero el backend siempre valida. Nunca confíe solo en el frontend para seguridad.

#### 3. Manejo de Errores 403/405

| Escenario | Acción del Frontend |
|-----------|---------------------|
| `403` al cargar un módulo | Redirigir a página de "Sin Acceso" o dashboard |
| `403` al intentar una acción | Mostrar toast/snackbar: "No tienes permisos para esta acción" |
| `405` en módulo de solo lectura | Deshabilitar botones de escritura previamente (usando permisos) |

#### 4. Roles Externos (SUPPLIER / CLIENT)

- `SUPPLIER` tiene acceso limitado: solo `purchases:read` y `payments:read`. En una fase posterior el backend filtrará por `party_id` para que solo vea sus propios datos.
- `CLIENT` tiene acceso a `products:read`, `sales:read`, `dashboard:read`, `receivables:read`, `analytics:read`, `reserves:read`. El dashboard y las ventas ya se filtran por `party_id`/`branch_id` en los handlers de BI.

---

## Auditoría

### GET /api/v1/audit/logs

**Descripción:** Lista logs de auditoría.

#### Headers

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | `Bearer <jwt_token>` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| user_id | string | No | Filtrar por usuario |
| category | string | No | Filtrar por categoría (`AUTH`, `USER`, `SALE`, `PURCHASE`) |
| action | string | No | Filtrar por acción (`user:create`, `user:update`, etc.) |
| start_date | datetime | No | Fecha inicio |
| end_date | datetime | No | Fecha fin |
| page | int | No | Número de página |
| page_size | int | No | Tamaño de página (max: 100) |

#### Response 200

| Campo | Tipo | Descripción |
|-------|------|-------------|
| data | array | Lista de logs |
| pagination | object | Información de paginación |

**Log Entry:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del log |
| user_id | string | Usuario que ejecutó la acción |
| branch_id | int | ID de sucursal donde ocurrió el evento (nullable) |
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

| Código | Condición |
|--------|-----------|
| 401 | Token ausente o inválido |
| 403 | Sin permiso `audit:read` |
| 500 | Error interno |

---

### GET /api/v1/audit/entity/{entity_type}/{entity_id}/history

**Descripción:** Historial de cambios de una entidad específica.

#### Headers

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | `Bearer <jwt_token>` |

#### Path Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| entity_type | string | Sí | Tipo: `USER`, `SALE`, `PRODUCT`, etc. |
| entity_id | string | Sí | ID de la entidad |

#### Response 200

| Campo | Tipo | Descripción |
|-------|------|-------------|
| data | array | Lista de cambios |

**Change Entry:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del cambio |
| branch_id | int | ID de sucursal donde ocurrió el cambio (nullable) |
| action | string | Acción realizada |
| user_id | string | Usuario que realizó el cambio |
| user_name | string | Nombre del usuario |
| created_at | datetime | Fecha del cambio |
| old_values | object | Valores anteriores |
| new_values | object | Valores nuevos |

#### Errores

| Código | Condición |
|--------|-----------|
| 401 | Token ausente o inválido |
| 403 | Sin permiso `audit:read` |
| 404 | Entidad no encontrada |
| 500 | Error interno |

---

### GET /api/v1/audit/dashboard

**Descripción:** Dashboard de auditoría con resumen de eventos.

#### Headers

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | `Bearer <jwt_token>` |

#### Response 200

| Campo | Tipo | Descripción |
|-------|------|-------------|
| summary.total_events | int | Total de eventos |
| summary.events_today | int | Eventos hoy |
| summary.events_this_week | int | Eventos esta semana |
| summary.events_this_month | int | Eventos este mes |
| by_category | object | Conteo por categoría |
| by_action | object | Conteo por acción |
| top_users | array | Usuarios con más eventos |

#### Errores

| Código | Condición |
|--------|-----------|
| 401 | Token ausente o inválido |
| 403 | Sin permiso `audit:read` |
| 500 | Error interno |

---

## Claims JWT

El payload del JWT contiene:

| Claim | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | string | ID del usuario |
| `role_id` | string | Rol del usuario |
| `session_id` | int64 | ID de sesión |
| `token_type` | string | `access` o `refresh` |
| `allowed_branches` | int[] | Sucursales permitidas |
| `active_branch` | int \| null | Sucursal default |
| `exp` | int64 | Timestamp de expiración |
| `iat` | int64 | Timestamp de emisión |

---

## Errores Comunes

| Código HTTP | Código Error | Descripción |
|-------------|--------------|-------------|
| 400 | `INVALID_PASSWORD` | Contraseña inválida (mínimo 6 caracteres) |
| 401 | `UNAUTHORIZED` | Token inválido o expirado |
| 401 | `INVALID_REFRESH_TOKEN` | Refresh token inválido o revocado |
| 403 | `FORBIDDEN` | Sin permisos suficientes |
| 403 | `forbidden branch_id` | Sucursal fuera de `allowed_branches` |
| 400 | `invalid branch_id` | `branch_id` no es entero positivo |
| 429 | `RATE_LIMIT_EXCEEDED` | Límite de requests excedido |

> **Nota:** Además de los códigos HTTP anteriores, algunos endpoints devuelven códigos de error internos en `error.code`.

---

## Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/login` | Iniciar sesión |
| POST | `/auth/refresh` | Refrescar access token |
| POST | `/auth/logout` | Cerrar sesión actual |
| POST | `/auth/logout-all` | Cerrar todas las sesiones |
| GET | `/api/v1/users/me` | Perfil y permisos |
| PUT | `/api/v1/users/me` | Actualizar perfil |
| POST | `/api/v1/users/me/change-password` | Cambiar contraseña |
| GET | `/api/v1/audit/logs` | Logs de auditoría |
| GET | `/api/v1/audit/entity/{type}/{id}/history` | Historial de entidad |
| GET | `/api/v1/audit/dashboard` | Dashboard de auditoría |

---

_Última actualización: 2026-05-19 (RBAC por Módulo implementado)_
