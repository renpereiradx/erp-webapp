/**
 * Formatting Utilities
 * Wave 6: Advanced Analytics & Reporting
 * 
 * Comprehensive formatting functions for numbers, currency,
 * dates, and other data types used in analytics.
 */

/**
 * Format currency values with localization support
 * @param {number} value - The numeric value to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, options = {}) => {
  const {
    currency = 'USD',
    locale = 'es-MX',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    compact = false
  } = options;

  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '$0.00';
  }

  // Handle compact formatting for large numbers
  if (compact && Math.abs(value) >= 1000) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const suffixIndex = Math.floor(Math.log10(Math.abs(value)) / 3);
    const shortValue = value / Math.pow(1000, suffixIndex);
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: shortValue >= 10 ? 0 : 1,
      maximumFractionDigits: shortValue >= 10 ? 0 : 1
    }).format(shortValue) + suffixes[suffixIndex];
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};

/**
 * Format numeric values with localization support
 * @param {number} value - The numeric value to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, options = {}) => {
  const {
    locale = 'es-MX',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    compact = false,
    decimals
  } = options;

  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '0';
  }

  // Handle decimals option override
  const minDecimals = decimals !== undefined ? decimals : minimumFractionDigits;
  const maxDecimals = decimals !== undefined ? decimals : maximumFractionDigits;

  // Handle compact formatting for large numbers
  if (compact && Math.abs(value) >= 1000) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const suffixIndex = Math.floor(Math.log10(Math.abs(value)) / 3);
    const shortValue = value / Math.pow(1000, suffixIndex);
    
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: shortValue >= 10 ? 0 : 1,
      maximumFractionDigits: shortValue >= 10 ? 0 : 1
    }).format(shortValue) + suffixes[suffixIndex];
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals
  }).format(value);
};

/**
 * Format percentage values with localization support
 * @param {number} value - The numeric value to format (0.15 = 15%)
 * @param {Object} options - Formatting options
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, options = {}) => {
  const {
    locale = 'es-MX',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSign = false,
    isAlreadyPercentage = false,
    decimals
  } = options;

  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '0.00%';
  }

  // Handle decimals option override
  const minDecimals = decimals !== undefined ? decimals : minimumFractionDigits;
  const maxDecimals = decimals !== undefined ? decimals : maximumFractionDigits;

  const actualValue = isAlreadyPercentage ? value / 100 : value;
  const sign = showSign && actualValue > 0 ? '+' : '';
  
  return sign + new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals
  }).format(actualValue);
};

/**
 * Format date values with various formats
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const {
    locale = 'es-MX',
    format = 'short',
    includeTime = false,
    relative = false,
    timeZone = 'America/Mexico_City'
  } = options;

  if (!date) return 'Fecha inválida';

  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  // Handle relative dates
  if (relative) {
    const now = new Date();
    const diffDays = Math.floor((dateObj - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'hoy';
    if (diffDays === -1) return 'ayer';
    if (diffDays === 1) return 'mañana';
  }

  // Handle custom format patterns
  if (typeof format === 'string' && format.includes('-')) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    switch (format) {
      case 'yyyy-MM-dd':
        return `${year}-${month}-${day}`;
      case 'dd/MM/yyyy':
        return `${day}/${month}/${year}`;
      case 'MMM dd, yyyy':
        return dateObj.toLocaleDateString(locale, { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      default:
        break;
    }
  }

  // Predefined formats
  const formatOptions = {
    short: { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric' 
    },
    medium: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    },
    long: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    },
    full: { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    }
  };

  let dateFormat = formatOptions[format] || formatOptions.short;
  
  if (includeTime) {
    dateFormat = {
      ...dateFormat,
      hour: '2-digit',
      minute: '2-digit'
    };
  }

  return dateObj.toLocaleDateString(locale, { 
    ...dateFormat, 
    timeZone 
  });
};

/**
 * Format currency values with localization support
 * @param {number} value - The numeric value to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, options = {}) => {
  const {
    currency = 'USD',
    locale = 'es-MX',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    compact = false
  } = options;

  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '$0.00';
  }

  // Handle compact formatting for large numbers
  if (compact && Math.abs(value) >= 1000) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const suffixIndex = Math.floor(Math.log10(Math.abs(value)) / 3);
    const shortValue = value / Math.pow(1000, suffixIndex);
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: shortValue >= 10 ? 0 : 1,
      maximumFractionDigits: shortValue >= 10 ? 0 : 1
    }).format(shortValue) + suffixes[suffixIndex];
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};

/**
 * Format numeric values with localization support
 * @param {number} value - The numeric value to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, options = {}) => {
  const {
    locale = 'es-MX',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    compact = false,
    decimals
  } = options;

  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '0';
  }

  // Handle decimals option override
  const minDecimals = decimals !== undefined ? decimals : minimumFractionDigits;
  const maxDecimals = decimals !== undefined ? decimals : maximumFractionDigits;

  // Handle compact formatting for large numbers
  if (compact && Math.abs(value) >= 1000) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const suffixIndex = Math.floor(Math.log10(Math.abs(value)) / 3);
    const shortValue = value / Math.pow(1000, suffixIndex);
    
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: shortValue >= 10 ? 0 : 1,
      maximumFractionDigits: shortValue >= 10 ? 0 : 1
    }).format(shortValue) + suffixes[suffixIndex];
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals
  }).format(value);
};

/**
 * Format percentage values with localization support
 * @param {number} value - The numeric value to format (0.15 = 15%)
 * @param {Object} options - Formatting options
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, options = {}) => {
  const {
    locale = 'es-MX',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSign = false,
    isAlreadyPercentage = false,
    decimals
  } = options;

  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '0.00%';
  }

  // Handle decimals option override
  const minDecimals = decimals !== undefined ? decimals : minimumFractionDigits;
  const maxDecimals = decimals !== undefined ? decimals : maximumFractionDigits;

  const actualValue = isAlreadyPercentage ? value / 100 : value;
  const sign = showSign && actualValue > 0 ? '+' : '';
  
  return sign + new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals
  }).format(actualValue);
};

/**
 * Format date values with various formats
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const {
    locale = 'es-MX',
    format = 'short',
    includeTime = false,
    relative = false,
    timeZone = 'America/Mexico_City'
  } = options;

  if (!date) return 'Fecha inválida';

  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  // Handle relative dates
  if (relative) {
    const now = new Date();
    const diffDays = Math.floor((dateObj - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'hoy';
    if (diffDays === -1) return 'ayer';
    if (diffDays === 1) return 'mañana';
  }

  // Handle custom format patterns
  if (typeof format === 'string' && format.includes('-')) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    switch (format) {
      case 'yyyy-MM-dd':
        return `${year}-${month}-${day}`;
      case 'dd/MM/yyyy':
        return `${day}/${month}/${year}`;
      case 'MMM dd, yyyy':
        return dateObj.toLocaleDateString(locale, { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      default:
        break;
    }
  }

  // Predefined formats
  const formatOptions = {
    short: { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric' 
    },
    medium: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    },
    long: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    },
    full: { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    }
  };

  let dateFormat = formatOptions[format] || formatOptions.short;
  
  if (includeTime) {
    dateFormat = {
      ...dateFormat,
      hour: '2-digit',
      minute: '2-digit'
    };
  }

  return dateObj.toLocaleDateString(locale, { 
    ...dateFormat, 
    timeZone 
  });
};

/**
 * Format currency values with localization support
 * @param {number} value - The numeric value to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, options = {}) => {
  const {
    currency = 'USD',
    locale = 'es-MX',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    compact = false
  } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }

  // Handle compact formatting for large numbers
  if (compact && Math.abs(value) >= 1000) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const suffixIndex = Math.floor(Math.log10(Math.abs(value)) / 3);
    const shortValue = value / Math.pow(1000, suffixIndex);
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: shortValue >= 10 ? 0 : 1,
      maximumFractionDigits: shortValue >= 10 ? 0 : 1
    }).format(shortValue) + suffixes[suffixIndex];
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};

/**
 * Format numeric values with localization support
 * @param {number} value - The numeric value to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, options = {}) => {
  const {
    locale = 'es-MX',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    compact = false,
    useGrouping = true
  } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  // Handle compact formatting for large numbers
  if (compact && Math.abs(value) >= 1000) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const suffixIndex = Math.floor(Math.log10(Math.abs(value)) / 3);
    const shortValue = value / Math.pow(1000, suffixIndex);
    
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: shortValue >= 10 ? 0 : 1,
      maximumFractionDigits: shortValue >= 10 ? 0 : 1,
      useGrouping
    }).format(shortValue) + suffixes[suffixIndex];
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping
  }).format(value);
};

/**
 * Format percentage values with localization support
 * @param {number} value - The numeric value to format (0.15 = 15%)
 * @param {Object} options - Formatting options
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, options = {}) => {
  const {
    locale = 'es-MX',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSign = false
  } = options;

/**
 * Format date values with various formats
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const {
    locale = 'es-MX',
    format = 'short', // short, medium, long, full, custom
    customFormat = null,
    timeZone = 'America/Mexico_City'
  } = options;

  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  // Custom format using toLocaleDateString options
  if (customFormat) {
    return dateObj.toLocaleDateString(locale, { ...customFormat, timeZone });
  }

  // Predefined formats
  const formatOptions = {
    short: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    },
    medium: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    },
    long: { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    },
    full: { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  };

  return dateObj.toLocaleDateString(locale, { 
    ...formatOptions[format], 
    timeZone 
  });
};

/**
 * Format time duration (in seconds) to human readable format
 * @param {number} seconds - Duration in seconds
 * @param {Object} options - Formatting options
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds, options = {}) => {
  const {
    format = 'short', // short, long
    showSeconds = true,
    locale = 'es'
  } = options;

  if (!seconds || isNaN(seconds)) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (format === 'long') {
    const parts = [];
    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
    }
    if (showSeconds && remainingSeconds > 0) {
      parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'segundo' : 'segundos'}`);
    }
    return parts.join(', ');
  }

  // Short format
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    return showSeconds 
      ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
      : `${minutes}m`;
  } else {
    return `${remainingSeconds}s`;
  }
};

/**
 * Format file size in bytes to human readable format
 * @param {number} bytes - Size in bytes
 * @param {Object} options - Formatting options
 * @returns {string} Formatted file size string
 */
