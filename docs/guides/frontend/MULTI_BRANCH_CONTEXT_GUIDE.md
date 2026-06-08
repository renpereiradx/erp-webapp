# Guía de Contexto Multi-Sucursal para Frontend

## Base URL

`http://localhost:5050`

## Autenticación

- Header: `Authorization: Bearer <jwt_token>`

Los formatos de headers, fechas, estructura de respuesta y paginación siguen el estándar de la API.

## Contexto de Sucursal

Todas las operaciones transaccionales y de inteligencia de negocio (BI) requieren contexto de sucursal. El sistema resuelve la sucursal activa mediante la siguiente jerarquía:

1. **Query param:** `?branch_id=<id>` (prioridad)
2. **Header:** `X-Branch-ID: <id>`
3. **Fallback:** `active_branch` del token JWT
4. **Fallback final:** Primera sucursal en `allowed_branches` (ordenada ascendentemente)

> **Importante:** Los usuarios con rol **ADMIN** (`role_id = "F2VLso"`) no tienen restricción de `allowed_branches`. Pueden seleccionar cualquier sucursal sin validación contra su JWT. Esto aplica tanto a `resolveBranchContextFromAuth` como a `resolveBIContextFromAuth` y a `hasBranchAccess`.

---

## Claims JWT

### Obtener `active_branch` y `allowed_branches`

Decodificar el payload del JWT (segunda parte del token, base64). Los claims relevantes son:

| Claim | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | string | ID del usuario autenticado |
| `role_id` | string | Rol del usuario. La comparación en código usa el ID canónico (`"F2VLso"` para ADMIN, `"BUYR01"` para BUYER, `"VNDR01"` para VENDOR, etc.). Nombres de display: `ADMIN`, `BUYER`, `SUPPLIES`, `VENDOR`, `CLIENT`. |
| `session_id` | int64 | ID de sesión activa |
| `token_type` | string | `access` o `refresh` |
| `allowed_branches` | int[] | Lista de IDs de sucursales a las que el usuario tiene acceso |
| `active_branch` | int \| null | Sucursal marcada como default en `users.user_branch_access`; si no hay default, es la primera de `allowed_branches` |

### Comportamiento de `active_branch`

- Si el usuario **no tiene accesos configurados** (`allowed_branches` vacío o null), el sistema no aplica restricción de sucursal (legacy behavior).
- Si el usuario **tiene accesos configurados**, `active_branch` apunta a la sucursal default (`is_default_branch = true`).
- Si no hay sucursal default, `active_branch` es la primera de `allowed_branches` ordenada ascendentemente.

---

## Mecanismo de Resolución de Sucursal

### `resolveBranchContextFromAuth` — Endpoints Transaccionales

Usado en: Ventas, Compras, Presupuestos, Caja, Reservas, Productos, Ajustes de Inventario, Órdenes de Reabastecimiento, Auditorías, Transferencias, Manufactura, Transacciones de Precio, Ajustes Manuales.

#### Headers

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | No | ID de sucursal explícita. Prioridad sobre header. |

#### Resolución

1. Si el usuario es **ADMIN** (`role_id = "F2VLso"`): toda la validación de `allowed_branches` se omite. El admin puede seleccionar cualquier sucursal sin restricción. Si no se envía explícitamente, se usa `active_branch` del JWT (sin validación contra `allowed_branches`).
2. Si se envía `?branch_id` o `X-Branch-ID` (non-ADMIN): validar que sea entero positivo.
3. Si el usuario tiene `allowed_branches` configurados (non-ADMIN):
   - La sucursal solicitada **debe estar en `allowed_branches`**. Si no: `403 Forbidden`.
4. Si no se envía explícitamente (non-ADMIN):
   - Fallback a `active_branch` del JWT.
   - Si `active_branch` no es válido o no está en `allowed_branches`: fallback a la primera de `allowed_branches`.
5. Si no hay `allowed_branches` ni `active_branch`: `branchID` puede ser `nil` (sin restricción).

#### Errores

| Código | Condición |
|--------|-----------|
| 401 Unauthorized | Token inválido o ausente |
| 400 Bad Request | `branch_id` no es un entero positivo válido |
| 403 Forbidden | `branch_id` explícito está fuera de `allowed_branches` (solo non-ADMIN) |

---

### `resolveBIContextFromAuth` — Endpoints de Inteligencia de Negocio (BI)

Usado en: Dashboard, Cuentas por Cobrar, Cuentas por Pagar, Reportes Financieros, Análisis de Ventas, Análisis de Inventario, Costos, Forecast, Profitability.

#### Headers

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| branch_id | int | Ver notas | Requerido para usuarios non-ADMIN |

#### Resolución

