/** Contratos del feature cash-flow (fuentes: GET /payables/cash-flow y GET /payables/schedule). */

/** Día de la proyección diaria del BE, remapeado para el AreaChart. */
export interface CashFlowPoint {
  /** Fecha formateada "dd MMM" (eje X). */
  name: string;
  ingresos: number;
  egresos: number;
  /** Flujo acumulado. */
  balance: number;
}

export interface CashFlowStats {
  coverageRatio: number;
  netFlow: number;
  totalInflows: number;
  totalOutflows: number;
}

export interface ScheduledPaymentItem {
  id: string;
  /** Siglas del proveedor (avatar). */
  code: string;
  name: string;
  description: string;
  category: string;
  amount: number;
  priority: string;
}

export interface ScheduledPaymentGroup {
  date: string;
  isToday: boolean;
  subtotal: number;
  items: ScheduledPaymentItem[];
}
