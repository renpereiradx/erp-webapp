/**
 * Tipos e interfaces para la suite de Business Intelligence (BI)
 */

export interface BIParams {
  branch_id?: number;
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  page?: number;
  page_size?: number;
}

// --- Dashboard ---
export interface DashboardSummary {
  total_revenue: number;
  total_orders: number;
  average_ticket: number;
  customer_count: number;
  growth_percentage: number;
}

export interface KPIData {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

// --- Receivables & Payables ---
export interface FinancialOverview {
  total_amount: number;
  overdue_amount: number;
  pending_amount: number;
  count: number;
}

export interface AgingReportItem {
  range: '0-30' | '31-60' | '61-90' | '90+';
  amount: number;
  percentage: number;
}

// --- Sales Analytics ---
export interface SalesPerformance {
  period: string;
  revenue: number;
  orders: number;
  cost: number;
  profit: number;
}

export interface SalesHeatmapData {
  day_of_week: number;
  hour_of_day: number;
  intensity: number;
  revenue: number;
}

// --- Inventory Analytics ---
export interface StockLevelItem {
  product_id: string;
  product_name: string;
  current_stock: number;
  reorder_point: number;
  is_low_stock: boolean;
}

export interface InventoryTurnover {
  product_id: string;
  product_name: string;
  turnover_rate: number;
  days_in_stock: number;
}
