import React from 'react';

export interface StockStatusItem {
  label: string;
  percentage: number;
  count: number;
  colorClass: string;
  strokeClass: string;
}

export interface StockStatusChartProps {
  items: StockStatusItem[];
  totalLabel?: string;
  totalValue?: string;
}

export const StockStatusChart: React.FC<StockStatusChartProps> = ({ 
  items, 
  totalLabel = "Inventario",
  totalValue = "100%" 
}) => {
  // Calculate cumulative offsets for the donut chart
  let cumulativePercentage = 0;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 h-full font-display">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold uppercase tracking-tight">Estado del Stock</h3>
        <button className="text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative size-48 flex-shrink-0">
          <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
            {items.map((item, index) => {
              const dashArray = `${item.percentage}, 100`;
              const dashOffset = -cumulativePercentage;
              cumulativePercentage += item.percentage;
              
              return (
                <circle 
                  key={index}
                  className={item.strokeClass} 
                  cx="18" cy="18" fill="none" r="16" 
                  strokeDasharray={dashArray} 
                  strokeDashoffset={dashOffset} 
                  strokeWidth="4" 
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black font-mono">{totalValue}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">{totalLabel}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full">
          {items.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`size-3 rounded-full ${item.colorClass}`}></div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
              </div>
              <p className="text-lg font-bold font-mono">
                {Number(item.percentage).toFixed(2)}% 
                <span className="text-xs font-normal text-slate-400 font-display"> ({item.count} items)</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
