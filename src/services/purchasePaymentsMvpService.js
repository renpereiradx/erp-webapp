import { apiClient } from '@/services/api'
import { telemetry } from '@/utils/telemetry'
import {
  DEMO_CONFIG_PURCHASE_PAYMENTS_MVP,
  getDemoPurchasePaymentsMvpOrders,
  getDemoPurchasePaymentOrderDetail,
  registerDemoPurchasePayment,
} from '@/config/demoData'

const API_PREFIX = '/purchase-payments/search'
const DETAIL_API_PREFIX = '/purchase-payments/orders'
const PAYMENTS_API_PREFIX = '/purchase-payments/orders'

const fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError = null

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        const backoff = 500 * (attempt + 1)
        await new Promise(resolve => setTimeout(resolve, backoff))
      }
    }
  }

  throw lastError
}

const normalizeResponse = raw => {
  if (!raw) {
    return {
      data: [],
      meta: {
        page: 1,
        pageSize: DEMO_CONFIG_PURCHASE_PAYMENTS_MVP.pageSize,
        total: 0,
        totalPages: 1,
      },
      filters: { suppliers: [], statuses: [] },
    }
  }

  const payload = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.results)
    ? raw.results
    : Array.isArray(raw)
    ? raw
    : []

  const meta = raw?.meta ||
    raw?.pagination || {
      page: 1,
      pageSize: DEMO_CONFIG_PURCHASE_PAYMENTS_MVP.pageSize,
      total: payload.length,
      totalPages: 1,
    }

  const filters = {
    suppliers: raw?.filters?.suppliers || [],
    statuses: raw?.filters?.statuses || [],
  }

  return { data: payload, meta, filters }
}

export const purchasePaymentsMvpService = {
  async search(params = {}) {
    const timer = telemetry.startTimer('feature.purchasePaymentsMvp.load')

    try {
      if (
        DEMO_CONFIG_PURCHASE_PAYMENTS_MVP.enabled &&
        !DEMO_CONFIG_PURCHASE_PAYMENTS_MVP.useRealAPI
      ) {
        const result = await getDemoPurchasePaymentsMvpOrders(params)
        telemetry.endTimer(timer, {
          source: 'demo',
          count: result?.data?.length || 0,
        })
        return normalizeResponse(result)
      }

      const response = await fetchWithRetry(() =>
        apiClient.get(API_PREFIX, { params })
      )
      telemetry.endTimer(timer, {
        source: 'api',
        count: response?.data?.length || 0,
      })
      return normalizeResponse(response?.data || response)
    } catch (error) {
      telemetry.record('feature.purchasePaymentsMvp.error', {
        operation: 'search',
        message: error?.message,
      })

      if (DEMO_CONFIG_PURCHASE_PAYMENTS_MVP.enabled) {
        const fallback = await getDemoPurchasePaymentsMvpOrders(params)
        telemetry.endTimer(timer, {
          source: 'demo-fallback',
          count: fallback?.data?.length || 0,
        })
        return normalizeResponse(fallback)
      }

      telemetry.endTimer(timer, { source: 'error' })
      throw error
    }
  },

  async getOrderDetail(orderId) {
    if (!orderId) {
      throw new Error('Se requiere el identificador de la orden de compra')
    }

    const timer = telemetry.startTimer('feature.purchasePaymentsMvp.detail')

    try {
      if (
        DEMO_CONFIG_PURCHASE_PAYMENTS_MVP.enabled &&
        !DEMO_CONFIG_PURCHASE_PAYMENTS_MVP.useRealAPI
      ) {
        const detail = await getDemoPurchasePaymentOrderDetail(orderId)
        telemetry.endTimer(timer, { source: 'demo' })
        return detail
      }

      const response = await fetchWithRetry(() =>
        apiClient.get(`${DETAIL_API_PREFIX}/${orderId}`)
      )

      telemetry.endTimer(timer, { source: 'api' })
      return response?.data || response
    } catch (error) {
      telemetry.record('feature.purchasePaymentsMvp.error', {
        operation: 'detail',
        message: error?.message,
      })

      if (DEMO_CONFIG_PURCHASE_PAYMENTS_MVP.enabled) {
        const fallback = await getDemoPurchasePaymentOrderDetail(orderId)
        telemetry.endTimer(timer, { source: 'demo-fallback' })
        return fallback
      }

      telemetry.endTimer(timer, { source: 'error' })
      throw error
    }
  },

  async registerPayment(orderId, payload = {}) {
    if (!orderId) {
      throw new Error('Se requiere el identificador de la orden de compra')
    }

    const timer = telemetry.startTimer('feature.purchasePaymentsMvp.register')

    try {
      if (
        DEMO_CONFIG_PURCHASE_PAYMENTS_MVP.enabled &&
        !DEMO_CONFIG_PURCHASE_PAYMENTS_MVP.useRealAPI
      ) {
        const result = await registerDemoPurchasePayment(orderId, payload)
        telemetry.endTimer(timer, { source: 'demo' })
        return result
      }

      const response = await fetchWithRetry(() =>
        apiClient.post(`${PAYMENTS_API_PREFIX}/${orderId}/payments`, payload)
      )

      telemetry.endTimer(timer, { source: 'api' })
      return response?.data || response
    } catch (error) {
      telemetry.record('feature.purchasePaymentsMvp.error', {
        operation: 'register',
        message: error?.message,
      })

      if (DEMO_CONFIG_PURCHASE_PAYMENTS_MVP.enabled) {
        const fallback = await registerDemoPurchasePayment(orderId, payload)
        telemetry.endTimer(timer, { source: 'demo-fallback' })
        return fallback
      }

      telemetry.endTimer(timer, { source: 'error' })
      throw error
    }
  },
}

export default purchasePaymentsMvpService
