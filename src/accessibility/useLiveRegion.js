/**
 * Wave 4: UX & Accessibility Enterprise
 * Live Region Hook - WCAG 2.1 AA Compliance
 * 
 * Gestiona regiones activas para anuncios a screen readers:
 * - Anuncios de estado (loading, success, error)
 * - Notificaciones contextuales 
 * - Cambios dinámicos de contenido
 * - Soporte aria-live y aria-atomic
 * 
 * @since Wave 4 - UX & Accessibility
 * @author Sistema ERP
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { telemetry } from '@/lib/telemetry';

/**
 * Hook para gestión de regiones ARIA live
 * Implementa anuncios accesibles según WCAG 2.1 AA
 */
export const useLiveRegion = (options = {}) => {
  const {
    politeness = 'polite', // 'polite' | 'assertive' | 'off'
    atomic = true,
    relevant = 'additions text',
    enableTelemetry = true,
    debugMode = false,
    clearDelay = 5000 // Tiempo para limpiar anuncios automáticamente
  } = options;

  // Estados y referencias
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageQueue, setMessageQueue] = useState([]);
  const liveRegionRef = useRef(null);
  const timeoutRef = useRef(null);
  const processQueueTimeoutRef = useRef(null);

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

    if (enableTelemetry) {
      telemetry.record('accessibility.live_region.announce', {
        messageLength: message.length,
        priority,
        queueLength: messageQueue.length
      });
    }

    if (debugMode) {
      console.log('[LiveRegion] Announcing:', announcement);
    }

    // Si es assertive, anunciar inmediatamente
    if (priority === 'assertive') {
      setCurrentMessage(message);
      
      // Configurar limpieza automática
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setCurrentMessage('');
      }, clearDelay);
    } else {
      // Agregar a la cola para anuncios polite
      setMessageQueue(prevQueue => [...prevQueue, announcement]);
    }
  }, [messageQueue.length, enableTelemetry, debugMode, clearDelay]);

  /**
   * Procesa la cola de mensajes para anuncios polite
   */
  const processQueue = useCallback(() => {
    setMessageQueue(prevQueue => {
      if (prevQueue.length === 0) return prevQueue;
      
      const [nextMessage, ...remainingQueue] = prevQueue;
      
      setCurrentMessage(nextMessage.message);
      
      if (enableTelemetry) {
        telemetry.record('accessibility.live_region.queue_processed', {
          messageId: nextMessage.id,
          remainingQueueLength: remainingQueue.length
        });
      }
      
      // Configurar limpieza automática
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setCurrentMessage('');
        
        // Procesar siguiente mensaje en la cola después de un breve delay
        if (remainingQueue.length > 0) {
          processQueueTimeoutRef.current = setTimeout(processQueue, 100);
        }
      }, clearDelay);
      
      return remainingQueue;
    });
  }, [enableTelemetry, clearDelay]);

  /**
   * Anuncios específicos para estados comunes
   */
  const announceLoading = useCallback((context = '') => {
    const message = context 
      ? `Cargando ${context}...` 
      : 'Cargando contenido...';
    announce(message, 'polite');
  }, [announce]);

  const announceSuccess = useCallback((action = '') => {
    const message = action 
      ? `${action} completado exitosamente` 
      : 'Operación completada exitosamente';
    announce(message, 'polite');
  }, [announce]);

  const announceError = useCallback((error = '', context = '') => {
    const baseMessage = error || 'Ha ocurrido un error';
    const message = context 
      ? `Error en ${context}: ${baseMessage}` 
      : baseMessage;
    announce(message, 'assertive');
  }, [announce]);

  const announceWarning = useCallback((warning = '', context = '') => {
    const baseMessage = warning || 'Advertencia';
    const message = context 
      ? `Advertencia en ${context}: ${baseMessage}` 
      : baseMessage;
    announce(message, 'assertive');
  }, [announce]);

  /**
   * Anuncios específicos para navegación
   */
  const announceNavigation = useCallback((location, totalItems = null) => {
    let message = `Navegando a ${location}`;
    if (totalItems) {
      message += `. ${totalItems} elementos disponibles`;
    }
    announce(message, 'polite');
  }, [announce]);

  const announcePage = useCallback((currentPage, totalPages) => {
    const message = `Página ${currentPage} de ${totalPages}`;
    announce(message, 'polite');
  }, [announce]);

  /**
   * Anuncios para formularios
   */
  const announceFormValidation = useCallback((fieldName, error) => {
    const message = `Error en ${fieldName}: ${error}`;
    announce(message, 'assertive');
  }, [announce]);

  const announceFormSaved = useCallback((formType = 'formulario') => {
    const message = `${formType} guardado exitosamente`;
    announce(message, 'polite');
  }, [announce]);

  /**
   * Anuncios para tablas y listas
   */
  const announceTableUpdate = useCallback((itemCount, tableType = 'tabla') => {
    const message = `${tableType} actualizada. ${itemCount} elementos mostrados`;
    announce(message, 'polite');
  }, [announce]);

  const announceSelectionChange = useCallback((selectedCount, totalCount, itemType = 'elementos') => {
    const message = selectedCount === 0 
      ? `Selección eliminada. ${totalCount} ${itemType} disponibles`
      : `${selectedCount} de ${totalCount} ${itemType} seleccionados`;
    announce(message, 'polite');
  }, [announce]);

  /**
   * Limpia mensajes y cola inmediatamente
   */
  const clear = useCallback(() => {
    setCurrentMessage('');
    setMessageQueue([]);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (processQueueTimeoutRef.current) {
      clearTimeout(processQueueTimeoutRef.current);
    }

    if (enableTelemetry) {
      telemetry.record('accessibility.live_region.cleared');
    }
  }, [enableTelemetry]);

  // Procesamiento automático de la cola
  useEffect(() => {
    if (messageQueue.length > 0 && !currentMessage) {
      processQueueTimeoutRef.current = setTimeout(processQueue, 100);
    }
    
    return () => {
      if (processQueueTimeoutRef.current) {
        clearTimeout(processQueueTimeoutRef.current);
      }
    };
  }, [messageQueue.length, currentMessage, processQueue]);

  // Limpieza en unmount
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
   * Props para el elemento DOM de la región live
   */
  const liveRegionProps = {
    ref: liveRegionRef,
    'aria-live': politeness,
    'aria-atomic': atomic,
    'aria-relevant': relevant,
    role: 'status',
    className: 'sr-only', // Visible solo para screen readers
    children: currentMessage
  };

  return {
    // Función principal
    announce,
    
    // Anuncios específicos de estado
    announceLoading,
    announceSuccess,
    announceError,
    announceWarning,
    
    // Anuncios de navegación
    announceNavigation,
    announcePage,
    
    // Anuncios de formularios
    announceFormValidation,
    announceFormSaved,
    
    // Anuncios de tablas
    announceTableUpdate,
    announceSelectionChange,
    
    // Utilidades
    clear,
    
    // Props para el componente DOM
    liveRegionProps,
    
    // Estado actual
    currentMessage,
    queueLength: messageQueue.length,
    isProcessing: messageQueue.length > 0 || !!currentMessage
  };
};

/**
 * Componente wrapper para la región live
 * Uso: <LiveRegion {...liveRegionProps} />
 */
export const LiveRegion = ({ children, ...props }) => {
  return (
    <div {...props}>
      {children}
    </div>
  );
};

export default useLiveRegion;
