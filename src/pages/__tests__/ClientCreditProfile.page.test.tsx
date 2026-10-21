/**
 * F7 — Ficha de crédito: cartera del cliente, riesgo real (nivel/señales),
 * comportamiento oculto sin pagos, antigüedad derivada de la venta y sin
 * `collection_rate` (fórmula del BE que puede superar 100 %).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'

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

vi.mock('@/services/bi/receivablesService', () => ({
  receivablesService: {
    getOverview: vi.fn(),
    getList: vi.fn(),
    getById: vi.fn(),
    getOverdue: vi.fn(),
    getClientReceivables: vi.fn(),
    getClientRisk: vi.fn(),
    getAgingReport: vi.fn(),
    getTopDebtors: vi.fn(),
    getStatistics: vi.fn(),
  },
}))

import { receivablesService } from '@/services/bi/receivablesService'
import {
  clientReceivables,
  clientRisk,
  receivable,
  receivablesEnvelope,
  renderReceivablesPage,
} from './receivablesTestUtils'
import ClientCreditProfilePage from '../receivables/ClientCreditProfilePage'

const kpi = (id: string) => within(screen.getByTestId(`receivables-kpi-${id}`))

const renderClient = () =>
  renderReceivablesPage(<ClientCreditProfilePage />, {
    route: '/receivables/client-profile/CL-ERIKA',
    path: '/receivables/client-profile/:clientId',
  })

describe('ClientCreditProfilePage (F7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(receivablesService.getClientReceivables).mockResolvedValue(
      receivablesEnvelope(clientReceivables()) as never,
    )
    vi.mocked(receivablesService.getClientRisk).mockResolvedValue(
      receivablesEnvelope(clientRisk()) as never,
    )
  })

  it('muestra la cartera del cliente y su antigüedad', async () => {
    renderClient()
    await screen.findByTestId('receivables-kpi-clientPending')

    expect(screen.getByRole('heading', { name: 'Ficha de crédito' })).toBeInTheDocument()
    expect(
      screen.getByText(/Erika Maciel · Cuentas pendientes, riesgo y antigüedad del cliente/),
    ).toBeInTheDocument()
    expect(kpi('clientPending').getByText('Gs. 314.600')).toBeInTheDocument()
    expect(kpi('clientOverdue').getByText('Gs. 314.600')).toBeInTheDocument()
    expect(kpi('clientPendingOrders').getByText('1')).toBeInTheDocument()
    expect(kpi('clientOldest').getByText('01 jun 2026')).toBeInTheDocument()
    expect(kpi('clientMaxAge').getByText('141')).toBeInTheDocument()
    expect(kpi('clientAvgAge').getByText('141')).toBeInTheDocument()
    expect(kpi('clientOver90').getByText('Gs. 314.600')).toBeInTheDocument()
    expect(kpi('clientPayments').getByText('7')).toBeInTheDocument()

    // La antigüedad derivada de sale_date cae en >90 días.
    const aging = screen.getByTestId('receivables-client-aging')
    expect(within(aging).getByTestId('aging-bucket-over_90_days')).toHaveTextContent('Gs. 314.600')
    expect(within(aging).getByTestId('aging-bucket-over_90_days')).toHaveTextContent('100%')
  })

  it('muestra el nivel de riesgo, señales y comportamiento reales', async () => {
    renderClient()
    const risk = await screen.findByTestId('receivables-risk')

    expect(within(risk).getByTestId('receivables-risk-level')).toHaveTextContent('Riesgo alto')
    expect(within(risk).getByTestId('receivables-risk-ratio')).toHaveTextContent('100%')
    expect(within(risk).getByTestId('receivables-risk-behavior')).toHaveTextContent('Excelente')
    expect(within(risk).getByTestId('receivables-risk-signal-over90Debt')).toBeInTheDocument()
    expect(within(risk).getByTestId('receivables-risk-signal-ratioOver50')).toBeInTheDocument()
    expect(within(risk).getByTestId('receivables-risk-signal-ratioOver30')).toBeInTheDocument()
    expect(within(risk).getByTestId('receivables-risk-signal-maxAgeOver60')).toBeInTheDocument()
  })

  it('sin pagos oculta el comportamiento y el promedio (0 del BE no es dato)', async () => {
    vi.mocked(receivablesService.getClientRisk).mockResolvedValue(
      receivablesEnvelope(clientRisk({ total_payments: 0, payment_behavior: 'EXCELLENT' })) as never,
    )
    renderClient()
    await screen.findByTestId('receivables-risk')

    const risk = screen.getByTestId('receivables-risk')
    expect(within(risk).getByText('Sin pagos registrados')).toBeInTheDocument()
    expect(within(risk).queryByText('Excelente')).toBeNull()
    expect(kpi('clientAvgDaysToPay').getByText('—')).toBeInTheDocument()
  })

  it('no muestra collection_rate del riesgo (puede superar 100 %)', async () => {
    renderClient()
    await screen.findByTestId('receivables-risk')
    const body = document.body.textContent ?? ''

    expect(body).not.toContain('286,9')
    expect(body).not.toContain('286.9')
  })

  it('lista las cuentas pendientes con link al detalle', async () => {
    renderClient()
    const table = await screen.findByTestId('receivables-client-accounts')

    expect(within(table).getByText('SALE-1780338284-194')).toBeInTheDocument()
    expect(within(table).getByText('111')).toBeInTheDocument()
    expect(within(table).getByText('Alta')).toBeInTheDocument()
  })

  it('avisa cuando el endpoint capa la lista de cuentas a 100', async () => {
    vi.mocked(receivablesService.getClientReceivables).mockResolvedValue(
      receivablesEnvelope(
        clientReceivables({ pending_count: 150, receivables: [receivable()] }),
      ) as never,
    )
    renderClient()

    expect(await screen.findByText('Se muestran 1 de 150 cuentas pendientes.')).toBeInTheDocument()
  })

  it('un 404 del backend se muestra como "Cliente no encontrado"', async () => {
    vi.mocked(receivablesService.getClientReceivables).mockRejectedValue({
      code: 'NOT_FOUND',
      status: 404,
    })
    renderClient()

    expect(await screen.findByText('Cliente no encontrado')).toBeInTheDocument()
    expect(
      screen.getByText('El cliente no existe o no pertenece a la sucursal activa.'),
    ).toBeInTheDocument()
  })

  it('un error genérico muestra ErrorState con reintento', async () => {
    vi.mocked(receivablesService.getClientRisk).mockRejectedValue(new Error('risk caído'))
    renderClient()

    expect((await screen.findAllByText('risk caído')).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('error-retry').length).toBeGreaterThan(0)
  })

  it('no fabrica score, límite de crédito ni claims', async () => {
    renderClient()
    await screen.findByTestId('receivables-risk')
    const body = document.body.textContent ?? ''

    expect(body).not.toMatch(/\$/)
    expect(body).not.toMatch(/en tiempo real/i)
    expect(body).not.toMatch(/score/i)
    expect(body).not.toMatch(/límite de crédito/i)
    expect(body).not.toMatch(/NaN/)
    expect(body).not.toContain('314600')
  })
})
