/**
 * PurchaseCollectionStep — formateo de miles en "Monto a pagar" (DESIGN.md §6.4).
 *
 * El input de monto usa el par formatNumberInput/parseNumberInput de
 * moneyInput.ts (igual que CollectionStep de ventas): el usuario teclea 6000
 * y ve "6.000"; el estado guarda el canónico "6000" y onDataChange reporta
 * el número. F4 (monto exacto) escribe el total en el mismo estado canónico.
 *
 * cashRegisterService se mockea en la frontera del módulo consumido (el paso
 * carga cajas abiertas + caja activa al montar). lucide-react NO se mockea.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { PurchaseCollectionStep } from '../components/steps/PurchaseCollectionStep'

vi.mock('@/services/cashRegisterService', () => ({
  cashRegisterService: {
    getCashRegisters: vi.fn().mockResolvedValue([]),
    getActiveCashRegister: vi.fn().mockResolvedValue(null),
  },
}))

const renderStep = async (totalAmount = 665000) => {
  const onDataChange = vi.fn()
  // act asíncrono: la carga de cajas al montar resuelve en microtarea.
  await act(async () => {
    render(
      <PurchaseCollectionStep totalAmount={totalAmount} currencyCode="PYG" onDataChange={onDataChange} />,
    )
  })
  return { onDataChange }
}

const amountInput = () => screen.getByLabelText(/Monto a pagar/i) as HTMLInputElement

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('PurchaseCollectionStep — formateo del monto a pagar', () => {
  it('muestra el monto inicial (total) con separador de miles', async () => {
    await renderStep(665000)
    expect(amountInput().value).toBe('665.000')
  })

  it('formatea los miles mientras se escribe y reporta el canónico', async () => {
    const { onDataChange } = await renderStep(665000)

    fireEvent.change(amountInput(), { target: { value: '6000' } })

    expect(amountInput().value).toBe('6.000')
    expect(onDataChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ amountPaid: 6000 }),
    )
  })

  it('parsea separadores pegados y coma decimal (es-PY)', async () => {
    const { onDataChange } = await renderStep(0)

    fireEvent.change(amountInput(), { target: { value: '1.234,5' } })

    expect(amountInput().value).toBe('1.234,5')
    expect(onDataChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ amountPaid: 1234.5 }),
    )
  })

  it('F4 escribe el monto exacto formateado', async () => {
    const { onDataChange } = await renderStep(665000)

    fireEvent.change(amountInput(), { target: { value: '100' } })
    fireEvent.keyDown(window, { key: 'F4' })

    expect(amountInput().value).toBe('665.000')
    expect(onDataChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ amountPaid: 665000 }),
    )
  })

  it('vaciar el campo reporta 0 (nunca NaN)', async () => {
    const { onDataChange } = await renderStep(665000)

    fireEvent.change(amountInput(), { target: { value: '' } })

    expect(amountInput().value).toBe('')
    expect(onDataChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ amountPaid: 0 }),
    )
  })
})
