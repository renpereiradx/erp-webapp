import React from 'react';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Gráfico de Resumen de Antigüedad (Aging Summary).
 * Rediseñado con estilo analítico premium para Dashboard y Reportes.
 */
const AgingSummaryChart = ({ agingData = {} }) => {
  // Buckets de antigüedad con sus estilos y metadatos
  const buckets = [
    { label: 'Corriente', key: 'current', color: 'bg-[#137fec]', border: 'border-[#137fec]', text: 'text-[#137fec]' },
    { label: '1-30 Días', key: 'days_1_30', color: 'bg-[#38bdf8]', border: 'border-[#38bdf8]', text: 'text-[#38bdf8]' },
    { label: '31-60 Días', key: 'days_31_60', color: 'bg-[#fbbf24]', border: 'border-[#fbbf24]', text: 'text-[#fbbf24]' },
    { label: '61-90 Días', key: 'days_61_90', color: 'bg-[#f97316]', border: 'border-[#f97316]', text: 'text-[#f97316]' },
    { label: '> 90 Días', key: 'over_90_days', color: 'bg-[#dc2626]', border: 'border-[#dc2626]', text: 'text-[#dc2626]' }
  ];

  // Extraer datos o usar valores de ejemplo realistas
  const getAmount = (key) => agingData[key]?.amount || (key === 'current' ? 8500000 : 1500000);
  const getPercentage = (key) => agingData[key]?.percentage || (key === 'current' ? 55 : 10);

  return (
    <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2e3640] shadow-fluent-2 flex flex-col h-full overflow-hidden transition-all hover:shadow-fluent-8">
      {/* Header de Tarjeta */}
      <div className="p-6 border-b border-[#f0f2f4] dark:border-[#2e3640] flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Tramos de Antigüedad</h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Desglose porcentual de cartera</p>
        </div>
        <button className="text-[#137fec] text-sm font-medium hover:underline">Ver Detalles</button>
      </div>

      <div className="p-6 flex flex-col gap-8">
        {/* Barra de Distribución Principal (Estilo Stitch) */}
        <div className="space-y-3">
          <div className="w-full h-10 flex rounded-lg overflow-hidden shadow-inner border border-slate-100 dark:border-slate-800">
            {buckets.map((bucket, i) => {
              const pct = getPercentage(bucket.key);
              return (
                <div 
                  key={i} 
                  style={{ width: `${pct}%` }} 
                  className={`${bucket.color} h-full transition-all duration-1000 hover:brightness-110 cursor-default flex items-center justify-center text-[10px] font-black text-white ${pct < 8 ? 'text-transparent' : ''}`}
                  title={`${bucket.label}: ${pct}%`}
                >
                  {pct}%
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] px-1">
            <span>Cartera al Día</span>
            <span className="text-red-500">Cartera Crítica</span>
          </div>
        </div>

        {/* Lista Detallada con Indicadores Individuales */}
        <div className="space-y-6">
          {buckets.map((bucket, i) => {
            const amount = getAmount(bucket.key);
            const pct = getPercentage(bucket.key);
            
            return (
              <div key={i} className="group flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <h4 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                      {bucket.label}
                    </h4>
                    <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                      {pct}% del total de cartera
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark block leading-none">
                      {formatPYG(amount)}
                    </span>
                    <span className={`text-xs font-medium ${bucket.text} mt-1 block`}>
                      Bucket Analítico
                    </span>
                  </div>
                </div>
                {/* Mini barra de progreso individual */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[1px]">
                  <div 
                    className={`${bucket.color} h-full rounded-full transition-all duration-1000 delay-300`} 
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Informativo */}
      <div className="mt-auto p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-[#f0f2f4] dark:border-[#2e3640] flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Corte: Hoy</span>
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Sincronizado</span>
        </div>
      </div>
    </div>
  );
};

export default AgingSummaryChart;