import { describe, expect, it } from 'vitest'
import { supplierOldestDebtAge, supplierOverdueShare } from './suppliers'

describe('payables/suppliers', () => {
  it('deriva la proporción vencida del saldo', () => {
    expect(supplierOverdueShare({ total_pending: 1000, total_overdue: 250 })).toBe(25)
    expect(supplierOverdueShare({ total_pending: 0, total_overdue: 0 })).toBeNull()
    expect(supplierOverdueShare(null)).toBeNull()
  })

  it('deriva la antigüedad de la deuda más vieja', () => {
    const now = new Date('2026-10-20T12:00:00-03:00')
    expect(supplierOldestDebtAge({ oldest_debt: '2026-10-01T12:00:00Z' }, now)).toBe(19)
    expect(supplierOldestDebtAge({ oldest_debt: '0001-01-01T00:00:00Z' }, now)).toBeNull()
  })
})
