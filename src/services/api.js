/**
 * Configuración base de la API para el sistema ERP
 * Utiliza Axios para realizar peticiones HTTP a la API RESTful
 */

import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050';

// Crear instancia de Axios con configuración predeterminada
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage (se implementará con el store de auth)
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo de respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejo centralizado de errores con mensajes amigables
    
    // Log del error para debugging (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.error('API Error:', error.response?.data || error.message);
    }
    
    // Manejo específico de errores de autenticación
    if (error.response?.status === 401) {
      // Token expirado o inválido - redirigir a login
      localStorage.removeItem('auth_token');
      
      // Mostrar mensaje amigable
      error.message = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      
      // Redirigir después de un pequeño delay para mostrar el mensaje
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
    
    // Mejorar mensajes de error según el código de estado
    if (error.response?.status === 403) {
      error.message = 'No tienes permisos para realizar esta acción. Contacta al administrador del sistema.';
    } else if (error.response?.status === 404) {
      error.message = 'El recurso solicitado no fue encontrado. Verifica la información e intenta nuevamente.';
    } else if (error.response?.status === 429) {
      error.message = 'Demasiadas solicitudes. Espera unos minutos antes de intentar nuevamente.';
    } else if (error.response?.status === 500) {
      error.message = 'Error interno del servidor. Nuestro equipo técnico ha sido notificado. Intenta más tarde.';
    } else if (error.response?.status === 502) {
      error.message = 'El servidor está temporalmente fuera de servicio. Intenta nuevamente en unos minutos.';
    } else if (error.response?.status === 503) {
      error.message = 'El servicio está temporalmente no disponible por mantenimiento. Intenta más tarde.';
    } else if (error.code === 'ECONNREFUSED') {
      error.message = 'No se puede conectar al servidor. Verifica tu conexión a internet o contacta al soporte técnico.';
    } else if (error.code === 'NETWORK_ERROR') {
      error.message = 'Error de conexión de red. Verifica tu conexión a internet e intenta nuevamente.';
    } else if (error.code === 'TIMEOUT') {
      error.message = 'La conexión tardó demasiado tiempo. Verifica tu conexión a internet e intenta nuevamente.';
    }
    
    return Promise.reject(error);
  }
);

// Funciones helper para diferentes tipos de peticiones HTTP
export const apiService = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await apiClient.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default apiService;

