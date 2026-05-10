import { apiClient } from './api';
import { 
  Reservation, 
  ScheduleSlot, 
  ScheduleConfig, 
  ReservationReport, 
  ConsistencyIssue 
} from '@/domain/reservation/models';

export interface ManageReserveRequest {
  action: 'CREATE' | 'UPDATE' | 'CONFIRM' | 'CANCEL';
  reserve_id?: number;
  product_id: string;
  client_id: string;
  start_time: string; // ISO-8601
  duration: number; // hours
  branch_id?: number;
}

export interface GenerateSchedulesRequest {
  target_date: string; // YYYY-MM-DD
  product_ids?: string[];
}

class ReservationUnifiedService {
  async getConfig(productId: string): Promise<ScheduleConfig | null> {
    try {
      const response = await apiClient.get(`/schedules/product/${productId}/config`);
      return response.data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async saveConfig(productId: string, data: Partial<ScheduleConfig>): Promise<ScheduleConfig> {
    const response = await apiClient.post(`/schedules/product/${productId}/config`, data);
    return response.data;
  }

  async generateSchedules(data: GenerateSchedulesRequest): Promise<any> {
    const response = await apiClient.post(`/schedules/generate/date`, data);
    return response.data;
  }

  async getSlotsByDate(productId: string, date: string, branchId?: number): Promise<ScheduleSlot[]> {
    try {
      const url = `/schedules/product/${productId}/date/${date}/all${branchId ? `?branch_id=${branchId}` : ''}`;
      const response = await apiClient.get(url);
      return response.data?.slots || response.data || [];
    } catch (e) {
       console.error(e);
       return [];
    }
  }

  async getAvailableSchedules(productId: string, date: string, duration: number, branchId?: number): Promise<ScheduleSlot[]> {
    try {
      let url = `/reserve/available-schedules?product_id=${productId}&date=${date}&duration_hours=${duration}`;
      if (branchId) url += `&branch_id=${branchId}`;
      const response = await apiClient.get(url);
      return response.data?.available_slots || response.data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async manageReservation(data: ManageReserveRequest): Promise<Reservation> {
    const response = await apiClient.post(`/reserve/manage`, data);
    return response.data;
  }

  async getAllReservations(branchId?: number): Promise<Reservation[]> {
    try {
      const url = `/reserve/all${branchId ? `?branch_id=${branchId}` : ''}`;
      const response = await apiClient.get(url);
      return Array.isArray(response.data) ? response.data : response.data?.reservations || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getReservationsByProductId(productId: string, branchId?: number): Promise<Reservation[]> {
    try {
      const url = `/reserve/product/${productId}${branchId ? `?branch_id=${branchId}` : ''}`;
      const response = await apiClient.get(url);
      return Array.isArray(response.data) ? response.data : response.data?.reservations || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getReservationsByClientId(clientId: string, branchId?: number): Promise<Reservation[]> {
    try {
      const url = `/reserve/client/${clientId}${branchId ? `?branch_id=${branchId}` : ''}`;
      const response = await apiClient.get(url);
      return Array.isArray(response.data) ? response.data : response.data?.reservations || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getReservationsByClientName(clientName: string, branchId?: number): Promise<Reservation[]> {
    try {
      const url = `/reserve/client/name/${encodeURIComponent(clientName)}${branchId ? `?branch_id=${branchId}` : ''}`;
      const response = await apiClient.get(url);
      return Array.isArray(response.data) ? response.data : response.data?.reservations || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getReservationReport(startDate: string, endDate: string, branchId?: number): Promise<ReservationReport | null> {
    try {
      let url = `/reserve/report?start_date=${startDate}&end_date=${endDate}`;
      if (branchId) url += `&branch_id=${branchId}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async checkConsistency(branchId?: number): Promise<ConsistencyIssue[]> {
    try {
      const url = `/reserve/consistency/check${branchId ? `?branch_id=${branchId}` : ''}`;
      const response = await apiClient.get(url);
      return Array.isArray(response.data) ? response.data : response.data?.issues || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }
}

export const reservationUnifiedService = new ReservationUnifiedService();
