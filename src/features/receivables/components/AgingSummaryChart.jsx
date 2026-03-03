import React from 'react';

/**
 * Gráfico de barra de antigüedad apilada.
 * Estilo 100% fiel al diseño de Stitch.
 */
const AgingSummaryChart = ({ agingData }) => {
  return (
    <div className="bg-white dark:bg-[#1a2632] rounded-lg border border-[#e5e7eb] dark:border-[#2e3640] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_0_2px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="p-5 pb-2 border-b border-[#f0f2f4] dark:border-[#2e3640] flex justify-between items-center">
        <h3 className="text-[#111418] dark:text-white text-lg font-bold">Desglose de Tramos de Antigüedad</h3>
        <button className="text-[#137fec] text-sm font-medium hover:underline">Ver Detalles</button>
      </div>
      <div className="p-6">
        {/* Leyenda */}
        <div className="flex flex-wrap gap-6 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#137fec]"></span>
            <span className="text-[#617589] dark:text-gray-400">Corriente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#38bdf8]"></span>
            <span className="text-[#617589] dark:text-gray-400">1-30 Días</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#fbbf24]"></span>
            <span className="text-[#617589] dark:text-gray-400">31-60 Días</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#f97316]"></span>
            <span className="text-[#617589] dark:text-gray-400">61-90 Días</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#dc2626]"></span>
            <span className="text-[#617589] dark:text-gray-400">&gt; 90 Días</span>
          </div>
        </div>
        {/* Barra Apilada */}
        <div className="relative w-full h-12 flex rounded-lg overflow-hidden cursor-pointer group">
          <div className="h-full bg-[#137fec] flex items-center justify-center text-white text-xs font-bold hover:brightness-95 transition-all w-[45%]" title="Corriente: $562,500 (45%)">
            45%
          </div>
          <div className="h-full bg-[#38bdf8] flex items-center justify-center text-white text-xs font-bold hover:brightness-95 transition-all w-[25%]" title="1-30 Días: $312,500 (25%)">
            25%
          </div>
          <div className="h-full bg-[#fbbf24] flex items-center justify-center text-white text-xs font-bold hover:brightness-95 transition-all w-[15%]" title="31-60 Días: $187,500 (15%)">
            15%
          </div>
          <div className="h-full bg-[#f97316] flex items-center justify-center text-white text-xs font-bold hover:brightness-95 transition-all w-[10%]" title="61-90 Días: $125,000 (10%)">
            10%
          </div>
          <div className="h-full bg-[#dc2626] flex items-center justify-center text-white text-xs font-bold hover:brightness-95 transition-all w-[5%]" title=">90 Días: $62,500 (5%)">
            5%
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-[#617589] dark:text-gray-500 font-mono">
          <span className="w-[45%]">$562,500</span>
          <span className="w-[25%]">$312,500</span>
          <span className="w-[15%]">$187,500</span>
          <span className="w-[10%]">$125,000</span>
          <span className="w-[5%] text-right text-red-600 font-bold">$62,500</span>
        </div>
      </div>
    </div>
  );
};

export default AgingSummaryChart;
