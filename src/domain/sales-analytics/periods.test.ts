import { describe, expect, it } from 'vitest'
import {
  addDays,
  formatCalendarDate,
  granularityForPeriod,
  isSalesPeriod,
  isValidDateRange,
  isValidIsoDate,
  lastDaysRange,
  parseCalendarDate,
  previousCalendarDay,
  SALES_DEFAULT_PERIOD,
  toIsoDate,
} from './periods'

describe('períodos de ventas', () => {
  it('acepta solo los 4 períodos del BE', () => {
    expect(isSalesPeriod('today')).toBe(true)
    expect(isSalesPeriod('week')).toBe(true)
    expect(isSalesPeriod('quarter')).toBe(false)
    expect(isSalesPeriod(null)).toBe(false)
  })

  it('el default es el mes (mismo default del BE)', () => {
    expect(SALES_DEFAULT_PERIOD).toBe('month')
  })

  it('la granularidad evita series truncadas', () => {
    expect(granularityForPeriod('today')).toBe('hourly')
    expect(granularityForPeriod('week')).toBe('daily')
    expect(granularityForPeriod('month')).toBe('daily')
    expect(granularityForPeriod('year')).toBe('monthly')
  })
})

describe('fechas de calendario', () => {
  it('toIsoDate usa la fecha local (no UTC)', () => {
    expect(toIsoDate(new Date(2026, 9, 20, 23, 30))).toBe('2026-10-20')
    expect(toIsoDate(new Date(2026, 0, 1, 0, 10))).toBe('2026-01-01')
  })

  it('addDays no muta la fecha original', () => {
    const original = new Date(2026, 9, 20)
    const next = addDays(original, -30)
    expect(toIsoDate(original)).toBe('2026-10-20')
    expect(toIsoDate(next)).toBe('2026-09-20')
  })

  it('lastDaysRange incluye hoy y cubre N días', () => {
    expect(lastDaysRange(new Date(2026, 9, 20), 30)).toEqual({
      start_date: '2026-09-21',
      end_date: '2026-10-20',
    })
  })

  it('valida fechas reales y rangos ordenados', () => {
    expect(isValidIsoDate('2026-10-20')).toBe(true)
    expect(isValidIsoDate('2026-02-31')).toBe(false)
    expect(isValidIsoDate('20/10/2026')).toBe(false)
    expect(isValidDateRange('2026-09-01', '2026-09-30')).toBe(true)
    expect(isValidDateRange('2026-09-30', '2026-09-01')).toBe(false)
    expect(isValidDateRange('', '2026-09-01')).toBe(false)
  })

  it('el fin exclusivo del BE se muestra con el día inclusive', () => {
    expect(previousCalendarDay('2026-11-01')).toBe('2026-10-31')
    expect(previousCalendarDay('2026-01-01')).toBe('2025-12-31')
    expect(previousCalendarDay('garbage')).toBeNull()
  })

  it('parseCalendarDate interpreta el día de calendario, no UTC', () => {
    const date = parseCalendarDate('2026-11-01')
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(10)
    expect(date?.getDate()).toBe(1)
  })

  it('formatCalendarDate no corre el día en husos negativos', () => {
    expect(formatCalendarDate('2026-11-01', 'es-AR')).toContain('01')
    expect(formatCalendarDate('', 'es-AR')).toBe('—')
  })
})
