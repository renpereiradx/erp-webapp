/**
 * UNIFIED PAYMENT ORCHESTRATOR - Enterprise Grade
 * Central payment processing system for Sales and Purchases
 * 
 * Features:
 * - Context-aware payment processing (Sales/Purchases)
 * - Multiple payment methods support
 * - Automatic change calculation and validation
 * - Unified payment analytics and statistics
 * - Comprehensive error handling with categorization
 * - Adapter pattern for context-specific logic
 * 
 * Architecture: Orchestrator + Adapters pattern
 * Enfoque: Hardened Implementation - Production ready from day 1
 */

import { apiClient } from './api';
import { telemetry } from '@/utils/telemetry';
import { circuitBreaker } from '@/utils/circuitBreaker';
import { retryWithBackoff } from '@/utils/retry';

// Import unified architecture definitions
import { 
  PAYMENT_TYPES, 
  PAYMENT_STATUS, 
  TRANSACTION_CONTEXTS,
  CONTEXT_CONFIG 
} from './paymentArchitecture.js';

/**
 * @typedef {Object} UnifiedPaymentRequest
 * @property {string} context - 'sale' | 'purchase' 
 * @property {string} transactionId - ID de la venta o compra
 * @property {number} amount - Monto a pagar
 * @property {string} paymentType - Tipo de pago
 * @property {number} [amountReceived] - Monto recibido (para calcular cambio)
 * @property {string} [currency='MXN'] - Moneda
 * @property {string} [userId] - Usuario que procesa el pago
 * @property {Object} [metadata] - Información adicional específica del contexto
 */

/**
 * @typedef {Object} UnifiedPaymentResponse
 * @property {boolean} success
 * @property {string} message
 * @property {string} paymentId
 * @property {string} transactionId
 * @property {string} context
 * @property {number} amount
 * @property {number} [change] - Cambio calculado
 * @property {string} status
 * @property {string} processedAt
 * @property {Object} [details] - Detalles específicos del contexto
 */

// Payment error codes (unified for all contexts)
const PAYMENT_ERROR_CODES = {
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  PAYMENT_ALREADY_PROCESSED: 'PAYMENT_ALREADY_PROCESSED',
  INVALID_CONTEXT: 'INVALID_CONTEXT',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
};

/**
 * Categoriza errores de pagos de forma unificada
 */
const categorizePaymentError = (error, context = '') => {
  const errorCode = error.error_code || error.code;
  const httpStatus = error.status || error.response?.status;
  
  let userMessage = '';
  let technicalMessage = error.message || 'Unknown payment error';
  let suggestedAction = '';
  let recoverable = false;
  let retryable = false;
  let severity = 'medium';

  switch (errorCode) {
    case PAYMENT_ERROR_CODES.INVALID_AMOUNT:
      userMessage = 'El monto ingresado no es válido.';
      suggestedAction = 'Verifique que el monto sea un número positivo.';
      severity = 'low';
      break;
      
    case PAYMENT_ERROR_CODES.INSUFFICIENT_FUNDS:
      userMessage = 'El monto recibido es insuficiente.';
      suggestedAction = 'Verifique el monto recibido y solicite la diferencia.';
      severity = 'low';
      break;
      
    case PAYMENT_ERROR_CODES.INVALID_PAYMENT_METHOD:
      userMessage = 'El método de pago seleccionado no es válido.';
      suggestedAction = 'Seleccione un método de pago válido.';
      severity = 'low';
      break;
      
    case PAYMENT_ERROR_CODES.TRANSACTION_NOT_FOUND:
      userMessage = 'La transacción especificada no existe.';
      suggestedAction = 'Verifique el ID de la transacción.';
      severity = 'medium';
      break;
      
    case PAYMENT_ERROR_CODES.PAYMENT_ALREADY_PROCESSED:
      userMessage = 'Esta transacción ya ha sido pagada.';
      suggestedAction = 'Verifique el estado actual de la transacción.';
      severity = 'low';
      break;
      
    case PAYMENT_ERROR_CODES.INVALID_CONTEXT:
      userMessage = 'Contexto de pago inválido.';
      suggestedAction = 'Contacte al administrador del sistema.';
      severity = 'high';
      break;
      
    case PAYMENT_ERROR_CODES.CALCULATION_ERROR:
      userMessage = 'Error en el cálculo del pago.';
      suggestedAction = 'Verifique los montos e intente nuevamente.';
      severity = 'medium';
      recoverable = true;
      break;
      
    default:
      if (httpStatus >= 500) {
        userMessage = 'Error del servidor durante el procesamiento del pago.';
        suggestedAction = 'Intente nuevamente en unos momentos.';
        retryable = true;
        severity = 'high';
      } else if (httpStatus === 401) {
        userMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
        severity = 'low';
      } else {
        userMessage = 'Error desconocido durante el procesamiento del pago.';
        severity = 'medium';
      }
  }

  const categorizedError = new Error(userMessage || technicalMessage);
  categorizedError.code = errorCode;
  categorizedError.recoverable = recoverable;
  categorizedError.retryable = retryable;
  categorizedError.severity = severity;
  categorizedError.technicalMessage = technicalMessage;
  categorizedError.suggestedAction = suggestedAction;
  categorizedError.context = context;
  categorizedError.timestamp = new Date().toISOString();
  
  return categorizedError;
};

