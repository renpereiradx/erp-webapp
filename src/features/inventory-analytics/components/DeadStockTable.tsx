import { useState, type ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import TablePagination from '@/components/ui/TablePagination'
import { formatCount, formatIsoDate, formatMoney, paginateRows } from '@/domain/inventory-analytics/format'
import {
  deadStockRecommendationFor,
  type DeadStockRecommendationKey,
} from '@/domain/inventory-analytics/deadStock'
import { INVENTORY_DEAD_STOCK_PAGE_SIZE } from '@/domain/inventory-analytics/constants'
import type { DeadStockProduct } from '@/types/bi'
import { InventoryBadge, type InventoryBadgeTone } from './InventoryBadge'
import { InventoryTable, type InventoryColumn } from './InventoryTable'

const RECOMMENDATION_KEYS: Record<DeadStockRecommendationKey, string> = {
  promote: 'inventoryAnalytics.risk.recommendation.promote',
  discount: 'inventoryAnalytics.risk.recommendation.discount',
  discontinue: 'inventoryAnalytics.risk.recommendation.discontinue',
}

const RECOMMENDATION_FALLBACKS: Record<DeadStockRecommendationKey, string> = {
  promote: 'Promocionar',
  discount: 'Aplicar descuento',
  discontinue: 'Evaluar descontinuar',
}

const RECOMMENDATION_TONES: Record<DeadStockRecommendationKey, InventoryBadgeTone> = {
  promote: 'primary',
  discount: 'warning',
  discontinue: 'error',
}

interface DeadStockTableProps {
  rows: DeadStockProduct[]
  empty: ReactNode
  testId?: string
}

/**
 * Tabla de stock sin venta. Las fechas y los días se rotulan "o alta" porque
 * el BE usa `created_at` cuando el producto nunca se vendió/movió; el
 * `recommendation` en español del servidor se reemplaza por una clave i18n
 * derivada de los mismos umbrales (120/180 días).
 */
export const DeadStockTable = ({
  rows,
  empty,
  testId = 'dead-stock-table',
}: DeadStockTableProps) => {
  const { t, lang } = useI18n()
  const [page, setPage] = useState(1)
  const slice = paginateRows(rows, page, INVENTORY_DEAD_STOCK_PAGE_SIZE)

  const columns: Array<InventoryColumn<DeadStockProduct>> = [
    {
      key: 'product',
      header: t('inventoryAnalytics.risk.columns.product', 'Producto'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-body-md-bold text-foreground">{row.product_name}</p>
          <p className="font-data-mono text-body-sm text-on-surface-deep">{row.sku}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: t('inventoryAnalytics.risk.columns.category', 'Categoría'),
      render: (row) => row.category_name,
    },
    {
      key: 'stock',
      header: t('inventoryAnalytics.risk.columns.stock', 'Stock'),
      align: 'right',
      render: (row) => formatCount(row.current_stock),
    },
    {
      key: 'value',
      header: t('inventoryAnalytics.risk.columns.value', 'Valor (costo)'),
      align: 'right',
      render: (row) => formatMoney(row.stock_value),
    },
    {
      key: 'lastMovement',
      header: t('inventoryAnalytics.risk.columns.lastMovement', 'Último mov. / alta'),
      align: 'right',
      mono: true,
      render: (row) => formatIsoDate(row.last_movement_date, lang),
    },
    {
      key: 'daysMovement',
      header: t('inventoryAnalytics.risk.columns.daysMovement', 'Días sin mov.'),
      align: 'right',
      render: (row) => formatCount(row.days_since_movement),
    },
    {
      key: 'lastSale',
      header: t('inventoryAnalytics.risk.columns.lastSale', 'Última venta / alta'),
      align: 'right',
      mono: true,
      render: (row) => formatIsoDate(row.last_sale_date, lang),
    },
    {
      key: 'daysSale',
      header: t('inventoryAnalytics.risk.columns.daysSale', 'Días sin venta'),
      align: 'right',
      render: (row) => formatCount(row.days_since_last_sale),
    },
    {
      key: 'recommendation',
      header: t('inventoryAnalytics.risk.columns.recommendation', 'Recomendación'),
      render: (row) => {
        const key = deadStockRecommendationFor(row.days_since_last_sale)
        return (
          <InventoryBadge tone={RECOMMENDATION_TONES[key]}>
            {t(RECOMMENDATION_KEYS[key], RECOMMENDATION_FALLBACKS[key])}
          </InventoryBadge>
        )
      },
    },
  ]

  return (
    <div>
      <InventoryTable
        columns={columns}
        rows={slice.rows}
        rowKey={(row) => row.product_id}
        empty={empty}
        minWidthClass="min-w-[1000px]"
        dense
        testId={testId}
      />
      {slice.totalItems > 0 ? (
        <TablePagination
          page={slice.page}
          totalPages={slice.totalPages}
          totalItems={slice.totalItems}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  )
}

export default DeadStockTable
