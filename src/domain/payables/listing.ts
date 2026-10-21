/**
 * Orden server-side del listado de Cuentas por Pagar (F8).
 *
 * Whitelist real de `sort_by` en `GET /payables` (T3):
 * `due_date | date | amount | supplier | priority`. El BE responde 400 ante
 * cualquier otro valor y agrega `po.id DESC` como tie-breaker, así que las
 * columnas ordenables se construyen desde acá.
 *
 * Direcciones por defecto: el BE arranca en `due_date ASC` (el vencimiento más
 * próximo primero); `supplier` y `priority` también arrancan ASC.
 */
import type { PayablesSortBy } from '@/types/bi'

export type PayablesSortOrder = 'ASC' | 'DESC'

export interface PayablesSort {
  by: PayablesSortBy
  order: PayablesSortOrder
}

export const PAYABLES_SORT_FIELDS: readonly PayablesSortBy[] = [
  'due_date',
  'date',
  'amount',
  'supplier',
  'priority',
]

/** Dirección con la que arranca cada columna al elegirla. */
export const PAYABLES_SORT_DEFAULT_ORDER: Record<PayablesSortBy, PayablesSortOrder> = {
  due_date: 'ASC',
  date: 'DESC',
  amount: 'DESC',
  supplier: 'ASC',
  priority: 'ASC',
}

/** Default del listado: mismo criterio del BE, el más urgente primero. */
export const DEFAULT_PAYABLES_SORT: PayablesSort = { by: 'due_date', order: 'ASC' }

/** Próximo orden al clickear un encabezado: misma columna invierte. */
export const nextPayablesSort = (
  current: PayablesSort,
  field: PayablesSortBy,
): PayablesSort => {
  if (current.by !== field) return { by: field, order: PAYABLES_SORT_DEFAULT_ORDER[field] }
  return { by: field, order: current.order === 'ASC' ? 'DESC' : 'ASC' }
}

/** Valor de `aria-sort` para el `<th>` de una columna ordenable. */
export const ariaSortFor = (
  sort: PayablesSort,
  field: PayablesSortBy,
): 'ascending' | 'descending' | 'none' => {
  if (sort.by !== field) return 'none'
  return sort.order === 'ASC' ? 'ascending' : 'descending'
}

/** Filtros aplicados del listado (el texto va aparte: draft/aplicado). */
export interface PayablesListFilters {
  status: 'ALL' | 'PENDING' | 'PARTIAL' | 'OVERDUE'
  priority: 'ALL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
  search: string
  startDate: string
  endDate: string
}

export const EMPTY_PAYABLES_FILTERS: PayablesListFilters = {
  status: 'ALL',
  priority: 'ALL',
  search: '',
  startDate: '',
  endDate: '',
}

/** Un rango `Desde > Hasta` no se envía: el BE no valida ese orden. */
export const isInvalidDateRange = (startDate: string, endDate: string): boolean =>
  Boolean(startDate && endDate && startDate > endDate)

export const hasActivePayablesFilters = (filters: PayablesListFilters): boolean =>
  filters.status !== 'ALL' ||
  filters.priority !== 'ALL' ||
  filters.search.trim() !== '' ||
  filters.startDate !== '' ||
  filters.endDate !== ''
