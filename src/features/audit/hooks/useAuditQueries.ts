/**
 * Hooks de datos de Auditoría (F10).
 *
 * Única frontera HTTP del feature: los componentes reciben props y no llaman
 * servicios. Cada query se keyea por período/página/filtros para no mezclar
 * respuestas.
 *
 * Los slices nil de Go llegan como `null` (`trends`, `security_alerts`,
 * `error_summary`, `logs`, `recent_actions`, `actions_by_*`): se normalizan a
 * `[]`. Un `data` ausente rompe la query — nunca una pantalla vacía
 * silenciosa. El BE cachea BI 60-120 s; el `staleTime` no promete frescura.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { auditService } from '@/services/bi/auditService'
import type {
  AuditDashboard,
  AuditLogEntry,
  AuditLogsParams,
  AuditLogsResponse,
  AuditUserActivityReport,
  DashboardPeriod,
} from '@/types/bi'

export const AUDIT_STALE_TIME = 60_000

const toArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : [])

const requireData = <T,>(data: T | null | undefined, endpoint: string): T => {
  if (!data) throw new Error(`Respuesta vacía de ${endpoint}`)
  return data
}

export const auditQueryKeys = {
  all: ['bi', 'audit'] as const,
  dashboard: (period: DashboardPeriod) => ['bi', 'audit', 'dashboard', period] as const,
  logs: (scope: string) => ['bi', 'audit', 'logs', scope] as const,
  log: (id: string) => ['bi', 'audit', 'log', id] as const,
  activity: (userId: string, period: DashboardPeriod) =>
    ['bi', 'audit', 'activity', userId, period] as const,
}

const normalizeDashboard = (data: AuditDashboard): AuditDashboard => ({
  ...data,
  actions_by_category: toArray(data.actions_by_category),
  actions_by_type: toArray(data.actions_by_type),
  top_users: toArray(data.top_users),
  recent_activity: toArray(data.recent_activity),
  trends: toArray(data.trends),
  security_alerts: toArray(data.security_alerts),
  error_summary: toArray(data.error_summary),
})

export const useAuditDashboard = (period: DashboardPeriod) =>
  useQuery({
    queryKey: auditQueryKeys.dashboard(period),
    queryFn: async (): Promise<AuditDashboard> =>
      normalizeDashboard(
        requireData(
          (await auditService.getDashboard(period))?.data,
          '/api/v1/audit/dashboard',
        ),
      ),
    staleTime: AUDIT_STALE_TIME,
  })

export interface AuditLogsView {
  logs: AuditLogEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AuditLogsQueryOptions {
  enabled?: boolean
}

export const useAuditLogs = (
  params: AuditLogsParams,
  { enabled = true }: AuditLogsQueryOptions = {},
) =>
  useQuery({
    queryKey: auditQueryKeys.logs(JSON.stringify(params)),
    enabled,
    queryFn: async (): Promise<AuditLogsView> => {
      const data = requireData(
        (await auditService.getLogs(params))?.data,
        '/api/v1/audit/logs',
      ) as AuditLogsResponse
      return {
        logs: toArray(data.logs),
        total: data.total ?? 0,
        page: data.page ?? 1,
        pageSize: data.page_size ?? 0,
        totalPages: data.total_pages ?? 0,
      }
    },
    staleTime: AUDIT_STALE_TIME,
  })

export const useAuditLog = (id: string) =>
  useQuery({
    queryKey: auditQueryKeys.log(id),
    enabled: Boolean(id),
    queryFn: async (): Promise<AuditLogEntry> =>
      requireData(
        (await auditService.getLogById(id))?.data,
        `/api/v1/audit/logs/${id}`,
      ),
    staleTime: AUDIT_STALE_TIME,
  })

const normalizeActivity = (data: AuditUserActivityReport): AuditUserActivityReport => ({
  ...data,
  actions_by_category: toArray(data.actions_by_category),
  actions_by_day: toArray(data.actions_by_day),
  recent_actions: toArray(data.recent_actions),
  // El repo no completa estas dos colecciones; se normalizan por contrato.
  sessions: toArray(data.sessions),
  security_events: toArray(data.security_events),
})

export const useAuditUserActivity = (userId: string, period: DashboardPeriod) =>
  useQuery({
    queryKey: auditQueryKeys.activity(userId, period),
    enabled: Boolean(userId),
    queryFn: async (): Promise<AuditUserActivityReport> =>
      normalizeActivity(
        requireData(
          (await auditService.getUserActivity(userId, period))?.data,
          `/api/v1/audit/users/${userId}/activity`,
        ),
      ),
    staleTime: AUDIT_STALE_TIME,
  })

/** Refetch de todo el grupo (botón real de la barra de acciones). */
export const useAuditRefresh = () => {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: auditQueryKeys.all })
  }
}
