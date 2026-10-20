import { LineChart } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import {
  formatCount,
  formatMoney,
  formatQuantity,
  formatSignedPercent,
} from '@/domain/sales-analytics/format'
import {
  buildTrendSeries,
  buildTrendSummary,
  getTrendMaxSales,
} from '@/domain/sales-analytics/trends'
import type { SalesTrendGranularity, SalesTrends } from '@/types/bi'
import { TABLE_CELL, TABLE_HEADER, TABLE_MUTED, TABLE_NUM } from './styles'

const DIRECTION_FALLBACKS = {
  up: 'Tendencia al alza',
  down: 'Tendencia a la baja',
  stable: 'Sin tendencia',
} as const

interface TrendSectionProps {
  trends: SalesTrends | null | undefined
  granularity: SalesTrendGranularity | string
}

/**
 * Serie de ventas del período + resumen del BE. Las barras se escalan contra
 * el máximo real de la propia serie (nunca un tope fijo que aplane el dato) y
 * el crecimiento se rotula "primera vs última fecha", que es lo que calcula
 * el backend (no es la variación contra el período anterior).
 */
export const TrendSection = ({ trends, granularity }: TrendSectionProps) => {
  const { t, lang } = useI18n()
  const rows = buildTrendSeries(trends, granularity, lang)
  const summary = buildTrendSummary(trends, granularity, lang)
  const maxSales = getTrendMaxSales(rows)

  if (rows.length === 0) {
    return (
      <TableEmptyState
        icon={LineChart}
        title={t('salesAnalytics.trends.empty', 'Sin ventas en el período')}
        description={t(
          'salesAnalytics.trends.emptyHint',
          'Probá con otro período para ver la serie de ventas.',
        )}
      />
    )
  }

  return (
    <div className="space-y-md">
      {summary ? (
        <dl className="grid grid-cols-2 gap-md lg:grid-cols-4" data-testid="sales-trend-summary">
          <div>
            <dt className="text-label-caps uppercase text-on-surface-deep">
              {t('salesAnalytics.trends.direction', 'Tendencia')}
            </dt>
            <dd className="text-body-md-bold text-foreground">
              {t(
                `salesAnalytics.trend.${summary.direction}`,
                DIRECTION_FALLBACKS[summary.direction],
              )}
            </dd>
          </div>
          <div>
            <dt className="text-label-caps uppercase text-on-surface-deep">
              {t('salesAnalytics.trends.growth', 'Primera vs última fecha')}
            </dt>
            <dd className="font-data-mono text-data-mono text-foreground">
              {formatSignedPercent(summary.growthRate)}
            </dd>
          </div>
          <div>
            <dt className="text-label-caps uppercase text-on-surface-deep">
              {t('salesAnalytics.trends.peak', 'Mejor fecha')}
            </dt>
            <dd className="text-body-md text-foreground">
              {summary.peakLabel} · <span className="font-data-mono text-data-mono">{formatMoney(summary.peakValue)}</span>
            </dd>
          </div>
          <div>
            <dt className="text-label-caps uppercase text-on-surface-deep">
              {t('salesAnalytics.trends.low', 'Peor fecha')}
            </dt>
            <dd className="text-body-md text-foreground">
              {summary.lowLabel} · <span className="font-data-mono text-data-mono">{formatMoney(summary.lowValue)}</span>
            </dd>
          </div>
        </dl>
      ) : null}

      <p className="mb-xs text-body-sm text-on-surface-deep lg:hidden">
        {t('salesAnalytics.table.scrollHint', 'Deslizá la tabla para ver todas las columnas.')}
      </p>
      <div className="max-h-[420px] overflow-auto">
        <Table className="min-w-[640px]">
          <caption className="sr-only">
            {t('salesAnalytics.trends.caption', 'Serie de ventas del período seleccionado')}
          </caption>
          <TableHeader className="sticky top-0 z-10 bg-surface-muted">
            <TableRow className="border-0 hover:bg-surface-muted">
              <TableHead className={TABLE_HEADER}>
                {t('salesAnalytics.columns.period', 'Período')}
              </TableHead>
              <TableHead className={`${TABLE_HEADER} text-right`}>
                {t('salesAnalytics.columns.sales', 'Ventas')}
              </TableHead>
              <TableHead className={`${TABLE_HEADER} text-right`}>
                {t('salesAnalytics.columns.transactions', 'Transacciones')}
              </TableHead>
              <TableHead className={`${TABLE_HEADER} text-right`}>
                {t('salesAnalytics.columns.units', 'Unidades')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const width = maxSales > 0 ? Math.round((row.sales / maxSales) * 100) : 0
              return (
                <TableRow key={row.key} className="border-0 hover:bg-surface-muted">
                  <TableCell className={`${TABLE_CELL} whitespace-nowrap`}>{row.label}</TableCell>
                  <TableCell className={TABLE_NUM}>
                    <div className="flex items-center justify-end gap-sm">
                      <span
                        className="h-2 w-20 shrink-0 overflow-hidden rounded-full bg-surface-muted"
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full rounded-full bg-primary/60"
                          style={{ width: `${width}%` }}
                        />
                      </span>
                      <span className="whitespace-nowrap">{formatMoney(row.sales)}</span>
                    </div>
                  </TableCell>
                  <TableCell className={TABLE_NUM}>{formatCount(row.transactions)}</TableCell>
                  <TableCell className={TABLE_NUM}>{formatQuantity(row.units)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className={TABLE_MUTED}>
        {t(
          'salesAnalytics.trends.barHint',
          'Las barras se escalan contra la fecha con más ventas de la serie.',
        )}
      </p>
    </div>
  )
}

export default TrendSection
