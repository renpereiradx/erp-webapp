
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import useDashboardStore from '../store/useDashboardStore';
import { formatTimeInParaguayTimezone } from '@/utils/timeUtils';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Activity,
  Receipt,
  Package,
  CreditCard,
  AlertTriangle,
  Info,
  CheckCircle2,
  Calendar,
  Download,
  ArrowRight,
  RefreshCcw,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

/**
 * Executive Dashboard - High level summary
 */
const Dashboard = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { summary, alerts, activities, loading, error, fetchDashboardData } = useDashboardStore();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardData().then(() => setLastUpdated(new Date()));
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    await fetchDashboardData();
    setLastUpdated(new Date());
  };

  // Mock Data for "Revenue vs Expenses" Area Chart
  // In a future step, this could also be fetched from /dashboard/trends or similar
  const revenueExpensesData = useMemo(() => [
    { name: 'Jan 1', revenue: 4000, expenses: 2400 },
    { name: 'Jan 5', revenue: 3000, expenses: 1398 },
    { name: 'Jan 10', revenue: 2000, expenses: 9800 },
    { name: 'Jan 15', revenue: 2780, expenses: 3908 },
    { name: 'Jan 20', revenue: 1890, expenses: 4800 },
    { name: 'Jan 25', revenue: 2390, expenses: 3800 },
    { name: 'Jan 30', revenue: 3490, expenses: 4300 },
  ], []);

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '-';
    return new Intl.NumberFormat('es-PY', { 
      style: 'currency', 
      currency: 'PYG', 
      maximumFractionDigits: 0 
    }).format(val);
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

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <RefreshCcw className="animate-spin text-primary" size={48} />
          <p className="text-lg font-medium text-text-secondary">{t('dashboard.loading', 'Cargando dashboard...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="p-4 bg-red-100 rounded-full text-error mb-4">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-text-main">{t('dashboard.error.title', 'Error al cargar el Dashboard')}</h2>
          <p className="text-text-secondary mb-6 max-w-md">{error}</p>
          <Button variant="primary" onClick={() => fetchDashboardData()}>
            {t('common.retry', 'Reintentar')}
          </Button>
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

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
           <h1 className="text-3xl font-black text-text-main tracking-tight uppercase">{t('dashboard.executive.title', 'Resumen Ejecutivo')}</h1>
           <p className="text-sm text-text-secondary font-medium">{t('dashboard.executive.subtitle', 'Visión general en tiempo real de los indicadores clave')} • {formatTimeInParaguayTimezone(lastUpdated)}</p>
        </div>
         <div className="flex items-center gap-3">
            <Button variant="secondary" size="md" className="shadow-sm border-border-subtle" onClick={() => navigate('/configuracion')}>
                <Calendar size={18} className="mr-2" />
                <span>{t('dashboard.actions.dateRange', 'Últimos 30 Días')}</span>
                <ArrowRight size={16} className="ml-2 opacity-50 rotate-90" />
            </Button>
             <Button variant="primary" size="md" className="shadow-md">
                <Download size={18} className="mr-2" />
                <span>{t('dashboard.actions.export', 'Exportar Informe')}</span>
            </Button>
        </div>
      </div>

      {/* 1.1 BI Navigation */}

       {/* 2. Top KPI Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {/* Total Sales */}
           <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all cursor-pointer group" onClick={() => navigate('/dashboard/kpis')}>
               <div className="flex items-start justify-between mb-4">
                   <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                       <DollarSign size={24} />
                   </div>
                   <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-success text-xs font-bold">
                       <TrendingUp size={14} />
                       <span>12%</span>
                   </div>
               </div>
               <div>
                   <p className="text-xs font-black uppercase tracking-widest text-text-secondary mb-1">{t('dashboard.kpi.totalSales', 'Ventas Totales')}</p>
                   <h3 className="text-2xl font-black text-text-main tracking-tight">{formatCurrency(salesTotal)}</h3>
               </div>
           </div>

           {/* Purchases */}
           <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all cursor-pointer group" onClick={() => navigate('/compras')}>
               <div className="flex items-start justify-between mb-4">
                   <div className="size-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                       <ShoppingCart size={24} />
                   </div>
                   <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-error text-xs font-bold">
                       <TrendingDown size={14} />
                       <span>5%</span>
                   </div>
               </div>
               <div>
                   <p className="text-xs font-black uppercase tracking-widest text-text-secondary mb-1">{t('dashboard.kpi.purchases', 'Compras')}</p>
                   <h3 className="text-2xl font-black text-text-main tracking-tight">{formatCurrency(purchasesTotal)}</h3>
               </div>
           </div>

           {/* Net Profit */}
           <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all cursor-pointer group" onClick={() => navigate('/dashboard/kpis')}>
               <div className="flex items-start justify-between mb-4">
                   <div className="size-12 rounded-lg bg-green-50 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                       <TrendingUp size={24} />
                   </div>
                   <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-success text-xs font-bold">
                       <TrendingUp size={14} />
                       <span>18%</span>
                   </div>
               </div>
               <div>
                   <p className="text-xs font-black uppercase tracking-widest text-text-secondary mb-1">{t('dashboard.kpi.netProfit', 'Ganancia Bruta')}</p>
                   <h3 className="text-2xl font-black text-text-main tracking-tight">{formatCurrency(grossProfit)}</h3>
               </div>
           </div>

           {/* Daily Transactions */}
           <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all cursor-pointer group" onClick={() => navigate('/ventas')}>
               <div className="flex items-start justify-between mb-4">
                   <div className="size-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                       <Receipt size={24} />
                   </div>
                   <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-success text-xs font-bold">
                       <TrendingUp size={14} />
                       <span>2%</span>
                   </div>
               </div>
                <div>
                   <p className="text-xs font-black uppercase tracking-widest text-text-secondary mb-1">{t('dashboard.kpi.dailyTransactions', 'Transacciones Diarias')}</p>
                   <h3 className="text-2xl font-black text-text-main tracking-tight">{salesCount.toLocaleString()}</h3>
               </div>
           </div>
       </div>

       {/* 3. Main Chart & Operations */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Revenue vs Expenses Chart (Area) */}
           <div className="lg:col-span-2 bg-surface p-8 rounded-xl shadow-fluent-2 border border-border-subtle">
               <div className="flex items-center justify-between mb-8">
                   <div className="space-y-1">
                       <h3 className="text-lg font-black text-text-main uppercase tracking-tight">{t('dashboard.charts.revVsExp', 'Ingresos vs Gastos')}</h3>
                       <p className="text-xs text-text-secondary font-medium">{t('dashboard.charts.revenueVsExpenses.subtitle', 'Rendimiento en el tiempo')}</p>
                   </div>
                   <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2">
                           <span className="size-2 rounded-full bg-primary"></span>
                           <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('dashboard.revenue', 'Ingresos')}</span>
                       </div>
                       <div className="flex items-center gap-2">
                           <span className="size-2 rounded-full bg-slate-300"></span>
                           <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('dashboard.expenses', 'Gastos')}</span>
                       </div>
                   </div>
               </div>
                <div className="h-[300px] w-full">
                    {isMounted && revenueExpensesData && revenueExpensesData.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={revenueExpensesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#106ebe" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#106ebe" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
                                <XAxis 
                                  dataKey="name" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fill: '#616161', fontSize: 11, fontWeight: 600}} 
                                  dy={15}
                                />
                                <Tooltip 
                                   contentStyle={{ 
                                       borderRadius: '8px', 
                                       border: '1px solid #e5e7eb',
                                       boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                       fontSize: '12px',
                                       backgroundColor: '#ffffff',
                                       color: '#242424',
                                       fontWeight: 600
                                   }}
                                />
                                <Area 
                                   type="monotone" 
                                   dataKey="revenue" 
                                   stroke="#106ebe" 
                                   fillOpacity={1} 
                                   fill="url(#colorRevenue)" 
                                   strokeWidth={3} 
                                   animationDuration={1000}
                                />
                                <Area 
                                   type="monotone" 
                                   dataKey="expenses" 
                                   stroke="#cbd5e1" 
                                   fill="none" 
                                   strokeDasharray="6 6" 
                                   strokeWidth={3} 
                                   animationDuration={1000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
           </div>

           {/* Operations Stack */}
           <div className="flex flex-col gap-6">
               {/* Inventory Valuation */}
               <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle relative overflow-hidden group cursor-pointer hover:shadow-fluent-8 transition-all" onClick={() => navigate('/ajuste-inventario-masivo')}>
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                <Package size={22} />
                            </div>
                            <h4 className="text-sm font-black text-text-main uppercase tracking-tight">{t('dashboard.kpi.inventory', 'Inventario')}</h4>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">{t('dashboard.operations.inventory.valuation', 'Valuación Total')}</p>
                            <h3 className="text-2xl font-black text-text-main tracking-tight">{formatCurrency(inventoryValue)}</h3>
                        </div>
                        
                        <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-bold ${lowStockCount > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-green-50 text-success border border-green-100'}`}>
                            <AlertTriangle size={18} className={lowStockCount > 0 ? 'animate-pulse' : ''} />
                            <span>{t('dashboard.operations.inventory.lowStock', '{count} Artículos con bajo stock', { count: lowStockCount }).replace('{count}', lowStockCount)}</span>
                        </div>
                    </div>
               </div>

                {/* Cash Register */}
               <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle relative overflow-hidden group cursor-pointer hover:shadow-fluent-8 transition-all" onClick={() => navigate('/caja-registradora')}>
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-success"></div>
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-green-50 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                                <CreditCard size={22} />
                            </div>
                            <h4 className="text-sm font-black text-text-main uppercase tracking-tight">{t('dashboard.kpi.cashRegister', 'Caja Registradora')}</h4>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">{t('dashboard.operations.cashRegister.balance', 'Saldo Actual')}</p>
                            <h3 className="text-2xl font-black text-text-main tracking-tight">{formatCurrency(cashBalance)}</h3>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-success rounded-full" style={{ width: '75%' }}></div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                <span>{t('dashboard.operations.cashRegister.target', 'Meta')}</span>
                                <span className="text-text-main">{formatCurrency(5500000)}</span>
                            </div>
                        </div>
                    </div>
               </div>
           </div>
       </div>

       {/* 4. Bottom Row: Finance & Activity */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
           {/* Finance Overview */}
           <div className="bg-surface p-8 rounded-xl shadow-fluent-2 border border-border-subtle flex flex-col">
               <div className="flex items-center justify-between mb-8">
                   <h3 className="text-lg font-black text-text-main uppercase tracking-tight">{t('dashboard.finance.title', 'Resumen Financiero')}</h3>
                   <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-blue-50" onClick={() => navigate('/receivables')}>{t('dashboard.actions.viewReport', 'Ver Reporte')}</Button>
               </div>
               
               <div className="space-y-8 flex-1">
                    {/* Receivables */}
                   <div className="group cursor-pointer space-y-3" onClick={() => navigate('/receivables')}>
                       <div className="flex items-end justify-between">
                           <div className="space-y-1">
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary group-hover:text-primary transition-colors">{t('dashboard.finance.receivables', 'Cuentas por Cobrar')}</p>
                               <h4 className="text-xl font-black text-text-main">{formatCurrency(receivablesTotal)}</h4>
                           </div>
                           <span className="text-xs font-bold text-success bg-green-50 px-2 py-1 rounded">+8.5%</span>
                       </div>
                       <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
                       </div>
                   </div>
                    {/* Payables */}
                   <div className="group cursor-pointer space-y-3" onClick={() => navigate('/pagos-compras')}>
                       <div className="flex items-end justify-between">
                           <div className="space-y-1">
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary group-hover:text-primary transition-colors">{t('dashboard.finance.payables', 'Cuentas por Pagar')}</p>
                               <h4 className="text-xl font-black text-text-main">{formatCurrency(payablesTotal)}</h4>
                           </div>
                           <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">Normal</span>
                       </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: '40%' }}></div>
                        </div>
                   </div>
               </div>

               <div className="mt-8 pt-8 border-t border-border-subtle grid grid-cols-2 gap-8">
                   <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                           {t('dashboard.finance.netCashflow', 'Flujo de Caja Neto')}
                       </p>
                       <p className={`text-lg font-black ${salesTotal - purchasesTotal > 0 ? 'text-success' : 'text-error'}`}>
                           {salesTotal - purchasesTotal > 0 ? '+' : ''}{formatCurrency(salesTotal - purchasesTotal)}
                       </p>
                   </div>
                    <div className="cursor-pointer group" onClick={() => navigate('/receivables/overdue')}>
                       <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1 group-hover:text-primary transition-colors">
                           {t('dashboard.finance.overdueInvoices', 'Facturas Vencidas')}
                       </p>
                       <p className={`text-lg font-black ${receivablesOverdue > 0 ? 'text-error' : 'text-text-main'}`}>
                           {receivablesOverdue}
                       </p>
                   </div>
               </div>
           </div>

           {/* Recent Alerts & Activity */}
           <div className="bg-surface rounded-xl shadow-fluent-2 border border-border-subtle flex flex-col overflow-hidden">
               <div className="px-8 py-5 border-b border-border-subtle flex items-center justify-between bg-slate-50/50">
                   <h3 className="text-lg font-black text-text-main uppercase tracking-tight">{t('dashboard.activity.title', 'Alertas y Actividad Reciente')}</h3>
                   <div className="flex items-center gap-2 px-2 py-1 rounded bg-white border border-border-subtle shadow-sm">
                       <span className="size-2 rounded-full bg-error animate-pulse"></span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{t('dashboard.activity.live', 'Live')}</span>
                   </div>
               </div>
               <div className="flex-1 divide-y divide-border-subtle">
                   {/* Map Alerts */}
                   {alerts.slice(0, 3).map((alert) => (
                       <div 
                         key={alert.id} 
                         className="flex gap-4 p-6 cursor-pointer hover:bg-slate-50 transition-colors group"
                         onClick={() => alert.action_url ? navigate(alert.action_url) : navigate('/dashboard/alerts')}
                       >
                           <div className={`size-10 rounded-lg flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${
                               alert.severity === 'critical' ? 'bg-red-50 text-error' : 
                               alert.severity === 'warning' ? 'bg-amber-50 text-amber-600' : 
                               'bg-blue-50 text-primary'
                           }`}>
                               {alert.severity === 'critical' ? <AlertTriangle size={18} /> : alert.severity === 'warning' ? <AlertTriangle size={18} /> : <Info size={18} />}
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

                   {/* Map Recent Activities if few alerts */}
                   {alerts.length < 3 && activities.slice(0, 3 - alerts.length).map((activity) => {
                       const getActivityRoute = () => {
                           if (activity.type === 'sale') return `/cobros-ventas/${activity.details?.sale_id || ''}`;
                           if (activity.type === 'purchase') return `/pagos-compras/${activity.details?.purchase_id || ''}`;
                           if (activity.type === 'payment') return activity.details?.sale_id ? `/cobros-ventas/${activity.details.sale_id}/pagos` : '/movimientos-caja';
                           return '/dashboard';
                       };

                       return (
                        <div 
                          key={activity.id} 
                          className="flex gap-4 p-6 cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => navigate(getActivityRoute())}
                        >
                            <div className={`size-10 rounded-lg flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${
                                activity.type === 'sale' ? 'bg-green-50 text-success' : 'bg-blue-50 text-primary'
                            }`}>
                                {activity.type === 'sale' ? <CheckCircle2 size={18} /> : <Activity size={18} />}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm font-bold text-text-main truncate group-hover:text-primary transition-colors">{activity.description}</p>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary whitespace-nowrap">{getTimeAgo(activity.timestamp)}</span>
                                </div>
                                <p className="text-xs text-text-secondary">
                                    {activity.user} {activity.amount ? `· ${formatCurrency(activity.amount)}` : ''}
                                </p>
                            </div>
                        </div>
                       );
                   })}

                   {alerts.length === 0 && activities.length === 0 && (
                       <div className="p-12 text-center">
                           <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">
                               {t('dashboard.activity.noActivity', 'Sin actividad reciente.')}
                           </p>
                       </div>
                   )}
               </div>
                <div className="p-4 bg-slate-50/50 border-t border-border-subtle text-center">
                    <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline" onClick={() => navigate('/dashboard/alerts')}>
                         {t('dashboard.activity.viewAll', 'Ver Todas las Notificaciones')} 
                    </button>
                </div>
           </div>
       </div>
    </div>
  );
};

export default Dashboard;
