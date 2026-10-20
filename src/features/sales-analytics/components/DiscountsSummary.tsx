import { Percent } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatCount, formatMoney, formatPercent } from '@/domain/sales-analytics/format'
import type { DiscountSummaryView } from '@/domain/sales-analytics/discounts'

/**
 * Resumen "quién descontó cuánto": el BE ordena por total descontado. La
 * participación se deriva de la suma de los grupos devueltos y se rotula como
 * tal (no como porcentaje del total de ventas).
 */
export const DiscountsSummary = ({ view }: { view: DiscountSummaryView }) => {
  const { t } = useI18n()

  if (view.groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-sm py-lg text-center text-on-surface-deep">
        <span className="flex size-14 items-center justify-center rounded-full bg-surface-muted">
          <Percent size={24} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="text-body-md-bold text-foreground">
          {t('salesAnalytics.discounts.empty', 'Sin descuentos en el período')}
        </p>
        <p className="text-body-sm text-on-surface-deep">
          {t(
            'salesAnalytics.discounts.emptyHint',
            'Probá con otro rango de fechas.',
          )}
        </p>
      </div>
    )
  }

  return (
    <div data-testid="discounts-summary">
      <ul className="divide-y divide-divider">
        {view.groups.map((group) => (
          <li key={group.group_key} className="space-y-xs py-sm first:pt-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-sm">
              <span className="text-body-md-bold text-foreground">{group.group_name}</span>
              <span className="font-data-mono text-data-mono text-foreground">
                {formatMoney(group.total_discount)} · {formatPercent(group.share)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
              <div
                className="h-full rounded-full bg-primary/60"
                style={{ width: `${Math.min(Math.max(group.share, 0), 100)}%` }}
              />
            </div>
            <p className="text-body-sm text-on-surface-deep">
              {t('salesAnalytics.discounts.groupCount', 'Descuentos: {count}', {
                count: formatCount(group.discount_count),
              })}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-md flex flex-wrap items-baseline justify-between gap-sm border-t border-divider pt-sm">
        <p className="text-body-md-bold text-foreground">
          {t('salesAnalytics.discounts.total', 'Total descontado')}
        </p>
        <p className="font-data-mono text-title-md text-foreground">
          {formatMoney(view.totalDiscount)}
        </p>
      </div>
      <p className="text-body-sm text-on-surface-deep">
        {t('salesAnalytics.discounts.totalCount', 'Descuentos registrados: {count}', {
          count: formatCount(view.totalCount),
        })}
      </p>
    </div>
  )
}

export default DiscountsSummary
