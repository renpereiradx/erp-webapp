import { describe, expect, it } from 'vitest'
import {
  HEATMAP_HOURS,
  HEATMAP_UI_DAYS,
  computeMaxSales,
  getCellIntensity,
  getIntensityLabel,
  parseHourLabel,
  uiIndexToApiDay,
  type HeatmapCell,
} from './heatmap'

describe('uiIndexToApiDay', () => {
  it.each([
    [0, 1], // Lun → 1
    [1, 2],
    [5, 6], // Sáb → 6
    [6, 0], // Dom → 0 (el API usa 0 = domingo)
  ])('índice UI %i → día API %i', (uiIndex, apiDay) => {
    expect(uiIndexToApiDay(uiIndex)).toBe(apiDay)
  })
})

describe('parseHourLabel', () => {
  it.each([
    ['8AM', 8],
    ['11AM', 11],
    ['12AM', 0], // medianoche
    ['12PM', 12], // mediodía no se desplaza
    ['1PM', 13],
    ['9PM', 21],
  ])('%s → %i', (label, hour) => {
    expect(parseHourLabel(label)).toBe(hour)
  })
})

describe('computeMaxSales', () => {
  it('devuelve 1 con la grilla vacía (evita división por cero)', () => {
    expect(computeMaxSales([])).toBe(1)
  })

  it('devuelve 1 cuando todas las celdas están en cero', () => {
    expect(computeMaxSales([{ day: 1, hour: 8, sales_count: 0 }])).toBe(1)
  })

  it('devuelve el máximo de sales_count', () => {
    const cells: HeatmapCell[] = [
      { day: 1, hour: 8, sales_count: 3 },
      { day: 1, hour: 9, sales_count: 17 },
      { day: 2, hour: 8, sales_count: 5 },
    ]
    expect(computeMaxSales(cells)).toBe(17)
  })
})

describe('getIntensityLabel', () => {
  it.each([
    [0, ''],
    [0.5, ''], // borde: 0.5 no es > 0.5
    [0.51, '$$'],
    [0.8, '$$'], // borde: 0.8 no es > 0.8
    [0.81, '$$$'],
    [1, '$$$'],
  ])('ratio %s → %s', (ratio, label) => {
    expect(getIntensityLabel(ratio)).toBe(label)
  })
})

describe('getCellIntensity', () => {
  const cells: HeatmapCell[] = [
    { day: 1, hour: 8, sales_count: 10, total_amount: 500000 },
    { day: 0, hour: 21, sales_count: 4 },
  ]
  const max = computeMaxSales(cells) // 10

  it('mapea fila UI + etiqueta de hora a la celda del API', () => {
    // Lunes (UI 0 → API 1) 8AM
    expect(getCellIntensity(cells, max, 0, '8AM')).toEqual({
      ratio: 1,
      sales: 10,
      label: '$$$',
      total_amount: 500000,
    })
  })

  it('resuelve el domingo (UI 6 → API 0) con hora PM', () => {
    expect(getCellIntensity(cells, max, 6, '9PM')).toEqual({
      ratio: 0.4,
      sales: 4,
      label: '',
      total_amount: undefined,
    })
  })

  it('devuelve la celda vacía cuando el API no tiene datos', () => {
    expect(getCellIntensity(cells, max, 3, '8AM')).toEqual({
      ratio: 0,
      sales: 0,
      label: '',
      total_amount: 0,
    })
  })

  it('expone las constantes de grilla que consume la página', () => {
    expect(HEATMAP_UI_DAYS).toHaveLength(7)
    expect(HEATMAP_HOURS[0]).toBe('8AM')
    expect(HEATMAP_HOURS).toHaveLength(14)
  })
})
