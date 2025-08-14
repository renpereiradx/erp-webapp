# Matriz de Estados - Página de Productos

| Estado | Condición | UI Principal | Acciones | Mensajes |
|--------|-----------|--------------|----------|----------|
| Loading inicial | loading && sin datos | Skeleton grid | Cancel (futuro) | 'Cargando productos...' |
| Lista vacía | !loading && totalProducts==0 && !error | Empty state con CTA crear | Crear producto | 'No hay productos' |
| Error recuperable | error && productos.length==0 | Card error + Retry | Reintentar / Login | error + hint |
| Datos en caché | cache hit | Lista render inmediata | Botón Refresh (futuro) | 'Mostrando datos en caché' (aria-live) |
| Revalidando | revalidatingPages[page]==true | Spinner pequeño en toolbar | Cancel revalidate (futuro) | 'Actualizando...' |
| Offline degradado | error NETWORK && snapshot disponible | Lista snapshot + banner offline | Reintentar | 'Modo offline' |
| Bulk selección | selectedIds.length>0 | Toolbar masiva sticky | Activar / Desactivar / Limpiar | '{n} seleccionados' |
| Edición inline | inlineEditingId != null | Campos EditableField | Guardar / Cancelar | Errores campo a campo |
| Circuit breaker | circuit open | Banner aviso | Reintentar luego | 'Servicio inestable' |

## Notas
- aria-live para anuncios de resultados, bulk y cambios críticos.
- Offline snapshot persiste la última lista exitosa para UX degradada.
- Estados deben ser mutuamente entendibles y con prioridad (error > loading > inline > bulk > normal).
