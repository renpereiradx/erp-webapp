# AUDIT — Performance React del módulo BI (vercel-react-best-practices)

**Fecha**: 2026-09-16 · **Área**: módulo BI "Inteligencia de Negocios" (páginas, features y
stores bajo `src/pages/{Dashboard*,sales-analytics,Receivables*,Payables*,InventoryAnalytics}`,
`src/features/{cash-flow,accounts-payable,receivables,bi-forecasting,profitability}`,
`src/store/useDashboardStore.ts`, hooks `src/hooks/use{Payables,FinancialReports}.js`)
· **Skill**: `vercel-react-best-practices` (workspace) · **Gatillo**: FASE 4 del plan raíz
`PLAN_AUDIT_BI_INTELIGENCIA_NEGOCIOS_2026-09-14.md`.

Alcance de reglas: la app es una **SPA Vite sin SSR** — las reglas `server-*` no aplican.
Se auditaron `async-*`, `bundle-*`, `client-*`, `rerender-*`, `rendering-*` y `js-*`.

Método: lectura directa de las 12 páginas/8 archivos migrados en FASE 4 (commits
`1fdb8d3`→`46d1857`), más barrido dirigido (grep + lectura) de las páginas BI legacy no
migradas, del store global de dashboard y del resultado de `pnpm build`.

## Resumen ejecutivo

| # | Hallazgo | Regla | Impacto | Estado |
|:--|:---------|:------|:--------|:-------|
| H1 | **Un solo chunk de 3.3 MB**: `dist/assets/index-*.js` contiene TODAS las páginas + recharts (sin `React.lazy` por ruta en `App.tsx`) | `bundle-dynamic-imports` | CRÍTICO (TTI inicial) | ✅ Resuelto (`7e33f7b`: index 913-940 kB) |
| H2 | **Suscripción sin selector al store global**: `useDashboardStore()` completo en 5 páginas (Dashboard, DetailedKPIs, ConsolidatedAlerts, TopProductsOverview) — cualquier set del store re-renderiza las 5 | `rerender-defer-reads` / selector granularity | ALTO | ✅ Resuelto (`7e33f7b`: selectores atómicos en 6 consumidores) |
| H3 | **Fetch sin guard de desorden/desmontaje** en `useDashboardStore` (`fetchDashboardData` no tiene `mounted`/abort): cambiar de período rápido puede pintar la respuesta vieja | `client-*` (race) / honestidad | ALTO | ✅ Resuelto (`7e33f7b`: guard de secuencia en los 4 fetchers + fallbacks demo) |
| H4 | **Páginas pesadas no divididas**: ConsolidatedAlerts (501 líns, 4 `.map` + 4 `.filter` por render), DetailedKPIs, InvoicesMasterList (533) renderizan todo en cada render sin `useMemo` en derivados | `rerender-memo` / `js-set-map-lookups` | MEDIO | ✅ Ya cubierto (verificado en `7e33f7b`: derivados con useMemo; master list filtra server-side post-T9) |
| H5 | **Recharts se monta eager** con la app (AreaChart/BarChart importados estáticamente en ~15 páginas BI) — junto a H1 explica el chunk gigante | `bundle-conditional` | MEDIO-ALTO | ✅ Resuelto (`7e33f7b`: vendor chunk recharts 366 kB, solo lo cargan páginas BI lazy) |
| H6 | `isMounted` manual en 4 páginas migradas para recharts (`useState`+`useEffect` que solo setea true) — patrón correcto pero repetido; candidatos a hook compartido | `rerender-lazy-state-init` (menor) | BAJO | Deuda aceptada |
| H7 | UI decorativa sin handler heredada de F2/P1-8 en páginas legacy NO migradas (chips bloqueados de DetailedKPIs, selects de SalesHeatmap, Exportar/Ver Detalles de sales Dashboard) — el gate FE-2 "toda afordancia funciona o desaparece" sigue abierto fuera del alcance FASE 4 | regla FE-2 del plan | MEDIO (honestidad) | ✅ RESUELTO (FASE 5, FE `5ef861c` — ver nota al pie) |

Lo que **ya quedó resuelto** por la migración FASE 4 (ver plan
`conductor/PLAN_FASE4_MIGRACION_TSX_BI_2026-09-16.md`):

- **Crash en vivo** de `TrendsVelocity` (TDZ sobre `trendsData`) — la regla de tipado la
  habría cazado en compile-time; resucitada en `7ab6c85`.
- **Serie fabricada** "Período B" en `PeriodComparison` (×0.85/×1.15) → series reales de
  `/trends/date-range` traídas en `Promise.all` (`async-parallel` ✅).
- **Selector de período muerto** en `sales-analytics/Dashboard` (string crudo en lugar de
  `{period}`) y **estado error nunca renderizado** → corregidos.
