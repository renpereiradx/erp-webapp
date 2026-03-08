import React, { useState } from 'react';
import { useProfitability } from '../hooks/useProfitability';
import { getDynamicFontClass } from '@/utils/ui';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

/**
 * Formateador de moneda en Guaraníes
 */
const formatPYG = (value) => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
  }).format(value).replace('PYG', 'Gs.');
};

const KPICard = ({ title, value, trend, trendValue, isCurrency = true }) => {
  const isPositive = trend === 'up' || parseFloat(trendValue) > 0;
  const isNegative = trend === 'down' || parseFloat(trendValue) < 0;
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const colorClass = isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-slate-400';
  const bgTrendClass = isPositive ? 'bg-emerald-50 dark:bg-emerald-900/20' : isNegative ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-slate-50 dark:bg-slate-800';

  // Aplicamos la utilidad de fuente dinámica
  const fontSizeClass = getDynamicFontClass(value, { 
    baseClass: 'text-2xl', 
    mediumClass: 'text-xl', 
    smallClass: 'text-lg',
    extraSmallClass: 'text-base' 
  });

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-[#137fec] group">
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] leading-none">{title}</p>
        
        <div className="flex flex-col">
          <h3 className={`font-black text-slate-900 dark:text-white font-mono tracking-tighter leading-tight ${fontSizeClass}`}>
            {isCurrency ? formatPYG(value) : `${value}%`}
          </h3>
          
          <div className={`flex items-center gap-1 mt-2 px-2 py-1 rounded-lg w-fit ${bgTrendClass} ${colorClass} text-[10px] font-black uppercase tracking-widest`}>
            <Icon size={12} strokeWidth={3} />
            <span>{Math.abs(trendValue)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfitabilityDashboard = () => {
  const [period, setPeriod] = useState('month');
  const { data, loading, error } = useProfitability('getDashboard', period);

  if (loading) return <div className="p-16 text-center animate-pulse text-slate-500 font-bold uppercase tracking-widest text-[10px]">Modelando proyecciones de rentabilidad...</div>;
  if (error) return <div className="p-10 text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl m-6 font-black uppercase tracking-tight text-xs">Fallo en la carga del dashboard: {error}</div>;

  const { kpis, break_even_status, alerts } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Análisis de Rentabilidad</h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Control de márgenes operativos y rendimiento corporativo (Gs.)</p>
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
          {['today', 'week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                period === p 
                  ? 'bg-white dark:bg-slate-700 text-[#137fec] shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid - Reajustado para evitar overflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Ingresos Totales" value={kpis.total_revenue} trend="up" trendValue={kpis.revenue_growth} />
        <KPICard title="Ganancia Total" value={kpis.total_profit} trend="up" trendValue={kpis.profit_growth} />
        <KPICard title="Margen Bruto %" value={kpis.gross_margin_pct} trend="up" trendValue={kpis.margin_change} isCurrency={false} />
        <KPICard title="Margen Neto %" value={kpis.net_margin_pct} trend="up" trendValue="0.5" isCurrency={false} />
        <KPICard title="ROI Corporativo" value={kpis.roi} trend="up" trendValue="3.1" isCurrency={false} />
        <KPICard title="Ganancia / Tx" value={kpis.profit_per_transaction} trend="stable" trendValue="0" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Chart Placeholder */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">Tendencia Consolidada</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Relación Ingresos vs Beneficio Real</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                <span className="w-3 h-3 rounded-full bg-[#137fec]/30 shadow-inner"></span> 
                <span className="text-slate-400">Ingresos</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></span> 
                <span className="text-emerald-500">Ganancia</span>
              </div>
            </div>
          </div>
          
          <div className="h-72 flex items-end justify-between px-4 bg-slate-50/30 dark:bg-slate-950/20 rounded-[1.5rem] p-6 gap-2">
            {[60, 75, 65, 85, 90, 70, 80, 95].map((h, i) => (
              <div key={i} className="flex-1 max-w-[40px] bg-[#137fec]/10 rounded-t-xl relative group/bar" style={{ height: `${h}%` }}>
                <div 
                  className="absolute bottom-0 w-full bg-emerald-500 rounded-t-xl transition-all duration-[1500ms] group-hover/bar:scale-y-105 origin-bottom shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                  style={{ height: `${h * 0.4}%` }} 
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between px-6 mt-6 text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
            {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO'].map(m => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* Sidebar: Break-even & Alerts */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-[#137fec] p-8 rounded-[2rem] text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 size-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] leading-none">Punto de Equilibrio</h3>
              <Target className="group-hover:rotate-12 transition-transform" size={24} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest opacity-90 leading-relaxed mb-8">
              {break_even_status.has_reached_break_even 
                ? 'Objetivo corporativo alcanzado. Operando con margen positivo.' 
                : 'Se requiere cubrir el 18% restante para alcanzar equilibrio operativo.'}
            </p>
            <div className="space-y-6">
              <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden shadow-inner p-0.5">
                <div className="bg-white h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-[2000ms]" style={{ width: '82%' }}></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[9px] uppercase font-black tracking-widest opacity-60">Status</p>
                  <p className="font-black text-sm uppercase tracking-tighter mt-1">{break_even_status.performance_status === 'ABOVE_BREAK_EVEN' ? 'SUPERADO' : 'PENDIENTE'}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-black tracking-widest opacity-60">ROI Auditado</p>
                  <p className="font-black text-sm font-mono mt-1">+{kpis.roi}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm group">
            <h3 className="font-black text-[10px] uppercase tracking-[0.25em] mb-8 flex items-center gap-3 leading-none text-slate-900 dark:text-white">
              <AlertTriangle className="text-amber-500 animate-pulse" size={20} /> Alertas de Margen
            </h3>
            <div className="space-y-4">
              {alerts.map((alert, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all hover:translate-x-1">
                  <div className={`px-2 py-1 h-fit rounded text-[8px] font-black uppercase tracking-widest text-white ${alert.severity === 'HIGH' ? 'bg-rose-500 shadow-lg shadow-rose-500/20' : 'bg-blue-500 shadow-lg shadow-blue-500/20'}`}>
                    {alert.severity || 'INFO'}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none">{alert.type}</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityDashboard;
