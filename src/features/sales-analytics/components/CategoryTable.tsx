import { Tags } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatCount, formatMoney, formatPercent, formatQuantity } from '@/domain/sales-analytics/format'
import type { CategorySalesData } from '@/types/bi'
import { AnalyticsTable, type AnalyticsColumn } from './AnalyticsTable'

interface CategoryTableProps {
  categories: CategorySalesData[]
  totalSales: number
}

/**
 * Ventas por categoría del período. `percentage` y `gross_margin_pct` los
 * calcula el BE; no se derivan acá. El total es el CTE previo al LIMIT del
 * endpoint (todas las categorías), por eso se rotula "total por categoría".
 */
export const CategoryTable = ({ categories, totalSales }: CategoryTableProps) => {
  const { t } = useI18n()
  const maxSales = categories.reduce((max, row) => Math.max(max, Number(row.sales) || 0), 0)

  const columns: Array<AnalyticsColumn<CategorySalesData>> = [
    {
      key: 'category',
      header: t('salesAnalytics.columns.category', 'Categoría'),
      render: (row) => (
        <div>
          <p className="text-body-md-bold text-foreground">{row.category_name || '—'}</p>
          {row.top_product ? (
            <p className="text-body-sm text-on-surface-deep">
              {t('salesAnalytics.categories.topProduct', 'Líder: {product}', {
                product: row.top_product,
              })}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'sales',
      align: 'right',
      header: t('salesAnalytics.columns.sales', 'Ventas'),
      render: (row) => {
        const width = maxSales > 0 ? Math.round(((Number(row.sales) || 0) / maxSales) * 100) : 0
        return (
          <div className="flex items-center justify-end gap-sm">
            <span
              className="h-2 w-20 shrink-0 overflow-hidden rounded-full bg-surface-muted"
              aria-hidden="true"
            >
              <span className="block h-full rounded-full bg-primary/60" style={{ width: `${width}%` }} />
            </span>
            <span className="whitespace-nowrap">{formatMoney(row.sales)}</span>
          </div>
        )
      },
    },
    {
      key: 'share',
      align: 'right',
      header: t('salesAnalytics.columns.share', 'Participación'),
      render: (row) => formatPercent(row.percentage),
    },
    {
      key: 'transactions',
      align: 'right',
      header: t('salesAnalytics.columns.transactions', 'Transacciones'),
      render: (row) => formatCount(row.transactions),
    },
    {
      key: 'units',
      align: 'right',
      header: t('salesAnalytics.columns.units', 'Unidades'),
      render: (row) => formatQuantity(row.units_sold),
    },
    {
      key: 'margin',
      align: 'right',
      header: t('salesAnalytics.columns.marginPct', 'Margen %'),
      render: (row) => formatPercent(row.gross_margin_pct),
    },
  ]

  return (
    <div>
      <AnalyticsTable
        columns={columns}
        rows={categories}
        rowKey={(row) => row.category_id || row.category_name}
        minWidthClass="min-w-[860px]"
        testId="sales-category-table"
        empty={
          <TableEmptyState
            icon={Tags}
            title={t('salesAnalytics.categories.empty', 'Sin ventas por categoría')}
            description={t(
              'salesAnalytics.categories.emptyHint',
              'Las ventas del período no tienen categoría asignada.',
            )}
          />
        }
      />
      <div className="flex flex-col gap-xs border-t border-divider px-md py-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-on-surface-deep">
          {t(
            'salesAnalytics.categories.totalHint',
            'Total de ventas con categoría asignada en el período.',
          )}
        </p>
        <p className="text-body-md-bold text-foreground">
          {t('salesAnalytics.categories.total', 'Total por categoría')}:{' '}
          <span className="font-data-mono text-data-mono">{formatMoney(totalSales)}</span>
        </p>
      </div>
    </div>
  )
}

export default CategoryTable
