/**
 * Hook de datos de los drill-downs relacionales (F3).
 *
 * Única frontera HTTP del feature (vía `fetcher` = services/bi): posee filtros
 * (draft vs aplicado), rango de fechas, sort, página y la query react-query
 * keyed por el scope completo. Los componentes reciben todo por props.
 *
 * `placeholderData` reusa la página anterior SOLO dentro del mismo scope
 * (endpoint + entidad + variante): al cambiar de producto/cliente/proveedor
 * no se muestran filas de otra entidad mientras carga la nueva.
 */

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BIEnvelope } from '@/types/bi';
import type {
  RelationalEndpoint,
  RelationalQueryParams,
  RelationalResponse,
} from '@/domain/relational-analytics/types';
import { normalizeResponse, type DrilldownView } from '@/domain/relational-analytics/normalize';
import { hasActiveFilters, isInvalidDateRange } from '@/domain/relational-analytics/filters';
import {
  flipDirection,
  naturalDirection,
  parseSortParam,
  toSortParam,
} from '@/domain/relational-analytics/sort';
import type { SortDirection } from '@/domain/relational-analytics/sort';

/** El BE cachea las agregaciones 60-120 s; el staleTime no promete frescura. */
export const RELATIONAL_STALE_TIME = 60_000;

export const DRILLDOWN_PAGE_SIZE = 10;

export type DrilldownFetcher<Row> = (
  id: string,
  params: RelationalQueryParams,
) => Promise<BIEnvelope<RelationalResponse<Row>>>;

export interface DrilldownPageScope {
  endpoint: RelationalEndpoint;
  entityId: string | null;
  variantId: string | null;
  params: RelationalQueryParams;
}

export const relationalQueryKeys = {
  all: ['bi', 'relational'] as const,
  page: (scope: DrilldownPageScope) => ['bi', 'relational', 'page', scope] as const,
  entity: (kind: string, id: string | null) => ['bi', 'relational', 'entity', kind, id] as const,
  variant: (id: string | null) => ['bi', 'relational', 'variant', id] as const,
};

export interface UseDrilldownQueryOptions<Row> {
  endpoint: RelationalEndpoint;
  entityId?: string | null;
  variantId?: string | null;
  fetcher: DrilldownFetcher<Row>;
  defaultSort: string;
  pageSize?: number;
}

export interface DrilldownQuery<Row> {
  view: DrilldownView<Row>;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
  qDraft: string;
  q: string;
  setQDraft: (value: string) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  dateRangeInvalid: boolean;
  sort: string;
  toggleSort: (field: string) => void;
  page: number;
  setPage: (page: number) => void;
}

/**
 * Los filtros de fecha se aplican al elegirlos (el input date emite valores
 * discretos); el texto se aplica con Enter/Aplicar para no fetchear por tecla.
 */
export function useDrilldownQuery<Row>({
  endpoint,
  entityId = null,
  variantId = null,
  fetcher,
  defaultSort,
  pageSize = DRILLDOWN_PAGE_SIZE,
}: UseDrilldownQueryOptions<Row>): DrilldownQuery<Row> {
  const [qDraft, setQDraft] = useState('');
  const [q, setQ] = useState('');
  const [dateFrom, setDateFromState] = useState('');
  const [dateTo, setDateToState] = useState('');
  const [sort, setSort] = useState(defaultSort);
  const [page, setPageState] = useState(1);

  const dateRangeInvalid = isInvalidDateRange(dateFrom, dateTo);

  const params = useMemo<RelationalQueryParams>(
    () => ({
      q: q || undefined,
      sort: sort || undefined,
      page,
      page_size: pageSize,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      variant_id: variantId || undefined,
    }),
    [q, sort, page, pageSize, dateFrom, dateTo, variantId],
  );

  const enabled = Boolean(entityId) && !dateRangeInvalid;

  const query = useQuery({
    queryKey: relationalQueryKeys.page({
      endpoint,
      entityId,
      variantId: variantId ?? null,
      params,
    }),
    queryFn: async () => {
      const response = await fetcher(entityId as string, params);
      if (!response || !response.data) {
        // Envelope roto: nunca degradar a una tabla vacía (ceros silenciosos).
        throw new Error('relational-response-invalid');
      }
      return { view: normalizeResponse<Row>(response.data), metadata: response.metadata };
    },
    enabled,
    staleTime: RELATIONAL_STALE_TIME,
    placeholderData: (previousData, previousQuery) => {
      if (!previousData || !previousQuery) return undefined;
      const previousScope = previousQuery.queryKey[3] as DrilldownPageScope | undefined;
      const sameScope =
        previousScope?.endpoint === endpoint &&
        previousScope?.entityId === entityId &&
        previousScope?.variantId === (variantId ?? null);
      return sameScope ? previousData : undefined;
    },
  });

  const setDateFrom = useCallback((value: string) => {
    setDateFromState(value);
    setPageState(1);
  }, []);

  const setDateTo = useCallback((value: string) => {
    setDateToState(value);
    setPageState(1);
  }, []);

  const applyFilters = useCallback(() => {
    setQ(qDraft.trim());
    setPageState(1);
  }, [qDraft]);

  const clearFilters = useCallback(() => {
    setQDraft('');
    setQ('');
    setDateFromState('');
    setDateToState('');
    setPageState(1);
  }, []);

  const toggleSort = useCallback((field: string) => {
    setSort((current) => {
      const parsed = parseSortParam(current);
      const nextDirection: SortDirection =
        parsed.field === field ? flipDirection(parsed.dir) : naturalDirection(field);
      return toSortParam(field, nextDirection);
    });
    setPageState(1);
  }, []);

  const setPage = useCallback((next: number) => {
    setPageState(Math.max(1, next));
  }, []);

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query.refetch]);

  return {
    view: query.data?.view ?? normalizeResponse<Row>(),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch,
    qDraft,
    q,
    setQDraft,
    applyFilters,
    clearFilters,
    hasActiveFilters: hasActiveFilters({ q, qDraft, dateFrom, dateTo }),
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    dateRangeInvalid,
    sort,
    toggleSort,
    page,
    setPage,
  };
}
