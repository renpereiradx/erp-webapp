import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Envelope } from './envelope';
import type { RelationalQueryParams, RelationalResponse } from '@/domain/relational-analytics/types';
import { normalizeResponse } from '@/domain/relational-analytics/normalize';
import type { DrilldownView } from '@/domain/relational-analytics/normalize';
import {
  flipDirection,
  naturalDirection,
  parseSortParam,
  toSortParam,
} from '@/domain/relational-analytics/sort';
import type { SortDirection } from '@/domain/relational-analytics/sort';

export type DrilldownFetcher<Row> = (
  id: string,
  params: RelationalQueryParams,
) => Promise<Envelope<RelationalResponse<Row>>>;

interface DrilldownQueryState<Row> {
  view: DrilldownView<Row>;
  loading: boolean;
  error: string | null;
}

export interface DrilldownQuery<Row> extends DrilldownQueryState<Row> {
  /** filtros (borrador vs aplicado: tipear no fetcha) */
  qDraft: string;
  setQDraft: (q: string) => void;
  applyQ: () => void;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  sort: string;
  /** click en encabezado: alterna dirección o cambia de campo */
  toggleSort: (field: string) => void;
  page: number;
  setPage: (page: number) => void;
  refresh: () => void;
}

const PAGE_SIZE = 10;

/**
 * Hook de datos de los drill-downs relacionales: posee filtros (draft vs
 * aplicado), sort, página y la consulta contra el fetcher del endpoint.
 * Sin `id` (entidad aún no elegida) queda idle.
 *
 * El efecto depende de una clave serializada de params (rerender-dependencies:
 * deps primitivas) — fetcher/id son estables por página.
 */
export function useDrilldownQuery<Row>(options: {
  id?: string;
  fetcher: DrilldownFetcher<Row>;
  defaultSort: string;
  pageSize?: number;
  /** filtro opcional por variante (picker de productos con variantes) */
  variantId?: string | null;
}): DrilldownQuery<Row> {
  const { id, fetcher, defaultSort, pageSize = PAGE_SIZE, variantId } = options;

  const [qDraft, setQDraft] = useState('');
  const [qApplied, setQApplied] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<DrilldownQueryState<Row>>({
    view: normalizeResponse<Row>(null),
    loading: false,
    error: null,
  });

  const params = useMemo<RelationalQueryParams>(
    () => ({
      q: qApplied || undefined,
      sort: sort || undefined,
      page,
      page_size: pageSize,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      variant_id: variantId || undefined,
    }),
    [qApplied, sort, page, pageSize, dateFrom, dateTo, variantId],
  );
  const paramsKey = `${id ?? ''}|${JSON.stringify(params)}|${refreshKey}`;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher(id, params)
      .then((res) => {
        if (cancelled) return;
        if (res && res.success) {
          setState({ view: normalizeResponse(res.data), loading: false, error: null });
        } else {
          setState((s) => ({ ...s, loading: false, error: 'bad_response' }));
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'error';
        setState((s) => ({ ...s, loading: false, error: message }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dep única primitiva
  }, [paramsKey]);

  const applyQ = useCallback(() => {
    setQApplied(qDraft.trim());
    setPage(1);
  }, [qDraft]);

  const toggleSort = useCallback(
    (field: string) => {
      const current = parseSortParam(sort);
      const nextDir: SortDirection =
        current.field === field ? flipDirection(current.dir) : naturalDirection(field);
      setSort(toSortParam(field, nextDir));
      setPage(1);
    },
    [sort],
  );

  return {
    view: state.view,
    loading: state.loading,
    error: state.error,
    qDraft,
    setQDraft,
    applyQ,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    sort,
    toggleSort,
    page,
    setPage,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
