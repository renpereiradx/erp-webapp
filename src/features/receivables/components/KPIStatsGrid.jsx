import React from 'react';
import { TrendingUp, Clock, Calendar } from 'lucide-react';

const KPIStatsGrid = ({ metrics = {} }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Total Outstanding */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm transition-all hover:shadow-md min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] truncate">Saldo Pendiente Total</p>
        <p className="text-lg font-black text-[#111418] dark:text-white mt-2 leading-none truncate" title={metrics.outstanding}>
          {metrics.outstanding || '$124,500'}
        </p>
        <div className="flex items-center gap-1 mt-3 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full w-fit max-w-full">
          <TrendingUp size={10} className="shrink-0" />
          <span className="truncate">+12% vs mes anterior</span>
        </div>
      </div>

      {/* Card 2: Credit Limit */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm transition-all hover:shadow-md min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] truncate">Límite de Crédito</p>
        <p className="text-lg font-black text-[#111418] dark:text-white mt-2 leading-none truncate" title={metrics.limit}>
          {metrics.limit || '$150,000'}
        </p>
        <div className="mt-4 w-full bg-[#f0f2f4] dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${metrics.utilization || 83}%` }}></div>
        </div>
        <p className="text-[9px] font-bold text-gray-400 mt-2 text-right uppercase tracking-widest">{metrics.utilization || 83}% Utilizado</p>
      </div>

      {/* Card 3: Avg Days to Pay */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm transition-all hover:shadow-md min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] truncate">Prom. Días de Pago</p>
        <p className="text-lg font-black text-[#111418] dark:text-white mt-2 leading-none truncate">
          {metrics.avgDays || '45 Días'}
        </p>
        <div className="flex items-center gap-1 mt-3 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full w-fit max-w-full">
          <Clock size={10} className="shrink-0" />
          <span className="truncate">Prom. Industria: 30</span>
        </div>
      </div>

      {/* Card 4: Last Payment */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm transition-all hover:shadow-md min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] truncate">Último Pago</p>
        <p className="text-lg font-black text-[#111418] dark:text-white mt-2 leading-none truncate" title={metrics.lastPayment}>
          {metrics.lastPayment || '$15,200'}
        </p>
        <p className="text-[10px] font-bold text-gray-400 mt-3 flex items-center gap-1.5 uppercase tracking-widest truncate">
          <Calendar size={10} className="shrink-0" /> Recibido: Hace 2 días
        </p>
      </div>
    </div>
  );
};

export default KPIStatsGrid;