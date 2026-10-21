import SegmentedControl from '@/components/ui/SegmentedControl'

interface ForecastHorizonSelectorProps {
  value: number
  options: readonly number[]
  onChange: (value: number) => void
  /** Texto accesible del grupo (`aria-label`), ya traducido. */
  label: string
  /** Etiqueta ya traducida de cada opción (meses o días). */
  optionLabels: Record<number, string>
}

/**
 * Selector de horizonte compartido por las pantallas de Pronósticos.
 * Controlado: no conoce el router ni los servicios; el dueño del estado
 * (query param de cada pantalla) decide qué hacer con el valor.
 */
export const ForecastHorizonSelector = ({
  value,
  options,
  onChange,
  label,
  optionLabels,
}: ForecastHorizonSelectorProps) => (
  <SegmentedControl
    options={options.map((option) => ({
      value: String(option),
      label: optionLabels[option] ?? String(option),
    }))}
    value={String(value)}
    onChange={(next: string) => onChange(Number(next))}
    aria-label={label}
    size="small"
  />
)

export default ForecastHorizonSelector
