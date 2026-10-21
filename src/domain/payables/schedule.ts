/**
 * Calendario de pagos (F8).
 *
 * `GET /payables/schedule?days=N` agrupa los vencimientos (compra + 30 días)
 * entre hoy y hoy+N. El slice sale de un `map` de Go, así que **llega sin
 * ordenar**: el orden se fija acá, no en la presentación. Los ítems de cada
 * día se ordenan por monto desc (el SQL los emite así antes de agrupar).
 */
import type { PaymentCalendar, PaymentSchedule, PaymentScheduleItem } from '@/types/bi'
import { isMissingDate } from './format'

export interface ScheduleItemRow extends PaymentScheduleItem {
  /** Fecha date-only del día (UTC). */
  date: string
}

const itemsOf = (day: PaymentSchedule): PaymentScheduleItem[] =>
  Array.isArray(day.items) ? day.items : []

/** Días ordenados por fecha asc; ítems por monto desc. Sin mutar el payload. */
export const sortedScheduleDays = (
  schedule: PaymentSchedule[] | null | undefined,
): PaymentSchedule[] => {
  if (!Array.isArray(schedule)) return []
  return schedule
    .filter((day) => !isMissingDate(day.date) && itemsOf(day).length > 0)
    .map((day) => ({
      ...day,
      items: itemsOf(day).slice().sort((a, b) => Number(b.amount ?? 0) - Number(a.amount ?? 0)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Filas planas de vencimientos (día + proveedor + monto) para una tabla. */
export const scheduleItemRows = (
  calendar: PaymentCalendar | null | undefined,
  limit?: number,
): ScheduleItemRow[] => {
  const rows = sortedScheduleDays(calendar?.schedule).flatMap((day) =>
    itemsOf(day).map((item) => ({ ...item, date: day.date })),
  )
  rows.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date)
    return byDate !== 0 ? byDate : Number(b.amount ?? 0) - Number(a.amount ?? 0)
  })
  return typeof limit === 'number' ? rows.slice(0, limit) : rows
}

export interface ScheduleTotals {
  totalDue: number
  dayCount: number
  itemCount: number
}

/** Totales del calendario: el monto es el del payload (no se re-suma). */
export const scheduleTotals = (
  calendar: PaymentCalendar | null | undefined,
): ScheduleTotals => {
  const days = sortedScheduleDays(calendar?.schedule)
  return {
    totalDue: Number(calendar?.total_due ?? 0),
    dayCount: days.length,
    itemCount: days.reduce((sum, day) => sum + itemsOf(day).length, 0),
  }
}
