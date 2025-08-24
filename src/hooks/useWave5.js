// Hook para detectar estado offline/online y gestionar comportamiento
import { useState, useEffect, useCallback } from 'react'

export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now())
  const [offlineDuration, setOfflineDuration] = useState(0)
  const [isManualOffline, setIsManualOffline] = useState(false)
  const [offlineReason, setOfflineReason] = useState('network')

  // Detectar cambios en el estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      if (!isManualOffline) {
        setIsOffline(false)
        setLastOnlineTime(Date.now())
        setOfflineReason('network')
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
      setOfflineReason('network')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isManualOffline])

  // Calcular duración offline
  useEffect(() => {
    if (isOffline) {
      const interval = setInterval(() => {
        setOfflineDuration(Date.now() - lastOnlineTime)
      }, 1000)
      
      return () => clearInterval(interval)
    } else {
      setOfflineDuration(0)
    }
  }, [isOffline, lastOnlineTime])

  // Funciones de control manual
  const toggleManualOffline = useCallback(() => {
    setIsManualOffline(prev => !prev)
    setIsOffline(prev => !prev)
    setOfflineReason(isManualOffline ? 'network' : 'manual')
  }, [isManualOffline])

  const forceOnline = useCallback(() => {
    setIsManualOffline(false)
    setIsOffline(false)
    setOfflineReason('network')
  }, [])

  // Verificar conectividad real con ping
  const checkRealConnectivity = useCallback(async () => {
    if (navigator.onLine) {
      try {
        const response = await fetch('/api/ping', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        })
        return response.ok || response.type === 'opaque'
      } catch {
        return false
      }
    }
    return false
  }, [])

  // Información sobre capacidades offline
  const getOfflineCapabilities = useCallback(() => {
    return {
      canViewCachedData: true,
      canCreateDrafts: true,
      canViewReports: true,
      canModifySettings: false,
      canSyncLater: true,
      estimatedCacheSize: '50MB',
      lastSyncTime: localStorage.getItem('lastSyncTime') || 'Never'
    }
  }, [])

  // Formatear duración offline
  const formatOfflineDuration = useCallback((duration) => {
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }, [])

  return {
    // Estados
    isOffline,
    isOnline: !isOffline,
    isManualOffline,
    offlineReason,
    lastOnlineTime,
    offlineDuration,
    formattedOfflineDuration: formatOfflineDuration(offlineDuration),
    
    // Funciones
    toggleManualOffline,
    forceOnline,
    checkRealConnectivity,
    getOfflineCapabilities,
    
    // Utilidades
    offlineCapabilities: getOfflineCapabilities()
  }
}

