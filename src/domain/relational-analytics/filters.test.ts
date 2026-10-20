import { describe, expect, it } from 'vitest';
import { hasActiveFilters, isInvalidDateRange } from './filters';

describe('isInvalidDateRange', () => {
  it('accepts open and well-ordered ranges', () => {
    expect(isInvalidDateRange('', '')).toBe(false);
    expect(isInvalidDateRange('2026-09-01', '')).toBe(false);
    expect(isInvalidDateRange('', '2026-09-30')).toBe(false);
    expect(isInvalidDateRange('2026-09-01', '2026-09-30')).toBe(false);
    expect(isInvalidDateRange('2026-09-30', '2026-09-30')).toBe(false);
  });

  it('rejects an inverted range (ISO dates compare lexicographically)', () => {
    expect(isInvalidDateRange('2026-09-30', '2026-09-01')).toBe(true);
  });
});

describe('hasActiveFilters', () => {
  it('is false with no filters', () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ q: '', qDraft: '', dateFrom: '', dateTo: '' })).toBe(false);
  });

  it('detects applied, draft and date filters', () => {
    expect(hasActiveFilters({ q: 'gomez' })).toBe(true);
    expect(hasActiveFilters({ qDraft: 'gom' })).toBe(true);
    expect(hasActiveFilters({ dateFrom: '2026-09-01' })).toBe(true);
    expect(hasActiveFilters({ dateTo: '2026-09-30' })).toBe(true);
  });
});
