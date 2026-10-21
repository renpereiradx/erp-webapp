/**
 * Formateadores puros de Cuentas por Pagar (F8).
 *
 * Reglas del plan anti-invención: montos SIEMPRE por `formatPYG` (nunca `$`),
 * porcentajes redondeados, fechas con el locale de la UI y `—` cuando el dato
 * no existe. Cero `0` silencioso: el `0` real se muestra como `0`.
 *
 * Dos clases de fecha conviven en el contrato:
 *  - timestamps reales (`purchase_date`, `payment_date`, `generated_at`,
 *    `oldest_debt`): se formatean en la zona del navegador;
 *  - fechas date-only serializadas a medianoche UTC (`schedule[].date`,
 *    `cash-flow.projection_days[].date`, `payment_trend[].date`): se formatean
 *    en UTC para no correr un día en zonas negativas como America/Asuncion.
 */
import { formatNumber, formatPYG } from '@/utils/currencyUtils'

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

/**
 * Un saldo entre -1 y 1 Gs existe (el BE guarda centavos por IVA) pero
 * `formatPYG` lo redondearía a 0: se muestran 2 decimales para no convertir un
 * saldo real de 0,38 en un "Gs. 0" que parece saldado.
 */
const SUB_UNIT_FORMATTER = new Intl.NumberFormat('es-PY', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Monto en guaraníes; ausente → `—` (nunca un cero inventado). */
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

/** Conteo con separador de miles; ausente → `—`. */
export const formatCount = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : formatNumber(numeric, 0)
}

/** Días como entero; ausente → `—`. `0` es un valor real (vence hoy). */
export const formatDays = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : formatNumber(Math.round(numeric), 0)
}

/** Ratio de cobertura `1,4×`; sin pagos esperados no hay ratio (`—`). */
export const formatRatio = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  if (numeric === null) return '—'
  return `${formatNumber(numeric, 2)}×`
}

/** Fecha ISO inválida o el cero de Go (`0001-01-01`) no son una fecha real. */
export const isMissingDate = (value: string | null | undefined): boolean => {
  if (!value) return true
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return true
  return date.getUTCFullYear() <= 1
}

/** Timestamp ISO → fecha local con el locale de la UI (`20 oct 2026`). */
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

/** Día/mes de una fecha date-only en UTC (`28 sept`). */
export const formatUtcDayMonth = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
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

/**
 * `statistics.period` llega como `"YYYY-MM-DD - YYYY-MM-DD"` con fin
 * EXCLUSIVO. Se parsea tal cual (son fechas date-only del BE, no instantes).
 */
export const parseStatisticsRange = (
  period: string | null | undefined,
): { start: string; end: string } | null => {
  if (!period) return null
  const match = /^(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})$/.exec(period.trim())
  if (!match) return null
  return { start: match[1], end: match[2] }
}

/** Día anterior a una fecha date-only (el fin del rango es exclusivo). */
export const previousDay = (value: string): string => {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

/** Rango aplicado `1 oct 2026 – 31 oct 2026` (fin inclusivo), en UTC. */
export const formatRange = (
  start: string | null | undefined,
  end: string | null | undefined,
  locale?: string,
): string => {
  if (isMissingDate(start) || isMissingDate(end)) return '—'
  return `${formatUtcDate(start, locale)} – ${formatUtcDate(previousDay(end as string), locale)}`
}

/** Fecha local `YYYY-MM-DD` (comparar días sin arrastrar horas). */
const localDayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/**
 * Días calendario desde una fecha hasta hoy. Se usa para derivar la antigüedad
 * de la deuda más vieja y los días hasta un vencimiento date-only.
 */
export const daysSince = (value: string | null | undefined, now: Date = new Date()): number | null => {
  if (isMissingDate(value)) return null
  const date = new Date(value as string)
  const diffMs = new Date(localDayKey(now)).getTime() - new Date(localDayKey(date)).getTime()
  const days = Math.round(diffMs / 86_400_000)
  return days < 0 ? 0 : days
}

/** Fecha date-only `YYYY-MM-DD` en UTC → `YYYY-MM-DD` (sin arrastre de zona). */
export const toUtcDateKey = (value: string | null | undefined): string | null => {
  if (isMissingDate(value)) return null
  return new Date(value as string).toISOString().slice(0, 10)
}
