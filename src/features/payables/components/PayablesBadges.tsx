import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import {
  PAYABLES_BEHAVIOR_TONE,
  PAYABLES_IMPORTANCE_TONE,
  PAYABLES_PRIORITY_TONE,
  PAYABLES_STATUS_TONE,
  payablesBehaviorKey,
  payablesBehaviorLabelKey,
  payablesImportanceKey,
  payablesImportanceLabelKey,
  payablesPriorityKey,
  payablesPriorityLabelKey,
  payablesStatusKey,
  payablesStatusLabelKey,
} from '@/domain/payables/status'

export type PayablesBadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const TONE_CLASSES: Record<PayablesBadgeTone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-primary/10 text-primary',
  neutral: 'bg-surface-muted text-on-surface-deep',
}

/**
 * Badge semántico del módulo (estado, prioridad, comportamiento,
 * importancia). Solo tokens del design system: sin clases de color genéricas.
 */
export const PayablesBadge = ({
  tone,
  children,
  testId,
}: {
  tone: PayablesBadgeTone
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

const STATUS_FALLBACK: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  overdue: 'Vencida',
  paid: 'Pagada',
  unknown: 'Desconocido',
}

const PRIORITY_FALLBACK: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  unknown: '—',
}

const BEHAVIOR_FALLBACK: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Bueno',
  regular: 'Regular',
  poor: 'Malo',
  unknown: 'Sin datos',
}

const IMPORTANCE_FALLBACK: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
  unknown: '—',
}

export const PayablesStatusBadge = ({ status }: { status: string | null | undefined }) => {
  const { t } = useI18n()
  const key = payablesStatusKey(status)
  return (
    <PayablesBadge
      tone={PAYABLES_STATUS_TONE[key]}
      testId={`payables-status-${key}`}
    >
      {t(payablesStatusLabelKey(status), STATUS_FALLBACK[key])}
    </PayablesBadge>
  )
}

export const PayablesPriorityBadge = ({
  priority,
}: {
  priority: string | null | undefined
}) => {
  const { t } = useI18n()
  const key = payablesPriorityKey(priority)
  return (
    <PayablesBadge
      tone={PAYABLES_PRIORITY_TONE[key]}
      testId={`payables-priority-${key}`}
    >
      {t(payablesPriorityLabelKey(priority), PRIORITY_FALLBACK[key])}
    </PayablesBadge>
  )
}

export const PayablesBehaviorBadge = ({
  history,
}: {
  history: string | null | undefined
}) => {
  const { t } = useI18n()
  const key = payablesBehaviorKey(history)
  return (
    <PayablesBadge
      tone={PAYABLES_BEHAVIOR_TONE[key]}
      testId={`payables-behavior-${key}`}
    >
      {t(payablesBehaviorLabelKey(history), BEHAVIOR_FALLBACK[key])}
    </PayablesBadge>
  )
}

export const PayablesImportanceBadge = ({
  importance,
}: {
  importance: string | null | undefined
}) => {
  const { t } = useI18n()
  const key = payablesImportanceKey(importance)
  return (
    <PayablesBadge
      tone={PAYABLES_IMPORTANCE_TONE[key]}
      testId={`payables-importance-${key}`}
    >
      {t(payablesImportanceLabelKey(importance), IMPORTANCE_FALLBACK[key])}
    </PayablesBadge>
  )
}

export default PayablesBadge
