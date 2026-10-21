/**
 * F8 — Reporte de antigüedad: totales globales, distribución por tramos,
 * desglose por proveedor con riesgo y paginación server-side.
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
import { agingReport, payablesEnvelope, renderPayablesPage } from './payablesTestUtils'
import PayablesAgingReportPage from '../payables/PayablesAgingReportPage'

const kpi = (id: string) => within(screen.getByTestId(`payables-kpi-${id}`))

describe('PayablesAgingReportPage (F8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(payablesService.getAgingReport).mockResolvedValue(
      payablesEnvelope(agingReport()) as never,
    )
  })

  it('muestra los totales globales y la fecha de generación', async () => {
    renderPayablesPage(<PayablesAgingReportPage />, { route: '/payables/aging-report' })
    await screen.findByTestId('payables-kpi-agingTotal')

    expect(kpi('agingTotal').getByText('Gs. 6.414.250')).toBeInTheDocument()
    expect(kpi('agingSuppliers').getByText('4')).toBeInTheDocument()
    expect(kpi('agingOver90').getByText('Gs. 3.509.450')).toBeInTheDocument()
    // La suma de tramos coincide con el total: no hay remanente sin clasificar.
    expect(screen.queryByTestId('payables-kpi-agingUnclassified')).toBeNull()
    expect(screen.getByText(/Generado:/)).toBeInTheDocument()
  })

  it('dibuja la distribución con los porcentajes del payload', async () => {
    renderPayablesPage(<PayablesAgingReportPage />, { route: '/payables/aging-report' })
    const panel = await screen.findByTestId('payables-aging-panel')

    expect(within(panel).getByTestId('payables-aging-over_90_days')).toHaveTextContent(
      'Gs. 3.509.450',
    )
    expect(within(panel).getByTestId('payables-aging-over_90_days')).toHaveTextContent('54,7%')
    expect(within(panel).getByTestId('payables-aging-days_30_60')).toHaveTextContent(
      'Gs. 1.000',
    )
    expect(within(panel).getByText('Total en tramos: Gs. 6.414.250')).toBeInTheDocument()
  })

  it('lista proveedores con su riesgo y link al análisis', async () => {
    renderPayablesPage(<PayablesAgingReportPage />, { route: '/payables/aging-report' })
    const table = await screen.findByTestId('payables-aging-table')

    expect(
      within(table).getByRole('link', { name: 'Protek PRO' }),
    ).toHaveAttribute('href', '/payables/suppliers/SP-PROTEK/analysis')
    expect(within(table).getAllByTestId('payables-aging-risk-critical')).toHaveLength(2)
    expect(within(table).getAllByTestId('payables-aging-risk-critical')[0]).toHaveTextContent(
      'Crítico',
    )
    expect(within(table).getAllByTestId('payables-aging-risk-moderate')).toHaveLength(2)
    expect(within(table).getAllByText('Gs. 500.000')).toHaveLength(2)
    expect(screen.getByText('Proveedores en el reporte: 4')).toBeInTheDocument()
  })

  it('pagina con el total global del reporte', async () => {
    vi.mocked(payablesService.getAgingReport).mockResolvedValue(
      payablesEnvelope(agingReport({ total_suppliers: 23 })) as never,
    )
    renderPayablesPage(<PayablesAgingReportPage />, { route: '/payables/aging-report' })
    await screen.findByTestId('payables-aging-table')

    expect(screen.getByText('Página 1 de 3 (23 items)')).toBeInTheDocument()
  })

  it('muestra el error con retry cuando el reporte falla', async () => {
    vi.mocked(payablesService.getAgingReport).mockRejectedValue(new Error('boom'))
    renderPayablesPage(<PayablesAgingReportPage />, { route: '/payables/aging-report' })

    expect(
      (await screen.findAllByText('No se pudieron cargar los datos')).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByTestId('error-retry').length).toBeGreaterThan(0)
  })
})
