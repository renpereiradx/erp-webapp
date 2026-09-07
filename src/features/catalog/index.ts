/**
 * Feature: catálogo comercial (PLAN_CATALOGO_VENDEDOR 3.3).
 * Vista read-only de productos (precio de venta + detalles no sensibles)
 * para vendedor y cajero. Los datos sensibles se strippean server-side.
 */
export { CatalogBoard } from './components/CatalogBoard'
export { CatalogCard } from './components/CatalogCard'
export {
  useCatalogProducts,
  useCatalogFacets,
  useCatalogVariants,
} from './hooks/useCatalogProducts'
export { useDebouncedValue } from './hooks/useDebouncedValue'
export {
  CATALOG_PAGE_SIZE,
  DEFAULT_CATALOG_FILTERS,
} from './types'
export type {
  CatalogProduct,
  CatalogFilters,
  CatalogSortOption,
  CatalogPageData,
} from './types'
