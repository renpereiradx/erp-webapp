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

export default {
  formatPYG,
  normalizePYG
};
