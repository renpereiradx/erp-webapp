/**
 * Utilities for currency formatting and normalization,
 * specialized for Paraguayan Guaraníes (PYG).
 */

export interface FormatPYGOptions {
  /** Whether to include 'Gs.' (default: true) */
  showSymbol?: boolean
  /** Whether to use compact notation like '1.5M' (default: false) */
  compact?: boolean
}

/** Formats a number as Paraguayan Guaraníes (e.g. 'Gs. 1.500.000' / 'Gs. 1,5M'). */
export const formatPYG = (
  amount: number | string,
  { showSymbol = true, compact = false }: FormatPYGOptions = {},
): string => {
  const numericAmount = Number(amount) || 0

  if (compact) {
    const formatter = new Intl.NumberFormat('es-PY', {
      notation: 'compact',
      maximumFractionDigits: 1
    });
    const formatted = formatter.format(numericAmount);
    return showSymbol ? `Gs. ${formatted}` : formatted;
  }

  const formatter = new Intl.NumberFormat('es-PY', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatted = formatter.format(numericAmount);
  return showSymbol ? `Gs. ${formatted}` : formatted;
};

/** Formats an amount with the specified ISO 4217 currency code (default 'PYG'). */
export const formatCurrency = (amount: number | string, currencyCode = 'PYG'): string => {
  const numericAmount = Number(amount) || 0;
  const isPYG = currencyCode === 'PYG';

  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: isPYG ? 0 : 2,
    maximumFractionDigits: isPYG ? 0 : 2,
  }).format(numericAmount);
};

/** Formats a generic number with consistent decimals (maximum, default 2). */
export const formatNumber = (value: number | string, decimals = 2): string => {
  const numericValue = Number(value);
  if (isNaN(numericValue)) return '0';

  return new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(numericValue);
};

/**
 * Normalizes an input value to a valid numeric amount for PYG.
 * Guaraníes do not use decimals in practice.
 */
export const normalizePYG = (value: string | number): number => {
  if (typeof value === 'string') {
    // Remove any non-digit characters except possibly a minus sign
    const cleaned = value.replace(/[^\d-]/g, '');
    return parseInt(cleaned, 10) || 0;
  }
  return Math.round(Number(value)) || 0;
};

/**
 * Normalizes a currency string to a valid ISO 4217 code.
 * Handles common names returned by some API endpoints.
 */
export const normalizeCurrencyCode = (code: string | null | undefined): string => {
  if (!code) return 'PYG';

  const c = code.toString().trim().toUpperCase();

  // Handle full names often returned in Spanish, with robustness for encoding issues
  if (/GUARAN/i.test(c)) {
    return 'PYG';
  }

  if (/D.LAR|USD/i.test(c)) {
    return 'USD';
  }

  // If it's already a 3-letter code, return it, otherwise default to PYG
  return c.length === 3 ? c : 'PYG';
};

export default {
  formatPYG,
  formatCurrency,
  formatNumber,
  normalizePYG,
  normalizeCurrencyCode
};
