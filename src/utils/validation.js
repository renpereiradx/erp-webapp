/**
 * Validation Utilities
 * Wave 6: Advanced Analytics & Reporting
 * 
 * Comprehensive validation functions for analytics data
 */

/**
 * Validate date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateDateRange = (startDate, endDate, options = {}) => {
  const errors = [];
  const { maxDays, minDays, allowFuture = true } = options;

  if (!startDate || !endDate) {
    errors.push('Las fechas son obligatorias');
    return { isValid: false, errors };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
  }

  if (maxDays) {
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    if (diffDays > maxDays) {
      errors.push(`El rango de fechas no puede exceder ${maxDays} días`);
    }
  }

  if (minDays) {
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    if (diffDays < minDays) {
      errors.push(`El rango de fechas debe ser de al menos ${minDays} días`);
    }
  }

  if (!allowFuture && end > new Date()) {
    errors.push('No se permiten fechas futuras');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate numeric range
 * @param {number} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateNumericRange = (value, options = {}) => {
  const errors = [];
  const { min, max, integer = false, positive = false, maxDecimals } = options;

  if (value === null || value === undefined || isNaN(Number(value))) {
    errors.push('El valor debe ser un número válido');
    return { isValid: false, errors };
  }

  const num = Number(value);

  if (min !== undefined && num < min) {
    errors.push(`El valor debe ser mayor o igual a ${min}`);
  }

  if (max !== undefined && num > max) {
    errors.push(`El valor debe estar entre ${min || 0} y ${max}`);
  }

  if (integer && !Number.isInteger(num)) {
    errors.push('El valor debe ser un número entero');
  }

  if (positive && num < 0) {
    errors.push('El valor debe ser positivo');
  }

  if (maxDecimals !== undefined) {
    const decimals = (num.toString().split('.')[1] || '').length;
    if (decimals > maxDecimals) {
      errors.push(`El valor no puede tener más de ${maxDecimals} decimales`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate percentage
 * @param {number} value - Percentage value
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validatePercentage = (value, options = {}) => {
  const { min = 0, max = 100 } = options;
  
  return validateNumericRange(value, {
    min,
    max,
    ...options
  });
};

/**
 * Validate currency amount
 * @param {number} value - Currency value
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateCurrency = (value, options = {}) => {
  const errors = [];
  const { allowNegative = false, max, maxDecimals = 2 } = options;

  if (value === null || value === undefined) {
    value = 0;
  }

  if (isNaN(Number(value))) {
    errors.push('El monto debe ser un número válido');
    return { isValid: false, errors };
  }

  const num = Number(value);

  if (!allowNegative && num < 0) {
    errors.push('El monto no puede ser negativo');
  }

  if (max !== undefined && num > max) {
    errors.push(`El monto no puede exceder $${max.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  }

  const decimals = (num.toString().split('.')[1] || '').length;
  if (decimals > maxDecimals) {
    errors.push(`El monto no puede tener más de ${maxDecimals} decimales`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
export const validateEmail = (email) => {
  const errors = [];

  if (!email || email.trim() === '') {
    errors.push('El email es obligatorio');
    return { isValid: false, errors };
  }

  if (email.length > 254) {
    errors.push('El email es demasiado largo');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('El email no tiene un formato válido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {Object} Validation result
 */
