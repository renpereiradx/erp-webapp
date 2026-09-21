# BI Pack Premium — plumbing y UX de licencias FE (cierre 2026-09-21)

**Plan maestro:** `../conductor/PLAN_BI_PACK_PREMIUM.md` (root) — F3–F4 completas.
**Commit:** `b3ab4eb` (rama `dev`).
**Contrato BE:** `GET /api/v1/system/license`, campo `entitlements` en login/`/me`, 403 plano
`MODULE_NOT_LICENSED` (detalle en el conductor BE y `RUNBOOK_LICENCIAS_2026-09.md`).

## Qué se implementó (F3 plumbing)

- `utils/entitlements.ts`: espejo localStorage con el mismo fail-open de `userPermissions`.
- `AuthContext`: `entitlements` + `hasEntitlement` (sin bypass por rol) + `refreshEntitlements`;
  persiste en login, `initializeAuth` y token-refresh; demo mode finge el pack
  (`DEMO_ENTITLEMENTS`). Hook `useBiPackEnabled`.
- `components/auth/BiModuleRoute.tsx` (redirect `/pedidos` + toast, clon de
  `ReservationsModuleRoute`) y `HomeRedirect.tsx` con la regla ADR-6 (sin pack, admin aterriza en
  `/pedidos`). Extraídos de App.tsx para testear.
- 41 rutas BI (dashboard, payables, finance no-SIFEN, bi/pronosticos, profitability, receivables,
  sales-analytics, inventory-analytics, auditoría) detrás de `BiPermissionGuard` — licencia
  fuera, permiso dentro, igual que la cadena BE.
- Nav: `buildNavigation(t, reservationsEnabled, biEnabled = true)` — el grupo `common.bi` entero
  es el pack. Carve-out ADR-3: sin pack, SIFEN migra a un grupo Core "Fiscal (SIFEN)".
- Dispatcher: `403 MODULE_NOT_LICENSED` → evento `api:module_not_licensed` (también en GET,
  suprime `api:forbidden` duplicado). Listener en App: `refreshEntitlements()` + toast — la
  revocación en caliente expulsa de la ruta BI vía re-render del guard.
- i18n `licensing.*` es/en.

## Qué se implementó (F4 UX)

- `features/settings/components/LicenseStatusPage.tsx` (`/configuracion/licencia`, auth-only) +
  fila "Licencia" en Settings.
- `components/license/LicenseBanner.tsx` (MainLayout): aviso con ≤30 días, en gracia o vencida;
  solo con enforcement ON.
- `services/licenseService.ts`.

## Gates y tests

- vitest **1079/1079** (147 archivos) · `tsc --noEmit` 0 · `pnpm build` ok · `lint:design`
  "Código nuevo limpio".
- Tests nuevos: `entitlements.test.ts`, `navigation.bi-pack.test.ts` (admin+BI / admin sin BI /
  vendedor), `bi-pack-routes.test.tsx` (HomeRedirect + BiModuleRoute con toast dedup),
  `AuthContext.entitlements.test.tsx` (login/me/revocación/logout), `BusinessManagementAPI.license.test.ts`,
  `LicenseBanner.test.tsx`.

## Notas para el siguiente agente

- `hasEntitlement`/`hasStoredEntitlement` son **fail-open** con `null` (backend legacy, primer
  render): no "corregirlos" a fail-closed — el enforcement real es el 403 del BE y el patrón
  replica el de permisos.
- Smoke FE en navegador (nav sin BI, landing `/pedidos`, deep-link → redirect con toast) queda
  como demo con el cliente: pasos en el runbook §3/§7.
