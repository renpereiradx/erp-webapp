/**
 * Date Utilities
 * Wave 6: Advanced Analytics & Reporting
 * 
 * Comprehensive date handling utilities for analytics
 */

/**
 * Check if a date is within a specified range
 * @param {Date|string} date - Date to check
 * @param {Date|string} startDate - Range start date
 * @param {Date|string} endDate - Range end date
 * @returns {boolean} True if date is in range
 */
export const isDateInRange = (date, startDate, endDate) => {
  if (!date || !startDate || !endDate) return false;
  
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return d >= start && d <= end;
};

/**
 * Get predefined date ranges
 * @param {string} period - Period type
 * @param {Date} baseDate - Base date for calculations
 * @param {Date} customStart - Custom start date
 * @param {Date} customEnd - Custom end date
 * @returns {Object} Date range object
 */
export const getDateRange = (period, baseDate = new Date(), customStart = null, customEnd = null) => {
  const base = new Date(baseDate);
  
  switch (period) {
    case 'last7days':
      return {
        start: new Date(base.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: base
      };
    
    case 'last30days':
      return {
        start: new Date(base.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: base
      };
    
    case 'thisMonth':
      return {
        start: new Date(base.getFullYear(), base.getMonth(), 1),
        end: new Date(base.getFullYear(), base.getMonth() + 1, 0)
      };
    
    case 'lastMonth':
      return {
        start: new Date(base.getFullYear(), base.getMonth() - 1, 1),
        end: new Date(base.getFullYear(), base.getMonth(), 0)
      };
    
    case 'thisQuarter':
      const quarter = Math.floor(base.getMonth() / 3);
      return {
        start: new Date(base.getFullYear(), quarter * 3, 1),
        end: new Date(base.getFullYear(), quarter * 3 + 3, 0)
      };
    
    case 'thisYear':
      return {
        start: new Date(base.getFullYear(), 0, 1),
        end: new Date(base.getFullYear(), 11, 31)
      };
    
    case 'custom':
      return {
        start: customStart,
        end: customEnd
      };
    
    default:
      return {
        start: base,
        end: base
      };
  }
};

/**
 * Format a date range as a string
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate, options = {}) => {
  const { locale = 'es-ES', sameMonth = false } = options;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (sameMonth && start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}-${end.getDate()}, ${start.getFullYear()}`;
  }
  
  return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
};

/**
 * Calculate difference between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @param {string} unit - Unit of measurement
 * @param {boolean} absolute - Return absolute value
 * @returns {number} Difference in specified unit
 */
export const getDateDiff = (date1, date2, unit = 'days', absolute = false) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = d2.getTime() - d1.getTime();
  
  let result;
  switch (unit) {
    case 'milliseconds':
      result = diff;
      break;
    case 'seconds':
      result = diff / 1000;
      break;
    case 'minutes':
      result = diff / (1000 * 60);
      break;
    case 'hours':
      result = diff / (1000 * 60 * 60);
      break;
    case 'days':
      result = diff / (1000 * 60 * 60 * 24);
      break;
    default:
      result = diff;
  }
  
  return absolute ? Math.abs(result) : result;
};

/**
 * Add days to a date
 * @param {Date} date - Base date
 * @param {number} days - Days to add
 * @returns {Date} New date
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Subtract days from a date
 * @param {Date} date - Base date
 * @param {number} days - Days to subtract
 * @returns {Date} New date
 */
export const subtractDays = (date, days) => {
  return addDays(date, -days);
};

/**
 * Get start of day
 * @param {Date} date - Input date
 * @returns {Date} Start of day
 */
export const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get end of day
 * @param {Date} date - Input date
 * @returns {Date} End of day
 */
export const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Get start of week (Monday)
 * @param {Date} date - Input date
 * @returns {Date} Start of week
 */
export const startOfWeek = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  return startOfDay(result);
};

/**
 * Get end of week (Sunday)
 * @param {Date} date - Input date
 * @returns {Date} End of week
 */
export const endOfWeek = (date) => {
  const start = startOfWeek(date);
  return endOfDay(addDays(start, 6));
};

/**
 * Get start of month
 * @param {Date} date - Input date
 * @returns {Date} Start of month
 */
export const startOfMonth = (date) => {
  const result = new Date(date);
  result.setDate(1);
  return startOfDay(result);
};

/**
 * Get end of month
 * @param {Date} date - Input date
 * @returns {Date} End of month
 */
