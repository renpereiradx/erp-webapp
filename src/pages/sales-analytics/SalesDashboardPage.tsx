import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import { buildSalesKpiRows } from '@/domain/sales-analytics/kpis'
import { granularityForPeriod } from '@/domain/sales-analytics/periods'
import {
  PaymentMixList,
  SalesKpis,
  SalesPageLayout,
  SalesPeriodSelector,
  SalesRefreshButton,
  TopCategoriesTable,
  TopProductsTable,
  TrendSection,
  useSalesDashboard,
  useSalesPerformance,
  useSalesPeriod,
  useSalesTrends,
} from '@/features/sales-analytics'

/**
 * F4 — Dashboard de Ventas: KPIs del período con comparación real, serie de
 * ventas, mix de medios de pago y topes de productos/categorías. Todo sale de
 * `/sales-analytics/*`; no hay alertas porque el BE las devuelve siempre vacías
 * (no las calcula) ni chips de crecimiento inventados.
 */
const SalesDashboardPage = () => {
  const { t } = useI18n()
  const { period } = useSalesPeriod()
  const granularity = granularityForPeriod(period)

  const performanceQuery = useSalesPerformance(period)
  const trendsQuery = useSalesTrends(period, granularity)
  const dashboardQuery = useSalesDashboard(period)

  const kpiRows = buildSalesKpiRows(performanceQuery.data?.performance)
  const dashboard = dashboardQuery.data?.dashboard
  const errorTitle = t('salesAnalytics.errors.title', 'No se pudieron cargar los datos')
  const detailLink = `/sales-analytics/products-categories?period=${period}`

  return (
    <SalesPageLayout
      title={t('salesAnalytics.dashboard.title', 'Dashboard de ventas')}
      subtitle={t(
        'salesAnalytics.dashboard.subtitle',
        'Indicadores y tendencia.',
      )}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <SalesPeriodSelector />
          <SalesRefreshButton />
        </div>
      }
    >
      <SectionCard
        title={t('salesAnalytics.dashboard.kpisTitle', 'Indicadores del período')}
        description={t(
          'salesAnalytics.dashboard.kpisSubtitle',
          'Ventas, transacciones y ticket contra la ventana previa equivalente.',
        )}
        testId="sales-dashboard-kpis"
      >
        <QueryBoundary
          isLoading={performanceQuery.isLoading}
          error={performanceQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void performanceQuery.refetch()}
          skeleton={<PanelSkeleton rows={6} testId="sales-kpis-skeleton" />}
        >
          <SalesKpis rows={kpiRows} />
        </QueryBoundary>
      </SectionCard>

      <div className="grid items-start gap-xl xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <SectionCard
            title={t('salesAnalytics.dashboard.trendTitle', 'Evolución de las ventas')}
            description={t(
              'salesAnalytics.dashboard.trendSubtitle',
              'Ventas agrupadas por la granularidad del período.',
            )}
            testId="sales-dashboard-trend"
          >
            <QueryBoundary
              isLoading={trendsQuery.isLoading}
              error={trendsQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void trendsQuery.refetch()}
              skeleton={<TableSkeleton rows={6} testId="sales-trend-skeleton" />}
            >
              <TrendSection trends={trendsQuery.data?.trends} granularity={granularity} />
            </QueryBoundary>
          </SectionCard>
        </div>

        <div className="min-w-0">
          <SectionCard
            title={t('salesAnalytics.dashboard.paymentTitle', 'Medios de pago')}
            description={t(
              'salesAnalytics.dashboard.paymentSubtitle',
              'Participación sobre las ventas del período.',
            )}
            testId="sales-dashboard-payment"
          >
            <QueryBoundary
              isLoading={dashboardQuery.isLoading}
              error={dashboardQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void dashboardQuery.refetch()}
              skeleton={<PanelSkeleton rows={4} testId="sales-payment-skeleton" />}
            >
              <PaymentMixList methods={dashboard?.paymentMix ?? []} />
            </QueryBoundary>
          </SectionCard>
        </div>
      </div>

      <div className="grid items-start gap-xl xl:grid-cols-5">
        <div className="min-w-0 xl:col-span-3">
          <SectionCard
            title={t('salesAnalytics.dashboard.topProductsTitle', 'Productos más vendidos')}
            description={t(
              'salesAnalytics.dashboard.topProductsSubtitle',
              'Los 5 productos con más ventas del período.',
            )}
            action={
              <Link
                to={detailLink}
                className="text-body-sm-bold text-primary hover:underline"
              >
                {t('salesAnalytics.actions.viewAll', 'Ver todos')}
              </Link>
            }
            testId="sales-dashboard-top-products"
          >
            <QueryBoundary
              isLoading={dashboardQuery.isLoading}
              error={dashboardQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void dashboardQuery.refetch()}
              skeleton={<TableSkeleton rows={5} testId="sales-top-products-skeleton" />}
            >
              <TopProductsTable products={dashboard?.topProducts ?? []} />
            </QueryBoundary>
          </SectionCard>
        </div>

        <div className="min-w-0 xl:col-span-2">
          <SectionCard
            title={t('salesAnalytics.dashboard.topCategoriesTitle', 'Categorías con más ventas')}
            description={t(
              'salesAnalytics.dashboard.topCategoriesSubtitle',
              'Top 5 de categorías del período.',
            )}
            testId="sales-dashboard-top-categories"
          >
            <QueryBoundary
              isLoading={dashboardQuery.isLoading}
              error={dashboardQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void dashboardQuery.refetch()}
              skeleton={<TableSkeleton rows={5} testId="sales-top-categories-skeleton" />}
            >
              <TopCategoriesTable categories={dashboard?.topCategories ?? []} />
            </QueryBoundary>
          </SectionCard>
        </div>
      </div>
    </SalesPageLayout>
  )
}

export default SalesDashboardPage
