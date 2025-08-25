/**
 * Ejemplo de uso del sistema de gestión de sesiones
 * Este archivo demuestra cómo integrar las nuevas funcionalidades
 */

import React, { useEffect } from 'react';
import { useSessions } from '@/hooks/useSessions';
import { telemetry } from '@/utils/telemetry';

// Ejemplo 1: Componente básico para mostrar sesiones activas
const SessionsWidget = () => {
  const { 
    sessions, 
    isLoading, 
    error, 
    currentSession, 
    securityInfo,
    refreshSessions 
  } = useSessions();

  useEffect(() => {
    telemetry.record('widget.sessions.mounted');
  }, []);

  if (isLoading) {
    return <div>Cargando sesiones...</div>;
  }

  if (error) {
    return (
      <div className="error-widget">
        <p>Error: {error}</p>
        <button onClick={refreshSessions}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="sessions-widget">
      <h3>Sesiones Activas ({sessions.length})</h3>
      
      {securityInfo.hasMultipleSessions && (
        <div className="security-alert">
          ⚠️ Tienes múltiples sesiones activas
        </div>
      )}
      
      {sessions.map(session => (
        <div key={session.id} className="session-item">
          <span>{session.device_type}</span>
          <span>{session.ip_address}</span>
          {currentSession?.id === session.id && <span>Actual</span>}
        </div>
      ))}
    </div>
  );
};

// Ejemplo 2: Hook para acciones de sesión
const useSessionActions = () => {
  const { closeSession, closeAllOtherSessions, canCloseSession } = useSessions();

  const handleSecurityIncident = async () => {
    try {
      const result = await closeAllOtherSessions(true); // Skip confirmation
      alert(`Se cerraron ${result.revoked_count} sesiones por seguridad`);
      telemetry.record('security.incident.sessions_revoked', {
        count: result.revoked_count
      });
    } catch (error) {
      console.error('Error en incidente de seguridad:', error);
    }
  };

  const handleSuspiciousSession = async (sessionId) => {
    const { canClose, reason } = canCloseSession(sessionId);
    
    if (!canClose) {
      alert(`No se puede cerrar la sesión: ${reason}`);
      return;
    }

    try {
      await closeSession(sessionId, true); // Skip confirmation
      telemetry.record('security.suspicious_session.revoked', { sessionId });
    } catch (error) {
      console.error('Error al cerrar sesión sospechosa:', error);
    }
  };

  return {
    handleSecurityIncident,
    handleSuspiciousSession
  };
};

// Ejemplo 3: Componente de seguridad avanzado
const SecurityDashboard = () => {
  const { 
    sessions, 
    stats, 
    securityInfo, 
    config 
  } = useSessions();
  
  const { handleSecurityIncident } = useSessionActions();

  const securityScore = () => {
    let score = 100;
    
    if (securityInfo.hasMultipleSessions) score -= 10;
    if (securityInfo.hasExpiringSessions) score -= 15;
    if (securityInfo.hasOldSessions) score -= 20;
    if (sessions.length > (config?.max_concurrent_sessions || 5)) score -= 25;
    
    return Math.max(score, 0);
  };

  return (
    <div className="security-dashboard">
      <h2>Dashboard de Seguridad</h2>
      
      <div className="security-score">
        <h3>Puntuación de Seguridad: {securityScore()}/100</h3>
      </div>

      <div className="security-metrics">
        <div>Sesiones Activas: {stats.activeCount}</div>
        <div>Tipos de Dispositivo: {stats.activeDeviceTypes.length}</div>
        <div>Límite Configurado: {config?.max_concurrent_sessions || 'N/A'}</div>
      </div>

      <div className="security-alerts">
        {securityInfo.hasMultipleSessions && (
          <div className="alert warning">
            ⚠️ Múltiples sesiones detectadas
          </div>
        )}
        
        {securityInfo.hasExpiringSessions && (
          <div className="alert info">
            ℹ️ Algunas sesiones expirarán pronto
          </div>
        )}
        
        {securityInfo.hasOldSessions && (
          <div className="alert danger">
            🚨 Sesiones inactivas por más de 24 horas
            <button onClick={handleSecurityIncident}>
              Cerrar todas las otras sesiones
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Ejemplo 4: Integración con el sistema de autenticación existente
const EnhancedAuthButton = () => {
  const { logout } = useAuthStore();
  const { closeAllOtherSessions } = useSessions();

  const handleSecureLogout = async () => {
    try {
      // Primero cerrar todas las otras sesiones
      await closeAllOtherSessions(true);
      
      // Luego cerrar sesión normalmente
      await logout();
      
      telemetry.record('auth.secure_logout.success');
    } catch (error) {
      // Cerrar sesión local aunque falle en el servidor
      await logout();
      telemetry.record('auth.secure_logout.partial', {
        error: error.message
      });
    }
  };

  return (
    <button onClick={handleSecureLogout}>
      Cerrar Sesión Segura
    </button>
  );
};

// Ejemplo 5: Monitoring en tiempo real (simulado)
const SessionMonitor = () => {
  const { refreshSessions, sessions } = useSessions();
  
  useEffect(() => {
    // Actualizar sesiones cada 5 minutos
    const interval = setInterval(() => {
      refreshSessions();
      telemetry.record('monitor.sessions.auto_refresh');
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshSessions]);

  useEffect(() => {
    // Detectar cambios en el número de sesiones
    telemetry.record('monitor.sessions.count_changed', {
      count: sessions.length
    });
  }, [sessions.length]);

  return null; // Componente invisible de monitoring
};

// Exportar componentes de ejemplo
export {
  SessionsWidget,
  useSessionActions,
  SecurityDashboard,
  EnhancedAuthButton,
  SessionMonitor
};
