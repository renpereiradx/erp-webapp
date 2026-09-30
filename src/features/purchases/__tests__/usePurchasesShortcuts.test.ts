/**
 * usePurchasesShortcuts — convención DESIGN.md §12 (tests mínimos §12.9):
 * 1. La tecla dispara la acción.
 * 2. Con `enabled: false` (modal abierto) el atajo NO dispara.
 * 3. Un evento ya `defaultPrevented` no se procesa dos veces.
 * 4. Gating por tab (F2/Ctrl+G/F12 son de Nueva Compra o Historial según mapa).
 *
 * Ctrl+G usa el store REAL de atajos (defaults: `purchases.processPurchase` =
 * Ctrl+G) para validar también el camino configurable y sus modificadores.
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
  const onOpenAddProductModal = vi.fn()

  const setup = (overrides: Record<string, unknown> = {}) => {
    renderHook(() =>
      usePurchasesShortcuts({
        activeTab: 'nueva-compra',
        purchaseItemCount: 0,
        historySearchInputRef: historyRef,
        cartProductSearchRef: cartRef,
        onOpenCheckoutWizard,
        onOpenAddProductModal,
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

  it('Ctrl+G en Nueva Compra abre el modal de agregar producto (consumiendo la tecla)', () => {
    setup()
    const event = pressKey({ key: 'g', ctrlKey: true })
    expect(onOpenAddProductModal).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('Meta+G (Cmd en macOS) también matchea el atajo configurable', () => {
    setup()
    pressKey({ key: 'g', metaKey: true })
    expect(onOpenAddProductModal).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+G no hace nada en el tab Historial', () => {
    setup({ activeTab: 'historial' })
    const event = pressKey({ key: 'g', ctrlKey: true })
    expect(onOpenAddProductModal).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('enabled: false (modal abierto) corta todos los atajos de página', () => {
    setup({ enabled: false })
    const event = pressKey({ key: 'g', ctrlKey: true })
    expect(onOpenAddProductModal).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('un evento ya defaultPrevented no se procesa', () => {
    setup()
    pressKey({ key: 'g', ctrlKey: true, defaultPrevented: true })
    expect(onOpenAddProductModal).not.toHaveBeenCalled()
  })

  it('Ctrl+Shift+G no matchea (shift cambia el atajo configurado)', () => {
    setup()
    pressKey({ key: 'g', ctrlKey: true, shiftKey: true })
    expect(onOpenAddProductModal).not.toHaveBeenCalled()
  })

  it('F2 en Nueva Compra enfoca el buscador del carrito (regresión)', () => {
    setup()
    const focusSpy = vi.spyOn(cartRef.current!, 'focus')
    pressKey({ key: 'F2' })
    expect(focusSpy).toHaveBeenCalledTimes(1)
  })

  it('F12 con carrito cargado abre el wizard de checkout (regresión)', () => {
    setup({ purchaseItemCount: 3 })
    pressKey({ key: 'F12' })
    expect(onOpenCheckoutWizard).toHaveBeenCalledTimes(1)
    expect(onOpenAddProductModal).not.toHaveBeenCalled()
  })
})
