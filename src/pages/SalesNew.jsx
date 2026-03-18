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
import useDashboardStore from '@/store/useDashboardStore'
import { useToast } from '@/hooks/useToast'
import saleService from '@/services/saleService'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { CurrencyService } from '@/services/currencyService'
import { productService } from '@/services/productService'
import apiService from '@/services/api'
import useKeyboardShortcutsStore from '@/store/useKeyboardShortcutsStore'
import { getUnitLabel } from '@/constants/units'
import InstantPaymentDialog from '@/components/ui/InstantPaymentDialog'
import { salePaymentService } from '@/services/salePaymentService'
import ToastContainer from '@/components/ui/ToastContainer'

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
  if (!product) return { name: '', id: '', price: 0, sku: '', stock: 0 }

  const rawTaxRateCandidates = [
    product.tax_rate,
    product.tax_rate_value,
    product.tax_percentage,
    product.vat_rate,
    product.iva,
    product.tax?.rate,
    product.tax?.percentage,
    product.metadata?.tax_rate,
  ]

  const rawTaxRate = rawTaxRateCandidates.find(
    candidate => candidate !== undefined && candidate !== null,
  )

  let normalizedTaxRate = 0
  if (rawTaxRate !== undefined) {
    const parsedRate = Number(rawTaxRate)
    if (Number.isFinite(parsedRate) && parsedRate > 0) {
      normalizedTaxRate = parsedRate > 1 ? parsedRate / 100 : parsedRate
    }
  }

  return {
    name: product.name || product.product_name || '',
    id: product.id || product.product_id || '',
    price:
      product.sale_price ||
      product.price ||
      product.unit_prices?.[0]?.price_per_unit ||
      0,
    sku: product.sku || product.barcode || product.code || '',
    stock: product.stock_quantity || product.stock || product.quantity || 0,
    base_unit: product.base_unit || product.unit || 'unit',
    taxRate: normalizedTaxRate,
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

  const { fetchDashboardData } = useDashboardStore()

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
  const [highlightedIndex, setHighlightedIndex] = useState(-1) // Índice del item resaltado en dropdown

  // Client status state
  const [pendingReservations, setPendingReservations] = useState([])
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [activeSales, setActiveSales] = useState([])
  const [activeSale, setActiveSale] = useState(null)
  const [showActiveSaleModal, setShowActiveSaleModal] = useState(false)
  const [currentSaleId, setCurrentSaleId] = useState(null) // ID de venta pendiente siendo actualizada

  // Estados para cobro instantáneo post-creación
  const [showInstantCollection, setShowInstantCollection] = useState(false)
  const [createdSaleData, setCreatedSaleData] = useState(null)

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
        const methodsArray = Array.isArray(methods) ? methods : []
        setPaymentMethods(methodsArray)
        if (methodsArray.length > 0) {
          setPaymentMethodId(methodsArray[0].id)
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

  // Scroll automático al item resaltado cuando se navega con teclado
  useEffect(() => {
    if (highlightedIndex >= 0 && productDropdownRef.current) {
      const highlightedElement = productDropdownRef.current.querySelector(
        `#sales-product-option-${highlightedIndex}`,
      )
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [highlightedIndex])

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
        setHighlightedIndex(-1) // Reset al cerrar dropdown
      }
    }

    if (showClientDropdown || showProductDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showClientDropdown, showProductDropdown])

  // Obtener funciones del store de atajos de teclado
  const { matchesShortcut } = useKeyboardShortcutsStore()

  // Atajos de teclado para ventas
  useEffect(() => {
    const handleKeyDown = event => {
      // Ctrl+A para abrir modal de agregar producto (solo en tab new-sale)
      if (
        matchesShortcut('sales.addProduct', event) &&
        activeTab === 'new-sale'
      ) {
        event.preventDefault()
        handleOpenModal()
        return
      }

      // Ctrl+G para guardar/procesar venta (solo en tab new-sale con items)
      if (
        matchesShortcut('sales.processSale', event) &&
        activeTab === 'new-sale' &&
        items.length > 0
      ) {
        event.preventDefault()
        handleSaveSale()
        return
      }

      // Ctrl+Shift+H para ver historial de ventas
      if (matchesShortcut('sales.viewHistory', event)) {
        event.preventDefault()
        setActiveTab('history')
        return
      }

      // ESC para cerrar modal
      if (matchesShortcut('general.closeModal', event) && isModalOpen) {
        setIsModalOpen(false)
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, isModalOpen, matchesShortcut, items.length])

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [items],
  )

  const filteredItems = useMemo(
    () =>
      items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [items, searchTerm],
  )

  const lineDiscounts = useMemo(
    () => items.reduce((acc, item) => acc + (item.discount || 0), 0),
    [items],
  )

  const taxes = useMemo(() => {
    const itemsTax = items.reduce((acc, item) => {
      const explicitTaxAmount = Number(
        item.tax_amount ?? item.taxAmount ?? item.tax,
      )

      if (Number.isFinite(explicitTaxAmount) && explicitTaxAmount >= 0) {
        return acc + explicitTaxAmount
      }

      const rawTaxRate = Number(item.taxRate ?? item.tax_rate ?? 0)
      const normalizedTaxRate =
        Number.isFinite(rawTaxRate) && rawTaxRate > 0
          ? rawTaxRate > 1
            ? rawTaxRate / 100
            : rawTaxRate
          : 0

      if (normalizedTaxRate <= 0) {
        return acc
      }

      const lineBase = Math.max(
        0,
        Number(item.price || 0) * Number(item.quantity || 0) -
          Number(item.discount || 0),
      )

      return acc + lineBase * normalizedTaxRate
    }, 0)

    return Math.max(0, itemsTax)
  }, [items])

  const taxSummaryLabel = useMemo(() => {
    const rates = Array.from(
      new Set(
        items
          .map(item => Number(item.taxRate ?? item.tax_rate ?? 0))
          .filter(rate => Number.isFinite(rate) && rate > 0)
          .map(rate => (rate > 1 ? rate / 100 : rate))
          .map(rate => Number((rate * 100).toFixed(2))),
      ),
    )

    if (rates.length === 1) {
      return `Impuestos (IVA ${rates[0]}%)`
    }

    if (rates.length > 1) {
      return 'Impuestos (tasas mixtas)'
    }

    return 'Impuestos (según tasa de producto)'
  }, [items])

  const total = useMemo(
    () => Math.max(0, subtotal - lineDiscounts - generalDiscount + taxes),
    [subtotal, lineDiscounts, generalDiscount, taxes],
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
    [sales, historySearch],
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
    [modalUnitPrice, parsedModalQuantity],
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
    [modalSubtotal, modalDiscountValue],
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
              s => s.status === 'PENDING' || s.status === 'OPEN',
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
        'Selecciona fecha desde y hasta para filtrar por rango',
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
        prev ? { ...prev, status: 'cancelled' } : prev,
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
          .map(item => item.reserveKey || item.reserveId),
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
          `Se agregaron ${deduped.length} reserva(s). ${skippedReservations.length} reserva(s) duplicada(s) omitida(s).`,
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
        item => !existingProductIds.has(item.productId),
      )

      if (newItems.length === 0) {
        alert('Todos los productos de esta venta ya están en el carrito')
        return prev
      }

      if (newItems.length < loadedItems.length) {
        const skipped = loadedItems.length - newItems.length
        alert(
          `Se cargaron ${newItems.length} producto(s). ${skipped} producto(s) ya estaban en el carrito.`,
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
      taxRate: modalDisplay.taxRate || 0,
    }

    setItems(prev => {
      if (editingItemId) {
        // Modo edición: actualizar el item existente
        return prev.map(item => (item.id === editingItemId ? newItem : item))
      } else {
        // Modo agregar: verificar que el producto no exista ya
        const existingItem = prev.find(
          item => item.productId === modalDisplay.id && !item.isReservation,
        )

        if (existingItem) {
          // Producto normal duplicado: preguntar si quiere sumar cantidad
          const shouldMerge = window.confirm(
            `El producto "${modalDisplay.name}" ya está en el carrito.\n\n` +
              `Cantidad actual: ${existingItem.quantity}\n` +
              `Nueva cantidad: ${parsedModalQuantity}\n\n` +
              `¿Deseas sumar las cantidades?`,
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
          addProductsPayload,
        )

        if (response && response.success) {
          toast.success(
            `Venta actualizada exitosamente. ${
              response.items_added || newItems.length
            } producto(s) agregado(s).`,
          )

          // Sincronizar dashboard proactivamente
          fetchDashboardData()

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
          // Mostrar diálogo de cobro instantáneo
          setCreatedSaleData({
            id: response.sale_id,
            totalAmount: response.total_amount || total,
            currencyCode: 'PYG',
            paymentMethodId: paymentMethodId,
            paymentMethodLabel:
              paymentMethods.find(m => m.id === paymentMethodId)?.description ||
              '',
            clientName: selectedClient?.name || selectedClient?.full_name || '',
          })
          fetchDashboardData()
          setShowInstantCollection(true)
        } else {
          alert('Error: No se recibió ID de venta')
        }
      }
    } catch (error) {
      console.error('Error al guardar venta:', error)
      alert(
        `Error al guardar la venta: ${error.message || 'Error desconocido'}`,
      )
    }
  }

  const handleInstantCollectionConfirm = async paymentData => {
    try {
      await salePaymentService.processSalePaymentWithCashRegister({
        sales_order_id: createdSaleData.id,
        amount_received: paymentData.amount_received || paymentData.amount,
        payment_method_id: paymentData.paymentMethodId || createdSaleData.paymentMethodId,
        payment_notes: paymentData.payment_notes || paymentData.notes || null,
      })
      setShowInstantCollection(false)
      setCreatedSaleData(null)
      setItems([])
      setGeneralDiscount(0)
      toast.success('Cobro registrado exitosamente')
    } catch (error) {
      toast.errorFrom(error, {
        fallback: 'No se pudo registrar el cobro',
      })
    }
  }

  const handleLeaveSalePending = () => {
    setShowInstantCollection(false)
    setCreatedSaleData(null)
    setItems([])
    setGeneralDiscount(0)
    toast.success('Venta creada exitosamente')
  }

  const handleSelectProduct = product => {
    const display = getProductDisplay(product)
    setSelectedModalProduct(product)
    setProductSearchTerm(display.name)
    setShowProductDropdown(false)
  }

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-display'>
      {/* Header Section */}
      <header className='flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2'>
        <div className='flex items-center gap-4'>
          <div className='size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-fluent-8'>
            <ShoppingCart size={28} />
          </div>
          <div>
            <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase leading-none'>Punto de Venta</h1>
            <p className='text-text-secondary text-sm font-medium mt-1'>
              Facturación y registro de operaciones comerciales
            </p>
          </div>
        </div>

        <div className='flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit'>
          {[
            { id: 'new-sale', label: 'Nueva Venta', icon: <Plus size={16} /> },
            { id: 'history', label: 'Historial', icon: <History size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all',
                activeTab === tab.id
                  ? 'bg-white dark:bg-surface-dark text-primary shadow-fluent-2'
                  : 'text-text-secondary hover:text-text-main'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className='w-full'>
        {activeTab === 'new-sale' && (
        <section
          id='sales-new-panel'
          role='tabpanel'
          aria-label='Gestión de nueva venta'
          aria-labelledby='sales-new-tab'
        >
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6'>
            {/* Main Content - 8 columns */}
            <div className='lg:col-span-8 space-y-4'>
              {/* Products Card */}
              <article className='bg-[var(--fluent-surface-card,#FFFFFF)] rounded-[var(--fluent-corner-radius-large,8px)] shadow-[var(--fluent-shadow-4,0_2px_4px_rgba(0,0,0,0.14),0_0_2px_rgba(0,0,0,0.12))] overflow-hidden'>
                <header className='flex items-center justify-between px-4 py-3 border-b border-[var(--fluent-border-subtle,#F0F0F0)]'>
                  <div className='flex items-center gap-2'>
                    <ShoppingCart
                      size={18}
                      className='text-[var(--fluent-brand-primary,#0078D4)]'
                    />
                    <h3 className='text-base font-semibold text-[var(--fluent-text-primary,#242424)]'>
                      Productos Seleccionados
                    </h3>
                  </div>
                  <button
                    type='button'
                    onClick={handleOpenModal}
                    title='Ctrl+A'
                    className='inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[var(--fluent-brand-primary,#0078D4)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-brand-hover,#106EBE)] active:bg-[var(--fluent-brand-pressed,#005A9E)] transition-colors duration-[duration:var(--fluent-duration-fast,100ms)]'
                  >
                    <Plus size={16} aria-hidden='true' />
                    Agregar
                  </button>
                </header>
                <div className='p-4'>
                  <div className='overflow-x-auto'>
                    <table
                      className='w-full text-sm'
                      aria-label='Productos seleccionados'
                    >
                      <thead>
                        <tr className='border-b border-[var(--fluent-border-default,#E0E0E0)]'>
                          <th className='text-left py-2 px-3 font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide'>
                            ID
                          </th>
                          <th className='text-left py-2 px-3 font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide'>
                            Producto
                          </th>
                          <th className='text-right py-2 px-3 font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide'>
                            Cant.
                          </th>
                          <th className='text-right py-2 px-3 font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide'>
                            P. Unit.
                          </th>
                          <th className='text-right py-2 px-3 font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide'>
                            Desc.
                          </th>
                          <th className='text-right py-2 px-3 font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide'>
                            Total
                          </th>
                          <th className='text-right py-2 px-3 font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide w-16'></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className='text-center py-8 text-[var(--fluent-text-secondary,#616161)]'
                            >
                              No hay productos en el carrito. Haz clic en
                              "Agregar" para comenzar.
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map(item => {
                            const lineTotal =
                              item.price * item.quantity - (item.discount || 0)
                            return (
                              <tr
                                key={item.id}
                                className='border-b border-[var(--fluent-border-subtle,#F0F0F0)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] transition-colors'
                              >
                                <td className='py-2 px-3 text-[var(--fluent-text-secondary,#616161)]'>
                                  {item.productId || item.id || '-'}
                                </td>
                                <td className='py-2 px-3 text-[var(--fluent-text-primary,#242424)]'>
                                  {item.isReservation && (
                                    <span className='inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-[var(--fluent-brand-light,#DEECF9)] text-[var(--fluent-brand-primary,#0078D4)] rounded mr-2'>
                                      Reserva
                                    </span>
                                  )}
                                  {item.name}
                                </td>
                                <td className='py-2 px-3 text-right text-[var(--fluent-text-primary,#242424)]'>
                                  {item.quantity}
                                </td>
                                <td className='py-2 px-3 text-right text-[var(--fluent-text-primary,#242424)]'>
                                  {formatCurrency(item.price, 'PYG')}
                                </td>
                                <td className='py-2 px-3 text-right text-[var(--fluent-text-primary,#242424)]'>
                                  {formatCurrency(item.discount || 0, 'PYG')}
                                </td>
                                <td className='py-2 px-3 text-right font-medium text-[var(--fluent-text-primary,#242424)]'>
                                  {formatCurrency(lineTotal, 'PYG')}
                                </td>
                                <td className='py-2 px-3 text-right'>
                                  <div className='relative inline-block'>
                                    <button
                                      type='button'
                                      onClick={() => toggleActionMenu(item.id)}
                                      aria-label={`Acciones para ${item.name}`}
                                      className='p-1.5 rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-pressed,#E0E0E0)] transition-colors'
                                    >
                                      <MoreVertical
                                        size={16}
                                        className='text-[var(--fluent-text-secondary,#616161)]'
                                      />
                                    </button>
                                    {openActionMenuId === item.id && (
                                      <div className='absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-[var(--fluent-surface-card,#FFFFFF)] rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-16,0_8px_16px_rgba(0,0,0,0.14),0_0_2px_rgba(0,0,0,0.12))] border border-[var(--fluent-border-default,#E0E0E0)] py-1'>
                                        <button
                                          type='button'
                                          onClick={() => handleEditItem(item)}
                                          className='w-full px-3 py-2 text-left text-sm text-[var(--fluent-text-primary,#242424)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] transition-colors'
                                        >
                                          Editar
                                        </button>
                                        <button
                                          type='button'
                                          onClick={() => {
                                            handleRemoveItem(item.id)
                                            setOpenActionMenuId(null)
                                          }}
                                          className='w-full px-3 py-2 text-left text-sm text-[var(--fluent-status-danger,#D13438)] hover:bg-red-50 transition-colors'
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

              {/* Sale Summary Card */}
              <article className='bg-[var(--fluent-surface-card,#FFFFFF)] rounded-[var(--fluent-corner-radius-large,8px)] shadow-[var(--fluent-shadow-4,0_2px_4px_rgba(0,0,0,0.14),0_0_2px_rgba(0,0,0,0.12))] overflow-hidden'>
                <header className='flex items-center gap-2 px-4 py-3 border-b border-[var(--fluent-border-subtle,#F0F0F0)]'>
                  <DollarSign
                    size={18}
                    className='text-[var(--fluent-brand-primary,#0078D4)]'
                  />
                  <h3 className='text-base font-semibold text-[var(--fluent-text-primary,#242424)]'>
                    Resumen de la Venta
                  </h3>
                </header>
                <div className='p-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Totals Column */}
                    <div className='space-y-2'>
                      <div className='flex justify-between items-center py-1'>
                        <span className='text-sm text-[var(--fluent-text-secondary,#616161)]'>
                          Subtotal
                        </span>
                        <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                          {formatCurrency(subtotal, 'PYG')}
                        </span>
                      </div>
                      <div className='flex justify-between items-center py-1'>
                        <span className='text-sm text-[var(--fluent-text-secondary,#616161)]'>
                          {taxSummaryLabel}
                        </span>
                        <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                          {formatCurrency(taxes, 'PYG')}
                        </span>
                      </div>
                      <div className='flex justify-between items-center py-1'>
                        <span className='text-sm text-[var(--fluent-text-secondary,#616161)]'>
                          Descuentos
                        </span>
                        <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                          {formatCurrency(
                            lineDiscounts + generalDiscount,
                            'PYG',
                          )}
                        </span>
                      </div>
                      <div className='border-t border-[var(--fluent-border-default,#E0E0E0)] pt-2 mt-2'>
                        <div className='flex justify-between items-center'>
                          <span className='text-base font-semibold text-[var(--fluent-text-primary,#242424)]'>
                            Total
                          </span>
                          <span className='text-lg font-bold text-[var(--fluent-brand-primary,#0078D4)]'>
                            {formatCurrency(total, 'PYG')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className='flex flex-col justify-end gap-3'>
                      <button
                        type='button'
                        onClick={() => setGeneralDiscount(value => value + 10)}
                        className='w-full px-4 py-2 text-sm font-medium text-[var(--fluent-text-primary,#242424)] bg-transparent border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] transition-colors'
                      >
                        Aplicar Descuento General
                      </button>
                      <div className='flex gap-2'>
                        <button
                          type='button'
                          onClick={resetSaleForm}
                          className='flex-1 px-4 py-2 text-sm font-medium text-[var(--fluent-text-primary,#242424)] bg-[var(--fluent-surface-subtle,#F5F5F5)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#E8E8E8)] transition-colors'
                        >
                          Cancelar
                        </button>
                        <button
                          type='button'
                          onClick={handleSaveSale}
                          disabled={saleLoading || items.length === 0}
                          className='flex-1 px-4 py-2 text-sm font-medium text-white bg-[var(--fluent-brand-primary,#0078D4)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-brand-hover,#106EBE)] active:bg-[var(--fluent-brand-pressed,#005A9E)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        >
                          {saleLoading ? 'Guardando...' : 'Guardar Venta'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* Sidebar - 4 columns */}
            <aside
              className='lg:col-span-4 space-y-4'
              aria-label='Detalles de la venta'
            >
              {/* Client Info Card */}
              <article className='bg-[var(--fluent-surface-card,#FFFFFF)] rounded-[var(--fluent-corner-radius-large,8px)] shadow-[var(--fluent-shadow-4,0_2px_4px_rgba(0,0,0,0.14),0_0_2px_rgba(0,0,0,0.12))] overflow-hidden'>
                <header className='flex items-center gap-2 px-4 py-3 border-b border-[var(--fluent-border-subtle,#F0F0F0)]'>
                  <User
                    size={18}
                    className='text-[var(--fluent-brand-primary,#0078D4)]'
                  />
                  <h3 className='text-base font-semibold text-[var(--fluent-text-primary,#242424)]'>
                    Información del Cliente
                  </h3>
                </header>
                <div className='p-4 space-y-3'>
                  <div>
                    <label
                      className='block text-sm font-medium text-[var(--fluent-text-secondary,#616161)] mb-1.5'
                      htmlFor='client-search'
                    >
                      Buscar Cliente
                    </label>
                    <div className='relative' ref={clientSearchContainerRef}>
                      <div className='relative'>
                        <Search
                          size={16}
                          className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fluent-text-secondary,#616161)]'
                          aria-hidden='true'
                        />
                        <input
                          id='client-search'
                          type='search'
                          className='w-full pl-9 pr-3 py-2 text-sm border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] placeholder:text-[var(--fluent-text-secondary,#616161)] focus:outline-none focus:border-[var(--fluent-brand-primary,#0078D4)] focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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
                        <div className='absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--fluent-surface-card,#FFFFFF)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-16,0_8px_16px_rgba(0,0,0,0.14),0_0_2px_rgba(0,0,0,0.12))] max-h-60 overflow-y-auto'>
                          {clients.map((client, index) => (
                            <button
                              key={`${client.id}-${index}`}
                              type='button'
                              onClick={() => handleSelectClient(client)}
                              className='w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--fluent-surface-hover,#F5F5F5)] border-b border-[var(--fluent-border-subtle,#F0F0F0)] last:border-b-0 transition-colors'
                            >
                              <div className='font-medium text-[var(--fluent-text-primary,#242424)]'>
                                {client.name}
                              </div>
                              {client.document_id && (
                                <div className='text-xs text-[var(--fluent-text-secondary,#616161)] mt-0.5'>
                                  Doc: {formatDocumentId(client.document_id)}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {clientSearchTerm.length > 0 &&
                        clientSearchTerm.length < 3 && (
                          <p className='text-xs text-[var(--fluent-text-secondary,#616161)] mt-1'>
                            Escribe al menos 3 caracteres para buscar
                          </p>
                        )}

                      {clientsLoading && clientSearchTerm.length >= 3 && (
                        <p className='text-xs text-[var(--fluent-text-secondary,#616161)] mt-1'>
                          Buscando...
                        </p>
                      )}

                      {!clientsLoading &&
                        clientSearchTerm.length >= 3 &&
                        clients.length === 0 && (
                          <p className='text-xs text-[var(--fluent-text-secondary,#616161)] mt-1'>
                            No se encontraron clientes
                          </p>
                        )}
                    </div>
                  </div>

                  {selectedClient && (
                    <div
                      className='p-3 bg-[var(--fluent-surface-subtle,#F5F5F5)] rounded-[var(--fluent-corner-radius-medium,4px)] space-y-1.5'
                      aria-live='polite'
                    >
                      <p className='text-sm text-[var(--fluent-text-primary,#242424)]'>
                        <span className='font-medium'>Nombre:</span>{' '}
                        {selectedClient.name}
                      </p>
                      {selectedClient.document_id && (
                        <p className='text-sm text-[var(--fluent-text-primary,#242424)]'>
                          <span className='font-medium'>Documento:</span>{' '}
                          {formatDocumentId(selectedClient.document_id)}
                        </p>
                      )}
                      {selectedClient.contact?.email && (
                        <p className='text-sm text-[var(--fluent-text-primary,#242424)]'>
                          <span className='font-medium'>Email:</span>{' '}
                          {selectedClient.contact.email}
                        </p>
                      )}
                      {selectedClient.contact?.phone && (
                        <p className='text-sm text-[var(--fluent-text-primary,#242424)]'>
                          <span className='font-medium'>Teléfono:</span>{' '}
                          {selectedClient.contact.phone}
                        </p>
                      )}
                      <button
                        type='button'
                        onClick={handleSearchReservations}
                        className='w-full mt-2 px-3 py-1.5 text-sm font-medium text-[var(--fluent-text-primary,#242424)] bg-[var(--fluent-surface-card,#FFFFFF)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#E8E8E8)] transition-colors'
                      >
                        Buscar Reservas Confirmadas
                      </button>
                    </div>
                  )}

                  <button
                    type='button'
                    onClick={() => navigate('/clientes')}
                    className='w-full px-3 py-2 text-sm font-medium text-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-light,#DEECF9)] rounded-[var(--fluent-corner-radius-medium,4px)] transition-colors'
                  >
                    Crear nuevo cliente
                  </button>
                </div>
              </article>

              {/* Payment Options Card */}
              <article className='bg-[var(--fluent-surface-card,#FFFFFF)] rounded-[var(--fluent-corner-radius-large,8px)] shadow-[var(--fluent-shadow-4,0_2px_4px_rgba(0,0,0,0.14),0_0_2px_rgba(0,0,0,0.12))] overflow-hidden'>
                <header className='flex items-center gap-2 px-4 py-3 border-b border-[var(--fluent-border-subtle,#F0F0F0)]'>
                  <CreditCard
                    size={18}
                    className='text-[var(--fluent-brand-primary,#0078D4)]'
                  />
                  <h3 className='text-base font-semibold text-[var(--fluent-text-primary,#242424)]'>
                    Opciones de Pago
                  </h3>
                </header>
                <div className='p-4 space-y-4'>
                  <div>
                    <label
                      className='block text-sm font-medium text-[var(--fluent-text-secondary,#616161)] mb-1.5'
                      htmlFor='payment-method'
                    >
                      Método de Pago
                    </label>
                    <select
                      id='payment-method'
                      value={paymentMethodId}
                      onChange={event =>
                        setPaymentMethodId(Number(event.target.value))
                      }
                      disabled={paymentMethodsLoading}
                      className='w-full px-3 py-2 text-sm border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] focus:outline-none focus:border-[var(--fluent-brand-primary,#0078D4)] focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {paymentMethodsLoading ? (
                        <option value=''>Cargando métodos de pago...</option>
                      ) : paymentMethods.length === 0 ? (
                        <option value=''>No hay métodos disponibles</option>
                      ) : (
                        paymentMethods.map((method, index) => (
                          <option
                            key={`${method.id}-${index}`}
                            value={method.id}
                          >
                            {method.method_code} - {method.description}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      className='block text-sm font-medium text-[var(--fluent-text-secondary,#616161)] mb-1.5'
                      htmlFor='currency'
                    >
                      Moneda
                    </label>
                    <select
                      id='currency'
                      value={currencyId}
                      onChange={event =>
                        setCurrencyId(Number(event.target.value))
                      }
                      disabled={currenciesLoading}
                      className='w-full px-3 py-2 text-sm border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] focus:outline-none focus:border-[var(--fluent-brand-primary,#0078D4)] focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] disabled:opacity-50 disabled:cursor-not-allowed'
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
          className='space-y-4'
        >
          <article className='bg-[var(--fluent-surface-card,#FFFFFF)] rounded-[var(--fluent-corner-radius-large,8px)] shadow-[var(--fluent-shadow-4,0_2px_4px_rgba(0,0,0,0.04),0_0_2px_rgba(0,0,0,0.08))] border border-[var(--fluent-border-subtle,#F0F0F0)]'>
            <div className='p-4'>
              <div className='p-4 flex flex-col gap-3.5 bg-[var(--fluent-surface-subtle,#F5F5F5)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-large,8px)]'>
                <div className='flex gap-3 flex-wrap items-start'>
                  <div className='flex-[1_1_260px] flex flex-col gap-1.5'>
                    <label
                      className='text-xs font-medium text-[var(--fluent-text-secondary,#616161)]'
                      htmlFor='history-search'
                    >
                      Buscar por cliente o ID
                    </label>
                    <div className='relative'>
                      <Search
                        className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fluent-text-secondary,#616161)]'
                        aria-hidden='true'
                      />
                      <input
                        id='history-search'
                        type='search'
                        className='w-full pl-9 pr-3 py-2 text-sm border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] placeholder:text-[var(--fluent-text-secondary,#616161)] focus:outline-none focus:border-[var(--fluent-brand-primary,#0078D4)] focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)]'
                        placeholder='Ej: Juan, Pérez o #1234'
                        value={historySearch}
                        onChange={event => setHistorySearch(event.target.value)}
                        aria-describedby='history-filter-hint'
                      />
                    </div>
                  </div>

                  <div className='flex-[0_1_260px] flex flex-col gap-2'>
                    <span className='text-xs font-medium text-[var(--fluent-text-secondary,#616161)]'>
                      Filtrar por
                    </span>
                    <div
                      className='inline-flex p-1 rounded-[var(--fluent-corner-radius-large,8px)] bg-[var(--fluent-brand-primary,#0078D4)]/5 border border-[var(--fluent-brand-primary,#0078D4)]/20 gap-1'
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
                            aria-pressed={active}
                            className={`px-3 py-1.5 text-xs font-medium rounded-[var(--fluent-corner-radius-medium,4px)] transition-colors ${active ? 'bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] border border-[var(--fluent-brand-primary,#0078D4)] shadow-sm' : 'text-[var(--fluent-text-secondary,#616161)] border border-transparent hover:bg-white/60'}`}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                    <div className='flex flex-col gap-1'>
                      <small
                        id='history-filter-hint'
                        className='text-xs text-[var(--fluent-text-secondary,#616161)]'
                      >
                        {historyFilterHint}
                      </small>
                      {historyFilterError && (
                        <small
                          className='text-xs text-[var(--fluent-status-danger,#D13438)]'
                          role='alert'
                        >
                          {historyFilterError}
                        </small>
                      )}
                    </div>
                  </div>

                  <div className='flex-[0_1_340px] grid grid-cols-2 gap-2.5 items-end'>
                    <div className='flex flex-col gap-1.5'>
                      <label
                        className='text-xs font-medium text-[var(--fluent-text-secondary,#616161)]'
                        htmlFor='history-date-from'
                      >
                        Desde
                      </label>
                      <input
                        id='history-date-from'
                        type='date'
                        className='px-3 py-2 text-sm border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] focus:outline-none focus:border-[var(--fluent-brand-primary,#0078D4)] focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] disabled:opacity-50 disabled:cursor-not-allowed'
                        value={dateFrom}
                        onChange={event => setDateFrom(event.target.value)}
                        aria-label='Fecha desde'
                        disabled={historyFilterMode !== 'date'}
                      />
                    </div>
                    <div className='flex flex-col gap-1.5'>
                      <label
                        className='text-xs font-medium text-[var(--fluent-text-secondary,#616161)]'
                        htmlFor='history-date-to'
                      >
                        Hasta
                      </label>
                      <input
                        id='history-date-to'
                        type='date'
                        className='px-3 py-2 text-sm border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] focus:outline-none focus:border-[var(--fluent-brand-primary,#0078D4)] focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] disabled:opacity-50 disabled:cursor-not-allowed'
                        value={dateTo}
                        onChange={event => setDateTo(event.target.value)}
                        aria-label='Fecha hasta'
                        disabled={historyFilterMode !== 'date'}
                      />
                    </div>
                    <div className='col-span-2 flex gap-2 flex-wrap'>
                      <button
                        type='button'
                        className='px-2.5 py-1 text-xs font-medium text-[var(--fluent-text-secondary,#616161)] bg-[var(--fluent-surface-card,#FFFFFF)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        disabled={historyFilterMode !== 'date'}
                        onClick={() => applyDatePreset('today')}
                      >
                        Hoy
                      </button>
                      <button
                        type='button'
                        className='px-2.5 py-1 text-xs font-medium text-[var(--fluent-text-secondary,#616161)] bg-[var(--fluent-surface-card,#FFFFFF)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        disabled={historyFilterMode !== 'date'}
                        onClick={() => applyDatePreset('last7')}
                      >
                        Últimos 7 días
                      </button>
                      <button
                        type='button'
                        className='px-2.5 py-1 text-xs font-medium text-[var(--fluent-text-secondary,#616161)] bg-[var(--fluent-surface-card,#FFFFFF)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        disabled={historyFilterMode !== 'date'}
                        onClick={() => applyDatePreset('month')}
                      >
                        Mes actual
                      </button>
                    </div>
                  </div>
                </div>

                <div className='flex justify-end gap-2 flex-wrap'>
                  <button
                    type='button'
                    className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--fluent-brand-primary,#0078D4)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-brand-hover,#106EBE)] active:bg-[var(--fluent-brand-pressed,#005A9E)] transition-colors'
                    onClick={handleHistoryFilter}
                  >
                    <Filter size={16} aria-hidden='true' />
                    Filtrar
                  </button>
                  <button
                    type='button'
                    className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--fluent-text-primary,#242424)] bg-[var(--fluent-surface-card,#FFFFFF)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] transition-colors'
                    onClick={handleHistoryClear}
                  >
                    <X size={16} aria-hidden='true' />
                    Limpiar
                  </button>
                </div>
              </div>

              {((historyFilterMode === 'name' && historySearch.trim()) ||
                (historyFilterMode === 'date' && dateFrom && dateTo)) && (
                <div className='mt-3 flex gap-2 flex-wrap' aria-live='polite'>
                  {historyFilterMode === 'name' && historySearch.trim() && (
                    <span className='inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[var(--fluent-brand-light,#DEECF9)] text-[var(--fluent-brand-primary,#0078D4)] rounded-full border border-[var(--fluent-brand-primary,#0078D4)]/20'>
                      Filtro: nombre contiene "{historySearch.trim()}"
                    </span>
                  )}
                  {historyFilterMode === 'date' && dateFrom && dateTo && (
                    <span className='inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[var(--fluent-status-success-bg,#DFF6DD)] text-[var(--fluent-status-success,#107C10)] rounded-full border border-[var(--fluent-status-success,#107C10)]/20'>
                      Rango: {dateFrom} → {dateTo}
                    </span>
                  )}
                </div>
              )}

              <div className='mt-4 overflow-x-auto'>
                <table
                  className='w-full text-sm'
                  aria-label='Historial de ventas'
                >
                  <thead>
                    <tr className='border-b border-[var(--fluent-border-default,#E0E0E0)]'>
                      <th className='py-2 px-3 text-left font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide'>
                        ID Venta
                      </th>
                      <th className='py-2 px-3 text-left font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide'>
                        Fecha
                      </th>
                      <th className='py-2 px-3 text-left font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide'>
                        Cliente
                      </th>
                      <th className='py-2 px-3 text-right font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide'>
                        Total
                      </th>
                      <th className='py-2 px-3 text-center font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide'>
                        Estado
                      </th>
                      <th className='py-2 px-3 text-right font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase tracking-wide w-16'></th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className='py-8 text-center text-[var(--fluent-text-secondary,#616161)]'
                        >
                          Cargando ventas...
                        </td>
                      </tr>
                    ) : filteredHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className='py-8 text-center text-[var(--fluent-text-secondary,#616161)]'
                        >
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
                          <tr
                            key={`${saleId}-${index}`}
                            className='border-b border-[var(--fluent-border-subtle,#F0F0F0)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] transition-colors'
                          >
                            <td className='py-2 px-3 font-medium text-[var(--fluent-text-primary,#242424)]'>
                              #{saleId}
                            </td>
                            <td className='py-2 px-3 text-[var(--fluent-text-primary,#242424)]'>
                              {entry.order_date
                                ? new Date(entry.order_date).toLocaleString(
                                    'es-ES',
                                    { dateStyle: 'short', timeStyle: 'short' },
                                  )
                                : '—'}
                            </td>
                            <td className='py-2 px-3 text-[var(--fluent-text-primary,#242424)]'>
                              {entry.client_name || '—'}
                            </td>
                            <td className='py-2 px-3 text-right font-medium text-[var(--fluent-text-primary,#242424)]'>
                              {formatCurrency(
                                entry.total_amount || entry.total || 0,
                                'PYG',
                              )}
                            </td>
                            <td className='py-2 px-3 text-center'>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${status.badge}`}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className='py-2 px-3 text-right'>
                              <div className='relative inline-block'>
                                <button
                                  type='button'
                                  onClick={() =>
                                    toggleHistoryActionMenu(saleId)
                                  }
                                  aria-label={`Acciones para la venta ${saleId}`}
                                  className='p-1.5 rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-pressed,#E0E0E0)] transition-colors'
                                >
                                  <MoreVertical
                                    size={16}
                                    className='text-[var(--fluent-text-secondary,#616161)]'
                                  />
                                </button>
                                {historyActionMenuId === saleId && (
                                  <div className='absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-[var(--fluent-surface-card,#FFFFFF)] rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-16,0_8px_16px_rgba(0,0,0,0.14),0_0_2px_rgba(0,0,0,0.12))] border border-[var(--fluent-border-default,#E0E0E0)] py-1'>
                                    <button
                                      type='button'
                                      onClick={() => handleViewSale(entry)}
                                      className='w-full px-3 py-2 text-left text-sm text-[var(--fluent-text-primary,#242424)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] transition-colors flex items-center gap-2'
                                    >
                                      <Eye size={16} aria-hidden='true' /> Ver
                                    </button>
                                    <button
                                      type='button'
                                      onClick={() => handleCancelSale(entry)}
                                      className='w-full px-3 py-2 text-left text-sm text-[var(--fluent-status-danger,#D13438)] hover:bg-red-50 transition-colors flex items-center gap-2'
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
          className='fixed inset-0 z-[120] flex items-center justify-center'
          role='dialog'
          aria-modal='true'
          aria-labelledby='sale-detail-modal-title'
        >
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => {
              setShowSaleDetailModal(false)
              setSelectedHistorySale(null)
            }}
            aria-hidden='true'
          />
          <div className='relative w-full max-w-2xl mx-4 max-h-[90vh] bg-[var(--fluent-surface-card,#FFFFFF)] rounded-[var(--fluent-corner-radius-xlarge,12px)] shadow-[var(--fluent-shadow-64,0_32px_64px_rgba(0,0,0,0.24),0_0_8px_rgba(0,0,0,0.1))] flex flex-col overflow-hidden'>
            <header className='flex items-center justify-between px-4 py-3 border-b border-[var(--fluent-border-subtle,#F0F0F0)] bg-[var(--fluent-surface-subtle,#FAFAFA)]'>
              <div>
                <h3
                  id='sale-detail-modal-title'
                  className='text-base font-semibold text-[var(--fluent-text-primary,#242424)]'
                >
                  Venta #{selectedHistorySale.sale_id || selectedHistorySale.id}
                </h3>
                <p className='text-xs text-[var(--fluent-text-secondary,#616161)]'>
                  Detalles completos de la venta
                </p>
              </div>
              <button
                type='button'
                onClick={() => {
                  setShowSaleDetailModal(false)
                  setSelectedHistorySale(null)
                }}
                className='p-1.5 rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F0F0F0)] transition-colors'
              >
                <X
                  size={18}
                  className='text-[var(--fluent-text-secondary,#616161)]'
                />
              </button>
            </header>

            <div className='flex-1 overflow-y-auto p-4'>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-[var(--fluent-surface-subtle,#F5F5F5)] rounded-[var(--fluent-corner-radius-medium,4px)] mb-4'>
                <div>
                  <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                    Cliente
                  </span>
                  <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                    {selectedHistorySale.client_name || '—'}
                  </span>
                </div>
                <div>
                  <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                    Fecha
                  </span>
                  <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                    {formatDateTime(
                      selectedHistorySale.order_date ||
                        selectedHistorySale.sale_date ||
                        selectedHistorySale.created_at,
                    )}
                  </span>
                </div>
                <div>
                  <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                    Estado
                  </span>
                  <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                    {formatStatusLabel(selectedHistorySale.status)}
                  </span>
                </div>
                <div>
                  <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                    Total
                  </span>
                  <span className='text-sm font-bold text-[var(--fluent-brand-primary,#0078D4)]'>
                    {formatCurrency(
                      selectedHistorySale.total_amount ||
                        selectedHistorySale.total ||
                        0,
                      'PYG',
                    )}
                  </span>
                </div>
                <div>
                  <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                    Método de pago
                  </span>
                  <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                    {selectedHistorySale.payment_method || '—'}
                  </span>
                </div>
                <div>
                  <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                    Atendido por
                  </span>
                  <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                    {selectedHistorySale.user_name || '—'}
                  </span>
                </div>
              </div>

              <h4 className='text-sm font-semibold text-[var(--fluent-text-primary,#242424)] mb-2'>
                Productos
              </h4>
              <div className='overflow-x-auto'>
                <table
                  className='w-full text-sm'
                  aria-label='Productos de la venta'
                >
                  <thead>
                    <tr className='border-b border-[var(--fluent-border-default,#E0E0E0)]'>
                      <th className='text-left py-2 px-2 font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase'>
                        Producto
                      </th>
                      <th className='text-right py-2 px-2 font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase'>
                        Cant.
                      </th>
                      <th className='text-right py-2 px-2 font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase'>
                        Precio
                      </th>
                      <th className='text-right py-2 px-2 font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase'>
                        Desc.
                      </th>
                      <th className='text-right py-2 px-2 font-semibold text-[var(--fluent-text-secondary,#616161)] text-xs uppercase'>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSaleDetails.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className='text-center py-4 text-[var(--fluent-text-secondary,#616161)]'
                        >
                          No hay detalles de productos.
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
                            key={`${detail.id || detail.order_id || detail.product_id || 'detail'}-${detailIndex}`}
                            className='border-b border-[var(--fluent-border-subtle,#F0F0F0)]'
                          >
                            <td className='py-2 px-2 text-[var(--fluent-text-primary,#242424)]'>
                              {detail.product_name ||
                                detail.product_id ||
                                'Producto'}
                            </td>
                            <td className='py-2 px-2 text-right text-[var(--fluent-text-primary,#242424)]'>
                              {quantity}
                            </td>
                            <td className='py-2 px-2 text-right text-[var(--fluent-text-primary,#242424)]'>
                              {formatCurrency(unitPrice, 'PYG')}
                            </td>
                            <td className='py-2 px-2 text-right text-[var(--fluent-text-primary,#242424)]'>
                              {formatCurrency(discountAmount, 'PYG')}
                            </td>
                            <td className='py-2 px-2 text-right font-medium text-[var(--fluent-text-primary,#242424)]'>
                              {formatCurrency(lineTotal, 'PYG')}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <footer className='flex justify-end px-4 py-3 border-t border-[var(--fluent-border-subtle,#F0F0F0)] bg-[var(--fluent-surface-subtle,#FAFAFA)]'>
              <button
                type='button'
                onClick={() => {
                  setShowSaleDetailModal(false)
                  setSelectedHistorySale(null)
                }}
                className='px-4 py-2 text-sm font-medium text-[var(--fluent-text-primary,#242424)] bg-[var(--fluent-surface-card,#FFFFFF)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] transition-colors'
              >
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}

      {showCancelSaleModal && selectedHistorySale && (
        <div
          className='fixed inset-0 z-[120] flex items-center justify-center'
          role='dialog'
          aria-modal='true'
          aria-labelledby='cancel-sale-modal-title'
        >
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => {
              if (cancelSubmitting) return
              setShowCancelSaleModal(false)
              setCancelPreview(null)
              setSelectedHistorySale(null)
            }}
            aria-hidden='true'
          />
          <div className='relative w-full max-w-lg mx-4 max-h-[90vh] bg-[var(--fluent-surface-card,#FFFFFF)] rounded-[var(--fluent-corner-radius-xlarge,12px)] shadow-[var(--fluent-shadow-64,0_32px_64px_rgba(0,0,0,0.24),0_0_8px_rgba(0,0,0,0.1))] flex flex-col overflow-hidden'>
            <header className='flex items-center justify-between px-4 py-3 border-b border-[var(--fluent-border-subtle,#F0F0F0)] bg-[var(--fluent-status-danger,#D13438)]/5'>
              <div>
                <h3
                  id='cancel-sale-modal-title'
                  className='text-base font-semibold text-[var(--fluent-status-danger,#D13438)]'
                >
                  Anular venta #
                  {selectedHistorySale.sale_id || selectedHistorySale.id}
                </h3>
                <p className='text-xs text-[var(--fluent-text-secondary,#616161)]'>
                  Previsualiza el impacto antes de confirmar
                </p>
              </div>
              <button
                type='button'
                onClick={() => {
                  if (cancelSubmitting) return
                  setShowCancelSaleModal(false)
                  setCancelPreview(null)
                  setSelectedHistorySale(null)
                }}
                className='p-1.5 rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F0F0F0)] transition-colors'
              >
                <X
                  size={18}
                  className='text-[var(--fluent-text-secondary,#616161)]'
                />
              </button>
            </header>

            <div className='flex-1 overflow-y-auto p-4'>
              {cancelPreviewLoading ? (
                <p className='text-center py-4 text-[var(--fluent-text-secondary,#616161)]'>
                  Cargando previsualización...
                </p>
              ) : (
                <>
                  <div className='grid grid-cols-2 gap-3 p-3 bg-[var(--fluent-surface-subtle,#F5F5F5)] rounded-[var(--fluent-corner-radius-medium,4px)] mb-4'>
                    <div>
                      <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                        Cliente
                      </span>
                      <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                        {selectedHistorySale.client_name || '—'}
                      </span>
                    </div>
                    <div>
                      <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                        Fecha
                      </span>
                      <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                        {formatDateTime(
                          selectedHistorySale.order_date ||
                            selectedHistorySale.sale_date ||
                            selectedHistorySale.created_at,
                        )}
                      </span>
                    </div>
                    <div>
                      <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                        Estado actual
                      </span>
                      <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                        {formatStatusLabel(selectedHistorySale.status)}
                      </span>
                    </div>
                    <div>
                      <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                        Total
                      </span>
                      <span className='text-sm font-bold text-[var(--fluent-status-danger,#D13438)]'>
                        {formatCurrency(
                          selectedHistorySale.total_amount ||
                            selectedHistorySale.total ||
                            0,
                          'PYG',
                        )}
                      </span>
                    </div>
                  </div>

                  <h4 className='text-sm font-semibold text-[var(--fluent-text-primary,#242424)] mb-2'>
                    Impacto de la anulación
                  </h4>
                  <div className='grid grid-cols-2 gap-3 p-3 bg-[var(--fluent-status-warning-bg,#FFF4CE)] border border-[var(--fluent-status-warning,#FFB900)]/30 rounded-[var(--fluent-corner-radius-medium,4px)] mb-4'>
                    <div>
                      <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                        Reversiones de stock
                      </span>
                      <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                        {cancelPreview?.impact_summary?.stock_reversion_count ??
                          cancelPreview?.summary?.stock_movements ??
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                        Pagos a revertir
                      </span>
                      <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                        {cancelPreview?.impact_summary?.payment_reversals ??
                          cancelPreview?.summary?.payments_to_refund ??
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                        Monto a reembolsar
                      </span>
                      <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                        {formatCurrency(
                          cancelPreview?.impact_summary?.total_refund ||
                            cancelPreview?.summary?.total_refund ||
                            0,
                          'PYG',
                        )}
                      </span>
                    </div>
                    <div>
                      <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                        ¿Se puede anular?
                      </span>
                      <span
                        className={`text-sm font-medium ${cancelPreview?.is_cancellable === false ? 'text-[var(--fluent-status-danger,#D13438)]' : 'text-[var(--fluent-status-success,#107C10)]'}`}
                      >
                        {cancelPreview?.is_cancellable === false ? 'No' : 'Sí'}
                      </span>
                    </div>
                  </div>

                  {Array.isArray(cancelPreview?.warnings) &&
                    cancelPreview.warnings.length > 0 && (
                      <div className='p-3 bg-[var(--fluent-status-warning-bg,#FFF4CE)] border border-[var(--fluent-status-warning,#FFB900)]/30 rounded-[var(--fluent-corner-radius-medium,4px)] mb-4'>
                        <ul className='text-sm text-[var(--fluent-text-primary,#242424)] space-y-1 list-disc pl-4'>
                          {cancelPreview.warnings.map((warning, idx) => (
                            <li key={`warning-${idx}`}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  <div>
                    <label
                      className='block text-sm font-medium text-[var(--fluent-text-secondary,#616161)] mb-1'
                      htmlFor='cancel-reason'
                    >
                      Motivo de la anulación *
                    </label>
                    <textarea
                      id='cancel-reason'
                      rows={3}
                      className='w-full px-3 py-2 text-sm border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] placeholder:text-[var(--fluent-text-secondary,#616161)] focus:outline-none focus:border-[var(--fluent-brand-primary,#0078D4)] focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] resize-none disabled:opacity-50'
                      placeholder='Ej: El cliente canceló la compra.'
                      value={cancelReason}
                      onChange={event => setCancelReason(event.target.value)}
                      disabled={cancelSubmitting}
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <footer className='flex justify-end gap-2 px-4 py-3 border-t border-[var(--fluent-border-subtle,#F0F0F0)] bg-[var(--fluent-surface-subtle,#FAFAFA)]'>
              <button
                type='button'
                onClick={() => {
                  if (cancelSubmitting) return
                  setShowCancelSaleModal(false)
                  setCancelPreview(null)
                  setSelectedHistorySale(null)
                }}
                className='px-4 py-2 text-sm font-medium text-[var(--fluent-text-primary,#242424)] bg-[var(--fluent-surface-card,#FFFFFF)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] transition-colors'
              >
                Cerrar
              </button>
              <button
                type='button'
                disabled={
                  cancelSubmitting || cancelPreview?.is_cancellable === false
                }
                onClick={handleConfirmCancelSale}
                className='px-4 py-2 text-sm font-medium text-white bg-[var(--fluent-status-danger,#D13438)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[#B10E1C] active:bg-[#960B18] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {cancelSubmitting ? 'Anulando...' : 'Confirmar anulación'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className='fixed inset-0 z-[120] flex items-center justify-center'
          role='dialog'
          aria-modal='true'
          aria-labelledby='sales-modal-title'
        >
          {/* Overlay */}
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => {
              setIsModalOpen(false)
              setEditingItemId(null)
            }}
            aria-hidden='true'
          />
          {/* Modal - 2-column Layout optimized for 720p+ */}
          <div className='relative w-full max-w-4xl mx-4 max-h-[98vh] bg-[var(--fluent-surface-card,#FFFFFF)] rounded-[var(--fluent-corner-radius-xlarge,12px)] shadow-[var(--fluent-shadow-64,0_32px_64px_rgba(0,0,0,0.24),0_0_8px_rgba(0,0,0,0.1))] flex flex-col overflow-hidden'>
            {/* Compact Header */}
            <header className='flex items-center justify-between px-5 py-3 border-b border-[var(--fluent-border-subtle,#F0F0F0)] bg-[var(--fluent-surface-subtle,#FAFAFA)]'>
              <div>
                <h3
                  id='sales-modal-title'
                  className='text-base font-semibold text-[var(--fluent-text-primary,#242424)]'
                >
                  {editingItemId
                    ? 'Editar producto'
                    : 'Agregar producto a la venta'}
                </h3>
                <p className='text-xs text-[var(--fluent-text-secondary,#616161)]'>
                  Seleccione un artículo del catálogo, ajuste la cantidad y
                  configure un descuento antes de añadirlo
                </p>
              </div>
              <button
                type='button'
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingItemId(null)
                }}
                className='p-1.5 rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F0F0F0)] transition-colors'
              >
                <X
                  size={18}
                  className='text-[var(--fluent-text-secondary,#616161)]'
                />
                <span className='sr-only'>Cerrar</span>
              </button>
            </header>

            {/* Body - 2-column Grid */}
            <div className='flex-1 overflow-y-auto p-5'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
                {/* Column 1: Product Search & Selection */}
                <div className='space-y-4'>
                  {/* Product Search */}
                  <div>
                    <label
                      className='block text-sm font-medium text-[var(--fluent-text-secondary,#616161)] mb-1.5'
                      htmlFor='modal-product'
                    >
                      Producto
                    </label>
                    <div className='relative' ref={productSearchContainerRef}>
                      <input
                        ref={modalProductInputRef}
                        id='modal-product'
                        type='text'
                        className='w-full px-3 py-2.5 text-sm border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] placeholder:text-[var(--fluent-text-secondary,#616161)] focus:outline-none focus:border-[var(--fluent-brand-primary,#0078D4)] focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)]'
                        value={productSearchTerm}
                        onChange={event => {
                          setProductSearchTerm(event.target.value)
                          setShowProductDropdown(true)
                          setHighlightedIndex(-1)
                        }}
                        onFocus={() => {
                          if (modalSearchResults.length > 0)
                            setShowProductDropdown(true)
                        }}
                        onKeyDown={e => {
                          const itemCount = modalSearchResults.length
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            if (!showProductDropdown && itemCount > 0) {
                              setShowProductDropdown(true)
                              setHighlightedIndex(0)
                            } else if (itemCount > 0) {
                              setHighlightedIndex(prev =>
                                prev < itemCount - 1 ? prev + 1 : 0,
                              )
                            }
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            if (itemCount > 0) {
                              setHighlightedIndex(prev =>
                                prev > 0 ? prev - 1 : itemCount - 1,
                              )
                            }
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (showProductDropdown && itemCount > 0) {
                              const indexToSelect =
                                highlightedIndex >= 0 ? highlightedIndex : 0
                              handleSelectProduct(
                                modalSearchResults[indexToSelect],
                              )
                              setHighlightedIndex(-1)
                            }
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            setShowProductDropdown(false)
                            setHighlightedIndex(-1)
                          }
                          if (e.key === 'Tab') {
                            setShowProductDropdown(false)
                            setHighlightedIndex(-1)
                          }
                        }}
                        role='combobox'
                        aria-expanded={showProductDropdown}
                        aria-haspopup='listbox'
                        aria-controls='sales-product-search-listbox'
                        aria-activedescendant={
                          highlightedIndex >= 0
                            ? `sales-product-option-${highlightedIndex}`
                            : undefined
                        }
                        placeholder='Buscar por nombre, ID o código de barras...'
                        autoComplete='off'
                      />
                      {showProductDropdown && (
                        <div
                          ref={productDropdownRef}
                          className='absolute top-full left-0 right-0 mt-1 z-50 max-h-52 overflow-y-auto bg-[var(--fluent-surface-card,#FFFFFF)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-16,0_8px_16px_rgba(0,0,0,0.14),0_0_2px_rgba(0,0,0,0.12))]'
                          role='listbox'
                          id='sales-product-search-listbox'
                          aria-label='Resultados de productos'
                        >
                          {isSearchingProducts ? (
                            <div className='px-3 py-2 text-sm text-[var(--fluent-text-secondary,#616161)]'>
                              Buscando...
                            </div>
                          ) : modalSearchResults.length === 0 ? (
                            <div className='px-3 py-2 text-sm text-[var(--fluent-text-secondary,#616161)]'>
                              {productSearchTerm.length < 3
                                ? 'Escribe al menos 3 caracteres'
                                : 'No se encontraron productos'}
                            </div>
                          ) : (
                            modalSearchResults.map((product, index) => {
                              const display = getProductDisplay(product)
                              const isHighlighted = index === highlightedIndex
                              return (
                                <div
                                  key={`${display.id}-${index}`}
                                  id={`sales-product-option-${index}`}
                                  role='option'
                                  aria-selected={isHighlighted}
                                  className={`relative flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer transition-colors ${isHighlighted ? 'bg-[var(--fluent-surface-subtle,#EEF6FC)] ring-1 ring-inset ring-[var(--fluent-brand-primary,#0078D4)]' : 'hover:bg-[var(--fluent-surface-hover,#F5F5F5)]'}`}
                                  onClick={() => {
                                    handleSelectProduct(product)
                                    setHighlightedIndex(-1)
                                  }}
                                  onMouseEnter={() =>
                                    setHighlightedIndex(index)
                                  }
                                >
                                  {isHighlighted && (
                                    <span
                                      className='absolute left-0 top-1 bottom-1 w-1 rounded-r bg-[var(--fluent-brand-primary,#0078D4)]'
                                      aria-hidden='true'
                                    />
                                  )}
                                  <div>
                                    <div
                                      className={`font-medium ${isHighlighted ? 'text-[var(--fluent-brand-primary,#0078D4)]' : 'text-[var(--fluent-text-primary,#242424)]'}`}
                                    >
                                      {display.name}
                                    </div>
                                    <div className='text-xs text-[var(--fluent-text-secondary,#616161)]'>
                                      ID: {display.id}
                                    </div>
                                  </div>
                                  <div className='text-right'>
                                    {isHighlighted && (
                                      <div className='mb-1 inline-flex items-center px-1.5 py-0.5 rounded-[var(--fluent-corner-radius-small,2px)] border border-[var(--fluent-brand-primary,#0078D4)] text-[10px] font-semibold text-[var(--fluent-brand-primary,#0078D4)]'>
                                        Activo
                                      </div>
                                    )}
                                    <div className='font-medium text-[var(--fluent-text-primary,#242424)]'>
                                      {formatCurrency(display.price, 'PYG')}
                                    </div>
                                    <div
                                      className={`text-xs font-medium ${display.stock > 0 ? 'text-[var(--fluent-status-success,#107C10)]' : 'text-[var(--fluent-status-danger,#D13438)]'}`}
                                    >
                                      Disponible: {display.stock}
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                    <p className='text-xs text-[var(--fluent-text-secondary,#616161)] mt-1.5'>
                      Precio unitario actual:{' '}
                      <span className='font-medium text-[var(--fluent-brand-primary,#0078D4)]'>
                        {formatCurrency(modalUnitPrice, 'PYG')}
                      </span>
                    </p>
                  </div>

                  {/* Selected Product Info */}
                  <div className='p-4 bg-[var(--fluent-surface-subtle,#F5F5F5)] rounded-[var(--fluent-corner-radius-medium,4px)] border border-[var(--fluent-border-subtle,#E8E8E8)]'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <span className='block text-xs font-medium text-[var(--fluent-text-secondary,#616161)] uppercase tracking-wide mb-1'>
                          Producto seleccionado
                        </span>
                        <p className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                          {modalDisplay.name || 'Selecciona un producto'}
                        </p>
                      </div>
                      <div>
                        <span className='block text-xs font-medium text-[var(--fluent-text-secondary,#616161)] uppercase tracking-wide mb-1'>
                          ID
                        </span>
                        <p className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                          {modalDisplay.id || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label
                      className='block text-sm font-medium text-[var(--fluent-text-secondary,#616161)] mb-1.5'
                      htmlFor='modal-quantity'
                    >
                      Cantidad (
                      {modalDisplay.base_unit
                        ? getUnitLabel(modalDisplay.base_unit)
                        : 'Unidades'}
                      )
                    </label>
                    <input
                      id='modal-quantity'
                      type='number'
                      min='1'
                      step={
                        modalDisplay.base_unit &&
                        ['basic', 'packing', 'grocery'].includes(
                          getUnitLabel(modalDisplay.base_unit),
                        )
                          ? '1'
                          : '0.01'
                      }
                      className='w-full px-3 py-2.5 text-sm border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] focus:outline-none focus:border-[var(--fluent-brand-primary,#0078D4)] focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)]'
                      value={modalQuantity}
                      onChange={event => setModalQuantity(event.target.value)}
                    />
                    <p className='text-xs text-[var(--fluent-text-secondary,#616161)] mt-1.5'>
                      Máximo disponible:{' '}
                      <span
                        className={`font-medium ${modalDisplay.stock > 0 ? 'text-[var(--fluent-status-success,#107C10)]' : 'text-[var(--fluent-text-secondary,#616161)]'}`}
                      >
                        {modalDisplay.stock > 0
                          ? `${modalDisplay.stock} unidades`
                          : 'sin límite definido'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Column 2: Discount & Totals */}
                <div className='space-y-4'>
                  {/* Discount Type */}
                  <div>
                    <label
                      className='block text-sm font-medium text-[var(--fluent-text-secondary,#616161)] mb-1.5'
                      htmlFor='modal-discount-type'
                    >
                      Tipo de Descuento
                    </label>
                    <select
                      id='modal-discount-type'
                      className='w-full px-3 py-2.5 text-sm border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] focus:outline-none focus:border-[var(--fluent-brand-primary,#0078D4)] focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)]'
                      value={modalDiscountType}
                      onChange={e => setModalDiscountType(e.target.value)}
                    >
                      <option value='amount'>Monto Fijo (Unitario)</option>
                      <option value='percent'>Porcentaje (%)</option>
                    </select>
                  </div>

                  {/* Discount Value */}
                  <div>
                    <label
                      className='block text-sm font-medium text-[var(--fluent-text-secondary,#616161)] mb-1.5'
                      htmlFor='modal-discount'
                    >
                      Valor del Descuento
                    </label>
                    <div className='relative'>
                      <input
                        id='modal-discount'
                        type='number'
                        min='0'
                        step={modalDiscountType === 'percent' ? '1' : '0.01'}
                        className='w-full px-3 py-2.5 pr-14 text-sm border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] focus:outline-none focus:border-[var(--fluent-brand-primary,#0078D4)] focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)]'
                        value={modalDiscount}
                        onChange={event => setModalDiscount(event.target.value)}
                        placeholder={
                          modalDiscountType === 'percent' ? '0' : '0.00'
                        }
                      />
                      <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--fluent-text-secondary,#616161)]'>
                        {modalDiscountType === 'percent' ? '%' : 'PYG'}
                      </span>
                    </div>
                    <p className='text-xs text-[var(--fluent-text-secondary,#616161)] mt-1.5'>
                      {modalDiscountType === 'percent'
                        ? 'Porcentaje sobre precio unitario'
                        : 'Monto a descontar por unidad'}
                    </p>
                  </div>

                  {/* Discount Reason (conditional) */}
                  {modalDiscountValue > 0 && (
                    <div>
                      <label
                        className='block text-sm font-medium text-[var(--fluent-text-secondary,#616161)] mb-1.5'
                        htmlFor='modal-discount-reason'
                      >
                        Razón del Descuento (Requerido)
                      </label>
                      <input
                        id='modal-discount-reason'
                        type='text'
                        className='w-full px-3 py-2.5 text-sm border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] bg-[var(--fluent-surface-card,#FFFFFF)] text-[var(--fluent-text-primary,#242424)] focus:outline-none focus:border-[var(--fluent-brand-primary,#0078D4)] focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)]'
                        value={modalDiscountReason}
                        onChange={e => setModalDiscountReason(e.target.value)}
                        placeholder='Ej: Promoción de verano, Cliente frecuente...'
                        required
                      />
                    </div>
                  )}

                  {/* Totals Summary */}
                  <div className='p-4 bg-[var(--fluent-brand-light,#DEECF9)]/30 border border-[var(--fluent-brand-primary,#0078D4)]/20 rounded-[var(--fluent-corner-radius-medium,4px)]'>
                    <h4 className='text-xs font-semibold text-[var(--fluent-text-secondary,#616161)] uppercase tracking-wide mb-3'>
                      Resumen de Línea
                    </h4>
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                          Precio unitario
                        </span>
                        <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                          {formatCurrency(modalUnitPrice, 'PYG')}
                        </span>
                      </div>
                      <div>
                        <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                          Subtotal sin descuento
                        </span>
                        <span className='text-sm font-medium text-[var(--fluent-text-primary,#242424)]'>
                          {formatCurrency(modalSubtotal, 'PYG')}
                        </span>
                      </div>
                      <div>
                        <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                          Descuento aplicado
                        </span>
                        <span className='text-sm font-medium text-[var(--fluent-status-danger,#D13438)]'>
                          -{formatCurrency(modalDiscountValue, 'PYG')}
                        </span>
                      </div>
                      <div>
                        <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                          Total de línea
                        </span>
                        <span className='text-lg font-bold text-[var(--fluent-brand-primary,#0078D4)]'>
                          {formatCurrency(modalLineTotal, 'PYG')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className='flex items-center justify-end gap-3 px-5 py-3 border-t border-[var(--fluent-border-subtle,#F0F0F0)] bg-[var(--fluent-surface-subtle,#FAFAFA)]'>
              <button
                type='button'
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingItemId(null)
                }}
                className='px-5 py-2 text-sm font-medium text-[var(--fluent-text-primary,#242424)] bg-[var(--fluent-surface-card,#FFFFFF)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] transition-colors'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={handleConfirmAdd}
                className='px-5 py-2 text-sm font-medium text-white bg-[var(--fluent-brand-primary,#0078D4)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-brand-hover,#106EBE)] active:bg-[var(--fluent-brand-pressed,#005A9E)] transition-colors'
              >
                {editingItemId ? 'Guardar cambios' : 'Confirmar'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Modal de Reservas Pendientes */}
      {showReservationModal && (
        <div
          className='fixed inset-0 z-[120] flex items-center justify-center'
          role='dialog'
          aria-modal='true'
          aria-labelledby='reservation-modal-title'
        >
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => setShowReservationModal(false)}
            aria-hidden='true'
          />
          <div className='relative w-full max-w-lg mx-4 max-h-[90vh] bg-[var(--fluent-surface-card,#FFFFFF)] rounded-[var(--fluent-corner-radius-xlarge,12px)] shadow-[var(--fluent-shadow-64,0_32px_64px_rgba(0,0,0,0.24),0_0_8px_rgba(0,0,0,0.1))] flex flex-col overflow-hidden'>
            <header className='flex items-center justify-between px-4 py-3 border-b border-[var(--fluent-border-subtle,#F0F0F0)]'>
              <div>
                <h3
                  id='reservation-modal-title'
                  className='text-base font-semibold text-[var(--fluent-text-primary,#242424)]'
                >
                  Reservas Pendientes
                </h3>
                <p className='text-xs text-[var(--fluent-text-secondary,#616161)]'>
                  El cliente tiene reservas confirmadas pendientes de pago.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setShowReservationModal(false)}
                className='p-1.5 rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F0F0F0)] transition-colors'
              >
                <X
                  size={18}
                  className='text-[var(--fluent-text-secondary,#616161)]'
                />
              </button>
            </header>

            <div className='flex-1 overflow-y-auto p-4'>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-[var(--fluent-border-default,#E0E0E0)]'>
                      <th className='px-3 py-2 text-left font-semibold text-[var(--fluent-text-secondary,#616161)]'>
                        Servicio
                      </th>
                      <th className='px-3 py-2 text-left font-semibold text-[var(--fluent-text-secondary,#616161)]'>
                        Fecha
                      </th>
                      <th className='px-3 py-2 text-right font-semibold text-[var(--fluent-text-secondary,#616161)]'>
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReservations.map((res, index) => (
                      <tr
                        key={`${res.reserve_id || res.id}-${index}`}
                        className='border-b border-[var(--fluent-border-subtle,#F0F0F0)] hover:bg-[var(--fluent-surface-subtle,#FAFAFA)]'
                      >
                        <td className='px-3 py-2'>
                          <span className='text-[var(--fluent-text-primary,#242424)]'>
                            {res.product_name}
                          </span>
                          <span className='block text-xs text-[var(--fluent-text-secondary,#616161)]'>
                            Duración: {res.duration || res.duration_hours || 1}{' '}
                            hrs
                          </span>
                        </td>
                        <td className='px-3 py-2 text-[var(--fluent-text-primary,#242424)]'>
                          {new Date(res.start_time).toLocaleDateString()}
                        </td>
                        <td className='px-3 py-2 text-right font-medium text-[var(--fluent-text-primary,#242424)]'>
                          {formatCurrency(res.total_amount, 'PYG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <footer className='flex justify-end gap-2 px-4 py-3 border-t border-[var(--fluent-border-subtle,#F0F0F0)] bg-[var(--fluent-surface-subtle,#FAFAFA)]'>
              <button
                type='button'
                onClick={() => setShowReservationModal(false)}
                className='px-4 py-2 text-sm font-medium text-[var(--fluent-text-primary,#242424)] bg-[var(--fluent-surface-card,#FFFFFF)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] transition-colors'
              >
                Ignorar
              </button>
              <button
                type='button'
                onClick={handleAddReservations}
                className='px-4 py-2 text-sm font-medium text-white bg-[var(--fluent-brand-primary,#0078D4)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-brand-hover,#106EBE)] active:bg-[var(--fluent-brand-pressed,#005A9E)] transition-colors'
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
          className='fixed inset-0 z-[120] flex items-center justify-center'
          role='dialog'
          aria-modal='true'
          aria-labelledby='active-sale-modal-title'
        >
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => setShowActiveSaleModal(false)}
            aria-hidden='true'
          />
          <div className='relative w-full max-w-2xl mx-4 max-h-[90vh] bg-[var(--fluent-surface-card,#FFFFFF)] rounded-[var(--fluent-corner-radius-xlarge,12px)] shadow-[var(--fluent-shadow-64,0_32px_64px_rgba(0,0,0,0.24),0_0_8px_rgba(0,0,0,0.1))] flex flex-col overflow-hidden'>
            <header className='flex items-center justify-between px-4 py-3 border-b border-[var(--fluent-border-subtle,#F0F0F0)]'>
              <div>
                <h3
                  id='active-sale-modal-title'
                  className='text-base font-semibold text-[var(--fluent-text-primary,#242424)]'
                >
                  Ventas Activas Encontradas
                </h3>
                <p className='text-xs text-[var(--fluent-text-secondary,#616161)]'>
                  Selecciona una venta pendiente para continuar o inicia una
                  nueva.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setShowActiveSaleModal(false)}
                className='p-1.5 rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F0F0F0)] transition-colors'
              >
                <X
                  size={18}
                  className='text-[var(--fluent-text-secondary,#616161)]'
                />
              </button>
            </header>

            <div className='flex-1 overflow-y-auto p-4'>
              <div className='grid gap-3 sm:grid-cols-2'>
                {activeSales.map(sale => {
                  const saleId = sale.sale_id || sale.id
                  const selected =
                    saleId &&
                    (saleId === activeSale?.sale_id ||
                      saleId === activeSale?.id)

                  return (
                    <label
                      key={saleId}
                      className={`block p-3 border rounded-[var(--fluent-corner-radius-medium,4px)] cursor-pointer transition-all ${selected ? 'border-[var(--fluent-brand-primary,#0078D4)] border-2 bg-[var(--fluent-brand-primary,#0078D4)]/5 shadow-md' : 'border-[var(--fluent-border-default,#E0E0E0)] bg-[var(--fluent-surface-card,#FFFFFF)] hover:border-[var(--fluent-border-stronger,#D0D0D0)] hover:shadow-sm'}`}
                    >
                      <div className='flex items-center gap-2 mb-2'>
                        <input
                          type='radio'
                          name='active-sale'
                          checked={selected}
                          onChange={() => setActiveSale(sale)}
                          aria-label={`Seleccionar venta ${saleId}`}
                          className='w-4 h-4 text-[var(--fluent-brand-primary,#0078D4)]'
                        />
                        <span className='font-semibold text-[var(--fluent-text-primary,#242424)]'>
                          Venta #{saleId}
                        </span>
                        <span className='ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--fluent-brand-primary,#0078D4)]/10 text-[var(--fluent-brand-primary,#0078D4)] border border-[var(--fluent-brand-primary,#0078D4)]/30'>
                          {formatStatusLabel(sale.status)}
                        </span>
                      </div>
                      <div className='text-sm text-[var(--fluent-text-primary,#242424)]'>
                        Cliente: {sale.client_name || 'Sin nombre'}
                      </div>
                      <div className='text-xs text-[var(--fluent-text-secondary,#616161)]'>
                        Fecha:{' '}
                        {formatDateTime(sale.sale_date || sale.created_at)}
                      </div>
                      <div className='text-xs text-[var(--fluent-text-secondary,#616161)]'>
                        Total: {formatCurrency(sale.total_amount || 0, 'PYG')}
                      </div>
                      {Array.isArray(sale.details) &&
                        sale.details.length > 0 && (
                          <div className='mt-2 text-xs text-[var(--fluent-text-secondary,#616161)]'>
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

            <footer className='flex justify-end gap-2 px-4 py-3 border-t border-[var(--fluent-border-subtle,#F0F0F0)] bg-[var(--fluent-surface-subtle,#FAFAFA)]'>
              <button
                type='button'
                onClick={() => setShowActiveSaleModal(false)}
                className='px-4 py-2 text-sm font-medium text-[var(--fluent-text-primary,#242424)] bg-[var(--fluent-surface-card,#FFFFFF)] border border-[var(--fluent-border-default,#E0E0E0)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-surface-hover,#F5F5F5)] transition-colors'
              >
                Nueva Venta
              </button>
              <button
                type='button'
                onClick={handleContinueSale}
                className='px-4 py-2 text-sm font-medium text-white bg-[var(--fluent-brand-primary,#0078D4)] rounded-[var(--fluent-corner-radius-medium,4px)] hover:bg-[var(--fluent-brand-hover,#106EBE)] active:bg-[var(--fluent-brand-pressed,#005A9E)] transition-colors'
              >
                Continuar Venta
              </button>
            </footer>
          </div>
        </div>
      )}

      <InstantPaymentDialog
        open={showInstantCollection}
        onConfirmPayment={handleInstantCollectionConfirm}
        onLeavePending={handleLeaveSalePending}
        variant='sale'
        orderId={createdSaleData?.id}
        totalAmount={createdSaleData?.totalAmount}
        currencyCode={createdSaleData?.currencyCode || 'PYG'}
        paymentMethodId={createdSaleData?.paymentMethodId}
        paymentMethodLabel={createdSaleData?.paymentMethodLabel}
        paymentMethods={paymentMethods}
      />

      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  )
}

export default SalesNew