1. Ejecuta `resolveBranchContextFromAuth` primero (misma lógica de arriba, con exención ADMIN).
2. Luego aplica reglas adicionales:
   - **ADMIN** (ID canónico `"F2VLso"`, verificado via `claims.RoleID == constants.RoleAdmin`): puede omitir `branch_id`. Si lo omite, el BI no filtra por sucursal (visión global). Adicionalmente, ADMIN puede seleccionar cualquier sucursal sin restricción de `allowed_branches`.
   - **Non-ADMIN**:
     - Si no tiene `allowed_branches` configurados y envía un `branch_id` explícito: `403 Forbidden`.
     - Si `branchID` es `nil` (no envió explícito ni tiene fallback): `400 Bad Request` — "branch context required for BI".
     - Si `branchID` está fuera de `allowed_branches`: `403 Forbidden`.

#### Errores

| Código | Condición |
|--------|-----------|
| 401 Unauthorized | Token inválido o ausente |
| 400 Bad Request | `branch_id` inválido, o BI sin branch context para non-ADMIN |
| 403 Forbidden | `branch_id` fuera de `allowed_branches`, o non-ADMIN sin accesos configurados enviando branch explícito |

---

## Tabla Resumen: Módulos que Requieren Branch Context

| Módulo | Tipo de Contexto | Rol ADMIN puede omitir branch |
|--------|------------------|------------------------------|
| **Ventas** (`/sale/*`) | Transaccional | Sí (usa fallback) |
| **Compras** (`/purchase/*`) | Transaccional | Sí (usa fallback) |
| **Presupuestos** (`/budget/*`) | Transaccional | Sí (usa fallback) |
| **Caja** (`/cash-register/*`) | Transaccional | Sí (usa fallback) |
| **Reservas** (`/reserves/*`) | Transaccional | Sí (usa fallback) |
| **Productos** (`/products/*`, `/stock/*`) | Transaccional / Lectura | Sí (usa fallback) |
| **Ajustes de Inventario** (`/inventory/*`, `/manual-adjustment/*`) | Transaccional | Sí (usa fallback) |
| **Órdenes de Reabastecimiento** (`/purchase-requisition/*`) | Transaccional | Sí (usa fallback) |
| **Transferencias entre Sucursales** (`/branch-transfers/*`) | Transaccional | Sí (usa fallback) |
| **Manufactura** (`/manufacturing/*`) | Transaccional | Sí (usa fallback) |
| **Transacciones de Precio** (`/price-transactions/*`) | Transaccional | Sí (usa fallback) |
| **Auditoría** (`/audit/*`, `/cash-audit/*`) | Transaccional | Sí (usa fallback) |
| **Dashboard** (`/dashboard/*`) | BI | **Sí** (visión global) |
| **Cuentas por Cobrar** (`/receivables/*`) | BI | **Sí** (visión global) |
| **Cuentas por Pagar** (`/payables/*`) | BI | **Sí** (visión global) |
| **Reportes Financieros** (`/financial-reports/*`) | BI | **Sí** (visión global) |
| **Análisis de Ventas** (`/sales-analytics/*`) | BI | **Sí** (visión global) |
| **Análisis de Inventario** (`/inventory-analytics/*`) | BI | **Sí** (visión global) |
| **Costos** (`/costs/*`) | BI | **Sí** (visión global) |
| **Forecast** (`/forecast/*`) | BI | **Sí** (visión global) |
| **Profitability** (`/profitability/*`) | BI | **Sí** (visión global) |
| **Gestión de Sucursales** (`/branches/*`) | Administración | ADMIN: sin restricción (ve todas). Non-ADMIN: lectura filtrada por `allowed_branches` |

> **Nota sobre Clientes y Proveedores:** Los endpoints legacy `/client/` y `/supplier/` siguen funcionando, pero todo nuevo desarrollo debe usar la API unificada `/api/v1/parties`.

---

## Notas

- **Prioridad de envío:** `?branch_id` siempre tiene prioridad sobre `X-Branch-ID`.
- **Formato:** Ambos deben ser enteros positivos (`> 0`).
- **Sin accesos configurados:** Usuarios legacy sin entradas en `users.user_branch_access` no tienen restricción de sucursal en endpoints transaccionales, pero en BI pueden recibir `400` si no envían explícitamente un `branch_id`.
- **Cambio de sucursal activa:** El frontend puede cambiar la sucursal activa del usuario enviando un `branch_id` diferente en cada request. No es necesario refrescar el token JWT.
- **Token refresh:** Al refrescar el token, `allowed_branches` y `active_branch` se recalculan desde la base de datos (`users.user_branch_access`).
- **Soft delete de sucursales:** Las sucursales se desactivan con `PUT /branches/{id}` enviando `{"is_active": false}`. No existe endpoint DELETE. Se bloquea la desactivación si algún usuario tiene esa sucursal como default.
- **ADMIN sin restricción de sucursales:** Los administradores (`role_id = "F2VLso"`) no tienen validación de `allowed_branches` en ningún punto del sistema: ni en resolución de contexto (`parseOptionalBranchID`), ni en verificación de acceso (`hasBranchAccess`), ni en listado (`filterBranchesByClaims`). Pueden crear, ver y operar sobre cualquier sucursal sin necesidad de refrescar el token JWT.
- **Auto-grant al crear sucursal:** `POST /branches` otorga automáticamente al creador acceso `FULL` a la nueva sucursal mediante un registro en `users.user_branch_access`. Si el creador no tiene sucursal default, esta se marca como tal. Esto asegura que el creador pueda ver la sucursal inmediatamente después de crearla.

