/**
 * Formateadores puros de Rentabilidad (F6).
 *
 * Reglas del plan anti-invención: montos SIEMPRE por `formatPYG` (nunca `$`),
 * porcentajes redondeados (la auditoría 2026-09 encontró floats crudos),
 * fechas con el locale de la UI y `—` cuando el dato no existe.
 *
 * Dos clases de fecha conviven en el contrato:
 *  - timestamps reales (`last_purchase`, `generated_at`, período): se muestran
 *    en la zona del navegador;
 *  - fechas "date-only" serializadas a medianoche UTC (`data_points[].date`,
 *    producto de un `DATE()` de Postgres): se formatean en UTC para no correr
 *    un día en zonas negativas como America/Asuncion.
 */
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import type { ProfitabilityReportPeriod, ProfitabilityTrendGranularity } from '@/types/bi'

/** Número finito o `null` (los `null` de Go y los `undefined` no son ceros). */
export const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

/** Redondeo de presentación para porcentajes (evita 35.95391392748221). */
export const roundPercent = (value: number | null | undefined, decimals = 1): number | null => {
  const numeric = toNumberOrNull(value)
  if (numeric === null) return null
  const factor = 10 ** decimals
  return Math.round(numeric * factor) / factor
}

/** Monto en guaraníes; ausente → `—` (nunca un cero inventado). */
export const formatMoney = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : formatPYG(numeric)
}

/** `35,9%`; ausente → `—`. */
export const formatPercent = (value: number | null | undefined, decimals = 1): string => {
  const rounded = roundPercent(value, decimals)
  return rounded === null ? '—' : `${formatNumber(rounded, decimals)}%`
}

/** `+51,1%` / `-2,2%` / `0%` — variación con signo explícito. */
export const formatSignedPercent = (value: number | null | undefined, decimals = 1): string => {
  const rounded = roundPercent(value, decimals)
  if (rounded === null) return '—'
  const formatted = formatNumber(rounded, decimals)
  return rounded > 0 ? `+${formatted}%` : `${formatted}%`
}

/** Conteo con separador de miles; ausente → `—`. */
export const formatCount = (value: number | null | undefined, decimals = 0): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : formatNumber(numeric, decimals)
}

/**
 * Unidades normalizadas. `0` del BE significa "sin conversión a unidad base"
 * (F4/F5): al lado de un importe real se muestra `—`, no "0 uds.".
 */
export const formatUnits = (value: number | null | undefined, decimals = 2): string => {
  const numeric = toNumberOrNull(value)
  if (numeric === null || numeric <= 0) return '—'
  return formatNumber(numeric, decimals)
}

/** Días como entero; ausente → `—`. `0` es un valor real (compró hoy). */
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

/** Timestamp ISO → fecha local con el locale de la UI (`20 oct 2026`). */
export const formatIsoDate = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  const date = new Date(value as string)
  return date.toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const UTC = 'UTC'

/** Día/mes de una fecha date-only en UTC (`01 oct`). */
export const formatUtcDayMonth = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    timeZone: UTC,
  })
}

/** Mes/año de una fecha date-only en UTC (`oct 2026`). */
export const formatUtcMonth = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleDateString(locale || undefined, {
    month: 'short',
    year: 'numeric',
    timeZone: UTC,
  })
}

/**
 * Etiqueta del bucket de tendencia. Se deriva de `date` (no de `label`, que el
 * BE emite en inglés con `to_char`) y en UTC porque es una fecha date-only.
 */
export const formatTrendDate = (
  value: string | null | undefined,
  granularity: ProfitabilityTrendGranularity,
  locale?: string,
): string => {
  if (granularity === 'monthly') return formatUtcMonth(value, locale)
  return formatUtcDayMonth(value, locale)
}

/** Fecha local `YYYY-MM-DD` (para comparar días sin arrastrar horas). */
const localDayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/**
 * Días calendario transcurridos desde `lastPurchase` hasta `now`. Se deriva de
 * la fecha real porque `days_since_last_purchase` del BE usaba EXTRACT(DAY)
 * (componente día del intervalo, no días totales).
 */
export const daysSince = (
  lastPurchase: string | null | undefined,
  now: Date = new Date(),
): number | null => {
  if (isMissingDate(lastPurchase)) return null
  const last = new Date(lastPurchase as string)
  const diffMs = new Date(localDayKey(now)).getTime() - new Date(localDayKey(last)).getTime()
  const days = Math.round(diffMs / 86_400_000)
  return days < 0 ? 0 : days
}

/** `end_date` del BE es exclusivo: el último día mostrado es el anterior. */
export const inclusiveEndDate = (endDate: string | null | undefined, locale?: string): string => {
  if (isMissingDate(endDate)) return '—'
  const end = new Date(endDate as string)
  end.setDate(end.getDate() - 1)
  return end.toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Rango aplicado por el BE (`1 oct 2026 – 31 oct 2026`), con fin inclusivo. */
export const formatPeriodRange = (
  period: ProfitabilityReportPeriod | null | undefined,
  locale?: string,
): string => {
  if (!period || isMissingDate(period.start_date) || isMissingDate(period.end_date)) {
    return '—'
  }
  const start = new Date(period.start_date).toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return `${start} – ${inclusiveEndDate(period.end_date, locale)}`
}
