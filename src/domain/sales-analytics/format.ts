/**
 * Formateadores y helpers puros de Analítica de Ventas.
 *
 * Reglas: montos SIEMPRE por `formatPYG` (nunca `$`), porcentajes redondeados
 * (la auditoría 2026-09 encontró floats de 14 decimales), fechas con el locale
 * de la UI (no el del navegador) y `—` cuando el dato no existe. Sin React ni
 * i18n: los textos los pone el componente.
 *
 * `roundPct1`/`clampPage` se conservan del PLAN_ALINEACION_BI_FRONTEND F1
 * (tests colocados incluidos); F4 agrega el resto del formateo.
 */
import { formatNumber, formatPYG } from '@/utils/currencyUtils'

/** Redondeo de presentación para porcentajes (evita "-77.08183888585903%"). */
export const roundPercent = (value: number | null | undefined, decimals = 1): number => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  const factor = 10 ** decimals
  return Math.round(numeric * factor) / factor
}

/** Alias legacy: redondeo a 1 decimal. */
export const roundPct1 = (value: number | null | undefined): number => roundPercent(value, 1)

export interface PageState {
  page?: number | null
  total_pages?: number | null
}

/** Clamp de página al rango [1, max(1, total_pages)]. */
export const clampPage = (page: number, pagination: PageState | null | undefined): number => {
  const totalPages = Math.max(1, pagination?.total_pages || 1)
  return Math.min(Math.max(1, page), totalPages)
}

/** `12,5%` — porcentaje ya calculado por el BE. */
export const formatPercent = (value: number | null | undefined, decimals = 1): string =>
  `${formatNumber(roundPercent(value, decimals), decimals)}%`

/** `+12,5%` / `-3,2%` / `0%` — variación relativa con signo explícito. */
export const formatSignedPercent = (value: number | null | undefined, decimals = 1): string => {
  const rounded = roundPercent(value, decimals)
  if (rounded > 0) return `+${formatNumber(rounded, decimals)}%`
  return `${formatNumber(rounded, decimals)}%`
}

/** Monto en guaraníes; `null`/no finito → `—` (nunca un cero inventado). */
export const formatMoney = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? formatPYG(numeric) : '—'
}

/** Variación de un monto con signo: `+ Gs. 1.855.763` / `- Gs. 10.000`. */
export const formatSignedMoney = (value: number | null | undefined): string => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  const sign = numeric > 0 ? '+' : numeric < 0 ? '-' : ''
  const formatted = formatPYG(Math.abs(numeric))
  return sign ? `${sign} ${formatted}` : formatted
}

/** Conteo con separador de miles es-PY. */
export const formatCount = (value: number | null | undefined, decimals = 0): string =>
  formatNumber(Number.isFinite(Number(value)) ? Number(value) : 0, decimals)

/** Variación de un conteo con signo: `+3` / `-1` / `0`. */
export const formatSignedCount = (value: number | null | undefined, decimals = 0): string => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  const formatted = formatNumber(numeric, decimals)
  return numeric > 0 ? `+${formatted}` : formatted
}

/** Cantidad de unidades; 0/negativo/NaN → `—` (el BE usa 0 como "sin dato"). */
export const formatQuantity = (value: number | null | undefined, decimals = 2): string => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '—'
  return formatNumber(numeric, decimals)
}

/** Monto compacto para ejes de barras: `Gs. 1,5M`. */
export const formatCompactMoney = (value: number | null | undefined): string =>
  formatPYG(Number(value) || 0, { compact: true })

/** Hora entera 0-23 → `14:00`. */
export const formatHour = (hour: number | null | undefined): string => {
  if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23) return '—'
  return `${String(hour).padStart(2, '0')}:00`
}

/** ISO date/time → fecha local (`20 oct 2026`); vacío o inválido → `—`. */
export const formatIsoDate = (value: string | null | undefined, locale?: string): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** ISO date/time → `20 oct` (sin año), para series diarias. */
export const formatIsoDayMonth = (value: string | null | undefined, locale?: string): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(locale || undefined, { day: '2-digit', month: 'short' })
}

/** ISO date/time → `oct 2026`, para series mensuales. */
export const formatIsoMonthYear = (value: string | null | undefined, locale?: string): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(locale || undefined, { month: 'short', year: 'numeric' })
}

/**
 * Duración en minutos del contrato (tiempo promedio entre ventas) partida en
 * una unidad legible. El componente decide la etiqueta i18n.
 */
export type DurationUnit = 'minutes' | 'hours' | 'days'

export interface DurationParts {
  value: number
  unit: DurationUnit
}

export const splitDurationMinutes = (minutes: number | null | undefined): DurationParts | null => {
  const numeric = Number(minutes)
  if (!Number.isFinite(numeric) || numeric < 0) return null
  if (numeric < 60) return { value: Math.round(numeric * 10) / 10, unit: 'minutes' }
  if (numeric < 1440) return { value: Math.round((numeric / 60) * 10) / 10, unit: 'hours' }
  return { value: Math.round((numeric / 1440) * 10) / 10, unit: 'days' }
}
