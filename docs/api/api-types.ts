// 🚀 Business Management API - TypeScript Types & Interfaces
// Archivo: api-types.ts

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
  description: string;
}

export interface Product {
  id: string;
  name: string;
  state: boolean;
  category: Category;
}

export interface CreateProductRequest {
  name: string;
  id_category: number;
}

export interface UpdateProductRequest {
  name: string;
  state: boolean;
  id_category: number;
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
  metadata: Record<string, any>;
}

export interface CreateProductPriceRequest {
  cost_price: number;
  sale_price?: number;
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
  exp: string; // Date string YYYY-MM-DD
  entity: StockEntity;
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export interface Inventory {
  id: string;
  date: string; // ISO 8601 date string
  status: string;
  user_id: string;
}

export interface InventoryItem {
  product_id: string;
  quantity_checked: number;
}

export type CreateInventoryRequest = InventoryItem[];

// ============================================================================
// CLIENT TYPES
// ============================================================================

export interface Client {
  id: string;
  name: string;
  last_name: string;
  document_id: string;
  status: boolean;
  user_id: string;
  created_at: string; // ISO 8601 date string
  contact: string;
}

export interface CreateClientRequest {
  name: string;
  last_name: string;
  document_id: string;
  contact: string;
  status?: boolean;
}

// ============================================================================
// SUPPLIER TYPES
// ============================================================================

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
  status: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  contact: string;
  address: string;
  status?: boolean;
}

// ============================================================================
// SALE TYPES
// ============================================================================

export interface Sale {
  id: string;
  client_id: string;
  total_amount: number;
  sale_date: string; // ISO 8601 date string
  status: string;
}

export interface CreateSaleRequest {
  client_id: string;
  total_amount: number;
  sale_date?: string; // ISO 8601 date string, defaults to now
  status?: string; // defaults to "completed"
}

// ============================================================================
// PURCHASE TYPES
// ============================================================================

export interface Purchase {
  id: string;
  supplier_id: string;
  total_amount: number;
  purchase_date: string; // ISO 8601 date string
  status: string;
}

export interface CreatePurchaseRequest {
  supplier_id: string;
  total_amount: number;
  purchase_date?: string; // ISO 8601 date string, defaults to now
  status?: string; // defaults to "completed"
}

// ============================================================================
// TAX RATE TYPES
// ============================================================================

export interface TaxRate {
  id: number;
  name: string;
  rate: number;
  description: string;
}

export interface CreateTaxRateRequest {
  name: string;
  rate: number;
  description: string;
}

// ============================================================================
// SCHEDULE TYPES
// ============================================================================

export interface Schedule {
  id: string;
  product_id: string;
  scheduled_date: string; // ISO 8601 date string
  status: string;
}

export interface GenerateScheduleForDateRequest {
  date: string; // Date string YYYY-MM-DD
}

export interface GenerateScheduleForNextDaysRequest {
  days: number; // Number of days from today
}

// ============================================================================
// MANUAL ADJUSTMENT TYPES
// ============================================================================

export interface ManualAdjustment {
  id: string;
  product_id: string;
  adjustment_type: string;
  quantity: number;
  reason: string;
  created_at: string; // ISO 8601 date string
}

