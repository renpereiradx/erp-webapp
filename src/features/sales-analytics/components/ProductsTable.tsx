import { ArrowUpDown, Package } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import {
  formatCount,
  formatIsoDate,
  formatMoney,
  formatPercent,
  formatQuantity,
} from '@/domain/sales-analytics/format'
import { naturalProductSortOrder, type ProductSortState } from '@/domain/sales-analytics/products'
import type { ProductSalesData, SalesProductSort, SalesSortOrder } from '@/types/bi'
import { AnalyticsTable, type AnalyticsColumn } from './AnalyticsTable'

interface ProductsTableProps {
  products: ProductSalesData[]
  sort: ProductSortState
  onSort: (field: SalesProductSort) => void
}

const SortLabel = ({
  label,
  active,
  order,
  onClick,
}: {
  label: string
  active: boolean
  order: SalesSortOrder
  onClick: () => void
}) => {
  const { t } = useI18n()
  const aria = t('salesAnalytics.table.sortAria', '{column}: ordenar ({order})', {
    column: label,
    order:
      order === 'asc'
        ? t('salesAnalytics.table.sortAsc', 'ascendente')
        : t('salesAnalytics.table.sortDesc', 'descendente'),
  })

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      className="inline-flex items-center gap-xs uppercase transition-colors duration-150 hover:text-foreground"
    >
      {label}
      <ArrowUpDown
        size={12}
        aria-hidden="true"
        className={active ? 'text-primary' : 'opacity-40'}
      />
    </button>
  )
}

/**
 * Tabla de productos vendidos: orden server-side contra la whitelist del BE
 * (`sales`, `units`, `margin`, `name`, `last_sale`). Sin columnas de SKU
 * (el BE devuelve el id como SKU) ni de rank (siempre es el rank por ventas).
 */
export const ProductsTable = ({ products, sort, onSort }: ProductsTableProps) => {
  const { t, lang } = useI18n()

  const sortable = (field: SalesProductSort, label: string) => {
    const active = sort.by === field
    // La flecha/aria anuncian el orden que aplicará el click, no el actual.
    const nextOrder: SalesSortOrder = active
      ? sort.order === 'asc'
        ? 'desc'
        : 'asc'
      : naturalProductSortOrder(field)
    return (
      <SortLabel
        label={label}
        active={active}
        order={nextOrder}
        onClick={() => onSort(field)}
      />
    )
  }

  const ariaSort = (field: SalesProductSort): 'ascending' | 'descending' | 'none' => {
    if (sort.by !== field) return 'none'
    return sort.order === 'asc' ? 'ascending' : 'descending'
  }

  const columns: Array<AnalyticsColumn<ProductSalesData>> = [
    {
      key: 'name',
      header: sortable('name', t('salesAnalytics.columns.product', 'Producto')),
      ariaSort: ariaSort('name'),
      render: (row) => (
        <div>
          <p className="text-body-md-bold text-foreground">{row.product_name || '—'}</p>
          {row.category_name ? (
            <p className="text-body-sm text-on-surface-deep">{row.category_name}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'sales',
      align: 'right',
      header: sortable('sales', t('salesAnalytics.columns.sales', 'Ventas')),
      ariaSort: ariaSort('sales'),
      render: (row) => formatMoney(row.sales),
    },
    {
      key: 'units',
      align: 'right',
      header: sortable('units', t('salesAnalytics.columns.units', 'Unidades')),
      ariaSort: ariaSort('units'),
      render: (row) => formatQuantity(row.units_sold),
    },
    {
      key: 'averagePrice',
      align: 'right',
      header: t('salesAnalytics.columns.avgPrice', 'Precio prom.'),
      render: (row) => formatMoney(row.average_price),
    },
    {
      key: 'profit',
      align: 'right',
      header: t('salesAnalytics.columns.profit', 'Utilidad'),
      render: (row) => formatMoney(row.gross_profit),
    },
    {
      key: 'margin',
      align: 'right',
      header: sortable('margin', t('salesAnalytics.columns.marginPct', 'Margen %')),
      ariaSort: ariaSort('margin'),
      render: (row) => formatPercent(row.gross_margin_pct),
    },
    {
      key: 'transactions',
      align: 'right',
      header: t('salesAnalytics.columns.transactions', 'Transacciones'),
      render: (row) => formatCount(row.transactions),
    },
    {
      key: 'lastSale',
      align: 'right',
      mono: true,
      header: sortable('last_sale', t('salesAnalytics.columns.lastSale', 'Última venta')),
      ariaSort: ariaSort('last_sale'),
      render: (row) => formatIsoDate(row.last_sale_date, lang),
    },
  ]

  return (
    <AnalyticsTable
      columns={columns}
      rows={products}
      rowKey={(row) => row.product_id}
      minWidthClass="min-w-[1040px]"
      testId="sales-products-table"
      empty={
        <TableEmptyState
          icon={Package}
          title={t('salesAnalytics.products.empty', 'Sin productos vendidos')}
          description={t(
            'salesAnalytics.products.emptyHint',
            'El período seleccionado no registra ventas de productos.',
          )}
        />
      }
    />
  )
}

export default ProductsTable
