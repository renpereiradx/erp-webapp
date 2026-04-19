import React, { useState } from 'react';
import { useProfitability } from '../hooks/useProfitability';
import { getDynamicFontClass } from '@/utils/ui';
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  AlertTriangle, 
  Wallet, 
  Search, 
  Download,
  ChevronLeft,
  ChevronRight,
  Layers,
  ChevronDown,
  Info
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
 * Shimmer Loading for Categories Page
 */
const CategoryProfitabilitySkeleton = () => (
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

    <div className='rounded-xl border border-slate-200 overflow-hidden shadow-sm'>
      <div className='h-16 bg-slate-50 border-b border-slate-200 animate-pulse' />
      {[...Array(5)].map((_, i) => (
        <div key={i} className='h-20 bg-white border-b border-slate-100 animate-pulse' />
      ))}
    </div>
  </div>
)

const KPICard = ({ title, subtitle, value, trendValue, icon: Icon, color = "primary", isAnchor = false, isCurrency = true }) => {
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
            <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-tighter">{subtitle}</h4>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold font-mono bg-white/10 backdrop-blur-md border border-white/10 ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
            <TrendIcon size={12} strokeWidth={3} />
            {displayTrendValue}
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
    orange: 'bg-orange-50 text-orange-600 border-orange-600/10',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-600/10',
    purple: 'bg-purple-50 text-purple-600 border-purple-600/10'
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
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{subtitle}</h4>
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

const CategoryProfitability = () => {
  const [period, setPeriod] = useState('month');
  const { data, loading, error } = useProfitability('getCategories', period);

  if (loading) return <CategoryProfitabilitySkeleton />;

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

  const { categories = [], summary = {} } = data || {};

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32 font-sans">
      {/* Header Section - Fluent 2 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-4 border-b border-[#e5e7eb] mb-8">
        <div className='flex flex-col gap-1'>
          <nav className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">
             <span className="flex items-center gap-1.5"><Layers size={14} className="text-[#0f6cbd]" /> RENTABILIDAD</span>
             <ChevronRight size={10} className="text-slate-300" />
             <span className="text-[#0f6cbd]/80">CATEGORÍAS</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-black text-[#111418] tracking-tighter leading-none uppercase">
            Familias de <span className="text-[#0f6cbd]">Productos</span>
          </h1>
          <p className="text-sm font-medium text-[#617589] mt-3 max-w-lg leading-relaxed">
            Auditoría técnica por línea de negocio. Analice la contribución marginal y el volumen operativo por segmento.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-11 px-6 rounded-lg border border-[#dbe0e6] bg-white hover:bg-[#f3f2f1] text-[#617589] text-[11px] font-black uppercase tracking-widest transition-all shadow-sm">
            <Download size={16} /> <span>Exportar</span>
          </button>
          <div className='flex gap-1 p-1 bg-[#f3f2f1] rounded-lg border border-[#e1dfdd]'>
            {[
              { id: 'month', label: 'Mes' },
              { id: 'quarter', label: 'Trim.' },
              { id: 'year', label: 'Año' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-5 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-200 ${
                  period === p.id
                    ? 'bg-white text-[#0f6cbd] shadow-sm ring-1 ring-[#e1dfdd] scale-105'
                    : 'text-[#617589] hover:text-[#111418] hover:bg-white/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard 
          title="Líder en Beneficio" 
          subtitle={summary?.most_profitable_name} 
          value={summary?.most_profitable_value} 
          trendValue={summary?.most_profitable_growth} 
          icon={TrendingUp} 
          color="emerald" 
        />
        <KPICard 
          title="Margen Crítico" 
          subtitle={summary?.least_profitable_name} 
          value={summary?.least_profitable_margin} 
          trendValue={-5.2} // Simulado para mostrar tendencia negativa
          isCurrency={false}
          icon={AlertTriangle} 
          color="orange" 
        />
        <KPICard 
          title="Consolidado Total" 
          subtitle="Rendimiento de Portafolio" 
          value={summary?.total_profit} 
          trendValue={summary?.total_profit_growth}
          icon={Wallet} 
          isAnchor={true} 
        />
      </div>

      {/* Main Analysis Data Grid */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-fluent overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-[#e5e7eb] bg-[#f3f2f1]/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <h2 className="font-black text-[#111418] text-[11px] uppercase tracking-[0.25em] leading-none">Matriz de Desempeño por Familia</h2>
            <span className="px-2.5 py-1 bg-[#deecf9] text-[#0f6cbd] text-[10px] font-black rounded-sm uppercase tracking-tighter">Auditoría Live</span>
          </div>
          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f6cbd] transition-colors" size={16} />
            <input className="w-full h-11 pl-12 pr-4 bg-white border border-[#dbe0e6] rounded-xl text-xs font-bold uppercase tracking-wider outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#0f6cbd] transition-all" placeholder="BUSCAR CATEGORÍA..." />
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-[#faf9f8] border-b border-[#e5e7eb] text-[10px] font-black uppercase text-[#617589] tracking-widest">
              <tr>
                <th className="px-8 py-5">Categoría / Segmento</th>
                <th className="px-6 py-5 text-center">SKUs</th>
                <th className="px-6 py-5 text-right">Volumen</th>
                <th className="px-8 py-5">Contribución Ingresos</th>
                <th className="px-8 py-5 text-right">M. Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2f1] text-[13px]">
              {categories?.map((cat) => (
                <tr key={cat.category_id} className="hover:bg-[#f3f2f1]/30 transition-all group cursor-default">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <span className="font-black text-[#111418] uppercase tracking-tight group-hover:text-[#0f6cbd] transition-colors text-[13px]">{cat.category_name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 w-fit px-2 py-0.5 rounded border border-slate-100">Sector Operativo</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="px-3 py-1 bg-[#f3f2f1] rounded font-black font-mono text-[11px] text-slate-600 border border-transparent group-hover:border-[#dbe0e6] transition-colors">
                      {cat.product_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right font-mono font-black text-[#617589]">{cat.units_sold}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-48 bg-[#f3f2f1] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#0f6cbd]/30 h-full" style={{ width: `${cat.revenue_contribution_pct}%` }}></div>
                      </div>
                      <span className="font-mono font-black text-[#617589] text-[11px] w-10">{formatPercent(cat.revenue_contribution_pct)}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <span className={`font-black font-mono text-[13px] ${cat.gross_margin_pct >= 20 ? 'text-[#107c10]' : 'text-[#d13438]'}`}>{formatPercent(cat.gross_margin_pct)}%</span>
                      <div className="w-24 h-1.5 bg-[#f3f2f1] rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1500 ease-out ${cat.gross_margin_pct >= 20 ? 'bg-[#107c10] shadow-[0_0_8px_rgba(16,124,16,0.4)]' : 'bg-[#d13438]'}`} style={{ width: `${cat.gross_margin_pct}%` }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-8 py-6 border-t border-[#e5e7eb] flex justify-between items-center bg-[#faf9f8]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#617589]">Total: {categories?.length || 0} Familias Auditadas</p>
          <div className="flex gap-2">
            <button className="size-9 flex items-center justify-center rounded-lg border border-[#dbe0e6] bg-white text-slate-400 disabled:opacity-20 hover:bg-[#f3f2f1] transition-all shadow-sm"><ChevronLeft size={18} /></button>
            <button className="size-9 flex items-center justify-center rounded-lg border border-[#dbe0e6] bg-white text-[#0f6cbd] hover:bg-[#f3f2f1] transition-all shadow-sm"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* Efficiency Section - Advanced Data Viz */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-fluent p-10 group transition-all hover:shadow-fluent-hover relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
          <Layers size={200} />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-[#f3f2f1] rounded-xl text-[#0f6cbd] border border-[#e5e7eb] group-hover:scale-110 transition-transform">
              <Layers size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-widest text-[#111418] leading-none">Eficiencia de Portafolio</h2>
              <p className="text-[11px] font-bold text-[#617589] uppercase tracking-widest mt-3">Correlación Ingresos vs Beneficio Bruto por Categoría</p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest bg-[#faf9f8] p-4 rounded-full border border-[#e5e7eb]">
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-sm bg-[#0f6cbd]/20"></span>
              <span className="text-[#617589]">Ventas</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-sm bg-[#107c10] shadow-[0_0_8px_rgba(16,124,16,0.3)]"></span>
              <span className="text-[#107c10]">Profit</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-20 gap-y-12 relative z-10">
          {categories?.slice(0, 4).map((cat) => (
            <div key={cat.category_id} className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-[13px] font-black uppercase tracking-tight text-[#111418]">{cat.category_name}</span>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-mono font-black text-[#617589] uppercase tracking-tighter">Gs. {formatPYG(cat.revenue)}</span>
                  <span className="text-[9px] font-black text-[#107c10] uppercase tracking-widest">+{formatPercent(cat.gross_margin_pct)}% MG.</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="h-2 w-full bg-[#f3f2f1] rounded-full overflow-hidden p-0.5 border border-[#e5e7eb]">
                  <div className="bg-[#0f6cbd]/20 h-full rounded-full" style={{ width: '90%' }}></div>
                </div>
                <div className="h-2 w-full bg-[#f3f2f1] rounded-full overflow-hidden p-0.5 border border-[#e5e7eb]">
                  <div className="bg-[#107c10] h-full rounded-full shadow-[0_0_10px_rgba(16,124,16,0.4)] transition-all duration-1500 ease-out" style={{ width: `${cat.gross_margin_pct}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryProfitability;
