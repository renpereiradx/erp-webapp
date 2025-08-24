/**
 * Purchase Errors - Códigos de Error Estandarizados
 * Wave 1: Arquitectura Base Sólida
 * Sistema enterprise de manejo de errores con i18n y hints contextuales
 */

import { PURCHASE_ERROR_CODES } from '@/types/purchaseTypes';

/**
 * Mapeo de códigos de error a mensajes descriptivos
 * Soporta i18n con claves de traducción
 */
export const PURCHASE_ERROR_MESSAGES = {
  // ==================== ERRORES DE VALIDACIÓN ====================
  [PURCHASE_ERROR_CODES.VALIDATION_FAILED]: {
    key: 'purchases.errors.validation_failed',
    defaultMessage: 'Los datos proporcionados no son válidos',
    category: 'validation',
    severity: 'error',
    retryable: false,
    hints: [
      'Verifique que todos los campos requeridos estén completos',
      'Revise el formato de fechas y números',
      'Asegúrese de que las cantidades sean positivas'
    ]
  },
  
  [PURCHASE_ERROR_CODES.SUPPLIER_NOT_FOUND]: {
    key: 'purchases.errors.supplier_not_found',
    defaultMessage: 'El proveedor especificado no existe',
    category: 'validation',
    severity: 'error',
    retryable: false,
    hints: [
      'Verifique que el ID del proveedor sea correcto',
      'El proveedor puede haber sido eliminado',
      'Seleccione un proveedor válido de la lista'
    ]
  },
  
  [PURCHASE_ERROR_CODES.PRODUCT_NOT_FOUND]: {
    key: 'purchases.errors.product_not_found',
    defaultMessage: 'Uno o más productos no existen',
    category: 'validation',
    severity: 'error',
    retryable: false,
    hints: [
      'Verifique los códigos de productos',
      'Algunos productos pueden haber sido discontinuados',
      'Actualice la lista de productos disponibles'
    ]
  },
  
  [PURCHASE_ERROR_CODES.PAYMENT_METHOD_NOT_FOUND]: {
    key: 'purchases.errors.payment_method_not_found',
    defaultMessage: 'El método de pago especificado no es válido',
    category: 'validation',
    severity: 'error',
    retryable: false,
    hints: [
      'Seleccione un método de pago válido',
      'El método de pago puede estar deshabilitado',
      'Contacte al administrador para configurar métodos de pago'
    ]
  },
  
  [PURCHASE_ERROR_CODES.CURRENCY_NOT_FOUND]: {
    key: 'purchases.errors.currency_not_found',
    defaultMessage: 'La divisa especificada no es válida',
    category: 'validation',
    severity: 'error',
    retryable: false,
    hints: [
      'Seleccione una divisa válida',
      'Verifique la configuración de divisas del sistema',
      'La divisa puede estar deshabilitada'
    ]
  },
  
  // ==================== ERRORES DE PERMISOS ====================
  [PURCHASE_ERROR_CODES.INSUFFICIENT_PERMISSIONS]: {
    key: 'purchases.errors.insufficient_permissions',
    defaultMessage: 'No tiene permisos suficientes para realizar esta acción',
    category: 'authorization',
    severity: 'error',
    retryable: false,
    hints: [
      'Contacte al administrador para obtener permisos',
      'Su sesión puede haber expirado',
      'Inicie sesión con una cuenta autorizada'
    ]
  },
  
  // ==================== ERRORES DE PAGOS ====================
  [PURCHASE_ERROR_CODES.INVALID_AMOUNT]: {
    key: 'purchases.errors.invalid_amount',
    defaultMessage: 'El monto especificado no es válido',
    category: 'payment',
    severity: 'error',
    retryable: false,
    hints: [
      'El monto debe ser mayor a cero',
      'Verifique que no exceda el saldo pendiente',
      'Use formato de número válido (sin caracteres especiales)'
    ]
  },
  
  [PURCHASE_ERROR_CODES.PAYMENT_EXCEEDS_BALANCE]: {
    key: 'purchases.errors.payment_exceeds_balance',
    defaultMessage: 'El pago excede el saldo pendiente',
    category: 'payment',
    severity: 'error',
    retryable: false,
    hints: [
      'Verifique el saldo pendiente de la orden',
      'Considere un pago parcial',
      'Revise si ya existen pagos registrados'
    ]
  },
  
  // ==================== ERRORES DE ÓRDENES ====================
  [PURCHASE_ERROR_CODES.ORDER_NOT_FOUND]: {
    key: 'purchases.errors.order_not_found',
    defaultMessage: 'La orden de compra no existe',
    category: 'data',
    severity: 'error',
    retryable: false,
    hints: [
      'Verifique el ID de la orden de compra',
      'La orden puede haber sido eliminada',
      'Actualice la lista de órdenes'
    ]
  },
  
  [PURCHASE_ERROR_CODES.ORDER_ALREADY_CANCELLED]: {
    key: 'purchases.errors.order_already_cancelled',
    defaultMessage: 'La orden de compra ya ha sido cancelada',
    category: 'business',
    severity: 'warning',
    retryable: false,
    hints: [
      'La orden no puede ser modificada',
      'Cree una nueva orden si es necesario',
      'Verifique el historial de la orden'
    ]
  },
  
  [PURCHASE_ERROR_CODES.ORDER_CANNOT_BE_MODIFIED]: {
    key: 'purchases.errors.order_cannot_be_modified',
    defaultMessage: 'La orden no puede ser modificada en su estado actual',
    category: 'business',
    severity: 'warning',
    retryable: false,
    hints: [
      'Solo las órdenes pendientes pueden ser modificadas',
      'Verifique el estado actual de la orden',
      'Contacte al supervisor si es urgente'
    ]
  },
  
  // ==================== ERRORES DE SISTEMA ====================
  [PURCHASE_ERROR_CODES.NETWORK_ERROR]: {
    key: 'purchases.errors.network_error',
    defaultMessage: 'Error de conexión de red',
    category: 'network',
    severity: 'error',
    retryable: true,
    hints: [
      'Verifique su conexión a internet',
      'Reintente la operación en unos momentos',
      'Contacte al soporte técnico si persiste'
    ]
  },
  
  [PURCHASE_ERROR_CODES.SERVICE_UNAVAILABLE]: {
    key: 'purchases.errors.service_unavailable',
    defaultMessage: 'El servicio no está disponible temporalmente',
    category: 'service',
    severity: 'error',
    retryable: true,
    hints: [
      'El sistema está en mantenimiento',
      'Reintente en unos minutos',
      'Verifique el estado del servicio'
    ]
  },
  
  [PURCHASE_ERROR_CODES.CIRCUIT_BREAKER_OPEN]: {
    key: 'purchases.errors.circuit_breaker_open',
    defaultMessage: 'Servicio temporalmente no disponible debido a múltiples fallos',
    category: 'circuit',
    severity: 'warning',
    retryable: true,
    hints: [
      'El sistema se está recuperando de errores anteriores',
      'Espere unos momentos antes de reintentar',
      'El servicio se restaurará automáticamente'
    ]
  },
  
  [PURCHASE_ERROR_CODES.CACHE_ERROR]: {
    key: 'purchases.errors.cache_error',
    defaultMessage: 'Error en el sistema de cache',
    category: 'cache',
    severity: 'warning',
    retryable: true,
    hints: [
      'Los datos pueden no estar actualizados',
      'Refresque la página para obtener datos frescos',
      'El rendimiento puede verse afectado temporalmente'
    ]
  },
  
  // ==================== ERRORES DE API ====================
  [PURCHASE_ERROR_CODES.API_ERROR]: {
    key: 'purchases.errors.api_error',
    defaultMessage: 'Error en la comunicación con el servidor',
    category: 'api',
    severity: 'error',
    retryable: true,
    hints: [
      'Error interno del servidor',
      'Reintente la operación',
      'Contacte al soporte si el problema persiste'
    ]
  },
  
  [PURCHASE_ERROR_CODES.TIMEOUT_ERROR]: {
    key: 'purchases.errors.timeout_error',
    defaultMessage: 'La operación tardó demasiado tiempo',
    category: 'timeout',
    severity: 'warning',
    retryable: true,
    hints: [
      'El servidor está respondiendo lentamente',
      'Reintente con menos datos',
      'Verifique su conexión a internet'
    ]
  },
  
  [PURCHASE_ERROR_CODES.AUTHENTICATION_ERROR]: {
    key: 'purchases.errors.authentication_error',
    defaultMessage: 'Su sesión ha expirado',
    category: 'auth',
    severity: 'error',
    retryable: false,
    hints: [
      'Inicie sesión nuevamente',
      'Verifique sus credenciales',
      'Su sesión puede haber expirado por inactividad'
    ]
  },
  
  [PURCHASE_ERROR_CODES.AUTHORIZATION_ERROR]: {
    key: 'purchases.errors.authorization_error',
    defaultMessage: 'Acceso denegado',
    category: 'auth',
    severity: 'error',
    retryable: false,
    hints: [
      'No tiene permisos para esta acción',
      'Contacte al administrador',
      'Verifique que su cuenta esté activa'
    ]
  }
};

