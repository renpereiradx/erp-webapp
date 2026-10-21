/**
 * Libros legales de ventas y compras (F9) — vistas puras.
 *
 * Los totales del `summary` son globales del filtro (no de la página). Los
 * campos fiscales (`cdc`, `fiscal_estado`, `timbrado`, `invoice_number`) llegan
 * vacíos en operaciones no fiscales: la UI muestra `—`, nunca un número
 * inventado. Las compras no emiten DE (D-F5.3): no tienen campos SIFEN.
 */
import type {
  PurchaseLedger,
  PurchaseLedgerEntry,
  ReportPaginationInfo,
  SalesLedger,
  SalesLedgerEntry,
} from '@/types/bi'
import { toNumberOrNull } from './format'
import type { FinanceKpiValue } from './kpis'

export interface LedgerView<Summary, Entry> {
  summary: Summary
  entries: Entry[]
  pagination: ReportPaginationInfo
}

const paginationOf = (
  pagination: ReportPaginationInfo | null | undefined,
): ReportPaginationInfo => ({
  // Un 0 del backend no es una página válida: el pager necesita 1/10.
  page: pagination?.page && pagination.page > 0 ? pagination.page : 1,
  page_size: pagination?.page_size && pagination.page_size > 0 ? pagination.page_size : 10,
  total_items: pagination?.total_items ?? 0,
  total_pages: pagination?.total_pages ?? 0,
})

export const salesLedgerView = (
  ledger: SalesLedger | null | undefined,
): LedgerView<SalesLedger['summary'], SalesLedgerEntry> | null => {
  if (!ledger) return null
  return {
    summary: ledger.summary,
    entries: Array.isArray(ledger.entries) ? ledger.entries : [],
    pagination: paginationOf(ledger.pagination),
  }
}

export const purchaseLedgerView = (
  ledger: PurchaseLedger | null | undefined,
): LedgerView<PurchaseLedger['summary'], PurchaseLedgerEntry> | null => {
  if (!ledger) return null
  return {
    summary: ledger.summary,
    entries: Array.isArray(ledger.entries) ? ledger.entries : [],
    pagination: paginationOf(ledger.pagination),
  }
}

type LedgerSummaryLike = {
  total_transactions?: number
  total_gross?: number
  total_vat_10?: number
  total_vat_5?: number
  total_exempt?: number
  total_net?: number
}

/** KPIs comunes a ambos libros (el summary es global del filtro). */
export const ledgerKpis = (summary: LedgerSummaryLike | null | undefined): FinanceKpiValue[] => [
  { id: 'transactions', kind: 'count', value: toNumberOrNull(summary?.total_transactions) },
  { id: 'gross', kind: 'money', value: toNumberOrNull(summary?.total_gross) },
  { id: 'vat10', kind: 'money', value: toNumberOrNull(summary?.total_vat_10) },
  { id: 'vat5', kind: 'money', value: toNumberOrNull(summary?.total_vat_5) },
  { id: 'exempt', kind: 'money', value: toNumberOrNull(summary?.total_exempt) },
  { id: 'net', kind: 'money', value: toNumberOrNull(summary?.total_net) },
]

/** Un campo fiscal vacío no se muestra como texto inventado. */
export const fiscalText = (value: string | null | undefined): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/** Una venta tiene datos SIFEN solo si el BE adjuntó CDC o estado. */
export const hasFiscalData = (entry: SalesLedgerEntry): boolean =>
  Boolean(fiscalText(entry.cdc) || fiscalText(entry.fiscal_estado))
