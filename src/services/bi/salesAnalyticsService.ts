/**
 * Servicio de Analítica de Ventas (BI, F4).
 *
 * Contrato real del backend (`internal/analytics/http.go` +
 * `internal/analytics/http_discounts.go`): envelope `{success, data, metadata}`
 * en TODAS las respuestas. El servicio NO lo desenvuelve — el hook lee `data`
 * y `metadata` (p. ej. `metadata.total_count` del reporte de descuentos).
 *
 * Gate del BE: `analytics:read` para todo el grupo, salvo
 * `/sales-analytics/discounts*`, que usa `reports:read`. Ambos van detrás de
 * `RequireModule('bi')`.
 *
 * Sin fallback demo/mock: si el endpoint falla, el error llega a la UI.
 */
import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import type {
  BIEnvelope,
  DiscountLine,
  DiscountLinesMetadata,
  DiscountsParams,
  DiscountSummaryMetadata,
  DiscountSummaryParams,
  DiscountSummaryRow,
  SalesAnalyticsDashboard,
  SalesByCategory,
  SalesByCustomer,
  SalesByDayOfWeek,
  SalesByHour,
  SalesByProduct,
  SalesBySeller,
  SalesComparison,
  SalesComparisonParams,
  SalesHeatmapData,
  SalesLimitParams,
  SalesPageParams,
  SalesPerformance,
  SalesPeriodParams,
  SalesProductParams,
  SalesTrends,
  SalesTrendsParams,
  SalesVelocity,
  TopBottomProducts,
} from '../../types/bi';

type QueryValue = string | number | boolean | null | undefined

/** Strip de undefined/null/'' — URLSearchParams no debe ver parámetros vacíos. */
export const cleanQueryParams = (params: object = {}): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(params) as Array<[string, QueryValue]>) {
    if (value === undefined || value === null || value === '') continue
    out[key] = String(value)
  }
  return out
}

const recordError = (operation: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  telemetry.record('bi.salesAnalytics.error', { operation, error: message });
};

const get = async <T>(path: string, params: object = {}): Promise<BIEnvelope<T>> =>
  (await apiClient.get(path, { params: cleanQueryParams(params) })) as BIEnvelope<T>;

