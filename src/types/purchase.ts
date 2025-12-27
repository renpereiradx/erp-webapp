/**
 * TypeScript interfaces for Purchase Orders based on PURCHASE_API.md
 * Enhanced with new fields: unit, tax_rate, profit_pct, line_total, sale_price, metadata, supplier_status
 */

// ============ ENHANCED PURCHASE ORDER TYPES ============

export interface PurchaseOrderRequest {
  supplier_id: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  order_details: PurchaseOrderDetail[];
  payment_method_id?: number;    // Opcional: ID del método de pago
  currency_id?: number;          // Opcional: ID de la moneda
  auto_update_prices?: boolean;  // Default: true
  default_profit_margin?: number; // Default: 30.0
  metadata?: Record<string, any>; // Opcional: datos adicionales
}

export interface PurchaseOrderDetail {
  product_id: string;
  quantity: number;
  unit_price: number;
  unit?: string;                    // Default: 'unit'
  profit_pct?: number;              // Para cálculo de precio sugerido
  explicit_sale_price?: number;     // API v1.0: Precio de venta explícito (entero, PYG)
  tax_rate_id?: number;             // Opcional
}

export interface PurchaseOrderResponse {
  success: boolean;
  purchase_order_id?: number;
  total_amount?: number;
  items_processed?: number;
  cost_entries_created?: number;
  prices_updated?: number;
  validation_issues?: ValidationIssue[];
  message?: string;
}

// ============ ENHANCED RESPONSE TYPES ============

export interface PurchaseOrderEnriched {
  purchase: PurchaseOrderHeader;
  details: PurchaseOrderItemEnhanced[];
}

export interface PurchaseOrderHeader {
  id: number;
  order_date: string;
  total_amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  supplier_id: number;
  supplier_name: string;
  supplier_status: boolean; // NUEVO CAMPO - Estado del proveedor (activo/inactivo)
  user_id: string;
  user_name: string;
}

export interface PurchaseOrderItemEnhanced {
  id: number;
  purchase_id: number;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  exp_date: string;
  user_id: string;
  user_name: string;

  // NUEVOS CAMPOS ENRIQUECIDOS según PURCHASE_API.md
  unit: string;             // Unidad del producto ("kg", "unit", "box", etc.)
  tax_rate: number;         // Tasa de impuesto aplicada
  profit_pct: number;       // Porcentaje de ganancia del producto
  line_total: number;       // Total calculado por línea
  sale_price: number;       // Precio de venta calculado dinámicamente
  metadata: PurchaseItemMetadata; // JSON completo para análisis adicional
}

export interface PurchaseItemMetadata {
  unit: string;
  tax_rate: number;
  line_total: number;
  profit_pct: number;
  [key: string]: any; // Permitir campos adicionales
}

// ============ ANALYSIS AND VALIDATION TYPES ============

export interface PurchaseOrderAnalysis {
  order_info: {
    po_id: number;
    supplier_id: number;
    status: string;
    total_amount: number;
    order_date: string;
    created_by: string;
    metadata: {
      auto_update_prices: boolean;
      default_profit_margin: number;
      system_version: string;
      total_items: number;
    };
  };

  order_items: PurchaseOrderItem[];

  cost_analysis: {
    total_cost_entries: number;
    avg_cost_per_unit: number;
    total_quantity_purchased: number;
    cost_variance: number;
  };

  pricing_impact: {
    prices_updated: number;
    avg_selling_price: number;
    avg_margin_percent: number;
  };
}

export interface PurchaseOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit: string;
  line_total: number;
  tax_rate: number;
  profit_pct: number;
}

export interface IntegrityValidation {
  validation_passed: boolean;
  issues_found: ValidationIssue[];
  recommendations: Recommendation[];
}

export interface ValidationIssue {
  type: 'MISSING_ORDER' | 'MISSING_COST_ENTRIES' | 'MISSING_PRICE_UPDATES';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  count?: number;
}

export interface Recommendation {
  action: string;
  description: string;
}

// ============ COST AND PRICING TYPES ============

