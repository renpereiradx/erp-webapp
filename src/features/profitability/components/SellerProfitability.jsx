import React, { useState } from 'react';
import { useProfitability } from '../hooks/useProfitability';
import { getDynamicFontClass } from '@/utils/ui';
import { 
  TrendingUp, 
  UserCheck, 
  Search, 
  Download, 
  PieChart,
  BarChart3,
  Activity,
  Zap,
  ChevronLeft,
  ChevronRight
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

const SellerProfitability = () => {
  const [period, setPeriod] = useState('month');
  const { data, loading, error } = useProfitability('getSellers', period);

  if (loading) return <div className="p-16 text-center animate-pulse text-slate-500 font-medium">Auditando desempeño del equipo comercial...</div>;
  if (error) return <div className="p-10 text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-xl m-6 font-semibold">Error de sincronización: {error}</div>;

  const { sellers, summary } = data;
  const topSeller = sellers[0];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight uppercase leading-none">Rentabilidad por Vendedor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest font-bold">Rendimiento y contribución comercial (Gs.)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex flex-1 sm:flex-none bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            {['month', 'quarter', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  period === p 
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-[#137fec]' 
                    : 'text-slate-500 hover:text-[#137fec]'
                }`}
              >
                {p === 'month' ? 'Mes' : p === 'quarter' ? 'Trim.' : 'Año'}
              </button>
            ))}
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-all">
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="flex flex-col gap-4 rounded-2xl p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Promedio Beneficio</p>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className={`font-black text-slate-900 dark:text-white font-mono tracking-tighter ${getDynamicFontClass(summary.average_profit_per_seller || 15450000, { baseClass: 'text-2xl', mediumClass: 'text-xl' })}`}>
              {formatPYG(summary.average_profit_per_seller || 15450000)}
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center gap-1 mt-1 uppercase tracking-widest">
              <Zap size={12} fill="currentColor" /> +5.2% vs mes ant.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl p-5 md:p-6 bg-white dark:bg-slate-900 border border-[#137fec]/30 shadow-lg shadow-blue-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 px-3 py-1 bg-[#137fec] text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-bl-xl">Líder</div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-full size-10 flex items-center justify-center border-2 border-[#137fec]/20">
              <UserCheck className="text-[#137fec]" size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Top Vendedor</p>
              <p className="text-base font-black text-slate-900 dark:text-white uppercase truncate">{summary.top_seller_name || topSeller.seller_name}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className={`font-black text-slate-900 dark:text-white font-mono tracking-tighter ${getDynamicFontClass(topSeller.gross_profit, { baseClass: 'text-2xl', mediumClass: 'text-xl' })}`}>
              {formatPYG(topSeller.gross_profit)}
            </p>
            <p className="text-[#137fec] text-[9px] font-black uppercase tracking-widest">Beneficio Neto Acumulado</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm sm:col-span-2 lg:col-span-1 group">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Margen Operativo Promedio</p>
          <div className="flex items-end gap-4">
            <p className="text-4xl font-black text-slate-900 dark:text-white font-mono leading-none tracking-tighter">32.4%</p>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-1.5 overflow-hidden shadow-inner">
              <div className="h-full bg-[#137fec] shadow-[0_0_8px_rgba(19,127,236,0.3)] transition-all duration-2000 ease-out" style={{ width: '32.4%' }}></div>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Objetivo anual: 30.0% MARGEN</p>
        </div>
      </div>

      {/* Main Ranking Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 md:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/30 dark:bg-slate-950/30">
          <h2 className="text-slate-900 dark:text-white text-xs font-black uppercase tracking-[0.2em] leading-none">Escalafón de Desempeño</h2>
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#137fec] transition-colors" size={14} />
            <input className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Buscar ejecutivo..." />
          </div>
        </div>

        {/* Mobile: Seller Card List */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {sellers.map((s, idx) => (
            <div key={idx} className="p-4 space-y-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center size-6 rounded-lg font-black font-mono text-[10px] ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-tight">{s.seller_name}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Agente Comercial</span>
                  </div>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-1 rounded border border-emerald-100/50 uppercase tracking-widest">
                  {s.gross_margin_pct}% M.B.
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70">Ingresos Facturados</p>
                  <p className="text-xs font-black font-mono text-slate-700 dark:text-slate-300">{formatPYG(s.total_revenue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70">Beneficio Neto</p>
                  <p className="text-xs font-black font-mono text-[#137fec]">{formatPYG(s.gross_profit)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 w-20">Rank</th>
                <th className="px-6 py-4">Vendedor</th>
                <th className="px-6 py-4 text-center w-24">TX</th>
                <th className="px-6 py-4 text-right">Ingresos (Gs.)</th>
                <th className="px-6 py-4 text-right">Beneficio Neto</th>
                <th className="px-6 py-4 text-center w-32">M. Bruto %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm font-medium">
              {sellers.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer">
                  <td className="px-6 py-4">
                    <span className={`flex items-center justify-center size-7 rounded-lg font-black font-mono text-xs ${
                      idx === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
                        <UserCheck className="text-slate-400" size={16} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900 dark:text-white leading-none uppercase tracking-tight">{s.seller_name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">ID: {idx + 700}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-slate-600 dark:text-slate-400">{s.total_sales || 150}</td>
                  <td className="px-6 py-4 text-right font-bold font-mono text-slate-600 dark:text-slate-400 tracking-tighter">{formatPYG(s.total_revenue)}</td>
                  <td className="px-6 py-4 text-right font-bold font-mono text-slate-900 dark:text-white tracking-tighter">{formatPYG(s.gross_profit)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-100/50 uppercase tracking-widest shadow-sm">
                      {s.gross_margin_pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-5 md:px-6 py-4 bg-slate-50/30 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Auditoría consolidada • {sellers.length} Ejecutivos Activos</p>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-30 hover:bg-white transition-all"><ChevronLeft size={16} /></button>
            <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[#137fec] hover:bg-blue-50 transition-all shadow-sm"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 pb-8">
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-[#137fec]/10 rounded-xl text-[#137fec] shadow-inner">
              <PieChart size={24} />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-black text-lg uppercase tracking-widest leading-none">Cuota de Beneficio</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 leading-none">Distribución del margen neto total</p>
            </div>
          </div>
          
          <div className="flex flex-col xl:flex-row items-center justify-between gap-8 md:gap-10">
            {/* Donut Chart SVG */}
            <div className="relative size-40 md:size-48 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#137fec" strokeWidth="14" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.32)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#137fec" strokeWidth="14" strokeOpacity="0.7" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.27)} transform="rotate(115.2 50 50)" strokeLinecap="round" className="transition-all duration-1000 ease-out delay-100" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#137fec" strokeWidth="14" strokeOpacity="0.4" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.23)} transform="rotate(212.4 50 50)" strokeLinecap="round" className="transition-all duration-1000 ease-out delay-200" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Consolidado</span>
                <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 tracking-tighter leading-none">137.2M</span>
              </div>
            </div>

            {/* Polished Legend */}
            <div className="flex-1 w-full space-y-2 md:space-y-3">
              {sellers.slice(0, 3).map((s, i) => {
                const colors = ['bg-[#137fec]', 'bg-[#137fec]/70', 'bg-[#137fec]/40'];
                const percentages = ['32%', '27%', '23%'];
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/item">
                    <div className="flex items-center gap-3">
                      <div className={`size-3 rounded-full ${colors[i]} shadow-sm group-hover/item:scale-125 transition-transform`}></div>
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight truncate max-w-[100px] md:max-w-none">{s.seller_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black font-mono text-slate-900 dark:text-white">{percentages[i]}</span>
                      <div className="w-10 md:w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                        <div className={`h-full ${colors[i]}`} style={{ width: percentages[i] }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-2 opacity-50">
                <div className="flex items-center gap-3">
                  <div className="size-2.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resto Equipo</span>
                </div>
                <span className="text-[10px] font-black font-mono text-slate-400">18%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-emerald-500/50 group">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shadow-inner">
              <BarChart3 size={24} />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-black text-lg uppercase tracking-widest leading-none">Matriz de Eficiencia</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 leading-none">Capacidad de retención de margen bruto</p>
            </div>
          </div>
          <div className="space-y-6 md:space-y-8">
            {sellers.slice(0, 4).map((s, i) => (
              <div key={i} className="space-y-2 md:space-y-3 group/item">
                <div className="flex justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                  <span className="group-hover/item:text-emerald-500 transition-colors truncate max-w-[150px] md:max-w-none">{s.seller_name}</span>
                  <span className="font-mono text-slate-900 dark:text-white text-xs">{s.gross_margin_pct}% M.B.</span>
                </div>
                <div className="h-2 md:h-2.5 w-full bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100/50 dark:border-slate-800/50 overflow-hidden shadow-inner p-0.5">
                  <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all duration-1500 group-hover/item:scale-x-[1.02] origin-left" style={{ width: `${(s.gross_margin_pct / 40) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 md:mt-10 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] italic leading-relaxed">
            <Activity size={14} className="opacity-50 animate-pulse" />
            <span>* Los indicadores reflejan la capacidad corporativa de retener beneficio sobre volumen.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfitability;
