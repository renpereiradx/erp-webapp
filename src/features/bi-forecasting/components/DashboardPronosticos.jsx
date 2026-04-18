import React from 'react';
import { useBIForecasting, formatCurrency, formatNumber } from '../hooks/useBIForecasting';
import BIForecastingNav from './BIForecastingNav';

const DashboardPronosticos = () => {
  const { data, loading, error, refetch } = useBIForecasting('dashboard');

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Cargando dashboard...</div>;
  if (error) return <div className="p-8 text-center font-bold text-red-500">Error: {error}</div>;
  if (!data) return null;

  const { kpis, insights, recomendaciones } = data;

  return (
    <div className="flex flex-col gap-8 max-w-[1280px] mx-auto w-full font-display">
      <BIForecastingNav active="dashboard" />
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard de Pronósticos</h1>
          <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <p className="text-sm font-medium">{data.updated_text || 'Actualizado hoy'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar
          </button>
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ventas Proyectadas</p>
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(kpis.ventas_proyectadas.valor)}</h3>
          <div className={`flex items-center gap-1 mt-2 text-sm font-bold ${kpis.ventas_proyectadas.estado === 'UP' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            <span className="material-symbols-outlined text-sm">{kpis.ventas_proyectadas.estado === 'UP' ? 'trending_up' : 'trending_down'}</span>
            <span>{kpis.ventas_proyectadas.variacion > 0 ? '+' : ''}{kpis.ventas_proyectadas.variacion}%</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">{kpis.ventas_proyectadas.label || 'vs. mes anterior'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ingresos Anuales</p>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
              <span className="material-symbols-outlined text-xl">show_chart</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(kpis.ingresos_anuales.valor)}</h3>
          <div className={`flex items-center gap-1 mt-2 text-sm font-bold ${kpis.ingresos_anuales.estado === 'UP' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            <span className="material-symbols-outlined text-sm">{kpis.ingresos_anuales.estado === 'UP' ? 'trending_up' : 'trending_down'}</span>
            <span>{kpis.ingresos_anuales.variacion > 0 ? '+' : ''}{kpis.ingresos_anuales.variacion}%</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">{kpis.ingresos_anuales.label || 'objetivo anual'}</span>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-950/20 p-5 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-red-700 dark:text-red-400 text-sm font-medium">Riesgo de Inventario</p>
            <div className="bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-400 p-2 rounded-lg">
              <span className="material-symbols-outlined text-xl">warning</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-red-800 dark:text-red-300">{kpis.riesgo_inventario.valor} Productos</h3>
          <div className="flex items-center gap-1 mt-2 text-red-600 dark:text-red-400 text-sm font-bold">
            <span className="material-symbols-outlined text-sm">{kpis.riesgo_inventario.estado === 'UP' ? 'trending_up' : 'trending_down'}</span>
            <span>{kpis.riesgo_inventario.variacion > 0 ? '+' : ''}{kpis.riesgo_inventario.variacion}%</span>
            <span className="text-red-400 dark:text-red-500 font-normal ml-1">{kpis.riesgo_inventario.label || 'stock crítico'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Demanda Total</p>
            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-2 rounded-lg">
              <span className="material-symbols-outlined text-xl">package_2</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatNumber(kpis.demanda_total.valor)} Unidades</h3>
          <div className={`flex items-center gap-1 mt-2 text-sm font-bold ${kpis.demanda_total.estado === 'UP' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            <span className="material-symbols-outlined text-sm">{kpis.demanda_total.estado === 'UP' ? 'trending_up' : 'trending_down'}</span>
            <span>{kpis.demanda_total.variacion > 0 ? '+' : ''}{kpis.demanda_total.variacion}%</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">{kpis.demanda_total.label || 'proyectado'}</span>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lightbulb</span>
            Insights de Negocio
          </h2>
          <button className="text-primary text-sm font-bold hover:underline">Ver todos</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight) => (
            <div key={insight.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex gap-4 hover:border-primary/40 transition-colors cursor-pointer group">
              <div className="w-32 h-32 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="material-symbols-outlined text-4xl text-primary group-hover:scale-110 transition-transform">{insight.icono}</span>
                </div>
              </div>
              <div className="flex flex-col justify-center flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={insight.tipo === 'ALTO_IMPACTO' ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider" : "bg-primary/10 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider"}>
                    {insight.impacto}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-sm">north</span> {insight.variacion}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">{insight.titulo}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{insight.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recomendaciones Section */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
            Estrategias Recomendadas
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recomendaciones.map((rec) => (
            <div key={rec.id} className={`bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm border-t-4 ${rec.color === 'red' ? 'border-t-red-500' : rec.color === 'primary' ? 'border-t-primary' : 'border-t-emerald-500'}`}>
              <span className={`${rec.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : rec.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'} text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider mb-3 inline-block`}>
                Prioridad {rec.prioridad}
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">{rec.titulo}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-4">Acción: <span className="text-primary">{rec.accion}</span></p>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Impacto Potencial</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{rec.impacto_potencial}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPronosticos;
