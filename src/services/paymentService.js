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
 /* Processing Service - Enterprise Grade
 * Advanced payment processing with automatic change calculation
 * 
 * Features:
 * - Automatic change calculation and validation
 * - Multi-currency support preparation
 * - Comprehensive error handling and recovery
 * - Integration with session management
 * - Payment analytics and reporting
 * - Security-first design with audit trails
 * 
 * Enfoque: Hardened Implementation - Production ready from day 1
 */

import { apiClient } from './api';
import { telemetry } from '@/utils/telemetry';
import { circuitBreaker } from '@/utils/circuitBreaker';
import { retryWithBackoff } from '@/utils/retry';

/**
 * @typedef {Object} ProcessPaymentRequest
 * @property {string} sales_order_id - ID de la venta
 * @property {number} amount_received - Monto recibido del cliente
 * @property {string} [payment_reference] - Referencia del pago (opcional)
 * @property {string} [payment_notes] - Notas del pago (opcional)
 */

/**
 * @typedef {Object} PaymentDetails
 * @property {number} total_due - Total a pagar
 * @property {number} amount_received - Monto recibido
 * @property {number} change_amount - Vuelto a entregar
 * @property {string} currency_code - Código de moneda
 * @property {string} payment_method - Método de pago
 * @property {string} [payment_reference] - Referencia del pago
 */

/**
 * @typedef {Object} ProcessPaymentResponse
 * @property {boolean} success
 * @property {number} [payment_id]
 * @property {string} sale_id
 * @property {string} client_name
 * @property {PaymentDetails} payment_details
 * @property {string} message
 * @property {boolean} requires_change - Si requiere dar vuelto
 * @property {string} processed_at
 * @property {string} processed_by
 * @property {string} [error]
 * @property {string} [error_code]
 */

/**
 * @typedef {Object} PaymentDetailsQuery
 * @property {number} payment_id
 * @property {string} sales_order_id
 * @property {string} client_name
 * @property {number} amount_due
 * @property {number} amount_received
 * @property {number} change_amount
 * @property {string} currency_code
 * @property {string} payment_method_code
 * @property {string} [payment_reference]
 * @property {string} [payment_notes]
 * @property {string} payment_date
 * @property {string} processed_by_name
 * @property {string} status
 */

/**
 * @typedef {Object} ChangeStatistics
 * @property {Object} period
 * @property {string} period.start_date
 * @property {string} period.end_date
 * @property {Object} statistics
 * @property {number} statistics.total_payments
 * @property {number} statistics.payments_with_change
 * @property {number} statistics.payments_exact_amount
 * @property {number} statistics.change_percentage
 * @property {number} statistics.total_change_given
 * @property {number} statistics.average_change_amount
 * @property {number} statistics.maximum_change_amount
 * @property {string} generated_at
 */

// Payment error codes
const PAYMENT_ERROR_CODES = {
  SALE_NOT_FOUND: 'SALE_NOT_FOUND',
  SALE_CANCELLED: 'SALE_CANCELLED',
  SALE_ALREADY_PAID: 'SALE_ALREADY_PAID',
  INSUFFICIENT_AMOUNT: 'INSUFFICIENT_AMOUNT',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  PAYMENT_METHOD_NOT_FOUND: 'PAYMENT_METHOD_NOT_FOUND',
  CURRENCY_MISMATCH: 'CURRENCY_MISMATCH',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
};

/**
 * Categoriza errores de pago
 */
