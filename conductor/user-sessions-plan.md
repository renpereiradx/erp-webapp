# Plan de Implementación: Gestión de Sesiones de Usuario y Autenticación Mejorada

## 1. Objetivo
Implementar la funcionalidad completa de gestión de sesiones de usuario, monitoreo de administrador y el flujo mejorado de autenticación (uso de refresh tokens y cierre de sesión global) basado en la especificación documentada en `@docs/api/new_features/user-session.md`. La página visual de administrador ya ha sido generada en Stitch.

## 2. Archivos Clave y Contexto
- **Nuevos Archivos:**
  - `src/services/sessionService.js` (Capa de servicios API)
  - `src/pages/AdminSessionsDashboard.jsx` (Basado en el HTML generado por Stitch en `temp/stitch/AdminSessionsDashboard.html` una vez salgamos de Plan Mode)
- **Archivos a Modificar:**
  - `src/services/authService.js` (Agregar métodos de refresh y logout global)
  - `src/services/BusinessManagementAPI.js` (Implementar interceptor de Axios/Fetch para refresh automático)
  - `src/pages/MyProfileAndSecurity.jsx` (Dinámica de sesiones activas del usuario actual)
  - `src/App.jsx` (Registrar ruta `/admin/sesiones`)

## 3. Pasos de Implementación

### Fase 1: Descarga del Diseño y Configuración Inicial
1. Al salir del Plan Mode, usar la consola (`run_shell_command` o script `fetch-stitch.sh` como indica la skill `react-components`) para descargar el diseño generado en el paso anterior y guardarlo en `temp/stitch/AdminSessionsDashboard.html`.

### Fase 2: Servicios (Capa de Datos)
1. **Crear `sessionService.js`:**
   - Mapear endpoints de usuario: `GET /sessions/active`, `GET /sessions/history`, `POST /sessions/{id}/revoke`, `POST /sessions/revoke-all`, `GET /sessions/activity`, `GET /sessions/config`.
   - Mapear endpoints de administrador: `GET /admin/sessions/all`, `POST /admin/sessions/{id}/revoke`.
2. **Actualizar `authService.js`:**
   - Añadir método `refreshToken(refreshToken)` que consuma `POST /auth/refresh`.
   - Añadir método `logoutAll()` que consuma `POST /auth/logout-all`.

### Fase 3: Interceptor y Flujo de Token (Core)
1. **Actualizar `BusinessManagementAPI.js`:**
   - Modificar la lógica de manejo del error `401 Unauthorized` en `makeRequest`.
   - Antes de llamar a `handleUnauthorized()`, verificar si existe un `refresh_token`.
   - Si existe, intentar renovarlo mediante `authService.refreshToken()`.
   - Si la renovación es exitosa, actualizar los tokens en `localStorage` y **reintentar la petición original**.
   - Si la renovación falla, proceder con `handleUnauthorized()` (limpiar estado y redirigir al login).

### Fase 4: Interfaz de Usuario (Frontend)
1. **Actualizar `MyProfileAndSecurity.jsx`:**
   - Reemplazar la lista de sesiones mockeada con datos reales consumiendo `sessionService.getActiveSessions()`.
   - Implementar el botón "Cerrar sesión en todos los dispositivos" mapeándolo a `sessionService.revokeAllOtherSessions()`.
   - Implementar el botón de cerrar sesiones individuales usando `sessionService.revokeSession(id)`.
   - Manejar estados de carga y notificaciones (toasts).
2. **Crear `AdminSessionsDashboard.jsx`:**
   - Convertir el HTML descargado de Stitch en un componente React siguiendo las directrices de la skill `react-components`.
   - Implementar el hook personalizado `useAdminSessions.js` (si aplica) para manejar el estado.
   - Integrar la tabla con los datos reales provenientes de `GET /admin/sessions/all`.
   - Conectar la lógica de revocación individual y masiva.
3. **Actualizar Rutas (`App.jsx`):**
   - Registrar la nueva ruta `/admin/sesiones` protegida.

## 4. Verificación y Pruebas
- **Prueba de Refresh Token:** Simular la expiración de un token (modificándolo o configurando un tiempo corto en el backend) y verificar que la aplicación solicita uno nuevo en background sin interrumpir la UX.
- **Prueba de Sesiones de Usuario:** Iniciar sesión en dos navegadores diferentes. Desde uno de ellos, ir al perfil y revocar la sesión del otro. Verificar que en el otro navegador se cierra la sesión al intentar navegar.
- **Prueba de "Logout All":** Revocar todas las sesiones y confirmar que las demás expiran.
- **Prueba de Administrador:** Entrar con cuenta de administrador al nuevo `AdminSessionsDashboard`, ver la lista de conexiones, utilizar los filtros de búsqueda y revocar una sesión externa de prueba.

## 5. Estrategia de Migración / Rollback
- Si el interceptor de refresh token causa bugs (ej: loops infinitos de red), deshabilitar temporalmente la lógica en `BusinessManagementAPI.js` restaurando el comportamiento estricto anterior (401 = redirección inmediata).
- Las páginas nuevas se añaden de forma modular por lo que no afectan flujos core (ventas/compras) existentes.