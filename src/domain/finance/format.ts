/**
 * Formateadores puros de Reportes Financieros (F9).
 *
 * Montos SIEMPRE en guaraníes (`formatPYG`), porcentajes redondeados y `—`
 * cuando el campo no existe. `0` real se muestra como `0`.
 *
 * Dos clases de fecha conviven en el contrato:
 *  - timestamps (`period.start_date/end_date`, `health.period_*`, `generated`):
 *    se formatean en la zona del navegador;
 *  - fechas date-only serializadas a medianoche UTC (`monthly_breakdown[].month`,
 *    `daily_breakdown[].date`): se formatean en UTC para no correr un día en
 *    zonas negativas como America/Asuncion.
 */
import { formatNumber, formatPYG } from '@/utils/currencyUtils'

/** Número finito o `null` (los `null` de Go y los `undefined` no son ceros). */
export const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

/** Redondeo de presentación (evita 35.95391392748221 en la UI). */
export const roundPercent = (value: number | null | undefined, decimals = 1): number | null => {
  const numeric = toNumberOrNull(value)
  if (numeric === null) return null
  const factor = 10 ** decimals
  return Math.round(numeric * factor) / factor
}

const SUB_UNIT_FORMATTER = new Intl.NumberFormat('es-PY', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Monto en guaraníes; ausente → `—`. Un saldo <1 conserva 2 decimales. */
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

/** `35,9%`; ausente → `—`; un valor >0 que redondea a 0 se muestra `<0,1%`. */
export const formatPercent = (value: number | null | undefined, decimals = 1): string => {
  const numeric = toNumberOrNull(value)
  const rounded = roundPercent(numeric, decimals)
  if (rounded === null) return '—'
  if (rounded === 0 && numeric !== null && numeric > 0) {
    return `<${formatNumber(10 ** -decimals, decimals)}%`
  }
  return `${formatNumber(rounded, decimals)}%`
}

/** Ratio `4,51×`; ausente → `—`. */
export const formatRatio = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : `${formatNumber(numeric, 2)}×`
}

/** Conteo con separador de miles; ausente → `—`. */
export const formatCount = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : formatNumber(numeric, 0)
}

/** Fecha ISO inválida o el cero de Go (`0001-01-01`) no son una fecha real. */
export const isMissingDate = (value: string | null | undefined): boolean => {
  if (!value) return true
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return true
  return date.getUTCFullYear() <= 1
}

/** Timestamp ISO → fecha local (`20 oct 2026`). */
export const formatDate = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Timestamp ISO → fecha + hora local (`20 oct 2026, 15:04`). */
export const formatDateTime = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Fecha date-only en UTC (`28 sept 2026`). */
export const formatUtcDate = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Día/mes de una fecha date-only en UTC (`28 sept`). */
export const formatUtcDayMonth = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })
}

/** Mes y año de una fecha date-only en UTC (`oct 2026`). */
export const formatUtcMonth = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleDateString(locale || undefined, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** `YYYY-MM-DD` local de un instante (para inputs date). */
export const toLocalDateInput = (value: string | null | undefined): string => {
  if (isMissingDate(value)) return ''
  const date = new Date(value as string)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}
