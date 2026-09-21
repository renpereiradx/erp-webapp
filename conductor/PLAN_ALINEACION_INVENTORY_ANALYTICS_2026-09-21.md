# PLAN_ALINEACION_INVENTORY_ANALYTICS_2026-09-21

Alineación full del grupo legacy `src/pages/InventoryAnalytics/` (4 páginas + 12 componentes),
mismo estándar que las 19 páginas de PLAN_ALINEACION_BI_FRONTEND_2026-09-18. Detectado en el
smoke post-cierre (ver conductor/README.md del wrapper): el grupo no pasó por el plan y tenía
el contrato de datos roto además de las deudas cosméticas.

Hotfix previo de contrato ya mergeado: FE 43f5247 (tokens de período, fetch dual turnover+abc,
SummaryCard.changeValue opcional, mock fabricado eliminado de data/mockInventoryABCData.ts).

## Estado verificado contra API real (dev, 2026-09-21)

Los 8 endpoints de `/inventory-analytics/*` responden 200 y las formas coinciden con
`src/types/inventoryAnalytics.ts` salvo:

- `dashboard.kpis.potential_profit` NO existe (declarado en types; el real es
  `overview.potential_profit`, con fallback computable `total_value - total_cost`).
- Dashboard expone campos extra no tipados (top_movers, slow_movers, trends, dead_stock_value,
  reorder_alerts) — fuera de alcance, no se consumen.
- `reorder.by_supplier`, `forecast.products`, `stock-levels.summary.median_stock` extras sin
  consumir.

## Estándar aplicado (por página y componente)

1. **i18n**: `useI18n` + `t('bi.inventory.*', 'fallback es', vars?)`; keys nuevas en
   `lib/i18n/locales/{es,en}/bi.js`. Reuso de keys existentes (`action.refresh`,
   `bi.common.prev/next`, `bi.sales.col.product`).
2. **3 estados**: skeleton (`data-testid="<page>-skeleton"`, patrón PayablesDashboard) →
   `ErrorState` con retry → `EmptyState`/vacío en tabla. Páginas duales: fallo del endpoint
   primario = error con retry (turnover, dashboard, dead-stock, stock-levels); fallo del
   secundario = degradación honesta (abc → gráfico vacío; reorder → sin tarjetas de alerta).
3. **Datos honestos (H7)**: fuera botones `alert()` (DeadStockTable "Descargar Reporte",
   ForecastRiskList por-carda, InventoryRisk "Ejecutar Plan de Mitigación"), acciones que solo
   `console.log` (AlertsPanel deja de recibir actionLabel), pager falso de StockLevelsTable
   (la página ya tiene el real), `window.location.reload()` → refetch real,
   `more_horiz`/`more_vert` muertos.
4. **Token map (F6.2, solo className literals)**: emerald→success, rose→error, amber→warning,
   purple→secondary, slate→surface/border/on-surface; clases malformadas (`bg-surface-muted0/10`,
   `dark:bg-error/10/30`, `dark:bg-warning/10/20`, `hover:bg-surface-muted:bg-surface-deep/30`,
   `dark:text-on-primary`) → tokens válidos.
5. **Pureza de dominio**: labels UI de `domain/inventory-analytics/abc.ts` salen al componente
   (ABCSummary las resuelve por clase con i18n); el dominio devuelve datos.
6. **Performance (vercel-react-best-practices)**: `filteredProducts` de StockLevelsReorder a
   `useMemo`; handlers estables donde trivial.

## Archivos

Páginas (in situ, sin mover rutas — las 19 del plan tampoco se movieron):
- `pages/InventoryAnalytics/InventoryTurnoverABC.tsx` — i18n + PageHeader + 3 estados.
- `pages/InventoryAnalytics/InventoryDashboard.tsx` — ídem + refetch real + profit honesto.
- `pages/InventoryAnalytics/InventoryRisk.tsx` — ídem + estado de error (hoy se traga fallos)
  + guards de summary.
- `pages/InventoryAnalytics/StockLevelsReorder.tsx` — ídem + useMemo del filtro.

Componentes: SummaryCard (sin texto propio, ya ok), CategoryTurnoverTable, ABCParetoChart,
Dashboard/{KPIWidget,StockStatusChart,AlertsPanel,ABCSummary}, Risk/{ImpactCard,DeadStockTable,
ForecastRiskList}, StockLevels/{ReorderAlertCard,StockLevelsTable}.
Dominio: `domain/inventory-analytics/abc.ts` (labels fuera).
Tipos: `types/inventoryAnalytics.ts` (fuera kpis.potential_profit; opcionales honestos).

Tests (canónico `src/pages/__tests__/`): reescribir InventoryDashboard.page.test.tsx (fixtures
inventados → formas reales del API) e InventoryTurnoverABC.page.test.tsx (i18n); nuevos
InventoryRisk.page.test.tsx y StockLevelsReorder.page.test.tsx. Mock en la frontera del servicio.

## Gates de salida

`npx vitest --run` 0 fallos · `npx tsc --noEmit` 0 · `pnpm build` · `pnpm lint:design` verde.
