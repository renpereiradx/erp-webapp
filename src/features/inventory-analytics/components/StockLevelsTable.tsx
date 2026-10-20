import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { formatCount, formatIsoDate, formatMoney } from '@/domain/inventory-analytics/format'
import {
  hasNoRecentSales,
  realDaysOfStock,
  stockSortAria,
  stockStatusKeyForCode,
  stockStatusToneForCode,
  type StockSortState,
  type StockStatusKey,
} from '@/domain/inventory-analytics/stock'
import type { InventorySortBy, ProductStockLevel } from '@/types/bi'
import { InventoryBadge } from './InventoryBadge'
import { InventoryTable, type InventoryColumn } from './InventoryTable'

const STATUS_KEYS: Record<StockStatusKey, string> = {
  inStock: 'inventoryAnalytics.stockStatus.inStock',
  lowStock: 'inventoryAnalytics.stockStatus.lowStock',
  outOfStock: 'inventoryAnalytics.stockStatus.outOfStock',
  overstock: 'inventoryAnalytics.stockStatus.overstock',
}

const STATUS_FALLBACKS: Record<StockStatusKey, string> = {
  inStock: 'Con stock',
  lowStock: 'Bajo stock',
  outOfStock: 'Sin stock',
  overstock: 'Sobre-stock',
}

interface StockLevelsTableProps {
  rows: ProductStockLevel[]
  sort: StockSortState
  onSort: (field: InventorySortBy) => void
  empty: ReactNode
  testId?: string
}

/**
 * Tabla server-side de niveles de stock. El orden se pide al BE por la
 * whitelist real (`stock/name/value/category/days`); este componente solo
 * pinta la flecha y el `aria-sort`.
 */
export const StockLevelsTable = ({
  rows,
  sort,
  onSort,
  empty,
  testId = 'stock-levels-table',
}: StockLevelsTableProps) => {
  const { t, lang } = useI18n()

  const sortButton = (field: InventorySortBy, label: string) => {
    const active = sort.by === field
    const order =
      sort.order === 'ASC'
        ? t('inventoryAnalytics.common.sortAsc', 'ascendente')
        : t('inventoryAnalytics.common.sortDesc', 'descendente')
    const Icon = !active ? ChevronsUpDown : sort.order === 'ASC' ? ChevronUp : ChevronDown
    return (
      <button
        type="button"
        onClick={() => onSort(field)}
        aria-label={t('inventoryAnalytics.common.sortAria', '{column}: ordenar ({order})', {
          column: label,
          order,
        })}
        className="inline-flex items-center gap-xs uppercase text-on-surface-deep transition-colors hover:text-foreground"
      >
        {label}
        <Icon size={12} aria-hidden="true" />
      </button>
    )
  }

  const columns: Array<InventoryColumn<ProductStockLevel>> = [
    {
      key: 'product',
      header: sortButton('name', t('inventoryAnalytics.stockLevels.columns.product', 'Producto')),
      ariaSort: stockSortAria(sort, 'name'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-body-md-bold text-foreground">{row.product_name}</p>
          <p className="font-data-mono text-body-sm text-on-surface-deep">{row.sku}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: sortButton(
        'category',
        t('inventoryAnalytics.stockLevels.columns.category', 'Categoría'),
      ),
      ariaSort: stockSortAria(sort, 'category'),
      render: (row) => row.category_name,
    },
    {
      key: 'stock',
      header: sortButton('stock', t('inventoryAnalytics.stockLevels.columns.stock', 'Stock')),
      ariaSort: stockSortAria(sort, 'stock'),
      align: 'right',
      render: (row) => formatCount(row.current_stock),
    },
    {
      key: 'status',
      header: t('inventoryAnalytics.stockLevels.columns.status', 'Estado'),
      render: (row) => {
        const key = stockStatusKeyForCode(row.status)
        if (!key) return row.status
        return (
          <InventoryBadge tone={stockStatusToneForCode(row.status)}>
            {t(STATUS_KEYS[key], STATUS_FALLBACKS[key])}
          </InventoryBadge>
        )
      },
    },
    {
      key: 'days',
      header: sortButton('days', t('inventoryAnalytics.stockLevels.columns.days', 'Días de stock')),
      ariaSort: stockSortAria(sort, 'days'),
      align: 'right',
      render: (row) => {
        if (hasNoRecentSales(row.days_of_stock)) {
          return t('inventoryAnalytics.stockLevels.daysNoSales', 'Sin ventas 30 d')
        }
        const days = realDaysOfStock(row.days_of_stock)
        return days === null ? '—' : formatCount(days, 0)
      },
    },
    {
      key: 'unitCost',
      header: t('inventoryAnalytics.stockLevels.columns.unitCost', 'Costo unit.'),
      align: 'right',
      render: (row) => formatMoney(row.unit_cost),
    },
    {
      key: 'unitPrice',
      header: t('inventoryAnalytics.stockLevels.columns.unitPrice', 'Precio unit.'),
      align: 'right',
      render: (row) => formatMoney(row.unit_price),
    },
    {
      key: 'value',
      header: sortButton('value', t('inventoryAnalytics.stockLevels.columns.value', 'Valor (costo)')),
      ariaSort: stockSortAria(sort, 'value'),
      align: 'right',
      render: (row) => formatMoney(row.stock_value),
    },
    {
      key: 'lastMovement',
      header: t('inventoryAnalytics.stockLevels.columns.lastMovement', 'Último mov.'),
      align: 'right',
      mono: true,
      render: (row) => formatIsoDate(row.last_movement, lang),
    },
    {
      key: 'lastSale',
      header: t('inventoryAnalytics.stockLevels.columns.lastSale', 'Última venta'),
      align: 'right',
      mono: true,
      render: (row) => formatIsoDate(row.last_sale, lang),
    },
  ]

  return (
    <InventoryTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.product_id}
      empty={empty}
      minWidthClass="min-w-[1000px]"
      dense
      testId={testId}
    />
  )
}

export default StockLevelsTable
