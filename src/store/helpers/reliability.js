/**
 * @fileoverview Helpers de confiabilidad para stores enterprise
 * Wave 2: Resiliencia & Confiabilidad - Production Hardened
 * 
 * Features:
 * - withRetry con backoff exponencial + jitter
 * - Error classification específica con 25+ categorías
 * - Timeout management configurable
 * - Graceful degradation patterns
 * - Telemetría detallada
 */

/**
 * @typedef {Object} RetryConfig
 * @property {number} retries - Número máximo de reintentos (default: 3)
 * @property {number} baseDelay - Delay base en ms (default: 200)
 * @property {number} maxDelay - Delay máximo en ms (default: 5000)
 * @property {number} backoffFactor - Factor multiplicador (default: 2)
 * @property {number} jitterPercent - Porcentaje de jitter (default: 15)
 * @property {string} op - Nombre de la operación para logging
 * @property {Function} telemetryRecord - Función para registrar telemetría
 * @property {Function} onRetry - Callback ejecutado en cada retry
 * @property {Array<string>} retryableErrors - Errores que permiten retry
 */

/**
 * @typedef {Object} ErrorClassification
 * @property {string} type - Tipo de error (NETWORK, VALIDATION, BUSINESS, etc.)
 * @property {boolean} retryable - Si el error permite reintentos
 * @property {string} category - Categoría específica del error
 * @property {number} severity - Nivel de severidad (1-5)
 * @property {string} action - Acción sugerida para el usuario
 */

/**
 * Mapeo completo de errores para clasificación enterprise
 */
