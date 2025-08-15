/**
 * Simple Toast notification component for user feedback
 * Supports multiple themes and auto-dismiss
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const Toast = ({ 
  message, 
  type = 'success', // 'success' | 'error' | 'info'
  duration = 3000,
  onClose,
  actions = []
}) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);

  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

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

  const getStyles = () => {
    const baseColor = type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue';
    
    if (isNeoBrutalism) {
      return {
        background: type === 'success' ? 'var(--brutalist-lime)' : 
                   type === 'error' ? 'var(--destructive)' : 'var(--primary)',
        color: type === 'error' ? 'var(--destructive-foreground)' : 'var(--foreground)',
        border: '4px solid var(--border)',
        borderRadius: '0px',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      };
    }

    if (isMaterial) {
      return {
        background: type === 'success' ? '#4caf50' : 
                   type === 'error' ? '#f44336' : '#2196f3',
        color: 'white',
        borderRadius: '4px',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)'
      };
    }

    if (isFluent) {
      return {
        background: type === 'success' ? 'var(--fluent-accent-green, #107c10)' : 
                   type === 'error' ? 'var(--fluent-accent-red, #d13438)' : 'var(--fluent-accent-blue, #0078d4)',
        color: 'white',
        borderRadius: '6px',
        boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.14)'
      };
    }

    return {
      background: type === 'success' ? '#10b981' : 
                 type === 'error' ? '#ef4444' : '#3b82f6',
      color: 'white',
      borderRadius: '6px',
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)'
    };
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        minWidth: '280px',
        maxWidth: '420px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all 300ms ease',
        ...getStyles()
      }}
    >
      {getIcon()}
      <span style={{ flex: 1 }}>{message}</span>

      {actions && actions.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => {
                try { a.onClick && a.onClick(); } catch {}
              }}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: 'inherit',
                padding: '6px 8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose && onClose(), 200);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '4px'
        }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
