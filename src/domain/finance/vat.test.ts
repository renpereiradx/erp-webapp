import { describe, expect, it } from 'vitest'
import { buildVatView, monthLabel, pct } from './vat'

describe('pct', () => {
  it('0 sin base previa y delta con signo', () => {
    expect(pct(110, 0)).toBe(0)
    expect(pct(110, 100)).toBe(10)
    expect(pct(90, 100)).toBe(-10)
  })
})

describe('monthLabel', () => {
  it('es-PY mmm yyyy y crudo con inválidos', () => {
    // mid-month para evitar el corrimiento de TZ sobre fechas date-only
    expect(monthLabel('2026-09-15')).toContain('sep')
    expect(monthLabel('2026-09-15')).toContain('2026')
    expect(monthLabel('bad')).toBe('bad')
    // null → epoch del legado (new Date(null) es válido)
    expect(monthLabel(null)).toBe(
      new Date(0).toLocaleDateString('es-PY', { month: 'short', year: 'numeric' }),
    )
    expect(monthLabel('')).toBe('-')
  })
})

describe('buildVatView', () => {
  it('vista en ceros sin inputs', () => {
    const view = buildVatView(null, null)
    expect(view.salesVat).toEqual({
      base10: 0, iva10: 0, base5: 0, iva5: 0, exempt: 0, totalGross: 0, totalVat: 0,
    })
    expect(view.monthlyRows).toEqual([])
    expect(view.debitDelta).toBe(0)
    expect(view.creditDelta).toBe(0)
  })

  const REPORT = {
    sales_vat: {
      gross_sales_10: 1000, vat_10: 100,
      gross_sales_5: 500, vat_5: 25,
      exempt_sales: 50, total_gross_sales: 1550, total_vat_debito: 125,
    },
    purchases_vat: {
      gross_purchases_10: 800, vat_10: 80,
      gross_purchases_5: 400, vat_5: 20,
      exempt_purchases: 10, total_gross_purchases: 1210, total_vat_credito: 100,
    },
    vat_balance: { vat_debito: 125, vat_credito: 100, vat_payable: 25, credit_carryover: 0 },
    monthly_breakdown: [
      { month: '2026-06-01', vat_debito: 60, vat_credito: 50, balance: 10 },
      { month: '2026-07-01', vat_debito: 70, vat_credito: 55, balance: 15 },
    ],
  }

  const SUMMARY = {
    total_tax_liability: 125,
    total_tax_credits: 100,
    net_tax_position: 25,
    monthly_detail: [
      // 2026-07 duplicado: gana el summary (se aplica después en el dedup)
      { month: '2026-07-01', vat_debito: 999, vat_credito: 1, net_vat: 998 },
      { month: '2026-08-01', vat_debito: 80, vat_credito: 60, net_vat: 20 },
      { month: '2026-09-01', vat_debito: 90, vat_credito: 65, net_vat: 25 },
    ],
  }

  it('mapea las tablas de tasas con sus nombres de campo por tabla', () => {
    const view = buildVatView(REPORT, null)
    expect(view.salesVat).toMatchObject({ base10: 1000, iva10: 100, totalVat: 125, exempt: 50 })
    expect(view.purchaseVat).toMatchObject({ base10: 800, iva10: 80, totalVat: 100, exempt: 10 })
    expect(view.vatBalance).toEqual({ debit: 125, credit: 100, payable: 25, carryover: 0 })
  })

  it('totales fiscales desde el summary', () => {
    expect(buildVatView(null, SUMMARY).taxTotals).toEqual({
      liability: 125, credits: 100, net: 25,
    })
  })

  it('fusiona meses de ambas fuentes, deduplica (summary gana), ordena y deja últimos 6', () => {
    const view = buildVatView(REPORT, SUMMARY)
    expect(view.monthlyRows.map((r) => r.month)).toEqual([
      '2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01',
    ])
    const july = view.monthlyRows.find((r) => r.month === '2026-07-01')
    expect(july).toEqual({ month: '2026-07-01', debit: 999, credit: 1, net: 998 })
    // net difiere por fuente: report usa `balance`, summary usa `net_vat`
    const june = view.monthlyRows[0]
    expect(june.net).toBe(10)
  })

  it('delta compara las dos últimas filas del período', () => {
    const view = buildVatView(REPORT, SUMMARY)
    expect(view.debitDelta).toBeCloseTo(((90 - 80) / 80) * 100, 6)
    expect(view.creditDelta).toBeCloseTo(((65 - 60) / 60) * 100, 6)
  })

  it('delta 0 con una sola fila', () => {
    const view = buildVatView({ monthly_breakdown: [{ month: '2026-09-01', vat_debito: 5, vat_credito: 5, balance: 0 }] }, null)
    expect(view.debitDelta).toBe(0)
    expect(view.monthlyRows).toHaveLength(1)
  })

  it('filtra filas sin month', () => {
    const view = buildVatView({
      monthly_breakdown: [
        { month: null, vat_debito: 1, vat_credito: 1, balance: 0 },
        { month: '2026-09-01', vat_debito: 5, vat_credito: 5, balance: 0 },
      ],
    }, null)
    expect(view.monthlyRows).toHaveLength(1)
  })
})
