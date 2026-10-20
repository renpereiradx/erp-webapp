import { TrendingDown, TrendingUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { ProductProfitabilityRow } from '@/types/bi'
import { formatMoney } from '@/domain/profitability/format'
import { derivedMarginPct } from '@/domain/profitability/products'
import { formatPercent } from '@/domain/profitability/format'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableEmptyState } from '@/components/ui/TableEmptyState'

interface ProductHighlightsProps {
  topProfitable: ProductProfitabilityRow[]
  losers: ProductProfitabilityRow[]
}

const ProductList = ({
  rows,
  empty,
  tone,
}: {
  rows: ProductProfitabilityRow[]
  empty: string
  tone: 'positive' | 'negative'
}) => {
  if (rows.length === 0) {
    return (
      <TableEmptyState
        icon={tone === 'positive' ? TrendingUp : TrendingDown}
        title={empty}
      />
    )
  }
  return (
    <ul className="divide-y divide-divider">
      {rows.map((row) => (
        <li
          key={row.product_id}
          className="flex flex-col gap-xs py-sm first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-md"
        >
          <div className="min-w-0">
            <p className="text-body-md-bold text-foreground">{row.product_name}</p>
            <p className="text-body-sm text-on-surface-deep">{row.category_name}</p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p
              className={`font-data-mono text-title-md ${tone === 'negative' ? 'text-error' : 'text-foreground'}`}
            >
              {formatMoney(row.gross_profit)}
            </p>
            <p className="text-body-sm text-on-surface-deep">
              {formatPercent(derivedMarginPct(row))}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Paneles de productos con mayor beneficio y con pérdida. El SQL de top usa
 * el mismo costo coalescido que la página; los "losers" solo aparecen con
 * beneficio negativo real (no se infiere una pérdida por margen bajo).
 */
export const ProductHighlights = ({ topProfitable, losers }: ProductHighlightsProps) => {
  const { t } = useI18n()

  return (
    <div className="grid gap-xl lg:grid-cols-2">
      <SectionCard
        title={t('profitability.products.topTitle', 'Mayor beneficio')}
        description={t(
          'profitability.products.topSubtitle',
          'Hasta 5 productos del período ordenados por beneficio.',
        )}
        testId="products-top-card"
      >
        <ProductList
          rows={topProfitable}
          tone="positive"
          empty={t('profitability.products.topEmpty', 'Sin productos con beneficio')}
        />
      </SectionCard>
      <SectionCard
        title={t('profitability.products.losersTitle', 'Productos con pérdida')}
        description={t(
          'profitability.products.losersSubtitle',
          'Hasta 5 productos con beneficio negativo en el período.',
        )}
        testId="products-losers-card"
      >
        <ProductList
          rows={losers}
          tone="negative"
          empty={t('profitability.products.losersEmpty', 'Sin productos con pérdida')}
        />
      </SectionCard>
    </div>
  )
}

export default ProductHighlights
