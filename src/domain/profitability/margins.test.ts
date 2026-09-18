import { describe, expect, it } from 'vitest'
import {
  contributionDonutGeometry,
  formatCompactPYG,
  getTopSeller,
  marginBarWidth,
} from './margins'

describe('getTopSeller', () => {
  it('elige el rank 1 y cae al primero sin rank', () => {
    const sellers = [
      { rank: 2, seller_name: 'B' },
      { rank: 1, seller_name: 'A' },
    ]
    expect(getTopSeller(sellers)?.seller_name).toBe('A')
    expect(getTopSeller([{ rank: null, seller_name: 'B' }, { seller_name: 'X' }])?.seller_name).toBe('B')
  })

  it('undefined con lista vacía o nula', () => {
    expect(getTopSeller([])).toBeUndefined()
    expect(getTopSeller(null)).toBeUndefined()
  })
})

describe('formatCompactPYG', () => {
  it.each([
    [1500000, '1.5M'],
    [1000001, '1.0M'], // borde: > 1M
    [1000000, 'Gs. 1.000.000'], // 1M exacto NO se compacta (legado)
    [999999, 'Gs. 999.999'],
    [0, 'Gs. 0'],
    [null, 'Gs. 0'],
    [undefined, 'Gs. 0'],
  ])('%s → %s', (value, expected) => {
    expect(formatCompactPYG(value)).toBe(expected)
  })
})

describe('marginBarWidth', () => {
  it.each([
    [50, 100], // 50% llena la barra (escala /50)
    [25, 50],
    [0, 0],
    [null, 0],
  ])('%s → %s%', (pct, expected) => {
    expect(marginBarWidth(pct)).toBe(expected)
  })
})

describe('contributionDonutGeometry', () => {
  it('geometría del segmento: dashoffset, rotación acumulada y caps', () => {
    expect(contributionDonutGeometry(40, 0)).toEqual({
      dashArray: 263.8,
      dashOffset: 263.8 * (1 - 40 / 100),
      rotation: 0,
      lineCap: 'round',
    })
    expect(contributionDonutGeometry(10, 40)).toEqual({
      dashArray: 263.8,
      dashOffset: 263.8 * (1 - 10 / 100),
      rotation: 40 * 3.6,
      lineCap: 'round',
    })
    // segmento fino → caps 'butt'
    expect(contributionDonutGeometry(3, 50).lineCap).toBe('butt')
    // borde: exactamente 5 sigue siendo 'butt' (5 no es > 5)
    expect(contributionDonutGeometry(5, 50).lineCap).toBe('butt')
  })

  it('tolera pct nulo como 0', () => {
    expect(contributionDonutGeometry(null, 0).dashOffset).toBe(263.8)
  })
})