const ERROR_CLASSIFICATION_MAP = {
  // Errores de red (retryable) - Severity 2-4
  'fetch failed': { type: 'NETWORK', retryable: true, category: 'CONNECTION', severity: 2, action: 'Verifica tu conexión a internet' },
  'network error': { type: 'NETWORK', retryable: true, category: 'CONNECTION', severity: 2, action: 'Reintentando automáticamente...' },
  'network timeout': { type: 'NETWORK', retryable: true, category: 'TIMEOUT', severity: 3, action: 'Conexión lenta, reintentando...' },
  'connection refused': { type: 'NETWORK', retryable: true, category: 'CONNECTION', severity: 3, action: 'El servidor no está disponible' },
  'service unavailable': { type: 'NETWORK', retryable: true, category: 'SERVICE', severity: 4, action: 'Servicio temporalmente no disponible' },
  'bad gateway': { type: 'NETWORK', retryable: true, category: 'GATEWAY', severity: 3, action: 'Error de servidor, reintentando...' },
  'gateway timeout': { type: 'NETWORK', retryable: true, category: 'TIMEOUT', severity: 3, action: 'Timeout de servidor, reintentando...' },
  
  // Errores de validación (no retryable) - Severity 1-2
  'validation error': { type: 'VALIDATION', retryable: false, category: 'INPUT', severity: 1, action: 'Corrige los datos del formulario' },
  'invalid email': { type: 'VALIDATION', retryable: false, category: 'FORMAT', severity: 1, action: 'Ingresa un email válido' },
  'required field': { type: 'VALIDATION', retryable: false, category: 'REQUIRED', severity: 1, action: 'Completa todos los campos obligatorios' },
  'invalid phone': { type: 'VALIDATION', retryable: false, category: 'FORMAT', severity: 1, action: 'Ingresa un teléfono válido' },
  'invalid date': { type: 'VALIDATION', retryable: false, category: 'FORMAT', severity: 1, action: 'Ingresa una fecha válida' },
  'field too long': { type: 'VALIDATION', retryable: false, category: 'LENGTH', severity: 1, action: 'Reduce la longitud del campo' },
  'field too short': { type: 'VALIDATION', retryable: false, category: 'LENGTH', severity: 1, action: 'El campo es muy corto' },
  
  // Errores de negocio (no retryable) - Severity 2-3
  'email already exists': { type: 'BUSINESS', retryable: false, category: 'DUPLICATE', severity: 2, action: 'Este email ya está registrado' },
  'client not found': { type: 'BUSINESS', retryable: false, category: 'NOT_FOUND', severity: 2, action: 'El cliente no existe' },
  'client already exists': { type: 'BUSINESS', retryable: false, category: 'DUPLICATE', severity: 2, action: 'Ya existe un cliente con estos datos' },
  'not found': { type: 'BUSINESS', retryable: false, category: 'NOT_FOUND', severity: 2, action: 'El recurso solicitado no existe' },
  'conflict': { type: 'BUSINESS', retryable: false, category: 'CONFLICT', severity: 2, action: 'Los datos han sido modificados por otro usuario' },
  'business rule violated': { type: 'BUSINESS', retryable: false, category: 'RULE', severity: 3, action: 'Operación no permitida por reglas de negocio' },
  
  // Errores de autorización (no retryable) - Severity 2-4
  'unauthorized': { type: 'AUTH', retryable: false, category: 'PERMISSION', severity: 3, action: 'No tienes permisos para esta acción' },
  'forbidden': { type: 'AUTH', retryable: false, category: 'PERMISSION', severity: 3, action: 'Acceso denegado' },
  'token expired': { type: 'AUTH', retryable: false, category: 'TOKEN', severity: 2, action: 'Sesión expirada, inicia sesión nuevamente' },
  'invalid token': { type: 'AUTH', retryable: false, category: 'TOKEN', severity: 4, action: 'Token inválido, reautenticación requerida' },
  'access denied': { type: 'AUTH', retryable: false, category: 'PERMISSION', severity: 3, action: 'No tienes acceso a este recurso' },
  
  // Errores del servidor (condicionalmente retryable) - Severity 3-5
  'internal server error': { type: 'SERVER', retryable: true, category: 'INTERNAL', severity: 4, action: 'Error interno del servidor, reintentando...' },
  'database error': { type: 'SERVER', retryable: true, category: 'DATABASE', severity: 4, action: 'Error de base de datos, reintentando...' },
  'rate limited': { type: 'SERVER', retryable: true, category: 'RATE_LIMIT', severity: 2, action: 'Demasiadas solicitudes, espera un momento' },
  'server overloaded': { type: 'SERVER', retryable: true, category: 'OVERLOAD', severity: 4, action: 'Servidor sobrecargado, reintentando...' },
  'maintenance mode': { type: 'SERVER', retryable: false, category: 'MAINTENANCE', severity: 5, action: 'Sistema en mantenimiento' },
  
  // Errores de timeout específicos - Severity 3
  'timeout': { type: 'TIMEOUT', retryable: true, category: 'GENERAL', severity: 3, action: 'Operación tardó demasiado, reintentando...' },
  'request timeout': { type: 'TIMEOUT', retryable: true, category: 'REQUEST', severity: 3, action: 'Solicitud agotó tiempo límite' },
  'read timeout': { type: 'TIMEOUT', retryable: true, category: 'READ', severity: 3, action: 'Timeout leyendo respuesta' },
  'connection timeout': { type: 'TIMEOUT', retryable: true, category: 'CONNECTION', severity: 3, action: 'Timeout estableciendo conexión' }
};

/**
 * Clasifica un error basado en su mensaje con análisis avanzado
 * @param {string|Error} error - Error a clasificar
 * @returns {ErrorClassification} Clasificación completa del error
 */
