/**
 * Enhanced Modal Component
 * Modal enriquecido y reutilizable con estilos temáticos avanzados
 * Incluye animaciones, efectos visuales y accesibilidad
 */

import React, { useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';

const MODAL_VARIANTS = {
  default: {
    icon: null,
    iconColor: '',
    borderColor: 'border-border'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    borderColor: 'border-green-200'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    borderColor: 'border-yellow-200'
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-600',
    borderColor: 'border-red-200'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  }
};

const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl'
};

const EnhancedModal = ({
  isOpen = false,
  onClose,
  title,
  subtitle = '',
  children,
  variant = 'default',
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  footerClassName = '',
  loading = false,
  testId = 'enhanced-modal'
}) => {
  const { t } = useI18n();
  const { styles, isNeoBrutalism } = useThemeStyles();
  const modalRef = useRef(null);
  const previousFocus = useRef(null);

  const variantConfig = MODAL_VARIANTS[variant] || MODAL_VARIANTS.default;
  const IconComponent = variantConfig.icon;

  // Focus management y escape key
  useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element
    previousFocus.current = document.activeElement;

    // Focus modal
    const modalElement = modalRef.current;
    if (modalElement) {
      modalElement.focus();
    }

    // Handle escape key
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      
      // Restore focus
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const getModalStyles = () => {
    const baseStyles = `
      transform transition-all duration-300 ease-out
      ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
    `;

    if (isNeoBrutalism) {
      return `
        ${baseStyles}
        bg-background border-4 border-black 
        shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
        ${variantConfig.borderColor}
      `;
    }

    return `
      ${baseStyles}
      ${styles.card()}
      ${variantConfig.borderColor}
      shadow-2xl backdrop-blur-sm
    `;
  };

  const getOverlayStyles = () => {
    if (isNeoBrutalism) {
      return `
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/70 backdrop-blur-sm
        animate-in fade-in duration-200
      `;
    }

    return `
      fixed inset-0 z-50 flex items-center justify-center p-4
      bg-black/50 backdrop-blur-sm
      animate-in fade-in duration-200
    `;
  };

  return (
    <div
      className={`${getOverlayStyles()} ${overlayClassName}`}
      onClick={handleOverlayClick}
      data-testid={`${testId}-overlay`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${testId}-title` : undefined}
    >
      <div
        ref={modalRef}
        className={`
          ${getModalStyles()}
          ${MODAL_SIZES[size]}
          w-full max-h-[90vh] overflow-hidden
          ${className}
        `}
        data-testid={testId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`
          flex items-center justify-between p-6 pb-4
          ${headerClassName}
        `}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {IconComponent && (
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full
                ${isNeoBrutalism ? 'bg-yellow-200 border-2 border-black' : 'bg-muted'}
              `}>
                <IconComponent className={`w-5 h-5 ${variantConfig.iconColor}`} />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              {title && (
                <h2
                  id={`${testId}-title`}
                  className={`
                    ${styles.header('h3')} 
                    ${isNeoBrutalism ? 'font-black text-lg' : 'font-semibold text-lg'}
                    truncate
                  `}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className={`text-sm ${styles.body('muted')} mt-1 truncate`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={`
                ml-4 flex-shrink-0
                ${isNeoBrutalism ? 'border-2 border-black hover:bg-red-100' : ''}
              `}
              data-testid={`${testId}-close-button`}
              aria-label={t('modal.close', 'Cerrar modal')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className={`
          px-6 flex-1 overflow-y-auto
          ${contentClassName}
        `}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className={`
                animate-spin w-8 h-8 border-4 rounded-full
                ${isNeoBrutalism 
                  ? 'border-black border-t-transparent' 
                  : 'border-primary border-t-transparent'
                }
              `} />
              <span className="ml-3 text-sm text-muted-foreground">
                {t('modal.loading', 'Cargando...')}
              </span>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`
            px-6 py-4 mt-6 border-t
            ${isNeoBrutalism ? 'border-black border-t-2' : 'border-border'}
            ${footerClassName}
          `}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Hook personalizado para facilitar el uso
export const useEnhancedModal = (initialState = false) => {
  const [isOpen, setIsOpen] = React.useState(initialState);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  };
};

// Componente de confirmación reutilizable
export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'warning',
  loading = false,
  ...props
}) => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();

  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={onClose}
        disabled={loading}
        className={styles.button('secondary')}
      >
        {cancelText || t('modal.cancel', 'Cancelar')}
      </Button>
      <Button
        variant={variant === 'error' ? 'destructive' : 'primary'}
        onClick={onConfirm}
        disabled={loading}
        className={styles.button(variant === 'error' ? 'destructive' : 'primary')}
      >
        {loading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            {t('modal.processing', 'Procesando...')}
          </>
        ) : (
          confirmText || t('modal.confirm', 'Confirmar')
        )}
      </Button>
    </div>
  );

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={variant}
      size="sm"
      footer={footer}
      {...props}
    >
      <div className="py-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {message}
        </p>
      </div>
    </EnhancedModal>
  );
};

export default EnhancedModal;
