import React, { useState } from 'react'
import { useCircuitBreakerUI, useSmartNotifications } from '@/hooks/useWave5'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  BarChart3 
} from 'lucide-react'

// Dashboard principal de salud del sistema
export const HealthDashboard = ({ className = '' }) => {
  const { 
    serviceStates, 
    healthScore, 
    systemHealthColor,
    hasFailedServices,
    failedServicesCount,
    totalServicesCount,
    forceRecovery
  } = useCircuitBreakerUI()

  const { notifyRecovery } = useSmartNotifications()

  const handleForceRecovery = (serviceName) => {
    notifyRecovery(serviceName)
    forceRecovery(serviceName)
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Estado de Servicios
            </h3>
          </div>
          
          <SystemHealthIndicator 
            score={healthScore} 
            color={systemHealthColor}
            failedCount={failedServicesCount}
            totalCount={totalServicesCount}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(serviceStates).map(([serviceName, serviceData]) => (
            <ServiceStatusCard
              key={serviceName}
              serviceName={serviceName}
              serviceData={serviceData}
              onForceRecovery={() => handleForceRecovery(serviceName)}
            />
          ))}
        </div>

        {hasFailedServices && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="font-medium text-red-800 dark:text-red-200">
                {failedServicesCount} servicio{failedServicesCount > 1 ? 's' : ''} no disponible{failedServicesCount > 1 ? 's' : ''}
              </span>
            </div>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              El sistema está funcionando en modo degradado. Algunas funcionalidades pueden no estar disponibles.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Indicador general de salud del sistema
const SystemHealthIndicator = ({ score, color, failedCount, totalCount }) => {
  const getHealthLabel = () => {
    if (score >= 90) return 'Excelente'
    if (score >= 70) return 'Bueno'
    if (score >= 50) return 'Regular'
    return 'Crítico'
  }

  const getHealthIcon = () => {
    if (score >= 90) return <CheckCircle className="h-5 w-5" />
    if (score >= 70) return <TrendingUp className="h-5 w-5" />
    if (score >= 50) return <TrendingDown className="h-5 w-5" />
    return <XCircle className="h-5 w-5" />
  }

  const colorClasses = {
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  return (
    <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg border ${colorClasses[color]}`}>
      {getHealthIcon()}
      <div>
        <div className="font-medium">{score}% - {getHealthLabel()}</div>
        <div className="text-xs">
          {totalCount - failedCount}/{totalCount} servicios activos
        </div>
      </div>
    </div>
  )
}

// Tarjeta individual de estado de servicio
const ServiceStatusCard = ({ serviceName, serviceData, onForceRecovery }) => {
  const getServiceIcon = (name) => {
    const icons = {
      purchases: '🛒',
      products: '📦',
      analytics: '📊',
      auth: '🔐'
    }
    return icons[name] || '⚙️'
  }

  const getStateColor = (state) => {
    switch (state) {
      case 'closed': return 'green'
      case 'half-open': return 'yellow'
      case 'open': return 'red'
      default: return 'gray'
    }
  }

  const getStateLabel = (state) => {
    switch (state) {
      case 'closed': return 'Funcionando'
      case 'half-open': return 'Recuperándose'
      case 'open': return 'Fallando'
      default: return 'Desconocido'
    }
  }

  const getStateIcon = (state) => {
    switch (state) {
      case 'closed': return <CheckCircle className="h-4 w-4" />
      case 'half-open': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'open': return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const color = getStateColor(serviceData.state)
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    gray: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
  }

  const textColorClasses = {
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-gray-600 dark:text-gray-400'
  }

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getServiceIcon(serviceName)}</span>
          <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
            {serviceName}
          </span>
        </div>
        <div className={`flex items-center space-x-1 ${textColorClasses[color]}`}>
          {getStateIcon(serviceData.state)}
        </div>
      </div>

      <div className="space-y-2">
        <div className={`text-sm font-medium ${textColorClasses[color]}`}>
          {getStateLabel(serviceData.state)}
        </div>

        {serviceData.failures > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {serviceData.failures} fallo{serviceData.failures > 1 ? 's' : ''} reciente{serviceData.failures > 1 ? 's' : ''}
          </div>
        )}

        {serviceData.lastFailure && (
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Último fallo: {new Date(serviceData.lastFailure).toLocaleTimeString()}
          </div>
        )}

        {serviceData.state === 'open' && (
          <button
            onClick={onForceRecovery}
            className="w-full mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:ring-offset-2 transition-colors"
          >
            Forzar Recuperación
          </button>
        )}
      </div>
    </div>
  )
}

// Barra de progreso de recuperación
export const RecoveryProgress = ({ serviceName, progress = 0, status = 'idle' }) => {
  if (status === 'idle') return null

  const getStatusColor = () => {
    switch (status) {
      case 'recovering': return 'blue'
      case 'recovered': return 'green'
      case 'failed': return 'red'
      default: return 'gray'
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'recovering': return 'Recuperándose...'
      case 'recovered': return 'Recuperado'
      case 'failed': return 'Falló recuperación'
      default: return 'Preparando...'
    }
  }

  const color = getStatusColor()
  const bgColorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    gray: 'bg-gray-600'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <RefreshCw className={`h-4 w-4 ${status === 'recovering' ? 'animate-spin' : ''}`} />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            Recuperando {serviceName}
          </span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${bgColorClasses[color]}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        {getStatusLabel()}
      </div>
    </div>
  )
}

// Indicador compacto de estado para la barra superior
export const SystemStatusIndicator = ({ className = '' }) => {
  const { healthScore, systemHealthColor, hasFailedServices } = useCircuitBreakerUI()
  const [showTooltip, setShowTooltip] = useState(false)

  const getStatusIcon = () => {
    if (hasFailedServices) return <XCircle className="h-4 w-4" />
    if (healthScore >= 90) return <CheckCircle className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400'
  }

  return (
    <div 
      className={`relative flex items-center space-x-1 ${colorClasses[systemHealthColor]} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {getStatusIcon()}
      <span className="text-sm font-medium">{healthScore}%</span>

      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 dark:bg-gray-700 text-white 
                      text-xs rounded px-2 py-1 z-50">
          Estado del sistema: {healthScore >= 90 ? 'Excelente' : healthScore >= 70 ? 'Bueno' : 'Degradado'}
        </div>
      )}
    </div>
  )
}

// Modal de detalles de salud del sistema
export const ServiceHealthModal = ({ isOpen, onClose }) => {
  const { serviceStates, healthScore } = useCircuitBreakerUI()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 
                      text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Estado Detallado de Servicios
                </h3>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {healthScore}%
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(serviceStates).map(([serviceName, serviceData]) => (
                <div key={serviceName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {serviceName}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium
                      ${serviceData.state === 'closed' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : serviceData.state === 'half-open'
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                      }`}>
                      {serviceData.state === 'closed' ? 'Funcionando' 
                       : serviceData.state === 'half-open' ? 'Recuperándose' 
                       : 'Fallando'}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>Fallos: {serviceData.failures}</div>
                    {serviceData.lastFailure && (
                      <div>Último fallo: {new Date(serviceData.lastFailure).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full justify-center rounded-md border border-transparent 
                       bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm 
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
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
  HealthDashboard,
  RecoveryProgress,
  SystemStatusIndicator,
  ServiceHealthModal
}
