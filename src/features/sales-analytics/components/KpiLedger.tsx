import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { TrendChip } from './TrendChip'
import type { TrendView } from '@/domain/sales-analytics/kpis'

export type KpiTone = 'primary' | 'success' | 'warning' | 'neutral' | 'secondary'

const TONE_CLASSES: Record<KpiTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-surface-muted text-on-surface-deep',
  secondary: 'bg-secondary/10 text-secondary',
}

export interface KpiLedgerItem {
  id: string
  icon: LucideIcon
  tone: KpiTone
  label: string
  hint?: ReactNode
  value: string
  trend?: TrendView | null
}

/**
 * Ledger de indicadores: icono tonal + label/hint a la izquierda y cifra
 * completa a la derecha. Se usa en lugar de una grilla de tarjetas KPI para
 * que los montos largos (`Gs. 13.377.100`) no se partan en dos líneas.
 */
export const KpiLedger = ({ items, testId }: { items: KpiLedgerItem[]; testId?: string }) => (
  <dl className="divide-y divide-divider" data-testid={testId}>
    {items.map((item) => {
      const Icon = item.icon
      const hasMeta = Boolean(item.hint) || Boolean(item.trend)

      return (
        <div
          key={item.id}
          className="grid grid-cols-[auto_1fr] items-center gap-x-md gap-y-xs py-sm first:pt-0 last:pb-0 sm:grid-cols-[auto_1fr_auto]"
          data-testid={`kpi-${item.id}`}
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

export default KpiLedger
