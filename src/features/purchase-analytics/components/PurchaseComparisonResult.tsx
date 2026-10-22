import { Scale } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import {
  formatCount,
  formatMoney,
  formatSignedCount,
  formatSignedMoney,
  formatSignedPercent,
} from '@/domain/sales-analytics/format'
import { formatCalendarDate } from '@/domain/purchase-analytics/periods'
import {
  buildPurchaseComparisonRows,
  describePurchaseComparisonRange,
  hasComparableBase,
  isPurchaseComparisonEmpty,
  type PurchaseComparisonMetricId,
  type PurchaseComparisonMetricRow,
} from '@/domain/purchase-analytics/comparison'
import type { PurchaseComparison } from '@/types/bi'
import { PurchaseTable, type PurchaseColumn } from './PurchaseTable'

const METRIC_LABELS: Record<PurchaseComparisonMetricId, { key: string; fallback: string }> = {
  purchases: { key: 'purchaseAnalytics.comparison.metrics.purchases', fallback: 'Compras' },
  transactions: {
    key: 'purchaseAnalytics.comparison.metrics.transactions',
    fallback: 'Órdenes',
  },
  units: { key: 'purchaseAnalytics.comparison.metrics.units', fallback: 'Unidades' },
  avgOrder: {
    key: 'purchaseAnalytics.comparison.metrics.avgOrder',
    fallback: 'Orden promedio',
  },
  suppliers: {
    key: 'purchaseAnalytics.comparison.metrics.suppliers',
    fallback: 'Proveedores',
  },
}

const formatMetricValue = (row: PurchaseComparisonMetricRow, value: number): string => {
  if (row.kind === 'money') return formatMoney(value)
  if (row.kind === 'units') return formatCount(value, 2)
  return formatCount(value)
}

const formatChange = (row: PurchaseComparisonMetricRow): string => {
  if (row.kind === 'money') return formatSignedMoney(row.change)
  if (row.kind === 'units') return formatSignedCount(row.change, 2)
  return formatSignedCount(row.change)
}

/**
 * Resultado A vs B de compras. Las variaciones son relativas (`change_pct`
 * del BE), no puntos porcentuales; si la ventana B no tuvo base se muestra el
 * delta sin inventar un 0%. Los rangos se muestran con el fin inclusivo.
 */
export const PurchaseComparisonResult = ({ comparison }: { comparison: PurchaseComparison }) => {
  const { t, lang } = useI18n()
  const rows = buildPurchaseComparisonRows(comparison)
  const rangeA = describePurchaseComparisonRange(comparison.period_1?.period)
  const rangeB = describePurchaseComparisonRange(comparison.period_2?.period)

  if (isPurchaseComparisonEmpty(comparison)) {
    return (
      <TableEmptyState
        icon={Scale}
        title={t('purchaseAnalytics.comparison.empty', 'Sin compras en ninguna de las ventanas')}
        description={t(
          'purchaseAnalytics.comparison.emptyHint',
          'Probá con otro período o con rangos de fechas que tengan compras.',
        )}
      />
    )
  }

  const columns: Array<PurchaseColumn<PurchaseComparisonMetricRow>> = [
    {
      key: 'metric',
      header: t('purchaseAnalytics.comparison.metric', 'Métrica'),
      render: (row) => t(METRIC_LABELS[row.id].key, METRIC_LABELS[row.id].fallback),
    },
    {
      key: 'a',
      header: t('purchaseAnalytics.comparison.windowA', 'Ventana A'),
      align: 'right',
      render: (row) => (
        <div className="min-w-0">
          <p className="whitespace-nowrap">{formatMetricValue(row, row.a)}</p>
          <p className="whitespace-nowrap text-body-sm text-on-surface-deep">
            {formatCalendarDate(rangeA.start, lang)} – {formatCalendarDate(rangeA.end, lang)}
          </p>
        </div>
      ),
    },
    {
      key: 'b',
      header: t('purchaseAnalytics.comparison.windowB', 'Ventana B'),
      align: 'right',
      render: (row) => (
        <div className="min-w-0">
          <p className="whitespace-nowrap">{formatMetricValue(row, row.b)}</p>
          <p className="whitespace-nowrap text-body-sm text-on-surface-deep">
            {formatCalendarDate(rangeB.start, lang)} – {formatCalendarDate(rangeB.end, lang)}
          </p>
        </div>
      ),
    },
    {
      key: 'change',
      header: t('purchaseAnalytics.comparison.change', 'Variación'),
      align: 'right',
      render: (row) => (
        <div className="min-w-0">
          <p className="whitespace-nowrap">{formatChange(row)}</p>
          {hasComparableBase(row.change, row.changePct) ? (
            <p className="whitespace-nowrap text-body-sm text-on-surface-deep">
              {formatSignedPercent(row.changePct)}
            </p>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <PurchaseTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      minWidthClass="min-w-[640px]"
      testId="purchase-comparison-table"
      empty={null}
    />
  )
}

export default PurchaseComparisonResult
