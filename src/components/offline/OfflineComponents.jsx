import React, { useEffect } from 'react'
import { useOfflineStatus, useSmartNotifications } from '@/hooks/useWave5'
import { WifiOff, Wifi, Clock, Download, AlertCircle } from 'lucide-react'

// Banner principal de estado offline
export const OfflineBanner = () => {
  const { 
    isOffline, 
    isManualOffline, 
    formattedOfflineDuration, 
    offlineCapabilities,
    toggleManualOffline,
    forceOnline 
  } = useOfflineStatus()
  
  const { notifyOffline, notifyOnline } = useSmartNotifications()

  useEffect(() => {
    if (isOffline) {
      notifyOffline()
    } else {
      notifyOnline()
    }
  }, [isOffline, notifyOffline, notifyOnline])

  if (!isOffline) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-800 dark:text-amber-200">
                {isManualOffline ? 'Modo Offline Activado' : 'Sin Conexión'}
              </span>
            </div>
            
            <div className="flex items-center space-x-1 text-sm text-amber-700 dark:text-amber-300">
              <Clock className="h-4 w-4" />
              <span>{formattedOfflineDuration}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <OfflineCapabilities capabilities={offlineCapabilities} />
            
            <div className="flex space-x-2">
              {isManualOffline ? (
                <button
                  onClick={forceOnline}
                  className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 
                           focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                  aria-label="Volver al modo online"
                >
                  Volver Online
                </button>
              ) : (
                <button
                  onClick={toggleManualOffline}
                  className="px-3 py-1 text-sm bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 
                           rounded hover:bg-amber-200 dark:hover:bg-amber-700 focus:outline-none 
                           focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                  aria-label="Activar modo offline manual"
                >
                  Modo Offline
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para mostrar capacidades offline
const OfflineCapabilities = ({ capabilities }) => {
  const [showDetails, setShowDetails] = React.useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 
                 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded px-2 py-1"
        aria-label="Ver capacidades offline"
        aria-expanded={showDetails}
      >
        Ver Capacidades
      </button>

      {showDetails && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg 
                      shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Funcionalidades Disponibles Offline
            </h3>
            
            <div className="space-y-2 text-sm">
              <CapabilityItem 
                enabled={capabilities.canViewCachedData}
                text="Ver datos en caché"
              />
              <CapabilityItem 
                enabled={capabilities.canCreateDrafts}
                text="Crear borradores"
              />
              <CapabilityItem 
                enabled={capabilities.canViewReports}
                text="Ver reportes guardados"
              />
              <CapabilityItem 
                enabled={capabilities.canModifySettings}
                text="Modificar configuración"
              />
              <CapabilityItem 
                enabled={capabilities.canSyncLater}
                text="Sincronización posterior"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Cache: {capabilities.estimatedCacheSize}</span>
                <span>Última sync: {capabilities.lastSyncTime}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const CapabilityItem = ({ enabled, text }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-red-500'}`} />
    <span className={enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
      {text}
    </span>
  </div>
)

// Indicador de datos en caché
export const CacheIndicator = ({ isFromCache, timestamp, className = '' }) => {
  if (!isFromCache) return null

  const timeAgo = timestamp ? new Date(Date.now() - timestamp).toISOString().substr(11, 8) : 'Unknown'

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs 
                    bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ${className}`}>
      <Download className="h-3 w-3" />
      <span>Datos en caché ({timeAgo})</span>
    </div>
  )
}

// Toggle para activar/desactivar modo offline manual
export const OfflineToggle = () => {
  const { isOffline, isManualOffline, toggleManualOffline } = useOfflineStatus()

  return (
    <div className="flex items-center space-x-3">
      <label htmlFor="offline-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Modo Offline
      </label>
      
      <button
        id="offline-toggle"
        onClick={toggleManualOffline}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors 
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                   ${isManualOffline ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
        role="switch"
        aria-checked={isManualOffline}
        aria-label={`${isManualOffline ? 'Desactivar' : 'Activar'} modo offline manual`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                         ${isManualOffline ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>

      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
        {isOffline ? (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </>
        ) : (
          <>
            <Wifi className="h-3 w-3" />
            <span>Online</span>
          </>
        )}
      </div>
    </div>
  )
}

// Estado de sincronización
export const SyncStatus = ({ syncing = false, lastSync, pendingCount = 0, className = '' }) => {
  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Nunca'
    
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    return 'Hace un momento'
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {syncing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
          <span className="text-blue-600 dark:text-blue-400">Sincronizando...</span>
        </>
      ) : (
        <>
          <div className={`w-2 h-2 rounded-full ${pendingCount > 0 ? 'bg-amber-500' : 'bg-green-500'}`} />
          <span className="text-gray-600 dark:text-gray-400">
            Última sync: {formatLastSync(lastSync)}
            {pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/20 
                             text-amber-800 dark:text-amber-200 rounded">
                {pendingCount} pendientes
              </span>
            )}
          </span>
        </>
      )}
    </div>
  )
}

// Modal de información offline detallada
export const OfflineInfoModal = ({ isOpen, onClose }) => {
  const { offlineCapabilities, formattedOfflineDuration } = useOfflineStatus()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 
                      text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center 
                            rounded-full bg-amber-100 dark:bg-amber-900/20 sm:mx-0 sm:h-10 sm:w-10">
                <WifiOff className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                  Información de Modo Offline
                </h3>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Duración Offline</h4>
                    <p className="text-gray-600 dark:text-gray-400">{formattedOfflineDuration}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Funcionalidades Disponibles
                    </h4>
                    <div className="space-y-2">
                      <CapabilityItem enabled={offlineCapabilities.canViewCachedData} text="Ver datos en caché" />
                      <CapabilityItem enabled={offlineCapabilities.canCreateDrafts} text="Crear borradores" />
                      <CapabilityItem enabled={offlineCapabilities.canViewReports} text="Ver reportes" />
                      <CapabilityItem enabled={offlineCapabilities.canSyncLater} text="Sincronización posterior" />
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Información de Cache
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div>Tamaño estimado: {offlineCapabilities.estimatedCacheSize}</div>
                      <div>Última sincronización: {offlineCapabilities.lastSyncTime}</div>
                    </div>
                  </div>
                </div>
              </div>
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
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default {
  OfflineBanner,
  CacheIndicator,
  OfflineToggle,
  SyncStatus,
  OfflineInfoModal
}
