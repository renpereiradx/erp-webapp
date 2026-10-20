import { describe, expect, it } from 'vitest'
import {
  buildDeadStockSummary,
  deadStockRecommendationFor,
  deadStockRows,
  isDeadStockThreshold,
} from './deadStock'
import type { DeadStockAnalysis } from '@/types/bi'

describe('inventory dead stock', () => {
  it('valida los umbrales ofrecidos (90/120/180)', () => {
    expect(isDeadStockThreshold(90)).toBe(true)
    expect(isDeadStockThreshold(120)).toBe(true)
    expect(isDeadStockThreshold(180)).toBe(true)
    expect(isDeadStockThreshold(30)).toBe(false)
    expect(isDeadStockThreshold('90')).toBe(false)
  })

  it('deriva la recomendación con los umbrales del BE', () => {
    expect(deadStockRecommendationFor(181)).toBe('discontinue')
    expect(deadStockRecommendationFor(180)).toBe('discount')
    expect(deadStockRecommendationFor(121)).toBe('discount')
    expect(deadStockRecommendationFor(120)).toBe('promote')
    expect(deadStockRecommendationFor(90)).toBe('promote')
    expect(deadStockRecommendationFor(null)).toBe('promote')
  })

  it('resume solo campos medidos (sin potential_loss hardcodeado)', () => {
    expect(
      buildDeadStockSummary({
        total_products: 9,
        total_units: 20,
        total_value: 2149350,
        percentage_of_stock: 31.31,
        average_days_idle: 145.2,
        potential_loss: 644805,
      }),
    ).toEqual({
      products: 9,
      units: 20,
      value: 2149350,
      percentageOfStock: 31.31,
      averageDaysIdle: 145.2,
    })
  })

  it('normaliza productos null de Go', () => {
    expect(deadStockRows(null)).toEqual([])
    expect(deadStockRows({ products: null } as DeadStockAnalysis)).toEqual([])
  })
})
