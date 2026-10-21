import { useI18n } from '@/lib/i18n'
import type { ClientRisk } from '@/types/bi'
import {
  hasPaymentHistory,
  overdueRatioPercent,
  riskLevelKey,
  riskSignals,
  type RiskLevelKey,
} from '@/domain/receivables/risk'
import { formatDateTime, formatPercent } from '@/domain/receivables/format'
import { ReceivablesBadge, type ReceivablesBadgeTone } from './ReceivablesBadge'
import { ReceivablesBehaviorBadge } from './ReceivablesBehaviorBadge'

const RISK_TONE: Record<RiskLevelKey, ReceivablesBadgeTone> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
}

const RISK_FALLBACK: Record<RiskLevelKey, string> = {
  low: 'Riesgo bajo',
  medium: 'Riesgo medio',
  high: 'Riesgo alto',
}

const SIGNALS = [
  {
    key: 'over90Debt',
    labelKey: 'receivables.client.signals.over90',
    fallback: 'Tiene deuda con más de 90 días desde la venta',
  },
  {
    key: 'ratioOver50',
    labelKey: 'receivables.client.signals.ratioOver50',
    fallback: 'Más de la mitad del saldo supera los 30 días desde la venta',
  },
  {
    key: 'ratioOver30',
    labelKey: 'receivables.client.signals.ratioOver30',
    fallback: 'Más del 30 % del saldo supera los 30 días desde la venta',
  },
  {
    key: 'maxAgeOver60',
    labelKey: 'receivables.client.signals.maxAgeOver60',
    fallback: 'La cuenta más antigua supera los 60 días',
  },
] as const

/**
 * Panel de riesgo del cliente. Nivel, señales y ratio salen del endpoint
 * `/receivables/client/{id}/risk`; el comportamiento se oculta sin pagos (el
 * BE devuelve EXCELLENT con promedio 0). `collection_rate` del payload no se
 * muestra: su fórmula puede superar el 100 %.
 */
export const ClientRiskPanel = ({ risk, locale }: { risk: ClientRisk; locale?: string }) => {
  const { t } = useI18n()
  const level = riskLevelKey(risk.risk_level)
  const signals = riskSignals(risk)
  const activeSignals = SIGNALS.filter((signal) => signals[signal.key])
  const ratio = overdueRatioPercent(risk.overdue_ratio)
  const showBehavior = hasPaymentHistory(risk)

  return (
    <div className="space-y-md" data-testid="receivables-risk">
      <div className="flex flex-wrap items-center gap-sm">
        <ReceivablesBadge
          tone={level ? RISK_TONE[level] : 'neutral'}
          testId="receivables-risk-level"
        >
          {level
            ? t(`receivables.client.riskLevels.${level}`, RISK_FALLBACK[level])
            : t('receivables.client.riskUnknown', 'Sin nivel de riesgo')}
        </ReceivablesBadge>
        <span className="text-body-sm text-on-surface-deep">
          {t('receivables.client.analyzedAt', 'Analizado el {date}', {
            date: formatDateTime(risk.analyzed_at, locale),
          })}
        </span>
      </div>

      <p className="text-body-sm text-on-surface-deep">
        {t(
          'receivables.client.riskRule',
          'Regla del reporte: alto si hay deuda de más de 90 días y la mitad del saldo está vencida; medio si el vencido supera el 30 % o la antigüedad máxima pasa de 60 días; bajo en el resto.',
        )}
      </p>

      <div>
        <p className="text-label-caps uppercase text-on-surface-deep">
          {t('receivables.client.signalsTitle', 'Señales activas')}
        </p>
        {activeSignals.length === 0 ? (
          <p className="mt-xs text-body-md text-on-surface-deep" data-testid="receivables-risk-no-signals">
            {t('receivables.client.noRiskSignals', 'Sin señales de riesgo activas.')}
          </p>
        ) : (
          <ul className="mt-xs space-y-xs">
            {activeSignals.map((signal) => (
              <li
                key={signal.key}
                className="flex items-start gap-xs text-body-md text-foreground"
                data-testid={`receivables-risk-signal-${signal.key}`}
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-error" aria-hidden="true" />
                {t(signal.labelKey, signal.fallback)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <dl className="grid gap-sm sm:grid-cols-2">
        <div>
          <dt className="text-label-caps uppercase text-on-surface-deep">
            {t('receivables.client.riskRatio', 'Proporción vencida')}
          </dt>
          <dd
            className="font-data-mono text-data-mono text-foreground"
            data-testid="receivables-risk-ratio"
          >
            {formatPercent(ratio)}
          </dd>
        </div>
        <div>
          <dt className="text-label-caps uppercase text-on-surface-deep">
            {t('receivables.client.behaviorLabel', 'Comportamiento de pago')}
          </dt>
          <dd className="mt-xs" data-testid="receivables-risk-behavior">
            {showBehavior ? (
              <ReceivablesBehaviorBadge behavior={risk.payment_behavior} />
            ) : (
              <span className="text-body-md text-on-surface-deep">
                {t('receivables.client.noPayments', 'Sin pagos registrados')}
              </span>
            )}
          </dd>
        </div>
      </dl>
      <p className="text-body-sm text-on-surface-deep">
        {t(
          'receivables.client.behaviorHint',
          'Comportamiento: hasta 30 días de pago es excelente, hasta 45 bueno, hasta 60 regular; más de 60 es malo.',
        )}
      </p>
    </div>
  )
}

export default ClientRiskPanel
