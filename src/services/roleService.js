import api from './api';
import { DEMO_CONFIG } from '../config/demoAuth';

// 🧪 Datos de roles para modo demo
const DEMO_ROLES = [
    { id: 'admin', name: 'Administrador', description: 'Acceso total al sistema' },
    { id: 'manager', name: 'Gerente', description: 'Gestión de operaciones y reportes' },
    { id: 'user', name: 'Usuario', description: 'Acceso limitado a funciones básicas' }
];

const DEMO_PERMISSIONS = [
    { id: 'read', name: 'Leer', description: 'Permite ver recursos' },
    { id: 'write', name: 'Escribir', description: 'Permite crear y editar recursos' },
    { id: 'delete', name: 'Eliminar', description: 'Permite borrar recursos' },
    { id: 'admin', name: 'Admin', description: 'Funciones administrativas' }
];

/**
 * Servicio para la gestión de roles y permisos
 * Basado en la documentación de API_ROLES.md
 */
const roleService = {
    /**
     * Listar todos los roles
     */
    getRoles: async () => {
        if (DEMO_CONFIG.enabled) {
            return { success: true, data: DEMO_ROLES };
        }
        return await api.get('/api/v1/roles');
    },

    /**
     * Obtener detalle de un rol
     */
    getRoleById: async (id) => {
        if (DEMO_CONFIG.enabled) {
            const role = DEMO_ROLES.find(r => r.id === id) || DEMO_ROLES[0];
            return { success: true, data: role };
        }
        return await api.get(`/api/v1/roles/${id}`);
    },

    /**
     * Crear un nuevo rol
     */
    createRole: async (roleData) => {
        if (DEMO_CONFIG.enabled) {
            return { success: true, data: { ...roleData, id: Math.random().toString(36).substr(2, 5) }, message: 'Rol creado (Demo)' };
        }
        return await api.post('/api/v1/roles', roleData);
    },

    /**
     * Actualizar un rol existente
     */
    updateRole: async (id, roleData) => {
        if (DEMO_CONFIG.enabled) {
            return { success: true, data: { ...roleData, id }, message: 'Rol actualizado (Demo)' };
        }
        return await api.put(`/api/v1/roles/${id}`, roleData);
    },

    /**
     * Eliminar un rol
     */
    deleteRole: async (id) => {
        if (DEMO_CONFIG.enabled) {
            return { success: true, message: 'Rol eliminado (Demo)' };
        }
        return await api.delete(`/api/v1/roles/${id}`);
    },

    /**
     * Listar permisos de un rol
     */
    getRolePermissions: async (id) => {
        if (DEMO_CONFIG.enabled) {
            return { success: true, data: DEMO_PERMISSIONS };
        }
        return await api.get(`/api/v1/roles/${id}/permissions`);
    },

    /**
     * Asignar permiso a un rol
     */
    assignPermissionToRole: async (roleId, permissionId) => {
        if (DEMO_CONFIG.enabled) {
            return { success: true, message: 'Permiso asignado (Demo)' };
        }
        return await api.post(`/api/v1/roles/${roleId}/permissions`, { permission_id: permissionId });
    },

    /**
     * Remover permiso de un rol
     */
    removePermissionFromRole: async (roleId, permissionId) => {
        if (DEMO_CONFIG.enabled) {
            return { success: true, message: 'Permiso removido (Demo)' };
        }
        return await api.delete(`/api/v1/roles/${roleId}/permissions/${permissionId}`);
    },

    /**
     * Listar todos los permisos disponibles
     */
    getAllPermissions: async () => {
        if (DEMO_CONFIG.enabled) {
            return { success: true, data: DEMO_PERMISSIONS };
        }
        return await api.get('/api/v1/permissions');
    }
};

export default roleService;
