// Configuración centralizada de la API
// Este archivo gestiona dinámicamente la URL base según el entorno

/**
 * Obtiene la URL base de la API según el entorno
 * @returns {string} URL base de la API
 */
export const getApiBaseUrl = () => {
  // 1. Primera prioridad: Variable de entorno de Vite
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    return envUrl.replace(/\/+$/, ''); // Remover trailing slashes
  }
  
  // 2. Segunda prioridad: Detectar si estamos en producción
  if (import.meta.env.PROD) {
    // En producción con Docker, usar proxy de Nginx
    return '/api';
  }
  
  // 3. Fallback para desarrollo
  return 'http://localhost:5050';
};

/**
 * Obtiene el timeout de API en milisegundos
 * @returns {number} Timeout en ms
 */
export const getApiTimeout = () => {
  const envTimeout = import.meta.env.VITE_API_TIMEOUT;
  return envTimeout ? parseInt(envTimeout, 10) : 10000;
};

/**
 * Verifica si auto-login está habilitado
 * @returns {boolean}
 */
export const isAutoLoginEnabled = () => {
  return import.meta.env.VITE_AUTO_LOGIN === 'true';
};

/**
 * Obtiene el entorno actual
 * @returns {string} development | production
 */
export const getEnvironment = () => {
  return import.meta.env.VITE_ENV || import.meta.env.MODE || 'development';
};

/**
 * Configuración completa de la API
 */
export const apiConfig = {
  baseUrl: getApiBaseUrl(),
  timeout: getApiTimeout(),
  autoLogin: isAutoLoginEnabled(),
  environment: getEnvironment(),
  
  // Headers por defecto
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  
  // Log de configuración (solo en desarrollo)
  logConfig: () => {
    if (import.meta.env.DEV) {
      console.group('🔧 API Configuration');
      console.log('🌍 Environment:', getEnvironment());
      console.log('🔗 Base URL:', getApiBaseUrl());
      console.log('⏱️ Timeout:', getApiTimeout(), 'ms');
      console.log('🔐 Auto-login:', isAutoLoginEnabled());
      console.groupEnd();
    }
  }
};

// Log automático en desarrollo
if (import.meta.env.DEV) {
  apiConfig.logConfig();
}

export default apiConfig;
