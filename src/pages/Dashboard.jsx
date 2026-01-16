
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
  ArrowRight
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
  const { summary, loading, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Mock Data for "Revenue vs Expenses" Area Chart
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
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(val);
  };

  const totalSales = summary?.sales?.total || 124500;
  const netProfit = summary?.profit?.gross || 79300;
  
  return (
    <div className="dashboard">
      {/* 1. Header */}
      <div className="dashboard__header">
        <div className="dashboard__titles">
           <h1 className="dashboard__title">{t('dashboard.executive.title', 'Resumen Ejecutivo')}</h1>
           <p className="dashboard__subtitle">{t('dashboard.executive.subtitle', 'Visión general en tiempo real de los indicadores clave')}</p>
        </div>
         <div className="dashboard__actions">
            <Button variant="secondary" size="md" className="btn--shadow">
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

       {/* 2. Top KPI Cards */}
       <div className="dashboard__kpi-grid">
           {/* Total Sales */}
           <div className="card kpi-card">
               <div className="kpi-card__header">
                   <div className="kpi-card__icon kpi-card__icon--blue">
                       <DollarSign size={24} />
                   </div>
                   <div className="kpi-card__trend kpi-card__trend--up">
                       <TrendingUp size={14} />
                       <span>12%</span>
                   </div>
               </div>
               <div>
                   <p className="kpi-card__label">{t('dashboard.kpi.totalSales', 'Ventas Totales')}</p>
                   <h3 className="kpi-card__value">{formatCurrency(totalSales)}</h3>
               </div>
           </div>

           {/* Purchases */}
           <div className="card kpi-card">
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
                   <h3 className="kpi-card__value">{formatCurrency(45200)}</h3>
               </div>
           </div>

           {/* Net Profit */}
           <div className="card kpi-card">
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
                   <p className="kpi-card__label">{t('dashboard.kpi.netProfit', 'Ganancia Neta')}</p>
                   <h3 className="kpi-card__value">{formatCurrency(netProfit)}</h3>
               </div>
           </div>

           {/* Daily Transactions */}
           <div className="card kpi-card">
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
                   <h3 className="kpi-card__value">1,204</h3>
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
                       <p className="card__subtitle">Rendimiento en el tiempo</p>
                   </div>
                   <div className="chart-card__legend">
                       <div className="chart-card__legend-item">
                           <span className="dot" style={{backgroundColor: '#137fec'}}></span>
                           <span className="label">Ingresos</span>
                       </div>
                       <div className="chart-card__legend-item">
                           <span className="dot" style={{backgroundColor: '#cbd5e1'}}></span>
                           <span className="label">Gastos</span>
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
                                   fontSize: '12px'
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
               <div className="card operation-card">
                    <div className="operation-card__deco operation-card__deco--orange"></div>
                    <div className="operation-card__content">
                        <div className="operation-card__header">
                            <div className="operation-card__icon operation-card__icon--orange">
                                <Package size={22} />
                            </div>
                            <h4 className="operation-card__title">{t('dashboard.kpi.inventory', 'Inventario')}</h4>
                        </div>
                        <p className="kpi-card__label">Valuación Total</p>
                        <h3 className="kpi-card__value">$500,000</h3>
                        
                        <div className="operation-card__alert">
                            <AlertTriangle size={18} />
                            <span>5 Productos con Stock Bajo</span>
                        </div>
                    </div>
               </div>

                {/* Cash Register */}
               <div className="card operation-card">
                    <div className="operation-card__deco operation-card__deco--green"></div>
                     <div className="operation-card__content">
                        <div className="operation-card__header">
                            <div className="operation-card__icon operation-card__icon--green">
                                <CreditCard size={22} />
                            </div>
                            <h4 className="operation-card__title">{t('dashboard.kpi.cashRegister', 'Caja Registradora')}</h4>
                        </div>
                        <p className="kpi-card__label">Saldo Actual</p>
                        <h3 className="kpi-card__value">$4,250</h3>
                        
                        <div className="progress" style={{marginTop: '1.5rem', height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden'}}>
                            <div style={{width: '75%', height: '100%', backgroundColor: '#10b981', borderRadius: '3px'}}></div>
                        </div>
                         <p style={{marginTop: '0.75rem', fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'right', fontWeight: 600}}>Objetivo: $5,500</p>
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
                   <Button variant="ghost" size="sm" className="text-primary font-bold">{t('dashboard.actions.viewReport', 'Ver Informe')}</Button>
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Receivables */}
                   <div className="finance-group">
                       <div className="finance-group__header">
                           <div className="flex flex-col">
                               <p className="finance-group__label">Cuentas por Cobrar</p>
                               <h4 className="finance-group__value">{formatCurrency(20000)}</h4>
                           </div>
                           <span className="finance-group__trend finance-group__trend--positive">+8.5%</span>
                       </div>
                       <div className="progress" style={{height: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden'}}>
                            <div style={{width: '65%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '5px'}}></div>
                       </div>
                   </div>
                    {/* Payables */}
                   <div className="finance-group">
                       <div className="finance-group__header">
                           <div className="flex flex-col">
                               <p className="finance-group__label">Cuentas por Pagar</p>
                               <h4 className="finance-group__value">{formatCurrency(12000)}</h4>
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
                       <p className="finance-group__label" style={{fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)'}}>Flujo de Caja Neto</p>
                       <p className="finance-group__value" style={{fontSize: '1.125rem', marginTop: '4px'}}>+{formatCurrency(8000)}</p>
                   </div>
                    <div style={{ flex: 1 }}>
                       <p className="finance-group__label" style={{fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)'}}>Facturas Vencidas</p>
                       <p className="finance-group__value" style={{fontSize: '1.125rem', color: '#dc2626', marginTop: '4px'}}>3</p>
                   </div>
               </div>
           </div>

           {/* Recent Alerts & Activity */}
           <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
               <div className="card__header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-subtle)' }}>
                   <h3 className="card__title" style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('dashboard.recentAlerts', 'Alertas y Actividad Reciente')}</h3>
                   <div className="badge-group">
                       <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#dc2626', display: 'inline-block' }} className="animate-pulse"></span>
                       <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Live</span>
                   </div>
               </div>
               <div className="activity-list">
                   {/* Alert 1 */}
                   <div className="activity-item">
                       <div className="activity-item__icon activity-item__icon--error">
                           <AlertTriangle size={18} />
                       </div>
                       <div className="activity-item__content">
                           <div className="activity-item__header">
                               <p className="activity-item__title">Alerta de Stock: Item #4922</p>
                               <span className="activity-item__time">hace 2m</span>
                           </div>
                           <p className="activity-item__desc">El nivel de inventario cayó por debajo del umbral (5 unidades).</p>
                       </div>
                   </div>
                   {/* Alert 2 */}
                    <div className="activity-item">
                       <div className="activity-item__icon activity-item__icon--success">
                           <CheckCircle2 size={18} />
                       </div>
                       <div className="activity-item__content">
                           <div className="activity-item__header">
                               <p className="activity-item__title">Orden Grande #1024 Aprobada</p>
                               <span className="activity-item__time">hace 45m</span>
                           </div>
                           <p className="activity-item__desc">Orden por valor de $12,500 aprobada por el Depto. de Finanzas.</p>
                       </div>
                   </div>
                    {/* Alert 3 */}
                    <div className="activity-item">
                       <div className="activity-item__icon activity-item__icon--info">
                           <Info size={18} />
                       </div>
                       <div className="activity-item__content">
                           <div className="activity-item__header">
                               <p className="activity-item__title">Mantenimiento del Sistema</p>
                               <span className="activity-item__time">hace 2h</span>
                           </div>
                           <p className="activity-item__desc">Tiempo de inactividad programado para el sábado 2:00 AM.</p>
                       </div>
                   </div>
               </div>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    <button className="text-primary font-bold text-xs uppercase tracking-wider hover:underline" onClick={() => navigate('/dashboard/kpis')}>
                         {t('dashboard.actions.viewDetails', 'Ver Todas las Notificaciones')} 
                    </button>
                </div>
           </div>
       </div>
    </div>
  );
};

export default Dashboard;
