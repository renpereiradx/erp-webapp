import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Package, Search, SlidersHorizontal } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CATALOG_PAGE_SIZE,
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilters,
  type CatalogSortOption,
} from '../types'
import { useCatalogFacets, useCatalogSellableUnits } from '../hooks/useCatalogProducts'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { CatalogCard } from './CatalogCard'

const SORT_OPTIONS: CatalogSortOption[] = ['name_asc', 'price_asc', 'price_desc', 'newest']

/**
 * Catálogo comercial (PLAN_CATALOGO_VENDEDOR 3.3; filas planas:
 * PLAN_BUSQUEDA_VARIANTES_PLANAS F4): consulta de precios read-only para
 * vendedor y cajero. Búsqueda con debounce — también por SKU/nombre de
 * variante —, filtros de categoría/marca, grilla mobile-first y paginación.
 * Sin acciones de gestión.
 */
export function CatalogBoard() {
  const { t } = useI18n()

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_CATALOG_FILTERS)
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 350)
  const { categories, brands } = useCatalogFacets()
  const unitsQuery = useCatalogSellableUnits(debouncedSearch, filters, page)

  const categoryOptions = useMemo(
    () => (categories.data ?? []).filter((c: any) => c?.is_active !== false),
    [categories.data]
  )
  const brandOptions = useMemo(
    () => (brands.data ?? []).filter((b: any) => b?.is_active !== false),
    [brands.data]
  )

  const units = unitsQuery.data?.products ?? []
  const total = unitsQuery.data?.total ?? 0
  const totalPages = unitsQuery.data?.totalPages ?? 0

  const updateFilters = (patch: Partial<CatalogFilters>) => {
    setFilters(prev => ({ ...prev, ...patch }))
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('common.commercial', 'Gestión Comercial')}
          title={t('catalog.title', 'Catálogo')}
          subtitle={t('catalog.subtitle', 'Consulta de productos y precios de venta.')}
        />

        <section className="mt-lg space-y-md" aria-label={t('catalog.title', 'Catálogo')}>
          {/* Toolbar: búsqueda + filtros */}
          <div className="flex flex-col gap-md lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-deep pointer-events-none"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchTerm}
                onChange={event => {
                  setSearchTerm(event.target.value)
                  setPage(1)
                }}
                placeholder={t('catalog.search.placeholder', 'Buscar por nombre o código de barras…')}
                aria-label={t('catalog.search.placeholder', 'Buscar por nombre o código de barras…')}
                className="pl-9"
                data-testid="catalog-search"
              />
            </div>

            <div className="flex flex-wrap items-center gap-sm">
              <SlidersHorizontal className="w-4 h-4 text-on-surface-deep" aria-hidden="true" />
              <Select
                value={filters.categoryId != null ? String(filters.categoryId) : 'all'}
                onValueChange={value =>
                  updateFilters({ categoryId: value === 'all' ? null : Number(value) })
                }
              >
                <SelectTrigger className="w-[180px]" aria-label={t('catalog.filter.category', 'Categoría')}>
                  <SelectValue placeholder={t('catalog.filter.category', 'Categoría')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('catalog.filter.all', 'Todas')}</SelectItem>
                  {categoryOptions.map((category: any) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={
                  filters.brandIds.length === 1 ? String(filters.brandIds[0]) : 'all'
                }
                onValueChange={value =>
                  updateFilters({ brandIds: value === 'all' ? [] : [Number(value)] })
                }
              >
                <SelectTrigger className="w-[160px]" aria-label={t('catalog.filter.brand', 'Marca')}>
                  <SelectValue placeholder={t('catalog.filter.brand', 'Marca')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('catalog.filter.all', 'Todas')}</SelectItem>
                  {brandOptions.map((brand: any) => (
                    <SelectItem key={brand.id} value={String(brand.id)}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.sortBy}
                onValueChange={value => updateFilters({ sortBy: value as CatalogSortOption })}
              >
                <SelectTrigger className="w-[170px]" aria-label={t('catalog.filter.sort', 'Ordenar')}>
                  <SelectValue placeholder={t('catalog.filter.sort', 'Ordenar')} />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {t(`catalog.sort.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="flex items-center gap-xs text-body-sm text-foreground cursor-pointer">
                <Checkbox
                  checked={filters.inStockOnly}
                  onCheckedChange={checked => updateFilters({ inStockOnly: checked === true })}
                  aria-label={t('catalog.filter.in_stock', 'Solo con stock')}
                />
                {t('catalog.filter.in_stock', 'Solo con stock')}
              </label>
            </div>
          </div>

          {/* Estados de datos (DESIGN.md §6.7) */}
          {unitsQuery.isLoading && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md"
              aria-busy="true"
            >
              {Array.from({ length: CATALOG_PAGE_SIZE }).map((_, index) => (
                <Skeleton key={index} className="h-44 rounded-md bg-surface-muted" />
              ))}
            </div>
          )}

          {unitsQuery.isError && (
            <ErrorState
              title={t('errors.load_title', 'Error al cargar')}
              message={t('catalog.error.message', 'No se pudo cargar el catálogo.')}
              onRetry={() => unitsQuery.refetch()}
            />
          )}

          {!unitsQuery.isLoading && !unitsQuery.isError && units.length === 0 && (
            <EmptyState
              icon={Package}
              title={t('catalog.empty.title', 'Sin resultados')}
              description={t(
                'catalog.empty.description',
                'No hay productos que coincidan con la búsqueda.'
              )}
            />
          )}

          {!unitsQuery.isLoading && !unitsQuery.isError && units.length > 0 && (
            <>
              <p className="text-body-sm text-on-surface-deep" data-testid="catalog-count">
                {t('catalog.count', '{total} productos', { total })}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
                {units.map(unit => (
                  <CatalogCard key={unit.variant_id ?? unit.id} unit={unit} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="flex items-center justify-end gap-sm pt-sm"
                  aria-label={t('catalog.pagination', 'Paginación')}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {t('catalog.prev_page', 'Anterior')}
                  </Button>
                  <span className="text-body-sm-bold text-foreground tabular-nums">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    {t('catalog.next_page', 'Siguiente')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
