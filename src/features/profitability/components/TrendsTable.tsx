import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import type { ProfitabilityTrendPoint, ProfitabilityTrendGranularity } from '@/types/bi'
import { formatCount, formatMoney, formatPercent, formatUnits } from '@/domain/profitability/format'
import { revenueBarWidth, trendRows } from '@/domain/profitability/trends'
import { ProfitabilityTable, type ProfitabilityColumn } from './ProfitabilityTable'

interface TrendsTableProps {
  points: ProfitabilityTrendPoint[]
  granularity: ProfitabilityTrendGranularity
  empty: ReactNode
  /** Dashboard: muestra una barra relativa de ingresos por punto. */
  showBars?: boolean
  testId?: string
}

/**
 * Serie de beneficios en tabla accesible (sin SVG inventado): cada fila es un
 * bucket real del BE. La etiqueta se deriva de `date` en el locale de la UI,
 * no del `label` inglés de `to_char`. La barra se escala contra el máximo
 * real de la serie.
 */
export const TrendsTable = ({
  points,
  granularity,
  empty,
  showBars = false,
  testId = 'trends-table',
}: TrendsTableProps) => {
  const { t, lang } = useI18n()
  const rows = trendRows(points, granularity, lang)
  const maxRevenue = points.reduce((max, point) => Math.max(max, point.revenue || 0), 0)

  const columns: Array<ProfitabilityColumn<(typeof rows)[number]>> = [
    {
      key: 'period',
      header: t('profitability.columns.period', 'Período'),
      render: (row) => (
        <span className="whitespace-nowrap font-data-mono text-data-mono text-foreground">
          {granularity === 'weekly'
            ? t('profitability.trends.weekOf', 'Semana del {date}', { date: row.label })
            : row.label}
        </span>
      ),
    },
    {
      key: 'revenue',
      header: t('profitability.columns.revenue', 'Ingresos'),
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-sm">
          {showBars ? (
            <span
              className="hidden h-2 rounded-full bg-primary/30 sm:inline-block"
              style={{ width: `${revenueBarWidth(row.point.revenue, maxRevenue) * 0.6}px` }}
              aria-hidden="true"
            />
          ) : null}
          <span>{formatMoney(row.point.revenue)}</span>
        </div>
      ),
    },
    {
      key: 'profit',
      header: t('profitability.columns.profit', 'Beneficio'),
      align: 'right',
      render: (row) => formatMoney(row.point.gross_profit),
    },
    {
      key: 'margin',
      header: t('profitability.columns.margin', 'Margen'),
      align: 'right',
      render: (row) => formatPercent(row.point.gross_margin_pct),
    },
    {
      key: 'transactions',
      header: t('profitability.columns.transactions', 'Transacciones'),
      align: 'right',
      render: (row) => formatCount(row.point.transactions),
    },
    {
      key: 'units',
      header: t('profitability.columns.units', 'Unidades'),
      align: 'right',
      render: (row) => formatUnits(row.point.units_sold),
    },
  ]

  return (
    <ProfitabilityTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.key}
      empty={empty}
      minWidthClass="min-w-[700px]"
      testId={testId}
      caption={t('profitability.trends.tableCaption', 'Serie de beneficios del período')}
    />
  )
}

export default TrendsTable
