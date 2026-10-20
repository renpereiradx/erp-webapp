import { ShieldAlert } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { ProfitabilityAlert } from '@/types/bi'
import { alertTone, alertValueKind, alertViews, type ProfitabilityAlertKey } from '@/domain/profitability/alerts'
import { formatCount, formatPercent, formatSignedPercent } from '@/domain/profitability/format'
import { ProfitabilityBadge } from './ProfitabilityBadge'

interface AlertsPanelProps {
  alerts: ProfitabilityAlert[]
  testId?: string
}

const ALERT_FALLBACKS: Record<ProfitabilityAlertKey, { label: string; description: string }> = {
  lowMargin: {
    label: 'Margen bruto bajo',
    description: 'El margen bruto del período quedó por debajo del 15 % (regla del reporte).',
  },
  decliningProfit: {
    label: 'Beneficio en declive',
    description: 'El beneficio cayó más de 10 % contra la ventana previa de igual duración.',
  },
  unprofitableProducts: {
    label: 'Productos con pérdida',
    description: 'Hay productos con beneficio bruto menor o igual a cero en el período.',
  },
  profitGrowth: {
    label: 'Crecimiento del beneficio',
    description: 'El beneficio creció más de 20 % contra la ventana previa de igual duración.',
  },
}

/**
 * Alertas derivadas por el BE. NO se muestra `message` (texto español
 * hardcodeado en el servidor): se traduce el `type` y se formatea `value`
 * contra el `threshold` real de la regla.
 */
export const ProfitabilityAlertsPanel = ({
  alerts,
  testId = 'profitability-alerts',
}: AlertsPanelProps) => {
  const { t } = useI18n()
  const views = alertViews(alerts)

  if (views.length === 0) {
    return (
      <div className="flex items-center gap-sm py-md text-body-md text-on-surface-deep">
        <ShieldAlert size={18} aria-hidden="true" />
        {t('profitability.alerts.empty', 'Sin alertas de rentabilidad en el período.')}
      </div>
    )
  }

  const renderValue = (key: ProfitabilityAlertKey, value: number): string => {
    switch (alertValueKind(key)) {
      case 'percent':
        return formatPercent(value)
      case 'signedPercent':
        return formatSignedPercent(value)
      case 'count':
      default:
        return formatCount(value)
    }
  }

  return (
    <ul className="divide-y divide-divider" data-testid={testId}>
      {views.map((view) => (
        <li
          key={`${view.key}-${view.alert.category}`}
          className="flex flex-col gap-xs py-sm first:pt-0 last:pb-0"
        >
          <div className="flex flex-wrap items-center gap-sm">
            <ProfitabilityBadge tone={alertTone(view.key) as 'success' | 'warning' | 'error' | 'neutral'}>
              {t(`profitability.alerts.${view.key}.label`, ALERT_FALLBACKS[view.key].label)}
            </ProfitabilityBadge>
            <span className="font-data-mono text-data-mono text-foreground">
              {renderValue(view.key, view.value)}
            </span>
          </div>
          <p className="text-body-sm text-on-surface-deep">
            {t(
              `profitability.alerts.${view.key}.description`,
              ALERT_FALLBACKS[view.key].description,
            )}
          </p>
          {view.threshold !== null ? (
            <p className="text-body-sm text-on-surface-deep">
              {t('profitability.alerts.threshold', 'Umbral de la regla: {value}', {
                value: renderValue(view.key, view.threshold),
              })}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export default ProfitabilityAlertsPanel
