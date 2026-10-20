/**
 * Modelo de sort de los drill-downs relacionales (PLAN_STATS_RELACIONALES_BI).
 * El backend valida contra su whitelist (ParseRelationalSort) y espera un
 * único param `sort` con signo: "+campo" ascendente / "-campo" descendente.
 * Este módulo es la fuente pura del modelo FE: whitelist, defaults, construir,
 * parsear y alternar.
 */

import type { DrilldownColumn, RelationalEndpoint } from './types';

export type SortDirection = 'ASC' | 'DESC';

export interface ParsedSort {
  field: string;
  dir: SortDirection;
}

/**
 * Espejo exacto de `relationalSortFields` en
 * `business_management/internal/analytics/relational.go`. Un campo fuera de
 * esta lista dispara 400 en el BE, así que las columnas ordenables se derivan
 * de acá (`withSortableColumns`) en vez de marcarlas a mano.
 */
export const RELATIONAL_SORT_FIELDS: Record<RelationalEndpoint, readonly string[]> = {
  'product-buyers': [
    'total',
    'units',
    'purchases',
    'avg_unit_price',
    'last_purchase_at',
    'client_name',
  ],
  'top-products': [
    'units',
    'total',
    'purchases',
    'avg_unit_price',
    'last_purchase_at',
    'product_name',
  ],
  'product-suppliers': [
    'last_unit_price',
    'avg_unit_price',
    'min_unit_price',
    'units',
    'purchases',
    'last_purchase_at',
    'supplier_name',
  ],
};

/** Defaults del BE (§D5): compradores por importe, top por unidades, proveedores por precio. */
export const RELATIONAL_DEFAULT_SORT: Record<RelationalEndpoint, string> = {
  'product-buyers': '-total',
  'top-products': '-units',
  'product-suppliers': '+last_unit_price',
};

export const isSortableField = (endpoint: RelationalEndpoint, field: string): boolean =>
  RELATIONAL_SORT_FIELDS[endpoint].includes(field);

/**
 * Marca `sortable` según la whitelist del endpoint: la config de columnas no
 * puede prometer un orden que el backend rechace.
 */
export const withSortableColumns = <Row>(
  endpoint: RelationalEndpoint,
  columns: readonly DrilldownColumn<Row>[],
): DrilldownColumn<Row>[] =>
  columns.map((column) => ({
    ...column,
    sortable: isSortableField(endpoint, column.key),
  }));

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
