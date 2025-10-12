/**
 * ⚠️ UTILIDADES DE DESARROLLO ÚNICAMENTE ⚠️
 * 
 * Este archivo contiene funciones de auto-login para facilitar el desarrollo.
 * NO debe ser usado en producción.
 * 
 * En producción, la autenticación debe realizarse manualmente a través de:
 * 1. Página de login con formulario
 * 2. Validación adecuada de credenciales
 * 3. Manejo seguro de tokens
 */

import { apiClient } from '@/services/api';

// Configuración del usuario de desarrollo
const DEV_USER = {
  email: 'dev@erp.local',
  password: 'dev123'
};

/**
 * Intenta loguearse automáticamente con credenciales de desarrollo
 * Si el usuario no existe, lo crea primero
 */
export const autoLogin = async () => {
  try {
    // Verificar si ya tenemos token válido
    const existingToken = localStorage.getItem('authToken');
    if (existingToken) {
      // Verificar si el token es válido haciendo una llamada rápida
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/categories`, {
          headers: {
            'Authorization': existingToken, // Sin "Bearer " según el formato que funciona
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          return existingToken;
        } else {
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        localStorage.removeItem('authToken');
      }
    }

    // Intentar login primero
    try {
      const loginResponse = await apiClient.login(DEV_USER.email, DEV_USER.password);
      return loginResponse.token;
    } catch (loginError) {
      if (loginError.message.includes('not found') || loginError.message.includes('404')) {
        // Usuario no existe, crear cuenta
        const signupResponse = await apiClient.signup(DEV_USER.email, DEV_USER.password);
        return signupResponse.token;
      } else {
        throw loginError;
      }
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Verifica si estamos en modo desarrollo
 */
export const isDevelopment = () => {
  return import.meta.env.DEV || import.meta.env.VITE_ENV === 'development';
};

/**
 * Habilita el auto-login solo en desarrollo
 */
export const enableDevAuth = async () => {
  if (!isDevelopment()) {
    return false;
  }

  try {
    await autoLogin();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Inicializa automáticamente la autenticación en desarrollo
 * Se ejecuta una sola vez al cargar la aplicación
 */
export const initDevAuth = async () => {
  if (!isDevelopment()) {
    return false;
  }

  try {
    await autoLogin();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Cleanup - Remueve token de desarrollo
 */
export const cleanupDevAuth = () => {
  if (isDevelopment()) {
    localStorage.removeItem('authToken');
  }
};

export default {
  autoLogin,
  isDevelopment,
  enableDevAuth,
  initDevAuth,
  cleanupDevAuth
};