export const validateRequired = (value) => {
  const errors = [];

  if (value === null || value === undefined || 
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)) {
    errors.push('Este campo es obligatorio');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @returns {Object} Validation result
 */
export const validateMinLength = (value, minLength) => {
  const errors = [];

  if (!value || value.length < minLength) {
    errors.push(`Debe tener al menos ${minLength} caracteres`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @returns {Object} Validation result
 */
export const validateMaxLength = (value, maxLength) => {
  const errors = [];

  if (value && value.length > maxLength) {
    errors.push(`No puede tener más de ${maxLength} caracteres`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate pattern match
 * @param {string} value - Value to validate
 * @param {RegExp} pattern - Pattern to match
 * @param {string} message - Custom error message
 * @returns {Object} Validation result
 */
export const validatePattern = (value, pattern, message = 'El formato no es válido') => {
  const errors = [];

  if (!pattern.test(value)) {
    errors.push(message);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {Object} options - Size options
 * @returns {Object} Validation result
 */
export const validateFileSize = (file, options = {}) => {
  const errors = [];
  const { maxSize, minSize } = options;

  if (maxSize && file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(2);
    errors.push(`El archivo no puede exceder ${maxMB} MB`);
  }

  if (minSize && file.size < minSize) {
    const minKB = (minSize / 1024).toFixed(2);
    errors.push(`El archivo debe ser de al menos ${minKB} KB`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {Object} options - Type options
 * @returns {Object} Validation result
 */
export const validateFileType = (file, options = {}) => {
  const errors = [];
  const { allowedTypes, allowedExtensions } = options;

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    errors.push('Tipo de archivo no permitido');
  }

  if (allowedExtensions && file.name) {
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      errors.push('Extensión de archivo no permitida');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate array length
 * @param {Array} array - Array to validate
 * @param {Object} options - Length options
 * @returns {Object} Validation result
 */
export const validateArrayLength = (array, options = {}) => {
  const errors = [];
  const { min, max } = options;

  if (min && array.length < min) {
    errors.push(`Debe tener al menos ${min} elementos`);
  }

  if (max && array.length > max) {
    errors.push(`No puede tener más de ${max} elementos`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate object properties
 * @param {Object} obj - Object to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result
 */
export const validateObjectProperties = (obj, schema) => {
  const errors = [];

  Object.entries(schema).forEach(([key, rules]) => {
    const value = obj[key];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} es obligatorio`);
      return;
    }

    if (value !== undefined && value !== null) {
      if (rules.type === 'number' && isNaN(Number(value))) {
        errors.push(`${key} debe ser un número`);
      }

      if (rules.type === 'email') {
        const emailResult = validateEmail(value);
        if (!emailResult.isValid) {
          errors.push(...emailResult.errors.map(err => `${key}: ${err}`));
        }
      }

      if (rules.min !== undefined && Number(value) < rules.min) {
        errors.push(`${key} debe ser mayor o igual a ${rules.min}`);
      }

      if (rules.max !== undefined && Number(value) > rules.max) {
        errors.push(`${key} debe ser menor o igual a ${rules.max}`);
      }

      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} debe tener al menos ${rules.minLength} caracteres`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate chart data
 * @param {Array} data - Chart data array
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateChartData = (data, options = {}) => {
  const errors = [];
  const { minPoints = 1, maxPoints = 1000 } = options;

  if (!Array.isArray(data)) {
    errors.push('Los datos deben ser un array');
    return { isValid: false, errors };
  }

  if (data.length < minPoints) {
    errors.push(`Se requieren al menos ${minPoints} puntos de datos`);
  }

  if (data.length > maxPoints) {
    errors.push(`No se pueden mostrar más de ${maxPoints} puntos de datos`);
  }

  data.forEach((point, index) => {
    if (!point.label || point.label.trim() === '') {
      errors.push(`El punto ${index + 1} requiere una etiqueta válida`);
    }

    if (point.value === undefined || point.value === null || isNaN(Number(point.value))) {
      errors.push(`El punto ${index + 1} requiere un valor numérico válido`);
    }

    if (Number(point.value) < 0) {
      errors.push(`El punto ${index + 1} no puede tener un valor negativo`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate analytics data
 * @param {Object} data - Analytics data object
 * @returns {Object} Validation result
 */
export const validateAnalyticsData = (data) => {
  const errors = [];

  if (!data.metrics) {
    errors.push('Los métricas son obligatorias');
  } else {
    if (data.metrics.totalSales < 0) {
      errors.push('Las ventas totales no pueden ser negativas');
    }

    if (data.metrics.growth > 1) {
      errors.push('El crecimiento superior al 100% requiere verificación');
    }
  }

  if (!data.dateRange) {
    errors.push('El rango de fechas es obligatorio');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/DROP\s+TABLE/gi, '')
    .replace(/DELETE\s+FROM/gi, '')
    .replace(/INSERT\s+INTO/gi, '')
    .replace(/UPDATE\s+\w+\s+SET/gi, '');
};

/**
 * Escape HTML characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export const escapeHtml = (text) => {
  if (typeof text !== 'string') return text;
  
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
  };

  return text.replace(/[&<>"']/g, (match) => escapeMap[match]);
};

/**
 * Validate and sanitize input
 * @param {string} input - Input to validate and sanitize
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation and sanitization result
 */
export const validateAndSanitize = (input, rules) => {
  const errors = [];
  let sanitized = sanitizeInput(input);

  if (rules.required) {
    const requiredResult = validateRequired(sanitized);
    if (!requiredResult.isValid) {
      errors.push(...requiredResult.errors);
    }
  }

  if (rules.minLength) {
    const minResult = validateMinLength(sanitized, rules.minLength);
    if (!minResult.isValid) {
      errors.push(...minResult.errors);
    }
  }

  if (rules.maxLength) {
    const maxResult = validateMaxLength(sanitized, rules.maxLength);
    if (!maxResult.isValid) {
      errors.push(...maxResult.errors);
    }
  }

  if (rules.type === 'email') {
    const emailResult = validateEmail(sanitized);
    if (!emailResult.isValid) {
      errors.push(...emailResult.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};
