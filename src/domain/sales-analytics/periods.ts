/**
 * Períodos y fechas de Analítica de Ventas.
 *
 * OJO con la semántica del BE: `/sales-analytics/*` usa `NewPeriodRolling`
 * (`internal/analytics/domain.go`), así que `week` son los ÚLTIMOS 7 DÍAS
 * (rolling), mientras que `month`/`year` son calendario y `today` el día
 * calendario. El label de cada período debe decirlo; no se inventan ventanas.
 */
import type { DashboardPeriod, SalesTrendGranularity } from '@/types/bi'

export const SALES_PERIODS: readonly DashboardPeriod[] = ['today', 'week', 'month', 'year']

export const SALES_DEFAULT_PERIOD: DashboardPeriod = 'month'

export const isSalesPeriod = (value: unknown): value is DashboardPeriod =>
  typeof value === 'string' && (SALES_PERIODS as readonly string[]).includes(value)

/**
 * Granularidad de la serie. `year` pide meses porque
 * `GET /sales-analytics/trends` agrupa por período; el `trends` embebido en
 * `/sales-analytics/dashboard` corta a 30 días (engañoso para un año).
 */
export const granularityForPeriod = (period: DashboardPeriod): SalesTrendGranularity => {
  if (period === 'today') return 'hourly'
  if (period === 'year') return 'monthly'
  return 'daily'
}

/** YYYY-MM-DD con la fecha LOCAL (no `toISOString`, que cambia de día). */
export const toIsoDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Suma días de calendario sin mutar la fecha original. */
export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date.getTime())
  next.setDate(next.getDate() + days)
  return next
}

/** Rango inclusivo de los últimos `days` días que termina hoy. */
export const lastDaysRange = (today: Date, days: number): { start_date: string; end_date: string } => {
  const safeDays = Number.isFinite(days) && days > 0 ? Math.trunc(days) : 30
  return {
    start_date: toIsoDate(addDays(today, -(safeDays - 1))),
    end_date: toIsoDate(today),
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** YYYY-MM-DD sintácticamente válido y con fecha real (no 2026-02-31). */
export const isValidIsoDate = (value: string | null | undefined): value is string => {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  )
}

/** Rango válido: ambas fechas reales y `start <= end`. */
export const isValidDateRange = (
  start: string | null | undefined,
  end: string | null | undefined,
): boolean => {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return false
  return start <= end
}

/**
 * Fecha de calendario (YYYY-MM-DD) → Date LOCAL. `new Date('2026-11-01')`
 * parsea como medianoche UTC y en UTC-3 cae el día anterior; los rangos de
 * período del BE (`time.Parse`) son exactamente ese caso.
 */
export const parseCalendarDate = (value: string | null | undefined): Date | null => {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

/** Día de calendario anterior en formato YYYY-MM-DD (sin TZ). */
export const previousCalendarDay = (value: string | null | undefined): string | null => {
  const date = parseCalendarDate(value)
  if (!date) return null
  date.setDate(date.getDate() - 1)
  return toIsoDate(date)
}

/** Fecha de calendario YYYY-MM-DD → texto con el locale de la UI. */
export const formatCalendarDate = (
  value: string | null | undefined,
  locale?: string,
): string => {
  const date = parseCalendarDate(value)
  if (!date) return '—'
  return date.toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
