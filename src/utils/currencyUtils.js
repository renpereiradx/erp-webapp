/**
 * Utilities for currency formatting and normalization, 
 * specialized for Paraguayan Guaraníes (PYG).
 */

/**
 * Formats a number as Paraguayan Guaraníes.
 * @param {number|string} amount - The value to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.showSymbol - Whether to include 'Gs.' (default: true)
 * @param {boolean} options.compact - Whether to use compact notation like '1.5M' (default: false)
 * @returns {string} Formatted currency string
 */
export const formatPYG = (amount, { showSymbol = true, compact = false } = {}) => {
  const numericAmount = Number(amount) || 0;
  
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

/**
 * Formats an amount with the specified currency code.
 * @param {number|string} amount - The value to format
 * @param {string} currencyCode - ISO 4217 currency code (default: 'PYG')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'PYG') => {
  const numericAmount = Number(amount) || 0;
  const isPYG = currencyCode === 'PYG';
  
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: isPYG ? 0 : 2,
    maximumFractionDigits: isPYG ? 0 : 2,
  }).format(numericAmount);
};

/**
 * Formats a generic number with consistent decimals.
 * @param {number|string} value - The value to format
 * @param {number} decimals - Maximum number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 2) => {
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
 * @param {string|number} value 
 * @returns {number}
 */
export const normalizePYG = (value) => {
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
 * @param {string} code - The raw currency code/name
 * @returns {string} Normalized 3-letter currency code
 */
export const normalizeCurrencyCode = (code) => {
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
