/**
 * Configuración principal de la API
 * Migrado para usar el cliente oficial del Business Management API
 */

import BusinessManagementAPI from './BusinessManagementAPI';

// Configuración del cliente API
const apiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5050',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  defaultHeaders: {
    'Content-Type': 'application/json'
  }
};

// Instancia única del cliente API
export const apiClient = new BusinessManagementAPI(apiConfig);

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

  // Utilidades
  isAuthenticated: () => !!localStorage.getItem('authToken'),
  getToken: () => localStorage.getItem('authToken'),
  setToken: (token) => localStorage.setItem('authToken', token),
  clearToken: () => localStorage.removeItem('authToken')
};

export default apiService;

