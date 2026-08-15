/**
 * Servicio para gestión de pagos de ventas
 * Integración con APIs de sale payment processing y cash register
 * Siguiendo patrón MVP: simple, directo, sin optimizaciones prematuras
 */

import { apiClient } from '@/services/api';
import { telemetry } from '@/utils/telemetry';
import { DEMO_SALES_PAYMENTS, IS_DEMO_MODE } from '@/config/demoSalePayments';
import {
  ProcessPaymentRequest,
  ProcessPaymentResponse,
  SalePaymentStatusResponse,
  CancelSaleRequest,
  POSCheckoutRequest,
  POSCheckoutResponse,
} from '@/types';

/**
 * Payload de confirmación de cobro de una venta existente
 * (PUT /sale/{id}/confirm-payment). Lo arma SalePayment.jsx con
 * `payment_methods` + `caja_id`; el backend hoy solo persiste
 * `payment_reference`/`payment_notes` (contrato en definición por un
 * agente backend en paralelo — el wrapper no lo reinterpreta).
 */
export interface ConfirmSalePaymentPayload {
  payment_methods?: Array<{ method?: string; amount?: number }>;
  caja_id?: number;
  payment_reference?: string | null;
  payment_notes?: string | null;
}

/**
 * Respuesta de PUT /sale/{id}/confirm-payment. El backend actual responde
 * HTTP 200 `{message: "Pago confirmado"}` y los errores llegan como HTTP
 * 5xx. `success === false` se contempla por si el contrato final agrega la
 * bandera (mismo patrón que pos-checkout: fallo sin error HTTP).
 */
export interface ConfirmSalePaymentResponse {
  success?: boolean;
  message?: string;
  error?: string;
  code?: string;
}

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

    // Normalizar datos para asegurar tipos numéricos en el backend (Go)
    const normalizedData = {
      ...paymentData,
      amount_received: paymentData.amount_received ? Number(paymentData.amount_received) : 0,
      payment_method_id: paymentData.payment_method_id ? Number(paymentData.payment_method_id) : (paymentData.paymentMethodId ? Number(paymentData.paymentMethodId) : 0),
      cash_register_id: paymentData.cash_register_id && String(paymentData.cash_register_id).trim() !== '' ? Number(paymentData.cash_register_id) : null,
    };

    if (normalizedData.cash_register_id === null || isNaN(normalizedData.cash_register_id) || normalizedData.cash_register_id <= 0) {
      delete normalizedData.cash_register_id;
    }

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.processSalePaymentCashRegister(normalizedData);
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
   * Confirma el cobro de una venta existente (PUT /sale/{id}/confirm-payment).
   *
   * Wrapper delgado sobre apiClient.confirmPayment: el payload viaja tal cual
   * lo arma la página de Cobros de ventas (payment_methods + caja_id). El
   * backend hoy solo persiste payment_reference/notes; el resto del contrato
   * lo define un agente backend en paralelo, por lo que este método no
   * reinterpreta el payload.
   *
   * Devuelve la respuesta del backend tal cual (HTTP 200 → {message}; los
   * errores se propagan como excepción, igual que el resto del servicio).
   */
  async confirmSalePayment(
    saleOrderId: string | number,
    payload: ConfirmSalePaymentPayload,
  ): Promise<ConfirmSalePaymentResponse> {
    const startTime = Date.now();

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.confirmPayment(saleOrderId, payload);
      });

      telemetry.record('sale_payment.service.confirm_payment', {
        duration: Date.now() - startTime,
        saleId: saleOrderId,
      });

      return result;
    } catch (error: any) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'confirmSalePayment',
      });
      throw error;
    }
  },

  /**
   * Checkout POS atómico: crea la venta y procesa su pago en una sola
   * transacción (POST /sale/pos-checkout). Si el pago falla, la venta se
   * revierte completa (stock restaurado, sin venta fantasma). Requiere una
   * caja abierta (409 Conflict en caso contrario).
   *
   * Reemplaza la secuencia de dos llamadas (createSale + processSalePayment
   * WithCashRegister) en el flujo de mostrador/POS. Los flujos de venta a
   * crédito o asíncronos siguen usando createSale por separado.
   */
  async posCheckout(request: POSCheckoutRequest): Promise<POSCheckoutResponse> {
    if (IS_DEMO_MODE) {
      console.log('[DEMO MODE] POS checkout:', request);
      return {
        success: true,
        sale: {
          success: true,
          sale_id: `DEMO-${Date.now()}`,
          total_amount: Number(request.payment?.amount_received) || 0,
          items_processed: request.sale?.product_details?.length || 0,
          message: 'Demo checkout',
        } as any,
      };
    }
    const startTime = Date.now();

    // Normalizar tipos numéricos para el backend (Go).
    const normalized: POSCheckoutRequest = {
      sale: request.sale,
      payment: {
        ...request.payment,
        amount_received: Number(request.payment.amount_received) || 0,
        payment_method_id: Number(request.payment.payment_method_id) || 0,
      },
    };

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.posCheckout(normalized);
      });

      telemetry.record('sale_payment.service.pos_checkout', {
        duration: Date.now() - startTime,
        saleId: result?.sale?.sale_id,
        amountReceived: normalized.payment.amount_received,
      });

      return result;
    } catch (error: any) {
      telemetry.record('sale_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'posCheckout'
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
      const { start_date, end_date, page = 1, page_size = 50, ...rest } = filters;
      const today = new Date().toISOString().split('T')[0];
      const result = await apiClient.getSalesWithPaymentStatusByDateRange(
        start_date || today,
        end_date || today,
        page,
        page_size,
        { params: rest }
      );

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
      const { page = 1, page_size = 50, ...rest } = filters;
      const result = await apiClient.getSalesWithPaymentStatusByClientName(
        clientName,
        page,
        page_size,
        { params: rest }
      );

      telemetry.record('sale_payment.service.list_by_client_with_status', {
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
