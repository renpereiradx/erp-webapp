/**
 * Helper de Recovery Automático - Wave 2 Enterprise
 * Implementa estrategias avanzadas de recuperación automática con backoff exponencial
 * 
 * FEATURES WAVE 2:
 * - Backoff exponencial con jitter
 * - Retry diferenciado por tipo de error
 * - Circuit breaker integration
 * - Métricas de recovery automático
 * - Límites inteligentes de retry
 * 
 * @since Wave 2 - Resiliencia & Confiabilidad
 * @author Sistema ERP
 */

import { PURCHASE_ERROR_CODES } from '@/types/purchaseTypes';

// Configuración de recovery
export const RECOVERY_CONFIG = {
  // Backoff exponencial
  INITIAL_DELAY: 1000,    // 1 segundo
  MAX_DELAY: 30000,       // 30 segundos
  BACKOFF_FACTOR: 2,      // Exponencial
  JITTER_FACTOR: 0.1,     // 10% de jitter
  
  // Límites de retry por tipo de operación
  MAX_RETRIES: {
    NETWORK: 5,           // Errores de red
    SERVER: 3,            // Errores de servidor
    VALIDATION: 1,        // Errores de validación
    AUTHENTICATION: 2,    // Errores de auth
    RATE_LIMIT: 4,        // Rate limiting
    DEFAULT: 3            // Por defecto
  },
  
  // Códigos de error que permiten retry
  RETRYABLE_CODES: [
    'NETWORK_ERROR',
    'TIMEOUT_ERROR', 
    'SERVER_ERROR',
    'SERVICE_UNAVAILABLE',
    'RATE_LIMIT_EXCEEDED',
    'TEMPORARY_FAILURE'
  ],
  
  // Códigos que NO permiten retry
  NON_RETRYABLE_CODES: [
    'VALIDATION_ERROR',
    'AUTHENTICATION_ERROR',
    'AUTHORIZATION_ERROR',
    'NOT_FOUND_ERROR',
    'BUSINESS_RULE_ERROR'
  ]
};

/**
 * Calcula el delay para el siguiente retry con backoff exponencial
 * 
 * @param {number} attempt - Número de intento (base 0)
 * @param {number} baseDelay - Delay base en ms
 * @param {number} maxDelay - Delay máximo en ms
 * @param {number} backoffFactor - Factor de backoff
 * @param {number} jitterFactor - Factor de jitter (0-1)
 * @returns {number} Delay en milisegundos
 */
export const calculateBackoffDelay = (
  attempt, 
  baseDelay = RECOVERY_CONFIG.INITIAL_DELAY,
  maxDelay = RECOVERY_CONFIG.MAX_DELAY,
  backoffFactor = RECOVERY_CONFIG.BACKOFF_FACTOR,
  jitterFactor = RECOVERY_CONFIG.JITTER_FACTOR
) => {
  // Cálculo exponencial
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt);
  
  // Aplicar límite máximo
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  // Agregar jitter para evitar thundering herd
  const jitter = cappedDelay * jitterFactor * (Math.random() - 0.5);
  
  return Math.max(0, Math.round(cappedDelay + jitter));
};

/**
 * Determina si un error es recuperable automáticamente
 * 
 * @param {Error} error - Error a evaluar
 * @returns {Object} Información de recuperabilidad
 */
export const isRetryableError = (error) => {
  const errorCode = error.code || error.type || 'UNKNOWN_ERROR';
  const errorMessage = error.message || '';
  const statusCode = error.status || error.statusCode;

  // Verificar códigos explícitamente NO recuperables
  if (RECOVERY_CONFIG.NON_RETRYABLE_CODES.includes(errorCode)) {
    return {
      retryable: false,
      reason: 'non_retryable_code',
      category: 'permanent',
      maxRetries: 0
    };
  }

  // Verificar códigos explícitamente recuperables
  if (RECOVERY_CONFIG.RETRYABLE_CODES.includes(errorCode)) {
    return {
      retryable: true,
      reason: 'retryable_code',
      category: getErrorCategory(errorCode),
      maxRetries: getMaxRetriesForCategory(getErrorCategory(errorCode))
    };
  }

  // Verificar por status code HTTP
  if (statusCode) {
    if (statusCode >= 500 && statusCode < 600) {
      return {
        retryable: true,
        reason: 'server_error',
        category: 'SERVER',
        maxRetries: RECOVERY_CONFIG.MAX_RETRIES.SERVER
      };
    }
    
    if (statusCode === 429) {
      return {
        retryable: true,
        reason: 'rate_limit',
        category: 'RATE_LIMIT',
        maxRetries: RECOVERY_CONFIG.MAX_RETRIES.RATE_LIMIT
      };
    }
    
    if (statusCode >= 400 && statusCode < 500) {
      return {
        retryable: false,
        reason: 'client_error',
        category: 'permanent',
        maxRetries: 0
      };
    }
  }

  // Verificar por mensaje de error (patrones comunes)
  const networkPatterns = [
    /network/i,
    /connection/i,
    /timeout/i,
    /fetch/i,
    /cors/i
  ];

  if (networkPatterns.some(pattern => pattern.test(errorMessage))) {
    return {
      retryable: true,
      reason: 'network_pattern',
      category: 'NETWORK',
      maxRetries: RECOVERY_CONFIG.MAX_RETRIES.NETWORK
    };
  }

  // Por defecto, errores desconocidos son parcialmente recuperables
  return {
    retryable: true,
    reason: 'unknown_error',
    category: 'DEFAULT',
    maxRetries: RECOVERY_CONFIG.MAX_RETRIES.DEFAULT
  };
};

