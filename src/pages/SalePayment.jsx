import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Receipt,
  RefreshCw,
  Search,
  CreditCard,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import DataState from '@/components/ui/DataState'
import RegisterSalePaymentModal from '@/components/sales/RegisterSalePaymentModal'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/hooks/useToast'
import useClientStore from '@/store/useClientStore'
import { salePaymentService } from '@/services/salePaymentService'
import { saleService } from '@/services/saleService'

const SalePayment = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { error: showError, success: showSuccess } = useToast()

  // Zustand stores
  const { searchResults, searchClients } = useClientStore()

  // Local state para ventas y filtros
  const [rawSales, setRawSales] = useState([]) // Datos sin filtrar de la API
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState('') // ID del cliente
  const [selectedClientName, setSelectedClientName] = useState('') // Nombre del cliente para API
  const [selectedStatus, setSelectedStatus] = useState('')

  // Estado para dropdown de clientes
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const [highlightedClientIndex, setHighlightedClientIndex] = useState(0)
  const clientDropdownRef = useRef(null)
  const clientInputRef = useRef(null)
  const clientListRef = useRef(null)

  // Inicializar con fechas del último mes por defecto
  const getDefaultDateRange = () => {
    const today = new Date()
    const lastMonth = new Date(today)
    lastMonth.setMonth(today.getMonth() - 1)

    return {
      start_date: lastMonth.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    }
  }

  const [dateRange, setDateRange] = useState(getDefaultDateRange())

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total_records: 0,
    total_pages: 0,
  })

  // Venta seleccionada para procesar pago (solo una a la vez)
  const [selectedSaleId, setSelectedSaleId] = useState(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    handleLoadSales()
  }, [])

  // Cargar clientes mediante búsqueda
  const handleLoadClients = async (searchTerm = '') => {
    if (!searchTerm || searchTerm.length < 2) {
      return // Requerir al menos 2 caracteres
    }
    try {
      await searchClients(searchTerm)
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  // Cargar ventas con lógica inteligente según filtros
  const handleLoadSales = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let response

      // LÓGICA DE FILTROS según SALE_PAYMENT_API.md:
      // 1. Si hay cliente seleccionado -> usar GET /sale/client_name/{name}/payment-status
      // 2. Si NO hay cliente pero SÍ hay fechas -> usar GET /sale/date_range/payment-status

      const hasValidDateRange = dateRange.start_date && dateRange.end_date
      const hasValidClient =
        selectedClient &&
        selectedClient !== '' &&
        selectedClient !== 'all' &&
        selectedClientName

      if (hasValidClient) {
        // PRIORIDAD 1: Buscar por nombre de cliente con estado de pago
        // Endpoint: GET /sale/client_name/{name}/payment-status
        const filters = {
          page: pagination.page,
          page_size: pagination.page_size,
        }

        response =
          await salePaymentService.getSalesByClientNameWithPaymentStatus(
            selectedClientName,
            filters
          )
      } else if (hasValidDateRange) {
        // PRIORIDAD 2: Buscar por rango de fechas con estado de pago
        // Endpoint: GET /sale/date_range/payment-status
        const filters = {
          page: pagination.page,
          page_size: pagination.page_size,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
        }

        response =
          await salePaymentService.getSalesByDateRangeWithPaymentStatus(filters)
      } else {
        // Sin filtros válidos, usar rango por defecto del último mes
        const filters = {
          page: pagination.page,
          page_size: pagination.page_size,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
        }

        response =
          await salePaymentService.getSalesByDateRangeWithPaymentStatus(filters)
      }

      if (response && response.data) {
        // Los endpoints de payment-status devuelven datos con la estructura correcta:
        // { sale_id, client_name, total_amount, status, balance_due, total_paid, payment_progress, ... }
        const salesData = response.data.map(item => {
          const balanceDue = item.balance_due || 0
          let correctedStatus = item.status

          // CORRECCIÓN: Si balance_due = 0, el estado debe ser PAID, no PARTIAL_PAYMENT
          if (balanceDue === 0 && correctedStatus === 'PARTIAL_PAYMENT') {
            correctedStatus = 'PAID'
          }

          return {
            id: item.sale_id || item.id,
            sale_id: item.sale_id || item.id,
            client_id: item.client_id,
            client_name: item.client_name,
            sale_date: item.sale_date,
            total_amount: item.total_amount,
            status: correctedStatus,
            balance_due: balanceDue,
            total_paid: item.total_paid || 0,
            payment_progress: item.payment_progress || 0,
            payment_count: item.payment_count || 0,
            is_fully_paid: item.is_fully_paid || balanceDue === 0,
            requires_payment: item.requires_payment !== false && balanceDue > 0,
          }
        })

        // Guardar datos - el filtrado por estado se hace reactivamente
        setRawSales(salesData)

        // Actualizar paginación
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            total_records: response.pagination.total_records || salesData.length,
            total_pages: response.pagination.total_pages || 1,
          }))
        }
      } else {
        setRawSales([])
      }
    } catch (error) {
      // NO mostrar errores 404 como críticos - simplemente no hay resultados
      const statusCode =
        error?.status ?? error?.statusCode ?? error?.response?.status
      const is404 = statusCode === 404
      const isCriticalError =
        typeof statusCode === 'number' && statusCode >= 500

      if (isCriticalError) {
        console.error('Error loading sales:', error)
        // Mostrar error en UI solo para errores críticos
        setError(error.message || 'Error al cargar las ventas')
      }
      // 404 y otros errores no críticos se manejan silenciosamente - no hay resultados

      // Siempre limpiar los datos en caso de error
      setRawSales([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar ventas reactivamente por estado Y búsqueda
  const filteredSales = React.useMemo(() => {
    let filtered = rawSales

    // Aplicar filtro de estado si está seleccionado
    if (selectedStatus) {
      filtered = filtered.filter(sale => sale.status === selectedStatus)
    }

    // Aplicar filtro de búsqueda de texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(sale => {
        const orderId = (sale.id || '').toString().toLowerCase()
        const clientName = (sale.client_name || '').toLowerCase()
        return orderId.includes(term) || clientName.includes(term)
      })
    }

    return filtered
  }, [rawSales, selectedStatus, searchTerm])

  // Calcular paginación reactivamente basada en datos filtrados
  const paginatedSales = React.useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.page_size
    const endIndex = startIndex + pagination.page_size
    return filteredSales.slice(startIndex, endIndex)
  }, [filteredSales, pagination.page, pagination.page_size])

  // Actualizar total_pages cuando cambian los datos filtrados
  useEffect(() => {
    const totalRecords = filteredSales.length
    const totalPages = Math.ceil(totalRecords / pagination.page_size) || 1
    // Solo actualizar si cambió
    setPagination(prev => ({
      ...prev,
      total_records: totalRecords,
      total_pages: totalPages,
      // Reset a página 1 si la página actual está fuera de rango
      page: Math.min(prev.page, totalPages),
    }))
  }, [filteredSales.length, pagination.page_size])

  // Manejar cambio de página (solo cambiar página, sin recargar API)
  const handlePageChange = newPage => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Manejar filtro de estado (local, reactivo, sin recargar API)
  const handleStatusFilter = status => {
    const newStatus = selectedStatus === status ? '' : status // Toggle: si ya está seleccionado, deseleccionar
    setSelectedStatus(newStatus)
    // Reset a página 1 cuando cambia el filtro
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Aplicar filtros
  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 })) // Reset a página 1
    handleLoadSales()
  }

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedClient('')
    setSelectedClientName('') // Limpiar nombre también
    setClientSearchTerm('')
    setSelectedStatus('')
    setDateRange(getDefaultDateRange()) // Restablecer a fechas por defecto
    setPagination(prev => ({ ...prev, page: 1 }))
    // Recargar con filtros por defecto
    setTimeout(() => handleLoadSales(), 0)
  }

  // Funciones para el dropdown de clientes
  const filteredClients = React.useMemo(() => {
    // SIEMPRE usar searchResults si están disponibles (después de búsqueda API)
    // Si no hay searchResults, no mostrar nada hasta que se busque
    if (clientSearchTerm.length >= 2 && searchResults.length > 0) {
      return searchResults
    }

    // Si hay menos de 2 caracteres o no hay resultados, retornar vacío
    return []
  }, [searchResults, clientSearchTerm])

  const handleClientSelect = (clientId, clientName) => {
    setSelectedClient(clientId)
    setSelectedClientName(clientName) // Guardar nombre para usar en API
    setClientSearchTerm(clientName)
    setIsClientDropdownOpen(false)
    setHighlightedClientIndex(0)
    // NO recargar automáticamente - solo cuando se aplique el filtro
    // NO buscar de nuevo cuando se selecciona (prevenir búsqueda del nombre completo)
  }

  // Buscar clientes cuando el usuario escribe (con debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      // SOLO buscar si NO hay cliente seleccionado (estamos escribiendo para buscar)
      // Si ya hay cliente seleccionado, NO buscar (el input muestra el nombre del cliente seleccionado)
      if (clientSearchTerm && clientSearchTerm.length >= 2 && !selectedClient) {
        handleLoadClients(clientSearchTerm)
      }
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timer)
  }, [clientSearchTerm, selectedClient])

  const handleClientInputClick = () => {
    setIsClientDropdownOpen(true)
    setHighlightedClientIndex(0)
  }

  const handleClientInputKeyDown = e => {
    if (!isClientDropdownOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsClientDropdownOpen(true)
        setHighlightedClientIndex(0)
        e.preventDefault()
      }
      return
    }

    const clientsToShow = [
      {
        id: 'all',
        name: t('sales.payment.filter.all_clients', 'Todos los clientes'),
      },
      ...filteredClients,
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedClientIndex(prev =>
          prev < clientsToShow.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedClientIndex(prev => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter': {
        e.preventDefault()
        const selectedItem = clientsToShow[highlightedClientIndex]
        if (selectedItem) {
          const clientName =
            selectedItem.id === 'all'
              ? ''
              : selectedItem.name ||
                `${selectedItem.first_name} ${selectedItem.last_name}`
          handleClientSelect(selectedItem.id.toString(), clientName)
        }
        break
      }
      case 'Escape':
        setIsClientDropdownOpen(false)
        setHighlightedClientIndex(0)
        break
      default:
        break
    }
  }

  // Cerrar dropdown al hacer clic fuera o presionar ESC
  useEffect(() => {
    if (!isClientDropdownOpen) return

    const handleClickOutside = event => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target)
      ) {
        setIsClientDropdownOpen(false)
      }
    }

    const handleEscapeKey = event => {
      if (event.key === 'Escape') {
        setIsClientDropdownOpen(false)
        // Devolver el focus al input
        clientInputRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isClientDropdownOpen])

  // Focus en el primer elemento cuando se abre el dropdown
  useEffect(() => {
    if (isClientDropdownOpen && clientListRef.current) {
      // Primero quitar el focus del input
      clientInputRef.current?.blur()

      // Usar requestAnimationFrame para asegurar que el DOM esté completamente renderizado
      requestAnimationFrame(() => {
        const firstElement = clientListRef.current?.children[0]
        if (firstElement && typeof firstElement.focus === 'function') {
          firstElement.focus()
        }
      })
    }
  }, [isClientDropdownOpen])

  // Scroll al item destacado
  useEffect(() => {
    if (isClientDropdownOpen && clientListRef.current) {
      const highlightedElement =
        clientListRef.current.children[highlightedClientIndex]
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [highlightedClientIndex, isClientDropdownOpen])

  // Manejar selección de venta (solo una a la vez)
  const handleToggleSaleSelection = saleId => {
    // Si ya está seleccionada, deseleccionar; sino, seleccionar esta
    setSelectedSaleId(prev => (prev === saleId ? null : saleId))
  }

  // Manejar envío de pago
  const handlePaymentSubmit = async paymentData => {
    try {
      await salePaymentService.processSalePaymentWithCashRegister(paymentData)
      showSuccess(
        t('common.success'),
        t('sales.registerPaymentModal.successMessage', 'Pago registrado exitosamente')
      )
      // Reload sales data to update balance
      await handleLoadSales()
      // Clear selection and close modal
      setSelectedSaleId(null)
      setIsPaymentModalOpen(false)
    } catch (error) {
      console.error('Error registering payment:', error)
      throw error // Re-throw so modal can handle it
    }
  }

  // Formatear moneda en guaraníes
  const formatCurrency = amount => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'Gs. 0'
    return `Gs. ${Number(amount).toLocaleString('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  // Formatear fecha
  const formatDate = dateString => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-PY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  // Obtener badge de estado
  const getStatusBadge = status => {
    const statusConfig = {
      PENDING: {
        label: t('sales.payment.status.pending', 'Pendiente'),
        className: 'sales-payment-new__status-badge--pending',
      },
      PARTIAL_PAYMENT: {
        label: t('sales.payment.status.partial', 'Parcialmente Pagado'),
        className: 'sales-payment-new__status-badge--partial',
      },
      PAID: {
        label: t('sales.payment.status.paid', 'Pagado'),
        className: 'sales-payment-new__status-badge--paid',
      },
      CANCELLED: {
        label: t('sales.payment.status.cancelled', 'Cancelada'),
        className: 'sales-payment-new__status-badge--cancelled',
      },
    }

    const config = statusConfig[status] || statusConfig['PENDING']

    return (
      <span className={`sales-payment-new__status-badge ${config.className}`}>
        {config.label}
      </span>
    )
  }

  // Estados de UI
  if (isLoading && rawSales.length === 0) {
    return <DataState variant='loading' skeletonVariant='list' />
  }

  if (error && rawSales.length === 0) {
    return (
      <DataState
        variant='error'
        title={t('sales.payment.error.title', 'Error al cargar')}
        message={error}
        onRetry={handleLoadSales}
      />
    )
  }

  return (
    <div className='sales-payment-new'>
      {/* Header */}
      <div className='sales-payment-new__header'>
        <div className='sales-payment-new__header-content'>
          <div className='sales-payment-new__header-icon'>
            <Receipt className='icon icon--large' />
          </div>
          <div className='sales-payment-new__header-text'>
            <h1 className='sales-payment-new__title'>
              {t('sales.payment.title', 'Gestión de Cobros')}
            </h1>
            <p className='sales-payment-new__subtitle'>
              {t(
                'sales.payment.subtitle',
                'Busque y seleccione órdenes para procesar pagos.'
              )}
            </p>
          </div>
        </div>
        <div className='sales-payment-new__header-actions'>
          <Button
            onClick={handleLoadSales}
            disabled={isLoading}
            variant='outline'
            className='btn btn--secondary'
          >
            <RefreshCw className={`icon ${isLoading ? 'animate-spin' : ''}`} />
            {t('sales.payment.action.refresh', 'Actualizar Lista')}
          </Button>
          <Button
            onClick={() => setIsPaymentModalOpen(true)}
            disabled={!selectedSaleId}
            className='btn btn--primary'
          >
            <CreditCard className='icon' />
            {t('sales.payment.action.proceed', 'Proceder al Pago')}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className='sales-payment-new__filters'>
        {/* Búsqueda y Selectores */}
        <div className='sales-payment-new__filters-row'>
          {/* Búsqueda por texto */}
          <div className='sales-payment-new__filter-search'>
            <Search className='sales-payment-new__filter-search-icon' />
            <Input
              placeholder={t(
                'sales.payment.search.placeholder',
                'Buscar por ID de orden o nombre de cliente'
              )}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='sales-payment-new__filter-input'
            />
          </div>

          {/* Selector de cliente con búsqueda */}
          <div
            className='sales-payment-new__filter-select'
            ref={clientDropdownRef}
          >
            <div className='sales-payment-new__client-dropdown'>
              <input
                ref={clientInputRef}
                type='text'
                value={clientSearchTerm}
                onChange={e => {
                  setClientSearchTerm(e.target.value)
                  // Limpiar cliente seleccionado cuando el usuario escribe para buscar otro
                  if (selectedClient) {
                    setSelectedClient('')
                    setSelectedClientName('')
                  }
                }}
                onClick={handleClientInputClick}
                onKeyDown={handleClientInputKeyDown}
                placeholder={t(
                  'sales.payment.filter.client',
                  'Seleccionar cliente'
                )}
                className='sales-payment-new__filter-input sales-payment-new__client-input'
              />
              <ChevronDown
                className='sales-payment-new__client-dropdown-icon'
                onClick={handleClientInputClick}
              />
              {isClientDropdownOpen && (
                <div
                  className='sales-payment-new__client-dropdown-menu'
                  ref={clientListRef}
                >
                  <button
                    type='button'
                    className={`sales-payment-new__client-dropdown-item ${
                      highlightedClientIndex === 0
                        ? 'sales-payment-new__client-dropdown-item--highlighted'
                        : ''
                    }`}
                    onClick={() => handleClientSelect('all', '')}
                    onMouseEnter={() => setHighlightedClientIndex(0)}
                    onFocus={() => setHighlightedClientIndex(0)}
                  >
                    {t(
                      'sales.payment.filter.all_clients',
                      'Todos los clientes'
                    )}
                  </button>
                  {filteredClients.map((client, index) => {
                    const clientName =
                      client.name || `${client.first_name} ${client.last_name}`
                    return (
                      <button
                        type='button'
                        key={client.id}
                        className={`sales-payment-new__client-dropdown-item ${
                          highlightedClientIndex === index + 1
                            ? 'sales-payment-new__client-dropdown-item--highlighted'
                            : ''
                        }`}
                        onClick={() =>
                          handleClientSelect(client.id.toString(), clientName)
                        }
                        onMouseEnter={() =>
                          setHighlightedClientIndex(index + 1)
                        }
                        onFocus={() => setHighlightedClientIndex(index + 1)}
                      >
                        {clientName}
                      </button>
                    )
                  })}
                  {filteredClients.length === 0 && (
                    <div className='sales-payment-new__client-dropdown-item sales-payment-new__client-dropdown-item--empty'>
                      No se encontraron clientes
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selector de rango de fechas */}
          <div className='sales-payment-new__filter-date'>
            <Input
              type='date'
              value={dateRange.start_date}
              onChange={e =>
                setDateRange(prev => ({ ...prev, start_date: e.target.value }))
              }
              placeholder={t('sales.payment.filter.start_date', 'Fecha inicio')}
              className='sales-payment-new__filter-input'
            />
            <Input
              type='date'
              value={dateRange.end_date}
              onChange={e =>
                setDateRange(prev => ({ ...prev, end_date: e.target.value }))
              }
              placeholder={t('sales.payment.filter.end_date', 'Fecha fin')}
              className='sales-payment-new__filter-input'
            />
          </div>
        </div>

        {/* Filtros de Estado */}
        <div className='sales-payment-new__filters-row sales-payment-new__filters-row--status'>
          <div className='sales-payment-new__status-label'>
            {t('sales.payment.filter.status', 'Estado')}:
          </div>
          <div className='sales-payment-new__status-filters'>
            <button
              type='button'
              onClick={() => handleStatusFilter('PENDING')}
              className={`sales-payment-new__status-pill ${
                selectedStatus === 'PENDING'
                  ? 'sales-payment-new__status-pill--active sales-payment-new__status-pill--pending'
                  : 'sales-payment-new__status-pill--pending'
              }`}
            >
              {t('sales.payment.status.pending', 'Pendiente')}
            </button>
            <button
              type='button'
              onClick={() => handleStatusFilter('PARTIAL_PAYMENT')}
              className={`sales-payment-new__status-pill ${
                selectedStatus === 'PARTIAL_PAYMENT'
                  ? 'sales-payment-new__status-pill--active sales-payment-new__status-pill--partial'
                  : 'sales-payment-new__status-pill--partial'
              }`}
            >
              {t('sales.payment.status.partial', 'Parcialmente Pagado')}
            </button>
            <button
              type='button'
              onClick={() => handleStatusFilter('PAID')}
              className={`sales-payment-new__status-pill ${
                selectedStatus === 'PAID'
                  ? 'sales-payment-new__status-pill--active sales-payment-new__status-pill--paid'
                  : 'sales-payment-new__status-pill--paid'
              }`}
            >
              {t('sales.payment.status.paid', 'Pagado')}
            </button>
            <button
              type='button'
              onClick={() => handleStatusFilter('CANCELLED')}
              className={`sales-payment-new__status-pill ${
                selectedStatus === 'CANCELLED'
                  ? 'sales-payment-new__status-pill--active sales-payment-new__status-pill--cancelled'
                  : 'sales-payment-new__status-pill--cancelled'
              }`}
            >
              {t('sales.payment.status.cancelled', 'Cancelada')}
            </button>
          </div>
          <div className='sales-payment-new__filter-actions'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClearFilters}
              className='sales-payment-new__clear-filters'
            >
              {t('common.action.clear_filters', 'Limpiar Filtros')}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className='sales-payment-new__table-container'>
        {paginatedSales.length > 0 || filteredSales.length === 0 ? (
          <>
            <Table className='sales-payment-new__table'>
              <TableHeader>
                <TableRow>
                  <TableHead className='sales-payment-new__table-head sales-payment-new__table-head--checkbox'>
                    {/* Columna para selección individual */}
                  </TableHead>
                  <TableHead className='sales-payment-new__table-head'>
                    {t('sales.payment.table.order_id', 'ID ORDEN')}
                  </TableHead>
                  <TableHead className='sales-payment-new__table-head'>
                    {t('sales.payment.table.client', 'CLIENTE')}
                  </TableHead>
                  <TableHead className='sales-payment-new__table-head'>
                    {t('sales.payment.table.date', 'FECHA')}
                  </TableHead>
                  <TableHead className='sales-payment-new__table-head sales-payment-new__table-head--right'>
                    {t('sales.payment.table.total', 'MONTO TOTAL')}
                  </TableHead>
                  <TableHead className='sales-payment-new__table-head sales-payment-new__table-head--right'>
                    {t('sales.payment.table.balance', 'SALDO PENDIENTE')}
                  </TableHead>
                  <TableHead className='sales-payment-new__table-head'>
                    {t('sales.payment.table.status', 'ESTADO')}
                  </TableHead>
                  <TableHead className='sales-payment-new__table-head sales-payment-new__table-head--actions'>
                    {t('sales.payment.table.action', 'ACCIÓN')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.map(sale => (
                  <TableRow
                    key={sale.id}
                    className={`sales-payment-new__table-row ${
                      selectedSaleId === sale.id
                        ? 'sales-payment-new__table-row--selected'
                        : ''
                    }`}
                    onClick={() => handleToggleSaleSelection(sale.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell className='sales-payment-new__table-cell sales-payment-new__table-cell--checkbox'>
                      <input
                        type='radio'
                        name='sale-selection'
                        checked={selectedSaleId === sale.id}
                        onChange={() => handleToggleSaleSelection(sale.id)}
                        onClick={e => e.stopPropagation()}
                        className='sales-payment-new__radio'
                      />
                    </TableCell>
                    <TableCell className='sales-payment-new__table-cell'>
                      <span className='sales-payment-new__order-id'>
                        #{sale.id}
                      </span>
                    </TableCell>
                    <TableCell className='sales-payment-new__table-cell'>
                      {sale.client_name || 'N/A'}
                    </TableCell>
                    <TableCell className='sales-payment-new__table-cell'>
                      {formatDate(sale.sale_date || sale.created_at)}
                    </TableCell>
                    <TableCell className='sales-payment-new__table-cell sales-payment-new__table-cell--right'>
                      <span className='sales-payment-new__amount'>
                        {formatCurrency(sale.total_amount)}
                      </span>
                    </TableCell>
                    <TableCell className='sales-payment-new__table-cell sales-payment-new__table-cell--right'>
                      <span className='sales-payment-new__balance'>
                        {formatCurrency(sale.balance_due)}
                      </span>
                    </TableCell>
                    <TableCell className='sales-payment-new__table-cell'>
                      {getStatusBadge(sale.status)}
                    </TableCell>
                    <TableCell className='sales-payment-new__table-cell sales-payment-new__table-cell--actions'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={e => {
                          e.stopPropagation()
                          navigate(`/cobros-ventas/${sale.id}`)
                        }}
                        className='btn btn--ghost btn--small'
                      >
                        {t('common.action.view_detail', 'Ver Detalle')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación */}
            <div className='sales-payment-new__pagination'>
              <div className='sales-payment-new__pagination-info'>
                {t('sales.payment.pagination.showing', 'Mostrando')}{' '}
                {filteredSales.length > 0
                  ? (pagination.page - 1) * pagination.page_size + 1
                  : 0}
                -
                {Math.min(
                  pagination.page * pagination.page_size,
                  filteredSales.length
                )}{' '}
                {t('sales.payment.pagination.of', 'de')}{' '}
                {filteredSales.length}
              </div>
              <div className='sales-payment-new__pagination-controls'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || isLoading}
                  className='btn btn--secondary btn--small'
                >
                  {t('common.pagination.previous', 'Anterior')}
                </Button>
                <div className='sales-payment-new__pagination-pages'>
                  {Array.from(
                    { length: Math.min(pagination.total_pages, 5) },
                    (_, i) => {
                      const pageNumber = i + 1
                      return (
                        <Button
                          key={pageNumber}
                          variant={
                            pagination.page === pageNumber
                              ? 'default'
                              : 'outline'
                          }
                          size='sm'
                          onClick={() => handlePageChange(pageNumber)}
                          disabled={isLoading}
                          className={`btn ${
                            pagination.page === pageNumber
                              ? 'btn--primary'
                              : 'btn--secondary'
                          } btn--small`}
                        >
                          {pageNumber}
                        </Button>
                      )
                    }
                  )}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={
                    pagination.page === pagination.total_pages || isLoading
                  }
                  className='btn btn--secondary btn--small'
                >
                  {t('common.pagination.next', 'Siguiente')}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <DataState
            variant='empty'
            title={t('sales.payment.empty.title', 'Sin resultados')}
            message={t(
              'sales.payment.empty.message',
              'No se encontraron órdenes de venta con los filtros seleccionados'
            )}
            onAction={handleClearFilters}
            actionLabel={t('common.action.clear_filters', 'Limpiar Filtros')}
          />
        )}
      </div>

      {/* Modal de registro de pago */}
      <RegisterSalePaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        sale={rawSales.find(s => s.id === selectedSaleId)}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  )
}

export default SalePayment
