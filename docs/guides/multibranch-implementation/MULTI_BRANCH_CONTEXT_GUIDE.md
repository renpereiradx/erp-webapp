# Guía de Contexto Multi-Sucursal para Frontend

## Base URL

`http://localhost:5050`

## Autenticación

- Header: `Authorization: Bearer <jwt_token>`

## Contexto de Sucursal

Todas las operaciones transaccionales y de inteligencia de negocio (BI) requieren contexto de sucursal. El sistema resuelve la sucursal activa mediante la siguiente jerarquía:

1. **Query param:** `?branch_id=<id>`
2. **Header:** `X-Branch-ID: <id>`
3. **Fallback:** `active_branch` del token JWT
4. **Fallback final:** Primera sucursal en `allowed_branches` (ordenada ascendentemente)

---

## Claims JWT

### Obtener `active_branch` y `allowed_branches`

Decodificar el payload del JWT (segunda parte del token, base64). Los claims relevantes son:

| Claim              | Tipo        | Descripción                                                                                                         |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `user_id`          | string      | ID del usuario autenticado                                                                                          |
| `role_id`          | string      | Rol del usuario (ej: `admin`, `buyer`, `vendor`)                                                                    |
| `session_id`       | int64       | ID de sesión activa                                                                                                 |
| `token_type`       | string      | `access` o `refresh`                                                                                                |
| `allowed_branches` | int[]       | Lista de IDs de sucursales a las que el usuario tiene acceso                                                        |
| `active_branch`    | int \| null | Sucursal marcada como default en `users.user_branch_access`; si no hay default, es la primera de `allowed_branches` |

### Comportamiento de `active_branch`

- Si el usuario **no tiene accesos configurados** (`allowed_branches` vacío o null), el sistema no aplica restricción de sucursal (legacy behavior).
- Si el usuario **tiene accesos configurados**, `active_branch` apunta a la sucursal default (`is_default_branch = true`).
- Si no hay sucursal default, `active_branch` es la primera de `allowed_branches` ordenada ascendentemente.

---

## Mecanismo de Resolución de Sucursal

### `resolveBranchContextFromAuth` — Endpoints Transaccionales

Usado en: Ventas, Compras, Presupuestos, Caja, Reservas, Productos, Ajustes de Inventario, Órdenes de Reabastecimiento, Auditorías, Transferencias, Manufactura, Transacciones de Precio, Ajustes Manuales.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción                                       |
| --------- | ---- | --------- | ------------------------------------------------- |
| branch_id | int  | No        | ID de sucursal explícita. Prioridad sobre header. |

#### Resolución

1. Si se envía `?branch_id` o `X-Branch-ID`: validar que sea entero positivo.
2. Si el usuario tiene `allowed_branches` configurados:
   - La sucursal solicitada **debe estar en `allowed_branches`**. Si no: `403 Forbidden`.
3. Si no se envía explícitamente:
   - Fallback a `active_branch` del JWT.
   - Si `active_branch` no es válido o no está en `allowed_branches`: fallback a la primera de `allowed_branches`.
4. Si no hay `allowed_branches` ni `active_branch`: `branchID` puede ser `nil` (sin restricción).

#### Errores

| Código           | Condición                                              |
| ---------------- | ------------------------------------------------------ |
| 401 Unauthorized | Token inválido o ausente                               |
| 400 Bad Request  | `branch_id` no es un entero positivo válido            |
| 403 Forbidden    | `branch_id` explícito está fuera de `allowed_branches` |

---

### `resolveBIContextFromAuth` — Endpoints de Inteligencia de Negocio (BI)

Usado en: Dashboard, Cuentas por Cobrar, Cuentas por Pagar, Reportes Financieros, Análisis de Ventas, Análisis de Inventario, Costos, Forecast, Profitability.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción                       |
| --------- | ---- | --------- | --------------------------------- |
| branch_id | int  | Ver notas | Requerido para usuarios non-ADMIN |

#### Resolución

