import { useI18n } from '@/lib/i18n'
import type { PayablesAgingSummary } from '@/types/bi'
import { agingBucketRows } from '@/domain/payables/aging'
import { formatCount, formatMoney, formatPercent } from '@/domain/payables/format'

const LABELS: Record<string, { key: string; fallback: string }> = {
  current: { key: 'payables.aging.current', fallback: '0 – 30 días' },
  days_30_60: { key: 'payables.aging.days30to60', fallback: '31 – 60 días' },
  days_60_90: { key: 'payables.aging.days60to90', fallback: '61 – 90 días' },
  over_90_days: { key: 'payables.aging.over90', fallback: 'Más de 90 días' },
}

const BAR_TONE: Record<string, string> = {
  current: 'bg-primary',
  days_30_60: 'bg-warning',
  days_60_90: 'bg-warning',
  over_90_days: 'bg-error',
}

/**
 * Distribución por antigüedad desde la fecha de compra. Los montos y los
 * porcentajes son del payload; la barra solo escala visualmente con el
 * porcentaje (no recalcula la cifra). Sin fetch.
 */
export const AgingBucketsPanel = ({ summary }: { summary: PayablesAgingSummary }) => {
  const { t } = useI18n()
  const rows = agingBucketRows(summary)
  const total = rows.reduce((sum, row) => sum + row.amount, 0)

  return (
    <div className="space-y-md" data-testid="payables-aging-panel">
      <dl className="space-y-md">
        {rows.map((row) => (
          <div key={row.key} data-testid={`payables-aging-${row.key}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
              <dt className="text-body-md-bold text-foreground">
                {t(LABELS[row.key].key, LABELS[row.key].fallback)}
              </dt>
              <dd className="font-data-mono text-data-mono text-foreground">
                {formatMoney(row.amount)}
                <span className="ml-sm text-body-sm text-on-surface-deep">
                  {formatPercent(row.percentage)}
                </span>
              </dd>
            </div>
            <div className="mt-xs h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className={`h-full ${BAR_TONE[row.key]}`}
                style={{ width: `${Math.min(100, Math.max(0, row.percentage))}%` }}
                aria-hidden="true"
              />
            </div>
            <p className="mt-xs text-body-sm text-on-surface-deep">
              {t('payables.aging.accounts', 'Cuentas: {count}', {
                count: formatCount(row.count),
              })}
            </p>
          </div>
        ))}
      </dl>
      <p className="text-body-sm text-on-surface-deep">
        {t('payables.aging.totalClassified', 'Total en tramos: {amount}', {
          amount: formatMoney(total),
        })}
      </p>
    </div>
  )
}

export default AgingBucketsPanel
