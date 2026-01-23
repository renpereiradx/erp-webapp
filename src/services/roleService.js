import api from './api';

/**
 * Servicio para la gestión de roles y permisos
 * Basado en la documentación de API_ROLES.md
 */
const roleService = {
    /**
     * Listar todos los roles
     */
    getRoles: async () => {
        return await api.get('/api/v1/roles');
    },

    /**
     * Obtener detalle de un rol
     */
    getRoleById: async (id) => {
        return await api.get(`/api/v1/roles/${id}`);
    },

    /**
     * Crear un nuevo rol
     */
    createRole: async (roleData) => {
        return await api.post('/api/v1/roles', roleData);
    },

    /**
     * Actualizar un rol existente
     */
    updateRole: async (id, roleData) => {
        return await api.put(`/api/v1/roles/${id}`, roleData);
    },

    /**
     * Eliminar un rol
     */
    deleteRole: async (id) => {
        return await api.delete(`/api/v1/roles/${id}`);
    },

    /**
     * Listar permisos de un rol
     */
    getRolePermissions: async (id) => {
        return await api.get(`/api/v1/roles/${id}/permissions`);
    },

    /**
     * Asignar permiso a un rol
     */
    assignPermissionToRole: async (roleId, permissionId) => {
        return await api.post(`/api/v1/roles/${roleId}/permissions`, { permission_id: permissionId });
    },

    /**
     * Remover permiso de un rol
     */
    removePermissionFromRole: async (roleId, permissionId) => {
        return await api.delete(`/api/v1/roles/${roleId}/permissions/${permissionId}`);
    },

    /**
     * Listar todos los permisos disponibles
     */
    getAllPermissions: async () => {
        return await api.get('/api/v1/permissions');
    }
};

export default roleService;
