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
  INVENTORY_CREATE: '/inventory/',
  INVENTORY_BY_ID: (id: string) => `/inventory/${id}`,
  INVENTORY_PAGINATED: (page: number, pageSize: number) => `/inventory/${page}/${pageSize}`,
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
