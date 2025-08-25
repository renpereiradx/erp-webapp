/**
 * Formatting Utilities Tests
 * Wave 6: Advanced Analytics & Reporting - Utility Testing
 * 
 * Tests para las utilidades de formateo utilizadas en analytics
 */

import { describe, it, expect } from 'vitest';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercentage, 
  formatDate 
} from '@/utils/formatting';

describe('formatCurrency', () => {
  it('formats basic currency values correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('handles negative values', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    expect(formatCurrency(-0.99)).toBe('-$0.99');
  });

  it('handles different currency options', () => {
    expect(formatCurrency(1234.56, { currency: 'EUR' })).toContain('EUR');
    expect(formatCurrency(1234.56, { currency: 'MXN' })).toContain('MX');
  });

  it('handles different locales', () => {
    expect(formatCurrency(1234.56, { locale: 'es-ES' })).toContain('1.234,56');
    expect(formatCurrency(1234.56, { locale: 'en-US' })).toContain('1,234.56');
  });

  it('handles compact notation', () => {
    expect(formatCurrency(1500000, { compact: true })).toBe('$1.5M');
    expect(formatCurrency(1500, { compact: true })).toBe('$1.5K');
    expect(formatCurrency(999, { compact: true })).toBe('$999.00');
  });

  it('handles edge cases', () => {
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
    expect(formatCurrency(NaN)).toBe('$0.00');
    expect(formatCurrency(Infinity)).toBe('$0.00');
  });
});

describe('formatNumber', () => {
  it('formats basic numbers correctly', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('handles decimal places', () => {
    expect(formatNumber(1234.56, { decimals: 2 })).toBe('1,234.56');
    expect(formatNumber(1234.567, { decimals: 1 })).toBe('1,234.6');
    expect(formatNumber(1234, { decimals: 2 })).toBe('1,234.00');
  });

  it('handles compact notation', () => {
    expect(formatNumber(1500000, { compact: true })).toBe('1.5M');
    expect(formatNumber(1500, { compact: true })).toBe('1.5K');
    expect(formatNumber(1500000000, { compact: true })).toBe('1.5B');
    expect(formatNumber(999, { compact: true })).toBe('999');
  });

  it('handles different locales', () => {
    expect(formatNumber(1234.56, { locale: 'es-ES' })).toContain('1.234');
    expect(formatNumber(1234.56, { locale: 'en-US' })).toContain('1,234');
  });

  it('handles negative numbers', () => {
    expect(formatNumber(-1234)).toBe('-1,234');
    expect(formatNumber(-1500000, { compact: true })).toBe('-1.5M');
  });

  it('handles edge cases', () => {
    expect(formatNumber(null)).toBe('0');
    expect(formatNumber(undefined)).toBe('0');
    expect(formatNumber(NaN)).toBe('0');
    expect(formatNumber(Infinity)).toBe('0');
  });
});

describe('formatPercentage', () => {
  it('formats basic percentages correctly', () => {
    expect(formatPercentage(0.1234)).toBe('12.34%');
    expect(formatPercentage(0)).toBe('0.00%');
    expect(formatPercentage(1)).toBe('100.00%');
    expect(formatPercentage(0.5)).toBe('50.00%');
  });

  it('handles values already in percentage form', () => {
    expect(formatPercentage(12.34, { isAlreadyPercentage: true })).toBe('12.34%');
    expect(formatPercentage(100, { isAlreadyPercentage: true })).toBe('100.00%');
  });

  it('handles different decimal places', () => {
    expect(formatPercentage(0.12345, { decimals: 1 })).toBe('12.3%');
    expect(formatPercentage(0.12345, { decimals: 0 })).toBe('12%');
    expect(formatPercentage(0.12345, { decimals: 3 })).toBe('12.345%');
  });

  it('handles different locales', () => {
    expect(formatPercentage(0.1234, { locale: 'es-ES' })).toContain('12,34');
    expect(formatPercentage(0.1234, { locale: 'en-US' })).toContain('12.34');
  });

  it('handles edge cases', () => {
    expect(formatPercentage(null)).toBe('0.00%');
    expect(formatPercentage(undefined)).toBe('0.00%');
    expect(formatPercentage(NaN)).toBe('0.00%');
    expect(formatPercentage(Infinity)).toBe('0.00%');
    expect(formatPercentage(-0.1)).toBe('-10.00%');
  });

  it('handles values greater than 100%', () => {
    expect(formatPercentage(1.5)).toBe('150.00%');
    expect(formatPercentage(2)).toBe('200.00%');
  });
});

describe('formatDate', () => {
  const testDate = new Date('2025-08-23T14:30:00.000Z');

  it('formats dates with default options', () => {
    const result = formatDate(testDate);
    expect(result).toContain('23');
    expect(result).toContain('08');
    expect(result).toContain('2025');
  });

  it('handles different format options', () => {
    expect(formatDate(testDate, { format: 'short' })).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(formatDate(testDate, { format: 'medium' })).toContain('Aug');
    expect(formatDate(testDate, { format: 'long' })).toContain('August');
    expect(formatDate(testDate, { format: 'full' })).toContain('Friday');
  });

  it('handles time inclusion', () => {
    const result = formatDate(testDate, { includeTime: true });
    expect(result).toContain('14:30');
  });

  it('handles different locales', () => {
    const resultES = formatDate(testDate, { locale: 'es-ES', format: 'long' });
    const resultEN = formatDate(testDate, { locale: 'en-US', format: 'long' });
    
    expect(resultES).toContain('agosto');
    expect(resultEN).toContain('August');
  });

  it('handles relative dates', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    expect(formatDate(now, { relative: true })).toContain('hoy');
    expect(formatDate(yesterday, { relative: true })).toContain('ayer');
    expect(formatDate(tomorrow, { relative: true })).toContain('mañana');
  });

  it('handles string date inputs', () => {
    expect(formatDate('2025-08-23')).toContain('23');
    expect(formatDate('2025-08-23T14:30:00')).toContain('23');
  });

  it('handles timestamp inputs', () => {
    const timestamp = testDate.getTime();
    expect(formatDate(timestamp)).toContain('23');
  });

  it('handles edge cases', () => {
    expect(formatDate(null)).toBe('Fecha inválida');
    expect(formatDate(undefined)).toBe('Fecha inválida');
    expect(formatDate('invalid-date')).toBe('Fecha inválida');
    expect(formatDate(NaN)).toBe('Fecha inválida');
  });

  it('handles timezone options', () => {
    const result = formatDate(testDate, { 
      timeZone: 'America/Mexico_City',
      includeTime: true 
    });
    expect(result).toBeDefined();
  });

  it('formats with custom patterns', () => {
    expect(formatDate(testDate, { format: 'yyyy-MM-dd' })).toBe('2025-08-23');
    expect(formatDate(testDate, { format: 'dd/MM/yyyy' })).toBe('23/08/2025');
    expect(formatDate(testDate, { format: 'MMM dd, yyyy' })).toContain('Aug 23, 2025');
  });
});

