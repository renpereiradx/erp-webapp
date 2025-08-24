/**
 * Hook de Telemetría Enterprise - Wave 2
 * Proporciona capacidades avanzadas de seguimiento y analytics
 * 
 * FEATURES WAVE 2:
 * - Tracking de eventos con context rico
 * - Métricas de performance automáticas
 * - Integración con observabilidad
 * - Buffer de eventos offline
 * - Sampling inteligente
 * 
 * @since Wave 2 - Resiliencia & Confiabilidad
 * @author Sistema ERP
 */

import { useCallback, useRef, useEffect } from 'react';

// Constantes de telemetría
const TELEMETRY_CONFIG = {
  // Buffer para eventos offline
  MAX_BUFFER_SIZE: 100,
  FLUSH_INTERVAL: 30000, // 30 segundos
  
  // Sampling rates
  DEFAULT_SAMPLE_RATE: 1.0, // 100% para development
  ERROR_SAMPLE_RATE: 1.0,   // 100% para errores
  
  // Endpoints
  ANALYTICS_ENDPOINT: '/api/analytics/events',
  METRICS_ENDPOINT: '/api/analytics/metrics',
  
  // Context automático
  AUTO_CONTEXT: true,
  INCLUDE_PERFORMANCE: true,
  INCLUDE_USER_AGENT: true
};

/**
 * Hook para telemetría y analytics enterprise
 * 
 * @param {Object} options - Configuración del hook
 * @param {boolean} options.enabled - Si la telemetría está habilitada
 * @param {number} options.sampleRate - Tasa de muestreo (0-1)
 * @param {Object} options.defaultContext - Context por defecto
 * @returns {Object} Funciones de telemetría
 */