- **Series muertas** del `TrendChart` de cash-flow (dataKey vs contrato del hook) → alineadas.
- Clases dinámicas `bg-${color}-500` no compilables → mapa de tokens.
- Fetches independientes en `Promise.all` en las 6 páginas migradas que disparan +1 request
  (`async-parallel`), helpers puros a nivel de módulo (`rendering-hoist-jsx`/`js-*`),
  `useMemo` en derivados de gráficos (curvas, segmentos de donut, máximos de heatmap).

## Detalle de hallazgos

### H1 — Bundle único de 3.3 MB (CRÍTICO)

Evidencia: `pnpm build` (2026-09-16) produce `dist/assets/index-Dv_dhFkO.js` **3.3 MB**
(minificado, pre-gzip) + `radix` 88 KB, `lucide` 72 KB, `router` 40 KB. `src/App.tsx`
importa las ~100 páginas estáticamente (cero `React.lazy` en el archivo). Cada página BI
(los 9 grupos ≈ 36 rutas) y `recharts` viajan al usuario de `/pedidos` aunque nunca entre
al BI.

Recomendación (en orden de retorno):
1. `React.lazy(() => import(...))` por grupo de rutas BI en `App.tsx` + `<Suspense>`
   (las rutas BI ya viven bajo layouts gated `analytics:read` — el corte por grupo es
   natural). Solo las páginas de llegada (`/pedidos`, `/dashboard`) quedarían eager.
2. `manualChunks` para `recharts` + `d3-*` (vendor separado, cacheable entre páginas BI).
3. Medir con `rollup-plugin-visualizer` tras el corte (esperado: index < 1 MB).

No se ejecutó en FASE 4 por ser un cambio transversal de routing (merece su propia tarea
con smoke completo — ver "Propuesta de trabajo" al final).

### H2 — Suscripción completa al store (ALTO)

Evidencia: `src/pages/Dashboard.jsx:55`, `DetailedKPIs.jsx:18`, `ConsolidatedAlerts.jsx:71`,
`TopProductsOverview.jsx:18` — todas destructuran `useDashboardStore()` **sin selector**
(patrón Zustand correcto: `useDashboardStore(s => s.summary)`). El store concentra summary,
kpis, trends, alerts, activities, profitabilityTrends, receivablesOverview, payablesOverview
y salesPerformance: cualquier `set()` re-renderiza las 4-5 páginas montadas a la vez (el
sidebar BI permite navegar entre ellas sin desmontar el layout).

Recomendación: selectores atómicos por campo; para derivados, `useShallow` de
`zustand/react/shallow` con objetos de selección. Cambio mecánico y barato por página.

### H3 — Carrera de respuestas en `useDashboardStore` (ALTO)

Evidencia: `fetchDashboardData(period)` dispara `Promise.all` interno y `set()` al terminar,
sin `mounted`/`AbortController` ni comparación del período pedido; el hook `useBIForecasting`
sí lo hace (`let mounted = true` + guard). Cambiar hoy/mes/año rápido en `/dashboard` puede
resolver en otro orden y pintar el período incorrecto sin ningún aviso.

Recomendación: request-id interno (comparar el `period` con el `period` actual del store
antes de `set`) o `AbortController` por fetch. El patrón ya existe en el repo
(`useBIForecasting.js`) — copiar.

### H4 — Derivados re-computados en páginas pesadas (MEDIO)

Evidencia: `ConsolidatedAlerts.jsx:137-164` ejecuta 4 `.filter` sobre `alerts` más el
encadenado de filtros en cada render (incluidos re-render por tipeo en el buscador); con
`useDashboardStore()` sin selector (H2), cualquier store-set los re-ejecuta igual.
`TopProductsOverview.jsx:48-55` repite el patrón. Nada de esto es catastrófico con los
volúmenes actuales (decenas de alertas), pero escala mal y amplifica H2.

Recomendación: `useMemo` con dependencias primitivas (`alerts`, `filterSeverity`,
`filterCategory`, `search`) — `rerender-dependencies` — y `Set`/`Map` para lookups de
categorías si la lista crece (`js-index-maps`).

### H5 — recharts eager (MEDIO-ALTO)

Evidencia: imports estáticos de `recharts` en ~15 páginas BI; al no haber code-splitting
(H1) el gráfico pesa en el primer load de cualquier ruta. La librería se mantiene por
decisión del plan (no-scope), pero su **forma de carga** no: con `React.lazy` por grupo BI,
recharts queda automáticamente fuera del chunk inicial.

### H6 — `isMounted` repetido (BAJO, deuda aceptada)

