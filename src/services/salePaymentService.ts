/**
 * Servicio para gestión de pagos de ventas
 * Integración con APIs de sale payment processing y cash register
 * Siguiendo patrón MVP: simple, directo, sin optimizaciones prematuras
 */

import { apiClient } from '@/services/api';
import { telemetry } from '@/utils/telemetry';
import { DEMO_SALES_RESPONSE, DEMO_SALES_PAYMENTS, IS_DEMO_MODE } from '@/config/demoSalePayments';
import { 
  ProcessPaymentRequest, 
  ProcessPaymentResponse, 
  SalePaymentStatusResponse,
  CancelSaleRequest
} from '@/types';

// Helper con retry simple (máx 2 reintentos)
const _fetchWithRetry = async (requestFn: () => Promise<any>, maxRetries = 2) => {
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
   */
  async getSalesByDateRange(filters: any = {}) {
    const startTime = Date.now();
    
    try {
      const { start_date, end_date, page = 1, page_size = 50 } = filters;
      const result = await _fetchWithRetry(async () => {
        return await apiClient.getSalesByDateRange(start_date, end_date, page, page_size);
      });
      
      telemetry.record('sale_payment.service.list_by_date', {
        duration: Date.now() - startTime,
        count: result?.data?.length || 0
      });
      
      return result;
    } catch (error: any) {
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
   */
  async getSaleById(saleId: string) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.getSaleById(saleId);
      });
      
      telemetry.record('sale_payment.service.get_by_id', {
        duration: Date.now() - startTime,
        saleId
      });
      
      return result;
    } catch (error: any) {
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
   */
  async processPayment(paymentData: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    const startTime = Date.now();

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.processSalePayment(paymentData);
      });

      telemetry.record('sale_payment.service.process_payment', {
        duration: Date.now() - startTime,
        saleId: paymentData.sales_order_id,
        amountReceived: paymentData.amount_received,
        requiresChange: result.requires_change
      });

      return result;
    } catch (error: any) {
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
   */
  async processSalePaymentWithCashRegister(paymentData: any) {
    if (IS_DEMO_MODE) {
      console.log('[DEMO MODE] Registering sale payment:', paymentData);
      return { success: true, payment_details: paymentData };
    }
    const startTime = Date.now();

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.processSalePaymentCashRegister(paymentData);
      });

      telemetry.record('sale_payment.service.cash_register_payment', {
        duration: Date.now() - startTime,
        saleId: paymentData.sales_order_id
      });

      return result;
    } catch (error: any) {
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
   */
  async getPaymentDetails(saleId: string) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.getSalePaymentDetails(saleId);
      });
      
      telemetry.record('sale_payment.service.payment_details', {
        duration: Date.now() - startTime,
        saleId
      });
      
      return result;
    } catch (error: any) {
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
   */
  async getChangeStatistics(filters = {}) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.getChangeStatistics(filters);
      });
      
      telemetry.record('sale_payment.service.change_statistics', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error: any) {
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
   */
  async getCancellationPreview(saleId: string) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.previewSaleCancellation(saleId);
      });
      
      telemetry.record('sale_payment.service.cancellation_preview', {
        duration: Date.now() - startTime,
        saleId
      });
      
      return result;
    } catch (error: any) {
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
   */
  async cancelSale(saleId: string, cancellationData: CancelSaleRequest) {
    const startTime = Date.now();

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.cancelSale(saleId, cancellationData.cancellation_reason);
      });

      telemetry.record('sale_payment.service.cancel_sale', {
        duration: Date.now() - startTime,
        saleId,
        reason: cancellationData.cancellation_reason
      });

      return result;
    } catch (error: any) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'cancelSale'
      });
      throw error;
    }
  },

  // ============ CONSULTAS DE ESTADO DE PAGO (v3.0) ============

  /**
   * Obtiene lista de ventas por rango de fechas incluyendo estado de pago
   */
  async getSalesByDateRangeWithPaymentStatus(filters: any = {}) {
    const startTime = Date.now();
    try {
      // Reutilizar lógica de saleService que ya maneja extracción y paginación
      const { saleService } = await import('./saleService');
      const result = await saleService.getSalesByDateRange(filters);

      telemetry.record('sale_payment.service.list_with_status', {
        duration: Date.now() - startTime,
        count: result?.data?.length || 0
      });

      return result;
    } catch (error: any) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSalesByDateRangeWithPaymentStatus'
      });
      throw error;
    }
  },

  /**
   * Obtiene lista de ventas por nombre de cliente incluyendo estado de pago
   */
  async getSalesByClientNameWithPaymentStatus(clientName: string, filters: any = {}) {
    const startTime = Date.now();
    try {
      const { saleService } = await import('./saleService');
      const result = await saleService.getSalesByClientName(
        clientName, 
        filters.page, 
        filters.page_size,
        {
          start_date: filters.start_date,
          end_date: filters.end_date
        }
      );

      telemetry.record('sale_payment.service.client_list_with_status', {
        duration: Date.now() - startTime,
        clientName,
        startDate: filters.start_date,
        endDate: filters.end_date
      });

      return result;
    } catch (error: any) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSalesByClientNameWithPaymentStatus'
      });
      throw error;
    }
  },

  /**
   * Obtiene el estado de pago de una venta individual con historial completo
   */
  async getSalePaymentStatus(saleId: string): Promise<SalePaymentStatusResponse> {
    if (IS_DEMO_MODE) {
      const sale = DEMO_SALES_PAYMENTS.find(s => String(s.id) === String(saleId)) || DEMO_SALES_PAYMENTS[0];
      return sale as any;
    }
    const startTime = Date.now();

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.getSalePaymentStatus(saleId);
      });

      telemetry.record('sale_payment.service.payment_status', {
        duration: Date.now() - startTime,
        saleId,
        balanceDue: result.balance_due,
        paymentProgress: result.payment_progress
      });

      return result;
    } catch (error: any) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSalePaymentStatus'
      });
      throw error;
    }
  },
};

export default salePaymentService;
