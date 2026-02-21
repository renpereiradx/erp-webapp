import React from 'react';

/**
 * Debt Trend Chart (Bar simulation).
 * 100% STITCH FIDELITY - RESPONSIVE
 */
const DebtTrendChart = ({ data }) => {
  return (
    <section className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-10 gap-4 md:gap-0">
        <div>
          <h4 className="text-base md:text-lg font-bold">Tendencia de Deuda (6 meses)</h4>
          <p className="text-xs md:text-sm text-slate-500">Relación de saldo pendiente histórico mensual</p>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#137fec]"></div>
            <span className="text-[10px] md:text-xs font-medium text-slate-600 dark:text-slate-400">Deuda Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f87171]"></div>
            <span className="text-[10px] md:text-xs font-medium text-slate-600 dark:text-slate-400">Vencido</span>
          </div>
        </div>
      </div>

      <div className="relative h-48 md:h-64 w-full flex items-end justify-between gap-2 md:gap-4 px-2 md:px-0">
        {/* Chart Vertical Axis Labels - Hidden on tiny screens */}
        <div className="absolute left-0 top-0 bottom-0 hidden sm:flex flex-col justify-between text-[8px] md:text-[10px] text-slate-400 -ml-8">
          <span>$1.5M</span>
          <span>$1.0M</span>
          <span>$500K</span>
          <span>$0</span>
        </div>

        {/* Chart Horizontal Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
          <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
          <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
          <div className="w-full border-b border-slate-200 dark:border-slate-700"></div>
        </div>

        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 md:gap-3 group">
            <div className="w-full max-w-[120px] relative h-full flex items-end">
              <div 
                className={`w-full ${item.isCurrent ? 'bg-[#137fec33]' : 'bg-[#137fec1a]'} rounded-t transition-all group-hover:opacity-80`} 
                style={{ height: `${(item.total / 1500000) * 100}%` }}
              ></div>
              <div 
                className="absolute bottom-0 w-full bg-[#f8717166] rounded-t" 
                style={{ height: `${(item.overdue / 1500000) * 100}%` }}
              ></div>
            </div>
            <span className={`text-[8px] md:text-xs font-semibold truncate ${item.isCurrent ? 'text-[#137fec]' : 'text-slate-500'}`}>
              {item.month}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DebtTrendChart;