/**
 * Obtiene la categoría de error
 * 
 * @param {string} errorCode - Código de error
 * @returns {string} Categoría
 */
const getErrorCategory = (errorCode) => {
  if (errorCode.includes('NETWORK')) return 'NETWORK';
  if (errorCode.includes('SERVER')) return 'SERVER';
  if (errorCode.includes('VALIDATION')) return 'VALIDATION';
  if (errorCode.includes('AUTH')) return 'AUTHENTICATION';
  if (errorCode.includes('RATE_LIMIT')) return 'RATE_LIMIT';
  return 'DEFAULT';
};

/**
 * Obtiene el número máximo de reintentos para una categoría
 * 
 * @param {string} category - Categoría de error
 * @returns {number} Número máximo de reintentos
 */
const getMaxRetriesForCategory = (category) => {
  return RECOVERY_CONFIG.MAX_RETRIES[category] || RECOVERY_CONFIG.MAX_RETRIES.DEFAULT;
};

/**
 * Ejecuta una operación con recovery automático
 * 
 * @param {Function} operation - Operación a ejecutar
 * @param {Object} options - Opciones de recovery
 * @param {Function} options.onRetry - Callback en cada retry
 * @param {Function} options.onError - Callback en cada error
 * @param {Object} options.context - Context adicional
 * @returns {Promise} Resultado de la operación
 */
export const executeWithRecovery = async (operation, options = {}) => {
  const {
    onRetry = () => {},
    onError = () => {},
    context = {},
    customMaxRetries,
    customBackoff = {}
  } = options;

  let lastError;
  let attempt = 0;

  while (true) {
    try {
      // Ejecutar operación
      const result = await operation();
      
      // Si llegamos aquí, la operación fue exitosa
      if (attempt > 0) {
        console.log(`✅ Recovery exitoso después de ${attempt} intentos`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Evaluar si el error es recuperable
      const retryInfo = isRetryableError(error);
      
      // Callback de error
      onError(error, {
        attempt,
        retryInfo,
        context
      });

      // Si no es recuperable o excedimos intentos, lanzar error
      const maxRetries = customMaxRetries ?? retryInfo.maxRetries;
      
      if (!retryInfo.retryable || attempt >= maxRetries) {
        console.error(`❌ Operación falló definitivamente:`, {
          error: error.message,
          attempts: attempt + 1,
          retryable: retryInfo.retryable,
          reason: retryInfo.reason
        });
        
        throw error;
      }

      // Calcular delay para próximo intento
      const delay = calculateBackoffDelay(
        attempt,
        customBackoff.initialDelay,
        customBackoff.maxDelay,
        customBackoff.backoffFactor,
        customBackoff.jitterFactor
      );

      console.warn(`🔄 Retry ${attempt + 1}/${maxRetries + 1} en ${delay}ms:`, {
        error: error.message,
        category: retryInfo.category,
        reason: retryInfo.reason
      });

      // Callback de retry
      onRetry(error, {
        attempt: attempt + 1,
        delay,
        retryInfo,
        context
      });

      // Esperar antes del próximo intento
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempt++;
    }
  }
};

/**
 * Wrapper para crear funciones con recovery automático
 * 
 * @param {Function} fn - Función original
 * @param {Object} options - Opciones de recovery
 * @returns {Function} Función con recovery
 */
export const withRecovery = (fn, options = {}) => {
  return async (...args) => {
    return executeWithRecovery(
      () => fn(...args),
      {
        ...options,
        context: {
          ...options.context,
          functionName: fn.name,
          args: args.length
        }
      }
    );
  };
};

/**
 * Recovery especializado para operaciones de purchase
 * 
 * @param {Function} purchaseOperation - Operación de purchase
 * @param {Object} options - Opciones específicas
 * @returns {Promise} Resultado con recovery
 */
export const executeWithPurchaseRecovery = async (purchaseOperation, options = {}) => {
  const {
    operationType = 'unknown',
    purchaseId,
    telemetry = () => {},
    ...recoveryOptions
  } = options;

  return executeWithRecovery(purchaseOperation, {
    ...recoveryOptions,
    context: {
      operationType,
      purchaseId,
      module: 'purchases'
    },
    onRetry: (error, retryContext) => {
      telemetry('purchase.recovery.retry', {
        operation_type: operationType,
        purchase_id: purchaseId,
        attempt: retryContext.attempt,
        delay: retryContext.delay,
        error_category: retryContext.retryInfo.category,
        error_code: error.code || 'unknown'
      });
      
      // Callback original si existe
      recoveryOptions.onRetry?.(error, retryContext);
    },
    onError: (error, errorContext) => {
      telemetry('purchase.recovery.error', {
        operation_type: operationType,
        purchase_id: purchaseId,
        attempt: errorContext.attempt,
        retryable: errorContext.retryInfo.retryable,
        error_category: errorContext.retryInfo.category,
        error_code: error.code || 'unknown',
        error_message: error.message
      });
      
      // Callback original si existe
      recoveryOptions.onError?.(error, errorContext);
    }
  });
};

export default {
  calculateBackoffDelay,
  isRetryableError,
  executeWithRecovery,
  withRecovery,
  executeWithPurchaseRecovery,
  RECOVERY_CONFIG
};
