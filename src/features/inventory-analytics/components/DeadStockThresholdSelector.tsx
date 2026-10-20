import { useI18n } from '@/lib/i18n'
import SegmentedControl from '@/components/ui/SegmentedControl'
import {
  DEAD_STOCK_THRESHOLDS,
  type DeadStockThreshold,
} from '@/domain/inventory-analytics/deadStock'

const THRESHOLD_KEYS: Record<DeadStockThreshold, string> = {
  90: 'inventoryAnalytics.risk.threshold.d90',
  120: 'inventoryAnalytics.risk.threshold.d120',
  180: 'inventoryAnalytics.risk.threshold.d180',
}

const THRESHOLD_FALLBACKS: Record<DeadStockThreshold, string> = {
  90: '90 días',
  120: '120 días',
  180: '180 días',
}

interface DeadStockThresholdSelectorProps {
  value: DeadStockThreshold
  onChange: (value: DeadStockThreshold) => void
}

/** Umbral de días sin venta que se manda al endpoint (`?days=`). */
export const DeadStockThresholdSelector = ({
  value,
  onChange,
}: DeadStockThresholdSelectorProps) => {
  const { t } = useI18n()
  return (
    <SegmentedControl
      options={DEAD_STOCK_THRESHOLDS.map((threshold) => ({
        value: String(threshold),
        label: t(THRESHOLD_KEYS[threshold], THRESHOLD_FALLBACKS[threshold]),
      }))}
      value={String(value)}
      onChange={(next: string) => onChange(Number(next) as DeadStockThreshold)}
      aria-label={t('inventoryAnalytics.risk.thresholdLabel', 'Umbral sin venta')}
      size="small"
    />
  )
}

export default DeadStockThresholdSelector
