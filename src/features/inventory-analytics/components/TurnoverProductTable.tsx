import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { formatCount, formatRate } from '@/domain/inventory-analytics/format'
import {
  turnoverPerformanceKey,
  turnoverPerformanceTone,
  usableTurnoverDays,
  type TurnoverPerformanceKey,
} from '@/domain/inventory-analytics/turnover'
import type { ProductTurnover } from '@/types/bi'
import { InventoryBadge } from './InventoryBadge'
import { InventoryTable, type InventoryColumn } from './InventoryTable'

const PERFORMANCE_KEYS: Record<TurnoverPerformanceKey, string> = {
  excellent: 'inventoryAnalytics.turnover.performance.excellent',
  good: 'inventoryAnalytics.turnover.performance.good',
  average: 'inventoryAnalytics.turnover.performance.average',
  poor: 'inventoryAnalytics.turnover.performance.poor',
  unknown: 'inventoryAnalytics.turnover.performance.unknown',
}

const PERFORMANCE_FALLBACKS: Record<TurnoverPerformanceKey, string> = {
  excellent: 'Excelente',
  good: 'Buena',
  average: 'Media',
  poor: 'Baja',
  unknown: 'Sin dato',
}

interface TurnoverProductTableProps {
  rows: ProductTurnover[]
  empty: ReactNode
  testId?: string
}

/** Top de rotación por producto (`current_stock` es real, no un promedio). */
export const TurnoverProductTable = ({
  rows,
  empty,
  testId = 'turnover-product-table',
}: TurnoverProductTableProps) => {
  const { t } = useI18n()

  const columns: Array<InventoryColumn<ProductTurnover>> = [
    {
      key: 'product',
      header: t('inventoryAnalytics.turnover.columns.product', 'Producto'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-body-md-bold text-foreground">{row.product_name}</p>
          <p className="font-data-mono text-body-sm text-on-surface-deep">{row.sku}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: t('inventoryAnalytics.turnover.columns.category', 'Categoría'),
      render: (row) => row.category_name,
    },
    {
      key: 'turnover',
      header: t('inventoryAnalytics.turnover.columns.turnover', 'Rotación'),
      align: 'right',
      render: (row) =>
        t('inventoryAnalytics.common.rateValue', '{value}x', {
          value: formatRate(row.turnover_rate),
        }),
    },
    {
      key: 'days',
      header: t('inventoryAnalytics.turnover.columns.days', 'Días'),
      align: 'right',
      render: (row) => {
        const days = usableTurnoverDays(row.days_of_inventory)
        return days === null ? (
          <span aria-label={t('inventoryAnalytics.common.noSalesPeriod', 'Sin costo de ventas en el período')}>
            —
          </span>
        ) : (
          formatCount(days, 0)
        )
      },
    },
    {
      key: 'unitsSold',
      header: t('inventoryAnalytics.turnover.columns.unitsSold', 'Vendidas'),
      align: 'right',
      render: (row) => formatCount(row.units_sold, 2),
    },
    {
      key: 'currentStock',
      header: t('inventoryAnalytics.turnover.columns.currentStock', 'Stock actual'),
      align: 'right',
      render: (row) => formatCount(row.current_stock),
    },
    {
      key: 'performance',
      header: t('inventoryAnalytics.turnover.columns.performance', 'Desempeño'),
      render: (row) => {
        const key = turnoverPerformanceKey(row.performance)
        return (
          <InventoryBadge tone={turnoverPerformanceTone(row.performance)}>
            {t(PERFORMANCE_KEYS[key], PERFORMANCE_FALLBACKS[key])}
          </InventoryBadge>
        )
      },
    },
  ]

  return (
    <InventoryTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.product_id}
      empty={empty}
      minWidthClass="min-w-[820px]"
      testId={testId}
    />
  )
}

export default TurnoverProductTable
