/**
 * Domain models for Reservations and Schedules.
 */

export type ReservationStatus = 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'PENDING';

export interface Reservation {
  id: number;
  product_id: string;
  client_id: string;
  client_name?: string;
  start_time: string; // ISO-8601
  end_time?: string;   // ISO-8601
  duration: number;    // Hours
  status: ReservationStatus;
  created_at?: string;
}

export interface ScheduleSlot {
  id?: number;
  start_time: string;
  end_time: string;
  status: 'AVAILABLE' | ReservationStatus;
  reservation_id?: number;
  client_name?: string;
  client_id?: string;
}

export interface ScheduleConfig {
  product_id: string;
  start_hour: number;
  end_hour: number;
  slot_minutes: number;
  timezone: string;
  effective_from: string; // YYYY-MM-DD
  effective_to?: string | null;
  is_active: boolean;
}

export interface ReservationReport {
  total_reservations: number;
  confirmed_count: number;
  cancelled_count: number;
  completion_rate: number;
  period_start: string;
  period_end: string;
}

export interface ConsistencyIssue {
  id: string;
  type: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}