const categorizePaymentError = (error, context = '') => {
  const errorCode = error.error_code || error.code;
  const httpStatus = error.status || error.response?.status;
  
  let userMessage = '';
  let technicalMessage = error.message || 'Unknown payment error';
  let suggestedAction = '';
  let recoverable = false;
  let retryable = false;

  switch (errorCode) {
    case PAYMENT_ERROR_CODES.SALE_NOT_FOUND:
      userMessage = 'La venta especificada no existe o ha sido eliminada.';
      suggestedAction = 'Verifique el ID de la venta y vuelva a intentar.';
      break;
      
    case PAYMENT_ERROR_CODES.SALE_CANCELLED:
      userMessage = 'No se puede procesar el pago para una venta cancelada.';
      suggestedAction = 'Verifique el estado de la venta antes de procesar el pago.';
      break;
      
    case PAYMENT_ERROR_CODES.SALE_ALREADY_PAID:
      userMessage = 'Esta venta ya ha sido pagada completamente.';
      suggestedAction = 'Revise el historial de pagos de la venta.';
      break;
      
    case PAYMENT_ERROR_CODES.INSUFFICIENT_AMOUNT:
      const amountDue = error.amount_due || 0;
      const amountReceived = error.amount_received || 0;
      userMessage = `Monto insuficiente. Se requiere: $${amountDue.toFixed(2)}, recibido: $${amountReceived.toFixed(2)}`;
      suggestedAction = 'Ajuste el monto recibido para cubrir el total de la venta.';
      recoverable = true;
      break;
      
    case PAYMENT_ERROR_CODES.INVALID_AMOUNT:
      userMessage = 'El monto del pago no es válido.';
      suggestedAction = 'Ingrese un monto válido mayor a cero.';
      recoverable = true;
      break;
      
    case PAYMENT_ERROR_CODES.PAYMENT_METHOD_NOT_FOUND:
      userMessage = 'El método de pago seleccionado no es válido.';
      suggestedAction = 'Seleccione un método de pago válido de la lista.';
      recoverable = true;
      break;
      
    case PAYMENT_ERROR_CODES.CURRENCY_MISMATCH:
      userMessage = 'La moneda del pago no coincide con la moneda de la venta.';
      suggestedAction = 'Verifique la moneda seleccionada.';
      recoverable = true;
      break;
      
    default:
      if (httpStatus >= 500) {
        userMessage = 'Error del servidor al procesar el pago. Por favor, intente más tarde.';
        retryable = true;
      } else if (httpStatus === 401) {
        userMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
      } else {
        userMessage = 'Error desconocido al procesar el pago.';
      }
  }

  const categorizedError = new Error(userMessage || technicalMessage);
  categorizedError.code = errorCode;
  categorizedError.recoverable = recoverable;
  categorizedError.retryable = retryable;
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
  const { retries = 2, baseDelay = 1000 } = options; // Menos reintentos para operaciones de pago
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
      recoverable: categorized.recoverable,
      retryable: categorized.retryable
    });
    
    throw categorized;
  }
};

