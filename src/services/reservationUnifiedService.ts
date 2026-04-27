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

  async getSlotsByDate(productId: string, date: string): Promise<ScheduleSlot[]> {
    try {
      const response = await apiClient.get(`/schedules/product/${productId}/date/${date}/all`);
      return response.data?.slots || response.data || [];
    } catch (e) {
       console.error(e);
       return [];
    }
  }

  async getAvailableSchedules(productId: string, date: string, duration: number): Promise<ScheduleSlot[]> {
    try {
      const response = await apiClient.get(`/reserve/available-schedules?product_id=${productId}&date=${date}&duration=${duration}`);
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

  async getAllReservations(): Promise<Reservation[]> {
    try {
      const response = await apiClient.get(`/reserve/all`);
      return Array.isArray(response.data) ? response.data : response.data?.reservations || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getReservationReport(startDate: string, endDate: string): Promise<ReservationReport | null> {
    try {
      const response = await apiClient.get(`/reserve/report?start_date=${startDate}&end_date=${endDate}`);
      return response.data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async checkConsistency(): Promise<ConsistencyIssue[]> {
    try {
      const response = await apiClient.get(`/reserve/consistency/check`);
      return Array.isArray(response.data) ? response.data : response.data?.issues || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }
}

export const reservationUnifiedService = new ReservationUnifiedService();
