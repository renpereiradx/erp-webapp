/**
 * Accessible Components - Wave 4 UX & Accessibility
 * Componentes base para accesibilidad WCAG 2.1 AA
 * 
 * @since Wave 4 - UX & Accessibility Enterprise
 * @author Sistema ERP
 */

import React, { useEffect, useRef, forwardRef } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useFocusManagement } from '../accessibility/hooks';

/**
 * Componente solo para lectores de pantalla
 * Contenido visible únicamente para tecnologías asistivas
 */
export const ScreenReaderOnly = ({ children, as: Component = 'span', ...props }) => (
  <Component
    className="sr-only"
    {...props}
  >
    {children}
  </Component>
);

/**
 * Skip Link para navegación rápida
 * Permite saltar al contenido principal
 */
export const SkipLink = ({ href = '#main-content', children = 'Saltar al contenido principal' }) => (
  <a
    href={href}
    className="
      absolute top-0 left-0 z-[9999] px-4 py-2
      bg-blue-600 text-white font-medium
      transform -translate-y-full
      focus:translate-y-0
      focus:outline-none focus:ring-2 focus:ring-blue-300
      transition-transform duration-200
    "
  >
    {children}
  </a>
);

/**
 * Focus Trap para modales y dropdowns
 * Atrapa el foco dentro del componente
 */
export const FocusTrap = forwardRef(({ 
  children, 
  active = true, 
  restoreOnUnmount = true,
  ...props 
}, ref) => {
  const containerRef = useRef(null);
  const { trapFocus, saveFocus, restoreFocus } = useFocusManagement();
  
  useEffect(() => {
    if (!active) return;
    
    saveFocus();
    const cleanup = trapFocus(containerRef);
    
    return () => {
      cleanup?.();
      if (restoreOnUnmount) {
        restoreFocus();
      }
    };
  }, [active, trapFocus, saveFocus, restoreFocus, restoreOnUnmount]);
  
  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (ref) {
          if (typeof ref === 'function') ref(node);
          else ref.current = node;
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
});

FocusTrap.displayName = 'FocusTrap';

/**
 * Aria Live Region para anuncios dinámicos
 * Anuncia cambios a lectores de pantalla
 */
export const AriaLive = ({ 
  children, 
  priority = 'polite', 
  atomic = true,
  relevant = 'additions text',
  className = ''
}) => (
  <div
    aria-live={priority}
    aria-atomic={atomic}
    aria-relevant={relevant}
    className={`${className} ${!children ? 'sr-only' : ''}`}
  >
    {children}
  </div>
);

/**
 * Botón accesible con estados ARIA completos
 */
export const AccessibleButton = forwardRef(({
  children,
  loading = false,
  loadingText = 'Cargando...',
  disabled = false,
  pressed = undefined,
  expanded = undefined,
  controls = undefined,
  describedBy = undefined,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}, ref) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium
    focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg'
  };
  
  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.md;
  
  const handleClick = (e) => {
    if (loading || disabled) return;
    onClick?.(e);
  };
  
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-describedby={describedBy}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <>
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <ScreenReaderOnly>{loadingText}</ScreenReaderOnly>
        </>
      )}
      
      {Icon && !loading && iconPosition === 'left' && (
        <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
      )}
      
      <span>{children}</span>
      
      {Icon && !loading && iconPosition === 'right' && (
        <Icon className="h-4 w-4 ml-2" aria-hidden="true" />
      )}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

/**
 * Modal accesible con gestión de foco y ARIA
 */
export const AccessibleModal = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  size = 'md'
}) => {
  const modalRef = useRef(null);
  const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;
  const descId = `modal-desc-${Math.random().toString(36).substr(2, 9)}`;
  
  useEffect(() => {
    if (!isOpen) return;
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    // Manejar escape
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);
  
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  const sizeClass = sizes[size] || sizes.md;
  
  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] overflow-y-auto"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
    >
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <FocusTrap active={isOpen}>
          <div
            ref={modalRef}
            className={`
              relative bg-white rounded-lg shadow-xl w-full ${sizeClass}
              transform transition-all duration-200
            `}
          >
            {/* Header */}
            {(title || onClose) && (
              <div className="flex items-center justify-between p-6 border-b">
                {title && (
                  <h2 id={titleId} className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                )}
                
                {onClose && (
                  <AccessibleButton
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    aria-label="Cerrar modal"
                    icon={X}
                  />
                )}
              </div>
            )}
            
            {/* Description */}
            {description && (
              <ScreenReaderOnly>
                <div id={descId}>{description}</div>
              </ScreenReaderOnly>
            )}
            
            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </div>
        </FocusTrap>
      </div>
    </div>
  );
};

/**
 * Toast/Notification accesible
 */
export const AccessibleToast = ({
  type = 'info',
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const toastRef = useRef(null);
  
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);
  
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };
  
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  const Icon = icons[type];
  const colorClass = colors[type];
  
  return (
    <div
      ref={toastRef}
      role="alert"
      aria-live="assertive"
      className={`
        flex items-start p-4 border rounded-lg shadow-lg
        ${colorClass}
        max-w-sm w-full
      `}
    >
      {Icon && (
        <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" aria-hidden="true" />
      )}
      
      <div className="flex-1">
        {title && (
          <h4 className="font-medium mb-1">{title}</h4>
        )}
        {message && (
          <p className="text-sm">{message}</p>
        )}
      </div>
      
      {onClose && (
        <AccessibleButton
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Cerrar notificación"
          className="ml-2 -mr-1 -mt-1"
          icon={X}
        />
      )}
    </div>
  );
};

export default {
  ScreenReaderOnly,
  SkipLink,
  FocusTrap,
  AriaLive,
  AccessibleButton,
  AccessibleModal,
  AccessibleToast
};
