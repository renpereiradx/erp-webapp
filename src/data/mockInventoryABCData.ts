// Tipos compartidos de los componentes legacy de InventoryAnalytics.
//
// Aceptan las dos formas que circularon: la del API BI (snake_case, espejo de
// models/inventory_analytics.go) y la camelCase del mock histórico. Los
// componentes resuelven con `??`/`||` campo a campo.
//
// El mock fabricado que vivía aquí (turnover_rate_change,
// days_of_inventory_change, abc_class_a dentro de la respuesta de turnover)
// fue eliminado: el backend nunca envió esos campos (la rotación vive en
// /inventory-analytics/turnover y el ABC en /inventory-analytics/abc) y la
// página los renderizaba como si fueran reales.

export interface TurnoverCategory {
  // API (GET /inventory-analytics/turnover → by_category)
  category_id?: string;
  category_name?: string;
  turnover_rate?: number;
  units_sold?: number;
  performance?: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";
  // mock histórico (camelCase)
  id?: string;
  name?: string;
  turnoverRate?: number;
  unitsSold?: number;
}

export interface ABCProduct {
  // API (GET /inventory-analytics/abc → class_a/class_b/class_c)
  product_id?: string;
  product_name?: string;
  sales_percentage?: number;
  stock_value?: number;
  // mock histórico (camelCase)
  id?: string;
  name?: string;
  value?: number;
  percentage?: number;
}
