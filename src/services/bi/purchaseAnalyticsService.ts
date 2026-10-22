/**
 * Servicio de Analítica de Compras (BI, PLAN_ANALITICA_COMPRAS).
 *
 * Contrato real del backend (`internal/analytics/http_purchase.go`): envelope
 * `{success, data, metadata}` en TODAS las respuestas; el servicio NO lo
 * desenvuelve — el hook lee `data` y `metadata`.
 *
 * Gate del BE: `biChain("analytics:read", "purchase-analytics")` — mismo
 * permiso que los drill-downs relacionales del grupo.
 *
 * Agregados sobre compras COMPLETED en moneda base; `pending_*` y
 * `excluded_other_currency` viajan aparte. Sin fallback demo/mock: si el
 * endpoint falla, el error llega a la UI.
 */
import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import { cleanQueryParams } from './salesAnalyticsService';
import type {
  BIEnvelope,
  PurchaseComparison,
  PurchaseComparisonParams,
  PurchasePageParams,
  PurchasePeriodParams,
  PurchaseProductParams,
  PurchaseSupplierParams,
  PurchaseTrends,
  PurchaseTrendsParams,
  PurchasesByBuyer,
  PurchasesByCategory,
  PurchasesByDayOfWeek,
  PurchasesByHour,
  PurchasesByPaymentMethod,
  PurchasesByProduct,
  PurchasesBySupplier,
  PurchasePerformance,
} from '../../types/bi';

const recordError = (operation: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  telemetry.record('bi.purchaseAnalytics.error', { operation, error: message });
};

const get = async <T>(path: string, params: object = {}): Promise<BIEnvelope<T>> =>
  (await apiClient.get(path, { params: cleanQueryParams(params) })) as BIEnvelope<T>;

export const purchaseAnalyticsService = {
  /** KPIs del período; con `compare=true` agrega la ventana previa real. */
  async getPerformance(
    params: PurchasePeriodParams & { compare?: boolean } = {},
  ): Promise<BIEnvelope<PurchasePerformance>> {
    try {
      return await get<PurchasePerformance>('/purchase-analytics/performance', params);
    } catch (error) {
      recordError('getPerformance', error);
      throw error;
    }
  },

  /** Serie de compras con granularidad explícita (hourly/daily/monthly). */
  async getTrends(params: PurchaseTrendsParams = {}): Promise<BIEnvelope<PurchaseTrends>> {
    try {
      return await get<PurchaseTrends>('/purchase-analytics/trends', params);
    } catch (error) {
      recordError('getTrends', error);
      throw error;
    }
  },

  /** Compras por categoría (limit 20 por defecto en el BE, máx. 100). */
  async getByCategory(
    params: PurchasePeriodParams & { limit?: number } = {},
  ): Promise<BIEnvelope<PurchasesByCategory>> {
    try {
      return await get<PurchasesByCategory>('/purchase-analytics/by-category', params);
    } catch (error) {
      recordError('getByCategory', error);
      throw error;
    }
  },

  /** Productos comprados, paginado y ordenado server-side. */
  async getByProduct(params: PurchaseProductParams = {}): Promise<BIEnvelope<PurchasesByProduct>> {
    try {
      return await get<PurchasesByProduct>('/purchase-analytics/by-product', params);
    } catch (error) {
      recordError('getByProduct', error);
      throw error;
    }
  },

  /** Proveedores del período, paginado y ordenado server-side. */
  async getBySupplier(
    params: PurchaseSupplierParams = {},
  ): Promise<BIEnvelope<PurchasesBySupplier>> {
    try {
      return await get<PurchasesBySupplier>('/purchase-analytics/by-supplier', params);
    } catch (error) {
      recordError('getBySupplier', error);
      throw error;
    }
  },

  /** Ranking de compradores (usuarios que registran compras). */
  async getByBuyer(params: PurchasePageParams = {}): Promise<BIEnvelope<PurchasesByBuyer>> {
    try {
      return await get<PurchasesByBuyer>('/purchase-analytics/by-buyer', params);
    } catch (error) {
      recordError('getByBuyer', error);
      throw error;
    }
  },

  /** Mix de medios de pago de las órdenes de compra. */
  async getByPaymentMethod(
    params: PurchasePeriodParams = {},
  ): Promise<BIEnvelope<PurchasesByPaymentMethod>> {
    try {
      return await get<PurchasesByPaymentMethod>('/purchase-analytics/by-payment-method', params);
    } catch (error) {
      recordError('getByPaymentMethod', error);
      throw error;
    }
  },

  /** Distribución por hora; `peak_hour` sale del payload, no del cliente. */
  async getByHour(params: PurchasePeriodParams = {}): Promise<BIEnvelope<PurchasesByHour>> {
    try {
      return await get<PurchasesByHour>('/purchase-analytics/by-hour', params);
    } catch (error) {
      recordError('getByHour', error);
      throw error;
    }
  },

  /** Distribución por día de la semana; `best_day` sale del payload. */
  async getByDayOfWeek(
    params: PurchasePeriodParams = {},
  ): Promise<BIEnvelope<PurchasesByDayOfWeek>> {
    try {
      return await get<PurchasesByDayOfWeek>('/purchase-analytics/by-day-of-week', params);
    } catch (error) {
      recordError('getByDayOfWeek', error);
      throw error;
    }
  },

  /**
   * Comparación A vs B. Modo período (sin fechas) compara contra la ventana
   * previa equivalente; modo rangos exige los 4 extremos.
   */
  async getComparison(
    params: PurchaseComparisonParams = {},
  ): Promise<BIEnvelope<PurchaseComparison>> {
    try {
      return await get<PurchaseComparison>('/purchase-analytics/compare', params);
    } catch (error) {
      recordError('getComparison', error);
      throw error;
    }
  },
};

export default purchaseAnalyticsService;
