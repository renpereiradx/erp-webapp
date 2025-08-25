/**
 * Servicio para gestión de sesiones de usuario
 * Integra los nuevos endpoints de USER_SESSION_API
 * Enfoque: MVP Guide - funcionalidad básica navegable
 */

import { apiClient } from './api';
import { telemetry } from '@/utils/telemetry';

/**
 * @typedef {Object} Session
 * @property {number} id
 * @property {string} user_id
 * @property {string} token_hash
 * @property {string} [ip_address]
 * @property {string} [user_agent]
 * @property {string} [device_type] - desktop|mobile|tablet|unknown
 * @property {boolean} is_active
 * @property {string} last_activity - "YYYY-MM-DD HH:mm:ss"
 * @property {string} expires_at
 * @property {string} created_at
 * @property {string} [revoked_at]
 * @property {string} [revoked_by]
 * @property {string} [revoke_reason]
 */

/**
 * @typedef {Object} UserActivityLog
 * @property {number} id
 * @property {string} user_id
 * @property {number} [session_id]
 * @property {string} activity_type - LOGIN|LOGOUT|API_CALL|SESSION_REVOKED
 * @property {string} [endpoint]
 * @property {string} [http_method]
 * @property {string} [ip_address]
 * @property {string} [user_agent]
 * @property {string} [request_data]
 * @property {number} [response_status]
 * @property {number} [duration_ms]
 * @property {string} created_at
 */

/**
 * @typedef {Object} SessionConfig
 * @property {string} role_id
 * @property {number} max_concurrent_sessions
 * @property {number} session_timeout_minutes
 * @property {number} inactivity_timeout_minutes
 * @property {boolean} require_device_verification
 * @property {boolean} allow_multiple_locations
 * @property {boolean} force_logout_on_password_change
 */

const BASE_URL = '/api';

