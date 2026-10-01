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
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BudgetDetail from '../BudgetDetail'

vi.mock('@/services/budgetService', () => ({
  budgetService: {
    getBudgetById: vi.fn(),
    updateBudgetStatus: vi.fn(),
    convertToSale: vi.fn(),
    printTicket: vi.fn(),
    downloadPdf: vi.fn(),
  },
}))

// Impresión de presupuestos (PLAN impresión presupuestos): /printers para el
// gate de RECEIPT y documents:read para las acciones.
vi.mock('@/features/printers/services/printersService', () => ({
  printersService: { list: vi.fn().mockResolvedValue([{
    id: 1, branch_id: null, name: 'Caja 1', purpose: 'RECEIPT', connection: 'NETWORK',
    host: '192.168.1.50', port: 9100, width_mm: 80, chars_per_line: 48,
    code_page: 'CP858', kick_drawer: false, is_default: true, is_active: true,
  }]) },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (p: string) => p === 'documents:read' }),
}))

vi.mock('@/features/budgets/components/BudgetPrintModal', () => ({
  BudgetPrintModal: ({ budget }: { budget: { id: string } | null }) =>
    budget ? <div data-testid="budget-print-modal-stub" /> : null,
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
      product_sku: 'ADI-CAM-001',
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

// QueryClientProvider: la página usa useBudgetDocuments (react-query) para
// el gate de impresora desde el plan de impresión de presupuestos.
const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/comercial/presupuestos/BUD-1790186']}>
        <Routes>
          <Route path='/comercial/presupuestos/:id' element={<BudgetDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
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

  it('la línea de código prefiere el sku universal sobre barcode/id', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Cód: ADI-CAM-001')).toBeInTheDocument())
  })

  it('cae al fallback "Producto ID: <id>" cuando la línea no trae nombre', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Producto ID: Rzox17DgQ')).toBeInTheDocument())
    expect(screen.getByText('Cód: Rzox17DgQ')).toBeInTheDocument()
  })
})

describe('BudgetDetail — impresión y PDF (PLAN impresión presupuestos)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getBudgetByIdMock.mockResolvedValue(DETAIL_RESPONSE)
  })

  it('"Imprimir" imprime el ticket del presupuesto vía documents', async () => {
    const user = userEvent.setup()
    vi.mocked(budgetService.printTicket).mockResolvedValue({
      success: true, sale_id: 'BUD-1', printer: 'Caja 1', printer_host: 'x', reprint_count: 0,
    })
    renderPage()

    const printBtn = await screen.findByTestId('budget-detail-print')
    await waitFor(() => expect(printBtn).toBeEnabled())
    await user.click(printBtn)
    await waitFor(() => expect(budgetService.printTicket).toHaveBeenCalledWith('BUD-1790186'))
  })

  it('"PDF" descarga el comprobante vía documents', async () => {
    const user = userEvent.setup()
    vi.mocked(budgetService.downloadPdf).mockResolvedValue({
      blob: new Blob(['%PDF']), filename: 'presupuesto_BUD-1.pdf',
    })
    renderPage()

    const pdfBtn = await screen.findByTestId('budget-detail-pdf')
    await waitFor(() => expect(pdfBtn).toBeEnabled())
    await user.click(pdfBtn)
    await waitFor(() => expect(budgetService.downloadPdf).toHaveBeenCalledWith('BUD-1790186'))
  })

  it('Aprobar Presupuesto abre el modal de comprobante con el presupuesto aprobado', async () => {
    const user = userEvent.setup()
    vi.mocked(budgetService.updateBudgetStatus).mockResolvedValue({
      ...DETAIL_RESPONSE.budget,
      status: 'APPROVED',
    } as typeof DETAIL_RESPONSE.budget)
    renderPage()

    const approveBtn = await screen.findByRole('button', { name: /Aprobar Presupuesto/i })
    await user.click(approveBtn)
    await waitFor(() =>
      expect(budgetService.updateBudgetStatus).toHaveBeenCalledWith('BUD-1790186', { status: 'APPROVED' }),
    )
    await waitFor(() => expect(screen.getByTestId('budget-print-modal-stub')).toBeInTheDocument())
  })
})
