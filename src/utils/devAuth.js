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
          console.log('🔑 Token existente válido, saltando auto-login');
          return existingToken;
        } else {
          console.log('🔄 Token existente inválido, removiendo...');
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.log('🔄 Error verificando token existente, removiendo...');
        localStorage.removeItem('authToken');
      }
    }

    console.log('🧪 Iniciando auto-login de desarrollo...');
    
    // Intentar login primero
    try {
      const loginResponse = await apiClient.login(DEV_USER.email, DEV_USER.password);
      console.log('✅ Auto-login exitoso con usuario existente');
      return loginResponse.token;
    } catch (loginError) {
      if (loginError.message.includes('not found') || loginError.message.includes('404')) {
        // Usuario no existe, crear cuenta
        console.log('👤 Usuario de desarrollo no existe, creando cuenta...');
        const signupResponse = await apiClient.signup(DEV_USER.email, DEV_USER.password);
        console.log('✅ Usuario de desarrollo creado y logueado automáticamente');
        return signupResponse.token;
      } else {
        throw loginError;
      }
    }
  } catch (error) {
    console.warn('⚠️ Auto-login falló:', error.message);
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
    console.log('🚫 Dev auth deshabilitado en producción');
    return false;
  }

  try {
    await autoLogin();
    return true;
  } catch (error) {
    console.error('❌ Error habilitando dev auth:', error);
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
    console.log('🚀 Inicializando autenticación de desarrollo...');
    await autoLogin();
    console.log('✅ Autenticación de desarrollo inicializada');
    return true;
  } catch (error) {
    console.warn('⚠️ No se pudo inicializar autenticación de desarrollo:', error.message);
    console.log('💡 Las funciones de API usarán datos mock como fallback');
    return false;
  }
};

/**
 * Cleanup - Remueve token de desarrollo
 */
export const cleanupDevAuth = () => {
  if (isDevelopment()) {
    localStorage.removeItem('authToken');
    console.log('🧹 Token de desarrollo removido');
  }
};

export default {
  autoLogin,
  isDevelopment,
  enableDevAuth,
  initDevAuth,
  cleanupDevAuth
};
