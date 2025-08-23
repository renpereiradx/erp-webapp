/**
 * Hook para gestión de tooltips usando Tooltip component
 * Proporciona funcionalidad básica de mostrar/ocultar tooltips
 */

import { useState, useCallback } from 'react';

export const useTooltip = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');

  const show = useCallback((tooltipContent) => {
    setContent(tooltipContent);
    setIsOpen(true);
  }, []);

  const hide = useCallback(() => {
    setIsOpen(false);
    setContent('');
  }, []);

  const toggle = useCallback((tooltipContent) => {
    if (isOpen) {
      hide();
    } else {
      show(tooltipContent);
    }
  }, [isOpen, show, hide]);

  return {
    isOpen,
    content,
    show,
    hide,
    toggle
  };
};

export default useTooltip;
