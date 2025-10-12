import { apiClient } from './api.js'

const DEBUG_GLOBAL_KEY = '__PAYMENT_API_DEBUG__'

const ensureStore = () => {
  if (typeof window === 'undefined') {
    return { events: [] }
  }

  const existing = window[DEBUG_GLOBAL_KEY]
  if (existing) {
    return existing
  }

  const metadata = {
    initializedAt: new Date().toISOString(),
    mode: import.meta.env?.MODE,
    baseUrl:
      apiClient?.baseUrl ||
      import.meta.env?.VITE_API_URL ||
      'http://localhost:5050',
    frontendOrigin:
      typeof window !== 'undefined' ? window.location?.origin : undefined,
    userAgent:
      typeof window !== 'undefined' ? window.navigator?.userAgent : undefined,
  }

  const store = { events: [], metadata }
  window[DEBUG_GLOBAL_KEY] = store
  return store
}

const sanitizeStack = (stack = '') => {
  if (!stack) return undefined
  return stack.split('\n').slice(0, 6).join('\n')
}

const isCorsSuspected = error => {
  if (!error) return false
  const message = (error.message || '').toLowerCase()
  const name = (error.name || '').toLowerCase()
  return (
    message.includes('cors') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network error') ||
    name.includes('typeerror')
  )
}

const toConsoleGroupLabel = ({ service, operation, status, corsSuspected }) => {
  const statusLabel = status ? `status:${status}` : 'status:unknown'
  const corsLabel = corsSuspected ? 'CORS?' : '---'
  return `%c[PaymentAPI][${service}] ${operation} -> ${statusLabel} ${corsLabel}`
}

export const paymentApiDebug = {
  record({
    service,
    operation,
    endpoint,
    method = 'GET',
    error,
    requestBody,
    note,
    extra = {},
  }) {
    const timestamp = new Date().toISOString()
    const store = ensureStore()

    const event = {
      timestamp,
      service,
      operation,
      endpoint,
      method,
      note,
      mode: import.meta.env?.MODE,
      baseUrl: store.metadata?.baseUrl,
      corsSuspected: isCorsSuspected(error),
      extra,
      error: error
        ? {
            name: error.name,
            message: error.message,
            status: error.status,
            code: error.code,
            hint: error.hint,
            stack: sanitizeStack(error.stack),
          }
        : undefined,
      requestBody,
    }

    if (typeof window !== 'undefined') {
      const client = {
        location: window.location?.href,
        userAgent: window.navigator?.userAgent,
      }
      store.events.push({ ...event, client })
      window.paymentApiDebugReport = this // acceso rápido desde consola
    } else {
      store.events.push(event)
    }

    const status = error?.status || error?.code || 'error'
    const groupLabel = toConsoleGroupLabel({
      service,
      operation,
      status,
      corsSuspected: event.corsSuspected,
    })

    if (typeof console !== 'undefined' && console.groupCollapsed) {
      console.groupCollapsed(groupLabel, 'color:#2563eb;font-weight:600;')
      console.log('🕒 Timestamp:', timestamp)
      console.log('🔌 Endpoint:', endpoint)
      console.log('🧭 Método:', method)
      console.log('🌐 Base URL:', store.metadata?.baseUrl)
      if (note) {
        console.log('📝 Nota:', note)
      }
      if (event.corsSuspected) {
        console.log('🚫 Sospecha CORS:', true)
      }
      if (typeof window !== 'undefined') {
        console.log('🖥️ Cliente:', {
          location: window.location?.href,
          origin: window.location?.origin,
          userAgent: window.navigator?.userAgent,
        })
      }
      if (error) {
        console.log('❗ Error:', {
          name: error.name,
          message: error.message,
          status: error.status,
          code: error.code,
          hint: error.hint,
        })
        if (error.stack) {
          console.log('📚 Stack (primeras líneas):', sanitizeStack(error.stack))
        }
      }
      if (requestBody) {
        console.log('📦 Payload:', requestBody)
      }
      if (Object.keys(extra || {}).length > 0) {
        console.log('📎 Extra:', extra)
      }
      console.groupEnd()
    }

    return event
  },

  getReport() {
    const store = ensureStore()
    return {
      metadata: store.metadata,
      events: store.events,
      toJSON() {
        return JSON.stringify(
          { metadata: store.metadata, events: store.events },
          null,
          2
        )
      },
      print() {
        const json = this.toJSON()
        if (typeof console !== 'undefined') {
          console.log(
            '%c[PaymentAPI] Reporte listo para backend:',
            'color:#2563eb;font-weight:600;'
          )
          console.log(json)
        }
        return json
      },
    }
  },
}

if (typeof window !== 'undefined') {
  window.paymentApiDebug = paymentApiDebug
}
