import React from 'react'
import { Wallet, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatPYG } from '@/utils/currencyUtils'

/**
 * Tarjetas de KPI para el reporte de antigüedad de CXC.
 * Estilo unificado con el módulo de Payables.
 */
const AgingOverviewCards = ({ stats = {} }) => {
  const cardBaseClass = "bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] p-6 rounded-2xl flex flex-col justify-between h-full overflow-hidden transition-all hover:shadow-md";

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {/* Total Receivables */}
      <div className={cardBaseClass}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">Total Cartera</p>
            <h2 className="text-xl xl:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1.5 font-mono">
              {formatPYG(stats.total_receivables || 1542000000)}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/5 shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-auto">
          <div className="bg-primary h-full w-full opacity-30" />
        </div>
      </div>

      {/* Current Portfolio */}
      <div className={`${cardBaseClass} border-l-4 border-l-emerald-500`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">Al Día (Corriente)</p>
            <h2 className="text-xl xl:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
              {formatPYG(stats.current_receivables || 1240500000)}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-900/10 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-auto">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">80.4% de efectividad</span>
        </div>
      </div>

      {/* Total Overdue */}
      <div className={`${cardBaseClass} border-l-4 border-l-fluent-danger`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">Cartera Vencida</p>
            <h2 className="text-xl xl:text-2xl font-black tracking-tight text-fluent-danger mt-1.5 font-mono">
              {formatPYG(stats.total_overdue || 301500000)}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-fluent-danger shadow-sm border border-red-100 dark:border-red-900/10 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-auto">
          <span className="flex items-center px-1.5 py-0.5 rounded-md bg-fluent-danger/10 text-fluent-danger text-[10px] font-black uppercase tracking-wider">
            <TrendingUp size={12} className="mr-0.5" /> +1.2%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">incremento mora</span>
        </div>
      </div>

      {/* Critical Overdue */}
      <div className={`${cardBaseClass} border-l-4 border-l-orange-500`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">Mora &gt; 90 Días</p>
            <h2 className="text-xl xl:text-2xl font-black tracking-tight text-orange-600 dark:text-orange-400 mt-1.5 font-mono">
              {formatPYG(stats.critical_overdue || 85200000)}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 shadow-sm border border-orange-100 dark:border-orange-900/10 shrink-0">
            <span className="material-symbols-outlined text-[20px]">priority_high</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-auto">
          <div className="bg-orange-500 h-full transition-all duration-1000 shadow-[0_0_8px_rgba(249,115,22,0.4)]" style={{ width: '28%' }} />
        </div>
      </div>
    </div>
  )
}

export default AgingOverviewCards
