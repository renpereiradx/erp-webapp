import { useI18n } from '@/lib/i18n'
import { BiPeriodSelector } from '@/components/bi/BiPeriodSelector'
import type { DashboardPeriod } from '@/types/bi'

const LABELS: Record<DashboardPeriod, { key: string; fallback: string }> = {
  today: { key: 'finance.period.today', fallback: 'Hoy' },
  week: { key: 'finance.period.week', fallback: 'Esta semana' },
  month: { key: 'finance.period.month', fallback: 'Este mes' },
  year: { key: 'finance.period.year', fallback: 'Este año' },
}

/** Selector de período compartido por las pantallas del grupo (URL). */
export const FinancePeriodSelector = ({
  value,
  onChange,
}: {
  value: DashboardPeriod
  onChange: (period: DashboardPeriod) => void
}) => {
  const { t } = useI18n()
  return (
    <BiPeriodSelector
      value={value}
      onChange={onChange}
      label={t('finance.period.aria', 'Período del reporte')}
      optionLabels={{
        today: t(LABELS.today.key, LABELS.today.fallback),
        week: t(LABELS.week.key, LABELS.week.fallback),
        month: t(LABELS.month.key, LABELS.month.fallback),
        year: t(LABELS.year.key, LABELS.year.fallback),
      }}
    />
  )
}

export default FinancePeriodSelector
