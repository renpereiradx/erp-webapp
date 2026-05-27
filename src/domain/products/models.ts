export interface Category {
  id: number;
  name: string;
  default_tax_rate_id?: number | null;
  default_tax_rate?: any | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaxRate {
  id: number;
  tax_name: string;
  code: string;
  rate: number;
  country: string;
  jurisdiction_type: string;
  operation_type: string;
  description?: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaxClassification {
  id: number;
  product_id: string;
  classification_code: string;
  default_tax_rate_id: number;
  default_tax_rate?: TaxRate | null;
  effective_from: string;
  effective_to?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductEnriched {
  id: string;
  product_id?: string; // Legacy fallback
  name: string;
  product_name?: string; // Legacy fallback
  barcode?: string | null;
  state: boolean;
  category?: Category | null;
  category_name?: string | null; // Legacy fallback
  product_type: 'PHYSICAL' | 'SERVICE' | 'PRODUCTION';
  origin?: 'NACIONAL' | 'IMPORTADO' | null;
  brand?: string | null;
  base_unit?: string | null;
  override_tax_rate_id?: number | null;
  is_variable_measure?: boolean;
  scale_code?: string | null;
  target_margin_percent?: string | null;
  pricing_strategy?: 'MANUAL' | 'AUTOMATIC' | null;
  applicable_tax_rate?: TaxRate | null;
  tax_classification?: TaxClassification | null;
  created_at: string;
  updated_at: string;
  purchase_price: number;
  stock_quantity?: number | null;
  stock?: number | null; // Legacy fallback
  quantity?: number | null; // Legacy fallback
  stock_id?: number | null;
  stock_unit?: string | null;
  stock_branch_id?: number | null;
  stock_updated_at?: string | null;
  stock_status: 'in_stock' | 'low_stock' | 'medium_stock' | 'out_of_stock';
  has_valid_stock: boolean;
  has_valid_price: boolean;
  has_unit_pricing: boolean;
  unit_prices: any[];
  unit_costs_summary?: any[]; // For financial view
  description?: string | null;
  price?: number; // Legacy fallback
  image_url?: string | null;
  applied_tax_name?: string;
  tax_rate_name?: string;
  tax_rate_code?: string;
}
