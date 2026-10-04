/**
 * Servicio HTTP del feature Manufacturing (PLAN_UNITS_V2 F6.2).
 *
 * Cliente único de /manufacturing/* (insumos, compras de insumos, recetas,
 * producción manual y reportes). El backend emite snake_case (json tags de
 * models/manufacturing.go); los resultados de las funciones SQL llegan como
 * objetos {success, ...} que se devuelven tal cual — el caller decide qué
 * hacer con success:false (mensaje accionable del SQL).
 *
 * Convención del repo: apiClient.get/post devuelven el dato directamente.
 * Los errores 4xx/5xx lanzan; se normalizan con toApiError en el caller.
 */

import { apiClient } from '@/services/api'
import type {
  EstimatedCost,
  ProductionBatch,
  ProductionSummaryRow,
  ProfitabilityRow,
  RecipeIngredient,
  RegisterProductionResult,
  RegisterPurchaseResult,
  SupplyEnriched,
  SupplyPurchase,
} from '@/features/manufacturing/types'

const ENDPOINTS = {
  supplies: '/manufacturing/supplies',
  purchases: '/manufacturing/purchases',
  production: '/manufacturing/production',
  batches: '/manufacturing/production/batches',
  recipes: '/manufacturing/recipes',
  reports: '/manufacturing/reports',
} as const

type AnyRecord = Record<string, any>

/** Devuelve el primer valor definido entre las claves candidatas (defensivo). */
function pick(obj: AnyRecord | null | undefined, keys: string[]): any {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] !== undefined) return obj[k]
  }
  return undefined
}

function normalizeSupply(raw: AnyRecord): SupplyEnriched {
  return {
    id: Number(pick(raw, ['id', 'ID']) ?? 0),
    name: String(pick(raw, ['name', 'Name']) ?? ''),
    description: pick(raw, ['description', 'Description']) ?? null,
    unit: String(pick(raw, ['unit', 'Unit']) ?? 'unit'),
    supplier_name: pick(raw, ['supplier_name', 'SupplierName']) ?? null,
    state: Boolean(pick(raw, ['state', 'State']) ?? true),
    created_at: String(pick(raw, ['created_at', 'CreatedAt']) ?? ''),
    updated_at: String(pick(raw, ['updated_at', 'UpdatedAt']) ?? ''),
    total_purchases: Number(pick(raw, ['total_purchases', 'TotalPurchases']) ?? 0),
    total_quantity_purchased: Number(
      pick(raw, ['total_quantity_purchased', 'TotalQuantityPurchased']) ?? 0,
    ),
    total_spent: Number(pick(raw, ['total_spent', 'TotalSpent']) ?? 0),
    avg_unit_cost: pick(raw, ['avg_unit_cost', 'AvgUnitCost']) ?? null,
    last_purchase_date: pick(raw, ['last_purchase_date', 'LastPurchaseDate']) ?? null,
    used_in_recipes: Number(pick(raw, ['used_in_recipes', 'UsedInRecipes']) ?? 0),
  }
}

function normalizePurchase(raw: AnyRecord): SupplyPurchase {
  return {
    id: Number(pick(raw, ['id', 'ID']) ?? 0),
    supply_id: Number(pick(raw, ['supply_id', 'SupplyID']) ?? 0),
    supply_name: pick(raw, ['supply_name', 'SupplyName']) ?? null,
    quantity: Number(pick(raw, ['quantity', 'Quantity']) ?? 0),
    unit_cost: Number(pick(raw, ['unit_cost', 'UnitCost']) ?? 0),
    total_cost: Number(pick(raw, ['total_cost', 'TotalCost']) ?? 0),
    supplier_name: pick(raw, ['supplier_name', 'SupplierName']) ?? null,
    invoice_number: pick(raw, ['invoice_number', 'InvoiceNumber']) ?? null,
    purchase_date: String(pick(raw, ['purchase_date', 'PurchaseDate']) ?? ''),
    user_id: pick(raw, ['user_id', 'UserID']) ?? null,
    notes: pick(raw, ['notes', 'Notes']) ?? null,
  }
}

function normalizeBatch(raw: AnyRecord): ProductionBatch {
  return {
    id: Number(pick(raw, ['id', 'ID']) ?? 0),
    product_id: String(pick(raw, ['product_id', 'ProductID']) ?? ''),
    product_name: pick(raw, ['product_name', 'ProductName']) ?? null,
    quantity_produced: Number(pick(raw, ['quantity_produced', 'QuantityProduced']) ?? 0),
    production_date: String(pick(raw, ['production_date', 'ProductionDate']) ?? ''),
    batch_code: pick(raw, ['batch_code', 'BatchCode']) ?? null,
    user_id: pick(raw, ['user_id', 'UserID']) ?? null,
    stock_transaction_id: pick(raw, ['stock_transaction_id', 'StockTransactionID']) ?? null,
    production_cost: pick(raw, ['production_cost', 'ProductionCost']) ?? null,
    cost_per_unit: pick(raw, ['cost_per_unit', 'CostPerUnit']) ?? null,
    notes: pick(raw, ['notes', 'Notes']) ?? null,
  }
}

