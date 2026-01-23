import api from './api';

/**
 * Servicio para la gestión de usuarios
 * Basado en la documentación de API_USER_MANAGER.md
 */
const userService = {
    /**
     * Listar usuarios con filtros
     */
    getUsers: async (params) => {
        return await api.get('/api/v1/users', { params });
    },

    /**
     * Obtener usuario por ID
     */
    getUserById: async (id) => {
        return await api.get(`/api/v1/users/${id}`);
    },

    /**
     * Crear un nuevo usuario
     */
    createUser: async (userData) => {
        return await api.post('/api/v1/users', userData);
    },

    /**
     * Actualizar usuario
     */
    updateUser: async (id, userData) => {
        return await api.put(`/api/v1/users/${id}`, userData);
    },

    /**
     * Eliminar usuario (Soft Delete)
     */
    deleteUser: async (id) => {
        return await api.delete(`/api/v1/users/${id}`);
    },

    /**
     * Cambiar contraseña (Admin)
     */
    changePasswordAdmin: async (id, data) => {
        return await api.post(`/api/v1/users/${id}/change-password`, data);
    },

    /**
     * Obtener mi perfil
     */
    getMe: async () => {
        return await api.get('/api/v1/users/me');
    },

    /**
     * Cambiar mi contraseña
     */
    changeMyPassword: async (data) => {
        return await api.post('/api/v1/users/me/change-password', data);
    }
};

export default userService;