/**
 * Categorías de errores para clasificación y UI
 */
export const ERROR_CATEGORIES = {
  VALIDATION: 'validation',
  AUTHORIZATION: 'authorization',
  PAYMENT: 'payment',
  DATA: 'data',
  BUSINESS: 'business',
  NETWORK: 'network',
  SERVICE: 'service',
  CIRCUIT: 'circuit',
  CACHE: 'cache',
  API: 'api',
  TIMEOUT: 'timeout',
  AUTH: 'auth'
};

/**
 * Niveles de severidad para errores
 */
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Obtener información completa de un error
 * @param {string} errorCode - Código de error
 * @param {Object} context - Contexto adicional
 * @returns {Object} Información del error
 */
export function getErrorInfo(errorCode, context = {}) {
  const errorInfo = PURCHASE_ERROR_MESSAGES[errorCode];
  
  if (!errorInfo) {
    return {
      key: 'purchases.errors.unknown',
      defaultMessage: 'Ha ocurrido un error inesperado',
      category: ERROR_CATEGORIES.API,
      severity: ERROR_SEVERITY.ERROR,
      retryable: false,
      hints: ['Contacte al soporte técnico', 'Proporcione detalles del error']
    };
  }
  
  return {
    ...errorInfo,
    context,
    timestamp: new Date().toISOString()
  };
}

