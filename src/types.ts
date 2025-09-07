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
  status: string;
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

export interface CreateProductRequest {
  name: string;
  categoryId: number;
  id_category?: number; // Legacy support
}

export interface UpdateProductRequest {
  name?: string;
  state?: boolean;
  is_active?: boolean;
  categoryId?: number;
  id_category?: number; // Legacy support
  price?: number;
  stock_quantity?: number;
  description?: string;
}

// ============================================================================
// PRODUCT DESCRIPTION TYPES
// ============================================================================

export interface ProductDescription {
  id: number;
  product_id: string;
  description: string;
  effective_date: string; // ISO 8601 date string
  id_user: string;
}

export interface CreateProductDescriptionRequest {
  description: string;
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
// CASH REGISTER TYPES
// ============================================================================

export interface CashRegister {
  id: number;
  name: string;
  status: "OPEN" | "CLOSED";
  initial_balance: number;
  current_balance: number;
  opened_at: string;
  opened_by: number;
  closed_at?: string;
  closed_by?: number;
  final_balance?: number;
  calculated_balance?: number;
  variance?: number;
  location?: string;
  description?: string;
}

export interface OpenCashRegisterRequest {
  name: string;
  initial_balance: number;
  location?: string;
  description?: string;
}

export interface CloseCashRegisterRequest {
  final_balance?: number;
  notes?: string;
}

export interface CashRegisterMovement {
  id: number;
  cash_register_id: number;
  movement_type: "INCOME" | "EXPENSE" | "ADJUSTMENT";
  amount: number;
  concept: string;
  notes?: string;
  created_at: string;
  created_by: number;
}

export interface RegisterMovementRequest {
  movement_type: "INCOME" | "EXPENSE" | "ADJUSTMENT";
  amount: number;
  concept: string;
  notes?: string;
}

export interface CashRegisterSummary {
  cash_register: CashRegister;
  financial_summary: {
    initial_balance: number;
    total_income: number;
    total_expenses: number;
    current_balance: number;
    calculated_balance: number;
  };
  movement_counts: {
    total_movements: number;
    income_movements: number;
    expense_movements: number;
    adjustment_movements: number;
  };
  period_summary: {
    start_time: string;
    end_time?: string;
    duration_hours?: number;
  };
}

// ============================================================================
// PURCHASE PAYMENT TYPES
// ============================================================================

export interface PurchaseEnhancedProductDetail {
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_rate_id?: number;
  profit_pct?: number;
}

export interface CreatePurchaseOrderRequest {
  supplier_id: number;
  status?: string;
  product_details: PurchaseEnhancedProductDetail[];
  payment_method_id?: number;
  currency_id?: number;
  metadata?: Record<string, any>;
}

export interface PurchaseOrderResponse {
  success: boolean;
  purchase_order_id: number;
  total_amount: number;
  items_processed: number;
  message: string;
  error?: string;
}

export interface ProcessPurchasePaymentRequest {
  purchase_order_id: number;
  amount_paid: number;
  payment_reference?: string;
  payment_notes?: string;
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

export interface PurchaseCancellationPreview {
  success: boolean;
  purchase_info: {
    purchase_order_id: number;
    current_status: string;
    total_amount: number;
    order_date: string;
    created_by: string;
    can_be_cancelled: boolean;
  };
  impact_analysis: {
    total_items: number;
    payments_to_cancel: number;
    total_to_reverse: number;
    stock_adjustments_required: number;
    price_updates_required: number;
    requires_payment_reversal: boolean;
    requires_stock_adjustment: boolean;
    requires_price_reversion: boolean;
  };
  recommendations: {
    action: "proceed_with_caution" | "no_action_needed" | "cancel_recommended";
    backup_recommended: boolean;
    notify_supplier: boolean;
    estimated_complexity: "low" | "medium" | "high";
  };
  generated_at: string;
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
// SALE PAYMENT TYPES
// ============================================================================

export interface ProcessSaleRequest {
  sale_id?: string;
  client_id: string;
  product_details: SaleProductDetail[];
  payment_method_id?: number;
  currency_id?: number;
  allow_price_modifications: boolean;
  reserve_id?: number;
}

export interface SaleProductDetail {
  product_id: string;
  quantity: number;
  tax_rate_id?: number;
  sale_price?: number;
  price_change_reason?: string;
}

export interface ProcessSaleResponse {
  success: boolean;
  sale_id: string;
  total_amount: number;
  items_processed: number;
  price_modifications_enabled: boolean;
  has_price_changes: boolean;
  message: string;
  error?: string;
}

export interface ProcessPaymentRequest {
  sales_order_id: string;
  amount_received: number;
  payment_reference?: string;
  payment_notes?: string;
}

export interface ProcessPaymentResponse {
  success: boolean;
  payment_id?: number;
  sale_id: string;
  client_name: string;
  payment_details: PaymentDetails;
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
  CATEGORIES: '/categories',
  PRODUCTS: '/products',
  PRODUCTS_BY_ID: (id: string) => `/products/${id}`,
  PRODUCTS_BY_NAME: (name: string) => `/products/products/name/${name}`,
  PRODUCTS_PAGINATED: (page: number, pageSize: number) => `/products/products/${page}/${pageSize}`,
  PRODUCTS_UPDATE: (id: string) => `/products/products/${id}`,
  PRODUCTS_DELETE: (id: string) => `/products/products/delete/${id}`,
  PRODUCT_DESCRIPTION_CREATE: (productId: string) => `/product_description/${productId}`,
  PRODUCT_DESCRIPTION_BY_ID: (id: number) => `/product_description/${id}`,
  PRODUCT_PRICE_CREATE: (productId: string) => `/product_price/product_id/${productId}`,
  PRODUCT_PRICE_BY_PRODUCT_ID: (productId: string) => `/product_price/product_id/${productId}`,
  STOCK_CREATE: (productId: string) => `/stock/${productId}`,
  STOCK_BY_PRODUCT_ID: (productId: string) => `/stock/product_id/${productId}`,
  CLIENT_CREATE: '/client/',
  CLIENT_BY_ID: (id: string) => `/client/${id}`,
  CLIENT_BY_NAME: (name: string) => `/client/name/${name}`,
  CLIENT_PAGINATED: (page: number, pageSize: number) => `/client/${page}/${pageSize}`,
  CLIENT_DELETE: (id: string) => `/client/delete/${id}`,
  SALE_CREATE: '/sale/',
  SALE_BY_ID: (id: string) => `/sale/${id}`,
  SALE_BY_CLIENT_ID: (clientId: string) => `/sale/client_id/${clientId}`,
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
