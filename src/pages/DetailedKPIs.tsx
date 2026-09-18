import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useBranch } from '@/contexts/BranchContext';
import useDashboardStore from '../store/useDashboardStore';
import { formatPYG, formatNumber } from '@/utils/currencyUtils';
import { formatTimeInParaguayTimezone } from '@/utils/timeUtils';
import { getTimeAgo } from '@/domain/dashboard/shared';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import { RefreshCcw } from 'lucide-react';

/**
 * Panel de KPIs Detallado.
 * Migración FASE 5: .tsx + PageHeader + tokens + loading/error por slice.
 * La barra de "Índice de Salud" inventada (turnover*10 con TODO) se eliminó
 * (decisión del plan: fuera por falta de fórmula real en la API).
 */
const DetailedKPIs = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { currentBranchId } = useBranch();
  const [period, setPeriod] = useState('month');
  const summary = useDashboardStore((s) => s.summary);
  const kpis = useDashboardStore((s) => s.kpis);
  const alerts = useDashboardStore((s) => s.alerts);
  const fetchDashboardData = useDashboardStore((s) => s.fetchDashboardData);
  const fetchKPIData = useDashboardStore((s) => s.fetchKPIData);
  const loading = useDashboardStore((s) => s.loadingBySlice.kpis);
  const error = useDashboardStore((s) => s.errorBySlice.kpis);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const loadData = async () => {
      await Promise.allSettled([fetchDashboardData(), fetchKPIData(period)]);
      setLastUpdated(new Date());
    };
    loadData();
  }, [fetchDashboardData, fetchKPIData, period, currentBranchId]);

  const formatCurrency = (val?: number) => formatPYG(val ?? 0);
  const nowLabel = t('dashboard.activity.now', 'ahora', {});

  const vsLast30Days = t('dashboard.dashboard.kpi.vsPrevious30Days', 'vs. últimos 30 días', {});

  if (loading && !kpis && !summary) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl" aria-busy="true" data-testid="kpis-skeleton">
          <div className="h-16 bg-surface-muted rounded-md animate-pulse mb-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-surface-muted rounded-md animate-pulse" />
            ))}
          </div>
          <GenericSkeletonList count={5} data-testid="page-skeleton-list" />
        </div>
      </div>
    );
  }

  if (error && !kpis) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl mt-lg">
          <ErrorState
            title={t('dashboard.error.title', 'Error al cargar los KPIs', {})}
            message={error}
            onRetry={() => fetchKPIData(period)}
          />
        </div>
      </div>
    );
  }

  // API Data Mappings
  const revenueTotal = summary?.sales?.total || 0;
  const netMargin = kpis?.financial_kpis?.net_margin || 0;
  const grossMargin = kpis?.financial_kpis?.gross_margin || 0;
  const opExpenseRatio = kpis?.financial_kpis?.operating_expense_ratio || 0;

  const newCustomers = kpis?.customer_kpis?.new_customers || 0;

  const inventoryValue = summary?.inventory?.total_value || 0;
  const totalProducts = summary?.inventory?.total_products || 0;
  const turnoverRate = kpis?.inventory_kpis?.turnover_rate || 0;
  const daysOfInventory = kpis?.inventory_kpis?.days_of_inventory || 0;

  const avgTicket = kpis?.sales_kpis?.average_ticket || 0;
  const salesPerDay = kpis?.sales_kpis?.sales_per_day || 0;
  const convRate = kpis?.sales_kpis?.conversion_rate || 0;
  const purchaseFreq = kpis?.customer_kpis?.average_purchase_frequency || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.dashboard.breadcrumb', 'Dashboard', {})}
          title={t('dashboard.dashboard.actions.viewDetails', 'Panel de KPIs Detallado', {})}
          subtitle={`${t('dashboard.dashboard.activity.lastUpdated', 'Última actualización:', {})} ${formatTimeInParaguayTimezone(lastUpdated)}`}
          actions={
            <div className="flex flex-wrap items-center gap-sm">
              <div
                className="flex items-center gap-xs bg-surface p-xs rounded-md border border-border-subtle"
                role="group"
                aria-label={t('bi.dashboard.period.label', 'Período', {})}
              >
                {['today', 'week', 'month', 'year'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={period === p}
                    onClick={() => setPeriod(p)}
                    className={`px-sm py-xs text-label-caps uppercase rounded-sm transition-colors duration-150 ${
                      period === p ? 'bg-primary text-on-primary' : 'text-on-surface-deep hover:bg-surface-muted'
                    }`}
                  >
                    {p === 'today' ? 'Hoy' : p === 'week' ? '7D' : p === 'month' ? '30D' : '1A'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  fetchDashboardData();
                  fetchKPIData(period);
                }}
                className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
              >
                <RefreshCcw size={16} />
                {t('action.refresh', 'Actualizar', {})}
              </button>
            </div>
          }
        />

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mt-lg">
          {/* Revenue Card */}
          <div className="bg-surface rounded-md p-md shadow-whisper border border-border-subtle flex flex-col justify-between h-40">
            <div>
              <p className="text-body-sm-bold text-on-surface-deep">
                {t('dashboard.dashboard.kpi.revenue', 'Ingresos Totales', {})}
              </p>
              <h3 className="text-title-md font-data-mono text-data-mono text-foreground mt-xs">{formatCurrency(revenueTotal)}</h3>
            </div>
            <div className="mt-auto">
              <div className="flex items-center justify-center border border-dashed border-border-subtle rounded-xs text-label-caps uppercase text-on-surface-deep h-12">
                {t('dashboard.trends.notAvailable', 'Tendencia no disponible', {})}
              </div>
              <p className="text-label-caps uppercase text-on-surface-deep mt-sm">{vsLast30Days}</p>
            </div>
          </div>

          {/* Profit Card */}
          <div className="bg-surface rounded-md p-md shadow-whisper border border-border-subtle flex flex-col justify-between h-40">
            <div>
              <p className="text-body-sm-bold text-on-surface-deep">
                {t('dashboard.dashboard.kpi.netProfit', 'Margen Neto', {})}
              </p>
              <h3 className="text-title-md font-data-mono text-data-mono text-foreground mt-xs">{formatNumber(netMargin)}%</h3>
            </div>
            <div className="mt-auto">
              <div className="flex items-center justify-center border border-dashed border-primary/20 rounded-xs text-label-caps uppercase text-primary h-10">
                {t('dashboard.trends.notAvailable', 'Tendencia no disponible', {})}
              </div>
              <p className="text-label-caps uppercase text-on-surface-deep mt-sm">{vsLast30Days}</p>
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-surface rounded-md p-md shadow-whisper border border-border-subtle flex flex-col justify-between h-40">
            <div>
              <p className="text-body-sm-bold text-on-surface-deep">
                {t('dashboard.dashboard.kpi.newCustomers', 'Clientes Nuevos', {})}
              </p>
              <h3 className="text-title-md font-data-mono text-data-mono text-foreground mt-xs">{newCustomers.toLocaleString()}</h3>
            </div>
            <div className="mt-auto">
              <div className="flex items-center justify-center border border-dashed border-border-subtle rounded-xs text-label-caps uppercase text-on-surface-deep h-12">
                {t('dashboard.trends.notAvailable', 'Tendencia no disponible', {})}
              </div>
              <p className="text-label-caps uppercase text-on-surface-deep mt-sm">{vsLast30Days}</p>
            </div>
          </div>

          {/* Inventory Card */}
          <div className="bg-surface rounded-md p-md shadow-whisper border border-border-subtle flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-body-sm-bold text-on-surface-deep">
                  {t('dashboard.dashboard.kpi.inventoryValue', 'Valor Inventario', {})}
                </p>
                <h3 className="text-title-md font-data-mono text-data-mono text-foreground mt-xs">{formatCurrency(inventoryValue)}</h3>
              </div>
              {daysOfInventory < 180 ? (
                <span className="flex items-center text-label-caps uppercase text-success bg-success/10 px-sm py-xs rounded-full border border-success/20">
                  {t('dashboard.inventory.status.healthy', 'Saludable', {})}
                </span>
              ) : (
                <span className="flex items-center text-label-caps uppercase text-warning bg-warning/10 px-sm py-xs rounded-full border border-warning/20">
                  {t('dashboard.inventory.status.overstock', 'Exceso Stock', {})}
                </span>
              )}
            </div>
            <div className="mt-auto">
              <div className="flex justify-between mt-sm text-label-caps uppercase text-on-surface-deep">
                <span>{t('dashboard.dashboard.inventoryHealth', 'Índice de Salud', {})}</span>
                <span className="text-foreground font-data-mono text-data-mono">{formatNumber(turnoverRate)}x</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Charts / Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md mt-lg">
          {/* Sales & Efficiency */}
          <div className="bg-surface rounded-md shadow-whisper border border-border-subtle flex flex-col overflow-hidden">
            <div className="px-md py-sm border-b border-border-subtle bg-surface-muted">
              <h3 className="text-title-md text-foreground">{t('dashboard.dashboard.salesEfficiency', 'Eficiencia de Ventas', {})}</h3>
            </div>
            <div className="p-md space-y-md flex-1">
              <div className="flex justify-between items-center">
                <span className="text-body-md text-on-surface-deep">{t('dashboard.dashboard.avgTicket', 'Ticket Promedio', {})}</span>
                <span className="text-body-md-bold font-data-mono text-data-mono text-foreground">{formatCurrency(avgTicket)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-md text-on-surface-deep">{t('dashboard.dashboard.salesPerDay', 'Ventas por Día', {})}</span>
                <span className="text-body-md-bold font-data-mono text-data-mono text-foreground">{formatNumber(salesPerDay)}</span>
              </div>
              <div className="space-y-sm">
                <div className="flex justify-between items-center">
                  <span className="text-body-md text-on-surface-deep">{t('dashboard.dashboard.convRate', 'Tasa de Conversión', {})}</span>
                  <span className="text-body-md-bold font-data-mono text-data-mono text-primary">{formatNumber(convRate)}%</span>
                </div>
                <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${convRate}%` }} />
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-border-subtle pt-md">
                <span className="text-body-md text-on-surface-deep">
                  {t('dashboard.dashboard.customerFrequency', 'Frecuencia de Compra', {})}
                </span>
                <span className="text-body-md-bold font-data-mono text-data-mono text-foreground">{purchaseFreq}x</span>
              </div>
            </div>
          </div>

          {/* Financial Health */}
          <div className="bg-surface rounded-md shadow-whisper border border-border-subtle flex flex-col overflow-hidden">
            <div className="px-md py-sm border-b border-border-subtle bg-surface-muted">
              <h3 className="text-title-md text-foreground">{t('dashboard.dashboard.financialHealth', 'Salud Financiera', {})}</h3>
            </div>
            <div className="p-md space-y-md flex-1">
              <div className="space-y-sm">
                <div className="flex justify-between items-center">
                  <span className="text-body-md text-on-surface-deep">{t('dashboard.dashboard.grossMargin', 'Margen Bruto', {})}</span>
                  <span className="text-body-md-bold font-data-mono text-data-mono text-foreground">{formatNumber(grossMargin)}%</span>
                </div>
                <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full transition-all duration-300" style={{ width: `${grossMargin}%` }} />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-md text-on-surface-deep">{t('dashboard.dashboard.netMargin', 'Margen Neto', {})}</span>
                <span className="text-body-md-bold font-data-mono text-data-mono text-success">{formatNumber(netMargin)}%</span>
              </div>
              <div className="flex justify-between items-center border-t border-border-subtle pt-md">
                <span className="text-body-md text-on-surface-deep">
                  {t('dashboard.dashboard.operatingRatio', 'Ratio Gasto Operativo', {})}
                </span>
                <span className="text-body-md-bold font-data-mono text-data-mono text-warning">{formatNumber(opExpenseRatio)}%</span>
              </div>
            </div>
          </div>

          {/* Inventory Performance */}
          <div className="bg-surface rounded-md shadow-whisper border border-border-subtle flex flex-col overflow-hidden">
            <div className="px-md py-sm border-b border-border-subtle bg-surface-muted">
              <h3 className="text-title-md text-foreground">
                {t('dashboard.dashboard.inventoryPerformance', 'Rendimiento de Inventario', {})}
              </h3>
            </div>
            <div className="p-md space-y-md flex-1">
              <div className="flex justify-between items-center">
                <span className="text-body-md text-on-surface-deep">{t('dashboard.dashboard.turnoverRate', 'Tasa de Rotación', {})}</span>
                <span className="text-body-md-bold font-data-mono text-data-mono text-foreground">{formatNumber(turnoverRate)}x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-md text-on-surface-deep">{t('dashboard.dashboard.daysOfInventory', 'Días de Inventario', {})}</span>
                <span className="text-body-md-bold font-data-mono text-data-mono text-foreground">
                  {formatNumber(daysOfInventory)} {t('common.days', 'días', {})}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-border-subtle pt-md">
                <span className="text-body-md text-on-surface-deep">{t('dashboard.dashboard.totalSKUs', 'Total SKUs Activos', {})}</span>
                <span className="text-body-md-bold font-data-mono text-data-mono text-foreground">{totalProducts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts View */}
        <div className="bg-surface rounded-md p-md shadow-whisper border border-border-subtle mt-lg">
          <div className="flex justify-between items-center mb-md">
            <h3 className="text-title-md text-foreground">{t('dashboard.dashboard.activity.title', 'Alertas Recientes', {})}</h3>
            <button
              type="button"
              className="text-body-sm-bold text-primary hover:underline cursor-pointer"
              onClick={() => navigate('/dashboard/alerts')}
            >
              {t('bi.receivables.recent.viewAll', 'Ver Todas', {})}
            </button>
          </div>
          <div className="space-y-sm">
            {alerts.slice(0, 5).map((alert) => {
              let borderClass = 'border-l-primary bg-primary/5';
              let iconClass = 'text-primary';
              let iconText = 'info';

              if (alert.severity === 'critical') {
                borderClass = 'border-l-error bg-error/5';
                iconClass = 'text-error';
                iconText = 'warning';
              } else if (alert.severity === 'warning') {
                borderClass = 'border-l-warning bg-warning/5';
                iconClass = 'text-warning';
                iconText = 'trending_down';
              } else if (alert.severity === 'success') {
                borderClass = 'border-l-success bg-success/5';
                iconClass = 'text-success';
                iconText = 'check_circle';
              }

              return (
                <div
                  key={alert.id}
                  className={`flex gap-sm items-start p-sm rounded-md hover:bg-surface-muted transition-colors duration-150 cursor-pointer border-l-4 ${borderClass}`}
                  onClick={() => navigate('/dashboard/alerts')}
                >
                  <div className="mt-0.5">
                    <span className={`material-symbols-outlined ${iconClass}`}>{iconText}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-body-md-bold text-foreground">{alert.title}</h4>
                    <p className="text-body-sm-bold text-on-surface-deep mt-xs">{alert.message}</p>
                  </div>
                  <span className="text-label-caps uppercase text-on-surface-deep whitespace-nowrap">
                    {getTimeAgo(alert.created_at, nowLabel)}
                  </span>
                </div>
              );
            })}
            {alerts.length === 0 && (
              <div className="text-center py-md">
                <p className="text-body-md text-on-surface-deep">{t('dashboard.dashboard.activity.noActivity', 'Sin alertas.', {})}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedKPIs;
