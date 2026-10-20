import { describe, expect, it } from 'vitest'
import { isProfitabilityPeriod, PROFITABILITY_DEFAULT_PERIOD } from './periods'
import { isProductSortField, nextProductSort, productAriaSort } from './products'
import { isTrendGranularity, defaultTrendGranularity } from './trends'

describe('períodos', () => {
  it('acepta solo los cuatro períodos del BE', () => {
    expect(isProfitabilityPeriod('month')).toBe(true)
    expect(isProfitabilityPeriod('week')).toBe(true)
    expect(isProfitabilityPeriod('quarter')).toBe(false)
    expect(isProfitabilityPeriod(null)).toBe(false)
    expect(PROFITABILITY_DEFAULT_PERIOD).toBe('month')
  })
})

describe('orden de productos', () => {
  it('usa el orden natural del campo nuevo', () => {
    expect(nextProductSort({ by: 'profit', order: 'ASC' }, 'name')).toEqual({
      by: 'name',
      order: 'ASC',
    })
    expect(nextProductSort({ by: 'name', order: 'ASC' }, 'revenue')).toEqual({
      by: 'revenue',
      order: 'DESC',
    })
  })

  it('togglea solo el campo activo', () => {
    expect(nextProductSort({ by: 'profit', order: 'DESC' }, 'profit')).toEqual({
      by: 'profit',
      order: 'ASC',
    })
    expect(nextProductSort({ by: 'profit', order: 'ASC' }, 'profit')).toEqual({
      by: 'profit',
      order: 'DESC',
    })
  })

  it('marca aria-sort del campo activo', () => {
    expect(productAriaSort({ by: 'profit', order: 'DESC' }, 'profit')).toBe('descending')
    expect(productAriaSort({ by: 'profit', order: 'ASC' }, 'profit')).toBe('ascending')
    expect(productAriaSort({ by: 'profit', order: 'DESC' }, 'name')).toBe('none')
  })

  it('whitelist real del BE', () => {
    for (const field of ['profit', 'margin', 'revenue', 'units', 'name']) {
      expect(isProductSortField(field)).toBe(true)
    }
    expect(isProductSortField('sku')).toBe(false)
    expect(isProductSortField(null)).toBe(false)
  })
})

describe('granularidad de tendencias', () => {
  it('acepta daily/weekly/monthly', () => {
    expect(isTrendGranularity('daily')).toBe(true)
    expect(isTrendGranularity('monthly')).toBe(true)
    expect(isTrendGranularity('yearly')).toBe(false)
  })

  it('default mensual para el año y diario para el resto', () => {
    expect(defaultTrendGranularity('year')).toBe('monthly')
    expect(defaultTrendGranularity('month')).toBe('daily')
    expect(defaultTrendGranularity('week')).toBe('daily')
    expect(defaultTrendGranularity('today')).toBe('daily')
  })
})
