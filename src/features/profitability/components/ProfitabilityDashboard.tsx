import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { Activity, AlertTriangle, PackageSearch, RefreshCcw, Target, TrendingUp, Zap } from 'lucide-react'
import { formatNumber } from '@/utils/currencyUtils'
import { useProfitability } from '../hooks/useProfitability'
import KpiCard from './KpiCard'
import PeriodSelector, { type ProfitabilityPeriod } from './PeriodSelector'
import ProfitabilitySkeleton from './ProfitabilitySkeleton'
import type { DashboardData } from '../types'

/**
 * Dashboard Financiero de rentabilidad (GET /profitability/dashboard).
 * Migración FASE 2 (PLAN_ALINEACION_BI_FRONTEND): .tsx + FSD + tokens
 * DESIGN + i18n bi.profitability.* + 3 estados de datos. Los widgets sin
 * handler del legacy (botón "Ver Auditoría Completa") se eliminaron (§2.6).
 */
const ProfitabilityDashboard = () => {
  const { t } = useI18n()
  const [period, setPeriod] = useState<ProfitabilityPeriod>('month')
  const { data, loading, error, refresh } = useProfitability<DashboardData>('getDashboard', period)

  const kpis = data?.kpis
  const breakEven = data?.break_even_status
  const alerts = data?.alerts ?? []
  const trendPoints = data?.efficiency_trend?.data_points ?? []

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.profitability.breadcrumb', 'Rentabilidad', {})}
          title={t('bi.profitability.dashboard.title', 'Dashboard Financiero', {})}
          subtitle={t(
            'bi.profitability.dashboard.subtitle',
            'Métricas de rentabilidad y eficiencia operativa. Datos actualizados en tiempo real bajo estándares de auditoría corporativa.',
            {},
          )}
          actions={
            <div className="flex flex-wrap items-center gap-sm">
              <PeriodSelector value={period} onChange={setPeriod} testId="dashboard-period-selector" />
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

        {loading && <ProfitabilitySkeleton kpiCount={6} />}

        {!loading && error && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.profitability.errorTitle', 'No se pudo cargar la rentabilidad', {})}
              message={error}
              onRetry={refresh}
            />
          </div>
        )}

        {!loading && !error && !kpis && (
          <div className="mt-lg">
            <EmptyState
              icon={PackageSearch}
              title={t('bi.profitability.dashboard.emptyTitle', 'Sin datos de rentabilidad', {})}
              description={t(
                'bi.profitability.dashboard.emptyDescription',
                'No hay métricas disponibles para este período.',
                {},
              )}
              actionLabel={t('bi.profitability.action.refresh', 'Actualizar', {})}
              onAction={refresh}
            />
          </div>
        )}

        {!loading && !error && kpis && (
          <>
            {/* KPI grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-md mt-lg" aria-busy={loading}>
              <KpiCard
                title={t('bi.profitability.kpi.totalRevenue', 'Ingresos Totales', {})}
                value={kpis.total_revenue}
                trendValue={kpis.revenue_growth}
                icon={Activity}
                tone="primary"
                testId="kpi-total-revenue"
              />
              <KpiCard
                title={t('bi.profitability.kpi.grossProfit', 'Profit Bruto', {})}
                value={kpis.total_profit}
                trendValue={kpis.profit_growth}
                icon={TrendingUp}
                tone="success"
                testId="kpi-gross-profit"
              />
              <KpiCard
                title={t('bi.profitability.kpi.grossMargin', 'Margen Bruto', {})}
                value={kpis.gross_margin_pct}
                trendValue={kpis.gross_margin_growth}
                isCurrency={false}
                icon={Target}
                tone="info"
                testId="kpi-gross-margin"
              />
              <KpiCard
                title={t('bi.profitability.kpi.netMargin', 'Margen Neto', {})}
                value={kpis.net_margin_pct}
                trendValue={kpis.net_margin_growth}
                isCurrency={false}
                icon={Zap}
                tone="warning"
                testId="kpi-net-margin"
              />
              <KpiCard
                title={t('bi.profitability.kpi.roi', 'ROI Auditado', {})}
                value={kpis.roi}
                trendValue={kpis.roi_growth}
                isCurrency={false}
                icon={TrendingUp}
                tone="primary"
                testId="kpi-roi"
              />
              <KpiCard
                title={t('bi.profitability.kpi.profitPerTx', 'Profit / Tx', {})}
                value={kpis.profit_per_transaction}
                trendValue={kpis.profit_per_tx_growth}
                icon={Activity}
                tone="success"
                testId="kpi-profit-per-tx"
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mt-xl">
              {/* Tendencia de eficiencia */}
              <section className="lg:col-span-2 bg-surface rounded-md shadow-whisper p-lg">
                <div className="flex flex-wrap items-center justify-between gap-md">
                  <div>
                    <h2 className="text-title-md text-foreground">
                      {t('bi.profitability.dashboard.chart.title', 'Tendencia de Eficiencia', {})}
                    </h2>
                    <p className="text-body-md text-on-surface-deep mt-xs">
                      {t(
                        'bi.profitability.dashboard.chart.subtitle',
                        'Correlación flujo de caja vs margen real neto por mes',
                        {},
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-md">
                    <span className="flex items-center gap-xs text-body-sm-bold text-on-surface-deep">
                      <span className="size-2.5 rounded-full bg-primary/30" aria-hidden="true" />
                      {t('bi.profitability.dashboard.chart.revenue', 'Ingresos', {})}
                    </span>
                    <span className="flex items-center gap-xs text-body-sm-bold text-success">
                      <span className="size-2.5 rounded-full bg-success" aria-hidden="true" />
                      {t('bi.profitability.dashboard.chart.profit', 'Profit Real', {})}
                    </span>
                  </div>
                </div>

                {trendPoints.length === 0 ? (
                  <div className="mt-lg">
                    <EmptyState
                      icon={TrendingUp}
                      title={t('bi.profitability.dashboard.chart.emptyTitle', 'Sin series de eficiencia', {})}
                      description={t(
                        'bi.profitability.dashboard.chart.emptyDescription',
                        'No hay puntos mensuales para este período.',
                        {},
                      )}
                    />
                  </div>
                ) : (
                  <div className="h-80 flex items-end justify-between gap-sm mt-lg" data-testid="efficiency-chart">
                    {trendPoints.map((dp, i) => {
                      const performance = dp.performance ?? 0
                      const profitPct = dp.profit_pct ?? 0
                      const profitShare = performance > 0 ? (profitPct / performance) * 100 : 0
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-sm h-full justify-end">
                          <div
                            className="w-full max-w-10 h-60 flex items-end relative rounded-t-sm overflow-hidden bg-surface-muted"
                            title={`${t('bi.profitability.dashboard.chart.revenue', 'Ingresos', {})}: ${formatNumber(performance)}% · ${t('bi.profitability.dashboard.chart.profit', 'Profit Real', {})}: ${formatNumber(profitPct)}%`}
                          >
                            <div className="w-full bg-primary/20" style={{ height: `${performance}%` }}>
                              <div
                                className="absolute bottom-0 left-0 w-full bg-success rounded-t-sm"
                                style={{ height: `${profitShare}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-body-sm-bold text-on-surface-deep text-data-mono font-data-mono truncate max-w-full">
                            {dp.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Sidebar: break-even + alertas */}
              <div className="space-y-lg">
                <section className="bg-primary text-on-primary rounded-md shadow-whisper p-lg" data-testid="break-even-widget">
                  <div className="flex justify-between items-start gap-sm">
                    <h2 className="text-label-caps uppercase opacity-80">
                      {t('bi.profitability.dashboard.breakeven.title', 'Equilibrio Corporativo', {})}
                    </h2>
                    <div className="p-sm bg-white/15 rounded-sm">
                      <Target className="w-5 h-5" />
                    </div>
                  </div>

                  <p className="text-headline-lg-mobile tracking-tight mt-md">
                    {breakEven?.has_reached_break_even
                      ? t('bi.profitability.dashboard.breakeven.reached', 'Objetivo Superado', {})
                      : t('bi.profitability.dashboard.breakeven.missing', 'Falta Cobertura', {})}
                  </p>
                  <p className="text-body-md opacity-80 mt-sm">
                    {breakEven?.has_reached_break_even
                      ? t(
                          'bi.profitability.dashboard.breakeven.reachedHint',
                          'La organización mantiene márgenes positivos sobre el punto de equilibrio operativo.',
                          {},
                        )
                      : t(
                          'bi.profitability.dashboard.breakeven.missingHint',
                          'Se requiere alcanzar un margen adicional del {pct}%.',
                          { pct: formatNumber(breakEven?.coverage_required ?? 0) },
                        )}
                  </p>

                  <div className="mt-lg space-y-md">
                    <div
                      className="w-full bg-black/20 h-3 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={Math.round(breakEven?.current_progress ?? 0)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="bg-on-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${breakEven?.current_progress ?? 0}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-md border-t border-white/15 pt-md">
                      <div>
                        <p className="text-label-caps uppercase opacity-70">
                          {t('bi.profitability.dashboard.breakeven.progress', 'Progreso', {})}
                        </p>
                        <p className="text-title-md font-data-mono text-data-mono mt-xs">
                          {formatNumber(breakEven?.current_progress ?? 0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-label-caps uppercase opacity-70">
                          {t('bi.profitability.dashboard.breakeven.roi', 'ROI Auditado', {})}
                        </p>
                        <p className="text-title-md font-data-mono text-data-mono mt-xs">
                          +{formatNumber(kpis.roi ?? 0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-surface rounded-md shadow-whisper overflow-hidden" data-testid="risk-alerts">
                  <div className="p-md border-b border-border-subtle flex justify-between items-center bg-surface-muted">
                    <h2 className="text-label-caps uppercase text-foreground flex items-center gap-sm">
                      <AlertTriangle className="w-5 h-5 text-error" />
                      {t('bi.profitability.dashboard.alerts.title', 'Alertas de Riesgo', {})}
                    </h2>
                    <span className="size-2.5 rounded-full bg-error animate-pulse" aria-hidden="true" />
                  </div>

                  {alerts.length === 0 ? (
                    <EmptyState
                      icon={AlertTriangle}
                      title={t('bi.profitability.dashboard.alerts.emptyTitle', 'Sin alertas de riesgo', {})}
                      description={t(
                        'bi.profitability.dashboard.alerts.emptyDescription',
                        'No hay alertas activas para este período.',
                        {},
                      )}
                    />
                  ) : (
                    <ul className="divide-y divide-border-subtle">
                      {alerts.map((alert, i) => {
                        const isHigh = alert.severity === 'HIGH'
                        return (
                          <li key={i} className="relative flex flex-col p-md hover:bg-surface-muted transition-colors duration-150">
                            <span
                              className={`absolute left-0 top-0 bottom-0 w-1.5 ${isHigh ? 'bg-error' : 'bg-primary'} rounded-r-xs`}
                              aria-hidden="true"
                            />
                            <div className="flex items-center justify-between mb-xs">
                              <span
                                className={`text-body-sm-bold uppercase px-sm py-0.5 rounded-xs ${
                                  isHigh ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                                }`}
                              >
                                {alert.severity || 'INFO'}
                              </span>
                              <span className="text-body-sm-bold text-on-surface-deep text-data-mono font-data-mono">
                                {alert.time_ago}
                              </span>
                            </div>
                            <p className="text-body-md-bold text-foreground">{alert.type}</p>
                            <p className="text-body-md text-on-surface-deep mt-xs">{alert.message}</p>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ProfitabilityDashboard
