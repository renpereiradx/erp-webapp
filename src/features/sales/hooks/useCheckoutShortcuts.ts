/**
 * useCheckoutShortcuts — manejo de teclado para el SaleCheckoutWizard.
 *
 * Honra el store global de atajos personalizables (useKeyboardShortcutsStore):
 * el atajo principal de avance/confirmación es `sales.processSale` (Ctrl+G por
 * defecto, configurable por el usuario). Se mantienen alias de compatibilidad
 * (F12, Enter) para no romper el hábito de los operadores.
 *
 * F2 → foco al primer input del paso actual.
 * F3 → foco al buscador de cliente (solo útil en ClientStep; el callback lo
 *      decide el paso vía `onFocusClient`).
 * Esc → volver (si hay paso previo) o cerrar el wizard (si es el primero).
 * Flechas ↑↓ → delegadas al paso (onArrowUp/Down) para navegar listados.
 */
import { useEffect } from 'react'
import useKeyboardShortcutsStore from '@/store/useKeyboardShortcutsStore'

export interface CheckoutShortcutHandlers {
  /** Avanzar al próximo paso o confirmar (paso final). */
  onPrimary: () => void
  /** Volver al paso anterior, o cerrar si está en el primero. */
  onBack: () => void
  /** Foco al primer input del paso actual. */
  onFocusFirst?: () => void
  /** Foco al buscador de cliente (F3). */
  onFocusClient?: () => void
  /** Navegación de listados (pendientes, reservas, resultados). */
  onArrowUp?: () => void
  onArrowDown?: () => void
  /** Si el handler principal debe estar deshabilitado (ej. paso inválido). */
  enabled?: boolean
}

/**
 * Registra los atajos del wizard mientras `active` sea true.
 * Devuelve la representación legible del atajo principal (p.ej. "Ctrl + G")
 * para mostrarla en los labels de los botones.
 */
export function useCheckoutShortcuts(active: boolean, handlers: CheckoutShortcutHandlers) {
  const matchesShortcut = useKeyboardShortcutsStore((s) => s.matchesShortcut)
  const formatShortcut = useKeyboardShortcutsStore((s) => s.formatShortcut)
  const primaryLabel = formatShortcut('sales.processSale')

  useEffect(() => {
    if (!active) return
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      // Atajo principal configurable (Ctrl+G por defecto).
      if (matchesShortcut('sales.processSale', e)) {
        e.preventDefault()
        if (handlers.enabled !== false) handlers.onPrimary()
        return
      }

      // Alias de compatibilidad: F12 = acción principal.
      if (e.key === 'F12') {
        e.preventDefault()
        if (handlers.enabled !== false) handlers.onPrimary()
        return
      }

      // Escape = volver / cerrar.
      if (e.key === 'Escape') {
        e.preventDefault()
        handlers.onBack()
        return
      }

      // F2 = foco al primer input del paso.
      if (e.key === 'F2') {
        e.preventDefault()
        handlers.onFocusFirst?.()
        return
      }

      // F3 = foco al buscador de cliente.
      if (e.key === 'F3') {
        e.preventDefault()
        handlers.onFocusClient?.()
        return
      }

      // Flechas: solo cuando NO se está tipeando (navegación de listados).
      if (!isTyping) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          handlers.onArrowDown?.()
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          handlers.onArrowUp?.()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, handlers, matchesShortcut])

  return primaryLabel
}

export default useCheckoutShortcuts
