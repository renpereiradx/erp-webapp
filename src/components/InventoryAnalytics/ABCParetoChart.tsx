import React from 'react';
import { ABCProduct } from '../../data/mockInventoryABCData';

export interface ABCParetoChartProps {
  classAProducts: ABCProduct[];
  classAPct?: number;
  classBPct?: number;
  classCPct?: number;
}

export const ABCParetoChart: React.FC<ABCParetoChartProps> = ({ 
  classAProducts,
  classAPct = 80,
  classBPct = 15,
  classCPct = 5
}) => {
  // Calculamos alturas de barras basadas en porcentajes reales (max 100%)
  // Usamos el % de valor que representa cada clase
  const hA = Math.min(Math.max(classAPct, 10), 95); // Clase A suele ser la más alta
  const hB = Math.min(Math.max(classBPct * 2, 5), 80); // Escala visual para que se note la diferencia
  const hC = Math.min(Math.max(classCPct * 3, 5), 40); // Clase C suele ser la más baja

  // Puntos de la curva de Pareto (acumulada)
  const p1 = classAPct;
  const p2 = Math.min(classAPct + classBPct, 95);
  const p3 = Math.min(classAPct + classBPct + classCPct, 100);

  return (
    <div className="flex flex-col gap-6 bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm font-display">
      <div className="flex items-center justify-between">
        <h2 className="text-slate-900 dark:text-white text-xl font-bold uppercase tracking-tight">Desglose ABC de Valor</h2>
        <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold rounded uppercase tracking-tighter font-mono">Pareto Real</span>
      </div>
      
      {/* Pareto Chart Dinámico */}
      <div className="h-48 w-full flex items-end gap-2 px-2 border-b border-l border-slate-200 dark:border-slate-700 relative">
        <div className="w-full h-full absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-9xl">bar_chart</span>
        </div>
        
        {/* Barras dinámicas */}
        <div 
          className="flex-1 bg-primary/90 rounded-t relative group cursor-pointer hover:bg-primary transition-all shadow-sm"
          style={{ height: `${hA}%` }}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono z-10 shadow-xl">
            Clase A: {Number(classAPct).toFixed(1)}%
          </div>
        </div>
        <div 
          className="flex-1 bg-primary/60 rounded-t relative group cursor-pointer hover:bg-primary/70 transition-all shadow-sm"
          style={{ height: `${hB}%` }}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono z-10 shadow-xl">
            Clase B: {Number(classBPct).toFixed(1)}%
          </div>
        </div>
        <div 
          className="flex-1 bg-primary/30 rounded-t relative group cursor-pointer hover:bg-primary/40 transition-all shadow-sm"
          style={{ height: `${hC}%` }}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono z-10 shadow-xl">
            Clase C: {Number(classCPct).toFixed(1)}%
          </div>
        </div>
        
        {/* Line Chart Overlay Dinámico (SVG) */}
        <svg className="absolute bottom-0 left-0 w-full h-full pointer-events-none overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path 
            d={`M 0,100 L 16.6,${100 - p1} L 50,${100 - p2} L 83.3,${100 - p3} L 100,0`} 
            fill="none" 
            stroke="#137fec" 
            strokeWidth="3" 
            vectorEffect="non-scaling-stroke"
            className="drop-shadow-sm"
          ></path>
          <circle cx="16.6" cy={100 - p1} fill="#137fec" r="4" className="filter drop-shadow-sm"></circle>
          <circle cx="50" cy={100 - p2} fill="#137fec" r="4" className="filter drop-shadow-sm"></circle>
          <circle cx="83.3" cy={100 - p3} fill="#137fec" r="4" className="filter drop-shadow-sm"></circle>
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
          {classAProducts?.map((product) => (
            <div key={product.id || (product as any).product_id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 dark:text-white">{product.name || (product as any).product_name}</span>
                <span className="text-xs text-slate-500">Representa el <span className="font-mono">{Number(product.percentage || (product as any).value_pct || 0).toFixed(2)}%</span> del valor total</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-primary font-mono">Gs. {(product.value || (product as any).stock_value || 0).toLocaleString('es-PY')}</span>
              </div>
            </div>
          ))}
          {(!classAProducts || classAProducts.length === 0) && (
            <p className="text-sm text-slate-500 text-center py-4 italic">No hay productos Clase A registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
};
