import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  Filter,
  Share,
  Plus,
  MoreHorizontal,
  Archive,
  RotateCcw,
  Pencil,
  Eye,
  Copy,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/hooks/useToast'
import useSupplierDirectoryStore from '@/store/useSupplierDirectoryStore'
import SupplierDirectoryFormModal from '@/components/suppliers-directory/SupplierDirectoryFormModal'
import SupplierDirectoryDetailsModal from '@/components/suppliers-directory/SupplierDirectoryDetailsModal'
import { ConfirmationModal } from '@/components/ui/EnhancedModal'
import { telemetry } from '@/utils/telemetry'
import '@/styles/scss/pages/_suppliers.scss'

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null)

  const debounced = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )

  useEffect(
    () => () => timeoutRef.current && clearTimeout(timeoutRef.current),
    []
  )

  return debounced
}

const SupplierActionsMenu = ({
  context,
  onClose,
  onView,
  onEdit,
  onCopy,
  onDeactivate,
  onReactivate,
  t,
}) => {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!context) return undefined

    const handlePointerDown = event => {
      const target = event.target
      if (menuRef.current?.contains(target)) return
      if (context.button?.contains?.(target)) return
      onClose()
    }

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [context, onClose])

  if (!context) return null

  const { rect, supplier } = context
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0
  const scrollX = typeof window !== 'undefined' ? window.scrollX : 0
  const top = rect.bottom + scrollY + 6
  const left = rect.right + scrollX

  const style = {
    top: `${top}px`,
    left: `${left}px`,
    right: 'auto',
    transform: `translateX(-100%) translateX(${rect.width}px)`,
    position: 'absolute',
    zIndex: 1000,
  }

  const menu = (
    <div
      ref={menuRef}
      className='dropdown-menu dropdown-menu--portaled'
      style={style}
    >
      <button className='dropdown-menu__item' type='button' onClick={onView}>
        <Eye size={16} />
        {t('supplier.action.view', 'Ver detalle')}
      </button>
      <button className='dropdown-menu__item' type='button' onClick={onEdit}>
        <Pencil size={16} />
        {t('supplier.action.edit', 'Editar')}
      </button>
      <button className='dropdown-menu__item' type='button' onClick={onCopy}>
        <Copy size={16} />
        {t('supplier.action.copy_id', 'Copiar ID')}
      </button>
      {supplier.status ? (
        <button
          className='dropdown-menu__item dropdown-menu__item--danger'
          type='button'
          onClick={onDeactivate}
        >
          <Archive size={16} />
          {t('supplier.action.deactivate', 'Marcar inactivo')}
        </button>
      ) : (
        <button
          className='dropdown-menu__item'
          type='button'
          onClick={onReactivate}
        >
          <RotateCcw size={16} />
          {t('supplier.action.reactivate', 'Reactivar')}
        </button>
      )}
    </div>
  )

  return createPortal(menu, document.body)
}

