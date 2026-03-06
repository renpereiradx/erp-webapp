import React, { useEffect } from 'react';
import { useFinancialReports } from '../hooks/useFinancialReports';
import { formatPYG } from '../utils/currencyUtils';

/**
 * Análisis de Rentabilidad y Márgenes
 * Integrada con hook, mocks reales y React Best Practices.
 */
const ProfitabilityAnalysis = () => {
  const { loading, profitMargins, fetchProfitMargins } = useFinancialReports();

  // 1. Effects for browser synchronization
  useEffect(() => {
    document.title = 'Análisis de Rentabilidad | ERP System';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 2. Initial Data Fetching
  useEffect(() => {
    fetchProfitMargins('month');
  }, [fetchProfitMargins]);

  if (loading && !profitMargins) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f6f7f8] dark:bg-[#101922] min-h-screen font-['Inter',sans-serif] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#137fec]"></div>
          <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Analizando rentabilidad...</span>
        </div>
      </div>
    );
  }

  if (!profitMargins) return null;

  const {
    overall,
    by_category,
    top_profitable,
    least_profitable,
    trends
  } = profitMargins;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f6f7f8] dark:bg-[#101922] min-h-screen font-['Inter',sans-serif] animate-in fade-in duration-500">
      {/* Breadcrumbs & Header */}
      <div className="space-y-4 mb-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <span className="hover:text-[#137fec] cursor-pointer transition-colors">Reportes</span>
          <span className="material-symbols-outlined !text-xs text-slate-400">chevron_right</span>
          <span className="text-slate-900 dark:text-slate-100 font-medium">Análisis de Rentabilidad</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Análisis de Rentabilidad y Márgenes</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Visualización detallada de márgenes por categoría y rendimiento de productos basado en BI.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
              <span className="material-symbols-outlined !text-lg">calendar_today</span>
              <span>Mes Actual</span>
            </button>
            <button className="flex items-center gap-2 px-4 h-10 bg-[#137fec] text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-[#137fec]/20">
              <span className="material-symbols-outlined !text-lg">picture_as_pdf</span>
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Ingresos Totales</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatPYG(overall.revenue, { compact: true })}</p>
            {overall.revenue_growth && (
              <span className={`text-xs font-bold flex items-center gap-0.5 ${overall.revenue_growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                <span className="material-symbols-outlined !text-xs">{overall.revenue_growth >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
                {Math.abs(overall.revenue_growth)}%
              </span>
            )}
          </div>
          <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-[#137fec] h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Utilidad Bruta</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatPYG(overall.gross_margin, { compact: true })}</p>
            {overall.gross_growth && (
              <span className={`text-xs font-bold flex items-center gap-0.5 ${overall.gross_growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                <span className="material-symbols-outlined !text-xs">{overall.gross_growth >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
                {Math.abs(overall.gross_growth)}%
              </span>
            )}
          </div>
          <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-[#137fec] h-full rounded-full opacity-60" style={{ width: `${overall.gross_margin_pct}%` }}></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Margen Promedio</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{overall.gross_margin_pct}%</p>
          </div>
          <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-[#137fec] h-full rounded-full opacity-40" style={{ width: `${overall.gross_margin_pct}%` }}></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Margen Neto</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{overall.net_margin_pct}%</p>
            {overall.net_margin_growth && (
              <span className={`text-xs font-bold flex items-center gap-0.5 ${overall.net_margin_growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                <span className="material-symbols-outlined !text-xs">{overall.net_margin_growth >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
                {Math.abs(overall.net_margin_growth)}%
              </span>
            )}
          </div>
          <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-[#137fec] h-full rounded-full opacity-20" style={{ width: `${overall.net_margin_pct}%` }}></div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tendencia de Márgenes vs Revenue</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Comparativo histórico por mes (Gs. vs %)</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-[#137fec]"></div>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Margen %</span>
            </div>
          </div>
        </div>
        <div className="h-72 w-full flex items-end justify-between gap-4 px-2 md:px-4">
          {trends?.map((d, i) => (
            <div key={d.date || i} className="flex-1 flex flex-col items-center gap-3 group h-full">
              <div className="w-full flex items-end justify-center gap-1.5 h-full relative">
                <div className="w-1/3 bg-slate-100 dark:bg-slate-800 rounded-t-lg transition-all group-hover:bg-slate-200 dark:group-hover:bg-slate-700" style={{ height: `${d.gross_margin_pct}%` }}></div>
                <div className="w-1/3 bg-[#137fec] rounded-t-lg transition-all group-hover:brightness-110 shadow-sm" style={{ height: `${d.revenue_pct}%` }}></div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold tracking-tighter uppercase">{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Margin Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Márgenes por Categoría</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-right">Ingresos</th>
                <th className="px-6 py-4 text-right">Costo</th>
                <th className="px-6 py-4 text-right">Ganancia Bruta</th>
                <th className="px-6 py-4 text-center">Margen %</th>
                <th className="px-6 py-4 text-right">Evolución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {by_category?.map((row, i) => (
                <tr key={row.category_id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{row.category_name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium text-right">{formatPYG(row.revenue)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium text-right">{formatPYG(row.cost)}</td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 text-right">{formatPYG(row.gross_profit)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      parseFloat(row.gross_margin_pct) > 25 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                      parseFloat(row.gross_margin_pct) > 20 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                      'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                    }`}>
                      {row.gross_margin_pct}%
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-black ${row.evolution >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {row.evolution > 0 ? '+' : ''}{row.evolution}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top & Least Profitable Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        {/* Top Profitable */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">trending_up</span>
              Top Rentables
            </h3>
            <button className="text-[#137fec] text-xs font-black uppercase tracking-wider hover:underline transition-all">Ver todos</button>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {top_profitable?.map((p, i) => (
                <div key={p.product_id || i} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">inventory_2</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{p.product_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{p.gross_margin_pct}% Margen</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatPYG(p.gross_profit, { compact: true })} Utilidad</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Least Profitable */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500">trending_down</span>
              Menor Rentabilidad
            </h3>
            <button className="text-[#137fec] text-xs font-black uppercase tracking-wider hover:underline transition-all">Ver todos</button>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {least_profitable?.map((p, i) => (
                <div key={p.product_id || i} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">inventory_2</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{p.product_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-rose-600 dark:text-rose-400">{p.gross_margin_pct}% Margen</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatPYG(p.gross_profit, { compact: true })} Utilidad</p>
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

export default ProfitabilityAnalysis;