export const salesAnalyticsService = {
  /** KPIs del período; con `compare=true` agrega la ventana previa real. */
  async getPerformance(
    params: SalesPeriodParams & { compare?: boolean } = {},
  ): Promise<BIEnvelope<SalesPerformance>> {
    try {
      return await get<SalesPerformance>('/sales-analytics/performance', params);
    } catch (error) {
      recordError('getPerformance', error);
      throw error;
    }
  },

  /** Dashboard consolidado (tendencias, top productos/categorías, mix de pago). */
  async getDashboard(params: SalesPeriodParams = {}): Promise<BIEnvelope<SalesAnalyticsDashboard>> {
    try {
      return await get<SalesAnalyticsDashboard>('/sales-analytics/dashboard', params);
    } catch (error) {
      recordError('getDashboard', error);
      throw error;
    }
  },

  /** Serie de ventas con granularidad explícita (hourly/daily/monthly). */
  async getTrends(params: SalesTrendsParams = {}): Promise<BIEnvelope<SalesTrends>> {
    try {
      return await get<SalesTrends>('/sales-analytics/trends', params);
    } catch (error) {
      recordError('getTrends', error);
      throw error;
    }
  },

  /** Ventas por categoría (limit 20 por defecto en el BE, máx. 100). */
  async getByCategory(params: SalesLimitParams = {}): Promise<BIEnvelope<SalesByCategory>> {
    try {
      return await get<SalesByCategory>('/sales-analytics/by-category', params);
    } catch (error) {
      recordError('getByCategory', error);
      throw error;
    }
  },

  /** Productos vendidos, paginado y ordenado server-side. */
  async getByProduct(params: SalesProductParams = {}): Promise<BIEnvelope<SalesByProduct>> {
    try {
      return await get<SalesByProduct>('/sales-analytics/by-product', params);
    } catch (error) {
      recordError('getByProduct', error);
      throw error;
    }
  },

  /** Rankings de productos: más vendidos, mayor margen, mayor volumen y cola. */
  async getTopBottomProducts(params: SalesLimitParams = {}): Promise<BIEnvelope<TopBottomProducts>> {
    try {
      return await get<TopBottomProducts>('/sales-analytics/top-bottom-products', params);
    } catch (error) {
      recordError('getTopBottomProducts', error);
      throw error;
    }
  },

  /** Clientes del período + resumen (retención y LTV históricos). */
  async getByCustomer(params: SalesPageParams = {}): Promise<BIEnvelope<SalesByCustomer>> {
    try {
      return await get<SalesByCustomer>('/sales-analytics/by-customer', params);
    } catch (error) {
      recordError('getByCustomer', error);
      throw error;
    }
  },

  /** Ranking de vendedores por ventas (paginado). */
  async getBySeller(params: SalesPageParams = {}): Promise<BIEnvelope<SalesBySeller>> {
    try {
      return await get<SalesBySeller>('/sales-analytics/by-seller', params);
    } catch (error) {
      recordError('getBySeller', error);
      throw error;
    }
  },

  /** Distribución por hora; `peak_hour` sale del payload, no del cliente. */
  async getByHour(params: SalesPeriodParams = {}): Promise<BIEnvelope<SalesByHour>> {
    try {
      return await get<SalesByHour>('/sales-analytics/by-hour', params);
    } catch (error) {
      recordError('getByHour', error);
      throw error;
    }
  },

  /** Distribución por día de la semana; `best_day` sale del payload. */
  async getByDayOfWeek(params: SalesPeriodParams = {}): Promise<BIEnvelope<SalesByDayOfWeek>> {
    try {
      return await get<SalesByDayOfWeek>('/sales-analytics/by-day-of-week', params);
    } catch (error) {
      recordError('getByDayOfWeek', error);
      throw error;
    }
  },

  /** Heatmap 7×24 del período (contrato conservado; la landing usa el de F2). */
  async getHeatmap(params: SalesPeriodParams = {}): Promise<BIEnvelope<SalesHeatmapData>> {
    try {
      return await get<SalesHeatmapData>('/sales-analytics/heatmap', params);
    } catch (error) {
      recordError('getHeatmap', error);
      throw error;
    }
  },

  /** Velocidad de venta global y por producto/categoría. */
  async getVelocity(params: SalesPeriodParams = {}): Promise<BIEnvelope<SalesVelocity>> {
    try {
      return await get<SalesVelocity>('/sales-analytics/velocity', params);
    } catch (error) {
      recordError('getVelocity', error);
      throw error;
    }
  },

  /**
   * Comparación A vs B. Modo período (sin fechas) compara contra la ventana
   * previa equivalente; modo rangos exige los 4 extremos.
   */
  async getComparison(params: SalesComparisonParams = {}): Promise<BIEnvelope<SalesComparison>> {
    try {
      return await get<SalesComparison>('/sales-analytics/compare', params);
    } catch (error) {
      recordError('getComparison', error);
      throw error;
    }
  },

  /** Líneas con descuento del rango (start_date/end_date obligatorios). */
  async getDiscounts(
    params: DiscountsParams,
  ): Promise<{
    success?: boolean;
    /** `null` = Go nil slice: el rango no tiene líneas (no es un error). */
    data: DiscountLine[] | null;
    metadata?: DiscountLinesMetadata;
  }> {
    try {
      return (await apiClient.get('/sales-analytics/discounts', {
        params: cleanQueryParams(params),
      })) as {
        success?: boolean;
        data: DiscountLine[] | null;
        metadata?: DiscountLinesMetadata;
      };
    } catch (error) {
      recordError('getDiscounts', error);
      throw error;
    }
  },

  /** Resumen de descuentos agrupado por vendedor, aplicador o sucursal. */
  async getDiscountsSummary(
    params: DiscountSummaryParams,
  ): Promise<{
    success?: boolean;
    /** `null` = Go nil slice: no hay descuentos que agrupar. */
    data: DiscountSummaryRow[] | null;
    metadata?: DiscountSummaryMetadata;
  }> {
    try {
      return (await apiClient.get('/sales-analytics/discounts/summary', {
        params: cleanQueryParams(params),
      })) as {
        success?: boolean;
        data: DiscountSummaryRow[] | null;
        metadata?: DiscountSummaryMetadata;
      };
    } catch (error) {
      recordError('getDiscountsSummary', error);
      throw error;
    }
  },
};

export default salesAnalyticsService;
