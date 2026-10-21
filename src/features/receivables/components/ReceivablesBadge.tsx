import type { ReactNode } from 'react'

export type ReceivablesBadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const TONE_CLASSES: Record<ReceivablesBadgeTone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-primary/10 text-primary',
  neutral: 'bg-surface-muted text-on-surface-deep',
}

/**
 * Badge semántico del módulo (estado, prioridad, riesgo, comportamiento).
 * Solo tokens del design system: sin clases de color genéricas.
 */
export const ReceivablesBadge = ({
  tone,
  children,
  testId,
}: {
  tone: ReceivablesBadgeTone
  children: ReactNode
  testId?: string
}) => (
  <span
    className={`inline-flex w-max items-center rounded-full px-sm py-xs text-body-sm-bold ${TONE_CLASSES[tone]}`}
    data-testid={testId}
  >
    {children}
  </span>
)

export default ReceivablesBadge
