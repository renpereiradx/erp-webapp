/**
 * Servicio de los drill-downs relacionales (PLAN_STATS_RELACIONALES_BI,
 * RF-BIPACK-021..024). Contrato común: {rows, total, page, page_size} con
 * filtros date_from/date_to (ISO), q, sort (+campo/-campo), page/page_size.
 * `apiClient` inyecta branch_id activo por defecto (contrato de sucursal).
 */
import { apiClient } from '../api';
import type { RelationalQueryParams } from '@/domain/relational-analytics/types';

/** Strip de undefined/null/'' — URLSearchParams no debe ver vacíos. */
const clean = (params: RelationalQueryParams): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = String(value);
  }
  return out;
};

export const relationalAnalyticsService = {
  /** #1 RF-BIPACK-021: qué clientes compraron un producto. */
  async getProductBuyers(productId: string, params: RelationalQueryParams = {}) {
    return await apiClient.get(
      `/sales-analytics/products/${encodeURIComponent(productId)}/buyers`,
      { params: clean(params) },
    );
  },

  /** #2 RF-BIPACK-022: qué productos compra más un cliente. */
  async getCustomerTopProducts(customerId: string, params: RelationalQueryParams = {}) {
    return await apiClient.get(
      `/sales-analytics/customers/${encodeURIComponent(customerId)}/top-products`,
      { params: clean(params) },
    );
  },

  /** #3 RF-BIPACK-023: qué productos se compran más a un proveedor. */
  async getSupplierTopProducts(supplierId: string, params: RelationalQueryParams = {}) {
    return await apiClient.get(
      `/purchase-analytics/suppliers/${encodeURIComponent(supplierId)}/top-products`,
      { params: clean(params) },
    );
  },

  /** #4 RF-BIPACK-024: qué proveedores ofrecen un producto y a qué precio. */
  async getProductSuppliers(productId: string, params: RelationalQueryParams = {}) {
    return await apiClient.get(
      `/purchase-analytics/products/${encodeURIComponent(productId)}/suppliers`,
      { params: clean(params) },
    );
  },
};

export default relationalAnalyticsService;
