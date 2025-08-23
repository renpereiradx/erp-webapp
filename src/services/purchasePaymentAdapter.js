/**
 * Purchase Payment Adapter - Enterprise Grade
 * Adapter específico para procesamiento de pagos de compras
 * 
 * Features:
 * - Supplier-focused payment processing
 * - Purchase invoice tracking
 * - Supplier payment history
 * - Payment terms management
 * - Integration with purchase workflow
 * 
 * Patrón: Adapter para el Unified Payment Orchestrator
 * Enfoque: Hardened Implementation
 */

import { unifiedPaymentService } from './unifiedPaymentService';
import { TRANSACTION_CONTEXTS, PAYMENT_TYPES } from './paymentArchitecture';
import { telemetry } from '@/utils/telemetry';

/**
 * @typedef {Object} PurchasePaymentRequest
 * @property {string} purchaseId - ID de la compra
 * @property {number} amount - Monto total de la compra
 * @property {string} paymentType - Tipo de pago
 * @property {string} [supplierId] - ID del proveedor
 * @property {string} [currency='MXN'] - Moneda
 * @property {Object} [paymentTerms] - Términos de pago
 * @property {string} [invoiceNumber] - Número de factura
 * @property {Date} [dueDate] - Fecha de vencimiento
 * @property {boolean} [generateInvoice=true] - Generar registro de factura
 */

/**
 * @typedef {Object} PurchasePaymentResponse
 * @property {boolean} success
 * @property {string} message
 * @property {string} paymentId
 * @property {string} purchaseId
 * @property {number} amount
 * @property {string} status
 * @property {string} processedAt
 * @property {Object} [invoice] - Datos de la factura generada
 * @property {Object} [supplier] - Información del proveedor
 * @property {Object} [paymentTerms] - Términos de pago aplicados
 */

