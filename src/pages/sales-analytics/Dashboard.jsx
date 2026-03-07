import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Search, 
  Bell, 
  Settings, 
  MoreHorizontal, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import salesAnalyticsService from '@/services/salesAnalyticsService';
import { MOCK_DASHBOARD } from '@/services/mocks/salesAnalyticsMock';

const Dashboard = () => {
  const [data, setData] = useState(MOCK_DASHBOARD.data);
  const [period, setPeriod] = useState('mes');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await salesAnalyticsService.getDashboard(period);
        if (response && response.success) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Fallback to mock data already set
      }
    };
    fetchData();
  }, [period]);

  const kpis = useMemo(() => data.kpis, [data]);
  const trends = useMemo(() => data.trends, [data]);
  const alerts = useMemo(() => data.alerts, [data]);
  const topProducts = useMemo(() => data.top_products, [data]);
  const paymentMix = useMemo(() => data.payment_mix, [data]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold tracking-tight">Dashboard de Ventas</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Resumen ejecutivo del rendimiento comercial y financiero</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-10 items-center rounded-lg bg-slate-200/50 dark:bg-slate-800 p-1">
              {['hoy', 'semana', 'mes', 'año'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex cursor-pointer h-full items-center justify-center rounded-lg px-4 text-xs font-semibold uppercase tracking-wider transition-all ${
                    period === p 
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-[#137fec]' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#137fec]'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-bold shadow-lg shadow-[#137fec]/20 hover:bg-[#137fec]/90 transition-all">
              <Download size={18} />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Ventas Totales" value={formatCurrency(kpis.total_sales)} growth={kpis.sales_growth_pct} />
          <KPICard title="Transacciones" value={kpis.total_transactions} growth={kpis.transactions_growth_pct} />
          <KPICard title="Ticket Promedio" value={formatCurrency(kpis.average_ticket)} growth={kpis.ticket_growth_pct} />
          <KPICard title="Margen Bruto" value={`${kpis.gross_margin_pct}%`} growth={kpis.margin_growth_pct} />
        </div>

        {/* Charts & Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4 rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Tendencia de Ventas</h3>
              <button className="text-slate-400 hover:text-[#137fec] transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#137fec" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#137fec" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-2">Alertas del Sistema</h3>
            <div className="flex flex-col gap-3">
              {alerts.map((alert, idx) => (
                <AlertItem key={idx} alert={alert} />
              ))}
            </div>
          </div>
        </div>

        {/* Top Products & Payment Mix Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4 rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Top Productos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Producto</th>
                    <th className="py-3 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider text-right">Unidades</th>
                    <th className="py-3 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {topProducts.map((product, idx) => (
                    <tr key={idx}>
                      <td className="py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{product.product_name}</td>
                      <td className="py-4 text-sm text-slate-600 dark:text-slate-400 text-right">{product.units_sold}</td>
                      <td className="py-4 text-sm font-bold text-slate-900 dark:text-slate-100 text-right">{formatCurrency(product.sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Métodos de Pago</h3>
            <div className="flex flex-col gap-6 py-4">
              {paymentMix.map((method, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{method.display_name}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{method.percentage}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#137fec] rounded-full shadow-inner transition-all duration-500" 
                      style={{ width: `${method.percentage}%`, opacity: 1 - (idx * 0.2) }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 font-medium italic">
              <span>* Actualizado en tiempo real</span>
              <button className="text-[#137fec] font-bold">Ver Detalles</button>
            </div>
          </div>
        </div>
    </div>
  );
};

const KPICard = ({ title, value, growth }) => (
  <div className="flex flex-col gap-2 rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
    <div className="flex items-end justify-between">
      <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight">{value}</p>
      <span className={`flex items-center text-[13px] font-bold px-2 py-0.5 rounded-full ${
        growth >= 0 
          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' 
          : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10'
      }`}>
        {growth >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
        {Math.abs(growth)}%
      </span>
    </div>
  </div>
);

const AlertItem = ({ alert }) => {
  const getStyles = () => {
    switch(alert.type) {
      case 'POSITIVE': return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', icon: <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} /> };
      case 'WARNING': return { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20', icon: <AlertTriangle className="text-amber-600 dark:text-amber-400" size={20} /> };
      case 'NEGATIVE': return { bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20', icon: <AlertCircle className="text-rose-600 dark:text-rose-400" size={20} /> };
      default: return { bg: 'bg-blue-50', border: 'border-blue-100', icon: <CheckCircle className="text-blue-600" size={20} /> };
    }
  };

  const styles = getStyles();

  return (
    <div className={`flex gap-4 p-4 rounded-lg border ${styles.bg} ${styles.border}`}>
      {styles.icon}
      <div className="flex flex-col">
        <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold leading-tight">{alert.message}</p>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Hacer clic para ver detalles</p>
      </div>
    </div>
  );
};

export default Dashboard;
