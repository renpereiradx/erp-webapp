import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook para gestión avanzada de focus y accesibilidad
 * Maneja el retorno de focus después de modales y acciones
 */
export const useFocusManagement = () => {
  const lastFocusedElementRef = useRef(null);
  const modalContainerRef = useRef(null);
  
  // Guardar el elemento que tenía focus antes de abrir modal
  const saveFocus = useCallback(() => {
    lastFocusedElementRef.current = document.activeElement;
    console.log('[a11y] Focus saved:', lastFocusedElementRef.current?.tagName);
  }, []);

  // Restaurar focus al elemento que lo tenía antes
  const restoreFocus = useCallback(() => {
    if (lastFocusedElementRef.current && typeof lastFocusedElementRef.current.focus === 'function') {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        lastFocusedElementRef.current?.focus();
        console.log('[a11y] Focus restored to:', lastFocusedElementRef.current?.tagName);
      }, 100);
    }
  }, []);

  // Enfocar el primer elemento focuseable en un contenedor
  const focusFirstElement = useCallback((container) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      console.log('[a11y] Focus set to first element:', focusableElements[0].tagName);
    }
  }, []);

  // Trap focus dentro de un modal
  const trapFocus = useCallback((event, container) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Si es Tab y estamos en el último elemento, ir al primero
    if (event.key === 'Tab' && !event.shiftKey && event.target === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }

    // Si es Shift+Tab y estamos en el primer elemento, ir al último
    if (event.key === 'Tab' && event.shiftKey && event.target === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  }, []);

  // Hook para configurar modal focus management
  const useModalFocus = useCallback((isOpen) => {
    useEffect(() => {
      if (isOpen) {
        saveFocus();
        
        // Enfocar modal cuando se abre
        const timer = setTimeout(() => {
          if (modalContainerRef.current) {
            focusFirstElement(modalContainerRef.current);
          }
        }, 100);

        // Event listener para Escape
        const handleEscape = (event) => {
          if (event.key === 'Escape') {
            console.log('[a11y] Escape pressed in modal');
          }
        };

        // Event listener para trap focus
        const handleKeyDown = (event) => {
          if (modalContainerRef.current) {
            trapFocus(event, modalContainerRef.current);
          }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
          clearTimeout(timer);
          document.removeEventListener('keydown', handleEscape);
          document.removeEventListener('keydown', handleKeyDown);
        };
      } else {
        // Restaurar focus cuando se cierra
        restoreFocus();
      }
    }, [isOpen, saveFocus, restoreFocus, focusFirstElement, trapFocus]);

    return modalContainerRef;
  }, [saveFocus, restoreFocus, focusFirstElement, trapFocus]);

  // Anunciar cambios a screen readers
  const announce = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remover después de que se haya leído
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);

    console.log(`[a11y] Announced (${priority}):`, message);
  }, []);

  // Gestionar focus en listas navegables por teclado
  const useListNavigation = useCallback((items, currentIndex, onIndexChange) => {
    const handleKeyDown = useCallback((event) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, items.length - 1);
          onIndexChange(nextIndex);
          break;
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          onIndexChange(prevIndex);
          break;
        case 'Home':
          event.preventDefault();
          onIndexChange(0);
          break;
        case 'End':
          event.preventDefault();
          onIndexChange(items.length - 1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          // Trigger action on current item
          const currentItem = items[currentIndex];
          if (currentItem && currentItem.onClick) {
            currentItem.onClick();
          }
          break;
      }
    }, [items, currentIndex, onIndexChange]);

    return { handleKeyDown };
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirstElement,
    trapFocus,
    useModalFocus,
    announce,
    useListNavigation,
    modalContainerRef
  };
};

export default useFocusManagement;
