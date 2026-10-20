/**
 * Páginas #2/#3 (F3) — Productos que compra un cliente y productos
 * suministrados por un proveedor contra `/sales-analytics/customers/{id}/…`
 * y `/purchase-analytics/suppliers/{id}/…`: sort default -units, UOM base en
 * cantidades, etiqueta de costo en compras y pivotes del menú por fila.
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

vi.mock('@/services/clientService', () => {
  const clientService = { getById: vi.fn(), searchByName: vi.fn() }
  return { default: clientService, clientService }
})

vi.mock('@/services/supplierService', () => {
  const supplierService = { getById: vi.fn(), searchByName: vi.fn() }
  return { default: supplierService, supplierService }
})

import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService'
import clientService from '@/services/clientService'
import supplierService from '@/services/supplierService'
import CustomerTopProductsPage from '../sales-analytics/CustomerTopProductsPage'
import SupplierTopProductsPage from '../purchase-analytics/SupplierTopProductsPage'

const topProductsEnvelope = (row: Record<string, unknown>, total = 1) => ({
  success: true,
  data: { rows: [row], total, page: 1, page_size: 10 },
})

const ROW = {
  product_id: 'PRD-9',
  product_name: 'Coca-Cola 2L',
  product_sku: 'SKU-COCA-2L',
  purchases: 14,
  units: 60,
  total: 4_500_000,
  avg_unit_price: 75_000,
  last_purchase_at: '2026-09-21T11:00:00Z',
}

const renderAt = (path: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route
            path='/sales-analytics/customers/top-products'
            element={<CustomerTopProductsPage />}
          />
          <Route
            path='/purchase-analytics/suppliers/top-products'
            element={<SupplierTopProductsPage />}
          />
          <Route path='/sales-analytics/products/buyers' element={<div>RUTA_COMPRADORES</div>} />
          <Route
            path='/purchase-analytics/products/suppliers'
            element={<div>RUTA_COMPARAR_PROVEEDORES</div>}
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('CustomerTopProductsPage / SupplierTopProductsPage (F3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(relationalAnalyticsService.getCustomerTopProducts).mockResolvedValue(
      topProductsEnvelope(ROW, 4) as never,
    )
    vi.mocked(relationalAnalyticsService.getSupplierTopProducts).mockResolvedValue(
      topProductsEnvelope(ROW) as never,
    )
    vi.mocked(clientService.getById).mockResolvedValue({
      first_name: 'Maria',
      last_name: 'Gomez',
      document_id: '1234567',
    } as never)
    vi.mocked(supplierService.getById).mockResolvedValue({
      name: 'Distribuidora Sur',
      tax_id: '80012345-6',
    } as never)
  })

  it('#2 fetcha con customer_id y el sort default -units, con el cliente resuelto', async () => {
    renderAt('/sales-analytics/customers/top-products?customer_id=CLI-1')

    expect(await screen.findByText('Coca-Cola 2L')).toBeTruthy()
    expect(relationalAnalyticsService.getCustomerTopProducts).toHaveBeenCalledWith(
      'CLI-1',
      expect.objectContaining({ sort: '-units', page: 1, page_size: 10 }),
    )
    expect(screen.getByText('Maria Gomez')).toBeTruthy()
    expect(screen.getByText('SKU-COCA-2L')).toBeTruthy()
    expect(screen.getByText('Precio prom.')).toBeTruthy()
  })

  it('#2 muestra la cantidad con la UOM base del producto (F5)', async () => {
    vi.mocked(relationalAnalyticsService.getCustomerTopProducts).mockResolvedValue(
      topProductsEnvelope({ ...ROW, units: 40, base_unit: 'kg' }) as never,
    )
    renderAt('/sales-analytics/customers/top-products?customer_id=CLI-1')

    expect(await screen.findByText('40 kg')).toBeTruthy()
    expect(screen.queryByText('40 uds.')).toBeNull()
  })

  it('#2 el menú por fila pivota a compradores del producto', async () => {
    renderAt('/sales-analytics/customers/top-products?customer_id=CLI-1')
    await screen.findByText('Coca-Cola 2L')

    await userEvent.click(screen.getByTestId('drilldown-row-actions'))
    const menu = await screen.findByTestId('drilldown-row-menu')
    expect(within(menu).getByText('SKU: SKU-COCA-2L')).toBeTruthy()
    await userEvent.click(within(menu).getByTestId('drilldown-row-action-buyers'))

    expect(screen.getByText('RUTA_COMPRADORES')).toBeTruthy()
  })

  it('#3 fetcha con supplier_id, rotula el costo promedio y resuelve el proveedor', async () => {
    renderAt('/purchase-analytics/suppliers/top-products?supplier_id=SUP-1')

    expect(await screen.findByText('Coca-Cola 2L')).toBeTruthy()
    expect(relationalAnalyticsService.getSupplierTopProducts).toHaveBeenCalledWith(
      'SUP-1',
      expect.objectContaining({ sort: '-units', page: 1, page_size: 10 }),
    )
    expect(screen.getByText('Distribuidora Sur')).toBeTruthy()
    expect(screen.getByText('Costo prom.')).toBeTruthy()
  })

  it('#3 el menú por fila pivota a comparar proveedores', async () => {
    renderAt('/purchase-analytics/suppliers/top-products?supplier_id=SUP-1')
    await screen.findByText('Coca-Cola 2L')

    await userEvent.click(screen.getByTestId('drilldown-row-actions'))
    await userEvent.click(
      await screen.findByTestId('drilldown-row-action-compare-suppliers'),
    )

    expect(screen.getByText('RUTA_COMPARAR_PROVEEDORES')).toBeTruthy()
  })

  it('#2 sin customer_id busca el cliente en el picker y navega con customer_id', async () => {
    vi.mocked(clientService.searchByName).mockResolvedValue([
      { id: 'CLI-7', name: 'Cliente Siete', document_id: '777' },
    ] as never)

    renderAt('/sales-analytics/customers/top-products')

    expect(screen.getByText('Elegí Cliente para ver el detalle')).toBeTruthy()
    await userEvent.type(screen.getByPlaceholderText('Buscar cliente (F2)…'), 'siete')
    await userEvent.click(await screen.findByRole('button', { name: /Cliente Siete/ }))

    await waitFor(() =>
      expect(relationalAnalyticsService.getCustomerTopProducts).toHaveBeenCalledWith(
        'CLI-7',
        expect.objectContaining({ sort: '-units' }),
      ),
    )
  })
})