describe('Edge cases and integration', () => {
  it('handles very large numbers', () => {
    const largeNumber = 999999999999;
    expect(formatCurrency(largeNumber, { compact: true })).toBe('$1000B');
    expect(formatNumber(largeNumber, { compact: true })).toBe('1000B');
  });

  it('handles very small numbers', () => {
    expect(formatCurrency(0.001)).toBe('$0.00');
    expect(formatNumber(0.001, { decimals: 3 })).toBe('0.001');
    expect(formatPercentage(0.00001)).toBe('0.00%');
  });

  it('maintains precision for financial calculations', () => {
    const price1 = 10.99;
    const price2 = 20.01;
    const total = price1 + price2;
    
    expect(formatCurrency(total)).toBe('$31.00');
  });

  it('handles international number formats', () => {
    // European format (comma as decimal separator)
    expect(formatNumber(1234.56, { locale: 'de-DE' })).toContain('1.234,56');
    
    // Indian format (lakh system)
    expect(formatNumber(1000000, { locale: 'en-IN' })).toContain('10,00,000');
  });

  it('works with all formatter functions together', () => {
    const data = {
      revenue: 1234567.89,
      growth: 0.1234,
      count: 5678,
      lastUpdate: new Date('2025-08-23')
    };

    const formatted = {
      revenue: formatCurrency(data.revenue, { compact: true }),
      growth: formatPercentage(data.growth),
      count: formatNumber(data.count),
      lastUpdate: formatDate(data.lastUpdate, { format: 'short' })
    };

    expect(formatted.revenue).toBe('$1.2M');
    expect(formatted.growth).toBe('12.34%');
    expect(formatted.count).toBe('5,678');
    expect(formatted.lastUpdate).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it('handles mixed data types gracefully', () => {
    const mixedInputs = [0, '0', null, undefined, '', false, true, NaN, Infinity];
    
    mixedInputs.forEach(input => {
      expect(() => formatCurrency(input)).not.toThrow();
      expect(() => formatNumber(input)).not.toThrow();
      expect(() => formatPercentage(input)).not.toThrow();
    });
  });
});
