import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Receipt,
  RefreshCw,
  Search,
  CreditCard,
  X,
  User,
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

const formatDocumentId = value => {
  if (!value) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const SalePayment = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { error: showError, success: showSuccess } = useToast()

  // Zustand stores
  const { searchResults, searchClients, loading: clientsLoading } = useClientStore()

  // Local state para ventas y filtros
  const [rawSales, setRawSales] = useState([]) // Datos sin filtrar de la API
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState('') // ID del cliente
  const [selectedClientName, setSelectedClientName] = useState('') // Nombre del cliente para API
  const [selectedStatus, setSelectedStatus] = useState('')

  // Estado para dropdown de clientes (mismo patrón que modal de productos en SalesNew)
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [highlightedClientIndex, setHighlightedClientIndex] = useState(-1)
  const clientSearchContainerRef = useRef(null)
  const clientDropdownRef = useRef(null)
  const startDateRef = useRef(null)
  const endDateRef = useRef(null)

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

  // Cargar datos iniciales (solo al montar)
  useEffect(() => {
    handleLoadSales()
  }, [])

  // Cargar clientes mediante búsqueda
  // Handler robusto para cambios de fecha
  // Usa ref para deduplicar llamadas de onChange/onInput/onBlur
  const lastDateFetchRef = useRef({ start_date: '', end_date: '' })
  const handleDateChange = (field, value) => {
    if (!value || value === lastDateFetchRef.current[field]) return
    lastDateFetchRef.current[field] = value
    const newRange = { ...dateRange, [field]: value }
    setDateRange(newRange)
    setPagination(prev => ({ ...prev, page: 1 }))
    handleLoadSales({ dateRange: newRange })
  }

  // Alias searchResults as clients for the dropdown
  const clients = searchResults

  // Cargar ventas con lógica inteligente según filtros
  // Acepta overrides para evitar problemas de stale closures
  const handleLoadSales = async (overrides = {}) => {
    setIsLoading(true)
    setError(null)

    // Usar overrides si vienen, sino el estado actual
    const effectiveDateRange = overrides.dateRange || dateRange
    const effectiveClientName = overrides.clientName !== undefined
      ? overrides.clientName
      : selectedClientName
    const effectiveClient = overrides.client !== undefined
      ? overrides.client
      : selectedClient

    try {
      let response

      // LÓGICA DE FILTROS:
      // 1. Si hay cliente seleccionado -> usar GET /sale/client_name/{name}/payment-status
      // 2. Si NO hay cliente pero SÍ hay fechas -> usar GET /sale/date_range/payment-status

      const hasValidDateRange = effectiveDateRange.start_date && effectiveDateRange.end_date
      const hasValidClient =
        effectiveClient &&
        effectiveClient !== '' &&
        effectiveClient !== 'all' &&
        effectiveClientName

      if (hasValidClient) {
        const filters = {
          page: 1,
          page_size: pagination.page_size,
        }

        response =
          await salePaymentService.getSalesByClientNameWithPaymentStatus(
            effectiveClientName,
            filters
          )
      } else if (hasValidDateRange) {
        const filters = {
          page: 1,
          page_size: pagination.page_size,
          start_date: effectiveDateRange.start_date,
          end_date: effectiveDateRange.end_date,
        }

        response =
          await salePaymentService.getSalesByDateRangeWithPaymentStatus(filters)
      } else {
        const filters = {
          page: 1,
          page_size: pagination.page_size,
          start_date: effectiveDateRange.start_date,
          end_date: effectiveDateRange.end_date,
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
    const defaultDates = getDefaultDateRange()
    setSearchTerm('')
    setSelectedClient('')
    setSelectedClientName('')
    setClientSearchTerm('')
    setSelectedStatus('')
    setDateRange(defaultDates)
    setPagination(prev => ({ ...prev, page: 1 }))
    // Resetear DOM de date inputs (son uncontrolled) y dedup ref
    if (startDateRef.current) startDateRef.current.value = defaultDates.start_date
    if (endDateRef.current) endDateRef.current.value = defaultDates.end_date
    lastDateFetchRef.current = { start_date: '', end_date: '' }
    handleLoadSales({ dateRange: defaultDates, client: '', clientName: '' })
  }

  // Seleccionar cliente desde el dropdown
  const handleSelectClient = client => {
    setSelectedClient(client.id.toString())
    setSelectedClientName(client.name || '')
    setClientSearchTerm(client.name || '')
    setShowClientDropdown(false)
    setHighlightedClientIndex(-1)
    setPagination(prev => ({ ...prev, page: 1 }))
    handleLoadSales({ client: client.id.toString(), clientName: client.name || '' })
  }

  // Limpiar selección de cliente
  const handleClearClient = () => {
    setSelectedClient('')
    setSelectedClientName('')
    setClientSearchTerm('')
    setShowClientDropdown(false)
    setHighlightedClientIndex(-1)
    setPagination(prev => ({ ...prev, page: 1 }))
    handleLoadSales({ client: '', clientName: '' })
  }

  // Buscar clientes cuando cambia el término de búsqueda (3 chars, 300ms debounce)
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (clientSearchTerm.trim().length >= 3) {
        // Evitar búsqueda si el término coincide con el cliente seleccionado
        if (selectedClient && clientSearchTerm === selectedClientName) {
          return
        }
        try {
          await searchClients(clientSearchTerm)
          setShowClientDropdown(true)
        } catch (error) {
          console.error('Error searching clients:', error)
          setShowClientDropdown(false)
        }
      } else {
        setShowClientDropdown(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [clientSearchTerm, searchClients, selectedClient, selectedClientName])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        clientSearchContainerRef.current &&
        !clientSearchContainerRef.current.contains(event.target)
      ) {
        setShowClientDropdown(false)
        setHighlightedClientIndex(-1)
      }
    }

    if (showClientDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showClientDropdown])

  // Scroll al item destacado en el dropdown
  useEffect(() => {
    if (showClientDropdown && clientDropdownRef.current && highlightedClientIndex >= 0) {
      const item = clientDropdownRef.current.children[highlightedClientIndex]
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [highlightedClientIndex, showClientDropdown])

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

          {/* Selector de cliente con búsqueda (estilo navbar search) */}
          <div
            className='sales-payment-new__filter-select'
            ref={clientSearchContainerRef}
            style={{ position: 'relative' }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', color: '#64748b', pointerEvents: 'none' }} />
              <input
                type='text'
                placeholder={t(
                  'sales.payment.filter.client_placeholder',
                  'Buscar cliente por nombre...'
                )}
                value={clientSearchTerm}
                onChange={event => {
                  setClientSearchTerm(event.target.value)
                  setShowClientDropdown(true)
                  setHighlightedClientIndex(-1)
                  if (selectedClient && event.target.value !== selectedClientName) {
                    setSelectedClient('')
                    setSelectedClientName('')
                  }
                }}
                onFocus={() => {
                  if (clientSearchTerm.length >= 3 && clients.length > 0) {
                    setShowClientDropdown(true)
                  }
                }}
                onKeyDown={e => {
                  const itemCount = clients.length

                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    if (!showClientDropdown && itemCount > 0) {
                      setShowClientDropdown(true)
                      setHighlightedClientIndex(0)
                    } else if (itemCount > 0) {
                      setHighlightedClientIndex(prev =>
                        prev < itemCount - 1 ? prev + 1 : 0
                      )
                    }
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    if (itemCount > 0) {
                      setHighlightedClientIndex(prev =>
                        prev > 0 ? prev - 1 : itemCount - 1
                      )
                    }
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (showClientDropdown && itemCount > 0) {
                      const indexToSelect =
                        highlightedClientIndex >= 0 ? highlightedClientIndex : 0
                      handleSelectClient(clients[indexToSelect])
                    }
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setShowClientDropdown(false)
                    setHighlightedClientIndex(-1)
                  }
                  if (e.key === 'Tab') {
                    setShowClientDropdown(false)
                    setHighlightedClientIndex(-1)
                  }
                }}
                role='combobox'
                aria-expanded={showClientDropdown}
                aria-haspopup='listbox'
                aria-controls='client-search-listbox'
                aria-activedescendant={
                  highlightedClientIndex >= 0
                    ? `client-option-${highlightedClientIndex}`
                    : undefined
                }
                autoComplete='off'
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                  height: '48px',
                }}
              />
              {clientSearchTerm && (
                <button
                  onClick={handleClearClient}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  aria-label='Limpiar búsqueda de cliente'
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {showClientDropdown && (
              <div
                ref={clientDropdownRef}
                role='listbox'
                id='client-search-listbox'
                aria-label={t('sales.payment.filter.client_results', 'Resultados de clientes')}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e2e8f0',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 9999,
                }}
              >
                {clientsLoading ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                    {t('common.loading', 'Buscando...')}
                  </div>
                ) : clients.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                    {clientSearchTerm.length < 3
                      ? t('sales.payment.filter.min_chars', 'Escribe al menos 3 caracteres')
                      : t('sales.payment.filter.no_results', 'No se encontraron clientes')}
                  </div>
                ) : (
                  clients.map((client, index) => (
                    <button
                      key={`${client.id}-${index}`}
                      id={`client-option-${index}`}
                      role='option'
                      aria-selected={index === highlightedClientIndex}
                      onClick={() => handleSelectClient(client)}
                      onMouseEnter={() => setHighlightedClientIndex(index)}
                      onMouseLeave={() => setHighlightedClientIndex(-1)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '10px 16px',
                        border: 'none',
                        borderLeft: index === highlightedClientIndex ? '3px solid #3b82f6' : '3px solid transparent',
                        background: index === highlightedClientIndex ? '#f1f5f9' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <User size={16} style={{ marginRight: '10px', color: '#64748b', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>
                          {client.name}
                        </span>
                        {client.document_id && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Doc: {formatDocumentId(client.document_id)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selector de rango de fechas */}
          <div className='sales-payment-new__filter-date'>
            <input
              type='date'
              ref={startDateRef}
              defaultValue={dateRange.start_date}
              onChange={e => handleDateChange('start_date', e.target.value)}
              onInput={e => handleDateChange('start_date', e.target.value)}
              onBlur={e => handleDateChange('start_date', e.target.value)}
              className='input sales-payment-new__filter-input'
            />
            <input
              type='date'
              ref={endDateRef}
              defaultValue={dateRange.end_date}
              onChange={e => handleDateChange('end_date', e.target.value)}
              onInput={e => handleDateChange('end_date', e.target.value)}
              onBlur={e => handleDateChange('end_date', e.target.value)}
              className='input sales-payment-new__filter-input'
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
