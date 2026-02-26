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
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
      {/* Total Vencido */}
      <div className='bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group'>
        <p className='text-xs font-black uppercase tracking-widest text-text-secondary opacity-70 mb-4'>
          {t('receivables.overdue.kpi.total_overdue')}
        </p>
        <div className='flex items-end gap-2'>
          <h3 className='text-2xl font-black text-error tracking-tight'>{formatPYG(stats.totalOverdue)}</h3>
        </div>
      </div>

      {/* Cuentas en Riesgo */}
      <div className='bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group'>
        <p className='text-xs font-black uppercase tracking-widest text-text-secondary opacity-70 mb-4'>
          {t('receivables.overdue.kpi.at_risk')}
        </p>
        <div className='flex items-end gap-2'>
          <h3 className='text-2xl font-black text-text-main tracking-tight'>{stats.atRisk}</h3>
          <span className='text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1 opacity-60'>
            cuentas críticas
          </span>
        </div>
      </div>

      {/* Eficiencia de Cobro */}
      <div className='bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group'>
        <p className='text-xs font-black uppercase tracking-widest text-text-secondary opacity-70 mb-4'>
          {t('receivables.overdue.kpi.efficiency')}
        </p>
        <div className='flex items-end gap-2'>
          <h3 className='text-2xl font-black text-success tracking-tight'>{stats.efficiency}%</h3>
          <span className='text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1 opacity-60'>
            Objetivo: 75%
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
          <div className="h-full bg-success rounded-full transition-all duration-1000" style={{ width: `${stats.efficiency}%` }}></div>
        </div>
      </div>

      {/* Total de Cuentas */}
      <div className='bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group'>
        <p className='text-xs font-black uppercase tracking-widest text-text-secondary opacity-70 mb-4'>Total Cuentas</p>
        <div className='flex items-end gap-2'>
          <h3 className='text-2xl font-black text-text-main tracking-tight'>{stats.totalAccounts || 0}</h3>
          <span className='text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1 opacity-60'>
            en seguimiento
          </span>
        </div>
      </div>
    </div>
  )
}

export default OverdueKpiGrid
