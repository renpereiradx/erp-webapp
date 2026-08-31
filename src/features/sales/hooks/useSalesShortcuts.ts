import { useEffect, RefObject } from 'react';

interface UseSalesShortcutsProps {
  activeTab: string;
  productSearchInputRef: RefObject<HTMLElement | null>;
  /** F4: limpiar el carrito (misma acción del botón "Limpiar Carrito"). */
  onClearCart?: () => void;
  /** Ctrl+Shift+H (sales.viewHistory): ir al Historial de ventas. */
  onGoToHistory?: () => void;
  /** Alt+Q: editar cantidad del ítem activo del carrito (fila en hover/foco). */
  onEditActiveItem?: () => void;
  /** Alt+X: quitar el ítem activo del carrito (fila en hover/foco). */
  onRemoveActiveItem?: () => void;
  /**
   * Corta todos los atajos (excepto nada): el wizard de checkout se abre sobre
   * la página y limpiar el carrito o editar filas por teclado en ese estado
   * corrompería la venta en curso.
   */
  enabled?: boolean;
}

/**
 * Atajos de la vista POS (solo tab "Nueva Venta"):
 * - F2 → foco al buscador de productos.
 * - F4 → limpiar carrito.
 * - Ctrl+Shift+H → Historial (atajo `sales.viewHistory` del store global).
 * - Alt+Q / Alt+X → editar cantidad / quitar el ítem activo del carrito.
 */
export const useSalesShortcuts = ({
  activeTab,
  productSearchInputRef,
  onClearCart,
  onGoToHistory,
  onEditActiveItem,
  onRemoveActiveItem,
  enabled = true,
}: UseSalesShortcutsProps) => {
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (activeTab !== 'new-sale' || !enabled) return;
      if (event.defaultPrevented) return;

      if (event.key === 'F2') {
        event.preventDefault();
        productSearchInputRef.current?.focus();
        return;
      }

      if (event.key === 'F4') {
        event.preventDefault();
        onClearCart?.();
        return;
      }

      // Alt no escribe texto: es seguro dispararlo aun con foco en un input.
      if (event.altKey && !event.ctrlKey && !event.metaKey && (event.key === 'q' || event.key === 'Q')) {
        event.preventDefault();
        onEditActiveItem?.();
        return;
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey && (event.key === 'x' || event.key === 'X')) {
        event.preventDefault();
        onRemoveActiveItem?.();
        return;
      }

      if (event.ctrlKey && event.shiftKey && (event.key === 'h' || event.key === 'H')) {
        event.preventDefault();
        onGoToHistory?.();
        return;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab, enabled, productSearchInputRef, onClearCart, onGoToHistory, onEditActiveItem, onRemoveActiveItem]);
};
