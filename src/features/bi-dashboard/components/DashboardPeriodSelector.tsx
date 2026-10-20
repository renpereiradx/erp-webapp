import SegmentedControl from '@/components/ui/SegmentedControl'
import { useI18n } from '@/lib/i18n'
import { DASHBOARD_PERIODS, useDashboardStore } from '@/store/useDashboardStore'
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
    <SegmentedControl
      options={DASHBOARD_PERIODS.map((value) => ({
        value,
        label: t(`dashboard.period.${value}`, PERIOD_FALLBACKS[value]),
      }))}
      value={period}
      onChange={(value: string) => setPeriod(value as DashboardPeriod)}
      aria-label={t('dashboard.period.label', 'Período')}
      size="small"
    />
  )
}
