/**
 * Servicio para gestión de pagos de ventas
 * Integración con APIs de sale payment processing y cash register
 * Siguiendo patrón MVP: simple, directo, sin optimizaciones prematuras
 */

import { apiClient } from '@/services/api';
import { telemetry } from '@/utils/telemetry';

const API_ENDPOINTS = {
  // API correcta según documentación SALE_PAYMENT_API.md
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
  
  // Integración con caja registradora  
  salePaymentWithCashRegister: '/cash-registers/payments/sale',
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
      console.log('🌐 SalePayment: Loading sales by date range...');
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
      
      console.log('✅ SalePayment: Sales loaded by date range');
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
      console.log(`🌐 SalePayment: Loading sale ${saleId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.saleById(saleId));
      });
      
      telemetry.record('sale_payment.service.get_by_id', {
        duration: Date.now() - startTime,
        saleId
      });
      
      console.log('✅ SalePayment: Sale loaded');
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
    
    try {
      console.log(`🌐 SalePayment: Processing payment for sale ${paymentData.sales_order_id}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.processPayment, paymentData);
      });
      
      telemetry.record('sale_payment.service.process_payment', {
        duration: Date.now() - startTime,
        saleId: paymentData.sales_order_id,
        amountReceived: paymentData.amount_received,
        requiresChange: result.requires_change,
        changeAmount: result.payment_details?.change_amount || 0
      });
      
      console.log('✅ SalePayment: Payment processed successfully');
      return result;
    } catch (error) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'processPayment'
      });
      throw error;
    }
  },

  /**
   * Procesa pago con integración de caja registradora
   * @param {ProcessSalePaymentCashRegisterRequest} paymentData
   * @returns {Promise<SalePaymentWithCashRegisterResponse>}
   */
  async processSalePaymentWithCashRegister(paymentData) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 SalePayment: Processing sale payment with cash register for ${paymentData.sales_order_id}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.salePaymentWithCashRegister, paymentData);
      });
      
      telemetry.record('sale_payment.service.cash_register_payment', {
        duration: Date.now() - startTime,
        saleId: paymentData.sales_order_id,
        amountReceived: paymentData.amount_received,
        requiresChange: result.requires_change,
        netCashImpact: result.cash_register_integration?.net_cash_impact || 0
      });
      
      console.log('✅ SalePayment: Sale payment with cash register processed successfully');
      return result;
    } catch (error) {
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
      console.log(`🌐 SalePayment: Loading payment details for sale ${saleId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.paymentDetails(saleId));
      });
      
      telemetry.record('sale_payment.service.payment_details', {
        duration: Date.now() - startTime,
        saleId
      });
      
      console.log('✅ SalePayment: Payment details loaded');
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
      console.log('🌐 SalePayment: Loading change statistics...');
      const params = new URLSearchParams(filters);
      const url = `${API_ENDPOINTS.paymentStatistics}?${params}`;
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetry.record('sale_payment.service.change_statistics', {
        duration: Date.now() - startTime
      });
      
      console.log('✅ SalePayment: Change statistics loaded');
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
      console.log(`🌐 SalePayment: Getting cancellation preview for sale ${saleId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.cancellationPreview(saleId));
      });
      
      telemetry.record('sale_payment.service.cancellation_preview', {
        duration: Date.now() - startTime,
        saleId
      });
      
      console.log('✅ SalePayment: Cancellation preview loaded');
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
      console.log(`🌐 SalePayment: Cancelling sale ${saleId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.put(API_ENDPOINTS.cancelSale(saleId), cancellationData);
      });
      
      telemetry.record('sale_payment.service.cancel_sale', {
        duration: Date.now() - startTime,
        saleId,
        reason: cancellationData.reason || 'not_specified'
      });
      
      console.log('✅ SalePayment: Sale cancelled successfully');
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
      console.log('🌐 SalePayment: Loading price change report...');
      const params = new URLSearchParams(filters);
      const url = `${API_ENDPOINTS.priceChangeReport}?${params}`;
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetry.record('sale_payment.service.price_change_report', {
        duration: Date.now() - startTime
      });
      
      console.log('✅ SalePayment: Price change report loaded');
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
      console.log('🌐 SalePayment: Verifying integration...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.verifyIntegration);
      });
      
      telemetry.record('sale_payment.service.verify', {
        duration: Date.now() - startTime
      });
      
      console.log('✅ SalePayment: Integration verified');
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
    
    if (typeof data.amount_received !== 'number' || data.amount_received <= 0) {
      errors.push('Monto recibido debe ser mayor a 0');
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