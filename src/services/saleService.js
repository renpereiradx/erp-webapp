/**
 * Servicio para la gestión de ventas en el sistema ERP
 * Contiene todas las funciones relacionadas con la API de ventas
 */

import { apiService } from './api';

export const saleService = {
  // Obtener todas las ventas con paginación y filtros
  getSales: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      clientId: params.clientId || '',
      dateFrom: params.dateFrom || '',
      dateTo: params.dateTo || '',
      status: params.status || '', // pending, completed, cancelled, refunded
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc',
    }).toString();

    return await apiService.get(`/ventas?${queryParams}`);
  },

  // Obtener una venta por ID
  getSaleById: async (id) => {
    return await apiService.get(`/ventas/${id}`);
  },

  // Crear una nueva venta
  createSale: async (saleData) => {
    return await apiService.post('/ventas', {
      client_id: saleData.clientId,
      details: saleData.details,
      ...saleData
    });
  },

  // Actualizar una venta existente
  updateSale: async (id, saleData) => {
    return await apiService.put(`/ventas/${id}`, saleData);
  },

  // Cancelar una venta
  cancelSale: async (id, reason = '') => {
    return await apiService.put(`/ventas/${id}/cancelar`, { reason });
  },

  // Completar una venta
  completeSale: async (id, paymentData = {}) => {
    return await apiService.put(`/ventas/${id}/completar`, paymentData);
  },

  // Procesar reembolso
  refundSale: async (id, refundData) => {
    return await apiService.put(`/ventas/${id}/reembolso`, refundData);
  },

  // Obtener ventas por cliente
  getSalesByClient: async (clientId, params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      dateFrom: params.dateFrom || '',
      dateTo: params.dateTo || '',
      status: params.status || '',
    }).toString();

    return await apiService.get(`/clientes/${clientId}/ventas?${queryParams}`);
  },

  // Obtener estadísticas de ventas
  getSalesStats: async (params = {}) => {
    const queryParams = new URLSearchParams({
      dateFrom: params.dateFrom || '',
      dateTo: params.dateTo || '',
      groupBy: params.groupBy || 'day', // day, week, month
      metric: params.metric || 'total', // total, count, average
    }).toString();

    return await apiService.get(`/ventas/estadisticas?${queryParams}`);
  },

  // Obtener ventas del día
  getTodaySales: async () => {
    const today = new Date().toISOString().split('T')[0];
    return await apiService.get(`/ventas/dia/${today}`);
  },

  // Obtener productos más vendidos
  getTopSellingProducts: async (params = {}) => {
    const queryParams = new URLSearchParams({
      limit: params.limit || 10,
      dateFrom: params.dateFrom || '',
      dateTo: params.dateTo || '',
    }).toString();

    return await apiService.get(`/ventas/productos-top?${queryParams}`);
  },

  // Obtener ventas recientes
  getRecentSales: async (limit = 10) => {
    return await apiService.get(`/ventas/recientes?limit=${limit}`);
  },

  // Buscar ventas
  searchSales: async (query) => {
    return await apiService.get(`/ventas/buscar?q=${encodeURIComponent(query)}`);
  },

  // Crear venta con reserva incluida
  createSaleWithReservation: async (saleData, reservationData) => {
    return await apiService.post('/ventas/con-reserva', {
      sale: {
        client_id: saleData.clientId,
        details: saleData.details,
        ...saleData
      },
      reservation: {
        product_id: reservationData.productId,
        start_time: reservationData.startTime,
        duration: reservationData.duration,
        ...reservationData
      }
    });
  },

  // Obtener detalles expandidos de una venta
  getSaleDetails: async (id) => {
    return await apiService.get(`/ventas/${id}/detalles`);
  },

  // Generar factura de venta
  generateInvoice: async (id, format = 'pdf') => {
    return await apiService.get(`/ventas/${id}/factura?format=${format}`, {
      responseType: 'blob'
    });
  },

  // Aplicar descuento a venta
  applyDiscount: async (id, discountData) => {
    return await apiService.put(`/ventas/${id}/descuento`, discountData);
  },

  // Calcular total con impuestos
  calculateTotal: async (items, clientId = null) => {
    return await apiService.post('/ventas/calcular-total', {
      items,
      client_id: clientId
    });
  },
};

export default saleService;
