/**
 * Configuración principal de la API
 * Migrado para usar el cliente oficial del Business Management API
 */

import BusinessManagementAPI from './BusinessManagementAPI'
import API_CONFIG from '@/config/api.config'

// Instancia única del cliente API usando configuración centralizada
const businessAPI = new BusinessManagementAPI({
  baseUrl: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  defaultHeaders: API_CONFIG.defaultHeaders,
})

// Business Management API client initialized
if (API_CONFIG.isDevelopment()) {
  // dev_log: API client initialized
}

export const apiClient = businessAPI

// Servicio API legacy manteniendo compatibilidad
export const apiService: any = {
  // Métodos de autenticación
  login: (username: string, password: string) => (apiClient as any).login(username, password),
  signup: (email: string, password: string) => (apiClient as any).signup(email, password),
  logout: () => apiClient.logout(),

  // Métodos HTTP genéricos para compatibilidad
  get: (endpoint: string, options = {}) => apiClient.get(endpoint, options),
  post: (endpoint: string, data: any) =>
    apiClient.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: (endpoint: string, data: any) =>
    apiClient.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (endpoint: string) => apiClient.makeRequest(endpoint, { method: 'DELETE' }),

  // Métodos específicos de productos (delegando al apiClient)
  getProducts: (page: number, pageSize: number) => (apiClient as any).getProducts(page, pageSize),
  getProductById: (id: string | number) => (apiClient as any).getProductById(id),
  getProductByBarcode: (barcode: string) => (apiClient as any).getProductByBarcode(barcode),
  getBeachTennisCourts: () => (apiClient as any).getBeachTennisCourts(),
  searchProducts: (term: string) => (apiClient as any).searchProducts(term),
  searchProductsByName: (name: string) => (apiClient as any).searchProductsByName(name),
  createProduct: (data: any) => (apiClient as any).createProduct(data),
  updateProduct: (id: string | number, data: any) => (apiClient as any).updateProduct(id, data),
  deleteProduct: (id: string | number) => (apiClient as any).deleteProduct(id),

  // Métodos de clientes
  getClients: (params: any) => (apiClient as any).getClients(params),
  getClientById: (id: string | number) => (apiClient as any).getClientById(id),
  searchClientsByName: (name: string) => (apiClient as any).searchClientsByName(name),
  createClient: (data: any) => (apiClient as any).createClient(data),
  updateClient: (id: string | number, data: any) => (apiClient as any).updateClient(id, data),
  deleteClient: (id: string | number) => (apiClient as any).deleteClient(id),

  // Métodos de categorías
  getAllCategories: () => (apiClient as any).getAllCategories(),

  // Métodos de ventas
  getSalesByClientId: (id: string | number) => (apiClient as any).getSalesByClientId(id),
  getSalesByClientName: (name: string) => (apiClient as any).getSalesByClientName(name),
  getSaleById: (id: string | number) => (apiClient as any).getSaleById(id),

  // Métodos de reservas con fallback robusto
  getReservationReport: async (params: any = {}) => {
    try {
      // Ensure authentication first
      if (!apiClient.hasValidToken()) {
        throw new Error('No authentication token found')
      }

      // Use GET /reserve/all and filter client-side as /reserve/report is not documented
      // This ensures we get real data instead of mock data
      const response = await apiClient.makeRequest('/reserve/all', {
        method: 'GET',
      })

      let filtered = Array.isArray(response) ? response : []

      if (params.client_id) {
        // Loose equality to handle string/number mismatch
        filtered = filtered.filter((r: any) => r.client_id == params.client_id)
      }

      if (params.status) {
        filtered = filtered.filter((r: any) => r.status === params.status)
      }

      return filtered
    } catch (error) {
      console.error('Error fetching reservations:', error)
      return []
    }
  },

  // Utilidades
  isAuthenticated: () => !!localStorage.getItem('authToken'),
  getToken: () => localStorage.getItem('authToken'),
  setToken: (token: string) => localStorage.setItem('authToken', token),
  clearToken: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
  },
}

export default apiService
