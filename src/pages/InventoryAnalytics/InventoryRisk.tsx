import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService';
import { DeadStockAnalysis, StockForecast } from '../../types/inventoryAnalytics';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { ImpactCard } from '../../components/InventoryAnalytics/Risk/ImpactCard';
import { DeadStockTable } from '../../components/InventoryAnalytics/Risk/DeadStockTable';
import { ForecastRiskList } from '../../components/InventoryAnalytics/Risk/ForecastRiskList';
import { formatNumber, formatPYG } from '../../utils/currencyUtils';

export const InventoryRisk: React.FC = () => {
  const { t } = useI18n();
  const [deadStockData, setDeadStockData] = useState<DeadStockAnalysis | null>(null);
  const [forecastData, setStockForecast] = useState<StockForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Ambos endpoints alimentan las secciones de la página; un fallo de
      // cualquiera la deja incompleta → error con retry (antes se tragaba).
      const [deadRes, forecastRes] = await Promise.all([
        inventoryAnalyticsService.getDeadStock(),
        inventoryAnalyticsService.getForecast(),
      ]);
      if (deadRes.success) setDeadStockData(deadRes.data);
      if (forecastRes.success) setStockForecast(forecastRes.data);
      if (!deadRes.success || !forecastRes.success) {
        setError('error');
      }
    } catch (err) {
      console.error('Error fetching risk data:', err);
      setError(err instanceof Error ? err.message : 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg" aria-busy="true" data-testid="inventory-risk-skeleton">
          <div className="h-16 bg-surface-muted rounded-md animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 bg-surface-muted rounded-md animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-surface-muted rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-display bg-background">
      <main className="flex-1 w-full max-w-container-max mx-auto px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.inventory.breadcrumb', 'Inventario', {})}
          title={t('bi.inventory.risk.title', 'Riesgos y Stock Muerto (Gs.)', {})}
          subtitle={t('bi.inventory.risk.subtitle', 'Monitoreo de capital inmovilizado y predicción de quiebres de stock basados en demanda actual.', {})}
          actions={
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-sm font-bold text-foreground hover:bg-surface-muted transition-colors"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              {t('action.refresh', 'Actualizar', {})}
            </button>
          }
        />

        {error && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.inventory.risk.errorTitle', 'No se pudo cargar el análisis de riesgos', {})}
              message={error}
              onRetry={refetch}
            />
          </div>
        )}

        {!error && (!deadStockData || !forecastData) && (
          <div className="mt-lg">
            <EmptyState
              title={t('bi.inventory.risk.emptyTitle', 'Sin datos de riesgo de inventario', {})}
              actionLabel={t('action.refresh', 'Actualizar', {})}
              onAction={refetch}
            />
          </div>
        )}

        {!error && deadStockData && forecastData && (
          <>
            {/* Impact Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-lg">
              <ImpactCard
                title={t('bi.inventory.risk.potentialLoss', 'Pérdida Potencial por Stock Muerto', {})}
                value={formatPYG(deadStockData.summary.potential_loss)}
                trend={t('bi.inventory.risk.idleCapital', 'capital inmovilizado identificado', {})}
                trendValue={`${formatNumber(deadStockData.summary.percentage_of_stock)}%`}
                trendType="negative"
                icon="trending_down"
                iconColorClass="text-error"
                iconBgClass="bg-error/10"
              />
              <ImpactCard
                title={t('bi.inventory.risk.reorderValue', 'Valor de Reorden Recomendado', {})}
                value={formatPYG(forecastData.summary.reorder_value)}
                trend={t('bi.inventory.risk.reorderFor', 'para mitigar riesgo en {days} días', { days: forecastData.forecast_days })}
                trendValue={`${forecastData.summary.products_at_risk} SKUs`}
                trendType="positive"
                icon="shopping_cart_checkout"
                iconColorClass="text-primary"
                iconBgClass="bg-primary/10"
              />
            </div>

            <div className="flex flex-col gap-lg mt-lg">
              {/* Section 1: Dead Stock Analysis (Full Width) */}
              <section>
                <DeadStockTable products={deadStockData.products} />
              </section>

              {/* Section 2: Stockout Forecast (Grid distribution) */}
              <section>
                <ForecastRiskList products={forecastData.risk_products} />
              </section>
            </div>

            {/* Footer / Insight Area (H7: fuera el botón alert() "Ejecutar
                Plan de Mitigación"; el insight es informativo) */}
            <footer className="mt-lg border-t border-border-subtle bg-surface-muted py-lg">
              <div className="bg-surface rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 border border-border-subtle shadow-fluent-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>

                <div className="bg-primary/10 text-primary p-4 rounded-2xl shrink-0">
                  <span className="material-symbols-outlined text-4xl">analytics</span>
                </div>

                <div className="flex-1 font-display">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-black text-foreground uppercase tracking-tight">
                      {t('bi.inventory.risk.insightTitle', 'Análisis de Capital Inmovilizado', {})}
                    </h4>
                    <span className="px-2 py-0.5 bg-error/10 text-error text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">
                      {t('bi.inventory.risk.insightBadge', 'Acción Recomendada', {})}
                    </span>
                  </div>
                  <p className="text-on-surface-deep leading-relaxed font-medium text-base">
                    {t('bi.inventory.risk.insight1', 'Su inventario presenta un', {})}{' '}
                    <span className="font-black font-mono text-error text-lg">
                      {formatNumber(deadStockData.summary.percentage_of_stock)}%
                    </span>{' '}
                    {t('bi.inventory.risk.insight2', '% de stock sin movimiento. La ejecución inmediata de las liquidaciones sugeridas liberaría un flujo de caja de', {})}{' '}
                    <span className="font-black font-mono text-primary text-xl underline decoration-primary/30 underline-offset-4">
                      {formatPYG(deadStockData.summary.potential_loss)}
                    </span>
                    {t('bi.inventory.risk.insight3', ', capital crítico para cubrir el reabastecimiento de los', {})}{' '}
                    <span className="font-bold text-foreground">{forecastData.summary.products_at_risk}</span>{' '}
                    {t('bi.inventory.risk.insight4', 'productos en riesgo de agotamiento detectados.', {})}
                  </p>
                </div>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
};

export default InventoryRisk;
