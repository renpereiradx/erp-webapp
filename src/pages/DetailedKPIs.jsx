
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

/**
 * Dashboard Page - Executive BI Dashboard
 * Implements "Detailed KPIs Panel" spec with full i18n support.
 */
const DetailedKPIs = () => {
  const { t } = useI18n();
  const [period, setPeriod] = useState('month');
  const { summary, kpis, alerts, activities, fetchDashboardData, fetchKPIData, loading, error } = useDashboardStore();

  useEffect(() => {
    // Load summary and alerts/activity for context
    fetchDashboardData();
    // Load specific KPIs
    fetchKPIData(period);
  }, [fetchDashboardData, fetchKPIData, period]);

  // Mock Data for "Revenue vs Budget" (Year to Date)
  // This could later be replaced by /dashboard/trends or similar if needed
  const revenueData = useMemo(() => [
    { name: 'Jan', actual: 45000, budget: 50000 },
    { name: 'Feb', actual: 52000, budget: 48000 },
    { name: 'Mar', actual: 48000, budget: 50000 },
    { name: 'Apr', actual: 61000, budget: 55000 },
    { name: 'May', actual: 55000, budget: 58000 },
    { name: 'Jun', actual: 67000, budget: 65000 },
    { name: 'Jul', actual: 72000, budget: 68000 },
    { name: 'Aug', actual: 69000, budget: 70000 },
    { name: 'Sep', actual: 75000, budget: 72000 }, 
  ], []);

  // Mock Data for Inventory Distribution
  const inventoryData = useMemo(() => [
    { name: 'Electronics', value: 45, color: '#137fec' },
    { name: 'Apparel', value: 25, color: '#8764b8' },
    { name: 'Home Goods', value: 20, color: '#f59e0b' },
    { name: 'Others', value: 10, color: '#cbd5e1' },
  ], []);

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

  const lastUpdated = "Hoy, 9:41 AM";
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

  // KPI Mappings
  const revenueTotal = summary?.sales?.total || 0;
  const netMargin = kpis?.financial_kpis?.net_margin || 0;
  const newCustomers = kpis?.customer_kpis?.new_customers || 0;
  const inventoryValue = summary?.inventory?.total_value || 0;
  const stockLevel = 75; // Still mock or calculate if possible

  return (
    <div className="dashboard detailed-kpis">
      {/* 1. Page Header */}
      <div className="dashboard__header">
        <div className="dashboard__titles">
          <h2 className="dashboard__title">{t('dashboard.dashboard.actions.viewDetails', 'Panel de KPIs Detallado')}</h2>
          <p className="dashboard__subtitle" style={{ fontSize: '14px', maxWidth: '600px', marginBottom: '8px' }}>
            {t('dashboard.dashboard.executive.panelSubtitle', 'Consulte los Indicadores Clave de Desempeño (KPIs - Key Performance Indicators) para monitorear la salud y el rendimiento del negocio en tiempo real.')}
          </p>
          <p className="dashboard__subtitle" style={{ opacity: 0.7 }}>
            <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
            {t('dashboard.dashboard.activity.lastUpdated', 'Última actualización')}: {lastUpdated}
          </p>
        </div>
        <div className="dashboard__actions">
          <Button variant="secondary">
            <Share2 size={18} />
            {t('common.share', 'Compartir')}
          </Button>
          <Button variant="primary">
            <Download size={18} />
            {t('dashboard.dashboard.actions.export', 'Exportar Reporte')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="dashboard__filters" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        <Button variant="filter">
          <Calendar size={18} />
          {t('common.period', 'Periodo')}: {t(`common.${period}`, period)}
          <ChevronDown size={18} />
        </Button>
        {/* Period Selector (Simple) */}
        <div className="flex bg-paper rounded-lg p-1 border border-subtle">
            {['today', 'week', 'month', 'year'].map(p => (
                <button 
                  key={p} 
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${period === p ? 'bg-primary text-white' : 'hover:bg-hover'}`}
                >
                    {t(`common.${p}`, p)}
                </button>
            ))}
        </div>
        
        <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" style={{ color: 'var(--action-primary)', fontWeight: 500 }}>
              {t('common.clearFilters', 'Limpiar filtros')}
            </Button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="dashboard__kpi-grid">
        {/* Revenue Card */}
        <div className="card kpi-card">
          <div className="kpi-card__background-icon icon-blue">
             <DollarSign />
          </div>
          <div className="kpi-card__header">
            <div>
              <p className="kpi-card__label">{t('dashboard.dashboard.kpi.revenue', 'Ingresos Totales')}</p>
              <h3 className="kpi-card__value">{formatCurrency(revenueTotal)}</h3>
            </div>
            <span className="kpi-card__trend kpi-card__trend--up">
              <TrendingUp size={14} />
              +12.5%
            </span>
          </div>
          <div className="kpi-card__visual-container">
             {[0.4, 0.6, 0.5, 0.7, 0.55, 1.0].map((h, i) => (
                <div key={i} style={{ flex: 1, backgroundColor: i === 5 ? '#137fec' : '#bfdbfe', height: `${h * 100}%`, borderRadius: '2px', margin: '0 2px' }}></div>
             ))}
          </div>
          <p className="kpi-card__footer-text">{vsLast30Days}</p>
        </div>

        {/* Profit Card (Net Margin) */}
        <div className="card kpi-card">
           <div className="kpi-card__background-icon icon-purple">
             <Percent />
          </div>
          <div className="kpi-card__header">
            <div>
              <p className="kpi-card__label">{t('dashboard.dashboard.kpi.netProfit', 'Margen Neto')}</p>
              <h3 className="kpi-card__value">{netMargin}%</h3>
            </div>
            <span className="kpi-card__trend kpi-card__trend--up">
              <TrendingUp size={14} />
              +5.2%
            </span>
          </div>
          <div className="kpi-card__visual-container">
            <svg width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                  <linearGradient id="purpleGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2"></stop>
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0"></stop>
                  </linearGradient>
              </defs>
              <path d="M0 30 Q 20 10 40 25 T 100 5 V 40 H 0 Z" fill="url(#purpleGradient)" stroke="none" />
              <path d="M0 30 Q 20 10 40 25 T 100 5" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="kpi-card__footer-text">{vsLast30Days}</p>
        </div>

        {/* Customers Card */}
        <div className="card kpi-card">
           <div className="kpi-card__background-icon icon-blue">
             <Users />
          </div>
          <div className="kpi-card__header">
            <div>
              <p className="kpi-card__label">{t('dashboard.dashboard.kpi.newCustomers', 'Nuevos Clientes')}</p>
              <h3 className="kpi-card__value">{newCustomers.toLocaleString()}</h3>
            </div>
            <span className="kpi-card__trend kpi-card__trend--down">
              <TrendingDown size={14} />
              -2.1%
            </span>
          </div>
           <div className="kpi-card__visual-container">
             {[0.4, 0.6, 0.5, 0.8, 0.55, 0.7, 0.45, 0.65].map((h, i) => (
                <div key={i} style={{ flex: 1, backgroundColor: i === 7 ? '#60a5fa' : '#bfdbfe', height: `${h * 100}%`, borderRadius: '99px', margin: '0 2px' }}></div>
             ))}
          </div>
          <p className="kpi-card__footer-text">{vsLast30Days}</p>
        </div>

        {/* Inventory Card */}
        <div className="card kpi-card">
           <div className="kpi-card__background-icon icon-orange">
             <Package />
          </div>
          <div className="kpi-card__header">
            <div>
              <p className="kpi-card__label">{t('dashboard.dashboard.kpi.inventoryValue', 'Valor de Inventario')}</p>
              <h3 className="kpi-card__value">{formatCurrency(inventoryValue)}</h3>
            </div>
            <span className="kpi-card__trend kpi-card__trend--up" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={14} />
              {t('dashboard.dashboard.kpi.healthy', 'Saludable')}
            </span>
          </div>
          <div className="kpi-card__visual-container" style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch' }}>
            <div className="progress progress--thick">
                 <div className="progress__track">
                    <div className="progress__fill" style={{width: `${stockLevel}%`, backgroundColor: '#fb923c'}}></div>
                 </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>Stock Level</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stockLevel}%</span>
            </div>
          </div>
          <p className="kpi-card__footer-text" style={{visibility: 'hidden'}}>-</p>
        </div>
      </div>

      {/* 3. Main Charts Section */}
      <div className="dashboard__detailed-grid">
        {/* Sales vs Budget Chart (Large - 8 cols) */}
        <div className="card chart-card col-span-8">
          <div className="card__header">
            <div>
              <h3 className="card__title" style={{ fontSize: '18px', fontWeight: 700 }}>{t('dashboard.dashboard.revenueVsBudget', 'Ingresos vs Presupuesto')}</h3>
              <p className="card__subtitle">Rendimiento anual</p>
            </div>
             <div className="chart-card__legend">
                 <div className="chart-card__legend-item">
                     <span className="dot" style={{backgroundColor: '#137fec'}}></span>
                     <span className="label">{t('dashboard.dashboard.revenue', 'Ingresos')}</span>
                 </div>
                 <div className="chart-card__legend-item">
                     <span className="dot" style={{backgroundColor: '#cbd5e1'}}></span>
                     <span className="label">{t('dashboard.dashboard.budget', 'Presupuesto')}</span>
                 </div>
             </div>
          </div>
          <div className="chart-card__container" style={{ height: '256px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} barGap={8}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} dy={10} />
                <Tooltip 
                   cursor={{ fill: 'var(--bg-subtle)' }}
                   contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                 />
                <Bar dataKey="budget" fill="#cbd5e1" radius={[2, 2, 0, 0]} barSize={32} />
                <Bar dataKey="actual" fill="#137fec" radius={[2, 2, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Distribution (Donut - 4 cols) */}
        <div className="card chart-card col-span-4">
          <div className="card__header">
             <div>
                <h3 className="card__title" style={{ fontSize: '18px', fontWeight: 700 }}>{t('dashboard.dashboard.inventoryByCategory', 'Inventario por Cat.')}</h3>
             </div>
             <Button variant="ghost" size="icon">
                <BarChart3 size={20} />
             </Button>

          </div>
          <div className="chart-card__container--donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                   data={inventoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div style={{ 
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
              textAlign: 'center', pointerEvents: 'none' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{(summary?.inventory?.total_products || 4520).toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('dashboard.dashboard.inventory.title', 'Artículos')}</div>
            </div>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {inventoryData.map((item) => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Alerts & Map */}
      <div className="dashboard__detailed-grid">
        {/* Recent Alerts List (6 cols) */}
        <div className="card col-span-6">
          <div className="card__header">
            <h3 className="card__title" style={{ fontSize: '18px', fontWeight: 700 }}>{t('dashboard.dashboard.activity.title', 'Alertas de Impacto')}</h3>
            <Button variant="ghost" size="sm" style={{ color: 'var(--action-primary)' }}>
              {t('dashboard.dashboard.activity.viewAll', 'Ver Todas')}
            </Button>
          </div>
          <div className="activity-list">
             {/* Map Real Alerts */}
             {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className={`activity-item activity-item--${alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}`}>
                    <div className="activity-item__icon">
                        {alert.severity === 'critical' ? <AlertTriangle size={20} /> : alert.severity === 'warning' ? <TrendingDown size={20} /> : <CheckCircle2 size={20} />}
                    </div>
                    <div className="activity-item__content">
                        <p className="activity-item__title">{alert.title}</p>
                        <p className="activity-item__desc">{alert.message}</p>
                    </div>
                    <span className="activity-item__time">{getTimeAgo(alert.created_at)}</span>
                </div>
             ))}
             
             {alerts.length === 0 && (
                <div className="p-8 text-center text-tertiary">
                    {t('dashboard.dashboard.activity.noActivity', 'Sin alertas críticas.')}
                </div>
             )}
          </div>
        </div>

        {/* Regional Performance Map (6 cols) - Mostly Visual/Marketing for now */}
        <div className="card col-span-6">
          <div className="card__header">
            <h3 className="card__title" style={{ fontSize: '18px', fontWeight: 700 }}>{t('dashboard.dashboard.regional.title', 'Rendimiento Regional')}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" size="icon" style={{ borderRadius: '8px' }}>
                <Plus size={18} />
              </Button>
              <Button variant="secondary" size="icon" style={{ borderRadius: '8px' }}>
                <Minus size={18} />
              </Button>
            </div>
          </div>
          <div className="regional-map" style={{ height: '280px' }}>
            <div className="regional-map__bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')" }}></div>
            <div className="regional-map__marker" style={{ top: '35%', left: '25%' }}>
              <div className="regional-map__dot" style={{ boxShadow: '0 0 0 4px rgba(13, 110, 253, 0.2)' }}></div>
              <div className="regional-map__tooltip">
                <p>Norte</p>
                <p className="growth">+12% {t('dashboard.dashboard.regional.growth', 'Crecimiento')}</p>
              </div>
            </div>
             <div className="regional-map__marker" style={{ top: '45%', left: '50%' }}>
              <div className="regional-map__dot" style={{ backgroundColor: '#8764b8' }}></div>
              <div className="regional-map__tooltip">
                <p>Central</p>
                <p>{t('dashboard.dashboard.regional.stable', 'Estable')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedKPIs;
