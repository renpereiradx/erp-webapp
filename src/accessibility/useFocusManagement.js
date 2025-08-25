/**
 * Wave 4: UX & Accessibility Enterprise
 * Focus Management Hook - WCAG 2.1 AA Compliance
 * 
 * Gestiona el foco de manera accesible:
 * - Retorno de foco post-modal
 * - Trap de foco en componentes modales
 * - Skip links y navegación por teclado
 * - Persistencia del foco en navegación
 * 
 * @since Wave 4 - UX & Accessibility
 * @author Sistema ERP
 */

import { useRef, useCallback, useEffect } from 'react';
import { telemetry } from '@/lib/telemetry';

/**
 * Hook para gestión avanzada de foco
 * Implementa estándares WCAG 2.1 AA para navegación por teclado
 */
export const useFocusManagement = (options = {}) => {
  const {
    restoreOnUnmount = true,
    trapFocus = false,
    enableSkipLinks = true,
    enableTelemetry = true,
    debugMode = false
  } = options;

  // Referencias internas
  const savedFocusRef = useRef(null);
  const containerRef = useRef(null);
  const trapRef = useRef(null);
  const skipLinksRef = useRef([]);

  /**
   * Guarda el elemento actualmente enfocado
   */
  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement;
    
    // Solo guardamos si es un elemento focusable válido
    if (activeElement && activeElement !== document.body) {
      savedFocusRef.current = activeElement;
      
      if (enableTelemetry) {
        telemetry.record('accessibility.focus.saved', {
          elementType: activeElement.tagName,
          elementId: activeElement.id || null,
          elementClass: activeElement.className || null
        });
      }
      
      if (debugMode) {
        console.log('[FocusManagement] Focus saved:', activeElement);
      }
    }
  }, [enableTelemetry, debugMode]);

  /**
   * Restaura el foco al elemento previamente guardado
   */
  const restoreFocus = useCallback(() => {
    const elementToFocus = savedFocusRef.current;
    
    if (elementToFocus && document.contains(elementToFocus)) {
      try {
        elementToFocus.focus();
        
        if (enableTelemetry) {
          telemetry.record('accessibility.focus.restored', {
            elementType: elementToFocus.tagName,
            elementId: elementToFocus.id || null,
            success: true
          });
        }
        
        if (debugMode) {
          console.log('[FocusManagement] Focus restored to:', elementToFocus);
        }
      } catch (error) {
        console.warn('[FocusManagement] Failed to restore focus:', error);
        
        if (enableTelemetry) {
          telemetry.record('accessibility.focus.restore_failed', {
            error: error.message,
            elementType: elementToFocus.tagName
          });
        }
      }
    }
    
    // Limpiar referencia
    savedFocusRef.current = null;
  }, [enableTelemetry, debugMode]);

  /**
   * Encuentra todos los elementos focusables dentro de un contenedor
   */
  const getFocusableElements = useCallback((container) => {
    if (!container) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = container.querySelectorAll(focusableSelectors);
    
    // Filtrar elementos visibles
    return Array.from(elements).filter(element => {
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             element.offsetWidth > 0 && 
             element.offsetHeight > 0;
    });
  }, []);

  /**
   * Configura trap de foco en un contenedor (para modales)
   */
  const setupFocusTrap = useCallback((container) => {
    if (!container || !trapFocus) return null;

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return null;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab - navegar hacia atrás
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab - navegar hacia adelante
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        // Permitir que el componente padre maneje el escape
        event.preventDefault();
        restoreFocus();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    // Enfocar el primer elemento
    if (firstElement) {
      firstElement.focus();
    }

    if (enableTelemetry) {
      telemetry.record('accessibility.focus_trap.setup', {
        focusableCount: focusableElements.length,
        hasFirstElement: !!firstElement,
        hasLastElement: !!lastElement
      });
    }

    // Función de limpieza
    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
      
      if (enableTelemetry) {
        telemetry.record('accessibility.focus_trap.cleanup');
      }
    };
  }, [trapFocus, getFocusableElements, restoreFocus, enableTelemetry]);

  /**
   * Configura skip links para navegación rápida
   */
  const setupSkipLinks = useCallback(() => {
    if (!enableSkipLinks) return null;

    const skipLinks = [
      {
        id: 'skip-to-main',
        label: 'Saltar al contenido principal',
        target: '#main-content'
      },
      {
        id: 'skip-to-nav',
        label: 'Saltar a la navegación',
        target: '#main-navigation'
      }
    ];

    skipLinksRef.current = skipLinks;

    const handleSkipLink = (event, targetSelector) => {
      event.preventDefault();
      const targetElement = document.querySelector(targetSelector);
      
      if (targetElement) {
        targetElement.focus();
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        if (enableTelemetry) {
          telemetry.record('accessibility.skip_link.used', {
            target: targetSelector,
            success: true
          });
        }
      }
    };

    return {
      skipLinks,
      handleSkipLink
    };
  }, [enableSkipLinks, enableTelemetry]);

  /**
   * Hook para manejar navegación por flechas en listas/grids
   */
  const useArrowNavigation = useCallback((items, orientation = 'vertical') => {
    return useCallback((event, currentIndex) => {
      if (!items || items.length === 0) return;

      let nextIndex = currentIndex;
      
      switch (event.key) {
        case 'ArrowDown':
          if (orientation === 'vertical') {
            event.preventDefault();
            nextIndex = (currentIndex + 1) % items.length;
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical') {
            event.preventDefault();
            nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal') {
            event.preventDefault();
            nextIndex = (currentIndex + 1) % items.length;
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal') {
            event.preventDefault();
            nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          }
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = items.length - 1;
          break;
      }

      if (nextIndex !== currentIndex && items[nextIndex]) {
        const element = items[nextIndex];
        if (element.focus) {
          element.focus();
        }
        
        if (enableTelemetry) {
          telemetry.record('accessibility.arrow_navigation', {
            from: currentIndex,
            to: nextIndex,
            key: event.key,
            orientation
          });
        }
      }
    }, [items, orientation, enableTelemetry]);
  }, [enableTelemetry]);

  // Configuración automática en mount/unmount
  useEffect(() => {
    if (restoreOnUnmount) {
      return () => {
        restoreFocus();
      };
    }
  }, [restoreOnUnmount, restoreFocus]);

  return {
    // Funciones principales
    saveFocus,
    restoreFocus,
    setupFocusTrap,
    setupSkipLinks,
    useArrowNavigation,
    
    // Utilidades
    getFocusableElements,
    
    // Referencias
    containerRef,
    skipLinksRef,
    
    // Estado
    hasSavedFocus: !!savedFocusRef.current
  };
};

export default useFocusManagement;
