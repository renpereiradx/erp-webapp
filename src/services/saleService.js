/**
 * Servicio de Gestión de Ventas
 * Proporciona una interfaz limpia para interactuar con la API de ventas
 * Implementa patrones descritos en SALE_API.md y SALE_PAYMENT_API.md
 */

import { apiClient } from './api';

export const saleService = {
  // ============ GESTIÓN DE SESIONES ============

  async startSaleSession(data) {
    try {
      const response = await apiClient.makeRequest('/sale/session/start', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Error starting sale session:', error);
      return { success: false, error: error.message };
    }
  },

  async endSaleSession(sessionId, summary) {
    try {
      const response = await apiClient.makeRequest(`/sale/session/${sessionId}/end`, {
        method: 'POST',
        body: JSON.stringify(summary),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Error ending sale session:', error);
      return { success: false, error: error.message };
    }
  },

  // ============ PROCESAMIENTO DE PAGOS ============

  async processPayment(saleId, paymentData) {
    try {
      const response = await apiClient.makeRequest(`/sales-payment/process`, {
        method: 'POST',
        body: JSON.stringify({
          sale_id: saleId,
          ...paymentData,
        }),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: error.message };
    }
  },

  async calculateChange(totalAmount, amountPaid) {
    // Cálculo local para rapidez, o llamar a API si existe
    const change = amountPaid - totalAmount;
    return {
      success: true,
      data: {
        total_amount: totalAmount,
        amount_paid: amountPaid,
        change_amount: change >= 0 ? change : 0,
        is_covered: change >= 0,
      },
    };
  },

  // ============ CONSULTA DE VENTAS ============

  async getSales(params = {}) {
    try {
      // Si hay rango de fechas, usar el endpoint específico
      if (params.dateFrom || params.dateTo || params.start_date || params.end_date) {
        return this.getSalesByDateRange(params);
      }

      // Si hay cliente, usar endpoint de cliente
      if (params.clientId || params.client_id) {
        return this.getSalesByClientId(params.clientId || params.client_id, params);
      }

      if (params.clientName) {
        return this.getSalesByClientName(params.clientName, params);
      }

      // Fallback a lista general si existiera, o usar rango de hoy por defecto
      const today = new Date().toISOString().split('T')[0];
      return this.getSalesByDateRange({
        start_date: today,
        end_date: today,
        ...params
      });
    } catch (error) {
      console.error('Error fetching sales:', error);
      return { success: false, error: error.message };
    }
  },

  async getSalesByDateRange(params = {}) {
    try {
      // Normalizar parámetros según SALE_GET_BY_RANGE_API.md
      const queryParams = {
        start_date: params.start_date || params.dateFrom,
        end_date: params.end_date || params.dateTo,
        page: params.page || 1,
        page_size: params.page_size || params.limit || 50
      };

      if (!queryParams.start_date || !queryParams.end_date) {
        throw new Error('start_date and end_date are required');
      }

      // El endpoint espera GET con query params
      const response = await apiClient.makeRequest('/sale/date_range/', {
        method: 'GET',
        params: queryParams
      });

      return {
        success: true,
        data: response.data || [],
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error fetching sales by date range:', error);
      return { success: false, error: error.message };
    }
  },

  async getSalesByClient(clientId) {
    return this.getSalesByClientId(clientId);
  },

  async getSalesByClientId(clientId, params = {}) {
    try {
      const response = await apiClient.makeRequest(`/sale/client_id/${clientId}`, {
        method: 'GET',
        params: {
          page: params.page || 1,
          page_size: params.page_size || params.limit || 50
        }
      });
      return {
        success: true,
        data: response.data || [],
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error fetching sales by client ID:', error);
      return { success: false, error: error.message };
    }
  },

  async getSalesByClientName(name, params = {}) {
    try {
      const response = await apiClient.makeRequest(`/sale/client_name/${encodeURIComponent(name)}`, {
        method: 'GET',
        params: {
          page: params.page || 1,
          page_size: params.page_size || params.limit || 50
        }
      });
      return {
        success: true,
        data: response.data || [],
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error fetching sales by client name:', error);
      return { success: false, error: error.message };
    }
  },

  async getPendingSalesByClient(clientId) {
    // Alias conveniente que filtra por estado PENDING si la API lo soporta
    // o simplemente obtiene todas y el store filtra
    return this.getSalesByClientId(clientId, { status: 'PENDING' });
  },

  async getSaleById(id) {
    try {
      const response = await apiClient.makeRequest(`/sale/${id}`);
      return { success: true, data: response };
    } catch (error) {
      console.error(`Error fetching sale ${id}:`, error);
      return { success: false, error: error.message };
    }
  },

  // ============ OPERACIONES CRUD ============

  async createSale(saleData) {
    try {
      // Según SALE_API.md v1.8, el endpoint es POST /sale/
      const response = await apiClient.makeRequest('/sale/', {
        method: 'POST',
        body: JSON.stringify(saleData),
      });
      return {
        success: true,
        data: response,
        sale_id: response.sale_id || response.id
      };
    } catch (error) {
      console.error('Error creating sale:', error);
      return { success: false, error: error.message };
    }
  },

  async updateSale(id, saleData) {
    try {
      const response = await apiClient.makeRequest(`/sale/${id}`, {
        method: 'PUT',
        body: JSON.stringify(saleData),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error(`Error updating sale ${id}:`, error);
      return { success: false, error: error.message };
    }
  },

  async addProductsToSale(saleId, payload) {
    try {
      const response = await apiClient.makeRequest(`/sale/${saleId}/products`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error(`Error adding products to sale ${saleId}:`, error);
      return { success: false, error: error.message };
    }
  },

  async revertSale(id, reason) {
    try {
      // Según SALE_API.md el endpoint es PUT /sale/{id} para anulación
      const response = await apiClient.makeRequest(`/sale/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ cancellation_reason: reason }),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error(`Error reverting sale ${id}:`, error);
      return { success: false, error: error.message };
    }
  },

  async completeSale(id, paymentData) {
    // Marcar como pagada y procesar pago si no se hizo
    try {
      const response = await apiClient.makeRequest(`/sale/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error(`Error completing sale ${id}:`, error);
      return { success: false, error: error.message };
    }
  },

  async refundSale(id, refundData) {
    try {
      const response = await apiClient.makeRequest(`/sale/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify(refundData),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error(`Error refunding sale ${id}:`, error);
      return { success: false, error: error.message };
    }
  },

  // ============ ESTADÍSTICAS ============

  async getTodaySales() {
    const today = new Date().toISOString().split('T')[0];
    return this.getSalesByDateRange({ start_date: today, end_date: today });
  },

  async getSalesStats(params = {}) {
    try {
      const response = await apiClient.makeRequest('/sale/stats', {
        method: 'GET',
        params
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      return { success: false, error: error.message };
    }
  },

  async getTopSellingProducts(params = {}) {
    try {
      const response = await apiClient.makeRequest('/sale/top-products', {
        method: 'GET',
        params
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Error fetching top products:', error);
      return { success: false, error: error.message };
    }
  },

  async calculateTotal(items, clientId = null) {
    try {
      const response = await apiClient.makeRequest('/sale/calculate-total', {
        method: 'POST',
        body: JSON.stringify({ items, client_id: clientId }),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Error calculating total:', error);
      return { success: false, error: error.message };
    }
  },
};

export default saleService;
