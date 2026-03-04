import React from 'react';
import { TrendingUp, Clock, Calendar } from 'lucide-react';

const KPIStatsGrid = ({ metrics = {} }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Total Outstanding */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm transition-all hover:shadow-md min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] truncate">Saldo Pendiente Total</p>
        <p className="text-lg font-black text-[#111418] dark:text-white mt-2 leading-none truncate" title={metrics.outstanding}>
          {metrics.outstanding || 'No disp.'}
        </p>
        <div className="flex items-center gap-1 mt-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full w-fit max-w-full">
          <TrendingUp size={10} className="shrink-0" />
          <span className="truncate">Sin variacion mensual</span>
        </div>
      </div>

      {/* Card 2: Credit Limit */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm transition-all hover:shadow-md min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] truncate">Límite de Crédito</p>
        <p className="text-lg font-black text-[#111418] dark:text-white mt-2 leading-none truncate" title={metrics.limit}>
          {metrics.limit || 'No disp.'}
        </p>
        <div className="mt-4 w-full bg-[#f0f2f4] dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${metrics.limit ? (metrics.utilization || 0) : 0}%` }}></div>
        </div>
        <p className="text-[9px] font-bold text-gray-400 mt-2 text-right uppercase tracking-widest">
          {metrics.limit ? `${metrics.utilization || 0}% Utilizado` : 'Crédito no definido'}
        </p>
      </div>

      {/* Card 3: Avg Days to Pay */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm transition-all hover:shadow-md min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] truncate">Prom. Días de Pago</p>
        <p className="text-lg font-black text-[#111418] dark:text-white mt-2 leading-none truncate">
          {metrics.avgDays || 'No disp.'}
        </p>
        <div className="flex items-center gap-1 mt-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full w-fit max-w-full">
          <Clock size={10} className="shrink-0" />
          <span className="truncate">Ciclo de pago</span>
        </div>
      </div>

      {/* Card 4: Last Payment */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm transition-all hover:shadow-md min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] truncate">Último Pago</p>
        <p className="text-lg font-black text-[#111418] dark:text-white mt-2 leading-none truncate" title={metrics.lastPayment}>
          {metrics.lastPayment || 'Sin pagos'}
        </p>
        <p className="text-[10px] font-bold text-gray-400 mt-3 flex items-center gap-1.5 uppercase tracking-widest truncate">
          <Calendar size={10} className="shrink-0" /> {metrics.lastPayment ? 'Pago reciente' : 'Historial vacío'}
        </p>
      </div>
    </div>
  );
};

export default KPIStatsGrid;