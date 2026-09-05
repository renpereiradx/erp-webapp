# Auditoría React Performance — FASE C Solicitudes de Anulación (frontend)

**Fecha:** 2026-09-05
**Alcance:** código nuevo de FASE C (PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES):
`features/sales/components/RequestCancellationModal.tsx`,
`features/sales/components/CancellationRequestsPanel.tsx`,
`features/sales/hooks/useCancellationRequests.ts`,
`features/sales/types/cancellation.ts`, integración en `pages/SalesNew.tsx`
(pestaña + badge), `SalesHistoryView.tsx` (rama de solicitud), servicios
(`saleService.ts`, `BusinessManagementAPI.ts`).
**Método:** revisión manual contra `vercel-react-best-practices` (reglas
aplicables a SPA Vite sin SSR; reglas `server-*` no aplican).
**Gates:** vitest 516/516 · tsc 0 errores · `pnpm build` OK · `lint:design` nuevo código limpio.

## Aplicadas

| Regla | Aplicación |
| :---- | :--------- |
| `rendering-hoist-jsx` / constantes de módulo | `filterTabs` y `statusVariant` hoisted fuera del componente en `CancellationRequestsPanel`. |
| `rerender-dependencies` | Effects del hook dependen de primitivos (`enabled`, `statusFilter`) y de `fetchRequests` (estable por `useCallback([], …)`). |
| `rerender-use-ref-transient-values` | El guard anti-carrera del fetch usa `fetchSequence` ref (comparación de secuencia) en vez de estado → sin re-renders extra. |
| `rerender-derived-state-no-effect` | `total`/`requests` no se derivan ni duplican: son estado de servidor cacheado en el hook; `pendingCount` es un valor cross-filter (no derivable del render) — justificado como estado transitorio de servidor, no estado derivado de UI. |
| `js-early-exit` | Handlers de servicio y panel con salidas tempranas (reason vacío, request nula). |
| `bundle-barrel-imports` | Iconos (`ClipboardX`, `SendHorizonal`, `ShieldX`) importados nominalmente de `lucide-react` (tree-shaking; sin mock global). |

## Aceptados (documentados, sin acción)

1. **Identidad de `toast`/`t` en deps de `useCallback`** (`rerender-dependencies`):
   `useToast` devuelve objeto `useMemo` que cambia cuando cambia `toasts`.
   Los callbacks `approve`/`reject` del hook se re-crean solo en ese caso (raro),
   no en cada render. Impacto: un re-render barato de la bandeja (lista corta,
   paginada a 50). No se memoiza `CancellationRequestsPanel` con `React.memo`
   porque es leaf y su re-render es trivial.
2. **Doble fetch al montar la bandeja** (`async-parallel`): listado + contador
   de pendientes corren en paralelo (no waterfall); el contador lleva debounce
   de 300 ms y sólo refresca el total. Aceptado por simplicidad; si la bandeja
   creciera, unificar en una sola llamada con `page_size=1`.
3. **`pendingCount` en segundo fetch separado**: no se deriva del listado
   porque el filtro activo puede no ser `pending` — evita estado derivado
   desincronizado a costa de una llamada liviana.
4. **`SalesNew.tsx` ya es una página grande**: la integración agrega un hook +
   2 handlers + 1 rama de render; la extracción de `SalesHistoryView`/panel a
   feature-sliced mantiene el delta mínimo. Refactor mayor de la página queda
   fuera de esta fase (ya planificado en la migración Feature-Sliced de sales).

## Verificación

- `npx vitest --run` → 516/516 (incluye 11 tests nuevos en
  `features/sales/__tests__/CancellationRequests.test.tsx`).
- `npx tsc --noEmit` → 0 errores.
- `pnpm build` → OK (warnings de chunk-size preexistentes).
- `pnpm lint:design` → "Código nuevo limpio".
