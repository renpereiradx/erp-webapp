import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService';
import { InventoryDashboardData, InventoryOverview } from '../../types/inventoryAnalytics';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { KPIWidget } from '../../components/InventoryAnalytics/Dashboard/KPIWidget';
import { StockStatusChart } from '../../components/InventoryAnalytics/Dashboard/StockStatusChart';
import { AlertsPanel, AlertItem } from '../../components/InventoryAnalytics/Dashboard/AlertsPanel';
import { ABCSummary, ABCItem } from '../../components/InventoryAnalytics/Dashboard/ABCSummary';
import { formatPYG, formatNumber } from '../../utils/currencyUtils';
// F1 (PLAN_ALINEACION_BI_FRONTEND): filas ABC extraídas a domain
import { buildAbcItems } from '@/domain/inventory-analytics/abc';

export const InventoryDashboard: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<InventoryDashboardData | null>(null);
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // El dashboard y el overview son complementarios (KPIs + valuación);
      // un fallo de cualquiera deja la página incompleta → error con retry.
      const [dashboardRes, overviewRes] = await Promise.all([
        inventoryAnalyticsService.getDashboard(),
        inventoryAnalyticsService.getOverview(),
      ]);
      if (dashboardRes.success) {
        setData(dashboardRes.data);
      }
      if (overviewRes.success) {
        setOverview(overviewRes.data);
      }
      if (!dashboardRes.success || !overviewRes.success) {
        setError('error');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
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
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg" aria-busy="true" data-testid="inventory-dashboard-skeleton">
          <div className="h-16 bg-surface-muted rounded-md animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-surface-muted rounded-md animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-md">
            <div className="lg:col-span-6 h-72 bg-surface-muted rounded-md animate-pulse" />
            <div className="lg:col-span-4 h-72 bg-surface-muted rounded-md animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.inventory.breadcrumb', 'Inventario', {})}
          title={t('bi.inventory.dashboard.title', 'Dashboard de Inventario', {})}
          subtitle={t('bi.inventory.dashboard.subtitle', 'Vista analítica de existencias y KPIs financieros en Guaraníes.', {})}
          actions={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-surface border border-border-subtle px-3 py-2 rounded-lg text-sm font-bold shadow-sm font-mono text-on-surface-deep">
                <span className="material-symbols-outlined text-on-surface-deep text-lg">calendar_today</span>
                <span>
                  {t('bi.inventory.dashboard.period', 'Periodo: {period}', {
                    period: new Date().toLocaleDateString('es-PY', { month: 'long', year: 'numeric' }),
                  })}
                </span>
              </div>
              <button
                type="button"
                onClick={refetch}
                className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-primary text-white font-bold text-sm transition-colors shadow-sm uppercase tracking-wider hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                {t('action.refresh', 'Actualizar', {})}
              </button>
            </div>
          }
        />

        {error && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.inventory.dashboard.errorTitle', 'No se pudo cargar el dashboard de inventario', {})}
              message={error}
              onRetry={refetch}
            />
          </div>
        )}

        {!error && !data && (
          <div className="mt-lg">
            <EmptyState
              title={t('bi.inventory.dashboard.emptyTitle', 'Sin datos de inventario', {})}
              actionLabel={t('action.refresh', 'Actualizar', {})}
              onAction={refetch}
            />
          </div>
        )}

        {!error && data && (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mt-lg">
              <KPIWidget
                title={t('bi.inventory.kpi.totalValue', 'Valor Total del Inventario', {})}
                value={formatPYG(data.kpis.total_value)}
                icon="inventory"
              />
              <KPIWidget
                title={t('bi.inventory.kpi.potentialProfit', 'Ganancia Potencial', {})}
                value={formatPYG(overview?.potential_profit ?? (overview ? overview.total_value - overview.total_cost : 0))}
                icon="payments"
                iconColorClass="text-success"
                bgColorClass="bg-success/10"
              />
              <KPIWidget
                title={t('bi.inventory.kpi.turnoverRate', 'Tasa de Rotación', {})}
                value={`${formatNumber(data.kpis.turnover_rate)}x`}
                icon="sync_alt"
                iconColorClass="text-primary"
                bgColorClass="bg-primary/10"
              />
              <KPIWidget
                title={t('bi.inventory.kpi.deadStock', 'Stock Muerto', {})}
                value={`${formatNumber(data.kpis.dead_stock_pct)}%`}
                icon="package_2"
                iconColorClass="text-warning"
                bgColorClass="bg-warning/10"
              />
            </div>

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-md mt-lg">
              <div className="lg:col-span-6">
                <StockStatusChart
                  items={[
                    { label: t('bi.inventory.stockStatus.inStock', 'En Stock', {}), percentage: data.stock_status.in_stock_pct, count: data.stock_status.in_stock, colorClass: 'bg-success', strokeClass: 'stroke-success' },
                    { label: t('bi.inventory.stockStatus.low', 'Bajo Stock', {}), percentage: data.stock_status.low_stock_pct, count: data.stock_status.low_stock, colorClass: 'bg-warning', strokeClass: 'stroke-warning' },
                    { label: t('bi.inventory.stockStatus.out', 'Sin Stock', {}), percentage: data.stock_status.out_of_stock_pct, count: data.stock_status.out_of_stock, colorClass: 'bg-error', strokeClass: 'stroke-error' },
                    { label: t('bi.inventory.stockStatus.over', 'Sobre-stock', {}), percentage: data.stock_status.overstock_pct, count: data.stock_status.overstock, colorClass: 'bg-secondary', strokeClass: 'stroke-secondary' },
                  ]}
                  totalValue={(overview?.total_products || (data.stock_status.in_stock + data.stock_status.low_stock + data.stock_status.out_of_stock + data.stock_status.overstock)).toLocaleString('es-PY')}
                />
              </div>
              <div className="lg:col-span-4">
                <AlertsPanel alerts={data.alerts.map((a, i) => alertItem(a, i))} />
              </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-lg">
              <ABCSummary items={buildAbcItems(data.abc_summary, overview?.total_value ?? data.kpis.total_value) as ABCItem[]} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const alertItem = (
  a: { type: string; message: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' },
  i: number,
): AlertItem => ({
  id: `alert-${i}-${a.type}`,
  type: a.type.replace(/_/g, ' '),
  message: a.message,
  severity: a.severity,
});

export default InventoryDashboard;
