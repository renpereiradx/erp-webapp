/**
 * Servicio de Cuentas por Cobrar (BI, F7).
 *
 * Contrato real del backend (`models/receivables.go` +
 * `internal/analytics/http_receivables.go` +
 * `internal/platform/postgres/analytics_receivables_repo.go`): envelope
 * `{success, data, metadata}` en TODAS las respuestas. El servicio NO lo
 * desenvuelve — el hook lee `data`.
 *
 * Gate del BE: `RequireModule('bi')` → `receivables:read` para todo el grupo
 * (`biChain("receivables:read", "receivables")`).
 *
 * Sin fallback demo/mock: si el endpoint falla, el error llega a la UI.
 * No se consumen `/aging/summary` (el overview y el reporte la embeben),
 * `/collection/reminders` ni `/statistics/date-range`: no hay pantalla del
 * plan que los use y no se agregan métodos muertos.
 */
import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import type {
  BIEnvelope,
  ClientReceivables,
  ClientReceivablesSummary,
  ClientRisk,
  DashboardPeriod,
  Receivable,
  ReceivablesAgingReport,
  ReceivablesList,
  ReceivablesOverview,
  ReceivablesPageParams,
  ReceivablesSortParams,
  ReceivablesStatistics,
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
  telemetry.record('bi.receivables.error', { operation, error: message });
};

const get = async <T>(path: string, params: object = {}): Promise<BIEnvelope<T>> =>
  (await apiClient.get(path, { params: cleanQueryParams(params) })) as BIEnvelope<T>;

const entityPath = (base: string, id: string): string =>
  `${base}/${encodeURIComponent(id)}`;

export const receivablesService = {
  /** Cartera actual (snapshot, sin período): totales, vencido y antigüedad. */
  async getOverview(): Promise<BIEnvelope<ReceivablesOverview>> {
    try {
      return await get<ReceivablesOverview>('/receivables/overview');
    } catch (error) {
      recordError('getOverview', error);
      throw error;
    }
  },

  /**
   * Lista maestra paginada. Whitelist de orden: `date|amount|client|
   * days_overdue`; `status` solo acepta PENDING/PARTIAL/OVERDUE (el BE ignora
   * cualquier otro valor y toda fila tiene saldo pendiente).
   */
  async getList(params: ReceivablesSortParams = {}): Promise<BIEnvelope<ReceivablesList>> {
    try {
      return await get<ReceivablesList>('/receivables', params);
    } catch (error) {
      recordError('getList', error);
      throw error;
    }
  },

  /** Detalle de una cuenta por cobrar (404 tipado si no existe). */
  async getById(id: string): Promise<BIEnvelope<Receivable>> {
    try {
      return (await apiClient.get(entityPath('/receivables', id))) as BIEnvelope<Receivable>;
    } catch (error) {
      recordError('getById', error);
      throw error;
    }
  },

  /**
   * Vencidas: el BE fija `status=OVERDUE` y ordena por días vencidos desc.
   * Solo acepta paginación (no sort/filtros propios).
   */
  async getOverdue(params: ReceivablesPageParams = {}): Promise<BIEnvelope<ReceivablesList>> {
    try {
      return await get<ReceivablesList>('/receivables/overdue', params);
    } catch (error) {
      recordError('getOverdue', error);
      throw error;
    }
  },

  /** Cuenta corriente de un cliente (resumen + hasta 100 cuentas). */
  async getClientReceivables(clientId: string): Promise<BIEnvelope<ClientReceivables>> {
    try {
      return (await apiClient.get(
        entityPath('/receivables/client', clientId),
      )) as BIEnvelope<ClientReceivables>;
    } catch (error) {
      recordError('getClientReceivables', error);
      throw error;
    }
  },

  /** Análisis de riesgo del cliente (nivel LOW/MEDIUM/HIGH + métricas). */
  async getClientRisk(clientId: string): Promise<BIEnvelope<ClientRisk>> {
    try {
      return (await apiClient.get(
        entityPath('/receivables/client', clientId) + '/risk',
      )) as BIEnvelope<ClientRisk>;
    } catch (error) {
      recordError('getClientRisk', error);
      throw error;
    }
  },

  /** Reporte de antigüedad: by_client paginado con totales globales. */
  async getAgingReport(params: ReceivablesPageParams = {}): Promise<BIEnvelope<ReceivablesAgingReport>> {
    try {
      return await get<ReceivablesAgingReport>('/receivables/aging/report', params);
    } catch (error) {
      recordError('getAgingReport', error);
      throw error;
    }
  },

  /** Principales deudores a hoy (sin período). Límite 5 por defecto. */
  async getTopDebtors(limit = 5): Promise<BIEnvelope<ClientReceivablesSummary[]>> {
    try {
      return await get<ClientReceivablesSummary[]>('/receivables/top-debtors', { limit });
    } catch (error) {
      recordError('getTopDebtors', error);
      throw error;
    }
  },

  /**
   * Estadísticas del período: facturado/cobrado del período, DSO promedio y
   * serie semanal. `week` es la semana calendario (lunes), a diferencia de las
   * pantallas rolling de Ventas/Inventario/Rentabilidad.
   */
  async getStatistics(period: DashboardPeriod = 'month'): Promise<BIEnvelope<ReceivablesStatistics>> {
    try {
      return await get<ReceivablesStatistics>('/receivables/statistics', { period });
    } catch (error) {
      recordError('getStatistics', error);
      throw error;
    }
  },
};

export default receivablesService;
