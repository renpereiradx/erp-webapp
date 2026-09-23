import { useEffect, type RefObject } from 'react'

interface UsePurchasesShortcutsProps {
  activeTab: string
  /** Ítems en el carrito de la compra en curso (gate de F12). */
  purchaseItemCount: number
  /** Ref del buscador del tab Historial (propiedad de usePurchasesLogic). */
  historySearchInputRef: RefObject<HTMLInputElement | null>
  /** F12: abrir el wizard de checkout (misma acción que "Finalizar compra"). */
  onOpenCheckoutWizard: () => void
  /**
   * Corta todos los atajos mientras un modal/wizard está abierto (DESIGN.md §12.2):
   * el resto de overlays (producto, cancelación, pago, confirmación, transferencia)
   * registran los suyos propios.
   */
  enabled?: boolean
}

/**
 * Atajos de la página de Compras (DESIGN.md §12):
 * - F2 → foco al buscador del tab activo. Solo el tab Historial tiene buscador
 *   a nivel página; en Nueva Compra la búsqueda vive dentro del modal de
 *   producto (F3), así que F2 no hace nada allí.
 * - F12 → abrir el wizard de checkout (alias legado del atajo principal
 *   `purchases.processPurchase` que usa el wizard una vez abierto).
 */
export const usePurchasesShortcuts = ({
  activeTab,
  purchaseItemCount,
  historySearchInputRef,
  onOpenCheckoutWizard,
  enabled = true,
}: UsePurchasesShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enabled) return
      if (event.defaultPrevented) return

      if (event.key === 'F2') {
        if (activeTab !== 'historial') return
        event.preventDefault()
        historySearchInputRef.current?.focus()
        historySearchInputRef.current?.select()
        return
      }

      if (event.key === 'F12') {
        if (activeTab !== 'nueva-compra' || purchaseItemCount === 0) return
        event.preventDefault()
        onOpenCheckoutWizard()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, purchaseItemCount, historySearchInputRef, onOpenCheckoutWizard, enabled])
}
