/**
 * Hook for managing toast notifications
 * Provides easy-to-use methods for showing success, error, and info messages
 */

import { useState, useCallback } from 'react';
import { toApiError } from '@/utils/ApiError';
import { useI18n } from '@/lib/i18n';

export const useToast = () => {
  const { t } = useI18n();
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000, actions = []) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration,
      actions
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

  const success = useCallback((message, duration, actions) => {
    return addToast(message, 'success', duration, actions);
  }, [addToast]);

  const error = useCallback((message, duration, actions) => {
    return addToast(message, 'error', duration, actions);
  }, [addToast]);

  // Muestra un toast de error a partir de un objeto Error/ApiError, con fallback y mapping por código
  const errorFrom = useCallback((err, { fallback = 'Ocurrió un error', duration = 4000 } = {}) => {
    try {
      const norm = toApiError(err, fallback);
      let msg = norm.message || fallback;
      // Prefer hint from i18n keys if available
      const hintKey = `errors.hint.${norm.code}`;
      const hint = t(hintKey) !== hintKey ? t(hintKey) : norm.hint;
      const toastMessage = `${msg}` + (norm.code ? ` (${norm.code})` : '');

      const actions = [
        {
          label: t('errors.toast.copy_code'),
          onClick: () => {
            try { navigator.clipboard.writeText(norm.code || ''); } catch {}
          }
        },
        {
          label: t('errors.toast.retry'),
          onClick: () => {
            // broadcast intent to retry — listeners (pages) may handle
            try { window.dispatchEvent(new CustomEvent('toast:retry', { detail: { code: norm.code, correlationId: norm.correlationId } })); } catch {}
          }
        },
        {
          label: t('errors.toast.diagnostics'),
          onClick: () => {
            try { window.dispatchEvent(new CustomEvent('toast:diagnostics', { detail: { code: norm.code, correlationId: norm.correlationId } })); } catch {}
          }
        }
      ];

      // Compose message with hint when available
      const fullMessage = hint ? `${toastMessage} — ${hint}` : toastMessage;

      return addToast(fullMessage, 'error', duration, actions);
    } catch {
      return addToast(fallback, 'error', duration);
    }
  }, [addToast, t]);

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
