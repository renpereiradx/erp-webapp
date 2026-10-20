import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatNumber } from '@/utils/currencyUtils'
import { getTrendKey } from '@/domain/dashboard/topProducts'
import { roundPercentage } from '@/domain/dashboard/trends'

interface TrendIndicatorProps {
  direction: string | null | undefined
  percentage: number | null | undefined
  className?: string
}

/**
 * Chip de variación: flecha + porcentaje redondeado. Se mantiene NEUTRO a
 * propósito: "subir compras" no es bueno ni malo por sí mismo, así que el
 * color no emite un juicio que los datos no tienen.
 */
export const TrendIndicator = ({ direction, percentage, className }: TrendIndicatorProps) => {
  const { t } = useI18n()
  const trend = getTrendKey(direction)
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const rounded = roundPercentage(percentage, 1)
  const ariaLabel = t(
    `dashboard.topProducts.trend.${trend}`,
    trend === 'up' ? 'Tendencia al alza' : trend === 'down' ? 'Tendencia a la baja' : 'Sin tendencia',
  )

  return (
    <span
      className={`inline-flex items-center gap-xs rounded-full bg-surface-muted px-sm py-xs text-body-sm-bold text-on-surface-deep ${className ?? ''}`}
      title={`${ariaLabel}: ${formatNumber(rounded, 1)}%`}
      aria-label={`${ariaLabel}: ${formatNumber(rounded, 1)}%`}
    >
      <Icon size={14} aria-hidden="true" />
      <span className="font-data-mono text-data-mono">{formatNumber(Math.abs(rounded), 1)}%</span>
    </span>
  )
}
