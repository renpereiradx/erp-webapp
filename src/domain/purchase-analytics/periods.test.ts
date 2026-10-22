import { describe, expect, it } from 'vitest'
import {
  PURCHASE_DEFAULT_PERIOD,
  isPurchasePeriod,
  purchaseGranularityForPeriod,
} from './periods'

describe('períodos de compras', () => {
  it('misma lista que el BE (today/week/month/year), default month', () => {
    for (const period of ['today', 'week', 'month', 'year']) {
      expect(isPurchasePeriod(period)).toBe(true)
    }
    expect(isPurchasePeriod('quarterly')).toBe(false)
    expect(PURCHASE_DEFAULT_PERIOD).toBe('month')
  })

  it('granularidad derivada: today hourly, year monthly, resto daily', () => {
    expect(purchaseGranularityForPeriod('today')).toBe('hourly')
    expect(purchaseGranularityForPeriod('year')).toBe('monthly')
    expect(purchaseGranularityForPeriod('week')).toBe('daily')
    expect(purchaseGranularityForPeriod('month')).toBe('daily')
  })
})
