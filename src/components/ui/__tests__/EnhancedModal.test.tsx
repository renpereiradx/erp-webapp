/**
 * EnhancedModal — contrato del manejo de Escape.
 *
 * Escape: cierra el modal y CORTA la propagación hacia window para que los
 * atajos globales (useCheckoutShortcuts: Esc = volver/cerrar el wizard) no
 * se disparen también al cerrar un modal apilado sobre el wizard.
 *
 * i18n: fakeT global del vitest.setup (los fallbacks del componente bastan).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import EnhancedModal from '../EnhancedModal'

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
})