function normalizeIngredient(raw: AnyRecord): RecipeIngredient {
  return {
    id: Number(pick(raw, ['id', 'ID']) ?? 0),
    product_id: String(pick(raw, ['product_id', 'ProductID']) ?? ''),
    supply_id: Number(pick(raw, ['supply_id', 'SupplyID']) ?? 0),
    supply_name: pick(raw, ['supply_name', 'SupplyName']) ?? null,
    quantity_per_unit: Number(pick(raw, ['quantity_per_unit', 'QuantityPerUnit']) ?? 0),
    unit: pick(raw, ['unit', 'Unit']) ?? null,
    notes: pick(raw, ['notes', 'Notes']) ?? null,
    created_at: String(pick(raw, ['created_at', 'CreatedAt']) ?? ''),
  }
}

// ─── Insumos ────────────────────────────────────────────────────────────────

export const manufacturingService = {
  async getSupplies(activeOnly = false): Promise<SupplyEnriched[]> {
    const data = await apiClient.get(ENDPOINTS.supplies, {
      params: activeOnly ? { active: 'true' } : undefined,
    })
    const rows: AnyRecord[] = Array.isArray(data) ? data : []
    return rows.map(normalizeSupply)
  },

  async createSupply(payload: {
    name: string
    description?: string | null
    unit: string
    supplier_name?: string | null
  }): Promise<SupplyEnriched> {
    const raw = await apiClient.post(ENDPOINTS.supplies, payload)
    return normalizeSupply(raw)
  },

  async updateSupply(
    id: number,
    payload: {
      name?: string
      description?: string | null
      unit?: string
      supplier_name?: string | null
      state?: boolean
    },
  ): Promise<unknown> {
    return apiClient.put(`${ENDPOINTS.supplies}/${id}`, payload)
  },

  async deleteSupply(id: number): Promise<unknown> {
    return apiClient.delete(`${ENDPOINTS.supplies}/${id}`)
  },

  // ─── Compras de insumos ───────────────────────────────────────────────────

  async registerSupplyPurchase(payload: {
    supply_id: number
    quantity: number
    unit_cost: number
    supplier_name?: string | null
    invoice_number?: string | null
    notes?: string | null
  }): Promise<RegisterPurchaseResult> {
    return apiClient.post(ENDPOINTS.purchases, payload)
  },

  async getSupplyPurchases(
    supplyId: number | undefined,
    limit = 20,
    offset = 0,
  ): Promise<SupplyPurchase[]> {
    const params: Record<string, unknown> = { limit, offset }
    if (supplyId) params.supply_id = supplyId
    const data = await apiClient.get(ENDPOINTS.purchases, { params })
    const rows: AnyRecord[] = Array.isArray(data) ? data : []
    return rows.map(normalizePurchase)
  },

  // ─── Producción ───────────────────────────────────────────────────────────

  async registerProduction(payload: {
    product_id: string
    quantity_produced: number
    batch_code?: string | null
    production_cost?: number | null
    notes?: string | null
    /** Unidad en la que se expresa quantity_produced (nil/omitida = base). */
    unit?: string
  }): Promise<RegisterProductionResult> {
    return apiClient.post(ENDPOINTS.production, payload)
  },

  async getBatches(productId?: string, limit = 20, offset = 0): Promise<ProductionBatch[]> {
    const params: Record<string, unknown> = { limit, offset }
    if (productId) params.product_id = productId
    const data = await apiClient.get(ENDPOINTS.batches, { params })
    const rows: AnyRecord[] = Array.isArray(data) ? data : []
    return rows.map(normalizeBatch)
  },

  // ─── Recetas ──────────────────────────────────────────────────────────────

  async getRecipe(productId: string): Promise<RecipeIngredient[]> {
    const data = await apiClient.get(`${ENDPOINTS.recipes}/${productId}`)
    const rows: AnyRecord[] = Array.isArray(data) ? data : []
    return rows.map(normalizeIngredient)
  },

  async addRecipeIngredient(
    productId: string,
    payload: { supply_id: number; quantity_per_unit: number; notes?: string | null },
  ): Promise<unknown> {
    return apiClient.post(`${ENDPOINTS.recipes}/${productId}/ingredients`, payload)
  },

  async removeRecipeIngredient(productId: string, supplyId: number): Promise<unknown> {
    return apiClient.delete(`${ENDPOINTS.recipes}/${productId}/ingredients/${supplyId}`)
  },

  async getEstimatedCost(productId: string, quantity = 1): Promise<EstimatedCost> {
    return apiClient.get(`${ENDPOINTS.recipes}/${productId}/estimated-cost`, {
      params: { quantity },
    })
  },

  // ─── Reportes ─────────────────────────────────────────────────────────────

  async getProductionSummary(productId?: string): Promise<ProductionSummaryRow[]> {
    const data = await apiClient.get(`${ENDPOINTS.reports}/production`, {
      params: productId ? { product_id: productId } : undefined,
    })
    return Array.isArray(data) ? data : []
  },

  async getProfitability(productId?: string): Promise<ProfitabilityRow[]> {
    const data = await apiClient.get(`${ENDPOINTS.reports}/profitability`, {
      params: productId ? { product_id: productId } : undefined,
    })
    return Array.isArray(data) ? data : []
  },
}
