/**
 * Modelo de sort de los drill-downs relacionales (PLAN_STATS_RELACIONALES_BI).
 * El backend valida contra su whitelist (ParseRelationalSort) y espera un
 * único param `sort` con signo: "+campo" ascendente / "-campo" descendente.
 * Este módulo es la fuente pura del modelo FE: construir, parsear y alternar.
 */

export type SortDirection = 'ASC' | 'DESC';

export interface ParsedSort {
  field: string;
  dir: SortDirection;
}

/** "+campo" / "-campo" → { field, dir }. Sin signo = ascendente (contrato BE). */
export const parseSortParam = (param: string): ParsedSort => {
  const raw = (param || '').trim();
  if (!raw) return { field: '', dir: 'DESC' };
  if (raw.startsWith('-')) return { field: raw.slice(1), dir: 'DESC' };
  if (raw.startsWith('+')) return { field: raw.slice(1), dir: 'ASC' };
  return { field: raw, dir: 'ASC' };
};

/** { field, dir } → "+campo" / "-campo". */
export const toSortParam = (field: string, dir: SortDirection): string =>
  `${dir === 'DESC' ? '-' : '+'}${field}`;

/**
 * Dirección natural al ordenar por un campo por primera vez: los textos
 * suben (A→Z), las métricas bajan (mayor primero).
 */
export const naturalDirection = (field: string): SortDirection =>
  field === 'client_name' || field === 'product_name' || field === 'supplier_name'
    ? 'ASC'
    : 'DESC';

/** Alternar la dirección si ya se ordena por ese campo. */
export const flipDirection = (dir: SortDirection): SortDirection =>
  dir === 'ASC' ? 'DESC' : 'ASC';