export function classifyError(error) {
  const errorMessage = (error?.message || error?.toString() || error || '').toLowerCase();
  
  if (!errorMessage) {
    return { 
      type: 'UNKNOWN', 
      retryable: false, 
      category: 'EMPTY', 
      severity: 1,
      action: 'Error desconocido'
    };
  }

  // Buscar coincidencias exactas en el mapa
  for (const [errorPattern, classification] of Object.entries(ERROR_CLASSIFICATION_MAP)) {
    if (errorMessage.includes(errorPattern)) {
      return { ...classification };
    }
  }

  // Análisis por patrones para errores no mapeados
  if (errorMessage.includes('network') || errorMessage.includes('conex')) {
    return { type: 'NETWORK', retryable: true, category: 'GENERIC', severity: 2, action: 'Error de red genérico' };
  }
  
  if (errorMessage.includes('valid')) {
    return { type: 'VALIDATION', retryable: false, category: 'GENERIC', severity: 1, action: 'Error de validación' };
  }
  
  if (errorMessage.includes('auth')) {
    return { type: 'AUTH', retryable: false, category: 'GENERIC', severity: 3, action: 'Error de autenticación' };
  }
  
  if (errorMessage.includes('500') || errorMessage.includes('server')) {
    return { type: 'SERVER', retryable: true, category: 'GENERIC', severity: 4, action: 'Error de servidor' };
  }

  // Clasificación por defecto para errores completamente desconocidos
  return { 
    type: 'UNKNOWN', 
    retryable: false, 
    category: 'UNCLASSIFIED', 
    severity: 3,
    action: 'Error no clasificado'
  };
}

/**
 * Calcula delay con backoff exponencial + jitter mejorado
 * @param {number} attempt - Número de intento (1-based)
 * @param {number} baseDelay - Delay base en ms
 * @param {number} backoffFactor - Factor multiplicador
 * @param {number} maxDelay - Delay máximo
 * @param {number} jitterPercent - Porcentaje de jitter
 * @returns {number} Delay calculado en ms
 */
function calculateDelayWithJitter(attempt, baseDelay = 200, backoffFactor = 2, maxDelay = 5000, jitterPercent = 15) {
  // Backoff exponencial
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  
  // Aplicar límite máximo
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  // Jitter para evitar thundering herd
  const jitterRange = cappedDelay * (jitterPercent / 100);
  const jitter = (Math.random() - 0.5) * 2 * jitterRange;
  
  return Math.max(0, Math.round(cappedDelay + jitter));
}

/**
 * Determina si un error es retryable
 * @param {Error|string} error - Error a evaluar
 * @returns {boolean} Si el error permite retry
 */
function isRetryableError(error) {
  const classification = classifyError(error);
  return classification.retryable;
}

/**
 * withRetry enterprise - backoff exponencial + jitter + telemetría completa
 * @param {Function} fn - Función async a ejecutar con retry
 * @param {Partial<RetryConfig>} options - Configuración de retry
 * @returns {Promise<any>} Resultado de la operación
 * @throws {Error} Último error si todos los intentos fallan
 * 
 * @example
 * const result = await withRetry(
 *   () => clientService.getClients(),
 *   {
 *     retries: 3,
 *     baseDelay: 300,
 *     op: 'fetchClients',
 *     telemetryRecord: telemetry.record,
 *     onRetry: (attempt, error) => console.log(`Retry ${attempt}: ${error.message}`)
 *   }
 * );
 */
