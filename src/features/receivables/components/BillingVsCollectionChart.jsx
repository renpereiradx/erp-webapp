import React from 'react';

/**
 * Gráfico de comparación entre facturación y cobranza.
 * Estilo 100% fiel al diseño de Stitch.
 */
const BillingVsCollectionChart = ({ trendData }) => {
  const safeData = Array.isArray(trendData) && trendData.length > 0 ? trendData : [];
  
  // Calculate max to make bars proportional (assuming 100% height = max value * 1.1 for some padding)
  const maxBilled = safeData.reduce((max, d) => Math.max(max, d.billed || 0), 1);
  const scale = 100 / (maxBilled * 1.1);

  const months = safeData.map((d, index) => ({
    name: d.date || `P${index+1}`,
    billed: (d.billed || 0) * scale,
    collected: (d.collected || 0) * scale,
    active: index === safeData.length - 1
  }));

  return (
    <div className="w-full xl:w-[400px] bg-white dark:bg-[#1a2632] rounded-lg border border-[#e5e7eb] dark:border-[#2e3640] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_0_2px_rgba(0,0,0,0.06)] flex flex-col transition-all hover:shadow-[0_4px_8px_rgba(0,0,0,0.08),0_0_2px_rgba(0,0,0,0.1)]">
      <div className="p-5 border-b border-[#f0f2f4] dark:border-[#2e3640]">
        <h3 className="text-[#111418] dark:text-white text-lg font-bold">Facturación vs. Cobranzas</h3>
        <p className="text-xs text-[#617589] mt-1">Tendencia de los últimos 6 meses</p>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-end">
        <div className="relative h-64 w-full flex items-end justify-between gap-2 md:gap-4 px-2">
          {/* Líneas de cuadrícula */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full h-px bg-gray-100 dark:bg-gray-700 border-t border-dashed border-gray-200 dark:border-gray-600"></div>
            ))}
          </div>
          
          {/* Barras */}
          {months.map((m, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-1 flex-1 group">
              <div className="w-full flex justify-center items-end gap-1 h-[200px]">
                {/* Facturado (Gris) */}
                <div 
                  className="w-3 bg-gray-300 dark:bg-gray-600 rounded-t-sm transition-all group-hover:brightness-95" 
                  style={{ height: `${m.billed}%` }}
                ></div>
                {/* Cobrado (Primario) */}
                <div 
                  className="w-3 bg-[#137fec] rounded-t-sm transition-all group-hover:brightness-110" 
                  style={{ height: `${m.collected}%` }}
                ></div>
              </div>
              <span className={`text-[10px] ${m.active ? 'text-[#111418] dark:text-white font-bold' : 'text-[#617589] font-medium'}`}>
                {m.name}
              </span>
            </div>
          ))}
        </div>
        
        {/* Leyenda */}
        <div className="flex justify-center gap-4 mt-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></span>
            <span className="text-xs text-[#617589] dark:text-gray-400 font-medium">Facturado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#137fec]"></span>
            <span className="text-xs text-[#617589] dark:text-gray-400 font-medium">Cobrado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingVsCollectionChart;
