import { 
  InventoryOverview, 
  StockLevelsData, 
  ReorderAnalysis, 
  DeadStockAnalysis, 
  StockForecast, 
  InventoryDashboardData 
} from '../types/inventoryAnalytics';

export const mockInventoryOverview: InventoryOverview = {
  generated_at: new Date().toISOString(),
  total_products: 150,
  total_units: 5000,
  total_value: 250000000,
  total_cost: 180000000,
  potential_profit: 70000000,
  stock_status: {
    in_stock: 120,
    low_stock: 20,
    out_of_stock: 5,
    overstock: 5,
    in_stock_pct: 80.0,
    low_stock_pct: 13.3,
    out_of_stock_pct: 3.3,
    overstock_pct: 3.3
  },
  valuation: {
    total_cost_value: 180000000,
    total_retail_value: 250000000,
    potential_margin: 70000000,
    potential_margin_pct: 28.0,
    average_cost: 1200000,
    average_retail: 1666667
  },
  turnover: {
    turnover_rate: 4.2,
    days_of_inventory: 87,
    stockout_rate: 3.3,
    fill_rate: 96.7
  }
};

export const mockStockLevels: StockLevelsData = {
  generated_at: new Date().toISOString(),
  summary: {
    total_products: 150,
    total_units: 5000,
    total_value: 250000000,
    average_stock: 33.3
  },
  products: [
    {
      product_id: "123",
      product_name: "Smartphone X1 Pro",
      sku: "SKU-001",
      category_name: "Electrónica",
      current_stock: 15,
      min_stock: 10,
      max_stock: 50,
      reorder_point: 15,
      status: "LOW_STOCK",
      days_of_stock: 7.5,
      unit_cost: 1000000,
      unit_price: 1500000,
      stock_value: 22500000,
      last_movement: "2026-01-03T14:00:00Z",
      last_sale: "2026-01-04T09:30:00Z"
    },
    {
      product_id: "124",
      product_name: "Laptop Ultra Slim 15\"",
      sku: "SKU-002",
      category_name: "Electrónica",
      current_stock: 5,
      min_stock: 10,
      max_stock: 30,
      reorder_point: 12,
      status: "LOW_STOCK",
      days_of_stock: 3.2,
      unit_cost: 4500000,
      unit_price: 6500000,
      stock_value: 22500000,
      last_movement: "2026-01-05T10:00:00Z",
      last_sale: "2026-01-05T08:00:00Z"
    },
    {
      product_id: "125",
      product_name: "Cámara DSLR Pro",
      sku: "SKU-003",
      category_name: "Fotografía",
      current_stock: 0,
      min_stock: 5,
      max_stock: 15,
      reorder_point: 5,
      status: "OUT_OF_STOCK",
      days_of_stock: 0,
      unit_cost: 3200000,
      unit_price: 4800000,
      stock_value: 0,
      last_movement: "2025-12-28T16:00:00Z",
      last_sale: "2025-12-28T15:30:00Z"
    }
  ],
  pagination: {
    page: 1,
    page_size: 20,
    total_items: 150,
    total_pages: 8
  }
};

export const mockReorderAnalysis: ReorderAnalysis = {
  generated_at: new Date().toISOString(),
  summary: {
    total_needing_reorder: 35,
    urgent_count: 10,
    soon_count: 25,
    estimated_cost: 50000000
  },
  urgent_reorders: [
    {
      product_id: "789",
      product_name: "Cámara DSLR Pro",
      sku: "SKU-789",
      category_name: "Fotografía",
      current_stock: 0,
      min_stock: 5,
      reorder_point: 5,
      reorder_quantity: 10,
      estimated_cost: 32000000,
      days_until_stockout: 0,
      priority: "URGENT"
    }
  ],
  soon_reorders: [
    {
      product_id: "123",
      product_name: "Smartphone X1 Pro",
      sku: "SKU-001",
      category_name: "Electrónica",
      current_stock: 15,
      min_stock: 10,
      reorder_point: 15,
      reorder_quantity: 20,
      estimated_cost: 20000000,
      days_until_stockout: 7.5,
      priority: "MEDIUM"
    }
  ]
};

export const mockDeadStockAnalysis: DeadStockAnalysis = {
  generated_at: new Date().toISOString(),
  summary: {
    total_products: 25,
    total_units: 800,
    total_value: 45000000,
    percentage_of_stock: 18.0,
    average_days_idle: 135,
    potential_loss: 13500000
  },
  products: [
    {
      product_id: "456",
      product_name: "Monitor 4K Industrial Old Gen",
      sku: "SKU-456",
      category_name: "Electrónica",
      current_stock: 50,
      stock_value: 25000000,
      last_sale_date: "2025-08-15T00:00:00Z",
      days_since_last_sale: 143,
      last_movement_date: "2025-09-01T00:00:00Z",
      days_since_movement: 126,
      recommendation: "Considerar liquidación o descontinuar"
    }
  ],
  recommendations: [
    "Alto porcentaje de stock muerto. Revisar política de compras.",
    "Evaluar descontinuación de productos sin movimiento."
  ]
};

export const mockStockForecast: StockForecast = {
  generated_at: new Date().toISOString(),
  forecast_days: 30,
  summary: {
    products_at_risk: 15,
    high_risk_count: 5,
    medium_risk_count: 10,
    estimated_stockouts: 3,
    reorder_value: 25000000
  },
  risk_products: [
    {
      product_id: "123",
      product_name: "Smartphone X1 Pro",
      sku: "SKU-123",
      current_stock: 20,
      daily_demand: 3.5,
      days_until_stockout: 5.7,
      stockout_date: "2026-03-14",
      forecasted_stock: 0,
      recommended_order: 85,
      risk: "HIGH"
    }
  ]
};

export const mockInventoryDashboard: InventoryDashboardData = {
  generated_at: new Date().toISOString(),
  kpis: {
    total_value: 250000000,
    potential_profit: 70000000,
    turnover_rate: 4.2,
    days_of_inventory: 87,
    stockout_rate: 3.3,
    fill_rate: 96.7,
    dead_stock_pct: 15.0
  },
  stock_status: {
    in_stock: 120,
    low_stock: 20,
    out_of_stock: 5,
    overstock: 5,
    in_stock_pct: 80.0,
    low_stock_pct: 13.3,
    out_of_stock_pct: 3.3,
    overstock_pct: 3.3
  },
  abc_summary: {
    class_a_count: 15,
    class_a_value_pct: 80.0,
    class_b_count: 35,
    class_b_value_pct: 15.0,
    class_c_count: 100,
    class_c_value_pct: 5.0
  },
  alerts: [
    {
      type: "OUT_OF_STOCK",
      message: "5 productos sin stock",
      severity: "CRITICAL"
    },
    {
      type: "LOW_STOCK",
      message: "20 productos con stock bajo",
      severity: "HIGH"
    }
  ]
};
