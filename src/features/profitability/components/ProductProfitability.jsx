import React, { useState } from 'react';
import { useProfitability } from '../hooks/useProfitability';
import { getDynamicFontClass } from '@/utils/ui';
import { 
  Search, 
  Filter, 
  Calendar, 
  RefreshCcw, 
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Percent,
  Package,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Zap,
  AlertTriangle,
  Activity,
  Target
} from 'lucide-react';

/**
 * Formateador de moneda en Guaraníes (PYG)
 * Estilo técnico y limpio para ERP
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
 * Shimmer Loading for Table & KPIs
 */
const ProductProfitabilitySkeleton = () => (
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
            {displayValue}
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
        <div className="flex items-baseline gap-1.5">
          {isCurrency && <span className="text-sm font-bold text-slate-300 font-mono">Gs.</span>}
          <h3 className='text-[#111418] text-3xl font-black tracking-tight leading-none font-mono truncate'>
            {isCurrency ? displayValue : `${displayValue}%`}
          </h3>
        </div>
      </div>
    </div>
  )
}

const PerformanceBadge = ({ performance }) => {
  const styles = {
    EXCELLENT: 'bg-[#dff6dd] text-[#107c10] border-[#107c10]/10',
    GOOD: 'bg-[#deecf9] text-[#0f6cbd] border-[#0f6cbd]/10',
    AVERAGE: 'bg-[#fff4ce] text-[#794500] border-[#794500]/10',
    POOR: 'bg-[#fde7e9] text-[#d13438] border-[#d13438]/10',
    LOSS: 'bg-[#fde7e9] text-[#d13438] border-2 border-[#d13438]/20',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest border ${styles[performance] || 'bg-slate-100 text-slate-600'}`}>
      {performance}
    </span>
  );
};

const ProductProfitability = () => {
  const [params, setParams] = useState({ period: 'month', page: 1, page_size: 10 });
  const { data, loading, error } = useProfitability('getProducts', params);

  if (loading) return <ProductProfitabilitySkeleton />;
  
  if (error)
    return (
      <div className="p-10 text-center animate-in zoom-in-95 duration-500">
        <div className="max-w-md mx-auto glass-acrylic border border-rose-200 p-8 rounded-2xl text-[#d13438] shadow-2xl">
          <AlertTriangle className="mx-auto mb-4" size={40} />
          <h4 className="font-bold text-base uppercase tracking-widest mb-2 font-sans">Interrupción de Datos</h4>
          <p className="text-xs font-medium opacity-80 font-sans">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-[#d13438] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors font-sans">Reintentar</button>
        </div>
      </div>
    )

  const { products, summary, pagination } = data || {};

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32 font-sans">
      {/* Header Section - Fluent 2 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-4 border-b border-[#e5e7eb] mb-8">
        <div className='flex flex-col gap-1'>
          <nav className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">
             <span className="flex items-center gap-1.5"><Package size={14} className="text-[#0f6cbd]" /> RENTABILIDAD</span>
             <ChevronRight size={10} className="text-slate-300" />
             <span className="text-[#0f6cbd]/80">PRODUCTOS</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-black text-[#111418] tracking-tighter leading-none uppercase">
            Análisis por <span className="text-[#0f6cbd]">SKU</span>
          </h1>
          <p className="text-sm font-medium text-[#617589] mt-3 max-w-lg leading-relaxed">
            Desglose técnico de rentabilidad individual. Identifique productos estrella y riesgos operativos en el inventario actual.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-11 px-6 rounded-lg border border-[#dbe0e6] bg-white hover:bg-[#f3f2f1] text-[#617589] text-[11px] font-black uppercase tracking-widest transition-all shadow-sm">
            <Download size={16} /> <span>Exportar</span>
          </button>
          <button className="flex items-center gap-2 h-11 px-7 rounded-lg bg-[#0f6cbd] hover:bg-[#005a9e] text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20">
            <RefreshCcw size={16} /> <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics - Fluent 2 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KPICard title='SKUs Analizados' value={summary?.total_products} trendValue={summary?.total_products_growth} delay="0" icon={Package} color="primary" />
        <KPICard title='Margen Promedio' value={summary?.average_margin} trendValue={summary?.margin_growth} isCurrency={false} delay="100" icon={Percent} color="orange" />
        <KPICard title='Profit Total' value={summary?.total_profit} trendValue={summary?.profit_growth} delay="200" icon={TrendingUp} isAnchor={true} />
      </div>

      {/* Main Data Grid Section - Fluent 2 Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-fluent flex flex-col">
        {/* Table Toolbar */}
        <div className="px-8 py-6 border-b border-[#e5e7eb] bg-[#f3f2f1]/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <h3 className="text-[#111418] font-black text-[11px] uppercase tracking-[0.2em]">Inventario Auditado</h3>
            <span className="px-2.5 py-1 bg-[#deecf9] text-[#0f6cbd] text-[10px] font-black rounded-sm uppercase tracking-tighter">Live Data</span>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f6cbd] transition-colors" size={16} />
            <input 
              className="w-full h-11 pl-12 pr-4 bg-[#f3f2f1] border border-transparent rounded-lg text-xs font-bold uppercase tracking-wider outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#0f6cbd] transition-all" 
              placeholder="BUSCAR POR SKU O NOMBRE..." 
            />
          </div>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#faf9f8] border-b border-[#e5e7eb] text-[10px] font-black uppercase text-[#617589] tracking-widest">
              <tr>
                <th className="px-8 py-5">Producto / SKU</th>
                <th className="px-6 py-5 text-center">Unidades</th>
                <th className="px-6 py-5 text-right">Ingresos</th>
                <th className="px-6 py-5 text-right">Beneficio Bruto</th>
                <th className="px-6 py-5 text-right">Margen %</th>
                <th className="px-6 py-5 text-right">Markup %</th>
                <th className="px-8 py-5 text-center">Desempeño</th>
                <th className="px-4 py-5 w-10 text-center"><Filter size={16} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2f1] text-[13px]">
              {products?.map((item) => (
                <tr key={item.product_id} className="hover:bg-[#f3f2f1]/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <span className="font-black text-[#111418] uppercase tracking-tight group-hover:text-[#0f6cbd] transition-colors text-[13px]">{item.product_name}</span>
                      <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-tighter bg-slate-50 w-fit px-2 py-0.5 rounded border border-slate-100">{item.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center font-mono font-black text-[#617589]">{item.units_sold}</td>
                  <td className="px-6 py-6 text-right font-mono font-black text-[#111418]">{formatPYG(item.revenue)}</td>
                  <td className={`px-6 py-6 text-right font-black font-mono ${item.gross_profit >= 0 ? 'text-[#107c10]' : 'text-[#d13438]'}`}>
                    {item.gross_profit < 0 ? '-' : '+'}{formatPYG(Math.abs(item.gross_profit))}
                  </td>
                  <td className="px-6 py-6 text-right font-mono font-black text-[#111418]">{formatPercent(item.gross_margin_pct)}%</td>
                  <td className="px-6 py-6 text-right font-mono text-slate-400 font-bold">{formatPercent(item.markup)}%</td>
                  <td className="px-6 py-6 text-center">
                    <PerformanceBadge performance={item.performance} />
                  </td>
                  <td className="px-4 py-6 text-center">
                    <button className="text-slate-300 hover:text-[#0f6cbd] transition-colors p-2 rounded-lg hover:bg-blue-50">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {(!products || products.length === 0) && (
                <tr>
                  <td colSpan="8" className="px-8 py-28 text-center bg-white">
                    <div className="flex flex-col items-center gap-5">
                      <div className="size-20 bg-[#f3f2f1] rounded-full flex items-center justify-center text-slate-300">
                        <Package size={40} />
                      </div>
                      <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em]">No hay datos para este período</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination - Fluent 2 */}
        <div className="px-8 py-6 border-t border-[#e5e7eb] flex items-center justify-between bg-[#faf9f8]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#617589] uppercase tracking-widest">
              Total de registros: {pagination?.total_items || 0}
            </span>
          </div>
          <div className="flex items-center gap-8">
            <span className="text-[10px] font-black text-[#617589] uppercase tracking-widest">
              Página {pagination?.page || 1} / {pagination?.total_pages || 1}
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={pagination?.page === 1}
                className="size-9 flex items-center justify-center rounded-lg border border-[#dbe0e6] bg-white disabled:opacity-20 hover:bg-[#f3f2f1] transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                disabled={pagination?.page === pagination?.total_pages}
                className="size-9 flex items-center justify-center rounded-lg border border-[#dbe0e6] bg-white disabled:opacity-20 hover:bg-[#f3f2f1] transition-all shadow-sm text-[#0f6cbd]"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductProfitability;
