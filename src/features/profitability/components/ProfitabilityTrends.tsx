import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { Activity, Lightbulb, RefreshCcw, TrendingDown, TrendingUp } from 'lucide-react'
import { formatNumber } from '@/utils/currencyUtils'
import { useProfitability } from '../hooks/useProfitability'
import ProfitabilitySkeleton from './ProfitabilitySkeleton'
import type { ProfitabilityInsight, TrendsData } from '../types'

/**
 * Evolución temporal (GET /profitability/trends).
 * Migración FASE 2 (PLAN_ALINEACION_BI_FRONTEND): .tsx + FSD + tokens +
 * i18n. Honestidad: el signo de la tasa de crecimiento ahora sale del dato
 * (el legacy anteponía '+' fijo, mostrando '+-5%'); eliminados Exportar y
 * el botón 'Auditoría Detallada' sin handler (§2.6).
 */

const GRANULARITIES = ['daily', 'weekly', 'monthly'] as const
type Granularity = (typeof GRANULARITIES)[number]

const GRANULARITY_FALLBACK: Record<Granularity, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
}

const TrendsProfitability = () => {
  const { t } = useI18n()
  const [params, setParams] = useState({ period: 'month', granularity: 'daily' })
  const { data, loading, error, refresh } = useProfitability<TrendsData>('getTrends', params)

  const dataPoints = data?.data_points ?? []
  const summary = data?.summary
  const maxRevenue = Math.max(...dataPoints.map((pt) => pt.revenue ?? 0), 1)
  const growth = summary?.growth_rate ?? 0
  const growthUp = growth >= 0

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.profitability.breadcrumb', 'Rentabilidad', {})}
          title={t('bi.profitability.trends.title', 'Evolución Temporal', {})}
          subtitle={t(
            'bi.profitability.trends.subtitle',
            'Análisis algorítmico de flujos y márgenes. Visualización técnica del comportamiento financiero en periodos operativos.',
            {},
          )}
          actions={
            <div className="flex flex-wrap items-center gap-sm">
              <div
                className="inline-flex p-xs bg-surface-muted rounded-md border border-border-subtle"
                role="group"
                aria-label={t('bi.profitability.trends.granularity.label', 'Granularidad', {})}
                data-testid="granularity-selector"
              >
                {GRANULARITIES.map((g) => {
                  const active = params.granularity === g
                  return (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={active}
                      data-testid={`granularity-${g}`}
                      onClick={() => setParams((prev) => ({ ...prev, granularity: g }))}
                      className={`px-md py-xs rounded-xs text-body-sm-bold uppercase tracking-wide transition-colors duration-150 ${
                        active
                          ? 'bg-surface text-primary shadow-sm'
                          : 'text-on-surface-deep hover:text-foreground'
                      }`}
                    >
                      {t(`bi.profitability.trends.granularity.${g}`, GRANULARITY_FALLBACK[g], {})}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => refresh()}
                className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
              >
                <RefreshCcw className="w-4 h-4" />
                {t('bi.profitability.action.refresh', 'Actualizar', {})}
              </button>
            </div>
          }
        />

        {loading && <ProfitabilitySkeleton kpiCount={3} rows={5} />}

        {!loading && error && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.profitability.errorTitle', 'No se pudo cargar la rentabilidad', {})}
              message={error}
              onRetry={refresh}
            />
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary KPIs */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-md mt-lg">
              <div className="bg-primary text-on-primary rounded-md shadow-whisper p-lg flex flex-col gap-sm" data-testid="kpi-trend-vector">
                <p className="text-label-caps uppercase opacity-80">
                  {t('bi.profitability.trends.kpi.trendVector', 'Vector de Tendencia', {})}
                </p>
                <p className="text-title-md tracking-tight">
                  {summary?.trend_direction === 'UP'
                    ? t('bi.profitability.trends.kpi.expansion', 'Expansión Sostenida', {})
                    : t('bi.profitability.trends.kpi.contraction', 'Contracción', {})}
                </p>
                <p className="text-body-md opacity-80">
                  {t('bi.profitability.trends.kpi.trendHint', 'Basado en rendimiento histórico', {})}
                </p>
              </div>

              <div className="bg-surface border border-border-subtle rounded-md shadow-whisper p-lg flex flex-col gap-sm" data-testid="kpi-growth-rate">
                <p className="text-label-caps uppercase text-on-surface-deep">
                  {t('bi.profitability.trends.kpi.growthRate', 'Tasa de Crecimiento', {})}
                </p>
                <div className="flex items-center gap-sm">
                  {growthUp ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-error" />
                  )}
                  <span className="text-title-md font-data-mono text-data-mono text-foreground">
                    {growthUp ? '+' : ''}
                    {formatNumber(growth)}%
                  </span>
                </div>
                <p className="text-body-md text-on-surface-deep">
                  {t('bi.profitability.trends.kpi.growthHint', 'Variación vs periodo anterior', {})}:{' '}
                  <span className="font-data-mono text-data-mono">
                    {formatNumber(growth - (summary?.previous_growth_rate ?? 0))}pp
                  </span>
                </p>
              </div>

              <div className="bg-surface border border-border-subtle rounded-md shadow-whisper p-lg flex flex-col gap-sm" data-testid="kpi-peak-profit">
                <div className="flex justify-between items-start">
                  <p className="text-label-caps uppercase text-on-surface-deep">
                    {t('bi.profitability.trends.kpi.peakProfit', 'Pico de Beneficio', {})}
                  </p>
                  <div className="bg-success/10 p-sm rounded-sm text-success">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-title-md font-data-mono text-data-mono text-foreground uppercase truncate">
                  {summary?.peak_profit_date || '---'}
                </span>
                <p className="text-body-sm-bold font-data-mono text-data-mono text-success uppercase">
                  Gs. {formatNumber(summary?.peak_profit_value ?? 0)}{' '}
                  {t('bi.profitability.trends.kpi.net', 'NETO', {})}
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg mt-xl">
              {/* Evolución temporal */}
              <section className="lg:col-span-3 bg-surface rounded-md shadow-whisper overflow-hidden">
                <div className="p-lg border-b border-border-subtle bg-surface-muted flex flex-col sm:flex-row justify-between gap-md">
                  <div>
                    <h2 className="text-label-caps uppercase text-foreground">
                      {t('bi.profitability.trends.chart.title', 'Matriz de Evolución Temporal', {})}
                    </h2>
                    <div className="flex gap-lg mt-sm">
                      <span className="flex items-center gap-xs text-body-sm-bold text-on-surface-deep uppercase">
                        <span className="size-2.5 rounded-full bg-primary/30" aria-hidden="true" />
                        {t('bi.profitability.trends.chart.revenue', 'Ingresos', {})}
                      </span>
                      <span className="flex items-center gap-xs text-body-sm-bold text-success uppercase">
                        <span className="size-2.5 rounded-full bg-success" aria-hidden="true" />
                        {t('bi.profitability.trends.chart.profit', 'Beneficio Real', {})}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-headline-lg-mobile font-data-mono text-data-mono text-foreground">
                      {formatNumber(summary?.total_period_revenue ?? 0)}
                    </span>
                    <p className="text-label-caps uppercase text-on-surface-deep mt-xs">
                      {t('bi.profitability.trends.chart.totalHint', 'Auditoría Consolidada en Período', {})}
                    </p>
                  </div>
                </div>

                {dataPoints.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title={t('bi.profitability.trends.chart.emptyTitle', 'Sin series disponibles', {})}
                    description={t(
                      'bi.profitability.trends.chart.emptyDescription',
                      'No hay puntos para esta granularidad y período.',
                      {},
                    )}
                    actionLabel={t('bi.profitability.action.refresh', 'Actualizar', {})}
                    onAction={refresh}
                  />
                ) : (
                  <div
                    className="h-100 p-xl bg-surface-muted/50 relative flex items-end justify-between gap-md"
                    data-testid="trends-chart"
                  >
                    {dataPoints.map((pt, i) => {
                      const revenue = pt.revenue ?? 0
                      const profit = pt.gross_profit ?? 0
                      const efficiency = revenue > 0 ? (profit / revenue) * 100 : 0
                      const heightPct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center h-full justify-end gap-sm">
                          <div
                            className="w-full max-w-12 flex-1 flex items-end relative overflow-hidden"
                            title={`${t('bi.profitability.trends.chart.revenue', 'Ingresos', {})}: ${formatNumber(revenue)} · ${t('bi.profitability.trends.chart.profit', 'Beneficio Real', {})}: ${formatNumber(profit)}`}
                          >
                            <div className="w-full bg-surface-subtle rounded-t-md relative overflow-hidden" style={{ height: `${heightPct}%` }}>
                              <div className="absolute bottom-0 w-full bg-primary/20 h-full" />
                              <div
                                className="absolute bottom-0 w-full bg-success transition-all duration-300"
                                style={{ height: `${efficiency}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-body-sm-bold text-on-surface-deep uppercase font-data-mono text-data-mono truncate max-w-full">
                            {pt.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Sidebar */}
              <div className="lg:col-span-1 flex flex-col gap-lg">
                <section className="bg-surface rounded-md shadow-whisper p-lg" data-testid="insights-panel">
                  <h2 className="text-label-caps uppercase text-foreground flex items-center gap-sm">
                    <Lightbulb className="w-4 h-4 text-warning" />
                    {t('bi.profitability.trends.insights.title', 'Smart Insights', {})}
                  </h2>
                  <div className="space-y-md mt-md">
                    {(summary?.insights ?? []).map((insight: ProfitabilityInsight, idx) => {
                      const isEfficiency = insight.type === 'EFFICIENCY'
                      return (
                        <div
                          key={idx}
                          className={`p-md rounded-md border-l-4 ${
                            isEfficiency ? 'bg-success/5 border-success' : 'bg-warning/5 border-warning'
                          }`}
                        >
                          <p
                            className={`text-body-sm-bold uppercase ${
                              isEfficiency ? 'text-success' : 'text-warning'
                            }`}
                          >
                            {insight.title}
                          </p>
                          <p className="text-body-sm-bold text-on-surface-deep mt-xs">{insight.message}</p>
                        </div>
                      )
                    })}
                    {(summary?.insights ?? []).length === 0 && (
                      <p className="text-label-caps uppercase text-on-surface-deep text-center py-sm">
                        {t('bi.profitability.trends.insights.empty', 'No hay insights para este periodo', {})}
                      </p>
                    )}
                  </div>
                </section>

                <section className="bg-surface rounded-md shadow-whisper p-lg" data-testid="margin-watch">
                  <h2 className="text-label-caps uppercase text-foreground">
                    {t('bi.profitability.trends.margins.title', 'Vigilancia de Margen', {})}
                  </h2>
                  <div className="space-y-lg mt-md">
                    {[
                      {
                        label: t('bi.profitability.trends.margins.gross', 'Bruto Promedio', {}),
                        value: summary?.average_gross_margin ?? 0,
                        tone: 'bg-primary',
                      },
                      {
                        label: t('bi.profitability.trends.margins.net', 'Neto Operativo', {}),
                        value: summary?.average_net_margin ?? 0,
                        tone: 'bg-success',
                      },
                    ].map(({ label, value, tone }) => (
                      <div key={label}>
                        <div className="flex justify-between items-end mb-xs">
                          <span className="text-body-sm-bold text-on-surface-deep uppercase">{label}</span>
                          <span className="text-body-md-bold font-data-mono text-data-mono text-foreground">
                            {formatNumber(value)}%
                          </span>
                        </div>
                        <div className="w-full bg-surface-muted rounded-full h-2.5 overflow-hidden border border-border-subtle">
                          <div className={`${tone} h-full rounded-full transition-all duration-300`} style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TrendsProfitability
