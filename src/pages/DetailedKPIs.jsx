import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import useDashboardStore from '../store/useDashboardStore';
import { formatPYG } from '@/utils/currencyUtils';
import { formatTimeInParaguayTimezone } from '@/utils/timeUtils';

/**
 * Dashboard Page - Executive BI Dashboard
 * Implements "Detailed KPIs Panel" spec with full i18n support.
 */
const DetailedKPIs = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const { summary, kpis, alerts, fetchDashboardData, fetchKPIData, loading, error } = useDashboardStore();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const loadData = async () => {
        await Promise.allSettled([
            fetchDashboardData(),
            fetchKPIData(period)
        ]);
        setLastUpdated(new Date());
    };
    loadData();
  }, [fetchDashboardData, fetchKPIData, period]);

  const formatCurrency = (val) => formatPYG(val);

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

  const vsLast30Days = t('dashboard.dashboard.kpi.vsPrevious30Days', 'vs. últimos 30 días');

  if (loading && !kpis && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
        <p className="text-lg font-medium text-slate-500">{t('dashboard.loading', 'Cargando indicadores...')}</p>
      </div>
    );
  }

  if (error && !kpis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="p-4 bg-red-100 rounded-full text-red-500 mb-4">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">{t('dashboard.error.title', 'Error al cargar los KPIs')}</h2>
          <p className="text-slate-500 mb-6 max-w-md">{error}</p>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
            onClick={() => fetchKPIData(period)}
          >
            {t('common.retry', 'Reintentar')}
          </button>
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
    <div className="max-w-7xl mx-auto flex flex-col gap-6 text-slate-900 dark:text-white pb-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t('dashboard.dashboard.actions.viewDetails', 'Panel de KPIs Detallado')}</h2>
          <p className="text-slate-500 mt-1 flex items-center gap-1 text-sm">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {t('dashboard.dashboard.activity.lastUpdated', 'Última actualización:')} {formatTimeInParaguayTimezone(lastUpdated)}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm" onClick={() => { fetchDashboardData(); fetchKPIData(period); }}>
            <span className="material-symbols-outlined text-[18px]">{loading ? 'refresh' : 'share'}</span>
            {t('common.share', 'Compartir')}
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200 dark:shadow-none">
            <span className="material-symbols-outlined text-[18px]">download</span>
            {t('dashboard.dashboard.actions.export', 'Exportar Informe')}
          </button>
        </div>
      </div>

      {/* Filters / Chips */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative group">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 transition-colors outline-none focus:ring-1 focus:ring-primary appearance-none pr-8 cursor-pointer"
          >
            <option value="today">Período: Hoy</option>
            <option value="week">Período: Esta Semana</option>
            <option value="month">Período: Este Mes</option>
            <option value="year">Período: Este Año</option>
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">arrow_drop_down</span>
        </div>
        
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
          Región: Global
          <span className="material-symbols-outlined text-[18px] text-slate-400">arrow_drop_down</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
          Depto: Todos
          <span className="material-symbols-outlined text-[18px] text-slate-400">arrow_drop_down</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
          Moneda: PYG
          <span className="material-symbols-outlined text-[18px] text-slate-400">arrow_drop_down</span>
        </button>
        <button className="ml-auto text-sm text-primary font-medium hover:underline" onClick={() => setPeriod('month')}>{t('common.clearFilters', 'Limpiar filtros')}</button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-40 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-primary">attach_money</span>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">{t('dashboard.dashboard.kpi.revenue', 'Ingresos Totales')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(revenueTotal)}</h3>
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-end justify-between gap-1 h-12">
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-sm h-full flex items-end overflow-hidden z-10">
                <div className="w-1/6 bg-primary/30 h-[40%]"></div>
                <div className="w-1/6 bg-primary/40 h-[60%]"></div>
                <div className="w-1/6 bg-primary/50 h-[50%]"></div>
                <div className="w-1/6 bg-primary/60 h-[70%]"></div>
                <div className="w-1/6 bg-primary/80 h-[55%]"></div>
                <div className="w-1/6 bg-primary h-[85%]"></div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 relative z-10">{vsLast30Days}</p>
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-40 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-purple-500">monitoring</span>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">{t('dashboard.dashboard.kpi.netProfit', 'Margen Neto')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{netMargin}%</h3>
            </div>
          </div>
          <div className="mt-auto relative z-10">
            <svg className="w-full h-10 text-purple-500 stroke-current" fill="none" viewBox="0 0 100 40">
              <path d="M0 30 Q 20 10 40 25 T 100 5" strokeLinecap="round" strokeWidth="2"></path>
              <defs>
                <linearGradient id="purpleGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path d="M0 30 Q 20 10 40 25 T 100 5 V 40 H 0 Z" fill="url(#purpleGradient)" stroke="none"></path>
            </svg>
            <p className="text-xs text-slate-400 mt-2">{vsLast30Days}</p>
          </div>
        </div>

        {/* Customers Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-40 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-blue-400">groups</span>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">{t('dashboard.dashboard.kpi.newCustomers', 'Clientes Nuevos')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{newCustomers.toLocaleString()}</h3>
            </div>
          </div>
          <div className="mt-auto relative z-10">
            <div className="flex items-end justify-between gap-1 h-12">
              <div className="w-full h-full flex items-end justify-between gap-1">
                <div className="w-1.5 bg-blue-200 dark:bg-slate-700 rounded-full h-[40%]"></div>
                <div className="w-1.5 bg-blue-200 dark:bg-slate-700 rounded-full h-[60%]"></div>
                <div className="w-1.5 bg-blue-200 dark:bg-slate-700 rounded-full h-[50%]"></div>
                <div className="w-1.5 bg-blue-200 dark:bg-slate-700 rounded-full h-[80%]"></div>
                <div className="w-1.5 bg-blue-200 dark:bg-slate-700 rounded-full h-[55%]"></div>
                <div className="w-1.5 bg-blue-200 dark:bg-slate-700 rounded-full h-[70%]"></div>
                <div className="w-1.5 bg-blue-200 dark:bg-slate-700 rounded-full h-[45%]"></div>
                <div className="w-1.5 bg-blue-400 rounded-full h-[65%]"></div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{vsLast30Days}</p>
          </div>
        </div>

        {/* Inventory Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-40 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-orange-400">inventory_2</span>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">{t('dashboard.dashboard.kpi.inventoryValue', 'Valor Inventario')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(inventoryValue)}</h3>
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50">
              <span className="material-symbols-outlined text-[14px] mr-0.5">check_circle</span>
              Saludable
            </span>
          </div>
          <div className="mt-auto w-full relative z-10">
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-orange-400 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>Nivel de Stock</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">75%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts / Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Sales & Efficiency */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.dashboard.salesEfficiency', 'Eficiencia de Ventas')}</h3>
          </div>
          <div className="p-6 space-y-6 flex-1">
            <div className="flex justify-between items-center group">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.dashboard.avgTicket', 'Ticket Promedio')}</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(avgTicket)}</span>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.dashboard.salesPerDay', 'Ventas por Día')}</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{salesPerDay}</span>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center group">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.dashboard.convRate', 'Tasa de Conversión')}</span>
                    <span className="text-lg font-bold text-primary">{convRate}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${convRate}%` }}></div>
                </div>
            </div>
            <div className="flex justify-between items-center group border-t border-slate-100 dark:border-slate-700 pt-4">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.dashboard.customerFrequency', 'Frecuencia de Compra')}</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{purchaseFreq}x</span>
            </div>
          </div>
        </div>

        {/* Financial Health */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.dashboard.financialHealth', 'Salud Financiera')}</h3>
          </div>
          <div className="p-6 space-y-6 flex-1">
            <div className="space-y-3">
                <div className="flex justify-between items-center group">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.dashboard.grossMargin', 'Margen Bruto')}</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{grossMargin}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${grossMargin}%` }}></div>
                </div>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.dashboard.netMargin', 'Margen Neto')}</span>
              <span className="text-lg font-bold text-emerald-600">{netMargin}%</span>
            </div>
            <div className="flex justify-between items-center group border-t border-slate-100 dark:border-slate-700 pt-4">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.dashboard.operatingRatio', 'Ratio Gasto Operativo')}</span>
              <span className="text-lg font-bold text-orange-500">{opExpenseRatio}%</span>
            </div>
          </div>
        </div>

        {/* Inventory Performance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.dashboard.inventoryPerformance', 'Rendimiento de Inventario')}</h3>
          </div>
          <div className="p-6 space-y-6 flex-1">
            <div className="flex justify-between items-center group">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.dashboard.turnoverRate', 'Tasa de Rotación')}</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{turnoverRate}x</span>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.dashboard.daysOfInventory', 'Días de Inventario')}</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{daysOfInventory} {t('common.days', 'días')}</span>
            </div>
            <div className="flex justify-between items-center group border-t border-slate-100 dark:border-slate-700 pt-4">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.dashboard.totalSKUs', 'Total SKUs Activos')}</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{totalProducts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts View - using Stitch format */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.dashboard.activity.title', 'Alertas Recientes')}</h3>
          <button className="text-sm text-primary font-medium hover:underline cursor-pointer" onClick={() => navigate('/dashboard/alerts')}>Ver Todo</button>
        </div>
        <div className="space-y-4">
          {alerts.slice(0, 5).map((alert) => {
            let borderClass = 'border-blue-500 bg-blue-50/50 dark:bg-transparent';
            let iconClass = 'text-blue-500';
            let iconText = 'info';

            if (alert.severity === 'critical') {
              borderClass = 'border-red-500 bg-red-50/50 dark:bg-transparent';
              iconClass = 'text-red-500';
              iconText = 'warning';
            } else if (alert.severity === 'warning') {
              borderClass = 'border-amber-400 bg-amber-50/50 dark:bg-transparent';
              iconClass = 'text-amber-500';
              iconText = 'trending_down'; // Match Stitch
            } else if (alert.severity === 'success') {
              borderClass = 'border-emerald-500 bg-emerald-50/50 dark:bg-transparent';
              iconClass = 'text-emerald-500';
              iconText = 'check_circle';
            }

            return (
              <div key={alert.id} className={`flex gap-4 items-start p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-l-4 ${borderClass}`} onClick={() => navigate('/dashboard/alerts')}>
                <div className="mt-0.5">
                  <span className={`material-symbols-outlined ${iconClass}`}>{iconText}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{alert.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{alert.message}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{getTimeAgo(alert.created_at)}</span>
              </div>
            );
          })}
          {alerts.length === 0 && (
            <div className="text-center py-6">
               <p className="text-sm text-slate-500">
                 {t('dashboard.dashboard.activity.noActivity', 'Sin alertas.')}
               </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default DetailedKPIs;
