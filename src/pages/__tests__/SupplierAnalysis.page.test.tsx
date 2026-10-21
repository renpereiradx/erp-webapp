/**
 * F8 — Análisis de proveedor: campos reales del endpoint (share, importance,
 * comportamiento, credit_terms del BE), facturas pendientes y 404 propio.
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
import {
  payablesEnvelope,
  payablesList,
  renderPayablesPage,
  supplierAnalysis,
} from './payablesTestUtils'
import SupplierAnalysisPage from '../payables/SupplierAnalysisPage'

const route = {
  route: '/payables/suppliers/SP-PROTEK/analysis',
  path: '/payables/suppliers/:id/analysis',
}

const kpi = (id: string) => within(screen.getByTestId(`payables-kpi-${id}`))

describe('SupplierAnalysisPage (F8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(payablesService.getSupplierAnalysis).mockResolvedValue(
      payablesEnvelope(supplierAnalysis()) as never,
    )
    vi.mocked(payablesService.getList).mockResolvedValue(
      payablesEnvelope(payablesList()) as never,
    )
  })

  it('muestra el resumen real del proveedor y su peso en CxP', async () => {
    renderPayablesPage(<SupplierAnalysisPage />, route)
    await screen.findByTestId('payables-kpi-supplierPending')

    expect(screen.getByRole('heading', { name: 'Protek PRO' })).toBeInTheDocument()
    expect(kpi('supplierPending').getByText('Gs. 500.000')).toBeInTheDocument()
    expect(kpi('supplierOverdue').getByText('Gs. 500.000')).toBeInTheDocument()
    expect(kpi('supplierPendingCount').getByText('1')).toBeInTheDocument()
    expect(kpi('supplierShare').getByText('8,3%')).toBeInTheDocument()
    expect(kpi('supplierAvgDays').getByText('15')).toBeInTheDocument()
  })

  it('traduce comportamiento e importancia sin mostrar el código crudo', async () => {
    renderPayablesPage(<SupplierAnalysisPage />, route)
    await screen.findByText('Excelente')
    const terms = screen.getByTestId('payables-supplier-terms')

    expect(within(terms).getByText('Excelente')).toBeInTheDocument()
    expect(within(terms).getByText('Medio')).toBeInTheDocument()
    expect(within(terms).getByText('100%')).toBeInTheDocument()
    expect(within(terms).getByText('30 días')).toBeInTheDocument()
    expect(within(terms).getByText(/hace \d+ días/)).toBeInTheDocument()
    expect(within(terms).queryByText('EXCELLENT')).toBeNull()
    expect(within(terms).queryByText('MEDIUM')).toBeNull()
  })

  it('lista las facturas pendientes con link al detalle', async () => {
    renderPayablesPage(<SupplierAnalysisPage />, route)
    const table = await screen.findByTestId('payables-supplier-invoices')

    expect(within(table).getByRole('link', { name: 'PO-2' })).toHaveAttribute(
      'href',
      '/payables/detail/PO-2',
    )
    expect(within(table).getByText('Vencida')).toBeInTheDocument()
  })

  it('el 404 del proveedor es un estado propio', async () => {
    vi.mocked(payablesService.getSupplierAnalysis).mockRejectedValue({ status: 404 })
    renderPayablesPage(<SupplierAnalysisPage />, route)

    expect(await screen.findByText('Proveedor no encontrado')).toBeInTheDocument()
    expect(screen.queryByText('No se pudieron cargar los datos')).toBeNull()
  })

  it('no fabrica límite de crédito ni tendencias inventadas', async () => {
    renderPayablesPage(<SupplierAnalysisPage />, route)
    await screen.findByTestId('payables-supplier-kpis')

    for (const claim of ['límite de crédito', 'credit limit', 'Tendencia']) {
      expect(screen.queryByText(new RegExp(claim, 'i'))).toBeNull()
    }
    expect(screen.queryAllByText(/\b(ENE|FEB|MAR)\b/)).toHaveLength(0)
  })
})
