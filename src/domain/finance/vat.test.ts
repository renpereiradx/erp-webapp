import { describe, expect, it } from 'vitest'
import {
  VAT_STATUS_TONE,
  taxSummaryKpis,
  taxSummaryView,
  vatKpis,
  vatStatusKey,
  vatView,
} from './vat'
import type { TaxSummary, VatReport } from '@/types/bi'

const report: VatReport = {
  period: { start_date: '2026-10-01', end_date: '2026-11-01' },
  sales_vat: {
    gross_sales_10: 425500,
    vat_10: 38681.82,
    gross_sales_5: 1050000,
    vat_5: 50000,
    exempt_sales: 0,
    total_gross_sales: 1475500,
    total_vat_debito: 88681.82,
    transaction_count: 6,
  },
  purchases_vat: {
    gross_purchases_10: 275000,
    vat_10: 25000,
    gross_purchases_5: 0,
    vat_5: 0,
    exempt_purchases: 0,
    total_gross_purchases: 275000,
    total_vat_credito: 25000,
    transaction_count: 1,
  },
  vat_balance: {
    vat_debito: 88681.82,
    vat_credito: 25000,
    vat_payable: 63681.82,
    credit_carryover: 0,
    status: 'TO_PAY',
  },
  monthly_breakdown: [
    { month: '2026-10-01T00:00:00Z', vat_debito: 88681.82, vat_credito: 25000, balance: 63681.82, status: 'TO_PAY' },
  ],
}

const summary: TaxSummary = {
  period: { start_date: '2026-10-01', end_date: '2026-11-01' },
  vat_summary: { total_debito: 88681.82, total_credito: 25000, net_vat: 63681.82, credit_balance: 0 },
  retentions_summary: { retained_by_others: 0, retained_to_others: 0, net_retentions: 0 },
  total_tax_liability: 63681.82,
  total_tax_credits: 0,
  net_tax_position: 63681.82,
  monthly_detail: [
    { month: '2026-10-01T00:00:00Z', vat_debito: 88681.82, vat_credito: 25000, net_vat: 63681.82, retentions: 0, total_liability: 63681.82 },
  ],
}

describe('finance/vat', () => {
  it('arma la vista de IVA sin mezclar fuentes', () => {
    const view = vatView(report)!
    expect(view.sales.totalVat).toBe(88681.82)
    expect(view.purchases.totalVat).toBe(25000)
    expect(view.payable).toBe(63681.82)
    expect(view.monthly).toHaveLength(1)
    expect(vatView(null)).toBeNull()
  })

  it('traduce el estado del IVA y sus tonos', () => {
    expect(vatStatusKey('TO_PAY')).toBe('toPay')
    expect(vatStatusKey('CREDIT')).toBe('credit')
    expect(vatStatusKey('OTHER')).toBe('unknown')
    expect(VAT_STATUS_TONE.toPay).toBe('error')
  })

  it('arma KPIs del IVA y del resumen fiscal', () => {
    expect(vatKpis(vatView(report)!).map((kpi) => kpi.id)).toEqual([
      'vatDebit',
      'vatCredit',
      'vatPayable',
      'vatCarryover',
    ])
    expect(taxSummaryKpis(taxSummaryView(summary)!).map((kpi) => kpi.id)).toEqual([
      'taxLiability',
      'taxCredits',
      'netTaxPosition',
    ])
  })

  it('solo agrega retenciones cuando son distintas de 0', () => {
    const withRetentions = taxSummaryView({
      ...summary,
      retentions_summary: {
        retained_by_others: 10,
        retained_to_others: 5,
        net_retentions: 5,
      },
    })!
    expect(taxSummaryKpis(withRetentions).map((kpi) => kpi.id)).toContain('netRetentions')
  })
})
