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

/**
 * Stock del producto en un solo alcance (sucursal activa u opcional): el
 * desglose total/base/variantes que renderizan las cards de catálogo y
 * pedidos — el mismo mapeo del admin de productos.
 */
export interface ProductStockSummary {
  product_id: string
  branch_id?: number | null
  /** Filas de stock sin variante (producto base). */
  base_stock: number
  /** Suma de las filas de variantes. */
  variants_stock: number
  /** base + variantes. */
  total_stock: number
}

export interface CatalogPageData {
  products: CatalogProduct[]
  total: number
  page: number
  totalPages: number
}

/**
 * Fila plana de unidad vendible: proyección de `SellableUnitResponse`
 * (POST /products/search/advanced con `granularity: "variant"` —
 * PLAN_BUSQUEDA_VARIANTES_PLANAS §3.2). Cada fila ya resuelve la variante:
 * `variant_id` + `current_price` (variante-primero, fallback padre) y
 * `stock_quantity` propio de la unidad. `is_base_row` marca la fila
 * "producto base" de un producto CON variantes (stock base-only).
 */
export interface CatalogSellableUnit extends CatalogProduct {
  /** Producto padre; undefined/null en la fila base y productos sin variantes. */
  variant_id?: string | null
  is_base_row: boolean
  /** Nombre de la variante (ej. "Rojo / M"); solo en filas de variante. */
  variant_name?: string | null
  sku?: string | null
  variant_attributes?: Record<string, unknown> | null
}

/** Página del modo plano: mismas claves del envelope que CatalogPageData. */
export interface SellableUnitsPageData {
  products: CatalogSellableUnit[]
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
