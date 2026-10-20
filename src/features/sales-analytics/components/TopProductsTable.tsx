import { Package } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatMoney, formatPercent, formatQuantity } from '@/domain/sales-analytics/format'
import type { ProductSalesData } from '@/types/bi'
import { AnalyticsTable, type AnalyticsColumn } from './AnalyticsTable'

interface TopProductsTableProps {
  products: ProductSalesData[]
}

/**
 * Top 5 de productos del dashboard. Columnas acotadas a lo que entra en la
 * card de 3/5 sin cortar montos: categoría y marca/variante van como sublínea
 * del producto, y utilidad queda para el detalle completo.
 */
export const TopProductsTable = ({ products }: TopProductsTableProps) => {
  const { t } = useI18n()

  const columns: Array<AnalyticsColumn<ProductSalesData>> = [
    {
      key: 'product',
      header: t('salesAnalytics.columns.product', 'Producto'),
      render: (row) => {
        const metadata = [row.category_name, row.brand_name, row.variant_name]
          .filter(Boolean)
          .join(' · ')
        return (
          <div>
            <p className="text-body-md-bold text-foreground">{row.product_name || '—'}</p>
            {metadata ? (
              <p className="text-body-sm text-on-surface-deep">{metadata}</p>
            ) : null}
          </div>
        )
      },
    },
    {
      key: 'units',
      align: 'right',
      header: t('salesAnalytics.columns.units', 'Unidades'),
      render: (row) => formatQuantity(row.units_sold),
    },
    {
      key: 'sales',
      align: 'right',
      header: t('salesAnalytics.columns.sales', 'Ventas'),
      render: (row) => formatMoney(row.sales),
    },
    {
      key: 'margin',
      align: 'right',
      header: t('salesAnalytics.columns.margin', 'Margen'),
      render: (row) => formatPercent(row.gross_margin_pct),
    },
  ]

  return (
    <AnalyticsTable
      columns={columns}
      rows={products}
      rowKey={(row) => `${row.product_id}-${row.variant_id ?? 'base'}`}
      minWidthClass="min-w-[520px]"
      testId="dashboard-top-products-table"
      empty={
        <TableEmptyState
          icon={Package}
          title={t('salesAnalytics.products.topEmpty', 'Sin ventas de productos')}
          description={t(
            'salesAnalytics.products.topEmptyHint',
            'El período seleccionado no registra ventas de productos.',
          )}
        />
      }
    />
  )
}

export default TopProductsTable
