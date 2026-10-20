/**
 * Servicio de Analítica de Inventario (BI, F5).
 *
 * Contrato real del backend (`models/inventory_analytics.go` +
 * `internal/analytics/http_inventory.go`): envelope `{success, data, metadata}`
 * en TODAS las respuestas. El servicio NO lo desenvuelve — el hook lee `data`
 * y `metadata`.
 *
 * Gate del BE: `RequireModule('bi')` → `analytics:read` para todo el grupo
 * (`biChain("analytics:read", "inventory-analytics")`).
 *
 * Sin fallback demo/mock: si el endpoint falla, el error llega a la UI.
 */
import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import type {
  ABCAnalysis,
  BIEnvelope,
  DeadStockAnalysis,
  InventoryAnalyticsDashboard,
  InventoryDeadStockParams,
  InventoryOverview,
  InventoryPeriodParams,
  InventoryStockLevelsParams,
  ReorderAnalysis,
  StockAgingReport,
  StockLevelsReport,
  TurnoverAnalysis,
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
  telemetry.record('bi.inventoryAnalytics.error', { operation, error: message });
};

const get = async <T>(path: string, params: object = {}): Promise<BIEnvelope<T>> =>
  (await apiClient.get(path, { params: cleanQueryParams(params) })) as BIEnvelope<T>;

export const inventoryAnalyticsService = {
  /** Resumen general: valuación, estado del stock y rotación de 30 días. */
  async getOverview(): Promise<BIEnvelope<InventoryOverview>> {
    try {
      return await get<InventoryOverview>('/inventory-analytics/overview');
    } catch (error) {
      recordError('getOverview', error);
      throw error;
    }
  },

  /** Dashboard consolidado (KPIs, ABC, movers, reorden y alertas). */
  async getDashboard(): Promise<BIEnvelope<InventoryAnalyticsDashboard>> {
    try {
      return await get<InventoryAnalyticsDashboard>('/inventory-analytics/dashboard');
    } catch (error) {
      recordError('getDashboard', error);
      throw error;
    }
  },

  /** Niveles de stock paginados y ordenados server-side (`status` filtra). */
  async getStockLevels(
    params: InventoryStockLevelsParams = {},
  ): Promise<BIEnvelope<StockLevelsReport>> {
    try {
      return await get<StockLevelsReport>('/inventory-analytics/stock-levels', params);
    } catch (error) {
      recordError('getStockLevels', error);
      throw error;
    }
  },

  /** Rotación por categoría/producto del período (`week` = últimos 7 días). */
  async getTurnover(params: InventoryPeriodParams = {}): Promise<BIEnvelope<TurnoverAnalysis>> {
    try {
      return await get<TurnoverAnalysis>('/inventory-analytics/turnover', params);
    } catch (error) {
      recordError('getTurnover', error);
      throw error;
    }
  },

  /** Clasificación ABC por ventas del período. */
  async getABC(params: InventoryPeriodParams = {}): Promise<BIEnvelope<ABCAnalysis>> {
    try {
      return await get<ABCAnalysis>('/inventory-analytics/abc', params);
    } catch (error) {
      recordError('getABC', error);
      throw error;
    }
  },

  /** Productos con stock sin ventas en los últimos `days` días (default 90). */
  async getDeadStock(
    params: InventoryDeadStockParams = {},
  ): Promise<BIEnvelope<DeadStockAnalysis>> {
    try {
      return await get<DeadStockAnalysis>('/inventory-analytics/dead-stock', params);
    } catch (error) {
      recordError('getDeadStock', error);
      throw error;
    }
  },

  /** Reabastecimiento: urgentes/próximos con cantidad y costo estimado. */
  async getReorder(): Promise<BIEnvelope<ReorderAnalysis>> {
    try {
      return await get<ReorderAnalysis>('/inventory-analytics/reorder');
    } catch (error) {
      recordError('getReorder', error);
      throw error;
    }
  },

  /**
   * Antigüedad del stock por tramos. El BE no acepta parámetros: la ventana
   * sale de la última recepción (o del alta del producto).
   */
  async getStockAging(): Promise<BIEnvelope<StockAgingReport>> {
    try {
      return await get<StockAgingReport>('/inventory-analytics/aging');
    } catch (error) {
      recordError('getStockAging', error);
      throw error;
    }
  },
};

export default inventoryAnalyticsService;
