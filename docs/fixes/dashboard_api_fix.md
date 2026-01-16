He corregido la integración de la API en el Dashboard.
El problema se debía a que el servicio enviaba el token con el prefijo estándar `Bearer `, pero el backend espera recibir solo el token (como indicaste que funciona en Postman).

**Cambios realizados:**
- Modificado `src/services/dashboardService.js` para enviar el token sin el prefijo `Bearer` en los métodos:
  - `getSummary`
  - `getAlerts`
  - `getRecentActivity`

Esto debería resolver los errores 500 y permitir que los datos se carguen correctamente.