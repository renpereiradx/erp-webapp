import { useI18n } from '@/lib/i18n'
import BiPeriodSelector from '@/components/bi/BiPeriodSelector'
import { useInventoryPeriod } from '../hooks/useInventoryPeriod'

/**
 * Selector de período de rotación/ABC. `week` es rolling (últimos 7 días) en
 * el BE de inventario; el label lo dice. El estado vive en `?period=`.
 */
export const InventoryPeriodSelector = () => {
  const { t } = useI18n()
  const { period, setPeriod } = useInventoryPeriod()

  return (
    <BiPeriodSelector
      value={period}
      onChange={setPeriod}
      label={t('inventoryAnalytics.period.label', 'Período')}
      optionLabels={{
        today: t('inventoryAnalytics.period.today', 'Hoy'),
        week: t('inventoryAnalytics.period.week', 'Últimos 7 días'),
        month: t('inventoryAnalytics.period.month', 'Este mes'),
        year: t('inventoryAnalytics.period.year', 'Este año'),
      }}
    />
  )
}

export default InventoryPeriodSelector
