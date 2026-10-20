import { describe, expect, it } from 'vitest';
import {
  formatDrilldownCount,
  formatDrilldownDate,
  formatDrilldownMoney,
  formatDrilldownUnits,
  normalizeResponse,
} from './normalize';

/**
 * Normalización del contrato congelado {rows, total, page, page_size} a la
 * vista (totalPages para TablePagination) + meta D3 de #4.
 */
describe('normalizeResponse', () => {
  it('normalizes null/undefined to an empty page', () => {
    expect(normalizeResponse(null)).toEqual({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      excludedOtherCurrency: 0,
    });
  });

  it('computes totalPages from total/page_size', () => {
    const view = normalizeResponse<{ id: string }>({
      rows: [{ id: 'a' }],
      total: 12,
      page: 2,
      page_size: 10,
    });
    expect(view.totalPages).toBe(2);
    expect(view.page).toBe(2);
    expect(view.rows).toHaveLength(1);
  });

  it('never returns zero pages or zero page_size', () => {
    expect(normalizeResponse({ total: 0 }).totalPages).toBe(1);
    expect(normalizeResponse({ total: 5, page_size: 0 }).pageSize).toBe(1);
  });

  it('passes through the D3 exclusion count', () => {
    expect(normalizeResponse({ excluded_other_currency: 4 }).excludedOtherCurrency).toBe(4);
  });
});

describe('formatDrilldownDate', () => {
  it('formats ISO timestamps to the local date', () => {
    const out = formatDrilldownDate('2026-09-20T12:00:00Z');
    expect(out).not.toBe('—');
    expect(out).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it('honours the UI locale (day/month order follows the app language)', () => {
    expect(formatDrilldownDate('2026-05-22T12:00:00Z', 'es-PY')).toBe('22/5/2026');
    expect(formatDrilldownDate('2026-05-22T12:00:00Z', 'en-US')).toBe('5/22/2026');
  });

  it('falls back to a dash for empty or invalid values', () => {
    expect(formatDrilldownDate(null)).toBe('—');
    expect(formatDrilldownDate('')).toBe('—');
    expect(formatDrilldownDate('nope')).toBe('—');
  });
});

describe('formatDrilldownUnits', () => {
  it('uses the product base unit when the row declares it (F5)', () => {
    expect(formatDrilldownUnits(40, 'kg')).toBe('40 kg');
    expect(formatDrilldownUnits(1200, 'doc')).toBe('1.200 doc');
  });

  it('translates the generic unit code instead of leaking "unit"', () => {
    expect(formatDrilldownUnits(3, 'unit')).toBe('3 uds.');
    expect(formatDrilldownUnits(3, 'unidad')).toBe('3 uds.');
    expect(formatDrilldownUnits(1, 'unit')).toBe('1 ud.');
      });

  it('falls back to the generic counter without a base unit', () => {
    expect(formatDrilldownUnits(9)).toBe('9 uds.');
    expect(formatDrilldownUnits(1)).toBe('1 ud.');
  });

  it('renders a dash for non-positive units (BE could not normalize, not a 0 sale)', () => {
    expect(formatDrilldownUnits(0, 'unit')).toBe('—');
    expect(formatDrilldownUnits(null)).toBe('—');
    expect(formatDrilldownUnits(Number.NaN)).toBe('—');
  });
});

describe('formatDrilldownCount', () => {
  it('groups thousands and never emits NaN', () => {
    expect(formatDrilldownCount(1200)).toBe('1.200');
    expect(formatDrilldownCount(0)).toBe('0');
    expect(formatDrilldownCount(null)).toBe('0');
    expect(formatDrilldownCount(Number.NaN)).toBe('0');
  });
});

describe('formatDrilldownMoney', () => {
  it('formats the BI base currency as PYG when the contract omits the code', () => {
    expect(formatDrilldownMoney(1_500_000)).toBe('Gs. 1.500.000');
    expect(formatDrilldownMoney(0)).toBe('Gs. 0');
  });

  it('uses the row currency for #4 (base-currency comparison)', () => {
    expect(formatDrilldownMoney(5000, 'PYG')).toContain('Gs.');
    const usd = formatDrilldownMoney(12.5, 'USD');
    expect(usd).toContain('USD');
    expect(usd).toContain('12,50');
    expect(usd).not.toContain('Gs.');
  });

  it('never fabricates a zero for a missing or non-numeric value', () => {
    expect(formatDrilldownMoney(null)).toBe('—');
    expect(formatDrilldownMoney(undefined)).toBe('—');
    expect(formatDrilldownMoney(Number.NaN)).toBe('—');
  });
});
