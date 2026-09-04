# PLAN — Alineación "Usuarios y Seguridad" (usuarios · sesiones · perfil)

Fecha: 2026-09-04
Alcance: `/configuracion/usuarios`, `/configuracion/usuarios/:id`, `/configuracion/sesiones`, `/configuracion/perfil`
Referencias: `DESIGN.md` · `AGENTS.md` (Feature-Sliced + TS) · skill `vercel-react-best-practices`

## Diagnóstico

1. **Gestión de Usuarios** (`pages/UserManagementList.tsx` + `pages/UserDetailedProfile.tsx`): ya TSX
   pero monolítico en `pages/`, sin feature-sliced; usa `window.confirm` (§6.6 exige modal);
   clases genéricas (`slate-*`, `bg-white`, `rounded-xl/2xl`), `as any` en el store, botones
   artesanales con `font-black uppercase` fuera de tabla de tokens; `alert('Próximamente')` para
   reset; sin estados loading/empty/error (§6.7); bulk activate/deactivate secuencial (`for await`).
2. **Control de Sesiones** (`pages/AdminSessionsDashboard.tsx`): 100% hardcoded en español (sin i18n),
   sin feature-sliced, métricas derivadas inline en el componente, insights con **datos fabricados**
   (barchart estático y distribución geográfica inventada), `material-symbols` en vez de lucide,
   `text-2xl font-black`, sin empty state (solo texto plano), footer de paginación muerta.
3. **Mi Perfil** (`features/profile/`): ya Feature-Sliced pero **no alineado a DESIGN**: hero con
   **gradiente** (§1.9 prohíbe), badges `Activo` hardcoded, tokens viejos (`text-*-light/dark`,
   `fluent-danger`, `shadow-card`, `glass-mica` sin criterio), `material-symbols`, labels sin
   `htmlFor`, fortaleza de contraseña con `yellow-400/500`, `t: any`.
4. **Bug real:** `ManageRolesPanel.jsx` usa clases `role-sidebar__*` que **no existen en ningún CSS**
   → el panel se renderiza sin estilos. Además `ManageRolesModal.jsx`, `RoleManagementModal.jsx` y
   `roles/RoleAssignmentSidebar.jsx` están **muertos** (cero imports).
5. **Gates inconsistentes:** la navegación filtra el grupo por `users:read`, pero las rutas usan
   `RoleGuard allowedRoles={['F2VLso']}` → un usuario con `users:read` ve el menú y recibe bloqueo
   al entrar. `perfil` no tiene gate (correcto).

## Dirección

Un feature por dominio, estructura idéntica a `features/attributes` / `features/cash-register`,
lógica pura en `src/domain/`, páginas en `pages/` como wrappers finos (precedente:
`MyProfileAndSecurity` → `ProfilePage`).

```
src/domain/users/userDisplay.ts        ← fullName, initials, roleBadgeTone (puro)
src/domain/sessions/
  ├── sessionFilters.ts                ← filterSessions(sessions, {search,status})
  ├── sessionMetrics.ts                ← computeSessionMetrics(sessions)
  ├── sessionInsights.ts               ← activityByHour + locationDistribution (DATOS REALES)
  └── sessionDisplay.ts                ← displayName/email/initial/deviceKey
src/domain/profile/passwordStrength.ts ← scorePassword (puro, labels por i18n fuera)

src/features/users/
  ├── types/index.ts · index.ts
  ├── hooks/useUsersList.ts            ← selector del store + selección + bulk (Promise.all)
  ├── hooks/useUserDetail.ts           ← detalle + toggle status + delete
  ├── schemas/userForm.schema.ts       ← Zod + resolver (react-hook-form)
  └── components/
      ├── UsersPage.tsx                ← PageHeader + toolbar + tabla + paginación + modales
      ├── UsersToolbar.tsx · UsersTable.tsx · UsersPagination.tsx
      ├── UserDetailPage.tsx           ← breadcrumb, resumen, acciones, roles, seguridad
      ├── UserFormModal.tsx            ← ex UserModal.tsx, alineado + Zod
      ├── ManageRolesPanel.tsx         ← RECONSTRUIDO con tokens (bug CSS muerto)
      └── ConfirmDialog.tsx            ← EnhancedModal variant="error" (§6.6)

src/features/sessions/
  ├── index.ts
  ├── hooks/useAdminSessions.ts        ← fetch + derivados (useMemo) + revoke/confirm
  └── components/AdminSessionsPage.tsx ← métricas, toolbar, tabla, insights reales

src/features/profile/components/*      ← realineados (sin gradiente, lucide, tokens, htmlFor)
src/lib/i18n/locales/es/
  ├── users.js                         ← +claves bulk/paginación/reset
  ├── sessions.js                      ← NUEVO (admin sesiones)
  └── my-profile.js                    ← +claves dispositivos/estados
```

Decisiones clave:

- **Insights con datos reales:** el barchart se deriva de `last_activity` (buckets de 2h) y la
  distribución geográfica de `location_info`; sin datos → `EmptyState`. Se elimina el contenido
  fabricado. Paginación muerta del footer: eliminada (el endpoint admin no pagina).
- **`window.confirm`/`alert` → `ConfirmDialog`** (EnhancedModal `variant="error"`) y toast i18n.
- **Estados §6.7 en las 3 vistas de datos:** `GenericSkeletonList` / `EmptyState` (con CTA) /
  `ErrorState` (con `onRetry`); 403 de sesiones → `ErrorState` con acción "Volver".
- **Rerender/JS:** derivados con `useMemo`, handlers estables (`useCallback`), sin componentes
  definidos dentro de componentes, bulk con `Promise.allSettled`, `Map` para lookup de roles.
- **Store:** se conserva `useUserStore` (Zustand global); los hooks del feature lo tipan en el borde.
- **Guards:** rutas de `usuarios` y `sesiones` → `PermissionGuard permission="users:read"`
  (consistente con la navegación); `perfil` sin gate. Cambio de autorización documentado aquí.

## Verificación
`npx tsc --noEmit` · `pnpm lint:design` · `pnpm test` (baseline 44 fails) · `pnpm build` ·
revisión visual en :5173 (reiniciar dev server tras borrados).

## Fuera de alcance
- Reset password admin real (endpoint `changePasswordAdmin` existe; se deja con toast "próximamente").
- Migrar `useUserStore.js` a TS.
- Export/CSV de usuarios (botón queda, acción pendiente de backend).
