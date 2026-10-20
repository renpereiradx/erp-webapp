import { describe, expect, it } from 'vitest'
import {
  clampPage,
  formatCompactMoney,
  formatCount,
  formatHour,
  formatMoney,
  formatPercent,
  formatQuantity,
  formatSignedCount,
  formatSignedMoney,
  formatSignedPercent,
  roundPct1,
  roundPercent,
  splitDurationMinutes,
} from './format'

describe('roundPct1', () => {
  it.each([
    [12.3456, 12.3],
    [12.36, 12.4],
    [0.05, 0.1],
    [0, 0],
    [-3.21, -3.2],
    [null, 0],
    [undefined, 0],
  ])('%s → %s', (value, expected) => {
    expect(roundPct1(value)).toBe(expected)
  })
})

describe('roundPercent', () => {
  it('redondea al número de decimales pedido', () => {
    expect(roundPercent(-77.08183888585903, 1)).toBe(-77.1)
    expect(roundPercent(37.74, 0)).toBe(38)
  })
})

describe('clampPage', () => {
  it('mantiene páginas válidas', () => {
    expect(clampPage(2, { page: 2, total_pages: 5 })).toBe(2)
    expect(clampPage(1, { page: 1, total_pages: 5 })).toBe(1)
  })

  it('clamp de límites: mínimo 1, máximo total_pages', () => {
    expect(clampPage(0, { total_pages: 5 })).toBe(1)
    expect(clampPage(-3, { total_pages: 5 })).toBe(1)
    expect(clampPage(6, { total_pages: 5 })).toBe(5)
  })

  it('total_pages 0 o faltante se trata como 1', () => {
    expect(clampPage(3, { total_pages: 0 })).toBe(1)
    expect(clampPage(3, {})).toBe(1)
    expect(clampPage(3, null)).toBe(1)
  })
})

describe('formato de porcentajes', () => {
  it('redondea y agrega el símbolo', () => {
    expect(formatPercent(34.82854864433812)).toBe('34,8%')
    expect(formatPercent(null)).toBe('0%')
  })

  it('conserva el signo en las variaciones', () => {
    expect(formatSignedPercent(12.34)).toBe('+12,3%')
    expect(formatSignedPercent(-3.16)).toBe('-3,2%')
    expect(formatSignedPercent(0)).toBe('0%')
  })
})

describe('formato de montos', () => {
  it('usa el símbolo de guaraníes y nunca "$"', () => {
    expect(formatMoney(551760)).toBe('Gs. 551.760')
    expect(formatMoney(551760)).not.toContain('$')
  })

  it('sin dato devuelve —, no un cero inventado', () => {
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney(undefined)).toBe('—')
    expect(formatMoney(Number.NaN)).toBe('—')
  })

  it('variación de monto con signo', () => {
    expect(formatSignedMoney(1855763)).toBe('+ Gs. 1.855.763')
    expect(formatSignedMoney(-10000)).toBe('- Gs. 10.000')
    expect(formatSignedMoney(0)).toBe('Gs. 0')
  })

  it('monto compacto para ejes', () => {
    expect(formatCompactMoney(1500000)).toContain('Gs.')
  })
})

describe('conteos, cantidades y horas', () => {
  it('cuenta con separador de miles', () => {
    expect(formatCount(1234)).toBe('1.234')
    expect(formatCount(null)).toBe('0')
  })

  it('variación de conteo con signo', () => {
    expect(formatSignedCount(3)).toBe('+3')
    expect(formatSignedCount(-1)).toBe('-1')
    expect(formatSignedCount(0)).toBe('0')
  })

  it('cantidad 0 o negativa es — (el BE usa 0 como sin dato)', () => {
    expect(formatQuantity(0)).toBe('—')
    expect(formatQuantity(-1)).toBe('—')
    expect(formatQuantity(2.5)).toBe('2,5')
  })

  it('hora válida en HH:00', () => {
    expect(formatHour(14)).toBe('14:00')
    expect(formatHour(0)).toBe('00:00')
    expect(formatHour(24)).toBe('—')
    expect(formatHour(null)).toBe('—')
  })
})

describe('splitDurationMinutes', () => {
  it('elige la unidad legible', () => {
    expect(splitDurationMinutes(45)).toEqual({ value: 45, unit: 'minutes' })
    expect(splitDurationMinutes(90)).toEqual({ value: 1.5, unit: 'hours' })
    expect(splitDurationMinutes(2880)).toEqual({ value: 2, unit: 'days' })
    expect(splitDurationMinutes(-1)).toBeNull()
  })
})
