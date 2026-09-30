import { describe, expect, it } from 'vitest'
import {
  formatConversionRate,
  formatMetricCount,
  resolveAvgConversionTime,
} from './metrics'

describe('resolveAvgConversionTime', () => {
  it('debajo de 2 h informa en minutos con decimal coma', () => {
    expect(resolveAvgConversionTime(12.5)).toEqual({ value: '12,5', unit: 'min' })
    expect(resolveAvgConversionTime(0)).toEqual({ value: '0', unit: 'min' })
  })

  it('a partir de 2 h convierte a horas (unidades que lee la caja)', () => {
    expect(resolveAvgConversionTime(120)).toEqual({ value: '2', unit: 'h' })
    expect(resolveAvgConversionTime(1422.7)).toEqual({ value: '23,7', unit: 'h' })
  })

  it('entrada inválida (NaN/negativo) no revienta la tarjeta', () => {
    expect(resolveAvgConversionTime(Number.NaN)).toEqual({ value: '0', unit: 'min' })
    expect(resolveAvgConversionTime(-5)).toEqual({ value: '0', unit: 'min' })
  })
})

describe('formatMetricCount', () => {
  it('agrupa miles es-PY y redondea enteros', () => {
    expect(formatMetricCount(8)).toBe('8')
    expect(formatMetricCount(12500)).toBe('12.500')
    expect(formatMetricCount(Number.NaN)).toBe('0')
  })
})

describe('formatConversionRate', () => {
  it('porcentaje con un decimal coma', () => {
    expect(formatConversionRate(62.5)).toBe('62,5')
    expect(formatConversionRate(80)).toBe('80')
    expect(formatConversionRate(Number.NaN)).toBe('0')
  })
})
