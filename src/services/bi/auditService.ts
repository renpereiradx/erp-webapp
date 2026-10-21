/**
 * Servicio de Auditoría (BI, F10).
 *
 * Contrato real de `/api/v1/audit/*`
 * (`business_management/models/audit.go` + `internal/analytics/http_audit.go`
 * + `internal/platform/postgres/audit_repo.go`). Envelope
 * `{success, data, metadata}`: el servicio NO lo desenvuelve — el hook lee
 * `data`.
 *
 * Gate del BE: `RequireModule('bi')` → `audit:read`
 * (`biChain("audit:read", "audit")`).
 *
 * Sin fallback demo/mock: si el endpoint falla, el error llega a la UI.
 * Endpoints NO consumidos por las pantallas de F10 (no se agregan métodos
 * muertos): `/summary*`, `/trends*` (el dashboard embebe las tendencias),
 * `/dashboard/range` y `/users/{id}/activity/range` (solo 4 períodos),
 * `/users/top` (el dashboard embebe el top 5), `/entity/{type}/{id}/history`
 * (no hay pantalla de entidad en el plan) y los catálogos
 * `/categories|/actions|/levels|/entity-types` (el vocabulario cerrado vive en
 * `domain/audit/labels.ts`; LEGACY no está en el catálogo del BE).
 */
import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import type {
  AuditDashboard,
  AuditExportFilters,
  AuditExportOptions,
  AuditLogEntry,
  AuditLogsParams,
  AuditLogsResponse,
  AuditUserActivityReport,
  BIEnvelope,
  DashboardPeriod,
} from '../../types/bi';

type QueryValue = string | number | boolean | null | undefined;

/** Strip de undefined/null/'' — URLSearchParams no debe ver parámetros vacíos. */
export const cleanAuditParams = (params: object = {}): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params) as Array<[string, QueryValue]>) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = String(value);
  }
  return out;
};

const recordError = (operation: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  telemetry.record('bi.audit.error', { operation, error: message });
};

const get = async <T>(path: string, params: object = {}): Promise<BIEnvelope<T>> =>
  (await apiClient.get(path, { params: cleanAuditParams(params) })) as BIEnvelope<T>;

/** Fecha `YYYY-MM-DD` → RFC3339 de medianoche local (el body del export usa time.Time). */
const toRfc3339 = (value: string): string => new Date(`${value}T00:00:00`).toISOString();

export const auditService = {
  /** Dashboard consolidado del período (KPIs, tendencias, alertas, top users). */
  async getDashboard(period: DashboardPeriod = 'month'): Promise<BIEnvelope<AuditDashboard>> {
    try {
      return await get<AuditDashboard>('/api/v1/audit/dashboard', { period });
    } catch (error) {
      recordError('getDashboard', error);
      throw error;
    }
  },

  /** Registro paginado con filtros reales (`page/page_size` del BE). */
  async getLogs(params: AuditLogsParams = {}): Promise<BIEnvelope<AuditLogsResponse>> {
    try {
      return await get<AuditLogsResponse>('/api/v1/audit/logs', params);
    } catch (error) {
      recordError('getLogs', error);
      throw error;
    }
  },

  /** Un evento por id; el BE responde 404 si no existe o es de otra sucursal. */
  async getLogById(id: string | number): Promise<BIEnvelope<AuditLogEntry>> {
    try {
      return await get<AuditLogEntry>(
        `/api/v1/audit/logs/${encodeURIComponent(String(id))}`,
      );
    } catch (error) {
      recordError('getLogById', error);
      throw error;
    }
  },

  /** Actividad de un usuario en el período (resumen, categorías, días, recientes). */
  async getUserActivity(
    userId: string,
    period: DashboardPeriod = 'month',
  ): Promise<BIEnvelope<AuditUserActivityReport>> {
    try {
      return await get<AuditUserActivityReport>(
        `/api/v1/audit/users/${encodeURIComponent(userId)}/activity`,
        { period },
      );
    } catch (error) {
      recordError('getUserActivity', error);
      throw error;
    }
  },

  /**
   * Exporta el registro filtrado (POST /api/v1/audit/export). El BE responde
   * un archivo crudo (json/csv) con `Content-Disposition` — no el envelope —
   * así que va por `getBlob`. Body: `{filter, format, max_records}`; el
   * handler compara `timestamp >= start AND < end`, por eso el fin se manda
   * +1 día (día "Hasta" inclusive).
   */
  async exportLogs(
    filters: AuditExportFilters = {},
    { format = 'csv', max_records = 10_000 }: AuditExportOptions = {},
  ): Promise<{ blob: Blob; filename: string | null }> {
    const filter: Record<string, unknown> = {};
    if (filters.search?.trim()) filter.search_term = filters.search.trim();
    if (filters.category) filter.category = filters.category;
    if (filters.level) filter.level = filters.level;
    if (filters.success === 'true' || filters.success === 'false') {
      filter.success = filters.success === 'true';
    }
    if (filters.start_date) filter.start_date = toRfc3339(filters.start_date);
    if (filters.end_date) {
      const end = new Date(`${filters.end_date}T00:00:00`);
      end.setDate(end.getDate() + 1);
      filter.end_date = end.toISOString();
    }
    return apiClient.getBlob('/api/v1/audit/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter, format, max_records }),
    });
  },
};

export default auditService;
