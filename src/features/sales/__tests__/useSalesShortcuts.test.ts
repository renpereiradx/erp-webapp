/**
 * useSalesShortcuts — convención DESIGN.md §12 (tests mínimos §12.9):
 * 1. La tecla dispara la acción (F2/F4/Alt+Q/Alt+X/Ctrl+Shift+H).
 * 2. Con `enabled: false` (modal/wizard abierto) el atajo NO dispara.
 * 3. Un evento ya `defaultPrevented` no se procesa dos veces.
 * 4. ↑/↓ navegan el carrito SOLO con el foco fuera de inputs (§12.1) —
 *    el buscador de productos maneja las flechas para su dropdown.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createRef } from 'react'
import { useSalesShortcuts } from '../hooks/useSalesShortcuts'

const pressKey = (init: KeyboardEventInit & { defaultPrevented?: boolean }, target: EventTarget = document) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  if (init.defaultPrevented) event.preventDefault()
  act(() => {
    target.dispatchEvent(event)
  })
  return event
}

describe('useSalesShortcuts', () => {
  const searchRef = createRef<HTMLInputElement>()
  const onClearCart = vi.fn()
  const onGoToHistory = vi.fn()
  const onEditActiveItem = vi.fn()
  const onRemoveActiveItem = vi.fn()
  const onFocusCart = vi.fn()
  const onNavigateCart = vi.fn()

  const setup = (overrides: Record<string, unknown> = {}) => {
    renderHook(() =>
      useSalesShortcuts({
        activeTab: 'new-sale',
        productSearchInputRef: searchRef,
        onClearCart,
        onGoToHistory,
        onEditActiveItem,
        onRemoveActiveItem,
        onFocusCart,
        onNavigateCart,
        enabled: true,
        ...overrides,
      }),
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    const input = document.createElement('input')
    document.body.append(input)
    searchRef.current = input
  })

  afterEach(() => {
    document.body.innerHTML = ''
    searchRef.current = null
  })

  it('F2 enfoca el buscador de productos', () => {
    setup()
    const focusSpy = vi.spyOn(searchRef.current!, 'focus')
    pressKey({ key: 'F2' })
    expect(focusSpy).toHaveBeenCalledTimes(1)
  })

  it('F4 limpia el carrito', () => {
    setup()
    pressKey({ key: 'F4' })
    expect(onClearCart).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+Shift+H va al historial', () => {
    setup()
    pressKey({ key: 'h', ctrlKey: true, shiftKey: true })
    expect(onGoToHistory).toHaveBeenCalledTimes(1)
  })

  it('Alt+Q edita y Alt+X quita el ítem seleccionado (seguro con foco en input)', () => {
    setup()
    pressKey({ key: 'q', altKey: true }, searchRef.current!)
    expect(onEditActiveItem).toHaveBeenCalledTimes(1)
    pressKey({ key: 'x', altKey: true }, searchRef.current!)
    expect(onRemoveActiveItem).toHaveBeenCalledTimes(1)
  })

  it('F8 enfoca el carrito (espejo de F2, seguro con foco en el buscador)', () => {
    setup()
    pressKey({ key: 'F8' }, searchRef.current!)
    expect(onFocusCart).toHaveBeenCalledTimes(1)
    expect(onNavigateCart).not.toHaveBeenCalled()
  })

  it('↓ navega hacia adelante y ↑ hacia atrás (foco fuera de inputs)', () => {
    setup()
    pressKey({ key: 'ArrowDown' })
    expect(onNavigateCart).toHaveBeenCalledWith(1)
    pressKey({ key: 'ArrowUp' })
    expect(onNavigateCart).toHaveBeenCalledWith(-1)
    expect(onNavigateCart).toHaveBeenCalledTimes(2)
  })

  it('↓ con el foco dentro de un input NO navega ni consume la tecla', () => {
    setup()
    const event = pressKey({ key: 'ArrowDown' }, searchRef.current!)
    expect(onNavigateCart).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('enabled: false (wizard/modal abierto) corta todos los atajos de página', () => {
    setup({ enabled: false })
    const event = pressKey({ key: 'ArrowDown' })
    pressKey({ key: 'F4' })
    pressKey({ key: 'F8' })
    pressKey({ key: 'q', altKey: true })
    expect(onNavigateCart).not.toHaveBeenCalled()
    expect(onClearCart).not.toHaveBeenCalled()
    expect(onFocusCart).not.toHaveBeenCalled()
    expect(onEditActiveItem).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('un evento ya defaultPrevented no se procesa', () => {
    setup()
    const focusSpy = vi.spyOn(searchRef.current!, 'focus')
    pressKey({ key: 'F2', defaultPrevented: true })
    expect(focusSpy).not.toHaveBeenCalled()
  })

  it('fuera del tab Nueva Venta no hay atajos de POS', () => {
    setup({ activeTab: 'history' })
    const focusSpy = vi.spyOn(searchRef.current!, 'focus')
    pressKey({ key: 'F2' })
    pressKey({ key: 'ArrowDown' })
    expect(focusSpy).not.toHaveBeenCalled()
    expect(onNavigateCart).not.toHaveBeenCalled()
  })
})
