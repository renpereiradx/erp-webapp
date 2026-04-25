# Plan de Implementación: Servicio de Administración de Sucursales (Branch Admin Service)

## Objetivo
Implementar el módulo administrativo de sucursales en el frontend siguiendo la guía `BRANCH_API.md`. Este servicio gestionará las entidades base de sucursales, su configuración fiscal y los accesos de usuarios. A diferencia de los módulos operativos, este servicio no inyectará el contexto de la sucursal activa.

## Tareas

### 1. Definir Tipos e Interfaces (`src/types.ts`)
Añadir las definiciones de tipo necesarias para garantizar tipado estricto en la aplicación:
*   `Branch`: Definición de la sucursal (id, code, name, branch_type, is_warehouse, etc.).
*   `BranchFiscalConfig`: Configuración para emisión de facturas (establishment_code, expedition_point, timbrado, etc.).
*   `UserBranchAccess`: Asignación de roles por sucursal (user_id, branch_id, access_type, is_default_branch).

### 2. Implementar `src/services/branchService.ts`
Crear el servicio interactuando con el cliente centralizado (`apiClient`), respetando las exclusiones ya configuradas en `BusinessManagementAPI.ts`.

Los métodos a implementar (según `BRANCH_API.md`):

#### Gestión Base de Sucursales
*   `createBranch(data)`: POST `/branches`
*   `getBranches(filters)`: GET `/branches`
*   `getBranchById(id)`: GET `/branches/{id}`
*   `updateBranch(id, data)`: PUT `/branches/{id}`

#### Configuración Fiscal
*   `createFiscalConfig(branchId, data)`: POST `/branches/{branch_id}/fiscal-config`
*   `getFiscalConfigs(branchId)`: GET `/branches/{branch_id}/fiscal-config`
*   `updateFiscalConfig(id, data)`: PUT `/branches/fiscal-config/{id}`

#### Gestión de Accesos
*   `grantAccess(branchId, data)`: POST `/branches/{branch_id}/access`
*   `getAccesses(branchId)`: GET `/branches/{branch_id}/access`
*   `updateAccess(branchId, userId, data)`: PUT `/branches/{branch_id}/access/{user_id}`
*   `revokeAccess(branchId, userId)`: DELETE `/branches/{branch_id}/access/{user_id}`
*   `getUserBranches(userId)`: GET `/users/{user_id}/branches`

### 3. Integrar en `api.ts` (Opcional, para consistencia Legacy)
Exponer atajos de los métodos más comunes en el `apiService` legacy si es necesario para mantener compatibilidad con otras áreas de la aplicación. (En este caso, al ser un módulo nuevo, se recomienda que las vistas utilicen directamente el `branchService`).

## Consideraciones
*   La inyección del header `X-Branch-Id` **está explícitamente bloqueada** para endpoints que inicien con `/branches/` en `BusinessManagementAPI.ts`, por lo que las llamadas a este servicio pasarán "limpias", tal cual como lo dicta la arquitectura.
*   Se utilizará `telemetry.record` para trazar el rendimiento y los errores.
*   Se usará la función helper `_fetchWithRetry` internamente en el servicio para mayor resiliencia.

## Aprobación
Se requiere la confirmación para proceder con la escritura de los archivos `src/types.ts` y `src/services/branchService.ts`.