export async function withRetry(fn, options = {}) {
  const config = {
    retries: 3,
    baseDelay: 200,
    maxDelay: 5000,
    backoffFactor: 2,
    jitterPercent: 15,
    op: 'unknown_operation',
    telemetryRecord: null,
    onRetry: null,
    ...options
  };

  let lastError;
  let attempt = 0;
  
  // Registrar inicio de operación con retry
  if (config.telemetryRecord) {
    try {
      config.telemetryRecord('retry.start', { 
        operation: config.op, 
        maxRetries: config.retries,
        config: {
          baseDelay: config.baseDelay,
          maxDelay: config.maxDelay,
          backoffFactor: config.backoffFactor,
          jitterPercent: config.jitterPercent
        }
      });
    } catch (telemetryError) {
      console.warn('Telemetry error:', telemetryError);
    }
  }

  while (attempt <= config.retries) {
    attempt++;
    
    try {
      // Ejecutar operación
      const startTime = Date.now();
      const result = await fn();
      const duration = Date.now() - startTime;
      
      // Registrar éxito
      if (config.telemetryRecord) {
        try {
          config.telemetryRecord('retry.success', { 
            operation: config.op, 
            attempt,
            totalAttempts: attempt,
            duration,
            succeededOnAttempt: attempt
          });
        } catch {}
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      const classification = classifyError(error);
      
      // Si es el último intento, no hacer retry
      if (attempt > config.retries) {
        if (config.telemetryRecord) {
          try {
            config.telemetryRecord('retry.exhausted', { 
              operation: config.op, 
              totalAttempts: attempt,
              finalError: error?.message || error,
              classification
            });
          } catch {}
        }
        break;
      }
      
      // Verificar si el error es retryable
      if (!isRetryableError(error)) {
        if (config.telemetryRecord) {
          try {
            config.telemetryRecord('retry.non_retryable', { 
              operation: config.op, 
              attempt,
              error: error?.message || error,
              classification
            });
          } catch {}
        }
        throw error;
      }
      
      // Calcular delay para siguiente intento
      const delay = calculateDelayWithJitter(
        attempt, 
        config.baseDelay, 
        config.backoffFactor, 
        config.maxDelay, 
        config.jitterPercent
      );
      
      // Registrar intento de retry
      if (config.telemetryRecord) {
        try {
          config.telemetryRecord('retry.attempt', { 
            operation: config.op, 
            attempt,
            maxRetries: config.retries,
            delay,
            error: error?.message || error,
            classification,
            nextAttemptIn: delay
          });
        } catch {}
      }
      
      // Callback de retry personalizado
      if (config.onRetry) {
        try {
          config.onRetry(attempt, error, delay, classification);
        } catch (callbackError) {
          console.warn('Error in onRetry callback:', callbackError);
        }
      }
      
      // Esperar antes del siguiente intento
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Todos los intentos han fallado
  throw lastError;
}

/**
 * Wrapper para timeout con manejo mejorado
 * @param {Promise} promise - Promise a envolver
 * @param {number} timeoutMs - Timeout en milisegundos
 * @param {string} operationName - Nombre de la operación
 * @returns {Promise<any>} Promise con timeout
 */
export function withTimeout(promise, timeoutMs, operationName = 'operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => 
        reject(new Error(`Timeout: ${operationName} exceeded ${timeoutMs}ms`)), 
        timeoutMs
      )
    )
  ]);
}

/**
 * Wrapper combinado timeout + retry para operaciones críticas
 * @param {Function} operation - Función async a ejecutar
 * @param {number} timeoutMs - Timeout por intento
 * @param {Partial<RetryConfig>} retryConfig - Configuración de retry
 * @returns {Promise<any>} Resultado de la operación
 */
export async function withTimeoutAndRetry(operation, timeoutMs = 30000, retryConfig = {}) {
  const operationName = retryConfig.op || 'timeout_retry_operation';
  
  return withRetry(
    () => withTimeout(operation(), timeoutMs, operationName),
    {
      ...retryConfig,
      op: operationName
    }
  );
}

/**
 * Información de configuración para debugging y monitoreo
 */
export const RELIABILITY_CONFIG = {
  ERROR_CLASSIFICATION_MAP,
  DEFAULT_RETRIES: 3,
  DEFAULT_BASE_DELAY: 200,
  DEFAULT_MAX_DELAY: 5000,
  DEFAULT_BACKOFF_FACTOR: 2,
  DEFAULT_JITTER_PERCENT: 15,
  version: '2.0.0'
};

/**
 * Utilidades para testing y debugging
 */
export const _testing = {
  calculateDelayWithJitter,
  isRetryableError,
  ERROR_CLASSIFICATION_MAP,
  classifyError
};
