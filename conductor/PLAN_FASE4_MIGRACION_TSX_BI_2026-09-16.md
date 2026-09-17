# PLAN — FASE 4 del audit BI: migración .tsx/FSD + checklist DESIGN + auditoría React

**Fecha**: 2026-09-16 · **Tipo**: Frontend (erp-webapp) · **Fuente**: FASE 4 de
`conductor/PLAN_AUDIT_BI_INTELIGENCIA_NEGOCIOS_2026-09-14.md` (raíz)

## Objetivo

Migrar a `.tsx` + Feature-Sliced las páginas legacy del módulo BI **sustancialmente tocadas
en FASE 3**, verificar checklist DESIGN.md (§10, §6.7, §6.3) por página, auditar el área BI
contra la skill `vercel-react-best-practices` (reporte en
`conductor/AUDIT_REACT_PERFORMANCE_BI_FRONTEND.md`) y no introducir strings nuevos fuera de
`i18n`.

## Criterio de alcance (binario)

Se migra toda página legacy (`.jsx`) del módulo BI cuyo diff de FASE 3
(`7e30db9..7c2baac`) sea **sustancial** (≥ ~20 líneas cambiadas o reescritura de su hook
principal). Páginas con toques triviales (≤ ~15 líneas: borrado de botones muertos, unwrap de
envelope, leaks saneados) quedan fuera — su migración corresponde a la fase de Feature-Sliced
de cada módulo, no a este audit.

## Alcance (12 páginas + 8 archivos de feature)

| Grupo | Página (legacy) | Diff F3 | Destino |
|:------|:----------------|:--------|:--------|
| A Auditoría | `src/pages/AuditDashboard.jsx` | 453 líns (F3C) | `.tsx` |
| A Auditoría | `src/pages/AuditLogs.jsx` | 285 líns + CSV (F3C, cierre 5) | `.tsx` |
| B Financiero | `src/pages/FinancialSummaryDashboard.jsx` | 180 líns (F3F) | `.tsx` |
| C Cash-flow | `src/pages/CashFlowProjection.jsx` | 70 líns (F3B) | `.tsx` |
| C Cash-flow | `features/cash-flow/hooks/useCashFlow.js` | 150 líns (F3B) | `.ts` |
| C Cash-flow | `features/cash-flow/components/{KpiSection,TrendChart,PaymentCalendar}.jsx` | 25 líns (F3B) | `.tsx` |
| D CxP/Proveedor | `src/pages/SupplierAnalysis.jsx` | 24 líns (F3B) | `.tsx` |
| D CxP/Proveedor | `features/accounts-payable/hooks/useSupplierAnalysis.js` | 200 líns (F3B) | `.ts` |
| D CxP/Proveedor | `features/accounts-payable/components/SupplierAnalysis/*` (3) | 136 líns (F3B) | `.tsx` |
| E Sales Analytics | `pages/sales-analytics/Dashboard.jsx` | 15 líns (F3H) | `.tsx` |
| E Sales Analytics | `pages/sales-analytics/CustomerSellerInsights.jsx` | 68 líns (F3F) | `.tsx` |
| E Sales Analytics | `pages/sales-analytics/PeriodComparison.jsx` | 31 líns (F3G/H) | `.tsx` |
| E Sales Analytics | `pages/sales-analytics/TrendsVelocity.jsx` | 22 líns (F3H/J) | `.tsx` |
| F Pronósticos | `features/bi-forecasting/components/PronosticoDemanda.jsx` | 44 líns + paginación (cierre 2) | `.tsx` |
| F Pronósticos | `features/bi-forecasting/components/PronosticoIngresos.jsx` | 11 líns (F3J) | `.tsx` |

Fuera de alcance (toques triviales, documentado): `InvoicesMasterList` (botones muertos),
`InvoiceDetail` (leak), `ReceivablesDashboard` (unwrap), `AgingReport` (stub fuera),
`ConsolidatedAlerts` (redirect), `SalesHeatmap` (2 líns), `ProductsCategories` (8 líns),
`ClientCreditProfile.jsx` (2 líns; su hook F3 `useClientCreditProfile` se audita en el
reporte de performance sin migrar página).

## Reglas de la migración

1. **Refactor fiel**: cero cambios de comportamiento/contenido visual. Misma estructura JSX,
   mismos datos, mismos strings (los preexistentes pueden quedar hardcoded — no son NUEVOS;
   sweep retro-i18n fuera de alcance, se anota). Strings nuevos → `t('clave', 'fallback es')`.
2. **Tipado**: props/estado/datos tipados; contratos de servicio importados de
   `src/services/bi/*` cuando existan, si no tipos locales en el archivo.
3. **FSD**: lógica de negocio/cálculos fuera de componentes (`domain/` u helpers puros);
   orquestación en hooks del feature; componentes visuales puros en `components/`.
   Las páginas de `src/pages/` quedan donde están (convención del repo: ver
   `InventoryAnalytics/*.tsx`), delgadas si el feature ya tiene folder.
4. **Performance**: aplicar reglas `rerender-*`/`js-*`/`async-*` de la skill donde el
   refactor ya toca (lazy state init, derivados en render no en effects, `useMemo` solo con
   trabajo real, sin componentes inline, `Promise.all` en fetches paralelos).
