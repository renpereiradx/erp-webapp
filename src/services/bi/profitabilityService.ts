/**
 * Servicio de Rentabilidad (BI, F6).
 *
 * Contrato real del backend (`models/profitability.go` +
 * `internal/analytics/http_profitability.go` +
 * `internal/platform/postgres/analytics_profitability_repo.go`): envelope
 * `{success, data, metadata}` en TODAS las respuestas. El servicio NO lo
 * desenvuelve — el hook lee `data`.
 *
 * Gate del BE: `RequireModule('bi')` → `analytics:read` para todo el grupo
 * (`biChain("analytics:read", "profitability")`).
 *
 * Sin fallback demo/mock: si el endpoint falla, el error llega a la UI.
 * `/profitability/overview` no se consume: el dashboard consolidado ya trae
 * KPIs y crecimiento con una sola llamada.
 */
import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import type {
  BIEnvelope,
  CategoryProfitabilityReport,
  CustomerProfitabilityReport,
  DashboardPeriod,
  ProductProfitabilityReport,
  ProfitabilityDashboard,
  ProfitabilityGranularityParams,
  ProfitabilityPageParams,
  ProfitabilityProductParams,
  ProfitabilityTrendsReport,
  SellerProfitabilityReport,
} from '../../types/bi';

type QueryValue = string | number | boolean | null | undefined;

/** Strip de undefined/null/'' — URLSearchParams no debe ver parámetros vacíos. */
export const cleanQueryParams = (params: object = {}): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params) as Array<[string, QueryValue]>) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = String(value);
  }
  return out;
};

const recordError = (operation: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  telemetry.record('bi.profitability.error', { operation, error: message });
};

const get = async <T>(path: string, params: object = {}): Promise<BIEnvelope<T>> =>
  (await apiClient.get(path, { params: cleanQueryParams(params) })) as BIEnvelope<T>;

export const profitabilityService = {
  /** Dashboard consolidado: KPIs con crecimiento, topes, tendencia y alertas. */
  async getDashboard(period: DashboardPeriod = 'month'): Promise<BIEnvelope<ProfitabilityDashboard>> {
    try {
      return await get<ProfitabilityDashboard>('/profitability/dashboard', { period });
    } catch (error) {
      recordError('getDashboard', error);
      throw error;
    }
  },

  /** Productos paginados/ordenados server-side (`profit|margin|revenue|units|name`). */
  async getProducts(
    params: ProfitabilityProductParams = {},
  ): Promise<BIEnvelope<ProductProfitabilityReport>> {
    try {
      return await get<ProductProfitabilityReport>('/profitability/products', params);
    } catch (error) {
      recordError('getProducts', error);
      throw error;
    }
  },

  /** Clientes con compras en el período, paginados (orden fijo por beneficio). */
  async getCustomers(
    params: ProfitabilityPageParams = {},
  ): Promise<BIEnvelope<CustomerProfitabilityReport>> {
    try {
      return await get<CustomerProfitabilityReport>('/profitability/customers', params);
    } catch (error) {
      recordError('getCustomers', error);
      throw error;
    }
  },

  /** Categorías completas del período (sin paginación). */
  async getCategories(
    period: DashboardPeriod = 'month',
  ): Promise<BIEnvelope<CategoryProfitabilityReport>> {
    try {
      return await get<CategoryProfitabilityReport>('/profitability/categories', { period });
    } catch (error) {
      recordError('getCategories', error);
      throw error;
    }
  },

  /** Serie de beneficios con granularidad diaria, semanal o mensual. */
  async getTrends(
    params: ProfitabilityGranularityParams = {},
  ): Promise<BIEnvelope<ProfitabilityTrendsReport>> {
    try {
      return await get<ProfitabilityTrendsReport>('/profitability/trends', params);
    } catch (error) {
      recordError('getTrends', error);
      throw error;
    }
  },

  /** Vendedores con ventas en el período (sin paginación). */
  async getSellers(
    period: DashboardPeriod = 'month',
  ): Promise<BIEnvelope<SellerProfitabilityReport>> {
    try {
      return await get<SellerProfitabilityReport>('/profitability/sellers', { period });
    } catch (error) {
      recordError('getSellers', error);
      throw error;
    }
  },
};

export default profitabilityService;
