import React from 'react';
import { ABCProduct } from '../../data/mockInventoryABCData';

export interface ABCParetoChartProps {
  classAProducts: ABCProduct[];
}

export const ABCParetoChart: React.FC<ABCParetoChartProps> = ({ classAProducts }) => {
  return (
    <div className="flex flex-col gap-6 bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm font-display">
      <div className="flex items-center justify-between">
        <h2 className="text-slate-900 dark:text-white text-xl font-bold">Desglose ABC de Valor</h2>
        <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold rounded uppercase tracking-tighter font-mono">Pareto Chart</span>
      </div>
      
      {/* Pareto Chart Placeholder */}
      <div className="h-48 w-full flex items-end gap-2 px-2 border-b border-l border-slate-200 dark:border-slate-700 relative">
        <div className="w-full h-full absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-9xl">bar_chart</span>
        </div>
        <div className="flex-1 bg-primary h-[90%] rounded-t relative group cursor-pointer hover:opacity-90 transition-opacity">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono">Clase A: 80%</div>
        </div>
        <div className="flex-1 bg-primary/60 h-[45%] rounded-t relative group cursor-pointer hover:opacity-90 transition-opacity">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono">Clase B: 15%</div>
        </div>
        <div className="flex-1 bg-primary/30 h-[15%] rounded-t relative group cursor-pointer hover:opacity-90 transition-opacity">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono">Clase C: 5%</div>
        </div>
        
        {/* Line Chart Overlay (SVG) */}
        <svg className="absolute bottom-0 left-0 w-full h-full pointer-events-none overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M 0,100 L 16.6,10 L 50,5 L 83.3,2 L 100,0" fill="none" stroke="#137fec" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
          <circle cx="16.6" cy="10" fill="#137fec" r="3"></circle>
          <circle cx="50" cy="5" fill="#137fec" r="3"></circle>
          <circle cx="83.3" cy="2" fill="#137fec" r="3"></circle>
        </svg>
      </div>
      <div className="flex justify-between text-[10px] font-bold text-slate-400 px-2 font-mono">
        <span>CLASE A</span>
        <span>CLASE B</span>
        <span>CLASE C</span>
      </div>

      {/* Focused List Clase A */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary"></span>
          Productos Top Clase A
        </h3>
        <div className="space-y-3">
          {classAProducts.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 dark:text-white">{product.name}</span>
                <span className="text-xs text-slate-500">Representa el <span className="font-mono">{product.percentage}%</span> del valor total</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-primary font-mono">Gs. {product.value.toLocaleString('es-PY')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
