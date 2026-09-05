/**
 * FASE C (PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES) — flujo supervisado de
 * anulación de ventas. Contrato UI:
 *
 * - RequestCancellationModal: el motivo es obligatorio (submit deshabilitado
 *   sin él) y el confirm dispara onConfirm.
 * - CancellationRequestsPanel: lista solicitudes, aprobar delega la request,
 *   rechazar exige motivo (modal), filtro por estado.
 * - SalesHistoryView: sin sales:cancel el vendor ve "Solicitar Anulación";
 *   con sales:cancel ve "Anular Venta" (B.5) y no la rama de solicitud.
 *
 * i18n moqueado en la frontera con la firma real (fallback español +
 * interpolación {var}). lucide-react NO se mockea.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

import { RequestCancellationModal } from '@/features/sales/components/RequestCancellationModal'
import { CancellationRequestsPanel } from '@/features/sales/components/CancellationRequestsPanel'
import { SalesHistoryView } from '@/features/sales/components/SalesHistoryView'
import type { CancellationRequest } from '@/features/sales/types/cancellation'

const noop = () => {}

const pendingRequest: CancellationRequest = {
  id: 7,
  sale_id: 'SALE-ABC',
  requested_by: 'user-vendor-id',
  requested_by_name: 'Hernan Cortes',
  reason: 'cliente se arrepintió',
  status: 'pending',
  created_at: '2026-09-05T10:00:00Z',
}

// Harness con estado para el modal de solicitud (reason controlado).
const RequestModalHarness: React.FC<{ onConfirm: () => void; submitting?: boolean }> = ({
  onConfirm,
  submitting = false,
}) => {
  const [reason, setReason] = useState('')
  return (
    <RequestCancellationModal
      isOpen
      onClose={noop}
      saleId="SALE-ABC"
      reason={reason}
      onReasonChange={setReason}
      onConfirm={onConfirm}
      submitting={submitting}
    />
  )
}

describe('RequestCancellationModal — solicitud del vendor (FASE C)', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('keeps submit disabled until a reason is typed, then calls onConfirm', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<RequestModalHarness onConfirm={onConfirm} />)

    const submit = screen.getByTestId('request-cancellation-submit')
    expect(submit).toBeDisabled()

    await user.type(screen.getByTestId('request-cancellation-reason'), 'cliente se arrepintió')
    expect(submit).toBeEnabled()

    await user.click(submit)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('shows the sale id in the title', () => {
    render(<RequestModalHarness onConfirm={noop} />)
    expect(screen.getByText('Solicitar Anulación #SALE-ABC')).toBeInTheDocument()
  })
})

describe('CancellationRequestsPanel — bandeja del aprobador (FASE C)', () => {
  const baseProps = {
    requests: [pendingRequest],
    total: 1,
    loading: false,
    error: null,
    statusFilter: 'pending' as const,
    onStatusFilterChange: noop,
    onRetry: noop,
    onApprove: noop,
    onReject: noop,
    actingId: null,
  }

  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('renders pending requests with requester and reason', () => {
    render(<CancellationRequestsPanel {...baseProps} />)

    expect(screen.getByTestId('cancellation-requests-row-7')).toBeInTheDocument()
    expect(screen.getByText('#SALE-ABC')).toBeInTheDocument()
    expect(screen.getByText('cliente se arrepintió')).toBeInTheDocument()
    expect(screen.getByText('Hernan Cortes')).toBeInTheDocument()
  })

  it('delegates the request on approve', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    render(<CancellationRequestsPanel {...baseProps} onApprove={onApprove} />)

    await user.click(screen.getByTestId('cancellation-requests-approve-7'))
    expect(onApprove).toHaveBeenCalledWith(pendingRequest)
  })

  it('requires a reason to reject and passes it along', async () => {
    const user = userEvent.setup()
    const onReject = vi.fn()
    render(<CancellationRequestsPanel {...baseProps} onReject={onReject} />)

    await user.click(screen.getByTestId('cancellation-requests-reject-7'))

    const confirm = screen.getByTestId('cancellation-requests-reject-confirm')
    expect(confirm).toBeDisabled()

    await user.type(screen.getByTestId('cancellation-requests-reject-reason'), 'cobro ya conciliado')
    expect(confirm).toBeEnabled()
    await user.click(confirm)
    expect(onReject).toHaveBeenCalledWith(pendingRequest, 'cobro ya conciliado')
  })

  it('shows the empty state without requests', () => {
    render(<CancellationRequestsPanel {...baseProps} requests={[]} total={0} />)

    expect(screen.getByTestId('cancellation-requests-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('cancellation-requests-row-7')).not.toBeInTheDocument()
  })

  it('changes the status filter from the tabs', async () => {
    const user = userEvent.setup()
    const onStatusFilterChange = vi.fn()
    render(<CancellationRequestsPanel {...baseProps} onStatusFilterChange={onStatusFilterChange} />)

    await user.click(screen.getByTestId('cancellation-requests-filter-approved'))
    expect(onStatusFilterChange).toHaveBeenCalledWith('approved')
  })

  it('shows the error state with retry', () => {
    const onRetry = vi.fn()
    render(<CancellationRequestsPanel {...baseProps} requests={[]} error="db down" onRetry={onRetry} />)

    expect(screen.getByTestId('cancellation-requests-error')).toBeInTheDocument()
  })
})

describe('SalesHistoryView — rama de solicitud del vendor (FASE C)', () => {
  const row = {
    internalKey: 'row-1',
    id: 'SALE-1',
    displayId: 'SALE-1',
    client_name: 'Cliente Test',
    total_amount: 100,
    date: '2026-09-05T10:00:00Z',
    status: 'COMPLETED',
  }

  const historyProps = {
    rows: [row],
    totalCount: 1,
    loading: false,
    error: null,
    onRetry: noop,
    historySearch: '',
    onHistorySearchChange: noop,
    dateFrom: '',
    onDateFromChange: noop,
    dateTo: '',
    onDateToChange: noop,
    onFilter: noop,
    onLoadLatest: noop,
    onClear: noop,
    onViewSale: noop,
    onCancelSale: noop,
    canCancelSale: false,
  }

  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('shows the request action for vendors without sales:cancel', async () => {
    const user = userEvent.setup()
    const onRequestCancellation = vi.fn()
    render(
      <SalesHistoryView
        {...historyProps}
        canRequestCancellation
        onRequestCancellation={onRequestCancellation}
      />,
    )

    const button = screen.getByRole('button', { name: 'Solicitar Anulación' })
    await user.click(button)
    expect(onRequestCancellation).toHaveBeenCalledWith(row)
    expect(screen.queryByRole('button', { name: 'Anular Venta' })).not.toBeInTheDocument()
  })

  it('shows the direct cancel action with sales:cancel and hides the request branch', () => {
    render(<SalesHistoryView {...historyProps} canCancelSale />)

    expect(screen.getByRole('button', { name: 'Anular Venta' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Solicitar Anulación' })).not.toBeInTheDocument()
  })

  it('shows no cancellation action without any permission', () => {
    render(<SalesHistoryView {...historyProps} />)

    expect(screen.queryByRole('button', { name: 'Anular Venta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Solicitar Anulación' })).not.toBeInTheDocument()
  })
})
