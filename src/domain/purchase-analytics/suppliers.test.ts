import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PURCHASE_SUPPLIER_SORT,
  buildSupplierPurchaseRows,
  isPurchaseSupplierSortField,
  nextPurchaseSupplierSort,
} from './suppliers'
import type { SupplierPurchasesData } from '@/types/bi'

describe('whitelist de sort de proveedores', () => {
  it('espeja la whitelist del handler BE (amount/purchases/name/last_purchase)', () => {
    for (const field of ['amount', 'purchases', 'name', 'last_purchase']) {
      expect(isPurchaseSupplierSortField(field)).toBe(true)
    }
    expect(isPurchaseSupplierSortField('total')).toBe(false)
    expect(isPurchaseSupplierSortField('units')).toBe(false)
  })

  it('toggle de orden', () => {
    expect(nextPurchaseSupplierSort(DEFAULT_PURCHASE_SUPPLIER_SORT, 'amount')).toEqual({
      by: 'amount',
      order: 'asc',
    })
    expect(nextPurchaseSupplierSort(DEFAULT_PURCHASE_SUPPLIER_SORT, 'last_purchase')).toEqual({
      by: 'last_purchase',
      order: 'desc',
    })
  })
})

describe('buildSupplierPurchaseRows', () => {
  const supplier = (overrides: Partial<SupplierPurchasesData> = {}): SupplierPurchasesData => ({
    supplier_id: 'SUP1',
    supplier_name: 'Proveedor Uno',
    supplier_doc: '80012345-6',
    total_purchases: 275000,
    transaction_count: 3,
    average_order: 91666.67,
    last_purchase: '2026-10-06T10:45:47Z',
    first_purchase: '2026-09-02T08:00:00Z',
    rank: 1,
    ...overrides,
  })

  it('deriva las filas sin calcular cifras nuevas', () => {
    const rows = buildSupplierPurchaseRows([supplier()])
    expect(rows[0]).toMatchObject({
      id: 'SUP1',
      name: 'Proveedor Uno',
      doc: '80012345-6',
      totalPurchases: 275000,
      orders: 3,
      averageOrder: 91666.67,
      lastPurchaseIso: '2026-10-06T10:45:47Z',
    })
  })

  it('proveedor sin nombre cae al id; sin doc queda vacío', () => {
    const rows = buildSupplierPurchaseRows([supplier({ supplier_name: '', supplier_doc: undefined })])
    expect(rows[0].name).toBe('SUP1')
    expect(rows[0].doc).toBe('')
  })

  it('lista null (slice nil de Go) → []', () => {
    expect(buildSupplierPurchaseRows(null)).toEqual([])
  })
})
