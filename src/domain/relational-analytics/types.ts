/**
 * Columnas y tipos de fila de los drill-downs relacionales
 * (PLAN_STATS_RELACIONALES_BI §4 — contrato congelado).
 * Descriptores puros: la tabla genérica del feature los renderiza.
 */

export interface ProductBuyerRow {
  client_id: string;
  client_name: string;
  client_doc: string;
  purchases: number;
  units: number;
  total: number;
  avg_unit_price: number;
  last_purchase_at: string;
}

export interface ProductSalesRow {
  product_id: string;
  product_name: string;
  product_sku: string;
  purchases: number;
  units: number;
  total: number;
  avg_unit_price: number;
  last_purchase_at: string;
}

export interface ProductSupplierRow {
  supplier_id: string;
  supplier_name: string;
  supplier_doc: string;
  last_unit_price: number;
  avg_unit_price: number;
  min_unit_price: number;
  currency: string;
  units: number;
  purchases: number;
  last_purchase_at: string;
}

/** Respuesta congelada del contrato: {rows, total, page, page_size}. */
export interface RelationalResponse<Row> {
  rows?: Row[];
  total?: number;
  page?: number;
  page_size?: number;
  /** Solo #4 (D3): compras en otra moneda excluidas del ranking. */
  excluded_other_currency?: number;
}

export interface RelationalQueryParams {
  date_from?: string;
  date_to?: string;
  q?: string;
  sort?: string;
  page?: number;
  page_size?: number;
  variant_id?: string;
  payment_method_id?: number;
  category_id?: number;
  min_units?: number;
  min_purchases?: number;
  branch_id?: number;
}

export type CellFormat = 'text' | 'money' | 'units' | 'number' | 'date';

export interface DrilldownColumn<Row = Record<string, unknown>> {
  /** campo de la fila (contrato §4) */
  key: keyof Row & string;
  labelKey: string;
  labelFallback: string;
  format: CellFormat;
  align: 'left' | 'right';
  /** si el campo participa del sort whitelist del endpoint */
  sortable?: boolean;
}
