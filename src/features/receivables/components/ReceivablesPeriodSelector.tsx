import { useI18n } from '@/lib/i18n'
import BiPeriodSelector from '@/components/bi/BiPeriodSelector'
import { useReceivablesPeriod } from '../hooks/useReceivablesPeriod'

/**
 * Selector del período de estadísticas del grupo. El BE resuelve `week` con
 * `NewPeriod` (semana calendario que empieza el lunes): el label dice "Esta
 * semana", nunca "Últimos 7 días".
 */
export const ReceivablesPeriodSelector = () => {
  const { t } = useI18n()
  const { period, setPeriod } = useReceivablesPeriod()

  return (
    <BiPeriodSelector
      value={period}
      onChange={setPeriod}
      label={t('receivables.period.label', 'Período')}
      optionLabels={{
        today: t('receivables.period.today', 'Hoy'),
        week: t('receivables.period.week', 'Esta semana'),
        month: t('receivables.period.month', 'Este mes'),
        year: t('receivables.period.year', 'Este año'),
      }}
    />
  )
}

export default ReceivablesPeriodSelector
