/**
 * Derivaciones de velocidad de ventas
 * (`GET /sales-analytics/velocity`, `/by-hour`, `/by-day-of-week`).
 *
 * `avg_minutes_between_sales` se calcula sobre TODAS las horas del período
 * (incluye noches sin ventas): la UI lo dice con el label "tiempo promedio
 * entre ventas del período", no "en horario comercial".
 */
import type {
  DayOfWeekSales,
  HourlySales,
  VelocityMetrics,
} from '@/types/bi'
import { formatHour } from './format'

export type VelocityKpiId =
  | 'salesPerDay'
  | 'salesPerHour'
  | 'transactionsPerDay'
  | 'unitsPerDay'
  | 'avgBetween'

export interface VelocityKpiRow {
  id: VelocityKpiId
  kind: 'money' | 'count' | 'units' | 'duration'
  value: number
}

const toNumber = (value: number | null | undefined): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

/** Filas del ledger de velocidad, en orden de lectura fijo. */
export const buildVelocityKpis = (
  overall: VelocityMetrics | null | undefined,
): VelocityKpiRow[] => {
  if (!overall) return []
  return [
    { id: 'salesPerDay', kind: 'money', value: toNumber(overall.sales_per_day) },
    { id: 'salesPerHour', kind: 'money', value: toNumber(overall.sales_per_hour) },
    {
      id: 'transactionsPerDay',
      kind: 'count',
      value: toNumber(overall.transactions_per_day),
    },
    { id: 'unitsPerDay', kind: 'units', value: toNumber(overall.units_per_day) },
    {
      id: 'avgBetween',
      kind: 'duration',
      value: toNumber(overall.avg_minutes_between_sales),
    },
  ]
}

export interface ProfilePoint {
  key: string
  /** Label ya resuelto (hora) o clave de día para traducir en el componente. */
  label: string
  /** Identifica los días para la traducción (`sunday`…`saturday`). */
  dayKey?: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
  value: number
  secondary: number
  highlight: boolean
}

export const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

/** 24 puntos, incluyendo las horas sin ventas (0 real, no ausencia). */
export const buildHourlyPoints = (
  data: HourlySales[] | null | undefined,
  peakHour: number | null | undefined,
): ProfilePoint[] => {
  const byHour = new Map<number, HourlySales>()
  for (const entry of data ?? []) {
    if (Number.isInteger(entry.hour) && entry.hour >= 0 && entry.hour <= 23) {
      byHour.set(entry.hour, entry)
    }
  }
  const peak = Number(peakHour)
  return Array.from({ length: 24 }, (_, hour) => {
    const entry = byHour.get(hour)
    const value = toNumber(entry?.sales)
    return {
      key: `hour-${hour}`,
      label: formatHour(hour),
      value,
      secondary: toNumber(entry?.transactions),
      highlight: Number.isInteger(peak) && peak === hour && value > 0,
    }
  })
}

/** Índice del día con más ventas, o `null` si no hubo ventas. */
export const getBestWeekday = (
  data: DayOfWeekSales[] | null | undefined,
): number | null => {
  let best: number | null = null
  let bestValue = 0
  for (const entry of data ?? []) {
    if (!Number.isInteger(entry.day_of_week) || entry.day_of_week < 0 || entry.day_of_week > 6) {
      continue
    }
    const value = toNumber(entry.sales)
    if (value > bestValue) {
      bestValue = value
      best = entry.day_of_week
    }
  }
  return best
}

/** 7 puntos domingo→sábado; los días sin ventas se muestran en 0. */
export const buildWeekdayPoints = (
  data: DayOfWeekSales[] | null | undefined,
): ProfilePoint[] => {
  const byDay = new Map<number, DayOfWeekSales>()
  for (const entry of data ?? []) {
    if (Number.isInteger(entry.day_of_week) && entry.day_of_week >= 0 && entry.day_of_week <= 6) {
      byDay.set(entry.day_of_week, entry)
    }
  }
  const best = getBestWeekday(data)
  return Array.from({ length: 7 }, (_, day) => {
    const entry = byDay.get(day)
    const value = toNumber(entry?.sales)
    return {
      key: `day-${day}`,
      label: entry?.day_name || DAY_KEYS[day],
      dayKey: DAY_KEYS[day],
      value,
      secondary: toNumber(entry?.transactions),
      highlight: best === day && value > 0,
    }
  })
}

export type VelocityLevelKey = 'fast' | 'medium' | 'slow'

/** `FAST|MEDIUM|SLOW` del BE (umbrales 5/1 uds./día) → clave i18n. */
export const velocityLevelKey = (value: string | null | undefined): VelocityLevelKey => {
  switch ((value || '').toUpperCase()) {
    case 'FAST':
      return 'fast'
    case 'MEDIUM':
      return 'medium'
    default:
      return 'slow'
  }
}

export type SelloutState =
  | { kind: 'out' }
  | { kind: 'days'; days: number }
  | { kind: 'unknown' }

/**
 * Días para agotar stock: stock 0 → "sin stock"; días 0 con stock positivo es
 * un cálculo degenerado del BE y se muestra como desconocido.
 */
export const getSelloutState = (
  currentStock: number | null | undefined,
  daysToSellout: number | null | undefined,
): SelloutState => {
  const stock = Number(currentStock)
  if (!Number.isFinite(stock)) return { kind: 'unknown' }
  if (stock <= 0) return { kind: 'out' }
  const days = Number(daysToSellout)
  if (!Number.isFinite(days) || days <= 0) return { kind: 'unknown' }
  return { kind: 'days', days }
}
