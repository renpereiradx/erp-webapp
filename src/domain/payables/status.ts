/**
 * Estado y prioridad de una cuenta por pagar (F8).
 *
 * El listado del BE solo devuelve filas con saldo pendiente: `PAID` nunca
 * puede aparecer en `/payables` (el WHERE exige `total_amount > pagos`), por
 * eso el filtro de la UI ofrece únicamente PENDING/PARTIAL/OVERDUE. Los tres
 * se superponen: el `status` de la fila se calcula aparte del WHERE, así que
 * una cuenta vencida sin pagos aparece tanto en PENDING como en OVERDUE.
 *
 * Prioridad (la calcula el BE): URGENT si venció; HIGH si vence en ≤7 días;
 * MEDIUM si vence en ≤15; LOW en el resto. En el filtro del listado los rangos
 * son equivalentes pero medidos sobre `order_date` (vencimiento = compra + 30
 * días), por eso HIGH/MEDIUM/LOW son mutuamente excluyentes entre sí.
 */

export type PayablesStatusKey = 'pending' | 'partial' | 'paid' | 'overdue' | 'unknown'

/** Filtro de la UI: `ALL` no viaja al BE (el enum no acepta sentinelas). */
export type PayablesStatusFilter = 'ALL' | 'PENDING' | 'PARTIAL' | 'OVERDUE'

export const PAYABLES_STATUS_FILTERS: readonly PayablesStatusFilter[] = [
  'ALL',
  'PENDING',
  'PARTIAL',
  'OVERDUE',
]

/** Valor de `status` que viaja al BE; `ALL` se omite del query string. */
export const toStatusParam = (
  filter: PayablesStatusFilter,
): Exclude<PayablesStatusFilter, 'ALL'> | undefined =>
  filter === 'ALL' ? undefined : filter

export type PayablesStatusTone = 'info' | 'warning' | 'error' | 'success' | 'neutral'

export const payablesStatusKey = (
  status: string | null | undefined,
): PayablesStatusKey => {
  switch ((status ?? '').toUpperCase()) {
    case 'PENDING':
      return 'pending'
    case 'PARTIAL':
      return 'partial'
    case 'OVERDUE':
      return 'overdue'
    case 'PAID':
      return 'paid'
    default:
      return 'unknown'
  }
}

export const PAYABLES_STATUS_TONE: Record<PayablesStatusKey, PayablesStatusTone> = {
  pending: 'info',
  partial: 'warning',
  overdue: 'error',
  paid: 'success',
  unknown: 'neutral',
}

/** Clave i18n del estado (`payables.status.<key>`). */
export const payablesStatusLabelKey = (status: string | null | undefined): string =>
  `payables.status.${payablesStatusKey(status)}`

// --- Prioridad --------------------------------------------------------------

export type PayablesPriorityKey = 'urgent' | 'high' | 'medium' | 'low' | 'unknown'

/** Filtro de la UI: `ALL` no viaja al BE. */
export type PayablesPriorityFilter = 'ALL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'

export const PAYABLES_PRIORITY_FILTERS: readonly PayablesPriorityFilter[] = [
  'ALL',
  'URGENT',
  'HIGH',
  'MEDIUM',
  'LOW',
]

export const toPriorityParam = (
  filter: PayablesPriorityFilter,
): Exclude<PayablesPriorityFilter, 'ALL'> | undefined =>
  filter === 'ALL' ? undefined : filter

export const payablesPriorityKey = (
  priority: string | null | undefined,
): PayablesPriorityKey => {
  switch ((priority ?? '').toUpperCase()) {
    case 'URGENT':
      return 'urgent'
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    case 'LOW':
      return 'low'
    default:
      return 'unknown'
  }
}

export type PayablesPriorityTone = 'error' | 'warning' | 'info' | 'neutral'

export const PAYABLES_PRIORITY_TONE: Record<PayablesPriorityKey, PayablesPriorityTone> = {
  urgent: 'error',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
  unknown: 'neutral',
}

export const payablesPriorityLabelKey = (priority: string | null | undefined): string =>
  `payables.priority.${payablesPriorityKey(priority)}`

// --- Comportamiento de pago y nivel de dependencia --------------------------

export type PayablesBehaviorKey = 'excellent' | 'good' | 'regular' | 'poor' | 'unknown'

export const payablesBehaviorKey = (
  history: string | null | undefined,
): PayablesBehaviorKey => {
  switch ((history ?? '').toUpperCase()) {
    case 'EXCELLENT':
      return 'excellent'
    case 'GOOD':
      return 'good'
    case 'REGULAR':
      return 'regular'
    case 'POOR':
      return 'poor'
    default:
      return 'unknown'
  }
}

export type PayablesBehaviorTone = 'success' | 'info' | 'warning' | 'error' | 'neutral'

export const PAYABLES_BEHAVIOR_TONE: Record<PayablesBehaviorKey, PayablesBehaviorTone> = {
  excellent: 'success',
  good: 'info',
  regular: 'warning',
  poor: 'error',
  unknown: 'neutral',
}

export const payablesBehaviorLabelKey = (history: string | null | undefined): string =>
  `payables.behavior.${payablesBehaviorKey(history)}`

export type PayablesImportanceKey = 'critical' | 'high' | 'medium' | 'low' | 'unknown'

export const payablesImportanceKey = (
  importance: string | null | undefined,
): PayablesImportanceKey => {
  switch ((importance ?? '').toUpperCase()) {
    case 'CRITICAL':
      return 'critical'
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    case 'LOW':
      return 'low'
    default:
      return 'unknown'
  }
}

export type PayablesImportanceTone = 'error' | 'warning' | 'info' | 'neutral'

export const PAYABLES_IMPORTANCE_TONE: Record<PayablesImportanceKey, PayablesImportanceTone> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
  unknown: 'neutral',
}

export const payablesImportanceLabelKey = (importance: string | null | undefined): string =>
  `payables.importance.${payablesImportanceKey(importance)}`
