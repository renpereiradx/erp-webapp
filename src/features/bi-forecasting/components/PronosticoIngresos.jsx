import React from 'react';
import { useBIForecasting, formatCurrency } from '../hooks/useBIForecasting';
import BIForecastingNav from './BIForecastingNav';

const PronosticoIngresos = () => {
  const { data, loading, error, refetch } = useBIForecasting('ingresos');

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Cargando pronóstico de ingresos...</div>;
  if (error) return <div className="p-8 text-center font-bold text-red-500">Error: {error}</div>;
  if (!data) return null;

  const { escenarios, proyeccion_mensual, categorias, total, ui_labels } = data;

  return (
    <div className="flex flex-col gap-8 max-w-[1280px] mx-auto w-full font-display">
      <BIForecastingNav active="ingresos" />

      {/* Page Header Section */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold tracking-tight">{ui_labels?.title || 'Pronóstico de Ingresos'}</h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <p className="text-base font-medium uppercase tracking-wider">{data.periodo_rango || 'Enero - Diciembre 2026'}</p>
          </div>
        </div>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-all shadow-sm"
        >
          <span className="material-symbols-outlined">download</span>
          <span>{ui_labels?.export_button || 'Exportar Informe'}</span>
        </button>
      </div>


      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pessimistic Scenario */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400">trending_down</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 uppercase">{ui_labels?.probability_label || 'Prob.'} {escenarios.pesimista.probabilidad}%</span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{escenarios.pesimista.nombre}</p>
            <p className="text-2xl font-black mt-1 font-mono">{formatCurrency(escenarios.pesimista.valor)}</p>
            <p className="text-emerald-600 text-sm font-bold flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs">arrow_upward</span> {escenarios.pesimista.variacion}
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{escenarios.pesimista.descripcion}</p>
          </div>
        </div>

        {/* Base Scenario (Featured) */}
        <div className={`bg-white dark:bg-slate-900 border-2 ${escenarios.base.recomendado ? 'border-primary shadow-xl shadow-primary/5' : 'border-slate-200 dark:border-slate-800'} rounded-xl p-6 relative flex flex-col gap-4 ${escenarios.base.recomendado ? 'transform scale-[1.02]' : ''}`}>
          {escenarios.base.recomendado && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">{ui_labels?.recommended_badge || 'Recomendado'}</div>
          )}
          <div className="flex justify-between items-start">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">analytics</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-primary/20 rounded text-primary uppercase">{ui_labels?.probability_label || 'Prob.'} {escenarios.base.probabilidad}%</span>
          </div>
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-widest">{escenarios.base.nombre}</p>
            <p className="text-3xl font-black mt-1 text-slate-900 dark:text-slate-100 font-mono">{formatCurrency(escenarios.base.valor)}</p>
            <p className="text-emerald-600 text-sm font-bold flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs">arrow_upward</span> {escenarios.base.variacion}
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{escenarios.base.descripcion}</p>
          </div>
        </div>

        {/* Optimistic Scenario */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">trending_up</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 uppercase">{ui_labels?.probability_label || 'Prob.'} {escenarios.optimista.probabilidad}%</span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{escenarios.optimista.nombre}</p>
            <p className="text-2xl font-black mt-1 font-mono">{formatCurrency(escenarios.optimista.valor)}</p>
            <p className="text-emerald-600 text-sm font-bold flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs">arrow_upward</span> {escenarios.optimista.variacion}
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{escenarios.optimista.descripcion}</p>
          </div>
        </div>
      </div>

      {/* Detailed Monthly Forecast Table */}
      <div className="flex flex-col gap-4">
        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold px-1">{ui_labels?.monthly_table_title || 'Proyección Mensual'}</h2>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{ui_labels?.table_headers?.mes || 'Mes'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{ui_labels?.table_headers?.base || 'Pronóstico Base (₲)'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right text-red-600/80">{ui_labels?.table_headers?.inf || 'Límite Inferior (₲)'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right text-emerald-600/80">{ui_labels?.table_headers?.sup || 'Límite Superior (₲)'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{ui_labels?.table_headers?.estado || 'Estado'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {proyeccion_mensual.map((item, idx) => (
                <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${item.destacado ? 'bg-primary/5' : ''}`}>
                  <td className={`px-6 py-3.5 text-sm ${item.destacado ? 'font-bold text-primary italic' : 'font-semibold'}`}>{item.mes}</td>
                  <td className={`px-6 py-3.5 text-sm text-right tabular-nums font-mono ${item.destacado ? 'font-bold text-primary' : 'font-medium'}`}>{formatCurrency(item.base)}</td>
                  <td className={`px-6 py-3.5 text-sm text-right tabular-nums font-mono ${item.destacado ? 'font-bold text-primary' : 'text-slate-500'}`}>{formatCurrency(item.inf)}</td>
                  <td className={`px-6 py-3.5 text-sm text-right tabular-nums font-mono ${item.destacado ? 'font-bold text-primary' : 'text-slate-500'}`}>{formatCurrency(item.sup)}</td>
                  <td className="px-6 py-3.5 text-center">
                    {item.estado !== '-' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">{item.estado}</span>
                    )}
                    {item.estado === '-' && '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="flex flex-col gap-4 mb-10">
        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold px-1">{ui_labels?.categories_table_title || 'Desglose por Categoría'}</h2>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{ui_labels?.table_headers?.categoria || 'Categoría'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{ui_labels?.table_headers?.valor || 'Ingreso Proyectado (₲)'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{ui_labels?.table_headers?.porcentaje || '% del Total'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{ui_labels?.table_headers?.crecimiento || 'Crecimiento (%)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categorias.map((cat, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className={`size-2 rounded-full bg-${cat.color}-500`}></div>
                    <span className="text-sm font-semibold">{cat.nombre}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right tabular-nums font-mono font-medium">{formatCurrency(cat.valor)}</td>
                  <td className="px-6 py-4 text-sm text-right tabular-nums font-mono font-medium">{cat.porcentaje}</td>
                  <td className={`px-6 py-4 text-sm text-right tabular-nums font-mono font-bold ${cat.crecimiento.startsWith('+') ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {cat.crecimiento}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-black border-t-2 border-slate-200 dark:border-slate-800">
              <tr>
                <td className="px-6 py-4 text-sm uppercase">{ui_labels?.total_label || 'Total Consolidado'}</td>
                <td className="px-6 py-4 text-sm text-right tabular-nums font-mono">{formatCurrency(total.valor)}</td>
                <td className="px-6 py-4 text-sm text-right tabular-nums font-mono">{total.porcentaje}</td>
                <td className="px-6 py-4 text-sm text-right tabular-nums text-emerald-600 font-mono">{total.crecimiento}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PronosticoIngresos;
