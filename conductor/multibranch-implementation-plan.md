# Plan de Implementación: Contexto Multi-Sucursal (Frontend)

## Objetivo
Implementar la infraestructura base en el frontend para soportar la arquitectura multi-sucursal del backend, respetando la jerarquía de resolución de contexto para operaciones transaccionales y de Inteligencia de Negocio (BI).

## Archivos Clave y Contexto
- `src/types.ts`: Modelo de datos del usuario.
- `src/services/BusinessManagementAPI.ts`: Cliente base de la API.
- `src/contexts/AuthContext.tsx`: Gestión de sesión.
- **Nuevos Archivos:** `src/contexts/BranchContext.tsx`, `src/components/BranchSwitcher.tsx`.

## Pasos de Implementación

### Fase 1: Actualización de Tipos
- **Archivo:** `src/types.ts`
- **Acción:** Ampliar la interfaz `User` agregando las propiedades opcionales `active_branch?: number | null` y `allowed_branches?: number[]`. Esto mapea los claims del JWT devueltos por el endpoint `/me`.

### Fase 2: Cliente API Inteligente
- **Archivo:** `src/services/BusinessManagementAPI.ts`
- **Acción:**
  1. Validar que `getAuthHeaders` extraiga correctamente el `activeBranch` de `localStorage` y lo inyecte como header `X-Branch-ID`.
  2. Modificar `makeRequest` para garantizar que si un servicio envía explícitamente un parámetro `branch_id` en `options.params`, este tenga prioridad absoluta (el backend ya prioriza los query params sobre el header).

### Fase 3: Nuevo Contexto de Sucursal
- **Archivo:** `src/contexts/BranchContext.tsx`
- **Acción:** Crear un contexto (`BranchContext` y `BranchProvider`) independiente del `AuthContext`.
  - **Estado:** Manejar la sucursal seleccionada (`currentBranchId`), las sucursales permitidas (`allowedBranches`) y un flag para saber si el usuario tiene privilegios globales (`canViewGlobal`).
  - **Lógica:** Implementar la función `changeBranch(id: number | null)`. Esta función actualizará el estado de React y el `localStorage`, asegurando que las siguientes llamadas API utilicen el nuevo contexto. Si es administrador, puede seleccionar `null` ("Todas las sucursales") para operaciones de BI.

### Fase 4: Integración con Autenticación
- **Archivo:** `src/contexts/AuthContext.tsx`
- **Acción:** Ajustar `initializeAuth` y `login` para que extraigan `active_branch` y `allowed_branches` de la respuesta de `/me` y persistan estos valores iniciales en `localStorage`, preparando el terreno para el `BranchContext`.

### Fase 5: Componente UI de Selección
- **Archivo:** `src/components/BranchSwitcher.tsx` (o directorio similar)
- **Acción:** Construir un componente visual (ej: un Dropdown) que consuma el `BranchContext`.
  - Si el usuario tiene más de una sucursal en `allowed_branches`, mostrar el selector.
  - Si es administrador, incluir la opción "Visión Global" o "Todas las Sucursales" (`id: null`).
  - Si solo tiene una sucursal y no es admin, ocultar o deshabilitar el selector.

## Verificación y Pruebas
1. Iniciar sesión con un usuario con múltiples sucursales y verificar que la UI muestre el selector.
2. Cambiar de sucursal y comprobar que `localStorage` se actualiza.
3. Observar las peticiones en red y confirmar que el header `X-Branch-ID` coincide con la selección.
4. (Administradores) Seleccionar "Todas las Sucursales" y verificar que las peticiones de BI funcionen sin enviar el header restrictivo.