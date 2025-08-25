import React, { useState, useEffect } from 'react'
import { usePWAFeatures, useSmartNotifications } from '@/hooks/useWave5'
import { 
  Download, 
  Smartphone, 
  RefreshCw, 
  X, 
  Check, 
  AlertCircle,
  Settings,
  Wifi,
  Cloud
} from 'lucide-react'

// Prompt de instalación de PWA
export const InstallPrompt = ({ className = '' }) => {
  const { canInstall, installPWA, isInstalled } = usePWAFeatures()
  const { addNotification } = useSmartNotifications()
  const [isDismissed, setIsDismissed] = useState(false)

  // No mostrar si está instalado, no se puede instalar, o fue descartado
  if (isInstalled || !canInstall || isDismissed) return null

  const handleInstall = async () => {
    const success = await installPWA()
    
    if (success) {
      addNotification({
        type: 'success',
        title: 'App Instalada',
        message: 'La aplicación se ha instalado correctamente en tu dispositivo.',
        icon: '📱',
        duration: 3000
      })
    } else {
      addNotification({
        type: 'error',
        title: 'Error de Instalación',
        message: 'No se pudo instalar la aplicación. Inténtalo de nuevo.',
        icon: '❌',
        duration: 5000
      })
    }
  }

  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 
                    rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Smartphone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">
              Instalar Aplicación
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Instala la app para acceso rápido y funcionalidad offline completa
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstall}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm 
                     font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Instalar
          </button>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Cerrar prompt de instalación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Notificación de actualización disponible
export const UpdateNotification = ({ className = '' }) => {
  const { updateAvailable, applyUpdate, dismissUpdate } = usePWAFeatures()
  const { addNotification } = useSmartNotifications()
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    if (updateAvailable) {
      addNotification({
        type: 'info',
        title: 'Actualización Disponible',
        message: 'Hay una nueva versión de la aplicación disponible.',
        icon: '🆕',
        actions: [
          { label: 'Actualizar', action: 'apply-update' },
          { label: 'Más tarde', action: 'dismiss-update' }
        ],
        persistent: true
      })
    }
  }, [updateAvailable, addNotification])

  if (!updateAvailable) return null

  const handleApplyUpdate = async () => {
    setIsApplying(true)
    
    try {
      applyUpdate()
      addNotification({
        type: 'success',
        title: 'Actualizando...',
        message: 'La aplicación se está actualizando. Se recargará automáticamente.',
        icon: '🔄',
        duration: 3000
      })
    } catch (error) {
      setIsApplying(false)
      addNotification({
        type: 'error',
        title: 'Error de Actualización',
        message: 'No se pudo aplicar la actualización. Inténtalo de nuevo.',
        icon: '❌',
        duration: 5000
      })
    }
  }

  return (
    <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 
                    rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <RefreshCw className={`h-6 w-6 text-green-600 dark:text-green-400 ${isApplying ? 'animate-spin' : ''}`} />
          <div>
            <h3 className="font-medium text-green-900 dark:text-green-100">
              Nueva Versión Disponible
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Actualiza para obtener las últimas mejoras y correcciones
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleApplyUpdate}
            disabled={isApplying}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm 
                     font-medium rounded-md text-white bg-green-600 hover:bg-green-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Aplicando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </>
            )}
          </button>
          
          <button
            onClick={dismissUpdate}
            disabled={isApplying}
            className="p-2 text-green-400 hover:text-green-600 dark:hover:text-green-300 
                     focus:outline-none focus:ring-2 focus:ring-green-500 rounded
                     disabled:opacity-50"
            aria-label="Cerrar notificación de actualización"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Indicador de estado PWA
