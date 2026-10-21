/**
 * Filtros y orden del registro de auditoría (F10).
 *
 * Contrato real de `GET /api/v1/audit/logs` (handler + `auditLogConditions`):
 *  - `start_date`/`end_date` son `YYYY-MM-DD`; el handler suma 1 día al fin
 *    (`timestamp < end`), así que el día "Hasta" es inclusive;
 *  - sin fechas el BE usa [hoy−30d, mañana); la UI manda siempre el rango
 *    explícito para poder mostrarlo y no depender de un default invisible;
 *  - `success` solo distingue `'true'` de todo lo demás (el handler hace
 *    `successStr == "true"`), por eso el filtro de resultado envía el booleano
 *    exacto;
 *  - `sort_by` acepta category|action|level; `sort_order` solo reconoce
 *    `'asc'` (cualquier otro valor ordena DESC). El orden por defecto es
 *    `timestamp DESC, id DESC` y se recupera al desactivar el orden.
 */
import type { AuditExportFilters, AuditLogSortBy, AuditLogsParams } from '@/types/bi'
import { AUDIT_DEFAULT_RANGE_DAYS } from './constants'
import { addLocalDays, toLocalDateKey } from './format'

export type AuditResultFilter = 'ALL' | 'SUCCESS' | 'FAILURE'

export const AUDIT_RESULT_FILTERS: readonly AuditResultFilter[] = [
  'ALL',
  'SUCCESS',
  'FAILURE',
]

export interface AuditLogFilters {
  startDate: string
  endDate: string
  search: string
  /** Código exacto (`''` = todas). */
  category: string
  /** Código exacto (`''` = todos). */
  level: string
  result: AuditResultFilter
}

export const defaultAuditLogFilters = (now: Date = new Date()): AuditLogFilters => ({
  startDate: toLocalDateKey(addLocalDays(now, -(AUDIT_DEFAULT_RANGE_DAYS - 1))),
  endDate: toLocalDateKey(now),
  search: '',
  category: '',
  level: '',
  result: 'ALL',
})

export type AuditRangeState = 'complete' | 'empty' | 'incomplete' | 'invalid'

/**
 * Estado del rango de fechas. El BE acepta una sola fecha y completa la otra
 * con su default; la UI no consulta hasta tener ambas para no mostrar un
 * rango distinto al elegido.
 */
export const auditRangeState = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): AuditRangeState => {
  const start = (startDate ?? '').trim()
  const end = (endDate ?? '').trim()
  if (start === '' && end === '') return 'empty'
  if (start === '' || end === '') return 'incomplete'
  if (start > end) return 'invalid'
  return 'complete'
}

export const isAuditRangeQueryable = (state: AuditRangeState): boolean => state === 'complete'

export interface AuditSort {
  field: AuditLogSortBy
  order: 'asc' | 'desc'
}

export const AUDIT_SORT_FIELDS: readonly AuditLogSortBy[] = ['category', 'action', 'level']

export const isAuditSortField = (value: unknown): value is AuditLogSortBy =>
  typeof value === 'string' && (AUDIT_SORT_FIELDS as readonly string[]).includes(value)

/**
 * Ciclo de orden por columna: sin orden → ASC → DESC → sin orden (vuelve al
 * default del BE, timestamp DESC). Un campo distinto reinicia en ASC.
 */
export const nextAuditSort = (
  current: AuditSort | null,
  field: AuditLogSortBy,
): AuditSort | null => {
  if (!isAuditSortField(field)) return current
  if (!current || current.field !== field) return { field, order: 'asc' }
  if (current.order === 'asc') return { field, order: 'desc' }
  return null
}

export const auditAriaSortFor = (
  sort: AuditSort | null,
  field: AuditLogSortBy,
): 'ascending' | 'descending' | 'none' => {
  if (!sort || sort.field !== field) return 'none'
  return sort.order === 'asc' ? 'ascending' : 'descending'
}

/** Params del listado; omite los filtros vacíos y recorta el texto. */
export const toAuditLogsParams = (
  filters: AuditLogFilters,
  page: number,
  pageSize: number,
  sort: AuditSort | null = null,
): AuditLogsParams => {
  const params: AuditLogsParams = {
    start_date: filters.startDate || undefined,
    end_date: filters.endDate || undefined,
    page,
    page_size: pageSize,
  }
  const search = filters.search.trim()
  if (search !== '') params.search = search
  if (filters.category !== '') params.category = filters.category
  if (filters.level !== '') params.level = filters.level
  if (filters.result === 'SUCCESS') params.success = true
  if (filters.result === 'FAILURE') params.success = false
  if (sort) {
    params.sort_by = sort.field
    params.sort_order = sort.order
  }
  return params
}

/** Filtros del export: `search` viaja como `search_term` (body del handler). */
export const toAuditExportFilters = (filters: AuditLogFilters): AuditExportFilters => {
  const result: AuditExportFilters = {
    start_date: filters.startDate || undefined,
    end_date: filters.endDate || undefined,
  }
  const search = filters.search.trim()
  if (search !== '') result.search = search
  if (filters.category !== '') result.category = filters.category
  if (filters.level !== '') result.level = filters.level
  if (filters.result === 'SUCCESS') result.success = 'true'
  if (filters.result === 'FAILURE') result.success = 'false'
  return result
}

/** ¿El usuario cambió algo respecto de la ventana inicial de 30 días? */
export const hasActiveAuditFilters = (
  filters: AuditLogFilters,
  defaults: AuditLogFilters,
): boolean =>
  filters.startDate !== defaults.startDate ||
  filters.endDate !== defaults.endDate ||
  filters.search.trim() !== '' ||
  filters.category !== '' ||
  filters.level !== '' ||
  filters.result !== 'ALL'
