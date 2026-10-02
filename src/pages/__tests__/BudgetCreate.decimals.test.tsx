/**
 * BudgetCreate (/presupuestos/nuevo) — gating de decimales por unidad
 * (PLAN_UNITS_V2_COMPLETACION F2.1): 0,5 kg es presupuestable; una caja se
 * trunca a entero. Mismo criterio que requisiciones (PurchaseRequisitionCreate)
 * y el POS.
 *
 * Mocks en la frontera: sellableUnitSearch (filas planas del buscador),
 * productService (getInfo: tasa de IVA), budgetService, useClientStore,
 * useToast. El i18n lo resuelve el fakeT global de vitest.setup.ts;
 * lucide-react NO se mockea.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BudgetCreate from '../BudgetCreate'
import { searchSellableUnitsFlat } from '@/features/catalog/sellableUnitSearch'

vi.mock('@/features/catalog/sellableUnitSearch', () => ({
  searchSellableUnitsFlat: vi.fn(),
}))

vi.mock('@/services/productService', () => ({
  productService: {
    getInfo: vi.fn().mockResolvedValue(null),
    searchAdvanced: vi.fn(),
    searchInfo: vi.fn(),
  },
}))

vi.mock('@/services/budgetService', () => ({
  budgetService: {
    createBudget: vi.fn(),
  },
}))

vi.mock('@/store/useClientStore', () => ({
  default: (sel: (s: Record<string, unknown>) => unknown) =>
    sel({ searchClients: vi.fn().mockResolvedValue([]) }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ addToast: vi.fn(), toasts: [], dismissToast: vi.fn() }),
}))

const searchMock = vi.mocked(searchSellableUnitsFlat)

/** Filas planas del buscador: un pesable (kg) y uno entero (box). */
const flatRows = [
  {
    id: 'P-KG',
    variant_id: null,
    is_base_row: true,
    name: 'PAPAS KG',
    sku: 'PAPAS-KG',
    state: true,
    current_price: 5000,
    stock_quantity: 100,
    base_unit: 'kg',
  },
  {
    id: 'P-BOX',
    variant_id: null,
    is_base_row: true,
    name: 'GASEOSA CAJA',
    sku: 'GAS-BOX',
    state: true,
    current_price: 250000,
    stock_quantity: 10,
    base_unit: 'box',
  },
]

const renderPage = () =>
  render(
    <MemoryRouter>
      <BudgetCreate />
    </MemoryRouter>,
  )

const addProduct = async (term: string) => {
  const user = userEvent.setup()
  const input = screen.getByPlaceholderText(/Buscar producto por nombre, SKU o variante/i)
  await user.type(input, term)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(310)
  })
  vi.useRealTimers()
  const option = await screen.findByText(term)
  await user.click(option)
}

describe('BudgetCreate — decimales por unidad (PLAN_UNITS_V2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    searchMock.mockResolvedValue(flatRows as any)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('kg (pesable): 0,5 sobrevive y no se trunca', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderPage()
    await addProduct('PAPAS KG')

    const qty = await screen.findByDisplayValue('1')
    fireEvent.change(qty, { target: { value: '0.5' } })
    fireEvent.blur(qty)

    await waitFor(() => expect(qty).toHaveValue(0.5))
  })

  it('box (entera): 1,5 se trunca a 1 al salir del campo', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderPage()
    await addProduct('GASEOSA CAJA')

    const qty = await screen.findByDisplayValue('1')
    fireEvent.change(qty, { target: { value: '1.5' } })
    fireEvent.blur(qty)

    await waitFor(() => expect(qty).toHaveValue(1))
  })

  it('box (entera): 0,5 no entra (mínimo 1) y la fila conserva 1', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderPage()
    await addProduct('GASEOSA CAJA')

    const qty = await screen.findByDisplayValue('1')
    fireEvent.change(qty, { target: { value: '0.5' } })
    fireEvent.blur(qty)

    await waitFor(() => expect(qty).toHaveValue(1))
  })
})
