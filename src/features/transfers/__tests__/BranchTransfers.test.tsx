/**
 * F.4/F.5/F.6 (PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES) — bandeja y workflow de
 * transferencias entre sucursales. Contrato UI:
 *
 * - TransfersPage: lista desde branchTransferService, badge de pendientes,
 *   filtro por estado, "Nueva Transferencia" solo con `transfers:write`.
 * - CreateTransferModal: ítems precargados (F.5), submit deshabilitado sin
 *   destino, payload con source = sucursal activa; los ítems precargados
 *   llevan purchase_order_id (F.6).
 * - TransferDetailModal: acciones por estado (APPROVED/REJECTED en PENDING,
 *   SHIPPED con tracking, IN_TRANSIT, RECEIVED); REJECTED exige motivo;
 *   link a la compra de origen cuando los ítems la registran (F.6).
 *
 * Mocks en la frontera: branchTransferService, branchService, AuthContext,
 * BranchContext e i18n (firma real, fallback español). lucide-react NO se
 * mockea (PLAN_TEST_DESIGN_FRONTEND).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockHasPermission = vi.fn<(permission: string) => boolean>()

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (permission: string) => mockHasPermission(permission) }),
}))

vi.mock('@/contexts/BranchContext', () => ({
  useBranch: () => ({ currentBranchId: 1 }),
}))

vi.mock('@/services/branchTransferService', () => ({
  branchTransferService: {
    getTransfers: vi.fn(),
    getTransferById: vi.fn(),
    createTransfer: vi.fn(),
    updateTransferStatus: vi.fn(),
  },
}))

vi.mock('@/features/branches/services/branchService', () => ({
  branchService: {
    getBranches: vi.fn().mockResolvedValue({
      branches: [
        { id: 1, name: 'Depósito Central', code: 'DEP', branch_type: 'WAREHOUSE', city: 'Asunción' },
        { id: 2, name: 'Sucursal Centro', code: 'CEN', branch_type: 'POINT_OF_SALE', city: 'Asunción' },
      ],
    }),
    getUserBranches: vi.fn(),
  },
}))

import { branchTransferService } from '@/services/branchTransferService'
import TransfersPage from '@/features/transfers/components/TransfersPage'
import CreateTransferModal from '@/features/transfers/components/CreateTransferModal'
import TransferDetailModal from '@/features/transfers/components/TransferDetailModal'
import type { BranchTransfer } from '@/features/transfers/types'

const getTransfers = vi.mocked(branchTransferService.getTransfers)
const getTransferById = vi.mocked(branchTransferService.getTransferById)
const updateTransferStatus = vi.mocked(branchTransferService.updateTransferStatus)

const transferPending: BranchTransfer = {
  id: 11,
  transfer_code: 'TR-0011',
  source_branch_id: 1,
  destination_branch_id: 2,
  status: 'PENDING',
  transfer_type: 'STANDARD',
  requested_date: '2026-09-05T10:00:00Z',
  requested_by: 'user-1',
  created_at: '2026-09-05T10:00:00Z',
  updated_at: '2026-09-05T10:00:00Z',
  source_branch_name: 'Depósito Central',
  destination_branch_name: 'Sucursal Centro',
}

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockHasPermission.mockImplementation((permission) => permission === 'transfers:read')
  getTransfers.mockResolvedValue({ transfers: [transferPending], total: 1, page: 1, page_size: 20 })
})

afterEach(() => cleanup())

describe('TransfersPage — bandeja (F.4)', () => {
  it('lists transfers coming from the service', async () => {
    renderWithProviders(<TransfersPage />)

    expect(await screen.findByTestId('transfers-row-11')).toBeInTheDocument()
    expect(screen.getByText('TR-0011')).toBeInTheDocument()
    expect(screen.getByText('Depósito Central → Sucursal Centro')).toBeInTheDocument()
    expect(getTransfers).toHaveBeenCalledWith(expect.objectContaining({ page: 1, page_size: 20 }))
  })

  it('shows the pending badge only with a positive count', async () => {
    getTransfers.mockImplementation(async (filters) => ({
      transfers: filters?.status === 'PENDING' ? [transferPending] : [],
      total: filters?.status === 'PENDING' ? 3 : 0,
      page: 1,
      page_size: 20,
    }))
    renderWithProviders(<TransfersPage />)

    expect(await screen.findByTestId('transfers-pending-badge')).toHaveTextContent('3')
  })

  it('re-queries with the selected status filter', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransfersPage />)
    await screen.findByTestId('transfers-row-11')

    await user.click(screen.getByTestId('transfers-filter-RECEIVED'))

    await waitFor(() =>
      expect(getTransfers).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'RECEIVED', page: 1 })),
    )
  })

  it('hides the create button without transfers:write and shows it with it', async () => {
    const { rerender } = renderWithProviders(<TransfersPage />)
    await screen.findByTestId('transfers-row-11')
    expect(screen.queryByTestId('transfers-new-button')).not.toBeInTheDocument()

    mockHasPermission.mockImplementation((permission) => permission === 'transfers:read' || permission === 'transfers:write')
    rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <TransfersPage />
      </QueryClientProvider>,
    )
    expect(await screen.findByTestId('transfers-new-button')).toBeInTheDocument()
  })

  it('opens the detail modal from the view action', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransfersPage />)
    await screen.findByTestId('transfers-row-11')

    await user.click(screen.getByTestId('transfers-view-11'))

    expect(await screen.findByText('Transferencia TR-0011')).toBeInTheDocument()
  })
})

describe('CreateTransferModal — creación (F.4/F.5)', () => {
  const baseProps = { open: true, onOpenChange: vi.fn(), sourceBranchId: 1 as number | null, sourceBranchName: 'Depósito Central' }

  it('renders preloaded items from the purchase CTA (F.5)', () => {
    renderWithProviders(
      <CreateTransferModal
        {...baseProps}
        initialItems={[{ product_id: 'P1', product_name: 'Yerba 1kg', quantity: 5 }]}
      />,
    )
    expect(screen.getByText('Yerba 1kg')).toBeInTheDocument()
    expect(screen.getByTestId('transfer-line-qty-P1')).toHaveValue(5)
  })

  it('keeps submit disabled without destination, then submits with source = active branch', async () => {
    const user = userEvent.setup()
    const createTransfer = vi.mocked(branchTransferService.createTransfer).mockResolvedValue(transferPending)
    renderWithProviders(
      <CreateTransferModal
        {...baseProps}
        initialItems={[{ product_id: 'P1', product_name: 'Yerba 1kg', quantity: 2 }]}
      />,
    )

    expect(screen.getByTestId('transfer-submit')).toBeDisabled()

    await screen.findByText('Sucursal Centro')
    await user.selectOptions(screen.getByLabelText('Sucursal de destino'), '2')
    expect(screen.getByTestId('transfer-submit')).toBeEnabled()

    await user.click(screen.getByTestId('transfer-submit'))
    await waitFor(() =>
      expect(createTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          source_branch_id: 1,
          destination_branch_id: 2,
          items: [expect.objectContaining({ product_id: 'P1', quantity_requested: 2 })],
        }),
      ),
    )
  })

  it('stamps preloaded items with their source purchase id (F.6)', async () => {
    const user = userEvent.setup()
    const createTransfer = vi.mocked(branchTransferService.createTransfer).mockResolvedValue(transferPending)
    renderWithProviders(
      <CreateTransferModal
        {...baseProps}
        initialItems={[
          { product_id: 'P1', product_name: 'Yerba 1kg', quantity: 2, purchase_order_id: 42 },
        ]}
      />,
    )

    await screen.findByText('Sucursal Centro')
    await user.selectOptions(screen.getByLabelText('Sucursal de destino'), '2')
    await user.click(screen.getByTestId('transfer-submit'))

    await waitFor(() =>
      expect(createTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [expect.objectContaining({ product_id: 'P1', purchase_order_id: 42 })],
        }),
      ),
    )
  })
})

describe('TransferDetailModal — acciones del workflow (F.4)', () => {
  beforeEach(() => {
    getTransferById.mockResolvedValue({
      transfer: transferPending,
      items: [{ id: 1, transfer_id: 11, product_id: 'P1', quantity_requested: 5, product_name: 'Yerba 1kg' }],
    })
  })

  it('offers approve/reject for a PENDING transfer with transfers:write', async () => {
    mockHasPermission.mockImplementation((permission) => permission === 'transfers:read' || permission === 'transfers:write')
    renderWithProviders(<TransferDetailModal transfer={transferPending} open onOpenChange={vi.fn()} />)

    expect(await screen.findByTestId('transfer-approve')).toBeInTheDocument()
    expect(screen.getByTestId('transfer-reject')).toBeInTheDocument()
  })

  it('requires a rejection reason before updating to REJECTED', async () => {
    const user = userEvent.setup()
    mockHasPermission.mockImplementation((permission) => permission === 'transfers:read' || permission === 'transfers:write')
    renderWithProviders(<TransferDetailModal transfer={transferPending} open onOpenChange={vi.fn()} />)

    await user.click(await screen.findByTestId('transfer-reject'))
    expect(screen.getByTestId('transfer-action-confirm')).toBeDisabled()

    await user.type(screen.getByLabelText('Motivo del rechazo'), 'producto incorrecto')
    await user.click(screen.getByTestId('transfer-action-confirm'))

    await waitFor(() =>
      expect(updateTransferStatus).toHaveBeenCalledWith(
        11,
        expect.objectContaining({ new_status: 'REJECTED', rejection_reason: 'producto incorrecto' }),
      ),
    )
  })

  it('maps SHIPPED action to a tracking-number requirement', async () => {
    const user = userEvent.setup()
    mockHasPermission.mockImplementation((permission) => permission === 'transfers:read' || permission === 'transfers:write')
    getTransferById.mockResolvedValue({
      transfer: { ...transferPending, status: 'APPROVED' },
      items: [],
    })
    renderWithProviders(<TransferDetailModal transfer={{ ...transferPending, status: 'APPROVED' }} open onOpenChange={vi.fn()} />)

    await user.click(await screen.findByTestId('transfer-ship'))
    await user.type(screen.getByLabelText('Número de seguimiento'), 'TRK-99')
    await user.click(screen.getByTestId('transfer-action-confirm'))

    await waitFor(() =>
      expect(updateTransferStatus).toHaveBeenCalledWith(
        11,
        expect.objectContaining({ new_status: 'SHIPPED', shipping_tracking_number: 'TRK-99' }),
      ),
    )
  })

  it('links items back to their source purchase and omits it for manual lines (F.6)', async () => {
    getTransferById.mockResolvedValue({
      transfer: transferPending,
      items: [
        { id: 1, transfer_id: 11, product_id: 'P1', quantity_requested: 5, product_name: 'Yerba 1kg', purchase_order_id: 42 },
        { id: 2, transfer_id: 11, product_id: 'P2', quantity_requested: 1, product_name: 'Azúcar 1kg' },
      ],
    })
    renderWithProviders(<TransferDetailModal transfer={transferPending} open onOpenChange={vi.fn()} />)

    expect(await screen.findByText(/Compra de origen/)).toBeInTheDocument()
    const link = screen.getByTestId('transfer-source-purchase-42')
    expect(link).toHaveAttribute('href', '/compras')
    expect(link).toHaveTextContent('#42')
  })

  it('shows no source purchase link when no item came from a purchase (F.6)', async () => {
    getTransferById.mockResolvedValue({
      transfer: transferPending,
      items: [{ id: 1, transfer_id: 11, product_id: 'P1', quantity_requested: 5, product_name: 'Yerba 1kg' }],
    })
    renderWithProviders(<TransferDetailModal transfer={transferPending} open onOpenChange={vi.fn()} />)

    await screen.findByText('Yerba 1kg')
    expect(screen.queryByText(/Compra de origen/)).not.toBeInTheDocument()
  })
})
