import { BiPeriodSelector } from '@/components/bi/BiPeriodSelector'
import { useI18n } from '@/lib/i18n'
import { useDashboardStore } from '@/store/useDashboardStore'
import type { DashboardPeriod } from '@/types/bi'

// El BE resuelve semana/mes/año calendario (Period.Resolve), no ventanas
// móviles de 7/30 días: el label dice exactamente eso.
const PERIOD_FALLBACKS: Record<DashboardPeriod, string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  year: 'Este año',
}

/** Selector de período compartido por las pantallas del dashboard. */
export const DashboardPeriodSelector = () => {
  const { t } = useI18n()
  const period = useDashboardStore((state) => state.period)
  const setPeriod = useDashboardStore((state) => state.setPeriod)

  return (
    <BiPeriodSelector
      value={period}
      onChange={setPeriod}
      label={t('dashboard.period.label', 'Período')}
      optionLabels={{
        today: t('dashboard.period.today', PERIOD_FALLBACKS.today),
        week: t('dashboard.period.week', PERIOD_FALLBACKS.week),
        month: t('dashboard.period.month', PERIOD_FALLBACKS.month),
        year: t('dashboard.period.year', PERIOD_FALLBACKS.year),
      }}
    />
  )
}
