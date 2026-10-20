import { useI18n } from '@/lib/i18n'
import { formatMoney, formatPercent, formatQuantity } from '@/domain/sales-analytics/format'
import type { ProductRankItem } from '@/domain/sales-analytics/products'

interface ProductRankListProps {
  items: ProductRankItem[]
  /** La métrica extra que se muestra además de las ventas. */
  metric: 'units' | 'margin'
  testId?: string
}

/**
 * Lista compacta de un ranking de productos (más vendidos, mayor margen,
 * cola). El orden lo decidió el BE; acá solo se numera la posición.
 */
export const ProductRankList = ({ items, metric, testId }: ProductRankListProps) => {
  const { t } = useI18n()

  if (items.length === 0) {
    return (
      <p className="py-lg text-center text-body-md text-on-surface-deep">
        {t('salesAnalytics.products.rankEmpty', 'Sin productos vendidos en el período.')}
      </p>
    )
  }

  return (
    <ol className="divide-y divide-divider" data-testid={testId}>
      {items.map((item, index) => (
        <li key={item.id} className="flex items-start justify-between gap-md py-sm first:pt-0 last:pb-0">
          <div className="flex min-w-0 items-start gap-sm">
            <span
              className="mt-xs w-5 shrink-0 text-right font-data-mono text-body-sm text-on-surface-deep"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="line-clamp-2 text-body-md-bold text-foreground" title={item.name}>
                {item.name}
              </p>
              {item.category ? (
                <p className="truncate text-body-sm text-on-surface-deep" title={item.category}>
                  {item.category}
                </p>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-data-mono text-data-mono text-foreground">{formatMoney(item.sales)}</p>
            <p className="text-body-sm text-on-surface-deep">
              {metric === 'margin'
                ? t('salesAnalytics.products.marginLabel', 'Margen: {value}', {
                    value: formatPercent(item.marginPct),
                  })
                : t('salesAnalytics.products.unitsLabel', 'Unidades: {value}', {
                    value: formatQuantity(item.units),
                  })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default ProductRankList
