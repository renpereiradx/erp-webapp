
import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../lib/i18n';
import useDashboardStore from '../store/useDashboardStore';
import { formatPYG } from '@/utils/currencyUtils';
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Package,
  Calendar,
  Download,
  Share2,
  Clock,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  RefreshCcw,
  Percent,
  BarChart3
} from 'lucide-react';
// ... rest of imports
import { Button } from '../components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import SegmentedControl from '../components/ui/SegmentedControl';
import DashboardNav from '../components/business-intelligence/DashboardNav';

/**
 * Dashboard Page - Executive BI Dashboard
 * Implements "Detailed KPIs Panel" spec with full i18n support.
 */
const DetailedKPIs = () => {
  const { t } = useI18n();
  const [period, setPeriod] = useState('month');
  const { summary, kpis, alerts, activities, fetchDashboardData, fetchKPIData, loading, error } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
    fetchKPIData(period);
  }, [fetchDashboardData, fetchKPIData, period]);

  const formatCurrency = (val) => formatPYG(val);
  const formatCompact = (val) => formatPYG(val, { compact: true });

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return t('dashboard.activity.now', 'ahora');
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    return date.toLocaleDateString();
  };

  const lastUpdated = "Hoy, 15:52";
  const vsLast30Days = t('dashboard.dashboard.kpi.vsPrevious30Days', 'vs. últimos 30 días');

  if (loading && !kpis && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCcw className="animate-spin text-primary" size={48} />
        <p className="text-lg font-medium text-text-secondary">{t('dashboard.loading', 'Cargando indicadores...')}</p>
      </div>
    );
  }

  if (error && !kpis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="p-4 bg-red-100 rounded-full text-error mb-4">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-text-main">{t('dashboard.error.title', 'Error al cargar los KPIs')}</h2>
          <p className="text-text-secondary mb-6 max-w-md">{error}</p>
          <Button variant="primary" onClick={() => fetchKPIData(period)}>
            {t('common.retry', 'Reintentar')}
          </Button>
      </div>
    );
  }

  // API Data Mappings
  const revenueTotal = summary?.sales?.total || 0;
  const netMargin = kpis?.financial_kpis?.net_margin || 0;
  const grossMargin = kpis?.financial_kpis?.gross_margin || 0;
  const opExpenseRatio = kpis?.financial_kpis?.operating_expense_ratio || 0;

  const totalCustomers = kpis?.customer_kpis?.total_customers || 0;
  const newCustomers = kpis?.customer_kpis?.new_customers || 0;
  const activeCustomers = kpis?.customer_kpis?.active_customers || 0;
  const purchaseFreq = kpis?.customer_kpis?.average_purchase_frequency || 0;

  const inventoryValue = summary?.inventory?.total_value || 0;
  const totalProducts = summary?.inventory?.total_products || 0;
  const lowStockCount = summary?.inventory?.low_stock_count || 0;
  const turnoverRate = kpis?.inventory_kpis?.turnover_rate || 0;
  const daysOfInventory = kpis?.inventory_kpis?.days_of_inventory || 0;

  const avgTicket = kpis?.sales_kpis?.average_ticket || 0;
  const salesPerDay = kpis?.sales_kpis?.sales_per_day || 0;
  const convRate = kpis?.sales_kpis?.conversion_rate || 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-text-main tracking-tight uppercase">{t('dashboard.dashboard.actions.viewDetails', 'Panel de KPIs Detallado')}</h1>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-text-secondary font-medium max-w-2xl">
              {t('dashboard.dashboard.executive.panelSubtitle', 'Análisis detallado de rentabilidad, eficiencia de ventas y gestión de inventario para la toma de decisiones estratégicas.')}
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">
              <Clock size={14} />
              <span>{t('dashboard.dashboard.activity.lastUpdated', 'Última actualización')}: {lastUpdated}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" className="shadow-md" onClick={() => { fetchDashboardData(); fetchKPIData(period); }}>
            <RefreshCcw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Actualizar')}
          </Button>
          <Button variant="secondary" size="md" className="shadow-sm border-border-subtle">
            <Download size={18} className="mr-2" />
            {t('dashboard.dashboard.actions.export', 'Exportar')}
          </Button>
        </div>
      </div>

      {/* 1.1 BI Navigation */}
      <DashboardNav />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-surface p-4 rounded-xl border border-border-subtle shadow-sm">
        <SegmentedControl
            options={['today', 'week', 'month', 'year'].map(p => ({
                value: p,
                label: t(`common.${p}`, p)
            }))}
            value={period}
            onChange={setPeriod}
            size="small"
        />
        
        <div className="ml-auto">
            <Button variant="ghost" size="sm" className="text-primary font-bold uppercase tracking-widest text-[11px] hover:bg-blue-50">
              {t('common.clearFilters', 'Limpiar filtros')}
            </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <DollarSign size={24} />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-success text-xs font-bold">
                <TrendingUp size={14} /> 
                <span>12%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{t('dashboard.dashboard.kpi.revenue', 'Ingresos Totales')}</p>
              <h3 className="text-2xl font-black text-text-main tracking-tight">{formatCurrency(revenueTotal)}</h3>
              <p className="text-[10px] font-bold text-text-secondary opacity-60 uppercase tracking-wider">{vsLast30Days}</p>
            </div>
        </div>

        {/* Profit */}
        <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="size-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                <Percent size={24} />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-success text-xs font-bold">
                <TrendingUp size={14} /> 
                <span>3.2%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{t('dashboard.dashboard.kpi.netProfit', 'Margen Neto')}</p>
              <h3 className="text-2xl font-black text-text-main tracking-tight">{netMargin}%</h3>
              <p className="text-[10px] font-bold text-text-secondary opacity-60 uppercase tracking-wider">{vsLast30Days}</p>
            </div>
        </div>

        {/* Customers */}
        <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group">
            <div className="flex items-start mb-4">
              <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{t('dashboard.dashboard.kpi.totalCustomers', 'Total Clientes')}</p>
              <h3 className="text-2xl font-black text-text-main tracking-tight">{totalCustomers.toLocaleString()}</h3>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                <span className="text-success font-black">+{newCustomers}</span> {t('dashboard.dashboard.kpi.newThisMonth', 'nuevos este mes')}
              </p>
            </div>
        </div>

        {/* Inventory */}
        <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group">
            <div className="flex items-start mb-4">
              <div className="size-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{t('dashboard.dashboard.kpi.inventoryValue', 'Valor de Inventario')}</p>
              <h3 className="text-2xl font-black text-text-main tracking-tight">{formatCurrency(inventoryValue)}</h3>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                <span className="text-orange-600 font-black">{lowStockCount}</span> {t('dashboard.dashboard.inventory.lowStock', 'productos con stock bajo')}
              </p>
            </div>
        </div>
      </div>

      {/* Detailed Metrics Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Sales & Efficiency */}
        <div className="bg-surface rounded-xl shadow-fluent-2 border border-border-subtle flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50">
            <h3 className="text-sm font-black text-text-main uppercase tracking-tight flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              {t('dashboard.dashboard.salesEfficiency', 'Eficiencia de Ventas')}
            </h3>
          </div>
          <div className="p-6 space-y-6 flex-1">
            <div className="flex justify-between items-center group">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest group-hover:text-primary transition-colors">{t('dashboard.dashboard.avgTicket', 'Ticket Promedio')}</span>
              <span className="text-base font-black text-text-main">{formatCurrency(avgTicket)}</span>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest group-hover:text-primary transition-colors">{t('dashboard.dashboard.salesPerDay', 'Ventas por Día')}</span>
              <span className="text-base font-black text-text-main">{salesPerDay}</span>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest group-hover:text-primary transition-colors">{t('dashboard.dashboard.convRate', 'Tasa de Conversión')}</span>
                    <span className="text-base font-black text-primary">{convRate}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${convRate}%` }}></div>
                </div>
            </div>
            <div className="flex justify-between items-center group border-t border-border-subtle pt-4">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest group-hover:text-primary transition-colors">{t('dashboard.dashboard.customerFrequency', 'Frecuencia de Compra')}</span>
              <span className="text-base font-black text-text-main">{purchaseFreq}x</span>
            </div>
          </div>
        </div>

        {/* Financial Health */}
        <div className="bg-surface rounded-xl shadow-fluent-2 border border-border-subtle flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50">
            <h3 className="text-sm font-black text-text-main uppercase tracking-tight flex items-center gap-2">
              <DollarSign size={18} className="text-purple-600" />
              {t('dashboard.dashboard.financialHealth', 'Salud Financiera')}
            </h3>
          </div>
          <div className="p-6 space-y-6 flex-1">
            <div className="space-y-3">
                <div className="flex justify-between items-center group">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-widest group-hover:text-primary transition-colors">{t('dashboard.dashboard.grossMargin', 'Margen Bruto')}</span>
                  <span className="text-base font-black text-text-main">{grossMargin}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full transition-all duration-1000" style={{ width: `${grossMargin}%` }}></div>
                </div>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest group-hover:text-primary transition-colors">{t('dashboard.dashboard.netMargin', 'Margen Neto')}</span>
              <span className="text-base font-black text-success">{netMargin}%</span>
            </div>
            <div className="flex justify-between items-center group border-t border-border-subtle pt-4">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest group-hover:text-primary transition-colors">{t('dashboard.dashboard.operatingRatio', 'Ratio Gasto Operativo')}</span>
              <span className="text-base font-black text-orange-600">{opExpenseRatio}%</span>
            </div>
          </div>
        </div>

        {/* Inventory Performance */}
        <div className="bg-surface rounded-xl shadow-fluent-2 border border-border-subtle flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50">
            <h3 className="text-sm font-black text-text-main uppercase tracking-tight flex items-center gap-2">
              <Package size={18} className="text-orange-500" />
              {t('dashboard.dashboard.inventoryPerformance', 'Rendimiento de Inventario')}
            </h3>
          </div>
          <div className="p-6 space-y-6 flex-1">
            <div className="flex justify-between items-center group">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest group-hover:text-primary transition-colors">{t('dashboard.dashboard.turnoverRate', 'Tasa de Rotación')}</span>
              <span className="text-base font-black text-text-main">{turnoverRate}x</span>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest group-hover:text-primary transition-colors">{t('dashboard.dashboard.daysOfInventory', 'Días de Inventario')}</span>
              <span className="text-base font-black text-text-main">{daysOfInventory} {t('common.days', 'días')}</span>
            </div>
            <div className="flex justify-between items-center group border-t border-border-subtle pt-4">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest group-hover:text-primary transition-colors">{t('dashboard.dashboard.totalSKUs', 'Total SKUs Activos')}</span>
              <span className="text-base font-black text-text-main">{totalProducts}</span>
            </div>
          </div>
        </div>

        {/* Recent Alerts (Bottom Row) */}
        <div className="lg:col-span-3 bg-surface rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden">
          <div className="px-8 py-5 border-b border-border-subtle flex items-center justify-between bg-slate-50/50">
            <h3 className="text-lg font-black text-text-main uppercase tracking-tight">{t('dashboard.dashboard.activity.title', 'Alertas de Impacto')}</h3>
            <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-blue-50">
              {t('common.viewAll', 'Ver Todas')}
            </Button>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alerts.slice(0, 6).map((alert) => (
                  <div key={alert.id} className="flex gap-4 p-4 rounded-xl border border-border-subtle bg-slate-50/30 hover:bg-slate-50 transition-colors group cursor-pointer">
                      <div className={`size-10 rounded-lg flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${
                          alert.severity === 'critical' ? 'bg-red-50 text-error' : 
                          alert.severity === 'warning' ? 'bg-amber-50 text-amber-600' : 
                          'bg-blue-50 text-primary'
                      }`}>
                          {alert.severity === 'critical' ? <AlertTriangle size={20} /> : <Activity size={20} />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-4">
                              <p className="text-sm font-bold text-text-main truncate group-hover:text-primary transition-colors">{alert.title}</p>
                              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary whitespace-nowrap">{getTimeAgo(alert.created_at)}</span>
                          </div>
                          <p className="text-xs text-text-secondary line-clamp-2">{alert.message}</p>
                      </div>
                  </div>
              ))}
              {alerts.length === 0 && (
                  <div className="col-span-full p-12 text-center">
                      <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">
                        {t('dashboard.dashboard.activity.noActivity', 'Sin alertas críticas.')}
                      </p>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedKPIs;
