# PLAN_RBAC_PARTIES_SCOPE_FRONTEND — Gating por permisos en parties + registro rápido de cliente en el POS

Fecha: 2026-08-17
Estado: ⏳ Planificado (NO implementado — pendiente de ejecución)
Repo: erp-webapp
Companion backend (plan maestro): `business_management/conductor/PLAN_RBAC_PARTIES_SCOPE.md`
Origen: un vendedor que recepciona un cliente no registrado entra a `/parties`
y ve/gestiona todo (tabs Clientes+Proveedores, crear/editar sin gating).

> **Nota para el agente que implemente**: el backend DEBE implementarse antes
> (o en el mismo deploy): el gating del frontend depende de que login y
> `/api/v1/users/me` devuelvan `permissions` (hoy no lo hacen) y de que
> `/api/v1/clients` acepte al vendedor. Ver plan maestro. Referencias
> archivo:línea verificadas al 2026-08-17; pueden derivar ±unas líneas.
> Respetar DESIGN.md para cualquier UI nueva (EnhancedModal, tokens, i18n).

---

## 1. Diagnóstico frontend (condensado)

| # | Hallazgo | Evidencia |
|:--|:---------|:----------|
| 1 | `hasPermission()` solo acierta para admins: `user.permissions` llega `undefined` porque el backend no lo envía → todo PermissionGuard es efectivamente "¿eres F2VLso?" | `src/contexts/AuthContext.tsx:38-44`; login no trae permissions; `/me` da 403 para no-admins (ruta mal registrada en backend) |
| 2 | `/parties` (Directorio con tabs Clientes+Proveedores) solo exige `parties:read`; dentro cero gating (crear/editar/exportar visibles para todos) | `src/App.tsx:273` (PermissionGuard); `src/pages/PartiesPage.tsx:56-78` (tabs); `src/pages/Clients.tsx:46-66, 211-220` (botones) |
| 3 | No existe registro de cliente inline en el flujo de venta: el wizard solo busca (ClientStep) y sin cliente la venta sigue con `client_id` ausente | `src/features/sales/components/steps/ClientStep.tsx:53-78`; comentario en `src/pages/SalesNew.tsx:1091-1093` |
| 4 | `PermissionGuard` acepta un solo permiso (sin OR); `WithPermission` existe pero no se usa en ningún lado | `src/components/auth/PermissionGuard.tsx`, `src/components/auth/WithPermission.tsx` |
| 5 | Menú sí filtra por `permission` (simple) en `navItems`/`filterNavItems`; el ítem `/parties` usa `parties:read` fijo | `src/layouts/MainLayout.jsx:96-570` (`/parties` ~482) |
| 6 | `clientService`/`supplierService` usan el endpoint genérico `/api/v1/parties` con `party_type` en query | `src/services/clientService.ts:7`, `src/services/supplierService.ts:5` |
| 7 | `/configuracion/usuarios` ya está gated solo-admin (`RoleGuard ['F2VLso']`) — correcto, no tocar. Bug: botón "Ver" navega a `/usuarios/${id}` (404; ruta real `/configuracion/usuarios/:id`) | `src/App.tsx:372-424`; `src/pages/UserManagementList.tsx:270` |

Decisiones del usuario: **D1** vendedor = directorio de clientes (lectura) +
crear/editar clientes + registro rápido en POS, sin tab proveedores.
**D2** el barrido de guards de ~20 rutas desprotegidas queda diferido (§6).

## 2. Implementación frontend

### F1. Plumbing de permisos

- `AuthContext` (`src/contexts/AuthContext.tsx`):
  - `user.permissions` ahora llega del backend (login + `/me`) — verificar
    que ambos caminos lo pueblen (login: `result.user.permissions` /
    `result.permissions`; `/me`: `response.data.permissions`).
  - Añadir `hasAnyPermission(...perms: string[]): boolean` junto al
    `hasPermission` existente (mismo bypass admin `F2VLso`/`admin`).
  - Exponerlo en el contexto/provider.
- `PermissionGuard` y `WithPermission`: añadir prop `anyOf: string[]`
  (semántica OR: pasa si tiene alguno). Mantener `permission` string por
  retrocompat con los usos existentes (productos, ventas, config).

### F2. Rutas, tabs y botones

- `App.tsx` — ruta `/parties`: `PermissionGuard anyOf={['parties:read','clients:read','suppliers:read']}`.
- `PartiesPage.tsx`:
  - `canSeeClients = hasAnyPermission('parties:read','clients:read')`
  - `canSeeSuppliers = hasAnyPermission('parties:read','suppliers:read')`
  - Render condicional de tabs; tab activa por defecto = la primera visible
    (hoy si la activa es "suppliers" y no se ve, caer a clients).
- `Clients.tsx`: botones "Nuevo Cliente" y editar por fila con
  `WithPermission anyOf={['parties:write','clients:write']}`.
- `Suppliers.tsx`: ídem con `anyOf={['parties:write','suppliers:write']}`.
- `MainLayout.jsx` navItems: ítem `/parties` pasa de `permission: 'parties:read'`
  a soportar array (ej. `permissions: ['parties:read','clients:read','suppliers:read']`,
  anyOf); extender `filterNavItems` manteniendo `permission` string para el resto.
- Fix bonus (1 línea): `UserManagementList.tsx:270` → navegar a
  `/configuracion/usuarios/${user.id}` en vez de `/usuarios/${user.id}`.

### F3. Services a alias tipados

- `clientService.ts`: `API_PREFIX = '/api/v1/clients'`; quitar
  `party_type=CLIENT` de los query strings (el handler tipado del backend lo
  fuerza). Los items devueltos son shape `Party` (`first_name`/`last_name`) —
  `normalizeClient` del store ya lee `first_name`; verificar el parseo de
  `contact_info`/`email` en searchByName/getAll/getById.
