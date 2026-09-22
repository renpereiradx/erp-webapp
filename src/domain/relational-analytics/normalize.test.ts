import { describe, expect, it } from 'vitest';
import { formatDrilldownDate, normalizeResponse } from './normalize';

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

  it('falls back to a dash for empty or invalid values', () => {
    expect(formatDrilldownDate(null)).toBe('—');
    expect(formatDrilldownDate('')).toBe('—');
    expect(formatDrilldownDate('nope')).toBe('—');
  });
});
