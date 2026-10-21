import { useI18n } from '@/lib/i18n'
import { BiPeriodSelector } from '@/components/bi/BiPeriodSelector'
import type { DashboardPeriod } from '@/types/bi'

const LABELS: Record<DashboardPeriod, { key: string; fallback: string }> = {
  today: { key: 'audit.period.today', fallback: 'Hoy' },
  // Auditoría resuelve la semana con NewPeriodRolling: son 7 días móviles,
  // no la semana calendario (se rotula en consecuencia).
  week: { key: 'audit.period.week', fallback: 'Últimos 7 días' },
  month: { key: 'audit.period.month', fallback: 'Este mes' },
  year: { key: 'audit.period.year', fallback: 'Este año' },
}

/** Selector de período compartido por el dashboard y la ficha de usuario. */
export const AuditPeriodSelector = ({
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
      label={t('audit.period.aria', 'Período de auditoría')}
      optionLabels={{
        today: t(LABELS.today.key, LABELS.today.fallback),
        week: t(LABELS.week.key, LABELS.week.fallback),
        month: t(LABELS.month.key, LABELS.month.fallback),
        year: t(LABELS.year.key, LABELS.year.fallback),
      }}
    />
  )
}

export default AuditPeriodSelector
