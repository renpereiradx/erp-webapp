/**
 * API Status Indicator Component
 * Shows the current status of API endpoints to help users understand system availability
 */

import React, { useState, useEffect } from 'react';
import { Server, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';

export const ApiStatusIndicator = ({ 
  showDetails = false, 
  className = "",
  onStatusChange,
  endpoints = [
    { name: 'Server', path: '/', label: 'Servidor Principal' },
    { name: 'Products', path: '/products/products/1/10', label: 'API de Productos' },
    { name: 'Reservations', path: '/reserve/report', label: 'API de Reservas' },
    { name: 'Schedules', path: '/schedules/1', label: 'API de Horarios' }
  ]
}) => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  const [statuses, setStatuses] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  const checkEndpoint = async (endpoint) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050';
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        return { status: 'available', message: 'Disponible' };
      } else if (response.status === 404) {
        return { status: 'not_implemented', message: 'No implementado' };
      } else if (response.status === 401) {
        return { status: 'auth_required', message: 'Requiere autenticación' };
      } else {
        return { status: 'error', message: `Error ${response.status}` };
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { status: 'offline', message: 'Servidor no disponible' };
      }
      return { status: 'error', message: 'Error de conexión' };
    }
  };

  const checkAllEndpoints = async () => {
    setIsChecking(true);
    const newStatuses = {};
    
    for (const endpoint of endpoints) {
      newStatuses[endpoint.name] = await checkEndpoint(endpoint);
    }
    
    setStatuses(newStatuses);
    setLastCheck(new Date());
    setIsChecking(false);
    
    if (onStatusChange) {
      onStatusChange(newStatuses);
    }
  };

  // NO verificar endpoints automáticamente - debe ser explícito
  // useEffect(() => {
  //   checkAllEndpoints();
  // }, []);

  const getStatusIcon = (status) => {
    switch (status?.status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'not_implemented':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'auth_required':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />;
    }
  };

  const getOverallStatus = () => {
    const statusValues = Object.values(statuses);
    if (statusValues.some(s => s.status === 'available')) {
      if (statusValues.some(s => s.status === 'not_implemented')) {
        return 'partial';
      }
      return 'good';
    }
    if (statusValues.some(s => s.status === 'offline')) {
      return 'offline';
    }
    return 'unknown';
  };

  const overallStatus = getOverallStatus();

  if (!showDetails) {
    // Compact indicator - solo muestra si hay datos
    if (Object.keys(statuses).length === 0) {
      return (
        <button 
          onClick={checkAllEndpoints}
          className={`inline-flex items-center gap-2 text-sm hover:text-foreground transition-colors ${className}`}
        >
          <Server className="w-4 h-4" />
          <span className="hidden sm:inline">Verificar API</span>
          <div className="w-2 h-2 rounded-full bg-gray-400" />
        </button>
      );
    }

    return (
      <div className={`inline-flex items-center gap-2 text-sm ${className}`}>
        <Server className="w-4 h-4" />
        <span className="hidden sm:inline">
          {overallStatus === 'good' && 'Sistema disponible'}
          {overallStatus === 'partial' && 'Funcionalidad limitada'}
          {overallStatus === 'offline' && 'Sistema no disponible'}
          {overallStatus === 'unknown' && 'Estado desconocido'}
        </span>
        <div className={`w-2 h-2 rounded-full ${
          overallStatus === 'good' ? 'bg-green-500' :
          overallStatus === 'partial' ? 'bg-amber-500' :
          overallStatus === 'offline' ? 'bg-red-500' : 'bg-gray-400'
        }`} />
      </div>
    );
  }

  // Detailed indicator
  return (
    <div className={`${styles.card('p-4')} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          <h3 className="font-semibold">Estado de la API</h3>
        </div>
        <button
          onClick={checkAllEndpoints}
          disabled={isChecking}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Verificando...' : 'Actualizar'}
        </button>
      </div>

      {Object.keys(statuses).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Server className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm mb-4">Haz clic en "Actualizar" para verificar el estado de la API</p>
        </div>
      ) : (
        <div className="space-y-2">
          {endpoints.map(endpoint => {
            const status = statuses[endpoint.name];
            return (
              <div key={endpoint.name} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status)}
                  <span className="text-sm font-medium">{endpoint.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {status?.message || 'Sin verificar'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {lastCheck && Object.keys(statuses).length > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          Última verificación: {lastCheck.toLocaleTimeString()}
        </p>
      )}

      {overallStatus === 'partial' && (
        <div className="mt-3 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Funcionalidad limitada</p>
              <p className="text-xs mt-1">
                Algunos servicios aún no están configurados. Contacte al administrador 
                del sistema para completar la implementación de la API.
              </p>
            </div>
          </div>
        </div>
      )}

      {overallStatus === 'offline' && (
        <div className="mt-3 p-3 rounded-md bg-red-50 border border-red-200 text-red-800">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Sistema no disponible</p>
              <p className="text-xs mt-1">
                No se puede conectar con el servidor. Verifique su conexión a internet 
                y que el servidor esté funcionando.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiStatusIndicator;