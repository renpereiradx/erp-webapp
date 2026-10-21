/**
 * Formateadores puros de Pronósticos (F11).
 *
 * Reglas anti-invención: un `null`/ausente se muestra `—` (nunca un cero
 * silencioso); un `0` real se muestra `0`. Montos SIEMPRE en guaraníes
 * (`formatPYG`), con 2 decimales cuando el valor está entre 0 y 1 (el BE
 * proyecta montos con centavos).
 *
 * Fechas: los buckets `date`/`month` son date-only serializados por Go y se
 * formatean en UTC para no correr el mes en zonas negativas; `generated_at` es
 * un instante y se formatea en la zona del navegador.
 *
 * Porcentajes: 1 decimal; un valor real > 0 que redondea a 0 se muestra
 * `<0,1%`. Las variaciones llevan signo explícito (`+58,8%` / `-66,7%`).
 */
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import type { BIReportPeriod } from '@/types/bi'

export type ForecastKpiKind =
  | 'money'
  | 'percent'
  | 'percentSigned'
  | 'count'
  | 'decimal'
  | 'ratio'
  | 'text'

export interface ForecastKpiValue {
  id: string
  kind: ForecastKpiKind
  value: number | null
  /** Para `kind: 'text'`. */
  text?: string
}

/** `es`/`en` de la UI → locale de Intl (`es-PY`/`en-US`). */
export const toIntlLocale = (lang?: string): string | undefined => {
  if (!lang) return undefined
  if (lang === 'es') return 'es-PY'
  if (lang === 'en') return 'en-US'
  return lang
}

/** Número finito o `null` (los `null` de Go y los `undefined` no son ceros). */
export const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

/** Redondeo de presentación (evita 35.95391392748221). */
export const roundNumber = (value: number | null | undefined, decimals = 2): number | null => {
  const numeric = toNumberOrNull(value)
  if (numeric === null) return null
  const factor = 10 ** decimals
  return Math.round(numeric * factor) / factor
}

const SUB_UNIT_FORMATTER = new Intl.NumberFormat('es-PY', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Monto en guaraníes; ausente → `—`. Un valor <1 conserva 2 decimales. */
export const formatMoney = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  if (numeric === null) return '—'
  if (numeric !== 0 && Math.abs(numeric) < 1) {
    return `Gs. ${SUB_UNIT_FORMATTER.format(numeric)}`
  }
  return formatPYG(numeric)
}

/** Monto con signo explícito (`-Gs. 41.860`); ausente → `—`. */
export const formatSignedMoney = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  if (numeric === null) return '—'
  return numeric < 0 ? `-${formatMoney(Math.abs(numeric))}` : formatMoney(numeric)
}

/** `94,4%`; ausente → `—`; > 0 que redondea a 0 → `<0,1%`. */
export const formatPercent = (value: number | null | undefined, decimals = 1): string => {
  const numeric = toNumberOrNull(value)
  const rounded = roundNumber(numeric, decimals)
  if (rounded === null) return '—'
  if (rounded === 0 && numeric !== null && numeric > 0) {
    return `<${formatNumber(10 ** -decimals, decimals)}%`
  }
  return `${formatNumber(rounded, decimals)}%`
}

/** Variación con signo (`+58,8%` / `-66,7%`); ausente → `—`. */
export const formatSignedPercent = (value: number | null | undefined, decimals = 1): string => {
  const numeric = toNumberOrNull(value)
  if (numeric === null) return '—'
  const formatted = formatPercent(numeric, decimals)
  if (formatted === '—') return formatted
  return numeric > 0 ? `+${formatted}` : formatted
}

/** Conteo con separador de miles; ausente → `—`. */
export const formatCount = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : formatNumber(numeric, 0)
}

/** Decimal con N dígitos (MAE de unidades, R²); ausente → `—`. */
export const formatDecimal = (value: number | null | undefined, decimals = 2): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : formatNumber(numeric, decimals)
}

/** Monto del BE que puede traer centavos (MAE/RMSE de ventas). */
export const formatForecastMoney = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  if (numeric === null) return '—'
  if (Math.abs(numeric) < 1) return formatMoney(numeric)
  return `Gs. ${formatNumber(numeric, 0)}`
}

/** Fecha ISO inválida o el cero de Go (`0001-01-01`) no son fechas reales. */
export const isMissingDate = (value: string | null | undefined): boolean => {
  if (!value) return true
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return true
  return date.getUTCFullYear() <= 1
}

/** Bucket date-only en UTC (`ene 2026`). */
export const formatMonthYear = (
  value: string | null | undefined,
  locale?: string,
): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleDateString(toIntlLocale(locale), {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Fecha date-only en UTC (`20 oct 2026`). */
export const formatUtcDate = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleDateString(toIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Timestamp → fecha + hora local (`21 oct 2026, 15:03`). */
export const formatDateTime = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleString(toIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Rango de historial (`history_period`): el BE usa `now` como fin, no un fin
 * exclusivo, así que ambos extremos se muestran tal cual.
 */
export const formatHistoryRange = (
  period: BIReportPeriod | null | undefined,
  locale?: string,
): string => {
  if (!period?.start_date || !period?.end_date) return '—'
  const start = new Date(period.start_date)
  const end = new Date(period.end_date)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—'
  const format = (date: Date) =>
    date.toLocaleDateString(toIntlLocale(locale), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  return `${format(start)} – ${format(end)}`
}

/** Valor de KPI ya formateado según su tipo. */
export const formatForecastKpiValue = (row: ForecastKpiValue): string => {
  switch (row.kind) {
    case 'money':
      return formatMoney(row.value)
    case 'percent':
      return formatPercent(row.value)
    case 'percentSigned':
      return formatSignedPercent(row.value)
    case 'count':
      return formatCount(row.value)
    case 'decimal':
      return formatDecimal(row.value, 1)
    case 'ratio':
      return formatDecimal(row.value, 2)
    case 'text':
      return row.text && row.text.trim() !== '' ? row.text : '—'
    default:
      return '—'
  }
}

/** Timestamp → fecha local sin hora (`21 oct 2026`). */
export const formatLocalDate = (
  value: string | null | undefined,
  locale?: string,
): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleDateString(toIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
