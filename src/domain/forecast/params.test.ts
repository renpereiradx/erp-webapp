import { describe, expect, it } from 'vitest'
import {
  isForecastGranularity,
  isForecastMethod,
  normalizeDemandMonths,
  normalizeForecastMonths,
  normalizeInventoryDays,
  normalizePage,
  normalizeRevenueMonths,
  normalizeSalesSelection,
  parsePositiveInt,
  pickAllowed,
} from './params'

describe('forecast/params', () => {
  it('acepta solo los métodos del contrato', () => {
    for (const method of ['LINEAR', 'MOVING_AVG', 'EXPONENTIAL', 'SEASONAL']) {
      expect(isForecastMethod(method)).toBe(true)
    }
    expect(isForecastMethod('ARIMA')).toBe(false)
    expect(isForecastMethod(null)).toBe(false)
    expect(isForecastGranularity('MONTHLY')).toBe(true)
    expect(isForecastGranularity('YEARLY')).toBe(false)
  })

  it('normaliza la selección de ventas y degrada SEASONAL (no expuesto en la UI)', () => {
    expect(
      normalizeSalesSelection({
        historyMonths: '12',
        forecastMonths: '6',
        method: 'LINEAR',
      }),
    ).toEqual({
      historyMonths: 12,
      forecastMonths: 6,
      method: 'LINEAR',
      granularity: 'MONTHLY',
    })

    const degraded = normalizeSalesSelection({
      historyMonths: '24',
      forecastMonths: '3',
      method: 'SEASONAL',
    })
    expect(degraded.method).toBe('LINEAR')
  })

  it('cae a los defaults ante valores fuera de la lista cerrada', () => {
    expect(normalizeForecastMonths('5')).toBe(3)
    expect(normalizeForecastMonths('12')).toBe(12)
    expect(normalizeForecastMonths('999')).toBe(3)
    expect(normalizeDemandMonths('6')).toBe(6)
    expect(normalizeRevenueMonths('3')).toBe(3)
    expect(normalizeRevenueMonths('5')).toBe(3)
    expect(normalizeRevenueMonths('12')).toBe(12)
    expect(normalizeInventoryDays('45')).toBe(30)
    expect(normalizeInventoryDays('90')).toBe(90)
    expect(pickAllowed('24', [6, 12, 24], 6)).toBe(24)
    expect(pickAllowed(undefined, [6, 12, 24], 6)).toBe(6)
  })

  it('parsea enteros positivos y páginas', () => {
    expect(parsePositiveInt('3')).toBe(3)
    expect(parsePositiveInt('2.9')).toBe(2)
    expect(parsePositiveInt('0')).toBeNull()
    expect(parsePositiveInt('-4')).toBeNull()
    expect(parsePositiveInt('abc')).toBeNull()
    expect(normalizePage('4')).toBe(4)
    expect(normalizePage('0')).toBe(1)
    expect(normalizePage(null)).toBe(1)
  })
})
