import { apiClient } from './api';

export const supplierService = {
  getSuppliers: async (params = {}) => {
    try {
      return await apiClient.getSuppliers(params);
    } catch (error) {
      console.error('Error obteniendo proveedores:', error);
      throw new Error(error.message || 'Error al obtener la lista de proveedores');
    }
  },

  createSupplier: async (supplierData) => {
    try {
      return await apiClient.createSupplier(supplierData);
    } catch (error) {
      console.error('Error creando proveedor:', error);
      throw new Error(error.message || 'Error al crear el proveedor');
    }
  },

  updateSupplier: async (id, supplierData) => {
    try {
      return await apiClient.updateSupplier(id, supplierData);
    } catch (error) {
      console.error('Error actualizando proveedor:', error);
      throw new Error(error.message || 'Error al actualizar el proveedor');
    }
  },

  deleteSupplier: async (id) => {
    try {
      return await apiClient.deleteSupplier(id);
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      throw new Error(error.message || 'Error al eliminar el proveedor');
    }
  },
};

export default supplierService;
