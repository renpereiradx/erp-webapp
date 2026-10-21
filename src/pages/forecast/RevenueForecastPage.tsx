import { useState } from 'react'
import { Coins, Gauge, Percent, TrendingUp, Wallet } from 'lucide-react'
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
  ForecastPageLayout,
  ForecastRefreshButton,
  ForecastScenariosPanel,
  ForecastSeriesTable,
  ForecastTable,
  useForecastRefresh,
  useRevenueForecast,
  useRevenueForecastParams,
  type ForecastColumn,
  type ForecastKpiItem,
  type ForecastKpiTone,
  type RevenueCategoryRow,
} from '@/features/forecast'
import { FORECAST_PAGE_SIZE, REVENUE_HORIZONS } from '@/domain/forecast/constants'
import {
  formatDateTime,
  formatForecastKpiValue,
  formatMoney,
  formatPercent,
} from '@/domain/forecast/format'
import { paginateRows } from '@/domain/forecast/pagination'
import {
  revenueCategoryRows,
  revenueKpis,
  revenueScenarios,
  revenueSeries,
} from '@/domain/forecast/revenue'

interface KpiMeta {
  icon: LucideIcon
  tone: ForecastKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const KPI_ORDER = [
  'historicalRevenue',
  'forecastRevenue',
  'annualProjection',
  'growth',
  'confidence',
] as const

const KPI_META: Record<(typeof KPI_ORDER)[number], KpiMeta> = {
  historicalRevenue: {
    icon: Wallet,
    tone: 'neutral',
    labelKey: 'forecast.revenue.kpi.historicalRevenue',
    label: 'Ingresos históricos',
    hintKey: 'forecast.revenue.kpiHints.historicalRevenue',
    hint: 'Suma del historial (12 meses)',
  },
  forecastRevenue: {
    icon: Coins,
    tone: 'primary',
    labelKey: 'forecast.revenue.kpi.forecastRevenue',
    label: 'Ingresos proyectados',
    hintKey: 'forecast.revenue.kpiHints.forecastRevenue',
    hint: 'Suma del horizonte',
  },
  annualProjection: {
    icon: TrendingUp,
    tone: 'success',
    labelKey: 'forecast.revenue.kpi.annualProjection',
    label: 'Proyección anual',
    hintKey: 'forecast.revenue.kpiHints.annualProjection',
    hint: 'Ingresos proyectados × 12 / meses',
  },
  growth: {
    icon: Percent,
    tone: 'secondary',
    labelKey: 'forecast.revenue.kpi.growth',
    label: 'Variación proyectada',
    hintKey: 'forecast.revenue.kpiHints.growth',
    hint: 'Promedio proyectado vs. histórico',
  },
  confidence: {
    icon: Gauge,
    tone: 'warning',
    labelKey: 'forecast.revenue.kpi.confidence',
    label: 'Confianza del modelo',
    hintKey: 'forecast.revenue.kpiHints.confidence',
    hint: 'Nivel 0-95 del backend',
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

/**
 * F11 — Pronóstico de ingresos. Serie mensual histórica + proyectada con
 * bandas absolutas del BE, escenarios base ±15 % y participación por categoría
 * (sin presentar la copia de growth general como pronóstico por categoría).
 */
const RevenueForecastPage = () => {
  const { t, lang } = useI18n()
  const { months, page, setMonths, setPage } = useRevenueForecastParams()
  const query = useRevenueForecast(months)
  const data = query.data
  const refresh = useForecastRefresh()

  const [categoriesPage, setCategoriesPage] = useState(1)

  const values = Object.fromEntries(revenueKpis(data?.summary).map((row) => [row.id, row]))
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

  const scenarios = revenueScenarios(data)
  const series = revenueSeries(data, lang)
  const seriesSlice = paginateRows(series, page, FORECAST_PAGE_SIZE)
  const categories = revenueCategoryRows(data)
  const categoriesSlice = paginateRows(
    categories,
    categoriesPage,
    FORECAST_PAGE_SIZE,
  )

  const categoryColumns: Array<ForecastColumn<RevenueCategoryRow>> = [
    {
      key: 'category',
      header: t('forecast.revenue.columns.category', 'Categoría'),
      render: (row) => (
        <span className="text-body-md-bold text-foreground">{row.name}</span>
      ),
    },
    {
      key: 'historical',
      header: t('forecast.demand.columns.historical', 'Histórico'),
      align: 'right',
      render: (row) => formatMoney(row.historical),
    },
    {
      key: 'share',
      header: t('forecast.revenue.columns.share', 'Participación'),
      align: 'right',
      render: (row) => formatPercent(row.percentage),
    },
  ]

  const emptyState = (
    <TableEmptyState
      icon={Coins}
      title={t('forecast.revenue.emptyTitle', 'Sin ingresos para proyectar')}
      description={t(
        'forecast.revenue.emptyHint',
        'El historial de 12 meses no tiene ventas suficientes para ajustar el modelo.',
      )}
    />
  )

  return (
    <ForecastPageLayout
      title={t('forecast.revenue.title', 'Pronóstico de ingresos')}
      subtitle={t(
        'forecast.revenue.subtitle',
        'Regresión lineal sobre los ingresos mensuales. Los escenarios y la proyección anual los calcula el backend.',
      )}
      meta={t('forecast.common.generatedAt', 'Generado: {date}', {
        date: formatDateTime(data?.generated_at, lang),
      })}
      toolbar={
        <>
          <div className="flex flex-wrap items-end gap-md">
            <ForecastControlGroup label={t('forecast.revenue.horizonLabel', 'Horizonte')}>
              <ForecastHorizonSelector
                value={months}
                options={REVENUE_HORIZONS}
                onChange={setMonths}
                label={t('forecast.revenue.horizonLabel', 'Horizonte')}
                optionLabels={Object.fromEntries(
                  REVENUE_HORIZONS.map((option) => [
                    option,
                    t('forecast.common.months', '{count} meses', { count: option }),
                  ]),
                )}
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
        onRetry={() => void refresh()}
        skeleton={<PageSkeleton />}
        isEmpty={
          Boolean(data) && series.length === 0 && categories.length === 0
        }
        empty={
          <SectionCard
            title={t(
              'forecast.revenue.emptyTitle',
              'Sin ingresos para proyectar',
            )}
            description={t(
              'forecast.revenue.emptyHint',
              'El historial de 12 meses no tiene ventas suficientes para ajustar el modelo.',
            )}
            testId="forecast-revenue-empty"
          >
            {emptyState}
          </SectionCard>
        }
      >
        <SectionCard
          title={t('forecast.revenue.kpisTitle', 'Indicadores de ingresos')}
          description={t(
            'forecast.revenue.kpisDescription',
            'Sumas del historial y del horizonte, más la extrapolación anual del backend.',
          )}
          testId="forecast-revenue-kpis-card"
        >
          <ForecastKpiLedger items={kpiItems} testId="forecast-revenue-kpis" />
        </SectionCard>

        <SectionCard
          title={t('forecast.revenue.scenariosTitle', 'Escenarios')}
          description={t(
            'forecast.revenue.scenariosDescription',
            'Modelo del backend: base ±15 % con pesos 20/60/20. No es una probabilidad estadística.',
          )}
          testId="forecast-revenue-scenarios"
        >
          <div className="space-y-md">
            <ForecastScenariosPanel
              scenarios={scenarios}
              testId="forecast-scenario-cards"
            />
            <p className="text-body-sm text-on-surface-deep">
              {t(
                'forecast.revenue.notes.scenarios',
                'Escenarios definidos por el backend: pesimista/base/optimista = base −15 % / base / base +15 %.',
              )}
            </p>
          </div>
        </SectionCard>

        <TableCard
          title={t(
            'forecast.revenue.monthlyTitle',
            'Proyección mensual',
          )}
          description={t(
            'forecast.revenue.monthlyDescription',
            'Histórico + meses proyectados con su banda absoluta.',
          )}
          testId="forecast-revenue-monthly"
          footer={
            seriesSlice.totalPages > 1 ? (
              <TablePagination
                page={seriesSlice.page}
                totalPages={seriesSlice.totalPages}
                totalItems={seriesSlice.totalItems}
                onPageChange={setPage}
              />
            ) : null
          }
        >
          <ForecastSeriesTable
            rows={seriesSlice.rows}
            empty={emptyState}
            testId="forecast-revenue-monthly-table"
            ariaLabel={t(
              'forecast.revenue.monthlyTitle',
              'Proyección mensual',
            )}
          />
        </TableCard>

        <TableCard
          title={t(
            'forecast.revenue.categoriesTitle',
            'Ingresos por categoría',
          )}
          description={t(
            'forecast.revenue.categoriesDescription',
            'Participación sobre el histórico del período. El backend aplica el crecimiento general a todas las categorías, así que no se muestra una proyección por categoría.',
          )}
          testId="forecast-revenue-categories"
          footer={
            categoriesSlice.totalPages > 1 ? (
              <TablePagination
                page={categoriesSlice.page}
                totalPages={categoriesSlice.totalPages}
                totalItems={categoriesSlice.totalItems}
                onPageChange={setCategoriesPage}
              />
            ) : null
          }
        >
          <ForecastTable
            columns={categoryColumns}
            rows={categoriesSlice.rows}
            rowKey={(row) => row.key}
            testId="forecast-revenue-categories-table"
            minWidthClass="min-w-[420px]"
            ariaLabel={t(
              'forecast.revenue.categoriesTitle',
              'Ingresos por categoría',
            )}
            empty={emptyState}
          />
        </TableCard>

        <SectionCard
          title={t('forecast.revenue.notesTitle', 'Cómo leer estas cifras')}
          testId="forecast-revenue-notes"
        >
          <div className="space-y-xs text-body-sm text-on-surface-deep">
            <p>
              {t(
                'forecast.revenue.notes.annualProjection',
                'La proyección anual extrapola el horizonte a 12 meses.',
              )}
            </p>
            <p>
              {t(
                'forecast.revenue.notes.linearMethod',
                'El backend proyecta con regresión lineal; la confianza es R² × 100 topado en 95.',
              )}
            </p>
            <p>
              {t(
                'forecast.revenue.notes.categoriesTotal',
                'La participación se calcula sobre el total histórico de las categorías listadas.',
              )}
            </p>
          </div>
        </SectionCard>
      </QueryBoundary>
    </ForecastPageLayout>
  )
}

export default RevenueForecastPage