const SuppliersPage = () => {
  const { t } = useI18n()
  const toast = useToast()

  const suppliers = useSupplierDirectoryStore(state => state.suppliers)
  const searchResults = useSupplierDirectoryStore(state => state.searchResults)
  const loading = useSupplierDirectoryStore(state => state.loading)
  const error = useSupplierDirectoryStore(state => state.error)
  const searchSuppliers = useSupplierDirectoryStore(
    state => state.searchSuppliers
  )
  const clearError = useSupplierDirectoryStore(state => state.clearError)
  const deleteSupplier = useSupplierDirectoryStore(
    state => state.deleteSupplier
  )
  const reactivateSupplier = useSupplierDirectoryStore(
    state => state.reactivateSupplier
  )
  const refreshAfterMutation = useSupplierDirectoryStore(
    state => state.refreshAfterMutation
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearchPending, setIsSearchPending] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [currentSupplier, setCurrentSupplier] = useState(null)
  const [detailsSupplier, setDetailsSupplier] = useState(null)
  const [menuContext, setMenuContext] = useState(null)
  const [pendingAction, setPendingAction] = useState({
    type: null,
    supplier: null,
  })

  useEffect(() => {
    if (error) {
      telemetry.record('suppliers.error.store', { message: error })
    }
  }, [error])

  useEffect(() => () => clearError(), [clearError])

  const closeMenu = () => setMenuContext(null)

  const handleViewSupplier = supplier => {
    closeMenu()
    setDetailsSupplier(supplier)
  }

  const handleEditSupplier = supplier => {
    closeMenu()
    setCurrentSupplier(supplier)
    setIsFormOpen(true)
  }

  const handleDeleteSupplier = supplier => {
    closeMenu()
    setPendingAction({ type: 'delete', supplier })
  }

  const handleReactivateSupplier = supplier => {
    closeMenu()
    setPendingAction({ type: 'reactivate', supplier })
  }

  const handleCopySupplierId = async supplier => {
    closeMenu()
    try {
      await navigator.clipboard.writeText(String(supplier.id))
      toast.success(t('supplier.action.copied', 'ID de proveedor copiado'))
    } catch {
      toast.error(t('supplier.action.copy_error', 'No se pudo copiar el ID'))
    }
  }

  const dataset = useMemo(
    () => (hasSearched ? searchResults : suppliers),
    [hasSearched, searchResults, suppliers]
  )

  useEffect(() => {
    setSelectedIds(prev =>
      prev.filter(id => dataset.some(item => item.id === id))
    )
  }, [dataset])

  const performSearch = useCallback(
    async term => {
      const trimmed = term.trim()
      if (!trimmed) {
        setHasSearched(false)
        setIsSearchPending(false)
        clearError()
        setSelectedIds([])
        useSupplierDirectoryStore.setState({
          searchResults: [],
          lastSearchTerm: '',
        })
        return
      }

      setHasSearched(true)
      setIsSearchPending(true)
      try {
        await searchSuppliers(trimmed)
      } catch (err) {
        toast.error(
          err?.message ||
            t('supplier.search.error', 'No se pudo completar la búsqueda')
        )
      } finally {
        setIsSearchPending(false)
      }
    },
    [clearError, searchSuppliers, t, toast]
  )

  const debouncedSearch = useDebounce(performSearch, 500)

  const handleSearchChange = event => {
    const value = event.target.value
    setSearchTerm(value)
    if (!value.trim()) {
      setHasSearched(false)
      debouncedSearch('')
    } else {
      debouncedSearch(value)
    }
  }

  const handleSearchKeyDown = event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      performSearch(searchTerm)
    }
  }

  const handleSelectSupplier = id => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === dataset.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(dataset.map(supplier => supplier.id))
    }
  }

  const toggleActionMenu = (event, supplier) => {
    event.stopPropagation()
    const buttonNode = event.currentTarget
    const rect = buttonNode.getBoundingClientRect()
    setMenuContext(current =>
      current?.id === supplier.id
        ? null
        : { id: supplier.id, supplier, button: buttonNode, rect }
    )
  }

  const isLoading = loading || isSearchPending

  const openCreateModal = () => {
    setCurrentSupplier(null)
    setIsFormOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!pendingAction.supplier || !pendingAction.type) {
      return
    }

    const { supplier, type } = pendingAction
    let result

    try {
      if (type === 'delete') {
        result = await deleteSupplier(supplier.id)
        if (result?.success) {
          toast.success(t('supplier.delete.success', 'Proveedor desactivado'))
        }
      } else if (type === 'reactivate') {
        result = await reactivateSupplier(supplier.id)
        if (result?.success) {
          toast.success(
            t('supplier.reactivate.success', 'Proveedor reactivado')
          )
        }
      }

      if (!result?.success) {
        toast.error(
          result?.error ||
            t('supplier.action.error', 'No se pudo completar la acción')
        )
      } else {
        await refreshAfterMutation()
      }
    } catch (err) {
      toast.error(
        err?.message ||
          t('supplier.action.error', 'No se pudo completar la acción')
      )
    } finally {
      setPendingAction({ type: null, supplier: null })
      closeMenu()
    }
  }

  const pendingMessage = useMemo(() => {
    if (!pendingAction.supplier || !pendingAction.type) return ''
    if (pendingAction.type === 'delete') {
      return t(
        'supplier.delete.message',
        'Esta acción marcará como inactivo al proveedor "{name}".'
      ).replace(
        '{name}',
        pendingAction.supplier.name || pendingAction.supplier.displayName || '-'
      )
    }
    return t(
      'supplier.reactivate.message',
      'Esta acción reactivará al proveedor "{name}".'
    ).replace(
      '{name}',
      pendingAction.supplier.name || pendingAction.supplier.displayName || '-'
    )
  }, [pendingAction, t])

  return (
    <div className='suppliers-page'>
      <div className='suppliers-page__header'>
        <div className='suppliers-page__header-left'>
          <h1 className='suppliers-page__title'>
            {t('supplier.title', 'Gestión de Proveedores')}
          </h1>
          <p className='suppliers-page__subtitle'>
            {t(
              'supplier.subtitle',
              'Crea, administra y consulta proveedores clave del negocio.'
            )}
          </p>
        </div>

        <button
          className='btn btn--primary'
          onClick={openCreateModal}
          aria-label={t('supplier.action.create', 'Nuevo proveedor')}
        >
          <Plus className='btn__icon' size={20} />
          {t('supplier.action.create', 'Nuevo proveedor')}
        </button>
      </div>

      <div className='suppliers-page__toolbar'>
        <div className='search-box search-box--with-icon'>
          <Search className='search-box__icon' size={20} />
          <input
            type='text'
            className='search-box__input'
            placeholder={t(
              'supplier.search.placeholder',
              'Buscar por nombre o ID...'
            )}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            aria-label={t('supplier.search.label', 'Buscar proveedores')}
          />
        </div>

        <div className='suppliers-page__toolbar-actions'>
          <button
            className='btn btn--secondary btn--icon'
            aria-label={t('action.filter', 'Filtrar')}
            title={t('action.filter', 'Filtrar')}
          >
            <Filter size={20} />
          </button>
          <button
            className='btn btn--secondary btn--icon'
            aria-label={t('action.export', 'Exportar')}
            title={t('action.export', 'Exportar')}
          >
            <Share size={20} />
          </button>
        </div>
      </div>

      <div className='suppliers-page__table-container'>
        <table className='suppliers-table'>
          <thead className='suppliers-table__header'>
            <tr>
              <th className='suppliers-table__header-cell suppliers-table__header-cell--checkbox'>
                <input
                  type='checkbox'
                  checked={
                    dataset.length > 0 && selectedIds.length === dataset.length
                  }
                  onChange={handleSelectAll}
                  aria-label={t('action.select_all', 'Seleccionar todos')}
                />
              </th>
              <th className='suppliers-table__header-cell'>
                {t('supplier.table.name', 'Proveedor')}
              </th>
              <th className='suppliers-table__header-cell'>
                {t('supplier.table.contact', 'Contacto')}
              </th>
              <th className='suppliers-table__header-cell'>
                {t('supplier.table.tax', 'RFC / Tax ID')}
              </th>
              <th className='suppliers-table__header-cell'>
                {t('supplier.table.created', 'Creado')}
              </th>
              <th className='suppliers-table__header-cell suppliers-table__header-cell--status'>
                {t('supplier.table.status', 'Estado')}
              </th>
              <th className='suppliers-table__header-cell suppliers-table__header-cell--actions' />
            </tr>
          </thead>

          <tbody className='suppliers-table__body'>
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className='suppliers-table__cell suppliers-table__cell--loading'
                >
                  {t('supplier.loading', 'Buscando proveedores...')}
                </td>
              </tr>
            ) : error && hasSearched ? (
              <tr>
                <td
                  colSpan={7}
                  className='suppliers-table__cell suppliers-table__cell--error'
                >
                  {error}
                </td>
              </tr>
            ) : dataset.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className='suppliers-table__cell suppliers-table__cell--empty'
                >
                  {hasSearched
                    ? t(
                        'supplier.search.no_results',
                        'No se encontraron proveedores con ese criterio'
                      )
                    : t(
                        'supplier.empty.prompt',
                        'Utiliza la barra de búsqueda para comenzar'
                      )}
                </td>
              </tr>
            ) : (
              dataset.map(supplier => {
                const contact = supplier.contact || {}
                const contactSummary = [contact.email, contact.phone]
                  .filter(Boolean)
                  .join(' • ')
                const createdAt = supplier.created_at || supplier.createdAt
                return (
                  <tr
                    key={supplier.id || supplier._key}
                    className='suppliers-table__row'
                    onClick={() => handleViewSupplier(supplier)}
                  >
                    <td
                      className='suppliers-table__cell suppliers-table__cell--checkbox'
                      onClick={event => event.stopPropagation()}
                    >
                      <input
                        type='checkbox'
                        checked={selectedIds.includes(supplier.id)}
                        onChange={() => handleSelectSupplier(supplier.id)}
                        aria-label={t(
                          'action.select_item',
                          'Seleccionar proveedor'
                        )}
                      />
                    </td>
                    <td className='suppliers-table__cell suppliers-table__cell--name'>
                      <span className='suppliers-table__name'>
                        {supplier.name}
                      </span>
                      {contact.address && (
                        <span className='suppliers-table__meta'>
                          {contact.address}
                        </span>
                      )}
                    </td>
                    <td className='suppliers-table__cell'>
                      <span className='suppliers-table__contact'>
                        {contactSummary || '-'}
                      </span>
                    </td>
                    <td className='suppliers-table__cell'>
                      <span className='suppliers-table__tax'>
                        {supplier.taxId || supplier.tax_id || '-'}
                      </span>
                    </td>
                    <td className='suppliers-table__cell'>
                      <span className='suppliers-table__date'>
                        {createdAt
                          ? new Date(createdAt).toLocaleDateString()
                          : '-'}
                      </span>
                    </td>
                    <td className='suppliers-table__cell suppliers-table__cell--status'>
                      <span
                        className={`badge badge--${
                          supplier.status ? 'success' : 'default'
                        }`}
                      >
                        {supplier.status
                          ? t('supplier.status.active', 'Activo')
                          : t('supplier.status.inactive', 'Inactivo')}
                      </span>
                    </td>
                    <td
                      className='suppliers-table__cell suppliers-table__cell--actions'
                      onClick={event => event.stopPropagation()}
                    >
                      <div className='suppliers-table__actions'>
                        <button
                          className='action-btn'
                          type='button'
                          onClick={event => toggleActionMenu(event, supplier)}
                          aria-label={t(
                            'action.open_menu',
                            'Abrir menú de acciones'
                          )}
                        >
                          <MoreHorizontal className='action-btn__icon' />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <SupplierDirectoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        supplier={currentSupplier}
      />

      <SupplierDirectoryDetailsModal
        isOpen={Boolean(detailsSupplier)}
        onClose={() => setDetailsSupplier(null)}
        supplier={detailsSupplier}
      />

      <ConfirmationModal
        isOpen={Boolean(pendingAction.type)}
        onClose={() => setPendingAction({ type: null, supplier: null })}
        onConfirm={handleConfirmAction}
        title={
          pendingAction.type === 'delete'
            ? t('supplier.delete.title', 'Desactivar proveedor')
            : t('supplier.reactivate.title', 'Reactivar proveedor')
        }
        message={pendingMessage}
        variant={pendingAction.type === 'delete' ? 'error' : 'default'}
        confirmText={
          pendingAction.type === 'delete'
            ? t('supplier.delete.confirm', 'Desactivar proveedor')
            : t('supplier.reactivate.confirm', 'Reactivar proveedor')
        }
        cancelText={t('modal.cancel', 'Cancelar')}
        loading={loading}
      />

      {menuContext && (
        <SupplierActionsMenu
          context={menuContext}
          onClose={closeMenu}
          onView={() => handleViewSupplier(menuContext.supplier)}
          onEdit={() => handleEditSupplier(menuContext.supplier)}
          onCopy={() => handleCopySupplierId(menuContext.supplier)}
          onDeactivate={() => handleDeleteSupplier(menuContext.supplier)}
          onReactivate={() => handleReactivateSupplier(menuContext.supplier)}
          t={t}
        />
      )}
    </div>
  )
}

export default SuppliersPage
