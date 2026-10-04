/**
 * Tipos del feature Manufacturing (PLAN_UNITS_V2 F6.2).
 * Espejan los json tags de models/manufacturing.go (snake_case) y los
 * resultados JSON de las funciones SQL (register/estimated-cost).
 */

export interface Supply {
  id: number
  name: string
  description?: string | null
  unit: string
  supplier_name?: string | null
  state: boolean
  created_at: string
  updated_at: string
}

export interface SupplyEnriched extends Supply {
  total_purchases: number
  total_quantity_purchased: number
  total_spent: number
  avg_unit_cost?: number | null
  last_purchase_date?: string | null
  used_in_recipes: number
}

export interface SupplyPurchase {
  id: number
  supply_id: number
  supply_name?: string | null
  quantity: number
  unit_cost: number
  total_cost: number
  supplier_name?: string | null
  invoice_number?: string | null
  purchase_date: string
  user_id?: string | null
  notes?: string | null
}

export interface RegisterPurchaseResult {
  success: boolean
  purchase_id?: number
  supply_name?: string
  quantity?: number
  unit?: string
  unit_cost?: number
  total_cost?: number
  message?: string
  error?: string
}

export interface ProductionBatch {
  id: number
  product_id: string
  product_name?: string | null
  quantity_produced: number
  production_date: string
  batch_code?: string | null
  user_id?: string | null
  stock_transaction_id?: number | null
  production_cost?: number | null
  cost_per_unit?: number | null
  notes?: string | null
}

export interface RegisterProductionResult {
  success: boolean
  batch_id?: number
  batch_code?: string
  product_id?: string
  product_name?: string
  quantity_produced?: number
  quantity_requested?: number
  unit?: string
  requested_unit?: string | null
  branch_id?: number
  production_cost?: number | null
  cost_per_unit?: number | null
  new_stock?: number
  stock_transaction_id?: number
  message?: string
  error?: string
}

export interface RecipeIngredient {
  id: number
  product_id: string
  supply_id: number
  supply_name?: string | null
  quantity_per_unit: number
  unit?: string | null
  notes?: string | null
  created_at: string
}

export interface EstimatedCostDetail {
  supply_name: string
  quantity_needed: number
  unit: string
  avg_unit_cost: number
  total_cost: number
}

export interface EstimatedCost {
  success: boolean
  product_id: string
  product_name: string
  quantity: number
  estimated_total_cost: number
  cost_per_unit: number
  cost_details: EstimatedCostDetail[]
  error?: string
}

export interface ProductionSummaryRow {
  product_id: string
  product_name: string
  product_type: string
  branch_id?: number | null
  total_batches: number
  total_produced: number
  total_production_cost: number
  avg_cost_per_unit: number
  first_production_date?: string | null
  last_production_date?: string | null
  current_stock: number
  produced_recently: boolean
}

export interface ProfitabilityRow {
  product_id: string
  product_name: string
  branch_id?: number | null
  total_produced: number
  total_production_cost: number
  avg_production_cost_per_unit: number
  sale_price_per_unit: number
  sale_unit?: string | null
  profit_margin_per_unit: number
  profit_margin_percentage?: number | null
  current_stock: number
  inventory_value: number
}
