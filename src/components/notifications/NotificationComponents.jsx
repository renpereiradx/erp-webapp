import React, { useState, useEffect } from 'react'
import { useSmartNotifications } from '@/hooks/useWave5'
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Settings,
  Trash2,
  WifiOff,
  RefreshCw
} from 'lucide-react'

// Centro de notificaciones principal
export const NotificationCenter = ({ className = '' }) => {
  const { 
    notifications, 
    unreadCount, 
    removeNotification, 
    clearAllNotifications,
    clearNotificationsByType 
  } = useSmartNotifications()
  
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      {/* Botón del centro de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} no leídas)` : ''}`}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs 
                         rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg 
                      shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Notificaciones {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearAllNotifications}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                aria-label="Limpiar todas las notificaciones"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                aria-label="Cerrar notificaciones"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRemove={() => removeNotification(notification.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay para cerrar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

// Item individual de notificación
const NotificationItem = ({ notification, onRemove }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info': return <Info className="h-5 w-5 text-blue-500" />
      default: return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeBackground = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-l-green-500'
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-l-red-500'
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-yellow-500'
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500'
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-l-gray-500'
    }
  }

  const formatTime = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `Hace ${hours}h`
    if (minutes > 0) return `Hace ${minutes}m`
    return 'Ahora'
  }

  return (
    <div className={`p-4 border-l-4 ${getTypeBackground(notification.type)} hover:bg-opacity-80 transition-colors`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {notification.icon ? (
            <span className="text-lg">{notification.icon}</span>
          ) : (
            getTypeIcon(notification.type)
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {notification.title}
              </h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {notification.message}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {formatTime(notification.timestamp)}
              </span>
              {!notification.persistent && (
                <button
                  onClick={onRemove}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                  aria-label="Descartar notificación"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Acciones de notificación */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Aquí iría el handler de la acción
                    console.log('Action clicked:', action.action)
                  }}
                  className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                           rounded hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none 
                           focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Toast Manager para notificaciones temporales
export const ToastManager = ({ maxToasts = 5 }) => {
  const { notifications } = useSmartNotifications()
  const [toasts, setToasts] = useState([])

  // Filtrar solo notificaciones recientes para toasts
  useEffect(() => {
    const recentNotifications = notifications
      .filter(n => n.duration && Date.now() - n.timestamp < (n.duration + 1000))
      .slice(0, maxToasts)
    
    setToasts(recentNotifications)
  }, [notifications, maxToasts])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} notification={toast} />
      ))}
    </div>
  )
}

// Item individual de toast
const ToastItem = ({ notification }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    if (notification.duration) {
      const timer = setTimeout(() => {
        setIsLeaving(true)
        setTimeout(() => setIsVisible(false), 300)
      }, notification.duration - 300)
      
      return () => clearTimeout(timer)
    }
  }, [notification.duration])

  if (!isVisible) return null

  const getTypeClasses = (type) => {
    switch (type) {
      case 'success': return 'bg-green-500 text-white'
      case 'error': return 'bg-red-500 text-white'
      case 'warning': return 'bg-yellow-500 text-white'
      case 'info': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5" />
      case 'error': return <XCircle className="h-5 w-5" />
      case 'warning': return <AlertTriangle className="h-5 w-5" />
      case 'info': return <Info className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  return (
    <div className={`
      transform transition-all duration-300 ease-in-out max-w-sm w-full
      ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
    `}>
      <div className={`rounded-lg shadow-lg p-4 ${getTypeClasses(notification.type)}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {notification.icon ? (
              <span className="text-lg">{notification.icon}</span>
            ) : (
              getTypeIcon(notification.type)
            )}
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium">{notification.title}</h4>
            <p className="mt-1 text-sm opacity-90">{notification.message}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Notificador específico para conexión
export const ConnectionNotifier = () => {
  const { notifyOffline, notifyOnline } = useSmartNotifications()
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOffline = () => {
      setWasOffline(true)
      notifyOffline()
    }

    const handleOnline = () => {
      if (wasOffline) {
        notifyOnline()
        setWasOffline(false)
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [wasOffline, notifyOffline, notifyOnline])

  return null // Este componente no renderiza nada
}

// Configuración de notificaciones
export const NotificationSettings = ({ isOpen, onClose }) => {
  const { notificationSettings, updateNotificationSettings } = useSmartNotifications()

  if (!isOpen) return null

  const handleSettingChange = (setting, value) => {
    updateNotificationSettings({ [setting]: value })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 
                      text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Configuración de Notificaciones
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {key === 'offline' ? 'Estado de conexión' :
                     key === 'recovery' ? 'Recuperación de servicios' :
                     key === 'sync' ? 'Sincronización' :
                     key === 'errors' ? 'Errores' :
                     key === 'performance' ? 'Rendimiento' : key}
                  </label>
                  
                  <button
                    onClick={() => handleSettingChange(key, !value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors 
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                               ${value ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    role="switch"
                    aria-checked={value}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                     ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full justify-center rounded-md border border-transparent 
                       bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm 
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                       focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default {
  NotificationCenter,
  ToastManager,
  ConnectionNotifier,
  NotificationSettings
}
