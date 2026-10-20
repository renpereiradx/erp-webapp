import { BiPeriodSelector } from '@/components/bi/BiPeriodSelector'
import { useI18n } from '@/lib/i18n'
import type { DashboardPeriod } from '@/types/bi'
import { useSalesPeriod } from '../hooks/useSalesPeriod'

// `/sales-analytics/*` usa NewPeriodRolling en el BE: `week` son los últimos
// 7 días, no la semana calendario (a diferencia del dashboard de F2).
const PERIOD_FALLBACKS: Record<DashboardPeriod, string> = {
  today: 'Hoy',
  week: 'Últimos 7 días',
  month: 'Este mes',
  year: 'Este año',
}

/** Selector de período del grupo, respaldado por `?period=`. */
export const SalesPeriodSelector = () => {
  const { t } = useI18n()
  const { period, setPeriod } = useSalesPeriod()

  return (
    <BiPeriodSelector
      value={period}
      onChange={setPeriod}
      label={t('salesAnalytics.period.label', 'Período')}
      optionLabels={{
        today: t('salesAnalytics.period.today', PERIOD_FALLBACKS.today),
        week: t('salesAnalytics.period.week', PERIOD_FALLBACKS.week),
        month: t('salesAnalytics.period.month', PERIOD_FALLBACKS.month),
        year: t('salesAnalytics.period.year', PERIOD_FALLBACKS.year),
      }}
    />
  )
}

export default SalesPeriodSelector
