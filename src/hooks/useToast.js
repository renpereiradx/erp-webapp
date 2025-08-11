/**
 * Hook for managing toast notifications
 * Provides easy-to-use methods for showing success, error, and info messages
 */

import { useState, useCallback } from 'react';
import { toApiError } from '@/utils/ApiError';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove toast
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration + 300); // Add 300ms for animation
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message, duration) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  // Muestra un toast de error a partir de un objeto Error/ApiError, con fallback y mapping por código
  const errorFrom = useCallback((err, { fallback = 'Ocurrió un error', duration = 4000 } = {}) => {
    try {
      const norm = toApiError(err, fallback);
      let msg = norm.message || fallback;
      // Mensajes consistentes por código
      if (norm.code === 'INTERNAL') msg = 'Error interno del servidor. Intenta nuevamente.';
      else if (norm.code === 'NETWORK') msg = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      else if (norm.code === 'UNAUTHORIZED') msg = 'Sesión expirada o inválida. Inicia sesión nuevamente.';
      // NOT_FOUND se queda con el mensaje original para contexto
      return addToast(msg, 'error', duration);
    } catch {
      return addToast(fallback, 'error', duration);
    }
  }, [addToast]);

  const info = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success,
  error,
  errorFrom,
    info,
    clear
  };
};

export default useToast;