export const purchasePaymentAdapter = {
  /**
   * Procesar pago de compra con funcionalidades específicas para proveedores
   * @param {PurchasePaymentRequest} purchasePaymentData
   * @returns {Promise<PurchasePaymentResponse>}
   */
  async processPurchasePayment(purchasePaymentData) {
    const {
      purchaseId,
      amount,
      paymentType,
      supplierId,
      currency = 'MXN',
      paymentTerms,
      invoiceNumber,
      dueDate,
      generateInvoice = true
    } = purchasePaymentData;

    telemetry.record('purchase_payments.process.start', {
      purchaseId,
      amount,
      paymentType,
      hasSupplier: !!supplierId,
      hasTerms: !!paymentTerms,
      hasInvoice: !!invoiceNumber
    });

    // Preparar metadata específica para compras
    const purchaseMetadata = {
      supplierId,
      paymentTerms,
      invoiceNumber,
      dueDate,
      generateInvoice,
      transactionType: 'purchase',
      // Información adicional para la factura
      invoiceData: {
        supplierInfo: supplierId ? await this._getSupplierInfo(supplierId) : null,
        paymentTerms: paymentTerms || {},
        invoiceNumber: invoiceNumber || this._generateInvoiceNumber(),
        dueDate: dueDate || this._calculateDueDate(paymentTerms)
      }
    };

    // Usar el servicio unificado con contexto de compras
    const unifiedRequest = {
      context: TRANSACTION_CONTEXTS.PURCHASE,
      transactionId: purchaseId,
      amount,
      paymentType,
      currency,
      metadata: purchaseMetadata
    };

    try {
      const paymentResult = await unifiedPaymentService.processPayment(unifiedRequest);
      
      // Procesar resultado específico para compras
      const purchaseResult = {
        ...paymentResult,
        purchaseId,
        invoice: generateInvoice ? await this._generatePurchaseInvoice(paymentResult, purchaseMetadata) : null,
        supplier: purchaseMetadata.invoiceData.supplierInfo,
        paymentTerms: purchaseMetadata.invoiceData.paymentTerms
      };

      telemetry.record('purchase_payments.process.success', {
        purchaseId,
        paymentId: paymentResult.paymentId,
        amount,
        supplierId,
        invoiceGenerated: !!purchaseResult.invoice
      });

      return purchaseResult;
    } catch (error) {
      telemetry.record('purchase_payments.process.error', {
        purchaseId,
        error: error.message,
        code: error.code
      });
      throw error;
    }
  },

  /**
   * Obtener historial de pagos a un proveedor
   * @param {string} supplierId - ID del proveedor
   * @param {Object} [params] - Parámetros adicionales
   * @returns {Promise<Object>}
   */
  async getSupplierPaymentHistory(supplierId, params = {}) {
    telemetry.record('purchase_payments.get_supplier_history.start', { supplierId });

    const historyParams = {
      ...params,
      context: TRANSACTION_CONTEXTS.PURCHASE,
      supplierId
    };

    return unifiedPaymentService.getPaymentHistory(historyParams);
  },

  /**
   * Obtener estadísticas de pagos de compras
   * @param {Object} [params] - Parámetros del reporte
   * @returns {Promise<Object>}
   */
  async getPurchasePaymentStatistics(params = {}) {
    const purchaseParams = {
      ...params,
      context: TRANSACTION_CONTEXTS.PURCHASE
    };

    const stats = await unifiedPaymentService.getPaymentStatistics(purchaseParams);
    
    // Enriquecer con estadísticas específicas de compras
    return {
      ...stats,
      purchaseSpecific: {
        averagePurchaseAmount: stats.totalAmount / (stats.totalTransactions || 1),
        paymentMethodDistribution: await this._getPaymentMethodDistribution(params),
        supplierAnalysis: await this._getSupplierPaymentAnalysis(params)
      }
    };
  },

  /**
   * Procesar pago parcial de compra
   * @param {string} purchaseId - ID de la compra
   * @param {number} partialAmount - Monto parcial a pagar
   * @param {string} paymentType - Tipo de pago
   * @param {Object} [options] - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async processPartialPayment(purchaseId, partialAmount, paymentType, options = {}) {
    telemetry.record('purchase_payments.process_partial.start', {
      purchaseId,
      partialAmount,
      paymentType
    });

    // Obtener información de la compra para validar el pago parcial
    const purchaseInfo = await this._getPurchaseInfo(purchaseId);
    const remainingAmount = purchaseInfo.totalAmount - (purchaseInfo.paidAmount || 0);

    if (partialAmount > remainingAmount) {
      throw new Error(`El monto parcial (${partialAmount}) excede el saldo pendiente (${remainingAmount})`);
    }

    const paymentData = {
      purchaseId,
      amount: partialAmount,
      paymentType,
      ...options,
      isPartialPayment: true,
      remainingBalance: remainingAmount - partialAmount
    };

    const result = await this.processPurchasePayment(paymentData);

    telemetry.record('purchase_payments.process_partial.success', {
      purchaseId,
      partialAmount,
      remainingBalance: paymentData.remainingBalance
    });

    return {
      ...result,
      isPartialPayment: true,
      remainingBalance: paymentData.remainingBalance,
      paymentProgress: {
        totalAmount: purchaseInfo.totalAmount,
        paidAmount: (purchaseInfo.paidAmount || 0) + partialAmount,
        remainingAmount: paymentData.remainingBalance,
        percentagePaid: Math.round(((purchaseInfo.paidAmount || 0) + partialAmount) / purchaseInfo.totalAmount * 100)
      }
    };
  },

  /**
   * Obtener pagos pendientes por vencer
   * @param {Object} [params] - Parámetros de consulta
   * @param {number} [params.daysAhead=30] - Días hacia adelante para buscar
   * @param {string} [params.supplierId] - Filtrar por proveedor
   * @returns {Promise<Object>}
   */
  async getUpcomingPayments(params = {}) {
    const { daysAhead = 30, supplierId } = params;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    telemetry.record('purchase_payments.get_upcoming.start', {
      daysAhead,
      supplierId
    });

    // TODO: Implementar endpoint específico para pagos próximos a vencer
    const queryParams = new URLSearchParams({
      context: TRANSACTION_CONTEXTS.PURCHASE,
      status: 'pending',
      due_date_before: futureDate.toISOString().split('T')[0]
    });

    if (supplierId) queryParams.append('supplier_id', supplierId);

    return unifiedPaymentService.getPaymentHistory({ 
      context: TRANSACTION_CONTEXTS.PURCHASE,
      status: 'pending',
      dueDateBefore: futureDate.toISOString()
    });
  },

  /**
   * Validar pago de compra específico
   * @param {PurchasePaymentRequest} paymentData
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validatePurchasePayment(paymentData) {
    const baseValidation = unifiedPaymentService.validatePaymentData({
      context: TRANSACTION_CONTEXTS.PURCHASE,
      transactionId: paymentData.purchaseId,
      amount: paymentData.amount,
      paymentType: paymentData.paymentType
    });

    const errors = [...baseValidation.errors];

    // Validaciones específicas para compras
    if (paymentData.supplierId && typeof paymentData.supplierId !== 'string') {
      errors.push('ID de proveedor inválido');
    }

    if (paymentData.dueDate && !(paymentData.dueDate instanceof Date)) {
      errors.push('Fecha de vencimiento inválida');
    }

    if (paymentData.paymentTerms && typeof paymentData.paymentTerms !== 'object') {
      errors.push('Términos de pago inválidos');
    }

    // Los pagos de compra normalmente no requieren cambio
    if (paymentData.paymentType === PAYMENT_TYPES.CASH && paymentData.amountReceived) {
      errors.push('Los pagos de compra en efectivo no requieren cálculo de cambio');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Helpers privados
   */
  
  async _getSupplierInfo(supplierId) {
    try {
      // TODO: Integrar con supplierService
      return {
        id: supplierId,
        name: 'Proveedor',
        email: null,
        phone: null,
        paymentTerms: 'NET30'
      };
    } catch (error) {
      telemetry.record('purchase_payments.get_supplier_info.error', {
        supplierId,
        error: error.message
      });
      return null;
    }
  },

  async _getPurchaseInfo(purchaseId) {
    try {
      // TODO: Integrar con purchaseService para obtener información completa
      return {
        id: purchaseId,
        totalAmount: 1000, // Placeholder
        paidAmount: 0,
        status: 'pending'
      };
    } catch (error) {
      telemetry.record('purchase_payments.get_purchase_info.error', {
        purchaseId,
        error: error.message
      });
      throw error;
    }
  },

  _generateInvoiceNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${timestamp}-${random}`;
  },

  _calculateDueDate(paymentTerms) {
    if (!paymentTerms || !paymentTerms.daysNet) {
      return null;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTerms.daysNet);
    return dueDate;
  },

  async _generatePurchaseInvoice(paymentResult, metadata) {
    try {
      const invoiceData = {
        paymentId: paymentResult.paymentId,
        purchaseId: paymentResult.transactionId,
        amount: paymentResult.amount,
        paymentMethod: metadata.transactionType,
        supplier: metadata.invoiceData.supplierInfo,
        invoiceNumber: metadata.invoiceData.invoiceNumber,
        dueDate: metadata.invoiceData.dueDate,
        paymentTerms: metadata.invoiceData.paymentTerms,
        timestamp: paymentResult.processedAt
      };

      telemetry.record('purchase_payments.invoice.generated', {
        invoiceNumber: invoiceData.invoiceNumber,
        purchaseId: paymentResult.transactionId
      });

      return invoiceData;
    } catch (error) {
      telemetry.record('purchase_payments.invoice.error', {
        error: error.message,
        purchaseId: paymentResult.transactionId
      });
      return null;
    }
  },

  async _getPaymentMethodDistribution(params) {
    try {
      const stats = await Promise.all(
        Object.values(PAYMENT_TYPES).map(async (type) => {
          const typeStats = await unifiedPaymentService.getPaymentStatistics({
            ...params,
            context: TRANSACTION_CONTEXTS.PURCHASE,
            paymentType: type
          });
          return {
            type,
            amount: typeStats.totalAmount || 0,
            count: typeStats.totalTransactions || 0
          };
        })
      );

      return stats.reduce((acc, stat) => {
        acc[stat.type] = {
          amount: stat.amount,
          count: stat.count
        };
        return acc;
      }, {});
    } catch (error) {
      return {};
    }
  },

  async _getSupplierPaymentAnalysis(params) {
    try {
      // TODO: Implementar análisis detallado por proveedor
      return {
        topSuppliers: [],
        averagePaymentTime: 0,
        onTimePaymentRate: 0
      };
    } catch (error) {
      return {
        topSuppliers: [],
        averagePaymentTime: 0,
        onTimePaymentRate: 0
      };
    }
  }
};

export default purchasePaymentAdapter;
