# Guía de Roles y Permisos para Frontend

**Versión:** 1.0  
**Fecha:** 29 de Mayo de 2026  
**Propósito:** Referencia rápida para el equipo frontend sobre el sistema RBAC por módulo. Explica cómo encontrar los permisos de cada API guide, qué significan para la UI, y cómo mapear roles → permisos.

> **Documentos relacionados:**
> - [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) — Documento maestro con matriz completa Rol × Permiso, middleware, errores, claims JWT y endpoints de autenticación
> - [RBAC_MODULE_PERMISSIONS_SUMMARY.md](./RBAC_MODULE_PERMISSIONS_SUMMARY.md) — Cheat-sheet: permisos `resource:read`/`resource:write` por cada guía de módulo

---

## 1. Sistema RBAC por Módulo

Cada módulo de la API tiene un middleware que protege todos sus endpoints. Los permisos usan el formato `resource:action`:

- `resource` — el módulo o dominio (ej. `products`, `sales`, `purchases`)
- `action` — `read` (lectura) o `write` (escritura)

### Roles del Sistema

| Rol | ID | Tipo | Descripción |
|-----|-----|------|-------------|
| `ADMIN` | `F2VLso` | Interno | Acceso total, bypass del middleware |
| `VENDOR` | `VNDR01` | Interno | Ventas, caja, reservas, presupuestos |
| `BUYER` | `BUYR01` | Interno | Compras, inventario, manufactura, transferencias |
| `INVENTORY` | `SUPL01` | Interno | Stock, manufactura, transferencias entre sucursales |
| `SUPPLIER` | `SUPLR01` | Externo | Solo ver sus órdenes de compra y pagos |
| `CLIENT` | `CLNT01` | Externo | Solo ver productos, sus ventas, dashboard |

### Regla de Admin Bypass

El rol `ADMIN` (`role_id = "F2VLso"`) nunca es bloqueado por el middleware. No necesita verificación de permisos.

---

## 2. Cómo Encontrar los Permisos de un Módulo

Cada guía de API de módulo incluye una sección estandarizada llamada **"Permisos del Módulo"** que indica qué permisos requiere cada método HTTP.

### Pasos para Implementar un Feature

1. **Abrir la guía del módulo** que quieres implementar (ej. `SALES_API_GUIDE.md`)
2. **Buscar la sección** `## Permisos del Módulo` (siempre cerca del inicio)
3. **Leer la tabla** para saber qué permiso necesitas:

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `sales:read` |
| POST / PUT / DELETE / PATCH | `sales:write` |

4. **Consultar la matriz completa** en `SECURITY_FRONTEND_INTEGRATION_GUIDE.md` para ver qué roles tienen ese permiso
5. **Usar `GET /api/v1/users/me`** en el frontend para obtener el array `permissions` del usuario autenticado

### Ejemplos de Secciones de Permisos en Guías Existentes

| Guía | Permiso Lectura | Permiso Escritura | Tipo |
|------|----------------|-------------------|------|
| `PRODUCT_API_GUIDE.md` | `products:read` | `products:write` | Lectura/Escritura |
| `SALES_API_GUIDE.md` | `sales:read` | `sales:write` | Lectura/Escritura |
| `PURCHASE_ORDERS_API_GUIDE.md` | `purchases:read` | `purchases:write` | Lectura/Escritura |
| `CASH_REGISTER_API_GUIDE.md` | `cash:read` | `cash:write` | Lectura/Escritura |
| `PARTY_API_GUIDE.md` | `parties:read` | `parties:write` | Lectura/Escritura |
| `BUDGET_API_GUIDE.md` | `budgets:read` | `budgets:write` | Lectura/Escritura |
| `BI_API_GUIDE.md` | `analytics:read` | — (solo lectura) | Solo Lectura |
| `TAX_CLASSIFICATION_API_GUIDE.md` | `tax:read` | `tax:write` | Lectura/Escritura |
| `USER_API_GUIDE.md` | `users:read` | `users:write` | Lectura/Escritura |
| `BRANCH_API_GUIDE.md` | `branches:read` | `branches:write` | Lectura/Escritura |

