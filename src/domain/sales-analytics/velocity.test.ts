import { describe, expect, it } from 'vitest'
import type { DayOfWeekSales, HourlySales, VelocityMetrics } from '@/types/bi'
import {
  buildHourlyPoints,
  buildVelocityKpis,
  buildWeekdayPoints,
  DAY_KEYS,
  getBestWeekday,
  getSelloutState,
  velocityLevelKey,
} from './velocity'

const OVERALL: VelocityMetrics = {
  sales_per_day: 30201.5,
  sales_per_hour: 1258.4,
  transactions_per_day: 0.4,
  transactions_per_hour: 0.02,
  units_per_day: 0.5,
  units_per_hour: 0.02,
  avg_minutes_between_sales: 5400,
}

const HOURLY: HourlySales[] = [
  { hour: 9, sales: 100000, transactions: 1, percentage: 33.3 },
  { hour: 14, sales: 200000, transactions: 2, percentage: 66.7 },
]

const WEEKDAY: DayOfWeekSales[] = [
  {
    day_of_week: 1,
    day_name: 'Lunes',
    sales: 100000,
    transactions: 1,
    average_ticket: 100000,
    percentage: 25,
  },
  {
    day_of_week: 5,
    day_name: 'Viernes',
    sales: 300000,
    transactions: 3,
    average_ticket: 100000,
    percentage: 75,
  },
]

describe('buildVelocityKpis', () => {
  it('arma las 5 métricas con sus tipos', () => {
    const rows = buildVelocityKpis(OVERALL)
    expect(rows.map((row) => row.id)).toEqual([
      'salesPerDay',
      'salesPerHour',
      'transactionsPerDay',
      'unitsPerDay',
      'avgBetween',
    ])
    expect(rows.map((row) => row.kind)).toEqual([
      'money',
      'money',
      'count',
      'units',
      'duration',
    ])
  })

  it('sin overall no inventa filas', () => {
    expect(buildVelocityKpis(null)).toEqual([])
  })
})

describe('buildHourlyPoints', () => {
  it('completa las 24 horas con 0 donde no hubo ventas', () => {
    const points = buildHourlyPoints(HOURLY, 14)
    expect(points).toHaveLength(24)
    expect(points[0].value).toBe(0)
    expect(points[9].value).toBe(100000)
    expect(points[14].value).toBe(200000)
    expect(points[14].secondary).toBe(2)
  })

  it('marca solo la hora pico real y con ventas', () => {
    const points = buildHourlyPoints(HOURLY, 14)
    expect(points.filter((point) => point.highlight).map((point) => point.key)).toEqual([
      'hour-14',
    ])
    expect(points[14].label).toBe('14:00')
  })

  it('sin datos deja todas las horas en 0', () => {
    const points = buildHourlyPoints(null, 0)
    expect(points).toHaveLength(24)
    expect(points.every((point) => point.value === 0)).toBe(true)
    expect(points.some((point) => point.highlight)).toBe(false)
  })
})

describe('buildWeekdayPoints', () => {
  it('completa domingo→sábado con claves de día traducibles', () => {
    const points = buildWeekdayPoints(WEEKDAY)
    expect(points).toHaveLength(7)
    expect(points.map((point) => point.dayKey)).toEqual([...DAY_KEYS])
    expect(points[1].value).toBe(100000)
    expect(points[5].value).toBe(300000)
    expect(points[0].value).toBe(0)
  })

  it('marca el día con más ventas', () => {
    const points = buildWeekdayPoints(WEEKDAY)
    expect(points.filter((point) => point.highlight).map((point) => point.key)).toEqual([
      'day-5',
    ])
  })

  it('getBestWeekday devuelve null sin ventas', () => {
    expect(getBestWeekday(WEEKDAY)).toBe(5)
    expect(getBestWeekday([])).toBeNull()
    expect(getBestWeekday(null)).toBeNull()
  })
})

describe('velocityLevelKey', () => {
  it('mapea las clasificaciones del BE', () => {
    expect(velocityLevelKey('FAST')).toBe('fast')
    expect(velocityLevelKey('MEDIUM')).toBe('medium')
    expect(velocityLevelKey('SLOW')).toBe('slow')
    expect(velocityLevelKey('')).toBe('slow')
  })
})

describe('getSelloutState', () => {
  it('stock 0 es sin stock; stock positivo usa los días del BE', () => {
    expect(getSelloutState(0, 0)).toEqual({ kind: 'out' })
    expect(getSelloutState(10, 5.2)).toEqual({ kind: 'days', days: 5.2 })
  })

  it('sin stock informado no afirma "sin stock"', () => {
    expect(getSelloutState(undefined, undefined)).toEqual({ kind: 'unknown' })
    expect(getSelloutState(10, 0)).toEqual({ kind: 'unknown' })
    expect(getSelloutState(10, undefined)).toEqual({ kind: 'unknown' })
  })
})
