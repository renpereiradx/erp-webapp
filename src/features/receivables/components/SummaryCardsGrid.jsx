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
    <div className='receivables-dashboard__kpi-grid'>
      <Card className='kpi-card'>
        <div className='kpi-card__header'>
          <p className='kpi-card__label'>
            {t('receivables.metrics.outstanding')}
          </p>
          <div className='kpi-card__icon kpi-card__icon--blue'>
            <span className='material-symbols-outlined'>payments</span>
          </div>
        </div>
        <h3 className='kpi-card__value'>
          {formatPYG(summary.totalReceivables?.amount)}
        </h3>
        <div className='kpi-card__trend is-good'>
          <span className='material-symbols-outlined'>trending_up</span>
          <span>{summary.collectionRate || 0}% Tasa de Cobranza</span>
        </div>
      </Card>

      <Card className='kpi-card kpi-card--danger'>
        <div className='kpi-card__header'>
          <p className='kpi-card__label'>Total Vencido</p>
          <div className='kpi-card__icon kpi-card__icon--red'>
            <span className='material-symbols-outlined'>warning</span>
          </div>
        </div>
        <h3 className='kpi-card__value'>
          {formatPYG(summary.overdueAmount?.amount)}
        </h3>
        <div className='kpi-card__trend is-bad'>
          <span className='material-symbols-outlined'>error</span>
          <span>{summary.overdueAmount?.percentage}% del Total</span>
        </div>
      </Card>

      <Card className='kpi-card'>
        <div className='kpi-card__header'>
          <p className='kpi-card__label'>Cuentas Totales</p>
          <div className='kpi-card__icon kpi-card__icon--green'>
            <span className='material-symbols-outlined'>receipt_long</span>
          </div>
        </div>
        <h3 className='kpi-card__value'>{summary.totalCount || 0}</h3>
        <div className='kpi-card__trend'>
          <span className='material-symbols-outlined'>warning</span>
          <span>{summary.overdueCount || 0} vencidas</span>
        </div>
      </Card>

      <Card className='kpi-card'>
        <div className='kpi-card__header'>
          <p className='kpi-card__label'>Días Prom. de Cobro</p>
          <div className='kpi-card__icon kpi-card__icon--orange'>
            <span className='material-symbols-outlined'>schedule</span>
          </div>
        </div>
        <h3 className='kpi-card__value'>
          {summary.avgDaysToCollect?.toFixed(1) || 0} días
        </h3>
        <p className='text-tertiary' style={{ fontSize: '10px' }}>
          DSO (Days Sales Outstanding)
        </p>
      </Card>
    </div>
  )
}

export default SummaryCardsGrid