/**
 * Determinar si un error es recuperable automáticamente
 * @param {string} errorCode - Código de error
 * @returns {boolean} Si el error es recuperable
 */
export function isRetryableError(errorCode) {
  const errorInfo = PURCHASE_ERROR_MESSAGES[errorCode];
  return errorInfo ? errorInfo.retryable : false;
}

/**
 * Obtener color para UI basado en severidad
 * @param {string} severity - Nivel de severidad
 * @returns {string} Clase CSS o color
 */
export function getSeverityColor(severity) {
  const colors = {
    [ERROR_SEVERITY.INFO]: 'text-blue-600 bg-blue-50',
    [ERROR_SEVERITY.WARNING]: 'text-yellow-600 bg-yellow-50',
    [ERROR_SEVERITY.ERROR]: 'text-red-600 bg-red-50',
    [ERROR_SEVERITY.CRITICAL]: 'text-red-800 bg-red-100'
  };
  
  return colors[severity] || colors[ERROR_SEVERITY.ERROR];
}

/**
 * Obtener icono para UI basado en severidad
 * @param {string} severity - Nivel de severidad
 * @returns {string} Nombre del icono
 */
export function getSeverityIcon(severity) {
  const icons = {
    [ERROR_SEVERITY.INFO]: 'Info',
    [ERROR_SEVERITY.WARNING]: 'AlertTriangle',
    [ERROR_SEVERITY.ERROR]: 'AlertCircle',
    [ERROR_SEVERITY.CRITICAL]: 'XCircle'
  };
  
  return icons[severity] || icons[ERROR_SEVERITY.ERROR];
}

/**
 * Formatear mensaje de error para display
 * @param {string} errorCode - Código de error
 * @param {Object} params - Parámetros para interpolación
 * @param {Function} t - Función de traducción (opcional)
 * @returns {string} Mensaje formateado
 */
export function formatErrorMessage(errorCode, params = {}, t = null) {
  const errorInfo = getErrorInfo(errorCode);
  
  if (t && typeof t === 'function') {
    return t(errorInfo.key, params);
  }
  
  // Fallback a mensaje por defecto
  let message = errorInfo.defaultMessage;
  
  // Interpolación simple de parámetros
  Object.entries(params).forEach(([key, value]) => {
    message = message.replace(`{{${key}}}`, value);
  });
  
  return message;
}

/**
 * Crear objeto de error estandarizado
 * @param {string} errorCode - Código de error
 * @param {Object} context - Contexto adicional
 * @returns {Object} Error estandarizado
 */
export function createStandardError(errorCode, context = {}) {
  const errorInfo = getErrorInfo(errorCode, context);
  
  return {
    code: errorCode,
    message: errorInfo.defaultMessage,
    category: errorInfo.category,
    severity: errorInfo.severity,
    retryable: errorInfo.retryable,
    hints: errorInfo.hints,
    context: errorInfo.context,
    timestamp: errorInfo.timestamp,
    i18nKey: errorInfo.key
  };
}

export default {
  PURCHASE_ERROR_MESSAGES,
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
  getErrorInfo,
  isRetryableError,
  getSeverityColor,
  getSeverityIcon,
  formatErrorMessage,
  createStandardError
};
