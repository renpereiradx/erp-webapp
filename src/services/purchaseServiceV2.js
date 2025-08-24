/**
 * Purchase Service V2 - API Integration Completa
 * Wave 1: Arquitectura Base Sólida
 * Alineado con PURCHASE_API.md - Production Ready Endpoints
 * Implementa todos los endpoints documentados con validación exhaustiva
 */

import api from '@/services/api';
import { telemetry } from '@/utils/telemetry';

/**
 * @typedef {Object} PurchaseEnhancedRequest
 * @property {number} supplier_id
 * @property {string} status
 * @property {Array<Object>} product_details
 * @property {number} payment_method_id
 * @property {number} currency_id
 * @property {Object} metadata
 *
 * @typedef {Object} PaymentProcessRequest
 * @property {number} purchase_order_id
 * @property {number} amount_paid
 * @property {string} payment_reference
 * @property {string} payment_notes
 */

class PurchaseServiceV2 {
  constructor() {
    this.baseUrl = '/purchase';
  }

  /**
   * 1. Crear Orden de Compra Mejorada
   * POST /purchase/enhanced
   */
  async createEnhancedPurchase(purchaseData) {
    try {
      telemetry.increment('purchase.api.create_enhanced_start');
      
      // Validar estructura de datos
      this._validateEnhancedPurchaseData(purchaseData);
      
      const response = await api.post(`${this.baseUrl}/enhanced`, purchaseData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        telemetry.increment('purchase.api.create_enhanced_success');
        telemetry.timing('purchase.api.create_enhanced_duration', Date.now());
        
        return {
          success: true,
          purchase_order_id: response.data.purchase_order_id,
          total_amount: response.data.total_amount,
          items_processed: response.data.items_processed,
          message: response.data.message || 'Purchase order created successfully'
        };
      } else {
        throw new Error(response.data?.message || 'Invalid response format');
      }
      
    } catch (error) {
      telemetry.increment('purchase.api.create_enhanced_error', {
        error_code: error.response?.data?.error_code || 'UNKNOWN',
        status_code: error.response?.status || 0
      });
      
      return this._handleApiError(error, 'createEnhancedPurchase');
    }
  }
  
  /**
   * 2. Procesar Pago de Compra
   * POST /purchase/payment/process
   */
  async processPayment(paymentData) {
    try {
      telemetry.increment('purchase.api.process_payment_start');
      
      // Validar datos de pago
      this._validatePaymentData(paymentData);
      
      const response = await api.post(`${this.baseUrl}/payment/process`, paymentData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        telemetry.increment('purchase.api.process_payment_success');
        telemetry.timing('purchase.api.process_payment_duration', Date.now());
        
        return {
          success: true,
          payment_id: response.data.payment_id,
          purchase_order_id: response.data.purchase_order_id,
          payment_details: response.data.payment_details,
          message: response.data.message,
          processed_at: response.data.processed_at,
          processed_by: response.data.processed_by
        };
      } else {
        throw new Error(response.data?.message || 'Payment processing failed');
      }
      
    } catch (error) {
      telemetry.increment('purchase.api.process_payment_error', {
        error_code: error.response?.data?.error_code || 'UNKNOWN',
        status_code: error.response?.status || 0
      });
      
      return this._handleApiError(error, 'processPayment');
    }
  }
  
  /**
   * 3. Preview de Cancelación de Compra
   * GET /purchase/{id}/preview-cancellation
   */
  async previewCancellation(purchaseId) {
    try {
      telemetry.increment('purchase.api.preview_cancellation_start');
      
      if (!purchaseId) {
        throw new Error('Purchase ID is required');
      }
      
      const response = await api.get(`${this.baseUrl}/${purchaseId}/preview-cancellation`);
      
      if (response.data && response.data.success) {
        telemetry.increment('purchase.api.preview_cancellation_success');
        
        return {
          success: true,
          purchase_info: response.data.purchase_info,
          impact_analysis: response.data.impact_analysis,
          recommendations: response.data.recommendations,
          generated_at: response.data.generated_at
        };
      } else {
        throw new Error(response.data?.error || 'Preview cancellation failed');
      }
      
    } catch (error) {
      telemetry.increment('purchase.api.preview_cancellation_error', {
        error_code: error.response?.data?.error_code || 'UNKNOWN',
        status_code: error.response?.status || 0
      });
      
      return this._handleApiError(error, 'previewCancellation');
    }
  }
  
  /**
   * 4. Cancelación Mejorada de Compra
   * PUT /purchase/cancel-enhanced/{id}
   */
  async cancelEnhanced(purchaseId, reason = '') {
    try {
      telemetry.increment('purchase.api.cancel_enhanced_start');
      
      if (!purchaseId) {
        throw new Error('Purchase ID is required');
      }
      
      const requestBody = reason ? { cancellation_reason: reason } : {};
      
      const response = await api.put(`${this.baseUrl}/cancel-enhanced/${purchaseId}`, requestBody);
      
      if (response.data && response.data.success) {
        telemetry.increment('purchase.api.cancel_enhanced_success');
        
        return {
          success: true,
          message: response.data.message,
          purchase_id: response.data.purchase_id,
          cancelled_at: response.data.cancelled_at,
          actions_performed: response.data.actions_performed
        };
      } else {
        throw new Error(response.data?.message || 'Enhanced cancellation failed');
      }
      
    } catch (error) {
      telemetry.increment('purchase.api.cancel_enhanced_error', {
        error_code: error.response?.data?.error_code || 'UNKNOWN',
        status_code: error.response?.status || 0
      });
      
      return this._handleApiError(error, 'cancelEnhanced');
    }
  }
  
