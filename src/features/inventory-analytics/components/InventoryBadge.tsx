import type { ReactNode } from 'react'

export type InventoryBadgeTone =
  | 'success'
  | 'warning'
  | 'error'
  | 'primary'
  | 'secondary'
  | 'neutral'

const TONE_CLASSES: Record<InventoryBadgeTone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  neutral: 'bg-surface-muted text-on-surface-deep',
}

interface InventoryBadgeProps {
  tone: InventoryBadgeTone
  children: ReactNode
  testId?: string
}

/** Badge semántico (estado, prioridad, performance) con tokens Fluent 2. */
export const InventoryBadge = ({ tone, children, testId }: InventoryBadgeProps) => (
  <span
    className={`inline-flex items-center whitespace-nowrap rounded-full px-sm py-xs text-body-sm-bold ${TONE_CLASSES[tone]}`}
    data-testid={testId}
  >
    {children}
  </span>
)

export default InventoryBadge
