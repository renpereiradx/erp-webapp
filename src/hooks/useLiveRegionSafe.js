/**
 * Wave 4: UX & Accessibility Enterprise - React 19 Compatible
 * Live Region Hook Safe - WCAG 2.1 AA Compliance
 * 
 * Gestiona regiones activas para anuncios a screen readers:
 * - Anuncios de estado (loading, success, error)
 * - Notificaciones contextuales 
 * - Cambios dinámicos de contenido
 * - Soporte aria-live y aria-atomic
 * 
 * @since Wave 4 - UX & Accessibility (React 19 Compatible)
 * @author Sistema ERP
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { telemetry } from '@/lib/telemetry';

/**
 * Hook React 19 compatible para gestión de regiones ARIA live
 * Implementa anuncios accesibles según WCAG 2.1 AA
 */
export const useLiveRegionSafe = (options = {}) => {
  const {
    politeness = 'polite', // 'polite' | 'assertive' | 'off'
    atomic = true,
    relevant = 'additions text',
    enableTelemetry = true,
    debugMode = false,
    clearDelay = 5000 // Tiempo para limpiar anuncios automáticamente
  } = options;

  // Estados y referencias - React 19 compatible
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageQueue, setMessageQueue] = useState([]);
  const liveRegionRef = useRef(null);
  const timeoutRef = useRef(null);
  const processQueueTimeoutRef = useRef(null);

  // Limpiar timeouts en unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (processQueueTimeoutRef.current) {
        clearTimeout(processQueueTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Anuncia un mensaje a los screen readers
   */
  const announce = useCallback((message, priority = 'polite') => {
    if (!message || typeof message !== 'string') return;

    const announcement = {
      id: Date.now(),
      message: message.trim(),
      priority,
      timestamp: new Date().toISOString()
    };

    // Telemetría opcional
    if (enableTelemetry) {
      try {
        telemetry.track('accessibility.live_region.announce', {
          message_length: message.length,
          priority,
          timestamp: announcement.timestamp
        });
      } catch (error) {
        // Silently handle telemetry errors in StrictMode
      }
    }

    // Debug logging
    if (debugMode) {
    }

    // Agregar a la cola de mensajes
    setMessageQueue(prevQueue => [...prevQueue, announcement]);
  }, [enableTelemetry, debugMode, messageQueue.length]);

  /**
   * Procesar cola de mensajes
   */
  useEffect(() => {
    if (messageQueue.length === 0) return;

    // Procesar el siguiente mensaje en la cola
    const processNextMessage = () => {
      const nextMessage = messageQueue[0];
      if (nextMessage) {
        setCurrentMessage(nextMessage.message);
        setMessageQueue(prev => prev.slice(1));

        // Auto-clear después del delay configurado
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          setCurrentMessage('');
        }, clearDelay);
      }
    };

    // Pequeño delay para evitar anuncios superpuestos
    if (processQueueTimeoutRef.current) {
      clearTimeout(processQueueTimeoutRef.current);
    }
    
    processQueueTimeoutRef.current = setTimeout(processNextMessage, 100);
  }, [messageQueue, clearDelay]);

  /**
   * Anuncios específicos con mensajes predefinidos
   */
  const announceLoading = useCallback((context = '') => {
    const message = context 
      ? `Cargando ${context}...`
      : 'Cargando...';
    announce(message, 'polite');
  }, [announce]);

  const announceSuccess = useCallback((context = '') => {
    const message = context 
      ? `${context} completado exitosamente`
      : 'Operación completada exitosamente';
    announce(message, 'polite');
  }, [announce]);

  const announceError = useCallback((context = '', error = '') => {
    const message = context 
      ? `Error en ${context}: ${error}`
      : `Error: ${error}`;
    announce(message, 'assertive');
  }, [announce]);

  const announceWarning = useCallback((message) => {
    announce(`Advertencia: ${message}`, 'assertive');
  }, [announce]);

  // Funciones específicas para formularios
  const announceFormValidation = useCallback((errors = []) => {
    if (errors.length === 0) {
      announce('Formulario válido', 'polite');
    } else {
      const errorCount = errors.length;
      const message = errorCount === 1 
        ? `${errorCount} error encontrado en el formulario`
        : `${errorCount} errores encontrados en el formulario`;
      announce(message, 'assertive');
    }
  }, [announce]);

  const announceFormSaved = useCallback((itemName = 'elemento') => {
    announce(`${itemName} guardado correctamente`, 'polite');
  }, [announce]);

  /**
   * Props para el componente LiveRegion
   */
  const liveRegionProps = {
    ref: liveRegionRef,
    'aria-live': politeness,
    'aria-atomic': atomic,
    'aria-relevant': relevant,
    role: politeness === 'assertive' ? 'alert' : 'status',
    className: 'sr-only',
    children: currentMessage
  };

  // Telemetría de uso
  useEffect(() => {
    if (enableTelemetry) {
      try {
        telemetry.track('accessibility.live_region.mount', {
          politeness,
          atomic,
          relevant,
          debugMode
        });
      } catch (error) {
      }
    }

    return () => {
      if (enableTelemetry) {
        try {
          telemetry.track('accessibility.live_region.unmount', {
            announcements_made: messageQueue.length
          });
        } catch (error) {
        }
      }
    };
  }, []);

  return {
    // Core announcement functions
    announce,
    announceLoading,
    announceSuccess,
    announceError,
    announceWarning,
    
    // Form-specific functions
    announceFormValidation,
    announceFormSaved,
    
    // Component props
    liveRegionProps,
    
    // State
    currentMessage,
    isActive: currentMessage.length > 0,
    queueLength: messageQueue.length
  };
};

export default useLiveRegionSafe;