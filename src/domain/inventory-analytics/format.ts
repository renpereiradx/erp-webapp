/**
 * Formateadores puros de Analítica de Inventario (F5).
 *
 * Reglas del plan anti-invención: montos SIEMPRE por `formatPYG` (nunca `$`),
 * porcentajes redondeados (la auditoría 2026-09 encontró floats crudos),
 * fechas con el locale de la UI y `—` cuando el dato no existe. Sin React ni
 * i18n: las etiquetas las pone el componente.
 */
import { formatNumber, formatPYG } from '@/utils/currencyUtils'

/** Número finito o `null` (los `null` de Go y los `undefined` no son ceros). */
export const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

/** Monto en guaraníes; `null`/no finito → `—` (nunca un cero inventado). */
export const formatMoney = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : formatPYG(numeric)
}

/** Conteo con separador de miles es-PY; ausente → `—`. */
export const formatCount = (value: number | null | undefined, decimals = 0): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : formatNumber(numeric, decimals)
}

/** Redondeo de presentación para porcentajes (evita 31.310000000000002). */
export const roundPercent = (value: number | null | undefined, decimals = 1): number | null => {
  const numeric = toNumberOrNull(value)
  if (numeric === null) return null
  const factor = 10 ** decimals
  return Math.round(numeric * factor) / factor
}

/** `31,3%`; ausente → `—`. */
export const formatPercent = (value: number | null | undefined, decimals = 1): string => {
  const rounded = roundPercent(value, decimals)
  return rounded === null ? '—' : `${formatNumber(rounded, decimals)}%`
}

/**
 * Tasa de rotación sin la `x` (la agrega el componente con i18n): `0,06`.
 * Con el default se usan 2 decimales, salvo tasas < 0,01 donde 2 decimales
 * mostrarían `0` (semana con poco movimiento): ahí se muestran 4.
 */
export const formatRate = (value: number | null | undefined, decimals?: number): string => {
  const numeric = toNumberOrNull(value)
  if (numeric === null) return '—'
  const digits = decimals ?? (numeric > 0 && numeric < 0.01 ? 4 : 2)
  return formatNumber(numeric, digits)
}

/** Días como entero es-PY; ausente → `—`. */
export const formatDays = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : formatNumber(Math.round(numeric), 0)
}

/** Fecha ISO inválida o el cero de Go (`0001-01-01`) no son una fecha real. */
export const isMissingDate = (value: string | null | undefined): boolean => {
  if (!value) return true
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return true
  return date.getUTCFullYear() <= 1
}

/** ISO → fecha local con el locale de la UI (`20 oct 2026`); inválida → `—`. */
export const formatIsoDate = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  const date = new Date(value as string)
  return date.toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Clamp de página al rango [1, max(1, totalPages)]. */
export const clampPage = (page: number, totalPages: number | null | undefined): number => {
  const max = Math.max(1, Math.trunc(Number(totalPages) || 1))
  return Math.min(Math.max(1, Math.trunc(page) || 1), max)
}

/** Paginación client-side sobre filas ya cargadas. */
export interface PageSlice<Row> {
  rows: Row[]
  page: number
  totalPages: number
  totalItems: number
}

export const paginateRows = <Row,>(
  rows: Row[] | null | undefined,
  page: number,
  pageSize: number,
): PageSlice<Row> => {
  const all = Array.isArray(rows) ? rows : []
  const size = Math.max(1, Math.trunc(pageSize) || 10)
  const totalPages = Math.max(1, Math.ceil(all.length / size))
  const safePage = clampPage(page, totalPages)
  const start = (safePage - 1) * size
  return {
    rows: all.slice(start, start + size),
    page: safePage,
    totalPages,
    totalItems: all.length,
  }
}
