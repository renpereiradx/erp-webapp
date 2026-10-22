/**
 * Ordenamiento server-side de la tabla de productos comprados
 * (`GET /purchase-analytics/by-product`).
 *
 * Whitelist = `purchaseProductSortFields` del handler BE
 * (`internal/analytics/http_purchase.go`): purchases, units, name,
 * last_purchase. El BE rechaza con 400 cualquier otro valor (no hay fallback
 * silencioso), así que la UI solo ofrece estos campos.
 */
import type { PurchaseProductSort, PurchaseSortOrder } from '@/types/bi'
import { PURCHASE_PAGE_SIZE } from './constants'

/** Filas por página de la tabla de productos (server-side). */
export const PURCHASE_PRODUCTS_PAGE_SIZE = PURCHASE_PAGE_SIZE

export interface PurchaseProductSortState {
  by: PurchaseProductSort
  order: PurchaseSortOrder
}

export const DEFAULT_PURCHASE_PRODUCT_SORT: PurchaseProductSortState = {
  by: 'purchases',
  order: 'desc',
}

const SORT_FIELDS: readonly PurchaseProductSort[] = [
  'purchases',
  'units',
  'name',
  'last_purchase',
]

export const isPurchaseProductSortField = (value: unknown): value is PurchaseProductSort =>
  typeof value === 'string' && (SORT_FIELDS as readonly string[]).includes(value)

/** Orden natural: texto ascendente, números y fechas descendente. */
export const naturalPurchaseProductSortOrder = (field: PurchaseProductSort): PurchaseSortOrder =>
  field === 'name' ? 'asc' : 'desc'

export const nextPurchaseProductSort = (
  current: PurchaseProductSortState,
  field: PurchaseProductSort,
): PurchaseProductSortState => {
  if (current.by === field) {
    return { by: field, order: current.order === 'asc' ? 'desc' : 'asc' }
  }
  return { by: field, order: naturalPurchaseProductSortOrder(field) }
}
