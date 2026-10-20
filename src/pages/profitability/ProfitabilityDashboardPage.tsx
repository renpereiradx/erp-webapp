import {
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  LayoutDashboard,
  Percent,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  CategoriesTable,
  CustomersTable,
  ProfitabilityAlertsPanel,
  ProfitabilityKpiLedger,
  ProfitabilityPageLayout,
  ProfitabilityPeriodSelector,
  ProfitabilityRefreshButton,
  TopProductsTable,
  TrendsTable,
  useProfitabilityDashboard,
  useProfitabilityPeriod,
} from '@/features/profitability'
import type { ProfitabilityKpiTone } from '@/features/profitability'
import { buildDashboardKpis, formatKpiValue } from '@/domain/profitability/kpis'
import { defaultTrendGranularity } from '@/domain/profitability/trends'
import { formatPeriodRange } from '@/domain/profitability/format'

const KPI_META: Record<
  string,
  { icon: LucideIcon; tone: ProfitabilityKpiTone; labelKey: string; fallback: string; hintKey: string; hintFallback: string }
> = {
  revenue: {
    icon: Wallet,
    tone: 'primary',
    labelKey: 'profitability.kpis.revenue',
    fallback: 'Ingresos',
    hintKey: 'profitability.dashboard.revenueHint',
    hintFallback: 'Ventas del período, con IVA incluido',
  },
  profit: {
    icon: TrendingUp,
    tone: 'success',
    labelKey: 'profitability.kpis.profit',
    fallback: 'Beneficio bruto',
    hintKey: 'profitability.dashboard.profitHint',
    hintFallback: 'Ingresos menos costo de las líneas vendidas',
  },
  grossMargin: {
    icon: Percent,
    tone: 'secondary',
    labelKey: 'profitability.kpis.grossMargin',
    fallback: 'Margen bruto',
    hintKey: 'profitability.kpis.grossMarginHint',
    hintFallback: 'Beneficio bruto / ingresos',
  },
  roi: {
    icon: ArrowUpRight,
    tone: 'warning',
    labelKey: 'profitability.kpis.roi',
    fallback: 'ROI',
    hintKey: 'profitability.kpis.roiHint',
    hintFallback: 'Beneficio bruto / costo',
  },
  profitPerTransaction: {
    icon: Receipt,
    tone: 'neutral',
    labelKey: 'profitability.kpis.profitPerTransaction',
    fallback: 'Beneficio por transacción',
    hintKey: 'profitability.kpis.profitPerTransactionHint',
    hintFallback: 'Beneficio bruto / órdenes de venta',
  },
  revenueGrowth: {
    icon: ArrowUpRight,
    tone: 'success',
    labelKey: 'profitability.kpis.revenueGrowth',
    fallback: 'Crecimiento de ingresos',
    hintKey: 'profitability.kpis.comparisonHint',
    hintFallback: 'Contra la ventana previa de igual duración',
  },
  profitGrowth: {
    icon: TrendingUp,
    tone: 'primary',
    labelKey: 'profitability.kpis.profitGrowth',
    fallback: 'Crecimiento del beneficio',
    hintKey: 'profitability.kpis.comparisonHint',
    hintFallback: 'Contra la ventana previa de igual duración',
  },
  marginChange: {
    icon: ArrowLeftRight,
    tone: 'warning',
    labelKey: 'profitability.kpis.marginChange',
    fallback: 'Cambio de margen',
    hintKey: 'profitability.kpis.marginChangeHint',
    hintFallback: 'Diferencia en puntos porcentuales contra la ventana previa',
  },
}

/**
 * F6 — Dashboard de Rentabilidad: KPIs con crecimiento real, alertas de las
 * reglas del BE, topes de productos/clientes/categorías y la serie de los
 * últimos 7 buckets. No se renderiza `break_even_status` (el BE lo deja en
 * cero) ni los mensajes en español de las alertas.
 */
