
import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import useDashboardStore from '../store/useDashboardStore';
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
import DashboardNav from '../components/business-intelligence/DashboardNav';
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

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
      <div className="dashboard dashboard--loading">
          <RefreshCcw className="animate-spin text-primary" size={48} />
          <p className="text-lg font-medium text-tertiary">{t('dashboard.loading', 'Cargando dashboard...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard dashboard--error">
          <div className="p-4 bg-red-100 rounded-full text-red-600 mb-4">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t('dashboard.error.title', 'Error al cargar el Dashboard')}</h2>
          <p className="text-tertiary mb-6">{error}</p>
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
    <div className="dashboard">
      {/* 1. Header */}
      <div className="dashboard__header">
        <div className="dashboard__titles">
           <h1 className="dashboard__title">{t('dashboard.executive.title', 'Resumen Ejecutivo')}</h1>
           <p className="dashboard__subtitle">{t('dashboard.executive.subtitle', 'Visión general en tiempo real de los indicadores clave')}</p>
        </div>
         <div className="dashboard__actions">
            <Button variant="secondary" size="md" className="btn--shadow" onClick={() => navigate('/configuracion')}>
                <Calendar size={18} />
                <span>{t('dashboard.actions.dateRange', 'Últimos 30 Días')}</span>
                <ArrowRight size={16} style={{ transform: 'rotate(90deg)', opacity: 0.5 }} />
            </Button>
             <Button variant="primary" size="md">
                <Download size={18} />
                <span>{t('dashboard.actions.export', 'Exportar Informe')}</span>
            </Button>
        </div>
      </div>

      {/* 1.1 BI Navigation */}
      <DashboardNav />

       {/* 2. Top KPI Cards */}
       <div className="dashboard__kpi-grid">
           {/* Total Sales */}
           <div className="card kpi-card cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/dashboard/kpis')}>
               <div className="kpi-card__header">
                   <div className="kpi-card__icon kpi-card__icon--blue">
                       <DollarSign size={24} />
                   </div>
                   {/* Trend data would come from /dashboard/trends, using placeholder for now */}
                   <div className="kpi-card__trend kpi-card__trend--up">
                       <TrendingUp size={14} />
                       <span>12%</span>
                   </div>
               </div>
               <div>
                   <p className="kpi-card__label">{t('dashboard.kpi.totalSales', 'Ventas Totales')}</p>
                   <h3 className="kpi-card__value">{formatCurrency(salesTotal)}</h3>
               </div>
           </div>

           {/* Purchases */}
           <div className="card kpi-card cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/compras')}>
               <div className="kpi-card__header">
                   <div className="kpi-card__icon kpi-card__icon--orange">
                       <ShoppingCart size={24} />
                   </div>
                   <div className="kpi-card__trend kpi-card__trend--down">
                       <TrendingDown size={14} />
                       <span>5%</span>
                   </div>
               </div>
               <div>
                   <p className="kpi-card__label">{t('dashboard.kpi.purchases', 'Compras')}</p>
                   <h3 className="kpi-card__value">{formatCurrency(purchasesTotal)}</h3>
               </div>
           </div>

           {/* Net Profit */}
           <div className="card kpi-card cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/dashboard/kpis')}>
               <div className="kpi-card__header">
                   <div className="kpi-card__icon kpi-card__icon--green">
                       <TrendingUp size={24} />
                   </div>
                   <div className="kpi-card__trend kpi-card__trend--up">
                       <TrendingUp size={14} />
                       <span>18%</span>
                   </div>
               </div>
               <div>
                   <p className="kpi-card__label">{t('dashboard.kpi.netProfit', 'Ganancia Bruta')}</p>
                   <h3 className="kpi-card__value">{formatCurrency(grossProfit)}</h3>
               </div>
           </div>

           {/* Daily Transactions */}
           <div className="card kpi-card cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/ventas')}>
               <div className="kpi-card__header">
                   <div className="kpi-card__icon kpi-card__icon--purple">
                       <Receipt size={24} />
                   </div>
                   <div className="kpi-card__trend kpi-card__trend--up">
                       <TrendingUp size={14} />
                       <span>2%</span>
                   </div>
               </div>
                <div>
                   <p className="kpi-card__label">{t('dashboard.kpi.dailyTransactions', 'Transacciones Diarias')}</p>
                   <h3 className="kpi-card__value">{salesCount.toLocaleString()}</h3>
               </div>
           </div>
       </div>

       {/* 3. Main Chart & Operations */}
       <div className="dashboard__main-grid">
           {/* Revenue vs Expenses Chart (Area) */}
           <div className="card chart-card lg:col-span-2">
               <div className="chart-card__header">
                   <div>
                       <h3 className="card__title">{t('dashboard.charts.revVsExp', 'Ingresos vs Gastos')}</h3>
                       <p className="card__subtitle">{t('dashboard.charts.revenueVsExpenses.subtitle', 'Rendimiento en el tiempo')}</p>
                   </div>
                   <div className="chart-card__legend">
                       <div className="chart-card__legend-item">
                           <span className="dot" style={{backgroundColor: '#137fec'}}></span>
                           <span className="label">{t('dashboard.revenue', 'Ingresos')}</span>
                       </div>
                       <div className="chart-card__legend-item">
                           <span className="dot" style={{backgroundColor: '#cbd5e1'}}></span>
                           <span className="label">{t('dashboard.expenses', 'Gastos')}</span>
                       </div>
                   </div>
               </div>
               <div className="chart-card__container" style={{ height: 300, marginTop: '1.5rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueExpensesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-subtle)" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fill: 'var(--text-tertiary)', fontSize: 11, fontWeight: 500}} 
                              dy={15}
                            />
                            <Tooltip 
                               contentStyle={{ 
                                   borderRadius: '8px', 
                                   border: '1px solid var(--border-subtle)',
                                   boxShadow: 'var(--shadow-8)',
                                   fontSize: '12px',
                                   backgroundColor: 'var(--bg-paper)',
                                   color: 'var(--text-primary)'
                               }}
                            />
                            <Area 
                               type="monotone" 
                               dataKey="revenue" 
                               stroke="#137fec" 
                               fillOpacity={1} 
                               fill="url(#colorRevenue)" 
                               strokeWidth={3} 
                               className="revenue-area"
                               animateNewValues
                            />
                            <Area 
                               type="monotone" 
                               dataKey="expenses" 
                               stroke="#cbd5e1" 
                               fill="none" 
                               strokeDasharray="6 6" 
                               strokeWidth={3} 
                               animateNewValues
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
           </div>

           {/* Operations Stack */}
           <div className="operations-stack" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               {/* Inventory Valuation */}
               <div className="card operation-card cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/ajuste-inventario-masivo')}>
                    <div className="operation-card__deco operation-card__deco--orange"></div>
                    <div className="operation-card__content">
                        <div className="operation-card__header">
                            <div className="operation-card__icon operation-card__icon--orange">
                                <Package size={22} />
                            </div>
                            <h4 className="operation-card__title">{t('dashboard.kpi.inventory', 'Inventario')}</h4>
                        </div>
                        <p className="kpi-card__label">{t('dashboard.operations.inventory.valuation', 'Valuación Total')}</p>
                        <h3 className="kpi-card__value">{formatCurrency(inventoryValue)}</h3>
                        
                        <div className={`operation-card__alert ${lowStockCount > 0 ? 'operation-card__alert--warning' : ''}`}>
                            <AlertTriangle size={18} />
                            <span>{t('dashboard.operations.inventory.lowStock', '{count} Artículos con bajo stock', { count: lowStockCount }).replace('{count}', lowStockCount)}</span>
                        </div>
                    </div>
               </div>

                {/* Cash Register */}
               <div className="card operation-card cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/caja-registradora')}>
                    <div className="operation-card__deco operation-card__deco--green"></div>
                     <div className="operation-card__content">
                        <div className="operation-card__header">
                            <div className="operation-card__icon operation-card__icon--green">
                                <CreditCard size={22} />
                            </div>
                            <h4 className="operation-card__title">{t('dashboard.kpi.cashRegister', 'Caja Registradora')}</h4>
                        </div>
                        <p className="kpi-card__label">{t('dashboard.operations.cashRegister.balance', 'Saldo Actual')}</p>
                        <h3 className="kpi-card__value">{formatCurrency(cashBalance)}</h3>
                        
                        <div className="progress" style={{marginTop: '1.5rem', height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden'}}>
                            <div style={{width: '75%', height: '100%', backgroundColor: '#10b981', borderRadius: '3px'}}></div>
                        </div>
                         <p style={{marginTop: '0.75rem', fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'right', fontWeight: 600}}>
                             {t('dashboard.operations.cashRegister.target', 'Meta')}: {formatCurrency(5500000)}
                         </p>
                    </div>
               </div>
           </div>
       </div>

       {/* 4. Bottom Row: Finance & Activity */}
       <div className="dashboard__bottom-grid">
           {/* Finance Overview */}
           <div className="card finance-card">
               <div className="card__header" style={{ marginBottom: '1.5rem', justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
                   <h3 className="card__title" style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('dashboard.finance.title', 'Resumen Financiero')}</h3>
                   <Button variant="ghost" size="sm" className="text-primary font-bold" onClick={() => navigate('/receivables')}>{t('dashboard.actions.viewReport', 'Ver Reporte')}</Button>
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Receivables */}
                   <div className="finance-group cursor-pointer group" onClick={() => navigate('/receivables')}>
                       <div className="finance-group__header">
                           <div className="flex flex-col">
                               <p className="finance-group__label group-hover:text-primary transition-colors">{t('dashboard.finance.receivables', 'Cuentas por Cobrar')}</p>
                               <h4 className="finance-group__value">{formatCurrency(receivablesTotal)}</h4>
                           </div>
                           <span className="finance-group__trend finance-group__trend--positive">+8.5%</span>
                       </div>
                       <div className="progress" style={{height: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden'}}>
                            <div style={{width: '65%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '5px'}}></div>
                       </div>
                   </div>
                    {/* Payables */}
                   <div className="finance-group cursor-pointer group" onClick={() => navigate('/pagos-compras')}>
                       <div className="finance-group__header">
                           <div className="flex flex-col">
                               <p className="finance-group__label group-hover:text-primary transition-colors">{t('dashboard.finance.payables', 'Cuentas por Pagar')}</p>
                               <h4 className="finance-group__value">{formatCurrency(payablesTotal)}</h4>
                           </div>
                           <span className="finance-group__trend finance-group__trend--neutral">Normal</span>
                       </div>
                        <div className="progress" style={{height: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden'}}>
                            <div style={{width: '40%', height: '100%', backgroundColor: '#f97316', borderRadius: '5px'}}></div>
                        </div>
                   </div>
               </div>

               <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '2rem' }}>
                   <div style={{ flex: 1 }}>
                       <p className="finance-group__label" style={{fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)'}}>
                           {t('dashboard.finance.netCashflow', 'Flujo de Caja Neto')}
                       </p>
                       <p className="finance-group__value" style={{fontSize: '1.125rem', marginTop: '4px'}}>
                           {salesTotal - purchasesTotal > 0 ? '+' : ''}{formatCurrency(salesTotal - purchasesTotal)}
                       </p>
                   </div>
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate('/receivables/overdue')}>
                       <p className="finance-group__label" style={{fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)'}}>
                           {t('dashboard.finance.overdueInvoices', 'Facturas Vencidas')}
                       </p>
                       <p className="finance-group__value" style={{fontSize: '1.125rem', color: receivablesOverdue > 0 ? '#dc2626' : 'inherit', marginTop: '4px'}}>
                           {receivablesOverdue}
                       </p>
                   </div>
               </div>
           </div>

           {/* Recent Alerts & Activity */}
           <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
               <div className="card__header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-subtle)' }}>
                   <h3 className="card__title" style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('dashboard.activity.title', 'Alertas y Actividad Reciente')}</h3>
                   <div className="badge-group">
                       <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#dc2626', display: 'inline-block' }} className="animate-pulse"></span>
                       <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('dashboard.activity.live', 'Live')}</span>
                   </div>
               </div>
               <div className="activity-list">
                   {/* Map Alerts */}
                   {alerts.slice(0, 3).map((alert) => (
                       <div 
                         key={alert.id} 
                         className="activity-item cursor-pointer hover:bg-red-50/30 transition-colors"
                         onClick={() => alert.action_url ? navigate(alert.action_url) : navigate('/dashboard/alerts')}
                       >
                           <div className={`activity-item__icon activity-item__icon--${alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}`}>
                               {alert.severity === 'critical' ? <AlertTriangle size={18} /> : alert.severity === 'warning' ? <AlertTriangle size={18} /> : <Info size={18} />}
                           </div>
                           <div className="activity-item__content">
                               <div className="activity-item__header">
                                   <p className="activity-item__title">{alert.title}</p>
                                   <span className="activity-item__time">{getTimeAgo(alert.created_at)}</span>
                               </div>
                               <p className="activity-item__desc">{alert.message}</p>
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
                          className="activity-item cursor-pointer hover:bg-blue-50/30 transition-colors"
                          onClick={() => navigate(getActivityRoute())}
                        >
                            <div className={`activity-item__icon activity-item__icon--${activity.type === 'sale' ? 'success' : 'info'}`}>
                                {activity.type === 'sale' ? <CheckCircle2 size={18} /> : <Activity size={18} />}
                            </div>
                            <div className="activity-item__content">
                                <div className="activity-item__header">
                                    <p className="activity-item__title">{activity.description}</p>
                                    <span className="activity-item__time">{getTimeAgo(activity.timestamp)}</span>
                                </div>
                                <p className="activity-item__desc">
                                    {activity.user} {activity.amount ? `- ${formatCurrency(activity.amount)}` : ''}
                                </p>
                            </div>
                        </div>
                       );
                   })}

                   {alerts.length === 0 && activities.length === 0 && (
                       <div className="p-8 text-center text-tertiary">
                           {t('dashboard.activity.noActivity', 'Sin actividad reciente.')}
                       </div>
                   )}
               </div>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    <button className="text-primary font-bold text-xs uppercase tracking-wider hover:underline" onClick={() => navigate('/dashboard/alerts')}>
                         {t('dashboard.activity.viewAll', 'Ver Todas las Notificaciones')} 
                    </button>
                </div>
           </div>
       </div>
    </div>
  );
};

export default Dashboard;
