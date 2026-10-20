import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type ProfitabilityKpiTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'secondary'
  | 'neutral'

const TONE_CLASSES: Record<ProfitabilityKpiTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  secondary: 'bg-secondary/10 text-secondary',
  neutral: 'bg-surface-muted text-on-surface-deep',
}

export interface ProfitabilityKpiItem {
  id: string
  icon: LucideIcon
  tone: ProfitabilityKpiTone
  label: string
  /** Texto secundario ya traducido (qué mide o de dónde sale). */
  hint?: ReactNode
  /** Cifra ya formateada. */
  value: string
}

/**
 * Ledger de indicadores: icono tonal + label/hint a la izquierda y cifra a la
 * derecha, para que montos largos no se partan en mobile. Sin fetch ni
 * cálculo: los ítems llegan resueltos desde la página.
 */
export const ProfitabilityKpiLedger = ({
  items,
  testId,
}: {
  items: ProfitabilityKpiItem[]
  testId?: string
}) => (
  <dl className="divide-y divide-divider" data-testid={testId}>
    {items.map((item) => {
      const Icon = item.icon
      return (
        <div
          key={item.id}
          className="grid grid-cols-[auto_1fr] items-center gap-x-md gap-y-xs py-sm first:pt-0 last:pb-0 sm:grid-cols-[auto_1fr_auto]"
          data-testid={`profitability-kpi-${item.id}`}
        >
          <span
            className={`${item.hint ? 'row-span-3 sm:row-span-2' : 'row-span-2'} flex size-9 shrink-0 items-center justify-center rounded-md ${TONE_CLASSES[item.tone]}`}
            aria-hidden="true"
          >
            <Icon size={18} />
          </span>
          <dt className="text-label-caps uppercase text-on-surface-deep">{item.label}</dt>
          {item.hint ? (
            <dd className="text-body-sm text-on-surface-deep">{item.hint}</dd>
          ) : null}
          <dd className="col-start-2 whitespace-nowrap text-left font-data-mono text-title-md text-foreground sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:text-right">
            {item.value}
          </dd>
        </div>
      )
    })}
  </dl>
)

export default ProfitabilityKpiLedger
