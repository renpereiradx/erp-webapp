/**
 * F8 — Proyección de flujo de caja: KPIs reales, cobertura derivada, días con
 * movimiento y ausencia total de saldos bancarios inventados.
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

vi.mock('@/services/bi/payablesService', () => ({
  payablesService: {
    getOverview: vi.fn(),
    getList: vi.fn(),
    getById: vi.fn(),
    getTopSuppliers: vi.fn(),
    getSchedule: vi.fn(),
    getAgingReport: vi.fn(),
    getStatistics: vi.fn(),
    getCashFlowProjection: vi.fn(),
    getSupplierAnalysis: vi.fn(),
  },
}))

import { payablesService } from '@/services/bi/payablesService'
import { cashFlow, payablesEnvelope, renderPayablesPage } from './payablesTestUtils'
import CashFlowProjectionPage from '../payables/CashFlowProjectionPage'

const kpi = (id: string) => within(screen.getByTestId(`payables-kpi-${id}`))

describe('CashFlowProjectionPage (F8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(payablesService.getCashFlowProjection).mockResolvedValue(
      payablesEnvelope(cashFlow()) as never,
    )
  })

  it('muestra los totales reales de cobros, pagos, neto y acumulado', async () => {
    renderPayablesPage(<CashFlowProjectionPage />, { route: '/payables/cash-flow' })
    await screen.findByTestId('payables-kpi-inflows')

    expect(kpi('inflows').getByText('Gs. 616.380')).toBeInTheDocument()
    expect(kpi('outflows').getByText('Gs. 1.000')).toBeInTheDocument()
    expect(kpi('netFlow').getByText('Gs. 615.380')).toBeInTheDocument()
    expect(kpi('cumulative').getByText('Gs. 615.380')).toBeInTheDocument()
  })

  it('deriva la cobertura con los umbrales del BE', async () => {
    renderPayablesPage(<CashFlowProjectionPage />, { route: '/payables/cash-flow' })
    await screen.findByTestId('payables-coverage-panel')

    expect(screen.getByText('616,38× (61.638%)')).toBeInTheDocument()
    expect(screen.getByTestId('payables-coverage-healthy')).toHaveTextContent(
      'Cobertura suficiente',
    )
  })

  it('sin pagos esperados la cobertura es — y no hay badge', async () => {
    vi.mocked(payablesService.getCashFlowProjection).mockResolvedValue(
      payablesEnvelope(cashFlow({ expected_outflows: 0 })) as never,
    )
    renderPayablesPage(<CashFlowProjectionPage />, { route: '/payables/cash-flow' })
    await screen.findByTestId('payables-coverage-panel')

    expect(screen.queryByTestId('payables-coverage-healthy')).toBeNull()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('lista solo los días con movimiento y respeta el orden', async () => {
    renderPayablesPage(<CashFlowProjectionPage />, { route: '/payables/cash-flow' })
    const table = await screen.findByTestId('payables-cash-flow-table')

    expect(within(table).getByText('21 oct')).toBeInTheDocument()
    expect(within(table).getByText('22 oct')).toBeInTheDocument()
    expect(within(table).getAllByText('-Gs. 1.000')).toHaveLength(2)
  })

  it('cambia la ventana y consulta el endpoint con los días pedidos', async () => {
    renderPayablesPage(<CashFlowProjectionPage />, { route: '/payables/cash-flow' })
    await screen.findByTestId('payables-cash-flow-table')

    fireEvent.click(screen.getByText('90 días'))
    await waitFor(() =>
      expect(payablesService.getCashFlowProjection).toHaveBeenLastCalledWith(90),
    )
  })

  it('no muestra bancos, insights ni ceros inventados', async () => {
    renderPayablesPage(<CashFlowProjectionPage />, { route: '/payables/cash-flow' })
    await screen.findByTestId('payables-cash-flow-table')

    for (const claim of ['Itaú', 'Sudameris', 'Continental', 'potencial de ahorro', 'Insights']) {
      expect(screen.queryByText(new RegExp(claim, 'i'))).toBeNull()
    }
    expect(screen.queryByText(/\$/)).toBeNull()
  })
})
