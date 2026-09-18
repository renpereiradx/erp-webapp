/**
 * Aging-bucket math for receivables: portfolio totals per client row and
 * buckets derived from a client's invoices.
 * Extracted from AgingByClientTable.jsx (footer totals) and
 * useClientCreditProfile.js (invoice-derived buckets)
 * (PLAN_ALINEACION_BI_FRONTEND F1).
 */

/** Row of the by-client aging table (amounts per bucket). */
export interface ClientAgingRow {
  current?: number | null
  days_31_60?: number | null
  days_61_90?: number | null
  over_90_days?: number | null
  total?: number | null
}

export interface ClientAgingTotals {
  current: number
  days_31_60: number
  days_61_90: number
  over_90_days: number
  total: number
}

/** Portfolio totals across client rows (null-safe on every bucket). */
export const sumClientAgingTotals = (clients: ClientAgingRow[]): ClientAgingTotals => ({
  current: clients.reduce((acc, c) => acc + (c.current || 0), 0),
  days_31_60: clients.reduce((acc, c) => acc + (c.days_31_60 || 0), 0),
  days_61_90: clients.reduce((acc, c) => acc + (c.days_61_90 || 0), 0),
  over_90_days: clients.reduce((acc, c) => acc + (c.over_90_days || 0), 0),
  total: clients.reduce((acc, c) => acc + (c.total || 0), 0),
})

export interface InvoiceAgingInput {
  pending_amount?: number | null
  due_date?: string | null
}

export interface AgingBucket {
  label: string
  amount: number
  colorClass: string
  /** Rounded share of the total, 0-100 (width in % for the bar). */
  percent: number
}

const MS_PER_DAY = 86400000

const BUCKET_DEFS = [
  { label: 'Corriente', colorClass: 'aging-bar__segment--current' },
  { label: '1-30 Días', colorClass: 'aging-bar__segment--1-30' },
  { label: '31-60 Días', colorClass: 'aging-bar__segment--31-60' },
  { label: '>60 Días', colorClass: 'aging-bar__segment--90' },
] as const

/**
 * Aging buckets derived from a client's invoices (pending amount + due date).
 * Days overdue ≤ 0 land in 'Corriente'; > 0-30, 31-60, > 60 in the rest.
 * Returns [] when there is no pending balance; buckets with amount 0 are
 * dropped; `percent` is the rounded share of the total.
 */
export const buildInvoiceAgingBuckets = (
  receivables: InvoiceAgingInput[] | null | undefined,
  today: number = Date.now(),
): AgingBucket[] => {
  const amounts = [0, 0, 0, 0]

  ;(receivables || []).forEach((inv) => {
    const pending = inv.pending_amount || 0
    if (pending <= 0 || !inv.due_date) return
    const days = Math.floor((today - new Date(inv.due_date).getTime()) / MS_PER_DAY)
    if (days <= 0) amounts[0] += pending
    else if (days <= 30) amounts[1] += pending
    else if (days <= 60) amounts[2] += pending
    else amounts[3] += pending
  })

  const total = amounts.reduce((acc, amount) => acc + amount, 0)
  if (total <= 0) return []

  return BUCKET_DEFS.map((def, i) => ({ ...def, amount: amounts[i] }))
    .filter((b) => b.amount > 0)
    .map((b) => ({ ...b, percent: Math.round((b.amount / total) * 100) }))
}
