/**
 * Sales Payment Adapter - Enterprise Grade
 * Adapter específico para procesamiento de pagos de ventas
 * 
 * Features:
 * - Customer-focused payment processing
 * - Sales receipt generation
 * - Customer payment history
 * - Sales tax calculations
 * - Integration with sales workflow
 * 
 * Patrón: Adapter para el Unified Payment Orchestrator
 * Enfoque: Hardened Implementation
 */

import { unifiedPaymentService } from './unifiedPaymentService';
import { TRANSACTION_CONTEXTS, PAYMENT_TYPES } from './paymentArchitecture';
import { telemetry } from '@/utils/telemetry';

/**
 * @typedef {Object} SalesPaymentRequest
 * @property {string} saleId - ID de la venta
 * @property {number} amount - Monto total de la venta
 * @property {string} paymentType - Tipo de pago
 * @property {number} [amountReceived] - Monto recibido (para efectivo)
 * @property {string} [customerId] - ID del cliente
 * @property {string} [currency='MXN'] - Moneda
 * @property {Object} [salesTax] - Información de impuestos de la venta
 * @property {boolean} [generateReceipt=true] - Generar recibo automáticamente
 */

/**
 * @typedef {Object} SalesPaymentResponse
 * @property {boolean} success
 * @property {string} message
 * @property {string} paymentId
 * @property {string} saleId
 * @property {number} amount
 * @property {number} [change] - Cambio calculado
 * @property {string} status
 * @property {string} processedAt
 * @property {Object} [receipt] - Datos del recibo generado
 * @property {Object} [customer] - Información del cliente
 */

