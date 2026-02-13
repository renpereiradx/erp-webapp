import api from '@/services/api';

const BASE_URL = '/api/v1/users';

/**
 * Servicio para la gestión de usuarios
 * Basado en la documentación de API_USER_MANAGER.md
 */
export const userService = {
  /**
   * Listar usuarios con filtros
   * @param {Object} params - Query parameters (search, status, role_id, page, page_size, sort_by, sort_order)
   * @returns {Promise<Object>}
   */
  getUsers: async (params = {}) => {
    try {
      const response = await api.get(BASE_URL, { params });
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Obtener usuario por ID
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  getUserById: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear un nuevo usuario
   * @param {Object} userData 
   * @returns {Promise<Object>}
   */
  createUser: async (userData) => {
    try {
      const response = await api.post(BASE_URL, userData);
      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Actualizar usuario
   * @param {string} id 
   * @param {Object} userData 
   * @returns {Promise<Object>}
   */
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, userData);
      return response;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar usuario (Soft Delete)
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cambiar contraseña (Admin)
   */
  changePasswordAdmin: async (id, data) => {
    try {
      const response = await api.post(`${BASE_URL}/${id}/change-password`, data);
      return response;
    } catch (error) {
      console.error(`Error changing password for user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener mi perfil
   */
  getMe: async () => {
    try {
      const response = await api.get(`${BASE_URL}/me`);
      return response;
    } catch (error) {
      // Silent error for profile fetching, especially during init
      throw error;
    }
  },

  /**
   * Actualizar mi perfil
   * @param {Object} data - { first_name, last_name, phone, avatar_url }
   */
  updateMe: async (data) => {
    try {
      const response = await api.put(`${BASE_URL}/me`, data);
      return response;
    } catch (error) {
      console.error('Error updating my profile:', error);
      throw error;
    }
  },

  /**
   * Cambiar mi contraseña
   */
  changeMyPassword: async (data) => {
    try {
      const response = await api.post(`${BASE_URL}/me/change-password`, data);
      return response;
    } catch (error) {
      console.error('Error changing my password:', error);
      throw error;
    }
  },

  /**
   * Activar usuario
   */
  activateUser: async (id) => {
    try {
      const response = await api.post(`${BASE_URL}/${id}/activate`);
      return response;
    } catch (error) {
      console.error(`Error activating user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Desactivar usuario
   */
  deactivateUser: async (id) => {
    try {
      const response = await api.post(`${BASE_URL}/${id}/deactivate`);
      return response;
    } catch (error) {
      console.error(`Error deactivating user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Asignar rol a usuario
   */
  assignRole: async (userId, roleId) => {
    try {
        const response = await api.post(`${BASE_URL}/${userId}/roles`, { role_id: roleId });
        return response;
    } catch (error) {
        console.error(`Error assigning role ${roleId} to user ${userId}:`, error);
        throw error;
    }
  },

  /**
   * Eliminar rol de usuario
   */
  removeRole: async (userId, roleId) => {
      try {
          const response = await api.delete(`${BASE_URL}/${userId}/roles/${roleId}`);
          return response;
      } catch (error) {
        console.error(`Error removing role ${roleId} from user ${userId}:`, error);
        throw error;
      }
  }

};

export default userService;
