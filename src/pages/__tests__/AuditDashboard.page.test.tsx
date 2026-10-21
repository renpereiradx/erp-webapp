/**
 * F10 — Dashboard de Auditoría: KPIs reales, tendencias re-derivadas,
 * categorías/acciones traducidas, alertas sin el message del SQL, top de
 * usuarios, errores, últimos eventos, estados honestos y ausencia de claims
 * fabricados (la auditoría 2026-09 encontró "+12.5%", donut 100% y "Óptimo").
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
  auditDashboard as dashboardFixture,
  auditEnvelope,
  auditKpis,
  renderAuditPage,
} from './auditTestUtils'
import AuditDashboardPage from '../audit/AuditDashboardPage'

const kpi = (id: string) => within(screen.getByTestId(`audit-kpi-${id}`))

describe('AuditDashboardPage (F10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auditService.getDashboard).mockResolvedValue(
      auditEnvelope(dashboardFixture()) as never,
    )
  })

  it('muestra los KPIs reales del período con sus hints', async () => {
    renderAuditPage(<AuditDashboardPage />)
    await screen.findByTestId('audit-dashboard-kpis')

    expect(auditService.getDashboard).toHaveBeenCalledWith('month')
    expect(kpi('totalActions').getByText('180')).toBeInTheDocument()
    expect(kpi('successRate').getByText('94,4%')).toBeInTheDocument()
    expect(kpi('successRate').getByText('Éxitos: 170 de 180')).toBeInTheDocument()
    expect(kpi('failedActions').getByText('10')).toBeInTheDocument()
    expect(kpi('uniqueUsers').getByText('13')).toBeInTheDocument()
    expect(kpi('uniqueUsers').getByText('Promedio: 13,85 por usuario')).toBeInTheDocument()
    expect(kpi('uniqueSessions').getByText('10')).toBeInTheDocument()
    expect(kpi('criticalErrors').getByText('0')).toBeInTheDocument()
    expect(kpi('securityIncidents').getByText('0')).toBeInTheDocument()
    expect(kpi('peakHour').getByText('19:00')).toBeInTheDocument()
    expect(kpi('peakHour').getByText('60 acciones en esa hora')).toBeInTheDocument()
  })

  it('dibuja las tendencias reales con etiquetas re-derivadas, no el label inglés', async () => {
    const { container } = renderAuditPage(<AuditDashboardPage />)
    await screen.findByTestId('audit-trend-chart')

    expect(screen.getByTestId('audit-trend-chart-bar-0')).toHaveAttribute(
      'aria-label',
      '01 oct: 1 acciones · 0 fallos',
    )
    expect(screen.getByTestId('audit-trend-chart-bar-1')).toHaveAttribute(
      'aria-label',
      '20 oct: 6 acciones · 1 fallos',
    )
    expect(container.textContent).not.toContain('01 Oct')
    expect(container.textContent).not.toContain('20 Oct')
  })

  it('traduce categorías (incluida LEGACY) y tipos de acción', async () => {
    renderAuditPage(<AuditDashboardPage />)
    const categories = await screen.findByTestId('audit-category-table')

    expect(within(categories).getByText('Histórico')).toBeInTheDocument()
    expect(within(categories).getByText('Caja')).toBeInTheDocument()
    expect(within(categories).getByText('61,1%')).toBeInTheDocument()
    expect(within(categories).getByText('62,5%')).toBeInTheDocument()

    const actions = screen.getByTestId('audit-action-table')
    expect(within(actions).getByText('Actualización')).toBeInTheDocument()
    expect(within(actions).getByText('Creación')).toBeInTheDocument()
    expect(within(actions).getByText('82,1%')).toBeInTheDocument()
  })

  it('muestra la alerta de seguridad traducida sin el message del servidor', async () => {
    renderAuditPage(<AuditDashboardPage />)
    const alerts = await screen.findByTestId('audit-security-alerts')

    expect(within(alerts).getByText('Intentos de login fallidos')).toBeInTheDocument()
    expect(within(alerts).getByText('Alta')).toBeInTheDocument()
    expect(within(alerts).getByText('12 eventos')).toBeInTheDocument()
    expect(within(alerts).getByRole('link', { name: 'jJkV4F6HR' })).toHaveAttribute(
      'href',
      '/auditoria/usuarios/jJkV4F6HR',
    )
    expect(screen.queryByText('12 intentos de login fallidos')).toBeNull()
  })

  it('enlaza el top de usuarios y los últimos eventos a sus pantallas', async () => {
    renderAuditPage(<AuditDashboardPage />)
    const topUsers = await screen.findByTestId('audit-top-users-table')
    const userLink = within(topUsers).getByRole('link', { name: 'admin' })
    expect(userLink).toHaveAttribute('href', '/auditoria/usuarios/jJkV4F6HR')
    expect(within(topUsers).getByText('93,9%')).toBeInTheDocument()

    const recent = screen.getByTestId('audit-recent-table')
    const eventLink = within(recent).getByRole('link', { name: 'Ver evento 27088' })
    expect(eventLink).toHaveAttribute('href', '/auditoria/logs/27088')

    expect(screen.getByRole('link', { name: 'Ver registro completo' })).toHaveAttribute(
      'href',
      '/auditoria/logs',
    )
  })

  it('los errores agrupados muestran "Sin mensaje" cuando el productor no lo guardó', async () => {
    renderAuditPage(<AuditDashboardPage />)
    const errors = await screen.findByTestId('audit-error-table')
    expect(within(errors).getByText('Sin mensaje')).toBeInTheDocument()
    expect(within(errors).getByText('Caja')).toBeInTheDocument()
    expect(within(errors).getByText('6')).toBeInTheDocument()
  })

  it('no presenta claims fabricados (Óptimo, Live, +12.5%, 12.450)', async () => {
    renderAuditPage(<AuditDashboardPage />)
    await screen.findByTestId('audit-dashboard-kpis')

    expect(screen.queryByText(/Óptimo/i)).toBeNull()
    expect(screen.queryByText(/en tiempo real/i)).toBeNull()
    expect(screen.queryByText(/^Live$/)).toBeNull()
    expect(screen.queryByText(/12[.,]?5\s?%/)).toBeNull()
    expect(screen.queryByText(/12[.,]450/)).toBeNull()
  })

  it('sin acciones: tasa n/d, hora pico — y empties honestos (sin curva)', async () => {
    vi.mocked(auditService.getDashboard).mockResolvedValue(
      auditEnvelope(
        dashboardFixture({
          kpis: auditKpis({
            total_actions: 0,
            successful_actions: 0,
            failed_actions: 0,
            success_rate: 0,
            unique_users: 0,
            unique_sessions: 0,
            avg_actions_per_user: 0,
            avg_actions_per_session: 0,
            peak_hour: 0,
            peak_hour_actions: 0,
          }),
          actions_by_category: [],
          actions_by_type: [],
          top_users: [],
          recent_activity: [],
          trends: [],
          security_alerts: [],
          error_summary: [],
        }),
      ) as never,
    )

    renderAuditPage(<AuditDashboardPage />)
    await screen.findByTestId('audit-dashboard-kpis')

    expect(kpi('successRate').getByText('n/d')).toBeInTheDocument()
    expect(kpi('peakHour').getByText('—')).toBeInTheDocument()
    expect(screen.getByTestId('audit-trend-chart-empty')).toBeInTheDocument()
    expect(screen.getByTestId('audit-security-alerts-empty')).toBeInTheDocument()
    expect(screen.getByTestId('audit-category-table-empty')).toBeInTheDocument()
    expect(screen.getByTestId('audit-recent-table-empty')).toBeInTheDocument()
  })

  it('error del endpoint: estado con retry que vuelve a consultar', async () => {
    vi.mocked(auditService.getDashboard)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(auditEnvelope(dashboardFixture()) as never)

    renderAuditPage(<AuditDashboardPage />)
    await screen.findByTestId('error-state')

    fireEvent.click(screen.getByTestId('error-retry'))
    await waitFor(() => expect(auditService.getDashboard).toHaveBeenCalledTimes(2))
    expect(await screen.findByTestId('audit-dashboard-kpis')).toBeInTheDocument()
  })
})