1. Ejecuta `resolveBranchContextFromAuth` primero (misma lógica de arriba).
2. Luego aplica reglas adicionales:
   - **ADMIN (`role_id == "admin"`)**: puede omitir `branch_id`. Si lo omite, el BI no filtra por sucursal (visión global).
   - **Non-ADMIN**:
     - Si no tiene `allowed_branches` configurados y envía un `branch_id` explícito: `403 Forbidden`.
     - Si `branchID` es `nil` (no envió explícito ni tiene fallback): `400 Bad Request` — "branch context required for BI".
     - Si `branchID` está fuera de `allowed_branches`: `403 Forbidden`.

#### Errores

| Código           | Condición                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| 401 Unauthorized | Token inválido o ausente                                                                                |
| 400 Bad Request  | `branch_id` inválido, o BI sin branch context para non-ADMIN                                            |
| 403 Forbidden    | `branch_id` fuera de `allowed_branches`, o non-ADMIN sin accesos configurados enviando branch explícito |

---

## Tabla Resumen: Módulos que Requieren Branch Context

| Módulo                                                             | Tipo de Contexto        | Rol ADMIN puede omitir branch |
| ------------------------------------------------------------------ | ----------------------- | ----------------------------- |
| **Ventas** (`/sale/*`)                                             | Transaccional           | Sí (usa fallback)             |
| **Compras** (`/purchase/*`)                                        | Transaccional           | Sí (usa fallback)             |
| **Presupuestos** (`/budget/*`)                                     | Transaccional           | Sí (usa fallback)             |
| **Caja** (`/cash-register/*`)                                      | Transaccional           | Sí (usa fallback)             |
| **Reservas** (`/reserves/*`)                                       | Transaccional           | Sí (usa fallback)             |
| **Productos** (`/product/*`)                                       | Transaccional / Lectura | Sí (usa fallback)             |
| **Ajustes de Inventario** (`/inventory/*`, `/manual-adjustment/*`) | Transaccional           | Sí (usa fallback)             |
| **Órdenes de Reabastecimiento** (`/purchase-requisition/*`)        | Transaccional           | Sí (usa fallback)             |
| **Transferencias entre Sucursales** (`/branch-transfers/*`)        | Transaccional           | Sí (usa fallback)             |
| **Manufactura** (`/manufacturing/*`)                               | Transaccional           | Sí (usa fallback)             |
| **Transacciones de Precio** (`/price-transactions/*`)              | Transaccional           | Sí (usa fallback)             |
| **Auditoría** (`/audit/*`, `/cash-audit/*`)                        | Transaccional           | Sí (usa fallback)             |
| **Dashboard** (`/dashboard/*`)                                     | BI                      | **Sí** (visión global)        |
| **Cuentas por Cobrar** (`/receivables/*`)                          | BI                      | **Sí** (visión global)        |
| **Cuentas por Pagar** (`/payables/*`)                              | BI                      | **Sí** (visión global)        |
| **Reportes Financieros** (`/financial-reports/*`)                  | BI                      | **Sí** (visión global)        |
| **Análisis de Ventas** (`/sales-analytics/*`)                      | BI                      | **Sí** (visión global)        |
| **Análisis de Inventario** (`/inventory-analytics/*`)              | BI                      | **Sí** (visión global)        |
| **Costos** (`/costs/*`)                                            | BI                      | **Sí** (visión global)        |
| **Forecast** (`/forecast/*`)                                       | BI                      | **Sí** (visión global)        |
| **Profitability** (`/profitability/*`)                             | BI                      | **Sí** (visión global)        |
| **Gestión de Sucursales** (`/branches/*`)                          | Administración          | Sí (no aplica filtro)         |

---

## Notas

- **Prioridad de envío:** `?branch_id` siempre tiene prioridad sobre `X-Branch-ID`.
- **Formato:** Ambos deben ser enteros positivos (`> 0`).
- **Sin accesos configurados:** Usuarios legacy sin entradas en `users.user_branch_access` no tienen restricción de sucursal en endpoints transaccionales, pero en BI pueden recibir `400` si no envían explícitamente un `branch_id`.
- **Cambio de sucursal activa:** El frontend puede cambiar la sucursal activa del usuario enviando un `branch_id` diferente en cada request. No es necesario refrescar el token JWT.
- **Token refresh:** Al refrescar el token, `allowed_branches` y `active_branch` se recalculan desde la base de datos (`users.user_branch_access`).

---

_Última actualización: 2026-04-22_
