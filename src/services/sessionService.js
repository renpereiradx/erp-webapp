import api from './api';

const BASE_URL = '/sessions';
const ADMIN_BASE_URL = '/admin/sessions';

export const sessionService = {
  /**
   * Obtiene las sesiones activas del usuario actual.
   * @returns {Promise<Object>}
   */
  getActiveSessions: async () => {
    try {
      return await api.get(`${BASE_URL}/active`);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      throw error;
    }
  },

  /**
   * Obtiene el historial de sesiones del usuario.
   * @param {Object} params - Query parameters (page, page_size)
   * @returns {Promise<Object>}
   */
  getSessionHistory: async (params = { page: 1, page_size: 20 }) => {
    try {
      return await api.get(`${BASE_URL}/history`, { params });
    } catch (error) {
      console.error('Error fetching session history:', error);
      throw error;
    }
  },

  /**
   * Revoca una sesion especifica.
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  revokeSession: async (id) => {
    try {
      return await api.post(`${BASE_URL}/${id}/revoke`);
    } catch (error) {
      console.error(`Error revoking session ${id}:`, error);
      throw error;
    }
  },

  /**
   * Revoca todas las sesiones del usuario excepto la actual.
   * @returns {Promise<Object>}
   */
  revokeAllOtherSessions: async () => {
    try {
      return await api.post(`${BASE_URL}/revoke-all`);
    } catch (error) {
      console.error('Error revoking all other sessions:', error);
      throw error;
    }
  },

  /**
   * Obtiene el log de actividad del usuario.
   * @param {Object} params - Query parameters (page, page_size)
   * @returns {Promise<Object>}
   */
  getActivityLog: async (params = { page: 1, page_size: 20 }) => {
    try {
      return await api.get(`${BASE_URL}/activity`, { params });
    } catch (error) {
      console.error('Error fetching activity log:', error);
      throw error;
    }
  },

  /**
   * Obtiene la configuracion de sesion para el rol del usuario.
   * @returns {Promise<Object>}
   */
  getSessionConfig: async () => {
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
   * @param {Object} params - Posibles filtros (page, page_size, search, status)
   * @returns {Promise<Object>}
   */
  getAllActiveSessions: async (params = {}) => {
    try {
      return await api.get(`${ADMIN_BASE_URL}/all`, { params });
    } catch (error) {
      console.error('Error fetching all active sessions (admin):', error);
      throw error;
    }
  },

  /**
   * Revoca una sesion especifica de cualquier usuario (solo admin).
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  adminRevokeSession: async (id) => {
    try {
      return await api.post(`${ADMIN_BASE_URL}/${id}/revoke`);
    } catch (error) {
      console.error(`Error revoking session ${id} (admin):`, error);
      throw error;
    }
  }
};

export default sessionService;
