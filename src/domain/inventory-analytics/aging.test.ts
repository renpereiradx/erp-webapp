import { describe, expect, it } from 'vitest'
import { agingBucketKeyFor, agingReportRows, buildAgingRows, buildAgingSummary } from './aging'
import type { StockAgingBucket, StockAgingReport } from '@/types/bi'

const bucket = (min: number, max: number, products: number): StockAgingBucket => ({
  label: `${min}-${max} días`,
  min_days: min,
  max_days: max,
  product_count: products,
  total_units: products * 2,
  total_value: products * 1000,
  percentage: products * 10,
})

describe('inventory aging', () => {
  it('mapea los tramos por min/max, no por el label en español', () => {
    expect(agingBucketKeyFor(bucket(0, 30, 1))).toBe('d0_30')
    expect(agingBucketKeyFor(bucket(31, 60, 1))).toBe('d31_60')
    expect(agingBucketKeyFor(bucket(61, 90, 1))).toBe('d61_90')
    expect(agingBucketKeyFor(bucket(91, 180, 1))).toBe('d91_180')
    expect(agingBucketKeyFor(bucket(181, 9999, 1))).toBe('d180plus')
    expect(agingBucketKeyFor(bucket(0, 9999, 1))).toBe('other')
  })

  it('construye filas con los valores del BE', () => {
    expect(buildAgingRows([bucket(0, 30, 3)])).toEqual([
      { key: 'd0_30', productCount: 3, totalUnits: 6, totalValue: 3000, percentage: 30 },
    ])
    expect(buildAgingRows(null)).toEqual([])
  })

  it('resume la antigüedad y el valor viejo', () => {
    expect(
      buildAgingSummary({
        total_products: 10,
        total_units: 20,
        total_value: 10000,
        average_age_days: 76.4,
        old_stock_value: 2500,
        old_stock_pct: 25,
      }),
    ).toEqual({
      totalProducts: 10,
      totalUnits: 20,
      totalValue: 10000,
      averageAgeDays: 76.4,
      oldStockValue: 2500,
      oldStockPct: 25,
    })
  })

  it('normaliza buckets null de Go', () => {
    expect(agingReportRows(null)).toEqual([])
    expect(agingReportRows({ buckets: null } as StockAgingReport)).toEqual([])
  })
})