export const PWAStatusIndicator = ({ className = '' }) => {
  const { isInstalled, isPWACapable, registration } = usePWAFeatures()
  const [showDetails, setShowDetails] = useState(false)

  const getStatusIcon = () => {
    if (isInstalled) return <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />
    if (isPWACapable) return <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    return <AlertCircle className="h-4 w-4 text-gray-400" />
  }

  const getStatusText = () => {
    if (isInstalled) return 'Instalada'
    if (isPWACapable) return 'Disponible'
    return 'No compatible'
  }

  const getStatusColor = () => {
    if (isInstalled) return 'text-green-600 dark:text-green-400'
    if (isPWACapable) return 'text-blue-600 dark:text-blue-400'
    return 'text-gray-400'
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center space-x-1 text-sm ${getStatusColor()} hover:opacity-80 
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1`}
        aria-label="Estado de la aplicación PWA"
      >
        {getStatusIcon()}
        <span>PWA: {getStatusText()}</span>
      </button>

      {showDetails && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg 
                      shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Estado de Aplicación Web Progresiva
            </h3>
            
            <div className="space-y-2 text-sm">
              <PWAFeatureItem 
                enabled={isPWACapable}
                text="Compatible con PWA"
                icon={<Settings className="h-3 w-3" />}
              />
              <PWAFeatureItem 
                enabled={isInstalled}
                text="Instalada en dispositivo"
                icon={<Smartphone className="h-3 w-3" />}
              />
              <PWAFeatureItem 
                enabled={!!registration}
                text="Service Worker activo"
                icon={<RefreshCw className="h-3 w-3" />}
              />
              <PWAFeatureItem 
                enabled={navigator.onLine}
                text="Conexión a internet"
                icon={<Wifi className="h-3 w-3" />}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PWAFeatureItem = ({ enabled, text, icon }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-red-500'}`} />
    <div className="flex items-center space-x-1">
      {icon}
      <span className={enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
        {text}
      </span>
    </div>
  </div>
)

// Gestor de sincronización en background
export const BackgroundSyncManager = ({ className = '' }) => {
  const [syncStatus, setSyncStatus] = useState('idle')
  const [lastSync, setLastSync] = useState(null)
  const [pendingChanges, setPendingChanges] = useState(0)
  const { addNotification } = useSmartNotifications()

  // Simular estado de sincronización
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular cambios pendientes ocasionales
      if (Math.random() < 0.1) {
        setPendingChanges(prev => prev + Math.floor(Math.random() * 3))
      }

      // Simular sincronización automática
      if (pendingChanges > 0 && navigator.onLine && Math.random() < 0.3) {
        performSync()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [pendingChanges])

  const performSync = async () => {
    if (syncStatus === 'syncing') return

    setSyncStatus('syncing')
    
    try {
      // Simular sincronización
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const syncedItems = pendingChanges
      setPendingChanges(0)
      setLastSync(Date.now())
      setSyncStatus('success')
      
      addNotification({
        type: 'success',
        title: 'Sincronización Completa',
        message: `${syncedItems} elementos sincronizados correctamente.`,
        icon: '✅',
        duration: 2000
      })
      
      setTimeout(() => setSyncStatus('idle'), 1000)
    } catch (error) {
      setSyncStatus('error')
      addNotification({
        type: 'error',
        title: 'Error de Sincronización',
        message: 'No se pudo completar la sincronización. Se reintentará automáticamente.',
        icon: '❌',
        duration: 5000
      })
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'success': return <Check className="h-4 w-4 text-green-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Cloud className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing': return 'Sincronizando...'
      case 'success': return 'Sincronizado'
      case 'error': return 'Error'
      default: return pendingChanges > 0 ? `${pendingChanges} pendientes` : 'Actualizado'
    }
  }

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'syncing': return 'text-blue-600 dark:text-blue-400'
      case 'success': return 'text-green-600 dark:text-green-400'
      case 'error': return 'text-red-600 dark:text-red-400'
      default: return pendingChanges > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={pendingChanges > 0 ? performSync : undefined}
        disabled={syncStatus === 'syncing' || !navigator.onLine}
        className={`flex items-center space-x-1 text-sm ${getStatusColor()} 
                   ${pendingChanges > 0 && navigator.onLine ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1
                   disabled:opacity-50`}
        aria-label={`Estado de sincronización: ${getStatusText()}`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </button>

      {lastSync && (
        <span className="text-xs text-gray-500 dark:text-gray-500">
          Última: {new Date(lastSync).toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}

// Modal de información PWA completa
export const PWAInfoModal = ({ isOpen, onClose }) => {
  const { isInstalled, isPWACapable, canInstall, installPWA } = usePWAFeatures()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 
                      text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Aplicación Web Progresiva
                </h3>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Estado Actual
                </h4>
                <div className="space-y-2 text-sm">
                  <PWAFeatureItem enabled={isPWACapable} text="Compatible con PWA" icon={<Settings className="h-3 w-3" />} />
                  <PWAFeatureItem enabled={isInstalled} text="Instalada en dispositivo" icon={<Smartphone className="h-3 w-3" />} />
                  <PWAFeatureItem enabled={canInstall} text="Disponible para instalar" icon={<Download className="h-3 w-3" />} />
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Beneficios de la Instalación
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Acceso rápido desde el escritorio</li>
                  <li>• Funcionalidad offline completa</li>
                  <li>• Notificaciones push (próximamente)</li>
                  <li>• Interfaz nativa sin navegador</li>
                  <li>• Menor consumo de memoria</li>
                </ul>
              </div>

              {canInstall && !isInstalled && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        ¿Instalar ahora?
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Obtén la mejor experiencia instalando la aplicación
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await installPWA()
                        onClose()
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Instalar
                    </button>
                  </div>
                </div>
              )}
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
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default {
  InstallPrompt,
  UpdateNotification,
  PWAStatusIndicator,
  BackgroundSyncManager,
  PWAInfoModal
}