export const useTelemetry = (options = {}) => {
  const {
    enabled = true,
    sampleRate = TELEMETRY_CONFIG.DEFAULT_SAMPLE_RATE,
    defaultContext = {}
  } = options;

  // Referencias para buffers y timers
  const eventBuffer = useRef([]);
  const metricsBuffer = useRef([]);
  const flushTimer = useRef(null);

  // Context de sesión
  const sessionContext = useRef({
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    ...defaultContext
  });

  /**
   * Genera context automático para eventos
   * 
   * @returns {Object} Context del evento
   */
  const generateAutoContext = useCallback(() => {
    if (!TELEMETRY_CONFIG.AUTO_CONTEXT) return {};

    const context = {
      timestamp: new Date().toISOString(),
      sessionId: sessionContext.current.sessionId,
      sessionDuration: Date.now() - sessionContext.current.startTime
    };

    // Performance metrics si está habilitado
    if (TELEMETRY_CONFIG.INCLUDE_PERFORMANCE && typeof performance !== 'undefined') {
      context.performance = {
        navigation: performance.timing ? {
          loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
          domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
        } : null,
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        } : null
      };
    }

    // URL actual
    if (typeof window !== 'undefined') {
      context.page = {
        url: window.location.href,
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      };
    }

    return context;
  }, []);

  /**
   * Determina si debe procesar el evento basado en sampling
   * 
   * @param {string} eventType - Tipo de evento
   * @param {number} customSampleRate - Sample rate personalizado
   * @returns {boolean} Si debe procesar el evento
   */
  const shouldSample = useCallback((eventType, customSampleRate) => {
    // Errores siempre se procesan
    if (eventType.includes('error') || eventType.includes('ERROR')) {
      return Math.random() < TELEMETRY_CONFIG.ERROR_SAMPLE_RATE;
    }

    // Sample rate personalizado o por defecto
    const rate = customSampleRate ?? sampleRate;
    return Math.random() < rate;
  }, [sampleRate]);

  /**
   * Envía eventos al servidor
   * 
   * @param {Array} events - Array de eventos
   */
  const flushEvents = useCallback(async (events) => {
    if (!events.length || !enabled) return;

    try {
      // En desarrollo, solo log a consola
      if (process.env.NODE_ENV === 'development') {
        console.group('📊 Telemetry Events');
        events.forEach(event => {
          console.log(`🔹 ${event.type}:`, event);
        });
        console.groupEnd();
        return;
      }

      // En producción, enviar al endpoint
      const response = await fetch(TELEMETRY_CONFIG.ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          metadata: {
            client: 'erp-webapp',
            version: '2.0.0',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        console.warn('Failed to send telemetry events:', response.status);
      }
    } catch (error) {
      console.warn('Telemetry flush error:', error);
    }
  }, [enabled]);

  /**
   * Flush automático de eventos
   */
  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
    }

    flushTimer.current = setTimeout(async () => {
      if (eventBuffer.current.length > 0) {
        const events = [...eventBuffer.current];
        eventBuffer.current = [];
        await flushEvents(events);
      }
    }, TELEMETRY_CONFIG.FLUSH_INTERVAL);
  }, [flushEvents]);

  /**
   * Registra un evento de telemetría
   * 
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventData - Datos del evento
   * @param {Object} options - Opciones del evento
   */
  const trackEvent = useCallback((eventType, eventData = {}, options = {}) => {
    if (!enabled || !shouldSample(eventType, options.sampleRate)) {
      return;
    }

    try {
      const event = {
        type: eventType,
        data: eventData,
        context: {
          ...generateAutoContext(),
          ...options.context
        },
        metadata: {
          source: 'purchases',
          wave: 'wave-2',
          ...options.metadata
        }
      };

      // Agregar al buffer
      eventBuffer.current.push(event);

      // Limitar tamaño del buffer
      if (eventBuffer.current.length > TELEMETRY_CONFIG.MAX_BUFFER_SIZE) {
        eventBuffer.current = eventBuffer.current.slice(-TELEMETRY_CONFIG.MAX_BUFFER_SIZE);
      }

      // Programar flush
      scheduleFlush();

      // Flush inmediato para eventos críticos
      if (options.immediate || eventType.includes('error')) {
        flushEvents([event]);
      }
    } catch (error) {
      console.warn('Error tracking event:', error);
    }
  }, [enabled, shouldSample, generateAutoContext, scheduleFlush, flushEvents]);

  /**
   * Registra métricas de performance
   * 
   * @param {string} metricName - Nombre de la métrica
   * @param {number} value - Valor de la métrica
   * @param {Object} tags - Tags adicionales
   */
  const trackMetric = useCallback((metricName, value, tags = {}) => {
    if (!enabled) return;

    try {
      const metric = {
        name: metricName,
        value,
        timestamp: Date.now(),
        tags: {
          source: 'purchases',
          wave: 'wave-2',
          ...tags
        }
      };

      metricsBuffer.current.push(metric);

      // En desarrollo, log métricas importantes
      if (process.env.NODE_ENV === 'development') {
        console.log(`📈 Metric: ${metricName} = ${value}`, tags);
      }
    } catch (error) {
      console.warn('Error tracking metric:', error);
    }
  }, [enabled]);

  /**
   * Registra un timing de performance
   * 
   * @param {string} label - Label del timing
   * @param {number} startTime - Tiempo de inicio
   * @param {Object} metadata - Metadata adicional
   */
  const trackTiming = useCallback((label, startTime, metadata = {}) => {
    const duration = Date.now() - startTime;
    
    trackMetric(`timing.${label}`, duration, {
      unit: 'ms',
      ...metadata
    });

    // También como evento
    trackEvent('performance.timing', {
      label,
      duration,
      ...metadata
    });
  }, [trackMetric, trackEvent]);

  /**
   * Crea un wrapper para tracking de funciones
   * 
   * @param {string} operationName - Nombre de la operación
   * @param {Function} fn - Función a trackear
   * @returns {Function} Función wrapped
   */
  const trackOperation = useCallback((operationName, fn) => {
    return async (...args) => {
      const startTime = Date.now();
      
      trackEvent(`operation.${operationName}.start`, {
        args: args.length
      });

      try {
        const result = await fn(...args);
        
        trackTiming(`operation.${operationName}`, startTime, {
          success: true
        });
        
        trackEvent(`operation.${operationName}.success`, {
          duration: Date.now() - startTime
        });

        return result;
      } catch (error) {
        trackTiming(`operation.${operationName}`, startTime, {
          success: false,
          error: error.message
        });
        
        trackEvent(`operation.${operationName}.error`, {
          error: error.message,
          stack: error.stack,
          duration: Date.now() - startTime
        }, { immediate: true });

        throw error;
      }
    };
  }, [trackEvent, trackTiming]);

  /**
   * Flush manual de todos los buffers
   */
  const flush = useCallback(async () => {
    if (eventBuffer.current.length > 0) {
      const events = [...eventBuffer.current];
      eventBuffer.current = [];
      await flushEvents(events);
    }
  }, [flushEvents]);

  /**
   * Limpia recursos al desmontar
   */
  useEffect(() => {
    return () => {
      if (flushTimer.current) {
        clearTimeout(flushTimer.current);
      }
      // Flush final
      flush();
    };
  }, [flush]);

  return {
    // Core tracking
    trackEvent,
    trackMetric,
    trackTiming,
    trackOperation,
    
    // Utilities
    flush,
    
    // Context
    sessionId: sessionContext.current.sessionId,
    
    // Config
    enabled,
    sampleRate
  };
};

export default useTelemetry;
