import React from 'react';

/**
 * KPI Grid for Supplier Debt.
 * 100% STITCH FIDELITY - RESPONSIVE
 */
const DebtKpis = ({ stats }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in">
      {/* Total Pendiente */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Pendiente</p>
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">${stats.totalPending.toLocaleString()}</h3>
          <span className="text-[#137fec] bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded text-[10px] font-medium">+12%</span>
        </div>
        <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#137fec] h-full rounded-full" style={{ width: '75%' }}></div>
        </div>
      </div>

      {/* Total Vencido */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Vencido</p>
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl md:text-3xl font-bold text-[#dc3545]">${stats.totalOverdue.toLocaleString()}</h3>
          <span className="material-icons-round text-[#dc3545] text-xl">warning</span>
        </div>
        <p className="mt-4 text-[10px] text-slate-400">14 facturas superan la fecha límite</p>
      </div>

      {/* DPO */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">DPO (Días Pago)</p>
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">42 Días</h3>
          <span className="text-[#28a745] bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded text-[10px] font-medium">-3 d</span>
        </div>
        <p className="mt-4 text-[10px] text-slate-400">Sector: 45 días</p>
      </div>

      {/* Share % */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Share of Payables %</p>
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.shareOfPayables}%</h3>
          <span className="material-icons-round text-slate-300 text-xl">pie_chart</span>
        </div>
        <p className="mt-4 text-[10px] text-slate-400">Segundo acreedor más importante</p>
      </div>
    </section>
  );
};

export default DebtKpis;
