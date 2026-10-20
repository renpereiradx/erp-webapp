import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import { buildTrendViews, type TrendMetricView } from '@/domain/dashboard/trends'
import type { DashboardTrends } from '@/types/bi'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendIndicator } from './TrendIndicator'

const METRIC_LABELS: Record<TrendMetricView['key'], string> = {
  sales: 'Ventas',
  purchases: 'Compras',
  average_ticket: 'Ticket promedio',
}

const formatValue = (view: TrendMetricView): string =>
  view.kind === 'money' ? formatPYG(view.current) : formatNumber(view.current, 1)

/** Comparación con el período anterior para las 3 métricas verificadas. */
export const TrendsPanel = ({ trends }: { trends?: DashboardTrends }) => {
  const { t } = useI18n()
  const views = buildTrendViews(trends)

  if (views.length === 0) {
    return (
      <p className="text-body-md text-on-surface-deep">
        {t('dashboard.trends.empty', 'Sin comparación disponible para el período.')}
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-0 bg-surface-muted hover:bg-surface-muted">
          <TableHead className="px-md py-sm text-label-caps uppercase text-on-surface-deep">
            {t('dashboard.trends.metric', 'Métrica')}
          </TableHead>
          <TableHead className="px-md py-sm text-right text-label-caps uppercase text-on-surface-deep">
            {t('dashboard.trends.current', 'Actual')}
          </TableHead>
          <TableHead className="px-md py-sm text-right text-label-caps uppercase text-on-surface-deep">
            {t('dashboard.trends.previous', 'Anterior')}
          </TableHead>
          <TableHead className="px-md py-sm text-right text-label-caps uppercase text-on-surface-deep">
            {t('dashboard.trends.change', 'Variación')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {views.map((view) => (
          <TableRow key={view.key} className="border-0 hover:bg-surface-muted">
            <TableCell className="px-md py-sm text-body-md text-foreground">
              {t(`dashboard.trends.metrics.${view.key}`, METRIC_LABELS[view.key])}
            </TableCell>
            <TableCell className="px-md py-sm text-right font-data-mono text-data-mono text-foreground">
              {formatValue(view)}
            </TableCell>
            <TableCell className="px-md py-sm text-right font-data-mono text-data-mono text-on-surface-deep">
              {view.kind === 'money'
                ? formatPYG(view.previous)
                : formatNumber(view.previous, 1)}
            </TableCell>
            <TableCell className="px-md py-sm text-right">
              <TrendIndicator direction={view.trend} percentage={view.changePercentage} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
