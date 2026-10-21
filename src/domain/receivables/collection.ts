/**
 * Orden server-side y serie de cobranza de Cuentas por Cobrar (F7).
 *
 * Whitelist real de `sort_by` en `GET /receivables` (T3):
 * `date | amount | client | days_overdue`. El BE responde 400 ante cualquier
 * otro valor, así que las columnas ordenables se construyen desde acá.
 *
 * La serie de cobranza (`statistics.collection_trend`) viene en semanas
 * calendario y el BE emite un bucket extra que arranca después del fin del
 * rango (artefacto del `WITH RECURSIVE`): se descarta comparando contra el fin
 * exclusivo que declara `statistics.period`. El `balance` es el acumulado
 * facturado − cobrado del BE, no una deuda.
 */
import type { ReceivablesCollectionTrendPoint, ReceivablesSortBy } from '@/types/bi'
import { isMissingDate } from './format'

export type ReceivablesSortOrder = 'ASC' | 'DESC'

export interface ReceivablesSort {
  by: ReceivablesSortBy
  order: ReceivablesSortOrder
}

export const RECEIVABLES_SORT_FIELDS: readonly ReceivablesSortBy[] = [
  'date',
  'amount',
  'client',
  'days_overdue',
]

/** Dirección con la que arranca cada columna al elegirla. */
export const RECEIVABLES_SORT_DEFAULT_ORDER: Record<ReceivablesSortBy, ReceivablesSortOrder> = {
  date: 'DESC',
  amount: 'DESC',
  client: 'ASC',
  days_overdue: 'DESC',
}

export const DEFAULT_RECEIVABLES_SORT: ReceivablesSort = { by: 'date', order: 'DESC' }

/**
 * Próximo orden al clickear un encabezado: misma columna → invierte; columna
 * nueva → su dirección por defecto (nunca hereda la del anterior).
 */
export const nextReceivablesSort = (
  current: ReceivablesSort,
  field: ReceivablesSortBy,
): ReceivablesSort => {
  if (current.by !== field) return { by: field, order: RECEIVABLES_SORT_DEFAULT_ORDER[field] }
  return { by: field, order: current.order === 'ASC' ? 'DESC' : 'ASC' }
}

/** Valor de `aria-sort` para el `<th>` de una columna ordenable. */
export const ariaSortFor = (
  sort: ReceivablesSort,
  field: ReceivablesSortBy,
): 'ascending' | 'descending' | 'none' => {
  if (sort.by !== field) return 'none'
  return sort.order === 'ASC' ? 'ascending' : 'descending'
}

export interface CollectionTrendRow extends ReceivablesCollectionTrendPoint {
  /** `date` es date-only; se formatea en UTC en la capa de presentación. */
  date: string
}

/**
 * Serie semanal del período, sin el bucket posterior al fin del rango.
 * `range.end` es EXCLUSIVO (`YYYY-MM-DD`).
 */
export const collectionTrendRows = (
  points: ReceivablesCollectionTrendPoint[] | null | undefined,
  range: { start: string; end: string } | null | undefined,
): CollectionTrendRow[] => {
  const rows = (Array.isArray(points) ? points : []).filter((point) => {
    if (isMissingDate(point.date)) return false
    if (!range) return true
    return point.date.slice(0, 10) < range.end
  })
  return rows
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
}
