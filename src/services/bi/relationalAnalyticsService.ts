/**
 * Servicio de los drill-downs relacionales (PLAN_STATS_RELACIONALES_BI,
 * RF-BIPACK-021..024). Contrato común: {rows, total, page, page_size} con
 * filtros date_from/date_to (ISO), q, sort (+campo/-campo), page/page_size.
 * `apiClient` inyecta branch_id activo por defecto (contrato de sucursal).
 *
 * El envelope {success, data, metadata} NO se desenvuelve acá: el hook lee
 * `data` y los tests de contrato fijan la ruta y los params exactos.
 */
import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import type { BIEnvelope } from '@/types/bi';
import type {
  ProductBuyerRow,
  ProductSalesRow,
  ProductSupplierRow,
  RelationalQueryParams,
  RelationalResponse,
} from '@/domain/relational-analytics/types';

/** Strip de undefined/null/'' — URLSearchParams no debe ver vacíos. */
const clean = (params: RelationalQueryParams): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = String(value);
  }
  return out;
};

const recordError = (operation: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  telemetry.record('bi.relational.error', { operation, error: message });
};

const getReport = async <Row>(
  path: string,
  params: RelationalQueryParams,
): Promise<BIEnvelope<RelationalResponse<Row>>> =>
  (await apiClient.get(path, { params: clean(params) })) as BIEnvelope<RelationalResponse<Row>>;

export const relationalAnalyticsService = {
  /** #1 RF-BIPACK-021: qué clientes compraron un producto. */
  async getProductBuyers(
    productId: string,
    params: RelationalQueryParams = {},
  ): Promise<BIEnvelope<RelationalResponse<ProductBuyerRow>>> {
    try {
      return await getReport<ProductBuyerRow>(
        `/sales-analytics/products/${encodeURIComponent(productId)}/buyers`,
        params,
      );
    } catch (error) {
      recordError('getProductBuyers', error);
      throw error;
    }
  },

  /** #2 RF-BIPACK-022: qué productos compra más un cliente. */
  async getCustomerTopProducts(
    customerId: string,
    params: RelationalQueryParams = {},
  ): Promise<BIEnvelope<RelationalResponse<ProductSalesRow>>> {
    try {
      return await getReport<ProductSalesRow>(
        `/sales-analytics/customers/${encodeURIComponent(customerId)}/top-products`,
        params,
      );
    } catch (error) {
      recordError('getCustomerTopProducts', error);
      throw error;
    }
  },

  /** #3 RF-BIPACK-023: qué productos se compran más a un proveedor. */
  async getSupplierTopProducts(
    supplierId: string,
    params: RelationalQueryParams = {},
  ): Promise<BIEnvelope<RelationalResponse<ProductSalesRow>>> {
    try {
      return await getReport<ProductSalesRow>(
        `/purchase-analytics/suppliers/${encodeURIComponent(supplierId)}/top-products`,
        params,
      );
    } catch (error) {
      recordError('getSupplierTopProducts', error);
      throw error;
    }
  },

  /** #4 RF-BIPACK-024: qué proveedores ofrecen un producto y a qué precio. */
  async getProductSuppliers(
    productId: string,
    params: RelationalQueryParams = {},
  ): Promise<BIEnvelope<RelationalResponse<ProductSupplierRow>>> {
    try {
      return await getReport<ProductSupplierRow>(
        `/purchase-analytics/products/${encodeURIComponent(productId)}/suppliers`,
        params,
      );
    } catch (error) {
      recordError('getProductSuppliers', error);
      throw error;
    }
  },
};

export default relationalAnalyticsService;
