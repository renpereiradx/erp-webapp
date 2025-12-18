import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  DollarSign,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'
import useProductStore from '@/store/useProductStore'
import useClientStore from '@/store/useClientStore'
import useSaleStore from '@/store/useSaleStore'
import { useToast } from '@/hooks/useToast'
import saleService from '@/services/saleService'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { CurrencyService } from '@/services/currencyService'
import { productService } from '@/services/productService'
import apiService from '@/services/api'

const STATUS_STYLES = {
  completed: { label: 'Completada', badge: 'badge--subtle-success' },
  cancelled: { label: 'Cancelada', badge: 'badge--subtle-error' },
  pending: { label: 'Pendiente', badge: 'badge--subtle-warning' },
}

const dropdownMenuStyle = {
  outline: 'none',
  backgroundColor: '#fff',
  border: '1px solid #dfe3e6',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.14)',
  borderRadius: '10px',
  minWidth: '180px',
  padding: '6px 0',
  zIndex: 10,
}

const dropdownMenuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  background: 'transparent',
  border: 'none',
  padding: '8px 12px',
  fontSize: '14px',
  color: '#1f2933',
  cursor: 'pointer',
  textAlign: 'left',
}

const dropdownMenuDangerStyle = {
  color: '#b42318',
}

const RadioGroup = ({ label, options, value, onChange, name }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    }}
    role='radiogroup'
    aria-label={label}
  >
    <span style={{ fontWeight: 600 }}>{label}</span>
    <div style={{ display: 'flex', gap: '12px' }}>
      {options.map(option => (
        <label
          key={option.value}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <input
            type='radio'
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={event => onChange(event.target.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  </div>
)

const formatCurrency = (value, currencyCode) => {
  const isPYG = currencyCode === 'PYG'
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: isPYG ? 0 : 2,
    maximumFractionDigits: isPYG ? 0 : 2,
  }).format(value)
}

const formatDocumentId = value => {
  if (!value) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const formatDateTime = value => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-PY', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const formatStatusLabel = status =>
  STATUS_STYLES[status]?.label || status || '—'

const toDateInputValue = date => {
  const local = new Date(date)
  local.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return local.toISOString().split('T')[0]
}

const getProductDisplay = product => {
  if (!product) return { name: '', id: '', price: 0, sku: '' }
  return {
    name: product.name || product.product_name || '',
    id: product.id || product.product_id || '',
    price:
      product.sale_price ||
      product.price ||
      product.unit_prices?.[0]?.price_per_unit ||
      0,
    sku: product.sku || product.barcode || product.code || '',
  }
}

const SalesNew = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const clientSearchContainerRef = useRef(null)
  const productSearchContainerRef = useRef(null)
  const productDropdownRef = useRef(null)
  const modalProductInputRef = useRef(null)

  // Zustand stores
  const {
    products,
    fetchProducts,
    loading: productsLoading,
  } = useProductStore()
  const {
    searchResults: clients,
    searchClients,
    loading: clientsLoading,
  } = useClientStore()
  const {
    createSale,
    sales,
    fetchSalesByDateRange,
    fetchSalesByClientName,
    clearSales,
    cancelSale,
    loading: saleLoading,
  } = useSaleStore()

  // Tab state
  const [activeTab, setActiveTab] = useState('new-sale')

  // Cart state (temporal - se envía a API al guardar)
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [generalDiscount, setGeneralDiscount] = useState(0)

  // Client search state
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  // Payment and currency state
  const [paymentMethodId, setPaymentMethodId] = useState(1)
  const [currencyId, setCurrencyId] = useState(1)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false)
  const [currenciesLoading, setCurrenciesLoading] = useState(false)

  // History tab state
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilterMode, setHistoryFilterMode] = useState('name')
  const [historyFilterError, setHistoryFilterError] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [historyActionMenuId, setHistoryActionMenuId] = useState(null)
  const [selectedHistorySale, setSelectedHistorySale] = useState(null)
  const [showSaleDetailModal, setShowSaleDetailModal] = useState(false)
  const [showCancelSaleModal, setShowCancelSaleModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelPreview, setCancelPreview] = useState(null)
  const [cancelPreviewLoading, setCancelPreviewLoading] = useState(false)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedModalProduct, setSelectedModalProduct] = useState(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalDiscount, setModalDiscount] = useState(0)
  const [modalDiscountType, setModalDiscountType] = useState('amount') // 'amount' | 'percent'
  const [modalDiscountReason, setModalDiscountReason] = useState('')
  const [editingItemId, setEditingItemId] = useState(null)
  const [openActionMenuId, setOpenActionMenuId] = useState(null)

  // Modal product search state
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [modalSearchResults, setModalSearchResults] = useState([])
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // Client status state
  const [pendingReservations, setPendingReservations] = useState([])
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [activeSales, setActiveSales] = useState([])
  const [activeSale, setActiveSale] = useState(null)
  const [showActiveSaleModal, setShowActiveSaleModal] = useState(false)
  const [currentSaleId, setCurrentSaleId] = useState(null) // ID de venta pendiente siendo actualizada

  // Cargar productos al montar
  useEffect(() => {
    fetchProducts({ page: 1, pageSize: 100 })
  }, [fetchProducts])

  // Cargar métodos de pago y monedas al montar
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setPaymentMethodsLoading(true)
        const methods = await PaymentMethodService.getAll()
        setPaymentMethods(methods)
        if (methods.length > 0) {
          setPaymentMethodId(methods[0].id)
        }
      } catch (error) {
        console.error('Error loading payment methods:', error)
      } finally {
        setPaymentMethodsLoading(false)
      }

      try {
        setCurrenciesLoading(true)
        const currencyList = await CurrencyService.getAll()
        setCurrencies(currencyList)
        if (currencyList.length > 0) {
          setCurrencyId(currencyList[0].id)
        }
      } catch (error) {
        console.error('Error loading currencies:', error)
      } finally {
        setCurrenciesLoading(false)
      }
    }
    loadPaymentData()
  }, [])

  // Buscar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (clientSearchTerm.trim().length >= 3) {
        // Evitar búsqueda si el término coincide con el cliente seleccionado
        if (selectedClient && clientSearchTerm === selectedClient.name) {
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
  }, [clientSearchTerm, searchClients, selectedClient])

  // Buscar productos para el modal
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const term = (productSearchTerm || '').trim()
      if (term.length >= 3) {
        // Evitar búsqueda si el término coincide con el producto seleccionado
        const currentProduct = getProductDisplay(selectedModalProduct)
        if (selectedModalProduct && term === currentProduct.name) {
          return
        }

        setIsSearchingProducts(true)
        try {
          const results = await productService.searchProducts(term)
          const allResults = Array.isArray(results)
            ? results
            : results
            ? [results]
            : []
          // Filtrar productos activos (state !== false && is_active !== false)
          const activeResults = allResults.filter(p => {
            // Si tiene 'status' explícito (booleano), usarlo
            if (typeof p.status === 'boolean') return p.status
            // Lógica de Products.jsx: state !== false && is_active !== false
            return p.state !== false && p.is_active !== false
          })
          setModalSearchResults(activeResults)
          setShowProductDropdown(true)
        } catch (error) {
          console.error('Error searching products:', error)
          setModalSearchResults([])
        } finally {
          setIsSearchingProducts(false)
        }
      } else {
        setModalSearchResults([])
        // No cerrar dropdown aquí para permitir ver mensaje de "escribe más caracteres"
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [productSearchTerm, selectedModalProduct])

  // Establecer producto inicial en modal cuando carguen productos
  useEffect(() => {
    if (products.length > 0 && !selectedModalProduct) {
      // No pre-seleccionar automáticamente para obligar a buscar
      // setSelectedModalProduct(products[0])
    }
  }, [products, selectedModalProduct])

  // Autofocus en el input del modal cuando se abre
  useEffect(() => {
    if (isModalOpen && modalProductInputRef.current) {
      // Timeout para asegurar que el modal esté completamente renderizado
      setTimeout(() => {
        modalProductInputRef.current?.focus()
      }, 100)
    }
  }, [isModalOpen])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        clientSearchContainerRef.current &&
        !clientSearchContainerRef.current.contains(event.target)
      ) {
        setShowClientDropdown(false)
      }
      if (
        productSearchContainerRef.current &&
        !productSearchContainerRef.current.contains(event.target)
      ) {
        setShowProductDropdown(false)
      }
    }

    if (showClientDropdown || showProductDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showClientDropdown, showProductDropdown])

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [items]
  )

  const filteredItems = useMemo(
    () =>
      items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [items, searchTerm]
  )

  const lineDiscounts = useMemo(
    () => items.reduce((acc, item) => acc + (item.discount || 0), 0),
    [items]
  )

  const taxes = useMemo(() => {
    const taxableBase = Math.max(0, subtotal - lineDiscounts - generalDiscount)

    // Calcular monto de reservas (exentas de IVA adicional)
    const reservationAmount = items.reduce((acc, item) => {
      if (item.isReservation) {
        return acc + item.price * item.quantity - (item.discount || 0)
      }
      return acc
    }, 0)

    // Restar reservas de la base imponible
    const taxableAmount = Math.max(0, taxableBase - reservationAmount)

    // El IVA es el 10% (no 16%) según la legislación local para servicios deportivos
    // Pero mantenemos 16% si es la configuración global, o ajustamos si es necesario.
    // Asumiendo que el sistema usa 10% para todo lo demás, o 16% si es estándar.
    // El código original tenía 0.16. Lo mantengo.
    return taxableAmount * 0.16
  }, [subtotal, lineDiscounts, generalDiscount, items])

  const total = useMemo(
    () => Math.max(0, subtotal - lineDiscounts - generalDiscount + taxes),
    [subtotal, lineDiscounts, generalDiscount, taxes]
  )

  const filteredHistory = useMemo(
    () =>
      (sales || []).filter(entry => {
        if (!historySearch) return true
        const searchLower = historySearch.toLowerCase()
        return (
          entry.client_name?.toLowerCase().includes(searchLower) ||
          entry.sale_id?.toString().toLowerCase().includes(searchLower)
        )
      }),
    [sales, historySearch]
  )

  const historyFilterHint = useMemo(() => {
    if (historyFilterMode === 'name') {
      return historySearch
        ? 'Buscando ventas por coincidencia parcial de nombre de cliente'
        : 'Ingresa el nombre o parte del nombre y presiona Filtrar'
    }
    if (dateFrom && dateTo) {
      return 'Filtrando por rango de fechas seleccionado'
    }
    return 'Selecciona un rango de fechas completo y presiona Filtrar'
  }, [historyFilterMode, historySearch, dateFrom, dateTo])

  const applyDatePreset = preset => {
    const today = new Date()
    let start = ''
    let end = ''

    if (preset === 'today') {
      start = toDateInputValue(today)
      end = toDateInputValue(today)
    }

    if (preset === 'last7') {
      const sevenAgo = new Date(today)
      sevenAgo.setDate(today.getDate() - 6)
      start = toDateInputValue(sevenAgo)
      end = toDateInputValue(today)
    }

    if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      start = toDateInputValue(firstDay)
      end = toDateInputValue(today)
    }

    setHistoryFilterMode('date')
    setDateFrom(start)
    setDateTo(end)
    setHistoryFilterError('')
  }

  const selectedSaleDetails = useMemo(() => {
    if (!selectedHistorySale) return []
    if (Array.isArray(selectedHistorySale.details))
      return selectedHistorySale.details
    return []
  }, [selectedHistorySale])

  const modalProduct = selectedModalProduct
  const modalDisplay = getProductDisplay(modalProduct)

  const modalUnitPrice = modalDisplay.price

  const parsedModalQuantity = useMemo(() => {
    const quantityValue = Number(modalQuantity)
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      return 1
    }
    return quantityValue
  }, [modalQuantity])

  const parsedModalDiscount = useMemo(() => {
    const discountValue = Number(modalDiscount)
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      return 0
    }
    return discountValue
  }, [modalDiscount])

  const modalSubtotal = useMemo(
    () => modalUnitPrice * parsedModalQuantity,
    [modalUnitPrice, parsedModalQuantity]
  )

  const modalDiscountValue = useMemo(() => {
    let totalDiscount = 0
    if (modalDiscountType === 'percent') {
      // Porcentaje sobre el precio unitario, multiplicado por cantidad
      const discountPerUnit = modalUnitPrice * (parsedModalDiscount / 100)
      totalDiscount = discountPerUnit * parsedModalQuantity
    } else {
      // Monto fijo unitario, multiplicado por cantidad
      totalDiscount = parsedModalDiscount * parsedModalQuantity
    }
    return Math.min(totalDiscount, modalSubtotal)
  }, [
    parsedModalDiscount,
    modalSubtotal,
    modalDiscountType,
    modalUnitPrice,
    parsedModalQuantity,
  ])

  const modalLineTotal = useMemo(
    () => Math.max(0, modalSubtotal - modalDiscountValue),
    [modalSubtotal, modalDiscountValue]
  )

  const handleRemoveItem = lineId => {
    setItems(prev => prev.filter(item => item.id !== lineId))
  }

  const checkClientStatus = async client => {
    if (!client || !client.id) return

    try {
      // 1. Verificar Reservas Pendientes
      const reservations = await apiService.getReservationReport({
        client_id: client.id,
        status: 'CONFIRMED', // Asumimos que CONFIRMED son las listas para pagar
      })

      if (reservations && reservations.length > 0) {
        setPendingReservations(reservations)
        setShowReservationModal(true)
      }

      // 2. Verificar Ventas Activas (Pendientes de Pago)
      try {
        let clientSales = []
        try {
          clientSales = await apiService.getSalesByClientId(client.id)
        } catch (idError) {
          console.warn('Error fetching sales by ID, trying by name...', idError)
          // Fallback: Try by name if ID fails (e.g. 500 error)
          if (client.name) {
            const fullName = client.last_name
              ? `${client.name} ${client.last_name}`.trim()
              : client.name
            clientSales = await apiService.getSalesByClientName(fullName)
          }
        }

        // Filtrar ventas con estado 'PENDING' u 'OPEN'
        const pendingSales = Array.isArray(clientSales)
          ? clientSales.filter(
              s => s.status === 'PENDING' || s.status === 'OPEN'
            )
          : []

        if (pendingSales.length > 0) {
          setActiveSales(pendingSales)
          setActiveSale(pendingSales[0])
          setShowActiveSaleModal(true)
        }
      } catch (saleError) {
        console.warn('Could not fetch client sales:', saleError)
        // No bloqueamos el flujo si falla la consulta de ventas
      }
    } catch (error) {
      console.error('Error checking client status:', error)
    }
  }

  const handleSelectClient = client => {
    setSelectedClient(client)
    setShowClientDropdown(false)
    setClientSearchTerm(client.name || '')

    // Verificar estado del cliente (reservas/ventas)
    checkClientStatus(client)
  }

  const toggleHistoryActionMenu = saleId => {
    setHistoryActionMenuId(prev => (prev === saleId ? null : saleId))
  }

  const handleHistoryFilter = async () => {
    setHistoryFilterError('')
    if (historyFilterMode === 'name') {
      const term = historySearch.trim()
      if (!term) {
        toast.error('Ingresa un nombre de cliente para buscar')
        setHistoryFilterError('Ingresa un nombre de cliente antes de filtrar')
        return
      }

      try {
        await fetchSalesByClientName(term, { page: 1, page_size: 50 })
      } catch (error) {
        toast.errorFrom(error, {
          fallback: 'No se pudo obtener ventas por nombre',
        })
      }
      return
    }

    if (!dateFrom || !dateTo) {
      toast.error('Selecciona un rango de fechas')
      setHistoryFilterError(
        'Selecciona fecha desde y hasta para filtrar por rango'
      )
      return
    }

    try {
      await fetchSalesByDateRange({
        start_date: dateFrom,
        end_date: dateTo,
        page: 1,
        page_size: 50,
      })
    } catch (error) {
      toast.errorFrom(error, {
        fallback: 'No se pudo obtener ventas por fechas',
      })
    }
  }

  const handleHistoryClear = () => {
    setHistorySearch('')
    setDateFrom('')
    setDateTo('')
    setHistoryFilterMode('date')
    setHistoryFilterError('')
    clearSales()
  }

  const handleViewSale = sale => {
    setSelectedHistorySale(sale)
    setShowSaleDetailModal(true)
    setHistoryActionMenuId(null)
  }

  const handleCancelSale = async sale => {
    const saleId = sale?.sale_id || sale?.id
    if (!saleId) return

    setHistoryActionMenuId(null)
    setCancelPreview(null)
    setSelectedHistorySale(sale)
    setCancelReason('')
    setCancelPreviewLoading(true)

    try {
      const preview = await saleService.previewSaleCancellation(saleId)
      setCancelPreview(preview)
      setShowCancelSaleModal(true)
    } catch (error) {
      toast.errorFrom(error, {
        fallback: 'No se pudo previsualizar la anulación de la venta',
      })
    } finally {
      setCancelPreviewLoading(false)
    }
  }

  const handleConfirmCancelSale = async () => {
    if (!selectedHistorySale) return
    const saleId = selectedHistorySale.sale_id || selectedHistorySale.id
    if (!saleId) return

    setCancelSubmitting(true)
    try {
      await cancelSale(saleId, cancelReason || 'Cancelada por el usuario')
      toast.success('Venta cancelada exitosamente')

      setSelectedHistorySale(prev =>
        prev ? { ...prev, status: 'cancelled' } : prev
      )
      setShowCancelSaleModal(false)
      setCancelPreview(null)

      if (historyFilterMode === 'name' && historySearch.trim()) {
        fetchSalesByClientName(historySearch.trim(), {
          page: 1,
          page_size: 50,
        })
      } else if (dateFrom && dateTo) {
        fetchSalesByDateRange({
          start_date: dateFrom,
          end_date: dateTo,
          page: 1,
          page_size: 50,
        })
      }
    } catch (error) {
      toast.errorFrom(error, {
        fallback: 'No se pudo cancelar la venta',
      })
    } finally {
      setCancelSubmitting(false)
    }
  }

  const toggleActionMenu = itemId => {
    setOpenActionMenuId(prev => (prev === itemId ? null : itemId))
  }

  const handleEditItem = item => {
    const discountValue = item.discountInput ?? item.discount ?? 0
    setSelectedModalProduct({
      id: item.productId || item.id,
      name: item.name,
      price: item.price,
    })
    setProductSearchTerm(item.name) // Setear el nombre del producto en el campo de búsqueda
    setModalQuantity(item.quantity)
    setModalDiscountType(item.discountType || 'amount')
    setModalDiscount(discountValue)
    setModalDiscountReason(item.discountReason || '')
    setEditingItemId(item.id)
    setIsModalOpen(true)
    setShowProductDropdown(false) // Cerrar dropdown al editar
    setOpenActionMenuId(null)
  }

  const handleAddReservations = () => {
    const newItems = pendingReservations.map(res => {
      const duration = res.duration || res.duration_hours || 1
      // Asegurar que el precio sea numérico
      const price = Number(res.total_amount) || 0
      const reserveKey =
        res.reserve_id ||
        res.id ||
        res.product_id ||
        `${res.product_name || 'res'}-${res.start_time || ''}`

      // Formatear la fecha y hora de la reserva
      let timeInfo = ''
      if (res.start_time) {
        try {
          const date = new Date(res.start_time)
          const dateStr = date.toLocaleDateString('es-PY', {
            day: '2-digit',
            month: '2-digit',
          })
          const timeStr = date.toLocaleTimeString('es-PY', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          timeInfo = ` • ${dateStr} ${timeStr}h`
        } catch (e) {
          console.warn('Error formatting reservation time:', e)
        }
      }

      return {
        id: `RES-${reserveKey}`,
        productId: res.product_id || `RES-${reserveKey}`, // Fallback ID
        name: `${res.product_name}${timeInfo}`,
        quantity: 1, // Mantenemos 1 para respetar el precio total del paquete
        price: price,
        discount: 0,
        isReservation: true,
        reserveId: res.reserve_id,
        reserveKey,
        reservationTime: res.start_time, // Guardar para referencia
      }
    })

    setItems(prev => {
      // Para servicios/reservas: solo verificar por reserveId único
      // Permitir múltiples reservas del mismo servicio (ej: cancha en diferentes horarios)
      const existingReserveKeys = new Set(
        prev
          .filter(item => item.reserveId || item.reserveKey)
          .map(item => item.reserveKey || item.reserveId)
      )

      const deduped = []
      const skippedReservations = []

      newItems.forEach(item => {
        const reserveKey = item.reserveKey || item.reserveId || item.id

        // Solo verificar si esta reserva específica ya existe
        // NO verificar por productId para permitir servicios duplicados
        if (existingReserveKeys.has(reserveKey)) {
          skippedReservations.push(item.name)
          return
        }

        existingReserveKeys.add(reserveKey)
        deduped.push(item)
      })

      if (deduped.length === 0) {
        alert('Todas las reservas ya están en el carrito')
        return prev
      }

      if (skippedReservations.length > 0) {
        alert(
          `Se agregaron ${deduped.length} reserva(s). ${skippedReservations.length} reserva(s) duplicada(s) omitida(s).`
        )
      }

      return [...prev, ...deduped]
    })
    setShowReservationModal(false)
    setPendingReservations([])
  }

  const handleSearchReservations = async () => {
    if (!selectedClient || !selectedClient.id) {
      alert('Por favor selecciona un cliente primero')
      return
    }

    try {
      const reservations = await apiService.getReservationReport({
        client_id: selectedClient.id,
        status: 'CONFIRMED',
      })

      if (reservations && reservations.length > 0) {
        setPendingReservations(reservations)
        setShowReservationModal(true)
      } else {
        alert('No se encontraron reservas confirmadas para este cliente')
      }
    } catch (error) {
      console.error('Error buscando reservas:', error)
      alert('Error al buscar reservas del cliente')
    }
  }

  const handleContinueSale = async () => {
    if (!activeSale) return

    let saleDetails = activeSale.details || []
    const saleId = activeSale.sale_id || activeSale.id

    // Si no tiene detalles, intentar obtenerlos por ID
    if (saleDetails.length === 0 && saleId) {
      try {
        const fullSale = await apiService.getSaleById(saleId)
        if (fullSale && fullSale.details) {
          saleDetails = fullSale.details
        }
      } catch (error) {
        console.error('Error fetching sale details:', error)
        // Fallback o notificación de error
      }
    }

    const loadedItems = saleDetails.map((detail, index) => ({
      id: `SALE-${saleId}-${detail.product_id}-${Date.now()}-${index}`,
      productId: detail.product_id,
      name: detail.product_name || 'Producto existente',
      quantity: detail.quantity,
      price: detail.unit_price || detail.price || 0,
      discount: detail.discount_amount || 0,
      isFromPendingSale: true, // Marcar como producto existente de venta pendiente
    }))

    // Prevenir duplicados: verificar qué productos ya existen en el carrito
    setItems(prev => {
      const existingProductIds = new Set(prev.map(item => item.productId))
      const newItems = loadedItems.filter(
        item => !existingProductIds.has(item.productId)
      )

      if (newItems.length === 0) {
        alert('Todos los productos de esta venta ya están en el carrito')
        return prev
      }

      if (newItems.length < loadedItems.length) {
        const skipped = loadedItems.length - newItems.length
        alert(
          `Se cargaron ${newItems.length} producto(s). ${skipped} producto(s) ya estaban en el carrito.`
        )
      }

      return [...prev, ...newItems]
    })

    setShowActiveSaleModal(false)
    // Guardar el ID de la venta activa para actualizarla en lugar de crear una nueva
    setCurrentSaleId(saleId)
  }

  const handleOpenModal = () => {
    setEditingItemId(null)
    setSelectedModalProduct(null)
    setProductSearchTerm('')
    setModalQuantity(1)
    setModalDiscount(0)
    setModalDiscountType('amount')
    setModalDiscountReason('')
    setIsModalOpen(true)
    setShowProductDropdown(false)
    setModalSearchResults([])
  }

  const handleConfirmAdd = () => {
    if (!modalProduct) {
      setIsModalOpen(false)
      return
    }

    // Validar razón de descuento si hay descuento
    if (modalDiscountValue > 0 && !modalDiscountReason.trim()) {
      alert('Debes ingresar una razón para el descuento')
      return
    }

    const newItem = {
      id:
        editingItemId ||
        `${modalDisplay.id}-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      productId: modalDisplay.id,
      name: modalDisplay.name,
      quantity: parsedModalQuantity,
      price: modalDisplay.price,
      discount: modalDiscountValue, // Total discount amount for the line
      discountType: modalDiscountType,
      discountInput: parsedModalDiscount, // Unitary value entered
      discountReason: modalDiscountReason,
    }

    setItems(prev => {
      if (editingItemId) {
        // Modo edición: actualizar el item existente
        return prev.map(item => (item.id === editingItemId ? newItem : item))
      } else {
        // Modo agregar: verificar que el producto no exista ya
        const existingItem = prev.find(
          item => item.productId === modalDisplay.id && !item.isReservation
        )

        if (existingItem) {
          // Producto normal duplicado: preguntar si quiere sumar cantidad
          const shouldMerge = window.confirm(
            `El producto "${modalDisplay.name}" ya está en el carrito.\n\n` +
            `Cantidad actual: ${existingItem.quantity}\n` +
            `Nueva cantidad: ${parsedModalQuantity}\n\n` +
            `¿Deseas sumar las cantidades?`
          )

          if (shouldMerge) {
            // Sumar la cantidad al item existente
            return prev.map(item => {
              if (item.id === existingItem.id) {
                return {
                  ...item,
                  quantity: item.quantity + parsedModalQuantity,
                  // Mantener el descuento y precio del item existente
                }
              }
              return item
            })
          } else {
            // Usuario canceló, no hacer nada
            return prev
          }
        }

        return [...prev, newItem]
      }
    })

    setModalQuantity(1)
    setModalDiscount(0)
    setModalDiscountType('amount')
    setModalDiscountReason('')
    setEditingItemId(null)
    setIsModalOpen(false)
  }

  const resetSaleForm = () => {
    setItems([])
    setGeneralDiscount(0)
    if (clients.length > 0) {
      setSelectedClient(clients[0])
    }
    setPaymentMethodId(1)
    setCurrencyId(1)
    setCurrentSaleId(null) // Limpiar venta pendiente seleccionada
  }

  const handleSaveSale = async () => {
    // Validaciones según SALE_API.md
    if (!selectedClient) {
      alert('Por favor selecciona un cliente')
      return
    }

    if (items.length === 0) {
      alert('Por favor agrega al menos un producto al carrito')
      return
    }

    try {
      // Si hay una venta pendiente seleccionada, actualizar en lugar de crear
      if (currentSaleId) {
        // Filtrar solo los productos NUEVOS (los que no vienen de la venta pendiente)
        const newItems = items.filter(item => !item.isFromPendingSale)

        if (newItems.length === 0) {
          alert('No hay productos nuevos para agregar a la venta')
          return
        }

        // Construir payload para agregar productos según ADD_PRODUCT_TO_SALE.md
        const addProductsPayload = {
          allow_price_modifications: newItems.some(item => item.discount > 0),
          product_details: newItems.map(item => {
            const detail = {
              product_id: item.productId,
              quantity: item.quantity,
            }

            // Agregar descuentos si existen
            if (item.discount > 0) {
              if (item.discountType === 'percent') {
                detail.discount_percent = Number(item.discountInput)
              } else {
                detail.discount_amount = Number(item.discountInput)
              }
              detail.discount_reason =
                item.discountReason || 'Descuento aplicado en venta'
            }

            return detail
          }),
        }

        const response = await saleService.addProductsToSale(
          currentSaleId,
          addProductsPayload
        )

        if (response && response.success) {
          alert(
            `Venta actualizada exitosamente. ${response.items_added || newItems.length} producto(s) agregado(s).`
          )

          // Limpiar carrito y estado de venta pendiente
          setItems([])
          setGeneralDiscount(0)
          setCurrentSaleId(null)
        } else {
          alert('Error: No se pudo actualizar la venta')
        }
      } else {
        // Crear nueva venta
        const saleData = {
          client_id: selectedClient.id,
          allow_price_modifications: items.some(item => item.discount > 0),
          product_details: items.map(item => {
            const detail = {
              product_id: item.productId,
              quantity: item.quantity,
            }

            // Agregar descuentos si existen
            if (item.discount > 0) {
              if (item.discountType === 'percent') {
                detail.discount_percent = Number(item.discountInput)
              } else {
                detail.discount_amount = Number(item.discountInput)
              }
              detail.discount_reason =
                item.discountReason || 'Descuento aplicado en venta'
            }

            return detail
          }),
          payment_method_id: paymentMethodId,
          currency_id: currencyId,
        }

        const response = await createSale(saleData)

        if (response && response.sale_id) {
          alert(`Venta creada exitosamente: ${response.sale_id}`)

          // Limpiar carrito
          setItems([])
          setGeneralDiscount(0)
        } else {
          alert('Error: No se recibió ID de venta')
        }
      }
    } catch (error) {
      console.error('Error al guardar venta:', error)
      alert(
        `Error al guardar la venta: ${error.message || 'Error desconocido'}`
      )
    }
  }

  const handleSelectProduct = product => {
    const display = getProductDisplay(product)
    setSelectedModalProduct(product)
    setProductSearchTerm(display.name)
    setShowProductDropdown(false)
  }

  return (
    <div className='sales-new'>
      <div className='tabs sales-new__tabs' aria-label='Gestión de ventas'>
        <div className='tabs__list' role='tablist'>
          <button
            type='button'
            className={`tabs__tab ${
              activeTab === 'new-sale' ? 'tabs__tab--active' : ''
            }`}
            onClick={() => setActiveTab('new-sale')}
            id='sales-new-tab'
            role='tab'
            aria-selected={activeTab === 'new-sale'}
            aria-controls='sales-new-panel'
          >
            Nueva Venta
          </button>
          <button
            type='button'
            className={`tabs__tab ${
              activeTab === 'history' ? 'tabs__tab--active' : ''
            }`}
            onClick={() => setActiveTab('history')}
            id='sales-history-tab'
            role='tab'
            aria-selected={activeTab === 'history'}
            aria-controls='sales-history-panel'
          >
            Historial de Ventas
          </button>
        </div>
      </div>

      {activeTab === 'new-sale' && (
        <section
          id='sales-new-panel'
          role='tabpanel'
          aria-label='Gestión de nueva venta'
          aria-labelledby='sales-new-tab'
          className='sales-new__section'
        >
          <div className='sales-new__grid'>
            <div className='sales-new__main'>
              <article className='card card--elevated'>
                <div className='card__header'>
                  <h3 className='card__title'>
                    <span className='card__title-icon'>
                      <ShoppingCart size={18} />
                    </span>
                    <span className='card__title-text'>
                      Productos Seleccionados
                    </span>
                  </h3>
                </div>
                <div className='card__content'>
                  <div className='sales-new__search-row'>
                    <div className='search-box'>
                      <Search className='search-box__icon' aria-hidden='true' />
                      <input
                        type='search'
                        className='input search-box__input'
                        placeholder='Buscar productos para agregar...'
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                      />
                    </div>
                    <button
                      type='button'
                      className='btn btn--primary'
                      onClick={handleOpenModal}
                    >
                      <Plus size={16} aria-hidden='true' />
                      Agregar Producto
                    </button>
                  </div>

                  <div className='table-container'>
                    <table
                      className='table'
                      aria-label='Productos seleccionados'
                    >
                      <thead>
                        <tr>
                          <th scope='col'>ID</th>
                          <th scope='col'>Producto</th>
                          <th scope='col' className='text-right'>
                            Cantidad
                          </th>
                          <th scope='col' className='text-right'>
                            Precio Unitario
                          </th>
                          <th scope='col' className='text-right'>
                            Descuento
                          </th>
                          <th scope='col' className='text-right'>
                            Total
                          </th>
                          <th scope='col' className='text-right'>
                            ACCIONES
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className='text-center text-muted'>
                              No se encontraron productos que coincidan con la
                              búsqueda.
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map(item => {
                            const lineTotal =
                              item.price * item.quantity - (item.discount || 0)
                            return (
                              <tr key={item.id}>
                                <td>{item.productId || item.id || '-'}</td>
                                <td>
                                  {item.isReservation && (
                                    <span
                                      className='badge badge--pill badge--small badge--info'
                                      style={{
                                        marginRight: '8px',
                                        fontSize: '0.75rem',
                                        verticalAlign: 'middle',
                                      }}
                                      title='Este item corresponde a una reserva confirmada'
                                    >
                                      Reserva
                                    </span>
                                  )}
                                  {item.name}
                                </td>
                                <td className='text-right'>{item.quantity}</td>
                                <td className='text-right'>
                                  {formatCurrency(item.price, 'PYG')}
                                </td>
                                <td className='text-right'>
                                  {formatCurrency(item.discount || 0, 'PYG')}
                                </td>
                                <td className='text-right'>
                                  {formatCurrency(lineTotal, 'PYG')}
                                </td>
                                <td className='text-right'>
                                  <div
                                    style={{
                                      position: 'relative',
                                      display: 'inline-block',
                                    }}
                                  >
                                    <button
                                      type='button'
                                      className='btn btn--ghost btn--icon-only btn--small'
                                      onClick={() => toggleActionMenu(item.id)}
                                      aria-label={`Acciones para ${item.name}`}
                                    >
                                      <MoreVertical
                                        size={16}
                                        aria-hidden='true'
                                      />
                                    </button>
                                    {openActionMenuId === item.id && (
                                      <div
                                        role='menu'
                                        aria-orientation='vertical'
                                        data-side='bottom'
                                        data-align='end'
                                        data-state='open'
                                        className='dropdown-menu__content'
                                        style={{
                                          position: 'absolute',
                                          right: 0,
                                          top: 'calc(100% + 6px)',
                                          ...dropdownMenuStyle,
                                          minWidth: '160px',
                                        }}
                                      >
                                        <button
                                          type='button'
                                          role='menuitem'
                                          className='dropdown-menu__item'
                                          style={dropdownMenuItemStyle}
                                          onClick={() => handleEditItem(item)}
                                        >
                                          Editar
                                        </button>
                                        <button
                                          type='button'
                                          role='menuitem'
                                          className='dropdown-menu__item dropdown-menu__item--danger'
                                          style={{
                                            ...dropdownMenuItemStyle,
                                            ...dropdownMenuDangerStyle,
                                          }}
                                          onClick={() => {
                                            handleRemoveItem(item.id)
                                            setOpenActionMenuId(null)
                                          }}
                                        >
                                          Eliminar
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
                </div>
              </article>

              <article className='card card--elevated'>
                <div className='card__header'>
                  <h3 className='card__title'>
                    <span className='card__title-icon'>
                      <DollarSign size={18} />
                    </span>
                    <span className='card__title-text'>
                      Resumen de la Venta
                    </span>
                  </h3>
                </div>
                <div className='card__content'>
                  <div className='sales-new__summary'>
                    <div className='sales-new__summary-column'>
                      <div className='sales-new__summary-row'>
                        <span className='text-muted'>Subtotal</span>
                        <span>{formatCurrency(subtotal, 'PYG')}</span>
                      </div>
                      <div className='sales-new__summary-row'>
                        <span className='text-muted'>Impuestos (IVA 16%)</span>
                        <span>{formatCurrency(taxes, 'PYG')}</span>
                      </div>
                      <div className='sales-new__summary-row'>
                        <span className='text-muted'>Descuentos</span>
                        <span>
                          {formatCurrency(
                            lineDiscounts + generalDiscount,
                            'PYG'
                          )}
                        </span>
                      </div>
                      <hr className='card__divider' />
                      <div className='sales-new__summary-row sales-new__summary-total'>
                        <span>Total</span>
                        <span>{formatCurrency(total, 'PYG')}</span>
                      </div>
                    </div>
                    <div className='sales-new__summary-actions'>
                      <button
                        type='button'
                        className='btn btn--ghost'
                        onClick={() => setGeneralDiscount(value => value + 10)}
                      >
                        Aplicar Descuento General
                      </button>
                      <div className='sales-new__summary-buttons'>
                        <button
                          type='button'
                          className='btn btn--secondary'
                          onClick={resetSaleForm}
                        >
                          Cancelar
                        </button>
                        <button
                          type='button'
                          className='btn btn--primary'
                          onClick={handleSaveSale}
                          disabled={saleLoading || items.length === 0}
                        >
                          {saleLoading ? 'Guardando...' : 'Guardar Venta'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <aside
              className='sales-new__sidebar'
              aria-label='Detalles de la venta'
            >
              <article className='card card--elevated'>
                <div className='card__header'>
                  <h3 className='card__title'>
                    <span className='card__title-icon'>
                      <User size={18} />
                    </span>
                    <span className='card__title-text'>
                      Información del Cliente
                    </span>
                  </h3>
                </div>
                <div className='card__content'>
                  <label className='form-field__label' htmlFor='client-search'>
                    Buscar Cliente
                  </label>
                  <div
                    style={{ position: 'relative' }}
                    ref={clientSearchContainerRef}
                  >
                    <div className='search-box'>
                      <Search className='search-box__icon' aria-hidden='true' />
                      <input
                        id='client-search'
                        type='search'
                        className='input search-box__input'
                        placeholder='Escribe al menos 3 caracteres...'
                        value={clientSearchTerm}
                        onChange={event => {
                          setClientSearchTerm(event.target.value)
                          if (
                            selectedClient &&
                            event.target.value !== selectedClient.name
                          ) {
                            setSelectedClient(null)
                          }
                        }}
                        onFocus={() => {
                          if (
                            clientSearchTerm.length >= 3 &&
                            clients.length > 0
                          ) {
                            setShowClientDropdown(true)
                          }
                        }}
                        disabled={clientsLoading}
                      />
                    </div>

                    {showClientDropdown && clients.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: 'white',
                          border: '1px solid var(--color-border-default)',
                          borderRadius: '6px',
                          boxShadow:
                            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          maxHeight: '240px',
                          overflowY: 'auto',
                          zIndex: 1000,
                        }}
                      >
                        {clients.map((client, index) => (
                          <button
                            key={`${client.id}-${index}`}
                            type='button'
                            onClick={() => handleSelectClient(client)}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s',
                              borderBottom:
                                '1px solid var(--color-border-subtle)',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor =
                                'var(--color-bg-secondary)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor =
                                'transparent'
                            }}
                          >
                            <div
                              style={{ fontWeight: '500', marginBottom: '2px' }}
                            >
                              {client.name}
                            </div>
                            {client.document_id && (
                              <div
                                style={{
                                  fontSize: '0.875rem',
                                  color: 'var(--color-text-muted)',
                                }}
                              >
                                Doc: {formatDocumentId(client.document_id)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {clientSearchTerm.length > 0 &&
                      clientSearchTerm.length < 3 && (
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-text-muted)',
                            marginTop: '4px',
                          }}
                        >
                          Escribe al menos 3 caracteres para buscar
                        </p>
                      )}

                    {clientsLoading && clientSearchTerm.length >= 3 && (
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-text-muted)',
                          marginTop: '4px',
                        }}
                      >
                        Buscando...
                      </p>
                    )}

                    {!clientsLoading &&
                      clientSearchTerm.length >= 3 &&
                      clients.length === 0 && (
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-text-muted)',
                            marginTop: '4px',
                          }}
                        >
                          No se encontraron clientes
                        </p>
                      )}
                  </div>

                  {selectedClient && (
                    <div className='client-info' aria-live='polite'>
                      <p>
                        <strong>Nombre:</strong> {selectedClient.name}
                      </p>
                      {selectedClient.document_id && (
                        <p>
                          <strong>Documento:</strong>{' '}
                          {formatDocumentId(selectedClient.document_id)}
                        </p>
                      )}
                      {selectedClient.contact?.email && (
                        <p>
                          <strong>Email:</strong> {selectedClient.contact.email}
                        </p>
                      )}
                      {selectedClient.contact?.phone && (
                        <p>
                          <strong>Teléfono:</strong>{' '}
                          {selectedClient.contact.phone}
                        </p>
                      )}
                      <button
                        type='button'
                        className='btn btn--secondary btn--small'
                        onClick={handleSearchReservations}
                        style={{ marginTop: '12px', width: '100%' }}
                      >
                        Buscar Reservas Confirmadas
                      </button>
                    </div>
                  )}

                  <button
                    type='button'
                    className='btn btn--ghost btn--block'
                    onClick={() => navigate('/clientes')}
                  >
                    Crear nuevo cliente
                  </button>
                </div>
              </article>

              <article className='card card--elevated'>
                <div className='card__header'>
                  <h3 className='card__title'>
                    <span className='card__title-icon'>
                      <CreditCard size={18} />
                    </span>
                    <span className='card__title-text'>Opciones de Pago</span>
                  </h3>
                </div>
                <div className='card__content'>
                  <label className='form-field__label' htmlFor='payment-method'>
                    Método de Pago
                  </label>
                  <select
                    id='payment-method'
                    className='input'
                    value={paymentMethodId}
                    onChange={event =>
                      setPaymentMethodId(Number(event.target.value))
                    }
                    disabled={paymentMethodsLoading}
                  >
                    {paymentMethodsLoading ? (
                      <option value=''>Cargando métodos de pago...</option>
                    ) : paymentMethods.length === 0 ? (
                      <option value=''>No hay métodos disponibles</option>
                    ) : (
                      paymentMethods.map((method, index) => (
                        <option key={`${method.id}-${index}`} value={method.id}>
                          {method.method_code} - {method.description}
                        </option>
                      ))
                    )}
                  </select>

                  <label
                    className='form-field__label'
                    htmlFor='currency'
                    style={{ marginTop: '12px' }}
                  >
                    Moneda
                  </label>
                  <select
                    id='currency'
                    className='input'
                    value={currencyId}
                    onChange={event =>
                      setCurrencyId(Number(event.target.value))
                    }
                    disabled={currenciesLoading}
                  >
                    {currenciesLoading ? (
                      <option value=''>Cargando monedas...</option>
                    ) : currencies.length === 0 ? (
                      <option value=''>No hay monedas disponibles</option>
                    ) : (
                      currencies.map((currency, index) => (
                        <option
                          key={`${currency.id}-${index}`}
                          value={currency.id}
                        >
                          {currency.currency_code} -{' '}
                          {currency.currency_name || currency.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </article>
            </aside>
          </div>
        </section>
      )}

      {activeTab === 'history' && (
        <section
          id='sales-history-panel'
          role='tabpanel'
          aria-label='Historial de ventas'
          aria-labelledby='sales-history-tab'
          className='sales-history'
        >
          <article className='card card--elevated'>
            <div className='card__content'>
              <div
                className='sales-history__filters'
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      flex: '1 1 260px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <label
                      className='form-field__label'
                      htmlFor='history-search'
                    >
                      Buscar por cliente o ID
                    </label>
                    <div className='search-box'>
                      <Search className='search-box__icon' aria-hidden='true' />
                      <input
                        id='history-search'
                        type='search'
                        className='input search-box__input'
                        placeholder='Ej: Juan, Pérez o #1234'
                        value={historySearch}
                        onChange={event => setHistorySearch(event.target.value)}
                        aria-describedby='history-filter-hint'
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      flex: '0 1 260px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <span className='form-field__label'>Filtrar por</span>
                    <div
                      style={{
                        display: 'inline-flex',
                        padding: '4px',
                        borderRadius: '12px',
                        background: '#eef2ff',
                        border: '1px solid #dfe3f3',
                        gap: '6px',
                      }}
                      role='radiogroup'
                      aria-label='Filtrar por'
                    >
                      {[
                        { value: 'name', label: 'Nombre de cliente' },
                        { value: 'date', label: 'Rango de fechas' },
                      ].map(option => {
                        const active = historyFilterMode === option.value
                        return (
                          <button
                            key={option.value}
                            type='button'
                            onClick={() => setHistoryFilterMode(option.value)}
                            className='btn btn--ghost btn--small'
                            aria-pressed={active}
                            style={{
                              borderRadius: '10px',
                              background: active ? '#fff' : 'transparent',
                              border: active
                                ? '1px solid #4f46e5'
                                : '1px solid transparent',
                              color: active ? '#111827' : '#374151',
                              boxShadow: active
                                ? '0 1px 4px rgba(79, 70, 229, 0.15)'
                                : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <small
                        id='history-filter-hint'
                        style={{ color: '#4b5563', lineHeight: 1.4 }}
                      >
                        {historyFilterHint}
                      </small>
                      {historyFilterError && (
                        <small
                          style={{ color: '#b42318', lineHeight: 1.4 }}
                          role='alert'
                        >
                          {historyFilterError}
                        </small>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      flex: '0 1 340px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      alignItems: 'end',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <label
                        className='form-field__label'
                        htmlFor='history-date-from'
                      >
                        Desde
                      </label>
                      <input
                        id='history-date-from'
                        type='date'
                        className='input'
                        value={dateFrom}
                        onChange={event => setDateFrom(event.target.value)}
                        aria-label='Fecha desde'
                        disabled={historyFilterMode !== 'date'}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <label
                        className='form-field__label'
                        htmlFor='history-date-to'
                      >
                        Hasta
                      </label>
                      <input
                        id='history-date-to'
                        type='date'
                        className='input'
                        value={dateTo}
                        onChange={event => setDateTo(event.target.value)}
                        aria-label='Fecha hasta'
                        disabled={historyFilterMode !== 'date'}
                      />
                    </div>
                    <div
                      style={{
                        gridColumn: '1 / span 2',
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        type='button'
                        className='btn btn--ghost btn--small'
                        disabled={historyFilterMode !== 'date'}
                        onClick={() => applyDatePreset('today')}
                      >
                        Hoy
                      </button>
                      <button
                        type='button'
                        className='btn btn--ghost btn--small'
                        disabled={historyFilterMode !== 'date'}
                        onClick={() => applyDatePreset('last7')}
                      >
                        Últimos 7 días
                      </button>
                      <button
                        type='button'
                        className='btn btn--ghost btn--small'
                        disabled={historyFilterMode !== 'date'}
                        onClick={() => applyDatePreset('month')}
                      >
                        Mes actual
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      flex: '0 0 auto',
                      display: 'flex',
                      flexDirection: 'row',
                      gap: '8px',
                      alignItems: 'stretch',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type='button'
                      className='btn btn--primary'
                      onClick={handleHistoryFilter}
                      style={{ minWidth: '140px' }}
                    >
                      <Filter size={16} aria-hidden='true' />
                      Filtrar
                    </button>
                    <button
                      type='button'
                      className='btn btn--ghost'
                      onClick={handleHistoryClear}
                      style={{ minWidth: '140px' }}
                    >
                      <X size={16} aria-hidden='true' />
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>

              {(historyFilterMode === 'name' && historySearch.trim()) ||
              (historyFilterMode === 'date' && dateFrom && dateTo) ? (
                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                  aria-live='polite'
                >
                  {historyFilterMode === 'name' && historySearch.trim() && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        background: '#eef2ff',
                        color: '#3730a3',
                        borderRadius: '999px',
                        fontSize: '0.9rem',
                        border: '1px solid #c7d2fe',
                      }}
                    >
                      Filtro: nombre contiene “{historySearch.trim()}”
                    </span>
                  )}
                  {historyFilterMode === 'date' && dateFrom && dateTo && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        background: '#ecfdf3',
                        color: '#166534',
                        borderRadius: '999px',
                        fontSize: '0.9rem',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      Rango: {dateFrom} → {dateTo}
                    </span>
                  )}
                </div>
              ) : null}

              <div className='table-container'>
                <table className='table' aria-label='Historial de ventas'>
                  <thead>
                    <tr>
                      <th scope='col'>ID Venta</th>
                      <th scope='col'>Fecha</th>
                      <th scope='col'>Cliente</th>
                      <th scope='col' className='text-right'>
                        Total
                      </th>
                      <th scope='col' className='text-center'>
                        Estado
                      </th>
                      <th scope='col' className='text-right'>
                        ACCIONES
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleLoading ? (
                      <tr>
                        <td colSpan={6} className='text-center text-muted'>
                          Cargando ventas...
                        </td>
                      </tr>
                    ) : filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className='text-center text-muted'>
                          {historyFilterMode === 'name' && historySearch
                            ? 'No se encontraron ventas para el nombre ingresado'
                            : dateFrom && dateTo
                            ? 'No se encontraron ventas en el rango de fechas seleccionado'
                            : 'Usa Filtrar para consultar por nombre o fechas'}
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((entry, index) => {
                        const saleId = entry.sale_id || entry.id
                        const statusKey = (entry.status || '').toLowerCase()
                        const status =
                          STATUS_STYLES[statusKey] || STATUS_STYLES.pending
                        return (
                          <tr key={`${saleId}-${index}`}>
                            <td className='font-medium'>#{saleId}</td>
                            <td>
                              {entry.order_date
                                ? new Date(entry.order_date).toLocaleString(
                                    'es-ES',
                                    {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    }
                                  )
                                : '—'}
                            </td>
                            <td>{entry.client_name || '—'}</td>
                            <td className='text-right'>
                              {formatCurrency(
                                entry.total_amount || entry.total || 0,
                                'PYG'
                              )}
                            </td>
                            <td className='text-center'>
                              <span
                                className={`badge badge--pill badge--small ${status.badge}`}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className='text-right'>
                              <div
                                style={{
                                  position: 'relative',
                                  display: 'inline-block',
                                }}
                              >
                                <button
                                  type='button'
                                  className='btn btn--ghost btn--icon-only btn--small'
                                  onClick={() =>
                                    toggleHistoryActionMenu(saleId)
                                  }
                                  aria-label={`Acciones para la venta ${saleId}`}
                                >
                                  <MoreVertical size={16} aria-hidden='true' />
                                </button>
                                {historyActionMenuId === saleId && (
                                  <div
                                    role='menu'
                                    aria-orientation='vertical'
                                    data-side='bottom'
                                    data-align='end'
                                    data-state='open'
                                    className='dropdown-menu__content'
                                    style={{
                                      position: 'absolute',
                                      right: 0,
                                      top: 'calc(100% + 6px)',
                                      ...dropdownMenuStyle,
                                    }}
                                  >
                                    <button
                                      type='button'
                                      role='menuitem'
                                      className='dropdown-menu__item'
                                      style={dropdownMenuItemStyle}
                                      onClick={() => handleViewSale(entry)}
                                    >
                                      <Eye size={16} aria-hidden='true' /> Ver
                                    </button>
                                    <button
                                      type='button'
                                      role='menuitem'
                                      className='dropdown-menu__item dropdown-menu__item--danger'
                                      style={{
                                        ...dropdownMenuItemStyle,
                                        ...dropdownMenuDangerStyle,
                                      }}
                                      onClick={() => handleCancelSale(entry)}
                                    >
                                      <X size={16} aria-hidden='true' />{' '}
                                      Cancelar venta
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
            </div>
          </article>
        </section>
      )}

      {showSaleDetailModal && selectedHistorySale && (
        <div
          className='sales-modal'
          role='dialog'
          aria-modal='true'
          aria-labelledby='sale-detail-modal-title'
        >
          <div
            className='sales-modal__overlay'
            onClick={() => {
              setShowSaleDetailModal(false)
              setSelectedHistorySale(null)
            }}
            aria-hidden='true'
          />
          <div className='sales-modal__dialog'>
            <header className='sales-modal__header'>
              <div className='sales-modal__header-content'>
                <h3 id='sale-detail-modal-title' className='sales-modal__title'>
                  Venta #{selectedHistorySale.sale_id || selectedHistorySale.id}
                </h3>
                <p className='sales-modal__subtitle'>
                  Detalles completos de la venta seleccionada.
                </p>
              </div>
              <button
                type='button'
                className='sales-modal__close'
                onClick={() => {
                  setShowSaleDetailModal(false)
                  setSelectedHistorySale(null)
                }}
              >
                <X size={16} aria-hidden='true' />
                <span className='sr-only'>Cerrar</span>
              </button>
            </header>

            <div className='sales-modal__body'>
              <section className='sales-modal__section sales-modal__section--context'>
                <div className='sales-modal__info-grid'>
                  <div className='sales-modal__info-item'>
                    <span className='sales-modal__label'>Cliente</span>
                    <span className='sales-modal__value'>
                      {selectedHistorySale.client_name || '—'}
                    </span>
                  </div>
                  <div className='sales-modal__info-item'>
                    <span className='sales-modal__label'>Fecha</span>
                    <span className='sales-modal__value'>
                      {formatDateTime(
                        selectedHistorySale.order_date ||
                          selectedHistorySale.sale_date ||
                          selectedHistorySale.created_at
                      )}
                    </span>
                  </div>
                  <div className='sales-modal__info-item'>
                    <span className='sales-modal__label'>Estado</span>
                    <span className='sales-modal__value'>
                      {formatStatusLabel(selectedHistorySale.status)}
                    </span>
                  </div>
                  <div className='sales-modal__info-item'>
                    <span className='sales-modal__label'>Total</span>
                    <span className='sales-modal__value'>
                      {formatCurrency(
                        selectedHistorySale.total_amount ||
                          selectedHistorySale.total ||
                          0,
                        'PYG'
                      )}
                    </span>
                  </div>
                  <div className='sales-modal__info-item'>
                    <span className='sales-modal__label'>Método de pago</span>
                    <span className='sales-modal__value'>
                      {selectedHistorySale.payment_method || '—'}
                    </span>
                  </div>
                  <div className='sales-modal__info-item'>
                    <span className='sales-modal__label'>Atendido por</span>
                    <span className='sales-modal__value'>
                      {selectedHistorySale.user_name || '—'}
                    </span>
                  </div>
                </div>
              </section>

              <section className='sales-modal__section'>
                <h4 className='sales-modal__section-title'>Productos</h4>
                <div className='table-container'>
                  <table className='table' aria-label='Productos de la venta'>
                    <thead>
                      <tr>
                        <th scope='col'>Producto</th>
                        <th scope='col' className='text-right'>
                          Cantidad
                        </th>
                        <th scope='col' className='text-right'>
                          Precio
                        </th>
                        <th scope='col' className='text-right'>
                          Descuento
                        </th>
                        <th scope='col' className='text-right'>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSaleDetails.length === 0 ? (
                        <tr>
                          <td colSpan={5} className='text-center text-muted'>
                            No hay detalles de productos para esta venta.
                          </td>
                        </tr>
                      ) : (
                        selectedSaleDetails.map((detail, detailIndex) => {
                          const quantity = Number(detail.quantity) || 0
                          const unitPrice =
                            detail.unit_price ||
                            detail.sale_price ||
                            detail.price ||
                            detail.base_price ||
                            0
                          const discountAmount =
                            detail.discount_amount || detail.discount || 0
                          const lineTotal =
                            detail.total_with_tax ||
                            detail.subtotal ||
                            quantity * unitPrice - discountAmount

                          return (
                            <tr
                              key={`${
                                detail.id ||
                                detail.order_id ||
                                detail.product_id ||
                                'detail'
                              }-${detailIndex}`}
                            >
                              <td>
                                {detail.product_name ||
                                  detail.product_id ||
                                  'Producto'}
                              </td>
                              <td className='text-right'>{quantity}</td>
                              <td className='text-right'>
                                {formatCurrency(unitPrice, 'PYG')}
                              </td>
                              <td className='text-right'>
                                {formatCurrency(discountAmount, 'PYG')}
                              </td>
                              <td className='text-right'>
                                {formatCurrency(lineTotal, 'PYG')}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <footer className='sales-modal__footer'>
              <button
                type='button'
                className='btn btn--secondary'
                onClick={() => {
                  setShowSaleDetailModal(false)
                  setSelectedHistorySale(null)
                }}
              >
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}

      {showCancelSaleModal && selectedHistorySale && (
        <div
          className='sales-modal'
          role='dialog'
          aria-modal='true'
          aria-labelledby='cancel-sale-modal-title'
        >
          <div
            className='sales-modal__overlay'
            onClick={() => {
              if (cancelSubmitting) return
              setShowCancelSaleModal(false)
              setCancelPreview(null)
              setSelectedHistorySale(null)
            }}
            aria-hidden='true'
          />
          <div className='sales-modal__dialog'>
            <header className='sales-modal__header'>
              <div className='sales-modal__header-content'>
                <h3 id='cancel-sale-modal-title' className='sales-modal__title'>
                  Anular venta #
                  {selectedHistorySale.sale_id || selectedHistorySale.id}
                </h3>
                <p className='sales-modal__subtitle'>
                  Previsualiza el impacto antes de confirmar la anulación.
                </p>
              </div>
              <button
                type='button'
                className='sales-modal__close'
                onClick={() => {
                  if (cancelSubmitting) return
                  setShowCancelSaleModal(false)
                  setCancelPreview(null)
                  setSelectedHistorySale(null)
                }}
              >
                <X size={16} aria-hidden='true' />
                <span className='sr-only'>Cerrar</span>
              </button>
            </header>

            <div className='sales-modal__body'>
              {cancelPreviewLoading ? (
                <p className='text-muted'>Cargando previsualización...</p>
              ) : (
                <>
                  <section className='sales-modal__section sales-modal__section--context'>
                    <div className='sales-modal__info-grid'>
                      <div className='sales-modal__info-item'>
                        <span className='sales-modal__label'>Cliente</span>
                        <span className='sales-modal__value'>
                          {selectedHistorySale.client_name || '—'}
                        </span>
                      </div>
                      <div className='sales-modal__info-item'>
                        <span className='sales-modal__label'>Fecha</span>
                        <span className='sales-modal__value'>
                          {formatDateTime(
                            selectedHistorySale.order_date ||
                              selectedHistorySale.sale_date ||
                              selectedHistorySale.created_at
                          )}
                        </span>
                      </div>
                      <div className='sales-modal__info-item'>
                        <span className='sales-modal__label'>
                          Estado actual
                        </span>
                        <span className='sales-modal__value'>
                          {formatStatusLabel(selectedHistorySale.status)}
                        </span>
                      </div>
                      <div className='sales-modal__info-item'>
                        <span className='sales-modal__label'>Total</span>
                        <span className='sales-modal__value'>
                          {formatCurrency(
                            selectedHistorySale.total_amount ||
                              selectedHistorySale.total ||
                              0,
                            'PYG'
                          )}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className='sales-modal__section'>
                    <h4 className='sales-modal__section-title'>Impacto</h4>
                    <div className='sales-modal__info-grid'>
                      <div className='sales-modal__info-item'>
                        <span className='sales-modal__label'>
                          Reversiones de stock
                        </span>
                        <span className='sales-modal__value'>
                          {cancelPreview?.impact_summary
                            ?.stock_reversion_count ??
                            cancelPreview?.summary?.stock_movements ??
                            '—'}
                        </span>
                      </div>
                      <div className='sales-modal__info-item'>
                        <span className='sales-modal__label'>
                          Pagos a revertir
                        </span>
                        <span className='sales-modal__value'>
                          {cancelPreview?.impact_summary?.payment_reversals ??
                            cancelPreview?.summary?.payments_to_refund ??
                            '—'}
                        </span>
                      </div>
                      <div className='sales-modal__info-item'>
                        <span className='sales-modal__label'>
                          Monto a reembolsar
                        </span>
                        <span className='sales-modal__value'>
                          {formatCurrency(
                            cancelPreview?.impact_summary?.total_refund ||
                              cancelPreview?.summary?.total_refund ||
                              0,
                            'PYG'
                          )}
                        </span>
                      </div>
                      <div className='sales-modal__info-item'>
                        <span className='sales-modal__label'>
                          ¿Se puede anular?
                        </span>
                        <span className='sales-modal__value'>
                          {cancelPreview?.is_cancellable === false
                            ? 'No'
                            : 'Sí'}
                        </span>
                      </div>
                    </div>

                    {Array.isArray(cancelPreview?.warnings) &&
                      cancelPreview.warnings.length > 0 && (
                        <div
                          className='alert alert--warning'
                          style={{ marginTop: '12px' }}
                        >
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {cancelPreview.warnings.map((warning, idx) => (
                              <li key={`warning-${idx}`}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </section>

                  <section className='sales-modal__section'>
                    <label
                      className='sales-modal__field'
                      htmlFor='cancel-reason'
                    >
                      <span className='sales-modal__field-label'>
                        Motivo de la anulación
                      </span>
                      <textarea
                        id='cancel-reason'
                        className='input'
                        rows={3}
                        placeholder='Ej: El cliente canceló la compra.'
                        value={cancelReason}
                        onChange={event => setCancelReason(event.target.value)}
                        disabled={cancelSubmitting}
                        required
                      />
                    </label>
                  </section>
                </>
              )}
            </div>

            <footer className='sales-modal__footer'>
              <button
                type='button'
                className='btn btn--secondary'
                onClick={() => {
                  if (cancelSubmitting) return
                  setShowCancelSaleModal(false)
                  setCancelPreview(null)
                  setSelectedHistorySale(null)
                }}
              >
                Cerrar
              </button>
              <button
                type='button'
                className='btn btn--destructive'
                disabled={
                  cancelSubmitting || cancelPreview?.is_cancellable === false
                }
                onClick={handleConfirmCancelSale}
              >
                {cancelSubmitting ? 'Anulando...' : 'Confirmar anulación'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className='sales-modal'
          role='dialog'
          aria-modal='true'
          aria-labelledby='sales-modal-title'
        >
          <div
            className='sales-modal__overlay'
            onClick={() => {
              setIsModalOpen(false)
              setEditingItemId(null)
            }}
            aria-hidden='true'
          />
          <div className='sales-modal__dialog'>
            <header className='sales-modal__header'>
              <div className='sales-modal__header-content'>
                <h3 id='sales-modal-title' className='sales-modal__title'>
                  Agregar producto a la venta
                </h3>
                <p className='sales-modal__subtitle'>
                  Seleccione un artículo del catálogo, ajuste la cantidad y
                  configure un descuento antes de añadirlo a la orden.
                </p>
              </div>
              <button
                type='button'
                className='sales-modal__close'
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingItemId(null)
                }}
              >
                <X size={16} aria-hidden='true' />
                <span className='sr-only'>Cerrar</span>
              </button>
            </header>
            <div className='sales-modal__body'>
              <section className='sales-modal__section sales-modal__section--context'>
                <div className='sales-modal__info-grid'>
                  <div className='sales-modal__info-item'>
                    <span className='sales-modal__label'>
                      Producto seleccionado
                    </span>
                    <span className='sales-modal__value'>
                      {modalDisplay.name || 'Selecciona un producto'}
                    </span>
                  </div>
                  <div className='sales-modal__info-item'>
                    <span className='sales-modal__label'>ID</span>
                    <span className='sales-modal__value'>
                      {modalDisplay.id || '—'}
                    </span>
                  </div>
                </div>
              </section>

              <section className='sales-modal__section'>
                <div className='sales-modal__form-grid'>
                  <label className='sales-modal__field' htmlFor='modal-product'>
                    <span className='sales-modal__field-label'>Producto</span>
                    <div
                      style={{ position: 'relative' }}
                      ref={productSearchContainerRef}
                    >
                      <input
                        ref={modalProductInputRef}
                        id='modal-product'
                        type='text'
                        className='input'
                        value={productSearchTerm}
                        onChange={event => {
                          setProductSearchTerm(event.target.value)
                          setShowProductDropdown(true)
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        onKeyDown={e => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setShowProductDropdown(true)
                            setTimeout(() => {
                              const firstBtn =
                                productDropdownRef.current?.querySelector(
                                  'button'
                                )
                              if (firstBtn) firstBtn.focus()
                            }, 0)
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (
                              showProductDropdown &&
                              modalSearchResults.length > 0
                            ) {
                              handleSelectProduct(modalSearchResults[0])
                            }
                          }
                        }}
                        placeholder='Buscar por nombre, ID o código de barras...'
                        disabled={false}
                        autoComplete='off'
                      />
                      {showProductDropdown && (
                        <div
                          ref={productDropdownRef}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: 'white',
                            border: '1px solid var(--color-border-default)',
                            borderRadius: '6px',
                            boxShadow:
                              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            maxHeight: '240px',
                            overflowY: 'auto',
                            zIndex: 1000,
                          }}
                        >
                          {isSearchingProducts ? (
                            <div style={{ padding: '12px 16px' }}>
                              Buscando...
                            </div>
                          ) : modalSearchResults.length === 0 ? (
                            <div style={{ padding: '12px 16px' }}>
                              {productSearchTerm.length < 3
                                ? 'Escribe al menos 3 caracteres'
                                : 'No se encontraron productos'}
                            </div>
                          ) : (
                            modalSearchResults.map((product, index) => {
                              const display = getProductDisplay(product)
                              return (
                                <button
                                  key={`${display.id}-${index}`}
                                  type='button'
                                  className='product-dropdown-item'
                                  onClick={() => handleSelectProduct(product)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      handleSelectProduct(product)
                                    }
                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault()
                                      const next =
                                        e.currentTarget.nextElementSibling
                                      if (next) next.focus()
                                    }
                                    if (e.key === 'ArrowUp') {
                                      e.preventDefault()
                                      const prev =
                                        e.currentTarget.previousElementSibling
                                      if (prev) prev.focus()
                                      else {
                                        const input =
                                          productSearchContainerRef.current?.querySelector(
                                            'input'
                                          )
                                        if (input) input.focus()
                                      }
                                    }
                                    if (e.key === 'Escape') {
                                      setShowProductDropdown(false)
                                      const input =
                                        productSearchContainerRef.current?.querySelector(
                                          'input'
                                        )
                                      if (input) input.focus()
                                    }
                                  }}
                                >
                                  <div className='product-dropdown-item__info'>
                                    <div className='product-dropdown-item__name'>
                                      {display.name}
                                    </div>
                                    <div className='product-dropdown-item__meta'>
                                      ID: {display.id}
                                    </div>
                                  </div>
                                  <div className='product-dropdown-item__price-block'>
                                    <div className='product-dropdown-item__price'>
                                      {formatCurrency(display.price, 'PYG')}
                                    </div>
                                  </div>
                                </button>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                    <span className='sales-modal__field-note'>
                      Precio unitario actual:{' '}
                      {formatCurrency(modalUnitPrice, 'PYG')}
                    </span>
                  </label>

                  <label
                    className='sales-modal__field'
                    htmlFor='modal-quantity'
                  >
                    <span className='sales-modal__field-label'>Cantidad</span>
                    <input
                      id='modal-quantity'
                      type='number'
                      min='1'
                      step='1'
                      className='input'
                      value={modalQuantity}
                      onChange={event => setModalQuantity(event.target.value)}
                    />
                    <span className='sales-modal__field-note'>
                      Máximo disponible: sin límite definido
                    </span>
                  </label>

                  <label
                    className='sales-modal__field'
                    htmlFor='modal-discount-type'
                  >
                    <span className='sales-modal__field-label'>
                      Tipo de Descuento
                    </span>
                    <select
                      id='modal-discount-type'
                      className='input'
                      value={modalDiscountType}
                      onChange={e => setModalDiscountType(e.target.value)}
                    >
                      <option value='amount'>Monto Fijo (Unitario)</option>
                      <option value='percent'>Porcentaje (%)</option>
                    </select>
                  </label>

                  <label
                    className='sales-modal__field'
                    htmlFor='modal-discount'
                  >
                    <span className='sales-modal__field-label'>
                      Valor del Descuento
                    </span>
                    <div className='sales-modal__input-wrapper'>
                      <input
                        id='modal-discount'
                        type='number'
                        min='0'
                        step={modalDiscountType === 'percent' ? '1' : '0.01'}
                        className='input sales-modal__input'
                        value={modalDiscount}
                        onChange={event => setModalDiscount(event.target.value)}
                        placeholder={
                          modalDiscountType === 'percent' ? '0' : '0.00'
                        }
                      />
                      <span className='sales-modal__input-affix'>
                        {modalDiscountType === 'percent' ? '%' : 'PYG'}
                      </span>
                    </div>
                    <span className='sales-modal__field-note'>
                      {modalDiscountType === 'percent'
                        ? 'Porcentaje sobre precio unitario'
                        : 'Monto a descontar por unidad'}
                    </span>
                  </label>

                  {modalDiscountValue > 0 && (
                    <label
                      className='sales-modal__field'
                      htmlFor='modal-discount-reason'
                      style={{ gridColumn: '1 / -1' }}
                    >
                      <span className='sales-modal__field-label'>
                        Razón del Descuento (Requerido)
                      </span>
                      <input
                        id='modal-discount-reason'
                        type='text'
                        className='input'
                        value={modalDiscountReason}
                        onChange={e => setModalDiscountReason(e.target.value)}
                        placeholder='Ej: Promoción de verano, Cliente frecuente...'
                        required
                      />
                    </label>
                  )}
                </div>
              </section>

              <section className='sales-modal__section'>
                <div className='sales-modal__totals'>
                  <div className='sales-modal__totals-grid'>
                    <div className='sales-modal__info-item'>
                      <span className='sales-modal__label'>
                        Precio unitario
                      </span>
                      <span className='sales-modal__value'>
                        {formatCurrency(modalUnitPrice, 'PYG')}
                      </span>
                    </div>
                    <div className='sales-modal__info-item'>
                      <span className='sales-modal__label'>
                        Subtotal sin descuento
                      </span>
                      <span className='sales-modal__value'>
                        {formatCurrency(modalSubtotal, 'PYG')}
                      </span>
                    </div>
                    <div className='sales-modal__info-item'>
                      <span className='sales-modal__label'>
                        Descuento aplicado
                      </span>
                      <span className='sales-modal__value'>
                        {formatCurrency(modalDiscountValue, 'PYG')}
                      </span>
                    </div>
                    <div className='sales-modal__info-item'>
                      <span className='sales-modal__label'>Total de línea</span>
                      <span className='sales-modal__value sales-modal__value--highlight'>
                        {formatCurrency(modalLineTotal, 'PYG')}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <footer className='sales-modal__footer'>
              <button
                type='button'
                className='btn btn--secondary'
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingItemId(null)
                }}
              >
                Cancelar
              </button>
              <button
                type='button'
                className='btn btn--primary'
                onClick={handleConfirmAdd}
              >
                Confirmar
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Modal de Reservas Pendientes */}
      {showReservationModal && (
        <div
          className='sales-modal'
          role='dialog'
          aria-modal='true'
          aria-labelledby='reservation-modal-title'
        >
          <div
            className='sales-modal__overlay'
            onClick={() => setShowReservationModal(false)}
            aria-hidden='true'
          />
          <div className='sales-modal__dialog'>
            <header className='sales-modal__header'>
              <div className='sales-modal__header-content'>
                <h3 id='reservation-modal-title' className='sales-modal__title'>
                  Reservas Pendientes
                </h3>
                <p className='sales-modal__subtitle'>
                  El cliente tiene reservas confirmadas pendientes de pago.
                </p>
              </div>
              <button
                type='button'
                className='sales-modal__close'
                onClick={() => setShowReservationModal(false)}
              >
                <X size={16} aria-hidden='true' />
                <span className='sr-only'>Cerrar</span>
              </button>
            </header>
            <div className='sales-modal__body'>
              <div className='table-container'>
                <table className='table'>
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Fecha</th>
                      <th className='text-right'>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReservations.map((res, index) => (
                      <tr key={`${res.reserve_id || res.id}-${index}`}>
                        <td>
                          {res.product_name}
                          <span
                            style={{
                              display: 'block',
                              fontSize: '0.85em',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            Duración: {res.duration || res.duration_hours || 1}{' '}
                            hrs
                          </span>
                        </td>
                        <td>{new Date(res.start_time).toLocaleDateString()}</td>
                        <td className='text-right'>
                          {formatCurrency(res.total_amount, 'PYG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <footer className='sales-modal__footer'>
              <button
                type='button'
                className='btn btn--secondary'
                onClick={() => setShowReservationModal(false)}
              >
                Ignorar
              </button>
              <button
                type='button'
                className='btn btn--primary'
                onClick={handleAddReservations}
              >
                Agregar a la Venta
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Modal de Venta Activa */}
      {showActiveSaleModal && activeSale && (
        <div
          className='sales-modal'
          role='dialog'
          aria-modal='true'
          aria-labelledby='active-sale-modal-title'
        >
          <div
            className='sales-modal__overlay'
            onClick={() => setShowActiveSaleModal(false)}
            aria-hidden='true'
          />
          <div className='sales-modal__dialog'>
            <header className='sales-modal__header'>
              <div className='sales-modal__header-content'>
                <h3 id='active-sale-modal-title' className='sales-modal__title'>
                  Ventas Activas Encontradas
                </h3>
                <p className='sales-modal__subtitle'>
                  Selecciona una venta pendiente para continuar o inicia una
                  nueva.
                </p>
              </div>
              <button
                type='button'
                className='sales-modal__close'
                onClick={() => setShowActiveSaleModal(false)}
              >
                <X size={16} aria-hidden='true' />
                <span className='sr-only'>Cerrar</span>
              </button>
            </header>
            <div className='sales-modal__body'>
              <div
                className='sales-modal__list'
                style={{
                  display: 'grid',
                  gap: '12px',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                }}
              >
                {activeSales.map(sale => {
                  const saleId = sale.sale_id || sale.id
                  const selected =
                    saleId &&
                    (saleId === activeSale?.sale_id ||
                      saleId === activeSale?.id)

                  return (
                    <label
                      key={saleId}
                      className={`sales-modal__list-item card ${
                        selected ? 'sales-modal__list-item--active' : ''
                      }`}
                      style={{
                        border: selected
                          ? '2px solid #0e4775'
                          : '1px solid #d2d0ce',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: selected
                          ? '0 4px 8px rgba(0, 0, 0, 0.12)'
                          : '0 2px 4px rgba(0, 0, 0, 0.08)',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                        }}
                      >
                        <input
                          type='radio'
                          name='active-sale'
                          checked={selected}
                          onChange={() => setActiveSale(sale)}
                          aria-label={`Seleccionar venta ${saleId}`}
                        />
                        <div className='sales-modal__list-title'>
                          Venta #{saleId}
                        </div>
                        <span
                          className='badge badge--pill badge--small'
                          style={{
                            marginLeft: 'auto',
                            backgroundColor: '#f3f9ff',
                            color: '#0c3b5e',
                            border: '1px solid #0e4775',
                          }}
                        >
                          {formatStatusLabel(sale.status)}
                        </span>
                      </div>

                      <div className='sales-modal__list-subtitle'>
                        Cliente: {sale.client_name || 'Sin nombre'}
                      </div>

                      <div className='sales-modal__list-meta'>
                        Fecha:{' '}
                        {formatDateTime(sale.sale_date || sale.created_at)}
                      </div>
                      <div className='sales-modal__list-meta'>
                        Total: {formatCurrency(sale.total_amount || 0, 'PYG')}
                      </div>

                      {Array.isArray(sale.details) &&
                        sale.details.length > 0 && (
                          <div
                            className='sales-modal__list-meta'
                            style={{ marginTop: '8px', color: '#605e5c' }}
                          >
                            {sale.details.slice(0, 2).map(detail => (
                              <div key={`${saleId}-${detail.product_id}`}>
                                • {detail.product_name || detail.product_id} ×{' '}
                                {detail.quantity}
                              </div>
                            ))}
                            {sale.details.length > 2 && '…'}
                          </div>
                        )}
                    </label>
                  )
                })}
              </div>
            </div>
            <footer className='sales-modal__footer'>
              <button
                type='button'
                className='btn btn--secondary'
                onClick={() => setShowActiveSaleModal(false)}
              >
                Nueva Venta
              </button>
              <button
                type='button'
                className='btn btn--primary'
                onClick={handleContinueSale}
              >
                Continuar Venta
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesNew
