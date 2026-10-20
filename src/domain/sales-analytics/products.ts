/**
 * Ordenamiento server-side y rankings de productos
 * (`GET /sales-analytics/by-product`, `GET /sales-analytics/top-bottom-products`).
 *
 * La whitelist de `sort_by` es la del repositorio
 * (`validSortFields` en `analytics_sales_repo.go`): sales, units, margin,
 * name, last_sale. Cualquier otro valor caería al default del BE (sales) sin
 * avisar, así que la UI solo ofrece esos campos.
 */
import type {
  ProductSalesData,
  SalesProductSort,
  SalesSortOrder,
} from '@/types/bi'
import { SALES_PAGE_SIZE } from './constants'

/** Filas por página de la tabla de productos (server-side). */
export const SALES_PRODUCTS_PAGE_SIZE = SALES_PAGE_SIZE

export interface ProductSortState {
  by: SalesProductSort
  order: SalesSortOrder
}

export const DEFAULT_PRODUCT_SORT: ProductSortState = { by: 'sales', order: 'desc' }

const SORT_FIELDS: readonly SalesProductSort[] = ['sales', 'units', 'margin', 'name', 'last_sale']

export const isProductSortField = (value: unknown): value is SalesProductSort =>
  typeof value === 'string' && (SORT_FIELDS as readonly string[]).includes(value)

/** Orden natural al entrar a un campo: texto ascendente, números descendente. */
export const naturalProductSortOrder = (field: SalesProductSort): SalesSortOrder => {
  if (field === 'name') return 'asc'
  return 'desc'
}

/**
 * Toggle de orden: mismo campo → invierte dirección; campo nuevo → su orden
 * natural. El BE ordena por `sort_by`/`sort_order`, nunca client-side.
 */
export const nextProductSort = (
  current: ProductSortState,
  field: SalesProductSort,
): ProductSortState => {
  if (current.by === field) {
    return { by: field, order: current.order === 'asc' ? 'desc' : 'asc' }
  }
  return { by: field, order: naturalProductSortOrder(field) }
}

export interface ProductRankItem {
  id: string
  name: string
  category: string
  sales: number
  units: number
  marginPct: number
}

const toNumber = (value: number | null | undefined): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

/** Filas de una lista de ranking (top/bottom/margen/volumen). */
export const buildProductRankItems = (
  products: ProductSalesData[] | null | undefined,
): ProductRankItem[] =>
  (products ?? []).map((product) => ({
    id: product.product_id,
    name: product.product_name || product.product_id,
    category: product.category_name || '',
    sales: toNumber(product.sales),
    units: toNumber(product.units_sold),
    marginPct: toNumber(product.gross_margin_pct),
  }))
