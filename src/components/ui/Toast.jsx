/**
 * Toast - Fluent Design 2 Style
 * Notificaciones consistentes con el tema del sistema
 */

import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react'

const Toast = ({
  message,
  type = 'success',
  duration = 3000,
  onClose,
  actions = [],
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => {
          setIsVisible(false)
          onClose && onClose()
        }, 300)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose && onClose()
    }, 200)
  }

  const getIcon = () => {
    const iconProps = { size: 18, strokeWidth: 2 }
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} />
      case 'error':
        return <AlertCircle {...iconProps} />
      case 'info':
      default:
        return <Info {...iconProps} />
    }
  }

  const getStyles = () => {
    const base = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
      minWidth: '320px',
      maxWidth: '480px',
      fontSize: '14px',
      lineHeight: '1.5',
      opacity: isExiting ? 0 : 1,
      transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }

    switch (type) {
      case 'success':
        return {
          ...base,
          backgroundColor: '#dff6dd',
          border: '1px solid #107c10',
          color: '#0e700e',
        }
      case 'error':
        return {
          ...base,
          backgroundColor: '#fde7e9',
          border: '1px solid #d13438',
          color: '#a4262c',
        }
      case 'info':
      default:
        return {
          ...base,
          backgroundColor: '#f0f6ff',
          border: '1px solid #0078d4',
          color: '#0068b8',
        }
    }
  }

  if (!isVisible) return null

  return (
    <div style={getStyles()} role='alert' aria-live='polite'>
      <span style={{ flexShrink: 0, marginTop: '2px' }}>{getIcon()}</span>
      <span style={{ flex: 1, wordBreak: 'break-word' }}>{message}</span>

      {actions && actions.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => action.onClick && action.onClick()}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                color: 'inherit',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={e =>
                (e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.15)')
              }
              onMouseLeave={e =>
                (e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)')
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleClose}
        style={{
          flexShrink: 0,
          padding: '4px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
          transition: 'opacity 0.2s, background-color 0.2s',
        }}
        onMouseEnter={e => {
          e.target.style.opacity = '1'
          e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
        }}
        onMouseLeave={e => {
          e.target.style.opacity = '0.7'
          e.target.style.backgroundColor = 'transparent'
        }}
        aria-label='Cerrar'
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default Toast
