/**
 * Estado y prioridad de una cuenta por cobrar (F7).
 *
 * El listado del BE solo devuelve filas con saldo pendiente: `PAID` no puede
 * aparecer en `/receivables` (el WHERE exige `total_amount > pagos`). El filtro
 * `status` acepta únicamente PENDING/PARTIAL/OVERDUE y los tres se superponen:
 * una cuenta parcial y vencida aparece tanto en PARTIAL como en OVERDUE.
 *
 * Prioridad: se alinea con `summary.high_priority_count` del BE, que cuenta
 * filas con MÁS DE 60 DÍAS VENCIDOS (ventana sobre el set filtrado completo).
 */

export type ReceivableStatusKey = 'pending' | 'partial' | 'overdue' | 'paid' | 'unknown'

/** Filtro de la UI: `ALL` no viaja al BE (el enum no acepta sentinelas). */
export type ReceivablesStatusFilter = 'ALL' | 'PENDING' | 'PARTIAL' | 'OVERDUE'

export const RECEIVABLES_STATUS_FILTERS: readonly ReceivablesStatusFilter[] = [
  'ALL',
  'PENDING',
  'PARTIAL',
  'OVERDUE',
]

/** Valor de `status` que viaja al BE; `ALL` se omite del query string. */
export const toStatusParam = (
  filter: ReceivablesStatusFilter,
): Exclude<ReceivablesStatusFilter, 'ALL'> | undefined =>
  filter === 'ALL' ? undefined : filter

export type ReceivablesStatusTone = 'info' | 'warning' | 'error' | 'success' | 'neutral'

export const RECEIVABLE_STATUS_TONE: Record<ReceivableStatusKey, ReceivablesStatusTone> = {
  pending: 'info',
  partial: 'warning',
  overdue: 'error',
  paid: 'success',
  unknown: 'neutral',
}

export const receivableStatusKey = (
  status: string | null | undefined,
): ReceivableStatusKey => {
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

export type ReceivablesPriorityKey = 'high' | 'medium' | 'low' | 'none'

/** Umbral del BE para `summary.high_priority_count` (`days_overdue > 60`). */
export const HIGH_PRIORITY_DAYS = 60

/**
 * Prioridad por días vencidos: >60 alta, 31-60 media, 1-30 baja, 0 al día.
 * `high` es exactamente la definición de `high_priority_count` del BE.
 */
export const receivablesPriorityKey = (
  daysOverdue: number | null | undefined,
): ReceivablesPriorityKey => {
  if (daysOverdue === null || daysOverdue === undefined) return 'none'
  if (daysOverdue > HIGH_PRIORITY_DAYS) return 'high'
  if (daysOverdue > 30) return 'medium'
  if (daysOverdue > 0) return 'low'
  return 'none'
}

export type ReceivablesPriorityTone = 'error' | 'warning' | 'info' | 'neutral'

export const RECEIVABLES_PRIORITY_TONE: Record<ReceivablesPriorityKey, ReceivablesPriorityTone> = {
  high: 'error',
  medium: 'warning',
  low: 'info',
  none: 'neutral',
}
