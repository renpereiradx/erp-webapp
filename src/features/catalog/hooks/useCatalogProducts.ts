// ===========================================================================
// Hooks de datos del catálogo comercial (PLAN_CATALOGO_VENDEDOR 3.3).
//
// Una sola fuente: POST /products/search/advanced (products:read). El
// endpoint retorna la proyección SearchResultProduct, que nunca llevó
// campos de costo; y tras FASE 1 los endpoints financieros tampoco los
// exponen sin products:cost. La vista no necesita un "modo especial".
// ===========================================================================

import { useQuery } from '@tanstack/react-query'
import { productService } from '@/services/productService'
import { categoryService } from '@/services/categoryService'
import { brandService } from '@/services/brandService'
import { variantService } from '@/services/variantService'
import type { ProductVariant } from '@/types'
import {
  CATALOG_PAGE_SIZE,
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilters,
  type CatalogPageData,
  type CatalogProduct,
} from '../types'

/** Respuesta cruda del backend (AdvancedSearchResponse, Go). */
interface RawAdvancedSearchResponse {
  products?: Array<Record<string, unknown>>
  total_count?: number
  page?: number
  page_size?: number
  total_pages?: number
}

function toCatalogProduct(raw: Record<string, unknown>): CatalogProduct {
  return {
    id: String(raw.id ?? raw.product_id ?? ''),
    name: String(raw.name ?? raw.product_name ?? ''),
    barcode: (raw.barcode as string | null) ?? null,
    base_unit: (raw.base_unit as string | null) ?? null,
    current_price: (raw.current_price as number | null) ?? null,
    stock_quantity: (raw.stock_quantity as number | null) ?? null,
    stock_status: (raw.stock_status as CatalogProduct['stock_status']) ?? 'out_of_stock',
    brand_name: (raw.brand_name as string | null) ?? null,
    category_name: (raw.category_name as string | null) ?? null,
    has_variant: Boolean(raw.has_variant),
    variant_count: Number(raw.variant_count ?? 0),
    image_url: (raw.image_url as string | null) ?? null,
    state: raw.state !== false,
  }
}

export function useCatalogProducts(search: string, filters: CatalogFilters, page: number) {
  return useQuery({
    queryKey: ['catalog', search, filters, page],
    queryFn: async (): Promise<CatalogPageData> => {
      const response = (await productService.searchAdvanced({
        search: search || undefined,
        category_id: filters.categoryId ?? undefined,
        brand_ids: filters.brandIds.length > 0 ? filters.brandIds : undefined,
        in_stock_only: filters.inStockOnly || undefined,
        sort_by: filters.sortBy,
        page,
        page_size: CATALOG_PAGE_SIZE,
      })) as RawAdvancedSearchResponse

      return {
        products: (response?.products ?? []).map(toCatalogProduct),
        total: response?.total_count ?? 0,
        page: response?.page ?? page,
        totalPages: response?.total_pages ?? 0,
      }
    },
    placeholderData: previous => previous,
  })
}

/** Opciones de los filtros (categorías y marcas activas). */
export function useCatalogFacets() {
  const categories = useQuery({
    queryKey: ['catalog', 'facets', 'categories'],
    queryFn: () => categoryService.getAll(),
    staleTime: 5 * 60_000,
  })
  const brands = useQuery({
    queryKey: ['catalog', 'facets', 'brands'],
    queryFn: () => brandService.getAll(),
    staleTime: 5 * 60_000,
  })
  return { categories, brands }
}

/** Variantes de un producto, cargadas solo al expandir su tarjeta. */
export function useCatalogVariants(productId: string | null) {
  return useQuery({
    queryKey: ['catalog', 'variants', productId],
    queryFn: (): Promise<ProductVariant[]> =>
      variantService.getVariantsByProductId(productId!, false),
    enabled: productId !== null,
    staleTime: 60_000,
  })
}

export { DEFAULT_CATALOG_FILTERS }
