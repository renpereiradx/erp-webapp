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
import { useBranch } from '@/contexts/BranchContext'
import type { ProductVariant } from '@/types'
import {
  CATALOG_PAGE_SIZE,
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilters,
  type CatalogPageData,
  type CatalogProduct,
  type CatalogSellableUnit,
  type ProductStockSummary,
  type SellableUnitsPageData,
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

function toCatalogSellableUnit(raw: Record<string, unknown>): CatalogSellableUnit {
  return {
    ...toCatalogProduct(raw),
    variant_id: (raw.variant_id as string | null) ?? null,
    is_base_row: Boolean(raw.is_base_row),
    variant_name: (raw.variant_name as string | null) ?? null,
    sku: (raw.sku as string | null) ?? null,
    variant_attributes: (raw.variant_attributes as Record<string, unknown> | null) ?? null,
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

/**
 * Modo plano (granularity "variant", PLAN_BUSQUEDA_VARIANTES_PLANAS F2): una
 * fila por unidad vendible — variantes activas + fila base + productos sin
 * variantes. El término también matchea SKU/barcode/nombre de variante, y
 * cada fila trae precio y stock propios (sin N+1 de variantes).
 */
export function useCatalogSellableUnits(search: string, filters: CatalogFilters, page: number) {
  return useQuery({
    queryKey: ['catalog', 'units', search, filters, page],
    queryFn: async (): Promise<SellableUnitsPageData> => {
      const response = (await productService.searchAdvanced({
        search: search || undefined,
        category_id: filters.categoryId ?? undefined,
        brand_ids: filters.brandIds.length > 0 ? filters.brandIds : undefined,
        in_stock_only: filters.inStockOnly || undefined,
        sort_by: filters.sortBy,
        page,
        page_size: CATALOG_PAGE_SIZE,
        granularity: 'variant',
      })) as RawAdvancedSearchResponse

      return {
        products: (response?.products ?? []).map(toCatalogSellableUnit),
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

/**
 * Variantes de un producto, cargadas solo al expandir su tarjeta. Usa la
 * MISMA fuente que el selector de /ventas (getEnrichedVariants): el listado
 * crudo de variantes no trae stock ni precio — mostrar `stock_quantity ?? 0`
 * era siempre 0 (fix capturas 2026-09-09). El stock se pide por sucursal
 * activa, que es la que valida la venta al cobrar.
 */
export function useCatalogVariants(productId: string | null) {
  const { currentBranchId } = useBranch()
  return useQuery({
    queryKey: ['catalog', 'variants', productId, currentBranchId ?? null],
    queryFn: (): Promise<ProductVariant[]> =>
      variantService.getEnrichedVariants(productId!, currentBranchId ?? undefined, false),
    enabled: productId !== null,
    staleTime: 60_000,
  })
}

/**
 * Desglose total/base/variantes del producto en la sucursal activa (una
 * consulta). Las cards lo muestran como "Stock: total" + fila base con su
 * propio stock — sin mezclar alcances. Si el backend aún no tiene el
 * endpoint, la query falla en silencio y las cards caen al total global.
 */
export function useProductStockSummary(productId: string | null) {
  const { currentBranchId } = useBranch()
  return useQuery({
    queryKey: ['catalog', 'stock-summary', productId, currentBranchId ?? null],
    queryFn: (): Promise<ProductStockSummary> =>
      variantService.getStockSummary(productId!, currentBranchId ?? undefined),
    enabled: productId !== null,
    staleTime: 30_000,
    retry: false,
  })
}

export { DEFAULT_CATALOG_FILTERS }
