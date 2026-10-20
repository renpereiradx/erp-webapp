import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import type {
  BIEnvelope,
  DashboardAlerts,
  DashboardKPIs,
  DashboardPeriodParams,
  DashboardSummary,
  DashboardTrends,
  RecentActivityResponse,
  SalesHeatmapResponse,
  TopProductSort,
  TopProductsResponse,
} from '../../types/bi';

/**
 * Servicio del Dashboard Ejecutivo (BI).
 *
 * Contrato real del backend (`internal/analytics/http_dashboard.go`):
 * `GET /dashboard/{summary,kpis,trends,alerts,top-products,sales-heatmap,
 * recent-activity}`. Todos devuelven el envelope `{success, data, metadata}`;
 * el servicio NO lo desenvuelve — el hook consume `response.data` y puede leer
 * `metadata.partial` para avisar de datos parciales (T8/BR-4a).
 *
 * No hay fallback demo: si el endpoint falla, el error llega a la UI.
 */

export interface TopProductsParams extends DashboardPeriodParams {
  limit?: number;
  sort_by?: TopProductSort;
}

export interface HeatmapParams {
  weeks?: number;
}

export interface RecentActivityParams {
  limit?: number;
  /** El backend espera `types` como lista separada por comas. */
  types?: string[];
}

export interface AlertFiltersParams {
  severity?: string;
  category?: string;
}

const recordError = (operation: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  telemetry.record('bi.dashboard.error', { operation, error: message });
};

export const dashboardService = {
  /** Resumen ejecutivo del período (ventas, compras, margen, inventario…). */
  async getSummary(params: DashboardPeriodParams = {}): Promise<BIEnvelope<DashboardSummary>> {
    try {
      return (await apiClient.get('/dashboard/summary', { params })) as BIEnvelope<DashboardSummary>;
    } catch (error) {
      recordError('getSummary', error);
      throw error;
    }
  },

  /** Los 5 grupos de KPIs del período. */
  async getKPIs(params: DashboardPeriodParams = {}): Promise<BIEnvelope<DashboardKPIs>> {
    try {
      return (await apiClient.get('/dashboard/kpis', { params })) as BIEnvelope<DashboardKPIs>;
    } catch (error) {
      recordError('getKPIs', error);
      throw error;
    }
  },

  /** Tendencias vs período anterior (5 métricas). */
  async getTrends(params: DashboardPeriodParams = {}): Promise<BIEnvelope<DashboardTrends>> {
    try {
      return (await apiClient.get('/dashboard/trends', { params })) as BIEnvelope<DashboardTrends>;
    } catch (error) {
      recordError('getTrends', error);
      throw error;
    }
  },

  /** Alertas consolidadas activas; el backend soporta filtros pero la UI
   *  filtra client-side para no perder los contadores del resumen. */
  async getAlerts(params: AlertFiltersParams = {}): Promise<BIEnvelope<DashboardAlerts>> {
    try {
      return (await apiClient.get('/dashboard/alerts', { params })) as BIEnvelope<DashboardAlerts>;
    } catch (error) {
      recordError('getAlerts', error);
      throw error;
    }
  },

  /** Top de productos; `sort_by` acepta revenue | quantity | profit. */
  async getTopProducts(params: TopProductsParams = {}): Promise<BIEnvelope<TopProductsResponse>> {
    try {
      return (await apiClient.get('/dashboard/top-products', { params })) as BIEnvelope<TopProductsResponse>;
    } catch (error) {
      recordError('getTopProducts', error);
      throw error;
    }
  },

  /** Mapa de calor día × hora de las últimas `weeks` semanas (default 4). */
  async getSalesHeatmap(params: HeatmapParams = {}): Promise<BIEnvelope<SalesHeatmapResponse>> {
    try {
      return (await apiClient.get('/dashboard/sales-heatmap', { params })) as BIEnvelope<SalesHeatmapResponse>;
    } catch (error) {
      recordError('getSalesHeatmap', error);
      throw error;
    }
  },

  /** Actividad reciente (ventas, compras, pagos, ajustes). */
  async getRecentActivity(params: RecentActivityParams = {}): Promise<BIEnvelope<RecentActivityResponse>> {
    try {
      const { types, ...rest } = params;
      const query = types && types.length > 0 ? { ...rest, types: types.join(',') } : rest;
      return (await apiClient.get('/dashboard/recent-activity', { params: query })) as BIEnvelope<RecentActivityResponse>;
    } catch (error) {
      recordError('getRecentActivity', error);
      throw error;
    }
  },
};

export default dashboardService;