Las 4 páginas con gráficos migradas repiten el mini-patrón `const [isMounted, setIsMounted] =
useState(false); useEffect(() => setIsMounted(true), [])` para `ResponsiveContainer`.
Funcional y barato; si se toca de nuevo, extraer `useIsMounted()` en `src/hooks/`.

### H7 — Afordancias decorativas heredadas (MEDIO, honestidad)

Fuera de las páginas migradas (alcance FASE 4 = solo las sustancialmente tocadas en FASE 3),
sobreviven controles sin handler ya documentados en la auditoría F2: chips candado de
`DetailedKPIs`, selects sin cablear de `SalesHeatmap`, botones "Exportar"/"Ver Detalles" de
`sales-analytics/Dashboard.tsx` (los preservamos en la migración por ser fidélita) y
"Filtrar/Exportar" + paginación muerta de `ActiveObligationsTable.tsx` (feature migrado,
comportamiento preservado). Regla FE-2: cablear o quitar en la próxima pasada (FASE 5).

## Verificación por archivo migrado (reglas aplicadas y confirmadas)

| Archivo | Cumple | Notas |
|:--------|:-------|:------|
| `AuditDashboard.tsx` | `async-parallel`, `rendering-hoist-jsx` (buildCurvePath a nivel módulo), `rerender-simple-expression-in-memo` (solo memos con trabajo real) | ✅ |
| `AuditLogs.tsx` | debounce de fetch con cleanup del timer, paginación server-side (menos DOM) | ✅ |
| `FinancialSummaryDashboard.tsx` | `async-parallel` (3 fetches del hook en paralelo desde la página), contratos tipados | spinner legacy → H7-adyacente (§6.7) |
| `useCashFlow.ts` + 3 comps + página | `async-parallel`, tipos FSD (`types.ts`), derivados baratos en render | ✅ |
| `useSupplierAnalysis.ts` + 4 comps + página | ídem; `resolveContact` pura a nivel módulo | `Filtrar/Exportar` decorativos → H7 |
| `sales-analytics/Dashboard.tsx` | `Promise.all` n/a (1 fetch), memo de derivados del store, error banner honesto | Exportar/Ver Detalles → H7 |
| `CustomerSellerInsights.tsx` | `async-parallel`, `getSegmentStyles` puro (switch cerrado) | ✅ |
| `PeriodComparison.tsx` | `async-parallel` (compare + 2 trends en paralelo), merge O(n) por índice (`js-combine-iterations` razonable), sin componentes inline | ✅ |
| `TrendsVelocity.tsx` | `Promise.all` ×4, `heatmapMax` single-pass O(days×24) (~170 ops, sin memo necesario — `rerender-simple-expression-in-memo`) | ✅ |
| `PronosticoDemanda.tsx` / `PronosticoIngresos.tsx` | paginación server-side (DOM acotado), mapa de tokens O(1), `params` memoizado por `page` | ✅ |

## Resolución (2026-09-17, sesión post-FASE 5)

**H1+H5 · `7e33f7b` — code-splitting**: todas las rutas menos las landings (dashboard,
pedidos, login, select-branch + shells) son `React.lazy` con un `<Suspense>` único
(PageLoader con tokens DESIGN). recharts a vendor chunk propio (366 kB) que solo cargan
las páginas BI. **Índice inicial: 3.387 kB → ~913-940 kB (-73%; gzip 812 → ~252 kB).**
Smoke de navegación verificado en vivo (BI + pedidos + catálogo + sucursales).

**H2 · `7e33f7b` — selectores atómicos**: los 6 consumidores sin selector (Dashboard,
DetailedKPIs, ConsolidatedAlerts, TopProductsOverview, SalesHeatmap, SalesNew) usan
`useDashboardStore((s) => s.campo)` por campo.

**H3 · `7e33f7b` — guard anti-carrera**: contadores de secuencia por fetcher
(dashboard/KPIs/heatmap/topProducts) en `useDashboardStore`; una resolución vieja no pinta
estado ni dispara el fallback demo.

**H4 · verificado**: ConsolidatedAlerts/TopProductsOverview ya derivaban dentro de
`useMemo` e InvoicesMasterList filtra server-side (T9) — sin trabajo pendiente real.

**H6** sigue como deuda aceptada; **H7** resuelto en FASE 5 (`5ef861c`).

**Retro-i18n · `4be20be`**: sweep completo del módulo BI (12 páginas + 8 archivos de
features) al nuevo namespace `locales/{es,en}/bi.js` (296 keys); el hook de proveedor emite
claves de estado estables y la tabla resuelve labels con i18n; `fakeT` global de
vitest.setup.ts corregido a la firma real `t(key, fallback, vars)`.

Gates finales de la sesión: vitest 734/734 · tsc 0 · build (index ~940 kB) · lint:design
limpio · smoke bilingüe (es/en) en navegador.
