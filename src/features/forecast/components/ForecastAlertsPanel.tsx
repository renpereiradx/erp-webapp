import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  ALERT_TYPE_FALLBACK,
  ALERT_TYPE_I18N_KEYS,
} from '@/domain/forecast/constants'
import type { InventoryAlertView } from '@/domain/forecast/inventory'
import { ForecastPriorityBadge } from './ForecastBadges'

interface ForecastAlertsPanelProps {
  alerts: InventoryAlertView[]
  counts: { total: number; high: number; medium: number }
  testId?: string
}

/**
 * Alertas de quiebre que genera el BE (`STOCKOUT_IMMINENT` / `LOW_STOCK`).
 * Se traduce el `type` y se descarta el `message` en español del repo; el
 * listado se recorta a las primeras N y muestra el total real aparte.
 */
export const ForecastAlertsPanel = ({
  alerts,
  counts,
  testId,
}: ForecastAlertsPanelProps) => {
  const { t } = useI18n()

  if (counts.total === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-sm py-lg text-center text-on-surface-deep"
        data-testid={testId ? `${testId}-empty` : undefined}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 size={22} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="text-body-md-bold text-foreground">
          {t('forecast.inventory.alerts.empty', 'Sin alertas de quiebre')}
        </p>
        <p className="text-body-sm">
          {t(
            'forecast.inventory.alerts.emptyHint',
            'Ningún producto del set analizado está en riesgo alto o medio.',
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-sm" data-testid={testId}>
      <p className="text-body-sm text-on-surface-deep">
        {t(
          'forecast.inventory.alerts.summary',
          'Alertas: {total} · Altas: {high} · Medias: {medium}',
          { total: counts.total, high: counts.high, medium: counts.medium },
        )}
      </p>
      <ul className="divide-y divide-divider">
        {alerts.map((alert) => (
          <li
            key={alert.key}
            className="flex flex-col gap-xs py-sm first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-sm">
              <span className="mt-xs text-warning" aria-hidden="true">
                <AlertTriangle size={16} />
              </span>
              <div className="min-w-0">
                <p className="break-words text-body-md-bold text-foreground">
                  {alert.productName || alert.productId || '—'}
                </p>
                <p className="text-body-sm text-on-surface-deep">
                  {t(
                    `forecast.inventory.alerts.type.${ALERT_TYPE_I18N_KEYS[alert.type] ?? String(alert.type).toLowerCase()}`,
                    ALERT_TYPE_FALLBACK[alert.type] ?? alert.type,
                  )}
                  {alert.daysToAct !== null
                    ? ` · ${t('forecast.inventory.alerts.daysLabel', 'Días para actuar: {days}', {
                        days: alert.daysToAct,
                      })}`
                    : ''}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-sm pl-7 sm:pl-0">
              <ForecastPriorityBadge priority={alert.severity} />
            </div>
          </li>
        ))}
      </ul>
      {counts.total > alerts.length ? (
        <p className="text-body-sm text-on-surface-deep">
          {t('forecast.inventory.alerts.more', '+{count} alertas más', {
            count: counts.total - alerts.length,
          })}
        </p>
      ) : null}
    </div>
  )
}

export default ForecastAlertsPanel