const ProfitabilityDashboardPage = () => {
  const { t, lang } = useI18n()
  const { period } = useProfitabilityPeriod()
  const dashboardQuery = useProfitabilityDashboard(period)

  const data = dashboardQuery.data
  const errorTitle = t('profitability.errors.title', 'No se pudieron cargar los datos')
  const kpiRows = buildDashboardKpis(data?.dashboard.kpis)
  const kpiItems = kpiRows.map((row) => {
    const meta = KPI_META[row.id]
    return {
      id: row.id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.fallback),
      hint: t(meta.hintKey, meta.hintFallback),
      value: formatKpiValue(row),
    }
  })

  const range = data?.dashboard.period ? formatPeriodRange(data.dashboard.period, lang) : undefined
  const granularity = defaultTrendGranularity(period)

  const productsEmpty = (
    <TableEmptyState
      icon={BarChart3}
      title={t('profitability.dashboard.productsEmpty', 'Sin productos con beneficio en el período')}
      description={t(
        'profitability.dashboard.productsEmptyHint',
        'Probá con otro período.',
      )}
    />
  )
  const customersEmpty = (
    <TableEmptyState
      icon={Users}
      title={t('profitability.dashboard.customersEmpty', 'Sin clientes con compras en el período')}
      description={t('profitability.dashboard.customersEmptyHint', 'Probá con otro período.')}
    />
  )
  const categoriesEmpty = (
    <TableEmptyState
      icon={LayoutDashboard}
      title={t('profitability.dashboard.categoriesEmpty', 'Sin categorías con ventas en el período')}
      description={t(
        'profitability.dashboard.categoriesEmptyHint',
        'Solo aparecen categorías cuyos productos vendieron.',
      )}
    />
  )
  const trendsEmpty = (
    <TableEmptyState
      icon={TrendingUp}
      title={t('profitability.dashboard.trendsEmpty', 'Sin ventas en el período')}
      description={t('profitability.dashboard.trendsEmptyHint', 'Probá con otro período.')}
    />
  )

  return (
    <ProfitabilityPageLayout
      title={t('profitability.dashboard.title', 'Dashboard de rentabilidad')}
      subtitle={t(
        'profitability.dashboard.subtitle',
        'Beneficio, márgenes y concentración por producto, cliente y categoría.',
      )}
      range={range}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <ProfitabilityPeriodSelector />
          <ProfitabilityRefreshButton />
        </div>
      }
    >
      <SectionCard
        title={t('profitability.dashboard.kpiTitle', 'Indicadores de rentabilidad')}
        description={t(
          'profitability.dashboard.kpiSubtitle',
          'Ventas con IVA, costo real de las líneas y beneficio bruto. Sin gastos operativos modelados.',
        )}
        testId="profitability-dashboard-kpis"
      >
        <QueryBoundary
          isLoading={dashboardQuery.isLoading}
          error={dashboardQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void dashboardQuery.refetch()}
          skeleton={<PanelSkeleton rows={8} testId="profitability-dashboard-kpis-skeleton" />}
        >
          <ProfitabilityKpiLedger items={kpiItems} testId="profitability-dashboard-kpi-ledger" />
        </QueryBoundary>
      </SectionCard>

      <SectionCard
        title={t('profitability.dashboard.alertsTitle', 'Alertas de rentabilidad')}
        description={t(
          'profitability.dashboard.alertsSubtitle',
          'Reglas del reporte sobre margen, crecimiento y productos con pérdida.',
        )}
        testId="profitability-dashboard-alerts-card"
      >
        <QueryBoundary
          isLoading={dashboardQuery.isLoading}
          error={dashboardQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void dashboardQuery.refetch()}
          skeleton={<PanelSkeleton rows={2} testId="profitability-alerts-skeleton" />}
        >
          <ProfitabilityAlertsPanel alerts={data?.alerts ?? []} />
        </QueryBoundary>
      </SectionCard>

      <TableCard
        title={t('profitability.dashboard.trendsTitle', 'Tendencia del período')}
        description={t(
          'profitability.dashboard.trendsSubtitle',
          'Últimos 7 buckets con ventas; los importes salen de la serie real del BE.',
        )}
        testId="profitability-dashboard-trends-card"
      >
        <QueryBoundary
          isLoading={dashboardQuery.isLoading}
          error={dashboardQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void dashboardQuery.refetch()}
          isEmpty={(data?.trends.length ?? 0) === 0}
          empty={<div className="px-md py-xl">{trendsEmpty}</div>}
          skeleton={<TableSkeleton rows={5} testId="profitability-trends-skeleton" />}
        >
          <TrendsTable
            points={data?.trends ?? []}
            granularity={granularity}
            empty={trendsEmpty}
            testId="profitability-dashboard-trends-table"
          />
        </QueryBoundary>
      </TableCard>

      <TableCard
        title={t('profitability.dashboard.topProductsTitle', 'Productos con mayor beneficio')}
        description={t(
          'profitability.dashboard.topProductsSubtitle',
          'Hasta 5 productos ordenados por beneficio.',
        )}
        testId="profitability-dashboard-top-products-card"
      >
        <QueryBoundary
          isLoading={dashboardQuery.isLoading}
          error={dashboardQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void dashboardQuery.refetch()}
          isEmpty={(data?.topProducts.length ?? 0) === 0}
          empty={<div className="px-md py-xl">{productsEmpty}</div>}
          skeleton={<TableSkeleton rows={5} testId="profitability-top-products-skeleton" />}
        >
          <TopProductsTable rows={data?.topProducts ?? []} empty={productsEmpty} />
        </QueryBoundary>
      </TableCard>

      <TableCard
        title={t('profitability.dashboard.topCustomersTitle', 'Clientes con mayor beneficio')}
        description={t(
          'profitability.dashboard.topCustomersSubtitle',
          'Hasta 5 clientes del período ordenados por beneficio.',
        )}
        testId="profitability-dashboard-top-customers-card"
      >
        <QueryBoundary
          isLoading={dashboardQuery.isLoading}
          error={dashboardQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void dashboardQuery.refetch()}
          isEmpty={(data?.topCustomers.length ?? 0) === 0}
          empty={<div className="px-md py-xl">{customersEmpty}</div>}
          skeleton={<TableSkeleton rows={5} testId="profitability-top-customers-skeleton" />}
        >
          <CustomersTable
            rows={data?.topCustomers ?? []}
            totalProfit={data?.dashboard.kpis.total_profit}
            empty={customersEmpty}
            variant="compact"
            testId="profitability-dashboard-top-customers-table"
          />
        </QueryBoundary>
      </TableCard>

      <TableCard
        title={t('profitability.dashboard.topCategoriesTitle', 'Categorías con mayor beneficio')}
        description={t(
          'profitability.dashboard.topCategoriesSubtitle',
          'Hasta 5 categorías ordenadas por beneficio.',
        )}
        testId="profitability-dashboard-top-categories-card"
      >
        <QueryBoundary
          isLoading={dashboardQuery.isLoading}
          error={dashboardQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void dashboardQuery.refetch()}
          isEmpty={(data?.topCategories.length ?? 0) === 0}
          empty={<div className="px-md py-xl">{categoriesEmpty}</div>}
          skeleton={<TableSkeleton rows={5} testId="profitability-top-categories-skeleton" />}
        >
          <CategoriesTable
            rows={data?.topCategories ?? []}
            totalProfit={data?.dashboard.kpis.total_profit}
            empty={categoriesEmpty}
            variant="compact"
            testId="profitability-dashboard-top-categories-table"
          />
        </QueryBoundary>
      </TableCard>
    </ProfitabilityPageLayout>
  )
}

export default ProfitabilityDashboardPage
