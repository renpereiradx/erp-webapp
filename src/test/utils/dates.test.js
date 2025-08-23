/**
 * Date Utilities Tests
 * Wave 6: Advanced Analytics & Reporting - Date Utility Testing
 * 
 * Tests para las utilidades de fechas utilizadas en analytics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  isDateInRange,
  getDateRange,
  formatDateRange,
  getDateDiff,
  addDays,
  subtractDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  getWeeksInRange,
  getMonthsInRange,
  getQuartersInRange,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isThisYear,
  getRelativeTimeString
} from '@/utils/dates';

describe('isDateInRange', () => {
  const testDate = new Date('2025-08-23');
  const startDate = new Date('2025-08-20');
  const endDate = new Date('2025-08-25');

  it('returns true for dates within range', () => {
    expect(isDateInRange(testDate, startDate, endDate)).toBe(true);
    expect(isDateInRange(startDate, startDate, endDate)).toBe(true);
    expect(isDateInRange(endDate, startDate, endDate)).toBe(true);
  });

  it('returns false for dates outside range', () => {
    const beforeStart = new Date('2025-08-19');
    const afterEnd = new Date('2025-08-26');
    
    expect(isDateInRange(beforeStart, startDate, endDate)).toBe(false);
    expect(isDateInRange(afterEnd, startDate, endDate)).toBe(false);
  });

  it('handles string date inputs', () => {
    expect(isDateInRange('2025-08-23', '2025-08-20', '2025-08-25')).toBe(true);
    expect(isDateInRange('2025-08-19', '2025-08-20', '2025-08-25')).toBe(false);
  });

  it('handles edge cases', () => {
    expect(isDateInRange(null, startDate, endDate)).toBe(false);
    expect(isDateInRange(testDate, null, endDate)).toBe(false);
    expect(isDateInRange(testDate, startDate, null)).toBe(false);
  });
});

describe('getDateRange', () => {
  it('generates correct date ranges for different periods', () => {
    const baseDate = new Date('2025-08-23');
    
    // Last 7 days
    const last7Days = getDateRange('last7days', baseDate);
    expect(last7Days.start).toEqual(new Date('2025-08-16'));
    expect(last7Days.end).toEqual(new Date('2025-08-23'));

    // Last 30 days
    const last30Days = getDateRange('last30days', baseDate);
    expect(last30Days.start).toEqual(new Date('2025-07-24'));
    expect(last30Days.end).toEqual(new Date('2025-08-23'));

    // This month
    const thisMonth = getDateRange('thisMonth', baseDate);
    expect(thisMonth.start).toEqual(new Date('2025-08-01'));
    expect(thisMonth.end.getMonth()).toBe(7); // August (0-indexed)
    expect(thisMonth.end.getDate()).toBe(31);

    // Last month
    const lastMonth = getDateRange('lastMonth', baseDate);
    expect(lastMonth.start).toEqual(new Date('2025-07-01'));
    expect(lastMonth.end).toEqual(new Date('2025-07-31'));
  });

  it('handles quarter ranges', () => {
    const q2Date = new Date('2025-05-15');
    const thisQuarter = getDateRange('thisQuarter', q2Date);
    
    expect(thisQuarter.start).toEqual(new Date('2025-04-01'));
    expect(thisQuarter.end).toEqual(new Date('2025-06-30'));
  });

  it('handles year ranges', () => {
    const testDate = new Date('2025-08-23');
    const thisYear = getDateRange('thisYear', testDate);
    
    expect(thisYear.start).toEqual(new Date('2025-01-01'));
    expect(thisYear.end).toEqual(new Date('2025-12-31'));
  });

  it('handles custom ranges', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-12-31');
    const custom = getDateRange('custom', null, start, end);
    
    expect(custom.start).toEqual(start);
    expect(custom.end).toEqual(end);
  });
});

describe('formatDateRange', () => {
  it('formats date ranges correctly', () => {
    const start = new Date('2025-08-01');
    const end = new Date('2025-08-31');
    
    const formatted = formatDateRange(start, end);
    expect(formatted).toContain('Aug 1');
    expect(formatted).toContain('Aug 31');
    expect(formatted).toContain('2025');
  });

  it('handles same month ranges', () => {
    const start = new Date('2025-08-01');
    const end = new Date('2025-08-15');
    
    const formatted = formatDateRange(start, end, { samMonth: true });
    expect(formatted).toContain('Aug 1-15');
  });

  it('handles different locales', () => {
    const start = new Date('2025-08-01');
    const end = new Date('2025-08-31');
    
    const formatted = formatDateRange(start, end, { locale: 'es-ES' });
    expect(formatted).toContain('ago');
  });
});

describe('getDateDiff', () => {
  const date1 = new Date('2025-08-01');
  const date2 = new Date('2025-08-31');

  it('calculates differences in days', () => {
    expect(getDateDiff(date1, date2, 'days')).toBe(30);
    expect(getDateDiff(date2, date1, 'days')).toBe(-30);
  });

  it('calculates differences in hours', () => {
    const hour1 = new Date('2025-08-23T10:00:00');
    const hour2 = new Date('2025-08-23T14:00:00');
    
    expect(getDateDiff(hour1, hour2, 'hours')).toBe(4);
  });

  it('calculates differences in minutes', () => {
    const min1 = new Date('2025-08-23T10:00:00');
    const min2 = new Date('2025-08-23T10:30:00');
    
    expect(getDateDiff(min1, min2, 'minutes')).toBe(30);
  });

  it('handles absolute differences', () => {
    expect(getDateDiff(date2, date1, 'days', true)).toBe(30);
    expect(getDateDiff(date1, date2, 'days', true)).toBe(30);
  });
});

describe('Date arithmetic functions', () => {
  const baseDate = new Date('2025-08-23');

  describe('addDays', () => {
    it('adds days correctly', () => {
      const result = addDays(baseDate, 7);
      expect(result).toEqual(new Date('2025-08-30'));
    });

    it('handles negative values', () => {
      const result = addDays(baseDate, -7);
      expect(result).toEqual(new Date('2025-08-16'));
    });

    it('handles month boundaries', () => {
      const result = addDays(new Date('2025-08-31'), 1);
      expect(result).toEqual(new Date('2025-09-01'));
    });
  });

  describe('subtractDays', () => {
    it('subtracts days correctly', () => {
      const result = subtractDays(baseDate, 7);
      expect(result).toEqual(new Date('2025-08-16'));
    });

    it('handles month boundaries', () => {
      const result = subtractDays(new Date('2025-09-01'), 1);
      expect(result).toEqual(new Date('2025-08-31'));
    });
  });
});

describe('Date boundary functions', () => {
  const testDate = new Date('2025-08-23T14:30:45.123');

  describe('Day boundaries', () => {
    it('gets start of day', () => {
      const result = startOfDay(testDate);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('gets end of day', () => {
      const result = endOfDay(testDate);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('Week boundaries', () => {
    it('gets start of week (Monday)', () => {
      const friday = new Date('2025-08-22'); // Friday
      const result = startOfWeek(friday);
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(18);
    });

    it('gets end of week (Sunday)', () => {
      const tuesday = new Date('2025-08-19'); // Tuesday
      const result = endOfWeek(tuesday);
      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(24);
    });
  });

  describe('Month boundaries', () => {
    it('gets start of month', () => {
      const result = startOfMonth(testDate);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(7); // August
    });

    it('gets end of month', () => {
      const result = endOfMonth(testDate);
      expect(result.getDate()).toBe(31); // August has 31 days
      expect(result.getMonth()).toBe(7); // August
    });

    it('handles February correctly', () => {
      const feb2025 = new Date('2025-02-15');
      const endFeb = endOfMonth(feb2025);
      expect(endFeb.getDate()).toBe(28); // 2025 is not a leap year
      
      const feb2024 = new Date('2024-02-15');
      const endFeb2024 = endOfMonth(feb2024);
      expect(endFeb2024.getDate()).toBe(29); // 2024 is a leap year
    });
  });

  describe('Year boundaries', () => {
    it('gets start of year', () => {
      const result = startOfYear(testDate);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(1);
    });

    it('gets end of year', () => {
      const result = endOfYear(testDate);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(31);
    });
  });
});

describe('Date range generation functions', () => {
  const startDate = new Date('2025-08-01');
  const endDate = new Date('2025-08-31');

  describe('getWeeksInRange', () => {
    it('generates weeks in range', () => {
      const weeks = getWeeksInRange(startDate, endDate);
      expect(weeks).toHaveLength(5); // August 2025 has 5 weeks
      expect(weeks[0].start.getDay()).toBe(1); // Starts on Monday
    });
  });

  describe('getMonthsInRange', () => {
    it('generates months in range', () => {
      const yearStart = new Date('2025-01-01');
      const yearEnd = new Date('2025-12-31');
      const months = getMonthsInRange(yearStart, yearEnd);
      
      expect(months).toHaveLength(12);
      expect(months[0].month).toBe(0); // January
      expect(months[11].month).toBe(11); // December
    });

    it('handles partial months', () => {
      const partialStart = new Date('2025-08-15');
      const partialEnd = new Date('2025-09-15');
      const months = getMonthsInRange(partialStart, partialEnd);
      
      expect(months).toHaveLength(2);
    });
  });

  describe('getQuartersInRange', () => {
    it('generates quarters in range', () => {
      const yearStart = new Date('2025-01-01');
      const yearEnd = new Date('2025-12-31');
      const quarters = getQuartersInRange(yearStart, yearEnd);
      
      expect(quarters).toHaveLength(4);
      expect(quarters[0].quarter).toBe(1);
      expect(quarters[3].quarter).toBe(4);
    });
  });
});

describe('Date comparison functions', () => {
  let today, yesterday, tomorrow;

  beforeEach(() => {
    const now = new Date();
    today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  });

  describe('isToday', () => {
    it('identifies today correctly', () => {
      expect(isToday(today)).toBe(true);
      expect(isToday(new Date())).toBe(true);
    });

    it('identifies non-today dates correctly', () => {
      expect(isToday(yesterday)).toBe(false);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('isYesterday', () => {
    it('identifies yesterday correctly', () => {
      expect(isYesterday(yesterday)).toBe(true);
    });

    it('identifies non-yesterday dates correctly', () => {
      expect(isYesterday(today)).toBe(false);
      expect(isYesterday(tomorrow)).toBe(false);
    });
  });

  describe('isTomorrow', () => {
    it('identifies tomorrow correctly', () => {
      expect(isTomorrow(tomorrow)).toBe(true);
    });

    it('identifies non-tomorrow dates correctly', () => {
      expect(isTomorrow(today)).toBe(false);
      expect(isTomorrow(yesterday)).toBe(false);
    });
  });

  describe('isThisWeek', () => {
    it('identifies dates in current week', () => {
      expect(isThisWeek(today)).toBe(true);
    });

    it('identifies dates outside current week', () => {
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      expect(isThisWeek(lastWeek)).toBe(false);
      expect(isThisWeek(nextWeek)).toBe(false);
    });
  });

  describe('isThisMonth', () => {
    it('identifies dates in current month', () => {
      expect(isThisMonth(today)).toBe(true);
    });

    it('identifies dates outside current month', () => {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
      
      expect(isThisMonth(lastMonth)).toBe(false);
      expect(isThisMonth(nextMonth)).toBe(false);
    });
  });

  describe('isThisYear', () => {
    it('identifies dates in current year', () => {
      expect(isThisYear(today)).toBe(true);
    });

    it('identifies dates outside current year', () => {
      const lastYear = new Date(today.getFullYear() - 1, 6, 15);
      const nextYear = new Date(today.getFullYear() + 1, 6, 15);
      
      expect(isThisYear(lastYear)).toBe(false);
      expect(isThisYear(nextYear)).toBe(false);
    });
  });
});

describe('getRelativeTimeString', () => {
  const now = new Date();

  it('handles future dates', () => {
    const future = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    expect(getRelativeTimeString(future)).toContain('en 1 hora');
  });

  it('handles past dates', () => {
    const past = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    expect(getRelativeTimeString(past)).toContain('hace 1 hora');
  });

  it('handles different time units', () => {
    const minute = new Date(now.getTime() - 60 * 1000);
    const day = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    expect(getRelativeTimeString(minute)).toContain('minuto');
    expect(getRelativeTimeString(day)).toContain('día');
    expect(getRelativeTimeString(week)).toContain('semana');
  });

  it('handles different locales', () => {
    const past = new Date(now.getTime() - 60 * 60 * 1000);
    
    const spanish = getRelativeTimeString(past, { locale: 'es-ES' });
    const english = getRelativeTimeString(past, { locale: 'en-US' });
    
    expect(spanish).toContain('hace');
    expect(english).toContain('ago');
  });

  it('handles edge cases', () => {
    expect(getRelativeTimeString(null)).toBe('Fecha inválida');
    expect(getRelativeTimeString(undefined)).toBe('Fecha inválida');
    expect(getRelativeTimeString('invalid')).toBe('Fecha inválida');
  });
});
