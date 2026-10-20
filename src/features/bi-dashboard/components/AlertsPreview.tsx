import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { sortAlertsBySeverity } from '@/domain/dashboard/alerts'
import type { DashboardAlert } from '@/types/bi'
import { DashboardSection } from './DashboardSection'
import { AlertCard } from './AlertCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton } from './Skeletons'

interface AlertsPreviewProps {
  alerts: DashboardAlert[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
}

/** Vista compacta de las 3 alertas más severas para el Resumen Ejecutivo. */
export const AlertsPreview = ({ alerts, isLoading, error, onRetry }: AlertsPreviewProps) => {
  const { t } = useI18n()
  const topAlerts = sortAlertsBySeverity(alerts).slice(0, 3)

  return (
    <DashboardSection
      title={t('dashboard.alerts.title', 'Alertas de negocio')}
      description={t('dashboard.alerts.previewSubtitle', 'Lo que requiere atención ahora.')}
      action={
        <Link
          to="/dashboard/alerts"
          className="text-body-sm-bold text-primary hover:underline"
        >
          {t('dashboard.actions.viewAll', 'Ver todas')}
        </Link>
      }
      testId="dashboard-alerts-preview"
    >
      <QueryBoundary
        isLoading={isLoading}
        error={error}
        errorTitle={t('dashboard.errors.title', 'No se pudieron cargar los datos')}
        onRetry={onRetry}
        skeleton={<PanelSkeleton rows={3} />}
        isEmpty={topAlerts.length === 0}
        empty={
          <div className="flex items-center gap-sm rounded-md bg-surface-muted p-md text-body-md text-on-surface-deep">
            <CheckCircle2 size={18} className="text-success" aria-hidden="true" />
            <div>
              <p className="text-body-md-bold text-foreground">
                {t('dashboard.alerts.empty.title', 'Sin alertas activas')}
              </p>
              <p>{t('dashboard.alerts.empty.description', 'No hay situaciones que requieran atención.')}</p>
            </div>
          </div>
        }
      >
        <div className="space-y-sm">
          {topAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </QueryBoundary>
    </DashboardSection>
  )
}
