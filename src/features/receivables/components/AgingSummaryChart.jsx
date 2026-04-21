import React from 'react';
import { formatPYG, formatNumber } from '@/utils/currencyUtils';

/**
 * Gráfico de Resumen de Antigüedad (Aging Summary).
 * Rediseñado con estilo analítico premium para Dashboard y Reportes.
 */
const AgingSummaryChart = ({ agingData = {} }) => {
  // Tramos de antigüedad con sus estilos y metadatos
  const tramos = [
    { label: 'Corriente', key: 'current', color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20', text: 'text-blue-500' },
    { label: '30-60 Días', key: 'days_30_60', color: 'from-amber-400 to-amber-500', shadow: 'shadow-amber-500/20', text: 'text-amber-500' },
    { label: '60-90 Días', key: 'days_60_90', color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20', text: 'text-orange-500' },
    { label: '> 90 Días', key: 'over_90_days', color: 'from-rose-500 to-rose-600', shadow: 'shadow-rose-500/20', text: 'text-rose-500' }
  ];

  // Extraer datos o usar valores por defecto (0) para evitar hardcoding
  const getAmount = (key) => agingData[key]?.amount ?? agingData[key] ?? 0;
  const getPercentage = (key) => {
    const raw = agingData[key]?.percentage ?? 0;
    return typeof raw === 'number' ? Number(raw) : 0;
  };

  return (
    <div className="bg-white dark:bg-[#1b2633] rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] flex flex-col h-full overflow-hidden transition-all hover:shadow-md font-display">
      {/* Header de Tarjeta */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Tramos de Antigüedad</h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Desglose porcentual de cartera</p>
        </div>
        <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-[0.2em]">Detalles</button>
      </div>

      <div className="p-6 flex flex-col gap-8">
        {/* Barra de Distribución Principal (Mejorada) */}
        <div className="space-y-4">
          <div className="w-full h-14 flex rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 shadow-inner">
            {tramos.map((tramo, i) => {
              const pct = getPercentage(tramo.key);
              if (pct <= 0) return null;

              return (
                <div 
                  key={i} 
                  style={{ width: `${pct}%` }} 
                  className={`relative h-full bg-gradient-to-br ${tramo.color} ${tramo.shadow} transition-all duration-1000 ease-out hover:brightness-110 cursor-pointer flex items-center justify-center rounded-xl mx-[1px] group overflow-hidden`}
                  title={`${tramo.label}: ${formatNumber(pct)}% (${formatPYG(getAmount(tramo.key))})`}
                >
                  {/* Glass effect reflection */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Label inside if there is space */}
                  {pct >= 12 && (
                    <span className="text-[10px] font-black text-white drop-shadow-sm pointer-events-none animate-in fade-in zoom-in duration-500">
                      {formatNumber(pct)}%
                    </span>
                  )}

                  {/* Enhanced Tooltip (Custom implementation via title for now, or could use a component) */}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-2">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500"></span>
              Al Día
            </span>
            <span className="flex items-center gap-1.5">
              Crítica
              <span className="size-2 rounded-full bg-rose-500"></span>
            </span>
          </div>
        </div>

        {/* Lista Detallada con Indicadores Individuales */}
        <div className="space-y-6">
          {tramos.map((tramo, i) => {
            const amount = getAmount(tramo.key);
            const pct = getPercentage(tramo.key);
            
            return (
              <div key={i} className="group flex flex-col gap-2 transition-all">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
                      {tramo.label}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {formatNumber(pct)}% de la cartera
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 dark:text-white block leading-none font-mono">
                      {formatPYG(amount)}
                    </span>
                  </div>
                </div>
                {/* Mini barra de progreso individual */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[1px] border border-slate-200/50 dark:border-slate-700/50">
                  <div 
                    className={`bg-gradient-to-r ${tramo.color} h-full rounded-full transition-all duration-1000 delay-300 shadow-sm`} 
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Informativo */}
      <div className="mt-auto p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Corte: {new Date().toLocaleDateString('es-PY')}</span>
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Sincronizado con API</span>
        </div>
      </div>
    </div>
  );
};

export default AgingSummaryChart;
