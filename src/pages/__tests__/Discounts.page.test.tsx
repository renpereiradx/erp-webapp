/**
 * DiscountsPage (F4) — reporte "quién descontó cuánto" con fechas
 * obligatorias, resumen por agrupación y línea con precios unitarios + descuento
 * de línea (sin reconstruir totales).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (
      key: string,
      fallbackOrVars?: string | Record<string, unknown>,
      maybeVars?: Record<string, unknown>,
    ) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars =
        (typeof fallbackOrVars === 'object' && fallbackOrVars !== null
          ? fallbackOrVars
          : maybeVars) ?? {}
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(vars[name] ?? `{${name}}`),
      )
    },
  }),
}))

vi.mock('@/services/bi/salesAnalyticsService', () => ({
  salesAnalyticsService: {
    getDiscounts: vi.fn(),
    getDiscountsSummary: vi.fn(),
  },
}))

import { salesAnalyticsService } from '@/services/bi/salesAnalyticsService'
import { envelope, renderSalesPage } from './salesAnalyticsTestUtils'
import DiscountsPage from '../sales-analytics/DiscountsPage'

const SUMMARY_ROWS = [
  { group_key: 'u1', group_name: 'ADMINISTRADOR ADMINISTRADOR', discount_count: 3, total_discount: 9310 },
]

const LINES = [
  {
    sale_id: 'SALE-1',
    sale_date: '2026-09-16T12:00:00Z',
    branch_id: 1,
    seller_user_id: 'U-1',
    product_id: 'P-1',
    variant_id: null,
    quantity: 1,
    unit_price_original: 70000,
    unit_price: 66780,
    discount_amount: 3220,
    discount_percent: 4.6,
    discount_reason: 'Cliente frecuente',
    discount_applied_by: 'U-1',
    applied_by_name: 'ADMINISTRADOR ADMINISTRADOR',
  },
  {
    sale_id: 'SALE-2',
    sale_date: '2026-09-15T12:00:00Z',
    branch_id: 1,
    seller_user_id: 'U-1',
    product_id: 'P-2',
    variant_id: null,
    quantity: 2,
    unit_price_original: 5000,
    unit_price: 4500,
    discount_amount: 1000,
    discount_percent: null,
    discount_reason: null,
    discount_applied_by: 'U-2',
    applied_by_name: 'CAJERO',
  },
]

describe('DiscountsPage (F4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(salesAnalyticsService.getDiscountsSummary).mockResolvedValue(
      envelope(SUMMARY_ROWS, { total: 1, group_by: 'applier' }) as never,
    )
    vi.mocked(salesAnalyticsService.getDiscounts).mockResolvedValue(
      envelope(LINES, { total_count: 12, start_date: '2026-09-20', end_date: '2026-10-21' }) as never,
    )
  })

  it('pide el rango de fechas y agrupa por aplicador por defecto', async () => {
    renderSalesPage(<DiscountsPage />)

    await waitFor(() => expect(salesAnalyticsService.getDiscounts).toHaveBeenCalled())
    expect(salesAnalyticsService.getDiscounts).toHaveBeenCalledWith({
      start_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      end_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      page: 1,
      page_size: 10,
    })
    expect(salesAnalyticsService.getDiscountsSummary).toHaveBeenCalledWith({
      start_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      end_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      group_by: 'applier',
    })
  })

  it('muestra el resumen con total derivado y la participación por grupo', async () => {
    renderSalesPage(<DiscountsPage />)

    await waitFor(() =>
      expect(screen.getByTestId('discounts-summary')).toHaveTextContent(
        'ADMINISTRADOR ADMINISTRADOR',
      ),
    )
    const summary = screen.getByTestId('discounts-summary')
    expect(summary).toHaveTextContent('Gs. 9.310')
    expect(summary).toHaveTextContent('100%')
    expect(summary).toHaveTextContent('Descuentos registrados: 3')
  })

  it('muestra las líneas con precios unitarios y descuento de línea', async () => {
    renderSalesPage(<DiscountsPage />)

    await waitFor(() => expect(screen.getByTestId('discounts-table')).toBeInTheDocument())
    const table = screen.getByTestId('discounts-table')
    expect(table).toHaveTextContent('SALE-1')
    expect(table).toHaveTextContent('P-1')
    expect(table).toHaveTextContent('Gs. 70.000')
    expect(table).toHaveTextContent('Gs. 66.780')
    expect(table).toHaveTextContent('Gs. 3.220')
    expect(table).toHaveTextContent('4,6%')
    expect(table).toHaveTextContent('Cliente frecuente')
    expect(table).toHaveTextContent('ADMINISTRADOR ADMINISTRADOR')
    // null → —, nunca una celda vacía o un cero.
    expect(table).toHaveTextContent('—')
    expect(
      screen.getByText(
        'Los precios son unitarios; el descuento corresponde a la línea completa.',
      ),
    ).toBeInTheDocument()
  })

  it('pagina con el total_count del metadata y no con las filas visibles', async () => {
    const user = userEvent.setup()
    renderSalesPage(<DiscountsPage />)

    await waitFor(() => expect(screen.getByTestId('discounts-table')).toBeInTheDocument())
    expect(screen.getByText(/Página 1 de 2 \(12 items\)/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    await waitFor(() =>
      expect(salesAnalyticsService.getDiscounts).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    )
  })

  it('cambiar la agrupación refetchea solo el resumen', async () => {
    const user = userEvent.setup()
    renderSalesPage(<DiscountsPage />)

    await waitFor(() => expect(salesAnalyticsService.getDiscountsSummary).toHaveBeenCalled())
    const linesCalls = vi.mocked(salesAnalyticsService.getDiscounts).mock.calls.length

    await user.click(screen.getByRole('tab', { name: 'Por vendedor' }))

    await waitFor(() =>
      expect(salesAnalyticsService.getDiscountsSummary).toHaveBeenLastCalledWith(
        expect.objectContaining({ group_by: 'seller' }),
      ),
    )
    expect(vi.mocked(salesAnalyticsService.getDiscounts).mock.calls.length).toBe(linesCalls)
  })

  it('un rango invertido se avisa y no se aplica', async () => {
    const user = userEvent.setup()
    renderSalesPage(<DiscountsPage />)

    await waitFor(() => expect(salesAnalyticsService.getDiscounts).toHaveBeenCalled())
    const callsBefore = vi.mocked(salesAnalyticsService.getDiscounts).mock.calls.length

    fireEvent.change(document.getElementById('discounts-start') as HTMLInputElement, {
      target: { value: '2026-10-10' },
    })
    fireEvent.change(document.getElementById('discounts-end') as HTMLInputElement, {
      target: { value: '2026-10-01' },
    })

    expect(
      screen.getByText('La fecha "Desde" debe ser válida y no posterior a "Hasta".'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(vi.mocked(salesAnalyticsService.getDiscounts).mock.calls.length).toBe(callsBefore)
  })
})
