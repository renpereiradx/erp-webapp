/**
 * ToastContainer - Fluent Design 2 Style
 * Contenedor de notificaciones posicionado dentro del layout principal
 */

import React from 'react'
import Toast from './Toast'

const ToastContainer = ({ toasts, onRemoveToast, position = 'top-right' }) => {
  if (!toasts || toasts.length === 0) return null

  const getPositionStyles = () => {
    const base = {
      position: 'fixed',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      pointerEvents: 'none',
      padding: '16px',
      maxHeight: 'calc(100vh - 100px)',
      overflowY: 'auto',
    }

    switch (position) {
      case 'top-left':
        return { ...base, top: '70px', left: '16px' }
      case 'top-center':
        return {
          ...base,
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
        }
      case 'bottom-right':
        return { ...base, bottom: '16px', right: '16px' }
      case 'bottom-left':
        return { ...base, bottom: '16px', left: '16px' }
      case 'bottom-center':
        return {
          ...base,
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
        }
      case 'top-right':
      default:
        return { ...base, top: '70px', right: '16px' }
    }
  }

  return (
    <div style={getPositionStyles()}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            actions={toast.actions}
            onClose={() => onRemoveToast(toast.id)}
          />
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

export default ToastContainer
