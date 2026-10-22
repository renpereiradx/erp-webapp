import { useRef, useState } from 'react'
import { AlertTriangle, BellOff, BellRing, Info, ShieldAlert } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PartialDataBanner } from '@/components/ui/PartialDataBanner'
import { useI18n } from '@/lib/i18n'
import { useSearchFocusShortcut } from '@/hooks/useSearchFocusShortcut'
import {
  EMPTY_ALERT_FILTERS,
  filterAlerts,
  getAlertMetrics,
  sortAlertsBySeverity,
  type AlertFilters,
} from '@/domain/dashboard/alerts'
import {
  AlertsList,
  AlertsToolbar,
  CardGridSkeleton,
  DashboardRefreshButton,
  DashboardSection,
  KpiCard,
  PanelSkeleton,
  useDashboardAlerts,
} from '@/features/bi-dashboard'

const AlertsPage = () => {
  const { t } = useI18n()
  const alertsQuery = useDashboardAlerts()
  const [filters, setFilters] = useState<AlertFilters>({ ...EMPTY_ALERT_FILTERS })
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sin modales en esta pantalla: F2 siempre enfoca el buscador (§12.2).
  useSearchFocusShortcut({ enabled: true, inputRef: searchInputRef })

  const alerts = alertsQuery.data?.alerts ?? []
  const metrics = getAlertMetrics(alerts)
  const filtered = sortAlertsBySeverity(filterAlerts(alerts, filters))
  const hasFilters =
    filters.severity !== 'all' || filters.category !== 'all' || filters.search.trim() !== ''
  const hasAnyAlerts = alerts.length > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-container-max px-md pb-xl lg:px-lg">
        <PageHeader
          title={t('dashboard.alerts.title', 'Alertas de negocio')}
          subtitle={t('dashboard.alerts.subtitle', 'Situaciones que requieren atención.')}
          actions={<DashboardRefreshButton />}
        />

        <div className="space-y-xl">
          <PartialDataBanner metadata={alertsQuery.data?.metadata} />

          <QueryBoundary
            isLoading={alertsQuery.isLoading}
            error={alertsQuery.error}
            errorTitle={t('dashboard.errors.title', 'No se pudieron cargar los datos')}
            onRetry={() => void alertsQuery.refetch()}
            skeleton={
              <div className="space-y-xl">
                <CardGridSkeleton count={4} />
                <PanelSkeleton rows={5} />
              </div>
            }
          >
            <div className="space-y-xl">
              <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  icon={BellRing}
                  label={t('dashboard.alerts.summary.total', 'Alertas activas')}
                  value={metrics.total}
                  testId="alerts-kpi-total"
                />
                <KpiCard
                  icon={ShieldAlert}
                  tone="error"
                  label={t('dashboard.alerts.summary.critical', 'Críticas')}
                  value={metrics.critical}
                  testId="alerts-kpi-critical"
                />
                <KpiCard
                  icon={AlertTriangle}
                  tone="warning"
                  label={t('dashboard.alerts.summary.warning', 'Advertencias')}
                  value={metrics.warning}
                  testId="alerts-kpi-warning"
                />
                <KpiCard
                  icon={Info}
                  tone="primary"
                  label={t('dashboard.alerts.summary.info', 'Informativas')}
                  value={metrics.info}
                  testId="alerts-kpi-info"
                />
              </div>

              <DashboardSection
                title={t('dashboard.alerts.listTitle', 'Bandeja de alertas')}
                description={t(
                  'dashboard.alerts.listSubtitle',
                  'Ordenadas por severidad; los filtros no alteran los contadores.',
                )}
                testId="alerts-list-section"
              >
                <div className="space-y-md">
                  <AlertsToolbar
                    filters={filters}
                    onChange={setFilters}
                    searchInputRef={searchInputRef}
                  />

                  {filtered.length === 0 ? (
                    <EmptyState
                      icon={BellOff}
                      variant={hasFilters ? 'search' : 'default'}
                      title={
                        hasFilters
                          ? t('dashboard.alerts.empty.filteredTitle', 'Sin alertas con esos filtros')
                          : t('dashboard.alerts.empty.title', 'Sin alertas activas')
                      }
                      description={
                        hasFilters
                          ? t(
                              'dashboard.alerts.empty.filteredDescription',
                              'Probá con otra severidad, categoría o término de búsqueda.',
                            )
                          : hasAnyAlerts
                            ? t(
                                'dashboard.alerts.empty.description',
                                'No hay situaciones que requieran atención.',
                              )
                            : t(
                                'dashboard.alerts.empty.noneDescription',
                                'El servidor no reportó alertas para el negocio.',
                              )
                      }
                      actionLabel={
                        hasFilters ? t('dashboard.actions.clearFilters', 'Limpiar') : undefined
                      }
                      onAction={
                        hasFilters ? () => setFilters({ ...EMPTY_ALERT_FILTERS }) : undefined
                      }
                    />
                  ) : (
                    <AlertsList alerts={filtered} />
                  )}
                </div>
              </DashboardSection>
            </div>
          </QueryBoundary>
        </div>
      </div>
    </div>
  )
}

export default AlertsPage
