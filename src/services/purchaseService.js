/**
 * Servicio de Compras - Integración con API
 * Maneja todas las operaciones relacionadas con compras
 * Integra con los endpoints definidos en swagger.yaml
 */

import { apiClient } from './api';

class PurchaseService {
  // Crear nueva compra usando el procedimiento register_purchase_order
  async createPurchase(purchaseData) {
    try {
      // Validar datos antes del envío
      const validation = this.validatePurchaseData(purchaseData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos inválidos: ' + validation.errors.join(', ')
        };
      }

      // Preparar datos según la especificación del procedimiento
      const requestData = {
        supplier_id: purchaseData.supplierId,
        status: purchaseData.status || 'PENDING',
        purchase_items: purchaseData.items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          exp_date: item.expDate || null,
          tax_rate_id: item.taxRateId || null,
          profit_pct: item.profitPct || null
        }))
      };

      const response = await apiClient.post('/purchase/', requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || ''
        }
      });

      if (response.data) {
        return {
          success: true,
          data: response.data,
          message: 'Orden de compra creada exitosamente',
          purchaseOrderId: response.data.id
        };
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      
      // Manejo mejorado de errores de la API
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al crear la orden de compra';
      
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
        details: error.response?.data
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
        // Validación de fecha de expiración si está presente
        if (item.expDate && new Date(item.expDate) <= new Date()) {
          errors.push(`Producto ${index + 1}: Fecha de expiración debe ser futura`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Obtener tasas de impuestos disponibles
  async getTaxRates() {
    try {
      const response = await apiClient.get('/tax-rates/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener tasas de impuestos',
        data: [] // Fallback a array vacío
      };
    }
  }

  // Obtener detalles de una orden de compra específica
  async getPurchaseOrderDetails(purchaseOrderId) {
    try {
      const response = await apiClient.get(`/purchase/${purchaseOrderId}/details`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching purchase order details:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener detalles de la orden'
      };
    }
  }

  // Actualizar estado de orden de compra
  async updatePurchaseOrderStatus(purchaseOrderId, newStatus, notes = '') {
    try {
      const response = await apiClient.put(`/purchase/${purchaseOrderId}/status`, {
        status: newStatus,
        notes,
        updated_at: new Date().toISOString()
      });
      
      return {
        success: true,
        data: response.data,
        message: `Estado actualizado a ${newStatus}`
      };
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al actualizar estado'
      };
    }
  }

  // Recibir productos de orden de compra (actualizar inventario)
  async receivePurchaseOrder(purchaseOrderId, receivedItems) {
    try {
      const response = await apiClient.post(`/purchase/${purchaseOrderId}/receive`, {
        received_items: receivedItems.map(item => ({
          product_id: item.productId,
          quantity_received: item.quantityReceived,
          exp_date: item.expDate,
          received_at: new Date().toISOString()
        }))
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Productos recibidos correctamente'
      };
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al recibir productos'
      };
    }
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
