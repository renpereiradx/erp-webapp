# Guía Rápida de Permisos RBAC (Frontend)

Este documento sirve como referencia para desarrolladores frontend al implementar protección de rutas y componentes mediante el modelo de control de accesos basado en roles (RBAC).

## Reglas Principales
1. **Administrador Bypass:** El rol de administrador (`F2VLso` / `admin`) tiene acceso implícito a todo. La función `useAuth().hasPermission(perm)` ya contempla esta regla y siempre devolverá `true` para los admins.
2. **Componentes:**
   - Para proteger **Páginas / Rutas completas**, envuelve la ruta en `<PermissionGuard permission="modulo:read">`.
   - Para ocultar **Botones / Acciones de Escritura**, envuelve el elemento en `<WithPermission permission="modulo:write">`.
3. **Módulos de Solo Lectura:** Las áreas de Inteligencia de Negocios (BI), Reportes Financieros y Auditoría son exclusivamente de lectura (`*:read`). Cualquier petición de escritura (POST/PUT/DELETE) generará un error `405 Method Not Allowed`.

## Matriz de Mapeo: Módulo ➔ Permiso

| Área / Módulo Frontend | Permiso de Lectura (Vista) | Permiso de Escritura (Acciones) |
|-------------------------|----------------------------|---------------------------------|
| **Productos y Precios** | `products:read` | `products:write` |
| **Ajustes de Inventario** | `inventory:read` | `inventory:write` |
| **Ventas** | `sales:read` | `sales:write` |
| **Compras / Órdenes** | `purchases:read` | `purchases:write` |
| **Cuentas por Cobrar** | `receivables:read` | N/A (Módulo BI, Solo Lectura) |
| **Cuentas por Pagar** | `payables:read` | N/A (Módulo BI, Solo Lectura) |
| **Dashboard** | `dashboard:read` | N/A (Módulo BI, Solo Lectura) |
| **Reportes / Analíticas** | `analytics:read` / `reports:read`| N/A (Módulo BI, Solo Lectura) |
| **Caja Registradora** | `cash:read` | `cash:write` |
| **Pagos (Cobros/Pagos)** | `payments:read` | `payments:write` |
| **Agenda y Reservas** | `reserves:read` | `reserves:write` |
| **Directorio (Clientes/Prov)**| `parties:read` | `parties:write` |
| **Sucursales (CRUD)** | `branches:read` | `branches:write` |
| **Config. Financiera/Tasas**| `tax:read` | `tax:write` |
| **Presupuestos** | `budgets:read` | `budgets:write` |
| **Transferencias de Stock** | `transfers:read` | `transfers:write` |
| **Usuarios y Roles** | `users:read` | `users:write` |
| **Auditoría (Logs)** | `audit:read` | N/A (Módulo BI, Solo Lectura) |

## Uso Ejemplo

**Rutas en App.tsx:**
```tsx
<Route path="/productos" element={
  <PermissionGuard permission="products:read">
    <Products />
  </PermissionGuard>
} />
```

**Botones en UI (ej: Products.tsx):**
```tsx
<WithPermission permission="products:write">
  <Button onClick={handleCreate}>Nuevo Producto</Button>
</WithPermission>
```