export const paymentService = {
  /**
   * Procesar pago con cálculo automático de vuelto
   * @param {ProcessPaymentRequest} paymentData - Datos del pago
   * @returns {Promise<ProcessPaymentResponse>}
   */
  async processPayment(paymentData) {
    // Validación previa
    const validation = await this.validatePaymentData(paymentData);
    if (!validation.valid) {
      throw categorizePaymentError(
        {
          error_code: PAYMENT_ERROR_CODES.INVALID_AMOUNT,
          message: validation.errors.join(', ')
        },
        'process_payment'
      );
    }

    telemetry.record('payments.process.start', {
      saleId: paymentData.sales_order_id,
      amountReceived: paymentData.amount_received,
      hasReference: !!paymentData.payment_reference
    });

    return paymentApiCall(
      () => apiClient.post('/payment/process', paymentData),
      'process_payment'
    );
  },

  /**
   * Obtener detalles de pago por venta
   * @param {string} saleId - ID de la venta
   * @returns {Promise<PaymentDetailsQuery>}
   */
  async getPaymentDetailsBySale(saleId) {
    if (!saleId || typeof saleId !== 'string') {
      throw categorizePaymentError(
        { 
          error_code: 'INVALID_SALE_ID', 
          message: 'ID de venta inválido' 
        },
        'get_payment_details_by_sale'
      );
    }

    telemetry.record('payments.get_details_by_sale.start', { saleId });

    return paymentApiCall(
      () => apiClient.get(`/payment/details/${saleId}`),
      'get_payment_details_by_sale'
    );
  },

  /**
   * Obtener detalles de pago por ID específico
   * @param {number} paymentId - ID del pago
   * @returns {Promise<PaymentDetailsQuery>}
   */
  async getPaymentDetailsById(paymentId) {
    if (!paymentId || !Number.isInteger(paymentId) || paymentId <= 0) {
      throw categorizePaymentError(
        { 
          error_code: 'INVALID_PAYMENT_ID', 
          message: 'ID de pago inválido' 
        },
        'get_payment_details_by_id'
      );
    }

    telemetry.record('payments.get_details_by_id.start', { paymentId });

    return paymentApiCall(
      () => apiClient.get(`/payment/${paymentId}`),
      'get_payment_details_by_id'
    );
  },

  /**
   * Obtener estadísticas de vueltos
   * @param {Object} params - Parámetros del reporte
   * @param {string} [params.startDate] - Fecha de inicio (YYYY-MM-DD)
   * @param {string} [params.endDate] - Fecha de fin (YYYY-MM-DD)
   * @returns {Promise<ChangeStatistics>}
   */
  async getChangeStatistics(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);

    telemetry.record('payments.get_change_statistics.start', params);

    return paymentApiCall(
      () => apiClient.get(`/payment/statistics/change?${queryParams}`),
      'get_change_statistics'
    );
  },

  /**
   * Calcular vuelto localmente (para validación previa)
   * @param {number} totalDue - Total a pagar
   * @param {number} amountReceived - Monto recibido
   * @returns {Object} Resultado del cálculo
   */
  calculateChange(totalDue, amountReceived) {
    if (typeof totalDue !== 'number' || typeof amountReceived !== 'number') {
      throw new Error('Los montos deben ser números válidos');
    }

    if (totalDue < 0 || amountReceived < 0) {
      throw new Error('Los montos no pueden ser negativos');
    }

    const changeAmount = amountReceived - totalDue;
    const requiresChange = changeAmount > 0;
    const isSufficient = amountReceived >= totalDue;
    const isExactAmount = changeAmount === 0;

    telemetry.record('payments.calculate_change', {
      totalDue,
      amountReceived,
      changeAmount,
      requiresChange,
      isSufficient,
      isExactAmount
    });

    return {
      totalDue: Number(totalDue.toFixed(2)),
      amountReceived: Number(amountReceived.toFixed(2)),
      changeAmount: Number(Math.abs(changeAmount).toFixed(2)),
      requiresChange,
      isSufficient,
      isExactAmount,
      shortfall: isSufficient ? 0 : Number(Math.abs(changeAmount).toFixed(2))
    };
  },

  /**
   * Validar datos de pago antes del procesamiento
   * @param {ProcessPaymentRequest} paymentData - Datos a validar
   * @returns {Promise<{valid: boolean, errors: string[]}>}
   */
  async validatePaymentData(paymentData) {
    const errors = [];

    // Validaciones básicas
    if (!paymentData.sales_order_id || typeof paymentData.sales_order_id !== 'string') {
      errors.push('ID de venta es requerido y debe ser válido');
    }

    if (typeof paymentData.amount_received !== 'number') {
      errors.push('Monto recibido debe ser un número válido');
    } else if (paymentData.amount_received <= 0) {
      errors.push('Monto recibido debe ser mayor a cero');
    } else if (!Number.isFinite(paymentData.amount_received)) {
      errors.push('Monto recibido debe ser un número finito');
    }

    // Validación de referencia de pago si está presente
    if (paymentData.payment_reference && typeof paymentData.payment_reference !== 'string') {
      errors.push('Referencia de pago debe ser una cadena de texto');
    }

    // Validación de notas si están presentes
    if (paymentData.payment_notes && typeof paymentData.payment_notes !== 'string') {
      errors.push('Notas de pago deben ser una cadena de texto');
    }

    const valid = errors.length === 0;

    telemetry.record('payments.validate_data', {
      valid,
      errorCount: errors.length,
      hasReference: !!paymentData.payment_reference,
      hasNotes: !!paymentData.payment_notes
    });

    return { valid, errors };
  },

  /**
   * Obtener métodos de pago disponibles
   * @returns {Promise<Array>} Lista de métodos de pago
   */
  async getPaymentMethods() {
    telemetry.record('payments.get_payment_methods.start');

    return paymentApiCall(
      () => apiClient.get('/payment/methods'),
      'get_payment_methods'
    );
  },

  /**
   * Obtener monedas disponibles
   * @returns {Promise<Array>} Lista de monedas
   */
  async getCurrencies() {
    telemetry.record('payments.get_currencies.start');

    return paymentApiCall(
      () => apiClient.get('/payment/currencies'),
      'get_currencies'
    );
  },

  /**
   * Obtener historial de pagos por cliente
   * @param {string} clientId - ID del cliente
   * @param {Object} [options] - Opciones de consulta
   * @param {number} [options.page=1] - Página
   * @param {number} [options.pageSize=20] - Tamaño de página
   * @returns {Promise<Object>} Historial de pagos
   */
  async getPaymentHistoryByClient(clientId, options = {}) {
    if (!clientId || typeof clientId !== 'string') {
      throw categorizePaymentError(
        { 
          error_code: 'INVALID_CLIENT_ID', 
          message: 'ID de cliente inválido' 
        },
        'get_payment_history_by_client'
      );
    }

    const { page = 1, pageSize = 20 } = options;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString()
    });

    telemetry.record('payments.get_history_by_client.start', {
      clientId,
      page,
      pageSize
    });

    return paymentApiCall(
      () => apiClient.get(`/payment/history/client/${clientId}?${queryParams}`),
      'get_payment_history_by_client'
    );
  },

  /**
   * Generar reporte de pagos
   * @param {Object} params - Parámetros del reporte
   * @param {string} params.startDate - Fecha de inicio
   * @param {string} params.endDate - Fecha de fin
   * @param {string} [params.format='json'] - Formato del reporte (json, csv, pdf)
   * @param {string} [params.groupBy] - Agrupar por (day, week, month, payment_method)
   * @returns {Promise<Object>} Reporte de pagos
   */
  async generatePaymentReport(params) {
    const { startDate, endDate, format = 'json', groupBy } = params;

    if (!startDate || !endDate) {
      throw categorizePaymentError(
        { 
          error_code: 'INVALID_DATE_RANGE', 
          message: 'Fechas de inicio y fin son requeridas' 
        },
        'generate_payment_report'
      );
    }

    const queryParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      format
    });

    if (groupBy) queryParams.append('group_by', groupBy);

    telemetry.record('payments.generate_report.start', params);

    return paymentApiCall(
      () => apiClient.get(`/payment/report?${queryParams}`),
      'generate_payment_report'
    );
  }
};

export default paymentService;