// Helper para wrapper básico con retry
const _fetchWithRetry = async (url, options = {}) => {
  const { retries = 2, baseDelay = 300, ...fetchOptions } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          ...fetchOptions.headers,
        },
        ...fetchOptions,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      
      // Backoff simple exponencial
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const sessionService = {
  /**
   * Obtener sesiones activas del usuario actual
   * @returns {Promise<{success: boolean, data: Session[], count: number}>}
   */
  async getActiveSessions() {
    const startTime = Date.now();
    
    try {
      telemetry.record('feature.auth.sessions.load.start');
      
      const result = await _fetchWithRetry('/sessions/active');
      
      telemetry.record('feature.auth.sessions.load.success', {
        duration: Date.now() - startTime,
        count: result.count || 0
      });
      
      return result;
    } catch (error) {
      telemetry.record('feature.auth.sessions.load.error', {
        duration: Date.now() - startTime,
        error: error.message,
        status: error.status
      });
      
      // Manejo de errores user-friendly
      if (error.status === 401) {
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (error.status === 403) {
        throw new Error('No tienes permisos para ver las sesiones activas.');
      } else if (error.status >= 500) {
        throw new Error('Error del servidor al obtener las sesiones. Intenta más tarde.');
      } else {
        throw new Error(error.message || 'Error al cargar las sesiones activas.');
      }
    }
  },

  /**
   * Obtener historial completo de sesiones
   * @param {Object} params - Parámetros de paginación
   * @param {number} [params.page=1] - Página actual
   * @param {number} [params.page_size=20] - Tamaño de página
   * @returns {Promise<{success: boolean, data: Session[], page: number, page_size: number, count: number}>}
   */
  async getSessionHistory(params = {}) {
    const { page = 1, page_size = 20 } = params;
    const startTime = Date.now();
    
    try {
      telemetry.record('feature.auth.sessions.history.load.start', { page, page_size });
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        page_size: page_size.toString()
      });
      
      const result = await _fetchWithRetry(`/sessions/history?${queryParams}`);
      
      telemetry.record('feature.auth.sessions.history.load.success', {
        duration: Date.now() - startTime,
        page,
        count: result.count || 0
      });
      
      return result;
    } catch (error) {
      telemetry.record('feature.auth.sessions.history.load.error', {
        duration: Date.now() - startTime,
        error: error.message,
        status: error.status,
        page
      });
      
      if (error.status === 401) {
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (error.status >= 500) {
        throw new Error('Error del servidor al obtener el historial. Intenta más tarde.');
      } else {
        throw new Error(error.message || 'Error al cargar el historial de sesiones.');
      }
    }
  },

  /**
   * Revocar una sesión específica
   * @param {number} sessionId - ID de la sesión a revocar
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async revokeSession(sessionId) {
    const startTime = Date.now();
    
    try {
      telemetry.record('feature.auth.sessions.revoke.start', { sessionId });
      
      const result = await _fetchWithRetry(`/sessions/${sessionId}/revoke`, {
        method: 'POST'
      });
      
      telemetry.record('feature.auth.sessions.revoke.success', {
        duration: Date.now() - startTime,
        sessionId
      });
      
      return result;
    } catch (error) {
      telemetry.record('feature.auth.sessions.revoke.error', {
        duration: Date.now() - startTime,
        error: error.message,
        status: error.status,
        sessionId
      });
      
      if (error.status === 401) {
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (error.status === 403) {
        throw new Error('No puedes revocar esta sesión. Solo puedes revocar tus propias sesiones.');
      } else if (error.status === 404) {
        throw new Error('La sesión que intentas revocar no existe o ya fue revocada.');
      } else if (error.status >= 500) {
        throw new Error('Error del servidor al revocar la sesión. Intenta más tarde.');
      } else {
        throw new Error(error.message || 'Error al revocar la sesión.');
      }
    }
  },

  /**
   * Revocar todas las sesiones excepto la actual
   * @returns {Promise<{success: boolean, message: string, revoked_count: number}>}
   */
  async revokeAllOtherSessions() {
    const startTime = Date.now();
    
    try {
      telemetry.record('feature.auth.sessions.revoke_all.start');
      
      const result = await _fetchWithRetry('/sessions/revoke-all', {
        method: 'POST'
      });
      
      telemetry.record('feature.auth.sessions.revoke_all.success', {
        duration: Date.now() - startTime,
        revoked_count: result.revoked_count || 0
      });
      
      return result;
    } catch (error) {
      telemetry.record('feature.auth.sessions.revoke_all.error', {
        duration: Date.now() - startTime,
        error: error.message,
        status: error.status
      });
      
      if (error.status === 401) {
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (error.status >= 500) {
        throw new Error('Error del servidor al revocar las sesiones. Intenta más tarde.');
      } else {
        throw new Error(error.message || 'Error al revocar las otras sesiones.');
      }
    }
  },

  /**
   * Obtener configuración de sesiones según el rol del usuario
   * @returns {Promise<{success: boolean, data: SessionConfig}>}
   */
  async getSessionConfig() {
    const startTime = Date.now();
    
    try {
      telemetry.record('feature.auth.sessions.config.load.start');
      
      const result = await _fetchWithRetry('/sessions/config');
      
      telemetry.record('feature.auth.sessions.config.load.success', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('feature.auth.sessions.config.load.error', {
        duration: Date.now() - startTime,
        error: error.message,
        status: error.status
      });
      
      if (error.status === 401) {
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (error.status >= 500) {
        throw new Error('Error del servidor al obtener la configuración. Intenta más tarde.');
      } else {
        throw new Error(error.message || 'Error al cargar la configuración de sesiones.');
      }
    }
  },

  /**
   * Obtener log de actividad del usuario
   * @param {Object} params - Parámetros de paginación
   * @param {number} [params.page=1] - Página actual
   * @param {number} [params.page_size=20] - Tamaño de página
   * @returns {Promise<{success: boolean, data: UserActivityLog[], page: number, page_size: number, count: number}>}
   */
  async getActivityLog(params = {}) {
    const { page = 1, page_size = 20 } = params;
    const startTime = Date.now();
    
    try {
      telemetry.record('feature.auth.sessions.activity.load.start', { page, page_size });
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        page_size: page_size.toString()
      });
      
      const result = await _fetchWithRetry(`/sessions/activity?${queryParams}`);
      
      telemetry.record('feature.auth.sessions.activity.load.success', {
        duration: Date.now() - startTime,
        page,
        count: result.count || 0
      });
      
      return result;
    } catch (error) {
      telemetry.record('feature.auth.sessions.activity.load.error', {
        duration: Date.now() - startTime,
        error: error.message,
        status: error.status,
        page
      });
      
      if (error.status === 401) {
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (error.status >= 500) {
        throw new Error('Error del servidor al obtener el log de actividad. Intenta más tarde.');
      } else {
        throw new Error(error.message || 'Error al cargar el log de actividad.');
      }
    }
  }
};

export default sessionService;
