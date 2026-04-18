import React from 'react';
import { useBIForecasting, formatCurrency, formatNumber } from '../hooks/useBIForecasting';
import BIForecastingNav from './BIForecastingNav';

const PronosticoDemanda = () => {
  const { data, loading, error, refetch } = useBIForecasting('demanda');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 5;

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Cargando pronóstico de demanda...</div>;
  if (error) return <div className="p-8 text-center font-bold text-red-500">Error: {error}</div>;
  if (!data) return null;

  const { kpis, categorias, productos_top, ui_labels } = data;

  // Lógica de paginación
  const totalPages = Math.ceil(productos_top.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = productos_top.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col gap-8 max-w-[1280px] mx-auto w-full font-display">
      <BIForecastingNav active="demanda" />

      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div className="flex min-w-72 flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{ui_labels?.title || 'Pronóstico de Demanda'}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium">{ui_labels?.period_label || 'Periodo proyectado:'} <span className="text-primary">{data.periodo_proyectado || 'Ene 2026 - Mar 2026'}</span></p>
        </div>
        <button 
          onClick={() => refetch()}
          className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-6 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold tracking-[0.015em] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          <span className="truncate">{ui_labels?.export_button || 'Exportar Análisis Completo'}</span>
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">{ui_labels?.metrics?.top_category || 'Categoría de Mayor Crecimiento'}</p>
            <span className="material-symbols-outlined text-primary">trending_up</span>
          </div>
          <p className="text-slate-900 dark:text-white text-3xl font-black leading-tight">{kpis.categoria_crecimiento.nombre}</p>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 text-lg font-bold">+{kpis.categoria_crecimiento.variacion}%</span>
            <span className="text-slate-400 dark:text-slate-500 text-sm">{kpis.categoria_crecimiento.label || 'vs. periodo anterior'}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">{ui_labels?.metrics?.top_product || 'Producto con Mayor Demanda'}</p>
            <span className="material-symbols-outlined text-primary">stars</span>
          </div>
          <p className="text-slate-900 dark:text-white text-3xl font-black leading-tight">{kpis.producto_demanda.nombre}</p>
          <div className="flex items-center gap-2">
            <span className="text-primary text-lg font-bold font-mono">{formatNumber(kpis.producto_demanda.unidades)} {ui_labels?.units_label || 'unidades'}</span>
            <span className="text-slate-400 dark:text-slate-500 text-sm">{kpis.producto_demanda.label || 'Proyección trimestral'}</span>
          </div>
        </div>
      </div>

      {/* Main Data Grid (Categories) */}
      <div className="flex flex-col gap-4">
        <h2 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{ui_labels?.tables?.categories_title || 'Desglose por Categoría'}</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{ui_labels?.table_headers?.categoria || 'Categoría'}</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{ui_labels?.table_headers?.unidades_historicas || 'Histórico'}</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider text-primary">{ui_labels?.table_headers?.unidades_proyectadas || 'Proyectado'}</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{ui_labels?.table_headers?.crecimiento || 'Crecimiento'}</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider text-center">{ui_labels?.table_headers?.tendencia || 'Tendencia'}</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{ui_labels?.table_headers?.confianza || 'Confianza'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categorias.map((cat, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-slate-900 dark:text-white font-semibold">{cat.nombre}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono">{formatNumber(cat.historico)}</td>
                  <td className="px-6 py-4 text-primary font-bold font-mono">{formatNumber(cat.proyectado)}</td>
                  <td className={`px-6 py-4 font-medium font-mono ${cat.tendencia === 'up' ? 'text-emerald-600 dark:text-emerald-400' : cat.tendencia === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600'}`}>
                    {cat.crecimiento}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`material-symbols-outlined ${cat.tendencia === 'up' ? 'text-emerald-600 dark:text-emerald-400' : cat.tendencia === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                      {cat.tendencia === 'up' ? 'trending_up' : cat.tendencia === 'down' ? 'trending_down' : 'trending_flat'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${cat.confianza}%` }}></div>
                      </div>
                      <p className="text-slate-900 dark:text-white text-sm font-bold">{cat.confianza}%</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Star Products */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{ui_labels?.tables?.products_title || 'Top Productos'}</h2>
          <button 
            onClick={() => refetch()}
            className="text-primary text-sm font-bold hover:underline"
          >
            {ui_labels?.tables?.view_all_button || 'Ver todos los productos'}
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{ui_labels?.table_headers?.producto || 'Producto'}</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{ui_labels?.table_headers?.categoria || 'Categoría'}</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{ui_labels?.units_label ? `Unidades Estimadas (${ui_labels.units_label})` : 'Unidades Estimadas'}</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{ui_labels?.table_headers?.valor_estimado || 'Valor Estimado (₲)'}</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{ui_labels?.table_headers?.nivel_confianza || 'Nivel de Confianza'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedProducts.map((prod, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{prod.producto}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{prod.categoria}</td>
                  <td className="px-6 py-4 text-slate-900 dark:text-white font-bold font-mono">{formatNumber(prod.unidades)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono">{formatCurrency(prod.valor)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                      prod.confianza === 'Alta' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' :
                      'bg-primary/10 dark:bg-primary/20 text-primary'
                    }`}>
                      {prod.confianza}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Footer de Paginación */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 font-medium">
              Mostrando {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, productos_top.length)} de {productos_top.length} productos
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 text-xs font-bold rounded border transition-all ${
                  currentPage === 1 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95'
                }`}
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 text-xs font-bold rounded border transition-all ${
                  currentPage === totalPages 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95'
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PronosticoDemanda;
