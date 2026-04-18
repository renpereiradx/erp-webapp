import React from 'react';
import { useBIForecasting, formatNumber } from '../hooks/useBIForecasting';
import BIForecastingNav from './BIForecastingNav';

const SaludInventario = () => {
  const { data, loading, error, refetch } = useBIForecasting('inventario');

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Cargando salud de inventario...</div>;
  if (error) return <div className="p-8 text-center font-bold text-red-500">Error: {error}</div>;
  if (!data) return null;

  const { kpis, notificaciones, productos, paginacion, ui_labels } = data;

  return (
    <div className="flex flex-col gap-6 max-w-[1280px] mx-auto w-full font-display">
      <BIForecastingNav active="inventario" />
      
      {/* Title & Export */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{ui_labels?.title || 'Salud del Inventario'}</h1>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#EF4444]"></span>
            <p className="text-[#EF4444] font-semibold text-sm">{kpis.productos_riesgo.valor} Alertas Críticas</p>
            <span className="text-slate-400 dark:text-slate-600 mx-2 text-sm">|</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{data.updated_text || 'Actualizado recientemente'}</p>
          </div>
        </div>
        <button 
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          {ui_labels?.export_button || 'Exportar Reporte'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Stock Total</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{formatNumber(kpis.stock_total.valor)}</p>
            <p className="text-sm font-medium text-slate-500">{ui_labels?.unit_label || 'Unidades'}</p>
          </div>
          <p className={`${kpis.stock_total.variacion < 0 ? 'text-[#EF4444]' : 'text-emerald-600'} text-xs font-bold flex items-center gap-1 mt-1`}>
            <span className="material-symbols-outlined text-xs">{kpis.stock_total.variacion < 0 ? 'trending_down' : 'trending_up'}</span> {kpis.stock_total.variacion}% {kpis.stock_total.label || 'vs mes anterior'}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Cobertura (%)</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{kpis.cobertura.valor}%</p>
            <p className="text-sm font-medium text-slate-500">{ui_labels?.global_label || 'Global'}</p>
          </div>
          <p className="text-emerald-600 text-xs font-bold flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">trending_up</span> {kpis.cobertura.variacion > 0 ? '+' : ''}{kpis.cobertura.variacion}% {kpis.cobertura.label || 'de eficiencia'}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Productos en Riesgo</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{kpis.productos_riesgo.valor} {ui_labels?.items_label || 'Items'}</p>
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded">ALERTA</span>
          </div>
          <p className="text-[#EF4444] text-xs font-bold flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">warning</span> {kpis.productos_riesgo.label || 'Crítico: Quiebre inminente'}
          </p>
        </div>
      </div>

      {/* Alerts Message Bar */}
      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary rounded-lg text-white">
            <span className="material-symbols-outlined">campaign</span>
          </div>
          <div>
            <p className="text-slate-900 dark:text-white font-bold text-sm">{ui_labels?.alerts_title || 'Notificaciones'}</p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{notificaciones}</p>
          </div>
        </div>
        <button className="text-primary font-bold text-sm hover:underline whitespace-nowrap px-4 py-2 bg-primary/10 rounded-lg transition-colors">
          {ui_labels?.details_button || 'Ver Detalles'}
        </button>
      </div>

      {/* Main Data Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{ui_labels?.table_headers?.producto || 'Producto'}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{ui_labels?.table_headers?.stock_actual || 'Stock Actual'}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{ui_labels?.table_headers?.venta_diaria || 'Venta Diaria'}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{ui_labels?.table_headers?.pronostico || 'Pronóstico'}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{ui_labels?.table_headers?.dias_restantes || 'Días'}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{ui_labels?.table_headers?.pto_reorden || 'Reorden'}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{ui_labels?.table_headers?.nivel_riesgo || 'Riesgo'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {productos.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white">{prod.nombre}</span>
                      <span className="text-xs font-mono text-slate-400">{prod.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium font-mono">{formatNumber(prod.stock)} {ui_labels?.unit_short || 'Unid.'}</td>
                  <td className="px-6 py-4 font-medium font-mono">{formatNumber(prod.venta_promedio)} {ui_labels?.unit_short || 'Unid.'}</td>
                  <td className="px-6 py-4 font-medium font-mono">{formatNumber(prod.pronostico)} {ui_labels?.unit_short || 'Unid.'}</td>
                  <td className="px-6 py-4 font-mono">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                      prod.riesgo === 'ALTO' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      prod.riesgo === 'MEDIO' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {prod.dias_restantes} días
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono">{formatNumber(prod.reorden)}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${
                      prod.riesgo === 'ALTO' ? 'text-red-600' :
                      prod.riesgo === 'MEDIO' ? 'text-amber-500' :
                      'text-emerald-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        prod.riesgo === 'ALTO' ? 'bg-red-600' :
                        prod.riesgo === 'MEDIO' ? 'bg-amber-500' :
                        'bg-emerald-600'
                      }`}></span> {prod.riesgo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <p>Mostrando {paginacion.mostrando} de {paginacion.total} items de inventario</p>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded opacity-50 cursor-not-allowed text-slate-400">Anterior</button>
            <button disabled className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded opacity-50 cursor-not-allowed text-slate-400">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaludInventario;
