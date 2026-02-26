/**
 * Componente de configuración de Atajos de Teclado
 * Permite visualizar y personalizar los atajos de la aplicación
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Keyboard, RotateCcw, Edit2, Check, X, Info } from 'lucide-react'
import useKeyboardShortcutsStore from '@/store/useKeyboardShortcutsStore'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

const KeyboardShortcuts = () => {
  const { t } = useI18n()
  const {
    shortcuts,
    categories,
    formatShortcut,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts
  } = useKeyboardShortcutsStore()

  const [editingShortcut, setEditingShortcut] = useState(null)
  const [recordingKeys, setRecordingKeys] = useState(null)

  // Escuchar teclas cuando estamos grabando un nuevo atajo
  const handleKeyDown = useCallback((event) => {
    if (!editingShortcut) return

    event.preventDefault()
    event.stopPropagation()

    // Ignorar solo teclas modificadoras
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
      setRecordingKeys({
        ctrlKey: event.ctrlKey || event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        key: null,
      })
      return
    }

    // Capturar la combinación completa
    const newShortcut = {
      key: event.key,
      ctrlKey: event.ctrlKey || event.metaKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
    }

    setRecordingKeys(newShortcut)
  }, [editingShortcut])

  useEffect(() => {
    if (editingShortcut) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editingShortcut, handleKeyDown])

  const startEditing = (shortcutId) => {
    setEditingShortcut(shortcutId)
    setRecordingKeys(null)
  }

  const cancelEditing = () => {
    setEditingShortcut(null)
    setRecordingKeys(null)
  }

  const saveShortcut = () => {
    if (editingShortcut && recordingKeys && recordingKeys.key) {
      updateShortcut(editingShortcut, recordingKeys)
    }
    setEditingShortcut(null)
    setRecordingKeys(null)
  }

  const handleResetShortcut = (shortcutId) => {
    resetShortcut(shortcutId)
  }

  const formatRecordingKeys = (keys) => {
    if (!keys) return t('settings.shortcuts.press_keys', 'Presiona las teclas...')

    const parts = []
    if (keys.ctrlKey) parts.push('Ctrl')
    if (keys.altKey) parts.push('Alt')
    if (keys.shiftKey) parts.push('Shift')
    if (keys.key) {
      let keyDisplay = keys.key
      if (keys.key === 'Escape') keyDisplay = 'Esc'
      else if (keys.key.length === 1) keyDisplay = keys.key.toUpperCase()
      parts.push(keyDisplay)
    }

    return parts.length > 0 ? parts.join(' + ') : t('settings.shortcuts.press_keys', 'Presiona las teclas...')
  }

  const getShortcutLabel = (shortcutId) => {
    const labelMap = {
      'purchases.addProduct': t('settings.shortcuts.purchases.add_product', 'Agregar producto'),
      'purchases.processPurchase': t('settings.shortcuts.purchases.process', 'Procesar compra'),
      'purchases.viewHistory': t('settings.shortcuts.purchases.history', 'Ver historial'),
      'sales.addProduct': t('settings.shortcuts.sales.add_product', 'Agregar producto'),
      'sales.processSale': t('settings.shortcuts.sales.process', 'Procesar venta'),
      'sales.viewHistory': t('settings.shortcuts.sales.history', 'Ver historial'),
      'general.closeModal': t('settings.shortcuts.general.close_modal', 'Cerrar modal'),
      'general.save': t('settings.shortcuts.general.save', 'Guardar'),
      'general.globalSearch': t('settings.shortcuts.general.global_search', 'Buscador global'),
    }
    return labelMap[shortcutId] || shortcutId
  }

  const getCategoryLabel = (categoryKey) => {
    const labelMap = {
      purchases: t('settings.shortcuts.category.purchases', 'Compras'),
      sales: t('settings.shortcuts.category.sales', 'Ventas'),
      general: t('settings.shortcuts.category.general', 'General'),
    }
    return labelMap[categoryKey] || categoryKey
  }

  return (
    <div className="bg-white">
      <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
            <Keyboard size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
              {t('settings.shortcuts.title', 'Atajos de Teclado')}
            </h3>
            <p className="text-[11px] text-text-secondary font-medium">
              {t('settings.shortcuts.description', 'Personaliza los atajos de teclado para navegar más rápido.')}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetAllShortcuts}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:bg-primary/5"
        >
          <RotateCcw size={14} className="mr-2" />
          {t('settings.shortcuts.reset_all', 'Restaurar todos')}
        </Button>
      </div>

      <div className="p-6 space-y-8">
        {Object.entries(categories).map(([categoryKey, category]) => (
          <div key={categoryKey} className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
              {getCategoryLabel(categoryKey)}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {category.shortcuts.map((shortcutId) => {
                const shortcut = shortcuts[shortcutId]
                if (!shortcut) return null

                const isEditing = editingShortcut === shortcutId

                return (
                  <div key={shortcutId} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:border-primary/20 transition-colors group">
                    <span className="text-xs font-bold text-text-main">
                      {getShortcutLabel(shortcutId)}
                    </span>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <kbd className="px-2 py-1 rounded bg-primary text-white text-[10px] font-black shadow-sm animate-pulse">
                            {formatRecordingKeys(recordingKeys)}
                          </kbd>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg text-success hover:bg-success/10"
                            onClick={saveShortcut}
                            disabled={!recordingKeys?.key}
                          >
                            <Check size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg text-slate-400 hover:bg-slate-100"
                            onClick={cancelEditing}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <kbd className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-600 text-[10px] font-black shadow-sm group-hover:border-primary/30 transition-colors">
                            {formatShortcut(shortcutId)}
                          </kbd>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-lg text-slate-400 hover:text-primary"
                              onClick={() => startEditing(shortcutId)}
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-lg text-slate-400 hover:text-orange-500"
                              onClick={() => handleResetShortcut(shortcutId)}
                            >
                              <RotateCcw size={14} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center gap-2">
        <Info size={14} className="text-primary" />
        <p className="text-[10px] font-medium text-text-secondary italic">
          {t('settings.shortcuts.hint', 'Haz clic en el icono de editar y presiona la combinación de teclas deseada.')}
        </p>
      </div>
    </div>
  )
}

export default KeyboardShortcuts
