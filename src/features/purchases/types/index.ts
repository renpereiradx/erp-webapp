export interface VariantAttribute {
  [key: string]: string | number | boolean;
}

export interface PurchaseItem {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  unit: string;
  profit_pct: number;
  explicit_sale_price?: number;
  sale_price: number;
  pricing_mode: 'margin' | 'sale_price' | string;
  tax_rate_id: number | null;
  tax_rate: number;
  price_includes_tax: boolean;
  // Variant fields
  variant_id?: string;
  variant_name?: string;
  variant_sku?: string;
  variant_attributes?: VariantAttribute;
  // Product enrichment
  brand_id?: number | null;
  brand_name?: string | null;
  tags?: Array<{ id: number; name: string; slug: string; color?: string | null }>;
}

export interface PurchaseSupplier {
  id: string;
  first_name?: string;
  name?: string;
  Name?: string;
  created_at?: string;
  tax_id?: string;
}

// Tipos canónicos del contrato (F7.1): viven en @/types — el feature re-exporta
// en vez de definir su propia verdad. `name` de PaymentMethod se eliminó porque
// el backend no lo emite (solo description + method_code).
export type { Currency, PaymentMethod } from '@/types'

export interface PurchaseWithFullDetails {
  id: number;
  purchase_id?: number;
  total_amount?: number;
  branch_id?: number;
  supplier_name?: string;
  payment_method?: string;
  order_date?: string;
  status?: string;
  purchase?: any;
  payments?: any;
}
