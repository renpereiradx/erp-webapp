/**
 * Servicio de Pronósticos (BI, F11).
 *
 * Contrato real de `/forecast/*` (`business_management/models/forecast.go` +
 * `internal/analytics/http_forecast.go` +
 * `internal/platform/postgres/analytics_forecast_repo.go`). Envelope
 * `{success, data, metadata}`: el servicio NO lo desenvuelve — el hook lee
 * `data`.
 *
 * Gate del BE: `RequireModule('bi')` → `analytics:read`
 * (`biChain("analytics:read", "forecast")`).
 *
 * Sin fallback demo/mock: el pronóstico es un algoritmo estadístico del
 * backend (regresión lineal, media móvil, suavizado exponencial o
 * descomposición estacional) sobre ventas históricas. Si el endpoint falla, el
 * error llega a la UI.
 *
 * Parámetros con tope del handler: `forecast_months` ≤ 12 y `history_months`
 * ≤ 24 (fuera de rango el BE los lleva al máximo, no a un default); la UI
 * envía siempre valores válidos para no depender de ese clamp invisible.
 */
import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import type {
  BIEnvelope,
  DemandForecast,
  ForecastDashboard,
  ForecastDashboardParams,
  ForecastDemandParams,
  ForecastInventoryParams,
  ForecastRevenueParams,
  ForecastSalesParams,
  InventoryForecast,
  RevenueForecast,
  SalesForecast,
} from '../../types/bi';

type QueryValue = string | number | boolean | null | undefined;

/** Strip de undefined/null/'' — URLSearchParams no debe ver parámetros vacíos. */
export const cleanForecastParams = (params: object = {}): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params) as Array<[string, QueryValue]>) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = String(value);
  }
  return out;
};

const recordError = (operation: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  telemetry.record('bi.forecast.error', { operation, error: message });
};

const get = async <T>(path: string, params: object = {}): Promise<BIEnvelope<T>> =>
  (await apiClient.get(path, { params: cleanForecastParams(params) })) as BIEnvelope<T>;

export const forecastService = {
  /**
   * Dashboard consolidado: compone los 4 pronósticos + insights del BE.
   * `months` es el horizonte común (default 3 en el backend).
   */
  async getDashboard(params: ForecastDashboardParams = {}): Promise<BIEnvelope<ForecastDashboard>> {
    try {
      return await get<ForecastDashboard>('/forecast/dashboard', params);
    } catch (error) {
      recordError('getDashboard', error);
      throw error;
    }
  },

  /** Pronóstico de ventas (histórico + proyección + métricas del modelo). */
  async getSalesForecast(params: ForecastSalesParams = {}): Promise<BIEnvelope<SalesForecast>> {
    try {
      return await get<SalesForecast>('/forecast/sales', params);
    } catch (error) {
      recordError('getSalesForecast', error);
      throw error;
    }
  },

  /** Salud de inventario (productos paginados; summary sobre el set completo). */
  async getInventoryForecast(
    params: ForecastInventoryParams = {},
  ): Promise<BIEnvelope<InventoryForecast>> {
    try {
      return await get<InventoryForecast>('/forecast/inventory', params);
    } catch (error) {
      recordError('getInventoryForecast', error);
      throw error;
    }
  },

  /** Pronóstico de demanda por categoría y top de productos paginado. */
  async getDemandForecast(params: ForecastDemandParams = {}): Promise<BIEnvelope<DemandForecast>> {
    try {
      return await get<DemandForecast>('/forecast/demand', params);
    } catch (error) {
      recordError('getDemandForecast', error);
      throw error;
    }
  },

  /**
   * Pronóstico de ingresos. `include_scenarios=true` devuelve los 3 escenarios
   * del BE (base ±15 %); sin él, `scenarios` viene vacío.
   */
  async getRevenueForecast(
    params: ForecastRevenueParams = {},
  ): Promise<BIEnvelope<RevenueForecast>> {
    try {
      return await get<RevenueForecast>('/forecast/revenue', params);
    } catch (error) {
      recordError('getRevenueForecast', error);
      throw error;
    }
  },
};

export default forecastService;