export const salesPaymentAdapter = {
  /**
   * Procesar pago de venta con funcionalidades específicas para clientes
   * @param {SalesPaymentRequest} salesPaymentData
   * @returns {Promise<SalesPaymentResponse>}
   */
  async processSalesPayment(salesPaymentData) {
    const {
      saleId,
      amount,
      paymentType,
      amountReceived,
      customerId,
      currency = 'MXN',
      salesTax,
      generateReceipt = true
    } = salesPaymentData;

    telemetry.record('sales_payments.process.start', {
      saleId,
      amount,
      paymentType,
      hasCustomer: !!customerId,
      hasTax: !!salesTax
    });

    // Preparar metadata específica para ventas
    const salesMetadata = {
      customerId,
      salesTax,
      generateReceipt,
      transactionType: 'sale',
      // Información adicional para el recibo
      receiptData: {
        customerInfo: customerId ? await this._getCustomerInfo(customerId) : null,
        taxBreakdown: salesTax || {},
        paymentMethod: paymentType
      }
    };

    // Usar el servicio unificado con contexto de ventas
    const unifiedRequest = {
      context: TRANSACTION_CONTEXTS.SALE,
      transactionId: saleId,
      amount,
      paymentType,
      amountReceived,
      currency,
      metadata: salesMetadata
    };

    try {
      const paymentResult = await unifiedPaymentService.processPayment(unifiedRequest);
      
      // Procesar resultado específico para ventas
      const salesResult = {
        ...paymentResult,
        saleId,
        receipt: generateReceipt ? await this._generateSalesReceipt(paymentResult, salesMetadata) : null,
        customer: salesMetadata.receiptData.customerInfo
      };

      telemetry.record('sales_payments.process.success', {
        saleId,
        paymentId: paymentResult.paymentId,
        amount,
        change: paymentResult.change || 0,
        receiptGenerated: !!salesResult.receipt
      });

      return salesResult;
    } catch (error) {
      telemetry.record('sales_payments.process.error', {
        saleId,
        error: error.message,
        code: error.code
      });
      throw error;
    }
  },

  /**
   * Obtener historial de pagos de ventas de un cliente
   * @param {string} customerId - ID del cliente
   * @param {Object} [params] - Parámetros adicionales
   * @returns {Promise<Object>}
   */
  async getCustomerPaymentHistory(customerId, params = {}) {
    telemetry.record('sales_payments.get_customer_history.start', { customerId });

    const historyParams = {
      ...params,
      context: TRANSACTION_CONTEXTS.SALE,
      customerId
    };

    return unifiedPaymentService.getPaymentHistory(historyParams);
  },

  /**
   * Obtener estadísticas de pagos de ventas
   * @param {Object} [params] - Parámetros del reporte
   * @returns {Promise<Object>}
   */
  async getSalesPaymentStatistics(params = {}) {
    const salesParams = {
      ...params,
      context: TRANSACTION_CONTEXTS.SALE
    };

    const stats = await unifiedPaymentService.getPaymentStatistics(salesParams);
    
    // Enriquecer con estadísticas específicas de ventas
    return {
      ...stats,
      salesSpecific: {
        averageTicket: stats.totalAmount / (stats.totalTransactions || 1),
        cashVsCard: await this._getCashVsCardRatio(params),
        changeFrequency: await this._getChangeFrequency(params)
      }
    };
  },

  /**
   * Procesar múltiples pagos para una venta (pago mixto)
   * @param {string} saleId - ID de la venta
   * @param {Array} payments - Array de pagos
   * @returns {Promise<Array>}
   */
  async processMultiplePayments(saleId, payments) {
    telemetry.record('sales_payments.process_multiple.start', {
      saleId,
      paymentCount: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0)
    });

    const results = [];
    let totalPaid = 0;

    for (const payment of payments) {
      try {
        const result = await this.processSalesPayment({
          saleId,
          ...payment
        });
        
        results.push(result);
        totalPaid += payment.amount;
        
        telemetry.record('sales_payments.multi_payment.step_success', {
          saleId,
          stepNumber: results.length,
          amount: payment.amount,
          totalPaid
        });
      } catch (error) {
        telemetry.record('sales_payments.multi_payment.step_error', {
          saleId,
          stepNumber: results.length + 1,
          error: error.message
        });
        
        // En caso de error en pago múltiple, retornar los exitosos
        return {
          success: false,
          partialSuccess: true,
          successfulPayments: results,
          failedPayment: payment,
          error: error.message,
          totalPaid
        };
      }
    }

    return {
      success: true,
      payments: results,
      totalPaid,
      transactionCount: results.length
    };
  },

  /**
   * Validar pago de venta específico
   * @param {SalesPaymentRequest} paymentData
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validateSalesPayment(paymentData) {
    const baseValidation = unifiedPaymentService.validatePaymentData({
      context: TRANSACTION_CONTEXTS.SALE,
      transactionId: paymentData.saleId,
      amount: paymentData.amount,
      paymentType: paymentData.paymentType,
      amountReceived: paymentData.amountReceived
    });

    const errors = [...baseValidation.errors];

    // Validaciones específicas para ventas
    if (paymentData.customerId && typeof paymentData.customerId !== 'string') {
      errors.push('ID de cliente inválido');
    }

    if (paymentData.salesTax && typeof paymentData.salesTax !== 'object') {
      errors.push('Información de impuestos inválida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Helpers privados
   */
  
  async _getCustomerInfo(customerId) {
    try {
      // TODO: Integrar con customerService cuando esté disponible
      return {
        id: customerId,
        name: 'Cliente',
        email: null,
        phone: null
      };
    } catch (error) {
      telemetry.record('sales_payments.get_customer_info.error', {
        customerId,
        error: error.message
      });
      return null;
    }
  },

  async _generateSalesReceipt(paymentResult, metadata) {
    try {
      const receiptData = {
        paymentId: paymentResult.paymentId,
        saleId: paymentResult.transactionId,
        amount: paymentResult.amount,
        change: paymentResult.change || 0,
        paymentMethod: metadata.receiptData.paymentMethod,
        customer: metadata.receiptData.customerInfo,
        tax: metadata.receiptData.taxBreakdown,
        timestamp: paymentResult.processedAt,
        receiptNumber: `R-${Date.now()}`
      };

      telemetry.record('sales_payments.receipt.generated', {
        receiptNumber: receiptData.receiptNumber,
        saleId: paymentResult.transactionId
      });

      return receiptData;
    } catch (error) {
      telemetry.record('sales_payments.receipt.error', {
        error: error.message,
        saleId: paymentResult.transactionId
      });
      return null;
    }
  },

  async _getCashVsCardRatio(params) {
    try {
      const cashStats = await unifiedPaymentService.getPaymentStatistics({
        ...params,
        context: TRANSACTION_CONTEXTS.SALE,
        paymentType: PAYMENT_TYPES.CASH
      });
      
      const cardStats = await unifiedPaymentService.getPaymentStatistics({
        ...params,
        context: TRANSACTION_CONTEXTS.SALE,
        paymentType: PAYMENT_TYPES.CARD
      });

      return {
        cash: cashStats.totalAmount || 0,
        card: cardStats.totalAmount || 0,
        ratio: (cashStats.totalAmount || 0) / ((cardStats.totalAmount || 0) + (cashStats.totalAmount || 0))
      };
    } catch (error) {
      return { cash: 0, card: 0, ratio: 0 };
    }
  },

  async _getChangeFrequency(params) {
    try {
      const changeStats = await unifiedPaymentService.getChangeStatistics({
        ...params,
        context: TRANSACTION_CONTEXTS.SALE
      });
      
      return {
        frequency: changeStats.changeFrequency || 0,
        averageChange: changeStats.averageChange || 0,
        maxChange: changeStats.maxChange || 0
      };
    } catch (error) {
      return { frequency: 0, averageChange: 0, maxChange: 0 };
    }
  }
};

export default salesPaymentAdapter;
