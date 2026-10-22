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
  buildPurchaseTrendSeries,
  buildPurchaseTrendSummary,
  getPurchaseTrendMax,
} from '@/domain/purchase-analytics/trends'
import type { PurchaseTrends } from '@/types/bi'
import { TABLE_CELL, TABLE_HEADER, TABLE_MUTED, TABLE_NUM } from './styles'

const DIRECTION_FALLBACKS = {
  up: 'Tendencia al alza',
  down: 'Tendencia a la baja',
  stable: 'Sin tendencia',
} as const

interface PurchaseTrendSectionProps {
  trends: PurchaseTrends | null | undefined
  granularity: string
}

/**
 * Serie de compras del período + resumen del BE. Las barras se escalan contra
 * el máximo real de la propia serie y el crecimiento se rotula "primera vs
 * última fecha", que es lo que calcula el backend.
 */
export const PurchaseTrendSection = ({ trends, granularity }: PurchaseTrendSectionProps) => {
  const { t, lang } = useI18n()
  const rows = buildPurchaseTrendSeries(trends, granularity, lang)
  const summary = buildPurchaseTrendSummary(trends, granularity, lang)
  const maxPurchases = getPurchaseTrendMax(rows)

  if (rows.length === 0) {
    return (
      <TableEmptyState
        icon={LineChart}
        title={t('purchaseAnalytics.trends.empty', 'Sin compras en el período')}
        description={t(
          'purchaseAnalytics.trends.emptyHint',
          'Probá con otro período para ver la serie de compras.',
        )}
      />
    )
  }

  return (
    <div className="space-y-md">
      {summary ? (
        <dl className="grid grid-cols-2 gap-md lg:grid-cols-4" data-testid="purchase-trend-summary">
          <div>
            <dt className="text-label-caps uppercase text-on-surface-deep">
              {t('purchaseAnalytics.trends.direction', 'Tendencia')}
            </dt>
            <dd className="text-body-md-bold text-foreground">
              {t(
                `purchaseAnalytics.trend.${summary.direction}`,
                DIRECTION_FALLBACKS[summary.direction],
              )}
            </dd>
          </div>
          <div>
            <dt className="text-label-caps uppercase text-on-surface-deep">
              {t('purchaseAnalytics.trends.growth', 'Primera vs última fecha')}
            </dt>
            <dd className="font-data-mono text-data-mono text-foreground">
              {formatSignedPercent(summary.growthRate)}
            </dd>
          </div>
          <div>
            <dt className="text-label-caps uppercase text-on-surface-deep">
              {t('purchaseAnalytics.trends.peak', 'Mejor fecha')}
            </dt>
            <dd className="text-body-md text-foreground">
              {summary.peakLabel} ·{' '}
              <span className="font-data-mono text-data-mono">{formatMoney(summary.peakValue)}</span>
            </dd>
          </div>
          <div>
            <dt className="text-label-caps uppercase text-on-surface-deep">
              {t('purchaseAnalytics.trends.low', 'Peor fecha')}
            </dt>
            <dd className="text-body-md text-foreground">
              {summary.lowLabel} ·{' '}
              <span className="font-data-mono text-data-mono">{formatMoney(summary.lowValue)}</span>
            </dd>
          </div>
        </dl>
      ) : null}

      <p className="mb-xs text-body-sm text-on-surface-deep lg:hidden">
        {t('purchaseAnalytics.table.scrollHint', 'Deslizá la tabla para ver todas las columnas.')}
      </p>
      <div className="max-h-[420px] overflow-auto">
        <Table className="min-w-[640px]">
          <caption className="sr-only">
            {t('purchaseAnalytics.trends.caption', 'Serie de compras del período seleccionado')}
          </caption>
          <TableHeader className="sticky top-0 z-10 bg-surface-muted">
            <TableRow className="border-0 hover:bg-surface-muted">
              <TableHead className={TABLE_HEADER}>
                {t('purchaseAnalytics.columns.period', 'Período')}
              </TableHead>
              <TableHead className={`${TABLE_HEADER} text-right`}>
                {t('purchaseAnalytics.columns.purchases', 'Compras')}
              </TableHead>
              <TableHead className={`${TABLE_HEADER} text-right`}>
                {t('purchaseAnalytics.columns.orders', 'Órdenes')}
              </TableHead>
              <TableHead className={`${TABLE_HEADER} text-right`}>
                {t('purchaseAnalytics.columns.units', 'Unidades')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const width = maxPurchases > 0 ? Math.round((row.purchases / maxPurchases) * 100) : 0
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
                      <span className="whitespace-nowrap">{formatMoney(row.purchases)}</span>
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
          'purchaseAnalytics.trends.barHint',
          'Las barras se escalan contra la fecha con más compras de la serie.',
        )}
      </p>
    </div>
  )
}

export default PurchaseTrendSection
