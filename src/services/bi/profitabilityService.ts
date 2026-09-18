import { apiClient } from '@/services/api'

/**
 * Query params accepted by the /profitability/* endpoints (period plus
 * free-form filters the hooks forward as-is).
 */
export interface ProfitabilityQueryParams {
  period?: string
  [key: string]: unknown
}

/**
 * Servicio para obtener datos de rentabilidad (BI).
 *
 * Los métodos devuelven el envelope crudo del BE sin mapear: los hooks
 * consumidores aplican sus tolerancias (`response.data || response`).
 * El contrato fino se tipa al migrar el feature en FASE 2 de
 * PLAN_ALINEACION_BI_FRONTEND_2026-09-18.
 */
const profitabilityService = {
  getDashboard: async (period = 'month'): Promise<any> => {
    return apiClient.makeRequest('/profitability/dashboard', {
      method: 'GET',
      params: { period },
    })
  },

  getOverview: async (params: ProfitabilityQueryParams = {}): Promise<any> => {
    return apiClient.makeRequest('/profitability/overview', {
      method: 'GET',
      params,
    })
  },

  getProducts: async (params: ProfitabilityQueryParams = {}): Promise<any> => {
    return apiClient.makeRequest('/profitability/products', {
      method: 'GET',
      params,
    })
  },

  getCustomers: async (params: ProfitabilityQueryParams = {}): Promise<any> => {
    return apiClient.makeRequest('/profitability/customers', {
      method: 'GET',
      params,
    })
  },

  getCategories: async (params: ProfitabilityQueryParams = {}): Promise<any> => {
    return apiClient.makeRequest('/profitability/categories', {
      method: 'GET',
      params,
    })
  },

  getTrends: async (params: ProfitabilityQueryParams = {}): Promise<any> => {
    return apiClient.makeRequest('/profitability/trends', {
      method: 'GET',
      params,
    })
  },

  getSellers: async (params: ProfitabilityQueryParams = {}): Promise<any> => {
    return apiClient.makeRequest('/profitability/sellers', {
      method: 'GET',
      params,
    })
  },
}

export default profitabilityService
