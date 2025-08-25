/**
 * Wave 4: UX & Accessibility Enterprise
 * Accessible Modal Component - WCAG 2.1 AA Compliant
 * 
 * Características implementadas:
 * - Focus trap y gestión de foco
 * - Escape key para cerrar
 * - Click outside para cerrar
 * - ARIA attributes correctos
 * - Live region announcements
 * - Keyboard navigation completa
 * 
 * @since Wave 4 - UX & Accessibility
 * @author Sistema ERP
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/i18n/hooks';
import { useThemeStyles } from '@/themes/themeUtils';
import { useFocusManagement, useLiveRegion } from '@/accessibility';
import { telemetry } from '@/lib/telemetry';

/**
 * Modal accesible según estándares WCAG 2.1 AA
 */
export const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  preventClickOutside = false,
  preventEscapeKey = false,
  modalId,
  ariaDescribedBy,
  className = '',
  enableTelemetry = true,
  ...props
}) => {
  const { t } = useI18n();
  const { modal: themeModal, button: themeButton } = useThemeStyles();
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  
  // Hooks de accesibilidad
  const {
    saveFocus,
    restoreFocus,
    setupFocusTrap,
    getFocusableElements
  } = useFocusManagement({
    trapFocus: true,
    enableTelemetry
  });

  const {
    announce,
    liveRegionProps
  } = useLiveRegion({
    enableTelemetry
  });

  /**
   * Genera ID único para el modal si no se proporciona
   */
  const uniqueModalId = modalId || `modal-${Date.now()}`;
  const titleId = `${uniqueModalId}-title`;
  const descriptionId = ariaDescribedBy || `${uniqueModalId}-description`;

  /**
   * Tamaños de modal disponibles
   */
  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-md',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl',
    fullscreen: 'max-w-full h-full'
  };

  /**
   * Maneja el cierre del modal
   */
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
    
    if (enableTelemetry) {
      telemetry.record('accessibility.modal.closed', {
        modalId: uniqueModalId,
        closeMethod: 'button'
      });
    }
  }, [onClose, enableTelemetry, uniqueModalId]);

  /**
   * Maneja las teclas del teclado
   */
  const handleKeyDown = useCallback((event) => {
    // Escape para cerrar
    if (event.key === 'Escape' && !preventEscapeKey) {
      event.preventDefault();
      handleClose();
      
      if (enableTelemetry) {
        telemetry.record('accessibility.modal.closed', {
          modalId: uniqueModalId,
          closeMethod: 'escape'
        });
      }
    }
  }, [handleClose, preventEscapeKey, enableTelemetry, uniqueModalId]);

  /**
   * Maneja el click fuera del modal
   */
  const handleBackdropClick = useCallback((event) => {
    if (!preventClickOutside && event.target === event.currentTarget) {
      handleClose();
      
      if (enableTelemetry) {
        telemetry.record('accessibility.modal.closed', {
          modalId: uniqueModalId,
          closeMethod: 'backdrop'
        });
      }
    }
  }, [handleClose, preventClickOutside, enableTelemetry, uniqueModalId]);

  /**
   * Configuración del modal al abrir/cerrar
   */
  useEffect(() => {
    if (isOpen) {
      // Guardar el foco actual
      saveFocus();
      
      // Configurar trap de foco
      let cleanupFocusTrap = null;
      if (modalRef.current) {
        cleanupFocusTrap = setupFocusTrap(modalRef.current);
      }
      
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
      
      // Anunciar apertura del modal
      announce(t('accessibility.modals.modalOpened', { title }));
      
      if (enableTelemetry) {
        telemetry.record('accessibility.modal.opened', {
          modalId: uniqueModalId,
          title,
          size
        });
      }
      
      return () => {
        // Limpiar focus trap
        if (cleanupFocusTrap) {
          cleanupFocusTrap();
        }
        
        // Restaurar scroll
        document.body.style.overflow = '';
        
        // Restaurar foco
        restoreFocus();
        
        // Anunciar cierre del modal
        announce(t('accessibility.modals.modalClosed'));
      };
    }
  }, [
    isOpen,
    saveFocus,
    restoreFocus,
    setupFocusTrap,
    announce,
    t,
    title,
    enableTelemetry,
    uniqueModalId,
    size
  ]);

  /**
   * Event listeners globales
   */
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  // No renderizar si el modal está cerrado
  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <>
      {/* Live Region para anuncios */}
      <div {...liveRegionProps} />
      
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 overflow-y-auto ${themeModal.backdrop}`}
        onClick={handleBackdropClick}
        role="presentation"
      >
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Modal Container */}
          <div
            ref={modalRef}
            className={`
              relative w-full ${sizeClasses[size]} 
              ${themeModal.container}
              ${className}
            `}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={ariaDescribedBy ? descriptionId : undefined}
            id={uniqueModalId}
            {...props}
          >
            {/* Header */}
            <div className={themeModal.header}>
              <h2 
                id={titleId}
                className={themeModal.title}
              >
                {title}
              </h2>
              
              <button
                type="button"
                className={`${themeButton.icon} ${themeModal.closeButton}`}
                onClick={handleClose}
                aria-label={t('accessibility.modals.closeModal')}
                title={t('accessibility.modals.closeModal')}
              >
                <XIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            
            {/* Content */}
            <div 
              className={themeModal.content}
              id={ariaDescribedBy ? descriptionId : undefined}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Renderizar en portal para evitar problemas de z-index
  return createPortal(modalContent, document.body);
};

/**
 * Hook para gestionar múltiples modales accesibles
 */
export const useAccessibleModals = () => {
  const [modals, setModals] = React.useState({});
  
  const openModal = useCallback((modalId, modalProps) => {
    setModals(prev => ({
      ...prev,
      [modalId]: { ...modalProps, isOpen: true }
    }));
  }, []);
  
  const closeModal = useCallback((modalId) => {
    setModals(prev => ({
      ...prev,
      [modalId]: { ...prev[modalId], isOpen: false }
    }));
  }, []);
  
  const closeAllModals = useCallback(() => {
    setModals(prev => {
      const updated = {};
      Object.keys(prev).forEach(id => {
        updated[id] = { ...prev[id], isOpen: false };
      });
      return updated;
    });
  }, []);
  
  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    hasOpenModals: Object.values(modals).some(modal => modal.isOpen)
  };
};

/**
 * Componente de confirmación accesible
 */
export const AccessibleConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  ...props
}) => {
  const { t } = useI18n();
  const { button: themeButton } = useThemeStyles();
  
  const handleConfirm = useCallback(() => {
    onConfirm?.();
  }, [onConfirm]);
  
  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);
  
  const variantClasses = {
    danger: themeButton.danger,
    warning: themeButton.warning,
    primary: themeButton.primary
  };
  
  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="small"
      preventClickOutside={true}
      modalId="confirm-modal"
      ariaDescribedBy="confirm-description"
      {...props}
    >
      <div className="space-y-4">
        <p id="confirm-description" className="text-gray-700 dark:text-gray-300">
          {message}
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className={themeButton.secondary}
            onClick={handleCancel}
            autoFocus
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            className={variantClasses[variant]}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
};

export default AccessibleModal;