---

## Multi-Branch en Reservas — Detalle

### Operaciones de Escritura (POST /reserve/manage)

El endpoint `POST /reserve/manage` ahora es branch-aware:

| Accion | Valida branch ownership | Inyecta branch_id |
|--------|------------------------|-------------------|
| CREATE | No (asigna branch del contexto) | Si — del body, header o JWT |
| UPDATE | Si — la reserva debe pertenecer al branch | Si |
| CANCEL | Si — la reserva debe pertenecer al branch | Si |
| CONFIRM | Si — la reserva debe pertenecer al branch | Si |

**Jerarquia de branch_id:**
1. `branch_id` en el body JSON del request
2. Si no viene en body: `?branch_id=` query param o `X-Branch-ID` header
3. Si tampoco: `active_branch` del JWT

**Errores de branch ownership (403 implicito en el SQL):**
```json
{"success": false, "error": "Reservation 42 does not belong to branch 3", "action": "CONFIRM"}
```

### Operaciones de Lectura (GET /reserve/*)

Todos los endpoints GET de reservas filtran por `branch_id`:

| Endpoint | Parametro | Comportamiento sin branch |
|----------|-----------|--------------------------|
| `GET /reserve/{id}` | `?branch_id=` | Retorna la reserva solo si pertenece al branch |
| `GET /reserve/product/{id}` | `?branch_id=` | Lista reservas del producto en el branch |
| `GET /reserve/client/{id}` | `?branch_id=` | Lista reservas del cliente en el branch |
| `GET /reserve/all` | `?branch_id=` | Lista todas las reservas del branch |
| `GET /reserve/date-range` | `?branch_id=` | Lista reservas en rango del branch |
| `GET /reserve/client/name/{name}` | `?branch_id=` | Busqueda por nombre en el branch |
| `GET /reserve/report` | `?branch_id=` (+ `start_date`, `end_date`, etc.) | Reporte filtrado por branch |
| `GET /reserve/consistency/check` | `?branch_id=` | Diagnostica consistencia solo del branch |

### Horarios Disponibles (GET /reserve/available-schedules)

```bash
# Filtrar por sucursal
GET /reserve/available-schedules?product_id=CANCHA_01&date=2026-05-10&duration_hours=2&branch_id=1
```

Si se omite `branch_id`, retorna horarios de todas las sucursales (comportamiento legacy).

### Schedules con Informacion de Reserva

`GET /schedules/product/{productId}/date/{date}/all` ahora filtra por branch:

```bash
GET /schedules/product/CANCHA_01/date/2026-05-10/all?branch_id=2
```

Las reservas mostradas en los slots (`reserved_by`, `reserve_id`) corresponden exclusivamente al branch especificado.

### SQL Functions Branch-Aware

Las siguientes funciones SQL internas ahora aceptan `p_branch_id`:

| Function | Params | Default |
|----------|--------|---------|
| `manage_reserve` | 8 params (agregado `p_branch_id`) | `NULL` (fallback a user default branch) |
| `get_available_schedules` | 4 params (agregado `p_branch_id`) | `NULL` |
| `check_schedule_availability` | 4 params (agregado `p_branch_id`) | `NULL` |
| `is_reserve_available_for_sale` | 2 params (agregado `p_branch_id`) | `NULL` |
| `get_schedules_with_reservation_info` | 3 params (agregado `p_branch_id`) | `NULL` |
| `get_available_reserves` | 5 params (agregado `p_branch_id`) | `NULL` |

Todas las funciones usan `NULL` como default para `p_branch_id`, lo que mantiene retrocompatibilidad: si se omite, no filtra por branch.

---

_Última actualización: 2026-05-19 — Fusión documentación frontend/backend: jerarquía 4 niveles, role_id canónico F2VLso para ADMIN, rutas /products/*, sección detallada de reservas, soft delete de sucursales, permisos ADMIN, nota sobre API unificada /api/v1/parties._
