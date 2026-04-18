# Plan de Actualización: ID de Rol Administrador (ADMIN a F2VLso)

## Objetivo
Actualizar el Frontend para que utilice el nuevo ID alfanumérico del backend (`F2VLso`) en lugar de la cadena estática (`ADMIN` o `admin`) como identificador del rol de administrador en todos los endpoints, guardias de rutas y lógica de interfaz de usuario.

## Archivos Clave & Contexto

1. **Rutas protegidas & Guardias**: 
   - `src/App.tsx`
   - `src/components/auth/RoleGuard.tsx`
2. **Interfaz de Gestión de Usuarios & Roles**: 
   - `src/components/users/ManageRolesModal.jsx`
   - `src/components/users/ManageRolesPanel.jsx`
   - `src/components/users/roles/RoleAssignmentSidebar.jsx`
3. **Páginas de Perfiles**: 
   - `src/pages/UserDetailedProfile.tsx`
   - `src/pages/UserManagementList.tsx`
4. **Configuración Demo & Servicios**: 
   - `src/config/demoAuth.ts`
   - `src/services/roleService.js`

## Pasos de Implementación

1. **Actualización de Guardias de Acceso (`RoleGuard`)**:
   - Cambiar el rol por defecto en `src/components/auth/RoleGuard.tsx` a `allowedRoles = ['F2VLso']`.
   - Modificar las llamadas a `<RoleGuard allowedRoles={['ADMIN']}>` en `src/App.tsx` para enviar `F2VLso`.

2. **Actualización de Lógica en la UI (Renderizado Condicional)**:
   - Modificar las validaciones de `role.id === 'admin'` a `role.id === 'F2VLso'` en los componentes de roles y listas de usuarios para que el renderizado condicional (iconos de administrador, etiquetas, colores especiales) siga funcionando.

3. **Actualización de Servicios y Mocks**:
   - En `src/services/roleService.js`, actualizar las referencias hardcodeadas del rol `admin` al ID oficial.
   - En `src/config/demoAuth.ts`, cambiar la propiedad `role` del usuario admin de la demo a `F2VLso` para que la vista de desarrollo no se rompa al validar rutas y componentes protegidos.

## Verificación y Pruebas

- Hacer login y verificar que el dashboard se cargue correctamente con permisos de Admin.
- Acceder a `/admin/sessions` (protegido por `<RoleGuard>`) y comprobar que no salta la advertencia de permisos.
- Visitar la lista de usuarios y confirmar que el `badge` y estilos propios del administrador se renderizan correctamente para el rol con ID `F2VLso`.