import React, { useState } from 'react';
import { useProfitability } from '../hooks/useProfitability';
import { getDynamicFontClass } from '@/utils/ui';
import { 
  Search, 
  Users, 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CreditCard, 
  BarChart3,
  Mail,
  Phone,
  Trophy,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
  Zap,
  Activity,
  Target
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
 * Shimmer Loading for Customers Page
 */
const CustomerProfitabilitySkeleton = () => (
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

    <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
      <div className='lg:col-span-3 rounded-xl border border-slate-200 h-[600px] animate-pulse bg-slate-50' />
      <div className='lg:col-span-1 space-y-6'>
        <div className='h-64 bg-slate-100 rounded-xl border border-slate-200 animate-pulse' />
        <div className='h-48 bg-slate-100 rounded-xl border border-slate-200 animate-pulse' />
      </div>
    </div>
  </div>
)

const KPICard = ({ title, value, trendValue, isCurrency = true, delay = "0", icon: Icon, color = "primary", isAnchor = false }) => {
  const isPositive = parseFloat(trendValue) > 0
  const isNegative = parseFloat(trendValue) < 0
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  
  const displayValue = isCurrency ? formatPYG(value) : formatPercent(value)
  const displayTrendValue = `${formatPercent(Math.abs(trendValue), 1)}%`

  if (isAnchor) {
    return (
      <div 
        style={{ animationDelay: `${delay}ms` }}
        className='bg-gradient-to-br from-[#003966] via-[#004578] to-[#0f6cbd] p-8 rounded-xl text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4'
      >
        <div className="absolute -top-24 -right-24 size-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-1000"></div>
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
           <Icon size={80} />
        </div>
        <div className='flex justify-between items-start mb-6 relative z-10'>
          <p className='text-[11px] font-black uppercase tracking-[0.15em] text-blue-200/80 font-sans'>{title}</p>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold font-mono bg-white/10 backdrop-blur-md border border-white/10 ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
            <TrendIcon size={12} strokeWidth={3} />
            {displayTrendValue}
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 relative z-10">
          {isCurrency && <span className="text-sm font-bold text-blue-200/60 font-mono">Gs.</span>}
          <h3 className='text-3xl font-black tracking-tight leading-none font-mono truncate'>
            {isCurrency ? displayValue : `${displayValue}%`}
          </h3>
        </div>
      </div>
    )
  }

  const colorVariants = {
    primary: 'bg-blue-50 text-[#0f6cbd] border-[#0f6cbd]/10',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-600/10',
    purple: 'bg-purple-50 text-purple-600 border-purple-600/10',
    orange: 'bg-orange-50 text-orange-600 border-orange-600/10'
  }

  const trendColors = isPositive ? 'text-[#107c10] bg-[#dff6dd]' : isNegative ? 'text-[#d13438] bg-[#fde7e9]' : 'text-slate-500 bg-slate-100'

  return (
    <div 
      style={{ animationDelay: `${delay}ms` }}
      className='flex flex-col gap-4 rounded-xl p-6 bg-white border border-[#e5e7eb] shadow-fluent hover:shadow-fluent-hover transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4'
    >
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
          <h3 className='text-[#111418] text-3xl font-bold tracking-tight leading-none font-mono truncate'>
            {isCurrency ? displayValue : `${displayValue}%`}
          </h3>
        </div>
      </div>
    </div>
  )
}

const SegmentBadge = ({ segment }) => {
  const styles = {
    PLATINUM: 'bg-purple-100 text-purple-700 border-purple-200',
    GOLD: 'bg-amber-100 text-amber-700 border-amber-200',
    SILVER: 'bg-slate-100 text-slate-600 border-slate-200',
    BRONZE: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  return (
    <span className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-[10px] font-black border uppercase tracking-widest ${styles[segment] || styles.SILVER}`}>
      {segment}
    </span>
  );
};

const CustomerProfitability = () => {
  const [params, setParams] = useState({ period: 'month', page: 1 });
  const { data, loading, error } = useProfitability('getCustomers', params);

  if (loading) return <CustomerProfitabilitySkeleton />;
  
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

  const { customers, summary } = data || {};

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32 font-sans">
      {/* Header Section - Fluent 2 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-4 border-b border-[#e5e7eb] mb-8">
        <div className='flex flex-col gap-1'>
          <nav className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">
             <span className="flex items-center gap-1.5"><Users size={14} className="text-[#0f6cbd]" /> RENTABILIDAD</span>
             <ChevronRight size={10} className="text-slate-300" />
             <span className="text-[#0f6cbd]/80">CLIENTES</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-black text-[#111418] tracking-tighter leading-none uppercase">
            Cartera de <span className="text-[#0f6cbd]">Clientes</span>
          </h1>
          <p className="text-sm font-medium text-[#617589] mt-3 max-w-lg leading-relaxed">
            Análisis de contribución marginal y segmentación estratégica. Identifique clientes clave bajo la metodología Pareto.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-11 px-6 rounded-lg border border-[#dbe0e6] bg-white hover:bg-[#f3f2f1] text-[#617589] text-[11px] font-black uppercase tracking-widest transition-all shadow-sm">
            <Download size={14} /> <span>Exportar</span>
          </button>
          <button className="flex items-center gap-2 h-11 px-7 rounded-lg bg-[#0f6cbd] hover:bg-[#005a9e] text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20">
             <Calendar size={14} /> <span>Periodo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KPICard title='Clientes Activos' value={summary?.active_customers} trendValue={summary?.active_customers_growth} delay="0" icon={Users} color="primary" />
        <KPICard title='Ticket Promedio' value={summary?.average_customer_value} trendValue={summary?.avg_value_growth} delay="100" icon={CreditCard} color="emerald" />
        <KPICard title='Contribución Pareto' value={summary?.top_customers_pct} trendValue={summary?.top_customers_variation} isCurrency={false} delay="200" icon={BarChart3} isAnchor={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Data Grid Section */}
        <div className="lg:col-span-3 flex flex-col rounded-xl bg-white border border-[#e5e7eb] shadow-fluent overflow-hidden">
          <div className="px-8 py-6 border-b border-[#e5e7eb] bg-[#f3f2f1]/50 flex flex-col sm:flex-row justify-between items-center gap-6">
            <h3 className="font-black text-[#111418] text-[11px] uppercase tracking-[0.25em] leading-none">Desglose Operativo de Cartera</h3>
            <div className="relative group w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f6cbd] transition-colors" size={16} />
              <input className="w-full h-11 pl-12 pr-4 bg-white border border-[#dbe0e6] rounded-xl text-xs font-bold uppercase tracking-wider outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#0f6cbd] transition-all" placeholder="BUSCAR POR NOMBRE..." />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#faf9f8] text-[#617589] font-black uppercase tracking-widest text-[10px] border-b border-[#e5e7eb]">
                  <th className="px-8 py-5">Cliente / Identificador</th>
                  <th className="px-6 py-5">Segmento</th>
                  <th className="px-6 py-5 text-center">Compras</th>
                  <th className="px-6 py-5 text-right">Ingresos</th>
                  <th className="px-8 py-5 text-right">M. Bruto %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f2f1] text-[13px]">
                {customers?.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-[#f3f2f1]/30 transition-all cursor-pointer group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <span className="font-black text-[#111418] uppercase tracking-tight group-hover:text-[#0f6cbd] transition-colors text-[13px]">{c.customer_name}</span>
                        <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-tighter bg-slate-50 w-fit px-2 py-0.5 rounded border border-slate-100">REF: {c.customer_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <SegmentBadge segment={c.segment} />
                    </td>
                    <td className="px-6 py-6 text-center font-mono font-bold text-[#617589]">{c.total_purchases}</td>
                    <td className="px-6 py-6 text-right font-bold font-mono text-[#111418] tracking-tighter">{formatPYG(c.total_revenue)}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold font-mono text-[13px] text-[#107c10]">{formatPercent(c.gross_margin_pct)}%</span>
                        <div className="w-24 h-1.5 bg-[#f3f2f1] rounded-full overflow-hidden">
                          <div className="bg-[#107c10] h-full transition-all duration-1500 ease-out shadow-[0_0_8px_rgba(16,124,16,0.4)]" style={{ width: `${c.gross_margin_pct}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!customers || customers.length === 0) && (
                  <tr>
                    <td colSpan="5" className="px-8 py-28 text-center bg-white">
                      <div className="flex flex-col items-center gap-5">
                        <div className="size-20 bg-[#f3f2f1] rounded-full flex items-center justify-center text-slate-300">
                          <Users size={40} />
                        </div>
                        <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em]">No hay datos de clientes disponibles</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-8 py-6 border-t border-[#e5e7eb] flex justify-between items-center bg-[#faf9f8]">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#617589]">Mostrando registros de auditoría</p>
            <div className="flex items-center gap-2">
              <button className="size-9 flex items-center justify-center rounded-lg border border-[#dbe0e6] bg-white disabled:opacity-20 hover:bg-[#f3f2f1] transition-all shadow-sm text-slate-400"><ChevronLeft size={18} /></button>
              <button className="size-9 flex items-center justify-center rounded-lg border border-[#dbe0e6] bg-white disabled:opacity-20 hover:bg-[#f3f2f1] transition-all shadow-sm text-[#0f6cbd]"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>

        {/* Side Panels */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <div className="flex flex-col rounded-xl bg-white border border-[#e5e7eb] shadow-fluent overflow-hidden group hover:border-[#0f6cbd] transition-colors">
            <div className="px-6 py-5 border-b border-[#e5e7eb] bg-[#f3f2f1]/50">
              <h3 className="font-black text-[#111418] text-[11px] uppercase tracking-[0.25em] flex items-center gap-3 leading-none">
                <Trophy className="text-amber-500" size={18} /> Elite Platinum
              </h3>
            </div>
            <div className="p-6 flex flex-col gap-6">
              {customers?.slice(0, 3).map((c, i) => (
                <div key={c.customer_id} className="flex items-center justify-between group/item cursor-pointer">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-black text-slate-100 text-3xl font-mono leading-none group-hover:text-blue-50 transition-colors">{i + 1}</span>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[11px] font-black text-[#111418] uppercase truncate leading-none transition-colors">{c.customer_name}</span>
                      <span className="text-[10px] font-mono font-black text-[#107c10] tracking-tighter uppercase">{formatPYG(c.gross_profit)} Gs.</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!customers || customers.length === 0) && (
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-4">Sin datos de ranking</div>
              )}
            </div>
          </div>

          <div className="flex flex-col rounded-xl bg-white border border-[#e5e7eb] shadow-fluent overflow-hidden group/risk hover:border-rose-500 transition-colors">
            <div className="px-6 py-5 border-b border-rose-50 bg-rose-50/30">
              <h3 className="font-black text-rose-700 text-[11px] uppercase tracking-[0.25em] flex items-center gap-3 leading-none">
                <AlertTriangle className="text-rose-600 animate-pulse" size={18} /> Retención Crítica
              </h3>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="p-5 rounded-xl bg-[#f3f2f1]/50 border border-[#e5e7eb] flex justify-between items-center transition-all hover:bg-white hover:shadow-md">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-black text-[#111418] uppercase leading-none">Inactivos Riesgo</span>
                  <span className="text-[10px] font-mono font-black text-rose-600 uppercase">{summary?.inactive_risk_customers || 0} Clientes</span>
                </div>
                <div className="flex gap-2">
                  <button className="size-9 rounded-full bg-white border border-[#dbe0e6] text-[#0f6cbd] flex items-center justify-center hover:bg-[#0f6cbd] hover:text-white transition-all shadow-sm shadow-blue-500/10"><Mail size={16} /></button>
                  <button className="size-9 rounded-full bg-white border border-[#dbe0e6] text-[#0f6cbd] flex items-center justify-center hover:bg-[#0f6cbd] hover:text-white transition-all shadow-sm shadow-blue-500/10"><Phone size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfitability;
