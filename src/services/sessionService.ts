import api from './api';
import { UserSession, SessionConfig, UserActivity, PaginatedResponse, SuccessResponse } from '@/types';

const BASE_URL = '/sessions';
const ADMIN_BASE_URL = '/admin/sessions';

export const sessionService = {
  /**
   * Obtiene las sesiones activas del usuario actual.
   */
  getActiveSessions: async (): Promise<SuccessResponse & { data: UserSession[] }> => {
    try {
      return await api.get(`${BASE_URL}/active`);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      throw error;
    }
  },

  /**
   * Obtiene el historial de sesiones del usuario.
   */
  getSessionHistory: async (params: { page?: number; page_size?: number } = { page: 1, page_size: 20 }): Promise<PaginatedResponse<UserSession>> => {
    try {
      return await api.get(`${BASE_URL}/history`, { params });
    } catch (error) {
      console.error('Error fetching session history:', error);
      throw error;
    }
  },

  /**
   * Revoca una sesion especifica.
   */
  revokeSession: async (id: string | number): Promise<SuccessResponse> => {
    try {
      return await api.post(`${BASE_URL}/${id}/revoke`);
    } catch (error) {
      console.error(`Error revoking session ${id}:`, error);
      throw error;
    }
  },

  /**
   * Revoca todas las sesiones del usuario excepto la actual.
   */
  revokeAllOtherSessions: async (): Promise<SuccessResponse & { revoked_count?: number }> => {
    try {
      return await api.post(`${BASE_URL}/revoke-all`);
    } catch (error) {
      console.error('Error revoking all other sessions:', error);
      throw error;
    }
  },

  /**
   * Obtiene el log de actividad del usuario.
   */
  getActivityLog: async (params: { page?: number; page_size?: number } = { page: 1, page_size: 20 }): Promise<PaginatedResponse<UserActivity>> => {
    try {
      return await api.get(`${BASE_URL}/activity`, { params });
    } catch (error) {
      console.error('Error fetching activity log:', error);
      throw error;
    }
  },

  /**
   * Obtiene la configuracion de sesion para el rol del usuario.
   */
  getSessionConfig: async (): Promise<SuccessResponse & { data: SessionConfig }> => {
    try {
      return await api.get(`${BASE_URL}/config`);
    } catch (error) {
      console.error('Error fetching session config:', error);
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
    try {
      return await api.get(`${ADMIN_BASE_URL}/all`, { params });
    } catch (error) {
      console.error('Error fetching all active sessions (admin):', error);
      throw error;
    }
  },

  /**
   * Revoca una sesion especifica de cualquier usuario (solo admin).
   */
  adminRevokeSession: async (id: string | number): Promise<SuccessResponse> => {
    try {
      return await api.post(`${ADMIN_BASE_URL}/${id}/revoke`);
    } catch (error) {
      console.error(`Error revoking session ${id} (admin):`, error);
      throw error;
    }
  }
};

export default sessionService;
