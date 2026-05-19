# Plan de Implementación: Sistema Multi-Sucursal (Frontend)

## Objetivo
Implementar la infraestructura completa en el frontend para soportar la arquitectura multi-sucursal. Esto incluye la gestión del contexto activo (Branch Switcher) y las interfaces de administración (CRUD de sucursales, configuraciones fiscales y accesos), respetando los lineamientos de diseño de Fluent 2 y la nueva arquitectura basada en features con TypeScript.

## Arquitectura y Dependencias
- **Lógica de Estado del Servidor:** `@tanstack/react-query` (Debe ser instalado).
- **Lógica de Estado UI Global:** `zustand`.
- **Estructura de Archivos:** Feature-Sliced Design (`src/features/branches/` y `src/domain/branches/`).

## Fases de Implementación

### Fase 1: Fundamentos (Dominio y API)
- **Tipos Base (`src/domain/branches/models.ts`):** 
  - Definir interfaces `Branch`, `BranchFiscalConfig`, `UserBranchAccess`, y tipos para peticiones.
- **Tipos Globales (`src/types.ts`):**
  - Ampliar la interfaz `User` con `active_branch?: number | null` y `allowed_branches?: number[]`.
- **Servicios API (`src/features/branches/services/branchService.ts`):**
  - Implementar el cliente con `axios` mapeando todos los endpoints descritos en `BRANCH_API.md`.
- **Intercepción de Axios (`src/services/BusinessManagementAPI.ts` o equivalente):**
  - Asegurar la inyección del header `X-Branch-ID` si no viene en los params de las llamadas.

### Fase 2: Gestión de Contexto Global
- **Zustand Store (`src/features/branches/hooks/useBranchStore.ts`):**
  - Manejar `currentBranchId`, `allowedBranches`, `canViewGlobal`.
  - Sincronizar cambios con `localStorage`.
- **Integración con AuthContext:**
  - Extraer y persistir las sucursales permitidas tras el inicio de sesión.
- **Instalación y Setup de React Query:**
  - Configurar `QueryClientProvider` en el nivel superior de la aplicación (`src/App.tsx` o `main.tsx`).

### Fase 3: Interfaz de Selección (Branch Switcher)
- **Componente (`src/features/branches/components/BranchSwitcher.tsx`):**
  - Menú desplegable usando Fluent 2.
  - Renderizado condicional basado en `allowedBranches`.
  - Opción de "Visión Global / Todas las Sucursales" para administradores.
- **Integración Visual:** Ubicar el componente en la cabecera (Header) o en la barra lateral del layout principal.

### Fase 4: Panel de Gestión (CRUD)
- **Data Grids (Alta Densidad):**
  - Vista principal con lista de sucursales (`src/features/branches/pages/BranchesPage.tsx`).
  - Utilizar el diseño visual de "Grids de Alta Densidad" de Fluent 2 (espaciado, checkmarks, badges de estado).
- **Formularios de Configuración:**
  - Formularios para Crear/Editar Sucursales.
  - Gestión de Configuraciones Fiscales por sucursal.
- **Gestión de Accesos:**
  - Interfaz para asignar y revocar roles (`ADMIN`, `OPERATOR`, `VIEWER`) a los usuarios en sucursales específicas.

## Verificación
1. Validar el funcionamiento del CRUD usando mocks o integrando con el backend.
2. Confirmar que el `BranchSwitcher` altera correctamente el header en peticiones subsecuentes.
3. Verificar la responsividad y consistencia visual con los componentes de `FLUENT2_COMPONENTS.html`.
