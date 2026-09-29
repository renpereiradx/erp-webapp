/**
 * EnhancedModal — contrato de teclado: Escape y focus trap de Tab.
 *
 * Escape: cierra el modal y CORTA la propagación hacia window para que los
 * atajos globales (useCheckoutShortcuts: Esc = volver/cerrar el wizard) no
 * se disparen también al cerrar un modal apilado sobre el wizard.
 * Tab: cicla dentro del modal (focus trap) y recupera el foco si se fue al
 * fondo. El overlay acepta --erp-overlay-inset para full-screen opt-in.
 *
 * i18n: fakeT global del vitest.setup (los fallbacks del componente bastan).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import EnhancedModal from '../EnhancedModal'

const renderTwoButtons = (props: Record<string, unknown> = {}) =>
  render(
    <>
      <button type="button" data-testid="outside-btn">
        fuera del modal
      </button>
      <EnhancedModal
        isOpen
        title="t"
        onClose={vi.fn()}
        footer={<button type="button">del footer</button>}
        {...props}
      >
        <button type="button">del contenido</button>
      </EnhancedModal>
    </>,
  )

// Orden de focusables del modal: close button (header) → contenido → footer.
// jsdom no navega Tab nativamente, así que el trap es lo único que mueve foco.

describe('EnhancedModal', () => {
  it('Escape cierra el modal y no propaga el evento a window', () => {
    const onClose = vi.fn()
    const windowKey = vi.fn()
    window.addEventListener('keydown', windowKey)
    render(
      <EnhancedModal isOpen title="t" onClose={onClose} footer={null} testId="esc">
        contenido
      </EnhancedModal>,
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(windowKey).not.toHaveBeenCalled()
    window.removeEventListener('keydown', windowKey)
  })

  it('respeta closeOnEscape=false', () => {
    const onClose = vi.fn()
    render(
      <EnhancedModal isOpen title="t" onClose={onClose} closeOnEscape={false} footer={null} testId="noesc">
        contenido
      </EnhancedModal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Tab en el último focusable vuelve al primero (focus trap)', () => {
    const { getByTestId } = renderTwoButtons({ testId: 'trap' })
    const closeBtn = getByTestId('trap-close-button')
    const footerBtn = screen.getByText('del footer')
    footerBtn.focus()

    fireEvent.keyDown(document, { key: 'Tab' })

    expect(document.activeElement).toBe(closeBtn)
  })

  it('Shift+Tab en el primer focusable salta al último', () => {
    const { getByTestId } = renderTwoButtons({ testId: 'trap-shift' })
    const closeBtn = getByTestId('trap-shift-close-button')
    const footerBtn = screen.getByText('del footer')
    closeBtn.focus()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })

    expect(document.activeElement).toBe(footerBtn)
  })

  it('Tab con el foco fuera del modal lo devuelve al primero', () => {
    const { getByTestId } = renderTwoButtons({ testId: 'trap-out' })
    const closeBtn = getByTestId('trap-out-close-button')
    screen.getByTestId('outside-btn').focus()

    fireEvent.keyDown(document, { key: 'Tab' })

    expect(document.activeElement).toBe(closeBtn)
  })

  it('Tab entre focusables intermedios no interfiere (no preventDefault)', () => {
    const { getByTestId } = renderTwoButtons({ testId: 'trap-mid' })
    const closeBtn = getByTestId('trap-mid-close-button')
    closeBtn.focus()

    fireEvent.keyDown(document, { key: 'Tab' })

    // jsdom no mueve el foco nativamente: el contrato del trap es NO tocar
    // la tecla cuando el foco no está en un borde del ciclo.
    expect(document.activeElement).toBe(closeBtn)
  })
})

