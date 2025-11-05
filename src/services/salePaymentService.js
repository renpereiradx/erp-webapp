/**
 * Servicio para gestión de pagos de ventas
 * Integración con APIs de sale payment processing y cash register
 * Siguiendo patrón MVP: simple, directo, sin optimizaciones prematuras
 */

import { apiClient } from '@/services/api';
import { telemetry } from '@/utils/telemetry';

const API_ENDPOINTS = {
  // API v3.0 - Nuevo endpoint unificado de pagos
  processPaymentPartial: '/payment/process-partial',

  // API Legacy (mantener por compatibilidad)
  processPayment: '/payment/process',
  paymentDetails: (saleId) => `/payment/details/${saleId}`,
  paymentById: (paymentId) => `/payment/${paymentId}`,
  paymentStatistics: '/payment/statistics/change',

  // Gestión de ventas
  saleById: (id) => `/sale/${id}`,
  salesByDateRange: '/sale/date_range',
  cancelSale: (id) => `/sale/${id}`,
  cancellationPreview: (id) => `/sale/${id}/preview-cancellation`,
  priceChangeReport: '/sale/price-changes/report',

  // Nuevos endpoints de estado de pago (v3.0)
  salePaymentStatus: (id) => `/sale/${id}/payment-status`,
  salesByDateRangeWithPaymentStatus: '/sale/date_range/payment-status',
  salesByClientNameWithPaymentStatus: (name) => `/sale/client_name/${name}/payment-status`,

  // Cajas registradoras
  verifyIntegration: '/cash-registers/verify-integration'
};

// Helper con retry simple (máx 2 reintentos)
const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Backoff simple: 500ms * intento
        const backoffMs = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
    }
  }
  
  throw lastError;
};

