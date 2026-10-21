import { describe, expect, it } from 'vitest'
import {
  AUDIT_DEFAULT_PERIOD,
  AUDIT_PERIODS,
  auditPeriodLabelKey,
  isAuditPeriod,
} from './periods'

describe('audit/periods', () => {
  it('acepta solo los períodos que valida el BE', () => {
    for (const period of AUDIT_PERIODS) expect(isAuditPeriod(period)).toBe(true)
    expect(isAuditPeriod('quarter')).toBe(false)
    expect(isAuditPeriod('')).toBe(false)
    expect(isAuditPeriod(null)).toBe(false)
  })

  it('default mes y claves i18n por período', () => {
    expect(AUDIT_DEFAULT_PERIOD).toBe('month')
    expect(auditPeriodLabelKey('week')).toBe('audit.period.week')
  })
})
