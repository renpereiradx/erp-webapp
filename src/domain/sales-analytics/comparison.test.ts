import { describe, expect, it } from 'vitest'
import type { SalesComparison } from '@/types/bi'
import {
  buildComparisonParams,
  buildComparisonRows,
  defaultComparisonDraft,
  describeComparisonRange,
  hasComparableBase,
  isComparisonEmpty,
  validateComparisonDraft,
} from './comparison'

const COMPARISON: SalesComparison = {
  period_1: {
    period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-10-01T00:00:00Z' },
    total_sales: 551760,
    total_transactions: 8,
    total_units: 15,
    average_ticket: 68970,
    unique_customers: 4,
    gross_margin: 289260,
  },
  period_2: {
    period: { start_date: '2026-08-01T00:00:00Z', end_date: '2026-09-01T00:00:00Z' },
    total_sales: 2407523,
    total_transactions: 13,
    total_units: 31,
    average_ticket: 185194,
    unique_customers: 5,
    gross_margin: 419200,
  },
  differences: {
    sales_change: -1855763,
    sales_change_pct: -77.08183888585903,
    transactions_change: -5,
    transactions_change_pct: -38.46153846153847,
    units_change: -16,
    units_change_pct: -51.61290322580645,
    ticket_change: -116224,
    ticket_change_pct: -62.75798818952093,
    customers_change: -1,
    customers_change_pct: -20,
    margin_change: -129940,
    margin_change_pct: -30.997,
  },
}

describe('buildComparisonRows', () => {
  it('arma las 6 métricas con A, B y variación', () => {
    const rows = buildComparisonRows(COMPARISON)
    expect(rows.map((row) => row.id)).toEqual([
      'sales',
      'transactions',
      'units',
      'ticket',
      'customers',
      'margin',
    ])
    const sales = rows[0]
    expect(sales.a).toBe(551760)
    expect(sales.b).toBe(2407523)
    expect(sales.change).toBe(-1855763)
    expect(sales.changePct).toBeCloseTo(-77.0818, 3)
  })

  it('sin comparación no hay filas', () => {
    expect(buildComparisonRows(null)).toEqual([])
  })
})

describe('isComparisonEmpty', () => {
  it('detecta ausencia total de actividad en ambos períodos', () => {
    expect(isComparisonEmpty(null)).toBe(true)
    expect(isComparisonEmpty(COMPARISON)).toBe(false)

    const empty: SalesComparison = {
      period_1: { ...COMPARISON.period_1, total_sales: 0, total_transactions: 0, total_units: 0, unique_customers: 0 },
      period_2: { ...COMPARISON.period_2, total_sales: 0, total_transactions: 0, total_units: 0, unique_customers: 0 },
      differences: COMPARISON.differences,
    }
    expect(isComparisonEmpty(empty)).toBe(true)
  })
})

describe('rangos personalizados', () => {
  it('el borrador default compara los últimos 30 días con los 30 previos', () => {
    expect(defaultComparisonDraft(new Date(2026, 9, 20))).toEqual({
      start1: '2026-09-21',
      end1: '2026-10-20',
      start2: '2026-08-22',
      end2: '2026-09-20',
    })
  })

  it('valida fechas reales y el orden de cada rango', () => {
    expect(
      validateComparisonDraft({
        start1: '2026-09-01',
        end1: '2026-09-30',
        start2: '2026-08-01',
        end2: '2026-08-31',
      }),
    ).toEqual({ valid: true, invalidFields: [] })

    const inverted = validateComparisonDraft({
      start1: '2026-09-30',
      end1: '2026-09-01',
      start2: '2026-08-01',
      end2: '2026-08-31',
    })
    expect(inverted.valid).toBe(false)
    expect(inverted.invalidFields).toEqual(['range1'])

    const malformed = validateComparisonDraft({
      start1: '2026-02-31',
      end1: '2026-03-10',
      start2: '2026-08-01',
      end2: '2026-08-31',
    })
    expect(malformed.invalidFields).toContain('start1')
  })

  it('los params dependen del modo', () => {
    const draft = {
      start1: '2026-09-01',
      end1: '2026-09-30',
      start2: '2026-08-01',
      end2: '2026-08-31',
    }
    expect(buildComparisonParams('period', 'year', draft)).toEqual({ period: 'year' })
    expect(buildComparisonParams('custom', 'year', draft)).toEqual(draft)
  })
})

describe('rangos y variaciones comparables', () => {
  it('el fin exclusivo del payload se muestra con el día inclusive', () => {
    expect(describeComparisonRange(COMPARISON.period_1.period)).toEqual({
      start: '2026-09-01T00:00:00Z',
      end: '2026-09-30',
    })
  })

  it('sin base previa (pct 0 con cambio) no es comparable', () => {
    expect(hasComparableBase(500, 0)).toBe(false)
    expect(hasComparableBase(0, 0)).toBe(true)
    expect(hasComparableBase(-100, -5)).toBe(true)
  })
})
