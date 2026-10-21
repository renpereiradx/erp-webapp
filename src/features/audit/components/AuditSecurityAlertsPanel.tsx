import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import type { AuditSecurityAlert } from '@/types/bi'
import { auditAlertTypeFallback, auditAlertTypeLabelKey } from '@/domain/audit/labels'
import { formatCount, formatDateTime } from '@/domain/audit/format'
import { AuditSeverityBadge } from './AuditBadges'
import { TableEmptyState } from '@/components/ui/TableEmptyState'

interface AuditSecurityAlertsPanelProps {
  alerts: AuditSecurityAlert[]
  testId: string
}

/**
 * Alertas de seguridad que calcula el SQL (`getSecurityAlerts`):
 * ≥ 3 logins fallidos por usuario/IP y ≥ 100 acciones en una hora.
 *
 * NO se muestra `alert.message`: viene armado en español desde el repositorio;
 * la UI traduce el `type` y muestra el conteo y el contexto reales.
 */
export const AuditSecurityAlertsPanel = ({
  alerts,
  testId,
}: AuditSecurityAlertsPanelProps) => {
  const { t, lang } = useI18n()

  if (alerts.length === 0) {
    return (
      <div data-testid={`${testId}-empty`}>
        <TableEmptyState
          icon={ShieldCheck}
          title={t('audit.alerts.empty', 'Sin alertas de seguridad')}
          description={t(
            'audit.alerts.emptyHint',
            'No se registraron intentos de login fallidos repetidos ni picos de actividad en el período.',
          )}
        />
      </div>
    )
  }

  return (
    <ul className="divide-y divide-divider" data-testid={testId}>
      {alerts.map((alert, index) => (
        <li key={`${alert.type}-${alert.user_id ?? 'anon'}-${index}`} className="space-y-xs py-sm first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-sm">
            <AuditSeverityBadge severity={alert.severity} />
            <span className="text-body-md-bold text-foreground">
              {t(auditAlertTypeLabelKey(alert.type), auditAlertTypeFallback(alert.type))}
            </span>
            <span className="font-data-mono text-data-mono text-on-surface-deep">
              {t('audit.alerts.count', '{count} eventos', { count: formatCount(alert.count) })}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-md gap-y-xs text-body-sm text-on-surface-deep">
            {alert.user_id ? (
              <Link
                to={`/auditoria/usuarios/${encodeURIComponent(alert.user_id)}`}
                className="text-primary hover:underline"
              >
                {alert.user_id}
              </Link>
            ) : null}
            {alert.ip_address ? (
              <span className="font-data-mono text-data-mono">
                {t('audit.alerts.ip', 'IP: {ip}', { ip: alert.ip_address })}
              </span>
            ) : null}
            <span>{formatDateTime(alert.occurred_at, lang)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default AuditSecurityAlertsPanel
