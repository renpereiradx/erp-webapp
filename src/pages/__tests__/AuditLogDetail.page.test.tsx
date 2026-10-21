/**
 * F10 — Detalle de evento de auditoría: campos del contrato real, links a la
 * ficha de usuario, JSONB de cambios, 404 como estado propio y ausencia de
 * datos fabricados (correlation-id/método/endpoint inventados del legacy).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'

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
  auditLog as logFixture,
  legacyLog as legacyFixture,
  renderAuditPage,
} from './auditTestUtils'
import AuditLogDetailPage from '../audit/AuditLogDetailPage'

const renderDetail = (id = '27088') =>
  renderAuditPage(<AuditLogDetailPage />, {
    route: `/auditoria/logs/${id}`,
    path: '/auditoria/logs/:id',
  })

describe('AuditLogDetailPage (F10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auditService.getLogById).mockResolvedValue(
      auditEnvelope(logFixture()) as never,
    )
  })

  it('muestra evento, contexto, solicitud HTTP, entidad y metadata', async () => {
    renderDetail()
    const event = await screen.findByTestId('audit-detail-event')

    expect(auditService.getLogById).toHaveBeenCalledWith('27088')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Evento #27088')
    expect(within(event).getByText('Ventas')).toBeInTheDocument()
    expect(within(event).getByText('Creación')).toBeInTheDocument()
    expect(within(event).getByText('Informativo')).toBeInTheDocument()
    expect(within(event).getByText('Éxito')).toBeInTheDocument()
    expect(within(event).getByText('POST /sale/pos-checkout')).toBeInTheDocument()

    const context = screen.getByTestId('audit-detail-context')
    const userLink = within(context).getByRole('link', { name: 'admin' })
    expect(userLink).toHaveAttribute('href', '/auditoria/usuarios/jJkV4F6HR')
    expect(within(context).getByText('1379')).toBeInTheDocument()
    expect(within(context).getByText('::1')).toBeInTheDocument()
    expect(within(context).getByText(/Firefox\/157/)).toBeInTheDocument()

    const request = screen.getByTestId('audit-detail-request')
    expect(within(request).getByText('POST')).toBeInTheDocument()
    expect(within(request).getByText('/sale/pos-checkout')).toBeInTheDocument()
    expect(within(request).getByText('201')).toBeInTheDocument()
    expect(within(request).getByText('36 ms')).toBeInTheDocument()

    const entity = screen.getByTestId('audit-detail-entity')
    expect(within(entity).getByText('SALE')).toBeInTheDocument()
    expect(within(entity).getByText('SALE-1789393146-771')).toBeInTheDocument()

    const metadata = screen.getByTestId('audit-detail-metadata')
    expect(metadata.textContent).toContain('"request_id": "37e9bf2c"')
    // Sin old/new values no se inventa un diff vacío.
    expect(screen.queryByTestId('audit-detail-old-values')).toBeNull()
    expect(screen.queryByTestId('audit-detail-new-values')).toBeNull()
  })

  it('fila legacy: código crudo en entidad, diffs old/new y sin tarjeta HTTP', async () => {
    vi.mocked(auditService.getLogById).mockResolvedValue(
      auditEnvelope(legacyFixture()) as never,
    )
    renderDetail('12891')

    const event = await screen.findByTestId('audit-detail-event')
    expect(within(event).getByText('Histórico')).toBeInTheDocument()
    expect(within(event).getByText('Alta (histórico)')).toBeInTheDocument()

    const oldValues = screen.getByTestId('audit-detail-old-values')
    expect(oldValues.textContent).toContain('"status": "COMPLETED"')
    const newValues = screen.getByTestId('audit-detail-new-values')
    expect(newValues.textContent).toContain('"status": "REFUNDED"')
    const metadata = screen.getByTestId('audit-detail-metadata')
    expect(metadata.textContent).toContain('"source": "legacy_backfill"')

    expect(screen.queryByTestId('audit-detail-request')).toBeNull()
    expect(screen.queryByText(/correlation/i)).toBeNull()
    expect(screen.queryByText(/f9a2-55d1/)).toBeNull()
  })

  it('success=false muestra el fallo y el mensaje de error real', async () => {
    vi.mocked(auditService.getLogById).mockResolvedValue(
      auditEnvelope(
        logFixture({ success: false, level: 'ERROR', error_message: 'stock insuficiente' }),
      ) as never,
    )
    renderDetail()

    const event = await screen.findByTestId('audit-detail-event')
    expect(within(event).getByText('Fallo')).toBeInTheDocument()
    expect(within(event).getByText('Error')).toBeInTheDocument()
    expect(within(event).getByText('stock insuficiente')).toBeInTheDocument()
  })

  it('404 del BE: estado "evento no encontrado" con vuelta al registro', async () => {
    vi.mocked(auditService.getLogById).mockRejectedValue({ status: 404 })
    renderDetail('999')

    expect(await screen.findByTestId('audit-detail-not-found')).toBeInTheDocument()
    expect(screen.getByText('Evento no encontrado')).toBeInTheDocument()
    expect(screen.getByText(/El evento 999 no existe/)).toBeInTheDocument()
    expect(screen.getByTestId('audit-detail-back')).toBeInTheDocument()
    expect(screen.queryByTestId('error-state')).toBeNull()
  })

  it('sin id en la ruta: no consulta y explica el estado', async () => {
    renderAuditPage(<AuditLogDetailPage />, { route: '/auditoria/logs' })

    expect(await screen.findByTestId('audit-detail-not-found')).toBeInTheDocument()
    expect(screen.getByText(/no está presente en la ruta/)).toBeInTheDocument()
    expect(auditService.getLogById).not.toHaveBeenCalled()
  })

  it('error genérico: ErrorState con retry', async () => {
    vi.mocked(auditService.getLogById)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(auditEnvelope(logFixture()) as never)
    renderDetail()

    await screen.findByTestId('error-state')
    fireEvent.click(screen.getByTestId('error-retry'))
    expect(await screen.findByTestId('audit-detail-event')).toBeInTheDocument()
  })
})
