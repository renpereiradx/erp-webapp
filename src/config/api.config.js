/**
 * Configuración centralizada de la API
 * Maneja automáticamente las URLs según el entorno (desarrollo/producción)
 */

const API_CONFIG = {
  // En desarrollo: http://localhost:5050
  // En producción: /api (proxy de Nginx)
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5050',

  // Timeout de API en milisegundos
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,

  // Modo actual
  environment: import.meta.env.VITE_ENV || import.meta.env.MODE || 'development',

  // Helper para determinar si estamos en producción
  isProduction() {
    return this.environment === 'production';
  },

  // Helper para determinar si estamos en desarrollo
  isDevelopment() {
    return this.environment === 'development';
  },
  
  // Construir URL completa para un endpoint
  getEndpoint(path) {
    // Asegurar que path empiece con /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // En producción con proxy, no duplicar /api
    if (this.baseUrl === '/api') {
      return `/api${normalizedPath}`;
    }
    
    // En desarrollo o URLs completas
    return `${this.baseUrl}${normalizedPath}`;
  },
  
  // Headers por defecto
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
};

// Log de configuración (solo en desarrollo)
if (API_CONFIG.isDevelopment()) {
  console.log('🔧 API Configuration:', {
    baseUrl: API_CONFIG.baseUrl,
    timeout: API_CONFIG.timeout,
    environment: API_CONFIG.environment,
  });
}

export default API_CONFIG;
