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
}

export const apiClient = businessAPI

// Configurar event listeners para manejo de autenticación
// TEMPORAL: Desactivado para evitar redirecciones automáticas
/*
if (typeof window !== 'undefined') {
  // Manejar token expirado
  window.addEventListener('api:unauthorized', () => {
    console.warn('Token expirado o inválido, redirigiendo al login...');
    // Limpiar estado de autenticación
    localStorage.removeItem('authToken');
    // Redirigir al login si no estamos ya ahí
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  });

  // Manejar logout
  window.addEventListener('api:logout', () => {
    console.log('Usuario deslogueado');
    // Aquí podrías limpiar stores, etc.
  });
}
*/

// Servicio API legacy manteniendo compatibilidad
export const apiService = {
  // Métodos de autenticación
  login: (email, password) => apiClient.login(email, password),
  signup: (email, password) => apiClient.signup(email, password),
  logout: () => apiClient.logout(),

  // Métodos HTTP genéricos para compatibilidad
  get: (endpoint, options = {}) => apiClient.get(endpoint, options),
  post: (endpoint, data) =>
    apiClient.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: (endpoint, data) =>
    apiClient.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: endpoint => apiClient.makeRequest(endpoint, { method: 'DELETE' }),

  // Métodos específicos de productos (delegando al apiClient)
  getProducts: (page, pageSize) => apiClient.getProducts(page, pageSize),
  getProductById: id => apiClient.getProductById(id),
  getProductByBarcode: barcode => apiClient.getProductByBarcode(barcode),
  getBeachTennisCourts: () => apiClient.getBeachTennisCourts(),
  searchProducts: term => apiClient.searchProducts(term),
  searchProductsByName: name => apiClient.searchProductsByName(name),
  createProduct: data => apiClient.createProduct(data),
  updateProduct: (id, data) => apiClient.updateProduct(id, data),
  deleteProduct: id => apiClient.deleteProduct(id),

  // Métodos de clientes
  getClients: params => apiClient.getClients(params),
  getClientById: id => apiClient.getClientById(id),
  searchClientsByName: name => apiClient.searchClientsByName(name),
  createClient: data => apiClient.createClient(data),
  updateClient: (id, data) => apiClient.updateClient(id, data),
  deleteClient: id => apiClient.deleteClient(id),

  // Métodos de categorías
  getAllCategories: () => apiClient.getAllCategories(),

  // Métodos de ventas
  getSalesByClientId: id => apiClient.getSalesByClientId(id),
  getSalesByClientName: name => apiClient.getSalesByClientName(name),
  getSaleById: id => apiClient.getSaleById(id),

  // Métodos de reservas con fallback robusto
  getReservationReport: async (params = {}) => {
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
        filtered = filtered.filter(r => r.client_id == params.client_id)
      }

      if (params.status) {
        filtered = filtered.filter(r => r.status === params.status)
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
  setToken: token => localStorage.setItem('authToken', token),
  clearToken: () => localStorage.removeItem('authToken'),
}

export default apiService
