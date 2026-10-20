import { describe, expect, it } from 'vitest'
import {
  INVENTORY_DEFAULT_PERIOD,
  INVENTORY_PERIODS,
  isInventoryPeriod,
} from './periods'

describe('inventory periods', () => {
  it('acepta solo los tokens que parsea el BE', () => {
    for (const period of INVENTORY_PERIODS) {
      expect(isInventoryPeriod(period)).toBe(true)
    }
    expect(isInventoryPeriod('quarter')).toBe(false)
    expect(isInventoryPeriod(null)).toBe(false)
    expect(INVENTORY_DEFAULT_PERIOD).toBe('month')
  })
})
