/**
 * Toast simplificado para MVP - Sin hooks problemáticos
 * Versión básica que funciona sin dependencias de contexto
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const Toast = ({ 
  message, 
  type = 'success',
  duration = 3000,
  onClose,
  actions = []
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose && onClose(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'info':
      default:
        return 'bg-blue-500 text-white';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-md shadow-lg min-w-[280px] max-w-[420px] transition-all duration-300 ${getTypeClasses()}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)'
      }}
      role="status"
      aria-live="polite"
    >
      {getIcon()}
      <span className="flex-1">{message}</span>

      {actions && actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => action.onClick && action.onClick()}
              className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-sm transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose && onClose(), 200);
        }}
        className="hover:bg-white/20 p-1 rounded transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;