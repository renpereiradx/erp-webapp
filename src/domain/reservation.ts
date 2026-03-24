export type ReserveAction = 'CREATE' | 'UPDATE' | 'CONFIRM' | 'CANCEL';

export interface ManageReserveRequest {
  action: ReserveAction;
  reserve_id?: number;
  product_id: string;
  client_id: string;
  start_time: string; // ISO-8601
  duration: number; // hours
}

export interface GenerateSchedulesForDateRequest {
  target_date: string; // YYYY-MM-DD
  product_ids?: string[];
}

export interface UpsertScheduleConfigByProductRequest {
  start_hour: number; // 0..23
  end_hour: number; // 1..24
  slot_minutes: number; // default 60
  timezone: string; // e.g., "America/Asuncion"
  effective_from: string; // YYYY-MM-DD
  effective_to?: string | null;
  is_active: boolean;
}

export type ReserveStatus = 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface ScheduleSlot {
  id: number;
  product_id: string;
  start_time: string;
  end_time: string;
  status: 'AVAILABLE' | ReserveStatus;
  reserve?: {
    id: number;
    client_name: string;
    client_id: string;
  };
}

export interface ProductScheduleConfig {
  product_id: string;
  start_hour: number;
  end_hour: number;
  slot_minutes: number;
  timezone: string;
  is_active: boolean;
}
