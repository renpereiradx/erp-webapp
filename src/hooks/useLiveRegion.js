/**
 * useLiveRegion Hook
 * Manages ARIA live regions for accessibility announcements
 */

import { useRef, useCallback } from 'react';

/**
 * Hook para gestionar regiones ARIA live para anuncios de accesibilidad
 * @param {Object} options - Opciones de configuración
 * @param {string} options.politeness - Nivel de cortesía: 'polite' | 'assertive'
 * @param {boolean} options.atomic - Si el anuncio es atómico
 * @returns {Object} - Funciones y refs para manejo de la región live
 */
export function useLiveRegion(options = {}) {
  const {
    politeness = 'polite',
    atomic = false
  } = options;

  const liveRegionRef = useRef(null);
  const timeoutRef = useRef(null);

  /**
   * Anuncia un mensaje en la región live
   * @param {string} message - Mensaje a anunciar
   * @param {Object} announceOptions - Opciones adicionales
   */
  const announce = useCallback((message, announceOptions = {}) => {
    if (!liveRegionRef.current) return;

    const {
      clearPrevious = true,
      delay = 100
    } = announceOptions;

    // Limpia timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Limpia contenido anterior si se solicita
    if (clearPrevious) {
      liveRegionRef.current.textContent = '';
    }

    // Agrega el nuevo mensaje con un pequeño delay para asegurar que sea anunciado
    timeoutRef.current = setTimeout(() => {
      if (liveRegionRef.current) {
        if (clearPrevious) {
          liveRegionRef.current.textContent = message;
        } else {
          liveRegionRef.current.textContent += ' ' + message;
        }
      }
    }, delay);
  }, []);

  /**
   * Limpia la región live
   */
  const clear = useCallback(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  /**
   * Props para aplicar al elemento de región live
   */
  const liveRegionProps = {
    ref: liveRegionRef,
    'aria-live': politeness,
    'aria-atomic': atomic,
    className: 'sr-only', // Screen reader only
    role: politeness === 'assertive' ? 'alert' : 'status'
  };

  /**
   * Componente de regiones live para usar en JSX
   */
  const LiveRegions = () => (
    <div {...liveRegionProps} />
  );

  return {
    announce,
    clear,
    liveRegionRef,
    liveRegionProps,
    LiveRegions
  };
}

export default useLiveRegion;
