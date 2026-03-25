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

  getAvailableSchedules: async (productId: string, date: string, duration: number) => {
    return apiClient.makeRequest('/reserve/available-schedules', {
      params: { product_id: productId, date, duration }
    });
  },

  // ==========================================
  // HORARIOS (SCHEDULES)
  // ==========================================
  
  getSchedulesForProductAndDate: async (productId: string, date: string): Promise<ScheduleSlot[]> => {
    try {
      const response = await apiClient.makeRequest(`/schedules/product/${productId}/date/${date}/all`);
      // 🔧 FIX: Extraer el arreglo si viene envuelto en un objeto (común en APIs estructuradas)
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      if (response && Array.isArray(response.slots)) return response.slots;
      return [];
    } catch (error: any) {
      // Si el backend devuelve 500 porque no hay slots generados, devolvemos array vacío
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
