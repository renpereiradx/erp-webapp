import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import {
  buildAgingRows,
  buildAgingSummary,
  type AgingBucketKey,
} from '@/domain/inventory-analytics/aging'
import { formatCount, formatDays, formatMoney, formatPercent } from '@/domain/inventory-analytics/format'
import type { StockAgingBucket, StockAgingSummary } from '@/types/bi'
import { InventoryTable, type InventoryColumn } from './InventoryTable'

const BUCKET_KEYS: Record<AgingBucketKey, string> = {
  d0_30: 'inventoryAnalytics.risk.agingBuckets.d0_30',
  d31_60: 'inventoryAnalytics.risk.agingBuckets.d31_60',
  d61_90: 'inventoryAnalytics.risk.agingBuckets.d61_90',
  d91_180: 'inventoryAnalytics.risk.agingBuckets.d91_180',
  d180plus: 'inventoryAnalytics.risk.agingBuckets.d180plus',
  other: 'inventoryAnalytics.risk.agingBuckets.other',
}

const BUCKET_FALLBACKS: Record<AgingBucketKey, string> = {
  d0_30: '0-30 días',
  d31_60: '31-60 días',
  d61_90: '61-90 días',
  d91_180: '91-180 días',
  d180plus: 'Más de 180 días',
  other: 'Otro',
}

interface AgingTableProps {
  buckets: StockAgingBucket[]
  summary?: StockAgingSummary
  empty: ReactNode
  testId?: string
}

/** Tramos de antigüedad del stock + resumen de antigüedad promedio y >90 d. */
export const AgingTable = ({
  buckets,
  summary,
  empty,
  testId = 'aging-table',
}: AgingTableProps) => {
  const { t } = useI18n()
  const rows = buildAgingRows(buckets)
  const view = buildAgingSummary(summary)

  const columns: Array<InventoryColumn<(typeof rows)[number]>> = [
    {
      key: 'bucket',
      header: t('inventoryAnalytics.risk.agingColumns.bucket', 'Antigüedad'),
      render: (row) => (
        <span className="text-body-md-bold">
          {t(BUCKET_KEYS[row.key], BUCKET_FALLBACKS[row.key])}
        </span>
      ),
    },
    {
      key: 'products',
      header: t('inventoryAnalytics.risk.agingColumns.products', 'Productos'),
      align: 'right',
      render: (row) => formatCount(row.productCount),
    },
    {
      key: 'units',
      header: t('inventoryAnalytics.risk.agingColumns.units', 'Unidades'),
      align: 'right',
      render: (row) => formatCount(row.totalUnits),
    },
    {
      key: 'value',
      header: t('inventoryAnalytics.risk.agingColumns.value', 'Valor (costo)'),
      align: 'right',
      render: (row) => formatMoney(row.totalValue),
    },
    {
      key: 'share',
      header: t('inventoryAnalytics.risk.agingColumns.share', 'Participación'),
      align: 'right',
      render: (row) => formatPercent(row.percentage),
    },
  ]

  return (
    <div>
      {rows.length > 0 ? (
        <p className="mb-md text-body-sm text-on-surface-deep" data-testid="aging-summary">
          {t(
            'inventoryAnalytics.risk.agingSummary',
            'Antigüedad promedio: {days} · Más de 90 días: {pct} del valor',
            {
              days: t('inventoryAnalytics.common.daysValue', '{n} días', {
                n: formatDays(view.averageAgeDays),
              }),
              pct: formatPercent(view.oldStockPct),
            },
          )}
        </p>
      ) : null}
      <InventoryTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.key}
        empty={empty}
        minWidthClass="min-w-[640px]"
        testId={testId}
      />
    </div>
  )
}

export default AgingTable
