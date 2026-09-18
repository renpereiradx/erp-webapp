/**
 * VAT (IVA) view model for TaxManagementDashboard: rate tables, monthly
 * merge/dedup/sort of the two breakdown sources and period deltas.
 * Extracted from the page's useMemo (PLAN_ALINEACION_BI_FRONTEND F1).
 */
import { toNumber } from './cashFlow'

/** Percentage change between periods; 0 when there is no base. */
export const pct = (current: number, prev: number): number => {
  if (!prev) return 0
  return ((current - prev) / prev) * 100
}

/** es-PY 'mmm yyyy' label; raw value (or '-') for invalid dates. */
export const monthLabel = (dateLike: string | null | undefined): string => {
  const date = new Date(dateLike as string)
  if (Number.isNaN(date.getTime())) return dateLike || '-'
  return date.toLocaleDateString('es-PY', {
    month: 'short',
    year: 'numeric',
  })
}

export interface VatReportLike {
  sales_vat?: Record<string, unknown> | null
  purchases_vat?: Record<string, unknown> | null
  vat_balance?: Record<string, unknown> | null
  monthly_breakdown?: Array<Record<string, unknown>> | null
  [key: string]: unknown
}

export interface TaxSummaryLike {
  monthly_detail?: Array<Record<string, unknown>> | null
  total_tax_liability?: unknown
  total_tax_credits?: unknown
  net_tax_position?: unknown
  [key: string]: unknown
}

export interface VatMonthlyRow {
  month: string
  debit: number
  credit: number
  net: number
}

export interface VatRateTable {
  base10: number
  iva10: number
  base5: number
  iva5: number
  exempt: number
  totalGross: number
  totalVat: number
}

export interface VatView {
  salesVat: VatRateTable
  purchaseVat: VatRateTable
  vatBalance: { debit: number; credit: number; payable: number; carryover: number }
  taxTotals: { liability: number; credits: number; net: number }
  monthlyRows: VatMonthlyRow[]
  debitDelta: number
  creditDelta: number
}

/**
 * Builds the VAT page view model. The monthly rows merge
 * vatReport.monthly_breakdown (net = `balance`) with
 * taxSummary.monthly_detail (net = `net_vat`), dedupe by month (summary
 * wins over report), sort ascending and keep the last 6 months; deltas
 * compare the last two rows.
 */
export const buildVatView = (
  vatReport: VatReportLike | null | undefined,
  taxSummary: TaxSummaryLike | null | undefined,
): VatView => {
  const sales = vatReport?.sales_vat || {}
  const purchases = vatReport?.purchases_vat || {}
  const balance = vatReport?.vat_balance || {}
  const summary = taxSummary || {}

  const monthly: VatMonthlyRow[] = [
    ...(Array.isArray(vatReport?.monthly_breakdown)
      ? (vatReport.monthly_breakdown as Array<Record<string, unknown>>).map((item) => ({
          month: item.month as string,
          debit: toNumber(item.vat_debito),
          credit: toNumber(item.vat_credito),
          net: toNumber(item.balance),
        }))
      : []),
    ...(Array.isArray(summary?.monthly_detail)
      ? (summary.monthly_detail as Array<Record<string, unknown>>).map((item) => ({
          month: item.month as string,
          debit: toNumber(item.vat_debito),
          credit: toNumber(item.vat_credito),
          net: toNumber(item.net_vat),
        }))
      : []),
  ]

  const dedupedMonthly = monthly
    .filter((item) => item.month)
    .reduce<Record<string, VatMonthlyRow>>((acc, item) => {
      acc[item.month] = item
      return acc
    }, {})

  const rows = Object.values(dedupedMonthly)
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .slice(-6)

  const current = rows[rows.length - 1]
  const previous = rows[rows.length - 2]

  return {
    salesVat: {
      base10: toNumber(sales.gross_sales_10),
      iva10: toNumber(sales.vat_10),
      base5: toNumber(sales.gross_sales_5),
      iva5: toNumber(sales.vat_5),
      exempt: toNumber(sales.exempt_sales),
      totalGross: toNumber(sales.total_gross_sales),
      totalVat: toNumber(sales.total_vat_debito),
    },
    purchaseVat: {
      base10: toNumber(purchases.gross_purchases_10),
      iva10: toNumber(purchases.vat_10),
      base5: toNumber(purchases.gross_purchases_5),
      iva5: toNumber(purchases.vat_5),
      exempt: toNumber(purchases.exempt_purchases),
      totalGross: toNumber(purchases.total_gross_purchases),
      totalVat: toNumber(purchases.total_vat_credito),
    },
    vatBalance: {
      debit: toNumber(balance.vat_debito),
      credit: toNumber(balance.vat_credito),
      payable: toNumber(balance.vat_payable),
      carryover: toNumber(balance.credit_carryover),
    },
    taxTotals: {
      liability: toNumber(summary.total_tax_liability),
      credits: toNumber(summary.total_tax_credits),
      net: toNumber(summary.net_tax_position),
    },
    monthlyRows: rows,
    debitDelta: current && previous ? pct(current.debit, previous.debit) : 0,
    creditDelta:
      current && previous ? pct(current.credit, previous.credit) : 0,
  }
}
