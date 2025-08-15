/**
 * Container component for rendering multiple toast notifications
 * Handles positioning and stacking of toasts
 */

import React from 'react';
import Toast from './Toast';

const ToastContainer = ({ toasts, onRemoveToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            transform: `translateY(${index * 6}px)`,
            transition: 'transform 200ms ease'
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
    </div>
  );
};

export default ToastContainer;
