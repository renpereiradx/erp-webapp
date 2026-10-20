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
import { formatCalendarDate } from '@/domain/sales-analytics/periods'
import {
  buildComparisonRows,
  describeComparisonRange,
  hasComparableBase,
  isComparisonEmpty,
  type ComparisonMetricId,
  type ComparisonMetricRow,
} from '@/domain/sales-analytics/comparison'
import type { SalesComparison } from '@/types/bi'
import { AnalyticsTable, type AnalyticsColumn } from './AnalyticsTable'

const METRIC_LABELS: Record<ComparisonMetricId, { key: string; fallback: string }> = {
  sales: { key: 'salesAnalytics.comparison.metrics.sales', fallback: 'Ventas' },
  transactions: {
    key: 'salesAnalytics.comparison.metrics.transactions',
    fallback: 'Transacciones',
  },
  units: { key: 'salesAnalytics.comparison.metrics.units', fallback: 'Unidades' },
  ticket: { key: 'salesAnalytics.comparison.metrics.ticket', fallback: 'Ticket promedio' },
  customers: { key: 'salesAnalytics.comparison.metrics.customers', fallback: 'Clientes únicos' },
  margin: { key: 'salesAnalytics.comparison.metrics.margin', fallback: 'Margen bruto' },
}

const formatMetricValue = (row: ComparisonMetricRow, value: number): string => {
  if (row.kind === 'money') return formatMoney(value)
  if (row.kind === 'units') return formatCount(value, 2)
  return formatCount(value)
}

const formatChange = (row: ComparisonMetricRow): string => {
  if (row.kind === 'money') return formatSignedMoney(row.change)
  if (row.kind === 'units') return formatSignedCount(row.change, 2)
  return formatSignedCount(row.change)
}

/**
 * Resultado A vs B. Las variaciones son relativas (`change_pct` del BE), no
 * puntos porcentuales; si el período B no tuvo base se muestra el delta sin
 * inventar un 0%. Los rangos se muestran con el `end_date` inclusivo.
 */
export const ComparisonResult = ({ comparison }: { comparison: SalesComparison }) => {
  const { t, lang } = useI18n()
  const rows = buildComparisonRows(comparison)
  const rangeA = describeComparisonRange(comparison.period_1?.period)
  const rangeB = describeComparisonRange(comparison.period_2?.period)

  if (isComparisonEmpty(comparison)) {
    return (
      <TableEmptyState
        icon={Scale}
        title={t('salesAnalytics.comparison.empty', 'Sin ventas en ninguno de los períodos')}
        description={t(
          'salesAnalytics.comparison.emptyHint',
          'Probá con otro período o con rangos de fechas que tengan ventas.',
        )}
      />
    )
  }

  const columns: Array<AnalyticsColumn<ComparisonMetricRow>> = [
    {
      key: 'metric',
      header: t('salesAnalytics.comparison.metric', 'Métrica'),
      render: (row) => {
        const label = METRIC_LABELS[row.id]
        return (
          <span className="text-body-md-bold text-foreground">
            {t(label.key, label.fallback)}
          </span>
        )
      },
    },
    {
      key: 'a',
      align: 'right',
      header: (
        <span>
          {t('salesAnalytics.comparison.periodA', 'Período A')}
          <span className="block text-body-sm normal-case text-on-surface-deep">
            {formatCalendarDate(rangeA.start, lang)} – {formatCalendarDate(rangeA.end, lang)}
          </span>
        </span>
      ),
      render: (row) => formatMetricValue(row, row.a),
    },
    {
      key: 'b',
      align: 'right',
      header: (
        <span>
          {t('salesAnalytics.comparison.periodB', 'Período B')}
          <span className="block text-body-sm normal-case text-on-surface-deep">
            {formatCalendarDate(rangeB.start, lang)} – {formatCalendarDate(rangeB.end, lang)}
          </span>
        </span>
      ),
      render: (row) => formatMetricValue(row, row.b),
    },
    {
      key: 'change',
      align: 'right',
      header: <span>{t('salesAnalytics.comparison.change', 'Variación (A − B)')}</span>,
      render: (row) => {
        const comparable = hasComparableBase(row.change, row.changePct)
        return (
          <div className="flex flex-col items-end">
            <span className="whitespace-nowrap">{formatChange(row)}</span>
            <span className="text-body-sm text-on-surface-deep">
              {comparable
                ? formatSignedPercent(row.changePct)
                : t('salesAnalytics.comparison.noBase', 'Sin base comparable')}
            </span>
          </div>
        )
      },
    },
  ]

  return (
    <AnalyticsTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      minWidthClass="min-w-[760px]"
      testId="comparison-table"
      empty={
        <TableEmptyState
          icon={Scale}
          title={t('salesAnalytics.comparison.empty', 'Sin ventas en ninguno de los períodos')}
        />
      }
    />
  )
}

export default ComparisonResult
