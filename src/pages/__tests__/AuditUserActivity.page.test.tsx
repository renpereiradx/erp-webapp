/**
 * F10 — Ficha de actividad de usuario: KPIs del período, categorías, días
 * re-derivados, últimos eventos sin columna de usuario, empty honesto y
 * ausencia de secciones que el contrato nunca completa.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (
      key: string,
      fallbackOrVars?: string | Record<string, unknown>,
      maybeVars?: Record<string, unknown>,
    ) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      if (!fallback) return key
      const vars =
        (typeof fallbackOrVars === 'object' && fallbackOrVars !== null
          ? fallbackOrVars
          : maybeVars) ?? {}
      return fallback.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(vars[name] ?? `{${name}}`),
      )
    },
  }),
}))

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
  auditEnvelope,
  auditUserActivity as activityFixture,
  renderAuditPage,
} from './auditTestUtils'
import AuditUserActivityPage from '../audit/AuditUserActivityPage'

const renderActivity = () =>
  renderAuditPage(<AuditUserActivityPage />, {
    route: '/auditoria/usuarios/jJkV4F6HR',
    path: '/auditoria/usuarios/:id',
  })

const kpi = (id: string) => within(screen.getByTestId(`audit-kpi-${id}`))

describe('AuditUserActivityPage (F10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auditService.getUserActivity).mockResolvedValue(
      auditEnvelope(activityFixture()) as never,
    )
  })

  it('consulta el mes por defecto y muestra los KPIs del usuario', async () => {
    renderActivity()
    await screen.findByTestId('audit-user-kpis')

    expect(auditService.getUserActivity).toHaveBeenCalledWith('jJkV4F6HR', 'month')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('admin')
    expect(kpi('totalActions').getByText('163')).toBeInTheDocument()
    expect(kpi('successfulActions').getByText('153')).toBeInTheDocument()
    expect(kpi('failedActions').getByText('10')).toBeInTheDocument()
    expect(kpi('successRate').getByText('93,9%')).toBeInTheDocument()
    expect(kpi('uniqueCategories').getByText('8')).toBeInTheDocument()
    expect(kpi('uniqueSessions').getByText('9')).toBeInTheDocument()
    expect(kpi('avgPerDay').getByText('0,45')).toBeInTheDocument()
    expect(
      kpi('avgPerDay').getByText('Total de acciones dividido los días del período'),
    ).toBeInTheDocument()
    expect(kpi('lastActivity').getByText(/2026/)).toBeInTheDocument()
  })

  it('categorías traducidas y días re-derivados (no el label inglés)', async () => {
    const { container } = renderActivity()
    const categories = await screen.findByTestId('audit-user-category-table')

    expect(within(categories).getByText('Histórico')).toBeInTheDocument()
    expect(within(categories).getByText('Ventas')).toBeInTheDocument()
    expect(within(categories).getByText('57,7%')).toBeInTheDocument()

    expect(screen.getByTestId('audit-user-days-chart-bar-0')).toHaveAttribute(
      'aria-label',
      '21 abr: 56 acciones · 0 fallos',
    )
    expect(container.textContent).not.toContain('21 Apr')
  })

  it('los últimos eventos no repiten la columna de usuario y linkean al detalle', async () => {
    renderActivity()
    const recent = await screen.findByTestId('audit-user-recent-table')

    expect(within(recent).getByRole('link', { name: 'Ver evento 27088' })).toHaveAttribute(
      'href',
      '/auditoria/logs/27088',
    )
    expect(within(recent).queryByRole('link', { name: 'admin' })).toBeNull()
    expect(recent.textContent).not.toContain('Usuario')
  })

  it('cambiar el período consulta la semana móvil', async () => {
    renderActivity()
    await screen.findByTestId('audit-user-kpis')
    vi.mocked(auditService.getUserActivity).mockClear()

    fireEvent.click(screen.getByText('Últimos 7 días'))
    await waitFor(() =>
      expect(auditService.getUserActivity).toHaveBeenLastCalledWith(
        'jJkV4F6HR',
        'week',
      ),
    )
  })

  it('sin actividad: estado honesto único, sin KPIs en cero', async () => {
    vi.mocked(auditService.getUserActivity).mockResolvedValue(
      auditEnvelope(
        activityFixture({
          username: '',
          summary: {
            user_id: 'jJkV4F6HR',
            username: '',
            total_actions: 0,
            successful_actions: 0,
            failed_actions: 0,
            unique_categories: 0,
            unique_sessions: 0,
            last_activity: '0001-01-01T00:00:00Z',
            avg_actions_per_day: 0,
          },
          actions_by_category: null,
          actions_by_day: null,
          recent_actions: null,
        }),
      ) as never,
    )

    renderActivity()
    expect(await screen.findByTestId('audit-user-empty')).toBeInTheDocument()
    expect(screen.getByText('Sin actividad registrada')).toBeInTheDocument()
    expect(screen.queryByTestId('audit-user-kpis')).toBeNull()
    expect(screen.queryByTestId('audit-user-days-chart')).toBeNull()
    // Sin username, el título cae al id de la ruta.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('jJkV4F6HR')
  })

  it('no inventa secciones de sesiones ni eventos de seguridad (contrato nulo)', async () => {
    renderActivity()
    await screen.findByTestId('audit-user-kpis')

    expect(screen.queryByRole('heading', { name: /Sesiones registradas/i })).toBeNull()
    expect(screen.queryByRole('heading', { name: /Eventos de seguridad/i })).toBeNull()
    expect(screen.queryByText(/en tiempo real/i)).toBeNull()
  })

  it('error del endpoint: ErrorState con retry', async () => {
    vi.mocked(auditService.getUserActivity)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(auditEnvelope(activityFixture()) as never)

    renderActivity()
    await screen.findByTestId('error-state')
    fireEvent.click(screen.getByTestId('error-retry'))
    expect(await screen.findByTestId('audit-user-kpis')).toBeInTheDocument()
  })
})
