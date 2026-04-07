// 🚀 Business Management API - TypeScript Types & Interfaces
// Archivo adaptado para nuestra aplicación ERP

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role_id: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  status: string;
  avatar_url?: string;
  roles?: Array<{ id: string; name: string }>;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
  sessions_count?: number;
}

export interface UserSession {
  id: string | number;
  user_id: string;
  token_hash?: string;
  ip_address: string;
  user_agent: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | string;
  location_info?: string;
  is_active: boolean;
  is_current?: boolean;
  is_idle?: boolean;
  is_anomaly?: boolean;
  last_activity: string; // ISO Date
  expires_at: string; // ISO Date
  created_at: string; // ISO Date
  revoked_at?: string;
  revoked_by?: string;
  revoke_reason?: string;
  user?: Partial<User>;
}

export interface SessionConfig {
  id: number;
  role_id: string;
  max_concurrent_sessions: number;
  session_timeout_minutes: number;
  inactivity_timeout_minutes: number;
  require_device_verification: boolean;
  allow_multiple_locations: boolean;
  force_logout_on_password_change: boolean;
}

export interface UserActivity {
  id: number | string;
  user_id: string;
  session_id?: string | number;
  activity_type: string;
  endpoint?: string;
  http_method?: string;
  ip_address: string;
  user_agent: string;
  request_data?: string;
  response_status?: number;
  duration_ms?: number;
  created_at: string;
}

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  code?: string;
  state?: boolean;
  is_active: boolean;
  category_id: number;
  id_category?: number; // Legacy field
  price?: number;
  stock_quantity?: number;
  description?: string;
  product_type?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// FINANCIAL ENRICHED PRODUCT TYPES
// ============================================================================

export interface UnitPrice {
  id: number;
  product_id: string;
  unit: string;
  price_per_unit: number;
  effective_date: string; // ISO 8601 date string
}

export interface UnitCostSummary {
  unit: string;
  last_cost: number;
  last_purchase_date: string; // ISO 8601 date string
  weighted_avg_cost_6m: number;
  total_purchases: number;
  cost_variance_percent: number;
}

export interface FinancialHealth {
  has_prices: boolean;
  has_costs: boolean;
  has_stock: boolean;
  price_count: number;
  cost_units_count: number;
  last_updated: string; // ISO 8601 date string
}

export interface TaxRateInfo {
  id: number;
  tax_name: string;
  code: string;
  rate: number;
}

export interface TaxInfo {
  classification_code: string;
  resolution_source: string;
  rate: TaxRateInfo;
}

export interface ProductOperationInfoResponse {
  product_id: string;
  product_name: string;
  barcode: string | null;
  state: boolean;
  category_id?: number;
  product_type: 'PHYSICAL' | 'SERVICE' | 'PRODUCTION';
  origin?: 'NACIONAL' | 'IMPORTADO' | null;
  brand?: string | null;
  base_unit?: string | null;
  created_at?: string;
  updated_at?: string;
  unit_prices: UnitPrice[];
  unit_costs_summary: UnitCostSummary[];
  stock_quantity: number | null;
  stock_updated_at?: string | null;
  stock_updated_by?: string | null;
  description: string | null;
  description_updated_at?: string | null;
  category_name?: string;
  category?: Category;
  tax?: TaxInfo;
  context?: {
    operation: 'sale' | 'purchase' | string;
  };
  operation_hints?: Record<string, any>;
  financial_health: FinancialHealth;
  stock_status: 'out_of_stock' | 'low_stock' | 'medium_stock' | 'in_stock' | 'no_stock_tracking' | 'unavailable' | 'limited_availability' | 'available';
  has_valid_stock: boolean;
  has_valid_prices: boolean;
  has_valid_costs: boolean;
  best_margin_unit: string | null;
  best_margin_percent: number | null;
  match_score?: number; // Only present in search results
}

export interface CreateProductRequest {
  name: string;
  description: string;
  category_id: number;
  product_type?: 'PHYSICAL' | 'SERVICE';
  barcode?: string | null;
  origin?: 'NACIONAL' | 'IMPORTADO' | null;
  brand?: string | null;
  base_unit?: string | null;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  state?: boolean;
  is_active?: boolean;
  category_id?: number;
  product_type?: 'PHYSICAL' | 'SERVICE';
  barcode?: string | null;
  origin?: 'NACIONAL' | 'IMPORTADO' | null;
  brand?: string | null;
  base_unit?: string | null;
}

// ============================================================================
// PRODUCT PRICE TYPES
// ============================================================================

export interface ProductPrice {
  id: number;
  product_id: string;
  cost_price: number;
  sale_price?: number;
  tax?: number;
  last_updated_by: string;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  metadata?: Record<string, any>;
}

