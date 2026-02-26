import React from 'react'
import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'

/**
 * Grid de tarjetas de resumen para el dashboard de CXC.
 * Recibe datos transformados del endpoint GET /receivables/overview
 */
const SummaryCardsGrid = ({ summary }) => {
  const { t } = useI18n()

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
      {/* Outstanding Receivables */}
      <div className='bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group'>
        <div className='flex justify-between items-start mb-4'>
          <p className='text-xs font-black uppercase tracking-widest text-text-secondary'>
            {t('receivables.metrics.outstanding')}
          </p>
          <div className='size-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform'>
            <span className='material-symbols-outlined'>payments</span>
          </div>
        </div>
        <h3 className='text-2xl font-black text-text-main tracking-tight'>
          {formatPYG(summary.totalReceivables?.amount)}
        </h3>
        <div className='flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-widest text-success'>
          <span className='material-symbols-outlined text-[14px]'>trending_up</span>
          <span>{summary.collectionRate || 0}% Tasa de Cobranza</span>
        </div>
      </div>

      {/* Overdue Amount */}
      <div className='bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group'>
        <div className='flex justify-between items-start mb-4'>
          <p className='text-xs font-black uppercase tracking-widest text-text-secondary'>Total Vencido</p>
          <div className='size-10 rounded-lg bg-red-50 flex items-center justify-center text-error group-hover:scale-110 transition-transform'>
            <span className='material-symbols-outlined'>warning</span>
          </div>
        </div>
        <h3 className='text-2xl font-black text-error tracking-tight'>
          {formatPYG(summary.overdueAmount?.amount)}
        </h3>
        <div className='flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-widest text-error'>
          <span className='material-symbols-outlined text-[14px]'>error</span>
          <span>{summary.overdueAmount?.percentage}% del Total</span>
        </div>
      </div>

      {/* Total Count */}
      <div className='bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group'>
        <div className='flex justify-between items-start mb-4'>
          <p className='text-xs font-black uppercase tracking-widest text-text-secondary'>Cuentas Totales</p>
          <div className='size-10 rounded-lg bg-green-50 flex items-center justify-center text-success group-hover:scale-110 transition-transform'>
            <span className='material-symbols-outlined'>receipt_long</span>
          </div>
        </div>
        <h3 className='text-2xl font-black text-text-main tracking-tight'>{summary.totalCount || 0}</h3>
        <div className='flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-widest text-warning'>
          <span className='material-symbols-outlined text-[14px]'>warning</span>
          <span>{summary.overdueCount || 0} vencidas</span>
        </div>
      </div>

      {/* DSO */}
      <div className='bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group'>
        <div className='flex justify-between items-start mb-4'>
          <p className='text-xs font-black uppercase tracking-widest text-text-secondary'>Días Prom. de Cobro</p>
          <div className='size-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform'>
            <span className='material-symbols-outlined'>schedule</span>
          </div>
        </div>
        <h3 className='text-2xl font-black text-text-main tracking-tight'>
          {summary.avgDaysToCollect?.toFixed(1) || 0} días
        </h3>
        <p className='text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60 mt-1'>
          DSO (Days Sales Outstanding)
        </p>
      </div>
    </div>
  )
}

export default SummaryCardsGrid