export interface UnitCost {
  id: number;
  product_id: string;
  unit: string;
  cost_per_unit: number;
  supplier_id: number;
  purchase_order_id: number;
  purchase_date: string;
  quantity_purchased: number;
  created_by: string;
  metadata: {
    source: string;
    tax_rate?: number;
    tax_rate_id?: number;
    suggested_profit_pct: number;
    total_cost_with_tax: number;
  };
}

export interface UnitPrice {
  id: number;
  id_product: string;
  unit: string;
  price_per_unit: number;
  effective_date: string;
  metadata?: {
    source?: string;
    po_id?: number;
    cost_entry_id?: number;
    base_cost?: number;
    applied_margin_pct?: number;
    auto_generated?: boolean;
    price_protected?: boolean;
  };
}

// ============ CANCELLATION TYPES ============

export interface PreviewCancellationRequest {
  purchase_order_id: number;
}

export interface PreviewCancellationResponse {
  success: boolean;
  generated_at: string;
  purchase_info: {
    purchase_order_id: number;
    supplier_id: number;
    supplier_name: string;
    current_status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    total_amount: number;
    order_date: string;
    created_by: string;
    created_by_name: string;
  };
  stock_impact: StockImpactItem[];
  payment_impact: PaymentImpactItem[];
  impact_analysis: {
    total_items: number;
    products_with_insufficient_stock: number;
    requires_stock_adjustment: boolean;
    requires_payment_reversal: boolean;
    total_paid_amount: number;
    payments_to_cancel: number;
    requires_force_cancel: boolean;
  };
  can_be_cancelled: boolean;
  cancellation_issues: string[];
  warnings: string[];
  recommendations: string[];
  general_recommendations: {
    notify_supplier: boolean;
    backup_recommended: boolean;
    estimated_complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    requires_approval: boolean;
  };
}

export interface StockImpactItem {
  product_id: string;
  product_name: string;
  quantity_to_revert: number;
  current_stock: number;
  stock_after_cancellation: number;
  sufficient_stock: boolean;
  unit_price: number;
  line_total: number;
}

export interface PaymentImpactItem {
  payment_id: number;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
  status: string;
  can_be_cancelled: boolean;
}

export interface CancelPurchaseOrderRequest {
  purchase_order_id: number;
  user_id: string;
  cancellation_reason?: string;
  force_cancel?: boolean;
}

export interface CancelPurchaseOrderResponse {
  success: boolean;
  message: string;
  cancelled_order_id?: number;
  cancellation_details?: {
    items_reverted: number;
    stock_items_updated: number;
    payments_cancelled: number;
    cancelled_at: string;
    cancelled_by: string;
    force_cancel_used: boolean;
  };
  error?: string;
  details?: {
    purchase_order_id?: number;
    current_status?: string;
    insufficient_stock_products?: string[];
    requires_force_cancel?: boolean;
  };
}

// ============ DATE RANGE QUERY TYPES ============

export interface DateRangeParams {
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
}

// ============ SUPPLIER VALIDATION TYPES ============

export interface PurchaseOrderWithValidation {
  purchase: PurchaseOrderHeader;
  details: PurchaseOrderItem[];
}

// ============ LEGACY COMPATIBILITY TYPES ============

// Para mantener compatibilidad con código existente
export interface LegacyPurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  expDate?: string;
  taxRateId?: number;
  profitPct?: number;
}

export interface LegacyPurchaseOrderData {
  supplierId: number;
  supplierName: string;
  items: LegacyPurchaseOrderItem[];
  totalAmount: number;
  subtotalAmount: number;
  taxAmount: number;
  expectedDelivery?: string;
  notes: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

// ============ UTILITY TYPES ============

export interface PurchaseOrderFilters {
  page: number;
  limit: number;
  supplierId?: string;
  status?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  searchTerm?: string;
  supplier?: string;
  dateRange: {
    start: string;
    end: string;
  };
  showInactiveSuppliers?: boolean; // NUEVO FILTRO
}

export interface PurchaseOrderStatistics {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
  totalAmount: number;
  averageAmount: number;
}

export interface PurchaseServiceOptions {
  showInactiveSuppliers?: boolean;
}