export const endOfMonth = (date) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  return endOfDay(result);
};

/**
 * Get start of year
 * @param {Date} date - Input date
 * @returns {Date} Start of year
 */
export const startOfYear = (date) => {
  const result = new Date(date);
  result.setMonth(0, 1);
  return startOfDay(result);
};

/**
 * Get end of year
 * @param {Date} date - Input date
 * @returns {Date} End of year
 */
export const endOfYear = (date) => {
  const result = new Date(date);
  result.setMonth(11, 31);
  return endOfDay(result);
};

/**
 * Get weeks in date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Array of week objects
 */
export const getWeeksInRange = (startDate, endDate) => {
  const weeks = [];
  let current = startOfWeek(startDate);
  const end = endOfWeek(endDate);
  
  while (current <= end) {
    weeks.push({
      start: new Date(current),
      end: endOfWeek(current)
    });
    current = addDays(current, 7);
  }
  
  return weeks;
};

/**
 * Get months in date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Array of month objects
 */
export const getMonthsInRange = (startDate, endDate) => {
  const months = [];
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = endDate;
  
  while (current <= end) {
    months.push({
      month: current.getMonth(),
      year: current.getFullYear(),
      start: startOfMonth(current),
      end: endOfMonth(current)
    });
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
};

/**
 * Get quarters in date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Array of quarter objects
 */
export const getQuartersInRange = (startDate, endDate) => {
  const quarters = [];
  let current = new Date(startDate.getFullYear(), Math.floor(startDate.getMonth() / 3) * 3, 1);
  const end = endDate;
  
  while (current <= end) {
    const quarter = Math.floor(current.getMonth() / 3) + 1;
    quarters.push({
      quarter,
      year: current.getFullYear(),
      start: new Date(current.getFullYear(), (quarter - 1) * 3, 1),
      end: new Date(current.getFullYear(), quarter * 3, 0)
    });
    current.setMonth(current.getMonth() + 3);
  }
  
  return quarters;
};

/**
 * Check if date is today
 * @param {Date} date - Date to check
 * @returns {boolean} True if today
 */
export const isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
};

/**
 * Check if date is yesterday
 * @param {Date} date - Date to check
 * @returns {boolean} True if yesterday
 */
export const isYesterday = (date) => {
  const yesterday = subtractDays(new Date(), 1);
  const d = new Date(date);
  return d.toDateString() === yesterday.toDateString();
};

/**
 * Check if date is tomorrow
 * @param {Date} date - Date to check
 * @returns {boolean} True if tomorrow
 */
export const isTomorrow = (date) => {
  const tomorrow = addDays(new Date(), 1);
  const d = new Date(date);
  return d.toDateString() === tomorrow.toDateString();
};

/**
 * Check if date is in current week
 * @param {Date} date - Date to check
 * @returns {boolean} True if in current week
 */
export const isThisWeek = (date) => {
  const now = new Date();
  return isDateInRange(date, startOfWeek(now), endOfWeek(now));
};

/**
 * Check if date is in current month
 * @param {Date} date - Date to check
 * @returns {boolean} True if in current month
 */
export const isThisMonth = (date) => {
  const now = new Date();
  return isDateInRange(date, startOfMonth(now), endOfMonth(now));
};

/**
 * Check if date is in current year
 * @param {Date} date - Date to check
 * @returns {boolean} True if in current year
 */
export const isThisYear = (date) => {
  const now = new Date();
  return isDateInRange(date, startOfYear(now), endOfYear(now));
};

/**
 * Get relative time string
 * @param {Date} date - Date to format
 * @param {Object} options - Options
 * @returns {string} Relative time string
 */
export const getRelativeTimeString = (date, options = {}) => {
  if (!date || isNaN(new Date(date))) {
    return 'Fecha inválida';
  }
  
  const { locale = 'es-ES' } = options;
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const units = [
    { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
    { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
    { unit: 'week', ms: 1000 * 60 * 60 * 24 * 7 },
    { unit: 'day', ms: 1000 * 60 * 60 * 24 },
    { unit: 'hour', ms: 1000 * 60 * 60 },
    { unit: 'minute', ms: 1000 * 60 },
    { unit: 'second', ms: 1000 }
  ];
  
  for (const { unit, ms } of units) {
    const value = Math.abs(Math.floor(diff / ms));
    if (value >= 1) {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return rtf.format(diff > 0 ? -value : value, unit);
    }
  }
  
  return locale === 'es-ES' ? 'ahora' : 'now';
};