export interface CreateManualAdjustmentRequest {
  product_id: string;
  adjustment_type: string;
  quantity: number;
  reason: string;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  page_size: number;
  total: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ErrorResponse {
  error: string;
  code: number;
}

export interface SuccessResponse {
  message: string;
  data?: any;
}

// ============================================================================
// API CLIENT CONFIGURATION
// ============================================================================

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: ApiMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const API_ENDPOINTS = {
  // Auth
  SIGNUP: '/signup',
  LOGIN: '/login',
  
  // Categories
  CATEGORIES: '/categories',
  
  // Products
  PRODUCTS: '/products',
  PRODUCTS_BY_ID: (id: string) => `/products/${id}`,
  PRODUCTS_BY_NAME: (name: string) => `/products/name/${name}`,
  PRODUCTS_PAGINATED: (page: number, pageSize: number) => `/products/${page}/${pageSize}`,
  PRODUCTS_UPDATE: (id: string) => `/products/${id}`,
  PRODUCTS_DELETE: (id: string) => `/products/delete/${id}`,
  
  // Product Descriptions
  PRODUCT_DESCRIPTION_CREATE: (productId: string) => `/product_description/${productId}`,
  PRODUCT_DESCRIPTION_BY_ID: (id: number) => `/product_description/${id}`,
  
  // Product Prices
  PRODUCT_PRICE_CREATE: (productId: string) => `/product_price/product_id/${productId}`,
  PRODUCT_PRICE_BY_ID: (id: number) => `/product_price/${id}`,
  PRODUCT_PRICE_BY_PRODUCT_ID: (productId: string) => `/product_price/product_id/${productId}`,
  PRODUCT_PRICE_UPDATE_BY_ID: (id: number) => `/product_price/id/${id}`,
  
  // Stock
  STOCK_CREATE: (productId: string) => `/stock/${productId}`,
  STOCK_BY_ID: (id: number) => `/stock/${id}`,
  STOCK_BY_PRODUCT_ID: (productId: string) => `/stock/product_id/${productId}`,
  
  // Inventory
  INVENTORY_CREATE: '/inventory/',
  INVENTORY_BY_ID: (id: string) => `/inventory/${id}`,
  INVENTORY_PAGINATED: (page: number, pageSize: number) => `/inventory/${page}/${pageSize}`,
  
  // Manual Adjustments
  MANUAL_ADJUSTMENT_CREATE: '/manual_adjustment/',
  MANUAL_ADJUSTMENT_PAGINATED: (page: number, pageSize: number) => `/manual_adjustment/${page}/${pageSize}`,
  
  // Clients
  CLIENT_CREATE: '/client/',
  CLIENT_BY_ID: (id: string) => `/client/${id}`,
  CLIENT_BY_NAME: (name: string) => `/client/name/${name}`,
  CLIENT_PAGINATED: (page: number, pageSize: number) => `/client/${page}/${pageSize}`,
  CLIENT_DELETE: (id: string) => `/client/delete/${id}`,
  
  // Suppliers
  SUPPLIER_CREATE: '/supplier/',
  SUPPLIER_BY_ID: (id: string) => `/supplier/${id}`,
  SUPPLIER_BY_NAME: (name: string) => `/supplier/name/${name}`,
  SUPPLIER_PAGINATED: (page: number, pageSize: number) => `/supplier/${page}/${pageSize}`,
  SUPPLIER_DELETE: (id: string) => `/supplier/delete/${id}`,
  
  // Tax Rates
  TAX_RATE_CREATE: '/tax_rate/',
  TAX_RATE_BY_ID: (id: number) => `/tax_rate/${id}`,
  TAX_RATE_BY_NAME: (name: string) => `/tax_rate/name/${name}`,
  TAX_RATE_PAGINATED: (page: number, pageSize: number) => `/tax_rate/${page}/${pageSize}`,
  
  // Sales
  SALE_CREATE: '/sale/',
  SALE_BY_ID: (id: string) => `/sale/${id}`,
  SALE_CANCEL: (id: string) => `/sale/${id}`,
  SALE_BY_CLIENT_ID: (clientId: string) => `/sale/client_id/${clientId}`,
  SALE_BY_CLIENT_NAME: (name: string) => `/sale/client_name/${name}`,
  SALE_BY_DATE_RANGE: '/sale/date_range/',
  
  // Purchases
  PURCHASE_CREATE: '/purchase/',
  PURCHASE_BY_ID: (id: string) => `/purchase/${id}`,
  PURCHASE_CANCEL: (id: string) => `/purchase/cancel/${id}`,
  PURCHASE_BY_SUPPLIER_ID: (supplierId: string) => `/purchase/supplier_id/${supplierId}`,
  PURCHASE_BY_SUPPLIER_NAME: (name: string) => `/purchase/supplier_name/${name}`,
  PURCHASE_BY_DATE_RANGE: '/purchase/date_range/',
  
  // Schedules
  SCHEDULE_BY_ID: (id: string) => `/schedules/${id}`,
  SCHEDULE_AVAILABLE: (productId: string, date: string) => `/schedules/product/${productId}/date/${date}/available`,
  SCHEDULE_GENERATE_DAILY: '/schedules/generate/daily',
  SCHEDULE_GENERATE_DATE: '/schedules/generate/date',
  SCHEDULE_GENERATE_NEXT_DAYS: '/schedules/generate/next-days'
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
  return response && typeof response.error === 'string' && typeof response.code === 'number';
};

export const isSuccessResponse = (response: any): response is SuccessResponse => {
  return response && typeof response.message === 'string';
};

export const isPaginatedResponse = <T>(response: any): response is PaginatedResponse<T> => {
  return response && 
         Array.isArray(response.data) && 
         typeof response.page === 'number' && 
         typeof response.page_size === 'number' && 
         typeof response.total === 'number';
};
