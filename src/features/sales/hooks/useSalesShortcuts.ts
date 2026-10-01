import { useEffect, RefObject } from 'react';

interface UseSalesShortcutsProps {
  activeTab: string;
  productSearchInputRef: RefObject<HTMLElement | null>;
  /** F4: limpiar el carrito (misma acción del botón "Limpiar Carrito"). */
  onClearCart?: () => void;
  /** Ctrl+Shift+H (sales.viewHistory): ir al Historial de ventas. */
  onGoToHistory?: () => void;
  /** Alt+Q: editar detalles del ítem seleccionado del carrito. */
  onEditActiveItem?: () => void;
  /** Alt+X: quitar el ítem seleccionado del carrito. */
  onRemoveActiveItem?: () => void;
  /**
   * F8: puerta de entrada a la navegación del carrito (espejo de F2 con el
   * buscador) — selecciona y enfoca el ítem activo o la primera fila; desde
   * ahí ↑/↓ navegan y Alt+Q/Alt+X accionan. F8 es seguro con foco en input.
   */
  onFocusCart?: () => void;
  /**
   * ↑/↓: mover la selección del carrito a la fila siguiente/anterior
   * (convención §12.1: flechas solo con el foco FUERA de inputs — el
   * buscador de productos maneja las suyas para su dropdown).
   */
  onNavigateCart?: (direction: 1 | -1) => void;
  /**
   * Corta todos los atajos (excepto nada): el wizard de checkout se abre sobre
   * la página y limpiar el carrito o editar filas por teclado en ese estado
   * corrompería la venta en curso.
   */
  enabled?: boolean;
}

/** §12.3.3: los inputs se llevan las flechas para sí (escribir/mover caret). */
const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
};

/**
 * Atajos de la vista POS (solo tab "Nueva Venta"):
 * - F2 → foco al buscador de productos.
 * - F8 → foco al carrito (fila seleccionada o la primera).
 * - F4 → limpiar carrito.
 * - Ctrl+Shift+H → Historial (atajo `sales.viewHistory` del store global).
 * - ↑/↓ → navegar las filas del carrito (selección persistente).
 * - Alt+Q / Alt+X → editar detalles / quitar el ítem seleccionado del carrito.
 */
export const useSalesShortcuts = ({
  activeTab,
  productSearchInputRef,
  onClearCart,
  onGoToHistory,
  onEditActiveItem,
  onRemoveActiveItem,
  onFocusCart,
  onNavigateCart,
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

      if (event.key === 'F8') {
        event.preventDefault();
        onFocusCart?.();
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (isTypingTarget(event.target)) return;
        event.preventDefault();
        onNavigateCart?.(event.key === 'ArrowDown' ? 1 : -1);
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
  }, [activeTab, enabled, productSearchInputRef, onClearCart, onGoToHistory, onEditActiveItem, onRemoveActiveItem, onFocusCart, onNavigateCart]);
};
