import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import { getMarginTone, getTrendPercentage } from '@/domain/dashboard/topProducts'
import type { TopProduct } from '@/types/bi'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendIndicator } from './TrendIndicator'

const HEADER_CLASS = 'px-md py-sm text-label-caps uppercase text-on-surface-deep'
const CELL_CLASS = 'px-md py-sm text-body-md text-foreground'
const NUMERIC_CELL_CLASS = 'px-md py-sm text-right font-data-mono text-data-mono text-foreground'

interface TopProductsTableProps {
  products: TopProduct[]
  emptyState: ReactNode
}

/** Tabla del top de productos; orden y límite los decide el backend. */
export const TopProductsTable = ({ products, emptyState }: TopProductsTableProps) => {
  const { t } = useI18n()

  return (
    <Table className="min-w-[760px]">
      <TableHeader className="bg-surface-muted">
        <TableRow className="border-0 hover:bg-surface-muted">
          <TableHead className={HEADER_CLASS}>{t('dashboard.topProducts.table.product', 'Producto')}</TableHead>
          <TableHead className={HEADER_CLASS}>{t('dashboard.topProducts.table.category', 'Categoría')}</TableHead>
          <TableHead className={`${HEADER_CLASS} text-right`}>
            {t('dashboard.topProducts.table.units', 'Cantidad vendida')}
          </TableHead>
          <TableHead className={`${HEADER_CLASS} text-right`}>
            {t('dashboard.topProducts.table.revenue', 'Ingresos')}
          </TableHead>
          <TableHead className={`${HEADER_CLASS} text-right`}>
            {t('dashboard.topProducts.table.profit', 'Utilidad')}
          </TableHead>
          <TableHead className={`${HEADER_CLASS} text-right`}>
            {t('dashboard.topProducts.table.margin', 'Margen')}
          </TableHead>
          <TableHead className={`${HEADER_CLASS} text-right`}>
            {t('dashboard.topProducts.table.trend', 'Tendencia')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length === 0 ? (
          <TableRow className="border-0 hover:bg-transparent">
            <TableCell colSpan={7} className="py-xl">
              {emptyState}
            </TableCell>
          </TableRow>
        ) : (
          products.map((product) => {
            const metadata = [product.brand_name, product.variant_name]
              .filter(Boolean)
              .join(' · ')

            return (
              <TableRow
                key={`${product.id}-${product.variant_id ?? 'base'}`}
                className="border-0 transition-colors duration-150 hover:bg-surface-muted"
                data-testid={`top-product-row-${product.id}`}
              >
                <TableCell className={CELL_CLASS}>
                  <p className="text-body-md-bold text-foreground">{product.name}</p>
                  {metadata ? (
                    <p className="text-body-sm text-on-surface-deep">{metadata}</p>
                  ) : null}
                </TableCell>
                <TableCell className={CELL_CLASS}>{product.category}</TableCell>
                <TableCell className={NUMERIC_CELL_CLASS}>
                  {formatNumber(product.quantity_sold, 2)}
                </TableCell>
                <TableCell className={NUMERIC_CELL_CLASS}>
                  {formatPYG(product.revenue)}
                </TableCell>
                <TableCell className={NUMERIC_CELL_CLASS}>
                  {formatPYG(product.profit)}
                </TableCell>
                <TableCell className={`${CELL_CLASS} text-right`}>
                  <Badge variant={getMarginTone(product.margin_percentage)} size="sm">
                    {formatNumber(product.margin_percentage, 1)}%
                  </Badge>
                </TableCell>
                <TableCell className={`${CELL_CLASS} text-right`}>
                  <TrendIndicator
                    direction={product.trend}
                    percentage={getTrendPercentage(product)}
                  />
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
