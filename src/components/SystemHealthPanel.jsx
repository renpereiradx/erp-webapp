import React, { useState, useEffect } from 'react';
import { useObservability } from '../hooks/useObservability';
import { useMetricsStore } from '../store/useMetricsStore';

const SystemHealthPanel = () => {
  const { getSystemStatus } = useObservability();
  const { alerts, dismissAlert, clearAllAlerts } = useMetricsStore();
  const [systemStatus, setSystemStatus] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Update system status
  useEffect(() => {
    const updateStatus = () => {
      setSystemStatus(getSystemStatus());
    };

    updateStatus();
    const interval = setInterval(updateStatus, refreshInterval);
    
    return () => clearInterval(interval);
  }, [getSystemStatus, refreshInterval]);

  if (!systemStatus) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'degraded':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'excellent':
        return (
          <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'good':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'degraded':
        return (
          <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4a1 1 0 112 0 1 1 0 01-2 0zm1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatMetricValue = (value, type) => {
    if (typeof value !== 'number') return 'N/A';
    
    switch (type) {
      case 'ms':
        return `${value.toFixed(0)}ms`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'count':
        return value.toString();
      default:
        return value.toFixed(2);
    }
  };

  const getMetricStatus = (value, thresholds) => {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    return 'degraded';
  };

  return (
    <div className="space-y-6">
      {/* Overall System Health */}
      <div className={`bg-white rounded-lg shadow-sm border-2 p-6 ${getHealthStatusColor(systemStatus.status)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getHealthIcon(systemStatus.status)}
            <div>
              <h2 className="text-xl font-bold">Estado del Sistema</h2>
              <p className="text-sm opacity-75 capitalize">{systemStatus.status}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{systemStatus.healthScore}%</div>
            <div className="text-sm opacity-75">Puntuación de Salud</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              systemStatus.status === 'excellent' ? 'bg-green-500' :
              systemStatus.status === 'good' ? 'bg-blue-500' : 'bg-red-500'
            }`}
            style={{ width: `${systemStatus.healthScore}%` }}
          ></div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Response Time */}
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Tiempo de Respuesta</h3>
            <div className={`w-3 h-3 rounded-full ${
              systemStatus.metrics.performance < 200 ? 'bg-green-400' :
              systemStatus.metrics.performance < 500 ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatMetricValue(systemStatus.metrics.performance, 'ms')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {systemStatus.metrics.performance < 200 ? 'Excelente' :
             systemStatus.metrics.performance < 500 ? 'Bueno' : 'Lento'}
          </div>
        </div>

        {/* Cache Hit Ratio */}
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Cache Hit Ratio</h3>
            <div className={`w-3 h-3 rounded-full ${
              systemStatus.metrics.cacheHitRatio > 80 ? 'bg-green-400' :
              systemStatus.metrics.cacheHitRatio > 60 ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatMetricValue(systemStatus.metrics.cacheHitRatio, 'percentage')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {systemStatus.metrics.cacheHitRatio > 80 ? 'Eficiente' :
             systemStatus.metrics.cacheHitRatio > 60 ? 'Moderado' : 'Bajo'}
          </div>
        </div>

        {/* Error Rate */}
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Tasa de Errores</h3>
            <div className={`w-3 h-3 rounded-full ${
              systemStatus.metrics.errorRate < 1 ? 'bg-green-400' :
              systemStatus.metrics.errorRate < 5 ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatMetricValue(systemStatus.metrics.errorRate, 'percentage')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {systemStatus.metrics.errorRate < 1 ? 'Estable' :
             systemStatus.metrics.errorRate < 5 ? 'Moderado' : 'Alto'}
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Usuarios Activos</h3>
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatMetricValue(systemStatus.metrics.activeUsers, 'count')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Sesiones activas
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Alertas Activas ({alerts.length})
            </h3>
            <button
              onClick={clearAllAlerts}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Limpiar Todas
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-md border-l-4 ${
                  alert.type === 'critical' 
                    ? 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-yellow-50 border-yellow-400 text-yellow-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.message}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="ml-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Configuración de Monitoreo</h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Intervalo de actualización:</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1000}>1 segundo</option>
                <option value={5000}>5 segundos</option>
                <option value={10000}>10 segundos</option>
                <option value={30000}>30 segundos</option>
              </select>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {systemStatus.healthy ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Sistema Saludable</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {alerts.filter(a => a.type === 'warning').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Advertencias</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.type === 'critical').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Críticos</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPanel;
