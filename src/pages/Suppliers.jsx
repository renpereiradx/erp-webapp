// ===========================================================================
// Suppliers Page - Refactored with Tailwind CSS & Fluent Design System 2
// Consistent with Products and Clients page design
// ===========================================================================

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
  TrendingUp,
  RefreshCw,
  MoreVertical,
  Truck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/hooks/useToast'
import useSupplierDirectoryStore from '@/store/useSupplierDirectoryStore'
import SupplierDirectoryFormModal from '@/components/suppliers-directory/SupplierDirectoryFormModal'
import SupplierDirectoryDetailsModal from '@/components/suppliers-directory/SupplierDirectoryDetailsModal'
import { ConfirmationModal } from '@/components/ui/EnhancedModal'
import { telemetry } from '@/utils/telemetry'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import ToastContainer from '@/components/ui/ToastContainer'

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
  onAnalyze,
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
      className='bg-white border border-[#e5e7eb] rounded-lg shadow-fluent-16 py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100'
      style={style}
    >
      <button 
        className='flex items-center gap-3 w-full px-4 py-2 text-sm text-[#242424] hover:bg-gray-50 transition-colors text-left' 
        type='button' 
        onClick={onView}
      >
        <Eye size={16} className="text-gray-500" />
        {t('supplier.action.view', 'Ver detalle')}
      </button>
      <button 
        className='flex items-center gap-3 w-full px-4 py-2 text-sm text-[#242424] hover:bg-gray-50 transition-colors text-left' 
        type='button' 
        onClick={onAnalyze}
      >
        <TrendingUp size={16} className="text-gray-500" />
        {t('supplier.action.analyze', 'Análisis de Deuda')}
      </button>
      <button 
        className='flex items-center gap-3 w-full px-4 py-2 text-sm text-[#242424] hover:bg-gray-50 transition-colors text-left' 
        type='button' 
        onClick={onEdit}
      >
        <Pencil size={16} className="text-gray-500" />
        {t('supplier.action.edit', 'Editar')}
      </button>
      <button 
        className='flex items-center gap-3 w-full px-4 py-2 text-sm text-[#242424] hover:bg-gray-50 transition-colors text-left' 
        type='button' 
        onClick={onCopy}
      >
        <Copy size={16} className="text-gray-500" />
        {t('supplier.action.copy_id', 'Copiar ID')}
      </button>
      <hr className="my-1 border-gray-100" />
      {supplier.status ? (
        <button
          className='flex items-center gap-3 w-full px-4 py-2 text-sm text-[#a4262c] hover:bg-red-50 transition-colors text-left'
          type='button'
          onClick={onDeactivate}
        >
          <Archive size={16} />
          {t('supplier.action.deactivate', 'Marcar inactivo')}
        </button>
      ) : (
        <button
          className='flex items-center gap-3 w-full px-4 py-2 text-sm text-[#107c10] hover:bg-green-50 transition-colors text-left'
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
  const navigate = useNavigate()

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

  const handleAnalyzeSupplier = supplier => {
    closeMenu()
    navigate(`/proveedores/${supplier.id}/analisis`)
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
    if (selectedIds.length === dataset.length && dataset.length > 0) {
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
    <div className='min-h-screen bg-[#f3f4f6] text-[#323130] p-8 overflow-y-auto'>
      <div className='max-w-[1600px] mx-auto'>
        
        {/* Breadcrumbs */}
        <nav className="flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest gap-2 mb-6">
          <span onClick={() => navigate('/dashboard')} className="hover:text-[#106ebe] cursor-pointer transition-colors">
            {t('supplier.breadcrumb.home', 'Inicio')}
          </span>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-[#242424] font-bold">{t('supplier.title', 'Proveedores')}</span>
        </nav>

        {/* Header Section */}
        <div className='flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-l-4 border-[#106ebe] pl-4'>
          <div>
            <h1 className='text-3xl font-black tracking-tighter uppercase text-[#242424]'>
              {t('supplier.title', 'Gestión de Proveedores')}
            </h1>
            <p className='text-[#616161] text-sm font-medium mt-1'>
              {t('supplier.subtitle', 'Crea, administra y consulta proveedores clave del negocio.')}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={() => refreshAfterMutation()}
              disabled={isLoading}
              className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className='hidden sm:inline'>{t('action.refresh', 'Refrescar')}</span>
            </Button>
            <Button variant='outline' className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700">
              <Share className='size-4 mr-2' />
              <span className='hidden sm:inline'>{t('action.export', 'Exportar')}</span>
            </Button>
            <Button 
              className='bg-[#106ebe] hover:bg-[#005a9e] text-white px-5 shadow-sm border-none'
              onClick={openCreateModal}
            >
              <Plus className='size-4 mr-2' />
              <span>{t('supplier.action.create', 'Nuevo proveedor')}</span>
            </Button>
          </div>
        </div>

        {/* Toolbar Card */}
        <Card className='bg-white border-gray-200 rounded-xl shadow-sm p-6 mb-6'>
          <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
            {/* Search */}
            <div className='relative flex-1 max-w-xl'>
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                {isLoading ? (
                  <RefreshCw className="size-5 animate-spin" />
                ) : (
                  <Search className="size-5" />
                )}
              </span>
              <Input
                type='search'
                className='block w-full pl-10 pr-3 py-2.5 border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#106ebe] focus:border-transparent outline-none transition-all h-11'
                placeholder={t('supplier.search.placeholder', 'Buscar por nombre o ID...')}
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

            {/* Filters */}
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                className="h-11 px-4 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Filter className='size-4 mr-2' />
                {t('action.filter', 'Filtrar')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Table Container */}
        <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
          <Table>
            <TableHeader className="bg-gray-50/50 border-b border-gray-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className='w-[60px] text-center px-6'>
                  <Checkbox
                    checked={dataset.length > 0 && selectedIds.length === dataset.length}
                    onCheckedChange={handleSelectAll}
                    className="border-gray-300 data-[state=checked]:bg-[#106ebe] data-[state=checked]:border-[#106ebe]"
                  />
                </TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">
                  {t('supplier.table.name', 'Proveedor')}
                </TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">
                  {t('supplier.table.contact', 'Contacto')}
                </TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">
                  {t('supplier.table.tax', 'RFC / Tax ID')}
                </TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">
                  {t('supplier.table.created', 'Creado')}
                </TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">
                  {t('supplier.table.status', 'Estado')}
                </TableHead>
                <TableHead className='w-16 py-4 px-6'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && dataset.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="size-10 border-4 border-[#106ebe]/20 border-t-[#106ebe] rounded-full animate-spin"></div>
                      <span className="text-sm text-[#616161] font-bold uppercase tracking-widest">
                        {t('supplier.loading', 'Buscando proveedores...')}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error && hasSearched ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="text-[#a4262c] font-black uppercase tracking-wider">{error}</div>
                  </TableCell>
                </TableRow>
              ) : dataset.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center text-[#616161]">
                    <div className="max-w-md mx-auto font-medium">
                      {hasSearched
                        ? t('supplier.search.no_results', 'No se encontraron proveedores con ese criterio')
                        : t('supplier.empty.prompt', 'Utiliza la barra de búsqueda para comenzar')}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                dataset.map(supplier => {
                  const contact = supplier.contact || {}
                  const contactSummary = [contact.email, contact.phone]
                    .filter(Boolean)
                    .join(' • ')
                  const createdAt = supplier.created_at || supplier.createdAt
                  const isSelected = selectedIds.includes(supplier.id)
                  const isActive = supplier.status !== false

                  return (
                    <TableRow
                      key={supplier.id || supplier._key}
                      selected={isSelected}
                      className='border-b border-gray-50 hover:bg-gray-50 transition-colors group cursor-pointer'
                      onClick={() => handleViewSupplier(supplier)}
                    >
                      <TableCell 
                        className='px-6 text-center'
                        onClick={event => event.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectSupplier(supplier.id)}
                          className="border-gray-300 data-[state=checked]:bg-[#106ebe] data-[state=checked]:border-[#106ebe]"
                        />
                      </TableCell>
                      <TableCell className='py-4 px-4'>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden text-[#106ebe]">
                            <Truck size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-[#242424] group-hover:text-[#106ebe] group-hover:underline transition-colors">
                              {supplier.name}
                            </span>
                            {contact.address && (
                              <span className='text-[11px] text-[#616161] line-clamp-1'>
                                {contact.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='py-4 px-4 text-xs text-[#616161] font-medium'>
                        {contactSummary || '-'}
                      </TableCell>
                      <TableCell className='py-4 px-4 text-xs font-mono font-bold text-[#616161]'>
                        {supplier.taxId || supplier.tax_id || '-'}
                      </TableCell>
                      <TableCell className='py-4 px-4 text-xs text-[#616161] font-medium'>
                        {createdAt ? new Date(createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className='py-4 px-4'>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-[#dff6dd] text-[#107c10]'
                              : 'bg-[#f3f4f6] text-[#616161]'
                          }`}
                        >
                          {isActive
                            ? t('supplier.status.active', 'Activo')
                            : t('supplier.status.inactive', 'Inactivo')}
                        </span>
                      </TableCell>
                      <TableCell
                        className='text-right px-6'
                        onClick={event => event.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          onClick={event => toggleActionMenu(event, supplier)}
                        >
                          <MoreVertical className="size-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
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
          onAnalyze={() => handleAnalyzeSupplier(menuContext.supplier)}
          onEdit={() => handleEditSupplier(menuContext.supplier)}
          onCopy={() => handleCopySupplierId(menuContext.supplier)}
          onDeactivate={() => handleDeleteSupplier(menuContext.supplier)}
          onReactivate={() => handleReactivateSupplier(menuContext.supplier)}
          t={t}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  )
}

export default SuppliersPage
