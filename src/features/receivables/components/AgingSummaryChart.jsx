import React from 'react';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Gráfico de Resumen de Antigüedad (Aging Summary).
 * Rediseñado con estilo analítico premium para Dashboard y Reportes.
 */
const AgingSummaryChart = ({ agingData = {} }) => {
  // Tramos de antigüedad con sus estilos y metadatos
  const tramos = [
    { label: 'Corriente', key: 'current', color: 'bg-[#137fec]', border: 'border-[#137fec]', text: 'text-[#137fec]' },
    { label: '30-60 Días', key: 'days_30_60', color: 'bg-[#fbbf24]', border: 'border-[#fbbf24]', text: 'text-[#fbbf24]' },
    { label: '60-90 Días', key: 'days_60_90', color: 'bg-[#f97316]', border: 'border-[#f97316]', text: 'text-[#f97316]' },
    { label: '> 90 Días', key: 'over_90_days', color: 'bg-[#dc2626]', border: 'border-[#dc2626]', text: 'text-[#dc2626]' }
  ];

  // Extraer datos o usar valores por defecto (0) para evitar hardcoding
  const getAmount = (key) => agingData[key]?.amount ?? agingData[key] ?? 0;
  const getPercentage = (key) => {
    const raw = agingData[key]?.percentage ?? 0;
    return typeof raw === 'number' ? Number(raw.toFixed(2)) : raw;
  };

  return (
    <div className="bg-white dark:bg-[#1b2633] rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
      {/* Header de Tarjeta */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Tramos de Antigüedad</h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Desglose porcentual de cartera</p>
        </div>
        <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-[0.2em]">Detalles</button>
      </div>

      <div className="p-6 flex flex-col gap-8">
        {/* Barra de Distribución Principal (Estilo Stitch) */}
        <div className="space-y-3">
          <div className="w-full h-12 flex rounded-xl overflow-hidden shadow-inner border border-slate-100 dark:border-slate-800 p-1 bg-slate-50/50 dark:bg-slate-900/50">
            {tramos.map((tramo, i) => {
              const pct = getPercentage(tramo.key);
              return (
                <div 
                  key={i} 
                  style={{ width: `${pct}%` }} 
                  className={`${tramo.color} h-full transition-all duration-1000 hover:brightness-110 cursor-default flex items-center justify-center text-[10px] font-black text-white rounded-md mx-[1px] ${pct < 8 ? 'text-transparent' : ''}`}
                  title={`${tramo.label}: ${pct}%`}
                >
                  {pct}%
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
            <span>Cartera al Día</span>
            <span className="text-fluent-danger">Cartera Crítica</span>
          </div>
        </div>

        {/* Lista Detallada con Indicadores Individuales */}
        <div className="space-y-6">
          {tramos.map((tramo, i) => {
            const amount = getAmount(tramo.key);
            const pct = getPercentage(tramo.key);
            
            return (
              <div key={i} className="group flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {tramo.label}
                    </h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      {pct}% del total
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 dark:text-white block leading-none font-mono">
                      {formatPYG(amount)}
                    </span>
                  </div>
                </div>
                {/* Mini barra de progreso individual */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[1px]">
                  <div 
                    className={`${tramo.color} h-full rounded-full transition-all duration-1000 delay-300 shadow-sm`} 
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
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Corte: Hoy</span>
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Sincronizado</span>
        </div>
      </div>
    </div>
  );
};

export default AgingSummaryChart;
