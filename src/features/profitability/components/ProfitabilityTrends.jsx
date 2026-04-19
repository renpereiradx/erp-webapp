import React, { useState } from 'react';
import { useProfitability } from '../hooks/useProfitability';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar, 
  Download, 
  PlusCircle, 
  Lightbulb, 
  ArrowUp,
  Activity,
  History,
  Zap,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

/**
 * Formateador de moneda en Guaraníes (PYG) con blindaje de datos
 */
const formatPYG = (value) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat('es-PY', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number.isFinite(numeric) ? numeric : 0);
};

const formatPercent = (value, maxDecimals = 2) => {
  const numeric = Number(value ?? 0)
  return new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(Number.isFinite(numeric) ? numeric : 0)
}

/**
 * Shimmer Loading for Trends Page
 */
const ProfitabilityTrendsSkeleton = () => (
  <div className='space-y-10 animate-in fade-in duration-500 pb-32'>
    <div className='flex flex-col md:flex-row md:items-end justify-between gap-8 py-4 border-b border-[#e5e7eb] mb-8'>
      <div className='space-y-4 w-full max-w-lg'>
        <div className='h-3 w-32 bg-slate-200 rounded-full animate-pulse' />
        <div className='h-10 w-full bg-slate-200 rounded-xl animate-pulse' />
      </div>
      <div className='h-10 w-64 bg-slate-200 rounded-xl animate-pulse' />
    </div>
    
    <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
      {[...Array(3)].map((_, i) => (
        <div key={i} className='h-36 bg-slate-100 rounded-xl border border-slate-200 animate-pulse' />
      ))}
    </div>

    <div className='rounded-xl border border-slate-200 h-[500px] animate-pulse bg-slate-50' />
  </div>
)

