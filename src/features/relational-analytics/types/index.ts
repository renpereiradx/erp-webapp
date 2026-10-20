import type { LucideIcon } from 'lucide-react';
import type { RelationalEntityKind } from '@/domain/relational-analytics/types';

/**
 * Tipos propios del feature de drill-downs relacionales (F3). Los contratos
 * de fila/payload viven en `domain/relational-analytics/types.ts` (congelados
 * contra el BE); acá solo está la forma que consumen los componentes.
 */

/** Resultado del picker de entidad (producto/cliente/proveedor). */
export interface EntityOption {
  id: string;
  label: string;
  /** referencia secundaria: SKU (producto) o documento (party) */
  sub?: string;
  /** variante de la fila plana (solo productos); null = fila base */
  variantId?: string | null;
}

export type EntitySearchFn = (
  term: string,
  ctx?: { signal?: AbortSignal },
) => Promise<EntityOption[]>;

/** Acción del menú por fila: pivote a otro análisis o copia de un dato. */
export interface DrilldownRowAction {
  id: string;
  label: string;
  /** línea informativa con datos concretos de la fila (unidades, importes, SKU) */
  description?: string;
  icon?: LucideIcon;
  onSelect: () => void;
}

export interface DrilldownRowMenu {
  /** nombre de la entidad (encabezado del menú y aria-label del trigger) */
  title: string;
  /** identificador secundario de la entidad (documento, RUC o SKU) */
  subtitle?: string;
  actions: DrilldownRowAction[];
}

/**
 * Controles de filtro/sort/paginación que `DrilldownFilters` consume sin
 * conocer el tipo de fila de la pantalla.
 */
export interface DrilldownFilterControls {
  qDraft: string;
  setQDraft: (value: string) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  dateRangeInvalid: boolean;
  isFetching: boolean;
  refetch: () => void;
}

export type { RelationalEntityKind };
