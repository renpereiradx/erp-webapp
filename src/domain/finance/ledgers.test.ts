import { describe, expect, it } from 'vitest'
import {
  fiscalText,
  hasFiscalData,
  ledgerKpis,
  purchaseLedgerView,
  salesLedgerView,
} from './ledgers'
import type { PurchaseLedger, SalesLedger, SalesLedgerEntry } from '@/types/bi'

const entry = (overrides: Partial<SalesLedgerEntry> = {}): SalesLedgerEntry => ({
  date: '2026-10-20T08:25:46Z',
  invoice_number: '',
  timbrado: '',
  client_ruc: '8000',
  client_name: 'Erika Maciel',
  gross_amount: 120000,
  vat_10: 10909.09,
  vat_5: 0,
  exempt: 0,
  net_amount: 109090.91,
  payment_method: '',
  payment_status: 'PAID',
  ...overrides,
})

const sales: SalesLedger = {
  period: { start_date: '2026-10-01', end_date: '2026-11-01' },
  summary: {
    total_transactions: 6,
    total_gross: 1475500,
    total_vat_10: 38681.82,
    total_vat_5: 50000,
    total_exempt: 0,
    total_net: 1386818.18,
  },
  entries: [entry()],
  pagination: { page: 1, page_size: 10, total_items: 6, total_pages: 1 },
}

const purchases: PurchaseLedger = {
  period: { start_date: '2026-10-01', end_date: '2026-11-01' },
  summary: {
    total_transactions: 1,
    total_gross: 275000,
    total_vat_10: 25000,
    total_vat_5: 0,
    total_exempt: 0,
    total_net: 250000,
  },
  entries: null,
  pagination: { page: 1, page_size: 10, total_items: 1, total_pages: 1 },
}

describe('finance/ledgers', () => {
  it('normaliza entradas y paginación de ambos libros', () => {
    expect(salesLedgerView(sales)?.entries).toHaveLength(1)
    expect(purchaseLedgerView(purchases)?.entries).toEqual([])
    expect(purchaseLedgerView(null)).toBeNull()

    const view = purchaseLedgerView({
      ...purchases,
      pagination: { page: 0, page_size: 0, total_items: 0, total_pages: 0 },
    })!
    expect(view.pagination.page).toBe(1)
  })

  it('arma los KPIs del libro desde el summary', () => {
    expect(ledgerKpis(sales.summary).map((kpi) => kpi.id)).toEqual([
      'transactions',
      'gross',
      'vat10',
      'vat5',
      'exempt',
      'net',
    ])
  })

  it('un comprobante sin datos fiscales no se presenta como fiscal', () => {
    expect(fiscalText('')).toBeNull()
    expect(fiscalText('  ')).toBeNull()
    expect(fiscalText('APROBADO')).toBe('APROBADO')
    expect(hasFiscalData(entry())).toBe(false)
    expect(hasFiscalData(entry({ cdc: '123' }))).toBe(true)
    expect(hasFiscalData(entry({ fiscal_estado: 'APROBADO' }))).toBe(true)
  })
})
