import { describe, expect, it } from 'vitest'
import {
  RECEIVABLES_DEFAULT_PERIOD,
  RECEIVABLES_PERIODS,
  isReceivablesPeriod,
} from './periods'

describe('receivables/periods (F7)', () => {
  it('ofrece los 4 períodos que acepta el BE con default mensual', () => {
    expect(RECEIVABLES_PERIODS).toEqual(['today', 'week', 'month', 'year'])
    expect(RECEIVABLES_DEFAULT_PERIOD).toBe('month')
  })

  it('valida el período del query param', () => {
    expect(isReceivablesPeriod('month')).toBe(true)
    expect(isReceivablesPeriod('quarter')).toBe(false)
    expect(isReceivablesPeriod(null)).toBe(false)
    expect(isReceivablesPeriod(3)).toBe(false)
  })
})
