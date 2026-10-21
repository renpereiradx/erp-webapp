import { useI18n } from '@/lib/i18n'
import { formatMoney, formatPercent } from '@/domain/finance/format'

export interface StatementRow {
  id: string
  label: string
  amount: number | null
  kind?: 'money' | 'percent'
  /** `negative` se muestra con signo de resta; `total`/`subtotal` con énfasis. */
  emphasis?: 'normal' | 'subtotal' | 'total'
  negative?: boolean
  hint?: string
}

const rowClass: Record<NonNullable<StatementRow['emphasis']>, string> = {
  normal: 'text-body-md text-foreground',
  subtotal: 'text-body-md-bold text-foreground',
  total: 'text-title-sm text-foreground',
}

/**
 * Estado de resultados / flujo de caja como lista concepto → importe. Sin
 * cálculo: los montos llegan del payload; `negative` solo cambia el signo de
 * presentación de una resta.
 */
export const StatementTable = ({
  rows,
  testId,
  caption,
}: {
  rows: StatementRow[]
  testId?: string
  caption?: string
}) => {
  const { t } = useI18n()
  return (
    <dl className="divide-y divide-divider" data-testid={testId}>
      {caption ? <p className="sr-only">{caption}</p> : null}
      {rows.map((row) => {
        const value =
          row.kind === 'percent'
            ? formatPercent(row.amount)
            : row.negative && row.amount !== null
              ? `-${formatMoney(Math.abs(row.amount))}`
              : formatMoney(row.amount)
        return (
          <div
            key={row.id}
            className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs py-sm first:pt-0 last:pb-0"
            data-testid={`finance-statement-${row.id}`}
          >
            <dt className={rowClass[row.emphasis ?? 'normal']}>
              {row.label}
              {row.hint ? (
                <span className="mt-xs block text-body-sm text-on-surface-deep">{row.hint}</span>
              ) : null}
            </dt>
            <dd
              className={`whitespace-nowrap font-data-mono text-data-mono ${row.emphasis === 'total' ? 'text-title-sm' : ''}`}
            >
              {value}
            </dd>
          </div>
        )
      })}
      {rows.length === 0 ? (
        <p className="py-md text-body-sm text-on-surface-deep">
          {t('finance.common.noRows', 'Sin datos para el período')}
        </p>
      ) : null}
    </dl>
  )
}

export default StatementTable
