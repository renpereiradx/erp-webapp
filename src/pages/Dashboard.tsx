import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import useDashboardStore from '@/store/useDashboardStore';
import { formatTimeInParaguayTimezone } from '@/utils/timeUtils';
import { formatCurrency, formatNumber } from '@/utils/currencyUtils';
import { getActivityRoute, getTimeAgo } from '@/domain/dashboard/shared';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Info,
  Package,
  Receipt,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

/**
 * Resumen Ejecutivo.
 * Migración FASE 5: .tsx + PageHeader + tokens; el botón 'Exportar Informe'
 * sin handler se eliminó (§2.6); loading/error por slice (D2).
 */
const Dashboard = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const summary = useDashboardStore((s) => s.summary);
  const alerts = useDashboardStore((s) => s.alerts);
  const activities = useDashboardStore((s) => s.activities);
  const trends = useDashboardStore((s) => s.trends);
  const profitabilityTrends = useDashboardStore((s) => s.profitabilityTrends);
  const receivablesOverview = useDashboardStore((s) => s.receivablesOverview);
  const payablesOverview = useDashboardStore((s) => s.payablesOverview);
  const salesPerformance = useDashboardStore((s) => s.salesPerformance);
  const loading = useDashboardStore((s) => s.loadingBySlice.dashboard);
  const error = useDashboardStore((s) => s.errorBySlice.dashboard);
  const fetchDashboardData = useDashboardStore((s) => s.fetchDashboardData);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardData(period).then(() => setLastUpdated(new Date()));
  }, [fetchDashboardData, period]);

  const handleRefresh = async () => {
    await fetchDashboardData(period);
    setLastUpdated(new Date());
  };

  // Chart Data from Profitability API
  const revenueExpensesData = useMemo(() => {
    if (profitabilityTrends?.data_points) {
      return profitabilityTrends.data_points.map((dp) => ({
        name: dp.label,
        revenue: dp.revenue,
        expenses: dp.cost,
      }));
    }
    return [];
  }, [profitabilityTrends]);

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl" aria-busy="true" data-testid="dashboard-skeleton">
          <div className="h-16 bg-surface-muted rounded-md animate-pulse mb-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-surface-muted rounded-md animate-pulse" />
            ))}
          </div>
          <GenericSkeletonList count={6} data-testid="page-skeleton-list" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl mt-lg">
          <ErrorState
            title={t('bi.dashboard.error.title', 'Error al cargar el Dashboard', {})}
            message={error}
            onRetry={() => fetchDashboardData()}
          />
        </div>
      </div>
    );
  }

  // Data mapping from Summary
  const salesTotal = summary?.sales?.total || 0;
  const salesCount = summary?.sales?.count || 0;
  const purchasesTotal = summary?.purchases?.total || 0;
  const grossProfit = summary?.profit?.gross || 0;
  const inventoryValue = summary?.inventory?.total_value || 0;
  const lowStockCount = summary?.inventory?.low_stock_count || 0;
  const cashBalance = summary?.cash_registers?.total_balance || 0;
  const receivablesTotal = summary?.receivables?.total_pending || 0;
  const receivablesOverdue = summary?.receivables?.overdue_count || 0;
  const payablesTotal = summary?.payables?.total_pending || 0;

  // Trend mapping
  const salesTrendPct = trends?.sales?.change_percentage || 0;
  const purchasesTrendPct = trends?.purchases?.change_percentage || 0;
  const profitTrendPct = trends?.gross_margin?.change_percentage || 0;
  const txTrendPct = salesPerformance?.comparison?.transactions_change_pct || 0;

  // Collection rates
  const collectionRate = receivablesOverview?.collection_rate || 0;
  const paymentRate = payablesOverview?.payment_rate || 0;

  const nowLabel = t('dashboard.activity.now', 'ahora', {});

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        {/* 1. Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="space-y-xs">
            <h1 className="text-headline-lg text-foreground tracking-tight uppercase">
              {t('dashboard.executive.title', 'Resumen Ejecutivo', {})}
            </h1>
            <p className="text-body-sm-bold text-on-surface-deep">
              {t('dashboard.executive.subtitle', 'Visión general en tiempo real de los indicadores clave', {})} •{' '}
              <span className="font-data-mono text-data-mono">{formatTimeInParaguayTimezone(lastUpdated)}</span>
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <div
              className="flex items-center gap-xs bg-surface p-xs rounded-md border border-border-subtle shadow-whisper"
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
            <Button variant="secondary" size="md" onClick={handleRefresh}>
              <RefreshCcw size={16} className="mr-2" />
              {t('bi.profitability.action.refresh', 'Actualizar', {})}
            </Button>
          </div>
        </div>

        {/* 2. Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mt-lg">
          {/* Total Sales */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/kpis')}
            className="bg-surface p-md rounded-md shadow-whisper border border-border-subtle hover:shadow-fluent-8 transition-shadow text-left cursor-pointer"
          >
            <div className="flex items-start justify-between mb-md">
              <div className="size-12 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                <DollarSign size={24} />
              </div>
              <div
                className={`flex items-center gap-xs px-sm py-xs rounded-full text-body-sm-bold font-data-mono text-data-mono ${
                  salesTrendPct >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}
              >
                {salesTrendPct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{formatNumber(Math.abs(salesTrendPct), 1)}%</span>
              </div>
            </div>
            <div>
              <p className="text-label-caps uppercase text-on-surface-deep mb-xs">
                {t('dashboard.kpi.totalSales', 'Ventas Totales', {})}
              </p>
              <h3 className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">
                {formatCurrency(salesTotal)}
              </h3>
            </div>
          </button>

          {/* Purchases */}
          <button
            type="button"
            onClick={() => navigate('/compras')}
            className="bg-surface p-md rounded-md shadow-whisper border border-border-subtle hover:shadow-fluent-8 transition-shadow text-left cursor-pointer"
          >
            <div className="flex items-start justify-between mb-md">
              <div className="size-12 rounded-md bg-warning/10 flex items-center justify-center text-warning">
                <Receipt size={24} />
              </div>
              <div
                className={`flex items-center gap-xs px-sm py-xs rounded-full text-body-sm-bold font-data-mono text-data-mono ${
                  purchasesTrendPct <= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}
              >
                {purchasesTrendPct <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                <span>{formatNumber(Math.abs(purchasesTrendPct), 1)}%</span>
              </div>
            </div>
            <div>
              <p className="text-label-caps uppercase text-on-surface-deep mb-xs">
                {t('dashboard.kpi.purchases', 'Compras', {})}
              </p>
              <h3 className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">
                {formatCurrency(purchasesTotal)}
              </h3>
            </div>
          </button>

          {/* Net Profit */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/kpis')}
            className="bg-surface p-md rounded-md shadow-whisper border border-border-subtle hover:shadow-fluent-8 transition-shadow text-left cursor-pointer"
          >
            <div className="flex items-start justify-between mb-md">
              <div className="size-12 rounded-md bg-success/10 flex items-center justify-center text-success">
                <TrendingUp size={24} />
              </div>
              <div
                className={`flex items-center gap-xs px-sm py-xs rounded-full text-body-sm-bold font-data-mono text-data-mono ${
                  profitTrendPct >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}
              >
                {profitTrendPct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{formatNumber(Math.abs(profitTrendPct), 1)}%</span>
              </div>
            </div>
            <div>
              <p className="text-label-caps uppercase text-on-surface-deep mb-xs">
                {t('dashboard.kpi.netProfit', 'Ganancia Bruta', {})}
              </p>
              <h3 className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">
                {formatCurrency(grossProfit)}
              </h3>
            </div>
          </button>

          {/* Daily Transactions */}
          <button
            type="button"
            onClick={() => navigate('/ventas')}
            className="bg-surface p-md rounded-md shadow-whisper border border-border-subtle hover:shadow-fluent-8 transition-shadow text-left cursor-pointer"
          >
            <div className="flex items-start justify-between mb-md">
              <div className="size-12 rounded-md bg-secondary/10 flex items-center justify-center text-secondary">
                <Receipt size={24} />
              </div>
              <div
                className={`flex items-center gap-xs px-sm py-xs rounded-full text-body-sm-bold font-data-mono text-data-mono ${
                  txTrendPct >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}
              >
                {txTrendPct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{formatNumber(Math.abs(txTrendPct), 1)}%</span>
              </div>
            </div>
            <div>
              <p className="text-label-caps uppercase text-on-surface-deep mb-xs">
                {t('dashboard.kpi.dailyTransactions', 'Transacciones Diarias', {})}
              </p>
              <h3 className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">
                {salesCount.toLocaleString()}
              </h3>
            </div>
          </button>
        </div>

        {/* 3. Main Chart & Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mt-lg">
          {/* Revenue vs Expenses Chart (Area) */}
          <div className="lg:col-span-2 bg-surface p-lg rounded-md shadow-whisper border border-border-subtle">
            <div className="flex items-center justify-between mb-lg">
              <div className="space-y-xs">
                <h3 className="text-title-md text-foreground uppercase tracking-tight">
                  {t('dashboard.charts.revVsExp', 'Ingresos vs Gastos', {})}
                </h3>
                <p className="text-body-sm-bold text-on-surface-deep">
                  {t('dashboard.charts.revenueVsExpenses.subtitle', 'Rendimiento en el tiempo', {})}
                </p>
              </div>
              <div className="flex items-center gap-md">
                <div className="flex items-center gap-xs">
                  <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-label-caps uppercase text-on-surface-deep">
                    {t('dashboard.revenue', 'Ingresos', {})}
                  </span>
                </div>
                <div className="flex items-center gap-xs">
                  <span className="size-2 rounded-full bg-on-surface-deep/30" aria-hidden="true" />
                  <span className="text-label-caps uppercase text-on-surface-deep">
                    {t('dashboard.expenses', 'Gastos', {})}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              {isMounted && revenueExpensesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={revenueExpensesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} className="stroke-divider" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--color-on-surface-deep)' }}
                      dy={15}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid var(--color-border-subtle)',
                        fontSize: 12,
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-foreground)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name={t('dashboard.revenue', 'Ingresos', {})}
                      className="stroke-primary"
                      strokeWidth={3}
                      fill="url(#colorRevenue)"
                      fillOpacity={1}
                      animationDuration={300}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name={t('dashboard.expenses', 'Gastos', {})}
                      className="stroke-on-surface-deep"
                      strokeDasharray="6 6"
                      strokeWidth={3}
                      fill="none"
                      animationDuration={300}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-surface-muted rounded-md border border-dashed border-border-subtle">
                  <p className="text-body-md text-on-surface-deep">
                    {t('common.noData', 'No hay datos disponibles para el período', {})}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Operations Stack */}
          <div className="flex flex-col gap-md">
            {/* Inventory Valuation */}
            <button
              type="button"
              onClick={() => navigate('/movimientos-stock')}
              className="bg-surface p-md rounded-md shadow-whisper border border-border-subtle text-left cursor-pointer hover:shadow-fluent-8 transition-shadow"
            >
              <div className="flex items-center gap-sm mb-md">
                <div className="size-10 rounded-md bg-warning/10 flex items-center justify-center text-warning">
                  <Package size={22} />
                </div>
                <h4 className="text-body-md-bold text-foreground uppercase">{t('dashboard.kpi.inventory', 'Inventario', {})}</h4>
              </div>
              <div>
                <p className="text-label-caps uppercase text-on-surface-deep mb-xs">
                  {t('dashboard.operations.inventory.valuation', 'Valuación Total', {})}
                </p>
                <h3 className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">
                  {formatCurrency(inventoryValue)}
                </h3>
              </div>
              <div
                className={`flex items-center gap-sm p-sm rounded-md text-body-sm-bold mt-md ${
                  lowStockCount > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                }`}
              >
                <AlertTriangle size={16} />
                <span>
                  {t('dashboard.operations.inventory.lowStock', '{count} Artículos con bajo stock', {
                    count: lowStockCount,
                  }).replace('{count}', String(lowStockCount))}
                </span>
              </div>
            </button>

            {/* Cash Register */}
            <button
              type="button"
              onClick={() => navigate('/caja-registradora')}
              className="bg-surface p-md rounded-md shadow-whisper border border-border-subtle text-left cursor-pointer hover:shadow-fluent-8 transition-shadow"
            >
              <div className="flex items-center gap-sm mb-md">
                <div className="size-10 rounded-md bg-success/10 flex items-center justify-center text-success">
                  <CreditCard size={22} />
                </div>
                <h4 className="text-body-md-bold text-foreground uppercase">
                  {t('dashboard.kpi.cashRegister', 'Caja Registradora', {})}
                </h4>
              </div>
              <div>
                <p className="text-label-caps uppercase text-on-surface-deep mb-xs">
                  {t('dashboard.operations.cashRegister.balance', 'Saldo Actual', {})}
                </p>
                <h3 className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">
                  {formatCurrency(cashBalance)}
                </h3>
              </div>
              <div className="flex justify-between items-center text-label-caps uppercase text-on-surface-deep mt-md">
                <span>{t('dashboard.operations.cashRegister.active', 'Cajas Abiertas', {})}</span>
                <span className="text-foreground font-data-mono text-data-mono">
                  {summary?.cash_registers?.open_count || 0}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 4. Bottom Row: Finance & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md mt-lg">
          {/* Finance Overview */}
          <div className="bg-surface p-lg rounded-md shadow-whisper border border-border-subtle flex flex-col">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="text-title-md text-foreground uppercase tracking-tight">
                {t('dashboard.finance.title', 'Resumen Financiero', {})}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/receivables')}>
                {t('dashboard.actions.viewReport', 'Ver Reporte', {})}
                <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>

            <div className="space-y-lg flex-1">
              {/* Receivables */}
              <button
                type="button"
                onClick={() => navigate('/receivables')}
                className="group w-full space-y-sm text-left cursor-pointer"
              >
                <div className="flex items-end justify-between">
                  <div className="space-y-xs">
                    <p className="text-label-caps uppercase text-on-surface-deep group-hover:text-primary transition-colors">
                      {t('dashboard.finance.receivables', 'Cuentas por Cobrar', {})}
                    </p>
                    <h4 className="text-title-md font-data-mono text-data-mono text-foreground">{formatCurrency(receivablesTotal)}</h4>
                  </div>
                  <span className="text-body-sm-bold text-success bg-success/10 px-sm py-xs rounded-xs">
                    {formatNumber(collectionRate, 1)}% {t('dashboard.finance.collected', 'Cobrado', {})}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </button>

              {/* Payables */}
              <button
                type="button"
                onClick={() => navigate('/pagos-compras')}
                className="group w-full space-y-sm text-left cursor-pointer"
              >
                <div className="flex items-end justify-between">
                  <div className="space-y-xs">
                    <p className="text-label-caps uppercase text-on-surface-deep group-hover:text-primary transition-colors">
                      {t('dashboard.finance.payables', 'Cuentas por Pagar', {})}
                    </p>
                    <h4 className="text-title-md font-data-mono text-data-mono text-foreground">{formatCurrency(payablesTotal)}</h4>
                  </div>
                  <span className="text-body-sm-bold text-on-surface-deep bg-surface-muted px-sm py-xs rounded-xs">
                    {formatNumber(paymentRate, 1)}% {t('dashboard.finance.paid', 'Pagado', {})}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full transition-all duration-300"
                    style={{ width: `${paymentRate}%` }}
                  />
                </div>
              </button>
            </div>

            <div className="mt-lg pt-lg border-t border-border-subtle grid grid-cols-2 gap-md">
              <div>
                <p className="text-label-caps uppercase text-on-surface-deep mb-xs">
                  {t('dashboard.finance.netCashflow', 'Flujo de Caja Neto', {})}
                </p>
                <p className={`text-body-lg-bold font-data-mono text-data-mono ${salesTotal - purchasesTotal > 0 ? 'text-success' : 'text-error'}`}>
                  {salesTotal - purchasesTotal > 0 ? '+' : ''}
                  {formatCurrency(salesTotal - purchasesTotal)}
                </p>
              </div>
              <button
                type="button"
                className="text-left cursor-pointer group"
                onClick={() => navigate('/receivables/overdue')}
              >
                <p className="text-label-caps uppercase text-on-surface-deep mb-xs group-hover:text-primary transition-colors">
                  {t('dashboard.finance.overdueInvoices', 'Facturas Vencidas', {})}
                </p>
                <p className={`text-body-lg-bold font-data-mono text-data-mono ${receivablesOverdue > 0 ? 'text-error' : 'text-foreground'}`}>
                  {receivablesOverdue}
                </p>
              </button>
            </div>
          </div>

          {/* Recent Alerts & Activity */}
          <div className="bg-surface rounded-md shadow-whisper border border-border-subtle flex flex-col overflow-hidden">
            <div className="px-lg py-sm border-b border-border-subtle flex items-center justify-between bg-surface-muted">
              <h3 className="text-title-md text-foreground uppercase tracking-tight">
                {t('dashboard.activity.title', 'Alertas y Actividad Reciente', {})}
              </h3>
              <div className="flex items-center gap-xs px-sm py-xs rounded-xs bg-surface border border-border-subtle">
                <span className="size-2 rounded-full bg-error animate-pulse" aria-hidden="true" />
                <span className="text-label-caps uppercase text-on-surface-deep">{t('dashboard.activity.live', 'Live', {})}</span>
              </div>
            </div>
            <div className="flex-1 divide-y divide-border-subtle">
              {/* Map Alerts */}
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex gap-md p-md cursor-pointer hover:bg-surface-muted transition-colors duration-150 group"
                  onClick={() => (alert.action_url ? navigate(alert.action_url) : navigate('/dashboard/alerts'))}
                >
                  <div
                    className={`size-10 rounded-md shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${
                      alert.severity === 'critical'
                        ? 'bg-error/10 text-error'
                        : alert.severity === 'warning'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {alert.severity === 'critical' || alert.severity === 'warning' ? (
                      <AlertTriangle size={18} />
                    ) : (
                      <Info size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-xs">
                    <div className="flex items-center justify-between gap-sm">
                      <p className="text-body-md-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {alert.title}
                      </p>
                      <span className="text-label-caps uppercase text-on-surface-deep whitespace-nowrap">
                        {getTimeAgo(alert.created_at, nowLabel)}
                      </span>
                    </div>
                    <p className="text-body-sm-bold text-on-surface-deep line-clamp-2">{alert.message}</p>
                  </div>
                </div>
              ))}

              {/* Map Recent Activities if few alerts */}
              {alerts.length < 3 &&
                activities.slice(0, 3 - alerts.length).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-md p-md cursor-pointer hover:bg-surface-muted transition-colors duration-150 group"
                    onClick={() => navigate(getActivityRoute(activity))}
                  >
                    <div
                      className={`size-10 rounded-md shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${
                        activity.type === 'sale' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {activity.type === 'sale' ? <CheckCircle2 size={18} /> : <Activity size={18} />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-xs">
                      <div className="flex items-center justify-between gap-sm">
                        <p className="text-body-md-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {activity.description}
                        </p>
                        <span className="text-label-caps uppercase text-on-surface-deep whitespace-nowrap">
                          {getTimeAgo(activity.timestamp, nowLabel)}
                        </span>
                      </div>
                      <p className="text-body-sm-bold text-on-surface-deep">
                        {activity.user} {activity.amount ? `· ${formatCurrency(activity.amount)}` : ''}
                      </p>
                    </div>
                  </div>
                ))}

              {alerts.length === 0 && activities.length === 0 && (
                <div className="p-xl text-center">
                  <p className="text-body-md-bold text-on-surface-deep uppercase">
                    {t('dashboard.activity.noActivity', 'Sin actividad reciente.', {})}
                  </p>
                </div>
              )}
            </div>
            <div className="p-xs bg-surface-muted border-t border-border-subtle text-center">
              <button
                type="button"
                className="text-label-caps uppercase text-primary hover:underline"
                onClick={() => navigate('/dashboard/alerts')}
              >
                {t('dashboard.activity.viewAll', 'Ver Todas las Notificaciones', {})}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