### Para referencia rápida, usa `RBAC_MODULE_PERMISSIONS_SUMMARY.md`

Este archivo lista todas las guías con sus permisos en una sola tabla por dominio funcional.

---

## 3. Matriz Roles → Permisos

### ADMIN (`F2VLso`)

Acceso total. Bypass completo del middleware. No necesita permisos específicos.

### VENDOR (`VNDR01`)

| Permiso | Descripción para UI |
|---------|-------------------|
| `products:read` | Ver productos, precios, catálogo |
| `sales:read` | Ver ventas realizadas |
| `sales:write` | Crear, editar, cancelar ventas |
| `dashboard:read` | Ver dashboard principal |
| `receivables:read` | Ver cuentas por cobrar |
| `reports:read` | Ver reportes financieros |
| `analytics:read` | Ver analíticas y BI |
| `parties:read` | Ver clientes |
| `cash:read` | Ver cajas registradoras |
| `cash:write` | Abrir/cerrar cajas, movimientos |
| `reserves:read` | Ver reservas |
| `reserves:write` | Crear/gestionar reservas |
| `budgets:read` | Ver presupuestos |
| `budgets:write` | Crear/editar presupuestos |
| `branches:read` | Ver sucursales |
| `payments:read` | Ver métodos de pago |
| `payments:write` | Procesar pagos |
| `schedules:read` | Ver horarios |
| `schedules:write` | Generar/editar horarios |

### BUYER (`BUYR01`)

| Permiso | Descripción para UI |
|---------|-------------------|
| `products:read` | Ver productos, catálogo |
| `products:write` | Crear/editar productos |
| `purchases:read` | Ver órdenes de compra |
| `purchases:write` | Crear/editar/cancelar compras |
| `inventory:read` | Ver stock e inventario |
| `dashboard:read` | Ver dashboard principal |
| `payables:read` | Ver cuentas por pagar |
| `reports:read` | Ver reportes financieros |
| `analytics:read` | Ver analíticas y BI |
| `parties:read` | Ver clientes y proveedores |
| `parties:write` | Crear/editar clientes y proveedores |
| `manufacturing:read` | Ver manufactura y recetas |
| `manufacturing:write` | Operar producción |
| `transfers:read` | Ver transferencias entre sucursales |
| `transfers:write` | Crear/gestionar transferencias |
| `branches:read` | Ver sucursales |
| `tax:read` | Ver tasas y clasificaciones fiscales |
| `payments:read` | Ver pagos |
| `payments:write` | Procesar pagos |

### INVENTORY (`SUPL01`)

| Permiso | Descripción para UI |
|---------|-------------------|
| `products:read` | Ver productos |
| `inventory:read` | Ver stock e inventario |
| `inventory:write` | Ajustar stock, gestionar inventario |
| `dashboard:read` | Ver dashboard principal |
| `analytics:read` | Ver analíticas |
| `parties:read` | Ver proveedores |
| `reserves:read` | Ver reservas |
| `reserves:write` | Gestionar reservas |
| `manufacturing:read` | Ver manufactura |
| `manufacturing:write` | Operar producción |
| `transfers:read` | Ver transferencias |
| `branches:read` | Ver sucursales |
| `payments:read` | Ver pagos |
| `schedules:read` | Ver horarios |

### SUPPLIER (`SUPLR01`)

| Permiso | Descripción para UI |
|---------|-------------------|
| `purchases:read` | Ver sus órdenes de compra |
| `payments:read` | Ver pagos recibidos |

### CLIENT (`CLNT01`)

| Permiso | Descripción para UI |
|---------|-------------------|
| `products:read` | Ver productos y catálogo |
| `sales:read` | Ver sus ventas |
| `dashboard:read` | Ver dashboard personal |
| `receivables:read` | Ver sus cuentas por cobrar |
| `analytics:read` | Ver analíticas |
| `reserves:read` | Ver disponibilidad de reservas |

