import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { formatCount, formatMoney } from '@/domain/inventory-analytics/format'
import {
  realDaysUntilStockout,
  reorderPriorityKey,
  reorderPriorityTone,
  type ReorderPriorityKey,
} from '@/domain/inventory-analytics/reorder'
import type { ReorderProduct } from '@/types/bi'
import { InventoryBadge } from './InventoryBadge'
import { InventoryTable, type InventoryColumn } from './InventoryTable'

const PRIORITY_KEYS: Record<ReorderPriorityKey, string> = {
  urgent: 'inventoryAnalytics.reorder.priority.urgent',
  high: 'inventoryAnalytics.reorder.priority.high',
  medium: 'inventoryAnalytics.reorder.priority.medium',
  low: 'inventoryAnalytics.reorder.priority.low',
}

const PRIORITY_FALLBACKS: Record<ReorderPriorityKey, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

interface ReorderTableProps {
  rows: ReorderProduct[]
  empty: ReactNode
  testId?: string
}

/**
 * Tabla de reposición. Cantidad y costo salen del payload; días 999 se rotulan
 * "sin ventas en 30 días" y un costo 0 se muestra `—` (costo unitario ausente),
 * nunca como "Gs. 0".
 */
export const ReorderTable = ({ rows, empty, testId = 'inventory-reorder-table' }: ReorderTableProps) => {
  const { t } = useI18n()

  const columns: Array<InventoryColumn<ReorderProduct>> = [
    {
      key: 'product',
      header: t('inventoryAnalytics.reorder.columns.product', 'Producto'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-body-md-bold text-foreground">{row.product_name}</p>
          <p className="font-data-mono text-body-sm text-on-surface-deep">{row.sku}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: t('inventoryAnalytics.reorder.columns.category', 'Categoría'),
      render: (row) => row.category_name,
    },
    {
      key: 'stock',
      header: t('inventoryAnalytics.reorder.columns.stock', 'Stock'),
      align: 'right',
      render: (row) => formatCount(row.current_stock),
    },
    {
      key: 'priority',
      header: t('inventoryAnalytics.reorder.columns.priority', 'Prioridad'),
      render: (row) => {
        const key = reorderPriorityKey(row.priority)
        return (
          <InventoryBadge tone={reorderPriorityTone(row.priority)}>
            {t(PRIORITY_KEYS[key], PRIORITY_FALLBACKS[key])}
          </InventoryBadge>
        )
      },
    },
    {
      key: 'quantity',
      header: t('inventoryAnalytics.reorder.columns.quantity', 'Reponer'),
      align: 'right',
      render: (row) => formatCount(row.reorder_quantity),
    },
    {
      key: 'cost',
      header: t('inventoryAnalytics.reorder.columns.cost', 'Costo estimado'),
      align: 'right',
      render: (row) =>
        row.estimated_cost > 0 ? (
          formatMoney(row.estimated_cost)
        ) : (
          <span aria-label={t('inventoryAnalytics.reorder.costMissing', 'Sin costo')}>—</span>
        ),
    },
    {
      key: 'days',
      header: t('inventoryAnalytics.reorder.columns.days', 'Días hasta quiebre'),
      align: 'right',
      render: (row) => {
        const days = realDaysUntilStockout(row.days_until_stockout)
        return days === null
          ? t('inventoryAnalytics.reorder.noSales', 'Sin ventas 30 d')
          : formatCount(days, 1)
      },
    },
  ]

  return (
    <InventoryTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.product_id}
      empty={empty}
      minWidthClass="min-w-[860px]"
      testId={testId}
    />
  )
}

export default ReorderTable
