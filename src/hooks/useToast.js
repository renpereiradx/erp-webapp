/**
 * Hook for managing toast notifications
 * Provides easy-to-use methods for showing success, error, and info messages
 */

import { useState, useCallback, useMemo } from 'react'
import { toApiError } from '@/utils/ApiError'
import { useI18n } from '@/lib/i18n'

export const useToast = () => {
  const { t } = useI18n()
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(
    (message, type = 'info', duration = 3000, actions = []) => {
      const id = Date.now() + Math.random()
      const newToast = {
        id,
        message,
        type,
        duration,
        actions,
      }

      setToasts(prev => [...prev, newToast])

      // Auto remove toast
      if (duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(toast => toast.id !== id))
        }, duration + 300) // Add 300ms for animation
      }

      return id
    },
    [],
  )

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const toast = useCallback(
    (options = {}) => {
      if (typeof options === 'string') {
        return addToast(options, 'info')
      }

      const {
        title,
        description,
        variant,
        duration = 3000,
        actions = [],
        type,
        message,
      } = options || {}

      const normalizedType =
        type || (variant === 'destructive' ? 'error' : variant) || 'info'
      const finalMessage = description || message || title || 'Notificación'

      return addToast(finalMessage, normalizedType, duration, actions)
    },
    [addToast],
  )

  const success = useCallback(
    (message, optionsOrDuration, actions) => {
      if (typeof optionsOrDuration === 'object') {
        return toast({ ...optionsOrDuration, message, type: 'success' })
      }
      return addToast(message, 'success', optionsOrDuration, actions)
    },
    [addToast, toast],
  )

  const error = useCallback(
    (message, optionsOrDuration, actions) => {
      if (typeof optionsOrDuration === 'object') {
        return toast({ ...optionsOrDuration, message, type: 'error' })
      }
      return addToast(message, 'error', optionsOrDuration, actions)
    },
    [addToast, toast],
  )

  const warning = useCallback(
    (message, optionsOrDuration, actions) => {
      if (typeof optionsOrDuration === 'object') {
        return toast({ ...optionsOrDuration, message, type: 'warning' })
      }
      return addToast(message, 'warning', optionsOrDuration, actions)
    },
    [addToast, toast],
  )

  const info = useCallback(
    (message, optionsOrDuration, actions) => {
      if (typeof optionsOrDuration === 'object') {
        return toast({ ...optionsOrDuration, message, type: 'info' })
      }
      return addToast(message, 'info', optionsOrDuration, actions)
    },
    [addToast, toast],
  )

  const errorFrom = useCallback(
    (err, { fallback = 'Ocurrió un error', duration = 4000 } = {}) => {
      try {
        const norm = toApiError(err, fallback)
        let msg = norm.message || fallback
        // Prefer hint from i18n keys if available
        const hintKey = `errors.hint.${norm.code}`
        const hint = t(hintKey) !== hintKey ? t(hintKey) : norm.hint
        const toastMessage = `${msg}` + (norm.code ? ` (${norm.code})` : '')

        const actions = [
          {
            label: t('errors.toast.copy_code'),
            onClick: () => {
              try {
                navigator.clipboard.writeText(norm.code || '')
              } catch {
                // Ignore copy errors
              }
            },
          },
          {
            label: t('errors.toast.retry'),
            onClick: () => {
              // broadcast intent to retry — listeners (pages) may handle
              try {
                window.dispatchEvent(
                  new CustomEvent('toast:retry', {
                    detail: {
                      code: norm.code,
                      correlationId: norm.correlationId,
                    },
                  }),
                )
              } catch {
                // Ignore dispatch errors
              }
            },
          },
          {
            label: t('errors.toast.diagnostics'),
            onClick: () => {
              try {
                window.dispatchEvent(
                  new CustomEvent('toast:diagnostics', {
                    detail: {
                      code: norm.code,
                      correlationId: norm.correlationId,
                    },
                  }),
                )
              } catch {
                // Ignore dispatch errors
              }
            },
          },
        ]

        // Compose message with hint when available
        const fullMessage = hint ? `${toastMessage} — ${hint}` : toastMessage

        return addToast(fullMessage, 'error', duration, actions)
      } catch {
        return addToast(fallback, 'error', duration)
      }
    },
    [addToast, t],
  )

  const clear = useCallback(() => {
    setToasts([])
  }, [])

  return useMemo(
    () => ({
      toasts,
      toast,
      addToast,
      removeToast,
      success,
      error,
      warning,
      errorFrom,
      info,
      clear,
    }),
    [
      toasts,
      toast,
      addToast,
      removeToast,
      success,
      error,
      warning,
      errorFrom,
      info,
      clear,
    ],
  )
}

export default useToast