export interface CreateProductPriceRequest {
  costPrice: number;
  cost_price?: number; // Legacy support
  salePrice?: number;
  sale_price?: number; // Legacy support
  tax?: number;
}

// ============================================================================
// STOCK TYPES
// ============================================================================

export interface StockEntity {
  name: string;
}

export interface Stock {
  id: number;
  product_id: string;
  quantity: number;
  exp: string; // Date string YYYY-MM-DD
  entity: StockEntity;
  min_stock?: number;
  max_stock?: number;
}

export interface CreateStockRequest {
  quantity: number;
  expirationDate: string;
  exp?: string; // Legacy support
  entityName?: string;
  entity?: StockEntity;
}

// ============================================================================
// CLIENT TYPES
// ============================================================================

export interface Client {
  id: string;
  name: string;
  last_name?: string;
  lastName?: string; // Frontend convenience
  document_id?: string;
  documentId?: string; // Frontend convenience
  status: boolean;
  user_id?: string;
  created_at?: string; // ISO 8601 date string
  contact?: string;
}

export interface CreateClientRequest {
  name: string;
  lastName?: string;
  last_name?: string; // Legacy support
  documentId?: string;
  document_id?: string; // Legacy support
  contact?: string;
  status?: boolean;
}

// ============================================================================
// SALE TYPES
// ============================================================================

export interface Sale {
  id: string;
  client_id: string;
  clientId?: string; // Frontend convenience
  total_amount: number;
  totalAmount?: number; // Frontend convenience
  sale_date: string; // ISO 8601 date string
  status: string;
}

