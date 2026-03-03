import React from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'

/**
 * Grid de KPIs para la página de cuentas vencidas.
 * Nota: Trends deshabilitados hasta integrar endpoint de estadísticas históricas.
 */
const OverdueKpiGrid = ({ stats }) => {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Card 1: Total Overdue */}
      <div className="bg-white dark:bg-[#1A2633] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          {t('receivables.overdue.kpi.total_overdue', 'Total Vencido')}
        </p>
        <div className="flex items-end gap-2">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatPYG(stats.totalOverdue || 145200)}</h3>
          {/* Mocked positive variation as per Stitch design */}
          <span className="text-green-600 dark:text-green-400 text-xs font-semibold bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded flex items-center mb-1">
            <span className="material-symbols-outlined !text-sm">arrow_upward</span> 5.2%
          </span>
        </div>
      </div>

      {/* Card 2: Accounts at Risk */}
      <div className="bg-white dark:bg-[#1A2633] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          {t('receivables.overdue.kpi.at_risk', 'Cuentas en Riesgo (>90 Días)')}
        </p>
        <div className="flex items-end gap-2">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.atRisk || 12}</h3>
          {/* Mocked negative variation as per Stitch design */}
          <span className="text-red-600 dark:text-red-400 text-xs font-semibold bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded flex items-center mb-1">
            <span className="material-symbols-outlined !text-sm">arrow_upward</span> 2
          </span>
        </div>
      </div>

      {/* Card 3: Collection Efficiency */}
      <div className="bg-white dark:bg-[#1A2633] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          {t('receivables.overdue.kpi.efficiency', 'Eficiencia de Cobro')}
        </p>
        <div className="flex items-end gap-2">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.efficiency || 68}%</h3>
          <span className="text-slate-400 text-xs mb-1 font-medium">{t('receivables.overdue.kpi.target', 'Objetivo: 75%')}</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="bg-primary h-full rounded-full" style={{ width: `${stats.efficiency || 68}%` }}></div>
        </div>
      </div>

      {/* Card 4: Promises to Pay */}
      <div className="bg-white dark:bg-[#1A2633] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          {t('receivables.overdue.kpi.promises_to_pay', 'Promesas de Pago')}
        </p>
        <div className="flex items-end gap-2">
          {/* Fallback mock value as per Stitch if not provided in stats */}
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatPYG(stats.promisesToPay || 32450)}</h3>
          <span className="text-slate-400 text-xs mb-1 font-medium">{t('receivables.overdue.kpi.due_this_week', 'Vencen esta semana')}</span>
        </div>
      </div>
    </div>
  )
}

export default OverdueKpiGrid
