import { BiPeriodSelector } from '@/components/bi/BiPeriodSelector'
import { useI18n } from '@/lib/i18n'
import type { DashboardPeriod } from '@/types/bi'
import { usePurchasePeriod } from '../hooks/usePurchasePeriod'

// `/purchase-analytics/*` usa NewPeriodRolling en el BE (igual que ventas):
// `week` son los últimos 7 días, no la semana calendario.
const PERIOD_FALLBACKS: Record<DashboardPeriod, string> = {
  today: 'Hoy',
  week: 'Últimos 7 días',
  month: 'Este mes',
  year: 'Este año',
}

/** Selector de período del grupo, respaldado por `?period=`. */
export const PurchasePeriodSelector = () => {
  const { t } = useI18n()
  const { period, setPeriod } = usePurchasePeriod()

  return (
    <BiPeriodSelector
      value={period}
      onChange={setPeriod}
      label={t('purchaseAnalytics.period.label', 'Período')}
      optionLabels={{
        today: t('purchaseAnalytics.period.today', PERIOD_FALLBACKS.today),
        week: t('purchaseAnalytics.period.week', PERIOD_FALLBACKS.week),
        month: t('purchaseAnalytics.period.month', PERIOD_FALLBACKS.month),
        year: t('purchaseAnalytics.period.year', PERIOD_FALLBACKS.year),
      }}
    />
  )
}

export default PurchasePeriodSelector
