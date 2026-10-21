/**
 * IVA y resumen fiscal (F9) — vistas puras del contrato real.
 *
 * No se mezclan fuentes: `VatReport.monthly_breakdown` (IVA por mes calculado
 * desde las vistas del libro) y `TaxSummary.monthly_detail` (IVA + retenciones)
 * son tablas distintas, cada una con su propio origen. Tampoco se calculan
 * variaciones contra un mes anterior que no fue consultado: los porcentajes
 * que no existen no se muestran.
 */
import type { MonthlyTax, MonthlyVat, TaxSummary, VatReport } from '@/types/bi'
import { isMissingDate, toNumberOrNull } from './format'
import type { FinanceKpiValue } from './kpis'

export interface VatSectionView {
  base10: number | null
  vat10: number | null
  base5: number | null
  vat5: number | null
  exempt: number | null
  totalGross: number | null
  totalVat: number | null
  transactionCount: number | null
}

export interface VatView {
  sales: VatSectionView
  purchases: VatSectionView
  debit: number | null
  credit: number | null
  payable: number | null
  carryover: number | null
  status: string
  monthly: MonthlyVat[]
}

export const vatView = (report: VatReport | null | undefined): VatView | null => {
  if (!report) return null
  const sales = report.sales_vat
  const purchases = report.purchases_vat
  const balance = report.vat_balance
  const monthly = (Array.isArray(report.monthly_breakdown) ? report.monthly_breakdown : [])
    .filter((row) => !isMissingDate(row.month))
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month))

  return {
    sales: {
      base10: toNumberOrNull(sales?.gross_sales_10),
      vat10: toNumberOrNull(sales?.vat_10),
      base5: toNumberOrNull(sales?.gross_sales_5),
      vat5: toNumberOrNull(sales?.vat_5),
      exempt: toNumberOrNull(sales?.exempt_sales),
      totalGross: toNumberOrNull(sales?.total_gross_sales),
      totalVat: toNumberOrNull(sales?.total_vat_debito),
      transactionCount: toNumberOrNull(sales?.transaction_count),
    },
    purchases: {
      base10: toNumberOrNull(purchases?.gross_purchases_10),
      vat10: toNumberOrNull(purchases?.vat_10),
      base5: toNumberOrNull(purchases?.gross_purchases_5),
      vat5: toNumberOrNull(purchases?.vat_5),
      exempt: toNumberOrNull(purchases?.exempt_purchases),
      totalGross: toNumberOrNull(purchases?.total_gross_purchases),
      totalVat: toNumberOrNull(purchases?.total_vat_credito),
      transactionCount: toNumberOrNull(purchases?.transaction_count),
    },
    debit: toNumberOrNull(balance?.vat_debito),
    credit: toNumberOrNull(balance?.vat_credito),
    payable: toNumberOrNull(balance?.vat_payable),
    carryover: toNumberOrNull(balance?.credit_carryover),
    status: balance?.status ?? '',
    monthly,
  }
}

export type VatStatusKey = 'toPay' | 'credit' | 'balanced' | 'unknown'

export const vatStatusKey = (status: string | null | undefined): VatStatusKey => {
  switch ((status ?? '').toUpperCase()) {
    case 'TO_PAY':
      return 'toPay'
    case 'CREDIT':
      return 'credit'
    case 'BALANCED':
      return 'balanced'
    default:
      return 'unknown'
  }
}

export type VatStatusTone = 'error' | 'success' | 'info' | 'neutral'

export const VAT_STATUS_TONE: Record<VatStatusKey, VatStatusTone> = {
  toPay: 'error',
  credit: 'success',
  balanced: 'info',
  unknown: 'neutral',
}

/** KPIs del IVA: débito, crédito, saldo declarado y arrastre. */
export const vatKpis = (view: VatView): FinanceKpiValue[] => [
  { id: 'vatDebit', kind: 'money', value: view.debit },
  { id: 'vatCredit', kind: 'money', value: view.credit },
  { id: 'vatPayable', kind: 'money', value: view.payable },
  { id: 'vatCarryover', kind: 'money', value: view.carryover },
]

export interface TaxSummaryView {
  totalDebit: number | null
  totalCredit: number | null
  netVat: number | null
  creditBalance: number | null
  retainedByOthers: number | null
  retainedToOthers: number | null
  netRetentions: number | null
  totalLiability: number | null
  totalCredits: number | null
  netTaxPosition: number | null
  monthly: MonthlyTax[]
}

export const taxSummaryView = (
  summary: TaxSummary | null | undefined,
): TaxSummaryView | null => {
  if (!summary) return null
  const monthly = (Array.isArray(summary.monthly_detail) ? summary.monthly_detail : [])
    .filter((row) => !isMissingDate(row.month))
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month))
  return {
    totalDebit: toNumberOrNull(summary.vat_summary?.total_debito),
    totalCredit: toNumberOrNull(summary.vat_summary?.total_credito),
    netVat: toNumberOrNull(summary.vat_summary?.net_vat),
    creditBalance: toNumberOrNull(summary.vat_summary?.credit_balance),
    retainedByOthers: toNumberOrNull(summary.retentions_summary?.retained_by_others),
    retainedToOthers: toNumberOrNull(summary.retentions_summary?.retained_to_others),
    netRetentions: toNumberOrNull(summary.retentions_summary?.net_retentions),
    totalLiability: toNumberOrNull(summary.total_tax_liability),
    totalCredits: toNumberOrNull(summary.total_tax_credits),
    netTaxPosition: toNumberOrNull(summary.net_tax_position),
    monthly,
  }
}

/** KPIs fiscales: obligación, créditos y posición neta + retenciones. */
export const taxSummaryKpis = (view: TaxSummaryView): FinanceKpiValue[] => {
  const kpis: FinanceKpiValue[] = [
    { id: 'taxLiability', kind: 'money', value: view.totalLiability },
    { id: 'taxCredits', kind: 'money', value: view.totalCredits },
    { id: 'netTaxPosition', kind: 'money', value: view.netTaxPosition },
  ]
  if ((view.netRetentions ?? 0) !== 0) {
    kpis.push({ id: 'netRetentions', kind: 'money', value: view.netRetentions })
  }
  return kpis
}
