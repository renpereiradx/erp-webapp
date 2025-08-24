import React, { useState } from 'react'
import { useOfflineStatus, useCircuitBreakerUI } from '@/hooks/useWave5'

// Componentes Wave 5
import { OfflineBanner, SyncStatus } from '@/components/offline/OfflineComponents'
import { SystemStatusIndicator } from '@/components/circuitbreaker/CircuitBreakerComponents'
import { NotificationCenter, ToastManager, ConnectionNotifier } from '@/components/notifications/NotificationComponents'
import { InstallPrompt, UpdateNotification, PWAStatusIndicator, BackgroundSyncManager } from '@/components/pwa/PWAComponents'

// Layout principal con integración Wave 5
export const Wave5Layout = ({ children }) => {
  const { isOffline } = useOfflineStatus()
  const { hasFailedServices } = useCircuitBreakerUI()
  const [showPWAInfo, setShowPWAInfo] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Banner offline - siempre visible cuando offline */}
      <OfflineBanner />

      {/* Notificaciones de PWA */}
      <div className="space-y-2 p-4">
        <InstallPrompt />
        <UpdateNotification />
      </div>

      {/* Header con indicadores de estado */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                ERP System
              </h1>
              
              {/* Status Indicators */}
              <div className="flex items-center space-x-4">
                <SystemStatusIndicator />
                <PWAStatusIndicator />
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              {/* Sync Status */}
              <div className="hidden sm:block">
                <BackgroundSyncManager />
              </div>

              {/* Notification Center */}
              <NotificationCenter />
            </div>
          </div>
        </div>
      </header>

      {/* Status bar para información adicional */}
      {(isOffline || hasFailedServices) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                {isOffline && (
                  <span className="text-yellow-800 dark:text-yellow-200">
                    🔌 Trabajando offline - Los cambios se sincronizarán automáticamente
                  </span>
                )}
                {hasFailedServices && (
                  <span className="text-yellow-800 dark:text-yellow-200">
                    ⚠️ Algunos servicios no están disponibles - Funcionalidad limitada
                  </span>
                )}
              </div>
              
              <SyncStatus 
                syncing={false}
                lastSync={Date.now() - 300000} // 5 min ago
                pendingCount={isOffline ? 3 : 0}
                className="text-yellow-700 dark:text-yellow-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Toast Manager para notificaciones temporales */}
      <ToastManager />

      {/* Connection Notifier - componente invisible que maneja notificaciones de conexión */}
      <ConnectionNotifier />
    </div>
  )
}

// Dashboard específico para Wave 5 con todos los componentes
export const Wave5Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'offline', label: 'Estado Offline', icon: '📡' },
    { id: 'services', label: 'Servicios', icon: '⚙️' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'pwa', label: 'PWA', icon: '📱' }
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'offline' && <OfflineTab />}
        {activeTab === 'services' && <ServicesTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'pwa' && <PWATab />}
      </div>
    </div>
  )
}

// Tab de resumen general
const OverviewTab = () => {
  const { isOffline, formattedOfflineDuration } = useOfflineStatus()
  const { healthScore, hasFailedServices } = useCircuitBreakerUI()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Estado de Conexión */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Estado de Conexión
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Estado</span>
            <span className={`text-sm font-medium ${isOffline ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {isOffline ? 'Offline' : 'Online'}
            </span>
          </div>
          {isOffline && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Duración</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formattedOfflineDuration}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Salud de Servicios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Salud de Servicios
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Score General</span>
            <span className={`text-sm font-medium ${healthScore >= 90 ? 'text-green-600 dark:text-green-400' : healthScore >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
              {healthScore}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Estado</span>
            <span className={`text-sm font-medium ${hasFailedServices ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {hasFailedServices ? 'Degradado' : 'Normal'}
            </span>
          </div>
        </div>
      </div>

      {/* PWA Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Estado PWA
        </h3>
        <div className="space-y-3">
          <PWAStatusIndicator className="flex justify-between w-full" />
          <BackgroundSyncManager className="flex justify-between w-full" />
        </div>
      </div>
    </div>
  )
}

// Componentes de tabs específicos (importar los componentes reales)
const OfflineTab = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
      Gestión de Estado Offline
    </h3>
    <p className="text-gray-600 dark:text-gray-400">
      Aquí iría el componente completo de gestión offline con detalles de cache, 
      capacidades offline, y configuración de sincronización.
    </p>
  </div>
)

const ServicesTab = () => (
  <div>
    {/* Aquí iría el HealthDashboard completo */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Dashboard de Servicios
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Aquí iría el HealthDashboard completo con estado detallado de todos los servicios,
        circuit breakers, y controles de recovery.
      </p>
    </div>
  </div>
)

const NotificationsTab = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
      Centro de Notificaciones
    </h3>
    <p className="text-gray-600 dark:text-gray-400">
      Aquí iría la configuración completa del sistema de notificaciones,
      historial, y configuraciones avanzadas.
    </p>
  </div>
)

const PWATab = () => (
  <div className="space-y-6">
    <InstallPrompt />
    <UpdateNotification />
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Información PWA Detallada
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Información completa sobre capacidades PWA, instalación, 
        actualizaciones, y funcionalidades offline.
      </p>
    </div>
  </div>
)

export default {
  Wave5Layout,
  Wave5Dashboard
}
