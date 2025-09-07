/**
 * Servicio para gestión de pagos de compras integrado
 * Sistema completo de órdenes de compra, pagos y cancelaciones
 * Basado en PURCHASE_API.md - Sistema integrado ERP
 */

import { apiClient } from '@/services/api';
import { telemetry } from '@/utils/telemetry';

const API_ENDPOINTS = {
  // API según documentación PURCHASE_API.md
  createPurchaseEnhanced: '/purchase/enhanced',
  processPayment: '/purchase/payment/process', 
  cancellationPreview: (id) => `/purchase/${id}/preview-cancellation`,
  cancelPurchaseEnhanced: (id) => `/purchase/cancel-enhanced/${id}`,
  paymentStatistics: '/purchase/payment/statistics',
  
  // Gestión de órdenes de compra
  purchaseOrders: '/purchase/orders',
  purchaseOrderById: (id) => `/purchase/orders/${id}`,
  paymentHistory: (id) => `/purchase/orders/${id}/payments`,
  
  // Verificación del sistema
  verifyIntegration: '/purchase/verify-integration'
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

export const purchasePaymentService = {
  // =================== GESTIÓN DE ÓRDENES DE COMPRA ===================

  /**
   * Crea una nueva orden de compra mejorada con capacidades de pago
   * @param {Object} purchaseData
   * @returns {Promise<Object>}
   */
  async createPurchaseOrder(purchaseData) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 PurchasePayment: Creating enhanced purchase order...');
      
      // Transformar datos al formato de la API
      const apiData = {
        supplier_id: purchaseData.supplier_id,
        status: 'pending',
        product_details: purchaseData.products.map(product => ({
          product_id: product.product_id.toString(),
          quantity: product.quantity,
          unit_price: product.unit_cost,
          tax_rate_id: 1, // Default tax rate
          profit_pct: 0.15 // Default profit percentage
        })),
        payment_method_id: 1,
        currency_id: 1,
        metadata: {
          notes: purchaseData.notes,
          expected_delivery_date: purchaseData.expected_delivery_date,
          created_from: 'purchase_payment_ui'
        }
      };

      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.createPurchaseEnhanced, apiData);
      });
      
      telemetry.record('purchase_payment.service.create_order', {
        duration: Date.now() - startTime,
        supplierId: purchaseData.supplier_id,
        totalAmount: result.total_amount,
        itemsProcessed: result.items_processed
      });
      
      console.log('✅ PurchasePayment: Enhanced purchase order created successfully');
      return result;
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'createPurchaseOrder'
      });
      throw error;
    }
  },

  /**
   * Obtiene lista de órdenes de compra con filtros
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async getPurchaseOrders(filters = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 PurchasePayment: Loading purchase orders...');
      
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.supplier_id) params.append('supplier_id', filters.supplier_id);
      if (filters.search) params.append('search', filters.search);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const url = `${API_ENDPOINTS.purchaseOrders}?${params}`;
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetry.record('purchase_payment.service.get_orders', {
        duration: Date.now() - startTime,
        orderCount: result.length || 0
      });
      
      console.log('✅ PurchasePayment: Purchase orders loaded');
      return result;
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getPurchaseOrders'
      });
      throw error;
    }
  },

  /**
   * Obtiene una orden de compra por ID
   * @param {number} purchaseOrderId
   * @returns {Promise<Object>}
   */
  async getPurchaseOrderById(purchaseOrderId) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 PurchasePayment: Loading purchase order ${purchaseOrderId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.purchaseOrderById(purchaseOrderId));
      });
      
      telemetry.record('purchase_payment.service.get_by_id', {
        duration: Date.now() - startTime,
        purchaseOrderId
      });
      
      console.log('✅ PurchasePayment: Purchase order loaded');
      return result;
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getPurchaseOrderById'
      });
      throw error;
    }
  },

  /**
   * Obtiene historial de pagos de una orden
   * @param {number} purchaseOrderId
   * @returns {Promise<Array>}
   */
  async getPaymentHistory(purchaseOrderId) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 PurchasePayment: Loading payment history for order ${purchaseOrderId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.paymentHistory(purchaseOrderId));
      });
      
      telemetry.record('purchase_payment.service.get_payment_history', {
        duration: Date.now() - startTime,
        purchaseOrderId,
        paymentCount: result.length || 0
      });
      
      console.log('✅ PurchasePayment: Payment history loaded');
      return result;
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getPaymentHistory'
      });
      throw error;
    }
  },

  // =================== PROCESAMIENTO DE PAGOS ===================

  /**
   * Procesa un pago para una orden de compra existente
   * @param {number} purchaseOrderId
   * @param {Object} paymentData
   * @returns {Promise<Object>}
   */
  async processPayment(purchaseOrderId, paymentData) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 PurchasePayment: Processing payment for order ${purchaseOrderId}...`);
      
      const apiData = {
        purchase_order_id: purchaseOrderId,
        amount_paid: paymentData.amount_paid,
        payment_reference: paymentData.reference_number || paymentData.check_number || null,
        payment_notes: paymentData.notes || null
      };

      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.processPayment, apiData);
      });
      
      telemetry.record('purchase_payment.service.process_payment', {
        duration: Date.now() - startTime,
        purchaseOrderId,
        amountPaid: paymentData.amount_paid,
        outstandingAmount: result.payment_details?.outstanding_amount || 0,
        paymentStatus: result.payment_details?.payment_status
      });
      
      console.log('✅ PurchasePayment: Payment processed successfully');
      return result;
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'processPayment'
      });
      throw error;
    }
  },

  /**
   * Cancela un pago específico
   * @param {number} purchaseOrderId
   * @param {number} paymentId
   * @param {Object} cancellationData
   * @returns {Promise<Object>}
   */
  async cancelPayment(purchaseOrderId, paymentId, cancellationData = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 PurchasePayment: Cancelling payment ${paymentId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.put(`/purchase/payment/${paymentId}/cancel`, {
          purchase_order_id: purchaseOrderId,
          reason: cancellationData.reason || 'Cancelled by user',
          ...cancellationData
        });
      });
      
      telemetry.record('purchase_payment.service.cancel_payment', {
        duration: Date.now() - startTime,
        purchaseOrderId,
        paymentId
      });
      
      console.log('✅ PurchasePayment: Payment cancelled successfully');
      return result;
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'cancelPayment'
      });
      throw error;
    }
  },

  /**
   * Obtiene estadísticas de pagos de compras
   * @param {Object} filters - Filtros (start_date, end_date, supplier_id)
   * @returns {Promise<PurchasePaymentStatistics>}
   */
  async getPaymentStatistics(filters = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 PurchasePayment: Loading payment statistics...');
      const params = new URLSearchParams(filters);
      const url = `${API_ENDPOINTS.paymentStatistics}?${params}`;
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetry.record('purchase_payment.service.payment_statistics', {
        duration: Date.now() - startTime
      });
      
      console.log('✅ PurchasePayment: Payment statistics loaded');
      return result;
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getPaymentStatistics'
      });
      throw error;
    }
  },

  // =================== CANCELACIONES ===================


  /**
   * Cancela completamente una orden de compra con reversión mejorada
   * @param {number} purchaseOrderId
   * @param {Object} cancellationData
   * @returns {Promise<Object>}
   */
  async cancelPurchaseOrder(purchaseOrderId, cancellationData = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 PurchasePayment: Cancelling enhanced purchase order ${purchaseOrderId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.put(API_ENDPOINTS.cancelPurchaseEnhanced(purchaseOrderId), {
          reason: cancellationData.reason || 'Cancelled by user',
          ...cancellationData
        });
      });
      
      telemetry.record('purchase_payment.service.cancel_order', {
        duration: Date.now() - startTime,
        purchaseOrderId,
        actionsPerformed: result.actions_performed?.length || 0
      });
      
      console.log('✅ PurchasePayment: Enhanced purchase order cancelled successfully');
      return result;
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'cancelPurchaseOrder'
      });
      throw error;
    }
  },

  /**
   * Obtiene preview de cancelación mejorada
   * @param {number} purchaseOrderId
   * @returns {Promise<Object>}
   */
  async getCancellationPreview(purchaseOrderId) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 PurchasePayment: Getting enhanced cancellation preview for order ${purchaseOrderId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.cancellationPreview(purchaseOrderId));
      });
      
      telemetry.record('purchase_payment.service.cancellation_preview', {
        duration: Date.now() - startTime,
        purchaseOrderId,
        canBeCancelled: result.purchase_info?.can_be_cancelled,
        estimatedComplexity: result.recommendations?.estimated_complexity
      });
      
      console.log('✅ PurchasePayment: Enhanced cancellation preview loaded');
      return result;
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getCancellationPreview'
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
      console.log('🌐 PurchasePayment: Verifying integration...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.verifyIntegration);
      });
      
      telemetry.record('purchase_payment.service.verify', {
        duration: Date.now() - startTime
      });
      
      console.log('✅ PurchasePayment: Integration verified');
      return result;
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'verifyIntegration'
      });
      throw error;
    }
  },

  // =================== UTILIDADES DE VALIDACIÓN ===================

  /**
   * Valida datos de orden de compra
   * @param {Object} data
   * @returns {Array<string>} Array de errores
   */
  validateCreatePurchaseOrderData(data) {
    const errors = [];
    
    if (!data.supplier_id || typeof data.supplier_id !== 'number') {
      errors.push('ID de proveedor es requerido');
    }
    
    if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
      errors.push('Al menos un producto es requerido');
    } else {
      data.products.forEach((product, index) => {
        if (!product.product_id) {
          errors.push(`Producto ${index + 1}: ID de producto es requerido`);
        }
        if (typeof product.quantity !== 'number' || product.quantity <= 0) {
          errors.push(`Producto ${index + 1}: Cantidad debe ser mayor a 0`);
        }
        if (typeof product.unit_cost !== 'number' || product.unit_cost <= 0) {
          errors.push(`Producto ${index + 1}: Precio unitario debe ser mayor a 0`);
        }
      });
    }
    
    return errors;
  },

  /**
   * Valida datos de pago para orden de compra existente
   * @param {Object} data
   * @returns {Array<string>} Array de errores
   */
  validatePaymentData(data) {
    const errors = [];
    
    if (typeof data.amount_paid !== 'number' || data.amount_paid <= 0) {
      errors.push('Monto a pagar debe ser mayor a 0');
    }
    
    return errors;
  }
};

export default purchasePaymentService;