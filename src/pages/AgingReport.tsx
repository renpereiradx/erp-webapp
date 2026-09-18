import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import ErrorState from '@/components/ui/ErrorState'
import { Clock, RefreshCcw } from 'lucide-react'
import AgingOverviewCards from '@/features/receivables/components/AgingOverviewCards'
import AgingSummaryChart from '@/features/receivables/components/AgingSummaryChart'
import AgingByClientTable from '@/features/receivables/components/AgingByClientTable'
import BillingVsCollectionChart from '@/features/receivables/components/BillingVsCollectionChart'
import { useAgingReport } from '@/features/receivables/hooks/useAgingReport'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'

/**
 * Reporte de Antigüedad y Estadísticas de Cobranza.
 * Migración FASE 3: .tsx + 3 estados. FIX del plan: el legacy ignoraba el
 * error del hook — ahora se expone con ErrorState + refresh (sin reload);
 * el spinner de carga pasa a skeleton.
 */
const AgingReport = () => {
  const { t } = useI18n()
  const { data, loading, error, refresh } = useAgingReport('month')

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.receivables.breadcrumb', 'Cuentas por Cobrar', {})}
          title={t('bi.receivables.aging.pageTitle', 'Reporte de Antigüedad y Estadísticas', {})}
          subtitle={t('bi.receivables.aging.pageSubtitle', 'Análisis estratégico de cartera y recuperación', {})}
          actions={
            <button
              type="button"
              onClick={() => refresh()}
              className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
            >
              <RefreshCcw className="w-4 h-4" />
              {t('bi.profitability.action.refresh', 'Actualizar', {})}
            </button>
          }
        />

        {loading && (
          <div className="mt-lg space-y-lg" aria-busy="true" data-testid="aging-skeleton">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-surface-muted rounded-md animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-surface-muted rounded-md animate-pulse" />
            <GenericSkeletonList count={6} data-testid="page-skeleton-list" />
          </div>
        )}

        {!loading && error && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.receivables.aging.errorTitle', 'No se pudo cargar el reporte de antigüedad', {})}
              message={error}
              onRetry={refresh}
            />
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-lg mt-lg">
            <AgingOverviewCards stats={data?.statistics} overview={data?.overview} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
              <div className="lg:col-span-4">
                <AgingSummaryChart agingData={data?.overview?.aging_summary} />
              </div>
              <div className="lg:col-span-8">
                <BillingVsCollectionChart trendData={data?.statistics?.collection_trend as never} />
              </div>
            </div>

            <AgingByClientTable clientsData={(data?.detailed as unknown as { by_client?: never[] } | null)?.by_client as never} />
          </div>
        )}

        {!loading && !error && (
          <p className="flex items-center gap-xs mt-lg text-label-caps uppercase text-on-surface-deep">
            <Clock size={14} className="shrink-0" />
            {t('bi.receivables.aging.pageHint', 'Corte consolidado del período en curso.', {})}
          </p>
        )}
      </div>
    </div>
  )
}

export default AgingReport
