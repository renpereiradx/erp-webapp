export type MovementType = 'INCOME' | 'EXPENSE' | 'ADJUSTMENT';

export interface CashMovement {
  id?: number;
  movement_id?: number;
  movement_type: MovementType;
  amount: number;
  concept?: string;
  description?: string;
  notes?: string;
  created_at: string;
  user_full_name?: string;
  created_by_name?: string;
  running_balance?: number;
}

export interface CashRegister {
  id: number;
  name: string;
  initial_balance: number;
  current_balance: number;
  status: 'OPEN' | 'CLOSED';
  opened_at: string;
  closed_at?: string;
  location?: string;
  notes?: string;
}

export interface CashAudit {
  id: number;
  counted_amount: number;
  difference: number;
  created_at: string;
}

export interface Denominations {
  bills?: number[];
  coins?: number[];
}
