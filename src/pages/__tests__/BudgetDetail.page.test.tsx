/**
 * Detalle de presupuesto (/comercial/presupuestos/:id).
 *
 * Regresión 2026-09-30: el backend no resolvía product_name (la tabla
 * budget_order_details solo persiste product_id) y la página caía al
 * fallback "Producto ID: <id>". Ahora GET /budgets/{id} resuelve nombre y
 * código de barras vía join con products.products, y la línea de código
 * prefiere el barcode sobre el id interno.
 *
 * Mocks en la frontera: budgetService y useToast. lucide-react NO se
 * mockea (PLAN_TEST_DESIGN_FRONTEND). La página es legacy sin useI18n
 * (strings hardcodeados existentes).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BudgetDetail from '../BudgetDetail'

vi.mock('@/services/budgetService', () => ({
  budgetService: {
    getBudgetById: vi.fn(),
    updateBudgetStatus: vi.fn(),
    convertToSale: vi.fn(),
  },
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    toast: vi.fn(),
    addToast: vi.fn(),
    removeToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}))

import { budgetService } from '@/services/budgetService'

const getBudgetByIdMock = vi.mocked(budgetService.getBudgetById)

/** Contrato real de GET /budgets/{id} tras el join de product_name/barcode. */
const DETAIL_RESPONSE = {
  budget: {
    id: 'BUD-1790186',
    status: 'PENDING',
    client_id: 'CL_Y3rphbkvR',
    client_name: 'Erika Maciel',
    created_at: '2026-09-23T10:00:00Z',
    valid_until: '2026-10-07T00:00:00Z',
    total_amount: 215350,
    tax_amount: 0,
    notes: 'TEST',
  },
  items: [
    {
      id: 1,
      budget_order_id: 'BUD-1790186',
      product_id: 'Cc2y5JnvR',
      product_name: 'CAMISETA ADIDAS',
      product_barcode: '7574015002311',
      quantity: 1,
      unit_price: 70000,
    },
    {
      // Línea sin nombre resuelto (producto eliminado): ejerce el fallback.
      id: 2,
      budget_order_id: 'BUD-1790186',
      product_id: 'Rzox17DgQ',
      product_name: '',
      product_barcode: '',
      quantity: 2,
      unit_price: 57400,
    },
  ],
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/comercial/presupuestos/BUD-1790186']}>
      <Routes>
        <Route path='/comercial/presupuestos/:id' element={<BudgetDetail />} />
      </Routes>
    </MemoryRouter>
  )

describe('BudgetDetail (página)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getBudgetByIdMock.mockResolvedValue(DETAIL_RESPONSE)
  })

  it('muestra el nombre del producto resuelto por el backend, no "Producto ID"', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('CAMISETA ADIDAS')).toBeInTheDocument())
    // El fallback solo aplica a la línea sin nombre, nunca a la que sí lo trae.
    expect(screen.queryByText('Producto ID: Cc2y5JnvR')).not.toBeInTheDocument()
  })

  it('la línea de código prefiere el código de barras sobre el id interno', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Cód: 7574015002311')).toBeInTheDocument())
  })

  it('cae al fallback "Producto ID: <id>" cuando la línea no trae nombre', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Producto ID: Rzox17DgQ')).toBeInTheDocument())
    expect(screen.getByText('Cód: Rzox17DgQ')).toBeInTheDocument()
  })
})
