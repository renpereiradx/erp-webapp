
import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../lib/i18n';
import useDashboardStore from '../store/useDashboardStore';
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

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '-';
    if (val >= 1000000) return `Gs. ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `Gs. ${(val / 1000).toFixed(0)}k`;
    return `Gs. ${val}`;
  };

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
      <div className="dashboard dashboard--loading">
        <RefreshCcw className="animate-spin text-primary" size={48} />
        <p className="text-lg font-medium text-tertiary">{t('dashboard.loading', 'Cargando indicadores...')}</p>
      </div>
    );
  }

  if (error && !kpis) {
    return (
      <div className="dashboard dashboard--error">
          <div className="p-4 bg-red-100 rounded-full text-red-600 mb-4">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t('dashboard.error.title', 'Error al cargar los KPIs')}</h2>
          <p className="text-tertiary mb-6">{error}</p>
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
    <div className="dashboard detailed-kpis">
      {/* Page Header */}
      <div className="dashboard__header">
        <div className="dashboard__titles">
          <h2 className="dashboard__title">{t('dashboard.dashboard.actions.viewDetails', 'Panel de KPIs Detallado')}</h2>
          <p className="dashboard__subtitle" style={{ fontSize: '14px', maxWidth: '600px', marginBottom: '8px' }}>
            {t('dashboard.dashboard.executive.panelSubtitle', 'Análisis detallado de rentabilidad, eficiencia de ventas y gestión de inventario para la toma de decisiones estratégicas.')}
          </p>
          <p className="dashboard__subtitle" style={{ opacity: 0.7 }}>
            <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
            {t('dashboard.dashboard.activity.lastUpdated', 'Última actualización')}: {lastUpdated}
          </p>
        </div>
        <div className="dashboard__actions">
          <Button variant="primary" onClick={() => { fetchDashboardData(); fetchKPIData(period); }}>
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            {t('common.refresh', 'Actualizar')}
          </Button>
          <Button variant="secondary">
            <Download size={18} />
            {t('dashboard.dashboard.actions.export', 'Exportar')}
          </Button>
        </div>
      </div>

      {/* 1.1 BI Navigation */}
      <DashboardNav />

      {/* Filters */}
      <div className="dashboard__filters" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        <SegmentedControl
            options={['today', 'week', 'month', 'year'].map(p => ({
                value: p,
                label: t(`common.${p}`, p)
            }))}
            value={period}
            onChange={setPeriod}
            size="small"
        />
        
        <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" style={{ color: 'var(--action-primary)', fontWeight: 500 }}>
              {t('common.clearFilters', 'Limpiar filtros')}
            </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="dashboard__kpi-grid">
        {/* Revenue */}
        <Card className="kpi-card">
          <CardContent className="pt-6">
            <div className="kpi-card__background-icon icon-blue">
              <DollarSign />
            </div>
            <div className="kpi-card__header">
              <div>
                <p className="kpi-card__label">{t('dashboard.dashboard.kpi.revenue', 'Ingresos Totales')}</p>
                <h3 className="kpi-card__value">{formatCurrency(revenueTotal)}</h3>
              </div>
              <Badge variant="subtle-success" className="gap-1">
                <TrendingUp size={14} /> +12%
              </Badge>
            </div>
            <p className="kpi-card__footer-text">{vsLast30Days}</p>
          </CardContent>
        </Card>

        {/* Profit */}
        <Card className="kpi-card">
          <CardContent className="pt-6">
            <div className="kpi-card__background-icon icon-purple">
              <Percent />
            </div>
            <div className="kpi-card__header">
              <div>
                <p className="kpi-card__label">{t('dashboard.dashboard.kpi.netProfit', 'Margen Neto')}</p>
                <h3 className="kpi-card__value">{netMargin}%</h3>
              </div>
              <Badge variant="subtle-success" className="gap-1">
                <TrendingUp size={14} /> +3.2%
              </Badge>
            </div>
            <p className="kpi-card__footer-text">{vsLast30Days}</p>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="kpi-card">
          <CardContent className="pt-6">
            <div className="kpi-card__background-icon icon-blue">
              <Users />
            </div>
            <div className="kpi-card__header">
              <div>
                <p className="kpi-card__label">{t('dashboard.dashboard.kpi.totalCustomers', 'Total Clientes')}</p>
                <h3 className="kpi-card__value">{totalCustomers.toLocaleString()}</h3>
              </div>
            </div>
            <p className="kpi-card__footer-text">
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>+{newCustomers}</span> {t('dashboard.dashboard.kpi.newThisMonth', 'nuevos este mes')}
            </p>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card className="kpi-card">
          <CardContent className="pt-6">
            <div className="kpi-card__background-icon icon-orange">
              <Package />
            </div>
            <div className="kpi-card__header">
              <div>
                <p className="kpi-card__label">{t('dashboard.dashboard.kpi.inventoryValue', 'Valor de Inventario')}</p>
                <h3 className="kpi-card__value">{formatCurrency(inventoryValue)}</h3>
              </div>
            </div>
            <p className="kpi-card__footer-text">
              <span style={{ fontWeight: 600, color: 'var(--warning)' }}>{lowStockCount}</span> {t('dashboard.dashboard.inventory.lowStock', 'productos con stock bajo')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Sections */}
      <div className="dashboard__detailed-grid">
        
        {/* Sales & Efficiency */}
        <Card className="col-span-4">
          <CardHeader className="border-b border-subtle pb-3 mb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity size={18} className="text-primary" />
              {t('dashboard.dashboard.salesEfficiency', 'Eficiencia de Ventas')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            <div className="flex justify-between items-center">
              <span className="text-sm text-tertiary">{t('dashboard.dashboard.avgTicket', 'Ticket Promedio')}</span>
              <span className="font-bold">{formatCurrency(avgTicket)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-tertiary">{t('dashboard.dashboard.salesPerDay', 'Ventas por Día')}</span>
              <span className="font-bold">{salesPerDay}</span>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-tertiary">{t('dashboard.dashboard.convRate', 'Tasa de Conversión')}</span>
                    <span className="font-bold text-primary">{convRate}%</span>
                </div>
                <Progress value={convRate} className="h-2" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-tertiary">{t('dashboard.dashboard.customerFrequency', 'Frecuencia de Compra')}</span>
              <span className="font-bold">{purchaseFreq}x</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Health */}
        <Card className="col-span-4">
          <CardHeader className="border-b border-subtle pb-3 mb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign size={18} className="text-purple-600" />
              {t('dashboard.dashboard.financialHealth', 'Salud Financiera')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-tertiary">{t('dashboard.dashboard.grossMargin', 'Margen Bruto')}</span>
                  <span className="font-bold">{grossMargin}%</span>
                </div>
                <Progress value={grossMargin} className="h-2" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-tertiary">{t('dashboard.dashboard.netMargin', 'Margen Neto')}</span>
              <span className="font-bold text-success-foreground">{netMargin}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-tertiary">{t('dashboard.dashboard.operatingRatio', 'Ratio Gasto Operativo')}</span>
              <span className="font-bold">{opExpenseRatio}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Performance */}
        <Card className="col-span-4">
          <CardHeader className="border-b border-subtle pb-3 mb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package size={18} className="text-orange-500" />
              {t('dashboard.dashboard.inventoryPerformance', 'Rendimiento de Inventario')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            <div className="flex justify-between items-center">
              <span className="text-sm text-tertiary">{t('dashboard.dashboard.turnoverRate', 'Tasa de Rotación')}</span>
              <span className="font-bold">{turnoverRate}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-tertiary">{t('dashboard.dashboard.daysOfInventory', 'Días de Inventario')}</span>
              <span className="font-bold">{daysOfInventory} {t('common.days', 'días')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-tertiary">{t('dashboard.dashboard.totalSKUs', 'Total SKUs Activos')}</span>
              <span className="font-bold">{totalProducts}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts (Bottom Row) */}
        <Card className="col-span-12">
          <CardHeader className="mb-4 flex flex-row items-center justify-between">
            <CardTitle>{t('dashboard.dashboard.activity.title', 'Alertas de Impacto')}</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              {t('common.viewAll', 'Ver Todas')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="activity-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.slice(0, 6).map((alert) => (
                  <div key={alert.id} className={`activity-item activity-item--${alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}`}>
                      <div className="activity-item__icon">
                          {alert.severity === 'critical' ? <AlertTriangle size={20} /> : <Activity size={20} />}
                      </div>
                      <div className="activity-item__content">
                          <p className="activity-item__title font-bold">{alert.title}</p>
                          <p className="activity-item__desc text-tertiary text-xs">{alert.message}</p>
                      </div>
                      <span className="activity-item__time text-[10px] opacity-60 ml-auto">{getTimeAgo(alert.created_at)}</span>
                  </div>
              ))}
              {alerts.length === 0 && (
                  <div className="col-span-full p-8 text-center text-tertiary">
                      {t('dashboard.dashboard.activity.noActivity', 'Sin alertas críticas.')}
                  </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DetailedKPIs;
