import React, { useState } from 'react'
import { Wave5Layout, Wave5Dashboard } from '@/components/wave5/Wave5Layout'
import { HealthDashboard } from '@/components/circuitbreaker/CircuitBreakerComponents'
import { OfflineToggle, OfflineInfoModal } from '@/components/offline/OfflineComponents'
import { PWAInfoModal } from '@/components/pwa/PWAComponents'
import { NotificationSettings } from '@/components/notifications/NotificationComponents'
import { 
  useOfflineStatus, 
  useCircuitBreakerUI, 
  useSmartNotifications, 
  usePWAFeatures 
} from '@/hooks/useWave5'
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Bell, 
  Smartphone, 
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

const Wave5Demo = () => {
  const [showOfflineInfo, setShowOfflineInfo] = useState(false)
  const [showPWAInfo, setShowPWAInfo] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)

  const { 
    isOffline, 
    isManualOffline, 
    toggleManualOffline, 
    offlineCapabilities 
  } = useOfflineStatus()

  const { 
    healthScore, 
    hasFailedServices, 
    forceRecovery 
  } = useCircuitBreakerUI()

  const { 
    addNotification, 
    notifications, 
    notifyOffline,
    notifyRecovery,
    notifyError 
  } = useSmartNotifications()

  const { 
    canInstall, 
    isInstalled, 
    installPWA 
  } = usePWAFeatures()

  // Funciones demo para testing
  const simulateOffline = () => {
    toggleManualOffline()
    if (!isOffline) {
      addNotification({
        type: 'warning',
        title: 'Modo Offline Activado',
        message: 'Simulando pérdida de conexión para testing.',
        icon: '📡',
        duration: 3000
      })
    }
  }

  const simulateServiceFailure = () => {
    addNotification({
      type: 'error',
      title: 'Servicio Caído',
      message: 'Simulando fallo del servicio de compras.',
      icon: '❌',
      actions: [
        { label: 'Reintentar', action: 'retry' },
        { label: 'Ver Detalles', action: 'details' }
      ],
      persistent: true
    })
  }

  const simulateRecovery = () => {
    forceRecovery('purchases')
    notifyRecovery('purchases')
  }

  const testNotifications = () => {
    const notificationTypes = [
      {
        type: 'success',
        title: 'Operación Exitosa',
        message: 'Los datos se han sincronizado correctamente.',
        icon: '✅',
        duration: 3000
      },
      {
        type: 'info',
        title: 'Nueva Función',
        message: 'Hemos agregado nuevas capacidades offline.',
        icon: 'ℹ️',
        duration: 4000
      },
      {
        type: 'warning',
        title: 'Rendimiento Lento',
        message: 'La conexión está lenta. Cambiando a modo cache.',
        icon: '⚠️',
        duration: 5000
      }
    ]

    const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
    addNotification(randomNotification)
  }

  return (
    <Wave5Layout>
      <div className="space-y-8">
        {/* Header de Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Wave 5 Demo - Offline & Circuit Breaker UI
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Sistema completo de UI para estados offline, circuit breakers, y notificaciones inteligentes
              </p>
            </div>
            
            {/* Status Quick View */}
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isOffline ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200' 
                         : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              }`}>
                {isOffline ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {isOffline ? 'Offline' : 'Online'}
                </span>
              </div>
              
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                healthScore >= 90 ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : healthScore >= 70 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Servicios: {healthScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Controls de Testing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={simulateOffline}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white 
                       rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:ring-offset-2 transition-colors"
            >
              <WifiOff className="h-5 w-5" />
              <span>{isOffline ? 'Simular Online' : 'Simular Offline'}</span>
            </button>

            <button
              onClick={simulateServiceFailure}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white 
                       rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 
                       focus:ring-offset-2 transition-colors"
            >
              <AlertTriangle className="h-5 w-5" />
              <span>Simular Fallo</span>
            </button>

            <button
              onClick={simulateRecovery}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white 
                       rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 
                       focus:ring-offset-2 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Simular Recovery</span>
            </button>

            <button
              onClick={testNotifications}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white 
                       rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 
                       focus:ring-offset-2 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span>Test Notificaciones</span>
            </button>
          </div>
        </div>

        {/* Dashboard Principal */}
        <Wave5Dashboard />

        {/* Health Dashboard Detallado */}
        <HealthDashboard />

        {/* Información y Controles Adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Capacidades Offline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Estado Offline
            </h3>
            <div className="space-y-4">
              <OfflineToggle />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Capacidades offline:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Ver datos en caché: {offlineCapabilities.canViewCachedData ? '✅' : '❌'}</li>
                  <li>• Crear borradores: {offlineCapabilities.canCreateDrafts ? '✅' : '❌'}</li>
                  <li>• Sincronización: {offlineCapabilities.canSyncLater ? '✅' : '❌'}</li>
                </ul>
              </div>
              <button
                onClick={() => setShowOfflineInfo(true)}
                className="w-full px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 
                         rounded hover:bg-blue-200 dark:hover:bg-blue-900/40"
              >
                Ver Detalles
              </button>
            </div>
          </div>

          {/* PWA Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              PWA Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Instalada</span>
                <span className={`text-sm font-medium ${isInstalled ? 'text-green-600' : 'text-gray-400'}`}>
                  {isInstalled ? '✅ Sí' : '❌ No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Disponible</span>
                <span className={`text-sm font-medium ${canInstall ? 'text-blue-600' : 'text-gray-400'}`}>
                  {canInstall ? '✅ Sí' : '❌ No'}
                </span>
              </div>
              {canInstall && !isInstalled && (
                <button
                  onClick={installPWA}
                  className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Instalar App
                </button>
              )}
              <button
                onClick={() => setShowPWAInfo(true)}
                className="w-full px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 
                         rounded hover:bg-blue-200 dark:hover:bg-blue-900/40"
              >
                Información PWA
              </button>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Notificaciones
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Activas</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {notifications.length}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Tipos de notificaciones disponibles:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Conexión y offline</li>
                  <li>• Recovery de servicios</li>
                  <li>• Sincronización</li>
                  <li>• Errores del sistema</li>
                </ul>
              </div>
              <button
                onClick={() => setShowNotificationSettings(true)}
                className="w-full px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 
                         rounded hover:bg-blue-200 dark:hover:bg-blue-900/40"
              >
                Configurar
              </button>
            </div>
          </div>
        </div>

        {/* Métricas y Estadísticas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Métricas Wave 5
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {isOffline ? '🔴' : '🟢'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Estado de Conexión
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {healthScore}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Salud de Servicios
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {notifications.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Notificaciones Activas
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {isInstalled ? '✅' : canInstall ? '📱' : '❌'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Estado PWA
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <OfflineInfoModal 
        isOpen={showOfflineInfo} 
        onClose={() => setShowOfflineInfo(false)} 
      />
      <PWAInfoModal 
        isOpen={showPWAInfo} 
        onClose={() => setShowPWAInfo(false)} 
      />
      <NotificationSettings 
        isOpen={showNotificationSettings} 
        onClose={() => setShowNotificationSettings(false)} 
      />
    </Wave5Layout>
  )
}

export default Wave5Demo
