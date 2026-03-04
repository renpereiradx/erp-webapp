import React from 'react';
import { Landmark, Clock, PieChart } from 'lucide-react';

/**
 * Tarjetas de KPIs para el reporte de antigüedad.
 * Estilo 100% fiel al diseño de Stitch (Fluent 2).
 */
const AgingOverviewCards = ({ stats }) => {
  const pendingAmount = stats ? (stats.total_billed || 0) - (stats.total_collected || 0) : 1250000;
  const collectionRate = stats?.collection_rate || 94;
  const dso = stats?.average_dso || 42; // average_dso no está oficializado en swagger pero si lo mandan lo tomamos

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Pendiente */}
      <div className="bg-white dark:bg-[#1a2632] p-5 rounded-lg border border-[#e5e7eb] dark:border-[#2e3640] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_0_2px_rgba(0,0,0,0.06)] flex flex-col gap-1 transition-all hover:shadow-[0_4px_8px_rgba(0,0,0,0.08),0_0_2px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-start">
          <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">Total Pendiente</p>
          <span className="material-symbols-outlined text-[#617589] dark:text-gray-500">account_balance</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-[#111418] dark:text-white text-3xl font-bold tracking-tight">
            ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </p>
          <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[14px] mr-0.5 font-bold">trending_up</span>
            2.5%
          </span>
        </div>
        <p className="text-xs text-[#617589] dark:text-gray-500 mt-2">Vs. 30 días anteriores</p>
      </div>

      {/* DSO */}
      <div className="bg-white dark:bg-[#1a2632] p-5 rounded-lg border border-[#e5e7eb] dark:border-[#2e3640] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_0_2px_rgba(0,0,0,0.06)] flex flex-col gap-1 transition-all hover:shadow-[0_4px_8px_rgba(0,0,0,0.08),0_0_2px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-start">
          <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">DSO (Días de Venta Pendientes)</p>
          <span className="material-symbols-outlined text-[#617589] dark:text-gray-500">schedule</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-[#111418] dark:text-white text-3xl font-bold tracking-tight">{Math.round(dso)} Días</p>
          <span className="inline-flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[14px] mr-0.5 font-bold">trending_down</span>
            1.2 días
          </span>
        </div>
        <p className="text-xs text-[#617589] dark:text-gray-500 mt-2">Vs. promedio industria de 45 días</p>
      </div>

      {/* Eficiencia de Cobro */}
      <div className="bg-white dark:bg-[#1a2632] p-5 rounded-lg border border-[#e5e7eb] dark:border-[#2e3640] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_0_2px_rgba(0,0,0,0.06)] flex flex-col gap-1 transition-all hover:shadow-[0_4px_8px_rgba(0,0,0,0.08),0_0_2px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-start">
          <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">Eficiencia de Cobranza</p>
          <span className="material-symbols-outlined text-[#617589] dark:text-gray-500">pie_chart</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-[#111418] dark:text-white text-3xl font-bold tracking-tight">
            {(collectionRate).toFixed(1)}%
          </p>
          <span className="inline-flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[14px] mr-0.5 font-bold">trending_up</span>
            0.5%
          </span>
        </div>
        <p className="text-xs text-[#617589] dark:text-gray-500 mt-2">Índice de Cobranza (CEI)</p>
      </div>
    </div>
  );
};

export default AgingOverviewCards;