// Hook para gestionar el estado de los circuit breakers con UI feedback
export const useCircuitBreakerUI = () => {
  const [serviceStates, setServiceStates] = useState({
    purchases: { state: 'closed', failures: 0, lastFailure: null },
    products: { state: 'closed', failures: 0, lastFailure: null },
    analytics: { state: 'closed', failures: 0, lastFailure: null },
    auth: { state: 'closed', failures: 0, lastFailure: null }
  })
  
  const [recoveryProgress, setRecoveryProgress] = useState({})
  const [healthScore, setHealthScore] = useState(100)

  // Simular actualizaciones de estado de circuit breaker
  useEffect(() => {
    const interval = setInterval(() => {
      // Aquí se integraría con el sistema real de circuit breaker
      // Por ahora simularemos algunos estados
      setServiceStates(prev => {
        const newStates = { ...prev }
        
        // Simular cambios ocasionales de estado
        Object.keys(newStates).forEach(service => {
          const random = Math.random()
          if (random < 0.01) { // 1% chance de cambio
            if (newStates[service].state === 'closed') {
              newStates[service] = {
                ...newStates[service],
                state: 'half-open',
                failures: Math.floor(Math.random() * 3) + 1
              }
            } else if (newStates[service].state === 'half-open') {
              newStates[service] = {
                ...newStates[service],
                state: Math.random() < 0.7 ? 'closed' : 'open',
                failures: 0
              }
            }
          }
        })
        
        return newStates
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Calcular health score general
  useEffect(() => {
    const services = Object.values(serviceStates)
    const totalServices = services.length
    const healthyServices = services.filter(s => s.state === 'closed').length
    const newHealthScore = Math.round((healthyServices / totalServices) * 100)
    setHealthScore(newHealthScore)
  }, [serviceStates])

  // Forzar recovery de un servicio
  const forceRecovery = useCallback((serviceName) => {
    setRecoveryProgress(prev => ({
      ...prev,
      [serviceName]: { progress: 0, status: 'recovering' }
    }))

    // Simular progreso de recovery
    const interval = setInterval(() => {
      setRecoveryProgress(prev => {
        const currentProgress = prev[serviceName]?.progress || 0
        const newProgress = currentProgress + 10

        if (newProgress >= 100) {
          clearInterval(interval)
          setServiceStates(prevStates => ({
            ...prevStates,
            [serviceName]: { state: 'closed', failures: 0, lastFailure: null }
          }))
          return {
            ...prev,
            [serviceName]: { progress: 100, status: 'recovered' }
          }
        }

        return {
          ...prev,
          [serviceName]: { progress: newProgress, status: 'recovering' }
        }
      })
    }, 200)
  }, [])

  // Obtener estado visual para un servicio
  const getServiceStatus = useCallback((serviceName) => {
    const service = serviceStates[serviceName]
    if (!service) return { color: 'gray', label: 'Unknown', icon: '❓' }

    switch (service.state) {
      case 'closed':
        return { color: 'green', label: 'Healthy', icon: '✅' }
      case 'half-open':
        return { color: 'yellow', label: 'Testing', icon: '⚠️' }
      case 'open':
        return { color: 'red', label: 'Failed', icon: '❌' }
      default:
        return { color: 'gray', label: 'Unknown', icon: '❓' }
    }
  }, [serviceStates])

  // Obtener color general del sistema
  const getSystemHealthColor = useCallback(() => {
    if (healthScore >= 90) return 'green'
    if (healthScore >= 70) return 'yellow'
    if (healthScore >= 50) return 'orange'
    return 'red'
  }, [healthScore])

  return {
    // Estados
    serviceStates,
    recoveryProgress,
    healthScore,
    systemHealthColor: getSystemHealthColor(),
    
    // Funciones
    forceRecovery,
    getServiceStatus,
    
    // Utilidades
    hasFailedServices: Object.values(serviceStates).some(s => s.state === 'open'),
    hasRecoveringServices: Object.values(serviceStates).some(s => s.state === 'half-open'),
    failedServicesCount: Object.values(serviceStates).filter(s => s.state === 'open').length,
    totalServicesCount: Object.keys(serviceStates).length
  }
}

// Hook para gestionar notificaciones inteligentes
export const useSmartNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [notificationSettings, setNotificationSettings] = useState({
    offline: true,
    recovery: true,
    sync: true,
    errors: true,
    performance: false
  })

  // Añadir notificación
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      timestamp: Date.now(),
      ...notification
    }
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)) // Máximo 50
    
    // Auto-remove after duration
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration)
    }
    
    return id
  }, [])

  // Remover notificación
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Notificaciones predefinidas
  const notifyOffline = useCallback(() => {
    if (!notificationSettings.offline) return
    
    return addNotification({
      type: 'warning',
      title: 'Modo Offline',
      message: 'Sin conexión a internet. Los datos se sincronizarán cuando vuelva la conexión.',
      icon: '📡',
      actions: [
        { label: 'Ver Capacidades Offline', action: 'show-offline-capabilities' }
      ],
      persistent: true
    })
  }, [addNotification, notificationSettings.offline])

  const notifyOnline = useCallback(() => {
    if (!notificationSettings.offline) return
    
    return addNotification({
      type: 'success',
      title: 'Conexión Restaurada',
      message: 'Conexión a internet restaurada. Sincronizando datos...',
      icon: '✅',
      duration: 3000
    })
  }, [addNotification, notificationSettings.offline])

  const notifyRecovery = useCallback((serviceName) => {
    if (!notificationSettings.recovery) return
    
    return addNotification({
      type: 'info',
      title: 'Servicio Recuperándose',
      message: `El servicio ${serviceName} se está recuperando automáticamente.`,
      icon: '🔄',
      duration: 5000
    })
  }, [addNotification, notificationSettings.recovery])

  const notifyServiceRestored = useCallback((serviceName) => {
    if (!notificationSettings.recovery) return
    
    return addNotification({
      type: 'success',
      title: 'Servicio Restaurado',
      message: `El servicio ${serviceName} está funcionando normalmente.`,
      icon: '✅',
      duration: 3000
    })
  }, [addNotification, notificationSettings.recovery])

  const notifySyncCompleted = useCallback((itemCount) => {
    if (!notificationSettings.sync) return
    
    return addNotification({
      type: 'success',
      title: 'Sincronización Completa',
      message: `${itemCount} elementos sincronizados correctamente.`,
      icon: '📊',
      duration: 2000
    })
  }, [addNotification, notificationSettings.sync])

  const notifyError = useCallback((error, context = '') => {
    if (!notificationSettings.errors) return
    
    return addNotification({
      type: 'error',
      title: 'Error del Sistema',
      message: `${error} ${context}`,
      icon: '⚠️',
      actions: [
        { label: 'Reintentar', action: 'retry' },
        { label: 'Reportar', action: 'report-error' }
      ],
      persistent: true
    })
  }, [addNotification, notificationSettings.errors])

  // Limpiar notificaciones
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const clearNotificationsByType = useCallback((type) => {
    setNotifications(prev => prev.filter(n => n.type !== type))
  }, [])

  // Configurar notificaciones
  const updateNotificationSettings = useCallback((newSettings) => {
    setNotificationSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  return {
    // Estado
    notifications,
    notificationSettings,
    unreadCount: notifications.filter(n => !n.read).length,
    
    // Funciones base
    addNotification,
    removeNotification,
    clearAllNotifications,
    clearNotificationsByType,
    updateNotificationSettings,
    
    // Notificaciones predefinidas
    notifyOffline,
    notifyOnline,
    notifyRecovery,
    notifyServiceRestored,
    notifySyncCompleted,
    notifyError
  }
}

// Hook para funcionalidades PWA
export const usePWAFeatures = () => {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState(null)

  // Detectar prompt de instalación
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Detectar si está instalado
  useEffect(() => {
    const checkIfInstalled = () => {
      const isInStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true

      setIsInstalled(isInStandaloneMode)
    }

    checkIfInstalled()
    window.addEventListener('appinstalled', checkIfInstalled)
    
    return () => {
      window.removeEventListener('appinstalled', checkIfInstalled)
    }
  }, [])

  // Registrar Service Worker y detectar updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          setRegistration(reg)
          
          // Detectar updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true)
              }
            })
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  // Instalar PWA
  const installPWA = useCallback(async () => {
    if (!installPrompt) return false

    try {
      const result = await installPrompt.prompt()
      const outcome = await result.userChoice
      
      if (outcome === 'accepted') {
        setInstallPrompt(null)
        setIsInstalled(true)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Install failed:', error)
      return false
    }
  }, [installPrompt])

  // Aplicar update
  const applyUpdate = useCallback(() => {
    if (!registration) return

    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      setUpdateAvailable(false)
      window.location.reload()
    }
  }, [registration])

  // Descartar update
  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false)
  }, [])

  return {
    // Estado
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    updateAvailable,
    registration,
    
    // Funciones
    installPWA,
    applyUpdate,
    dismissUpdate,
    
    // Información
    supportsInstall: !!installPrompt,
    isPWACapable: 'serviceWorker' in navigator && 'manifest' in document
  }
}

export default {
  useOfflineStatus,
  useCircuitBreakerUI,
  useSmartNotifications,
  usePWAFeatures
}
