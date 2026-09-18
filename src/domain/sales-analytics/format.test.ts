import { describe, expect, it } from 'vitest'
import { clampPage, roundPct1 } from './format'

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
