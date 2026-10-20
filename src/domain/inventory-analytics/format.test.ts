import { describe, expect, it } from 'vitest'
import {
  clampPage,
  formatCount,
  formatDays,
  formatIsoDate,
  formatMoney,
  formatPercent,
  formatRate,
  isMissingDate,
  paginateRows,
  roundPercent,
  toNumberOrNull,
} from './format'

describe('inventory format', () => {
  it('toNumberOrNull no convierte null/undefined/NaN en cero', () => {
    expect(toNumberOrNull(null)).toBeNull()
    expect(toNumberOrNull(undefined)).toBeNull()
    expect(toNumberOrNull('')).toBeNull()
    expect(toNumberOrNull('abc')).toBeNull()
    expect(toNumberOrNull(0)).toBe(0)
    expect(toNumberOrNull('12.5')).toBe(12.5)
  })

  it('formatMoney usa guaraníes y — cuando falta el dato', () => {
    expect(formatMoney(1500000)).toBe('Gs. 1.500.000')
    expect(formatMoney(0)).toBe('Gs. 0')
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney(undefined)).toBe('—')
  })

  it('formatCount y formatPercent redondean sin floats crudos', () => {
    expect(formatCount(1234)).toBe('1.234')
    expect(formatCount(null)).toBe('—')
    expect(formatPercent(31.310000000000002)).toBe('31,3%')
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(null)).toBe('—')
    expect(roundPercent(14.649)).toBe(14.6)
  })

  it('formatRate entrega el número sin la x y no colapsa tasas chicas a 0', () => {
    expect(formatRate(0.0625)).toBe('0,06')
    expect(formatRate(0.0021)).toBe('0,0021')
    expect(formatRate(12, 0)).toBe('12')
    expect(formatRate(0)).toBe('0')
    expect(formatRate(null)).toBe('—')
  })

  it('formatDays redondea a entero', () => {
    expect(formatDays(2839.4)).toBe('2.839')
    expect(formatDays(null)).toBe('—')
  })

  it('isMissingDate rechaza vacío, inválido y el cero de Go', () => {
    expect(isMissingDate('')).toBe(true)
    expect(isMissingDate('nope')).toBe(true)
    expect(isMissingDate('0001-01-01T00:00:00Z')).toBe(true)
    expect(isMissingDate('2026-09-16T12:00:00Z')).toBe(false)
  })

  it('formatIsoDate usa el locale pedido', () => {
    expect(formatIsoDate('2026-09-16T12:00:00Z', 'es-PY')).toContain('2026')
    expect(formatIsoDate('0001-01-01T00:00:00Z', 'es-PY')).toBe('—')
    expect(formatIsoDate(null, 'es-PY')).toBe('—')
  })

  it('clampPage acota al rango válido', () => {
    expect(clampPage(0, 3)).toBe(1)
    expect(clampPage(5, 3)).toBe(3)
    expect(clampPage(2, 0)).toBe(1)
  })

  it('paginateRows corta por página sin inventar filas', () => {
    const rows = Array.from({ length: 23 }, (_, index) => index)
    expect(paginateRows(rows, 1, 10)).toMatchObject({
      rows: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      page: 1,
      totalPages: 3,
      totalItems: 23,
    })
    expect(paginateRows(rows, 3, 10).rows).toEqual([20, 21, 22])
    expect(paginateRows(null, 1, 10)).toEqual({
      rows: [],
      page: 1,
      totalPages: 1,
      totalItems: 0,
    })
  })
})
