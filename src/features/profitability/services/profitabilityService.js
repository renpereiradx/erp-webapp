import { apiClient } from '@/services/api'
import { DEMO_CONFIG } from '@/config/demoAuth'
import { profitabilityMocks } from '@/data/profitabilityMocks'

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

  getOverview: async (params = {}) => {
    return get(
      '/profitability/overview',
      params,
      profitabilityMocks.overview,
    )
  },

  getProducts: async params => {
    return get('/profitability/products', params, profitabilityMocks.products)
  },

  getCustomers: async params => {
    return get('/profitability/customers', params, profitabilityMocks.customers)
  },

  getCategories: async (params = {}) => {
    return get(
      '/profitability/categories',
      params,
      profitabilityMocks.categories,
    )
  },

  getTrends: async params => {
    return get('/profitability/trends', params, profitabilityMocks.trends)
  },

  getSellers: async (params = {}) => {
    return get('/profitability/sellers', params, profitabilityMocks.sellers)
  },
}

export default profitabilityService
