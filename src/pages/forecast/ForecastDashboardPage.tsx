import { AlertTriangle, Boxes, Coins, Gauge, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton } from '@/components/ui/DataSkeletons'
import {
  ForecastControlGroup,
  ForecastGroupLinks,
  ForecastHorizonSelector,
  ForecastInsightsPanel,
  ForecastKpiLedger,
  ForecastPageLayout,
  ForecastRecommendationsPanel,
  ForecastRefreshButton,
  useDashboardForecastParams,
  useForecastDashboard,
  type ForecastKpiItem,
  type ForecastKpiTone,
} from '@/features/forecast'
import {
  dashboardGroupSummaries,
  dashboardInsightViews,
  dashboardKpis,
  dashboardRecommendationViews,
} from '@/domain/forecast/dashboard'
import { FORECAST_HORIZONS } from '@/domain/forecast/constants'
import { formatDateTime, formatForecastKpiValue } from '@/domain/forecast/format'

interface KpiMeta {
  icon: LucideIcon
  tone: ForecastKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const KPI_ORDER = [
  'salesForecast',
  'annualRevenue',
  'riskProducts',
  'demandUnits',
  'coverage',
] as const

const KPI_META: Record<(typeof KPI_ORDER)[number], KpiMeta> = {
  salesForecast: {
    icon: TrendingUp,
    tone: 'primary',
    labelKey: 'forecast.dashboard.kpi.salesForecast',
    label: 'Ventas proyectadas',
    hintKey: 'forecast.dashboard.kpiHints.salesForecast',
    hint: 'Total del horizonte',
  },
  annualRevenue: {
    icon: Coins,
    tone: 'success',
    labelKey: 'forecast.dashboard.kpi.annualRevenue',
    label: 'Ingresos anuales',
    hintKey: 'forecast.dashboard.kpiHints.annualRevenue',
    hint: 'Extrapolación anual del backend',
  },
  riskProducts: {
    icon: AlertTriangle,
    tone: 'error',
    labelKey: 'forecast.dashboard.kpi.riskProducts',
    label: 'Productos en riesgo',
    hintKey: 'forecast.dashboard.kpiHints.riskProducts',
    hint: 'Riesgo alto de quiebre',
  },
  demandUnits: {
    icon: Boxes,
    tone: 'secondary',
    labelKey: 'forecast.dashboard.kpi.demandUnits',
    label: 'Demanda proyectada',
    hintKey: 'forecast.dashboard.kpiHints.demandUnits',
    hint: 'Suma de las categorías',
  },
  coverage: {
    icon: Gauge,
    tone: 'neutral',
    labelKey: 'forecast.dashboard.kpi.coverage',
    label: 'Cobertura de inventario',
    hintKey: 'forecast.dashboard.kpiHints.coverage',
    hint: 'Días de demanda cubiertos',
  },
}

const DashboardSkeleton = () => (
  <div className="space-y-xl" aria-busy="true">
    <div className="rounded-md bg-surface p-lg shadow-whisper">
      <PanelSkeleton rows={6} />
    </div>
    <div className="grid gap-lg xl:grid-cols-3">
      <div className="rounded-md bg-surface p-lg shadow-whisper xl:col-span-2">
        <PanelSkeleton rows={5} />
      </div>
      <div className="rounded-md bg-surface p-lg shadow-whisper">
        <PanelSkeleton rows={4} />
      </div>
    </div>
  </div>
)

/**
 * F11 — Dashboard de Pronósticos. Una sola query compone los 4 pronósticos del
 * backend; los insights se traducen por `type` y las recomendaciones se
 * derivan de sus mismas condiciones. Sin mock, sin claims de IA y sin cifras
 * que el endpoint no traiga (un sub-pronóstico ausente muestra `—`).
 */
const ForecastDashboardPage = () => {
  const { t, lang } = useI18n()
  const { months, setMonths } = useDashboardForecastParams()
  const query = useForecastDashboard(months)
  const data = query.data

  const values = Object.fromEntries(
    dashboardKpis(data).map((row) => [row.id, row]),
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

  const insights = dashboardInsightViews(data, lang)
  const recommendations = dashboardRecommendationViews(data, lang)
  const groups = dashboardGroupSummaries(data)

  return (
    <ForecastPageLayout
      title={t('forecast.dashboard.title', 'Pronósticos')}
      subtitle={t(
        'forecast.dashboard.subtitle',
        'Proyecciones estadísticas del backend sobre las ventas históricas.',
      )}
      meta={t('forecast.common.generatedAt', 'Generado: {date}', {
        date: formatDateTime(data?.generated_at, lang),
      })}
      toolbar={
        <>
          <div className="flex flex-wrap items-end gap-md">
            <ForecastControlGroup
              label={t(
                'forecast.dashboard.horizonLabel',
                'Horizonte de proyección',
              )}
            >
              <ForecastHorizonSelector
                value={months}
                options={FORECAST_HORIZONS}
                onChange={setMonths}
                label={t(
                  'forecast.dashboard.horizonLabel',
                  'Horizonte de proyección',
                )}
                optionLabels={Object.fromEntries(
                  FORECAST_HORIZONS.map((option) => [
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
        onRetry={() => void query.refetch()}
        skeleton={<DashboardSkeleton />}
      >
        <SectionCard
          title={t('forecast.dashboard.kpisTitle', 'Indicadores del horizonte')}
          description={t(
            'forecast.dashboard.kpisDescription',
            'Cifras calculadas por el backend para el horizonte seleccionado.',
          )}
          testId="forecast-dashboard-kpis-card"
        >
          <ForecastKpiLedger items={kpiItems} testId="forecast-dashboard-kpis" />
        </SectionCard>

        <div className="grid gap-lg xl:grid-cols-3">
          <SectionCard
            title={t('forecast.dashboard.insightsTitle', 'Hallazgos del modelo')}
            description={t(
              'forecast.dashboard.insightsDescription',
              'Los genera el backend a partir de los pronósticos; cada uno enlaza a su pantalla.',
            )}
            className="xl:col-span-2"
            testId="forecast-dashboard-insights"
          >
            <ForecastInsightsPanel
              insights={insights}
              testId="forecast-insights-list"
            />
          </SectionCard>
          <SectionCard
            title={t('forecast.dashboard.recommendationsTitle', 'Recomendaciones')}
            description={t(
              'forecast.dashboard.recommendationsDescription',
              'Se derivan de las mismas condiciones y umbrales del backend.',
            )}
            testId="forecast-dashboard-recommendations"
          >
            <ForecastRecommendationsPanel
              recommendations={recommendations}
              testId="forecast-recommendations-list"
            />
          </SectionCard>
        </div>

        <SectionCard
          title={t('forecast.dashboard.groupsTitle', 'Pantallas del grupo')}
          description={t(
            'forecast.dashboard.groupsDescription',
            'Cada acceso abre la pantalla con su propio horizonte e historial.',
          )}
          testId="forecast-dashboard-groups"
        >
          <div className="space-y-md">
            <ForecastGroupLinks groups={groups} testId="forecast-group-links" />
            <p className="text-body-sm text-on-surface-deep">
              {t(
                'forecast.dashboard.composeNote',
                'El dashboard compone ventas con 6 meses de historia, ingresos con 12, inventario con meses × 30 días y demanda con 6. Una pantalla con otro historial puede mostrar cifras distintas.',
              )}
            </p>
          </div>
        </SectionCard>
      </QueryBoundary>
    </ForecastPageLayout>
  )
}

export default ForecastDashboardPage
