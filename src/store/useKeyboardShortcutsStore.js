/**
 * Store de Zustand para gestión de atajos de teclado
 * Permite configurar y personalizar atajos de la aplicación
 */

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

// Atajos por defecto
const DEFAULT_SHORTCUTS = {
  // Compras
  'purchases.addProduct': { key: 'a', ctrlKey: true, description: 'Agregar nuevo producto' },
  'purchases.processPurchase': { key: 'g', ctrlKey: true, description: 'Guardar/Procesar compra' },
  'purchases.viewHistory': { key: 'h', ctrlKey: true, shiftKey: true, description: 'Ver historial de compras' },
  // Ventas
  'sales.addProduct': { key: 'a', ctrlKey: true, description: 'Agregar nuevo producto' },
  'sales.processSale': { key: 'g', ctrlKey: true, description: 'Guardar/Procesar venta' },
  'sales.viewHistory': { key: 'h', ctrlKey: true, shiftKey: true, description: 'Ver historial de ventas' },
  // Generales
  'general.closeModal': { key: 'Escape', description: 'Cerrar modal/diálogo' },
  'general.save': { key: 's', ctrlKey: true, description: 'Guardar' },
}

// Categorías de atajos
const SHORTCUT_CATEGORIES = {
  purchases: {
    label: 'Compras',
    shortcuts: ['purchases.addProduct', 'purchases.processPurchase', 'purchases.viewHistory'],
  },
  sales: {
    label: 'Ventas',
    shortcuts: ['sales.addProduct', 'sales.processSale', 'sales.viewHistory'],
  },
  general: {
    label: 'General',
    shortcuts: ['general.closeModal', 'general.save'],
  },
}

const useKeyboardShortcutsStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // Atajos configurados (pueden ser personalizados por el usuario)
        shortcuts: { ...DEFAULT_SHORTCUTS },

        // Categorías de atajos
        categories: SHORTCUT_CATEGORIES,

        // Atajos por defecto (para resetear)
        defaultShortcuts: DEFAULT_SHORTCUTS,

        // Obtener un atajo específico
        getShortcut: (shortcutId) => {
          return get().shortcuts[shortcutId] || null
        },

        // Verificar si un evento coincide con un atajo
        matchesShortcut: (shortcutId, event) => {
          const shortcut = get().shortcuts[shortcutId]
          if (!shortcut) return false

          const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
          const ctrlMatch = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : true
          const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
          const altMatch = shortcut.altKey ? event.altKey : !event.altKey

          return keyMatch && ctrlMatch && shiftMatch && altMatch
        },

        // Actualizar un atajo
        updateShortcut: (shortcutId, newShortcut) => {
          set((state) => ({
            shortcuts: {
              ...state.shortcuts,
              [shortcutId]: {
                ...state.shortcuts[shortcutId],
                ...newShortcut,
              },
            },
          }))
        },

        // Resetear un atajo a su valor por defecto
        resetShortcut: (shortcutId) => {
          const defaultShortcut = DEFAULT_SHORTCUTS[shortcutId]
          if (defaultShortcut) {
            set((state) => ({
              shortcuts: {
                ...state.shortcuts,
                [shortcutId]: { ...defaultShortcut },
              },
            }))
          }
        },

        // Resetear todos los atajos
        resetAllShortcuts: () => {
          set({ shortcuts: { ...DEFAULT_SHORTCUTS } })
        },

        // Formatear atajo para mostrar
        formatShortcut: (shortcutId) => {
          const shortcut = get().shortcuts[shortcutId]
          if (!shortcut) return ''

          const parts = []
          if (shortcut.ctrlKey) parts.push('Ctrl')
          if (shortcut.altKey) parts.push('Alt')
          if (shortcut.shiftKey) parts.push('Shift')

          // Formatear la tecla
          let keyDisplay = shortcut.key
          if (shortcut.key === 'Escape') keyDisplay = 'Esc'
          else if (shortcut.key.length === 1) keyDisplay = shortcut.key.toUpperCase()

          parts.push(keyDisplay)

          return parts.join(' + ')
        },
      }),
      {
        name: 'keyboard-shortcuts-storage',
        version: 1,
      }
    ),
    { name: 'KeyboardShortcutsStore' }
  )
)

export default useKeyboardShortcutsStore
