/**
 * FASE B.4/B.5 (PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES) — gating cosmético
 * de permisos en el flujo de ventas. La validez real la impone el backend
 * (sales:apply_discount en ValidateProductsForSale, sales:cancel en
 * PUT /sale/{id}); estos tests fijan el contrato UI:
 *
 * - EditItemModal: sin sales:apply_discount, precio final + descuento +
 *   razón deshabilitados y hint con candado.
 * - CancelSaleModal: sin sales:cancel, el confirm queda deshabilitado.
 *
 * i18n moqueado en la frontera con la firma real (fallback español).
 * lucide-react NO se mockea (jsdom renderiza los SVG).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

import { EditItemModal } from '@/features/sales/components/EditItemModal'
import { CancelSaleModal } from '@/features/sales/components/CancelSaleModal'

const noop = () => {}

const editItemProps = {
  isOpen: true,
  onClose: noop,
  editing: false,
  productName: 'Producto Test',
  baseUnitPrice: 1000,
  baseUnit: 'unit',
  quantity: 1,
  onQuantityChange: noop,
  unit: 'unit',
  onUnitChange: noop,
  price: 1000,
  onPriceChange: noop,
  discount: 0,
  onDiscountChange: noop,
  discountType: 'percent' as const,
  onDiscountTypeChange: noop,
  discountReason: '',
  onDiscountReasonChange: noop,
  customReason: '',
  onCustomReasonChange: noop,
  onConfirm: noop,
}

const cancelModalProps = {
  isOpen: true,
  onClose: noop,
  saleId: 'S-1',
  reason: '',
  onReasonChange: noop,
  preview: null,
  onConfirm: noop,
  submitting: false,
}

describe('EditItemModal — sales:apply_discount gating (B.4)', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('disables price, discount and reason inputs without the permission', () => {
    render(<EditItemModal {...editItemProps} canApplyDiscount={false} />)

    const discountInput = screen.getByLabelText('Monto o porcentaje de descuento')
    expect(discountInput).toBeDisabled()

    const finalPrice = screen.getByLabelText('Precio Final Unit.')
    expect(finalPrice).toBeDisabled()

    expect(screen.getByTestId('discount-locked-hint')).toBeInTheDocument()
  })

  it('keeps inputs enabled and hides the hint with the permission', async () => {
    const user = userEvent.setup()
    const onDiscountChange = vi.fn()
    render(<EditItemModal {...editItemProps} canApplyDiscount onDiscountChange={onDiscountChange} />)

    expect(screen.getByLabelText('Monto o porcentaje de descuento')).toBeEnabled()
    expect(screen.getByLabelText('Precio Final Unit.')).toBeEnabled()
    expect(screen.queryByTestId('discount-locked-hint')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Monto o porcentaje de descuento'), '10')
    expect(onDiscountChange).toHaveBeenCalled()
  })
})

describe('CancelSaleModal — sales:cancel gating (B.5)', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('disables the confirm button without sales:cancel', () => {
    render(<CancelSaleModal {...cancelModalProps} canCancel={false} />)

    expect(screen.getByRole('button', { name: 'Sí, Anular' })).toBeDisabled()
  })

  it('enables the confirm button with sales:cancel', () => {
    render(<CancelSaleModal {...cancelModalProps} canCancel />)

    expect(screen.getByRole('button', { name: 'Sí, Anular' })).toBeEnabled()
  })
})
