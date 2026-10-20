/**
 * Página #1 (F3) — Compradores de un producto contra
 * `/sales-analytics/products/{id}/buyers`: picker sin entidad, contrato de
 * params (sort default -total, page_size 10), draft-vs-aplicado, sort,
 * error/retry, menú por fila (pivote + copiar) y picker con variante.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (key: string, fallbackOrVars?: string | Record<string, unknown>, maybeVars?: Record<string, unknown>) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : key
      const vars =
        (typeof fallbackOrVars === 'object' && fallbackOrVars !== null ? fallbackOrVars : maybeVars) ?? {}
      return fallback.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
    },
  }),
}))

vi.mock('@/services/bi/relationalAnalyticsService', () => ({
  relationalAnalyticsService: {
    getProductBuyers: vi.fn(),
    getCustomerTopProducts: vi.fn(),
    getSupplierTopProducts: vi.fn(),
    getProductSuppliers: vi.fn(),
  },
}))

vi.mock('@/services/productService', () => {
  const productService = { getById: vi.fn(), searchAdvanced: vi.fn(), searchInfo: vi.fn() }
  return { default: productService, productService }
})

vi.mock('@/services/clientService', () => {
  const clientService = { getById: vi.fn(), searchByName: vi.fn() }
  return { default: clientService, clientService }
})

vi.mock('@/services/variantService', () => ({
  variantService: { getVariantById: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService'
import productService from '@/services/productService'
import clientService from '@/services/clientService'
import { variantService } from '@/services/variantService'
import { toast } from 'sonner'
import ProductBuyersPage from '../sales-analytics/ProductBuyersPage'
import CustomerTopProductsPage from '../sales-analytics/CustomerTopProductsPage'

const BUYERS_ENVELOPE = {
  success: true,
  data: {
    rows: [
      {
        client_id: 'CLI-1',
        client_name: 'Maria Gomez',
        client_doc: '1234567',
        purchases: 3,
        units: 9,
        total: 1_500_000,
        avg_unit_price: 166_667,
        last_purchase_at: '2026-09-20T12:00:00Z',
      },
    ],
    total: 12,
    page: 1,
    page_size: 10,
  },
  metadata: { scope: { consolidated: false } },
}

const CUSTOMER_TOP_ENVELOPE = {
  success: true,
  data: {
    rows: [
      {
        product_id: 'PRD-9',
        product_name: 'Coca-Cola 2L',
        product_sku: 'SKU-COCA-2L',
        purchases: 14,
        units: 60,
        total: 4_500_000,
        avg_unit_price: 75_000,
        last_purchase_at: '2026-09-21T11:00:00Z',
      },
    ],
    total: 1,
    page: 1,
    page_size: 10,
  },
}

const renderAt = (path: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path='/sales-analytics/products/buyers' element={<ProductBuyersPage />} />
          <Route
            path='/sales-analytics/customers/top-products'
            element={<CustomerTopProductsPage />}
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('ProductBuyersPage (F3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(relationalAnalyticsService.getProductBuyers).mockResolvedValue(
      BUYERS_ENVELOPE as never,
    )
    vi.mocked(relationalAnalyticsService.getCustomerTopProducts).mockResolvedValue(
      CUSTOMER_TOP_ENVELOPE as never,
    )
    vi.mocked(productService.getById).mockResolvedValue({
      name: 'CAMISETA ADIDAS',
      barcode: '7791',
    } as never)
    vi.mocked(clientService.getById).mockResolvedValue({
      first_name: 'Maria',
      last_name: 'Gomez',
      document_id: '1234567',
    } as never)
    vi.mocked(variantService.getVariantById).mockResolvedValue({
      variant_name: 'Rojo M',
    } as never)
  })

  it('sin product_id muestra el picker y no fetcha', () => {
    renderAt('/sales-analytics/products/buyers')

    expect(screen.getByText('Elegí Producto para ver el detalle')).toBeTruthy()
    expect(relationalAnalyticsService.getProductBuyers).not.toHaveBeenCalled()
  })

  it('con product_id fetcha el sort default y pinta la tabla + paginación', async () => {
    renderAt('/sales-analytics/products/buyers?product_id=PRD-1')

    expect(await screen.findByText('Maria Gomez')).toBeTruthy()
    expect(relationalAnalyticsService.getProductBuyers).toHaveBeenCalledWith(
      'PRD-1',
      expect.objectContaining({ sort: '-total', page: 1, page_size: 10 }),
    )
    expect(screen.getByText('Gs. 1.500.000')).toBeTruthy()
    expect(screen.getByText('9 uds.')).toBeTruthy()
    expect(screen.getByText('Página 1 de 2 (12 items)')).toBeTruthy()
    // Nombre resuelto contra el endpoint Core, no el id crudo.
    expect(screen.getByText('CAMISETA ADIDAS')).toBeTruthy()
  })

  it('tipear la búsqueda no fetcha; Aplicar sí (draft-vs-applied)', async () => {
    renderAt('/sales-analytics/products/buyers?product_id=PRD-1')
    await screen.findByText('Maria Gomez')
    expect(relationalAnalyticsService.getProductBuyers).toHaveBeenCalledTimes(1)

    await userEvent.type(screen.getByRole('searchbox'), 'gomez')
    expect(relationalAnalyticsService.getProductBuyers).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    await waitFor(() =>
      expect(relationalAnalyticsService.getProductBuyers).toHaveBeenLastCalledWith(
        'PRD-1',
        expect.objectContaining({ q: 'gomez', page: 1 }),
      ),
    )
  })

  it('el encabezado Importe total alterna el sort (+total tras el default -total)', async () => {
    renderAt('/sales-analytics/products/buyers?product_id=PRD-1')
    await screen.findByText('Maria Gomez')

    await userEvent.click(screen.getByRole('button', { name: /^Importe total/ }))
    await waitFor(() =>
      expect(relationalAnalyticsService.getProductBuyers).toHaveBeenLastCalledWith(
        'PRD-1',
        expect.objectContaining({ sort: '+total' }),
      ),
    )
  })

  it('sin resultados muestra el empty del drill-down (no una tabla vacía silenciosa)', async () => {
    vi.mocked(relationalAnalyticsService.getProductBuyers).mockResolvedValue({
      success: true,
      data: { rows: [], total: 0, page: 1, page_size: 10 },
    } as never)

    renderAt('/sales-analytics/products/buyers?product_id=PRD-1')

    expect(
      await screen.findByText('Sin compradores para este producto con los filtros aplicados'),
    ).toBeTruthy()
    expect(screen.getByText('Página 1 de 1 (0 items)')).toBeTruthy()
  })

  it('un rango Desde > Hasta muestra el aviso y no refetchea', async () => {
    renderAt('/sales-analytics/products/buyers?product_id=PRD-1')
    await screen.findByText('Maria Gomez')

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-09-30' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-09-01' } })

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Rango de fechas inválido')
    expect(alert.textContent).toContain('no puede ser posterior')
    // La tabla previa no se muestra mientras el rango es inválido (sin datos
    // viejos rotulados con un filtro que el BE no puede responder).
    expect(screen.queryByText('Maria Gomez')).toBeNull()
  })

  it('error muestra el estado y Reintentar refetcha', async () => {
    vi.mocked(relationalAnalyticsService.getProductBuyers)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(BUYERS_ENVELOPE as never)

    renderAt('/sales-analytics/products/buyers?product_id=PRD-1')

    expect(
      await screen.findByText('No se pudieron cargar los datos'),
    ).toBeTruthy()
    await userEvent.click(screen.getByTestId('error-retry'))
    expect(await screen.findByText('Maria Gomez')).toBeTruthy()
  })

  it('el menú por fila muestra datos de la fila y pivota al análisis del cliente', async () => {
    renderAt('/sales-analytics/products/buyers?product_id=PRD-1')
    await screen.findByText('Maria Gomez')

    await userEvent.click(screen.getByTestId('drilldown-row-actions'))
    const menu = await screen.findByTestId('drilldown-row-menu')
    expect(within(menu).getByText('Doc: 1234567')).toBeTruthy()
    expect(within(menu).getByText(/Gs\. 1\.500\.000 · Compras: 3 · 9 uds\./)).toBeTruthy()

    await userEvent.click(within(menu).getByTestId('drilldown-row-action-customer-top'))
    await waitFor(() =>
      expect(relationalAnalyticsService.getCustomerTopProducts).toHaveBeenCalledWith(
        'CLI-1',
        expect.objectContaining({ sort: '-units', page: 1 }),
      ),
    )
    expect(await screen.findByText('Coca-Cola 2L')).toBeTruthy()
  })

  it('Copiar documento escribe el documento de la fila en el portapapeles', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    renderAt('/sales-analytics/products/buyers?product_id=PRD-1')
    await screen.findByText('Maria Gomez')

    await userEvent.click(screen.getByTestId('drilldown-row-actions'))
    await userEvent.click(screen.getByTestId('drilldown-row-action-copy-doc'))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('1234567'))
    expect(toast.success).toHaveBeenCalledWith('Copiado al portapapeles')
  })

  it('elegir una variante en el picker fetcha con variant_id', async () => {
    vi.mocked(productService.searchAdvanced).mockResolvedValue({
      products: [
        {
          id: 'PRD-1',
          name: 'Camiseta Adidas',
          variant_id: 'VAR-1',
          variant_name: 'Rojo M',
          sku: 'AD-R-M',
          state: true,
        },
      ],
    } as never)

    renderAt('/sales-analytics/products/buyers')

    await userEvent.type(
      screen.getByPlaceholderText('Buscar producto (F2)…'),
      'adidas',
    )
    await userEvent.click(await screen.findByRole('button', { name: /Camiseta Adidas · Rojo M/ }))

    await waitFor(() =>
      expect(relationalAnalyticsService.getProductBuyers).toHaveBeenCalledWith(
        'PRD-1',
        expect.objectContaining({ variant_id: 'VAR-1' }),
      ),
    )
    // El picker reenvía el signal del dropdown al HTTP (DESIGN §13).
    expect(vi.mocked(productService.searchAdvanced).mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('elegir la fila base (sin variante) fetcha solo con product_id', async () => {
    vi.mocked(productService.searchAdvanced).mockResolvedValue({
      products: [
        {
          id: 'PRD-2',
          name: 'Remera Lisa',
          variant_id: null,
          variant_name: null,
          sku: 'REM-1',
          state: true,
        },
      ],
    } as never)

    renderAt('/sales-analytics/products/buyers')
    await userEvent.type(
      screen.getByPlaceholderText('Buscar producto (F2)…'),
      'remera',
    )
    await userEvent.click(await screen.findByRole('button', { name: /Remera Lisa/ }))

    await waitFor(() =>
      expect(relationalAnalyticsService.getProductBuyers).toHaveBeenCalledWith(
        'PRD-2',
        expect.objectContaining({ sort: '-total' }),
      ),
    )
    const lastCall = vi.mocked(relationalAnalyticsService.getProductBuyers).mock.calls.at(-1)
    expect(lastCall?.[1]?.variant_id).toBeUndefined()
  })
})
