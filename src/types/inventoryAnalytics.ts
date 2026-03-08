/**
 * Tipos para el sistema de analítica de inventario
 */

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
export type PerformanceClass = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
export type ABCClass = 'A' | 'B' | 'C';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export type ReorderPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface InventoryOverview {
  generated_at: string;
  total_products: number;
  total_units: number;
  total_value: number;
  total_cost: number;
  potential_profit: number;
  stock_status: {
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    overstock: number;
    in_stock_pct: number;
    low_stock_pct: number;
    out_of_stock_pct: number;
    overstock_pct: number;
  };
  valuation: {
    total_cost_value: number;
    total_retail_value: number;
    potential_margin: number;
    potential_margin_pct: number;
    average_cost: number;
    average_retail: number;
  };
  turnover: {
    turnover_rate: number;
    days_of_inventory: number;
    stockout_rate: number;
    fill_rate: number;
  };
}

export interface StockLevelProduct {
  product_id: string;
  product_name: string;
  sku: string;
  category_name: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  status: StockStatus;
  days_of_stock: number;
  unit_cost: number;
  unit_price: number;
  stock_value: number;
  last_movement: string;
  last_sale: string;
}

export interface StockLevelsData {
  generated_at: string;
  summary: {
    total_products: number;
    total_units: number;
    total_value: number;
    average_stock: number;
  };
  products: StockLevelProduct[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface ReorderProduct {
  product_id: string;
  product_name: string;
  sku: string;
  category_name: string;
  current_stock: number;
  min_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  estimated_cost: number;
  days_until_stockout: number;
  priority: ReorderPriority;
}

export interface ReorderAnalysis {
  generated_at: string;
  summary: {
    total_needing_reorder: number;
    urgent_count: number;
    soon_count: number;
    estimated_cost: number;
  };
  urgent_reorders: ReorderProduct[];
  soon_reorders: ReorderProduct[];
}

export interface DeadStockProduct {
  product_id: string;
  product_name: string;
  sku: string;
  category_name: string;
  current_stock: number;
  stock_value: number;
  last_sale_date: string;
  days_since_last_sale: number;
  last_movement_date: string;
  days_since_movement: number;
  recommendation: string;
}

export interface DeadStockAnalysis {
  generated_at: string;
  summary: {
    total_products: number;
    total_units: number;
    total_value: number;
    percentage_of_stock: number;
    average_days_idle: number;
    potential_loss: number;
  };
  products: DeadStockProduct[];
  recommendations: string[];
}

export interface StockForecastProduct {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  daily_demand: number;
  days_until_stockout: number;
  stockout_date: string;
  forecasted_stock: number;
  recommended_order: number;
  risk: RiskLevel;
}

export interface StockForecast {
  generated_at: string;
  forecast_days: number;
  summary: {
    products_at_risk: number;
    high_risk_count: number;
    medium_risk_count: number;
    estimated_stockouts: number;
    reorder_value: number;
  };
  risk_products: StockForecastProduct[];
}

export interface InventoryDashboardData {
  generated_at: string;
  kpis: {
    total_value: number;
    turnover_rate: number;
    days_of_inventory: number;
    stockout_rate: number;
    fill_rate: number;
    dead_stock_pct: number;
  };
  stock_status: {
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    overstock: number;
    in_stock_pct: number;
    low_stock_pct: number;
    out_of_stock_pct: number;
    overstock_pct: number;
  };
  alerts: {
    type: string;
    message: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  abc_summary: {
    class_a_count: number;
    class_a_value_pct: number;
    class_b_count: number;
    class_b_value_pct: number;
    class_c_count: number;
    class_c_value_pct: number;
  };
}
