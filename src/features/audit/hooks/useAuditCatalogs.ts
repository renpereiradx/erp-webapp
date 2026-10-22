/**
 * Catálogos de Auditoría para los filtros (BI-D10).
 *
 * Solo se consume `/api/v1/audit/entity-types`: categorías y acciones usan el
 * vocabulario cerrado de `domain/audit/labels.ts` (el catálogo del BE no
 * incluye `LEGACY`) y los niveles son los cuatro del modelo. El catálogo es
 * estable; un `staleTime` largo evita pedirlo en cada navegación. Si falla, el
 * filtro queda con "Todos" y el resto del registro sigue funcionando.
 */
import { useQuery } from '@tanstack/react-query'
import { auditService } from '@/services/bi/auditService'
import type { AuditCatalogOption } from '@/types/bi'

export const AUDIT_CATALOG_STALE_TIME = 30 * 60_000

export const auditCatalogQueryKeys = {
  entityTypes: ['bi', 'audit', 'catalogs', 'entity-types'] as const,
}

export const useAuditEntityTypes = (): AuditCatalogOption[] => {
  const query = useQuery({
    queryKey: auditCatalogQueryKeys.entityTypes,
    queryFn: async (): Promise<AuditCatalogOption[]> => {
      const response = await auditService.getEntityTypes()
      return (response.data ?? []).filter((option) => Boolean(option?.code))
    },
    staleTime: AUDIT_CATALOG_STALE_TIME,
  })
  return query.data ?? []
}

export default useAuditEntityTypes
