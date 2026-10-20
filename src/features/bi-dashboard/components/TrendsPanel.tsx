import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import { buildTrendViews, type TrendMetricView } from '@/domain/dashboard/trends'
import type { DashboardTrends } from '@/types/bi'
import { TrendIndicator } from './TrendIndicator'

const METRIC_LABELS: Record<TrendMetricView['key'], string> = {
  sales: 'Ventas',
  purchases: 'Compras',
  average_ticket: 'Ticket promedio',
}

const formatValue = (view: TrendMetricView, value: number): string =>
  view.kind === 'money' ? formatPYG(value) : formatNumber(value, 1)

/**
 * Comparación con el período anterior.
 *
 * La versión tabla (Métrica · Actual · Anterior · Variación) obligaba a cuatro
 * columnas dentro de una card de media página: `Gs. 1.475.500` se partía en
 * "Gs." + cifra. La lista apila label/anterior a la izquierda y cifra/variación
 * a la derecha, así el monto siempre queda en una línea.
 */
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
    <div className="divide-y divide-divider" data-testid="trends-list">
      {views.map((view) => (
        <div
          key={view.key}
          className="flex items-start justify-between gap-md py-sm first:pt-0 last:pb-0"
          data-testid={`trend-${view.key}`}
        >
          <div className="min-w-0">
            <p className="text-label-caps uppercase text-on-surface-deep">
              {t(`dashboard.trends.metrics.${view.key}`, METRIC_LABELS[view.key])}
            </p>
            <p className="mt-xs text-body-sm text-on-surface-deep">
              {t('dashboard.trends.previous', 'Anterior')}:{' '}
              <span className="whitespace-nowrap font-data-mono text-body-sm">
                {formatValue(view, view.previous)}
              </span>
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="whitespace-nowrap font-data-mono text-title-md text-foreground">
              {formatValue(view, view.current)}
            </p>
            <TrendIndicator
              direction={view.trend}
              percentage={view.changePercentage}
              className="mt-xs"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
