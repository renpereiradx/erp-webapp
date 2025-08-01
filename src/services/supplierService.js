import { apiService } from './api';

export const supplierService = {
  getSuppliers: async ({ page = 1, limit = 10, search = '' }) => {
    try {
      const endpoint = search ? `/supplier/name/${search}` : `/supplier/${page}/${limit}`;
      return await apiService.get(endpoint);
    } catch (error) {
      console.error('Error obteniendo proveedores:', error);
      throw new Error(error.message || 'Error al obtener la lista de proveedores');
    }
  },

  createSupplier: async (supplierData) => {
    try {
      return await apiService.post('/supplier/', supplierData);
    } catch (error) {
      console.error('Error creando proveedor:', error);
      throw new Error(error.message || 'Error al crear el proveedor');
    }
  },

  updateSupplier: async (id, supplierData) => {
    try {
      return await apiService.put(`/supplier/${id}`, supplierData);
    } catch (error) {
      console.error('Error actualizando proveedor:', error);
      throw new Error(error.message || 'Error al actualizar el proveedor');
    }
  },

  deleteSupplier: async (id) => {
    try {
      return await apiService.put(`/supplier/delete/${id}`);
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      throw new Error(error.message || 'Error al eliminar el proveedor');
    }
  },
};

export default supplierService;
