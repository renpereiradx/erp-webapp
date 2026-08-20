import { describe, it, expect } from 'vitest';
import {
  groupConsecutive,
  rangeCount,
  isRangeWithinLimit,
  formatRange,
  formatRangePadded,
  INUTILIZE_RANGE_LIMIT,
} from './ranges';

describe('groupConsecutive', () => {
  it('agrupa consecutivos y deja sueltos los aislados', () => {
    expect(groupConsecutive([1, 2, 3, 5, 9, 10])).toEqual([
      { desde: 1, hasta: 3 },
      { desde: 5, hasta: 5 },
      { desde: 9, hasta: 10 },
    ]);
  });

  it('entrada vacía → []', () => {
    expect(groupConsecutive([])).toEqual([]);
  });

  it('un solo número → rango unitario', () => {
    expect(groupConsecutive([7])).toEqual([{ desde: 7, hasta: 7 }]);
  });

  it('secuencia completa → un único rango', () => {
    expect(groupConsecutive([4, 5, 6, 7])).toEqual([{ desde: 4, hasta: 7 }]);
  });

  it('ordena la entrada desordenada', () => {
    expect(groupConsecutive([10, 1, 2, 9])).toEqual([
      { desde: 1, hasta: 2 },
      { desde: 9, hasta: 10 },
    ]);
  });

  it('ignora duplicados', () => {
    expect(groupConsecutive([1, 1, 2, 2, 2, 4])).toEqual([
      { desde: 1, hasta: 2 },
      { desde: 4, hasta: 4 },
    ]);
  });
});

describe('rangeCount / isRangeWithinLimit', () => {
  it('cuenta inclusive', () => {
    expect(rangeCount({ desde: 1, hasta: 3 })).toBe(3);
    expect(rangeCount({ desde: 5, hasta: 5 })).toBe(1);
  });

  it('respeta el límite de 1000 del MT §11.1.1', () => {
    expect(INUTILIZE_RANGE_LIMIT).toBe(1000);
    expect(isRangeWithinLimit({ desde: 1, hasta: 1000 })).toBe(true);
    expect(isRangeWithinLimit({ desde: 1, hasta: 1001 })).toBe(false);
  });

  it('rechaza rangos invertidos o desde < 1', () => {
    expect(isRangeWithinLimit({ desde: 5, hasta: 2 })).toBe(false);
    expect(isRangeWithinLimit({ desde: 0, hasta: 10 })).toBe(false);
  });
});

describe('formatRange', () => {
  it('formatea unitario y multi', () => {
    expect(formatRange({ desde: 5, hasta: 5 })).toBe('5');
    expect(formatRange({ desde: 9, hasta: 10 })).toBe('9-10');
  });

  it('formato padded C007 de 7 dígitos', () => {
    expect(formatRangePadded({ desde: 5, hasta: 5 })).toBe('0000005');
    expect(formatRangePadded({ desde: 1, hasta: 3 })).toBe('0000001-0000003');
  });
});
