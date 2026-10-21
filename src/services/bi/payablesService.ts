/**
 * Servicio de Cuentas por Pagar (BI, F8).
 *
 * Contrato real del backend (`models/payables.go` +
 * `internal/analytics/http_payables.go` +
 * `internal/platform/postgres/analytics_payables_repo.go`): envelope
 * `{success, data, metadata}` en TODAS las respuestas. El servicio NO lo
 * desenvuelve — el hook lee `data`.
 *
 * Gate del BE: `RequireModule('bi')` → `payables:read` para todo el grupo
 * (`biChain("payables:read", "payables")`).
 *
 * Sin fallback demo/mock: si el endpoint falla, el error llega a la UI.
 * Endpoints NO consumidos porque el plan no tiene pantalla que los use (no se
 * agregan métodos muertos): `/payables/overdue` (el listado filtra por
 * estado), `/payables/urgent` (idem por prioridad), `/payables/aging/summary`
 * (overview y reporte la embeben), `/payables/reminders*`,
 * `/payables/statistics/date-range` (solo 4 períodos estándar),
 * `/payables/payment-capacity` (la cobertura se deriva de `/cash-flow`) y
 * `/payables/supplier/{id}` (la ficha usa el listado filtrado por proveedor).
 */
import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import type {
  BIEnvelope,
  CashFlowProjection,
  DashboardPeriod,
  Payable,
  PayablesAgingReport,
  PayablesList,
  PayablesListParams,
  PayablesOverview,
  PayablesPageParams,
  PayablesStatistics,
  PaymentCalendar,
  SupplierAnalysis,
  SupplierPayablesSummary,
} from '../../types/bi';

type QueryValue = string | number | boolean | null | undefined;

/** Strip de undefined/null/'' — URLSearchParams no debe ver parámetros vacíos. */
export const cleanPayablesParams = (params: object = {}): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params) as Array<[string, QueryValue]>) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = String(value);
  }
  return out;
};

const recordError = (operation: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  telemetry.record('bi.payables.error', { operation, error: message });
};

const get = async <T>(path: string, params: object = {}): Promise<BIEnvelope<T>> =>
  (await apiClient.get(path, { params: cleanPayablesParams(params) })) as BIEnvelope<T>;

const entityPath = (base: string, id: string): string =>
  `${base}/${encodeURIComponent(id)}`;

export const payablesService = {
  /** Cartera actual (snapshot, sin período): totales, vencido y antigüedad. */
  async getOverview(): Promise<BIEnvelope<PayablesOverview>> {
    try {
      return await get<PayablesOverview>('/payables/overview');
    } catch (error) {
      recordError('getOverview', error);
      throw error;
    }
  },

  /**
   * Lista maestra paginada. Whitelist de orden: `due_date|date|amount|
   * supplier|priority`; los totales del `summary` son del set filtrado
   * completo (ventanas del SQL), no de la página.
   */
  async getList(params: PayablesListParams = {}): Promise<BIEnvelope<PayablesList>> {
    try {
      return await get<PayablesList>('/payables', params);
    } catch (error) {
      recordError('getList', error);
      throw error;
    }
  },

  /** Detalle de una cuenta por pagar (404 tipado si no existe). */
  async getById(id: string): Promise<BIEnvelope<Payable>> {
    try {
      return (await apiClient.get(entityPath('/payables', id))) as BIEnvelope<Payable>;
    } catch (error) {
      recordError('getById', error);
      throw error;
    }
  },

  /** Proveedores con mayor deuda a hoy (snapshot, ordenado por pendiente). */
  async getTopSuppliers(limit = 5): Promise<BIEnvelope<SupplierPayablesSummary[]>> {
    try {
      return await get<SupplierPayablesSummary[]>('/payables/top-suppliers', { limit });
    } catch (error) {
      recordError('getTopSuppliers', error);
      throw error;
    }
  },

  /**
   * Calendario de pagos: vencimientos entre hoy y hoy+N días (el BE usa
   * `order_date + 30 días` como vencimiento). El array llega sin ordenar.
   */
  async getSchedule(days = 30): Promise<BIEnvelope<PaymentCalendar>> {
    try {
      return await get<PaymentCalendar>('/payables/schedule', { days });
    } catch (error) {
      recordError('getSchedule', error);
      throw error;
    }
  },

  /** Reporte de antigüedad por proveedor (paginado, totales globales). */
  async getAgingReport(params: PayablesPageParams = {}): Promise<BIEnvelope<PayablesAgingReport>> {
    try {
      return await get<PayablesAgingReport>('/payables/aging/report', params);
    } catch (error) {
      recordError('getAgingReport', error);
      throw error;
    }
  },

  /**
   * Estadísticas del período: comprado/pagado, tasa de pago, días hasta el
   * primer pago y serie semanal. `top_suppliers` NO está acotado al período.
   */
  async getStatistics(period: DashboardPeriod = 'month'): Promise<BIEnvelope<PayablesStatistics>> {
    try {
      return await get<PayablesStatistics>('/payables/statistics', { period });
    } catch (error) {
      recordError('getStatistics', error);
      throw error;
    }
  },

  /**
   * Proyección de flujo de caja: cobros y pagos esperados por vencimiento
   * (30 días desde la venta/compra) en los próximos N días.
   */
  async getCashFlowProjection(days = 30): Promise<BIEnvelope<CashFlowProjection>> {
    try {
      return await get<CashFlowProjection>('/payables/cash-flow', { days });
    } catch (error) {
      recordError('getCashFlowProjection', error);
      throw error;
    }
  },

  /** Análisis de un proveedor (saldo, peso sobre CxP, comportamiento). */
  async getSupplierAnalysis(supplierId: string): Promise<BIEnvelope<SupplierAnalysis>> {
    try {
      return (await apiClient.get(
        entityPath('/payables/supplier', supplierId) + '/analysis',
      )) as BIEnvelope<SupplierAnalysis>;
    } catch (error) {
      recordError('getSupplierAnalysis', error);
      throw error;
    }
  },
};

export default payablesService;
