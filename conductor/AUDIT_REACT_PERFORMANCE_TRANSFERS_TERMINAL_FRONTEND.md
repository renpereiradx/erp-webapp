# AUDIT — React Performance (FASE D + F.4/F.5/F.7 — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)

**Fecha:** 2026-09-05
**Alcance:** código nuevo de este deploy — feature `src/features/transfers/` (F.4), CTA
post-compra (F.5), guardas de rutas (F.7), emparejamiento de terminal (D.3/D.4) y gating
de `BranchSwitcher` (D.5). Skill: `vercel-react-best-practices` (reglas `rerender-*`,
`rendering-*`, `bundle-*`, `client-*`, `js-*`; las `server-*` no aplican: SPA Vite sin SSR).

## Aplicadas en el diseño

| Regla | Aplicación |
| :---- | :--------- |
| `rerender-no-inline-components` | Cero componentes definidos dentro de componentes. `TransfersPage`, modales y filas son módulos de primer nivel; los callbacks pasan como props. |
| `rerender-lazy-state-init` | `CreateTransferModal` inicializa las líneas precargadas con `useState(() => linesFromPreloaded(...))` — el mapeo corre una sola vez. |
| `rerender-functional-setstate` | Mutaciones de listas de ítems con `setLines(prev => ...)`, paginación con `setPage(p => p ± 1)`. |
| `rerender-derived-state-no-effect` | `branchNameById` (Map) y `extractTransfers` se derivan en render/`useMemo`, sin efectos de sincronización. `totalPages` es cálculo directo. |
| `rerender-use-ref-transient-values` / no-effect | El debounce del buscador usa un único `useEffect` con `setTimeout` + cleanup sobre `searchTerm`; la query solo se dispara con ≥2 chars (`enabled`). |
| `client-swr-dedup` (dedup de fetch) | Todo el fetching vía react-query con `queryKey` estables (`branches-names` con `staleTime` 5 min compartido por bandeja, wizard y terminal; `branch-transfers` por estado+page). Mutaciones invalidan por key exacta. |
| `js-index-maps` / `js-set-map-lookups` | Búsqueda de nombres de sucursal por `Map` (`branchNameById`), no `find` por fila. |
| `js-early-exit` | Guards tempranos en handlers (`if (!transfer) return`, `canSubmit` compuesto antes de mutar). |
| `bundle-barrel-imports` | Imports directos de módulos (`@/services/branchTransferService`, `../hooks/...`), sin barrels nuevos. |
| `client-localstorage-schema` | `device.defaultBranch` centralizado en `src/utils/deviceBranch.ts` (única fuente de lectura/escritura/parseo, `parseInt` con NaN guard). |
| `rendering-conditional-render` | Acciones del workflow renderizadas por estado (`nextActionForStatus`); guards de permiso con `PermissionGuard`/`hasPermission` en vez de montar y ocultar. |

## Hallazgos y decisiones

1. **[Corregido] `useMemo` con cleanup:** la primera versión del debounce usaba `useMemo`
   para el timer — `useMemo` no ejecuta funciones de limpieza. Corregido a `useEffect` con
   `clearTimeout` (evita un timer huérfano por tecla).
2. **[Aceptado] `branchNameById` se recalcula si `branchesResponse` cambia:** el resultado
   viene cacheado 5 min; recrear el Map es O(n) con n≈decenas. No se memoiza más fino
   (regla: no optimizar de más).
3. **[Aceptado] `usePendingTransfersCount` dispara una query extra con `page_size: 1`:**
   el badge de pendientes es la señal operativa del depósito; `staleTime` 30 s acota el
   costo y la invalidación por mutación lo mantiene exacto.
4. **[Documento] `TransferDetailModal` muestra el estado fresco** desde la respuesta de la
   mutación (detalle invalidado), no el snapshot de la fila — evita mostrar acciones ya
   consumidas tras aprobar/despachar.

## Verificación

- `npx tsc --noEmit` 0 errores.
- `npx vitest --run` 532/532 (incluye 10 tests de transfers, 3 del CTA F.5, 7 de BranchContext con 3 nuevos de D.4).
- `pnpm build` OK; `pnpm lint:design` sin violaciones en código nuevo.
