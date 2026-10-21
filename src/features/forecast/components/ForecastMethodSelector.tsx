import SegmentedControl from '@/components/ui/SegmentedControl'
import type { ForecastMethod } from '@/types/bi'
import { FORECAST_UI_METHODS } from '@/domain/forecast/constants'

interface ForecastMethodSelectorProps {
  value: ForecastMethod
  onChange: (method: ForecastMethod) => void
  /** Texto accesible del grupo (`aria-label`), ya traducido. */
  label: string
  /** Etiqueta ya traducida de cada método. */
  optionLabels: Record<ForecastMethod, string>
}

export const ForecastMethodSelector = ({
  value,
  onChange,
  label,
  optionLabels,
}: ForecastMethodSelectorProps) => (
  <SegmentedControl
    options={FORECAST_UI_METHODS.map((method) => ({
      value: method,
      label: optionLabels[method],
    }))}
    value={value}
    onChange={(next: string) => onChange(next as ForecastMethod)}
    aria-label={label}
    size="small"
  />
)

export default ForecastMethodSelector
