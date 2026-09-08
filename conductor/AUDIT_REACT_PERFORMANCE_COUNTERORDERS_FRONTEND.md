# AUDIT_REACT_PERFORMANCE_COUNTERORDERS_FRONTEND

**Fecha:** 2026-09-08
**Alcance:** FASE 2 de `PLAN_PEDIDOS_MOSTRADOR_VENDEDOR_CAJA` — feature `src/features/counterorders/`, `src/domain/counterorders/cart.ts`, `src/store/useCounterOrderPreloadStore.ts`, `src/services/counterOrderService.ts`.
**Skill:** `vercel-react-best-practices` (reglas aplicables a SPA Vite sin SSR: `rerender-*`, `rendering-*`, `bundle-*`, `client-*`, `js-*`; `server-*` no aplica).
**Resultado:** 595/595 tests, `tsc --noEmit` 0 errores, `pnpm build` OK, `lint:design` código nuevo limpio.

## Hallazgos y decisiones

| # | Regla | Hallazgo | Acción |
|:-:|:------|:---------|:-------|
| 1 | `rerender-functional-setstate` | Carrito: toda mutación usa `setLines(prev => …)` | ✔ Correcto desde el diseño (`addLine`/`setQuantity` inmutables en `domain/counterorders/cart`) |
| 2 | `rerender-derived-state` / `no-effect` | `units` y `lowStock` derivados de `lines` | ✔ `useMemo`, sin estado duplicado ni effects |
| 3 | `rerender-memo` | El objeto devuelto por `useOrderCart` se recreaba cada render → invalidaba los `useCallback([cart])` del builder | ✔ **Corregido**: retorno del hook memoizado con `useMemo` (deps estables); `handleAddProduct` queda estable |
| 4 | `rerender-no-inline-components` | Grilla del picker re-renderiza por tecla de búsqueda | ✔ **Corregido**: `ProductPickCard` extraído a componente de módulo + `memo` (props estables tras #3) |
| 5 | `rerender-move-effect-to-event` | Hidratación del builder en edición corre en `useEffect([open, mode, editingOrder])` | ⚠ Aceptado con comentario: es el patrón reset-on-open del modal; el disparador real ("abrir en modo edición") no es un evento del árbol. Riesgo bajo (effect barato, idempotente) |
| 6 | `bundle-barrel-imports` | Reuso del catálogo | ✔ Imports directos a archivos (`@/features/catalog/hooks/…`, `@/features/catalog/types`), no al barrel. El feature expone `index.ts` propio solo como superficie pública (paridad con `catalog`) |
| 7 | `bundle-dynamic-imports` | Página bajo ruta única `/pedidos` | ✔ Sin imports de módulos pesados a nivel App; `EnhancedModal` ya es liviano. Deuda conocida del shell: chunk único >500 kB (pre-existente, fuera de este diff) |
| 8 | `js-set-map-lookups` | `addLine` usa `Array.find` por key | ⚠ Aceptado: carritos de mostrador son <50 líneas; O(n) lineal es dominante solo en listas grandes. No abstraer |
| 9 | `rendering-conditional-render` | Guards con `&&` | ✔ Verificado sin fugas de `0`/`''` (los campos nullable se chequean con `!= null`) |
| 10 | `client-event-listeners` / `client-localstorage-schema` | — | ✔ Sin listeners globales nuevos ni localStorage nuevo (el store de precarga es memoria) |
| 11 | `async-parallel` / `async-defer-await` | `handleEditDetail` (1 await), `handleBarcode` (1 await) | ✔ Sin waterfalls; la edición trae el detalle recién al clickear (defer) |
| 12 | `rerender-defer-reads` | Página suscripta a `user`/`hasPermission` de AuthContext | ⚠ Aceptado: el gating de CTA depende del permiso; el contexto ya es estable |

## Deuda observada (no bloquea, para fases siguientes)

- `SalesNew.tsx` sigue siendo el punto de integración de FASE 3; la orquestación debe vivir en `useCounterOrderCheckout` (hook nuevo), no engordando la página (riesgo §7 del plan).
- El agrupamiento del escáner en `useBarcodeScanner` (sales) agrupa solo por `productId`; el builder implementa su propio escaneo para respetar `variant_id`. Si se unifica, mover `salesScan`-to-cart a un adaptador compartido en `domain/`.