  /**
   * 5. Estadísticas de Pagos de Compras
   * GET /purchase/payment/statistics
   */
  async getPaymentStatistics(params = {}) {
    try {
      telemetry.increment('purchase.api.payment_statistics_start');
      
      const queryParams = new URLSearchParams();
      
      // Agregar parámetros opcionales
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.supplier_id) queryParams.append('supplier_id', params.supplier_id);
      
      const url = `${this.baseUrl}/payment/statistics${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
      
      if (response.data) {
        telemetry.increment('purchase.api.payment_statistics_success');
        
        return {
          success: true,
          period: response.data.period,
          order_statistics: response.data.order_statistics,
          financial_summary: response.data.financial_summary,
          generated_at: response.data.generated_at
        };
      } else {
        throw new Error('Invalid statistics response');
      }
      
    } catch (error) {
      telemetry.increment('purchase.api.payment_statistics_error', {
        error_code: error.response?.data?.error_code || 'UNKNOWN',
        status_code: error.response?.status || 0
      });
      
      return this._handleApiError(error, 'getPaymentStatistics');
    }
  }
  
  // ==================== MÉTODOS DE COMPATIBILIDAD CON V1 ====================
  
  /**
   * Obtener orden de compra por ID (compatibilidad V1)
   */
  async getPurchaseById(id) {
    try {
      telemetry.increment('purchase.api.get_by_id_start');
      
      // Por ahora usar el endpoint legacy, luego migrar a V2
      const response = await api.get(`/purchase/${id}`);
      
      if (response.data && response.data.success) {
        telemetry.increment('purchase.api.get_by_id_success');
        
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data?.error || 'Purchase not found');
      }
      
    } catch (error) {
      telemetry.increment('purchase.api.get_by_id_error');
      return this._handleApiError(error, 'getPurchaseById');
    }
  }
  
  /**
   * Obtener órdenes paginadas (compatibilidad V1)
   */
  async getPurchasesPaginated(page = 1, pageSize = 20, filters = {}) {
    try {
      telemetry.increment('purchase.api.get_paginated_start');
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      
      // Agregar filtros si existen
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/purchase/paginated?${queryParams.toString()}`);
      
      if (response.data && response.data.success) {
        telemetry.increment('purchase.api.get_paginated_success');
        
        return {
          success: true,
          data: {
            purchases: response.data.data || [],
            pagination: response.data.pagination || {
              current_page: page,
              per_page: pageSize,
              total: 0,
              total_pages: 0
            }
          }
        };
      } else {
        throw new Error(response.data?.error || 'Failed to load purchases');
      }
      
    } catch (error) {
      telemetry.increment('purchase.api.get_paginated_error');
      return this._handleApiError(error, 'getPurchasesPaginated');
    }
  }
  
  // ==================== MÉTODOS DE VALIDACIÓN ====================
  
  /**
   * Validar datos de orden de compra mejorada
   */
  _validateEnhancedPurchaseData(data) {
    if (!data) {
      throw new Error('Purchase data is required');
    }
    
    if (!data.supplier_id || typeof data.supplier_id !== 'number') {
      throw new Error('Valid supplier_id is required');
    }
    
    if (!Array.isArray(data.product_details) || data.product_details.length === 0) {
      throw new Error('At least one product is required');
    }
    
    // Validar cada producto
    data.product_details.forEach((product, index) => {
      if (!product.product_id) {
        throw new Error(`Product ID is required for item ${index + 1}`);
      }
      
      if (!product.quantity || product.quantity <= 0) {
        throw new Error(`Valid quantity is required for item ${index + 1}`);
      }
      
      if (!product.unit_price || product.unit_price <= 0) {
        throw new Error(`Valid unit price is required for item ${index + 1}`);
      }
    });
  }
  
  /**
   * Validar datos de pago
   */
  _validatePaymentData(data) {
    if (!data) {
      throw new Error('Payment data is required');
    }
    
    if (!data.purchase_order_id || typeof data.purchase_order_id !== 'number') {
      throw new Error('Valid purchase_order_id is required');
    }
    
    if (!data.amount_paid || data.amount_paid <= 0) {
      throw new Error('Valid amount_paid is required');
    }
    
    if (!data.payment_reference || data.payment_reference.trim() === '') {
      throw new Error('Payment reference is required');
    }
  }
  
  /**
   * Manejo unificado de errores de API
   */
  _handleApiError(error, context) {
    // Error de red o timeout
    if (!error.response) {
      return {
        success: false,
        error: 'Network error or timeout occurred',
        error_code: 'NETWORK_ERROR',
        context
      };
    }
    
    // Error HTTP con respuesta del servidor
    const { status, data } = error.response;
    
    // Mapear códigos de estado a mensajes amigables
    const statusMessages = {
      400: 'Invalid request data',
      401: 'Authentication required',
      403: 'Access denied',
      404: 'Resource not found',
      409: 'Conflict with current state',
      422: 'Validation failed',
      500: 'Internal server error',
      502: 'Service temporarily unavailable',
      503: 'Service unavailable'
    };
    
    return {
      success: false,
      error: data?.message || statusMessages[status] || 'Unknown error occurred',
      error_code: data?.error_code || `HTTP_${status}`,
      details: data?.details || null,
      context,
      status_code: status
    };
  }
}

// Exportar instancia singleton
const purchaseServiceV2 = new PurchaseServiceV2();
export default purchaseServiceV2;
