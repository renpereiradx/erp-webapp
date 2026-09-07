/**
 * Tipos del catálogo comercial (PLAN_CATALOGO_VENDEDOR 3.3).
 *
 * El catálogo es solo-lectura y NO Sensible: precio de venta, stock,
 * variante y metadatos. Los campos de costo/margen/proveedor se strippean
 * server-side (products:cost) y acá ni se tipan ni se consumen.
 */

/** Proyección de `SearchResultProductResponse` (POST /products/search/advanced). */
export interface CatalogProduct {
  id: string
  name: string
  barcode?: string | null
  base_unit?: string | null
  /** P.V.P. con IVA anclado a la unidad base (mv_product_catalog.current_price). */
  current_price?: number | null
  stock_quantity?: number | null
  stock_status: 'in_stock' | 'low_stock' | 'medium_stock' | 'out_of_stock' | string
  brand_name?: string | null
  category_name?: string | null
  has_variant: boolean
  variant_count: number
  image_url?: string | null
  state: boolean
}

export interface CatalogFilters {
  categoryId: number | null
  brandIds: number[]
  inStockOnly: boolean
  sortBy: CatalogSortOption
}

export type CatalogSortOption = 'name_asc' | 'price_asc' | 'price_desc' | 'newest'

export interface CatalogPageData {
  products: CatalogProduct[]
  total: number
  page: number
  totalPages: number
}

export const CATALOG_PAGE_SIZE = 12

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  categoryId: null,
  brandIds: [],
  inStockOnly: false,
  sortBy: 'name_asc',
}
