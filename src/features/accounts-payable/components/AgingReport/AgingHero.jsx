import React from 'react';

/**
 * Hero Section: Full-width Stacked Bar for Global Debt Distribution.
 * 100% LITERAL STITCH REPRODUCTION
 */
const AgingHero = ({ summary }) => {
  if (!summary) return null;

  return (
    <section className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">Distribución Global por Vencimiento</h2>
          <p className="text-sm text-slate-500">Visualización del flujo de caja comprometido y deuda vencida.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 font-medium">Deuda Total Consolidada</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-white">${summary.totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="relative w-full h-16 flex rounded-lg overflow-hidden mb-6">
        <div className="group relative bg-[#28a745] h-full flex items-center justify-center transition-all cursor-pointer hover:opacity-90" style={{ width: '55%' }}>
          <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 px-2 py-1 rounded">Corriente: $2.4M (55%)</span>
          <span className="text-white font-bold text-sm">Corriente (55%)</span>
        </div>
        <div className="group relative bg-[#ffc107] h-full flex items-center justify-center transition-all cursor-pointer hover:opacity-90" style={{ width: '20%' }}>
          <span className="text-slate-900 text-xs font-bold opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white px-2 py-1 rounded">31-60 d: $857k (20%)</span>
          <span className="text-slate-900 font-bold text-sm">31-60 d (20%)</span>
        </div>
        <div className="group relative bg-[#fd7e14] h-full flex items-center justify-center transition-all cursor-pointer hover:opacity-90" style={{ width: '15%' }}>
          <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 px-2 py-1 rounded">61-90 d: $642k (15%)</span>
          <span className="text-white font-bold text-sm">61-90 d (15%)</span>
        </div>
        <div className="group relative bg-[#dc3545] h-full flex items-center justify-center transition-all cursor-pointer hover:opacity-90" style={{ width: '10%' }}>
          <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 px-2 py-1 rounded">+90 d: $428k (10%)</span>
          <span className="text-white font-bold text-sm">+90 d (10%)</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div className="w-3 h-3 rounded-full bg-[#28a745]"></div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Corriente (0-30 d)</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">$2,356,816.25</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div className="w-3 h-3 rounded-full bg-[#ffc107]"></div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Vencido (31-60 d)</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">$857,024.09</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div className="w-3 h-3 rounded-full bg-[#fd7e14]"></div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Vencido (61-90 d)</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">$642,768.07</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div className="w-3 h-3 rounded-full bg-[#dc3545]"></div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Crítico (+90 d)</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">$428,512.04</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgingHero;
