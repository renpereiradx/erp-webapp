/**
 * Normalización pura de respuestas de los drill-downs relacionales.
 * El contrato BE (§4) entrega {rows, total, page, page_size}; la vista
 * necesita además totalPages para TablePagination.
 */
import type { RelationalResponse } from './types';

export interface DrilldownView<Row> {
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** solo #4: compras en otra moneda fuera del ranking (meta D3) */
  excludedOtherCurrency: number;
}

export const normalizeResponse = <Row>(
  data: RelationalResponse<Row> | null | undefined,
): DrilldownView<Row> => {
  const total = Math.max(data?.total ?? 0, 0);
  const pageSize = Math.max(data?.page_size ?? 10, 1);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  return {
    rows: data?.rows ?? [],
    total,
    page: Math.max(data?.page ?? 1, 1),
    pageSize,
    totalPages,
    excludedOtherCurrency: data?.excluded_other_currency ?? 0,
  };
};

/** Fecha ISO del contrato → fecha local (día). Vacío/inválido → '—'. */
export const formatDrilldownDate = (value?: string | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
};
