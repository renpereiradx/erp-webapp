/**
 * PLAN_UNITS_FRONTEND — contrato UI del selector de unidades del POS.
 *
 * - El campo unidad es un Select del catálogo (antes texto libre con datalist).
 * - Unidad distinta de la base SIN precio registrado → hint de advertencia
 *   (antes se vendía "2 box" al precio por kg sin aviso).
 * - Unidad con precio registrado (unit_prices) → sin hint.
 *
 * i18n moqueado con la firma real (fallback español); lucide-react sin mock.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

import { EditItemModal } from '@/features/sales/components/EditItemModal'

const noop = () => {}

const buildProps = (overrides: Record<string, unknown> = {}) => ({
  isOpen: true,
  onClose: noop,
  editing: false,
  productName: 'Papas test',
  baseUnitPrice: 5000,
  baseUnit: 'kg',
  quantity: 2,
  onQuantityChange: noop,
  unit: 'kg',
  onUnitChange: noop,
  price: 5000,
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
  ...overrides,
})

describe('EditItemModal — selector de unidades (PLAN_UNITS)', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('muestra el hint cuando la unidad elegida no tiene precio registrado', () => {
    render(
      <EditItemModal
        {...buildProps({ unit: 'box', unitPrices: [{ unit: 'kg', price: 5000 }] })}
      />
    )

    expect(screen.getByTestId('unit-no-price-hint')).toBeInTheDocument()
  })

  it('oculta el hint cuando la unidad elegida tiene precio registrado', () => {
    render(
      <EditItemModal
        {...buildProps({
          unit: 'box',
          unitPrices: [
            { unit: 'kg', price: 5000 },
            { unit: 'box', price: 100000 },
          ],
        })}
      />
    )

    expect(screen.queryByTestId('unit-no-price-hint')).not.toBeInTheDocument()
  })

  it('no muestra hint para la unidad base aunque no haya lista de precios', () => {
    render(<EditItemModal {...buildProps({ unit: 'kg' })} />)

    expect(screen.queryByTestId('unit-no-price-hint')).not.toBeInTheDocument()
  })

  it('el campo unidad es un combobox del catálogo y notifica el cambio', async () => {
    const user = userEvent.setup()
    const onUnitChange = vi.fn()
    render(
      <EditItemModal
        {...buildProps({
          onUnitChange,
          unitPrices: [{ unit: 'kg', price: 5000 }],
        })}
      />
    )

    const unitTrigger = screen.getByRole('combobox', { name: 'Unidad de Medida' })
    await user.click(unitTrigger)

    // Opción del catálogo agrupado (Empaque → Caja)
    const option = await screen.findByRole('option', { name: 'Caja' })
    await user.click(option)

    await waitFor(() => expect(onUnitChange).toHaveBeenCalledWith('box'))
  })
})
