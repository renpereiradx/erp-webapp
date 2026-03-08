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

const PerformanceBadge = ({ performance }) => {
  const styles = {
    EXCELLENT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    GOOD: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    AVERAGE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    POOR: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    LOSS: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles[performance] || ''}`}>
      {performance}
    </span>
  );
};

const ProductProfitability = () => {
  const [params, setParams] = useState({ period: 'month', page: 1, page_size: 10 });
  const { data, loading, error } = useProfitability('getProducts', params);

  if (loading) return <div className="p-8 text-center animate-pulse text-slate-500">Cargando análisis de productos...</div>;
  if (error) return <div className="p-8 text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-lg m-4">Error: {error}</div>;

  const { products, summary, pagination } = data;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Rentabilidad por Producto</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Análisis detallado de márgenes por SKU en Gs.</p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden sm:inline">Exportar</span>
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#137fec] text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
            <RefreshCcw size={16} className="md:w-[18px] md:h-[18px]" /> <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics - Scroll horizontal en mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Productos</p>
            <Package className="text-[#137fec]" size={18} />
          </div>
          <p className="text-slate-900 dark:text-white text-2xl font-bold font-mono">{summary.total_products}</p>
          <p className="text-emerald-600 text-[10px] font-bold mt-2">RENTABLES: {summary.profitable_products}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Margen Promedio</p>
            <Percent className="text-amber-500" size={18} />
          </div>
          <p className="text-slate-900 dark:text-white text-2xl font-bold font-mono">{summary.average_margin}%</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full" style={{ width: `${summary.average_margin}%` }}></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Beneficio Total</p>
            <TrendingUp className="text-emerald-500" size={18} />
          </div>
          <p className={`text-slate-900 dark:text-white font-bold font-mono ${getDynamicFontClass(summary.total_profit, { baseClass: 'text-2xl', mediumClass: 'text-xl', smallClass: 'text-lg', extraSmallClass: 'text-base' })}`}>
            {formatPYG(summary.total_profit)}
          </p>
          <p className="text-slate-400 text-[9px] font-bold mt-2 uppercase">TOTAL VENTAS: {formatPYG(summary.total_revenue)}</p>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Table Header / Toolbar */}
        <div className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-widest">Detalle Operativo</h3>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20" 
                placeholder="Filtrar por SKU o nombre..." 
              />
            </div>
          </div>
        </div>

        {/* Mobile: Card List (Visible solo en mobile) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {products.map((item) => (
            <div key={item.product_id} className="p-4 space-y-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white text-sm truncate uppercase tracking-tight">{item.product_name}</span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">{item.sku}</span>
                </div>
                <PerformanceBadge performance={item.performance} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ventas / Unid.</p>
                  <p className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">{formatPYG(item.revenue)} <span className="text-[10px] opacity-60">({item.units_sold}u)</span></p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Beneficio / Margen</p>
                  <p className={`text-xs font-black font-mono ${item.gross_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatPYG(item.gross_profit)} <span className="ml-1 text-[10px]">({item.gross_margin_pct}%)</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table (Oculta en mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Producto / SKU</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 text-center">Ventas</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 text-right">Ingresos (Gs.)</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 text-right">Beneficio (Gs.)</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 text-right">Margen</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 text-right">Markup</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 text-center">Desempeño</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {products.map((item) => (
                <tr key={item.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-default">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-900 dark:text-white leading-none uppercase tracking-tight">{item.product_name}</span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">{item.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold">{item.units_sold}</td>
                  <td className="px-6 py-4 text-right font-mono font-medium">{formatPYG(item.revenue)}</td>
                  <td className={`px-6 py-4 text-right font-bold font-mono ${item.gross_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatPYG(item.gross_profit)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold">{item.gross_margin_pct}%</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-500">{item.markup}%</td>
                  <td className="px-6 py-4 text-center">
                    <PerformanceBadge performance={item.performance} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination - Adaptativa */}
        <div className="px-4 md:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-transparent">
          <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest">Pág. {pagination.page} / {pagination.total_pages}</span>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white transition-colors text-[#137fec]">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductProfitability;
