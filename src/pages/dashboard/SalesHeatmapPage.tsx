import { useMemo } from 'react'
import { CircleDollarSign, LayoutGrid, Receipt } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PartialDataBanner } from '@/components/ui/PartialDataBanner'
import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import { summarizeHeatmap } from '@/domain/dashboard/heatmap'
import { useDashboardStore } from '@/store/useDashboardStore'
import {
  CardGridSkeleton,
  DashboardRefreshButton,
  DashboardSection,
  DashboardWeeksSelector,
  HeatmapGrid,
  HeatmapPeaksPanel,
  KpiCard,
  PanelSkeleton,
  useDashboardSalesHeatmap,
} from '@/features/bi-dashboard'

const SalesHeatmapPage = () => {
  const { t } = useI18n()
  const weeks = useDashboardStore((state) => state.heatmapWeeks)
  const heatmapQuery = useDashboardSalesHeatmap()

  const heatmap = heatmapQuery.data?.heatmap ?? []
  const totals = useMemo(() => summarizeHeatmap(heatmap), [heatmap])

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-container-max px-md pb-xl lg:px-lg">
        <PageHeader
          title={t('dashboard.heatmap.title', 'Análisis de ventas')}
          subtitle={t('dashboard.heatmap.subtitle', 'Día × hora de las últimas {weeks} semanas.', {
            weeks,
          })}
          actions={
            <div className="flex flex-wrap items-center gap-sm">
              <DashboardWeeksSelector />
              <DashboardRefreshButton />
            </div>
          }
        />

        <div className="space-y-xl">
          <PartialDataBanner metadata={heatmapQuery.data?.metadata} />

          <QueryBoundary
            isLoading={heatmapQuery.isLoading}
            error={heatmapQuery.error}
            errorTitle={t('dashboard.errors.title', 'No se pudieron cargar los datos')}
            onRetry={() => void heatmapQuery.refetch()}
            skeleton={
              <div className="space-y-xl">
                <CardGridSkeleton count={3} columns={3} />
                <PanelSkeleton rows={7} />
              </div>
            }
          >
            <div className="grid gap-md sm:grid-cols-3" data-testid="heatmap-summary">
              <KpiCard
                icon={CircleDollarSign}
                tone="primary"
                label={t('dashboard.heatmap.totalSales', 'Ventas de la ventana')}
                value={formatPYG(totals.totalSales)}
                hint={t('dashboard.heatmap.totalSalesHint', 'Suma de las celdas día × hora.')}
                testId="heatmap-kpi-sales"
              />
              <KpiCard
                icon={Receipt}
                tone="success"
                label={t('dashboard.heatmap.totalTransactions', 'Transacciones')}
                value={formatNumber(totals.totalTransactions, 0)}
                hint={t('dashboard.heatmap.totalTransactionsHint', 'Ventas no canceladas.')}
                testId="heatmap-kpi-transactions"
              />
              <KpiCard
                icon={LayoutGrid}
                label={t('dashboard.heatmap.activeCells', 'Celdas activas')}
                value={formatNumber(totals.activeCells, 0)}
                hint={t('dashboard.heatmap.activeCellsHint', 'Día y hora con al menos una venta.')}
                testId="heatmap-kpi-cells"
              />
            </div>

            <DashboardSection
              title={t('dashboard.heatmap.grid.title', 'Ventas por día y hora')}
              description={t(
                'dashboard.heatmap.grid.subtitle',
                'Intensidad relativa al pico de la ventana; el número es la cantidad de ventas.',
              )}
              testId="heatmap-grid"
            >
              {heatmap.length === 0 ? (
                <p className="text-body-md text-on-surface-deep">
                  {t('dashboard.heatmap.empty', 'Sin ventas registradas en la ventana.')}
                </p>
              ) : (
                <HeatmapGrid cells={heatmap} />
              )}
            </DashboardSection>

            <DashboardSection
              title={t('dashboard.heatmap.peaks.sectionTitle', 'Horarios de mayor y menor movimiento')}
              testId="heatmap-peaks"
            >
              <HeatmapPeaksPanel
                peakTimes={heatmapQuery.data?.peakTimes ?? []}
                slowTimes={heatmapQuery.data?.slowTimes ?? []}
              />
            </DashboardSection>
          </QueryBoundary>
        </div>
      </div>
    </div>
  )
}

export default SalesHeatmapPage
