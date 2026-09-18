import { describe, expect, it } from 'vitest'
import { buildInvoiceAgingBuckets, sumClientAgingTotals } from './aging'

describe('sumClientAgingTotals', () => {
  it('devuelve ceros con lista vacía', () => {
    expect(sumClientAgingTotals([])).toEqual({
      current: 0,
      days_31_60: 0,
      days_61_90: 0,
      over_90_days: 0,
      total: 0,
    })
  })

  it('suma por tramo tolerando null/undefined', () => {
    const clients = [
      { current: 100, days_31_60: 50, days_61_90: null, over_90_days: 0, total: 150 },
      { current: undefined, days_31_60: 50, days_61_90: 25, over_90_days: 25, total: 100 },
    ]
    expect(sumClientAgingTotals(clients)).toEqual({
      current: 100,
      days_31_60: 100,
      days_61_90: 25,
      over_90_days: 25,
      total: 250,
    })
  })
})

describe('buildInvoiceAgingBuckets', () => {
  const TODAY = new Date('2026-09-18T12:00:00Z').getTime()
  const daysAgo = (n: number) => new Date(TODAY - n * 86400000).toISOString()

  it('devuelve [] con receivables null/undefined/vacío', () => {
    expect(buildInvoiceAgingBuckets(null, TODAY)).toEqual([])
    expect(buildInvoiceAgingBuckets(undefined, TODAY)).toEqual([])
    expect(buildInvoiceAgingBuckets([], TODAY)).toEqual([])
  })

  it('salta facturas sin pendiente o sin vencimiento', () => {
    const invoices = [
      { pending_amount: 0, due_date: daysAgo(5) },
      { pending_amount: 100, due_date: null },
      { pending_amount: 200, due_date: daysAgo(10) },
    ]
    const buckets = buildInvoiceAgingBuckets(invoices, TODAY)
    expect(buckets).toHaveLength(1)
    expect(buckets[0]).toMatchObject({ label: '1-30 Días', amount: 200, percent: 100 })
  })

  it('facturas no vencidas y vencidas hoy caen en Corriente', () => {
    const invoices = [
      { pending_amount: 100, due_date: daysAgo(-5) }, // vence en 5 días
      { pending_amount: 300, due_date: daysAgo(0) }, // vence hoy
    ]
    expect(buildInvoiceAgingBuckets(invoices, TODAY)).toEqual([
      { label: 'Corriente', colorClass: 'aging-bar__segment--current', amount: 400, percent: 100 },
    ])
  })

  it('respeta los bordes de tramos 30/60', () => {
    const invoices = [
      { pending_amount: 100, due_date: daysAgo(30) }, // 1-30
      { pending_amount: 100, due_date: daysAgo(31) }, // 31-60
      { pending_amount: 100, due_date: daysAgo(60) }, // 31-60
      { pending_amount: 100, due_date: daysAgo(61) }, // >60
    ]
    const buckets = buildInvoiceAgingBuckets(invoices, TODAY)
    expect(buckets.map((b) => [b.label, b.amount])).toEqual([
      ['1-30 Días', 100],
      ['31-60 Días', 200],
      ['>60 Días', 100],
    ])
    expect(buckets.map((b) => b.percent)).toEqual([25, 50, 25])
  })

  it('redondea porcentajes y puede devolver 0% + 100%', () => {
    const invoices = [
      { pending_amount: 1, due_date: daysAgo(-1) }, // Corriente (futura): 0.1% → 0%
      { pending_amount: 999, due_date: daysAgo(40) }, // 31-60: 99.9% → 100%
    ]
    const buckets = buildInvoiceAgingBuckets(invoices, TODAY)
    expect(buckets.map((b) => b.percent)).toEqual([0, 100])
  })
})
