import type { ReactNode } from 'react'
import { performanceKey, performanceTone, type PerformanceKey } from '@/domain/profitability/performance'

export type ProfitabilityBadgeTone =
  | 'success'
  | 'warning'
  | 'error'
  | 'primary'
  | 'secondary'
  | 'neutral'

const TONE_CLASSES: Record<ProfitabilityBadgeTone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  neutral: 'bg-surface-muted text-on-surface-deep',
}

export const ProfitabilityBadge = ({
  tone,
  children,
  testId,
}: {
  tone: ProfitabilityBadgeTone
  children: ReactNode
  testId?: string
}) => (
  <span
    className={`inline-flex items-center whitespace-nowrap rounded-full px-sm py-xs text-body-sm-bold ${TONE_CLASSES[tone]}`}
    data-testid={testId}
  >
    {children}
  </span>
)

const PERFORMANCE_FALLBACKS: Record<PerformanceKey, string> = {
  excellent: 'Excelente',
  good: 'Bueno',
  average: 'Promedio',
  poor: 'Bajo',
  loss: 'Pérdida',
}

interface PerformanceBadgeProps {
  /** Código real del BE (`EXCELLENT`, `GOOD`, ...). */
  performance: string
  label: (key: PerformanceKey, fallback: string) => string
}

/**
 * Badge del desempeño que deriva el BE. Un código desconocido no se inventa:
 * el componente no renderiza nada.
 */
export const PerformanceBadge = ({ performance, label }: PerformanceBadgeProps) => {
  const key = performanceKey(performance)
  if (!key) return null
  return (
    <ProfitabilityBadge tone={performanceTone(key)} testId={`performance-${key}`}>
      {label(key, PERFORMANCE_FALLBACKS[key])}
    </ProfitabilityBadge>
  )
}

export default ProfitabilityBadge
