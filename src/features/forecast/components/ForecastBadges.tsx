import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import {
  INSIGHT_IMPACT_FALLBACK,
  RISK_FALLBACK,
  TREND_FALLBACK,
} from '@/domain/forecast/constants'
import type { ForecastStockoutRisk, ForecastTrend } from '@/types/bi'

export type ForecastBadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error'

const TONE_CLASSES: Record<ForecastBadgeTone, string> = {
  neutral: 'bg-surface-muted text-on-surface-deep',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
}

export const ForecastBadge = ({
  tone = 'neutral',
  children,
  testId,
}: {
  tone?: ForecastBadgeTone
  children: ReactNode
  testId?: string
}) => (
  <span
    className={`inline-flex items-center whitespace-nowrap rounded-full px-sm py-xs text-label-caps uppercase ${TONE_CLASSES[tone]}`}
    data-testid={testId}
  >
    {children}
  </span>
)

const TREND_TONES: Record<string, ForecastBadgeTone> = {
  INCREASING: 'success',
  DECREASING: 'error',
  STABLE: 'neutral',
}

/** Tendencia real del BE; un código desconocido se muestra crudo. */
export const ForecastTrendBadge = ({ trend }: { trend: ForecastTrend | string | null | undefined }) => {
  const { t } = useI18n()
  if (!trend) return <span className="text-on-surface-deep">—</span>
  const key = `forecast.trend.${String(trend).toLowerCase()}`
  return (
    <ForecastBadge tone={TREND_TONES[trend] ?? 'neutral'}>
      {t(key, TREND_FALLBACK[trend] ?? String(trend))}
    </ForecastBadge>
  )
}

const RISK_TONES: Record<string, ForecastBadgeTone> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'neutral',
  NONE: 'success',
}

/** Riesgo de quiebre (HIGH/MEDIUM/LOW/NONE) con el umbral del BE. */
export const ForecastRiskBadge = ({
  risk,
}: {
  risk: ForecastStockoutRisk | string | null | undefined
}) => {
  const { t } = useI18n()
  if (!risk) return <span className="text-on-surface-deep">—</span>
  return (
    <ForecastBadge tone={RISK_TONES[risk] ?? 'neutral'}>
      {t(`forecast.risk.${String(risk).toLowerCase()}`, RISK_FALLBACK[risk] ?? String(risk))}
    </ForecastBadge>
  )
}

const IMPACT_TONES: Record<string, ForecastBadgeTone> = {
  HIGH: 'primary',
  MEDIUM: 'warning',
  LOW: 'neutral',
}

export const ForecastImpactBadge = ({ impact }: { impact: string | null | undefined }) => {
  const { t } = useI18n()
  if (!impact) return null
  return (
    <ForecastBadge tone={IMPACT_TONES[impact] ?? 'neutral'}>
      {t(
        `forecast.impact.${String(impact).toLowerCase()}`,
        INSIGHT_IMPACT_FALLBACK[impact] ?? String(impact),
      )}
    </ForecastBadge>
  )
}

const PRIORITY_TONES: Record<string, ForecastBadgeTone> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'neutral',
}

export const ForecastPriorityBadge = ({
  priority,
}: {
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | string
}) => {
  const { t } = useI18n()
  return (
    <ForecastBadge tone={PRIORITY_TONES[priority] ?? 'neutral'}>
      {t(`forecast.priority.${String(priority).toLowerCase()}`, priority)}
    </ForecastBadge>
  )
}
