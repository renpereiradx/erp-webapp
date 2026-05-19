# Plan de Propagación: Permisos RBAC por Módulo (Frontend)

## 1. Objetivo
Propagar de forma metódica y segura el nuevo modelo de control de acceso basado en permisos (`recurso:acción`) a lo largo de toda la aplicación frontend, garantizando la protección de rutas, la adaptación condicional de la interfaz gráfica y un robusto manejo de errores HTTP provenientes de las validaciones del backend.

## 2. Archivos Clave y Contexto
- **Archivos a Crear:**
  - `docs/guides/frontend/RBAC_MODULE_PERMISSIONS_SUMMARY.md`: Documento permanente de consulta con la matriz de permisos.
  - `src/components/auth/PermissionGuard.tsx`: Nuevo High Order Component para proteger rutas basado en permisos (ej. `products:read`).
  - `src/components/auth/WithPermission.tsx`: Componente wrapper (HOC) ligero para ocultar/mostrar elementos de UI individuales (botones, pestañas).
- **Archivos a Modificar:**
  - `src/App.tsx`: Envolver todas las rutas privadas con `PermissionGuard` requiriendo el permiso de lectura (`*:read`) correspondiente a cada módulo.
  - `src/services/BusinessManagementAPI.ts`: Reforzar la intercepción de errores HTTP 403 y 405 para despachar eventos globales y mostrar notificaciones (Toasts).
  - Multiples páginas de la UI (ej. `Products.tsx`, `SalesNew.tsx`): Integrar verificaciones condicionales para las acciones de escritura (`*:write`).

## 3. Pasos de Implementación

### Fase 1: Documentación y Fundamentos
1. Crear el archivo de referencia técnica `docs/guides/frontend/RBAC_MODULE_PERMISSIONS_SUMMARY.md` en base al resumen proporcionado.
2. Crear el componente `PermissionGuard.tsx` que utilizará `useAuth().hasPermission()` para decidir el renderizado o la redirección al dashboard/página de error.
3. Crear el componente helper `WithPermission.tsx` para agilizar las validaciones en botones, permitiendo envolver partes del JSX fácilmente:
   ```tsx
   <WithPermission permission="products:write">
     <Button>Crear Producto</Button>
   </WithPermission>
   ```

### Fase 2: Protección de Rutas (Navegación)
1. Modificar `App.tsx` para envolver metódicamente las rutas en `<PermissionGuard>`:
   - Rutas de productos: `<PermissionGuard permission="products:read">`
   - Rutas de ventas: `<PermissionGuard permission="sales:read">`
   - Rutas de compras: `<PermissionGuard permission="purchases:read">`
   - Rutas de BI/Analítica: `<PermissionGuard permission="analytics:read">` (para forecasting, profitability, inventory-analytics)
   - Rutas de caja/movimientos: `<PermissionGuard permission="cash:read">`
   - Y así sucesivamente con todos los módulos listados en la guía.
2. Comprobar que los "bypasses" (roles como admin `F2VLso`) no sufran bloqueos. El hook `hasPermission` ya maneja esta excepción.

### Fase 3: Renderizado Condicional en UI (Bloqueo de Escritura)
1. Auditar los componentes principales y ocultar o desactivar botones/acciones basados en permisos de escritura (`*:write`). Ejemplos críticos:
   - `Products.tsx`: Ocultar botones "Nuevo", "Editar", "Eliminar" si no hay `products:write`.
   - `PartiesPage.tsx`: Ocultar acciones si no hay `parties:write`.
   - `BudgetManagement.tsx`: Ocultar si no hay `budgets:write`.
   - `SalesNew.tsx`: Este es un módulo entero de escritura, debe estar completamente bloqueado (se bloquea desde la ruta).
2. Manejar casos especiales como las tablas de datos (DataGrids) removiendo o deshabilitando las "Actions Columns" dinámicamente si falta el permiso de escritura.

### Fase 4: Experiencia de Usuario y Manejo de Errores (API)
1. En `BusinessManagementAPI.ts`, actualizar el interceptor de errores (bloque `if (!response.ok)`):
   - **Error 403 (Forbidden):** Despachar un evento o manejar directamente el mensaje para mostrar un Toast: "Acceso denegado: No cuentas con los permisos necesarios."
   - **Error 405 (Method Not Allowed):** Mostrar un Toast: "Operación no permitida en este módulo (Solo lectura)."
2. Garantizar que estas respuestas de la API no hagan colapsar las vistas y que redirijan fluidamente.

## 4. Verificación y Pruebas
1. **Prueba de Rutas (Lectura):** Acceder manualmente a las URLs de módulos sin tener los permisos (`read`) forzando el estado del JWT en pruebas. Debería mostrar la UI de `PermissionGuard` o redirigir al Dashboard.
2. **Prueba de Elementos (Escritura):** Acceder como un usuario con permisos de lectura pero no de escritura (ej. Un `VENDOR` intentando acceder a la creación de productos) y verificar la ausencia de botones y acciones.
3. **Prueba Reactiva (Errores API):** Simular una petición de escritura directa saltándose la UI para asegurar que el interceptor atrapa el código 403 o 405 y reacciona correctamente mostrando la notificación (Toast).

## 5. Estrategia de Rollback
- Si surgen problemas bloqueantes con ciertos usuarios al desplegar `PermissionGuard`, se puede revertir a nivel de `App.tsx` quitando el guard específico para un módulo y confiando temporalmente en el middleware de backend.
- Los botones ocultos mediante `WithPermission` pueden desactivar su validación devolviendo temporalmente siempre `true` si es necesario, sin borrar el código.