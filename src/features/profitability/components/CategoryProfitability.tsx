import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { AlertTriangle, Layers, RefreshCcw, TrendingUp, Wallet } from 'lucide-react'
import { formatNumber } from '@/utils/currencyUtils'
import { useProfitability } from '../hooks/useProfitability'
import KpiCard from './KpiCard'
import PeriodSelector, { type ProfitabilityPeriod } from './PeriodSelector'
import ProfitabilitySkeleton from './ProfitabilitySkeleton'
import type { CategoryProfitabilityData } from '../types'

/**
 * Familias de productos (GET /profitability/categories).
 * Migración FASE 2 (PLAN_ALINEACION_BI_FRONTEND): .tsx + FSD + tokens +
 * i18n. Honestidad de datos: la barra "Ventas" hardcodeada al 90% ahora
 * usa revenue_contribution_pct real, y el trend -5.2 simulado del KPI
 * "Margen Crítico" se elimina. Eliminados: Exportar, buscador sin estado
 * y paginación decorativa (§2.6).
 */

const MARGIN_OK_THRESHOLD = 20

const CategoryProfitability = () => {
  const { t } = useI18n()
  const [period, setPeriod] = useState<ProfitabilityPeriod>('month')
  const { data, loading, error, refresh } = useProfitability<CategoryProfitabilityData>('getCategories', period)

  const categories = data?.categories ?? []
  const summary = data?.summary

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.profitability.breadcrumb', 'Rentabilidad', {})}
          title={t('bi.profitability.categories.title', 'Familias de Productos', {})}
          subtitle={t(
            'bi.profitability.categories.subtitle',
            'Auditoría técnica por línea de negocio. Analice la contribución marginal y el volumen operativo por segmento.',
            {},
          )}
          actions={
            <div className="flex flex-wrap items-center gap-sm">
              <PeriodSelector
                value={period}
                onChange={setPeriod}
                periods={['month', 'quarter', 'year']}
                testId="categories-period-selector"
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

        {!loading && !error && (
          <>
            {/* KPI Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md mt-lg">
              <KpiCard
                title={t('bi.profitability.categories.kpi.leader', 'Líder en Beneficio', {})}
                subtitle={summary?.most_profitable_name}
                value={summary?.most_profitable_value}
                trendValue={summary?.most_profitable_growth}
                icon={TrendingUp}
                tone="success"
                testId="kpi-category-leader"
              />
              <KpiCard
                title={t('bi.profitability.categories.kpi.criticalMargin', 'Margen Crítico', {})}
                subtitle={summary?.least_profitable_name}
                value={summary?.least_profitable_margin}
                isCurrency={false}
                icon={AlertTriangle}
                tone="warning"
                testId="kpi-critical-margin"
              />
              <KpiCard
                title={t('bi.profitability.categories.kpi.total', 'Consolidado Total', {})}
                subtitle={t('bi.profitability.categories.kpi.portfolio', 'Rendimiento de Portafolio', {})}
                value={summary?.total_profit}
                trendValue={summary?.total_profit_growth}
                icon={Wallet}
                isAnchor
                testId="kpi-category-total"
              />
            </section>

            {/* Matriz de desempeño */}
            <section className="bg-surface rounded-md shadow-whisper overflow-hidden mt-xl">
              <div className="px-lg py-md border-b border-border-subtle bg-surface-muted flex items-center gap-md">
                <h2 className="text-label-caps uppercase text-foreground">
                  {t('bi.profitability.categories.table.title', 'Matriz de Desempeño por Familia', {})}
                </h2>
                <span className="px-sm py-0.5 bg-primary/10 text-primary text-body-sm-bold rounded-xs uppercase">
                  {t('bi.profitability.categories.table.liveAudit', 'Auditoría Live', {})}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-surface-muted border-b border-border-subtle text-on-surface-deep text-label-caps uppercase">
                    <tr>
                      <th className="px-lg py-md">{t('bi.profitability.categories.col.category', 'Categoría / Segmento', {})}</th>
                      <th className="px-md py-md text-center">{t('bi.profitability.categories.col.skus', 'SKUs', {})}</th>
                      <th className="px-md py-md text-right">{t('bi.profitability.categories.col.volume', 'Volumen', {})}</th>
                      <th className="px-lg py-md">{t('bi.profitability.categories.col.contribution', 'Contribución Ingresos', {})}</th>
                      <th className="px-lg py-md text-right">{t('bi.profitability.categories.col.grossMargin', 'M. Bruto', {})}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {categories.map((cat) => {
                      const marginOk = (cat.gross_margin_pct ?? 0) >= MARGIN_OK_THRESHOLD
                      return (
                        <tr key={cat.category_id} className="hover:bg-surface-muted transition-colors duration-150">
                          <td className="px-lg py-md">
                            <span className="text-body-md-bold text-foreground uppercase">{cat.category_name}</span>
                          </td>
                          <td className="px-md py-md text-center">
                            <span className="px-sm py-0.5 bg-surface-muted rounded-xs font-data-mono text-data-mono text-on-surface-deep border border-border-subtle">
                              {cat.product_count ?? 0}
                            </span>
                          </td>
                          <td className="px-md py-md text-right text-data-mono font-data-mono text-on-surface-deep">
                            {cat.units_sold ?? 0}
                          </td>
                          <td className="px-lg py-md">
                            <div className="flex items-center gap-md">
                              <div className="w-48 bg-surface-muted h-1.5 rounded-full overflow-hidden">
                                <div className="bg-primary/30 h-full" style={{ width: `${cat.revenue_contribution_pct ?? 0}%` }} />
                              </div>
                              <span className="text-body-sm-bold font-data-mono text-data-mono text-on-surface-deep w-12">
                                {formatNumber(cat.revenue_contribution_pct ?? 0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-lg py-md">
                            <div className="flex flex-col items-end gap-xs">
                              <span
                                className={`text-body-md font-data-mono text-data-mono ${
                                  marginOk ? 'text-success' : 'text-error'
                                }`}
                              >
                                {formatNumber(cat.gross_margin_pct ?? 0)}%
                              </span>
                              <div className="w-24 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${marginOk ? 'bg-success' : 'bg-error'}`}
                                  style={{ width: `${cat.gross_margin_pct ?? 0}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {categories.length === 0 && (
                <EmptyState
                  icon={Layers}
                  title={t('bi.profitability.categories.emptyTitle', 'Sin datos de categorías', {})}
                  description={t(
                    'bi.profitability.categories.emptyDescription',
                    'No hay familias registradas para este período.',
                    {},
                  )}
                  actionLabel={t('bi.profitability.action.refresh', 'Actualizar', {})}
                  onAction={refresh}
                />
              )}

              <div className="px-lg py-md border-t border-border-subtle bg-surface-muted">
                <p className="text-label-caps uppercase text-on-surface-deep">
                  {t('bi.profitability.categories.auditedCount', 'Familias auditadas', {})}:{' '}
                  <span className="text-data-mono font-data-mono">{categories.length}</span>
                </p>
              </div>
            </section>

            {/* Eficiencia de portafolio */}
            <section className="bg-surface rounded-md shadow-whisper p-lg mt-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-lg gap-md">
                <div className="flex items-center gap-md">
                  <div className="p-sm bg-primary/10 rounded-md text-primary">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-title-md text-foreground uppercase">
                      {t('bi.profitability.categories.efficiency.title', 'Eficiencia de Portafolio', {})}
                    </h2>
                    <p className="text-body-md text-on-surface-deep mt-xs">
                      {t(
                        'bi.profitability.categories.efficiency.subtitle',
                        'Correlación Ingresos vs Beneficio Bruto por Categoría',
                        {},
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-lg text-label-caps uppercase text-on-surface-deep">
                  <span className="flex items-center gap-xs">
                    <span className="size-2.5 rounded-xs bg-primary/20" aria-hidden="true" />
                    {t('bi.profitability.categories.efficiency.sales', 'Ventas', {})}
                  </span>
                  <span className="flex items-center gap-xs text-success">
                    <span className="size-2.5 rounded-xs bg-success" aria-hidden="true" />
                    {t('bi.profitability.categories.efficiency.profit', 'Profit', {})}
                  </span>
                </div>
              </div>

              {categories.length === 0 ? (
                <EmptyState
                  icon={Layers}
                  title={t('bi.profitability.categories.efficiency.emptyTitle', 'Sin correlación disponible', {})}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-xl gap-y-lg" data-testid="portfolio-efficiency">
                  {categories.slice(0, 4).map((cat) => (
                    <div key={cat.category_id} className="space-y-md">
                      <div className="flex justify-between items-end">
                        <span className="text-body-md-bold text-foreground uppercase">{cat.category_name}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-body-sm-bold font-data-mono text-data-mono text-on-surface-deep uppercase">
                            Gs. {formatNumber(cat.revenue ?? 0)}
                          </span>
                          <span className="text-body-sm-bold font-data-mono text-data-mono text-success uppercase">
                            +{formatNumber(cat.gross_margin_pct ?? 0)}% MG.
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-sm">
                        {/* Antes hardcodeada al 90%: ahora la contribución real */}
                        <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden border border-border-subtle">
                          <div className="bg-primary/20 h-full rounded-full" style={{ width: `${cat.revenue_contribution_pct ?? 0}%` }} />
                        </div>
                        <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden border border-border-subtle">
                          <div
                            className="bg-success h-full rounded-full transition-all duration-300"
                            style={{ width: `${cat.gross_margin_pct ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default CategoryProfitability
