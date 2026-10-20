import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  PackageCheck,
  PackageSearch,
  PackageX,
  PiggyBank,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  AbcSummaryTable,
  InventoryAlertsPanel,
  InventoryKpiLedger,
  InventoryPageLayout,
  InventoryRefreshButton,
  MoversList,
  ReorderTable,
  StockStatusPanel,
  useInventoryDashboard,
  useInventoryOverview,
} from '@/features/inventory-analytics'
import type { InventoryKpiId, InventoryKpiTone } from '@/features/inventory-analytics'
import {
  buildInventoryDashboardKpis,
  type InventoryKpiRow,
} from '@/domain/inventory-analytics/kpis'
import { formatDays, formatMoney, formatPercent, formatRate } from '@/domain/inventory-analytics/format'

const KPI_META: Record<
  InventoryKpiId,
  {
    icon: LucideIcon
    tone: InventoryKpiTone
    labelKey: string
    fallback: string
  }
> = {
  totalValue: {
    icon: Wallet,
    tone: 'primary',
    labelKey: 'inventoryAnalytics.kpis.totalValue',
    fallback: 'Valor del inventario',
  },
  potentialProfit: {
    icon: PiggyBank,
    tone: 'success',
    labelKey: 'inventoryAnalytics.kpis.potentialProfit',
    fallback: 'Ganancia potencial',
  },
  turnoverRate: {
    icon: RefreshCw,
    tone: 'secondary',
    labelKey: 'inventoryAnalytics.kpis.turnoverRate',
    fallback: 'Rotación (30 días)',
  },
  daysOfInventory: {
    icon: CalendarClock,
    tone: 'neutral',
    labelKey: 'inventoryAnalytics.kpis.daysOfInventory',
    fallback: 'Días de inventario',
  },
  stockoutRate: {
    icon: PackageX,
    tone: 'warning',
    labelKey: 'inventoryAnalytics.kpis.stockoutRate',
    fallback: 'Tasa de quiebre',
  },
  deadStockPct: {
    icon: AlertTriangle,
    tone: 'error',
    labelKey: 'inventoryAnalytics.kpis.deadStockPct',
    fallback: 'Stock muerto',
  },
}

const HINT_KEYS: Record<InventoryKpiId, string> = {
  totalValue: 'inventoryAnalytics.kpis.totalValueHint',
  potentialProfit: 'inventoryAnalytics.kpis.potentialProfitHint',
  turnoverRate: 'inventoryAnalytics.kpis.turnoverRateHint',
  daysOfInventory: 'inventoryAnalytics.kpis.daysOfInventoryHint',
  stockoutRate: 'inventoryAnalytics.kpis.stockoutRateHint',
  deadStockPct: 'inventoryAnalytics.kpis.deadStockPctHint',
}

const HINT_FALLBACKS: Record<InventoryKpiId, string> = {
  totalValue: 'Valor de venta del stock actual',
  potentialProfit: 'Valor de venta menos costo',
  turnoverRate: 'Costo de ventas / inventario',
  daysOfInventory: 'Sobre el costo de ventas de 30 días',
  stockoutRate: 'Productos sin stock',
  deadStockPct: 'Valor sin venta hace más de 90 días',
}

/**
 * F5 — Dashboard de inventario: KPIs del consolidado, estado por umbral,
 * alertas de las reglas del BE, resumen ABC, movers y reposición urgente.
 * Todo sale de `/inventory-analytics/{dashboard,overview}`; no hay chips de
 * variación (`*_change_pct` viaja en 0) ni tendencias inventadas.
 */