/**
 * Wrapper de API para pagos con resiliencia
 */
const paymentApiCall = async (apiCall, context, options = {}) => {
  const { retries = 2, baseDelay = 1000 } = options;
  const startTime = Date.now();
  
  try {
    const result = await retryWithBackoff(
      apiCall,
      {
        retries,
        baseDelay,
        shouldRetry: (error) => {
          const categorized = categorizePaymentError(error, context);
          return categorized.retryable;
        }
      }
    );

    telemetry.record(`payments.api.${context}.success`, {
      duration: Date.now() - startTime
    });

    return result;
  } catch (error) {
    const categorized = categorizePaymentError(error, context);
    
    telemetry.record(`payments.api.${context}.error`, {
      duration: Date.now() - startTime,
      code: categorized.code,
      severity: categorized.severity,
      recoverable: categorized.recoverable,
      retryable: categorized.retryable
    });
    
    throw categorized;
  }
};

export const unifiedPaymentService = {
  /**
   * Procesar pago unificado (Sales o Purchases)
   * @param {UnifiedPaymentRequest} paymentData - Datos del pago
   * @returns {Promise<UnifiedPaymentResponse>}
   */
  async processPayment(paymentData) {
    // Validar entrada
    const validation = this.validatePaymentData(paymentData);
    if (!validation.isValid) {
      throw categorizePaymentError(
        { 
          error_code: PAYMENT_ERROR_CODES.INVALID_AMOUNT, 
          message: validation.errors.join(', ') 
        },
        'process_payment'
      );
    }

    const { context, transactionId, amount, paymentType, amountReceived } = paymentData;
    
    // Obtener configuración específica del contexto
    const contextConfig = CONTEXT_CONFIG[context];
    if (!contextConfig) {
      throw categorizePaymentError(
        { 
          error_code: PAYMENT_ERROR_CODES.INVALID_CONTEXT, 
          message: `Contexto inválido: ${context}` 
        },
        'process_payment'
      );
    }

    // Calcular cambio si es necesario
    const change = this.calculateChange(amount, amountReceived, paymentType);
    
    // Preparar datos para la API según el contexto
    const apiPayload = {
      amount,
      payment_type: paymentType,
      currency: paymentData.currency || 'MXN',
      user_id: paymentData.userId || 'current_user',
      metadata: {
        ...paymentData.metadata,
        change_calculated: change,
        amountReceived
      }
    };

    telemetry.record('payments.process.start', {
      context,
      transactionId,
      amount,
      paymentType,
      hasChange: change > 0
    });

    // Ejecutar pago usando el endpoint específico del contexto
    const endpoint = contextConfig.endpoint.replace('{id}', transactionId);
    
    return paymentApiCall(
      () => apiClient.post(endpoint, apiPayload),
      'process_payment'
    );
  },

  /**
   * Calcular cambio automáticamente
   * @param {number} amount - Monto total a pagar
   * @param {number} amountReceived - Monto recibido
   * @param {string} paymentType - Tipo de pago
   * @returns {number} Cambio a devolver
   */
  calculateChange(amount, amountReceived, paymentType) {
    // Solo calcular cambio para pagos en efectivo
    if (paymentType !== PAYMENT_TYPES.CASH) {
      return 0;
    }

    if (!amountReceived || amountReceived < amount) {
      throw categorizePaymentError(
        { 
          error_code: PAYMENT_ERROR_CODES.INSUFFICIENT_FUNDS, 
          message: 'Monto recibido insuficiente' 
        },
        'calculate_change'
      );
    }

    const change = Math.round((amountReceived - amount) * 100) / 100;
    
    telemetry.record('payments.change.calculated', {
      amount,
      amountReceived,
      change,
      paymentType
    });

    return change;
  },

  /**
   * Validar datos de pago
   * @param {UnifiedPaymentRequest} paymentData
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validatePaymentData(paymentData) {
    const errors = [];

    if (!paymentData.context || !Object.values(TRANSACTION_CONTEXTS).includes(paymentData.context)) {
      errors.push('Contexto de transacción inválido');
    }

    if (!paymentData.transactionId || typeof paymentData.transactionId !== 'string') {
      errors.push('ID de transacción inválido');
    }

    if (!paymentData.amount || typeof paymentData.amount !== 'number' || paymentData.amount <= 0) {
      errors.push('Monto inválido');
    }

    if (!paymentData.paymentType || !Object.values(PAYMENT_TYPES).includes(paymentData.paymentType)) {
      errors.push('Tipo de pago inválido');
    }

    // Validaciones específicas para pago en efectivo
    if (paymentData.paymentType === PAYMENT_TYPES.CASH) {
      if (!paymentData.amountReceived || typeof paymentData.amountReceived !== 'number') {
        errors.push('Monto recibido requerido para pagos en efectivo');
      } else if (paymentData.amountReceived < paymentData.amount) {
        errors.push('Monto recibido insuficiente');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Obtener historial de pagos (unificado para ambos contextos)
   * @param {Object} [params] - Parámetros de consulta
   * @param {string} [params.context] - Filtrar por contexto
   * @param {string} [params.startDate] - Fecha de inicio
   * @param {string} [params.endDate] - Fecha de fin
   * @param {number} [params.page=1] - Página
   * @param {number} [params.pageSize=20] - Tamaño de página
   * @returns {Promise<Object>}
   */
  async getPaymentHistory(params = {}) {
    const {
      context,
      startDate,
      endDate,
      page = 1,
      pageSize = 20
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString()
    });

    if (context) queryParams.append('context', context);
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    telemetry.record('payments.get_history.start', params);

    return paymentApiCall(
      () => apiClient.get(`/payments/history?${queryParams}`),
      'get_payment_history',
      { retries: 2 }
    );
  },

  /**
   * Obtener estadísticas de pagos unificadas
   * @param {Object} [params] - Parámetros del reporte
   * @param {string} [params.context] - Filtrar por contexto
   * @param {string} [params.period='month'] - Período (day, week, month, year)
   * @param {string} [params.startDate] - Fecha de inicio personalizada
   * @param {string} [params.endDate] - Fecha de fin personalizada
   * @returns {Promise<Object>}
   */
  async getPaymentStatistics(params = {}) {
    const { period = 'month', context } = params;
    const queryParams = new URLSearchParams({ period });

    if (context) queryParams.append('context', context);
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);

    telemetry.record('payments.get_statistics.start', params);

    return paymentApiCall(
      () => apiClient.get(`/payments/statistics?${queryParams}`),
      'get_payment_statistics',
      { retries: 2 }
    );
  },

  /**
   * Obtener estadísticas de cambio
   * @param {Object} [params] - Parámetros del reporte
   * @returns {Promise<Object>}
   */
  async getChangeStatistics(params = {}) {
    const { period = 'month' } = params;
    const queryParams = new URLSearchParams({ period });

    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);

    telemetry.record('payments.get_change_statistics.start', params);

    return paymentApiCall(
      () => apiClient.get(`/payments/change-statistics?${queryParams}`),
      'get_change_statistics',
      { retries: 2 }
    );
  }
};

// Mantener compatibilidad con el API anterior (legacy)
export const paymentService = {
  ...unifiedPaymentService,
  
  // Método legacy para procesamiento de pagos de ventas
  async processPayment(saleId, paymentData) {
    const unifiedRequest = {
      context: TRANSACTION_CONTEXTS.SALE,
      transactionId: saleId,
      ...paymentData
    };
    
    return unifiedPaymentService.processPayment(unifiedRequest);
  }
};

export default unifiedPaymentService;
