import { profitabilityMocks } from '@/data/profitabilityMocks'
import { DEMO_CONFIG } from '@/config/demoAuth'
import { apiClient } from '@/services/api'

const isDemo = DEMO_CONFIG.enabled

const get = async (endpoint, params = {}, mockData) => {
  if (isDemo) return { success: true, data: mockData }
  return apiClient.makeRequest(endpoint, {
    method: 'GET',
    params,
  })
}

/**
 * Servicio para obtener datos de rentabilidad.
 * Maneja tanto la API real como los mocks para el modo demo.
 */
const profitabilityService = {
  getDashboard: async (period = 'month') => {
    return get(
      '/profitability/dashboard',
      { period },
      profitabilityMocks.dashboard,
    )
  },

  getOverview: async (period = 'month') => {
    return get(
      '/profitability/overview',
      { period },
      profitabilityMocks.overview,
    )
  },

  getProducts: async params => {
    return get('/profitability/products', params, profitabilityMocks.products)
  },

  getCustomers: async params => {
    return get('/profitability/customers', params, profitabilityMocks.customers)
  },

  getCategories: async (period = 'month') => {
    return get(
      '/profitability/categories',
      { period },
      profitabilityMocks.categories,
    )
  },

  getTrends: async params => {
    return get('/profitability/trends', params, profitabilityMocks.trends)
  },

  getSellers: async (period = 'month') => {
    return get('/profitability/sellers', { period }, profitabilityMocks.sellers)
  },
}

export default profitabilityService
