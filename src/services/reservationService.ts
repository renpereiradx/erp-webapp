import { 
  ManageReserveRequest, 
  GenerateSchedulesForDateRequest, 
  UpsertScheduleConfigByProductRequest, 
  ScheduleSlot, 
  ProductScheduleConfig 
} from '../domain/reservation';
import { apiClient } from './api';

/**
 * Servicio de Reservas y Horarios
 * Utiliza el apiClient central para garantizar consistencia en auth y manejo de errores.
 */
export const reservationService = {
  // ==========================================
  // RESERVAS
  // ==========================================
  
  manageReserve: async (data: ManageReserveRequest) => {
    return apiClient.makeRequest('/reserve/manage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAvailableSchedules: async (productId: string, date: string, duration: number, branchId?: number) => {
    const params: any = { product_id: productId, date, duration };
    if (branchId) params.branch_id = branchId;
    return apiClient.makeRequest('/reserve/available-schedules', { params });
  },

  getReservationById: async (reserveId: number, branchId?: number) => {
    return apiClient.makeRequest(`/reserve/${reserveId}${branchId ? `?branch_id=${branchId}` : ''}`);
  },

  getReservationsByDateRange: async (startDate: string, endDate: string, branchId?: number) => {
    const params: any = { start_date: startDate, end_date: endDate };
    if (branchId) params.branch_id = branchId;
    return apiClient.makeRequest('/reserve/date-range', { params });
  },

  getReservationReport: async (params: any = {}) => {
    return apiClient.makeRequest('/reserve/all', {
      params: params
    });
  },

  // ==========================================
  // HORARIOS (SCHEDULES)
  // ==========================================
  
  getSchedulesForProductAndDate: async (productId: string, date: string, branchId?: number): Promise<ScheduleSlot[]> => {
    try {
      const url = `/schedules/product/${productId}/date/${date}/all${branchId ? `?branch_id=${branchId}` : ''}`;
      const response = await apiClient.makeRequest(url);
      let slots: any[] = [];
      if (Array.isArray(response)) slots = response;
      else if (response && Array.isArray(response.data)) slots = response.data;
      else if (response && Array.isArray(response.slots)) slots = response.slots;
      else if (response && typeof response === 'object') slots = Object.values(response);
      
      return slots.map((slot: any) => {
        // Nuevo formato API: usa is_available + reserve_id/reserved_by/reserve_status
        // Formato legacy: usa status + reserve anidado
        const hasReservation = slot.is_available === false || slot.reserve || slot.reserve_id;
        const reserveData = slot.reserve || {};
        
        return {
          id: slot.id,
          product_id: slot.product_id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          status: slot.reserve_status || slot.status || (slot.is_available ? 'AVAILABLE' : 'RESERVED'),
          reserve: hasReservation ? {
            id: slot.reserve_id || reserveData.id,
            client_name: slot.reserved_by || reserveData.client_name || reserveData.user_name,
            client_id: slot.client_id || reserveData.client_id || reserveData.user_id,
          } : undefined,
        };
      });
    } catch (error: any) {
      if (error.status === 500 || error.message?.includes('500')) {
        return [];
      }
      throw error;
    }
  },

  getProductConfig: async (productId: string): Promise<ProductScheduleConfig> => {
    return apiClient.makeRequest(`/schedules/product/${productId}/config`);
  },

  generateSchedules: async (data: GenerateSchedulesForDateRequest) => {
    return apiClient.makeRequest('/schedules/generate/date', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  upsertProductConfig: async (productId: string, data: UpsertScheduleConfigByProductRequest) => {
    return apiClient.makeRequest(`/schedules/product/${productId}/config`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ==========================================
  // INTEGRACIÓN (CLIENTES Y PRODUCTOS)
  // ==========================================
  
  searchClients: async (name: string) => {
    return apiClient.makeRequest(`/client/name/${encodeURIComponent(name)}`);
  },

  getInitialClients: async () => {
    return apiClient.makeRequest(`/client/1/20`);
  },

  getProducts: async () => {
    try {
      // Intentar primero el endpoint específico de servicios
      return await apiClient.makeRequest('/products/service-courts');
    } catch (error) {
      // Fallback a todos los productos si falla el específico
      return apiClient.makeRequest('/products/all');
    }
  },
};
