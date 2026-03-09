import React from 'react';
import { useBIForecasting, formatCurrency, formatNumber } from '../hooks/useBIForecasting';
import BIForecastingNav from './BIForecastingNav';

const PronosticoDemanda = () => {
  const { data, loading, error } = useBIForecasting('demanda');

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Cargando pronóstico de demanda...</div>;
  if (error) return <div className="p-8 text-center font-bold text-red-500">Error: {error}</div>;
  if (!data) return null;

  const { kpis, categorias, productos_top } = data;

  return (
    <div className="flex flex-col gap-8 max-w-[1280px] mx-auto w-full font-display">
      <BIForecastingNav active="demanda" />

      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div className="flex min-w-72 flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Pronóstico de Demanda de Unidades</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Periodo proyectado: <span className="text-primary">Ene 2026 - Mar 2026</span></p>
        </div>
        <button className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-6 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold tracking-[0.015em] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700">
          <span className="material-symbols-outlined text-lg">download</span>
          <span className="truncate">Exportar Análisis Completo</span>
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Categoría de Mayor Crecimiento</p>
            <span className="material-symbols-outlined text-primary">trending_up</span>
          </div>
          <p className="text-slate-900 dark:text-white text-3xl font-black leading-tight">{kpis.categoria_crecimiento.nombre}</p>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 text-lg font-bold">+{kpis.categoria_crecimiento.variacion}%</span>
            <span className="text-slate-400 dark:text-slate-500 text-sm">vs. periodo anterior</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Producto con Mayor Demanda Estimada</p>
            <span className="material-symbols-outlined text-primary">stars</span>
          </div>
          <p className="text-slate-900 dark:text-white text-3xl font-black leading-tight">{kpis.producto_demanda.nombre}</p>
          <div className="flex items-center gap-2">
            <span className="text-primary text-lg font-bold font-mono">{formatNumber(kpis.producto_demanda.unidades)} unidades</span>
            <span className="text-slate-400 dark:text-slate-500 text-sm">Proyección trimestral</span>
          </div>
        </div>
      </div>

      {/* Main Data Grid (Categories) */}
      <div className="flex flex-col gap-4">
        <h2 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">Desglose de Demanda por Categoría</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Unidades Históricas</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider text-primary">Unidades Proyectadas</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Crecimiento (%)</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider text-center">Tendencia</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Confianza (%)</th>
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
          <h2 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">Top Productos Proyectados</h2>
          <button className="text-primary text-sm font-bold hover:underline">Ver todos los productos</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Unidades Estimadas</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Valor Estimado (₲)</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Nivel de Confianza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {productos_top.map((prod, idx) => (
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
        </div>
      </div>
    </div>
  );
};

export default PronosticoDemanda;
