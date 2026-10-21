/**
 * Formateadores puros de Auditoría (F10).
 *
 * Reglas anti-invención: un `null`/ausente se muestra `—` (nunca un cero
 * silencioso); un `0` real se muestra `0`. Fechas:
 *  - `timestamp`, `occurred_at`, `last_occurred`, `last_activity`, etc. son
 *    instantes reales (`timestamptz`) y se formatean en la zona del navegador;
 *  - los buckets `DATE(...)` de `trends`/`actions_by_day` son date-only
 *    serializados a medianoche UTC: se formatean en UTC para no correr un día
 *    en zonas negativas como America/Asuncion.
 *
 * Los porcentajes se redondean a 1 decimal; un valor real > 0 que redondea a
 * 0 se muestra `<0,1%` (no `0%`).
 */
import { formatNumber } from '@/utils/currencyUtils'

/** Número finito o `null` (los `null` de Go y los `undefined` no son ceros). */
export const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

/** Redondeo de presentación (evita 94.44444444444444). */
export const roundPercent = (value: number | null | undefined, decimals = 1): number | null => {
  const numeric = toNumberOrNull(value)
  if (numeric === null) return null
  const factor = 10 ** decimals
  return Math.round(numeric * factor) / factor
}

/** Conteo con separador de miles; ausente → `—`. */
export const formatCount = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : formatNumber(numeric, 0)
}

/** Decimal con N dígitos (promedios); ausente → `—`. */
export const formatDecimal = (value: number | null | undefined, decimals = 2): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : formatNumber(numeric, decimals)
}

/** `94,4%`; ausente → `—`; > 0 que redondea a 0 → `<0,1%`. */
export const formatPercent = (value: number | null | undefined, decimals = 1): string => {
  const numeric = toNumberOrNull(value)
  const rounded = roundPercent(numeric, decimals)
  if (rounded === null) return '—'
  if (rounded === 0 && numeric !== null && numeric > 0) {
    return `<${formatNumber(10 ** -decimals, decimals)}%`
  }
  return `${formatNumber(rounded, decimals)}%`
}

/**
 * Tasa de éxito: el BE la calcula (`kpis.success_rate`) y en la ficha de
 * usuario se deriva de exitosas/total. Sin acciones no hay tasa: `n/d`
 * (un `0%` sugeriría que todo falló).
 */
export const formatSuccessRate = (
  total: number | null | undefined,
  successful?: number | null,
  rate?: number | null,
): string => {
  const totalActions = toNumberOrNull(total)
  if (totalActions === null || totalActions <= 0) return 'n/d'
  const explicit = toNumberOrNull(rate)
  if (explicit !== null) return formatPercent(explicit)
  const ok = toNumberOrNull(successful)
  if (ok === null) return 'n/d'
  return formatPercent((ok / totalActions) * 100)
}

/** Hora del wall clock de negocio (`19` → `19:00`); sin acciones → `—`. */
export const formatHour = (hour: number | null | undefined): string => {
  const numeric = toNumberOrNull(hour)
  if (numeric === null || numeric < 0 || numeric > 23) return '—'
  return `${String(numeric).padStart(2, '0')}:00`
}

/** Duración registrada en ms; ausente → `—` (0 ms es un valor real). */
export const formatDuration = (value: number | null | undefined): string => {
  const numeric = toNumberOrNull(value)
  return numeric === null ? '—' : `${formatNumber(numeric, 0)} ms`
}

/** Fecha ISO inválida o el cero de Go (`0001-01-01`) no son fechas reales. */
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

/** Timestamp ISO → fecha + hora local (`20 oct 2026, 08:25`). */
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

/** Hora local de un timestamp (`08:25`); fecha inválida → `—`. */
export const formatTime = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleTimeString(locale || undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Fecha date-only en UTC (`20 oct 2026`). */
export const formatUtcDate = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Día/mes de una fecha date-only en UTC (`20 oct`). */
export const formatUtcDayMonth = (value: string | null | undefined, locale?: string): string => {
  if (isMissingDate(value)) return '—'
  return new Date(value as string).toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })
}

/** Fecha local `YYYY-MM-DD` (comparar días sin arrastrar horas). */
export const toLocalDateKey = (value: Date): string =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
    value.getDate(),
  ).padStart(2, '0')}`

/** Suma (o resta) días calendario a una fecha local. */
export const addLocalDays = (value: Date, days: number): Date => {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

/**
 * Rango aplicado por el BE (`period.start_date`/`period.end_date`, fin
 * EXCLUSIVO) → `1 oct 2026 – 31 oct 2026` en hora local. Con `today` el
 * rango muestra el mismo día en ambos extremos.
 */
export const formatAuditPeriodRange = (
  period: { start_date?: string | null; end_date?: string | null } | null | undefined,
  locale?: string,
): string => {
  if (!period?.start_date || !period?.end_date) return '—'
  const start = new Date(period.start_date)
  const end = new Date(period.end_date)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—'
  const inclusiveEnd = new Date(end)
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1)
  const format = (date: Date) =>
    date.toLocaleDateString(locale || undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  return `${format(start)} – ${format(inclusiveEnd)}`
}
