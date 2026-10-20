import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { formatCount, formatMoney, formatRate } from '@/domain/inventory-analytics/format'
import {
  turnoverPerformanceKey,
  turnoverPerformanceTone,
  usableTurnoverDays,
  type TurnoverPerformanceKey,
} from '@/domain/inventory-analytics/turnover'
import type { CategoryTurnover } from '@/types/bi'
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

interface TurnoverCategoryTableProps {
  rows: CategoryTurnover[]
  empty: ReactNode
  testId?: string
}

/** Rotación por categoría; los días se muestran `—` si no hubo COGS. */
export const TurnoverCategoryTable = ({
  rows,
  empty,
  testId = 'turnover-category-table',
}: TurnoverCategoryTableProps) => {
  const { t } = useI18n()

  const columns: Array<InventoryColumn<CategoryTurnover>> = [
    {
      key: 'category',
      header: t('inventoryAnalytics.turnover.columns.category', 'Categoría'),
      render: (row) => <span className="text-body-md-bold">{row.category_name}</span>,
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
      key: 'stockUnits',
      header: t('inventoryAnalytics.turnover.columns.stockUnits', 'En stock'),
      align: 'right',
      render: (row) => formatCount(row.total_units),
    },
    {
      key: 'value',
      header: t('inventoryAnalytics.turnover.columns.value', 'Valor a costo'),
      align: 'right',
      render: (row) => formatMoney(row.total_value),
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
      rowKey={(row) => row.category_id}
      empty={empty}
      minWidthClass="min-w-[780px]"
      testId={testId}
    />
  )
}

export default TurnoverCategoryTable
