/**
 * Página de Gestión de Inventarios (Ajuste Masivo)
 * Permite ver, crear y gestionar inventarios masivos
 * Patrón: MVP - UI First (endpoints se implementarán después)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import useInventoryManagementStore from '@/store/useInventoryManagementStore'
import { productService } from '@/services/productService'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/ToastContainer'
import '../styles/scss/pages/_inventory-management.scss'

// Iconos de Lucide React
import {
  Filter,
  Calendar,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Trash2,
  Search,
  Loader2,
} from 'lucide-react'

const InventoryManagement = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const toast = useToast()

  // Store hooks
  const {
    inventories,
    selectedInventory,
    loading,
    error,
    pagination,
    fetchInventories,
    fetchInventoryDetails,
    invalidateInventory,
    clearError,
    setPage,
    createInventory,
    clearSelectedInventory,
  } = useInventoryManagementStore()

  // Estado local
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filtros
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all', // all, active, invalid, reverted
    location: '',
  })

  // Formulario de creación de inventario
  const [inventoryForm, setInventoryForm] = useState({
    metadata: {
      operator: '',
      location: '',
      counting_method: 'manual',
      verification: 'single_check',
      source: 'physical_count',
      notes: '',
    },
    items: [],
  })

  const [formErrors, setFormErrors] = useState([])

  // Sistema de búsqueda de productos
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Debounce timer
  const searchTimeoutRef = useRef(null)

  // Scroll automático al item resaltado cuando se navega con teclado
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.querySelector(
        `#inventory-mgmt-product-option-${highlightedIndex}`
      )
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [highlightedIndex])

  // Handler de búsqueda inteligente (similar a InventoryAdjustmentManual)
  const handleProductSearch = useCallback(async searchTerm => {
    // Limpiar timer anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    // Debounce de 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        // Usar searchProducts que maneja búsqueda inteligente por ID, nombre o barcode
        const results = await productService.searchProducts(searchTerm.trim())
        const resultsArray = Array.isArray(results) ? results : [results]

        // Filtrar solo productos activos (un producto está activo si ninguno de estos campos es false)
        const activeProducts = resultsArray.filter(
          product => product.state !== false && product.is_active !== false
        )

        setSearchResults(activeProducts)
        setShowDropdown(true)
      } catch (error) {
        console.error('Error al buscar productos:', error)
        setSearchResults([])
        setShowDropdown(false)
      } finally {
        setSearchLoading(false)
      }
    }, 300)
  }, [])

  // Handler para seleccionar un producto del dropdown
  const handleSelectProduct = product => {
    // Agregar producto a la lista con toda su información
    // Nota: searchProducts devuelve productos con estructura financial que usa:
    // - product_id (no id)
    // - product_name (no name)
    // - stock_quantity (no quantity ni stock)
    const newItem = {
      product_id: product.product_id,
      product_name: product.product_name || 'N/A',
      current_quantity: product.stock_quantity || 0,
      quantity_checked: 0,
    }

    setInventoryForm({
      ...inventoryForm,
      items: [...inventoryForm.items, newItem],
    })

    // Limpiar búsqueda
    setProductSearch('')
    setSearchResults([])
    setShowDropdown(false)
    setHighlightedIndex(-1)

    // Enfocar el input de búsqueda
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Cargar inventarios al montar el componente
  useEffect(() => {
    fetchInventories(pagination.page, pagination.pageSize)
  }, [])

  // Recargar cuando cambia la página
  useEffect(() => {
    fetchInventories(pagination.page, pagination.pageSize)
  }, [pagination.page])

  // Calcular índices para paginación
  const startIndex = (pagination.page - 1) * pagination.pageSize
  const endIndex = startIndex + pagination.pageSize

  // Handlers de formulario de creación
  const handleCreateNew = () => {
    // Resetear formulario
    setInventoryForm({
      metadata: {
        operator: '',
        location: '',
        counting_method: 'manual',
        verification: 'single_check',
        source: 'physical_count',
        notes: '',
      },
      items: [],
    })
    setFormErrors([])
    setShowCreateModal(true)
  }

  const handleRemoveProduct = index => {
    const newItems = inventoryForm.items.filter((_, i) => i !== index)
    setInventoryForm({ ...inventoryForm, items: newItems })
  }

  const handleProductChange = (index, field, value) => {
    const newItems = [...inventoryForm.items]
    newItems[index][field] = parseInt(value) || 0
    setInventoryForm({ ...inventoryForm, items: newItems })
  }

  const handleMetadataChange = (field, value) => {
    setInventoryForm({
      ...inventoryForm,
      metadata: { ...inventoryForm.metadata, [field]: value },
    })
  }

  const validateForm = () => {
    const errors = []

    // Validar metadata
    if (
      !inventoryForm.metadata.operator ||
      !inventoryForm.metadata.operator.trim()
    ) {
      errors.push('El campo Operador es requerido')
    }
    if (
      !inventoryForm.metadata.location ||
      !inventoryForm.metadata.location.trim()
    ) {
      errors.push('El campo Ubicación es requerido')
    }

    // Validar productos
    if (!inventoryForm.items || inventoryForm.items.length === 0) {
      errors.push(t('inventoryManagement.createModal.minOneProduct'))
    }

    // Validación exhaustiva de cada item
    inventoryForm.items?.forEach((item, index) => {
      // Validar product_id
      if (
        !item.product_id ||
        typeof item.product_id !== 'string' ||
        item.product_id.trim() === ''
      ) {
        errors.push(`Producto ${index + 1}: ID es inválido o vacío`)
      }

      // Validar quantity_checked
      const qty = Number(item.quantity_checked)
      if (isNaN(qty) || qty < 0) {
        errors.push(
          `Producto ${index + 1}: Cantidad contada debe ser un número >= 0`
        )
      }
    })

    return errors
  }

  const handleSubmitInventory = async () => {
    setFormErrors([])

    const errors = validateForm()
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    // Preparar datos para la API con sanitización
    // IMPORTANTE: Sanitizar quantity_checked para asegurar que siempre sea número
    const inventoryData = {
      items: inventoryForm.items.map(item => ({
        product_id: String(item.product_id).trim(),
        quantity_checked: parseFloat(item.quantity_checked) || 0,
      })),
      metadata: {
        ...inventoryForm.metadata,
        timestamp: new Date().toISOString(),
      },
    }

    // Validación final antes de enviar (double-check)
    if (!inventoryData.items || inventoryData.items.length === 0) {
      setFormErrors([
        'Error: No hay productos para enviar. Por favor, agregue al menos un producto.',
      ])
      return
    }

    // Enviar a la API a través del store
    const result = await createInventory(inventoryData)

    if (result.success) {
      // Mostrar notificación de éxito
      toast.success(
        `Inventario creado exitosamente con ${
          inventoryData.items.length
        } producto${inventoryData.items.length !== 1 ? 's' : ''}`,
        4000
      )

      setShowCreateModal(false)
      // Limpiar búsqueda
      setProductSearch('')
      setSearchResults([])
      setShowDropdown(false)
      // El store ya recargará los datos automáticamente
    } else {
      // Mostrar notificación de error
      toast.error(result.error || 'Error al crear el inventario', 5000)
      setFormErrors([result.error || 'Error al crear el inventario'])
    }
  }

  const handleFilter = () => {
    setShowFilters(!showFilters)
  }

  const handleApplyFilters = () => {
    // Recargar datos con filtros aplicados
    fetchInventories(1, pagination.pageSize)
  }

  const handleClearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: 'all',
      location: '',
    })
    // Recargar datos sin filtros
    fetchInventories(1, pagination.pageSize)
  }

  const handleDownload = () => {
    const filteredData = getFilteredInventories()

    if (filteredData.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    // Crear CSV
    const headers = [
      'ID',
      'Estado',
      'Fecha de Creación',
      'Ubicación',
      'Operador',
      'Origen',
      'Método de Conteo',
      'Verificación',
    ]

    const csvRows = filteredData.map(inv => {
      const status = getInventoryStatus(inv.state, inv.metadata)
      return [
        inv.id,
        status.label,
        formatDate(inv.check_date),
        inv.metadata?.location || 'N/A',
        inv.metadata?.operator || 'N/A',
        getOrigin(inv.metadata),
        inv.metadata?.counting_method || 'N/A',
        inv.metadata?.verification || 'N/A',
      ]
    })

    // Combinar headers y rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    const timestamp = new Date().toISOString().split('T')[0]
    link.setAttribute('href', url)
    link.setAttribute('download', `inventarios_${timestamp}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = async id => {
    await fetchInventoryDetails(id)
    setShowDetailsModal(true)
    setOpenMenuId(null)
  }

  const handleEdit = id => {
    // TODO: Implementar edición de inventario
    setOpenMenuId(null)
  }

  const handleDelete = async id => {
    setShowDeleteConfirm(id)
    setOpenMenuId(null)
  }

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      const result = await invalidateInventory(showDeleteConfirm)

      if (result.success) {
        toast.success('Inventario invalidado exitosamente', 3000)
      } else {
        toast.error(result.error || 'Error al invalidar el inventario', 5000)
      }

      setShowDeleteConfirm(null)
    }
  }

  const handleMenuToggle = id => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  // Formatear fecha ISO 8601 a dd/mm/yyyy HH:mm
  const formatDate = isoDate => {
    const date = new Date(isoDate)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  // Mapear state de la API a estado visual
  const getInventoryStatus = (state, metadata) => {
    if (state === true) {
      return { label: 'Activo', type: 'active' }
    }
    // Si state es false, verificar si fue revertido o simplemente invalidado
    if (metadata?.invalidation_reason === 'manual_reversal') {
      return { label: 'Revertido', type: 'reverted' }
    }
    return { label: 'Inválido', type: 'invalid' }
  }

  const getStatusClass = statusType => {
    const statusMap = {
      active: 'inventory-management__badge--active',
      invalid: 'inventory-management__badge--invalid',
      reverted: 'inventory-management__badge--reverted',
    }
    return statusMap[statusType] || ''
  }

  // Obtener origen desde metadata
  const getOrigin = metadata => {
    const sourceMap = {
      physical_count: 'Conteo Manual',
      barcode_scanner: 'Sistema POS',
      rfid: 'Transferencia',
      manual_adjustment: 'Ajuste Manual',
    }
    return sourceMap[metadata?.source] || metadata?.source || 'N/A'
  }

  // Filtrar inventarios localmente
  const getFilteredInventories = () => {
    let filtered = [...inventories]

    // Filtro por fecha
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(inv => new Date(inv.check_date) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // Incluir todo el día
      filtered = filtered.filter(inv => new Date(inv.check_date) <= toDate)
    }

    // Filtro por estado
    if (filters.status !== 'all') {
      filtered = filtered.filter(inv => {
        const status = getInventoryStatus(inv.state, inv.metadata)
        if (filters.status === 'active') return status.type === 'active'
        if (filters.status === 'invalid') return status.type === 'invalid'
        if (filters.status === 'reverted') return status.type === 'reverted'
        return true
      })
    }

    // Filtro por ubicación
    if (filters.location) {
      const searchTerm = filters.location.toLowerCase()
      filtered = filtered.filter(inv =>
        inv.metadata?.location?.toLowerCase().includes(searchTerm)
      )
    }

    return filtered
  }

  // Generar números de página para la paginación
  const getPageNumbers = () => {
    const pages = []
    const totalPages = pagination.totalPages
    const currentPage = pagination.page

    if (totalPages <= 7) {
      // Si hay 7 páginas o menos, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Si hay más de 7 páginas, mostrar con ellipsis
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div className='inventory-management'>
      {/* Header */}
      <header className='inventory-management__header'>
        <div className='inventory-management__header-content'>
          <h1 className='inventory-management__title'>
            {t('inventoryManagement.title')}
          </h1>
          <p className='inventory-management__subtitle'>
            {t('inventoryManagement.subtitle')}
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <div className='inventory-management__toolbar'>
        <div className='inventory-management__toolbar-left'>
          <button
            className='inventory-management__toolbar-button'
            onClick={handleFilter}
            title={t('inventoryManagement.toolbar.filter')}
          >
            <Filter size={20} />
          </button>
          <button
            className='inventory-management__toolbar-button'
            onClick={handleDownload}
            title={t('inventoryManagement.toolbar.download')}
          >
            <Download size={20} />
          </button>
        </div>

        <div className='inventory-management__toolbar-right'>
          <button
            className='inventory-management__button inventory-management__button--primary'
            onClick={handleCreateNew}
          >
            <Plus size={16} />
            {t('inventoryManagement.toolbar.createNew')}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className='inventory-management__filters'>
          <div className='inventory-management__filters-header'>
            <h3 className='inventory-management__filters-title'>
              {t('inventoryManagement.filters.title')}
            </h3>
          </div>
          <div className='inventory-management__filters-grid'>
            <div className='inventory-management__filter-group'>
              <label className='inventory-management__filter-label'>
                {t('inventoryManagement.filters.dateFrom')}
              </label>
              <input
                type='date'
                className='inventory-management__filter-input'
                value={filters.dateFrom}
                onChange={e =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
              />
            </div>
            <div className='inventory-management__filter-group'>
              <label className='inventory-management__filter-label'>
                {t('inventoryManagement.filters.dateTo')}
              </label>
              <input
                type='date'
                className='inventory-management__filter-input'
                value={filters.dateTo}
                onChange={e =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
              />
            </div>
            <div className='inventory-management__filter-group'>
              <label className='inventory-management__filter-label'>
                {t('inventoryManagement.filters.status')}
              </label>
              <select
                className='inventory-management__filter-select'
                value={filters.status}
                onChange={e =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value='all'>
                  {t('inventoryManagement.filters.statusAll')}
                </option>
                <option value='active'>
                  {t('inventoryManagement.filters.statusActive')}
                </option>
                <option value='invalid'>
                  {t('inventoryManagement.filters.statusInvalid')}
                </option>
                <option value='reverted'>
                  {t('inventoryManagement.filters.statusReverted')}
                </option>
              </select>
            </div>
            <div className='inventory-management__filter-group'>
              <label className='inventory-management__filter-label'>
                {t('inventoryManagement.filters.location')}
              </label>
              <input
                type='text'
                className='inventory-management__filter-input'
                placeholder={t(
                  'inventoryManagement.filters.locationPlaceholder'
                )}
                value={filters.location}
                onChange={e =>
                  setFilters({ ...filters, location: e.target.value })
                }
              />
            </div>
          </div>
          <div className='inventory-management__filters-actions'>
            <button
              className='inventory-management__button inventory-management__button--secondary'
              onClick={handleClearFilters}
            >
              {t('inventoryManagement.filters.clear')}
            </button>
            <button
              className='inventory-management__button inventory-management__button--primary'
              onClick={handleApplyFilters}
            >
              {t('inventoryManagement.filters.apply')}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className='inventory-management__table-container'>
        <table className='inventory-management__table'>
          <thead>
            <tr>
              <th>{t('inventoryManagement.table.id')}</th>
              <th>{t('inventoryManagement.table.status')}</th>
              <th>{t('inventoryManagement.table.createdAt')}</th>
              <th>{t('inventoryManagement.table.location')}</th>
              <th>{t('inventoryManagement.table.operator')}</th>
              <th>{t('inventoryManagement.table.origin')}</th>
              <th>{t('inventoryManagement.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan='7' className='inventory-management__empty'>
                  {t('inventoryManagement.table.loading') ||
                    'Cargando inventarios...'}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan='7' className='inventory-management__empty'>
                  {error}
                </td>
              </tr>
            ) : getFilteredInventories().length === 0 ? (
              <tr>
                <td colSpan='7' className='inventory-management__empty'>
                  {inventories.length === 0
                    ? t('inventoryManagement.table.noData')
                    : t('inventoryManagement.table.noResults')}
                </td>
              </tr>
            ) : (
              getFilteredInventories().map(inventory => {
                const status = getInventoryStatus(
                  inventory.state,
                  inventory.metadata
                )
                return (
                  <tr key={inventory.id}>
                    <td className='inventory-management__cell inventory-management__cell--id'>
                      {inventory.id}
                    </td>
                    <td className='inventory-management__cell'>
                      <span
                        className={`inventory-management__badge ${getStatusClass(
                          status.type
                        )}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className='inventory-management__cell'>
                      {formatDate(inventory.check_date)}
                    </td>
                    <td className='inventory-management__cell'>
                      {inventory.metadata?.location || 'N/A'}
                    </td>
                    <td className='inventory-management__cell'>
                      {inventory.metadata?.operator || 'N/A'}
                    </td>
                    <td className='inventory-management__cell'>
                      {getOrigin(inventory.metadata)}
                    </td>
                    <td className='inventory-management__cell inventory-management__cell--actions'>
                      <div className='inventory-management__actions-wrapper'>
                        <button
                          className='inventory-management__menu-button'
                          onClick={() => handleMenuToggle(inventory.id)}
                          title={t('inventoryManagement.actions.menu')}
                        >
                          <MoreHorizontal size={20} />
                        </button>
                        {openMenuId === inventory.id && (
                          <div className='inventory-management__menu'>
                            <button
                              className='inventory-management__menu-item'
                              onClick={() => handleView(inventory.id)}
                            >
                              {t('inventoryManagement.actions.view')}
                            </button>
                            <button
                              className='inventory-management__menu-item'
                              onClick={() => handleEdit(inventory.id)}
                            >
                              {t('inventoryManagement.actions.edit')}
                            </button>
                            <button
                              className='inventory-management__menu-item inventory-management__menu-item--danger'
                              onClick={() => handleDelete(inventory.id)}
                            >
                              {t('inventoryManagement.actions.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          {/* Pagination dentro de la tabla */}
          <tfoot>
            <tr>
              <td colSpan='7' className='inventory-management__pagination-cell'>
                <div className='inventory-management__pagination'>
                  <div className='inventory-management__pagination-info'>
                    {t('inventoryManagement.pagination.showing', {
                      start: startIndex + 1,
                      end: Math.min(endIndex, pagination.total),
                      total: pagination.total,
                    })}
                  </div>
                  <div className='inventory-management__pagination-controls'>
                    <button
                      className='inventory-management__pagination-button'
                      onClick={() => setPage(Math.max(1, pagination.page - 1))}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {getPageNumbers().map((page, index) =>
                      page === '...' ? (
                        <span
                          key={`ellipsis-${index}`}
                          className='inventory-management__pagination-ellipsis'
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          className={`inventory-management__pagination-number ${
                            pagination.page === page
                              ? 'inventory-management__pagination-number--active'
                              : ''
                          }`}
                          onClick={() => setPage(page)}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      className='inventory-management__pagination-button'
                      onClick={() =>
                        setPage(
                          Math.min(pagination.totalPages, pagination.page + 1)
                        )
                      }
                      disabled={pagination.page === pagination.totalPages}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div
          className='inventory-management__modal-overlay'
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className='inventory-management__modal'
            onClick={e => e.stopPropagation()}
          >
            <div className='inventory-management__modal-header'>
              <h2 className='inventory-management__modal-title'>
                {t('inventoryManagement.deleteModal.title')}
              </h2>
            </div>
            <div className='inventory-management__modal-body'>
              <p className='inventory-management__delete-message'>
                {t('inventoryManagement.deleteModal.message')}
              </p>
              <div className='inventory-management__delete-info'>
                <div className='inventory-management__delete-info-label'>
                  {t('inventoryManagement.deleteModal.inventoryId')}
                </div>
                <div className='inventory-management__delete-info-value'>
                  {showDeleteConfirm}
                </div>
              </div>
            </div>
            <div className='inventory-management__modal-footer'>
              <button
                className='inventory-management__button inventory-management__button--secondary'
                onClick={() => setShowDeleteConfirm(null)}
              >
                {t('inventoryManagement.deleteModal.cancel')}
              </button>
              <button
                className='inventory-management__button inventory-management__button--danger'
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading
                  ? 'Procesando...'
                  : t('inventoryManagement.deleteModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Creación de Nuevo Inventario */}
      {showCreateModal && (
        <div
          className='inventory-management__modal-overlay'
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className='inventory-management__modal inventory-management__modal--large'
            onClick={e => e.stopPropagation()}
          >
            <div className='inventory-management__modal-header'>
              <h2 className='inventory-management__modal-title'>
                {t('inventoryManagement.createModal.title')}
              </h2>
              <p className='inventory-management__modal-subtitle'>
                {t('inventoryManagement.createModal.subtitle')}
              </p>
            </div>
            <div className='inventory-management__modal-body'>
              {/* Errores de validación */}
              {formErrors.length > 0 && (
                <div className='inventory-management__form-errors'>
                  {formErrors.map((error, index) => (
                    <div
                      key={index}
                      className='inventory-management__form-error'
                    >
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {/* Sección de Metadata */}
              <div className='inventory-management__details-section'>
                <h3 className='inventory-management__details-section-title'>
                  {t('inventoryManagement.createModal.metadata')}
                </h3>
                <div className='inventory-management__form-grid'>
                  <div className='inventory-management__form-group'>
                    <label className='inventory-management__form-label'>
                      {t('inventoryManagement.createModal.operator')} *
                    </label>
                    <input
                      type='text'
                      className='inventory-management__form-input'
                      placeholder={t(
                        'inventoryManagement.createModal.operatorPlaceholder'
                      )}
                      value={inventoryForm.metadata.operator}
                      onChange={e =>
                        handleMetadataChange('operator', e.target.value)
                      }
                    />
                  </div>
                  <div className='inventory-management__form-group'>
                    <label className='inventory-management__form-label'>
                      {t('inventoryManagement.createModal.location')} *
                    </label>
                    <input
                      type='text'
                      className='inventory-management__form-input'
                      placeholder={t(
                        'inventoryManagement.createModal.locationPlaceholder'
                      )}
                      value={inventoryForm.metadata.location}
                      onChange={e =>
                        handleMetadataChange('location', e.target.value)
                      }
                    />
                  </div>
                  <div className='inventory-management__form-group'>
                    <label className='inventory-management__form-label'>
                      {t('inventoryManagement.createModal.countingMethod')}
                    </label>
                    <select
                      className='inventory-management__form-select'
                      value={inventoryForm.metadata.counting_method}
                      onChange={e =>
                        handleMetadataChange('counting_method', e.target.value)
                      }
                    >
                      <option value='manual'>
                        {t('inventoryManagement.createModal.methodManual')}
                      </option>
                      <option value='barcode_scanner'>
                        {t('inventoryManagement.createModal.methodScanner')}
                      </option>
                      <option value='rfid'>
                        {t('inventoryManagement.createModal.methodRFID')}
                      </option>
                    </select>
                  </div>
                  <div className='inventory-management__form-group'>
                    <label className='inventory-management__form-label'>
                      {t('inventoryManagement.createModal.verification')}
                    </label>
                    <select
                      className='inventory-management__form-select'
                      value={inventoryForm.metadata.verification}
                      onChange={e =>
                        handleMetadataChange('verification', e.target.value)
                      }
                    >
                      <option value='single_check'>
                        {t(
                          'inventoryManagement.createModal.verificationSingle'
                        )}
                      </option>
                      <option value='double_check'>
                        {t(
                          'inventoryManagement.createModal.verificationDouble'
                        )}
                      </option>
                    </select>
                  </div>
                </div>
                <div className='inventory-management__form-group'>
                  <label className='inventory-management__form-label'>
                    {t('inventoryManagement.createModal.notes')}
                  </label>
                  <textarea
                    className='inventory-management__form-textarea'
                    placeholder={t(
                      'inventoryManagement.createModal.notesPlaceholder'
                    )}
                    value={inventoryForm.metadata.notes}
                    onChange={e =>
                      handleMetadataChange('notes', e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </div>

              {/* Sección de Productos */}
              <div className='inventory-management__details-section'>
                <div className='inventory-management__products-header'>
                  <h3 className='inventory-management__details-section-title'>
                    {t('inventoryManagement.createModal.products')} (
                    {inventoryForm.items.length})
                  </h3>
                </div>

                {/* Sistema de búsqueda inteligente */}
                <div className='inventory-management__product-search-container'>
                  <div className='inventory-management__search-input-wrapper'>
                    <Search
                      size={20}
                      className='inventory-management__search-icon'
                    />
                    <input
                      ref={searchInputRef}
                      type='text'
                      className='inventory-management__search-input'
                      placeholder={t(
                        'inventoryManagement.createModal.searchProduct'
                      )}
                      value={productSearch}
                      onChange={e => {
                        setProductSearch(e.target.value)
                        handleProductSearch(e.target.value)
                        setHighlightedIndex(-1)
                      }}
                      onFocus={() => {
                        if (searchResults.length > 0) {
                          setShowDropdown(true)
                        }
                      }}
                      onKeyDown={e => {
                        const itemCount = searchResults.length
                        if (itemCount === 0) return

                        switch (e.key) {
                          case 'ArrowDown':
                            e.preventDefault()
                            setHighlightedIndex(prev =>
                              prev < itemCount - 1 ? prev + 1 : 0
                            )
                            break
                          case 'ArrowUp':
                            e.preventDefault()
                            setHighlightedIndex(prev =>
                              prev > 0 ? prev - 1 : itemCount - 1
                            )
                            break
                          case 'Enter':
                            e.preventDefault()
                            if (
                              highlightedIndex >= 0 &&
                              highlightedIndex < itemCount
                            ) {
                              handleSelectProduct(
                                searchResults[highlightedIndex]
                              )
                            } else if (itemCount > 0) {
                              handleSelectProduct(searchResults[0])
                            }
                            break
                          case 'Escape':
                            e.preventDefault()
                            setShowDropdown(false)
                            setHighlightedIndex(-1)
                            break
                          case 'Tab':
                            setShowDropdown(false)
                            setHighlightedIndex(-1)
                            break
                        }
                      }}
                      role='combobox'
                      aria-expanded={showDropdown && searchResults.length > 0}
                      aria-haspopup='listbox'
                      aria-controls='inventory-mgmt-product-listbox'
                      aria-activedescendant={
                        highlightedIndex >= 0
                          ? `inventory-mgmt-product-option-${highlightedIndex}`
                          : undefined
                      }
                    />
                    {searchLoading && (
                      <Loader2
                        size={20}
                        className='inventory-management__search-loader'
                      />
                    )}
                  </div>

                  {/* Dropdown de resultados */}
                  {showDropdown && (
                    <div
                      ref={dropdownRef}
                      className='inventory-management__search-dropdown'
                      role='listbox'
                      id='inventory-mgmt-product-listbox'
                      aria-label='Productos encontrados'
                    >
                      {searchLoading ? (
                        <div className='inventory-management__search-dropdown-item inventory-management__search-dropdown-item--loading'>
                          {t(
                            'inventoryManagement.createModal.searchingProducts'
                          )}
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className='inventory-management__search-dropdown-item inventory-management__search-dropdown-item--empty'>
                          {t('inventoryManagement.createModal.noResultsFound')}
                        </div>
                      ) : (
                        searchResults.map((product, index) => (
                          <div
                            key={product.product_id}
                            id={`inventory-mgmt-product-option-${index}`}
                            className={`inventory-management__search-dropdown-item ${
                              highlightedIndex === index
                                ? 'inventory-management__search-dropdown-item--highlighted'
                                : ''
                            }`}
                            onClick={() => handleSelectProduct(product)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            onMouseLeave={() => setHighlightedIndex(-1)}
                            role='option'
                            aria-selected={highlightedIndex === index}
                          >
                            <div className='inventory-management__search-dropdown-item-main'>
                              <span className='inventory-management__search-dropdown-item-name'>
                                {product.product_name}
                              </span>
                              <span className='inventory-management__search-dropdown-item-id'>
                                ID: {product.product_id}
                              </span>
                            </div>
                            <span className='inventory-management__search-dropdown-item-stock'>
                              Stock: {product.stock_quantity || 0}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {inventoryForm.items.length === 0 ? (
                  <div className='inventory-management__empty-products'>
                    {t('inventoryManagement.createModal.noProducts')}
                  </div>
                ) : (
                  <div className='inventory-management__products-table-wrapper'>
                    <table className='inventory-management__products-table'>
                      <thead>
                        <tr>
                          <th>
                            {t('inventoryManagement.createModal.productId')}
                          </th>
                          <th>
                            {t('inventoryManagement.createModal.productName')}
                          </th>
                          <th>
                            {t(
                              'inventoryManagement.createModal.currentQuantity'
                            )}
                          </th>
                          <th>
                            {t(
                              'inventoryManagement.createModal.quantityCounted'
                            )}
                          </th>
                          <th style={{ width: '80px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryForm.items.map((item, index) => (
                          <tr key={index}>
                            <td className='inventory-management__product-cell-id'>
                              {item.product_id}
                            </td>
                            <td className='inventory-management__product-cell-name'>
                              {item.product_name}
                            </td>
                            <td className='inventory-management__product-cell-current'>
                              {item.current_quantity}
                            </td>
                            <td>
                              <input
                                type='number'
                                className='inventory-management__form-input'
                                min='0'
                                value={item.quantity_checked}
                                onChange={e =>
                                  handleProductChange(
                                    index,
                                    'quantity_checked',
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <button
                                className='inventory-management__remove-button'
                                onClick={() => handleRemoveProduct(index)}
                                type='button'
                                title={t(
                                  'inventoryManagement.createModal.remove'
                                )}
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className='inventory-management__modal-footer'>
              <button
                className='inventory-management__button inventory-management__button--secondary'
                onClick={() => setShowCreateModal(false)}
                disabled={loading}
              >
                {t('inventoryManagement.createModal.cancel')}
              </button>
              <button
                className='inventory-management__button inventory-management__button--primary'
                onClick={handleSubmitInventory}
                disabled={
                  loading ||
                  !inventoryForm.metadata.operator?.trim() ||
                  !inventoryForm.metadata.location?.trim() ||
                  !inventoryForm.items ||
                  inventoryForm.items.length === 0
                }
                title={
                  inventoryForm.items.length === 0
                    ? 'Agrega al menos un producto al inventario'
                    : !inventoryForm.metadata.operator?.trim() ||
                      !inventoryForm.metadata.location?.trim()
                    ? 'Completa los campos requeridos'
                    : ''
                }
              >
                {loading
                  ? 'Procesando...'
                  : t('inventoryManagement.createModal.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista de Detalles */}
      {showDetailsModal && selectedInventory && (
        <div
          className='inventory-management__modal-overlay'
          onClick={() => {
            setShowDetailsModal(false)
            clearSelectedInventory()
          }}
        >
          <div
            className='inventory-management__modal inventory-management__modal--large'
            onClick={e => e.stopPropagation()}
          >
            <div className='inventory-management__modal-header'>
              <h2 className='inventory-management__modal-title'>
                {t('inventoryManagement.viewModal.title')}
              </h2>
            </div>
            <div className='inventory-management__modal-body'>
              {/* Información General */}
              <div className='inventory-management__details-section'>
                <h3 className='inventory-management__details-section-title'>
                  {t('inventoryManagement.viewModal.generalInfo')}
                </h3>
                <div className='inventory-management__details-grid'>
                  <div className='inventory-management__details-item'>
                    <div className='inventory-management__details-label'>
                      {t('inventoryManagement.viewModal.id')}
                    </div>
                    <div className='inventory-management__details-value inventory-management__details-value--monospace'>
                      {selectedInventory.inventory.id}
                    </div>
                  </div>
                  <div className='inventory-management__details-item'>
                    <div className='inventory-management__details-label'>
                      {t('inventoryManagement.viewModal.status')}
                    </div>
                    <div className='inventory-management__details-value'>
                      <span
                        className={`inventory-management__badge ${getStatusClass(
                          getInventoryStatus(
                            selectedInventory.inventory.state,
                            selectedInventory.inventory.metadata
                          ).type
                        )}`}
                      >
                        {
                          getInventoryStatus(
                            selectedInventory.inventory.state,
                            selectedInventory.inventory.metadata
                          ).label
                        }
                      </span>
                    </div>
                  </div>
                  <div className='inventory-management__details-item'>
                    <div className='inventory-management__details-label'>
                      {t('inventoryManagement.viewModal.date')}
                    </div>
                    <div className='inventory-management__details-value'>
                      {formatDate(selectedInventory.inventory.check_date)}
                    </div>
                  </div>
                  <div className='inventory-management__details-item'>
                    <div className='inventory-management__details-label'>
                      {t('inventoryManagement.viewModal.location')}
                    </div>
                    <div className='inventory-management__details-value'>
                      {selectedInventory.inventory.metadata?.location || 'N/A'}
                    </div>
                  </div>
                  <div className='inventory-management__details-item'>
                    <div className='inventory-management__details-label'>
                      {t('inventoryManagement.viewModal.operator')}
                    </div>
                    <div className='inventory-management__details-value'>
                      {selectedInventory.inventory.metadata?.operator || 'N/A'}
                    </div>
                  </div>
                  <div className='inventory-management__details-item'>
                    <div className='inventory-management__details-label'>
                      {t('inventoryManagement.viewModal.origin')}
                    </div>
                    <div className='inventory-management__details-value'>
                      {getOrigin(selectedInventory.inventory.metadata)}
                    </div>
                  </div>
                  <div className='inventory-management__details-item'>
                    <div className='inventory-management__details-label'>
                      {t('inventoryManagement.viewModal.method')}
                    </div>
                    <div className='inventory-management__details-value'>
                      {selectedInventory.inventory.metadata?.counting_method ||
                        'N/A'}
                    </div>
                  </div>
                  <div className='inventory-management__details-item'>
                    <div className='inventory-management__details-label'>
                      {t('inventoryManagement.viewModal.verification')}
                    </div>
                    <div className='inventory-management__details-value'>
                      {selectedInventory.inventory.metadata?.verification ||
                        'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Productos Inventariados */}
              {selectedInventory.items &&
                selectedInventory.items.length > 0 && (
                  <div className='inventory-management__details-section'>
                    <h3 className='inventory-management__details-section-title'>
                      {t('inventoryManagement.viewModal.items')} (
                      {selectedInventory.items.length})
                    </h3>
                    <table className='inventory-management__items-table'>
                      <thead>
                        <tr>
                          <th>{t('inventoryManagement.viewModal.product')}</th>
                          <th>
                            {t(
                              'inventoryManagement.viewModal.previousQuantity'
                            )}
                          </th>
                          <th>
                            {t('inventoryManagement.viewModal.quantityChecked')}
                          </th>
                          <th>
                            {t('inventoryManagement.viewModal.difference')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInventory.items.map(item => (
                          <tr key={item.id}>
                            <td>{item.product_id}</td>
                            <td>{item.previous_quantity}</td>
                            <td>{item.quantity_checked}</td>
                            <td>
                              {item.quantity_checked - item.previous_quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
            <div className='inventory-management__modal-footer'>
              <button
                className='inventory-management__button inventory-management__button--secondary'
                onClick={() => {
                  setShowDetailsModal(false)
                  clearSelectedInventory()
                }}
              >
                {t('inventoryManagement.viewModal.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  )
}

export default InventoryManagement