5. **Gates por grupo**: `npx vitest --run` 0 fallos · `npx tsc --noEmit` 0 · `pnpm build` ·
   `pnpm lint:design` + commit FE por grupo.
6. **Checklist DESIGN §10** por página migrada, registrado en §Checklist de este doc
   (desviaciones legacy honestas marcadas, gate `lint:design` solo exige código nuevo).

## Checklist DESIGN por página (se completa por grupo)

Devuelve `[x]` = verificado en el archivo migrado. Las páginas migradas quedan **limpias
contra `lint:design --base main`** (hex/clases genéricas/arbitrarios fuera de escala en
`className`): todo el contenido legacy de color slate/blue/emerald/rose/hex fue mapeado a
tokens §2 durante la migración. Desviaciones anotadas se documentan en
`AUDIT_REACT_PERFORMANCE_BI_FRONTEND.md` y quedan como deuda visible (no bloquean gate).

| Página | §10 tokens/hex | §10 t() en nuevo | §6.7 estados | §6.3 tabla | Commit |
|:-------|:---------------|:-----------------|:-------------|:-----------|:-------|
| AuditDashboard | [x] (ya token-clean de F3C) | [x] (sin strings nuevos) | [x] loading/error + vacíos por sección | [x] top usuarios | `1fdb8d3` |
| AuditLogs | [x] (ya token-clean de F3C) | [x] | [x] loading/error/empty en tabla | [x] logs paginada | `1fdb8d3` |
| FinancialSummaryDashboard | [x] slate/blue/green/red/amber → tokens | [x] | parcial: spinner legacy (no skeleton), error vía toast del hook | n/a | `bcc2280` |
| CashFlowProjection (+feature) | [x] slate/blue/green/orange → tokens | [x] | [x] loading/error/retry + vacío calendario | n/a | `fbecb52` |
| SupplierAnalysis (+feature) | [x] hex (#28a745, #137fec, #dc3545) y badges slate/red/amber → tokens | [x] | [x] loading/error/not-found | [x] obligaciones (ver reporte: Filtrar/Exportar/paginación decorativas heredadas) | `eedad31` |
| sales-analytics Dashboard | [x] slate/emerald/rose/hex → tokens | [x] | [x] error banner añadido (estado existía y no se mostraba) | [x] top productos | `7ab6c85` |
| CustomerSellerInsights | [x] amber/blue/slate/hex → tokens | [x] | [x] loading/error + filas vacías | [x] clientes y vendedores | `7ab6c85` |
| PeriodComparison | [x] slate/emerald/rose/hex → tokens | [x] | [x] skeletons + error + vacío | n/a | `7ab6c85` |
| TrendsVelocity | [x] slate/hex → tokens | [x] | parcial: sin loading dedicado en heatmap (charts con gate `!loading`) | n/a | `7ab6c85` |
| PronosticoDemanda | [x] slate/emerald/rose → tokens | [x] | [x] loading/error + paginación server-side | [x] categorías y productos | `46d1857` |
| PronosticoIngresos | [x] red/emerald/slate → tokens + dot de paleta compilable | [x] | [x] loading/error + estado sin escenarios | [x] mensual y categorías | `46d1857` |

Nota i18n: los strings preexistentes en estos archivos siguen hardcoded (deuda legacy del
área BI, fuera del alcance "sin strings NUEVOS hardcoded"); el sweep retro-i18n de las ~12
páginas migradas queda como tarea independiente estimada en el reporte de cierre.

## Hallazgos de la migración (drift que la conversión destapó)

1. **`TrendsVelocity` crasheaba en dev HEAD** (TDZ: `peakHourLabel` leía `trendsData`
   antes de su declaración) — resucitada y su heatmap usa el **máximo real del período**
   (P1-4: max fijo 1000000 sobrevivió a F3H/J). `7ab6c85`.
2. **`PeriodComparison` fabricaba la serie "Período B"** (`sales ×0.85 / ×1.15`): ahora
   ambas series vienen de `/trends/date-range` con los límites que el propio compare
   devuelve; nuevo `salesAnalyticsService.getTrendsDateRange`. `7ab6c85`.
3. **`sales-analytics/Dashboard` nunca enviaba `period`** (pasaba un string crudo a
   `getDashboard(params)`): el selector no filtraba; además su estado `error` no se
   renderizaba. Ambos corregidos. `7ab6c85`.
4. **`TrendChart` de cash-flow con series muertas**: `dataKey` inflows/outflows/net/date vs
   contrato real `name/ingresos/egresos/balance` (resto del drift 2A que sobrevivió a F3B).
   `fbecb52`.
5. **`PronosticoIngresos`**: `bg-${color}-500` dinámico nunca compilaba (Tailwind JIT) →
   mapa de tokens; fallbacks de período inventados → `—`. `46d1857`.

## Entregables

1. Este plan con checklist completo.
2. Commits FE por grupo (rama `dev`).
3. `conductor/AUDIT_REACT_PERFORMANCE_BI_FRONTEND.md` (área BI completa, reglas
   `rerender-*`/`rendering-*`/`bundle-*`/`client-*`/`js-*`; `server-*` no aplica — SPA Vite).
4. Avance en el plan raíz.
