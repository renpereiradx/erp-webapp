import { useI18n } from '@/lib/i18n'
import SegmentedControl from '@/components/ui/SegmentedControl'
import type { ProfitabilityTrendGranularity } from '@/types/bi'
import { TREND_GRANULARITIES } from '@/domain/profitability/constants'

const GRANULARITY_FALLBACKS: Record<ProfitabilityTrendGranularity, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensual',
}

interface GranularitySelectorProps {
  value: ProfitabilityTrendGranularity
  onChange: (next: ProfitabilityTrendGranularity) => void
}

/** Granularidad real del endpoint `/profitability/trends`. */
export const GranularitySelector = ({ value, onChange }: GranularitySelectorProps) => {
  const { t } = useI18n()

  return (
    <SegmentedControl
      options={TREND_GRANULARITIES.map((granularity) => ({
        value: granularity,
        label: t(`profitability.trends.granularity.${granularity}`, GRANULARITY_FALLBACKS[granularity]),
      }))}
      value={value}
      onChange={(next: string) => {
        if ((TREND_GRANULARITIES as readonly string[]).includes(next)) {
          onChange(next as ProfitabilityTrendGranularity)
        }
      }}
      aria-label={t('profitability.trends.granularityLabel', 'Granularidad')}
      size="small"
    />
  )
}

export default GranularitySelector
