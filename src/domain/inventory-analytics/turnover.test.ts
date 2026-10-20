import { describe, expect, it } from 'vitest'
import {
  turnoverCategoryRows,
  turnoverPerformanceKey,
  turnoverPerformanceTone,
  turnoverProductRows,
  usableTurnoverDays,
} from './turnover'

describe('inventory turnover', () => {
  it('traduce el performance real del BE y su tono', () => {
    expect(turnoverPerformanceKey('EXCELLENT')).toBe('excellent')
    expect(turnoverPerformanceKey('GOOD')).toBe('good')
    expect(turnoverPerformanceKey('AVERAGE')).toBe('average')
    expect(turnoverPerformanceKey('POOR')).toBe('poor')
    expect(turnoverPerformanceKey('')).toBe('unknown')
    expect(turnoverPerformanceTone('EXCELLENT')).toBe('success')
    expect(turnoverPerformanceTone('GOOD')).toBe('primary')
    expect(turnoverPerformanceTone('AVERAGE')).toBe('warning')
    expect(turnoverPerformanceTone('POOR')).toBe('error')
    expect(turnoverPerformanceTone(undefined)).toBe('secondary')
  })

  it('días 0 o negativos no son un cero real (sin COGS del período)', () => {
    expect(usableTurnoverDays(0)).toBeNull()
    expect(usableTurnoverDays(-1)).toBeNull()
    expect(usableTurnoverDays(null)).toBeNull()
    expect(usableTurnoverDays(2839)).toBe(2839)
  })

  it('normaliza los slices nil de Go a listas vacías', () => {
    expect(turnoverCategoryRows(null)).toEqual([])
    expect(turnoverProductRows(undefined)).toEqual([])
    expect(turnoverCategoryRows([{ category_id: '1' } as never])).toHaveLength(1)
  })
})