const TrendSummaryCard = ({ title, subtitle, value, status, description, isAnchor = false, trendValue, icon: Icon }) => {
  const isUp = status === 'UP';
  const displayTrend = formatPercent(Math.abs(trendValue ?? 0));
  
  if (isAnchor) {
    return (
      <div className='bg-gradient-to-br from-[#003966] via-[#004578] to-[#0f6cbd] p-8 rounded-xl text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4'>
        <div className="absolute -top-24 -right-24 size-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-1000"></div>
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
           <Icon size={100} />
        </div>
        <div className='flex justify-between items-start mb-10 relative z-10'>
          <div className="flex flex-col gap-1">
            <p className='text-[11px] font-black uppercase tracking-[0.2em] text-blue-200/80 font-sans'>{title}</p>
            {subtitle && <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-tighter">{subtitle}</h4>}
          </div>
          <span className={`text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-2 uppercase tracking-widest bg-white/10 backdrop-blur-md border border-white/10 ${isUp ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isUp ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
            {isUp ? 'AL ALZA' : 'EN DECLIVE'}
          </span>
        </div>
        <div className="relative z-10">
          <h3 className='text-3xl font-black tracking-tight leading-none uppercase'>{value ?? '---'}</h3>
          <p className='text-[10px] font-bold text-blue-100/60 uppercase tracking-widest mt-4'>{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl border border-[#e5e7eb] shadow-fluent flex flex-col justify-between group hover:shadow-fluent-hover transition-all animate-in fade-in slide-in-from-bottom-4">
      <div>
        <div className="flex justify-between items-start">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 font-sans">{title}</p>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-2 uppercase tracking-widest ${
            isUp ? 'bg-[#dff6dd] text-[#107c10]' : 'bg-[#fde7e9] text-[#d13438]'
          }`}>
            {isUp ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
            {displayTrend}%
          </span>
        </div>
        <h3 className="text-3xl font-black mt-6 uppercase tracking-tighter text-[#111418] leading-none font-mono">{value ?? '---'}</h3>
      </div>
      <div className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{description}</div>
    </div>
  );
};

const ProfitabilityTrends = () => {
  const [params, setParams] = useState({ period: 'month', granularity: 'daily' });
  const { data, loading, error } = useProfitability('getTrends', params);

  if (loading) return <ProfitabilityTrendsSkeleton />;
  
  if (error)
    return (
      <div className="p-10 text-center animate-in zoom-in-95 duration-500">
        <div className="max-w-md mx-auto glass-acrylic border border-rose-200 p-8 rounded-2xl text-[#d13438] shadow-2xl">
          <AlertTriangle className="mx-auto mb-4" size={44} />
          <h4 className="font-bold text-base uppercase tracking-widest mb-2 font-sans">Interrupción de Datos</h4>
          <p className="text-sm font-medium opacity-80 font-sans">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2.5 bg-[#d13438] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors font-sans">Reintentar</button>
        </div>
      </div>
    )

  const { data_points = [], summary = {} } = data || {};
  const maxRevenue = Math.max(...data_points.map(pt => pt.revenue), 1000000);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32 font-sans">
      {/* Header Section - Fluent 2 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-4 border-b border-[#e5e7eb] mb-8">
        <div className='flex flex-col gap-1'>
          <nav className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">
             <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-[#0f6cbd]" /> RENTABILIDAD</span>
             <ChevronRight size={10} className="text-slate-300" />
             <span className="text-[#0f6cbd]/80">TENDENCIAS</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-black text-[#111418] tracking-tighter leading-none uppercase">
            Evolución <span className="text-[#0f6cbd]">Temporal</span>
          </h1>
          <p className="text-sm font-medium text-[#617589] mt-3 max-w-lg leading-relaxed">
            Análisis algorítmico de flujos y márgenes. Visualización técnica del comportamiento financiero en periodos operativos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-11 px-6 rounded-lg border border-[#dbe0e6] bg-white hover:bg-[#f3f2f1] text-[#617589] text-[11px] font-black uppercase tracking-widest transition-all shadow-sm">
            <Download size={16} /> <span>Exportar</span>
          </button>
          <div className='flex gap-1 p-1 bg-[#f3f2f1] rounded-lg border border-[#e1dfdd]'>
            {['daily', 'weekly', 'monthly'].map((g) => (
              <button
                key={g}
                onClick={() => setParams({ ...params, granularity: g })}
                className={`px-5 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-200 ${
                  params.granularity === g
                    ? 'bg-white text-[#0f6cbd] shadow-sm ring-1 ring-[#e1dfdd] scale-105'
                    : 'text-[#617589] hover:text-[#111418] hover:bg-white/50'
                }`}
              >
                {g === 'daily' ? 'Diario' : g === 'weekly' ? 'Semanal' : 'Mensual'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TrendSummaryCard 
          title="Vector de Tendencia" 
          value={summary?.trend_direction === 'UP' ? 'Expansión Sostenida' : 'Contracción'} 
          status={summary?.trend_direction} 
          description="Basado en rendimiento histórico"
          isAnchor={true}
          icon={TrendingUp}
        />
        <TrendSummaryCard 
          title="Tasa de Crecimiento" 
          value={`+${formatPercent(summary?.growth_rate)}%`}
          status="UP"
          trendValue={formatPercent((summary?.growth_rate ?? 0) - (summary?.previous_growth_rate ?? 0))}
          description="Variación vs periodo anterior"
        />
        <div className="bg-white p-8 rounded-xl border border-[#e5e7eb] shadow-fluent group">
          <div className="flex justify-between items-start mb-6">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 font-sans">Pico de Beneficio</p>
            <div className="bg-[#dff6dd] p-2.5 rounded-lg text-[#107c10] shadow-inner">
              <Activity size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-[#111418] font-mono leading-none tracking-tighter uppercase">{summary?.peak_profit_date || '---'}</h3>
          <p className="text-[11px] font-black mt-4 text-[#107c10] uppercase tracking-[0.2em] font-mono leading-none">Gs. {formatPYG(summary?.peak_profit_value)} NETO</p>
        </div>
      </div>

      {/* Evolution Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#e5e7eb] shadow-fluent overflow-hidden flex flex-col">
          <div className="p-10 border-b border-[#e5e7eb] bg-[#f3f2f1]/50 flex justify-between items-center">
            <div>
              <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-[#111418] leading-none">Matriz de Evolución Temporal</h3>
              <div className="flex gap-8 mt-6">
                <div className="flex items-center gap-2.5">
                  <span className="size-3 rounded-full bg-[#0f6cbd]/30"></span>
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Ingresos</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="size-3 rounded-full bg-[#107c10] shadow-[0_0_8px_rgba(16,124,16,0.4)]"></span>
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Beneficio Real</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-[#111418] font-mono tracking-tighter leading-none">{formatPYG(summary?.total_period_revenue)}</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-3 leading-none">Auditoría Consolidada en Período</p>
            </div>
          </div>
          
          <div className="h-[400px] p-12 bg-[#faf9f8] relative flex items-end justify-between gap-6 mt-auto">
            {data_points?.map((pt, i) => {
              const efficiency = pt.revenue > 0 ? (pt.gross_profit / pt.revenue) * 100 : 0;
              const heightPct = maxRevenue > 0 ? (pt.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="w-full max-w-[48px] flex-1 flex items-end relative border border-transparent overflow-hidden group-hover:bg-[#e1dfdd] transition-all">
                    <div className="w-full bg-[#edebe9] rounded-t-xl relative overflow-hidden" style={{ height: `${heightPct}%` }}>
                      <div className="absolute bottom-0 w-full bg-[#0f6cbd]/20 h-full"></div>
                      <div className="absolute bottom-0 w-full bg-[#107c10] shadow-[0_0_15px_rgba(16,124,16,0.3)] transition-all duration-1000 group-hover:scale-y-105 origin-bottom" style={{ height: `${efficiency}%` }}></div>
                    </div>
                  </div>
                  <span className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono leading-none shrink-0">{pt.label}</span>
                  
                  {/* Micro Tooltip */}
                  <div className="absolute -top-28 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-[#323130] text-white p-5 rounded-xl text-[10px] font-black uppercase tracking-widest z-10 w-44 shadow-2xl border border-white/10">
                    <p className="mb-2 text-[#deecf9] border-b border-white/10 pb-1.5 leading-none">Rev: {formatPYG(pt.revenue)}</p>
                    <p className="text-emerald-300 leading-none">Net: {formatPYG(pt.gross_profit)}</p>
                    <p className="mt-3 text-[9px] opacity-50 font-mono">EFICIENCIA: {formatPercent(efficiency)}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <div className="bg-white p-8 rounded-xl border border-[#e5e7eb] shadow-fluent group hover:border-[#0f6cbd] transition-colors">
            <h4 className="font-black text-[#111418] flex items-center gap-3 mb-10 text-[11px] uppercase tracking-[0.25em] leading-none">
              <Lightbulb className="text-amber-500 group-hover:animate-pulse" size={22} /> Smart Insights
            </h4>
            <div className="space-y-6">
              {summary?.insights?.map((insight, idx) => (
                <div key={idx} className={`p-5 rounded-xl border-l-4 transition-all hover:translate-x-1 ${
                  insight.type === 'EFFICIENCY' ? 'bg-[#dff6dd]/30 border-[#107c10]' : 'bg-[#fff4ce]/30 border-[#794500]'
                }`}>
                  <p className={`text-[11px] font-black uppercase tracking-widest mb-2.5 leading-none ${
                    insight.type === 'EFFICIENCY' ? 'text-[#107c10]' : 'text-[#794500]'
                  }`}>{insight.title}</p>
                  <p className="text-[11px] text-slate-600 font-bold leading-relaxed uppercase tracking-tighter">{insight.message}</p>
                </div>
              ))}
              {(!summary?.insights || summary.insights.length === 0) && (
                 <p className="text-[10px] font-black text-slate-400 uppercase text-center py-4">No hay insights para este periodo</p>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl border border-[#e5e7eb] shadow-fluent">
            <h4 className="font-black text-[#111418] mb-10 text-[11px] uppercase tracking-[0.25em] leading-none">Vigilancia de Margen</h4>
            <div className="space-y-10 font-mono">
              <div className="group">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-[#0f6cbd] transition-colors">Bruto Promedio</span>
                  <span className="text-base font-black text-[#111418] leading-none">{formatPercent(summary?.average_gross_margin)}%</span>
                </div>
                <div className="w-full bg-[#f3f2f1] rounded-full h-2.5 overflow-hidden p-0.5 border border-[#e5e7eb] shadow-inner">
                  <div className="bg-[#0f6cbd] h-full rounded-full transition-all duration-2000" style={{ width: `${summary?.average_gross_margin ?? 0}%` }}></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-[#107c10] transition-colors">Neto Operativo</span>
                  <span className="text-base font-black text-[#111418] leading-none">{formatPercent(summary?.average_net_margin)}%</span>
                </div>
                <div className="w-full bg-[#f3f2f1] rounded-full h-2.5 overflow-hidden p-0.5 border border-[#e5e7eb] shadow-inner">
                  <div className="bg-[#107c10] h-full rounded-full transition-all duration-2000 shadow-[0_0_10px_rgba(16,124,16,0.4)]" style={{ width: `${summary?.average_net_margin ?? 0}%` }}></div>
                </div>
              </div>
            </div>
            <button className="w-full mt-12 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-[#0f6cbd] bg-[#deecf9]/50 rounded-xl border border-[#0f6cbd]/10 hover:bg-[#deecf9] transition-all shadow-sm active:scale-95">
              Auditoría Detallada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityTrends;