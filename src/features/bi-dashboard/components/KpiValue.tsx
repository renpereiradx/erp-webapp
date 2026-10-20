import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import type { KpiKind } from '@/domain/dashboard/kpis'

/**
 * Formatea un KPI según la unidad que define el dominio. Un porcentaje nunca
 * se renderiza como monto y una rotación nunca como porcentaje.
 */
export const KpiValue = ({ value, kind }: { value: number; kind: KpiKind }) => {
  const { t } = useI18n()

  switch (kind) {
    case 'money':
      return <>{formatPYG(value)}</>
    case 'percent':
      return <>{formatNumber(value, 1)}%</>
    case 'ratio':
      return (
        <>
          {formatNumber(value, 2)}
          {t('dashboard.units.times', 'x')}
        </>
      )
    case 'days':
      return (
        <>
          {formatNumber(value, 1)} {t('dashboard.units.days', 'días')}
        </>
      )
    case 'count':
      return <>{formatNumber(value, 0)}</>
    default:
      return <>{formatNumber(value, 1)}</>
  }
}
