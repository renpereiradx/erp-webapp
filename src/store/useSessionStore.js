/**
 * Store de Zustand para gestión de sesiones de usuario
 * Extiende las funcionalidades básicas de autenticación con gestión de sesiones del USER_SESSION_API
 * Enfoque: MVP Guide - funcionalidad básica navegable
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { sessionService } from '@/services/sessionService';
import { telemetry } from '@/utils/telemetry';

const useSessionStore = create(
  devtools(
    (set, get) => ({
      // Estado de sesiones activas
      activeSessions: [],
      isLoadingActiveSessions: false,
      activeSessionsError: null,
      activeSessionsCount: 0,

      // Estado de historial de sesiones
      sessionHistory: [],
      isLoadingHistory: false,
      historyError: null,
      historyPagination: {
        page: 1,
        pageSize: 20,
        totalCount: 0
      },

      // Estado de log de actividad
      activityLog: [],
      isLoadingActivity: false,
      activityError: null,
      activityPagination: {
        page: 1,
        pageSize: 20,
        totalCount: 0
      },

      // Estado de configuración de sesiones
      sessionConfig: null,
      isLoadingConfig: false,
      configError: null,

      // Estado de acciones de sesión
      isRevokingSession: false,
      revokeError: null,

      /**
       * Limpiar errores
       */
      clearErrors: () => set({
        activeSessionsError: null,
        historyError: null,
        activityError: null,
        configError: null,
        revokeError: null
      }),

      /**
       * Cargar sesiones activas del usuario
       */
      loadActiveSessions: async () => {
        set({ isLoadingActiveSessions: true, activeSessionsError: null });

        try {
          telemetry.record('feature.sessions.active_sessions.load.start');
          
          const response = await sessionService.getActiveSessions();
          
          set({
            activeSessions: response.data || [],
            activeSessionsCount: response.count || 0,
            isLoadingActiveSessions: false,
            activeSessionsError: null
          });

          telemetry.record('feature.sessions.active_sessions.load.success', {
            count: response.count || 0
          });

          return response.data || [];
        } catch (error) {
          const errorMessage = error.message || 'Error al cargar sesiones activas';
          
          set({
            activeSessionsError: errorMessage,
            isLoadingActiveSessions: false,
            activeSessions: []
          });

          telemetry.record('feature.sessions.active_sessions.load.error', {
            error: errorMessage
          });

          throw error;
        }
      },

      /**
       * Cargar historial de sesiones con paginación
       */
      loadSessionHistory: async (page = 1, pageSize = 20) => {
        set({ isLoadingHistory: true, historyError: null });

        try {
          telemetry.record('feature.sessions.history.load.start', { page, pageSize });
          
          const response = await sessionService.getSessionHistory({ page, page_size: pageSize });
          
          set({
            sessionHistory: response.data || [],
            historyPagination: {
              page: response.page || page,
              pageSize: response.page_size || pageSize,
              totalCount: response.count || 0
            },
            isLoadingHistory: false,
            historyError: null
          });

          telemetry.record('feature.sessions.history.load.success', {
            page,
            count: response.count || 0
          });

          return response.data || [];
        } catch (error) {
          const errorMessage = error.message || 'Error al cargar historial de sesiones';
          
          set({
            historyError: errorMessage,
            isLoadingHistory: false,
            sessionHistory: []
          });

          telemetry.record('feature.sessions.history.load.error', {
            error: errorMessage,
            page
          });

          throw error;
        }
      },

      /**
       * Cargar log de actividad con paginación
       */
      loadActivityLog: async (page = 1, pageSize = 20) => {
        set({ isLoadingActivity: true, activityError: null });

        try {
          telemetry.record('feature.sessions.activity.load.start', { page, pageSize });
          
          const response = await sessionService.getActivityLog({ page, page_size: pageSize });
          
          set({
            activityLog: response.data || [],
            activityPagination: {
              page: response.page || page,
              pageSize: response.page_size || pageSize,
              totalCount: response.count || 0
            },
            isLoadingActivity: false,
            activityError: null
          });

          telemetry.record('feature.sessions.activity.load.success', {
            page,
            count: response.count || 0
          });

          return response.data || [];
        } catch (error) {
          const errorMessage = error.message || 'Error al cargar log de actividad';
          
          set({
            activityError: errorMessage,
            isLoadingActivity: false,
            activityLog: []
          });

          telemetry.record('feature.sessions.activity.load.error', {
            error: errorMessage,
            page
          });

          throw error;
        }
      },

      /**
       * Cargar configuración de sesiones según el rol del usuario
       */
      loadSessionConfig: async () => {
        set({ isLoadingConfig: true, configError: null });

        try {
          telemetry.record('feature.sessions.config.load.start');
          
          const response = await sessionService.getSessionConfig();
          
          set({
            sessionConfig: response.data || null,
            isLoadingConfig: false,
            configError: null
          });

          telemetry.record('feature.sessions.config.load.success');

          return response.data || null;
        } catch (error) {
          const errorMessage = error.message || 'Error al cargar configuración de sesiones';
          
          set({
            configError: errorMessage,
            isLoadingConfig: false,
            sessionConfig: null
          });

          telemetry.record('feature.sessions.config.load.error', {
            error: errorMessage
          });

          throw error;
        }
      },

      /**
       * Revocar una sesión específica
       */
      revokeSession: async (sessionId) => {
        set({ isRevokingSession: true, revokeError: null });

        try {
          telemetry.record('feature.sessions.revoke.start', { sessionId });
          
          const response = await sessionService.revokeSession(sessionId);
          
          // Actualizar la lista de sesiones activas eliminando la sesión revocada
          const currentSessions = get().activeSessions;
          const updatedSessions = currentSessions.filter(session => session.id !== sessionId);
          
          set({
            activeSessions: updatedSessions,
            activeSessionsCount: updatedSessions.length,
            isRevokingSession: false,
            revokeError: null
          });

          telemetry.record('feature.sessions.revoke.success', { sessionId });

          return response;
        } catch (error) {
          const errorMessage = error.message || 'Error al revocar sesión';
          
          set({
            revokeError: errorMessage,
            isRevokingSession: false
          });

          telemetry.record('feature.sessions.revoke.error', {
            error: errorMessage,
            sessionId
          });

          throw error;
        }
      },

      /**
       * Revocar todas las otras sesiones excepto la actual
       */
      revokeAllOtherSessions: async () => {
        set({ isRevokingSession: true, revokeError: null });

        try {
          telemetry.record('feature.sessions.revoke_all.start');
          
          const response = await sessionService.revokeAllOtherSessions();
          
          // Recargar sesiones activas para reflejar los cambios
          await get().loadActiveSessions();
          
          set({
            isRevokingSession: false,
            revokeError: null
          });

          telemetry.record('feature.sessions.revoke_all.success', {
            revokedCount: response.revoked_count || 0
          });

          return response;
        } catch (error) {
          const errorMessage = error.message || 'Error al revocar todas las sesiones';
          
          set({
            revokeError: errorMessage,
            isRevokingSession: false
          });

          telemetry.record('feature.sessions.revoke_all.error', {
            error: errorMessage
          });

          throw error;
        }
      },

      /**
       * Buscar sesión por ID en las listas locales
       */
      findSessionById: (sessionId) => {
        const { activeSessions, sessionHistory } = get();
        
        return activeSessions.find(s => s.id === sessionId) || 
               sessionHistory.find(s => s.id === sessionId) || 
               null;
      },

      /**
       * Obtener estadísticas básicas de sesiones
       */
      getSessionStats: () => {
        const { activeSessions, sessionHistory } = get();
        
        return {
          activeCount: activeSessions.length,
          totalHistoryCount: sessionHistory.length,
          activeDeviceTypes: [...new Set(activeSessions.map(s => s.device_type).filter(Boolean))],
          lastActivity: activeSessions.length > 0 
            ? Math.max(...activeSessions.map(s => new Date(s.last_activity).getTime()))
            : null
        };
      },

      /**
       * Inicializar datos de sesiones (cargar config y sesiones activas)
       */
      initializeSessions: async () => {
        try {
          // Cargar configuración de sesiones y sesiones activas en paralelo
          await Promise.allSettled([
            get().loadSessionConfig(),
            get().loadActiveSessions()
          ]);
        } catch (error) {
          // Los errores individuales ya son manejados por cada función
          telemetry.record('feature.sessions.initialize.error', {
            error: error.message
          });
        }
      },

      /**
       * Reset del store
       */
      reset: () => set({
        activeSessions: [],
        isLoadingActiveSessions: false,
        activeSessionsError: null,
        activeSessionsCount: 0,
        sessionHistory: [],
        isLoadingHistory: false,
        historyError: null,
        historyPagination: { page: 1, pageSize: 20, totalCount: 0 },
        activityLog: [],
        isLoadingActivity: false,
        activityError: null,
        activityPagination: { page: 1, pageSize: 20, totalCount: 0 },
        sessionConfig: null,
        isLoadingConfig: false,
        configError: null,
        isRevokingSession: false,
        revokeError: null
      })
    }),
    {
      name: 'session-store' // Nombre para DevTools
    }
  )
);

// Hacer el store disponible globalmente para debugging
if (typeof window !== 'undefined') {
  window.useSessionStore = useSessionStore;
}

export default useSessionStore;