export const salePaymentService = {
  // =================== GESTIÓN DE VENTAS EXISTENTES ===================

  /**
   * Obtiene lista de ventas por rango de fechas
   * @param {Object} filters - Filtros de búsqueda (start_date, end_date, page, page_size)
   * @returns {Promise<SalesListResponse>}
   */
  async getSalesByDateRange(filters = {}) {
    const startTime = Date.now();
    
    try {
      const params = new URLSearchParams(filters);
      const url = `${API_ENDPOINTS.salesByDateRange}?${params}`;
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetry.record('sale_payment.service.list_by_date', {
        duration: Date.now() - startTime,
        count: result?.sales?.length || 0,
        totalCount: result?.total_count || 0
      });
      
      return result;
    } catch (error) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSalesByDateRange'
      });
      throw error;
    }
  },

  /**
   * Obtiene una venta por ID
   * @param {number} saleId
   * @returns {Promise<Sale>}
   */
  async getSaleById(saleId) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.saleById(saleId));
      });
      
      telemetry.record('sale_payment.service.get_by_id', {
        duration: Date.now() - startTime,
        saleId
      });
      
      return result;
    } catch (error) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSaleById'
      });
      throw error;
    }
  },

  // =================== PROCESAMIENTO DE PAGOS ===================

  /**
   * Procesa un pago para una venta existente
   * @param {ProcessPaymentRequest} paymentData
   * @returns {Promise<ProcessPaymentResponse>}
   */
  async processPayment(paymentData) {
    const startTime = Date.now();

    // DEBUG LOG: Payload enviado al API
    console.group('🔍 [DEBUG] Payment API Request');
    console.log('Endpoint:', API_ENDPOINTS.processPayment);
    console.log('Payload:', JSON.stringify(paymentData, null, 2));
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.processPayment, paymentData);
      });

      // DEBUG LOG: Respuesta exitosa
      console.group('✅ [DEBUG] Payment API Response - Success');
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('Duration:', Date.now() - startTime, 'ms');
      console.groupEnd();

      telemetry.record('sale_payment.service.process_payment', {
        duration: Date.now() - startTime,
        saleId: paymentData.sales_order_id,
        amountReceived: paymentData.amount_received,
        requiresChange: result.requires_change,
        changeAmount: result.payment_details?.change_amount || 0
      });

      return result;
    } catch (error) {
      // DEBUG LOG: Error detallado
      console.group('❌ [DEBUG] Payment API Response - Error');
      console.log('Error Message:', error.message);
      console.log('Error Type:', error.constructor.name);
      console.log('Error Status:', error.status || 'N/A');
      console.log('Error Response:', JSON.stringify(error.response || error.data || {}, null, 2));
      console.log('Original Payload:', JSON.stringify(paymentData, null, 2));
      console.log('Duration:', Date.now() - startTime, 'ms');
      console.log('Full Error Object:', error);
      console.groupEnd();

      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'processPayment'
      });
      throw error;
    }
  },

  /**
   * Procesa pago con integración de caja registradora (API v3.0)
   * @param {ProcessSalePaymentCashRegisterRequest} paymentData
   * @returns {Promise<SalePaymentWithCashRegisterResponse>}
   */
  async processSalePaymentWithCashRegister(paymentData) {
    const startTime = Date.now();

    try {
      // Construir payload según API v3.0
      const payload = {
        sales_order_id: paymentData.sales_order_id,
        amount_received: paymentData.amount_received,
        cash_register_id: paymentData.cash_register_id,
        payment_reference: paymentData.payment_reference,
        payment_notes: paymentData.payment_notes
      };

      // Si el usuario especificó amount_to_apply, incluirlo
      if (paymentData.amount_to_apply) {
        payload.amount_to_apply = paymentData.amount_to_apply;
      }

      // DEBUG LOG: Payload enviado al API (Cash Register)
      console.group('🔍 [DEBUG] Cash Register Payment API Request');
      console.log('Endpoint:', API_ENDPOINTS.processPaymentPartial);
      console.log('Original Input:', JSON.stringify(paymentData, null, 2));
      console.log('Constructed Payload:', JSON.stringify(payload, null, 2));
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();

      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.processPaymentPartial, payload);
      });

      // DEBUG LOG: Respuesta exitosa
      console.group('✅ [DEBUG] Cash Register Payment API Response - Success');
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('Duration:', Date.now() - startTime, 'ms');
      console.groupEnd();

      // Telemetry con nueva estructura de respuesta
      telemetry.record('sale_payment.service.cash_register_payment', {
        duration: Date.now() - startTime,
        saleId: paymentData.sales_order_id,
        amountReceived: result.cash_summary?.cash_received || paymentData.amount_received,
        requiresChange: result.requires_change,
        netCashImpact: result.cash_summary?.net_cash_impact || 0
      });

      return result;
    } catch (error) {
      // DEBUG LOG: Error detallado
      console.group('❌ [DEBUG] Cash Register Payment API Response - Error');
      console.log('Error Message:', error.message);
      console.log('Error Type:', error.constructor.name);
      console.log('Error Status:', error.status || 'N/A');
      console.log('Error Response:', JSON.stringify(error.response || error.data || {}, null, 2));
      console.log('Original Input:', JSON.stringify(paymentData, null, 2));
      console.log('Duration:', Date.now() - startTime, 'ms');
      console.log('Full Error Object:', error);
      console.groupEnd();

      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'processSalePaymentWithCashRegister'
      });
      throw error;
    }
  },

  /**
   * Obtiene detalles de pago por venta
   * @param {string} saleId
   * @returns {Promise<PaymentDetailsQuery>}
   */
  async getPaymentDetails(saleId) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.paymentDetails(saleId));
      });
      
      telemetry.record('sale_payment.service.payment_details', {
        duration: Date.now() - startTime,
        saleId
      });
      
      return result;
    } catch (error) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getPaymentDetails'
      });
      throw error;
    }
  },

  /**
   * Obtiene estadísticas de vueltos
   * @param {Object} filters - Filtros de fecha (start_date, end_date)
   * @returns {Promise<ChangeStatistics>}
   */
  async getChangeStatistics(filters = {}) {
    const startTime = Date.now();
    
    try {
      const params = new URLSearchParams(filters);
      const url = `${API_ENDPOINTS.paymentStatistics}?${params}`;
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetry.record('sale_payment.service.change_statistics', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getChangeStatistics'
      });
      throw error;
    }
  },

  // =================== CANCELACIÓN DE VENTAS ===================

  /**
   * Obtiene preview de cancelación de una venta
   * @param {string} saleId
   * @returns {Promise<CancellationPreview>}
   */
  async getCancellationPreview(saleId) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.cancellationPreview(saleId));
      });
      
      telemetry.record('sale_payment.service.cancellation_preview', {
        duration: Date.now() - startTime,
        saleId
      });
      
      return result;
    } catch (error) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getCancellationPreview'
      });
      throw error;
    }
  },

  /**
   * Cancela una venta con reversión completa
   * @param {string} saleId
   * @param {CancelSaleRequest} cancellationData
   * @returns {Promise<CancelSaleResponse>}
   */
  async cancelSale(saleId, cancellationData = {}) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.put(API_ENDPOINTS.cancelSale(saleId), cancellationData);
      });
      
      telemetry.record('sale_payment.service.cancel_sale', {
        duration: Date.now() - startTime,
        saleId,
        reason: cancellationData.reason || 'not_specified'
      });
      
      return result;
    } catch (error) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'cancelSale'
      });
      throw error;
    }
  },

  /**
   * Obtiene reporte de cambios de precio
   * @param {Object} filters - Filtros (sale_id, start_date, end_date)
   * @returns {Promise<Array<PriceChangeReport>>}
   */
  async getPriceChangeReport(filters = {}) {
    const startTime = Date.now();
    
    try {
      const params = new URLSearchParams(filters);
      const url = `${API_ENDPOINTS.priceChangeReport}?${params}`;
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetry.record('sale_payment.service.price_change_report', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getPriceChangeReport'
      });
      throw error;
    }
  },

  // =================== VERIFICACIÓN DE SISTEMA ===================

  /**
   * Verifica la integridad de la integración
   * @returns {Promise<Object>}
   */
  async verifyIntegration() {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.verifyIntegration);
      });
      
      telemetry.record('sale_payment.service.verify', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'verifyIntegration'
      });
      throw error;
    }
  },

  // =================== UTILIDADES DE VALIDACIÓN ===================

  /**
   * Valida datos de pago para una venta existente
   * @param {ProcessPaymentRequest} data
   * @returns {Array<string>} Array de errores
   */
  validatePaymentData(data) {
    const errors = [];
    
    if (!data.sales_order_id || typeof data.sales_order_id !== 'string') {
      errors.push('ID de venta es requerido');
    }
    
    if (typeof data.amount_received !== 'number' || data.amount_received <= 0) {
      errors.push('Monto recibido debe ser mayor a 0');
    }
    
    return errors;
  },

  /**
   * Valida datos de pago con caja registradora
   * @param {ProcessSalePaymentCashRegisterRequest} data
   * @returns {Array<string>} Array de errores
   */
  validateCashRegisterPaymentData(data) {
    const errors = [];

    if (!data.sales_order_id || typeof data.sales_order_id !== 'string') {
      errors.push('ID de venta es requerido');
    }

    // Permitir monto 0 para ventas con descuento del 100%
    if (typeof data.amount_received !== 'number' || data.amount_received < 0) {
      errors.push('Monto recibido debe ser mayor o igual a 0');
    }

    return errors;
  },

  /**
   * Valida datos de cancelación de venta
   * @param {CancelSaleRequest} data
   * @returns {Array<string>} Array de errores
   */
  validateCancellationData(data) {
    const errors = [];
    
    if (!data.user_id || typeof data.user_id !== 'string') {
      errors.push('ID de usuario es requerido');
    }
    
    return errors;
  },

  // =================== CONSULTAS DE ESTADO DE PAGO (v3.0) ===================

  /**
   * Obtiene el estado de pago de una venta individual con historial completo
   * @param {string} saleId - ID de la venta
   * @returns {Promise<SalePaymentStatusResponse>}
   */
  async getSalePaymentStatus(saleId) {
    const startTime = Date.now();

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.salePaymentStatus(saleId));
      });

      telemetry.record('sale_payment.service.payment_status', {
        duration: Date.now() - startTime,
        saleId,
        balanceDue: result.balance_due,
        paymentProgress: result.payment_progress
      });

      return result;
    } catch (error) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSalePaymentStatus'
      });
      throw error;
    }
  },

  /**
   * Obtiene ventas por rango de fechas con resumen de estado de pago
   * @param {Object} filters - Filtros (start_date, end_date, page, page_size)
   * @returns {Promise<PaginatedSalesPaymentStatusResponse>}
   */
  async getSalesByDateRangeWithPaymentStatus(filters = {}) {
    const startTime = Date.now();

    try {
      const params = new URLSearchParams(filters);
      // Agregar timestamp para evitar caché (suficiente para bypass sin headers custom)
      params.append('_t', Date.now().toString());
      
      const url = `${API_ENDPOINTS.salesByDateRangeWithPaymentStatus}?${params}`;

      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });

      telemetry.record('sale_payment.service.list_with_payment_status', {
        duration: Date.now() - startTime,
        count: result?.data?.length || 0,
        totalRecords: result?.pagination?.total_records || 0
      });

      return result;
    } catch (error) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSalesByDateRangeWithPaymentStatus'
      });
      throw error;
    }
  },

  /**
   * Busca ventas por nombre de cliente con resumen de estado de pago
   * @param {string} clientName - Nombre del cliente (búsqueda parcial)
   * @param {Object} filters - Filtros adicionales (page, page_size)
   * @returns {Promise<PaginatedSalesPaymentStatusResponse>}
   */
  async getSalesByClientNameWithPaymentStatus(clientName, filters = {}) {
    const startTime = Date.now();

    try {
      const params = new URLSearchParams(filters);
      const url = `${API_ENDPOINTS.salesByClientNameWithPaymentStatus(clientName)}?${params}`;

      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });

      telemetry.record('sale_payment.service.client_search_with_payment_status', {
        duration: Date.now() - startTime,
        clientName,
        count: result?.data?.length || 0
      });

      return result;
    } catch (error) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSalesByClientNameWithPaymentStatus'
      });
      throw error;
    }
  },

  // =================== UTILIDADES DE BÚSQUEDA ===================

  /**
   * Busca ventas por cliente
   * @param {string} clientId
   * @param {Object} additionalFilters
   * @returns {Promise<SalesListResponse>}
   */
  async searchSalesByClient(clientId, additionalFilters = {}) {
    const filters = {
      ...additionalFilters,
      client_id: clientId
    };
    return await this.getSalesByDateRange(filters);
  },

  /**
   * Busca ventas por estado
   * @param {string} status
   * @param {Object} additionalFilters
   * @returns {Promise<SalesListResponse>}
   */
  async searchSalesByStatus(status, additionalFilters = {}) {
    const filters = {
      ...additionalFilters,
      status
    };
    return await this.getSalesByDateRange(filters);
  }
};

export default salePaymentService;