export interface CreateSaleRequest {
  clientId: string;
  client_id?: string; // Legacy support
  totalAmount: number;
  total_amount?: number; // Legacy support
  sale_date?: string; // ISO 8601 date string, defaults to now
  status?: string; // defaults to "completed"
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export interface Inventory {
  id: number;                    // ID único del inventario (int)
  user_id: string;               // ID del usuario que realizó el inventario
  check_date: string;            // Fecha del conteo (ISO 8601)
  state: boolean;                // Estado del inventario (activo/inválido)
}

export interface InventoryItem {
  id: number;                    // ID único del item (int)
  inventory_id: number;          // ID del inventario padre
  product_id: string;            // ID del producto
  quantity_checked: number;      // Cantidad contada
  previous_quantity: number;     // Cantidad anterior registrada
  cost?: number;                 // Costo opcional
  price?: number;                // Precio opcional
}

export interface DetailedInventory {
  inventory: Inventory;          // Información del inventario
  items: InventoryItem[];        // Lista de items del inventario
}

export interface InventoryRequest {
  action: "insert" | "invalidate"; // Acción a realizar (requerido)
  id_inventory?: number;         // ID del inventario (para invalidate)
  check_date?: string;           // Fecha del conteo (para insert)
  details?: InventoryItemInput[]; // Items del inventario (para insert)
}

export interface InventoryItemInput {
  product_id: string;            // ID del producto (requerido)
  quantity_checked: number;      // Cantidad contada (requerido)
  cost?: number;                 // Costo opcional
  price?: number;                // Precio opcional
}

export type CreateInventoryRequest = InventoryItemInput[];

// ============================================================================
// CASH REGISTER TYPES (v1.1 - March 2026)
// ============================================================================

export interface CashRegister {
  id: number;
  name: string;
  status: "OPEN" | "CLOSED";
  initial_balance: number;
  current_balance: number;
  opened_at: string;
  opened_by: string | number;
  closed_at?: string;
  closed_by?: string | number;
  final_balance?: number;
  difference?: number; // v1.1 field
  total_income?: number; // v1.1 field
  total_expenses?: number; // v1.1 field
  location?: string;
  description?: string;
}

export interface OpenCashRegisterRequest {
  name: string;
  initial_balance: number;
  location?: string;
}

export interface CloseCashRegisterRequest {
  final_notes?: string;
  counted_cash?: number;
}

export interface CashRegisterMovement {
  id: number;
  cash_register_id: number;
  movement_type: "INCOME" | "EXPENSE";
  amount: number;
  category?: string;
  description?: string;
  running_balance?: number;
  is_voided?: boolean;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
  created_by_name?: string;
}

export interface RegisterMovementRequest {
  cash_register_id: number;
  movement_type: "INCOME" | "EXPENSE";
  amount: number;
  category?: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
}

export interface CashRegisterReport {
  cash_register: Partial<CashRegister>;
  summary: {
    total_income: number;
    total_expenses: number;
    net_change: number;
    transaction_count: number;
  };
  by_category: Record<string, number>;
}

// ============================================================================
// CASH AUDIT TYPES (v1.1)
// ============================================================================

export interface CashDenomination {
  denomination: number;
  count: number;
  type: "BILL" | "COIN";
}

export interface CashAudit {
  id: number;
  cash_register_id: number;
  expected_balance: number;
  counted_amount: number;
  difference: number;
  status: "MATCH" | "DISCREPANCY" | "RESOLVED";
  notes?: string;
  created_at: string;
}

export interface CreateCashAuditRequest {
  cash_register_id: number;
  counted_amount: number;
  notes?: string;
  denominations?: CashDenomination[];
}

// ============================================================================
// PAYMENT METHOD TYPES (v1.1)
// ============================================================================

export interface PaymentMethod {
  id: number;
  method_code: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePaymentMethodRequest {
  method_code: string;
  description?: string;
}

// ============================================================================
// CURRENCY TYPES (v1.1)
// ============================================================================

export interface Currency {
  id: number;
  code: string;
  iso_number?: number;
  name: string;
  symbol?: string;
  decimal_places: number;
  is_base: boolean;
  is_active: boolean;
  country_code?: string;
  format_pattern?: string;
  thousands_separator?: string;
  decimal_separator?: string;
  current_rate?: number;
  rate_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CurrencyConversionResponse {
  original_amount: number;
  original_currency: string;
  converted_amount: number;
  target_currency: string;
  exchange_rate: number;
  rate_date: string;
  formatted_original: string;
  formatted_converted: string;
}

// ============================================================================
// EXCHANGE RATE TYPES (v1.1)
// ============================================================================

export interface ExchangeRate {
  id: number;
  from_currency_id: number;
  to_currency_id: number;
  from_currency_code: string;
  to_currency_code: string;
  rate: number;
  rate_date: string;
  source?: string;
  is_current: boolean;
  notes?: string;
  created_at: string;
}

// ============================================================================
// PAYMENTS BOOTSTRAP TYPES (v1.1)
// ============================================================================

export interface PaymentsBootstrap {
  currencies: Partial<Currency>[];
  payment_methods: Partial<PaymentMethod>[];
  exchange_rates: any[];
}

// ============================================================================
// PURCHASE PAYMENT TYPES (v2.7+)
// ============================================================================

/**
 * Metadata stored in each purchase order detail
 */
export interface PurchaseOrderDetailMetadata {
  unit: string;
  profit_pct: number;
  sale_price: number;
  line_total: number;
  tax_rate: number;
}

/**
 * Single item in a purchase order request
 */
export interface PurchaseOrderDetailRequest {
  product_id: string;
  quantity: number;
  unit_price: number;
  unit?: string;
  profit_pct?: number;
  explicit_sale_price?: number;
  tax_rate_id?: number | null;
  price_includes_tax?: boolean;
}

/**
 * Main request for creating a purchase order
 */
export interface PurchaseOrderRequest {
  supplier_id: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | string;
  order_details: PurchaseOrderDetailRequest[];
  payment_method_id?: number;
  currency_id?: number;
  auto_update_prices?: boolean;
  default_profit_margin?: number;
  metadata?: {
    purchase_notes?: string;
    supplier_contact?: string;
    [key: string]: any;
  };
}

/**
 * Response when a purchase order is created
 */
export interface PurchaseOrderCreationResponse {
  success: boolean;
  purchase_order_id: number;
  total_amount: number;
  items_processed: number;
  cost_entries_created: number;
  prices_updated: number;
  message: string;
  warnings?: any[];
}

/**
 * Basic purchase information
 */
export interface PurchaseRiched {
  id: number;
  order_date: string;
  total_amount: number;
  status: string;
  supplier_id: number;
  supplier_name: string;
  supplier_status: boolean;
  user_id: string;
  user_name: string;
  payment_method_id: number | null;
  payment_method?: string;
  currency_id: number | null;
  currency?: string;
  metadata: Record<string, any>;
}

/**
 * Detailed information for a single item in a purchase order
 */
export interface PurchaseItemFullRiched {
  id: number;
  purchase_id: number;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  sale_price: number;
  profit_pct: number;
  unit: string;
  tax_rate_id: number;
  tax_rate: number;
  exp_date?: string;
  user_id: string;
  user_name: string;
  line_total: number;
  metadata: PurchaseOrderDetailMetadata;
}

/**
 * Summary of payments for a purchase order
 */
export interface PurchasePaymentSummary {
  total_paid: number;
  outstanding_amount: number;
  payment_count: number;
  last_payment_date: string;
  payment_status: string;
  is_fully_paid: boolean;
}

/**
 * Financial cost information for a purchase order
 */
export interface PurchaseCostInfo {
  total_cost: number;
  total_sale_value: number;
  average_profit_pct: number;
  total_tax_amount: number;
  currency_id?: number;
  currency_code?: string;
  payment_method_id?: number;
  payment_method_name?: string;
}

/**
 * Full enriched purchase data returned by most GET endpoints
 */
export interface PurchaseWithFullDetails {
  purchase: PurchaseRiched;
  details: PurchaseItemFullRiched[];
  payments: PurchasePaymentSummary;
  cost_info: PurchaseCostInfo;
  metadata: Record<string, any>;
}

export interface ProcessPurchasePaymentRequest {
  purchase_order_id: number;
  amount_paid: number;
  payment_method_id: number;
  payment_reference?: string;
  payment_notes?: string;
  cash_register_id?: number;
  // Multi-currency options
  currency_id?: number;
  exchange_rate?: number;
  original_amount?: number;
}

export interface PurchasePaymentResponse {
  success: boolean;
  payment_id: number;
  purchase_order_id: number;
  payment_details: {
    amount_paid: number;
    outstanding_amount: number;
    total_paid_so_far: number;
    total_order_amount: number;
    payment_status: "partial" | "complete" | "overpaid";
    order_fully_paid: boolean;
  };
  message: string;
  processed_at: string;
  processed_by: string;
}

export interface PurchaseOrderCancellationPreviewResponse {
  success: boolean;
  generated_at: string;
  purchase_info: {
    purchase_order_id: number;
    supplier_name: string;
    current_status: string;
    total_amount: number;
  };
  stock_impact: Array<{
    product_id: string;
    product_name: string;
    quantity_to_revert: number;
    current_stock: number;
    stock_after_cancellation: number;
    sufficient_stock: boolean;
  }>;
  payment_impact: any[];
  impact_analysis: {
    products_with_insufficient_stock: number;
    requires_payment_reversal: boolean;
    requires_force_cancel: boolean;
  };
  can_be_cancelled: boolean;
  cancellation_issues: any[];
  warnings: any[];
  recommendations: string[];
}

export interface PurchaseOrderCancellationRequest {
  purchase_order_id: number;
  user_id: string;
  cancellation_reason?: string;
  force_cancel?: boolean;
}

export interface PurchaseOrderCancellationResponse {
  success: boolean;
  message: string;
  cancelled_order_id: number;
  cancellation_details: {
    items_reverted: number;
    stock_items_updated: number;
    payments_cancelled: number;
    cancelled_at: string;
    cancelled_by: string;
    force_cancel_used: boolean;
    tax_warnings_preserved: number;
  };
}

export interface PurchasePaymentStatistics {
  period: {
    start_date: string;
    end_date: string;
    supplier_id?: number;
  };
  order_statistics: {
    total_orders: number;
    fully_paid_orders: number;
    partially_paid_orders: number;
    unpaid_orders: number;
    payment_completion_rate: number;
  };
  financial_summary: {
    total_order_amount: number;
    total_paid_amount: number;
    total_outstanding: number;
    payment_percentage: number;
  };
  generated_at: string;
}

// ============================================================================
// SALE OPERATIONS TYPES (v1.10+)
// ============================================================================

/**
 * Item in a sale order request
 */
export interface SaleOrderDetailRequest {
  product_id: string;
  quantity: number;
  tax_rate_id?: number | null;
  sale_price?: number;
  price_change_reason?: string;
  discount_amount?: number;
  discount_percent?: number;
  discount_reason?: string;
}

/**
 * Request to create a new sale
 */
export interface SaleRequest {
  sale_id?: string;
  client_id: string;
  reserve_id?: number;
  allow_price_modifications: boolean;
  product_details: SaleOrderDetailRequest[];
  payment_method_id?: number;
  currency_id?: number;
}

/**
 * Response when a sale is processed
 */
export interface ProcessSaleEnhancedResponse {
  success: boolean;
  sale_id: string;
  total_amount: number;
  items_processed: number;
  has_price_changes: boolean;
  has_discounts: boolean;
  reserve_processed: boolean;
  reserve_id?: number;
  message: string;
  validation_summary?: any;
  warnings?: any[];
}

/**
 * Enriched sale data for single sale view
 */
export interface SaleEnhancedResponse {
  sale: {
    sale_id: string;
    client_id: string;
    client_name: string;
    sale_date: string;
    total_amount: number;
    status: 'PENDING' | 'PAID' | 'CANCELLED' | string;
    user_id: string;
    user_name: string;
    payment_method_id: number | null;
    payment_method: string | null;
    currency_id: number | null;
    currency: string | null;
    metadata: Record<string, any>;
  };
  details: Array<{
    id: number;
    order_id: string;
    product_id: string;
    product_name: string;
    product_type: 'PHYSICAL' | 'SERVICE';
    quantity: number;
    unit?: string | null;
    base_price: number;
    unit_price: number;
    discount_amount: number;
    subtotal: number;
    tax_amount: number;
    total_with_tax: number;
    price_modified: boolean;
    reserve_id: number;
    tax_rate_id: number;
  }>;
}

/**
 * Paginated sales list response
 */
export interface PaginatedSalesResponse {
  data: SaleEnhancedResponse[];
  pagination: PaginationState;
}

/**
 * Metadata about price changes and discounts
 */
export interface SaleMetadata {
  price_changes: Array<{
    product_id: string;
    product_name: string;
    original_price: number;
    modified_price: number;
    price_difference: number;
    percentage_change: number;
    user_id: string;
    reason: string;
    timestamp: string;
  }>;
  discounts: Array<{
    product_id: string;
    product_name: string;
    original_amount: number;
    discount_amount: number;
    discount_percent: number;
    final_amount: number;
    reason: string;
    user_id: string;
    timestamp: string;
  }>;
  has_price_modifications: boolean;
  total_price_adjustments: number;
  system_version: string;
  created_at: string;
}

/**
 * Sale with its full metadata
 */
export interface SaleWithMetadataResponse {
  sale: SaleEnhancedResponse['sale'];
  metadata: SaleMetadata;
}

/**
 * Status of payments for a sale
 */
export interface SalePaymentStatusResponse {
  sale_id: string;
  total_amount: number;
  total_paid: number;
  balance_due: number;
  payment_progress: number;
  is_fully_paid: boolean;
  payment_status: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  payments: any[];
}

/**
 * Request to cancel a sale
 */
export interface CancelSaleRequest {
  cancellation_reason: string;
}

/**
 * Request to add products to an existing sale
 */
export interface AddProductsToSaleRequest {
  allow_price_modifications: boolean;
  product_details: SaleOrderDetailRequest[];
}

/**
 * Response when adding products to a sale
 */
export interface AddProductsToSaleResponse {
  success: boolean;
  sale_id: string;
  message: string;
  products_added: number;
  previous_total: number;
  added_amount: number;
  new_total: number;
  sale_status: string;
}

// ============================================================================
// SALE PAYMENT & COLLECTION TYPES (v2.0+)
// ============================================================================

export interface ProcessPaymentRequest {
  sales_order_id: string;
  amount_received: number;
  payment_method_id: number;
  payment_reference?: string;
  payment_notes?: string;
  cash_register_id?: number;
  // Multi-currency options
  currency_id?: number;
  exchange_rate?: number;
  original_amount?: number;
}

export interface ProcessPartialPaymentRequest extends ProcessPaymentRequest {
  amount_to_apply?: number;
}

export interface ProcessPaymentResponse {
  success: boolean;
  payment_id?: number;
  sale_id: string;
  payment_details: {
    amount_paid: number;
    change_due: number;
    total_paid_so_far: number;
    remaining_balance: number;
    payment_status: "partial" | "complete";
  };
  message: string;
  requires_change: boolean;
  processed_at: string;
  processed_by: string;
  error?: string;
  error_code?: string;
}

export interface PaymentDetails {
  total_due: number;
  amount_received: number;
  change_amount: number;
  currency_code: string;
  payment_method: string;
  payment_reference?: string;
}

export interface SalePaymentWithCashRegisterResponse extends ProcessPaymentResponse {
  cash_register_integration: {
    cash_register_id: number;
    income_movement_registered: boolean;
    change_movement_registered: boolean;
    net_cash_impact: number;
  };
}

export interface PurchasePaymentWithCashRegisterResponse extends PurchasePaymentResponse {
  cash_register_integration: {
    cash_register_id: number;
    expense_movement_registered: boolean;
    cash_impact: number;
    movement_id: number;
  };
}

export interface SaleCancellationPreview {
  success: boolean;
  sale_info: {
    sale_id: string;
    current_status: string;
    total_amount: number;
    can_be_reverted: boolean;
  };
  impact_analysis: {
    total_items: number;
    physical_products: number;
    service_products: number;
    active_reserves: number;
    payments_to_cancel: number;
    total_to_refund: number;
    requires_stock_adjustment: boolean;
    requires_reserve_cancellation: boolean;
    requires_payment_refund: boolean;
  };
  recommendations: {
    action: "no_action_needed" | "refund_required" | "reserve_cancellation_required" | "simple_cancellation";
    backup_recommended: boolean;
    notify_customer: boolean;
    estimated_complexity: "low" | "medium" | "high";
  };
}

export interface ChangeStatistics {
  period: {
    start_date: string;
    end_date: string;
  };
  statistics: {
    total_payments: number;
    payments_with_change: number;
    payments_exact_amount: number;
    change_percentage: number;
    total_change_given: number;
    average_change_amount: number;
    maximum_change_amount: number;
  };
  generated_at: string;
}

// ============================================================================
// MANUAL ADJUSTMENT TYPES
// ============================================================================

export interface ManualAdjustment {
  id: number;                    // ID único del ajuste (int)
  product_id: string;            // ID del producto ajustado (varchar(27))
  old_quantity: number;          // Cantidad anterior (numeric(10,2))
  new_quantity: number;          // Cantidad nueva (numeric(10,2))
  adjustment_date: string;       // Fecha del ajuste (ISO 8601)
  reason: string;                // Motivo del ajuste
  metadata?: object | null;      // Metadatos adicionales (JSON)
  user_id: string;               // ID del usuario que realizó el ajuste
}

export interface ManualAdjustmentRequest {
  product_id: string;            // ID del producto (requerido)
  new_quantity: number;          // Nueva cantidad (requerido)
  reason: string;                // Motivo del ajuste (requerido)
  metadata?: object;             // Metadatos opcionales
}

export interface ProductAdjustmentHistory {
  adjustment_id: number;         // ID del ajuste
  adjustment_type: string;       // Tipo de ajuste
  old_value: number;             // Valor anterior
  new_value: number;             // Valor nuevo
  value_change: number;          // Cambio en valor
  user_id: string;               // ID del usuario
  adjustment_date: string;       // Fecha del ajuste
  reason: string;                // Motivo
  metadata: object;              // Metadatos
  related_transaction_id: number; // ID de transacción relacionada
}

// ============================================================================
// STOCK TRANSACTION TYPES
// ============================================================================

export interface StockTransaction {
  id: number;                    // ID único de la transacción (int)
  product_id: string;            // ID del producto (varchar(27))
  transaction_type: string;      // Tipo: "PURCHASE", "SALE", "ADJUSTMENT", "INVENTORY", etc.
  quantity_change: number;       // Cambio en cantidad (+/-)
  quantity_before: number;       // Cantidad antes del movimiento
  quantity_after: number;        // Cantidad después del movimiento
  unit_price?: number;           // Precio unitario (opcional)
  total_value?: number;          // Valor total (opcional)
  reference_type?: string;       // Tipo de referencia ("ADJUSTMENT", "SALE", etc.)
  reference_id?: string;         // ID de referencia
  user_id: string;               // ID del usuario
  transaction_date: string;      // Fecha de la transacción (ISO 8601)
  reason?: string;               // Motivo del movimiento
  metadata?: object;             // Metadatos adicionales (JSON)
}

export interface StockTransactionHistory extends StockTransaction {
  product_name: string;          // Nombre del producto (JOIN)
  user_name: string;             // Nombre del usuario (JOIN)
}

export interface StockTransactionRequest {
  product_id: string;            // ID del producto (requerido)
  transaction_type: string;      // Tipo de transacción (requerido)
  quantity_change: number;       // Cambio en cantidad (requerido)
  unit_price?: number;           // Precio unitario (opcional)
  reference_type?: string;       // Tipo de referencia (opcional)
  reference_id?: string;         // ID de referencia (opcional)
  reason?: string;               // Motivo (opcional)
  metadata?: object;             // Metadatos (opcional)
}

// ============================================================================
// STOCK CONSISTENCY TYPES
// ============================================================================

export interface StockConsistencyReport {
  product_id: string;            // ID del producto
  product_name: string;          // Nombre del producto
  current_stock: number;         // Stock actual registrado
  calculated_stock: number;      // Stock calculado por transacciones
  difference: number;            // Diferencia entre actual y calculado
  is_consistent: boolean;        // Si hay consistencia
  total_purchases: number;       // Total de compras
  total_sales: number;           // Total de ventas
  total_adjustments: number;     // Total de ajustes
  total_inventories: number;     // Total de inventarios
  recommendation: string;        // Recomendación de acción
}

export interface InventoryDiscrepancyReport {
  product_id: string;            // ID del producto
  product_name: string;          // Nombre del producto
  category_name: string;         // Nombre de la categoría
  discrepancies_count: number;   // Número de discrepancias
  total_variance: number;        // Varianza total
  avg_variance: number;          // Varianza promedio
  max_variance: number;          // Varianza máxima
  last_inventory_date: string;   // Fecha del último inventario
  needs_attention: boolean;      // Si necesita atención
}

export interface SystemIntegrityReport {
  integration_status: string;
  verification_results: {
    adjustments_without_transactions: number;
    orphaned_adjustment_transactions: number;
    inconsistent_quantities: number;
  };
  recommendations: string[];
  verified_at: string;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// ============================================================================
// API CLIENT CONFIGURATION
// ============================================================================

export interface ApiConfig {
  baseUrl?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchParams {
  searchTerm: string;
  page?: number;
  pageSize?: number;
  category?: number;
  status?: string;
}

export interface SearchResult<T> {
  results: T[];
  total: number;
  searchTerm: string;
  searchType: 'id' | 'name';
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface FilterState {
  search: string;
  category: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: ApiMethod;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const API_ENDPOINTS = {
  SIGNUP: '/signup',
  LOGIN: '/login',
  CATEGORIES: '/category/',
  PRODUCTS: '/products',
  PRODUCTS_BY_ID: (id: string) => `/products/${id}`,
  PRODUCTS_BY_NAME: (name: string) => `/products/search/${name}`,
  PRODUCTS_PAGINATED: (page: number, pageSize: number) => `/products/list/${page}/${pageSize}`,
  PRODUCTS_UPDATE: (id: string) => `/products/${id}`,
  PRODUCTS_DELETE: (id: string) => `/products/${id}`,
  PRODUCTS_ALL: '/products/all',
  PRODUCTS_BY_BARCODE: (barcode: string) => `/products/barcode/${barcode}`,
  PRODUCTS_SERVICE_COURTS: '/products/service-courts',
  PRODUCTS_BY_CATEGORY: '/products/by-category',
  PRODUCTS_INFO: (id: string) => `/products/${id}/info`,
  PRODUCTS_INFO_BARCODE: (barcode: string) => `/products/info/barcode/${barcode}`,
  PRODUCTS_INFO_SEARCH: (name: string) => `/products/info/search/${name}`,
  PRODUCTS_PRICING_INFO: (id: string) => `/products/${id}/pricing-info`,
  PRODUCTS_UNITS: (id: string) => `/products/${id}/units`,
  PRODUCT_PRICE_CREATE: (productId: string) => `/product_price/product_id/${productId}`,
  PRODUCT_PRICE_BY_PRODUCT_ID: (productId: string) => `/product_price/product_id/${productId}`,
  STOCK_CREATE: (productId: string) => `/stock/${productId}`,
  STOCK_BY_PRODUCT_ID: (productId: string) => `/stock/product_id/${productId}`,
  CLIENT_CREATE: '/client/',
  CLIENT_BY_ID: (id: string) => `/client/${id}`,
  CLIENT_BY_NAME: (name: string) => `/client/name/${name}`,
  CLIENT_PAGINATED: (page: number, pageSize: number) => `/client/${page}/${pageSize}`,
  CLIENT_DELETE: (id: string) => `/client/delete/${id}`,
  // Products operative (v3.2)
  PRODUCTS_SALE: (id: string) => `/products/${id}/sale`,
  PRODUCTS_PURCHASE: (id: string) => `/products/${id}/purchase`,

  // Sale and Purchase Operations (v2.7+)
  SALE_CREATE: '/sale/',
  SALE_BY_ID: (id: string) => `/sale/${id}`,
  SALE_BY_CLIENT_ID: (clientId: string) => `/sale/client_id/${clientId}`,
  SALE_BY_CLIENT_NAME: (name: string) => `/sale/client_name/${name}`,
  SALE_CLIENT_PENDING: (clientId: string) => `/sale/client_id/${clientId}/pending`,
  SALE_DATE_RANGE: '/sale/date_range',
  SALE_WITH_METADATA: (id: string) => `/sale/${id}/with-metadata`,
  SALE_PAYMENT_STATUS: (id: string) => `/sale/${id}/payment-status`,
  SALE_CONFIRM_PAYMENT: (id: string) => `/sale/${id}/confirm-payment`,
  SALE_PREVIEW_CANCELLATION: (id: string) => `/sale/${id}/preview-cancellation`,
  SALE_ADD_PRODUCTS: (id: string) => `/sale/${id}/products`,

  // Sale Payments & Collections (v2.0)
  SALE_PAYMENT_PROCESS: '/payment/process',
  SALE_PAYMENT_PROCESS_PARTIAL: '/payment/process-partial',
  SALE_PAYMENT_DETAILS: (saleId: string) => `/payment/details/${saleId}`,
  SALE_PAYMENT_TOTALS: '/payment/totals/sales',
  SALE_CASH_REGISTER_PAYMENT: '/cash-registers/payments/sale',
  PAYMENTS_BOOTSTRAP: '/payments/bootstrap',

  PURCHASE_CREATE_COMPLETE: '/purchase/complete',
  PURCHASE_BY_ID: (id: number) => `/purchase/${id}`,
  PURCHASE_BY_SUPPLIER_ID: (supplierId: number) => `/purchase/supplier_id/${supplierId}`,
  PURCHASE_BY_SUPPLIER_NAME: (name: string) => `/purchase/supplier_name/${name}`,
  PURCHASE_BY_ID_AND_SUPPLIER: (id: number, supplierName: string) => `/purchase/${id}/supplier/${supplierName}`,
  PURCHASE_DATE_RANGE: '/purchase/date_range/',
  PURCHASE_PREVIEW_CANCELLATION: (id: number) => `/purchase/${id}/preview-cancellation`,
  PURCHASE_CANCEL: '/purchase/cancel',
  
  // Purchase Payments (v2.0)
  PURCHASE_PAYMENT_PROCESS: '/purchase/payment/process',
  PURCHASE_PAYMENT_STATISTICS: '/purchase/payment/statistics',
  PURCHASE_PAYMENT_TOTALS: '/payment/totals/purchases',
  PURCHASE_CASH_REGISTER_PAYMENT: '/cash-registers/payments/purchase',

  // Suppliers Support
  SUPPLIERS: '/suppliers',
  SUPPLIER_BY_ID: (id: number) => `/supplier/${id}`,
  SUPPLIER_BY_NAME: (name: string) => `/supplier/name/${name}`,
  
  // Payment Methods (v1.1)
  PAYMENT_METHODS: '/payment-methods',
  PAYMENT_METHOD_BY_ID: (id: number) => `/payment-methods/${id}`,
  PAYMENT_METHOD_BY_CODE: (code: string) => `/payment-methods/code/${code}`,
  
  // Currencies (v1.1)
  CURRENCIES: '/currencies',
  CURRENCY_BY_ID: (id: number) => `/currencies/${id}`,
  CURRENCY_BY_CODE: (code: string) => `/currencies/code/${code}`,
  CURRENCY_CONVERT: '/currencies/convert',
  
  // Exchange Rates (v1.1)
  EXCHANGE_RATES: '/exchange-rates',
  EXCHANGE_RATES_LATEST: '/exchange-rates/latest',
  
  // Cash Registers (v1.1)
  CASH_REGISTERS: '/cash-registers',
  CASH_REGISTERS_OPEN: '/cash-registers/open',
  CASH_REGISTERS_ACTIVE: '/cash-registers/active',
  CASH_REGISTERS_BY_ID: (id: number) => `/cash-registers/${id}`,
  CASH_REGISTERS_CLOSE: (id: number) => `/cash-registers/${id}/close`,
  CASH_REGISTERS_MOVEMENTS: (id: number) => `/cash-registers/${id}/movements`,
  CASH_REGISTERS_MOVEMENTS_FILTER: (id: number) => `/cash-registers/${id}/movements/filter`,
  CASH_REGISTERS_REPORT: (id: number) => `/cash-registers/${id}/report`,
  CASH_REGISTERS_AUDITS: (id: number) => `/cash-registers/${id}/audits`,
  
  // Cash Movements (v1.1)
  CASH_MOVEMENTS: '/cash-movements',
  CASH_MOVEMENT_VOID: (id: number) => `/cash-movements/${id}/void`,
  
  // Cash Audits (v1.1)
  CASH_AUDITS: '/cash-audits',
  CASH_AUDITS_DENOMINATIONS: '/cash-audits/denominations',
  CASH_AUDITS_RESOLVE: (id: number) => `/cash-audits/${id}/resolve`,
  
  // Payments Bootstrap (v1.1)
  // Inventory Management
  INVENTORY_CREATE: '/inventory/',
  INVENTORY_BY_ID: (id: string) => `/inventory/${id}`,
  INVENTORY_PAGINATED: (page: number, pageSize: number) => `/inventory/${page}/${pageSize}`,
  INVENTORY_INVALIDATE: '/inventory/invalidate',
  INVENTORY_DISCREPANCIES: '/inventory/discrepancies',
  // Manual Adjustments
  MANUAL_ADJUSTMENT_CREATE: '/manual-adjustment',
  MANUAL_ADJUSTMENT_HISTORY: (productId: string) => `/manual-adjustment/history/${productId}`,
  // Stock Transactions
  STOCK_TRANSACTION_CREATE: '/stock-transaction',
  STOCK_TRANSACTION_HISTORY: (productId: string) => `/stock-transaction/history/${productId}`,
  STOCK_TRANSACTION_BY_ID: (id: number) => `/stock-transaction/${id}`,
  STOCK_TRANSACTION_BY_DATE: '/stock-transaction/by-date',
  STOCK_TRANSACTION_VALIDATE_CONSISTENCY: '/stock-transaction/validate-consistency',
  // System Integrity
  SYSTEM_INTEGRITY_CHECK: '/system/integrity-check',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: 'http://localhost:5050',
  timeout: 10000,
  defaultHeaders: {
    'Content-Type': 'application/json'
  }
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isErrorResponse = (response: any): response is ErrorResponse => {
  return response && typeof response.error === 'string';
};

export const isSuccessResponse = (response: any): response is SuccessResponse => {
  return response && typeof response.success === 'boolean';
};

export const isPaginatedResponse = <T>(response: any): response is PaginatedResponse<T> => {
  return response && Array.isArray(response.data) && typeof response.total === 'number';
};