---

## 4. Módulos de Solo Lectura

Estos módulos no tienen permiso de escritura. Si un usuario autenticado intenta `POST/PUT/DELETE/PATCH`, el backend responde `405 Method Not Allowed`.

| Módulo | Permiso Requerido |
|--------|-------------------|
| Dashboard | `dashboard:read` |
| Cuentas por Cobrar | `receivables:read` |
| Cuentas por Pagar | `payables:read` |
| Reportes Financieros | `reports:read` |
| Analíticas de Ventas | `analytics:read` |
| Analíticas de Inventario | `analytics:read` |
| Rentabilidad | `analytics:read` |
| Pronósticos | `analytics:read` |
| Auditoría | `audit:read` |
| Lista de Permisos | `users:read` |

**Impacto en UI:** El frontend debe deshabilitar u ocultar botones de creación/edición/eliminación en estos módulos.

---

## 5. Guías con Secciones de Permisos Pendientes

Al momento de esta publicación, las siguientes guías requieren actualización en su sección "Permisos del Módulo":

| Guía | Estado | Acción Requerida |
|------|--------|------------------|
| `BARCODE_API_GUIDE.md` | ❌ Sin sección | Agregar sección completa |
| `SCALE_API_GUIDE.md` | ⚠️ Formato mínimo | Agregar nota, admin bypass, 403/405 |
| `API_DOCUMENTATION_TEMPLATE.md` | ❌ Sin sección | Agregar sección como parte requerida |

> **Para el equipo frontend:** Si trabajas con una guía que no tiene la sección "Permisos del Módulo", consulta `RBAC_MODULE_PERMISSIONS_SUMMARY.md` para conocer los permisos. Si puedes, contribuye agregando la sección siguiendo el formato estandarizado.

---

## 6. Reglas Globales para UI Frontend

### Obtención de Permisos

```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

Respuesta incluye `permissions: ["products:read", "sales:read", "sales:write", ...]`

### Decisiones de UI Basadas en Permisos

| Situación | Acción del Frontend |
|-----------|-------------------|
| Usuario no tiene `resource:read` | Ocultar el menú/módulo completo |
| Usuario tiene `resource:read` pero no `resource:write` | Mostrar solo vista de lista/detalle, ocultar botones de crear/editar/eliminar |
| Módulo de solo lectura | Deshabilitar siempre botones de escritura |
| Error `403` al cargar módulo | Redirigir a dashboard o mostrar pantalla "Sin Acceso" |
| Error `403` al intentar una acción | Mostrar notificación: "No tienes permisos para esta acción" |
| Error `405` en módulo de solo lectura | Corregir la UI (los botones de escritura no debieron mostrarse) |

### Fuente de Verdad

El backend es siempre la fuente de verdad. El frontend puede usar los permisos para mejorar la experiencia de usuario (ocultar/mostrar UI), pero el backend siempre valida cada请求.

---

## 7. API de Administración de Roles y Permisos

> ⚠️ Estos endpoints requieren `users:write`. Son para sistemas de administración, no para uso regular del frontend.

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/v1/roles` | Listar todos los roles |
| `GET /api/v1/roles/{id}` | Ver detalle de un rol con sus permisos |
| `POST /api/v1/roles/{id}/permissions` | Asignar permiso a un rol |
| `DELETE /api/v1/roles/{id}/permissions/{permissionId}` | Remover permiso de un rol |
| `GET /api/v1/permissions` | Listar todos los permisos del sistema |
| `GET /api/v1/users/{id}/roles` | Ver roles asignados a un usuario |
| `POST /api/v1/users/{id}/roles` | Asignar rol a un usuario |
| `DELETE /api/v1/users/{id}/roles/{roleId}` | Remover rol de un usuario |

---

**Última actualización:** 2026-05-29
