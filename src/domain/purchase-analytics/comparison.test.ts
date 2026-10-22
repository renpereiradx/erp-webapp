import { describe, expect, it } from 'vitest'
import {
  buildPurchaseComparisonParams,
  buildPurchaseComparisonRows,
  defaultPurchaseComparisonDraft,
  describePurchaseComparisonRange,
  isPurchaseComparisonEmpty,
  validatePurchaseComparisonDraft,
} from './comparison'
import type { PurchaseComparison } from '@/types/bi'

const comparison = (): PurchaseComparison => ({
  period_1: {
    period: { start_date: '2026-10-01', end_date: '2026-11-01' },
    total_purchases: 275000,
    total_transactions: 2,
    total_units: 40,
    average_order: 137500,
    unique_suppliers: 1,
  },
  period_2: {
    period: { start_date: '2026-09-01', end_date: '2026-10-01' },
    total_purchases: 200000,
    total_transactions: 4,
    total_units: 20,
    average_order: 50000,
    unique_suppliers: 2,
  },
  differences: {
    purchases_change: 75000,
    purchases_change_pct: 37.5,
    transactions_change: -2,
    transactions_change_pct: -50,
    units_change: 20,
    units_change_pct: 100,
    order_change: 87500,
    order_change_pct: 175,
    suppliers_change: -1,
    suppliers_change_pct: -50,
  },
})

describe('buildPurchaseComparisonRows', () => {
  it('deriva las 5 métricas A/B con deltas del BE (nunca pp)', () => {
    const rows = buildPurchaseComparisonRows(comparison())
    expect(rows.map((row) => row.id)).toEqual([
      'purchases',
      'transactions',
      'units',
      'avgOrder',
      'suppliers',
    ])
    expect(rows[0]).toMatchObject({ a: 275000, b: 200000, change: 75000, changePct: 37.5 })
    expect(rows[4]).toMatchObject({ a: 1, b: 2, change: -1, changePct: -50 })
  })

  it('payload nulo → []', () => {
    expect(buildPurchaseComparisonRows(null)).toEqual([])
  })
})

describe('isPurchaseComparisonEmpty', () => {
  it('vacía solo cuando AMBAS ventanas no tienen compras', () => {
    expect(isPurchaseComparisonEmpty(comparison())).toBe(false)
    expect(isPurchaseComparisonEmpty(null)).toBe(true)
    const empty = {
      ...comparison(),
      period_1: { ...comparison().period_1, total_purchases: 0, total_transactions: 0, total_units: 0 },
      period_2: { ...comparison().period_2, total_purchases: 0, total_transactions: 0, total_units: 0 },
    }
    expect(isPurchaseComparisonEmpty(empty)).toBe(true)
  })
})

describe('draft del modo personalizado', () => {
  it('default: A = últimos 30 días, B = 30 anteriores', () => {
    const today = new Date(2026, 9, 15)
    expect(defaultPurchaseComparisonDraft(today)).toEqual({
      start1: '2026-09-16',
      end1: '2026-10-15',
      start2: '2026-08-17',
      end2: '2026-09-15',
    })
  })

  it('valida formato y rango de ambas ventanas', () => {
    const draft = defaultPurchaseComparisonDraft(new Date(2026, 9, 15))
    expect(validatePurchaseComparisonDraft(draft).valid).toBe(true)

    const bad = validatePurchaseComparisonDraft({
      ...draft,
      start1: '2026-02-31',
      end2: '2026-01-01',
    })
    expect(bad.valid).toBe(false)
    expect(bad.invalidFields).toContain('start1')

    const inverted = validatePurchaseComparisonDraft({ ...draft, start1: '2026-10-15', end1: '2026-09-16' })
    expect(inverted.invalidFields).toContain('range1')
  })

  it('buildPurchaseComparisonParams: custom manda las 4 fechas, period solo el período', () => {
    const draft = defaultPurchaseComparisonDraft(new Date(2026, 9, 15))
    expect(buildPurchaseComparisonParams('custom', 'month', draft)).toMatchObject({
      start1: draft.start1,
      end1: draft.end1,
    })
    expect(buildPurchaseComparisonParams('period', 'week', draft)).toEqual({ period: 'week' })
  })
})

describe('describePurchaseComparisonRange', () => {
  it('end_date exclusivo → muestra el día anterior inclusive', () => {
    expect(
      describePurchaseComparisonRange({ start_date: '2026-10-01', end_date: '2026-11-01' }),
    ).toEqual({ start: '2026-10-01', end: '2026-10-31' })
    expect(describePurchaseComparisonRange(null)).toEqual({ start: '', end: '' })
  })
})
