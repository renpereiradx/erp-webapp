/**
 * Página #4 (F3) — Comparar proveedores de un producto contra
 * `/purchase-analytics/products/{id}/suppliers`: sort default
 * +last_unit_price, montos en la moneda base que declara cada fila, banner
 * del meta D3 (excluded_other_currency) y pivote al detalle del proveedor.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
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

vi.mock('@/services/variantService', () => ({
  variantService: { getVariantById: vi.fn() },
}))

import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService'
import productService from '@/services/productService'
import { variantService } from '@/services/variantService'
import ProductSuppliersPage from '../purchase-analytics/ProductSuppliersPage'

const suppliersEnvelope = (excluded: number) => ({
  success: true,
  data: {
    rows: [
      {
        supplier_id: 'SUP-1',
        supplier_name: 'Distribuidora Sur',
        supplier_doc: '80012345-6',
        last_unit_price: 5000,
        avg_unit_price: 5250,
        min_unit_price: 4800,
        currency: 'PYG',
        units: 120,
        purchases: 6,
        last_purchase_at: '2026-09-18T10:00:00Z',
      },
    ],
    total: 1,
    page: 1,
    page_size: 10,
    excluded_other_currency: excluded,
  },
})

const renderAt = (path: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path='/purchase-analytics/products/suppliers' element={<ProductSuppliersPage />} />
          <Route
            path='/purchase-analytics/suppliers/top-products'
            element={<div>RUTA_PRODUCTOS_PROVEEDOR</div>}
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('ProductSuppliersPage (F3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(relationalAnalyticsService.getProductSuppliers).mockResolvedValue(
      suppliersEnvelope(0) as never,
    )
    vi.mocked(productService.getById).mockResolvedValue({
      name: 'CAMISETA ADIDAS',
      barcode: '7791',
    } as never)
    vi.mocked(variantService.getVariantById).mockResolvedValue({
      variant_name: 'Rojo M',
    } as never)
  })

  it('fetcha con el sort default +last_unit_price y pinta los precios en PYG', async () => {
    renderAt('/purchase-analytics/products/suppliers?product_id=PRD-1')

    expect(await screen.findByText('Distribuidora Sur')).toBeTruthy()
    expect(relationalAnalyticsService.getProductSuppliers).toHaveBeenCalledWith(
      'PRD-1',
      expect.objectContaining({ sort: '+last_unit_price', page: 1, page_size: 10 }),
    )
    expect(screen.getByText('CAMISETA ADIDAS')).toBeTruthy()
    expect(screen.getAllByText(/Gs\.\s*5\.000/).length).toBeGreaterThan(0)
    expect(screen.queryByText('PYG')).toBeNull()

    const priceHeader = screen.getByRole('columnheader', { name: /Último precio/i })
    expect(priceHeader.getAttribute('aria-sort')).toBe('ascending')
  })

  it('muestra el banner D3 cuando el BE excluyó compras en otra moneda', async () => {
    vi.mocked(relationalAnalyticsService.getProductSuppliers).mockResolvedValue(
      suppliersEnvelope(2) as never,
    )
    renderAt('/purchase-analytics/products/suppliers?product_id=PRD-1')

    const banner = await screen.findByTestId('excluded-other-currency-banner')
    expect(banner.textContent).toContain('2 compras en otra moneda')
  })

  it('sin exclusiones no renderiza el banner', async () => {
    renderAt('/purchase-analytics/products/suppliers?product_id=PRD-1')
    await screen.findByText('Distribuidora Sur')

    expect(screen.queryByTestId('excluded-other-currency-banner')).toBeNull()
  })

  it('el menú por fila pivota a los productos suministrados del proveedor', async () => {
    renderAt('/purchase-analytics/products/suppliers?product_id=PRD-1')
    await screen.findByText('Distribuidora Sur')

    await userEvent.click(screen.getByTestId('drilldown-row-actions'))
    const menu = await screen.findByTestId('drilldown-row-menu')
    expect(within(menu).getByText('Doc: 80012345-6')).toBeTruthy()
    await userEvent.click(within(menu).getByTestId('drilldown-row-action-supplier-top'))

    expect(screen.getByText('RUTA_PRODUCTOS_PROVEEDOR')).toBeTruthy()
  })

  it('sin product_id muestra el picker y no fetcha', () => {
    renderAt('/purchase-analytics/products/suppliers')

    expect(screen.getByText('Elegí Producto para ver el detalle')).toBeTruthy()
    expect(relationalAnalyticsService.getProductSuppliers).not.toHaveBeenCalled()
  })

  it('cambiar de entidad limpia product_id/variant_id y vuelve al picker', async () => {
    renderAt('/purchase-analytics/products/suppliers?product_id=PRD-1&variant_id=VAR-1')
    await screen.findByText('Distribuidora Sur')

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar Producto' }))
    await waitFor(() =>
      expect(screen.getByText('Elegí Producto para ver el detalle')).toBeTruthy(),
    )
  })
})
