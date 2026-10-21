import { useState } from 'react'
import {
  Calculator,
  Gauge,
  History,
  LineChart,
  Percent,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton } from '@/components/ui/DataSkeletons'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import TablePagination from '@/components/ui/TablePagination'
import {
  ForecastControlGroup,
  ForecastHorizonSelector,
  ForecastKpiLedger,
  ForecastMethodSelector,
  ForecastPageLayout,
  ForecastRefreshButton,
  ForecastSeriesTable,
  ForecastTable,
  useSalesForecast,
  useSalesForecastParams,
  type ForecastColumn,
  type ForecastKpiItem,
  type ForecastKpiTone,
} from '@/features/forecast'
import {
  FORECAST_HISTORY_MONTHS,
  FORECAST_HORIZONS,
  FORECAST_PAGE_SIZE,
  FORECAST_UI_METHODS,
  METHOD_FALLBACK,
  METHOD_I18N_KEYS,
  METHOD_SHORT_FALLBACK,
} from '@/domain/forecast/constants'
import {
  formatDateTime,
  formatDecimal,
  formatForecastKpiValue,
  formatHistoryRange,
  formatMoney,
} from '@/domain/forecast/format'
import { paginateRows } from '@/domain/forecast/pagination'
import {
  formatSalesModelMetric,
  salesBandKind,
  salesForecastKpis,
  salesHistoryPoints,
  salesModelMetrics,
  salesSeasonality,
  salesSeries,
  type SeasonalityFactorView,
} from '@/domain/forecast/sales'

interface KpiMeta {
  icon: LucideIcon
  tone: ForecastKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const KPI_ORDER = [
  'historicalTotal',
  'projectedTotal',
  'projectedAverage',
  'growth',
  'confidence',
] as const

const KPI_META: Record<(typeof KPI_ORDER)[number], KpiMeta> = {
  historicalTotal: {
    icon: History,
    tone: 'neutral',
    labelKey: 'forecast.sales.kpi.historicalTotal',
    label: 'Ventas históricas',
    hintKey: 'forecast.sales.kpiHints.historicalTotal',
    hint: 'Suma del historial',
  },
  projectedTotal: {
    icon: TrendingUp,
    tone: 'primary',
    labelKey: 'forecast.sales.kpi.projectedTotal',
    label: 'Ventas proyectadas',
    hintKey: 'forecast.sales.kpiHints.projectedTotal',
    hint: 'Suma del horizonte',
  },
  projectedAverage: {
    icon: Calculator,
    tone: 'secondary',
    labelKey: 'forecast.sales.kpi.projectedAverage',
    label: 'Promedio mensual proyectado',
    hintKey: 'forecast.sales.kpiHints.projectedAverage',
    hint: 'Por mes proyectado',
  },
  growth: {
    icon: Percent,
    tone: 'success',
    labelKey: 'forecast.sales.kpi.growth',
    label: 'Variación proyectada',
    hintKey: 'forecast.sales.kpiHints.growth',
    hint: 'Promedio proyectado vs. histórico',
  },
  confidence: {
    icon: Gauge,
    tone: 'warning',
    labelKey: 'forecast.sales.kpi.confidence',
    label: 'Confianza del modelo',
    hintKey: 'forecast.sales.kpiHints.confidence',
    hint: 'Nivel 0-95 del backend',
  },
}

const METRIC_ORDER = ['confidence', 'r2', 'mae', 'mape', 'rmse'] as const

const METRIC_META: Record<
  (typeof METRIC_ORDER)[number],
  { key: string; fallback: string; hintKey: string; hint: string }
> = {
  confidence: {
    key: 'forecast.sales.metric.confidence',
    fallback: 'Confianza',
    hintKey: 'forecast.sales.metricHints.confidence',
    hint: 'R² × 100 topado en 95 (o 75/80 − CV × 100)',
  },
  r2: {
    key: 'forecast.sales.metric.r2',
    fallback: 'R²',
    hintKey: 'forecast.sales.metricHints.r2',
    hint: 'Proporción de la variación explicada',
  },
  mae: {
    key: 'forecast.sales.metric.mae',
    fallback: 'MAE',
    hintKey: 'forecast.sales.metricHints.mae',
    hint: 'Error absoluto medio',
  },
  mape: {
    key: 'forecast.sales.metric.mape',
    fallback: 'MAPE',
    hintKey: 'forecast.sales.metricHints.mape',
    hint: 'Error porcentual absoluto medio',
  },
  rmse: {
    key: 'forecast.sales.metric.rmse',
    fallback: 'RMSE',
    hintKey: 'forecast.sales.metricHints.rmse',
    hint: 'Raíz del error cuadrático medio',
  },
}

const PageSkeleton = () => (
  <div className="space-y-xl" aria-busy="true">
    <div className="rounded-md bg-surface p-lg shadow-whisper">
      <PanelSkeleton rows={5} />
    </div>
    <div className="rounded-md bg-surface p-lg shadow-whisper">
      <PanelSkeleton rows={4} />
    </div>
  </div>
)

const SeasonalityFactorsTable = ({ factors }: { factors: SeasonalityFactorView[] }) => {
  const { t } = useI18n()
  const columns: Array<ForecastColumn<SeasonalityFactorView>> = [
    {
      key: 'month',
      header: t('forecast.common.period', 'Período'),
      render: (row) => row.label,
    },
    {
      key: 'factor',
      header: t('forecast.sales.factor', 'Factor'),
      align: 'right',
      render: (row) => formatDecimal(row.factor, 2),
    },
  ]
  return (
    <ForecastTable
      columns={columns}
      rows={factors}
      rowKey={(row) => row.key}
      empty={<span />}
      testId="forecast-seasonality-table"
      minWidthClass="min-w-[280px]"
      ariaLabel={t('forecast.sales.seasonalityTitle', 'Estacionalidad')}
    />
  )
}

/**
 * F11 — Pronóstico de ventas. Historial y proyección salen de
 * `/forecast/sales`; las etiquetas de bucket se re-derivan de la fecha y las
 * bandas se explican según la semántica real del método (multiplicador vs.
 * absoluta). SEASONAL se deshabilita con menos de 12 meses de historia en vez
 * de disparar el 400 del backend.
 */
const SalesForecastPage = () => {
  const { t, lang } = useI18n()
  const { selection, setHistory, setForecastMonths, setMethod } =
    useSalesForecastParams()
  const query = useSalesForecast(selection)
  const data = query.data

  const [historyPage, setHistoryPage] = useState(1)
  const [projectionPage, setProjectionPage] = useState(1)

  const values = Object.fromEntries(
    salesForecastKpis(data).map((row) => [row.id, row]),
  )
  const kpiItems: ForecastKpiItem[] = KPI_ORDER.map((id) => {
    const meta = KPI_META[id]
    return {
      id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.label),
      hint: t(meta.hintKey, meta.hint),
      value: formatForecastKpiValue(
        values[id] ?? { id, kind: 'count', value: null },
      ),
    }
  })

