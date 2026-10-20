import { useI18n } from '@/lib/i18n'
import type { ProfitabilityTrendGranularity } from '@/types/bi'
import type { TrendInsight } from '@/domain/profitability/trends'
import { formatMoney, formatPercent, formatSignedPercent, formatTrendDate } from '@/domain/profitability/format'

interface TrendsSummaryProps {
  insight: TrendInsight
  granularity: ProfitabilityTrendGranularity
  testId?: string
}

/**
 * Resumen de la serie: dirección (regla ±5 % del BE), crecimiento
 * primera→última fecha, margen promedio simple y extremos re-derivados de los
 * puntos (las fechas del summary del BE vienen como label en inglés).
 */
export const TrendsSummary = ({
  insight,
  granularity,
  testId = 'trends-summary',
}: TrendsSummaryProps) => {
  const { t, lang } = useI18n()

  const directionFallback = {
    up: 'En alza',
    down: 'En baja',
    stable: 'Estable',
  } as const
  const directionLabel = insight.direction
    ? t(
        `profitability.trends.direction.${insight.direction}`,
        directionFallback[insight.direction],
      )
    : t('profitability.common.unavailable', '—')

  const dateLabel = (date: string | null | undefined) =>
    date ? formatTrendDate(date, granularity, lang) : t('profitability.common.unavailable', '—')

  return (
    <dl className="grid grid-cols-2 gap-md lg:grid-cols-4" data-testid={testId}>
      <div>
        <dt className="text-label-caps uppercase text-on-surface-deep">
          {t('profitability.trends.directionLabel', 'Tendencia')}
        </dt>
        <dd className="text-body-md-bold text-foreground">{directionLabel}</dd>
      </div>
      <div>
        <dt className="text-label-caps uppercase text-on-surface-deep">
          {t('profitability.trends.growthLabel', 'Primera vs última fecha')}
        </dt>
        <dd className="font-data-mono text-data-mono text-foreground">
          {formatSignedPercent(insight.growthRate)}
        </dd>
      </div>
      <div>
        <dt className="text-label-caps uppercase text-on-surface-deep">
          {t('profitability.trends.averageMarginLabel', 'Margen promedio')}
        </dt>
        <dd className="font-data-mono text-data-mono text-foreground">
          {formatPercent(insight.averageMargin)}
        </dd>
      </div>
      <div>
        <dt className="text-label-caps uppercase text-on-surface-deep">
          {t('profitability.trends.peakRevenueLabel', 'Mejor fecha por ingresos')}
        </dt>
        <dd className="text-body-md text-foreground">
          {dateLabel(insight.peakRevenue?.date)}
          {insight.peakRevenue ? (
            <>
              {' · '}
              <span className="font-data-mono text-data-mono">
                {formatMoney(insight.peakRevenue.value)}
              </span>
            </>
          ) : null}
        </dd>
      </div>
      <div>
        <dt className="text-label-caps uppercase text-on-surface-deep">
          {t('profitability.trends.peakProfitLabel', 'Mejor fecha por beneficio')}
        </dt>
        <dd className="text-body-md text-foreground">
          {dateLabel(insight.peakProfit?.date)}
          {insight.peakProfit ? (
            <>
              {' · '}
              <span className="font-data-mono text-data-mono">
                {formatMoney(insight.peakProfit.value)}
              </span>
            </>
          ) : null}
        </dd>
      </div>
      <div>
        <dt className="text-label-caps uppercase text-on-surface-deep">
          {t('profitability.trends.lowestMarginLabel', 'Margen más bajo')}
        </dt>
        <dd className="text-body-md text-foreground">
          {dateLabel(insight.lowestMargin?.date)}
          {insight.lowestMargin ? (
            <>
              {' · '}
              <span className="font-data-mono text-data-mono">
                {formatPercent(insight.lowestMargin.value)}
              </span>
            </>
          ) : null}
        </dd>
      </div>
      <div>
        <dt className="text-label-caps uppercase text-on-surface-deep">
          {t('profitability.trends.totalRevenueLabel', 'Ingresos de la serie')}
        </dt>
        <dd className="font-data-mono text-data-mono text-foreground">
          {formatMoney(insight.totalRevenue)}
        </dd>
      </div>
      <div>
        <dt className="text-label-caps uppercase text-on-surface-deep">
          {t('profitability.trends.totalProfitLabel', 'Beneficio de la serie')}
        </dt>
        <dd className="font-data-mono text-data-mono text-foreground">
          {formatMoney(insight.totalProfit)}
        </dd>
      </div>
    </dl>
  )
}

export default TrendsSummary
