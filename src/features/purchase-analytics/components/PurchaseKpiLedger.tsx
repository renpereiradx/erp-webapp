import type { LucideIcon } from 'lucide-react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { formatPercent } from '@/domain/sales-analytics/format'
import type { TrendView } from '@/domain/sales-analytics/kpis'

export type PurchaseKpiTone = 'primary' | 'success' | 'warning' | 'neutral' | 'secondary'

const TONE_CLASSES: Record<PurchaseKpiTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-surface-muted text-on-surface-deep',
  secondary: 'bg-secondary/10 text-secondary',
}

export interface PurchaseKpiItem {
  id: string
  icon: LucideIcon
  tone: PurchaseKpiTone
  label: string
  /** Texto secundario ya traducido (`Pendientes: 2`, `En moneda base`, …). */
  hint?: ReactNode
  /** Cifra ya formateada. */
  value: string
  /** Chip de variación real; solo para métricas con comparación del BE. */
  trend?: TrendView | null
}

const TREND_FALLBACKS = {
  up: 'Tendencia al alza',
  down: 'Tendencia a la baja',
  stable: 'Sin tendencia',
} as const

const TrendChip = ({ trend }: { trend: TrendView }) => {
  const { t } = useI18n()
  const Icon =
    trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus
  const label = t(`purchaseAnalytics.trend.${trend.direction}`, TREND_FALLBACKS[trend.direction])

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

/**
 * Ledger de indicadores de compras: icono tonal + label/hint a la izquierda y
 * cifra completa a la derecha (los montos largos no se parten en dos líneas).
 */
export const PurchaseKpiLedger = ({
  items,
  testId,
}: {
  items: PurchaseKpiItem[]
  testId?: string
}) => (
  <dl className="divide-y divide-divider" data-testid={testId}>
    {items.map((item) => {
      const Icon = item.icon
      const hasMeta = Boolean(item.hint) || Boolean(item.trend)

      return (
        <div
          key={item.id}
          className="grid grid-cols-[auto_1fr] items-center gap-x-md gap-y-xs py-sm first:pt-0 last:pb-0 sm:grid-cols-[auto_1fr_auto]"
          data-testid={`purchase-kpi-${item.id}`}
        >
          <span
            className={`${hasMeta ? 'row-span-3 sm:row-span-2' : 'row-span-2'} flex size-9 shrink-0 items-center justify-center rounded-md ${TONE_CLASSES[item.tone]}`}
            aria-hidden="true"
          >
            <Icon size={18} />
          </span>
          <dt className="text-label-caps uppercase text-on-surface-deep">{item.label}</dt>
          {hasMeta ? (
            <dd className="flex flex-wrap items-center gap-x-sm gap-y-xs text-body-sm text-on-surface-deep">
              {item.trend ? <TrendChip trend={item.trend} /> : null}
              {item.hint ? <span>{item.hint}</span> : null}
            </dd>
          ) : null}
          <dd className="col-start-2 whitespace-nowrap text-left font-data-mono text-title-md text-foreground sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:text-right">
            {item.value}
          </dd>
        </div>
      )
    })}
  </dl>
)

export default PurchaseKpiLedger