  const series = salesSeries(data, lang)
  const historySlice = paginateRows(series.history, historyPage, FORECAST_PAGE_SIZE)
  const projectionSlice = paginateRows(
    series.projection,
    projectionPage,
    FORECAST_PAGE_SIZE,
  )
  const seasonality = salesSeasonality(data?.seasonality, lang)
  const metrics = salesModelMetrics(data)
  const metricsById = Object.fromEntries(metrics.map((metric) => [metric.id, metric]))
  const confidence = data?.confidence
  const bandNote =
    salesBandKind(data?.method) === 'multiplier'
      ? t(
          'forecast.sales.bandMultiplier',
          'Banda del modelo: ±15 % sobre cada punto proyectado (multiplicadores {lower} y {upper}).',
          {
            lower: formatDecimal(confidence?.lower_bound, 2),
            upper: formatDecimal(confidence?.upper_bound, 2),
          },
        )
      : t(
          'forecast.sales.bandAbsolute',
          'Banda del modelo: media ± 2σ absolutos ({lower} a {upper}).',
          {
            lower: formatMoney(confidence?.lower_bound),
            upper: formatMoney(confidence?.upper_bound),
          },
        )

  const methodLabel = t(
    `forecast.method.${METHOD_I18N_KEYS[data?.method ?? 'LINEAR'] ?? 'linear'}`,
    METHOD_FALLBACK[data?.method ?? 'LINEAR'] ?? data?.method ?? '—',
  )
  const granularityLabel = t(
    `forecast.granularity.${(data?.granularity ?? 'MONTHLY').toLowerCase()}`,
    data?.granularity ?? '—',
  )

  const methodOptionLabels = Object.fromEntries(
    FORECAST_UI_METHODS.map((method) => [
      method,
      t(
        `forecast.methodShort.${METHOD_I18N_KEYS[method]}`,
        METHOD_SHORT_FALLBACK[method] ?? method,
      ),
    ]),
  ) as Record<(typeof selection)['method'], string>

