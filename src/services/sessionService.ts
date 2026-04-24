import { apiClient } from './api';
import { UserSession, SessionConfig, UserActivity, PaginatedResponse, SuccessResponse } from '@/types';
import { DEMO_CONFIG } from '../config/demoAuth';

const BASE_URL = '/sessions';
const ADMIN_BASE_URL = '/admin/sessions';
const SESSION_OPTIONS = { skipBranchContext: true };

// 🧪 Datos de sesiones para modo demo
const DEMO_SESSIONS: UserSession[] = [
  {
    id: 'sess_1',
    user_id: '1',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    last_activity: new Date().toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    is_current: true,
    device_type: 'desktop',
    is_active: true,
    expires_at: new Date(Date.now() + 3600000).toISOString()
  },
  {
    id: 'sess_2',
    user_id: '1',
    ip_address: '10.0.0.5',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148',
    last_activity: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 90000000).toISOString(),
    is_current: false,
    device_type: 'mobile',
    is_active: false,
    expires_at: new Date(Date.now() - 1000).toISOString()
  }
];

export const sessionService = {
  /**
   * Obtiene las sesiones activas del usuario actual.
   */
  getActiveSessions: async (): Promise<SuccessResponse & { data: UserSession[] }> => {
    if (DEMO_CONFIG.enabled) {
      return { success: true, data: DEMO_SESSIONS };
    }
    try {
      return await apiClient.get(`${BASE_URL}/active`, SESSION_OPTIONS);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      throw error;
    }
  },

  /**
   * Obtiene el historial de sesiones del usuario.
   */
  getSessionHistory: async (params: { page?: number; page_size?: number } = { page: 1, page_size: 20 }): Promise<PaginatedResponse<UserSession>> => {
    if (DEMO_CONFIG.enabled) {
      return {
        success: true,
        data: DEMO_SESSIONS,
        pagination: {
          page: 1,
          page_size: 20,
          total_items: DEMO_SESSIONS.length,
          total_pages: 1,
          has_next: false,
          has_prev: false
        }
      };
    }
    try {
      return await apiClient.get(`${BASE_URL}/history`, { ...SESSION_OPTIONS, params });
    } catch (error) {
      console.error('Error fetching session history:', error);
      throw error;
    }
  },

  /**
   * Revoca una sesion especifica.
   */
  revokeSession: async (id: string | number): Promise<SuccessResponse> => {
    if (DEMO_CONFIG.enabled) {
      return { success: true, message: 'Sesión revocada (Demo)' };
    }
    try {
      return await apiClient.post(`${BASE_URL}/${id}/revoke`, null, SESSION_OPTIONS);
    } catch (error) {
      console.error(`Error revoking session ${id}:`, error);
      throw error;
    }
  },

  /**
   * Revoca todas las sesiones del usuario excepto la actual.
   */
  revokeAllOtherSessions: async (): Promise<SuccessResponse & { revoked_count?: number }> => {
    if (DEMO_CONFIG.enabled) {
      return { success: true, revoked_count: 1, message: 'Sesiones revocadas (Demo)' };
    }
    try {
      return await apiClient.post(`${BASE_URL}/revoke-all`, null, SESSION_OPTIONS);
    } catch (error) {
      console.error('Error revoking all other sessions:', error);
      throw error;
    }
  },

  /**
   * Obtiene el log de actividad del usuario.
   */
  getActivityLog: async (params: { page?: number; page_size?: number } = { page: 1, page_size: 20 }): Promise<PaginatedResponse<UserActivity>> => {
    if (DEMO_CONFIG.enabled) {
      return {
        success: true,
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total_items: 0,
          total_pages: 1,
          has_next: false,
          has_prev: false
        }
      };
    }
    try {
      return await apiClient.get(`${BASE_URL}/activity`, { ...SESSION_OPTIONS, params });
    } catch (error) {
      console.error('Error fetching activity log:', error);
      throw error;
    }
  },

  /**
   * Obtiene la configuracion de sesion para el rol del usuario.
   */
  getSessionConfig: async (): Promise<SuccessResponse & { data: SessionConfig }> => {
    if (DEMO_CONFIG.enabled) {
      return {
        success: true,
        data: {
          id: 1,
          role_id: 'admin',
          max_concurrent_sessions: 5,
          session_timeout_minutes: 60,
          inactivity_timeout_minutes: 30,
          require_device_verification: false,
          allow_multiple_locations: true,
          force_logout_on_password_change: true
        }
      };
    }
    try {
      return await apiClient.get(`${BASE_URL}/config`, SESSION_OPTIONS);
    } catch (error) {
      console.error('Error fetching session config:', error);
      throw error;
    }
  },

  /**
   * Limpia sesiones expiradas (requiere permiso sessions:admin).
   */
  cleanupSessions: async (): Promise<SuccessResponse & { cleaned_count?: number }> => {
    try {
      return await apiClient.post(`${BASE_URL}/cleanup`, null, SESSION_OPTIONS);
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      throw error;
    }
  },

  // ==========================================
  // ADMINISTRACIÓN (Solo Admins)
  // ==========================================

  /**
   * Obtiene todas las sesiones activas (solo admin).
   */
  getAllActiveSessions: async (params: Record<string, any> = {}): Promise<SuccessResponse & { data: UserSession[] }> => {
    if (DEMO_CONFIG.enabled) {
      return { success: true, data: DEMO_SESSIONS };
    }
    try {
      return await apiClient.get(`${ADMIN_BASE_URL}/all`, { ...SESSION_OPTIONS, params });
    } catch (error) {
      console.error('Error fetching all active sessions (admin):', error);
      throw error;
    }
  },

  /**
   * Revoca una sesion especifica de cualquier usuario (solo admin).
   */
  adminRevokeSession: async (id: string | number): Promise<SuccessResponse> => {
    if (DEMO_CONFIG.enabled) {
      return { success: true, message: 'Sesión revocada por admin (Demo)' };
    }
    try {
      return await apiClient.post(`${ADMIN_BASE_URL}/${id}/revoke`, null, SESSION_OPTIONS);
    } catch (error) {
      console.error(`Error revoking session ${id} (admin):`, error);
      throw error;
    }
  }
};

export default sessionService;
