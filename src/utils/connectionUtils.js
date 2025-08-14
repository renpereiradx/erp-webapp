/**
 * Utilidades para verificar y manejar el estado de la conexión
 */

import { useState, useEffect } from 'react';

/**
 * Verifica si el error es de tipo conexión/red
 * @param {Error} error 
 * @returns {boolean}
 */
export const isConnectionError = (error) => {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const isNetworkError = 
    message.includes('err_connection_timed_out') ||
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    error.code === 'NETWORK_ERROR' ||
    error.code === 'NETWORK';
    
  return isNetworkError;
};

/**
 * Obtiene un mensaje de error amigable para errores de conexión
 * @param {Error} error 
 * @returns {string}
 */
export const getConnectionErrorMessage = (error) => {
  if (isConnectionError(error)) {
    return 'Sin conexión al servidor. Verifica tu conexión a internet e intenta nuevamente.';
  }
  
  return error?.message || 'Error desconocido';
};

/**
 * Verifica si hay conexión a internet (simple check)
 * @returns {Promise<boolean>}
 */
export const checkInternetConnection = async () => {
  try {
    // Intentar hacer fetch a un endpoint conocido
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000) // 5 segundos timeout
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Hook simple para detectar si estamos online/offline
 * @returns {{ isOnline: boolean, isOffline: boolean }}
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return {
    isOnline,
    isOffline: !isOnline
  };
};

export default {
  isConnectionError,
  getConnectionErrorMessage,
  checkInternetConnection,
  useNetworkStatus
};