  const historyOptionLabels = Object.fromEntries(
    FORECAST_HISTORY_MONTHS.map((option) => [
      option,
      t('forecast.common.months', '{count} meses', { count: option }),
    ]),
  )
  const horizonOptionLabels = Object.fromEntries(
    FORECAST_HORIZONS.map((option) => [
      option,
      t('forecast.common.months', '{count} meses', { count: option }),
    ]),
  )

  const emptyTable = (
    <TableEmptyState
      icon={LineChart}
      title={t('forecast.sales.emptyTitle', 'Sin historial suficiente')}
      description={t(
        'forecast.sales.emptyHint',
        'El endpoint necesita al menos 2 puntos de historia para proyectar.',
      )}
    />
  )

  return (
    <ForecastPageLayout
      title={t('forecast.sales.title', 'Pronóstico de ventas')}
      subtitle={t(
        'forecast.sales.subtitle',
        'Proyección sobre las ventas mensuales históricas. Las métricas de ajuste son las que calcula el backend.',
      )}
      meta={t('forecast.common.generatedAt', 'Generado: {date}', {
        date: formatDateTime(data?.generated_at, lang),
      })}
      toolbar={
        <>
          <div className="flex flex-wrap items-end gap-md">
            <ForecastControlGroup label={t('forecast.sales.historyLabel', 'Historial')}>
              <ForecastHorizonSelector
                value={selection.historyMonths}
                options={FORECAST_HISTORY_MONTHS}
                onChange={setHistory}
                label={t('forecast.sales.historyLabel', 'Historial')}
                optionLabels={historyOptionLabels}
              />
            </ForecastControlGroup>
            <ForecastControlGroup label={t('forecast.sales.horizonLabel', 'Horizonte')}>
              <ForecastHorizonSelector
                value={selection.forecastMonths}
                options={FORECAST_HORIZONS}
                onChange={setForecastMonths}
                label={t('forecast.sales.horizonLabel', 'Horizonte')}
                optionLabels={horizonOptionLabels}
              />
            </ForecastControlGroup>
            <ForecastControlGroup label={t('forecast.sales.methodLabel', 'Método')}>
              <ForecastMethodSelector
                value={selection.method}
                onChange={setMethod}
                label={t('forecast.sales.methodLabel', 'Método')}
                optionLabels={methodOptionLabels}
              />
            </ForecastControlGroup>
          </div>
          <ForecastRefreshButton />
        </>
      }
    >
      <QueryBoundary
        isLoading={query.isLoading}
        error={query.error}
        errorTitle={t(
          'forecast.common.errorTitle',
          'No se pudieron cargar los pronósticos',
        )}
        onRetry={() => void query.refetch()}
        skeleton={<PageSkeleton />}
        isEmpty={Boolean(data) && series.history.length < 2}
        empty={
          <SectionCard
            title={t('forecast.sales.emptyTitle', 'Sin historial suficiente')}
            description={t(
              'forecast.sales.emptyHint',
              'El endpoint necesita al menos 2 puntos de historia para proyectar.',
            )}
            testId="forecast-sales-empty"
          >
            <TableEmptyState
              icon={LineChart}
              title={t('forecast.sales.emptyTitle', 'Sin historial suficiente')}
              description={t(
                'forecast.sales.emptyHint',
                'El endpoint necesita al menos 2 puntos de historia para proyectar.',
              )}
            />
          </SectionCard>
        }
      >
        <SectionCard
          title={t('forecast.sales.kpisTitle', 'Indicadores del pronóstico')}
          description={t(
            'forecast.sales.kpisDescription',
            'Sumas y promedios del historial y del horizonte, tal como los devuelve el backend.',
          )}
          testId="forecast-sales-kpis-card"
        >
          <ForecastKpiLedger items={kpiItems} testId="forecast-sales-kpis" />
        </SectionCard>

        <SectionCard
          title={t('forecast.sales.modelTitle', 'Modelo y ajuste')}
          description={t(
            'forecast.sales.modelDescription',
            'Métricas de bondad de ajuste calculadas por el backend sobre el historial.',
          )}
          testId="forecast-sales-model"
        >
          <dl className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <dt className="text-label-caps uppercase text-on-surface-deep">
                {t('forecast.sales.methodLabel', 'Método')}
              </dt>
              <dd className="text-body-md-bold text-foreground">{methodLabel}</dd>
            </div>
            <div>
              <dt className="text-label-caps uppercase text-on-surface-deep">
                {t('forecast.sales.granularityLabel', 'Granularidad')}
              </dt>
              <dd className="text-body-md-bold text-foreground">
                {granularityLabel}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-label-caps uppercase text-on-surface-deep">
                {t('forecast.sales.historyRange', 'Historial: {range}', {
                  range: formatHistoryRange(data?.history_period, lang),
                })}
              </dt>
              <dd className="text-body-sm text-on-surface-deep">
                {t('forecast.sales.modelNote', 'La etiqueta de cada bucket se re-deriva de su fecha; el backend la emite en inglés.')}
              </dd>
            </div>
          </dl>
          <dl className="mt-md grid gap-md border-t border-divider pt-md sm:grid-cols-2 xl:grid-cols-5">
            {METRIC_ORDER.map((id) => {
              const meta = METRIC_META[id]
              const metric = metricsById[id]
              return (
                <div key={id} data-testid={`forecast-model-${id}`}>
                  <dt className="text-label-caps uppercase text-on-surface-deep">
                    {t(meta.key, meta.fallback)}
                  </dt>
                  <dd className="whitespace-nowrap font-data-mono text-title-sm text-foreground">
                    {formatSalesModelMetric(
                      metric ?? { id, value: null, kind: 'ratio' },
                    )}
                  </dd>
                  <dd className="text-body-sm text-on-surface-deep">
                    {t(meta.hintKey, meta.hint)}
                  </dd>
                </div>
              )
            })}
          </dl>
          <div className="mt-md space-y-xs">
            <p className="text-body-sm text-on-surface-deep">{bandNote}</p>
            <p className="text-body-sm text-on-surface-deep">
              {t('forecast.sales.historyPoints', 'Puntos de historial: {count}', {
                count: salesHistoryPoints(data),
              })}
            </p>
          </div>
        </SectionCard>

        <TableCard
          title={t('forecast.sales.historyTitle', 'Historial')}
          description={t(
            'forecast.sales.historyDescription',
            'Buckets mensuales de ventas reales del período de historia.',
          )}
          testId="forecast-sales-history"
          footer={
            historySlice.totalPages > 1 ? (
              <TablePagination
                page={historySlice.page}
                totalPages={historySlice.totalPages}
                totalItems={historySlice.totalItems}
                onPageChange={setHistoryPage}
              />
            ) : null
          }
        >
          <ForecastSeriesTable
            rows={historySlice.rows}
            showBounds={false}
            empty={emptyTable}
            testId="forecast-sales-history-table"
            ariaLabel={t('forecast.sales.historyTitle', 'Historial')}
          />
        </TableCard>

        <TableCard
          title={t('forecast.sales.projectionTitle', 'Proyección')}
          description={t(
            'forecast.sales.projectionDescription',
            'Puntos proyectados por el modelo con su banda.',
          )}
          testId="forecast-sales-projection"
          footer={
            projectionSlice.totalPages > 1 ? (
              <TablePagination
                page={projectionSlice.page}
                totalPages={projectionSlice.totalPages}
                totalItems={projectionSlice.totalItems}
                onPageChange={setProjectionPage}
              />
            ) : null
          }
        >
          <ForecastSeriesTable
            rows={projectionSlice.rows}
            empty={emptyTable}
            testId="forecast-sales-projection-table"
            ariaLabel={t('forecast.sales.projectionTitle', 'Proyección')}
          />
        </TableCard>

        <SectionCard
          title={t('forecast.sales.seasonalityTitle', 'Estacionalidad')}
          description={t(
            'forecast.sales.seasonalityDescription',
            'Factores por mes calendario detectados por el backend (mínimo 12 puntos de historia).',
          )}
          testId="forecast-sales-seasonality"
        >
          {seasonality.hasSeasonality ? (
            <div className="space-y-md">
              <div className="flex flex-wrap gap-md">
                <div>
                  <p className="text-label-caps uppercase text-on-surface-deep">
                    {t('forecast.sales.peaks', 'Meses pico')}
                  </p>
                  <p className="text-body-md text-foreground">
                    {seasonality.peaks.length
                      ? seasonality.peaks.join(', ')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-label-caps uppercase text-on-surface-deep">
                    {t('forecast.sales.lows', 'Meses bajos')}
                  </p>
                  <p className="text-body-md text-foreground">
                    {seasonality.lows.length ? seasonality.lows.join(', ') : '—'}
                  </p>
                </div>
              </div>
              <SeasonalityFactorsTable factors={seasonality.factors} />
            </div>
          ) : (
            <p className="text-body-md text-on-surface-deep">
              {t(
                'forecast.sales.noSeasonality',
                'El backend no detectó un patrón estacional con la historia actual.',
              )}
            </p>
          )}
        </SectionCard>
      </QueryBoundary>
    </ForecastPageLayout>
  )
}

export default SalesForecastPage