export const formatFileSize = (bytes, options = {}) => {
  const {
    decimals = 2,
    binary = false // Use 1024 instead of 1000
  } = options;

  if (bytes === 0) return '0 Bytes';

  const k = binary ? 1024 : 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = binary 
    ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format relative time (time ago/from now)
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted relative time string
 */
export const formatRelativeTime = (date, options = {}) => {
  const {
    locale = 'es',
    numeric = 'auto' // auto, always
  } = options;

  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  // Use Intl.RelativeTimeFormat for modern browsers
  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric });

    const units = [
      { unit: 'year', seconds: 31536000 },
      { unit: 'month', seconds: 2592000 },
      { unit: 'week', seconds: 604800 },
      { unit: 'day', seconds: 86400 },
      { unit: 'hour', seconds: 3600 },
      { unit: 'minute', seconds: 60 },
      { unit: 'second', seconds: 1 }
    ];

    for (const { unit, seconds } of units) {
      const value = Math.floor(diffInSeconds / seconds);
      if (Math.abs(value) >= 1) {
        return rtf.format(-value, unit);
      }
    }

    return rtf.format(0, 'second');
  }

  // Fallback for older browsers
  const absSeconds = Math.abs(diffInSeconds);
  const future = diffInSeconds < 0;

  if (absSeconds < 60) {
    return future ? 'en unos segundos' : 'hace unos segundos';
  } else if (absSeconds < 3600) {
    const minutes = Math.floor(absSeconds / 60);
    return future 
      ? `en ${minutes} minuto${minutes !== 1 ? 's' : ''}`
      : `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  } else if (absSeconds < 86400) {
    const hours = Math.floor(absSeconds / 3600);
    return future 
      ? `en ${hours} hora${hours !== 1 ? 's' : ''}`
      : `hace ${hours} hora${hours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(absSeconds / 86400);
    return future 
      ? `en ${days} día${days !== 1 ? 's' : ''}`
      : `hace ${days} día${days !== 1 ? 's' : ''}`;
  }
};

