/**
 * F10 — hooks de Auditoría: params por endpoint, normalización de slices nil
 * y fallo cuando falta `data`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/bi/auditService', () => ({
  auditService: {
    getDashboard: vi.fn(),
    getLogs: vi.fn(),
    getLogById: vi.fn(),
    getUserActivity: vi.fn(),
    exportLogs: vi.fn(),
  },
}))

import { auditService } from '@/services/bi/auditService'
import {
  useAuditDashboard,
  useAuditLog,
  useAuditLogs,
  useAuditUserActivity,
} from '../hooks/useAuditQueries'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

describe('hooks de Auditoría (F10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dashboard: período + normalización de los slices null de Go', async () => {
    vi.mocked(auditService.getDashboard).mockResolvedValue(
      envelope({
        kpis: { total_actions: 0 },
        actions_by_category: null,
        actions_by_type: null,
        top_users: null,
        recent_activity: null,
        trends: null,
        security_alerts: null,
        error_summary: null,
      }) as never,
    )

    const { result } = renderHook(() => useAuditDashboard('year'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(auditService.getDashboard).toHaveBeenCalledWith('year')
    expect(result.current.data?.trends).toEqual([])
    expect(result.current.data?.security_alerts).toEqual([])
    expect(result.current.data?.error_summary).toEqual([])
    expect(result.current.data?.recent_activity).toEqual([])
    expect(result.current.data?.top_users).toEqual([])
  })

  it('dashboard: falla si el endpoint no trae data', async () => {
    vi.mocked(auditService.getDashboard).mockResolvedValue({ success: true } as never)
    const { result } = renderHook(() => useAuditDashboard('month'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('logs: envía el contrato y normaliza logs null', async () => {
    vi.mocked(auditService.getLogs).mockResolvedValue(
      envelope({ logs: null, total: 0, page: 1, page_size: 10, total_pages: 0 }) as never,
    )
    const params = {
      start_date: '2026-09-22',
      end_date: '2026-10-21',
      page: 1,
      page_size: 10,
    }
    const { result } = renderHook(() => useAuditLogs(params), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(auditService.getLogs).toHaveBeenCalledWith(params)
    expect(result.current.data?.logs).toEqual([])
    expect(result.current.data?.totalPages).toBe(0)
  })

  it('logs: deshabilitado no consulta (rango incompleto)', async () => {
    const { result } = renderHook(
      () => useAuditLogs({ start_date: '2026-09-22' }, { enabled: false }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(auditService.getLogs).not.toHaveBeenCalled()
  })

  it('detalle: no consulta sin id y sí con id', async () => {
    const empty = renderHook(() => useAuditLog(''), { wrapper: createWrapper() })
    await waitFor(() => expect(empty.result.current.fetchStatus).toBe('idle'))
    expect(auditService.getLogById).not.toHaveBeenCalled()

    vi.mocked(auditService.getLogById).mockResolvedValue(
      envelope({ id: 27088, description: 'POST /sale/pos-checkout' }) as never,
    )
    const detail = renderHook(() => useAuditLog('27088'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(detail.result.current.isSuccess).toBe(true))
    expect(auditService.getLogById).toHaveBeenCalledWith('27088')
  })

  it('actividad: período + normalización de collections no pobladas', async () => {
    vi.mocked(auditService.getUserActivity).mockResolvedValue(
      envelope({
        summary: { total_actions: 0 },
        actions_by_category: null,
        actions_by_day: null,
        sessions: null,
        recent_actions: null,
        security_events: null,
      }) as never,
    )
    const { result } = renderHook(() => useAuditUserActivity('user-1', 'week'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(auditService.getUserActivity).toHaveBeenCalledWith('user-1', 'week')
    expect(result.current.data?.actions_by_category).toEqual([])
    expect(result.current.data?.actions_by_day).toEqual([])
    expect(result.current.data?.recent_actions).toEqual([])
    expect(result.current.data?.sessions).toEqual([])
    expect(result.current.data?.security_events).toEqual([])
  })

  it('actividad: falla si el endpoint no trae data', async () => {
    vi.mocked(auditService.getUserActivity).mockResolvedValue({ success: true } as never)
    const { result } = renderHook(() => useAuditUserActivity('user-1', 'month'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
