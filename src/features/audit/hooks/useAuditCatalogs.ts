/**
 * Catálogos de Auditoría para los filtros (BI-D10).
 *
 * `/categories` y `/entity-types` se piden con `?distinct=true`: el BE mergea
 * el vocabulario del modelo con los valores reales de `audit_logs`, así
 * aparecen `LEGACY`, `SALE_PAYMENTS` y cualquier valor histórico. Los
 * catálogos son estables; un `staleTime` largo evita pedirlos en cada
 * navegación. Si fallan, categorías cae al vocabulario cerrado del modelo y
 * entity types a lista vacía: el resto del registro sigue funcionando.
 */
import { useQuery } from '@tanstack/react-query'
import { auditService } from '@/services/bi/auditService'
import { AUDIT_FILTER_CATEGORIES } from '@/domain/audit/labels'
import type { AuditCatalogOption } from '@/types/bi'

export const AUDIT_CATALOG_STALE_TIME = 30 * 60_000

export const auditCatalogQueryKeys = {
  categories: ['bi', 'audit', 'catalogs', 'categories'] as const,
  entityTypes: ['bi', 'audit', 'catalogs', 'entity-types'] as const,
}

const clean = (options: AuditCatalogOption[] | null | undefined): AuditCatalogOption[] =>
  (options ?? []).filter((option) => Boolean(option?.code))

const FALLBACK_CATEGORIES: AuditCatalogOption[] = AUDIT_FILTER_CATEGORIES.map(
  (code) => ({ code, name: code }),
)

export interface AuditCatalogs {
  categories: AuditCatalogOption[]
  entityTypes: AuditCatalogOption[]
}

export const useAuditCatalogs = (): AuditCatalogs => {
  const categoriesQuery = useQuery({
    queryKey: auditCatalogQueryKeys.categories,
    queryFn: async (): Promise<AuditCatalogOption[]> =>
      clean((await auditService.getCategories()).data),
    staleTime: AUDIT_CATALOG_STALE_TIME,
  })

  const entityTypesQuery = useQuery({
    queryKey: auditCatalogQueryKeys.entityTypes,
    queryFn: async (): Promise<AuditCatalogOption[]> =>
      clean((await auditService.getEntityTypes()).data),
    staleTime: AUDIT_CATALOG_STALE_TIME,
  })

  return {
    categories:
      categoriesQuery.data && categoriesQuery.data.length > 0
        ? categoriesQuery.data
        : FALLBACK_CATEGORIES,
    entityTypes: entityTypesQuery.data ?? [],
  }
}

export default useAuditCatalogs