/**
 * Format data for charts - ensure all values are numbers
 * @param {Array} data - Array of data objects
 * @param {Array} numberFields - Fields that should be converted to numbers
 * @returns {Array} Formatted data array
 */
export const formatChartData = (data, numberFields = []) => {
  if (!Array.isArray(data)) return [];

  return data.map(item => {
    const formatted = { ...item };
    
    numberFields.forEach(field => {
      if (formatted[field] !== undefined) {
        const num = parseFloat(formatted[field]);
        formatted[field] = isNaN(num) ? 0 : num;
      }
    });

    return formatted;
  });
};

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Format growth rate with appropriate color coding classes
 * @param {number} rate - Growth rate as percentage
 * @param {Object} options - Formatting options
 * @returns {Object} Object with formatted value and CSS classes
 */
export const formatGrowthRate = (rate, options = {}) => {
  const {
    showSign = true,
    precision = 1,
    neutral = 0
  } = options;

  if (rate === null || rate === undefined || isNaN(rate)) {
    return {
      value: '0%',
      className: 'text-gray-500',
      trend: 'neutral'
    };
  }

  const formattedRate = formatPercentage(rate, { 
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    showSign 
  });

  let className = 'text-gray-500';
  let trend = 'neutral';

  if (rate > neutral) {
    className = 'text-green-600 dark:text-green-400';
    trend = 'positive';
  } else if (rate < neutral) {
    className = 'text-red-600 dark:text-red-400';
    trend = 'negative';
  }

  return {
    value: formattedRate,
    className,
    trend
  };
};

/**
 * Debounce function for search inputs and API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};
