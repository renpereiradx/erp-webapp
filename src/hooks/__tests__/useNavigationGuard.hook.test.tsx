/**
 * useNavigationGuard — guard de salida con BrowserRouter plano.
 *
 * Ejercita el parche real de window.history (pushState/replaceState/beforeunload)
 * y un window.navigation falso para el camino traverse (back/forward con
 * Navigation API): navegación bloqueada, replay al confirmar, cancelación.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useNavigationGuard } from '../useNavigationGuard'

/** window.navigation falso: captura el listener y dispara eventos de prueba. */
class FakeNavigation {
  handler: ((e: unknown) => void) | null = null
  addEventListener = (t: string, fn: (e: unknown) => void) => {
    if (t === 'navigate') this.handler = fn
  }
  removeEventListener = () => {
    this.handler = null
  }
  traverse = (url: string, dir: 'back' | 'forward' = 'back') => {
    // currentEntry al final de la pila; el destino queda antes (back) o después (forward)
    // back: destino ANTES de la entrada actual; forward: destino DESPUÉS
    const actual = 'http://localhost:3000/actual'
    const entries =
      dir === 'back'
        ? [
            { key: 'k1', url },
            { key: 'k2', url: actual },
          ]
        : [
            { key: 'k1', url: actual },
            { key: 'k2', url },
          ]
    const destination = dir === 'back' ? entries[0] : entries[1]
    const e = {
      navigationType: 'traverse',
      canIntercept: true,
      cancelable: true,
      destination,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true
      },
    }
    ;(window as unknown as { navigation: unknown }).navigation = {
      addEventListener: this.addEventListener,
      removeEventListener: this.removeEventListener,
      entries: () => entries,
      currentEntry: dir === 'back' ? entries[1] : entries[0],
    }
    this.handler?.(e)
    return e
  }
}

let fakeNav: FakeNavigation

function Probe({ when }: { when: boolean }) {
  const { pending, confirm, cancel } = useNavigationGuard(when)
  return (
    <div>
      <span data-testid="guard-state">{pending ? `pending:${pending.url}` : 'idle'}</span>
      <button data-testid="guard-confirm" onClick={confirm}>
        confirm
      </button>
      <button data-testid="guard-cancel" onClick={cancel}>
        cancel
      </button>
    </div>
  )
}

const push = (url: string) => window.history.pushState({}, '', url)

const resetUrl = () => window.history.replaceState(null, '', '/')

describe('useNavigationGuard', () => {
  beforeEach(() => {
    resetUrl()
    fakeNav = new FakeNavigation()
    ;(window as unknown as { navigation: unknown }).navigation = fakeNav
  })
  afterEach(() => {
    cleanup()
    delete (window as unknown as { navigation?: unknown }).navigation
  })

  it('when=false deja pasar la navegación', () => {
    render(<Probe when={false} />)
    push('/otra-pagina')
    expect(window.location.pathname).toBe('/otra-pagina')
    expect(screen.getByTestId('guard-state')).toHaveTextContent('idle')
  })

  it('when=true bloquea pushState, no cambia la URL y expone pending', () => {
    render(<Probe when={true} />)
    act(() => {
      expect(() => push('/otra-pagina')).toThrow(/Navigation blocked/)
    })
    expect(window.location.pathname).toBe('/')
    expect(screen.getByTestId('guard-state')).toHaveTextContent(/pending:.+\/otra-pagina$/)
  })

  it('when=true bloquea también replaceState', () => {
    render(<Probe when={true} />)
    act(() => {
      expect(() => window.history.replaceState({}, '', '/redirect')).toThrow(/Navigation blocked/)
    })
    expect(window.location.pathname).toBe('/')
    expect(screen.getByTestId('guard-state')).toHaveTextContent(/pending:.+\/redirect$/)
  })

  it('traverse (back/forward) se cancela con Navigation API y expone pending', () => {
    render(<Probe when={true} />)
    let e
    act(() => {
      e = fakeNav.traverse('http://localhost:3000/destino-back')
    })
    expect(e?.defaultPrevented).toBe(true)
    expect(window.location.pathname).toBe('/')
    expect(screen.getByTestId('guard-state')).toHaveTextContent(/pending:.+destino-back$/)
  })

  it('traverse pasa sin bloqueo cuando when=false', () => {
    render(<Probe when={false} />)
    const e = fakeNav.traverse('http://localhost:3000/otro')
    expect(e.defaultPrevented).toBe(false)
    expect(screen.getByTestId('guard-state')).toHaveTextContent('idle')
  })

  it('confirm de un traverse repite la dirección original y desarma la barrera', async () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const forwardSpy = vi.spyOn(window.history, 'forward').mockImplementation(() => {})
    render(<Probe when={true} />)

    // back: destino antes de la entrada actual
    act(() => {
      fakeNav.traverse('http://localhost:3000/destino-back', 'back')
    })
    const user = userEvent.setup()
    await user.click(screen.getByTestId('guard-confirm'))
    expect(backSpy).toHaveBeenCalledTimes(1)
    expect(forwardSpy).not.toHaveBeenCalled()

    // El traverse de replay pasa sin bloquear (consume allowNext).
    act(() => {
      fakeNav.traverse('http://localhost:3000/destino-back', 'back')
    })
    expect(screen.getByTestId('guard-state')).toHaveTextContent('idle')

    // forward: destino después de la entrada actual
    act(() => {
      fakeNav.traverse('http://localhost:3000/destino-fwd', 'forward')
    })
    await user.click(screen.getByTestId('guard-confirm'))
    expect(forwardSpy).toHaveBeenCalledTimes(1)

    // Barrera desarmada: un push posterior pasa sin bloqueo.
    push('/libre')
    expect(window.location.pathname).toBe('/libre')
    backSpy.mockRestore()
    forwardSpy.mockRestore()
  })

  it('confirm repite la navegación interceptada (push bloqueado)', async () => {
    const user = userEvent.setup()
    render(<Probe when={true} />)
    act(() => {
      expect(() => push('/destino')).toThrow(/Navigation blocked/)
    })

    await user.click(screen.getByTestId('guard-confirm'))
    expect(window.location.pathname).toBe('/destino')
    expect(screen.getByTestId('guard-state')).toHaveTextContent('idle')
  })

  it('cancel vuelve al estado quieto y la guardia sigue activa', async () => {
    const user = userEvent.setup()
    render(<Probe when={true} />)
    act(() => {
      expect(() => push('/destino')).toThrow(/Navigation blocked/)
    })

    await user.click(screen.getByTestId('guard-cancel'))
    expect(window.location.pathname).toBe('/')
    expect(screen.getByTestId('guard-state')).toHaveTextContent('idle')

    // El segundo intento también se bloquea: cancel no abre la barrera.
    act(() => {
      expect(() => push('/destino')).toThrow(/Navigation blocked/)
    })
    expect(screen.getByTestId('guard-state')).toHaveTextContent(/pending:.+\/destino$/)
  })

  it('beforeunload se previene con when=true y no con when=false', () => {
    const { rerender } = render(<Probe when={true} />)
    let e = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)

    rerender(<Probe when={false} />)
    e = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(false)
  })

  it('al desmontar se restauran los history methods originales', () => {
    const original = window.history.pushState
    const { unmount } = render(<Probe when={true} />)
    expect(window.history.pushState).not.toBe(original)
    unmount()
    expect(window.history.pushState).toBe(original)
  })
})
