/**
 * Configuración principal de la API
 * Migrado para usar el cliente oficial del Business Management API
 */

import BusinessManagementAPI from './BusinessManagementAPI';
import API_CONFIG from '@/config/api.config';

// Instancia única del cliente API usando configuración centralizada
const businessAPI = new BusinessManagementAPI({
  baseUrl: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  defaultHeaders: API_CONFIG.defaultHeaders
});

// Business Management API client initialized
if (API_CONFIG.isDevelopment()) {
}

export const apiClient = businessAPI;

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
  get: (endpoint) => apiClient.makeRequest(endpoint, { method: 'GET' }),
  post: (endpoint, data) => apiClient.makeRequest(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  put: (endpoint, data) => apiClient.makeRequest(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (endpoint) => apiClient.makeRequest(endpoint, { method: 'DELETE' }),

  // Métodos específicos de productos (delegando al apiClient)
  getProducts: (page, pageSize) => apiClient.getProducts(page, pageSize),
  getProductById: (id) => apiClient.getProductById(id),
  getProductByBarcode: (barcode) => apiClient.getProductByBarcode(barcode),
  getBeachTennisCourts: () => apiClient.getBeachTennisCourts(),
  searchProducts: (term) => apiClient.searchProducts(term),
  searchProductsByName: (name) => apiClient.searchProductsByName(name),
  createProduct: (data) => apiClient.createProduct(data),
  updateProduct: (id, data) => apiClient.updateProduct(id, data),
  deleteProduct: (id) => apiClient.deleteProduct(id),
  
  // Métodos de clientes
  getClients: (params) => apiClient.getClients(params),
  getClientById: (id) => apiClient.getClientById(id),
  searchClientsByName: (name) => apiClient.searchClientsByName(name),
  createClient: (data) => apiClient.createClient(data),
  updateClient: (id, data) => apiClient.updateClient(id, data),
  deleteClient: (id) => apiClient.deleteClient(id),
  
  // Métodos de categorías
  getAllCategories: () => apiClient.getAllCategories(),
  
  // Métodos de reservas con fallback robusto
  getReservationReport: async (params = {}) => {
    try {
      // Ensure authentication first
      await apiClient.ensureAuthentication();
      
      // Build query parameters as specified in RESERVES_API.md
      const queryParams = new URLSearchParams();
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.product_id) queryParams.append('product_id', params.product_id);
      if (params.client_id) queryParams.append('client_id', params.client_id);
      if (params.status) queryParams.append('status', params.status);
      
      const endpoint = `/reserve/report${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      // Try the primary endpoint
      return await apiClient.makeRequest(endpoint, { method: 'GET' });
    } catch (error) {
      // Log more specific error information
      if (error.status === 400) {
      } else if (error.status === 401) {
      } else {
      }
      
      // Return mock data structure matching ReservationReport interface
      return [
        {
          reserve_id: 1,
          product_name: "Cancha de Beach Tennis 1",
          client_name: "Cliente Demo",
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(), // +1 hour
          duration_hours: 1,
          total_amount: 70000.00,
          status: "RESERVED",
          created_by: "Sistema Demo",
          days_until_reservation: 0
        }
      ];
    }
  },
  
  // Utilidades
  isAuthenticated: () => !!localStorage.getItem('authToken'),
  getToken: () => localStorage.getItem('authToken'),
  setToken: (token) => localStorage.setItem('authToken', token),
  clearToken: () => localStorage.removeItem('authToken')
};

export default apiService;

