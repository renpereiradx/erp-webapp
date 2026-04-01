import React, { useState } from 'react';
import { useProfitability } from '../hooks/useProfitability';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  PlusCircle, 
  Lightbulb, 
  ArrowUp,
  Activity,
  History,
  Zap
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

const TrendSummaryCard = ({ title, value, status, description }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-[#137fec] transition-all">
    <div>
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{title}</p>
        <span className={`text-[9px] font-black px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest ${
          status === 'UP' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
        }`}>
          {status === 'UP' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {status === 'UP' ? 'AL ALZA' : 'EN DECLIVE'}
        </span>
      </div>
      <h3 className="text-2xl font-black mt-3 uppercase tracking-tighter text-slate-900 dark:text-slate-100 leading-none">{value}</h3>
    </div>
    <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{description}</div>
  </div>
);

const ProfitabilityTrends = () => {
  const [params, setParams] = useState({ period: 'month', granularity: 'daily' });
  const { data, loading, error } = useProfitability('getTrends', params);

  if (loading) return <div className="p-16 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest text-[10px]">Modelando proyecciones de rentabilidad temporal...</div>;
  if (error) return <div className="p-10 text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl m-6 font-black uppercase tracking-tight text-xs">Fallo en la sincronización de tendencias: {error}</div>;

  const { data_points = [], summary = {} } = data || {};

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-[0.1em] leading-none">Tendencias de Rentabilidad</h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">Análisis evolutivo de ingresos, costos y beneficios en Guaraníes (Gs.)</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} /> Exportar Reporte
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#137fec] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all">
            <PlusCircle size={16} /> Nuevo Análisis
          </button>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
          {['daily', 'weekly', 'monthly'].map((g) => (
            <button
              key={g}
              onClick={() => setParams({ ...params, granularity: g })}
              className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                params.granularity === g 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-[#137fec]' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {g === 'daily' ? 'Diario' : g === 'weekly' ? 'Semanal' : 'Mensual'}
            </button>
          ))}
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
        <button className="flex items-center gap-3 h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
          <Calendar className="text-slate-400" size={16} />
          <span>Marzo 2026</span>
        </button>
        <button className="flex items-center gap-2 h-10 px-4 bg-[#137fec]/10 text-[#137fec] border border-[#137fec]/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#137fec]/20 transition-colors">
          <History size={16} /> Comparar Período
        </button>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TrendSummaryCard 
          title="Vector de Tendencia" 
          value={summary?.trend_direction === 'UP' ? 'Expansión Sostenida' : 'Contracción'} 
          status={summary?.trend_direction || 'DOWN'} 
          description="Basado en rendimiento diario" 
        />
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-[#137fec] transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Tasa de Crecimiento</p>
              <h3 className="text-3xl font-black mt-2 text-[#137fec] font-mono leading-none tracking-tighter">+{summary?.growth_rate || 0}%</h3>
            </div>
            <div className="text-emerald-500 group-hover:scale-110 transition-transform">
              <Zap size={24} fill="currentColor" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1">
            <ArrowUp size={12} /> 4.2% sobre mes anterior
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Pico de Beneficio</p>
              <h3 className="text-2xl font-black mt-2 uppercase tracking-tighter text-slate-900 dark:text-slate-100 leading-none">03 Marzo</h3>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500 shadow-inner">
              <Activity size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black mt-4 text-slate-400 uppercase tracking-[0.2em] font-mono leading-none">{formatPYG(8000000)} NETO</p>
        </div>
      </div>

      {/* Evolution Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/20 dark:bg-slate-950/20">
            <div>
              <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-900 dark:text-white leading-none">Matriz de Evolución Temporal</h3>
              <div className="flex gap-6 mt-5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#137fec]"></span>
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Ingresos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Costos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Beneficio Real</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter leading-none">{formatPYG(45000000)}</span>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black mt-2 leading-none">Auditado en Período</p>
            </div>
          </div>
          
          <div className="flex-1 p-10 bg-slate-50/30 dark:bg-slate-950/30 relative min-h-[400px] flex items-end justify-between gap-4">
            {data_points?.map((pt, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div className="w-full max-w-[40px] bg-slate-200 dark:bg-slate-800 rounded-t-xl relative border border-white/5 dark:border-slate-700/50 overflow-hidden" style={{ height: `${(pt.revenue / 20000000) * 300}px` }}>
                  <div className="absolute bottom-0 w-full bg-[#137fec]/30 h-full"></div>
                  <div className="absolute bottom-0 w-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-1000 group-hover:scale-y-105 origin-bottom" style={{ height: `${(pt.gross_profit / pt.revenue) * 100}%` }}></div>
                </div>
                <span className="mt-5 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono leading-none tracking-tighter">{pt.label}</span>
                
                {/* Micro Tooltip */}
                <div className="absolute -top-24 hidden group-hover:flex flex-col bg-slate-900 text-white p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest z-10 w-40 shadow-2xl border border-white/10 ring-4 ring-blue-500/10">
                  <p className="mb-2 text-[#137fec] border-b border-white/10 pb-1">Rev: {formatPYG(pt.revenue)}</p>
                  <p className="text-emerald-500">Net: {formatPYG(pt.gross_profit)}</p>
                  <p className="mt-2 text-[8px] opacity-50">Eficiencia: {((pt.gross_profit/pt.revenue)*100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-[#137fec] transition-colors">
            <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-3 mb-8 text-[10px] uppercase tracking-[0.25em] leading-none">
              <Lightbulb className="text-amber-500 group-hover:animate-pulse" size={20} /> Smart Insights
            </h4>
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border-l-4 border-emerald-500 transition-all hover:translate-x-1">
                <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-2 leading-none">Eficiencia Operativa</p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold leading-relaxed uppercase tracking-tighter">Incremento del 12% en rentabilidad por optimización logística.</p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border-l-4 border-amber-500 transition-all hover:translate-x-1">
                <p className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-2 leading-none">Alerta de Margen</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold leading-relaxed uppercase tracking-tighter">Se detectó erosión del 2.4% en el segmento tecnológico.</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="font-black text-slate-900 dark:text-white mb-8 text-[10px] uppercase tracking-[0.25em] leading-none">Vigilancia de Margen</h4>
            <div className="space-y-8 font-mono">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Bruto Promedio</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-none">32.4%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner border border-slate-200/20">
                  <div className="bg-[#137fec] h-full rounded-full transition-all duration-2000" style={{ width: '32.4%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Neto Operativo</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-none">18.2%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner border border-slate-200/20">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-2000 shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: '18.2%' }}></div>
                </div>
              </div>
            </div>
            <button className="w-full mt-10 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#137fec] bg-[#137fec]/5 rounded-2xl border border-[#137fec]/10 hover:bg-[#137fec]/10 transition-colors shadow-sm active:scale-95">
              Auditoría Detallada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityTrends;
