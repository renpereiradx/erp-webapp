/**
 * Accessibility Hooks - Wave 4 UX & Accessibility
 * Hooks para gestión de accesibilidad WCAG 2.1 AA
 * 
 * @since Wave 4 - UX & Accessibility Enterprise
 * @author Sistema ERP
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook principal de accesibilidad
 * Gestiona características globales de accesibilidad
 */
export const useAccessibility = () => {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  
  useEffect(() => {
    // Detectar reducción de movimiento
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    
    const handleMotionChange = (e) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);
    
    // Detectar alto contraste
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrastMode(contrastQuery.matches);
    
    const handleContrastChange = (e) => setHighContrastMode(e.matches);
    contrastQuery.addEventListener('change', handleContrastChange);
    
    // Detectar uso de teclado
    const handleKeyDown = () => setKeyboardNavigation(true);
    const handleMouseDown = () => setKeyboardNavigation(false);
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    
    // Detectar screen reader (heurística)
    const detectScreenReader = () => {
      // Técnicas para detectar screen readers
      const hasScreenReader = 
        navigator.userAgent.includes('NVDA') ||
        navigator.userAgent.includes('JAWS') ||
        navigator.userAgent.includes('VoiceOver') ||
        window.speechSynthesis ||
        document.documentElement.getAttribute('aria-hidden') !== null;
      
      setScreenReaderEnabled(hasScreenReader);
    };
    
    detectScreenReader();
    
    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  return {
    screenReaderEnabled,
    highContrastMode,
    reducedMotion,
    keyboardNavigation,
    
    // Utilidades
    shouldReduceMotion: reducedMotion,
    shouldUseHighContrast: highContrastMode,
    isUsingKeyboard: keyboardNavigation,
    isUsingScreenReader: screenReaderEnabled
  };
};

/**
 * Hook para gestión de focus
 * Maneja el foco de manera accesible
 */
export const useFocusManagement = () => {
  const focusHistoryRef = useRef([]);
  const trapRef = useRef(null);
  
  // Guardar el elemento actualmente enfocado
  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement;
    if (activeElement && activeElement !== document.body) {
      focusHistoryRef.current.push(activeElement);
    }
  }, []);
  
  // Restaurar el foco al último elemento guardado
  const restoreFocus = useCallback(() => {
    const lastFocused = focusHistoryRef.current.pop();
    if (lastFocused && typeof lastFocused.focus === 'function') {
      try {
        lastFocused.focus();
      } catch (error) {
        console.warn('No se pudo restaurar el foco:', error);
      }
    }
  }, []);
  
  // Establecer foco en un elemento específico
  const setFocus = useCallback((element) => {
    if (!element) return;
    
    if (typeof element === 'string') {
      const targetElement = document.querySelector(element);
      if (targetElement) {
        targetElement.focus();
      }
    } else if (typeof element.focus === 'function') {
      element.focus();
    }
  }, []);
  
  // Trap de foco para modales
  const trapFocus = useCallback((containerRef) => {
    if (!containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    containerRef.current.addEventListener('keydown', handleKeyDown);
    
    // Enfocar el primer elemento
    if (firstElement) {
      firstElement.focus();
    }
    
    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Encontrar el siguiente elemento enfocable
  const findNextFocusable = useCallback((direction = 'forward') => {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    
    const currentIndex = focusableElements.indexOf(document.activeElement);
    
    if (direction === 'forward') {
      const nextIndex = (currentIndex + 1) % focusableElements.length;
      return focusableElements[nextIndex];
    } else {
      const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
      return focusableElements[prevIndex];
    }
  }, []);
  
  return {
    saveFocus,
    restoreFocus,
    setFocus,
    trapFocus,
    findNextFocusable,
    focusHistory: focusHistoryRef.current
  };
};

/**
 * Hook para anuncios a lectores de pantalla
 * Gestiona aria-live regions para notificaciones
 */
export const useScreenReaderAnnouncement = () => {
  const [announcements, setAnnouncements] = useState([]);
  
  const announce = useCallback((message, priority = 'polite') => {
    const id = `announcement-${Date.now()}`;
    const announcement = { id, message, priority, timestamp: Date.now() };
    
    setAnnouncements(prev => [...prev, announcement]);
    
    // Limpiar el anuncio después de un tiempo
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 5000);
  }, []);
  
  const announceError = useCallback((message) => {
    announce(message, 'assertive');
  }, [announce]);
  
  const announceSuccess = useCallback((message) => {
    announce(message, 'polite');
  }, [announce]);
  
  const announceStatus = useCallback((message) => {
    announce(message, 'status');
  }, [announce]);
  
  // Componente para renderizar los anuncios
  const AnnouncementRegion = () => (
    <>
      {announcements.map(announcement => (
        <div
          key={announcement.id}
          aria-live={announcement.priority}
          aria-atomic="true"
          className="sr-only"
        >
          {announcement.message}
        </div>
      ))}
    </>
  );
  
  return {
    announce,
    announceError,
    announceSuccess,
    announceStatus,
    AnnouncementRegion,
    announcements
  };
};

/**
 * Hook para navegación por teclado
 * Gestiona shortcuts y navegación con teclado
 */
export const useKeyboardNavigation = (shortcuts = {}) => {
  const [activeShortcuts, setActiveShortcuts] = useState({});
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Construir la combinación de teclas
      const combination = [];
      if (e.ctrlKey) combination.push('ctrl');
      if (e.altKey) combination.push('alt');
      if (e.shiftKey) combination.push('shift');
      if (e.metaKey) combination.push('meta');
      combination.push(e.key.toLowerCase());
      
      const shortcutKey = combination.join('+');
      
      if (shortcuts[shortcutKey]) {
        e.preventDefault();
        shortcuts[shortcutKey](e);
        
        // Feedback visual del shortcut activado
        setActiveShortcuts(prev => ({
          ...prev,
          [shortcutKey]: true
        }));
        
        setTimeout(() => {
          setActiveShortcuts(prev => ({
            ...prev,
            [shortcutKey]: false
          }));
        }, 200);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
  
  // Función para registrar shortcuts dinámicamente
  const registerShortcut = useCallback((combination, handler) => {
    setActiveShortcuts(prev => ({
      ...prev,
      [combination]: handler
    }));
  }, []);
  
  // Función para desregistrar shortcuts
  const unregisterShortcut = useCallback((combination) => {
    setActiveShortcuts(prev => {
      const { [combination]: removed, ...rest } = prev;
      return rest;
    });
  }, []);
  
  return {
    activeShortcuts,
    registerShortcut,
    unregisterShortcut
  };
};

/**
 * Hook para validación de contraste
 * Verifica que los colores cumplan WCAG 2.1 AA
 */
export const useContrastValidation = () => {
  const validateContrast = useCallback((foreground, background, level = 'AA') => {
    // Función para convertir hex a RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    // Función para calcular luminancia relativa
    const getLuminance = (r, g, b) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };
    
    // Calcular ratio de contraste
    const fg = hexToRgb(foreground);
    const bg = hexToRgb(background);
    
    if (!fg || !bg) return { valid: false, ratio: 0 };
    
    const fgLuminance = getLuminance(fg.r, fg.g, fg.b);
    const bgLuminance = getLuminance(bg.r, bg.g, bg.b);
    
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                  (Math.min(fgLuminance, bgLuminance) + 0.05);
    
    // Verificar cumplimiento WCAG
    const requirements = {
      'AA': { normal: 4.5, large: 3.0 },
      'AAA': { normal: 7.0, large: 4.5 }
    };
    
    const requirement = requirements[level];
    
    return {
      valid: ratio >= requirement.normal,
      validLarge: ratio >= requirement.large,
      ratio: Math.round(ratio * 100) / 100,
      level
    };
  }, []);
  
  return { validateContrast };
};

export default {
  useAccessibility,
  useFocusManagement,
  useScreenReaderAnnouncement,
  useKeyboardNavigation,
  useContrastValidation
};
