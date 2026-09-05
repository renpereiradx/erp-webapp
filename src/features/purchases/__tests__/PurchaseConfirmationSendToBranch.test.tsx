/**
 * F.5 (PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES) — CTA post-compra "Enviar a
 * sucursal…". Contrato UI:
 *
 * - Con `transfers:write` e ítems transferibles: el CTA aparece y delega en
 *   onSendToBranch (la página abre la transferencia precargada).
 * - Sin `transfers:write` o sin ítems transferibles: no hay CTA.
 *
 * Mocks en la frontera: i18n y AuthContext. lucide-react NO se mockea.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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

import { PurchaseConfirmationModal } from '@/features/purchases/components/PurchaseConfirmationModal'

const baseResult = {
  id: 42,
  total_amount: 150000,
  branch_id: 1,
  warnings: [],
  details: [],
  transferable_items: [
    { product_id: 'P1', variant_id: undefined, product_name: 'Yerba 1kg', quantity: 5, unit_cost: 18000 },
  ],
}

const baseProps = {
  showConfirmationModal: true as const,
  latestPurchaseResult: baseResult,
  setShowConfirmationModal: vi.fn(),
  paymentCurrency: 'PYG',
  setActiveTab: vi.fn(),
  handleFilter: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockHasPermission.mockReturnValue(true)
})

afterEach(() => cleanup())

describe('PurchaseConfirmationModal — CTA Enviar a sucursal (F.5)', () => {
  it('shows the CTA with transfers:write and delegates on click', async () => {
    const user = userEvent.setup()
    const onSendToBranch = vi.fn()
    render(<PurchaseConfirmationModal {...baseProps} onSendToBranch={onSendToBranch} />)

    const cta = screen.getByTestId('purchase-send-to-branch')
    expect(cta).toBeInTheDocument()

    await user.click(cta)
    expect(onSendToBranch).toHaveBeenCalledTimes(1)
    expect(baseProps.setShowConfirmationModal).toHaveBeenCalledWith(false)
  })

  it('hides the CTA without transfers:write', () => {
    mockHasPermission.mockReturnValue(false)
    render(<PurchaseConfirmationModal {...baseProps} onSendToBranch={vi.fn()} />)

    expect(screen.queryByTestId('purchase-send-to-branch')).not.toBeInTheDocument()
  })

  it('hides the CTA when the purchase has no transferable items', () => {
    render(
      <PurchaseConfirmationModal
        {...baseProps}
        latestPurchaseResult={{ ...baseResult, transferable_items: [] }}
        onSendToBranch={vi.fn()}
      />,
    )

    expect(screen.queryByTestId('purchase-send-to-branch')).not.toBeInTheDocument()
  })
})
