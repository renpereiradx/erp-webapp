/**
 * Contexto de cabecera de un drill-down: nombre de la entidad y de la
 * variante resueltos contra los endpoints Core (no BI). Es metadata de
 * presentación: si falla o aún no llegó, la UI cae al id de la URL y el
 * análisis BI sigue intacto (la query de datos no depende de esto).
 */

import { useQuery } from '@tanstack/react-query';
import productService from '@/services/productService';
import clientService from '@/services/clientService';
import supplierService from '@/services/supplierService';
import { variantService } from '@/services/variantService';
import {
  entityDisplay,
  variantDisplayName,
  type EntityDisplay,
} from '@/domain/relational-analytics/entity';
import type { RelationalEntityKind } from '@/domain/relational-analytics/types';
import { relationalQueryKeys } from './useDrilldownQuery';

const ENTITY_STALE_TIME = 5 * 60_000;

const fetchEntity = async (kind: RelationalEntityKind, id: string): Promise<unknown> => {
  switch (kind) {
    case 'product':
      return productService.getById(id);
    case 'client':
      return clientService.getById(id);
    case 'supplier':
      return supplierService.getById(id);
  }
};

export interface DrilldownEntityContext {
  display: EntityDisplay;
  variantLabel: string | null;
}

export const useDrilldownEntity = (
  kind: RelationalEntityKind,
  entityId: string | null,
  variantId: string | null = null,
): DrilldownEntityContext => {
  const entityQuery = useQuery({
    queryKey: relationalQueryKeys.entity(kind, entityId),
    queryFn: () => fetchEntity(kind, entityId as string),
    enabled: Boolean(entityId),
    staleTime: ENTITY_STALE_TIME,
    retry: false,
  });

  const variantQuery = useQuery({
    queryKey: relationalQueryKeys.variant(variantId),
    queryFn: () => variantService.getVariantById(variantId as string),
    enabled: Boolean(variantId),
    staleTime: ENTITY_STALE_TIME,
    retry: false,
  });

  return {
    display: entityDisplay(kind, entityQuery.data, entityId ?? ''),
    variantLabel: variantId ? variantDisplayName(variantQuery.data, variantId) : null,
  };
};
