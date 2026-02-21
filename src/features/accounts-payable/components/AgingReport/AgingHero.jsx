import React from 'react';

/**
 * Hero Section: Full-width Stacked Bar for Global Debt Distribution.
 * 100% LITERAL STITCH REPRODUCTION - RESPONSIVE
 */
const AgingHero = ({ summary }) => {
  if (!summary) return null;

  return (
    <section className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4 md:gap-0">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">Distribución Global por Vencimiento</h2>
          <p className="text-xs md:text-sm text-slate-500">Flujo de caja comprometido y deuda vencida.</p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-xs md:text-sm text-slate-500 font-medium">Deuda Total Consolidada</p>
          <p className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white">${summary.totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="relative w-full h-12 md:h-16 flex rounded-lg overflow-hidden mb-6">
        {summary.distribution.map((item, idx) => (
          <div 
            key={idx}
            className={`group relative ${item.color} h-full flex items-center justify-center transition-all cursor-pointer hover:opacity-90`} 
            style={{ width: `${item.percentage}%` }}
          >
            <span className="text-white text-[10px] md:text-xs font-bold opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 px-2 py-1 rounded whitespace-nowrap z-10">
              {item.label}: ${item.amount.toLocaleString()} ({item.percentage}%)
            </span>
            <span className="text-white font-bold text-[10px] md:text-sm truncate px-1">
              {item.percentage > 10 ? (item.percentage === 55 ? `Corriente` : `${item.percentage}%`) : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {summary.distribution.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color}`}></div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter truncate">{item.label}</p>
              <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white truncate">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AgingHero;
