/**
 * Utilidades de los page tests de Auditoría (F10). No es un archivo de test:
 * provee el wrapper router + react-query, el envelope BI y fixtures con la
 * forma real de `/api/v1/audit/*`.
 */
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'

export const auditEnvelope = <T,>(data: T, metadata: Record<string, unknown> = {}) => ({
  success: true,
  data,
  metadata,
})

export const renderAuditPage = (
  ui: ReactElement,
  { route = '/auditoria', path }: { route?: string; path?: string } = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>
        {path ? (
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
        ) : (
          ui
        )}
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

export const auditPeriod = (overrides: Record<string, unknown> = {}) => ({
  start_date: '2026-10-01T00:00:00-03:00',
  end_date: '2026-11-01T00:00:00-03:00',
  type: '',
  ...overrides,
})

export const auditLog = (overrides: Record<string, unknown> = {}) => ({
  id: 27088,
  timestamp: '2026-10-20T08:25:46.980545-03:00',
  user_id: 'jJkV4F6HR',
  username: 'admin',
  session_id: '1379',
  ip_address: '::1',
  user_agent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:157.0) Firefox/157.0',
  category: 'SALE',
  action: 'CREATE',
  entity_type: 'SALE',
  entity_id: 'SALE-1789393146-771',
  description: 'POST /sale/pos-checkout',
  metadata: { request_id: '37e9bf2c' },
  level: 'INFO',
  success: true,
  duration_ms: 36,
  request_method: 'POST',
  request_path: '/sale/pos-checkout',
  response_status: 201,
  branch_id: 1,
  ...overrides,
})

export const legacyLog = (overrides: Record<string, unknown> = {}) => ({
  id: 12891,
  timestamp: '2026-09-16T13:57:00.533722-03:00',
  user_id: 'e02d4562-875f-4dc1-b9f9-970',
  category: 'LEGACY',
  action: 'INSERT',
  entity_type: 'SALE_PAYMENTS',
  entity_id: '118',
  description: 'legacy UPDATE on SALE_PAYMENTS',
  old_values: { status: 'COMPLETED', payment_id: 118 },
  new_values: { status: 'REFUNDED', payment_id: 118 },
  metadata: { source: 'legacy_backfill', legacy_id: 8853 },
  level: 'INFO',
  success: true,
  branch_id: 1,
  ...overrides,
})

export const auditKpis = (overrides: Record<string, unknown> = {}) => ({
  total_actions: 180,
  successful_actions: 170,
  failed_actions: 10,
  success_rate: 94.44444444444444,
  unique_users: 13,
  unique_sessions: 10,
  avg_actions_per_user: 13.846153846153847,
  avg_actions_per_session: 18,
  peak_hour: 19,
  peak_hour_actions: 60,
  critical_errors: 0,
  security_incidents: 0,
  ...overrides,
})

export const auditDashboard = (overrides: Record<string, unknown> = {}) => ({
  generated_at: '2026-10-21T15:03:05-03:00',
  period: auditPeriod(),
  kpis: auditKpis(),
  actions_by_category: [
    { category: 'LEGACY', count: 110, success_rate: 100, percentage: 61.111111111111114 },
    { category: 'SALE', count: 17, success_rate: 100, percentage: 9.444444444444445 },
    { category: 'CASH_REGISTER', count: 16, success_rate: 62.5, percentage: 8.88888888888889 },
  ],
  actions_by_type: [
    { action: 'UPDATE', count: 92, success_rate: 100, percentage: 51.11111111111111 },
    { action: 'CREATE', count: 56, success_rate: 82.14285714285714, percentage: 31.11111111111111 },
  ],
  top_users: [
    {
      user_id: 'jJkV4F6HR',
      username: 'admin',
      total_actions: 163,
      successful_actions: 153,
      failed_actions: 10,
      unique_categories: 8,
      unique_sessions: 9,
      last_activity: '2026-10-20T08:25:46.980545-03:00',
      avg_actions_per_day: 0.4465753424657534,
    },
  ],
  recent_activity: [auditLog()],
  trends: [
    {
      date: '2026-10-01T00:00:00Z',
      label: '01 Oct',
      total_actions: 1,
      successful: 1,
      failed: 0,
      unique_users: 1,
      error_rate: 0,
    },
    {
      date: '2026-10-20T00:00:00Z',
      label: '20 Oct',
      total_actions: 6,
      successful: 5,
      failed: 1,
      unique_users: 2,
      error_rate: 16.666666666666664,
    },
  ],
  security_alerts: [
    {
      type: 'FAILED_LOGINS',
      severity: 'HIGH',
      message: '12 intentos de login fallidos',
      user_id: 'jJkV4F6HR',
      ip_address: '::1',
      occurred_at: '2026-10-20T08:25:46.980545-03:00',
      count: 12,
    },
  ],
  error_summary: [
    {
      category: 'CASH_REGISTER',
      action: 'CREATE',
      error_message: '',
      count: 6,
      last_occurred: '2026-10-09T15:29:19.030717-03:00',
    },
  ],
  ...overrides,
})

export const auditLogs = (overrides: Record<string, unknown> = {}) => ({
  logs: [
    auditLog(),
    legacyLog(),
  ],
  total: 70,
  page: 1,
  page_size: 10,
  total_pages: 7,
  ...overrides,
})

export const auditUserActivity = (overrides: Record<string, unknown> = {}) => ({
  generated_at: '2026-10-21T15:03:42-03:00',
  period: auditPeriod({ start_date: '2026-01-01T00:00:00-03:00', end_date: '2027-01-01T00:00:00-03:00' }),
  user_id: 'jJkV4F6HR',
  username: 'admin',
  summary: {
    user_id: 'jJkV4F6HR',
    username: 'admin',
    total_actions: 163,
    successful_actions: 153,
    failed_actions: 10,
    unique_categories: 8,
    unique_sessions: 9,
    last_activity: '2026-10-20T08:25:46.980545-03:00',
    avg_actions_per_day: 0.4465753424657534,
  },
  actions_by_category: [
    { category: 'LEGACY', count: 94, success_rate: 100, percentage: 57.668711656441715 },
    { category: 'SALE', count: 17, success_rate: 100, percentage: 10.429447852760736 },
  ],
  actions_by_day: [
    { date: '2026-04-21T00:00:00Z', label: '21 Apr', actions: 56, success: 56, failed: 0 },
  ],
  sessions: null,
  recent_actions: [auditLog()],
  security_events: null,
  ...overrides,
})
