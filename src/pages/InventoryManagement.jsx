import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import useInventoryManagementStore from '@/store/useInventoryManagementStore'
import useDashboardStore from '@/store/useDashboardStore'
import useAuthStore from '@/store/useAuthStore'
import { productService } from '@/services/productService'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/ToastContainer'
import {
  INVENTORY_TYPES,
  INVENTORY_STATUS_OPTIONS,
} from '@/constants/inventoryDefaults'

// Iconos de Lucide React
import {
  ArrowLeft,
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
  Package,
} from 'lucide-react'

const InventoryManagement = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const toast = useToast()
  const { fetchDashboardData } = useDashboardStore()
  const { user } = useAuthStore()

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
      inventory_type: 'MONTHLY',
      status: 'COMPLETED',
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

  // Cargar inventarios al montar y cuando cambia la paginación
  useEffect(() => {
    fetchInventories(pagination.page, pagination.pageSize)
  }, [fetchInventories, pagination.page, pagination.pageSize])

  // Calcular índices para paginación
  const startIndex = (pagination.page - 1) * pagination.pageSize
  const endIndex = startIndex + pagination.pageSize

  // Handlers de formulario de creación
  const handleCreateNew = () => {
    // Resetear formulario
    setInventoryForm({
      metadata: {
        operator: user?.name || user?.id || '',
        location: '',
        counting_method: 'manual',
        verification: 'single_check',
        source: 'physical_count',
        inventory_type: 'MONTHLY',
        status: 'COMPLETED',
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
    const inventoryData = {
      items: inventoryForm.items.map(item => ({
        product_id: String(item.product_id).trim(),
        quantity_checked: parseFloat(item.quantity_checked) || 0,
      })),
      metadata: {
        ...inventoryForm.metadata,
        timestamp: new Date().toISOString(),
        system_version: '4.2.0-frontend',
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

      // Sincronizar dashboard proactivamente
      fetchDashboardData();

      setShowCreateModal(false)
      // Limpiar búsqueda
      setProductSearch('')
      setSearchResults([])
      setShowDropdown(false)
    } else {
      // Mostrar notificación de error
      const errorMessage = result.message || result.error || 'Error al crear el inventario'
      toast.error(errorMessage, 5000)
      setFormErrors([errorMessage])
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

  const handleEdit = () => setOpenMenuId(null)

  const handleDelete = async id => {
    setShowDeleteConfirm(id)
    setOpenMenuId(null)
  }

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      const result = await invalidateInventory(showDeleteConfirm)

      if (result.success) {
        toast.success('Inventario invalidado exitosamente', 3000)
        
        // Sincronizar dashboard proactivamente
        fetchDashboardData();
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

  const getStatusColorClass = statusType => {
    switch (statusType) {
      case 'active': return 'bg-[#dff6dd] text-[#107c10]'
      case 'reverted': return 'bg-amber-100 text-amber-700'
      case 'invalid': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
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
    <div className='flex flex-col gap-6 animate-in fade-in duration-500'>
      {/* Header */}
      <header className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <button
            className='p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors'
            onClick={() => navigate('/ajustes-inventario')}
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <div className='flex flex-col gap-1 border-l-4 border-primary pl-4'>
            <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase'>
              {t('inventoryManagement.title')}
            </h1>
            <p className='text-text-secondary text-sm font-medium leading-none mt-1'>
              {t('inventoryManagement.subtitle')}
            </p>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className='flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-fluent-2 border border-border-subtle'>
        <div className='flex items-center gap-2'>
          <button
            className={`p-2.5 rounded-lg border border-border-subtle transition-all ${showFilters ? 'bg-primary text-white' : 'bg-white hover:bg-slate-50 text-text-secondary'}`}
            onClick={handleFilter}
            title={t('inventoryManagement.toolbar.filter')}
          >
            <Filter size={20} />
          </button>
          <button
            className='p-2.5 bg-white border border-border-subtle rounded-lg hover:bg-slate-50 text-text-secondary transition-all'
            onClick={handleDownload}
            title={t('inventoryManagement.toolbar.download')}
          >
            <Download size={20} />
          </button>
        </div>

        <div className='flex items-center gap-2'>
          <button
            className='flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all'
            onClick={handleCreateNew}
          >
            <Plus size={16} />
            {t('inventoryManagement.toolbar.createNew')}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className='bg-white p-6 rounded-xl shadow-fluent-8 border border-border-subtle animate-in slide-in-from-top-4 duration-300'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-sm font-black uppercase text-text-main tracking-widest'>
              {t('inventoryManagement.filters.title')}
            </h3>
            <button onClick={() => setShowFilters(false)} className='text-slate-400 hover:text-text-main'><X size={18} /></button>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div className='flex flex-col gap-1.5'>
              <label className='text-[10px] font-black uppercase text-slate-400 tracking-wider'>{t('inventoryManagement.filters.dateFrom')}</label>
              <input
                type='date'
                className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                value={filters.dateFrom}
                onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <label className='text-[10px] font-black uppercase text-slate-400 tracking-wider'>{t('inventoryManagement.filters.dateTo')}</label>
              <input
                type='date'
                className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                value={filters.dateTo}
                onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <label className='text-[10px] font-black uppercase text-slate-400 tracking-wider'>{t('inventoryManagement.filters.status')}</label>
              <select
                className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
              >
                <option value='all'>{t('inventoryManagement.filters.statusAll')}</option>
                <option value='active'>{t('inventoryManagement.filters.statusActive')}</option>
                <option value='invalid'>{t('inventoryManagement.filters.statusInvalid')}</option>
                <option value='reverted'>{t('inventoryManagement.filters.statusReverted')}</option>
              </select>
            </div>
            <div className='flex flex-col gap-1.5'>
              <label className='text-[10px] font-black uppercase text-slate-400 tracking-wider'>{t('inventoryManagement.filters.location')}</label>
              <input
                type='text'
                className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                placeholder={t('inventoryManagement.filters.locationPlaceholder')}
                value={filters.location}
                onChange={e => setFilters({ ...filters, location: e.target.value })}
              />
            </div>
          </div>
          <div className='flex justify-end gap-3 mt-8 pt-6 border-t border-slate-50'>
            <button
              className='px-5 py-2.5 border border-border-subtle text-text-main text-xs font-bold uppercase rounded hover:bg-slate-50 transition-all'
              onClick={handleClearFilters}
            >
              {t('inventoryManagement.filters.clear')}
            </button>
            <button
              className='px-5 py-2.5 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all'
              onClick={handleApplyFilters}
            >
              {t('inventoryManagement.filters.apply')}
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className='bg-white rounded-xl shadow-fluent-shadow border border-border-subtle overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left'>
            <thead className='bg-gray-50/50 border-b border-border-subtle text-[13px] font-semibold text-gray-700'>
              <tr>
                <th className='py-4 px-6'>{t('inventoryManagement.table.id')}</th>
                <th className='py-4 px-4'>{t('inventoryManagement.table.status')}</th>
                <th className='py-4 px-4'>{t('inventoryManagement.table.createdAt')}</th>
                <th className='py-4 px-4'>{t('inventoryManagement.table.location')}</th>
                <th className='py-4 px-4'>{t('inventoryManagement.table.operator')}</th>
                <th className='py-4 px-4'>{t('inventoryManagement.table.origin')}</th>
                <th className='py-4 px-6'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50 text-sm text-text-main'>
              {loading ? (
                <tr>
                  <td colSpan='7' className='py-20 text-center text-text-secondary italic'>
                    <div className='flex flex-col items-center gap-3'>
                      <Loader2 size={32} className='animate-spin text-primary' />
                      {t('inventoryManagement.table.loading') || 'Cargando inventarios...'}
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr><td colSpan='7' className='py-20 text-center text-error font-bold'>{error}</td></tr>
              ) : getFilteredInventories().length === 0 ? (
                <tr>
                  <td colSpan='7' className='py-20 text-center text-text-secondary opacity-50'>
                    <div className='flex flex-col items-center gap-2'>
                      <Package size={48} className='text-slate-200' />
                      {inventories.length === 0 ? t('inventoryManagement.table.noData') : t('inventoryManagement.table.noResults')}
                    </div>
                  </td>
                </tr>
              ) : (
                getFilteredInventories().map(inventory => {
                  const status = getInventoryStatus(inventory.state, inventory.metadata)
                  return (
                    <tr key={inventory.id} className='hover:bg-gray-50 transition-colors group'>
                      <td className='py-4 px-6 font-mono text-xs text-primary font-bold'>{inventory.id}</td>
                      <td className='py-4 px-4'>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColorClass(status.type)}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className='py-4 px-4 text-text-secondary'>{formatDate(inventory.check_date)}</td>
                      <td className='py-4 px-4 font-medium'>{inventory.metadata?.location || 'N/A'}</td>
                      <td className='py-4 px-4'>{inventory.metadata?.operator || 'N/A'}</td>
                      <td className='py-4 px-4 italic text-slate-500 text-xs'>{getOrigin(inventory.metadata)}</td>
                      <td className='py-4 px-6 text-right relative'>
                        <div className='flex justify-end'>
                          <button
                            className={`p-2 rounded-lg transition-all ${openMenuId === inventory.id ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100'}`}
                            onClick={() => handleMenuToggle(inventory.id)}
                          >
                            <MoreHorizontal size={20} />
                          </button>
                          {openMenuId === inventory.id && (
                            <div className='absolute right-16 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-fluent-16 border border-border-subtle py-2 w-48 z-20 animate-in fade-in zoom-in-95 duration-150'>
                              <button className='w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2' onClick={() => handleView(inventory.id)}>
                                {t('inventoryManagement.actions.view')}
                              </button>
                              <button className='w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2' onClick={() => handleEdit(inventory.id)}>
                                {t('inventoryManagement.actions.edit')}
                              </button>
                              <div className='h-px bg-slate-100 my-1'></div>
                              <button className='w-full text-left px-4 py-2 text-sm text-error hover:bg-red-50 flex items-center gap-2' onClick={() => handleDelete(inventory.id)}>
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
          </table>
        </div>

        {/* Pagination Section */}
        <div className='px-6 py-4 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4 bg-[#fafafa]'>
          <div className='text-[13px] text-gray-500 font-medium'>
            {t('inventoryManagement.pagination.showing', {
              start: startIndex + 1,
              end: Math.min(endIndex, pagination.total),
              total: pagination.total,
            })}
          </div>
          <div className='flex items-center gap-1'>
            <button
              className='p-1.5 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30 transition-colors'
              onClick={() => setPage(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft size={20} />
            </button>
            {getPageNumbers().map((page, index) =>
              page === '...' ? (
                <span key={`ellipsis-${index}`} className='px-2 text-slate-400 font-bold'>...</span>
              ) : (
                <button
                  key={page}
                  className={`min-w-[32px] h-8 rounded text-sm font-bold transition-all ${pagination.page === page ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}
                  onClick={() => setPage(page)}
                >
                  {page}
                </button>
              )
            )}
            <button
              className='p-1.5 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30 transition-colors'
              onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white w-full max-w-md rounded-xl shadow-fluent-16 overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='p-6'>
              <h2 className='text-xl font-black text-text-main tracking-tighter uppercase mb-4'>
                {t('inventoryManagement.deleteModal.title')}
              </h2>
              <p className='text-sm text-text-secondary leading-relaxed mb-6'>
                {t('inventoryManagement.deleteModal.message')}
              </p>
              <div className='bg-red-50 p-4 rounded-lg border border-red-100 mb-6'>
                <div className='text-[10px] font-black uppercase text-red-400 tracking-wider mb-1'>
                  {t('inventoryManagement.deleteModal.inventoryId')}
                </div>
                <div className='font-mono text-sm text-red-700 font-bold'>{showDeleteConfirm}</div>
              </div>
            </div>
            <div className='px-6 py-4 bg-slate-50 flex justify-end gap-3'>
              <button
                className='px-5 py-2.5 border border-border-subtle text-text-main text-xs font-bold uppercase rounded hover:bg-white transition-all'
                onClick={() => setShowDeleteConfirm(null)}
              >
                {t('inventoryManagement.deleteModal.cancel')}
              </button>
              <button
                className='px-5 py-2.5 bg-error text-white text-xs font-black uppercase rounded shadow-sm hover:bg-red-700 active:scale-[0.98] transition-all'
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? '...' : t('inventoryManagement.deleteModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white w-full max-w-5xl rounded-xl shadow-fluent-16 overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 duration-200'>
            <header className='p-6 border-b border-border-subtle flex items-center justify-between bg-white sticky top-0 z-10'>
              <div>
                <h2 className='text-2xl font-black text-text-main tracking-tighter uppercase'>
                  {t('inventoryManagement.createModal.title')}
                </h2>
                <p className='text-xs text-text-secondary font-medium uppercase tracking-widest leading-none mt-1'>
                  {t('inventoryManagement.createModal.subtitle')}
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className='p-2 hover:bg-slate-100 rounded-full transition-colors'>
                <X size={24} className='text-text-secondary' />
              </button>
            </header>

            <div className='flex-1 overflow-auto p-6 custom-scrollbar'>
              {formErrors.length > 0 && (
                <div className='mb-6 p-4 bg-error/10 border-l-4 border-error rounded-r-lg'>
                  <div className='flex items-center gap-2 text-error font-black uppercase text-xs mb-2'>
                    <X size={16} /> Errores detectados
                  </div>
                  <ul className='list-disc list-inside text-xs text-error font-medium space-y-1'>
                    {formErrors.map((error, index) => <li key={index}>{error}</li>)}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Column */}
                <div className="lg:col-span-4 space-y-6">
                  <div className='bg-slate-50 p-6 rounded-xl border border-border-subtle space-y-4'>
                    <h3 className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4'>
                      {t('inventoryManagement.createModal.metadata')}
                    </h3>
                    <div className='flex flex-col gap-4'>
                      <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>
                          {t('inventoryManagement.createModal.operator')} *
                        </label>
                        <input
                          type='text'
                          className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                          placeholder={t('inventoryManagement.createModal.operatorPlaceholder')}
                          value={inventoryForm.metadata.operator}
                          onChange={e => handleMetadataChange('operator', e.target.value)}
                        />
                      </div>
                      <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>
                          {t('inventoryManagement.createModal.location')} *
                        </label>
                        <input
                          type='text'
                          className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                          placeholder={t('inventoryManagement.createModal.locationPlaceholder')}
                          value={inventoryForm.metadata.location}
                          onChange={e => handleMetadataChange('location', e.target.value)}
                        />
                      </div>
                      <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>
                          {t('inventoryManagement.createModal.countingMethod')}
                        </label>
                        <select
                          className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                          value={inventoryForm.metadata.counting_method}
                          onChange={e => handleMetadataChange('counting_method', e.target.value)}
                        >
                          <option value='manual'>{t('inventoryManagement.createModal.methodManual')}</option>
                          <option value='barcode_scanner'>{t('inventoryManagement.createModal.methodScanner')}</option>
                          <option value='rfid'>{t('inventoryManagement.createModal.methodRFID')}</option>
                        </select>
                      </div>
                      <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>
                          Tipo de Inventario
                        </label>
                        <select
                          className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                          value={inventoryForm.metadata.inventory_type}
                          onChange={e => handleMetadataChange('inventory_type', e.target.value)}
                        >
                          {INVENTORY_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>
                          Estado Inicial
                        </label>
                        <select
                          className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                          value={inventoryForm.metadata.status}
                          onChange={e => handleMetadataChange('status', e.target.value)}
                        >
                          {INVENTORY_STATUS_OPTIONS.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>Notas</label>
                        <textarea
                          className='p-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all min-h-[120px]'
                          placeholder='Observaciones del inventario...'
                          value={inventoryForm.metadata.notes}
                          onChange={e => handleMetadataChange('notes', e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Column */}
                <div className="lg:col-span-8 space-y-6 flex flex-col min-h-0">
                  <div className='flex-1 flex flex-col h-full min-h-0'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]'>
                        {t('inventoryManagement.createModal.products')} ({inventoryForm.items.length})
                      </h3>
                    </div>

                    {/* Search Bar */}
                    <div className='relative mb-6'>
                      <div className='relative'>
                        <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' size={20} />
                        <input
                          ref={searchInputRef}
                          type='text'
                          className='w-full pl-12 pr-12 h-14 border border-border-subtle rounded-xl text-lg bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm'
                          placeholder={t('inventoryManagement.createModal.searchProduct')}
                          value={productSearch}
                          onChange={e => {
                            setProductSearch(e.target.value)
                            handleProductSearch(e.target.value)
                            setHighlightedIndex(-1)
                          }}
                          onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
                          onKeyDown={e => {
                            const itemCount = searchResults.length
                            if (itemCount === 0) return
                            switch (e.key) {
                              case 'ArrowDown': e.preventDefault(); setHighlightedIndex(prev => prev < itemCount - 1 ? prev + 1 : 0); break
                              case 'ArrowUp': e.preventDefault(); setHighlightedIndex(prev => prev > 0 ? prev - 1 : itemCount - 1); break
                              case 'Enter': e.preventDefault(); if (highlightedIndex >= 0 && highlightedIndex < itemCount) handleSelectProduct(searchResults[highlightedIndex]); else if (itemCount > 0) handleSelectProduct(searchResults[0]); break
                              case 'Escape': e.preventDefault(); setShowDropdown(false); break
                            }
                          }}
                        />
                        {searchLoading && <Loader2 size={20} className='absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary' />}
                      </div>

                      {showDropdown && (
                        <div ref={dropdownRef} className='absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-fluent-16 border border-border-subtle overflow-hidden z-50 max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150'>
                          {searchResults.length === 0 ? (
                            <div className='p-6 text-center text-slate-400 italic text-sm'>Sin resultados</div>
                          ) : (
                            searchResults.map((product, index) => (
                              <div
                                key={product.product_id}
                                className={`p-4 flex justify-between items-center cursor-pointer border-b border-slate-50 last:border-0 transition-all ${highlightedIndex === index ? 'bg-primary text-white' : 'hover:bg-slate-50'}`}
                                onClick={() => handleSelectProduct(product)}
                              >
                                <div>
                                  <span className='block font-bold text-sm leading-tight'>{product.product_name}</span>
                                  <span className={`text-[10px] font-mono font-bold uppercase ${highlightedIndex === index ? 'text-white/70' : 'text-primary'}`}>ID: {product.product_id}</span>
                                </div>
                                <span className={`text-[10px] font-black uppercase ${highlightedIndex === index ? 'text-white/90' : 'text-slate-400'}`}>Stock: {product.stock_quantity || 0}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div className='flex-1 min-h-[400px] bg-slate-50 rounded-xl border border-border-subtle overflow-hidden flex flex-col'>
                      {inventoryForm.items.length === 0 ? (
                        <div className='flex-1 flex flex-col items-center justify-center text-slate-300 gap-2 opacity-50'>
                          <Package size={64} strokeWidth={1} />
                          <p className='text-sm font-medium italic'>Agregue productos para comenzar el conteo</p>
                        </div>
                      ) : (
                        <div className='flex-1 overflow-auto custom-scrollbar'>
                          <table className='w-full text-left text-sm'>
                            <thead className='bg-white/80 backdrop-blur-sm border-b border-border-subtle text-[11px] font-black uppercase text-slate-500 tracking-wider sticky top-0 z-10'>
                              <tr>
                                <th className='py-3 px-4'>Producto</th>
                                <th className="py-3 px-4 text-center">Actual</th>
                                <th className="py-3 px-4 text-center">Contado</th>
                                <th className='py-3 px-4 w-12'></th>
                              </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100'>
                              {inventoryForm.items.map((item, index) => (
                                <tr key={index} className='bg-white hover:bg-slate-50/50 transition-colors'>
                                  <td className='py-3 px-4'>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-bold text-text-main truncate">{item.product_name}</span>
                                      <span className="text-[10px] text-primary font-mono font-bold uppercase">{item.product_id}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center tabular-nums font-medium text-slate-500">{item.current_quantity}</td>
                                  <td className="py-3 px-4">
                                    <input
                                      type='number'
                                      className='w-24 mx-auto h-8 text-center border border-border-subtle rounded bg-white text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                                      min='0'
                                      value={item.quantity_checked}
                                      onChange={e => handleProductChange(index, 'quantity_checked', e.target.value)}
                                    />
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      className='p-1.5 text-slate-300 hover:text-error hover:bg-red-50 rounded transition-all'
                                      onClick={() => handleRemoveProduct(index)}
                                      type='button'
                                    >
                                      <Trash2 size={16} />
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
                </div>
              </div>
            </div>
            <div className='p-6 bg-slate-50 border-t border-border-subtle flex justify-end gap-3'>
              <button
                className='px-5 py-2.5 border border-border-subtle text-text-main text-xs font-bold uppercase rounded hover:bg-white transition-all'
                onClick={() => setShowCreateModal(false)}
                disabled={loading}
              >
                {t('inventoryManagement.createModal.cancel')}
              </button>
              <button
                className='px-5 py-2.5 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50'
                onClick={handleSubmitInventory}
                disabled={loading || !inventoryForm.metadata.operator?.trim() || !inventoryForm.metadata.location?.trim() || inventoryForm.items.length === 0}
              >
                {loading ? '...' : t('inventoryManagement.createModal.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedInventory && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white w-full max-w-4xl rounded-xl shadow-fluent-16 overflow-hidden flex flex-col max-h-[85vh] scale-100 animate-in zoom-in-95 duration-200'>
            <header className='p-6 border-b border-border-subtle flex items-center justify-between bg-white'>
              <h2 className='text-xl font-black text-text-main tracking-tighter uppercase'>
                {t('inventoryManagement.viewModal.title')}
              </h2>
              <button onClick={() => { setShowDetailsModal(false); clearSelectedInventory(); }} className='p-2 hover:bg-slate-100 rounded-full transition-colors'>
                <X size={24} className='text-text-secondary' />
              </button>
            </header>

            <div className='flex-1 overflow-auto p-8 custom-scrollbar'>
              <div className='mb-8'>
                <h3 className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4'>
                  {t('inventoryManagement.viewModal.generalInfo')}
                </h3>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-xl border border-border-subtle'>
                  <div className='space-y-1'>
                    <p className='text-[10px] font-black uppercase text-slate-400'>{t('inventoryManagement.viewModal.id')}</p>
                    <p className='font-mono text-xs text-primary font-bold'>{selectedInventory.inventory.id}</p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-[10px] font-black uppercase text-slate-400'>{t('inventoryManagement.viewModal.status')}</p>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${getStatusColorClass(getInventoryStatus(selectedInventory.inventory.state, selectedInventory.inventory.metadata).type)}`}>
                        {getInventoryStatus(selectedInventory.inventory.state, selectedInventory.inventory.metadata).label}
                      </span>
                    </div>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-[10px] font-black uppercase text-slate-400'>{t('inventoryManagement.viewModal.date')}</p>
                    <p className='text-sm font-bold text-text-main'>{formatDate(selectedInventory.inventory.check_date)}</p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-[10px] font-black uppercase text-slate-400'>{t('inventoryManagement.viewModal.location')}</p>
                    <p className='text-sm font-bold text-text-main'>{selectedInventory.inventory.metadata?.location || 'N/A'}</p>
                  </div>
                  <div className='space-y-1 pt-2'>
                    <p className='text-[10px] font-black uppercase text-slate-400'>{t('inventoryManagement.viewModal.operator')}</p>
                    <p className='text-sm font-bold text-text-main'>{selectedInventory.inventory.metadata?.operator || 'N/A'}</p>
                  </div>
                  <div className='space-y-1 pt-2'>
                    <p className='text-[10px] font-black uppercase text-slate-400'>{t('inventoryManagement.viewModal.origin')}</p>
                    <p className='text-sm font-bold text-text-main'>{getOrigin(selectedInventory.inventory.metadata)}</p>
                  </div>
                  <div className='space-y-1 pt-2'>
                    <p className='text-[10px] font-black uppercase text-slate-400'>{t('inventoryManagement.viewModal.method')}</p>
                    <p className='text-sm font-bold text-text-main capitalize'>{selectedInventory.inventory.metadata?.counting_method?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                  <div className='space-y-1 pt-2'>
                    <p className='text-[10px] font-black uppercase text-slate-400'>{t('inventoryManagement.viewModal.verification')}</p>
                    <p className='text-sm font-bold text-text-main capitalize'>{selectedInventory.inventory.metadata?.verification?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {selectedInventory.items && selectedInventory.items.length > 0 && (
                <div>
                  <h3 className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4'>
                    {t('inventoryManagement.viewModal.items')} ({selectedInventory.items.length})
                  </h3>
                  <div className="bg-white rounded-xl border border-border-subtle overflow-hidden">
                    <table className='w-full text-left'>
                      <thead className='bg-gray-50/50 border-b border-border-subtle text-[11px] font-black uppercase text-slate-500 tracking-wider'>
                        <tr>
                          <th className='py-3 px-6'>{t('inventoryManagement.viewModal.product')}</th>
                          <th className="py-3 px-4 text-center">{t('inventoryManagement.viewModal.previousQuantity')}</th>
                          <th className="py-3 px-4 text-center">{t('inventoryManagement.viewModal.quantityChecked')}</th>
                          <th className="py-3 px-6 text-right">{t('inventoryManagement.viewModal.difference')}</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-50 text-sm'>
                        {selectedInventory.items.map((item, idx) => {
                          const diff = item.quantity_checked - item.previous_quantity;
                          return (
                            <tr key={idx} className='hover:bg-slate-50 transition-colors'>
                              <td className='py-4 px-6'>
                                <div className="flex flex-col">
                                  <span className="font-bold text-text-main">ID de Producto</span>
                                  <span className="text-[10px] text-primary font-mono font-bold uppercase">{item.product_id}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center tabular-nums text-slate-500">{item.previous_quantity}</td>
                              <td className="py-4 px-4 text-center tabular-nums font-black text-text-main">{item.quantity_checked}</td>
                              <td className={`py-4 px-6 text-right tabular-nums font-black ${diff > 0 ? 'text-success' : diff < 0 ? 'text-error' : 'text-slate-400'}`}>
                                {diff > 0 ? `+${diff}` : diff}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className='p-6 bg-slate-50 border-t border-border-subtle flex justify-end'>
              <button
                className='px-5 py-2.5 bg-white border border-border-subtle text-text-main text-xs font-bold uppercase rounded hover:bg-slate-100 transition-all shadow-sm'
                onClick={() => { setShowDetailsModal(false); clearSelectedInventory(); }}
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
