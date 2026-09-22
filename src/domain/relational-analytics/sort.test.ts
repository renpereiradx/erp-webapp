import { describe, expect, it } from 'vitest';
import {
  flipDirection,
  naturalDirection,
  parseSortParam,
  toSortParam,
} from './sort';

/**
 * Modelo de sort de los drill-downs relacionales: formato del contrato BE
 * (`+campo`/-campo`, sin signo = ASC) y direcciones naturales de UI.
 */
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
