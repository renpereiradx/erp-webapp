/**
 * Servicio de Compras - Integración con API
 * Maneja todas las operaciones relacionadas con compras
 * Integra con los endpoints definidos en swagger.yaml
 */

import { apiClient } from './api';

class PurchaseService {
  // Crear nueva compra
  async createPurchase(purchaseData) {
    try {
      const response = await apiClient.post('/purchase/', {
        supplier_id: purchaseData.supplierId,
        items: purchaseData.items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.quantity * item.unitPrice
        })),
        total_amount: purchaseData.totalAmount,
        notes: purchaseData.notes || '',
        purchase_date: purchaseData.purchaseDate || new Date().toISOString(),
        status: 'pending' // Estado inicial
      });

      if (response.data) {
        return {
          success: true,
          data: response.data,
          message: 'Compra creada exitosamente'
        };
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al crear la compra',
        status: error.response?.status
      };
    }
  }

  // Obtener compra por ID
  async getPurchaseById(id) {
    try {
      const response = await apiClient.get(`/purchase/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching purchase:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener la compra'
      };
    }
  }

  // Cancelar compra
  async cancelPurchase(id, reason = '') {
    try {
      const response = await apiClient.put(`/purchase/cancel/${id}`, {
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Compra cancelada exitosamente'
      };
    } catch (error) {
      console.error('Error cancelling purchase:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al cancelar la compra'
      };
    }
  }

  // Obtener compras por proveedor ID
  async getPurchasesBySupplier(supplierId) {
    try {
      const response = await apiClient.get(`/purchase/supplier_id/${supplierId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching purchases by supplier:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener compras del proveedor'
      };
    }
  }

  // Obtener compras por nombre de proveedor
  async getPurchasesBySupplierName(supplierName) {
    try {
      const response = await apiClient.get(`/purchase/supplier_name/${encodeURIComponent(supplierName)}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching purchases by supplier name:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al buscar compras del proveedor'
      };
    }
  }

  // Obtener compras por rango de fechas
  async getPurchasesByDateRange(startDate, endDate, filters = {}) {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        ...filters
      });

      const response = await apiClient.get(`/purchase/date_range/?${params}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching purchases by date range:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener compras por fecha'
      };
    }
  }

  // Obtener compras paginadas (helper method)
  async getPurchasesPaginated(page = 1, pageSize = 20, filters = {}) {
    try {
      // Si la API tiene endpoint de paginación, usar ese
      // Por ahora, usamos date range con filtros
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Últimos 90 días
      
      const result = await this.getPurchasesByDateRange(startDate, endDate, {
        page,
        limit: pageSize,
        ...filters
      });

      return result;
    } catch (error) {
      console.error('Error fetching paginated purchases:', error);
      return {
        success: false,
        error: 'Error al obtener lista de compras'
      };
    }
  }

  // Buscar compras (método helper combinado)
  async searchPurchases(searchTerm, searchType = 'supplier') {
    try {
      let result;
      
      switch (searchType) {
        case 'supplier':
          result = await this.getPurchasesBySupplierName(searchTerm);
          break;
        case 'id':
          result = await this.getPurchaseById(searchTerm);
          // Convertir a array para consistencia
          if (result.success && result.data) {
            result.data = [result.data];
          }
          break;
        default:
          throw new Error('Tipo de búsqueda no válido');
      }

      return result;
    } catch (error) {
      console.error('Error searching purchases:', error);
      return {
        success: false,
        error: 'Error en la búsqueda de compras'
      };
    }
  }

  // Validar datos de compra antes del envío
  validatePurchaseData(purchaseData) {
    const errors = [];

    if (!purchaseData.supplierId) {
      errors.push('Debe seleccionar un proveedor');
    }

    if (!purchaseData.items || purchaseData.items.length === 0) {
      errors.push('Debe agregar al menos un producto');
    }

    if (purchaseData.items) {
      purchaseData.items.forEach((item, index) => {
        if (!item.productId) {
          errors.push(`Producto ${index + 1}: ID requerido`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Producto ${index + 1}: Cantidad debe ser mayor a 0`);
        }
        if (!item.unitPrice || item.unitPrice <= 0) {
          errors.push(`Producto ${index + 1}: Precio debe ser mayor a 0`);
        }
      });
    }

    if (!purchaseData.totalAmount || purchaseData.totalAmount <= 0) {
      errors.push('El total debe ser mayor a 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Calcular totales de compra
  calculatePurchaseTotals(items, taxRate = 0) {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }
}

// Crear instancia única del servicio
const purchaseService = new PurchaseService();

export { purchaseService };
export default purchaseService;
