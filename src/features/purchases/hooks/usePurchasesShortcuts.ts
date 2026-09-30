import { useEffect, type RefObject } from 'react'

interface UsePurchasesShortcutsProps {
  activeTab: string
  /** Ítems en el carrito de la compra en curso (gate de F12). */
  purchaseItemCount: number
  /** Ref del buscador del tab Historial (propiedad de usePurchasesLogic). */
  historySearchInputRef: RefObject<HTMLInputElement | null>
  /** Ref del buscador de productos del carrito (tab Nueva Compra, F2). */
  cartProductSearchRef?: RefObject<HTMLInputElement | null>
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
 * - F2 → foco al buscador principal del tab activo: en Historial es el filtro
 *   de la lista; en Nueva Compra es el buscador de productos del carrito
 *   (seleccionar un resultado abre el modal de detalles, F3 = su buscador
 *   interno).
 * - F12 → acción principal contextual: con el carrito vacío enfoca el
 *   buscador de productos (lo siguiente lógico es agregar ítems); con
 *   productos cargados abre el wizard de checkout ("Comprar (F12)", alias
 *   legado de `purchases.processPurchase`).
 *
 * El modal de producto registra los suyos propios mientras está abierto
 * (F3 buscador interno; confirmación configurable `purchases.addProduct`).
 * No hay atajo de página que ABRA ese modal: la entrada al alta es buscar y
 * seleccionar (F12 con carrito vacío enfoca el buscador).
 */
export const usePurchasesShortcuts = ({
  activeTab,
  purchaseItemCount,
  historySearchInputRef,
  cartProductSearchRef,
  onOpenCheckoutWizard,
  enabled = true,
}: UsePurchasesShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enabled) return
      if (event.defaultPrevented) return

      if (event.key === 'F2') {
        if (activeTab === 'historial') {
          event.preventDefault()
          historySearchInputRef.current?.focus()
          historySearchInputRef.current?.select()
          return
        }
        if (activeTab === 'nueva-compra') {
          event.preventDefault()
          cartProductSearchRef?.current?.focus()
          cartProductSearchRef?.current?.select()
          return
        }
        return
      }

      if (event.key === 'F12') {
        if (activeTab !== 'nueva-compra') return
        event.preventDefault()
        if (purchaseItemCount === 0) {
          cartProductSearchRef?.current?.focus()
          cartProductSearchRef?.current?.select()
          return
        }
        onOpenCheckoutWizard()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, purchaseItemCount, historySearchInputRef, cartProductSearchRef, onOpenCheckoutWizard, enabled])
}
