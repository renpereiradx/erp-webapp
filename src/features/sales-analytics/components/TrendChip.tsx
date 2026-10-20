import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatPercent } from '@/domain/sales-analytics/format'
import type { TrendView } from '@/domain/sales-analytics/kpis'

const FALLBACKS = {
  up: 'Tendencia al alza',
  down: 'Tendencia a la baja',
  stable: 'Sin tendencia',
} as const

/**
 * Chip de variación real (solo para métricas con comparación del BE). El
 * signo lo comunica la flecha; el porcentaje se muestra en valor absoluto y
 * redondeado, nunca con los 14 decimales del payload.
 */
export const TrendChip = ({ trend }: { trend: TrendView }) => {
  const { t } = useI18n()
  const Icon =
    trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus
  const label = t(`salesAnalytics.trend.${trend.direction}`, FALLBACKS[trend.direction])

  return (
    <span
      className="inline-flex items-center gap-xs rounded-full bg-surface-muted px-sm py-xs text-body-sm-bold text-on-surface-deep"
      aria-label={`${label}: ${formatPercent(Math.abs(trend.percentage))}`}
    >
      <Icon size={14} aria-hidden="true" />
      <span className="font-data-mono text-data-mono">
        {formatPercent(Math.abs(trend.percentage))}
      </span>
    </span>
  )
}

export default TrendChip
