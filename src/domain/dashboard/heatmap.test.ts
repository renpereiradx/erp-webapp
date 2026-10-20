import { describe, expect, it } from 'vitest'
import {
  HEATMAP_HOURS,
  HEATMAP_UI_DAY_KEYS,
  apiDayToUiIndex,
  computeMaxSales,
  dayNameToKey,
  formatHour,
  getCellIntensity,
  getIntensityLevel,
  summarizeHeatmap,
  uiIndexToApiDay,
  type HeatmapCell,
} from './heatmap'

describe('uiIndexToApiDay / apiDayToUiIndex', () => {
  it.each([
    [0, 1], // Lun → 1
    [1, 2],
    [5, 6], // Sáb → 6
    [6, 0], // Dom → 0 (el API usa 0 = domingo)
  ])('índice UI %i → día API %i', (uiIndex, apiDay) => {
    expect(uiIndexToApiDay(uiIndex)).toBe(apiDay)
    expect(apiDayToUiIndex(apiDay)).toBe(uiIndex)
  })
})

describe('computeMaxSales', () => {
  it('devuelve 1 con la grilla vacía (evita división por cero)', () => {
    expect(computeMaxSales([])).toBe(1)
  })

  it('devuelve 1 cuando todas las celdas están en cero', () => {
    expect(computeMaxSales([{ day: 1, hour: 8, sales_count: 0, sales_total: 0 }])).toBe(1)
  })

  it('devuelve el máximo de sales_count', () => {
    const cells: HeatmapCell[] = [
      { day: 1, hour: 8, sales_count: 3, sales_total: 300 },
      { day: 1, hour: 9, sales_count: 17, sales_total: 1700 },
      { day: 2, hour: 8, sales_count: 5, sales_total: 500 },
    ]
    expect(computeMaxSales(cells)).toBe(17)
  })
})

describe('getIntensityLevel', () => {
  it.each([
    [0, 0],
    [0.01, 1],
    [0.5, 1], // borde: 0.5 no es > 0.5
    [0.51, 2],
    [0.8, 2], // borde: 0.8 no es > 0.8
    [0.81, 3],
    [1, 3],
  ] as const)('ratio %s → nivel %i', (ratio, level) => {
    expect(getIntensityLevel(ratio)).toBe(level)
  })
})

describe('getCellIntensity', () => {
  const cells: HeatmapCell[] = [
    { day: 1, hour: 8, sales_count: 10, sales_total: 500000 },
    { day: 0, hour: 21, sales_count: 4, sales_total: 80000 },
  ]
  const max = computeMaxSales(cells) // 10

  it('mapea fila UI + hora a la celda del API con sales_total real', () => {
    expect(getCellIntensity(cells, max, 0, 8)).toEqual({
      ratio: 1,
      sales: 10,
      total: 500000,
      level: 3,
      hasData: true,
    })
  })

  it('resuelve el domingo (UI 6 → API 0) en hora 21', () => {
    expect(getCellIntensity(cells, max, 6, 21)).toEqual({
      ratio: 0.4,
      sales: 4,
      total: 80000,
      level: 1,
      hasData: true,
    })
  })

  it('devuelve la celda vacía cuando el API no tiene datos', () => {
    expect(getCellIntensity(cells, max, 3, 8)).toEqual({
      ratio: 0,
      sales: 0,
      total: 0,
      level: 0,
      hasData: false,
    })
  })

  it('expone las 24 horas y las 7 claves de día que consume la página', () => {
    expect(HEATMAP_UI_DAY_KEYS).toHaveLength(7)
    expect(HEATMAP_UI_DAY_KEYS[0]).toBe('monday')
    expect(HEATMAP_HOURS[0]).toBe(0)
    expect(HEATMAP_HOURS).toHaveLength(24)
  })
})

describe('summarizeHeatmap', () => {
  it('suma montos y transacciones sin duplicar y cuenta celdas activas', () => {
    expect(
      summarizeHeatmap([
        { day: 1, hour: 8, sales_count: 3, sales_total: 1000 },
        { day: 1, hour: 9, sales_count: 2, sales_total: 2000 },
        { day: 2, hour: 8, sales_count: 0, sales_total: 0 },
      ]),
    ).toEqual({ totalSales: 3000, totalTransactions: 5, activeCells: 2 })
  })

  it('devuelve ceros con la grilla vacía', () => {
    expect(summarizeHeatmap([])).toEqual({
      totalSales: 0,
      totalTransactions: 0,
      activeCells: 0,
    })
  })
})

describe('dayNameToKey', () => {
  it.each([
    ['Lunes', 'monday'],
    ['martes', 'tuesday'],
    ['Miércoles', 'wednesday'],
    ['JUEVES', 'thursday'],
    ['Viernes', 'friday'],
    ['Sábado', 'saturday'],
    ['Domingo', 'sunday'],
  ])('%s → %s', (day, key) => {
    expect(dayNameToKey(day)).toBe(key)
  })

  it('devuelve null para un nombre desconocido o vacío', () => {
    expect(dayNameToKey('Festivo')).toBeNull()
    expect(dayNameToKey(null)).toBeNull()
  })
})

describe('formatHour', () => {
  it('formatea a 24 h con dos dígitos', () => {
    expect(formatHour(0)).toBe('00:00')
    expect(formatHour(9)).toBe('09:00')
    expect(formatHour(21)).toBe('21:00')
  })
})
