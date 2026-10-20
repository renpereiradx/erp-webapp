import SegmentedControl from '@/components/ui/SegmentedControl'
import type { DashboardPeriod } from '@/types/bi'

/** Períodos que ofrecen los selectores BI, en orden de lectura. */
export const BI_PERIODS: readonly DashboardPeriod[] = ['today', 'week', 'month', 'year']

interface BiPeriodSelectorProps {
  value: DashboardPeriod
  onChange: (period: DashboardPeriod) => void
  /** Texto accesible del grupo (`aria-label`), ya traducido. */
  label: string
  /** Etiqueta ya traducida de cada período. */
  optionLabels: Record<DashboardPeriod, string>
  size?: 'small' | 'medium'
}

/**
 * Selector de período compartido por las pantallas BI. Controlado: no conoce
 * stores ni el router; el dueño del estado (store del dashboard o query param
 * de Analítica de Ventas) decide dónde vive.
 */
export const BiPeriodSelector = ({
  value,
  onChange,
  label,
  optionLabels,
  size = 'small',
}: BiPeriodSelectorProps) => (
  <SegmentedControl
    options={BI_PERIODS.map((period) => ({ value: period, label: optionLabels[period] }))}
    value={value}
    onChange={(next: string) => onChange(next as DashboardPeriod)}
    aria-label={label}
    size={size}
  />
)

export default BiPeriodSelector
