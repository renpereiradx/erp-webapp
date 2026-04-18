import React from 'react';
import { useBIForecasting, formatCurrency } from '../hooks/useBIForecasting';
import BIForecastingNav from './BIForecastingNav';

const PronosticoVentas = () => {
  const { data, loading, error, refetch } = useBIForecasting('ventas');

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Cargando pronóstico de ventas...</div>;
  if (error) return <div className="p-8 text-center font-bold text-red-500">Error: {error}</div>;
  if (!data) return null;

  const { kpis, historial, proyeccion, estacionalidad, ui_labels } = data;

  return (
    <div className="flex flex-col gap-6 max-w-[1280px] mx-auto w-full font-display">
      <BIForecastingNav active="ventas" />

      {/* Header Section */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{ui_labels?.title || 'Detalle de Pronóstico de Ventas'}</h1>
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{ui_labels?.model_badge || 'Estacional'}</span>
          </div>
          <p className="text-slate-500 font-medium">Granularidad: <span className="text-slate-700 dark:text-slate-300">{data.model_info?.granularidad || 'MENSUAL'}</span> | Modelo: <span className="text-slate-700 dark:text-slate-300">{data.model_info?.modelo || 'Exponential Smoothing'}</span></p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            {ui_labels?.export_button || 'Exportar Reporte'}
          </button>
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            {ui_labels?.recalculate_button || 'Recalcular'}
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">Tasa de Crecimiento</p>
            <span className={`${kpis.crecimiento.periodo_anterior > 0 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'} px-2 py-0.5 rounded text-xs font-bold`}>
              {kpis.crecimiento.periodo_anterior > 0 ? '+' : ''}{kpis.crecimiento.periodo_anterior}%
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{kpis.crecimiento.valor > 0 ? '+' : ''}{kpis.crecimiento.valor}%</p>
          <p className="text-xs text-slate-400 mt-1">{kpis.crecimiento.label || 'Vs. periodo anterior'}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">Nivel de Confianza</p>
            <span className="material-symbols-outlined text-slate-400 text-lg">verified_user</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{kpis.confianza.valor}%</p>
            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="bg-primary h-full" style={{ width: `${kpis.confianza.valor}%` }}></div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">{data.model_info?.confianza_label || 'Intervalo de confianza 95%'}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">MAE (Error Absoluto)</p>
            <span className="text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-xs font-bold">{kpis.mae.porcentaje}%</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(kpis.mae.valor)}</p>
          <p className="text-xs text-slate-400 mt-1">{kpis.mae.label || 'Promedio mensual de error'}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">R-Cuadrado</p>
            <span className="material-symbols-outlined text-primary text-lg">query_stats</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{kpis.r_cuadrado.valor}</p>
          <p className="text-xs text-slate-400 mt-1">{kpis.r_cuadrado.label || 'Bondad de ajuste del modelo'}</p>
        </div>
      </div>

      {/* Data Grid: 60/40 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-4">
        {/* Left: Recent History */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              {ui_labels?.history_title || 'Historial Reciente (6 meses)'}
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{ui_labels?.history_badge || 'Datos Reales'}</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-3">{ui_labels?.table_headers?.periodo || 'Periodo'}</th>
                <th className="px-6 py-3 text-right">{ui_labels?.table_headers?.venta_real || 'Venta Real (₲)'}</th>
                <th className="px-6 py-3 text-right">{ui_labels?.table_headers?.variacion || 'Variación'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {historial.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-3 font-medium">{item.periodo}</td>
                  <td className="px-6 py-3 text-right font-mono">{formatCurrency(item.valor)}</td>
                  <td className={`px-6 py-3 text-right ${item.positivo === true ? 'text-green-600' : item.positivo === false ? 'text-red-500' : 'text-slate-400'}`}>
                    {item.variacion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Projected Sales */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-primary/5">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">online_prediction</span>
              {ui_labels?.forecast_title || 'Proyección (3 meses)'}
            </h3>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">{ui_labels?.forecast_badge || 'IA Model'}</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-3">{ui_labels?.table_headers?.periodo || 'Periodo'}</th>
                <th className="px-6 py-3 text-right">{ui_labels?.table_headers?.venta_proyectada || 'Venta Proyectada (₲)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {proyeccion.map((item, idx) => (
                <tr key={idx} className={`${item.destacado ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'} transition-colors`}>
                  <td className={`px-6 py-5 ${item.destacado ? 'font-bold text-primary' : 'font-medium'}`}>{item.periodo}</td>
                  <td className={`px-6 py-5 text-right font-mono ${item.destacado ? 'text-primary font-bold' : ''}`}>
                    {formatCurrency(item.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700 italic">
            {ui_labels?.footer_note || '* Proyecciones estimadas.'}
          </div>
        </div>
      </div>

      {/* Seasonality Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            {ui_labels?.seasonality_title || 'Análisis de Estacionalidad'}
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{ui_labels?.peaks_label || 'Picos de Demanda'}</p>
              <div className="flex gap-3">
                {estacionalidad.picos.map((pico, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800/50">
                    <span className="font-bold">{pico.mes}</span>
                    <span className="text-xs opacity-75">{pico.descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{ui_labels?.valleys_label || 'Valles de Demanda'}</p>
              <div className="flex gap-3">
                {estacionalidad.valles.map((valle, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg border border-orange-200 dark:border-orange-800/50">
                    <span className="font-bold">{valle.mes}</span>
                    <span className="text-xs opacity-75">{valle.descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{ui_labels?.factors_label || 'Factores Estacionales por Mes'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {estacionalidad.factores.map((factor, idx) => (
              <div key={idx} className={`p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700 text-center ${factor.tipo === 'destacado' ? 'ring-2 ring-primary/20 ring-offset-1' : ''}`}>
                <p className="text-xs font-bold text-slate-500 mb-1">{factor.mes}</p>
                <p className={`text-sm font-mono font-bold ${
                  factor.tipo === 'alto' || factor.tipo === 'destacado' ? 'text-green-500' :
                  factor.tipo === 'bajo' ? 'text-orange-500' :
                  'text-slate-700 dark:text-slate-300'
                }`}>{factor.factor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PronosticoVentas;