- `supplierService.ts`: `API_PREFIX = '/api/v1/suppliers'` (quitar
  `party_type=SUPPLIER`; el `create` ya no necesita mandarlo).
- Misma interfaz pública de ambos services (los consumidores no cambian).
- Los payloads extendidos (`document_type`, `address_*`, `nationality`)
  siguen funcionando igual sobre el alias tipado.

### F4. Registro rápido de cliente en el POS (caso de uso central)

- **Nuevo** `src/features/party/components/QuickClientModal.tsx` (.tsx,
  design system — DESIGN.md):
  - Usar `EnhancedModal` (§6.6 — prohibido modal artesanal `fixed inset-0`),
    `Button`, `Input`, `Label` de `src/components/ui/`.
  - Campos mínimos: nombre*, apellido*, tipo de documento*
  (`DocumentTypeSelect` de `src/features/party/components/`, default `CI`),
  número de documento*, teléfono (opcional). El resto (dirección,
  nacionalidad) se completa después desde el directorio.
  - Validación pura extraída a función (para test): `validateQuickClient(form)`
    → record de errores por campo.
  - Submit → `useClientStore.createClient` → `clientService.create`
    (POST `/api/v1/clients`). Devuelve el party creado al padre via
    `onCreated(client)`.
- `ClientStep.tsx` (wizard de venta):
  - CTA "Nuevo cliente" junto al `SearchableDropdown`, gated
    `anyOf(['clients:write','parties:write'])`.
  - En estado sin resultados (ancla: `emptyMessage` ~línea 76): mensaje
    "¿No lo encontrás? Registralo como nuevo cliente" con el mismo CTA.
  - `onCreated`: auto-seleccionar el cliente nuevo en el paso y continuar el
    checkout — sin navegar fuera del POS.
- i18n: claves `party.quick_client.*` en `src/lib/i18n/locales/es/party.js`
  y `en/party.js` (módulo `party` ya existe y está registrado en ambos índices).

### F5. Demo mode + tests

- `src/config/demoAuth.ts` (`DEMO_USERS_LIST`): incluir `permissions` en los
  usuarios demo — admin: lista completa (incl. `parties:*`); vendedor demo:
  solo `clients:read`, `clients:write` + los de venta — así el demo refleja
  el gating (menú reducido, sin tab proveedores, CTA en POS).
- Tests (`pnpm test`, Vitest):
  - `validateQuickClient` como función pura → test en `src/__tests__/`
    (patrón `*.domain.test.ts` / componente).
  - Si se extrae helper puro de visibilidad de tabs (PartiesPage), testearlo.
  - La suite tiene fallos preexistentes (17 archivos / 49 tests + 1 OOM al
    2026-08-17, verificados contra HEAD): el criterio es no añadir fallos.
- ESLint de los archivos js/jsx tocados en 0 errores (los .ts/.tsx no están
  cubiertos por la config actual de ESLint — situación preexistente).

### Verificación

```bash
pnpm build        # en verde
pnpm test         # igual al baseline (sin nuevos fallos)
pnpm exec eslint <archivos js/jsx tocados>
```

## 3. Criterios de aceptación

1. Login vendedor → el menú lateral muestra "Directorio de Contactos" (por
   `clients:read`) pero SIN expectativas de admin; `/configuracion/usuarios`
   sigue oculto/no accesible.
2. `/parties` con vendedor: solo tab Clientes, sin tab Proveedores; botones
   crear/editar visibles y funcionando (tiene `clients:write`).
3. URL directa a `/parties` con un usuario sin ningún permiso de parties →
   pantalla "Acceso Restringido" del PermissionGuard.
4. En el POS (`/ventas` → checkout): paso Cliente muestra "Nuevo cliente";
   crear un cliente mínimo lo autoselecciona sin salir del wizard.
5. Admin: ve ambos tabs, todo igual que antes.
6. Demo mode (`VITE_USE_DEMO=true`): el usuario vendedor demo refleja 1-4.

## 4. Dependencia con el backend

Requiere del plan maestro (business_management): B1 (permisos
`clients:read/write`, `suppliers:read/write`), B2 (rutas tipadas con esos
permisos), B4 (login y `/me` devuelven `permissions`; `/me` accesible sin
`users:read`). Sin B4, `hasAnyPermission` no tiene datos con los que decidir.

## 5. Fuera de alcance (registrado)

- Migración de los modales legacy de Clientes/Proveedores a `.tsx`/
  EnhancedModal (los componentes nuevos ya lo cumplen).
- Formularios duplicados no activos (`src/components/clients/`,
  `src/components/suppliers/`, `ClientSelector.jsx`/`ClientCardSelector.jsx`
  huérfanos) — limpieza pendiente.
- Fallos de test preexistentes y OOM de `Suppliers.toasts.test.jsx`.

## 6. Plan futuro diferido (D2): barrido de guards de rutas

Rutas sin guard (solo ocultas en el menú, alcanzables por URL directa):
dashboards analíticos, sales-analytics, BI/pronósticos, profitability,
inventory-analytics, receivables, payables, finance, `/compras`,
presupuestos, caja-registradora, movimientos-caja, pagos/cobros,
ajustes-precios, agenda, movimientos-stock, requisiciones, monedas,
tipos-cambio, `/configuracion` (Settings). Mecanismo a reutilizar:
`PermissionGuard` con el permiso `recurso:read` de cada módulo (ya existen en
backend, ej. `analytics:read`, `payables:read`). Plan separado — no mezclar
con este cambio.
