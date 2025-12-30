/**
 * Componente de configuración de Atajos de Teclado
 * Permite visualizar y personalizar los atajos de la aplicación
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Keyboard, RotateCcw, Edit2, Check, X } from 'lucide-react'
import useKeyboardShortcutsStore from '@/store/useKeyboardShortcutsStore'
import { useI18n } from '@/lib/i18n'
import '@/styles/scss/components/_keyboard-shortcuts.scss'

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
    <div className="keyboard-shortcuts">
      <div className="keyboard-shortcuts__header">
        <div className="keyboard-shortcuts__header-content">
          <Keyboard className="keyboard-shortcuts__icon" size={20} />
          <div>
            <h3 className="keyboard-shortcuts__title">
              {t('settings.shortcuts.title', 'Atajos de Teclado')}
            </h3>
            <p className="keyboard-shortcuts__description">
              {t('settings.shortcuts.description', 'Personaliza los atajos de teclado para navegar más rápido.')}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={resetAllShortcuts}
          title={t('settings.shortcuts.reset_all', 'Restaurar todos')}
        >
          <RotateCcw size={16} />
          <span>{t('settings.shortcuts.reset_all', 'Restaurar todos')}</span>
        </button>
      </div>

      <div className="keyboard-shortcuts__categories">
        {Object.entries(categories).map(([categoryKey, category]) => (
          <div key={categoryKey} className="keyboard-shortcuts__category">
            <h4 className="keyboard-shortcuts__category-title">
              {getCategoryLabel(categoryKey)}
            </h4>
            <ul className="keyboard-shortcuts__list">
              {category.shortcuts.map((shortcutId) => {
                const shortcut = shortcuts[shortcutId]
                if (!shortcut) return null

                const isEditing = editingShortcut === shortcutId

                return (
                  <li key={shortcutId} className="keyboard-shortcuts__item">
                    <span className="keyboard-shortcuts__label">
                      {getShortcutLabel(shortcutId)}
                    </span>

                    <div className="keyboard-shortcuts__actions">
                      {isEditing ? (
                        <>
                          <kbd className="keyboard-shortcuts__kbd keyboard-shortcuts__kbd--editing">
                            {formatRecordingKeys(recordingKeys)}
                          </kbd>
                          <button
                            type="button"
                            className="btn btn--icon btn--ghost btn--sm"
                            onClick={saveShortcut}
                            disabled={!recordingKeys?.key}
                            title={t('action.save', 'Guardar')}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn--icon btn--ghost btn--sm"
                            onClick={cancelEditing}
                            title={t('action.cancel', 'Cancelar')}
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <kbd className="keyboard-shortcuts__kbd">
                            {formatShortcut(shortcutId)}
                          </kbd>
                          <button
                            type="button"
                            className="btn btn--icon btn--ghost btn--sm"
                            onClick={() => startEditing(shortcutId)}
                            title={t('action.edit', 'Editar')}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn--icon btn--ghost btn--sm"
                            onClick={() => handleResetShortcut(shortcutId)}
                            title={t('settings.shortcuts.reset', 'Restaurar')}
                          >
                            <RotateCcw size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="keyboard-shortcuts__footer">
        <p className="keyboard-shortcuts__hint">
          {t('settings.shortcuts.hint', 'Haz clic en el icono de editar y presiona la combinación de teclas deseada.')}
        </p>
      </div>
    </div>
  )
}

export default KeyboardShortcuts
