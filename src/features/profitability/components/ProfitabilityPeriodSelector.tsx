import { useI18n } from '@/lib/i18n'
import BiPeriodSelector from '@/components/bi/BiPeriodSelector'
import { useProfitabilityPeriod } from '../hooks/useProfitabilityPeriod'

/**
 * Selector de período del grupo. El BE resuelve `week` con
 * `NewPeriodRolling` (últimos 7 días): el label lo dice. El estado vive en
 * `?period=`.
 */
export const ProfitabilityPeriodSelector = () => {
  const { t } = useI18n()
  const { period, setPeriod } = useProfitabilityPeriod()

  return (
    <BiPeriodSelector
      value={period}
      onChange={setPeriod}
      label={t('profitability.period.label', 'Período')}
      optionLabels={{
        today: t('profitability.period.today', 'Hoy'),
        week: t('profitability.period.week', 'Últimos 7 días'),
        month: t('profitability.period.month', 'Este mes'),
        year: t('profitability.period.year', 'Este año'),
      }}
    />
  )
}

export default ProfitabilityPeriodSelector
