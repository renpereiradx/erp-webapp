/**
 * usePurchasesShortcuts — convención DESIGN.md §12 (tests mínimos §12.9):
 * 1. La tecla dispara la acción.
 * 2. Con `enabled: false` (modal abierto) el atajo NO dispara.
 * 3. Un evento ya `defaultPrevented` no se procesa dos veces.
 * 4. Gating por tab (F2/F12 según mapa).
 *
 * Solo teclas de función: NO hay atajo de letra+modificador a nivel página
 * (el confirmar del modal de producto es `purchases.addProduct`, dentro del
 * modal).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createRef } from 'react'
import { usePurchasesShortcuts } from '../hooks/usePurchasesShortcuts'

const pressKey = (init: KeyboardEventInit & { defaultPrevented?: boolean }) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  if (init.defaultPrevented) event.preventDefault()
  act(() => {
    document.dispatchEvent(event)
  })
  return event
}

describe('usePurchasesShortcuts', () => {
  const historyRef = createRef<HTMLInputElement>()
  const cartRef = createRef<HTMLInputElement>()
  const onOpenCheckoutWizard = vi.fn()

  const setup = (overrides: Record<string, unknown> = {}) => {
    renderHook(() =>
      usePurchasesShortcuts({
        activeTab: 'nueva-compra',
        purchaseItemCount: 0,
        historySearchInputRef: historyRef,
        cartProductSearchRef: cartRef,
        onOpenCheckoutWizard,
        enabled: true,
        ...overrides,
      }),
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    const historyInput = document.createElement('input')
    const cartInput = document.createElement('input')
    document.body.append(historyInput, cartInput)
    historyRef.current = historyInput
    cartRef.current = cartInput
  })

  afterEach(() => {
    document.body.innerHTML = ''
    historyRef.current = null
    cartRef.current = null
  })

  it('Ctrl+G a nivel página NO hace nada (la confirmación vive dentro del modal)', () => {
    setup()
    const event = pressKey({ key: 'g', ctrlKey: true })
    expect(onOpenCheckoutWizard).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('un evento ya defaultPrevented no se procesa', () => {
    setup()
    const focusSpy = vi.spyOn(cartRef.current!, 'focus')
    pressKey({ key: 'F2', defaultPrevented: true })
    expect(focusSpy).not.toHaveBeenCalled()
  })

  it('enabled: false (modal abierto) corta todos los atajos de página', () => {
    setup({ enabled: false })
    const event = pressKey({ key: 'F2' })
    expect(event.defaultPrevented).toBe(false)
  })

  it('F2 en Nueva Compra enfoca el buscador del carrito (regresión)', () => {
    setup()
    const focusSpy = vi.spyOn(cartRef.current!, 'focus')
    pressKey({ key: 'F2' })
    expect(focusSpy).toHaveBeenCalledTimes(1)
  })

  it('F2 en Historial enfoca el filtro de la lista (regresión)', () => {
    setup({ activeTab: 'historial' })
    const focusSpy = vi.spyOn(historyRef.current!, 'focus')
    pressKey({ key: 'F2' })
    expect(focusSpy).toHaveBeenCalledTimes(1)
  })

  it('F12 con carrito cargado abre el wizard de checkout (regresión)', () => {
    setup({ purchaseItemCount: 3 })
    pressKey({ key: 'F12' })
    expect(onOpenCheckoutWizard).toHaveBeenCalledTimes(1)
  })

  it('F12 con carrito vacío enfoca el buscador (regresión)', () => {
    setup()
    const focusSpy = vi.spyOn(cartRef.current!, 'focus')
    pressKey({ key: 'F12' })
    expect(focusSpy).toHaveBeenCalledTimes(1)
    expect(onOpenCheckoutWizard).not.toHaveBeenCalled()
  })
})