const InventoryDashboardPage = () => {
  const { t } = useI18n()
  const dashboardQuery = useInventoryDashboard()
  const overviewQuery = useInventoryOverview()

  const errorTitle = t('inventoryAnalytics.errors.title', 'No se pudieron cargar los datos')
  const dashboard = dashboardQuery.data?.dashboard
  const kpiRows = buildInventoryDashboardKpis(dashboard, overviewQuery.data)

  const renderValue = (row: InventoryKpiRow): string => {
    if (row.unavailable) return t('inventoryAnalytics.common.unavailable', '—')
    switch (row.kind) {
      case 'money':
        return formatMoney(row.value)
      case 'rate':
        return t('inventoryAnalytics.common.rateValue', '{value}x', {
          value: formatRate(row.value),
        })
      case 'days':
        return t('inventoryAnalytics.common.daysValue', '{n} días', {
          n: formatDays(row.value),
        })
      default:
        return formatPercent(row.value)
    }
  }

  const kpiItems = kpiRows.map((row) => {
    const meta = KPI_META[row.id]
    let hint = t(HINT_KEYS[row.id], HINT_FALLBACKS[row.id])
    if (row.id === 'totalValue' && row.secondaryMoney !== undefined) {
      hint = t('inventoryAnalytics.kpis.totalValueHint', 'Costo: {cost}', {
        cost: formatMoney(row.secondaryMoney),
      })
    }
    if (row.unavailable) {
      hint = t(
        'inventoryAnalytics.common.noSalesPeriod',
        'Sin costo de ventas en el período',
      )
    }
    return {
      id: row.id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.fallback),
      hint,
      value: renderValue(row),
    }
  })

  const kpiLoading = dashboardQuery.isLoading || overviewQuery.isLoading
  const kpiError = dashboardQuery.error ?? overviewQuery.error
  const retryKpis = () => {
    void dashboardQuery.refetch()
    void overviewQuery.refetch()
  }

  return (
    <InventoryPageLayout
      title={t('inventoryAnalytics.dashboard.title', 'Dashboard de inventario')}
      subtitle={t(
        'inventoryAnalytics.dashboard.subtitle',
        'Valor, rotación y estado de las existencias.',
      )}
      actions={<InventoryRefreshButton />}
    >
      <SectionCard
        title={t('inventoryAnalytics.dashboard.kpisTitle', 'Indicadores del inventario')}
        description={t(
          'inventoryAnalytics.dashboard.kpisSubtitle',
          'Rotación de los últimos 30 días; el valor es la foto actual.',
        )}
        testId="inventory-dashboard-kpis"
      >
        <QueryBoundary
          isLoading={kpiLoading}
          error={kpiError}
          errorTitle={errorTitle}
          onRetry={retryKpis}
          skeleton={<PanelSkeleton rows={6} testId="inventory-kpis-skeleton" />}
        >
          <InventoryKpiLedger items={kpiItems} testId="inventory-kpi-ledger" />
        </QueryBoundary>
      </SectionCard>

      <div className="grid items-start gap-xl xl:grid-cols-2">
        <SectionCard
          title={t('inventoryAnalytics.dashboard.statusTitle', 'Estado del stock')}
          description={t(
            'inventoryAnalytics.dashboard.statusSubtitle',
            'Productos activos con stock en la sucursal.',
          )}
          testId="inventory-dashboard-status"
        >
          <QueryBoundary
            isLoading={dashboardQuery.isLoading}
            error={dashboardQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void dashboardQuery.refetch()}
            skeleton={<PanelSkeleton rows={4} testId="inventory-status-skeleton" />}
          >
            <StockStatusPanel status={dashboard?.stock_status} />
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('inventoryAnalytics.dashboard.alertsTitle', 'Alertas de inventario')}
          description={t(
            'inventoryAnalytics.dashboard.alertsSubtitle',
            'Reglas del reporte sobre el estado actual.',
          )}
          testId="inventory-dashboard-alerts"
        >
          <QueryBoundary
            isLoading={dashboardQuery.isLoading}
            error={dashboardQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void dashboardQuery.refetch()}
            skeleton={<PanelSkeleton rows={3} testId="inventory-alerts-skeleton" />}
          >
            <InventoryAlertsPanel alerts={dashboardQuery.data?.alerts ?? []} />
          </QueryBoundary>
        </SectionCard>
      </div>

      <SectionCard
        title={t('inventoryAnalytics.dashboard.abcTitle', 'Clasificación ABC')}
        description={t(
          'inventoryAnalytics.dashboard.abcSubtitle',
          'Participación en las ventas de los últimos 30 días.',
        )}
        action={
          <Link
            to="/inventory-analytics/turnover-abc"
            className="text-body-sm-bold text-primary hover:underline"
          >
            {t('inventoryAnalytics.actions.viewTurnover', 'Ver rotación y ABC')}
          </Link>
        }
        testId="inventory-dashboard-abc"
      >
        <QueryBoundary
          isLoading={dashboardQuery.isLoading}
          error={dashboardQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void dashboardQuery.refetch()}
          skeleton={<TableSkeleton rows={3} testId="inventory-abc-skeleton" />}
        >
          <AbcSummaryTable summary={dashboard?.abc_summary} />
        </QueryBoundary>
      </SectionCard>

      <div className="grid items-start gap-xl xl:grid-cols-2">
        <SectionCard
          title={t('inventoryAnalytics.dashboard.topMoversTitle', 'Mayor rotación (30 días)')}
          description={t(
            'inventoryAnalytics.dashboard.topMoversSubtitle',
            'Productos con más costo de ventas en relación a su stock.',
          )}
          testId="inventory-dashboard-top-movers"
        >
          <QueryBoundary
            isLoading={dashboardQuery.isLoading}
            error={dashboardQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void dashboardQuery.refetch()}
            isEmpty={dashboardQuery.data?.topMovers.length === 0}
            empty={
              <div className="py-lg">
                <TableEmptyState
                  icon={PackageSearch}
                  title={t('inventoryAnalytics.dashboard.moversEmpty', 'Sin productos para mostrar')}
                />
              </div>
            }
            skeleton={<PanelSkeleton rows={5} testId="inventory-top-movers-skeleton" />}
          >
            <MoversList
              items={dashboardQuery.data?.topMovers ?? []}
              mode="top"
              testId="inventory-top-movers"
            />
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('inventoryAnalytics.dashboard.slowMoversTitle', 'Menor movimiento (30 días)')}
          description={t(
            'inventoryAnalytics.dashboard.slowMoversSubtitle',
            'Productos con menos unidades vendidas.',
          )}
          testId="inventory-dashboard-slow-movers"
        >
          <QueryBoundary
            isLoading={dashboardQuery.isLoading}
            error={dashboardQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void dashboardQuery.refetch()}
            isEmpty={dashboardQuery.data?.slowMovers.length === 0}
            empty={
              <div className="py-lg">
                <TableEmptyState
                  icon={PackageSearch}
                  title={t('inventoryAnalytics.dashboard.moversEmpty', 'Sin productos para mostrar')}
                />
              </div>
            }
            skeleton={<PanelSkeleton rows={5} testId="inventory-slow-movers-skeleton" />}
          >
            <MoversList
              items={dashboardQuery.data?.slowMovers ?? []}
              mode="slow"
              testId="inventory-slow-movers"
            />
          </QueryBoundary>
        </SectionCard>
      </div>

      <SectionCard
        title={t('inventoryAnalytics.dashboard.reorderTitle', 'Reposición urgente')}
        description={t(
          'inventoryAnalytics.dashboard.reorderSubtitle',
          'Productos con stock de 5 o menos.',
        )}
        action={
          <Link
            to="/inventory-analytics/stock-levels"
            className="text-body-sm-bold text-primary hover:underline"
          >
            {t('inventoryAnalytics.actions.viewStock', 'Ver niveles de stock')}
          </Link>
        }
        testId="inventory-dashboard-reorder"
      >
        <QueryBoundary
          isLoading={dashboardQuery.isLoading}
          error={dashboardQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void dashboardQuery.refetch()}
          skeleton={<TableSkeleton rows={5} testId="inventory-reorder-skeleton" />}
        >
          <ReorderTable
            rows={dashboardQuery.data?.reorderAlerts ?? []}
            empty={
              <TableEmptyState
                icon={PackageCheck}
                title={t('inventoryAnalytics.dashboard.reorderEmpty', 'Sin productos para reponer')}
              />
            }
            testId="inventory-dashboard-reorder-table"
          />
        </QueryBoundary>
      </SectionCard>
    </InventoryPageLayout>
  )
}

export default InventoryDashboardPage
