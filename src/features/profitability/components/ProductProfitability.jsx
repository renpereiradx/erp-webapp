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
  Percent,
  Package,
  ChevronLeft,
  ChevronRight,
  MoreVertical
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

const PerformanceBadge = ({ performance }) => {
  const styles = {
    EXCELLENT: 'bg-[#dff6dd] text-[#107c10]',
    GOOD: 'bg-[#dff6dd]/60 text-[#107c10]',
    AVERAGE: 'bg-[#fff4ce] text-[#794500]',
    POOR: 'bg-[#fde7e9] text-[#a4262c]',
    LOSS: 'bg-[#fde7e9] text-[#a4262c] border border-[#fde7e9]',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${styles[performance] || 'bg-slate-100 text-slate-600'}`}>
      {performance}
    </span>
  );
};

const ProductProfitability = () => {
  const [params, setParams] = useState({ period: 'month', page: 1, page_size: 10 });
  const { data, loading, error } = useProfitability('getProducts', params);

  if (loading) return (
    <div className="p-20 text-center animate-in fade-in duration-700">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Analizando rentabilidad...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="p-10 text-center animate-in slide-in-from-top-4 duration-500">
      <div className="max-w-md mx-auto bg-[#fde7e9] border border-[#fde7e9] p-6 rounded-xl text-[#a4262c]">
        <h4 className="font-bold text-sm uppercase mb-2">Error de Sincronización</h4>
        <p className="text-xs font-medium">{error}</p>
      </div>
    </div>
  );

  const { products, summary, pagination } = data || {};

  if (!data) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Section - Modern & Airy */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-l-4 border-primary pl-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">
            <span>Rentabilidad</span> <ChevronRight size={10} /> <span className="text-primary">Productos</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-none">Análisis de Productos</h1>
          <p className="text-sm font-medium text-slate-500 mt-3 max-w-lg">
            Monitoreo técnico de márgenes operativos y desempeño financiero por SKU en Guaraníes (Gs.)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <Download size={16} /> <span>EXPORTAR</span>
          </button>
          <button className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
            <RefreshCcw size={16} /> <span>ACTUALIZAR</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics - Fluent 2 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">SKUs Analizados</p>
            <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:scale-110 transition-transform">
              <Package size={20} />
            </div>
          </div>
          <p className="text-slate-900 text-3xl font-bold tracking-tight">{summary?.total_products || 0}</p>
          <div className="flex items-center gap-2 mt-4">
             <span className="size-1.5 rounded-full bg-success"></span>
             <p className="text-success text-[10px] font-bold uppercase tracking-tight">Rentables: {summary?.profitable_products || 0}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Margen Bruto Promedio</p>
            <div className="p-2 bg-amber-100 text-[#794500] rounded-lg group-hover:scale-110 transition-transform">
              <Percent size={20} />
            </div>
          </div>
          <p className="text-slate-900 text-3xl font-bold tracking-tight">{summary?.average_margin || 0}%</p>
          <div className="w-full bg-[#f3f2f1] h-1.5 rounded-full mt-5 overflow-hidden">
            <div className="bg-amber-500 h-full transition-all duration-1000 ease-out" style={{ width: `${summary?.average_margin || 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Beneficio Operativo Total</p>
            <div className="p-2 bg-[#dff6dd] text-[#107c10] rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-400">Gs.</span>
            <p className={`text-slate-900 font-bold tracking-tighter font-mono ${getDynamicFontClass(summary?.total_profit, { baseClass: 'text-3xl', mediumClass: 'text-2xl', smallClass: 'text-xl', extraSmallClass: 'text-lg' })}`}>
              {formatPYG(summary?.total_profit || 0)}
            </p>
          </div>
          <p className="text-slate-400 text-[9px] font-bold mt-4 uppercase tracking-widest">INGRESOS: {formatPYG(summary?.total_revenue || 0)}</p>
        </div>
      </div>

      {/* Main Data Grid Section - Fluent 2 Table */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-fluent-2">
        {/* Table Toolbar */}
        <div className="px-8 py-6 border-b border-border-subtle bg-[#f3f2f1]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h3 className="text-slate-900 font-bold text-xs uppercase tracking-[0.2em]">Detalle de Rentabilidad</h3>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              className="w-full pl-11 pr-4 py-2.5 bg-[#f3f2f1] border border-transparent rounded-lg text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
              placeholder="Buscar por SKU o nombre de producto..." 
            />
          </div>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-white border-b border-border-subtle text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-8 py-5">Identificación de Producto</th>
                <th className="px-6 py-5 text-center">Unid.</th>
                <th className="px-6 py-5 text-right">Ingresos (Gs.)</th>
                <th className="px-6 py-5 text-right">Beneficio (Gs.)</th>
                <th className="px-6 py-5 text-right">Margen</th>
                <th className="px-6 py-5 text-right">Markup</th>
                <th className="px-8 py-5 text-center">Desempeño</th>
                <th className="px-4 py-5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {products?.map((item) => (
                <tr key={item.product_id} className="hover:bg-[#f3f2f1]/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-900 leading-none tracking-tight group-hover:text-primary transition-colors uppercase text-sm">{item.product_name}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{item.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center font-mono font-bold text-slate-600">{item.units_sold}</td>
                  <td className="px-6 py-6 text-right font-mono font-semibold text-slate-700">{formatPYG(item.revenue)}</td>
                  <td className={`px-6 py-6 text-right font-bold font-mono ${item.gross_profit >= 0 ? 'text-[#107c10]' : 'text-[#d13438]'}`}>
                    {item.gross_profit < 0 && '-'}{formatPYG(Math.abs(item.gross_profit))}
                  </td>
                  <td className="px-6 py-6 text-right font-mono font-bold text-slate-900">{item.gross_margin_pct}%</td>
                  <td className="px-6 py-6 text-right font-mono text-slate-400 font-medium">{item.markup}%</td>
                  <td className="px-6 py-6 text-center">
                    <PerformanceBadge performance={item.performance} />
                  </td>
                  <td className="px-4 py-6 text-right">
                    <button className="text-slate-300 hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/5">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {(!products || products.length === 0) && (
                <tr>
                  <td colSpan="8" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <Package size={32} />
                      </div>
                      <p className="text-slate-400 font-semibold text-sm uppercase tracking-wider">No se encontraron resultados</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination - Professional Style */}
        <div className="px-8 py-5 border-t border-border-subtle flex items-center justify-between bg-[#f3f2f1]/20">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Mostrando {products?.length || 0} de {pagination?.total_items || 0} productos
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Página {pagination?.page || 1} de {pagination?.total_pages || 1}
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={pagination?.page === 1}
                className="p-2 rounded-lg border border-border-base bg-white disabled:opacity-30 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={pagination?.page === pagination?.total_pages}
                className="p-2 rounded-lg border border-border-base bg-white disabled:opacity-30 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-primary"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductProfitability;
