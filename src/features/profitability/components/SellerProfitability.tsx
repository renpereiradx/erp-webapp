import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { Award, BarChart3, PieChart, RefreshCcw, TrendingUp, UserCheck } from 'lucide-react'
import { formatNumber } from '@/utils/currencyUtils'
import { formatCompactPYG } from '@/domain/profitability/margins'
import { useProfitability } from '../hooks/useProfitability'
import KpiCard from './KpiCard'
import PeriodSelector, { type ProfitabilityPeriod } from './PeriodSelector'
import ProfitabilitySkeleton from './ProfitabilitySkeleton'
import {
  contributionDonutGeometry,
  marginBarWidth,
} from '@/domain/profitability/margins'
import type { SellerProfitabilityData } from '../types'

/**
 * Desempeño de ventas (GET /profitability/sellers).
 * Migración FASE 2 (PLAN_ALINEACION_BI_FRONTEND): .tsx + FSD + tokens
 * DESIGN + i18n + dominio (formatCompactPYG, donut geometry, marginBar).
 * Eliminado del legacy: botón Exportar sin handler, buscador de ranking
 * sin estado, paginación decorativa y el ID fabricado 'ES-7xx'.
 */

const DONUT_COLORS = ['stroke-primary', 'stroke-primary-container', 'stroke-secondary', 'stroke-divider'] as const
const LEGEND_DOTS = ['bg-primary', 'bg-primary-container', 'bg-secondary', 'bg-surface-muted'] as const

