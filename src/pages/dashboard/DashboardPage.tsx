import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import {
  ActivityPanel,
  AlertsPreview,
  CardGridSkeleton,
  DashboardPeriodSelector,
  DashboardRefreshButton,
  DashboardSection,
  OperationsPanel,
  PanelSkeleton,
  PartialDataBanner,
  QueryBoundary,
  SummaryCards,
  TopProductsPreview,
  TrendsPanel,
  useDashboardAlerts,
  useDashboardRecentActivity,
  useDashboardSummary,
  useDashboardTopProducts,
  useDashboardTrends,
} from '@/features/bi-dashboard'

const DashboardPage = () => {
  const { t } = useI18n()

  const summaryQuery = useDashboardSummary()
  const trendsQuery = useDashboardTrends()
  const alertsQuery = useDashboardAlerts()
  const activityQuery = useDashboardRecentActivity(6)
  const topProductsQuery = useDashboardTopProducts(5)

  const summary = summaryQuery.data?.summary
  const trends = trendsQuery.data?.trends
  const isPartial = Boolean(
    summaryQuery.data?.metadata?.partial ||
      trendsQuery.data?.metadata?.partial ||
      alertsQuery.data?.metadata?.partial ||
      activityQuery.data?.metadata?.partial ||
      topProductsQuery.data?.metadata?.partial,
  )
  const errorTitle = t('dashboard.errors.title', 'No se pudieron cargar los datos')

  const activitySection: ReactNode = (
    <DashboardSection
      title={t('dashboard.activity.title', 'Actividad reciente')}
      description={t('dashboard.activity.subtitle', 'Últimos movimientos registrados.')}
      testId="dashboard-activity"
    >
      <QueryBoundary
        isLoading={activityQuery.isLoading}
        error={activityQuery.error}
        errorTitle={errorTitle}
        onRetry={() => void activityQuery.refetch()}
        skeleton={<PanelSkeleton rows={4} />}
      >
        <ActivityPanel activities={activityQuery.data?.activities ?? []} />
      </QueryBoundary>
    </DashboardSection>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-container-max px-md pb-xl lg:px-lg">
        <PageHeader
          title={t('dashboard.summary.title', 'Resumen ejecutivo')}
          subtitle={t('dashboard.summary.subtitle', 'Indicadores del período seleccionado.')}
          actions={
            <div className="flex flex-wrap items-center gap-sm">
              <DashboardPeriodSelector />
              <DashboardRefreshButton />
            </div>
          }
        />

        <div className="space-y-xl">
          {isPartial ? <PartialDataBanner metadata={{ partial: true }} /> : null}

          <section aria-label={t('dashboard.summary.cardsAria', 'Indicadores principales')}>
            <QueryBoundary
              isLoading={summaryQuery.isLoading}
              error={summaryQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void summaryQuery.refetch()}
              skeleton={<CardGridSkeleton count={4} />}
            >
              {summary ? <SummaryCards summary={summary} trends={trends} /> : null}
            </QueryBoundary>
          </section>

          {/* Trends y Operaciones 50/50 desde xl; en tablet se apilan para
              que la lista de comparación y el ledger no se compriman. */}
          <div className="grid gap-xl xl:grid-cols-2">
            <DashboardSection
              title={t('dashboard.trends.title', 'Comparación con el período anterior')}
              description={t('dashboard.trends.subtitle', 'Variación de ventas, compras y ticket.')}
              testId="dashboard-trends"
            >
              <QueryBoundary
                isLoading={trendsQuery.isLoading}
                error={trendsQuery.error}
                errorTitle={errorTitle}
                onRetry={() => void trendsQuery.refetch()}
                skeleton={<PanelSkeleton rows={3} />}
              >
                <TrendsPanel trends={trends} />
              </QueryBoundary>
            </DashboardSection>

            <DashboardSection
              title={t('dashboard.summary.operations.title', 'Operación del negocio')}
              description={t('dashboard.summary.operations.subtitle', 'Estado actual de inventario, caja, cobranzas y reservas.')}
              testId="dashboard-operations"
            >
              <QueryBoundary
                isLoading={summaryQuery.isLoading}
                error={summaryQuery.error}
                errorTitle={errorTitle}
                onRetry={() => void summaryQuery.refetch()}
                skeleton={<PanelSkeleton rows={5} />}
              >
                {summary ? <OperationsPanel summary={summary} /> : null}
              </QueryBoundary>
            </DashboardSection>
          </div>

          {/* Alerts 2/5 · Actividad 3/5: la actividad tiene descripciones
              largas y necesita más ancho que las 2 alertas. */}
          <div className="grid items-start gap-xl xl:grid-cols-5">
            <div className="min-w-0 xl:col-span-2">
              <AlertsPreview
                alerts={alertsQuery.data?.alerts ?? []}
                isLoading={alertsQuery.isLoading}
                error={alertsQuery.error}
                onRetry={() => void alertsQuery.refetch()}
              />
            </div>
            <div className="min-w-0 xl:col-span-3">{activitySection}</div>
          </div>

          <TopProductsPreview
            products={topProductsQuery.data?.products ?? []}
            isLoading={topProductsQuery.isLoading}
            error={topProductsQuery.error}
            onRetry={() => void topProductsQuery.refetch()}
          />
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
