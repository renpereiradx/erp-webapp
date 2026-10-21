import { useI18n } from '@/lib/i18n'
import type { AgingBucketRow, AgingBucketKey } from '@/domain/receivables/aging'
import { formatCount, formatMoney, formatPercent } from '@/domain/receivables/format'

const LABELS: Record<AgingBucketKey, { key: string; fallback: string }> = {
  current: { key: 'receivables.aging.current', fallback: '0-30 días' },
  days_30_60: { key: 'receivables.aging.days30_60', fallback: '31-60 días' },
  days_60_90: { key: 'receivables.aging.days60_90', fallback: '61-90 días' },
  over_90_days: { key: 'receivables.aging.over90', fallback: 'Más de 90 días' },
}

const BAR_CLASSES: Record<AgingBucketKey, string> = {
  current: 'bg-success',
  days_30_60: 'bg-primary',
  days_60_90: 'bg-warning',
  over_90_days: 'bg-error',
}

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value))

interface AgingBucketsPanelProps {
  rows: AgingBucketRow[]
  /** Monto que la suma de tramos no cubre (se muestra como "Sin clasificar"). */
  unclassifiedAmount?: number
  testId?: string
  /**
   * `list` para cards de media página (dashboard/ficha); `grid` cuando la card
   * es full-width y los 4 tramos se leen en una fila en desktop.
   */
  layout?: 'list' | 'grid'
}

/**
 * Los 4 tramos de antigüedad con monto, cuentas y participación. La base
 * porcentual es la suma de tramos (la misma que usa el BE), no una cifra
 * propia. Muestra "Sin clasificar" solo cuando el contrato lo exige.
 */
export const AgingBucketsPanel = ({
  rows,
  unclassifiedAmount = 0,
  testId,
  layout = 'list',
}: AgingBucketsPanelProps) => {
  const { t } = useI18n()
  return (
    <div data-testid={testId}>
      <dl className={layout === 'grid' ? 'grid gap-md sm:grid-cols-2 xl:grid-cols-4' : 'space-y-md'}>
        {rows.map((row) => {
          const label = LABELS[row.key]
          return (
            <div key={row.key} data-testid={`aging-bucket-${row.key}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-sm">
                <dt className="text-body-md text-foreground">{t(label.key, label.fallback)}</dt>
                <dd className="font-data-mono text-data-mono text-foreground">
                  {formatMoney(row.amount)}
                </dd>
              </div>
              <div className="mt-xs h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={`h-2 rounded-full ${BAR_CLASSES[row.key]}`}
                  style={{ width: `${clampPercent(row.percentage)}%` }}
                />
              </div>
              <p className="mt-xs text-body-sm text-on-surface-deep">
                {t('receivables.aging.accounts', '{count} cuentas', {
                  count: formatCount(row.count),
                })}
                {' · '}
                {formatPercent(row.percentage)}
              </p>
            </div>
          )
        })}
      </dl>
      {unclassifiedAmount > 0 ? (
        <p
          className="mt-md rounded-sm bg-surface-muted px-sm py-xs text-body-sm text-on-surface-deep"
          data-testid="aging-unclassified"
        >
          {t('receivables.aging.unclassified', 'Sin clasificar: {amount}', {
            amount: formatMoney(unclassifiedAmount),
          })}
        </p>
      ) : null}
    </div>
  )
}

export default AgingBucketsPanel
