import React from 'react'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'

/**
 * Grid de tarjetas de resumen para el dashboard de CXC.
 * Pulido para coincidir con la estética de Payables.
 */
const SummaryCardsGrid = ({ summary }) => {
  const { t } = useI18n()

  const cardBaseClass = "bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] p-6 rounded-2xl flex flex-col justify-between h-full overflow-hidden transition-all hover:shadow-md";

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {/* Total Pending */}
      <div className={cardBaseClass}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">
              Total Pendiente
            </p>
            <h2 className="text-xl xl:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1.5 font-mono">
              {formatPYG(summary.totalReceivables?.amount || 1240500)}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/5 shrink-0">
            <span className="material-symbols-outlined text-[20px]">pending_actions</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-auto">
          <span className="flex items-center px-1.5 py-0.5 rounded-md bg-semantic-success/10 text-semantic-success text-[10px] font-black uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>+2.5%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">vs mes anterior</span>
        </div>
      </div>

      {/* Total Overdue */}
      <div className={`${cardBaseClass} border-l-4 border-l-semantic-danger`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">Total en Mora</p>
            <h2 className="text-xl xl:text-2xl font-black tracking-tight text-semantic-danger mt-1.5 font-mono">
              {formatPYG(summary.overdueAmount?.amount || 320000)}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-semantic-danger shadow-sm border border-red-100 dark:border-red-900/10 shrink-0">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-auto">
          <span className="flex items-center px-1.5 py-0.5 rounded-md bg-semantic-danger/10 text-semantic-danger text-[10px] font-black uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>+1.2%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">aumento de mora</span>
        </div>
      </div>

      {/* Collection Rate */}
      <div className={cardBaseClass}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">Tasa de Cobranza</p>
            <h2 className="text-xl xl:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1.5">
              {summary.collectionRate || 92}%
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 text-semantic-success shadow-sm border border-green-100 dark:border-green-900/10 shrink-0">
            <span className="material-symbols-outlined text-[20px]">percent</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-auto">
          <div className="bg-semantic-success h-full transition-all duration-1000" style={{ width: `${summary.collectionRate || 92}%` }} />
        </div>
      </div>

      {/* Avg Days (DSO) */}
      <div className={cardBaseClass}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">Días Prom. Cobro</p>
            <h2 className="text-xl xl:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1.5 font-mono">
              {Math.round(summary.avgDaysToCollect || 45)} Días
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20 text-semantic-warning shadow-sm border border-orange-100 dark:border-orange-900/10 shrink-0">
            <span className="material-symbols-outlined text-[20px]">calendar_clock</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-auto">
          <span className="flex items-center px-1.5 py-0.5 rounded-md bg-semantic-success/10 text-semantic-success text-[10px] font-black uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px] mr-0.5">arrow_downward</span>-2 días
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">mejora de DSO</span>
        </div>
      </div>
    </div>
  )
}

export default SummaryCardsGrid
