/**
 * Hook personalizado para gestión simplificada de sesiones
 * Enfoque: MVP Guide - funcionalidad básica navegable
 */

import { useEffect, useCallback } from 'react';
import useSessionStore from '@/store/useSessionStore';
import { telemetry } from '@/utils/telemetry';

/**
 * Hook para gestión de sesiones de usuario
 * Proporciona funciones y estado para manejar sesiones activas
 */
export const useSessions = () => {
  const {
    // Estado de sesiones activas
    activeSessions,
    isLoadingActiveSessions,
    activeSessionsError,
    activeSessionsCount,
    
    // Estado de configuración
    sessionConfig,
    isLoadingConfig,
    configError,
    
    // Estado de acciones
    isRevokingSession,
    revokeError,
    
    // Acciones
    loadActiveSessions,
    loadSessionConfig,
    revokeSession,
    revokeAllOtherSessions,
    findSessionById,
    getSessionStats,
    initializeSessions,
    clearErrors,
    reset
  } = useSessionStore();

  // Inicializar sesiones al montar el hook
  useEffect(() => {
    telemetry.record('hook.sessions.mount');
    initializeSessions();
    
    return () => {
      telemetry.record('hook.sessions.unmount');
    };
  }, [initializeSessions]);

  // Función para refrescar datos de sesiones
  const refreshSessions = useCallback(async () => {
    try {
      telemetry.record('hook.sessions.refresh.start');
      await loadActiveSessions();
      telemetry.record('hook.sessions.refresh.success');
    } catch (error) {
      telemetry.record('hook.sessions.refresh.error', {
        error: error.message
      });
      throw error;
    }
  }, [loadActiveSessions]);

  // Función para cerrar sesión específica con confirmación automática
  const closeSession = useCallback(async (sessionId, skipConfirmation = false) => {
    if (!skipConfirmation) {
      if (!window.confirm('¿Estás seguro de que quieres cerrar esta sesión?')) {
        return false;
      }
    }

    try {
      telemetry.record('hook.sessions.close.start', { sessionId });
      await revokeSession(sessionId);
      telemetry.record('hook.sessions.close.success', { sessionId });
      return true;
    } catch (error) {
      telemetry.record('hook.sessions.close.error', {
        sessionId,
        error: error.message
      });
      throw error;
    }
  }, [revokeSession]);

  // Función para cerrar todas las otras sesiones con confirmación automática
  const closeAllOtherSessions = useCallback(async (skipConfirmation = false) => {
    if (!skipConfirmation) {
      const count = activeSessions.length - 1; // Excluir sesión actual
      if (count <= 0) {
        return { success: true, revoked_count: 0 };
      }
      
      if (!window.confirm(`¿Estás seguro de que quieres cerrar ${count} sesión(es)? Solo mantendrás la sesión actual.`)) {
        return false;
      }
    }

    try {
      telemetry.record('hook.sessions.close_all.start');
      const result = await revokeAllOtherSessions();
      telemetry.record('hook.sessions.close_all.success', {
        revoked_count: result.revoked_count
      });
      return result;
    } catch (error) {
      telemetry.record('hook.sessions.close_all.error', {
        error: error.message
      });
      throw error;
    }
  }, [revokeAllOtherSessions, activeSessions.length]);

  // Función para obtener la sesión actual
  const getCurrentSession = useCallback(() => {
    const currentToken = localStorage.getItem('authToken');
    if (!currentToken || activeSessions.length === 0) {
      return null;
    }
    
    // Buscar la sesión más reciente activa (normalmente la actual)
    const recentSessions = activeSessions
      .filter(session => session.is_active)
      .sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));
    
    return recentSessions[0] || null;
  }, [activeSessions]);

  // Función para verificar si se puede cerrar una sesión
  const canCloseSession = useCallback((sessionId) => {
    const currentSession = getCurrentSession();
    
    // No se puede cerrar la sesión actual
    if (currentSession && currentSession.id === sessionId) {
      return { canClose: false, reason: 'No puedes cerrar tu sesión actual' };
    }
    
    // Verificar si la sesión existe
    const session = findSessionById(sessionId);
    if (!session) {
      return { canClose: false, reason: 'La sesión no existe' };
    }
    
    // Verificar si la sesión está activa
    if (!session.is_active) {
      return { canClose: false, reason: 'La sesión ya está cerrada' };
    }
    
    return { canClose: true, reason: null };
  }, [getCurrentSession, findSessionById]);

  // Estadísticas útiles
  const stats = getSessionStats();
  const currentSession = getCurrentSession();
  
  // Información de seguridad
  const securityInfo = {
    hasMultipleSessions: activeSessions.length > 1,
    hasExpiringSessions: activeSessions.some(session => {
      const expiresAt = new Date(session.expires_at);
      const now = new Date();
      const hoursToExpiry = (expiresAt - now) / (1000 * 60 * 60);
      return hoursToExpiry < 24 && hoursToExpiry > 0;
    }),
    hasOldSessions: activeSessions.some(session => {
      const lastActivity = new Date(session.last_activity);
      const now = new Date();
      const hoursInactive = (now - lastActivity) / (1000 * 60 * 60);
      return hoursInactive > 24;
    })
  };

  return {
    // Estado de sesiones
    sessions: activeSessions,
    isLoading: isLoadingActiveSessions,
    error: activeSessionsError,
    count: activeSessionsCount,
    
    // Configuración
    config: sessionConfig,
    isLoadingConfig,
    configError,
    
    // Estado de acciones
    isClosingSession: isRevokingSession,
    closeError: revokeError,
    
    // Información útil
    currentSession,
    stats,
    securityInfo,
    
    // Acciones principales
    refreshSessions,
    closeSession,
    closeAllOtherSessions,
    
    // Utilidades
    findSession: findSessionById,
    canCloseSession,
    getCurrentSession,
    
    // Control de errores
    clearErrors,
    
    // Reset (útil para cleanup)
    reset
  };
};

export default useSessions;
