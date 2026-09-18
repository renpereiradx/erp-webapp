import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useIncomeStatement } from '@/features/financial-reports/hooks/useFinancialReports';
import { formatPYG } from '@/utils/currencyUtils';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { FileText, TrendingDown, TrendingUp } from 'lucide-react';

/**
 * Estado de Resultados (P&L).
 * Migración FASE 6: .tsx + PageHeader + 3 estados (el legacy hacía
 * `return null` sin datos). Honesty: el donut decorativo que siempre
 * mostraba "100%" (no reflejaba datos) se eliminó — la composición real
 * por categoría queda en la lista con barras; el chip "FAVORABLE" fijo
 * ahora depende del signo real de la variación; botones 'Mes Actual'
 * (estático) y 'Exportar PDF' (sin handler) fuera.
 */
const ProfitAndLoss = () => {
  const { t } = useI18n();
  const { loading, incomeStatement, error, fetchIncomeStatement } = useIncomeStatement();

  useEffect(() => {
    document.title = t('bi.pnl.docTitle', 'Estado de Resultados | ERP System', {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [t]);

  useEffect(() => {
    fetchIncomeStatement('month', true);
  }, [fetchIncomeStatement]);

  const {
    revenue,
    cost_of_sales,
    gross_profit,
    operating_income,
    net_income,
    comparison,
  } = incomeStatement ?? ({} as any);

  const netMarginGap = comparison?.net_margin_gap ?? 0;
  const favorable = netMarginGap >= 0;

  const ChangeBadge = ({ pct }: { pct?: number }) => {
    if (!pct) return null;
    const up = pct >= 0;
    return (
      <span className={`text-xs font-bold flex items-center ${up ? 'text-success' : 'text-error'}`}>
        {up ? <TrendingUp size={14} className="mr-0.5" /> : <TrendingDown size={14} className="mr-0.5" />}
        {Math.abs(pct)}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.payables.breadcrumb', 'Finanzas', {})}
          title={t('bi.pnl.title', 'Estado de Resultados (P&L)', {})}
          subtitle={t('bi.pnl.subtitle', 'Periodo: mes actual vs periodo anterior', {})}
          actions={
            <button
              type="button"
              onClick={() => fetchIncomeStatement('month', true)}
              className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
            >
              {t('bi.profitability.action.refresh', 'Actualizar', {})}
            </button>
          }
        />

        {loading && !incomeStatement && (
          <div className="mt-lg space-y-lg" aria-busy="true" data-testid="pnl-skeleton">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-surface-muted rounded-md animate-pulse" />
              ))}
            </div>
            <div className="h-72 bg-surface-muted rounded-md animate-pulse" />
            <GenericSkeletonList count={5} data-testid="page-skeleton-list" />
          </div>
        )}

        {!loading && error && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.pnl.errorTitle', 'No se pudo cargar el estado de resultados', {})}
              message={error}
              onRetry={() => fetchIncomeStatement('month', true)}
            />
          </div>
        )}

        {!loading && !error && !incomeStatement && (
          <div className="mt-lg">
            <EmptyState
              icon={FileText}
              title={t('bi.pnl.emptyTitle', 'Sin datos de resultados', {})}
              description={t('bi.pnl.emptyBody', 'No hay estados de resultados para el período actual.', {})}
              actionLabel={t('bi.profitability.action.refresh', 'Actualizar', {})}
              onAction={() => fetchIncomeStatement('month', true)}
            />
          </div>
        )}

        {!loading && !error && incomeStatement && (
          <>
            {/* Summary Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mt-lg">
              <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper">
                <p className="text-body-md text-on-surface-deep mb-xs">{t('bi.pnl.kpi.revenue', 'Ingresos Totales', {})}</p>
                <div className="flex items-baseline gap-sm">
                  <p className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">{formatPYG(revenue.net_sales)}</p>
                  <ChangeBadge pct={comparison?.revenue_change_pct} />
                </div>
              </div>
              <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper">
                <p className="text-body-md text-on-surface-deep mb-xs">{t('bi.pnl.kpi.grossProfit', 'Utilidad Bruta', {})}</p>
                <div className="flex items-baseline gap-sm">
                  <p className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">{formatPYG(gross_profit.amount)}</p>
                  <ChangeBadge pct={comparison?.gross_profit_change_pct} />
                </div>
              </div>
              <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper">
                <p className="text-body-md text-on-surface-deep mb-xs">{t('bi.pnl.kpi.operatingProfit', 'Utilidad Operativa', {})}</p>
                <div className="flex items-baseline gap-sm">
                  <p className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">{formatPYG(operating_income)}</p>
                  <ChangeBadge pct={comparison?.operating_income_change_pct} />
                </div>
              </div>
              <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper">
                <p className="text-body-md text-on-surface-deep mb-xs">{t('bi.pnl.kpi.netProfit', 'Utilidad Neta', {})}</p>
                <div className="flex items-baseline gap-sm">
                  <p className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">{formatPYG(net_income)}</p>
                  <ChangeBadge pct={comparison?.net_income_change_pct} />
                </div>
              </div>
            </section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mt-lg">
              <div className="lg:col-span-2 flex flex-col gap-md">
                {/* Cálculo de Utilidad Bruta */}
                <div className="bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden">
                  <div className="px-md py-sm border-b border-border-subtle flex justify-between items-center bg-surface-muted">
                    <h3 className="text-body-md-bold text-foreground">{t('bi.pnl.grossCalc.title', 'Cálculo de Utilidad Bruta', {})}</h3>
                    <span className="text-label-caps uppercase text-on-surface-deep">
                      {t('bi.pnl.guaraniNote', 'Montos en Guaraníes', {})}
                    </span>
                  </div>
                  <div className="p-md overflow-x-auto">
                    <table className="w-full text-body-md">
                      <thead>
                        <tr className="text-on-surface-deep font-bold border-b border-border-subtle">
                          <th className="text-left pb-sm uppercase text-label-caps">{t('bi.pnl.col.concept', 'Concepto', {})}</th>
                          <th className="text-right pb-sm uppercase text-label-caps">{t('bi.pnl.col.current', 'Monto Actual', {})}</th>
                          <th className="text-right pb-sm uppercase text-label-caps">{t('bi.pnl.col.prev', 'Periodo Ant.', {})}</th>
                          <th className="text-right pb-sm uppercase text-label-caps">{t('bi.pnl.col.change', 'Variación', {})}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        <tr>
                          <td className="py-sm text-foreground">{t('bi.pnl.row.grossSales', 'Ventas Brutas', {})}</td>
                          <td className="py-sm text-right font-data-mono text-data-mono text-foreground">{formatPYG(revenue.gross_sales)}</td>
                          <td className="py-sm text-right text-on-surface-deep">-</td>
                          <td className="py-sm text-right text-success font-bold">-</td>
                        </tr>
                        <tr>
                          <td className="py-sm text-foreground">
                            {t('bi.pnl.row.returns', 'Devoluciones y Descuentos', {})}
                          </td>
                          <td className="py-sm text-right font-data-mono text-data-mono text-error">
                            ({formatPYG((revenue.returns ?? 0) + (revenue.discounts ?? 0), { showSymbol: false })})
                          </td>
                          <td className="py-sm text-right text-on-surface-deep">-</td>
                          <td className="py-sm text-right text-error font-bold">-</td>
                        </tr>
                        <tr className="bg-surface-muted">
                          <td className="py-sm font-data-mono text-data-mono text-primary">{t('bi.pnl.row.netSales', 'Ventas Netas', {})}</td>
                          <td className="py-sm text-right font-data-mono text-data-mono text-primary">{formatPYG(revenue.net_sales)}</td>
                          <td className="py-sm text-right text-on-surface-deep font-data-mono text-data-mono">
                            {formatPYG(comparison?.previous_period?.net_sales || 0)}
                          </td>
                          <td className="py-sm text-right text-success font-bold font-data-mono text-data-mono">
                            +{comparison?.revenue_change_pct}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-sm text-foreground">{t('bi.pnl.row.cogs', 'Costo de Ventas (COGS)', {})}</td>
                          <td className="py-sm text-right font-data-mono text-data-mono text-error">
                            ({formatPYG(cost_of_sales.cost_of_goods_sold, { showSymbol: false })})
                          </td>
                          <td className="py-sm text-right text-on-surface-deep font-data-mono text-data-mono">
                            ({formatPYG(comparison?.previous_period?.cost_of_goods_sold || 0, { showSymbol: false })})
                          </td>
                          <td className="py-sm text-right text-error font-bold">-</td>
                        </tr>
                        <tr className="border-t-2 border-primary/20 bg-primary/5">
                          <td className="py-md font-data-mono text-data-mono text-primary text-body-lg tracking-tight">
                            {t('bi.pnl.row.grossProfit', 'Utilidad Bruta', {})}
                          </td>
                          <td className="py-md text-right font-data-mono text-data-mono text-primary text-body-lg tracking-tight">
                            {formatPYG(gross_profit.amount)}
                          </td>
                          <td className="py-md text-right text-on-surface-deep font-data-mono text-data-mono">
                            {formatPYG(comparison?.previous_period?.gross_profit || 0)}
                          </td>
                          <td className="py-md text-right text-success font-bold font-data-mono text-data-mono">
                            {comparison?.gross_profit_change_pct >= 0 ? '+' : ''}
                            {comparison?.gross_profit_change_pct}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Variación por Categoría */}
                <div className="bg-surface rounded-md border border-border-subtle shadow-whisper p-md">
                  <h3 className="text-body-md-bold text-foreground mb-md uppercase text-label-caps">
                    {t('bi.pnl.byCategory', 'Variación por Categoría', {})}
                  </h3>
                  <div className="space-y-md">
                    {(revenue.by_category ?? []).map((cat: any, index: number) => {
                      const tones = ['bg-primary', 'bg-success', 'bg-error'];
                      return (
                        <div key={cat.category_id || index} className="flex flex-col gap-xs">
                          <div className="flex justify-between text-body-sm-bold">
                            <span className="text-foreground uppercase">{cat.category_name}</span>
                            <span className="text-foreground font-data-mono text-data-mono">
                              {formatPYG(cat.amount)} ({cat.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${tones[index % tones.length]} rounded-full`}
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-md">
                {/* Revenue Breakdown — el donut decorativo "100%" fue eliminado:
                    no reflejaba datos; la composición real es esta lista. */}
                <div className="bg-surface rounded-md border border-border-subtle shadow-whisper p-md">
                  <h3 className="text-body-md-bold text-foreground mb-sm uppercase text-label-caps">
                    {t('bi.pnl.revenueBreakdown', 'Revenue Breakdown', {})}
                  </h3>
                  <div className="space-y-sm">
                    {(revenue.by_category ?? []).map((cat: any, index: number) => {
                      const dots = ['bg-primary', 'bg-success', 'bg-warning'];
                      return (
                        <div key={cat.category_id || index} className="flex items-center justify-between">
                          <div className="flex items-center gap-sm">
                            <span className={`size-3 rounded-full ${dots[index % dots.length]}`} aria-hidden="true" />
                            <span className="text-body-sm-bold text-on-surface-deep uppercase">{cat.category_name}</span>
                          </div>
                          <span className="text-body-sm-bold font-data-mono text-data-mono text-foreground">{cat.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Métodos de Pago */}
                <div className="bg-surface rounded-md border border-border-subtle shadow-whisper p-md">
                  <h3 className="text-body-md-bold text-foreground mb-sm uppercase text-label-caps">
                    {t('bi.pnl.paymentMethods', 'Métodos de Pago', {})}
                  </h3>
                  <div className="space-y-md">
                    {(revenue.by_payment_method ?? []).map((method: any, index: number) => {
                      const barTones = ['bg-primary', 'bg-success', 'bg-on-surface-deep/40'];
                      return (
                        <div key={method.method || index} className="flex items-center gap-sm">
                          <div className="flex-1">
                            <div className="flex justify-between mb-xs">
                              <span className="text-body-sm-bold text-foreground uppercase tracking-tight">{method.method}</span>
                              <span className="text-body-sm-bold font-data-mono text-data-mono text-foreground">{method.percentage}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${barTones[index % barTones.length]} rounded-full`}
                                style={{ width: `${method.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Comparación con periodo anterior */}
            <section className="bg-surface rounded-md border border-border-subtle shadow-whisper p-md mt-lg">
              <div className="flex justify-between items-center mb-md">
                <h3 className="text-body-md-bold text-foreground uppercase text-label-caps">
                  {t('bi.pnl.comparison.title', 'Comparativa con Periodo Anterior', {})}
                </h3>
                <span
                  className={`inline-flex items-center gap-xs px-sm py-xs rounded-xs text-label-caps uppercase ${
                    favorable ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  }`}
                >
                  {favorable
                    ? t('bi.pnl.comparison.favorable', 'FAVORABLE', {})
                    : t('bi.pnl.comparison.unfavorable', 'DESFAVORABLE', {})}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                <div className="p-sm rounded-sm bg-surface-muted border border-border-subtle">
                  <p className="text-body-sm-bold text-on-surface-deep uppercase mb-xs">
                    {t('bi.pnl.comparison.revenueChange', 'Variación en Ingresos', {})}
                  </p>
                  <p className="text-title-md font-data-mono text-data-mono text-success">
                    +{formatPYG(comparison?.revenue_change || 0)}
                  </p>
                  <p className="text-label-caps uppercase text-on-surface-deep mt-xs">
                    {t('bi.pnl.comparison.revenueChangeHint', 'Impacto general', {})}
                  </p>
                </div>
                <div className="p-sm rounded-sm bg-surface-muted border border-border-subtle">
                  <p className="text-body-sm-bold text-on-surface-deep uppercase mb-xs">
                    {t('bi.pnl.comparison.cogsChange', 'Variación COGS', {})}
                  </p>
                  <p className="text-title-md font-data-mono text-data-mono text-error">
                    +{formatPYG(comparison?.cogs_change || 0)}
                  </p>
                  <p className="text-label-caps uppercase text-on-surface-deep mt-xs">
                    {t('bi.pnl.comparison.cogsChangeHint', 'Incremento en costos operativos', {})}
                  </p>
                </div>
                <div className="p-sm rounded-sm bg-surface-muted border border-border-subtle">
                  <p className="text-body-sm-bold text-on-surface-deep uppercase mb-xs">
                    {t('bi.pnl.comparison.marginGap', 'Net Margin Gap', {})}
                  </p>
                  <p className={`text-title-md font-data-mono text-data-mono ${favorable ? 'text-success' : 'text-error'}`}>
                    +{netMarginGap} pts
                  </p>
                  <p className="text-label-caps uppercase text-on-surface-deep mt-xs">
                    {t('bi.pnl.comparison.marginGapHint', 'Eficiencia de margen neto', {})}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfitAndLoss
