import { describe, expect, it } from 'vitest';
import {
  RELATIONAL_DEFAULT_SORT,
  RELATIONAL_SORT_FIELDS,
  flipDirection,
  isSortableField,
  naturalDirection,
  parseSortParam,
  toSortParam,
  withSortableColumns,
} from './sort';

/**
 * Modelo de sort de los drill-downs relacionales: formato del contrato BE
 * (`+campo`/-campo`, sin signo = ASC) y direcciones naturales de UI.
 */
describe('RELATIONAL_SORT_FIELDS', () => {
  it('mirrors the backend whitelist (ParseRelationalSort) per endpoint', () => {
    // Espejo de internal/analytics/relational.go — un drift acá produce 400.
    expect(RELATIONAL_SORT_FIELDS['product-buyers']).toEqual([
      'total',
      'units',
      'purchases',
      'avg_unit_price',
      'last_purchase_at',
      'client_name',
    ]);
    expect(RELATIONAL_SORT_FIELDS['top-products']).toEqual([
      'units',
      'total',
      'purchases',
      'avg_unit_price',
      'last_purchase_at',
      'product_name',
    ]);
    expect(RELATIONAL_SORT_FIELDS['product-suppliers']).toEqual([
      'last_unit_price',
      'avg_unit_price',
      'min_unit_price',
      'units',
      'purchases',
      'last_purchase_at',
      'supplier_name',
    ]);
  });

  it('rejects fields outside the endpoint whitelist', () => {
    expect(isSortableField('product-buyers', 'client_name')).toBe(true);
    expect(isSortableField('product-buyers', 'client_doc')).toBe(false);
    expect(isSortableField('top-products', 'product_sku')).toBe(false);
    expect(isSortableField('product-suppliers', 'supplier_doc')).toBe(false);
    expect(isSortableField('product-suppliers', 'last_unit_price')).toBe(true);
  });

  it('uses the backend default sorts (D5)', () => {
    expect(RELATIONAL_DEFAULT_SORT).toEqual({
      'product-buyers': '-total',
      'top-products': '-units',
      'product-suppliers': '+last_unit_price',
    });
  });
});

describe('withSortableColumns', () => {
  it('derives the sortable flag from the endpoint whitelist', () => {
    const columns = withSortableColumns('product-buyers', [
      { key: 'client_name', labelKey: 'x', labelFallback: 'X', format: 'text', align: 'left' },
      { key: 'client_doc', labelKey: 'y', labelFallback: 'Y', format: 'text', align: 'left' },
      { key: 'total', labelKey: 'z', labelFallback: 'Z', format: 'money', align: 'right' },
    ]);
    expect(columns.map((column) => column.sortable)).toEqual([true, false, true]);
  });
});
describe('parseSortParam', () => {
  it('parses signed params', () => {
    expect(parseSortParam('-total')).toEqual({ field: 'total', dir: 'DESC' });
    expect(parseSortParam('+last_unit_price')).toEqual({ field: 'last_unit_price', dir: 'ASC' });
  });

  it('treats bare fields as ascending (BE contract)', () => {
    expect(parseSortParam('units')).toEqual({ field: 'units', dir: 'ASC' });
  });

  it('defaults empty to unsorted DESC', () => {
    expect(parseSortParam('')).toEqual({ field: '', dir: 'DESC' });
  });
});

describe('toSortParam', () => {
  it('round-trips with parseSortParam', () => {
    for (const [field, dir] of [
      ['total', 'DESC'],
      ['avg_unit_price', 'ASC'],
    ] as const) {
      const param = toSortParam(field, dir);
      expect(parseSortParam(param)).toEqual({ field, dir });
    }
  });
});

describe('naturalDirection', () => {
  it('sorts names A→Z and metrics biggest-first', () => {
    expect(naturalDirection('client_name')).toBe('ASC');
    expect(naturalDirection('product_name')).toBe('ASC');
    expect(naturalDirection('supplier_name')).toBe('ASC');
    expect(naturalDirection('total')).toBe('DESC');
    expect(naturalDirection('last_unit_price')).toBe('DESC');
    expect(naturalDirection('units')).toBe('DESC');
  });
});

describe('flipDirection', () => {
  it('flips both ways', () => {
    expect(flipDirection('ASC')).toBe('DESC');
    expect(flipDirection('DESC')).toBe('ASC');
  });
});
