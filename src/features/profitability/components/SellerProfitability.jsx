import React, { useState } from 'react';
import { useProfitability } from '../hooks/useProfitability';
import { getDynamicFontClass } from '@/utils/ui';
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  UserCheck, 
  Search, 
  Download, 
  PieChart,
  BarChart3,
  Activity,
  Zap,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react';

/**
 * Formateador de moneda en Guaraníes (PYG)
 */
const formatPYG = (value) => {
  return new Intl.NumberFormat('es-PY', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value, maxDecimals = 2) => {
  const numeric = Number(value ?? 0)
  return new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(Number.isFinite(numeric) ? numeric : 0)
}

/**
 * Shimmer Loading for Sellers Page
 */
const SellerProfitabilitySkeleton = () => (
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

const KPICard = ({ title, value, trendValue, isCurrency = true, delay = "0", icon: Icon, color = "primary", isAnchor = false, subtitle }) => {
  const isPositive = parseFloat(trendValue) > 0
  const isNegative = parseFloat(trendValue) < 0
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  
  const displayValue = isCurrency ? formatPYG(value) : formatPercent(value)
  const displayTrendValue = `${formatPercent(Math.abs(trendValue), 1)}%`

  if (isAnchor) {
    return (
      <div className='bg-gradient-to-br from-[#003966] via-[#004578] to-[#0f6cbd] p-8 rounded-xl text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4'>
        <div className="absolute -top-24 -right-24 size-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-1000"></div>
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
           <Icon size={80} />
        </div>
        <div className='flex justify-between items-start mb-6 relative z-10'>
          <div className="flex flex-col gap-1">
            <p className='text-[11px] font-black uppercase tracking-[0.15em] text-blue-200/80 font-sans'>{title}</p>
            <h4 className="text-base font-black text-white uppercase tracking-tight truncate max-w-[200px]">{subtitle}</h4>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold font-mono bg-white/10 backdrop-blur-md border border-white/10 text-white`}>
            LÍDER
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 relative z-10">
          {isCurrency && <span className="text-sm font-bold text-blue-200/60 font-mono">Gs.</span>}
          <h3 className='text-3xl font-black tracking-tight leading-none font-mono truncate'>
            {displayValue}
          </h3>
        </div>
      </div>
    )
  }

  const colorVariants = {
    primary: 'bg-blue-50 text-[#0f6cbd] border-[#0f6cbd]/10',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-600/10',
    orange: 'bg-orange-50 text-orange-600 border-orange-600/10'
  }

  const trendColors = isPositive ? 'text-[#107c10] bg-[#dff6dd]' : isNegative ? 'text-[#d13438] bg-[#fde7e9]' : 'text-slate-500 bg-slate-100'

  return (
    <div className='flex flex-col gap-4 rounded-xl p-6 bg-white border border-[#e5e7eb] shadow-fluent hover:shadow-fluent-hover transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4'>
      <div className='flex items-start justify-between'>
        <div className={`p-2.5 rounded-lg border transition-colors duration-300 ${colorVariants[color]}`}>
          <Icon size={22} />
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold font-mono ${trendColors}`}>
          <TrendIcon size={12} strokeWidth={3} />
          {displayTrendValue}
        </div>
      </div>

      <div className='flex flex-col gap-1.5'>
        <p className='text-[#617589] text-[11px] font-bold uppercase tracking-[0.05em] font-sans'>{title}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          {isCurrency && <span className="text-sm font-bold text-slate-300 font-mono">Gs.</span>}
          <h3 className='text-[#111418] text-3xl font-black tracking-tight leading-none font-mono truncate'>
            {isCurrency ? displayValue : `${displayValue}%`}
          </h3>
        </div>
      </div>
    </div>
  )
}

const SellerProfitability = () => {
  const [period, setPeriod] = useState('month');
  const { data, loading, error } = useProfitability('getSellers', period);

  if (loading) return <SellerProfitabilitySkeleton />;
  
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

  const { sellers = [], summary = {}, contribution_share = [] } = data || {};
  const topSeller = sellers.find(s => s.rank === 1) || sellers[0];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32 font-sans">
      {/* Header Section - Fluent 2 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-4 border-b border-[#e5e7eb] mb-8">
        <div className='flex flex-col gap-1'>
          <nav className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">
             <span className="flex items-center gap-1.5"><UserCheck size={14} className="text-[#0f6cbd]" /> RENTABILIDAD</span>
             <ChevronRight size={10} className="text-slate-300" />
             <span className="text-[#0f6cbd]/80">EQUIPO COMERCIAL</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-black text-[#111418] tracking-tighter leading-none uppercase">
            Desempeño de <span className="text-[#0f6cbd]">Ventas</span>
          </h1>
          <p className="text-sm font-medium text-[#617589] mt-3 max-w-lg leading-relaxed">
            Auditoría de contribución marginal por ejecutivo. Monitoreo de cuotas de beneficio y eficiencia en el cierre de operaciones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-11 px-6 rounded-lg border border-[#dbe0e6] bg-white hover:bg-[#f3f2f1] text-[#617589] text-[11px] font-black uppercase tracking-widest transition-all shadow-sm">
            <Download size={16} /> <span>Exportar</span>
          </button>
          <div className='flex gap-1 p-1 bg-[#f3f2f1] rounded-lg border border-[#e1dfdd]'>
            {['month', 'quarter', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-200 ${
                  period === p
                    ? 'bg-white text-[#0f6cbd] shadow-sm ring-1 ring-[#e1dfdd] scale-105'
                    : 'text-[#617589] hover:text-[#111418] hover:bg-white/50'
                }`}
              >
                {p === 'month' ? 'Mes' : p === 'quarter' ? 'Trim.' : 'Año'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard title='Promedio Beneficio' value={summary?.average_profit_per_seller} trendValue={summary?.profit_growth} delay="0" icon={TrendingUp} color="emerald" />
        <KPICard title='Top Vendedor' subtitle={topSeller?.seller_name} value={topSeller?.gross_profit} trendValue={0} icon={UserCheck} isAnchor={true} />
        <div className='flex flex-col gap-4 rounded-xl p-6 bg-white border border-[#e5e7eb] shadow-fluent group'>
          <p className="text-[#617589] text-[11px] font-bold uppercase tracking-[0.05em] font-sans">Margen Operativo Promedio</p>
          <div className="flex items-end gap-5 mt-2">
            <h3 className='text-[#111418] text-4xl font-black tracking-tight leading-none font-mono'>{formatPercent(summary?.average_operating_margin)}%</h3>
            <div className="flex-1 h-2.5 bg-[#f3f2f1] rounded-full overflow-hidden p-0.5 border border-[#e5e7eb] mb-1">
              <div className="h-full bg-[#0f6cbd] rounded-full shadow-[0_0_10px_rgba(15,108,189,0.4)] transition-all duration-2000 ease-out" style={{ width: `${summary?.average_operating_margin}%` }}></div>
            </div>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">OBJETIVO CORPORATIVO: {formatPercent(summary?.margin_objective)}%</p>
        </div>
      </div>

      {/* Main Ranking Section */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-fluent flex flex-col">
        <div className="px-8 py-6 border-b border-[#e5e7eb] bg-[#f3f2f1]/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <h2 className="text-[#111418] text-[11px] font-black uppercase tracking-[0.25em] leading-none">Ranking de Desempeño Comercial</h2>
            <span className="px-2.5 py-1 bg-[#deecf9] text-[#0f6cbd] text-[10px] font-black rounded-sm uppercase tracking-tighter">Auditado</span>
          </div>
          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f6cbd] transition-colors" size={16} />
            <input className="w-full h-11 pl-12 pr-4 bg-white border border-[#dbe0e6] rounded-xl text-xs font-bold uppercase tracking-wider outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#0f6cbd] transition-all" placeholder="BUSCAR EJECUTIVO..." />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#faf9f8] text-[#617589] font-black uppercase tracking-widest text-[10px] border-b border-[#e5e7eb]">
                <th className="px-8 py-5 w-20">Rank</th>
                <th className="px-6 py-5">Ejecutivo de Cuentas</th>
                <th className="px-6 py-5 text-center">Transacciones</th>
                <th className="px-6 py-5 text-right">Ingresos</th>
                <th className="px-6 py-5 text-right">Beneficio Neto</th>
                <th className="px-8 py-5 text-center">M. Bruto %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2f1] text-[13px]">
              {sellers?.map((s, idx) => (
                <tr key={idx} className="hover:bg-[#f3f2f1]/30 transition-all cursor-pointer group">
                  <td className="px-8 py-6">
                    <span className={`flex items-center justify-center size-8 rounded-lg font-black font-mono text-[13px] ${
                      s.rank === 1 ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm' : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                      {s.rank}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-[#f3f2f1] flex items-center justify-center border border-[#e5e7eb] text-slate-400 group-hover:text-[#0f6cbd] transition-colors">
                        <UserCheck size={18} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-[#111418] uppercase tracking-tight group-hover:text-[#0f6cbd] transition-colors text-[13px]">{s.seller_name}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID: ES-{700 + idx}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center font-mono font-black text-[#617589]">{s.total_sales}</td>
                  <td className="px-6 py-6 text-right font-black font-mono text-[#111418] tracking-tighter">{formatPYG(s.total_revenue)}</td>
                  <td className="px-6 py-6 text-right font-black font-mono text-[#107c10] tracking-tighter">{formatPYG(s.gross_profit)}</td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-[#deecf9] text-[#0f6cbd] text-[11px] font-black px-3 py-1 rounded border border-[#0f6cbd]/10 uppercase tracking-widest shadow-sm">
                      {formatPercent(s.gross_margin_pct)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-8 py-6 border-t border-[#e5e7eb] flex justify-between items-center bg-[#faf9f8]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#617589]">Auditoría Consolidada de Equipo • {sellers?.length} Activos</p>
          <div className="flex gap-2">
            <button className="size-9 flex items-center justify-center rounded-lg border border-[#dbe0e6] bg-white text-slate-400 disabled:opacity-20 hover:bg-[#f3f2f1] transition-all shadow-sm"><ChevronLeft size={18} /></button>
            <button className="size-9 flex items-center justify-center rounded-lg border border-[#dbe0e6] bg-white text-[#0f6cbd] hover:bg-[#f3f2f1] transition-all shadow-sm"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
        <div className="bg-white p-10 rounded-xl border border-[#e5e7eb] shadow-fluent group relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <PieChart size={200} />
          </div>
          <div className="flex items-center gap-6 mb-12 relative z-10">
            <div className="p-4 bg-[#f3f2f1] rounded-xl text-[#0f6cbd] border border-[#e5e7eb] group-hover:scale-110 transition-transform">
              <PieChart size={32} />
            </div>
            <div>
              <h3 className="text-[#111418] font-black text-2xl uppercase tracking-widest leading-none">Cuota de Beneficio</h3>
              <p className="text-[11px] font-bold text-[#617589] uppercase tracking-widest mt-3 leading-none">Distribución del margen neto por ejecutivo</p>
            </div>
          </div>
          
          <div className="flex flex-col xl:flex-row items-center justify-between gap-12 relative z-10 flex-1">
            <div className="relative size-56 flex items-center justify-center group-hover:scale-105 transition-transform duration-1000">
              {/* Outer Glow */}
              <div className="absolute inset-0 rounded-full bg-blue-500/5 blur-3xl scale-125 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <svg className="size-full -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="transparent" stroke="#f3f2f1" strokeWidth="12" />
                {contribution_share.map((item, i) => {
                  const colors = ['#0f6cbd', '#0078d4', '#2b88d8', '#edebe9'];
                  let totalOffset = 0;
                  for(let j=0; j<i; j++) totalOffset += contribution_share[j].pct;
                  return (
                    <circle 
                      key={i}
                      cx="50" cy="50" r="42" 
                      fill="transparent" 
                      stroke={colors[i]} 
                      strokeWidth="14" 
                      strokeDasharray="263.8" 
                      strokeDashoffset={263.8 * (1 - item.pct/100)} 
                      transform={`rotate(${(totalOffset * 3.6)} 50 50)`}
                      strokeLinecap={item.pct > 5 ? 'round' : 'butt'}
                      className="transition-all duration-1000 ease-out cursor-pointer hover:stroke-blue-400"
                    />
                  )
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-sm rounded-full m-8 border border-white/50 shadow-inner">
                <span className="text-[10px] font-black text-[#617589] uppercase tracking-[0.2em] leading-none">Neto Total</span>
                <span className="text-3xl font-black text-[#111418] font-mono mt-2 tracking-tighter">
                  {summary?.total_profit > 1000000 
                    ? `${(summary.total_profit / 1000000).toFixed(1)}M` 
                    : formatPYG(summary.total_profit)}
                </span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              {contribution_share.map((item, i) => {
                const colors = ['bg-[#0f6cbd]', 'bg-[#0078d4]', 'bg-[#2b88d8]', 'bg-slate-200'];
                return (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-[#f3f2f1]/80 transition-all border border-transparent hover:border-[#dbe0e6] group/item cursor-default">
                    <div className="flex items-center gap-5">
                      <div className={`size-4 rounded-md ${colors[i]} shadow-lg group-hover/item:scale-125 transition-transform`}></div>
                      <span className="text-[12px] font-black text-[#111418] uppercase tracking-tight truncate max-w-[180px]">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-black font-mono text-[#111418]">{item.pct}%</span>
                      <div className="w-20 h-2 bg-[#f3f2f1] rounded-full overflow-hidden hidden sm:block border border-[#e5e7eb] p-0.5 shadow-inner">
                        <div className={`h-full rounded-full ${colors[i]}`} style={{ width: `${item.pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-xl border border-[#e5e7eb] shadow-fluent group relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-6 mb-12 relative z-10">
            <div className="p-4 bg-[#f3f2f1] rounded-xl text-emerald-600 border border-[#e5e7eb]">
              <BarChart3 size={32} />
            </div>
            <div>
              <h3 className="text-[#111418] font-black text-2xl uppercase tracking-widest leading-none">Matriz de Eficiencia</h3>
              <p className="text-[11px] font-bold text-[#617589] uppercase tracking-widest mt-3 leading-none">Capacidad de retención de margen bruto</p>
            </div>
          </div>
          <div className="space-y-10 relative z-10 flex-1 justify-center flex flex-col">
            {sellers?.slice(0, 4).map((s, i) => (
              <div key={i} className="space-y-4 group/item">
                <div className="flex justify-between text-[11px] font-black text-[#617589] uppercase tracking-widest leading-none">
                  <span className="group-hover/item:text-[#0f6cbd] transition-colors text-xs">{s.seller_name}</span>
                  <span className="font-mono text-[#111418] text-sm">{formatPercent(s.gross_margin_pct)}% M.B.</span>
                </div>
                <div className="h-3 w-full bg-[#f3f2f1] rounded-full border border-[#e5e7eb] overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full bg-[#107c10] rounded-full shadow-[0_0_15px_rgba(16,124,16,0.3)] transition-all duration-1500 group-hover:scale-x-[1.02] origin-left" style={{ width: `${(s.gross_margin_pct / 50) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-10 border-t border-[#f3f2f1] flex items-center gap-5 text-[11px] font-black text-slate-400 uppercase tracking-widest italic leading-relaxed">
            <Activity size={20} className="text-[#0f6cbd] animate-pulse" />
            <span>Capacidad corporativa de retención sobre volumen total auditado.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfitability;
