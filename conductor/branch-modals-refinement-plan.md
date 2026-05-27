# Refinamiento Visual y Funcional de Gestión de Sucursales

Este plan detalla las mejoras para los modales y la página de Gestión de Sucursales, asegurando la integración completa con la API y el cumplimiento de las directrices de diseño Fluent 2.0 y refinamiento visual.

## User Review Required

> [!IMPORTANT]
> Se implementará la funcionalidad de borrado de configuraciones fiscales. Por favor, asegúrese de que el endpoint `DELETE /branches/fiscal-config/{id}` esté habilitado en el backend, ya que se inferirá su existencia basado en el patrón de la API.

> [!WARNING]
> Se ha detectado un problema donde las nuevas sucursales no se muestran debido a la falta de manejo de paginación en el frontend. Se corregirá solicitando un `page_size` mayor o implementando controles de navegación.

## Proposed Changes

### 🔧 Servicios (Backend Integration)

#### [MODIFY] [branchService.ts](file:///home/darthrpm/dev/web-project/erp-webapp/src/features/branches/services/branchService.ts)
- Añadir el método `deleteFiscalConfig(id: number)` para permitir la eliminación de timbrados y puntos de expedición.

---

### 🎨 Componentes UI (Modals & Refinement)

#### [MODIFY] [BranchModal.tsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/features/branches/components/BranchModal.tsx)
- **Funcionalidad**: 
    - Implementar `deleteFiscalMutation` y vincularla al botón de borrar en la lista de configuraciones fiscales.
    - Sustituir el campo de texto manual de `ID del Usuario` en la pestaña de accesos por un selector (Combobox o Select) que liste los usuarios reales mediante `userService.getUsers()`.
- **Refinamiento Visual**:
    - Aplicar `overflow-hidden` a contenedores con bordes redondeados para evitar recortes visuales imperfectos.
    - Ajustar los pesos de fuente para números (usar `font-mono` con pesos 700/900 según jerarquía).
    - Mejorar las transiciones de pestañas y estados de carga.

#### [MODIFY] [BranchManagement.tsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/pages/BranchManagement.tsx)
- **Funcionalidad**:
    - **Corrección de Visualización**: Aumentar el `page_size` en la llamada a `getBranches` para asegurar que todas las sucursales sean visibles, o implementar controles de paginación.
    - Refactorizar la lógica de desactivación/activación para usar `useMutation` de React Query, mejorando la consistencia del manejo de estados.
    - Implementar la lógica de **Exportación a CSV** para la lista de sucursales.
- **Refinamiento Visual**:
    - Asegurar que la tabla y las tarjetas sigan la escala de 8px y utilicen los tokens de sombra Fluent 2.0 (`shadow-fluent-shadow`).
    - Aplicar `min-w-0` y `truncate` en campos de texto largos para prevenir desbordamientos.

## Verification Plan

### Automated Tests
- Verificar que las llamadas a la API se realicen con los parámetros correctos mediante la pestaña de Network del navegador.
- Validar que la invalidación de caché de React Query funcione tras las mutaciones.

### Manual Verification
- **Prueba de Borrado**: Eliminar una configuración fiscal y verificar que desaparezca de la tabla tras la confirmación.
- **Prueba de Accesos**: Abrir el selector de usuarios y verificar que se listan los usuarios disponibles.
- **Prueba de Exportación**: Hacer clic en "Exportar CSV" y verificar la descarga del archivo con los datos correctos.
- **Inspección Visual**: Verificar que los bordes redondeados se vean perfectos (sin fugas de color en las esquinas) y que los números tengan el contraste adecuado.
