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
}

export interface PurchaseSupplier {
  id: string;
  first_name?: string;
  name?: string;
  Name?: string;
  created_at?: string;
  tax_id?: string;
}

export interface PaymentMethod {
  id: number;
  method_code: string;
  name: string;
  description?: string;
}

export interface Currency {
  id: number;
  currency_code: string;
  currency_name?: string;
  name?: string;
  description?: string;
  is_base_currency: boolean;
}

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
