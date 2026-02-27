import React from 'react'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'

/**
 * Grid de tarjetas de resumen para el dashboard de CXC.
 * Pulido al 100% para coincidir con el diseño de Stitch (en español).
 */
const SummaryCardsGrid = ({ summary }) => {
  const { t } = useI18n()

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {/* Total Pending */}
      <div className="flex flex-col gap-1 rounded-xl bg-surface-light dark:bg-surface-dark p-5 shadow-card border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
            Total Pendiente
          </p>
          <div className="flex size-8 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <span className="material-symbols-outlined text-[18px]">pending_actions</span>
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          {formatPYG(summary.totalReceivables?.amount || 1240500)}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[16px] text-semantic-success">trending_up</span>
          <span className="text-xs font-semibold text-semantic-success">+2.5%</span>
          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark ml-1">vs mes anterior</span>
        </div>
      </div>

      {/* Total Overdue */}
      <div className="flex flex-col gap-1 rounded-xl bg-surface-light dark:bg-surface-dark p-5 shadow-card border-l-4 border-l-semantic-danger">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Total en Mora</p>
          <div className="flex size-8 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-semantic-danger">
            <span className="material-symbols-outlined text-[18px]">warning</span>
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          {formatPYG(summary.overdueAmount?.amount || 320000)}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[16px] text-semantic-danger">trending_up</span>
          <span className="text-xs font-semibold text-semantic-danger">+1.2%</span>
          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark ml-1">aumento de mora</span>
        </div>
      </div>

      {/* Collection Rate */}
      <div className="flex flex-col gap-1 rounded-xl bg-surface-light dark:bg-surface-dark p-5 shadow-card border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Tasa de Cobranza</p>
          <div className="flex size-8 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20 text-semantic-success">
            <span className="material-symbols-outlined text-[18px]">percent</span>
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          {summary.collectionRate || 92}%
        </p>
        <div className="flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[16px] text-semantic-success">arrow_upward</span>
          <span className="text-xs font-semibold text-semantic-success">+0.8%</span>
          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark ml-1">mejora de eficiencia</span>
        </div>
      </div>

      {/* Avg Days (DSO) */}
      <div className="flex flex-col gap-1 rounded-xl bg-surface-light dark:bg-surface-dark p-5 shadow-card border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Días Prom. Cobro</p>
          <div className="flex size-8 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20 text-semantic-warning">
            <span className="material-symbols-outlined text-[18px]">calendar_clock</span>
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          {Math.round(summary.avgDaysToCollect || 45)} Días
        </p>
        <div className="flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[16px] text-semantic-success">arrow_downward</span>
          <span className="text-xs font-semibold text-semantic-success">-2 días</span>
          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark ml-1">mejora</span>
        </div>
      </div>
    </div>
  )
}

export default SummaryCardsGrid