const SellerProfitability = () => {
  const { t } = useI18n()
  const [period, setPeriod] = useState<ProfitabilityPeriod>('month')
  const { data, loading, error, refresh } = useProfitability<SellerProfitabilityData>('getSellers', period)

  const sellers = data?.sellers ?? []
  const summary = data?.summary
  const contributionShare = data?.contribution_share ?? []
  const topSeller = sellers.find((s) => s.rank === 1) || sellers[0]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.profitability.breadcrumb', 'Rentabilidad', {})}
          title={t('bi.profitability.sellers.title', 'Desempeño de Ventas', {})}
          subtitle={t(
            'bi.profitability.sellers.subtitle',
            'Auditoría de contribución marginal por ejecutivo. Monitoreo de cuotas de beneficio y eficiencia en el cierre de operaciones.',
            {},
          )}
          actions={
            <div className="flex flex-wrap items-center gap-sm">
              <PeriodSelector
                value={period}
                onChange={setPeriod}
                periods={['month', 'quarter', 'year']}
                testId="sellers-period-selector"
              />
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

        {!loading && !error && sellers.length === 0 && (
          <div className="mt-lg">
            <EmptyState
              icon={Award}
              title={t('bi.profitability.sellers.emptyTitle', 'Sin datos de vendedores', {})}
              description={t(
                'bi.profitability.sellers.emptyDescription',
                'No hay desempeño comercial registrado para este período.',
                {},
              )}
              actionLabel={t('bi.profitability.action.refresh', 'Actualizar', {})}
              onAction={refresh}
            />
          </div>
        )}

        {!loading && !error && sellers.length > 0 && (
          <>
            {/* KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md mt-lg">
              <KpiCard
                title={t('bi.profitability.sellers.kpi.avgProfit', 'Promedio Beneficio', {})}
                value={summary?.average_profit_per_seller}
                trendValue={summary?.profit_growth}
                icon={TrendingUp}
                tone="success"
                testId="kpi-avg-profit"
              />
              <KpiCard
                title={t('bi.profitability.sellers.kpi.topSeller', 'Top Vendedor', {})}
                subtitle={topSeller?.seller_name ?? undefined}
                value={topSeller?.gross_profit}
                trendValue={0}
                icon={UserCheck}
                isAnchor
                testId="kpi-top-seller"
              />
              <div className="bg-surface border border-border-subtle rounded-md shadow-whisper p-lg flex flex-col gap-md" data-testid="kpi-operating-margin">
                <p className="text-label-caps uppercase text-on-surface-deep">
                  {t('bi.profitability.sellers.kpi.avgOperatingMargin', 'Margen Operativo Promedio', {})}
                </p>
                <div className="flex items-end gap-md">
                  <span className="text-headline-lg font-data-mono text-data-mono tracking-tight text-foreground">
                    {formatNumber(summary?.average_operating_margin ?? 0)}%
                  </span>
                  <div className="flex-1 h-2.5 bg-surface-muted rounded-full overflow-hidden border border-border-subtle">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${summary?.average_operating_margin ?? 0}%` }}
                    />
                  </div>
                </div>
                <p className="text-body-sm-bold text-on-surface-deep uppercase">
                  {t('bi.profitability.sellers.kpi.objective', 'Objetivo corporativo', {})}:{' '}
                  <span className="text-data-mono font-data-mono">
                    {formatNumber(summary?.margin_objective ?? 0)}%
                  </span>
                </p>
              </div>
            </section>

            {/* Ranking */}
            <section className="bg-surface rounded-md shadow-whisper overflow-hidden mt-xl">
              <div className="px-lg py-md border-b border-border-subtle bg-surface-muted flex items-center gap-md">
                <h2 className="text-label-caps uppercase text-foreground">
                  {t('bi.profitability.sellers.ranking.title', 'Ranking de Desempeño Comercial', {})}
                </h2>
                <span className="px-sm py-0.5 bg-primary/10 text-primary text-body-sm-bold rounded-xs uppercase">
                  {t('bi.profitability.sellers.ranking.audited', 'Auditado', {})}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-surface-muted text-on-surface-deep text-label-caps uppercase border-b border-border-subtle">
                      <th className="px-lg py-md w-20">{t('bi.profitability.sellers.col.rank', 'Rank', {})}</th>
                      <th className="px-md py-md">{t('bi.profitability.sellers.col.executive', 'Ejecutivo de Cuentas', {})}</th>
                      <th className="px-md py-md text-center">{t('bi.profitability.sellers.col.transactions', 'Transacciones', {})}</th>
                      <th className="px-md py-md text-right">{t('bi.profitability.sellers.col.revenue', 'Ingresos', {})}</th>
                      <th className="px-md py-md text-right">{t('bi.profitability.sellers.col.netProfit', 'Beneficio Neto', {})}</th>
                      <th className="px-lg py-md text-center">{t('bi.profitability.sellers.col.grossMargin', 'M. Bruto %', {})}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {sellers.map((s, idx) => (
                      <tr key={idx} className="hover:bg-surface-muted transition-colors duration-150">
                        <td className="px-lg py-md">
                          <span
                            className={`flex items-center justify-center size-8 rounded-sm text-body-md-bold font-data-mono ${
                              s.rank === 1
                                ? 'bg-warning/10 text-warning border border-warning/20'
                                : 'bg-surface-muted text-on-surface-deep border border-border-subtle'
                            }`}
                          >
                            {s.rank}
                          </span>
                        </td>
                        <td className="px-md py-md">
                          <div className="flex items-center gap-md">
                            <div className="size-10 rounded-full bg-surface-muted flex items-center justify-center border border-border-subtle text-on-surface-deep">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <span className="text-body-md-bold text-foreground uppercase">
                              {s.seller_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-md py-md text-center text-data-mono font-data-mono text-on-surface-deep">
                          {s.total_sales ?? 0}
                        </td>
                        <td className="px-md py-md text-right text-data-mono font-data-mono text-foreground">
                          {formatNumber(s.total_revenue ?? 0)}
                        </td>
                        <td className="px-md py-md text-right text-data-mono font-data-mono text-success">
                          {formatNumber(s.gross_profit ?? 0)}
                        </td>
                        <td className="px-lg py-md text-center">
                          <span className="bg-primary/10 text-primary text-body-sm-bold font-data-mono px-sm py-0.5 rounded-xs uppercase">
                            {formatNumber(s.gross_margin_pct ?? 0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-lg py-md border-t border-border-subtle bg-surface-muted">
                <p className="text-label-caps uppercase text-on-surface-deep">
                  {t('bi.profitability.sellers.ranking.activeCount', 'Ejecutivos activos', {})}:{' '}
                  <span className="text-data-mono font-data-mono">{sellers.length}</span>
                </p>
              </div>
            </section>

            {/* Visual analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mt-xl">
              {/* Cuota de beneficio (donut) */}
              <section className="bg-surface p-lg rounded-md shadow-whisper">
                <div className="flex items-center gap-md mb-lg">
                  <div className="p-sm bg-primary/10 rounded-md text-primary">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <h2 className="text-title-md text-foreground uppercase">
                    {t('bi.profitability.sellers.share.title', 'Cuota de Beneficio', {})}
                  </h2>
                </div>

                {contributionShare.length === 0 ? (
                  <EmptyState
                    icon={PieChart}
                    title={t('bi.profitability.sellers.share.emptyTitle', 'Sin cuotas calculadas', {})}
                    description={t(
                      'bi.profitability.sellers.share.emptyDescription',
                      'No hay contribución marginal para este período.',
                      {},
                    )}
                  />
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-lg">
                    <div className="relative size-40 shrink-0">
                      <svg className="size-full -rotate-90" viewBox="0 0 100 100" role="img" aria-label={t('bi.profitability.sellers.share.title', 'Cuota de Beneficio', {})}>
                        <circle cx="50" cy="50" r="42" fill="transparent" className="stroke-surface-muted" strokeWidth="14" />
                        {contributionShare.map((item, i) => {
                          const preceding = contributionShare.slice(0, i).reduce((acc, it) => acc + (it.pct || 0), 0)
                          const geo = contributionDonutGeometry(item.pct, preceding)
                          return (
                            <circle
                              key={i}
                              cx="50" cy="50" r="42"
                              fill="transparent"
                              className={`${DONUT_COLORS[i % DONUT_COLORS.length]} transition-all duration-300`}
                              strokeWidth="14"
                              strokeDasharray={geo.dashArray}
                              strokeDashoffset={geo.dashOffset}
                              transform={`rotate(${geo.rotation} 50 50)`}
                              strokeLinecap={geo.lineCap}
                            />
                          )
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-label-caps uppercase text-on-surface-deep">
                          {t('bi.profitability.sellers.share.netTotal', 'Neto Total', {})}
                        </span>
                        <span className="text-title-md font-data-mono text-data-mono text-foreground mt-xs">
                          {formatCompactPYG(summary?.total_profit)}
                        </span>
                      </div>
                    </div>

                    <ul className="flex-1 w-full space-y-md">
                      {contributionShare.map((item, i) => (
                        <li key={i} className="flex items-center justify-between p-sm rounded-sm hover:bg-surface-muted transition-colors duration-150">
                          <div className="flex items-center gap-md">
                            <span className={`size-4 rounded-xs ${LEGEND_DOTS[i % LEGEND_DOTS.length]}`} aria-hidden="true" />
                            <span className="text-body-md-bold text-foreground uppercase truncate max-w-44">
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-md">
                            <span className="text-body-md font-data-mono text-data-mono text-foreground">
                              {formatNumber(item.pct ?? 0)}%
                            </span>
                            <div className="w-20 h-2 bg-surface-muted rounded-full overflow-hidden border border-border-subtle">
                              <div
                                className={`h-full rounded-full ${LEGEND_DOTS[i % LEGEND_DOTS.length]}`}
                                style={{ width: `${item.pct ?? 0}%` }}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Matriz de eficiencia (top 4) */}
              <section className="bg-surface p-lg rounded-md shadow-whisper">
                <div className="flex items-center gap-md mb-lg">
                  <div className="p-sm bg-success/10 rounded-md text-success">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h2 className="text-title-md text-foreground uppercase">
                    {t('bi.profitability.sellers.matrix.title', 'Matriz de Eficiencia', {})}
                  </h2>
                </div>

                <div className="space-y-lg">
                  {sellers.slice(0, 4).map((s, i) => (
                    <div key={i} className="space-y-sm">
                      <div className="flex justify-between text-body-sm-bold text-on-surface-deep uppercase">
                        <span className="text-body-md-bold text-foreground">{s.seller_name}</span>
                        <span className="font-data-mono text-data-mono text-foreground">
                          {formatNumber(s.gross_margin_pct ?? 0)}%{' '}
                          {t('bi.profitability.sellers.matrix.marginAbbr', 'M.B.', {})}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-surface-muted rounded-full overflow-hidden border border-border-subtle">
                        <div
                          className="h-full bg-success rounded-full transition-all duration-300 origin-left"
                          style={{ width: `${marginBarWidth(s.gross_margin_pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SellerProfitability
