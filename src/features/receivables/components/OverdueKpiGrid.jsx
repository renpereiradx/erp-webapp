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
    <div className='receivables-dashboard__kpi-grid'>
      {/* Total Vencido - Datos de API */}
      <Card className='kpi-card'>
        <p className='kpi-card__label'>
          {t('receivables.overdue.kpi.total_overdue')}
        </p>
        <div className='flex items-end gap-2'>
          <h3 className='kpi-card__value'>{formatPYG(stats.totalOverdue)}</h3>
        </div>
      </Card>

      {/* Cuentas en Riesgo - Datos de API */}
      <Card className='kpi-card'>
        <p className='kpi-card__label'>
          {t('receivables.overdue.kpi.at_risk')}
        </p>
        <div className='flex items-end gap-2'>
          <h3 className='kpi-card__value'>{stats.atRisk}</h3>
          <span
            className='text-tertiary'
            style={{ fontSize: '10px', marginBottom: '4px' }}
          >
            cuentas críticas
          </span>
        </div>
      </Card>

      {/* Eficiencia de Cobro - Calculado de API */}
      <Card className='kpi-card'>
        <p className='kpi-card__label'>
          {t('receivables.overdue.kpi.efficiency')}
        </p>
        <div className='flex items-end gap-2'>
          <h3 className='kpi-card__value'>{stats.efficiency}%</h3>
          <span
            className='text-tertiary'
            style={{ fontSize: '10px', marginBottom: '4px' }}
          >
            Objetivo: 75%
          </span>
        </div>
        <Progress value={stats.efficiency} className='h-1.5 mt-2' />
      </Card>

      {/* Total de Cuentas - Datos de API */}
      <Card className='kpi-card'>
        <p className='kpi-card__label'>Total Cuentas</p>
        <div className='flex items-end gap-2'>
          <h3 className='kpi-card__value'>{stats.totalAccounts || 0}</h3>
          <span
            className='text-tertiary'
            style={{ fontSize: '10px', marginBottom: '4px' }}
          >
            en seguimiento
          </span>
        </div>
      </Card>
    </div>
  )
}

export default OverdueKpiGrid
