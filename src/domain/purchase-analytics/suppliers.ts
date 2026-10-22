/**
 * Ordenamiento server-side y filas de la tabla de proveedores
 * (`GET /purchase-analytics/by-supplier`).
 *
 * Whitelist = `purchaseSupplierSortFields` del handler BE: amount (monto),
 * purchases (cantidad de órdenes), name, last_purchase. 400 fuera de ella.
 */
import type { PurchaseSortOrder, PurchaseSupplierSort, SupplierPurchasesData } from '@/types/bi'
import { PURCHASE_PAGE_SIZE } from './constants'

/** Filas por página de la tabla de proveedores (server-side). */
export const PURCHASE_SUPPLIERS_PAGE_SIZE = PURCHASE_PAGE_SIZE

export interface PurchaseSupplierSortState {
  by: PurchaseSupplierSort
  order: PurchaseSortOrder
}

export const DEFAULT_PURCHASE_SUPPLIER_SORT: PurchaseSupplierSortState = {
  by: 'amount',
  order: 'desc',
}

const SORT_FIELDS: readonly PurchaseSupplierSort[] = [
  'amount',
  'purchases',
  'name',
  'last_purchase',
]

export const isPurchaseSupplierSortField = (value: unknown): value is PurchaseSupplierSort =>
  typeof value === 'string' && (SORT_FIELDS as readonly string[]).includes(value)

export const naturalPurchaseSupplierSortOrder = (
  field: PurchaseSupplierSort,
): PurchaseSortOrder => (field === 'name' ? 'asc' : 'desc')

export const nextPurchaseSupplierSort = (
  current: PurchaseSupplierSortState,
  field: PurchaseSupplierSort,
): PurchaseSupplierSortState => {
  if (current.by === field) {
    return { by: field, order: current.order === 'asc' ? 'desc' : 'asc' }
  }
  return { by: field, order: naturalPurchaseSupplierSortOrder(field) }
}

export interface SupplierPurchaseRow {
  id: string
  name: string
  /** Documento (RUC/CI) si el proveedor lo tiene; `''` si no. */
  doc: string
  totalPurchases: number
  orders: number
  averageOrder: number
  lastPurchaseIso: string
}

const toNumber = (value: number | null | undefined): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

/** Filas de la tabla de proveedores, sin derivar cifras nuevas. */
export const buildSupplierPurchaseRows = (
  suppliers: SupplierPurchasesData[] | null | undefined,
): SupplierPurchaseRow[] =>
  (suppliers ?? []).map((supplier) => ({
    id: supplier.supplier_id,
    name: supplier.supplier_name || supplier.supplier_id,
    doc: supplier.supplier_doc || '',
    totalPurchases: toNumber(supplier.total_purchases),
    orders: toNumber(supplier.transaction_count),
    averageOrder: toNumber(supplier.average_order),
    lastPurchaseIso: supplier.last_purchase || '',
  }))
