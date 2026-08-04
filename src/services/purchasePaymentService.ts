/**
 * Servicio para gestión de pagos de compras integrado
 * Sistema completo de órdenes de compra, pagos y cancelaciones
 * Basado en PURCHASE_API.md - Sistema integrado ERP
 */

import { apiClient } from '@/services/api'
import { telemetry } from '@/utils/telemetry'

const API_ENDPOINTS = {
  // API según documentación PURCHASE_API.md
  processPayment: '/purchase/payment/process',
}

// Helper con retry simple (máx 2 reintentos)
const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        // Backoff simple: 500ms * intento
        const backoffMs = 500 * (attempt + 1)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }
    }
  }

  throw lastError
}

export const purchasePaymentService = {
  // =================== GESTIÓN DE ÓRDENES DE COMPRA ===================

  /**
   * Obtiene una orden de compra por ID
   * @param {number} purchaseOrderId
   * @returns {Promise<Object>}
   */
  async getPurchaseOrderById(purchaseOrderId) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        // Usar el endpoint existente de purchase service
        return await apiClient.makeRequest(`/purchase/${purchaseOrderId}`)
      })

      telemetry.record('purchase_payment.service.get_by_id', {
        duration: Date.now() - startTime,
        purchaseOrderId,
      })

      // Map nested structure to flat structure expected by UI
      if (result && result.purchase) {
        const mappedResult = {
          ...result.purchase,
          products: result.details || [],
          payments: result.payments,
          cost_info: result.cost_info,
        }
        return mappedResult
      }

      return result
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getPurchaseOrderById',
      })
      throw error
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
    const startTime = Date.now()

    try {
      const apiData = {
        purchase_order_id: purchaseOrderId,
        amount_paid: paymentData.amount_paid,
        payment_reference:
          paymentData.reference_number || paymentData.check_number || null,
        payment_notes: paymentData.notes || null,
      }

      const resolvedPaymentMethodId =
        paymentData.payment_method_id ?? paymentData.paymentMethodId ?? null
      if (resolvedPaymentMethodId) {
        apiData.payment_method_id = resolvedPaymentMethodId
      }

      const resolvedCurrencyId =
        paymentData.currency_id ?? paymentData.currencyId ?? null
      if (resolvedCurrencyId) {
        apiData.currency_id = resolvedCurrencyId
      }

      if (paymentData.exchange_rate !== undefined && paymentData.exchange_rate !== null) {
        apiData.exchange_rate = Number(paymentData.exchange_rate)
      }

      if (paymentData.original_amount !== undefined && paymentData.original_amount !== null) {
        apiData.original_amount = Number(paymentData.original_amount)
      }

      const resolvedCurrencyCode =
        paymentData.currency_code ??
        paymentData.currencyCode ??
        paymentData.currency ??
        null
      if (resolvedCurrencyCode) {
        apiData.currency_code =
          typeof resolvedCurrencyCode === 'string'
            ? resolvedCurrencyCode.toUpperCase()
            : resolvedCurrencyCode
      }

      // Add cash_register_id only if provided
      const resolvedCashRegisterId =
        paymentData.cash_register_id ?? paymentData.cashRegisterId ?? null
      if (resolvedCashRegisterId) {
        apiData.cash_register_id = resolvedCashRegisterId
      }

      // Contexto Multi-sucursal (v1.0)
      const resolvedBranchId = 
        paymentData.branch_id ?? 
        paymentData.branchId ?? 
        localStorage.getItem('activeBranch') ?? 
        null
      if (resolvedBranchId) {
        apiData.branch_id = Number(resolvedBranchId)
      }

      // Backend endpoint is now fully implemented

      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.processPayment, apiData)
      })

      // Backend now has full implementation - no more mock needed

      // Validate response structure
      if (!result.payment_details) {
        throw new Error(
          '❌ La respuesta del servidor no contiene los detalles del pago. El endpoint puede no estar completamente implementado.'
        )
      }

      telemetry.record('purchase_payment.service.process_payment', {
        duration: Date.now() - startTime,
        purchaseOrderId,
        amountPaid: paymentData.amount_paid,
        outstandingAmount: result.payment_details?.outstanding_amount || 0,
        paymentStatus: result.payment_details?.payment_status,
      })

      return result
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'processPayment',
      })
      throw error
    }
  },

  /**
   * Obtiene preview de cancelación mejorada
   * @param {number} purchaseOrderId
   * @returns {Promise<Object>}
   */
  async getCancellationPreview(purchaseOrderId) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(
          `/purchase/${purchaseOrderId}/preview-cancellation`
        )
      })

      telemetry.record('purchase_payment.service.cancellation_preview', {
        duration: Date.now() - startTime,
        purchaseOrderId,
        canBeCancelled: result.purchase_info?.can_be_cancelled,
        estimatedComplexity: result.recommendations?.estimated_complexity,
      })

      return result
    } catch (error) {
      telemetry.record('purchase_payment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getCancellationPreview',
      })
      throw error
    }
  },

}

export default purchasePaymentService
