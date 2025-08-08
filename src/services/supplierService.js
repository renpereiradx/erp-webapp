/**
 * Servicio de Proveedores - Versión Mejorada
 * Maneja todas las operaciones relacionadas con proveedores
 * Integra con los endpoints definidos en swagger.yaml
 * Actualizado para seguir patrones consistentes con purchaseService
 */

import { apiService } from './api';

class SupplierService {
  // Obtener proveedores con paginación y búsqueda
  async getSuppliers({ page = 1, limit = 10, search = '' }) {
    try {
      const endpoint = search ? `/supplier/name/${encodeURIComponent(search)}` : `/supplier/${page}/${limit}`;
      const data = await apiService.get(endpoint);
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error obteniendo proveedores:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la lista de proveedores'
      };
    }
  }

  // Obtener proveedor por ID
  async getSupplierById(id) {
    try {
      const data = await apiService.get(`/supplier/${id}`);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error obteniendo proveedor:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener el proveedor'
      };
    }
  }

  // Crear nuevo proveedor
  async createSupplier(supplierData) {
    try {
      // Validar datos antes de enviar
      const validation = this.validateSupplierData(supplierData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const data = await apiService.post('/supplier/', supplierData);
      return {
        success: true,
        data: data,
        message: 'Proveedor creado exitosamente'
      };
    } catch (error) {
      console.error('Error creando proveedor:', error);
      return {
        success: false,
        error: error.message || 'Error al crear el proveedor'
      };
    }
  }

  // Actualizar proveedor
  async updateSupplier(id, supplierData) {
    try {
      // Validar datos antes de enviar
      const validation = this.validateSupplierData(supplierData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const data = await apiService.put(`/supplier/${id}`, supplierData);
      return {
        success: true,
        data: data,
        message: 'Proveedor actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error actualizando proveedor:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar el proveedor'
      };
    }
  }

  // Eliminar proveedor (soft delete)
  async deleteSupplier(id) {
    try {
      const data = await apiService.put(`/supplier/delete/${id}`);
      return {
        success: true,
        data: data,
        message: 'Proveedor eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar el proveedor'
      };
    }
  }

  // Obtener todos los proveedores activos (helper)
  async getActiveSuppliers() {
    try {
      const result = await this.getSuppliers({ page: 1, limit: 100 });
      
      if (result.success && result.data) {
        // Filtrar solo activos si la API no lo hace automáticamente
        const activeSuppliers = Array.isArray(result.data) ? 
          result.data.filter(supplier => supplier.is_active !== false) : 
          [result.data].filter(supplier => supplier.is_active !== false);
          
        return {
          success: true,
          data: activeSuppliers
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error obteniendo proveedores activos:', error);
      return {
        success: false,
        error: 'Error al obtener proveedores activos'
      };
    }
  }

  // Buscar proveedores (método combinado)
  async searchSuppliers(searchTerm) {
    try {
      if (!searchTerm || !searchTerm.trim()) {
        return await this.getActiveSuppliers();
      }

      return await this.getSuppliers({ search: searchTerm.trim() });
    } catch (error) {
      console.error('Error buscando proveedores:', error);
      return {
        success: false,
        error: 'Error en la búsqueda de proveedores'
      };
    }
  }

  // Validar datos de proveedor
  validateSupplierData(supplierData) {
    const errors = [];

    if (!supplierData.name || supplierData.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (supplierData.email && !this.isValidEmail(supplierData.email)) {
      errors.push('El formato del email no es válido');
    }

    if (supplierData.phone && !this.isValidPhone(supplierData.phone)) {
      errors.push('El formato del teléfono no es válido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validaciones auxiliares
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    // Acepta varios formatos de teléfono
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  }

  // Formatear proveedor para display
  formatSupplierForDisplay(supplier) {
    if (!supplier) return null;
    
    return {
      ...supplier,
      displayName: supplier.name,
      displayInfo: supplier.contact_person ? 
        `${supplier.name} (${supplier.contact_person})` : 
        supplier.name,
      displayContact: [supplier.email, supplier.phone].filter(Boolean).join(' • ')
    };
  }

  // Preparar opciones para selector
  formatSuppliersForSelector(suppliers) {
    if (!Array.isArray(suppliers)) return [];
    
    return suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      displayName: this.formatSupplierForDisplay(supplier).displayInfo,
      email: supplier.email,
      phone: supplier.phone,
      isActive: supplier.is_active !== false
    }));
  }
}

// Crear instancia única del servicio
const supplierService = new SupplierService();

export { supplierService };
export default supplierService;
