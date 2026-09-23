import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSearchFocusShortcut } from './useSearchFocusShortcut'

const makeInput = () =>
  ({ focus: vi.fn(), select: vi.fn() }) as unknown as HTMLInputElement

const pressF2 = (prevented = false) => {
  const event = new KeyboardEvent('keydown', { key: 'F2', cancelable: true })
  if (prevented) event.preventDefault()
  document.dispatchEvent(event)
  return event
}

describe('useSearchFocusShortcut (DESIGN.md §12)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('F2 enfoca y selecciona el input del ref', () => {
    const input = makeInput()
    const inputRef = { current: input }
    renderHook(() => useSearchFocusShortcut({ enabled: true, inputRef }))

    const event = pressF2()

    expect(input.focus).toHaveBeenCalledTimes(1)
    expect(input.select).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('con enabled=false (modal abierto) el atajo no dispara (§12.2)', () => {
    const input = makeInput()
    const inputRef = { current: input }
    renderHook(() => useSearchFocusShortcut({ enabled: false, inputRef }))

    pressF2()

    expect(input.focus).not.toHaveBeenCalled()
  })

  it('un evento ya consumido (defaultPrevented) se respeta', () => {
    const input = makeInput()
    const inputRef = { current: input }
    renderHook(() => useSearchFocusShortcut({ enabled: true, inputRef }))

    pressF2(true)

    expect(input.focus).not.toHaveBeenCalled()
  })

  it('teclas que no son F2 no hacen nada', () => {
    const input = makeInput()
    const inputRef = { current: input }
    renderHook(() => useSearchFocusShortcut({ enabled: true, inputRef }))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', cancelable: true }))

    expect(input.focus).not.toHaveBeenCalled()
  })
})
