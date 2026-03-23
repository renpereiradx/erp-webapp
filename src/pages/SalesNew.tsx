import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
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
  History,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CircleDollarSign,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
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
  paid: { label: 'Pagada', badge: 'badge--subtle-success' },
}

const formatCurrency = (value, currencyCode = 'PYG') => {
  const isPYG = currencyCode === 'PYG'
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: isPYG ? 0 : 2,
    maximumFractionDigits: isPYG ? 0 : 2,
  }).format(value || 0)
}

const formatDocumentId = value => {
  if (!value) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const formatDateTime = value => {
  if (!value) return '—'
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    // Intentar manejar formatos de texto si New Date falla
    return String(value).split('T')[0] || '—'
  }
  return date.toLocaleString('es-PY', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

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

  const taxInfo = product.applicable_tax_rate || product.tax?.rate;
  const rawTaxRate = (typeof taxInfo === 'object' ? taxInfo?.rate : taxInfo) ?? rawTaxRateCandidates.find(
    candidate => candidate !== undefined && candidate !== null,
  )

  let normalizedTaxRate = 0
  if (rawTaxRate !== undefined) {
    const parsedRate = Number(rawTaxRate)
    if (Number.isFinite(parsedRate) && parsedRate > 0) {
      normalizedTaxRate = parsedRate >= 1 ? parsedRate / 100 : parsedRate
    }
  }

  return {
    name: product.name || product.product_name || '',
    id: product.id || product.product_id || '',
    price:
      product.sale_price ||
      product.price ||
      product.unit_price ||
      product.unit_prices?.[0]?.price_per_unit ||
      0,
    sku: product.sku || product.barcode || product.code || '-',
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
    fetchSaleMetadata,
    currentSaleMetadata,
    clearCurrentSaleMetadata,
    loading: saleLoading,
  } = useSaleStore()

  // Tab state
  const [activeTab, setActiveTab] = useState('new-sale')

  const { fetchDashboardData } = useDashboardStore()

  // Cart state
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
  const [historyFilterMode, setHistoryFilterMode] = useState('date')
  const [historyFilterError, setHistoryFilterError] = useState('')
  
  // Establecer rango predeterminado (últimos 90 días)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    return toDateInputValue(d)
  })
  const [dateTo, setDateTo] = useState(toDateInputValue(new Date()))
  
  const [historyActionMenuId, setHistoryActionMenuId] = useState(null)
  const [selectedHistorySale, setSelectedHistorySale] = useState(null)
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  // Client status state
  const [pendingReservations, setPendingReservations] = useState([])
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [activeSales, setActiveSales] = useState([])
  const [activeSale, setActiveSale] = useState(null)
  const [showActiveSaleModal, setShowActiveSaleModal] = useState(false)
  const [currentSaleId, setCurrentSaleId] = useState(null)

  // Estados para cobro instantáneo post-creación
  const [showInstantCollection, setShowInstantCollection] = useState(false)
  const [createdSaleData, setCreatedSaleData] = useState(null)

  // Memoized cart values
  const saleTotals = useMemo(() => saleService.calculateLocalTotals(items), [items])
  const subtotal = saleTotals.subtotal
  const lineDiscounts = saleTotals.discount_total
  const taxes = saleTotals.tax_amount
  const total = useMemo(() => Math.max(0, saleTotals.total - generalDiscount), [saleTotals.total, generalDiscount])

  const filteredItems = useMemo(() => 
    items.filter(item => (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [items, searchTerm]
  )

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
    if (rates.length === 1) return `Impuestos (IVA ${rates[0]}%)`
    if (rates.length > 1) return 'Impuestos (tasas mixtas)'
    return 'Impuestos (según tasa de producto)'
  }, [items])

  const filteredHistory = useMemo(() => {
    return (sales || [])
      .map((entry, idx) => {
        // Soporte para estructura anidada { sale: {...}, details: [...] } o plana {...}
        const s = entry.sale || entry
        const saleId = s.sale_id || s.id || entry.saleId || entry.id
        
        return {
          ...s,
          // Identificador único garantizado para React
          internalKey: saleId ? `sale-${saleId}-${idx}` : `sale-index-${idx}`,
          id: saleId,
          displayId: saleId || 'N/A',
          client_name: s.client_name || s.client?.name || entry.client?.name || 'Cliente Ocasional',
          total_amount: s.total_amount || s.total || entry.total_amount || 0,
          date: s.sale_date || s.order_date || s.date || entry.sale_date || entry.order_date || s.createdAt || entry.createdAt,
          status: (s.status || entry.status || 'PENDING').toString().toUpperCase()
        }
      })
      .filter(entry => {
        if (!historySearch) return true
        const searchLower = historySearch.toLowerCase().replace('#', '')
        const saleIdStr = String(entry.id || '').toLowerCase()
        const clientNameStr = (entry.client_name || '').toLowerCase()
        return clientNameStr.includes(searchLower) || saleIdStr.includes(searchLower)
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime()
        const dateB = new Date(b.date || 0).getTime()
        return dateB - dateA
      })
  }, [sales, historySearch])

  const handleHistoryFilter = async () => {
    setHistoryFilterError('')
    const term = historySearch.trim()
    if (term && (historyFilterMode === 'name' || term.startsWith('#'))) {
      try {
        await fetchSalesByClientName(term.replace('#', ''), { page: 1, page_size: 100 })
        return
      } catch (error) {
        console.error('Error fetching by name:', error)
      }
    }

    if (!dateFrom || !dateTo) {
      toast.error('Selecciona un rango de fechas')
      return
    }

    try {
      await fetchSalesByDateRange({
        start_date: dateFrom,
        end_date: dateTo,
        dateFrom: dateFrom,
        dateTo: dateTo,
        page: 1,
        page_size: 100,
      })
    } catch (error) {
      toast.errorFrom(error, { fallback: 'No se pudo obtener el historial de ventas' })
    }
  }

  const handleLoadLatest = async () => {
    setHistorySearch('')
    setHistoryFilterMode('date')
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 90)
    const startStr = toDateInputValue(start)
    const endStr = toDateInputValue(end)
    setDateFrom(startStr)
    setDateTo(endStr)
    try {
      await fetchSalesByDateRange({
        start_date: startStr,
        end_date: endStr,
        page: 1,
        page_size: 100,
      })
    } catch (error) {
      toast.error('Error al cargar últimos registros')
    }
  }

  useEffect(() => {
    if (activeTab === 'history' && sales.length === 0 && !saleLoading) {
      handleHistoryFilter()
    }
  }, [activeTab])

  // Initial data loading
  useEffect(() => {
    fetchProducts({ page: 1, pageSize: 100 })
  }, [fetchProducts])

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setPaymentMethodsLoading(true)
        const methods = await PaymentMethodService.getAll()
        const methodsArray = Array.isArray(methods) ? methods : []
        setPaymentMethods(methodsArray)
        if (methodsArray.length > 0) setPaymentMethodId(methodsArray[0].id)
      } catch (error) { console.error('Error loading payment methods:', error) } finally { setPaymentMethodsLoading(false) }

      try {
        setCurrenciesLoading(true)
        const currencyList = await CurrencyService.getAll()
        setCurrencies(currencyList)
        if (currencyList.length > 0) setCurrencyId(currencyList[0].id)
      } catch (error) { console.error('Error loading currencies:', error) } finally { setCurrenciesLoading(false) }
    }
    loadPaymentData()
  }, [])

  // Search logic
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (clientSearchTerm.trim().length >= 3) {
        if (selectedClient && clientSearchTerm === selectedClient.name) return
        try {
          await searchClients(clientSearchTerm)
          setShowClientDropdown(true)
        } catch (error) {
          console.error('Error searching clients:', error)
          setShowClientDropdown(false)
        }
      } else { setShowClientDropdown(false) }
    }, 300)
    return () => clearTimeout(searchTimeout)
  }, [clientSearchTerm, searchClients, selectedClient])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const term = (productSearchTerm || '').trim()
      if (term.length >= 3) {
        const currentProduct = getProductDisplay(selectedModalProduct)
        if (selectedModalProduct && term === currentProduct.name) return
        setIsSearchingProducts(true)
        try {
          const results = await productService.searchProducts(term)
          const allResults = Array.isArray(results) ? results : results ? [results] : []
          const activeResults = allResults.filter(p => {
            if (typeof p.status === 'boolean') return p.status
            return p.state !== false && p.is_active !== false
          })
          setModalSearchResults(activeResults)
          setShowProductDropdown(true)
        } catch (error) {
          console.error('Error searching products:', error)
          setModalSearchResults([])
        } finally { setIsSearchingProducts(false) }
      } else { setModalSearchResults([]) }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [productSearchTerm, selectedModalProduct])

  // UI Helpers
  const handleOpenModal = () => {
    setEditingItemId(null); setSelectedModalProduct(null); setProductSearchTerm('');
    setModalQuantity(1); setModalDiscount(0); setModalDiscountType('amount');
    setModalDiscountReason(''); setIsModalOpen(true); setShowProductDropdown(false);
  }

  const modalProduct = selectedModalProduct
  const modalDisplay = getProductDisplay(modalProduct)
  const modalUnitPrice = modalDisplay.price
  const parsedModalQuantity = useMemo(() => {
    const q = Number(modalQuantity)
    return !Number.isFinite(q) || q <= 0 ? 1 : q
  }, [modalQuantity])
  const parsedModalDiscount = useMemo(() => {
    const d = Number(modalDiscount)
    return !Number.isFinite(d) || d < 0 ? 0 : d
  }, [modalDiscount])
  const modalSubtotal = modalUnitPrice * parsedModalQuantity
  const modalDiscountValue = useMemo(() => {
    let td = 0
    if (modalDiscountType === 'percent') {
      td = modalUnitPrice * (parsedModalDiscount / 100) * parsedModalQuantity
    } else {
      td = parsedModalDiscount * parsedModalQuantity
    }
    return Math.min(td, modalSubtotal)
  }, [parsedModalDiscount, modalSubtotal, modalDiscountType, modalUnitPrice, parsedModalQuantity])
  const modalLineTotal = Math.max(0, modalSubtotal - modalDiscountValue)

  const handleConfirmAdd = () => {
    if (!modalProduct) { setIsModalOpen(false); return }
    if (modalDiscountValue > 0 && !modalDiscountReason.trim()) { toast.error('Debes ingresar una razón para el descuento'); return }
    const newItem = {
      id: editingItemId || `${modalDisplay.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: modalDisplay.id, name: modalDisplay.name, quantity: parsedModalQuantity,
      price: modalDisplay.price, discount: modalDiscountValue, discountType: modalDiscountType,
      discountInput: parsedModalDiscount, discountReason: modalDiscountReason,
      taxRate: modalDisplay.taxRate || 0, unit: modalDisplay.base_unit || 'unit',
    }
    setItems(prev => {
      if (editingItemId) return prev.map(item => (item.id === editingItemId ? newItem : item))
      const existingItem = prev.find(item => item.productId === modalDisplay.id && !item.isReservation && !item.isFromPendingSale)
      if (existingItem) {
        if (window.confirm(`El producto "${modalDisplay.name}" ya está en el carrito.\n¿Deseas sumar las cantidades?`)) {
          return prev.map(item => item.id === existingItem.id ? { ...item, quantity: item.quantity + parsedModalQuantity } : item)
        }
      }
      return [...prev, newItem]
    })
    setModalQuantity(1); setModalDiscount(0); setEditingItemId(null); setIsModalOpen(false)
  }

  const handleHistoryClear = () => {
    setHistorySearch(''); setDateFrom(toDateInputValue(new Date())); setDateTo(toDateInputValue(new Date()));
    setHistoryFilterMode('date'); setHistoryFilterError(''); clearSales()
  }

  const handleViewSale = sale => {
    const saleId = sale.sale_id || sale.id
    if (saleId) {
      navigate(`/cobros-ventas/${saleId}`)
    }
  }

  const handleCancelSale = async sale => {
    const saleId = sale?.sale_id || sale?.id
    if (!saleId) return
    setHistoryActionMenuId(null); setCancelPreview(null); setSelectedHistorySale(sale);
    setCancelReason(''); setCancelPreviewLoading(true)
    try {
      const preview = await saleService.previewSaleCancellation(saleId)
      setCancelPreview(preview); setShowCancelSaleModal(true)
    } catch (error) { toast.errorFrom(error, { fallback: 'No se pudo previsualizar la anulación' }) } finally { setCancelPreviewLoading(false) }
  }

  const handleConfirmCancelSale = async () => {
    if (!selectedHistorySale) return
    const saleId = selectedHistorySale.sale_id || selectedHistorySale.id
    setCancelSubmitting(true)
    try {
      await cancelSale(saleId, cancelReason || 'Cancelada por el usuario')
      toast.success('Venta anulada exitosamente')
      setShowCancelSaleModal(false); setCancelPreview(null); handleHistoryFilter()
    } catch (error) { toast.errorFrom(error, { fallback: 'No se pudo cancelar la venta' }) } finally { setCancelSubmitting(false) }
  }

  const [isProcessingSale, setIsProcessingSale] = useState(false)

  const handleSaveSale = async () => {
    if (!selectedClient) { toast.error('Por favor selecciona un cliente'); return }
    if (items.length === 0) { toast.error('Por favor agrega al menos un producto'); return }
    
    setIsProcessingSale(true)
    try {
      if (currentSaleId) {
        const newItems = items.filter(item => !item.isFromPendingSale)
        if (newItems.length === 0) { 
          toast.error('No hay productos nuevos para agregar'); 
          setIsProcessingSale(false);
          return 
        }
        const payload = {
          allow_price_modifications: newItems.some(item => item.discount > 0),
          product_details: newItems.map(item => ({
            product_id: item.productId, quantity: item.quantity, unit: item.unit || 'unit',
            ...(item.discount > 0 && {
              [item.discountType === 'percent' ? 'discount_percent' : 'discount_amount']: Number(item.discountInput),
              discount_reason: item.discountReason || 'Descuento aplicado en venta'
            })
          })),
        }
        const response = await saleService.addProductsToSale(currentSaleId, payload)
        if (response?.success) {
          toast.success(`Venta actualizada exitosamente.`); 
          setItems([]); 
          setCurrentSaleId(null); 
          setSelectedClient(null);
          setClientSearchTerm('');
          fetchDashboardData();
          handleHistoryFilter(); // Refrescar historial
        }
      } else {
        const saleData = {
          client_id: selectedClient.id,
          allow_price_modifications: items.some(item => item.discount > 0),
          product_details: items.map(item => ({
            product_id: item.productId, quantity: item.quantity, unit: item.unit || 'unit',
            ...(item.discount > 0 && {
              [item.discountType === 'percent' ? 'discount_percent' : 'discount_amount']: Number(item.discountInput),
              discount_reason: item.discountReason || 'Descuento aplicado en venta'
            })
          }))
        }
        const response = await createSale(saleData)
        if (response?.sale_id) {
          setCreatedSaleData({ id: response.sale_id, total: response.total_amount }); 
          setShowInstantCollection(true);
          // Los items se limpian cuando se cierra el InstantPaymentDialog o se deja pendiente
        }
      }
    } catch (error) { 
      toast.error('Error al procesar la venta') 
    } finally {
      setIsProcessingSale(false)
    }
  }

  const handleSelectProduct = async product => {
    const productId = product.id || product.product_id
    if (!productId) return
    try {
      setIsSearchingProducts(true)
      const details = await productService.getProductById(productId)
      setSelectedModalProduct(details)
      setProductSearchTerm(details.name)
      setShowProductDropdown(false)
    } catch (err) { toast.error('Error al cargar detalle del producto') } finally { setIsSearchingProducts(false) }
  }

  const handleSelectActiveSale = sale => {
    setActiveSale(sale); setShowActiveSaleModal(true)
  }

  const handleContinueSale = async () => {
    if (!activeSale) return
    const saleId = activeSale.sale_id || activeSale.id
    try {
      const res = await saleService.getSaleById(saleId)
      const details = res.data?.details || []
      const loadedItems = details.map(d => ({
        id: `PERSISTED-${d.id}`, detailId: d.id, productId: d.product_id, name: d.product_name,
        quantity: d.quantity, price: d.unit_price, discount: d.discount_amount || 0, isFromPendingSale: true
      }))
      setItems(prev => [...prev.filter(i => !i.isFromPendingSale), ...loadedItems])
      setCurrentSaleId(saleId); setShowActiveSaleModal(false)
    } catch (e) { toast.error('Error al cargar venta activa') }
  }

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-display'>
      <header className='flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2'>
        <div className='flex items-center gap-4'>
          <div className='size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-fluent-8'>
            <ShoppingCart size={28} />
          </div>
          <div>
            <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase leading-none'>Punto de Venta</h1>
            <p className='text-text-secondary text-sm font-medium mt-1'>Facturación y registro de operaciones</p>
          </div>
        </div>
        <div className='flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit'>
          {[
            { id: 'new-sale', label: 'Nueva Venta', icon: <Plus size={16} /> },
            { id: 'history', label: 'Historial', icon: <History size={16} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all',
              activeTab === tab.id ? 'bg-white dark:bg-surface-dark text-primary shadow-fluent-2' : 'text-text-secondary hover:text-text-main'
            )}>
              {tab.icon} <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className='w-full'>
        {activeTab === 'new-sale' && (
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            <div className='lg:col-span-8 space-y-4'>
              <article className='bg-white rounded-lg shadow-sm border overflow-hidden'>
                <header className='flex items-center justify-between px-4 py-3 border-b'>
                  <div className='flex items-center gap-2'>
                    <ShoppingCart size={18} className='text-primary' />
                    <h3 className='font-semibold'>Productos Seleccionados</h3>
                  </div>
                  <Button onClick={handleOpenModal} size='sm' className='gap-1.5'>
                    <Plus size={16} /> Agregar
                  </Button>
                </header>
                <div className='p-4 overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b text-xs uppercase text-slate-500'>
                        <th className='text-left py-2 px-3'>ID</th>
                        <th className='text-left py-2 px-3'>Producto</th>
                        <th className='text-right py-2 px-3'>Cant.</th>
                        <th className='text-right py-2 px-3'>Precio</th>
                        <th className='text-right py-2 px-3'>Desc.</th>
                        <th className='text-right py-2 px-3'>Total</th>
                        <th className='w-10'></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.length === 0 ? (
                        <tr><td colSpan={7} className='text-center py-8 text-slate-400'>Carrito vacío</td></tr>
                      ) : (
                        filteredItems.map(item => (
                          <tr key={item.id} className='border-b hover:bg-slate-50'>
                            <td className='py-2 px-3 text-slate-500'>{item.productId || '-'}</td>
                            <td className='py-2 px-3 font-medium'>
                              {item.isFromPendingSale && <Badge className='mr-2 bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[9px] uppercase'>Persistido</Badge>}
                              {item.name}
                            </td>
                            <td className='py-2 px-3 text-right'>{item.quantity}</td>
                            <td className='py-2 px-3 text-right'>{formatCurrency(item.price)}</td>
                            <td className='py-2 px-3 text-right text-red-500'>-{formatCurrency(item.discount)}</td>
                            <td className='py-2 px-3 text-right font-bold'>{formatCurrency(item.price * item.quantity - item.discount)}</td>
                            <td className='py-2 px-3 text-right'>
                              <Button variant='ghost' size='icon' onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className='size-8 text-slate-400 hover:text-red-500'><X size={14} /></Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className='bg-white rounded-lg shadow-sm border overflow-hidden'>
                <header className='flex items-center gap-2 px-4 py-3 border-b'>
                  <DollarSign size={18} className='text-primary' />
                  <h3 className='font-semibold'>Resumen</h3>
                </header>
                <div className='p-4 grid grid-cols-1 md:grid-cols-2 gap-8'>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'><span>Subtotal</span><span className='font-medium'>{formatCurrency(subtotal)}</span></div>
                    <div className='flex justify-between text-sm'><span>{taxSummaryLabel}</span><span className='font-medium'>{formatCurrency(taxes)}</span></div>
                    <div className='flex justify-between text-sm text-red-500'><span>Descuentos</span><span className='font-medium'>-{formatCurrency(lineDiscounts + generalDiscount)}</span></div>
                    <div className='pt-2 border-t flex justify-between items-end'>
                      <span className='text-base font-bold'>Total</span>
                      <span className='text-2xl font-black text-primary'>{formatCurrency(total)}</span>
                    </div>
                  </div>
                  <div className='flex flex-col justify-end gap-2'>
                    <Button onClick={handleSaveSale} disabled={isProcessingSale || items.length === 0} className='w-full h-12 text-base font-bold uppercase tracking-widest'>
                      {isProcessingSale ? 'Guardando...' : 'Confirmar Venta'}
                    </Button>
                    <Button variant='outline' onClick={() => setItems([])} className='w-full'>Limpiar Carrito</Button>
                  </div>
                </div>
              </article>
            </div>

            <aside className='lg:col-span-4 space-y-4'>
              <article className='bg-white rounded-lg shadow-sm border overflow-hidden p-4 space-y-4'>
                <div className='flex items-center gap-2 border-b pb-2 mb-2'>
                  <User size={18} className='text-primary' />
                  <h3 className='font-semibold'>Cliente</h3>
                </div>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400' />
                  <Input placeholder='Buscar cliente...' value={clientSearchTerm} onChange={e => setClientSearchTerm(e.target.value)} className='pl-9' />
                  {showClientDropdown && clients.length > 0 && (
                    <div className='absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto'>
                      {clients.map(c => (
                        <div key={c.id} onClick={() => handleSelectClient(c)} className='p-3 hover:bg-slate-50 cursor-pointer border-b last:border-none'>
                          <p className='font-bold text-sm'>{c.name}</p>
                          <p className='text-xs text-slate-500'>{c.document_id}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedClient && (
                  <div className='p-3 bg-primary/5 rounded border border-primary/10'>
                    <p className='font-black text-primary uppercase text-xs'>Cliente Seleccionado</p>
                    <p className='font-bold text-sm'>{selectedClient.name}</p>
                    <p className='text-xs text-slate-500'>{selectedClient.document_id}</p>
                  </div>
                )}
              </article>
            </aside>
          </div>
        )}

        {activeTab === 'history' && (
          <div className='space-y-4'>
            <article className='bg-white rounded-lg shadow-sm border p-4 space-y-4'>
              <div className='flex flex-wrap gap-4 items-end'>
                <div className='flex-1 min-w-[260px] space-y-1.5'>
                  <label className='text-xs font-bold uppercase text-slate-500'>Búsqueda rápida</label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400' />
                    <Input placeholder='Cliente o #Venta' value={historySearch} onChange={e => setHistorySearch(e.target.value)} className='pl-9' />
                  </div>
                </div>
                <div className='space-y-1.5'>
                  <label className='text-xs font-bold uppercase text-slate-500'>Desde</label>
                  <Input type='date' value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-xs font-bold uppercase text-slate-500'>Hasta</label>
                  <Input type='date' value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
                <div className='flex gap-2'>
                  <Button onClick={handleHistoryFilter} className='gap-2'><Filter size={16} /> Filtrar</Button>
                  <Button variant='outline' onClick={handleLoadLatest} className='gap-2'><History size={16} /> Ver Últimos</Button>
                  <Button variant='ghost' onClick={handleHistoryClear}><X size={16} /></Button>
                </div>
              </div>
              
              <div className='flex gap-2'>
                <Badge variant='outline' className='bg-slate-50 text-slate-600 font-black uppercase text-[10px] tracking-widest'>{sales.length} Registros</Badge>
              </div>

              <div className='overflow-x-auto border rounded-lg'>
                <table className='w-full text-sm'>
                  <thead className='bg-slate-50 border-b'>
                    <tr className='text-xs uppercase text-slate-500'>
                      <th className='text-left py-3 px-4'>ID</th>
                      <th className='text-left py-3 px-4'>Fecha</th>
                      <th className='text-left py-3 px-4'>Cliente</th>
                      <th className='text-right py-3 px-4'>Total</th>
                      <th className='text-center py-3 px-4'>Estado</th>
                      <th className='w-10'></th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleLoading ? (
                      <tr><td colSpan={6} className='py-12 text-center text-slate-400'>Cargando historial...</td></tr>
                    ) : filteredHistory.length === 0 ? (
                      <tr><td colSpan={6} className='py-12 text-center text-slate-400'>No se encontraron resultados</td></tr>
                    ) : (
                      filteredHistory.map((sale) => (
                        <tr key={sale.internalKey} className='border-b hover:bg-slate-50'>
                          <td className='py-3 px-4 font-mono font-bold text-primary'>#{sale.displayId}</td>
                          <td className='py-3 px-4 text-slate-600'>{formatDateTime(sale.date)}</td>
                          <td className='py-3 px-4 font-medium'>{sale.client_name}</td>
                          <td className='py-3 px-4 text-right font-bold'>{formatCurrency(sale.total_amount)}</td>
                          <td className='py-3 px-4 text-center'>
                            <Badge className={cn('uppercase text-[9px] font-black', STATUS_STYLES[sale.status.toLowerCase()]?.badge || 'bg-slate-100')}>
                              {STATUS_STYLES[sale.status.toLowerCase()]?.label || sale.status}
                            </Badge>
                          </td>
                          <td className='py-3 px-4 text-right'>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant='ghost' size='icon' className='size-8'><MoreVertical size={16} /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align='end' className='w-48'>
                                <DropdownMenuItem onClick={() => handleViewSale(sale)} className='gap-2'><Eye size={14} /> Ver Detalle</DropdownMenuItem>
                                {sale.status !== 'CANCELLED' && (
                                  <DropdownMenuItem onClick={() => handleCancelSale(sale)} className='gap-2 text-red-600 focus:text-red-600'><Ban size={14} /> Anular Venta</DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        )}
      </main>

      {/* Modals */}
      {isModalOpen && (
        <div className='fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
          <Card className='w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200'>
            <CardHeader className='flex flex-row items-center justify-between border-b bg-slate-50/50'>
              <div>
                <CardTitle className='text-lg font-black uppercase tracking-tighter'>{editingItemId ? 'Editar Producto' : 'Agregar Producto'}</CardTitle>
                <CardDescription className='text-[10px] font-bold uppercase'>Selección de artículos para facturación</CardDescription>
              </div>
              <Button variant='ghost' size='icon' onClick={() => setIsModalOpen(false)}><X size={18} /></Button>
            </CardHeader>
            <CardContent className='p-6 space-y-6'>
              <div className='space-y-4'>
                <div className='relative' ref={productSearchContainerRef}>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400' />
                  <Input ref={modalProductInputRef} placeholder='Buscar por nombre o SKU...' value={productSearchTerm} onChange={e => setProductSearchTerm(e.target.value)} className='pl-9 h-11' />
                  {showProductDropdown && modalSearchResults.length > 0 && (
                    <div ref={productDropdownRef} className='absolute z-50 w-full mt-1 bg-white border rounded-md shadow-xl max-h-60 overflow-y-auto'>
                      {modalSearchResults.map((p, i) => {
                        const d = getProductDisplay(p)
                        return (
                          <div key={d.id} id={`sales-product-option-${i}`} onClick={() => handleSelectProduct(p)} className='p-3 hover:bg-primary/5 cursor-pointer border-b last:border-none flex justify-between items-center'>
                            <div><p className='font-bold text-sm'>{d.name}</p><p className='text-xs text-slate-500'>SKU: {d.sku}</p></div>
                            <div className='text-right'><p className='font-black text-primary'>{formatCurrency(d.price)}</p><p className={cn('text-[10px] font-bold uppercase', d.stock > 0 ? 'text-success' : 'text-error')}>Stock: {d.stock}</p></div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {modalProduct && (
                  <div className='grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200'>
                    <div className='space-y-4'>
                      <div className='space-y-1.5'>
                        <label className='text-[10px] font-black uppercase text-slate-500 tracking-widest'>Cantidad</label>
                        <Input type='number' value={modalQuantity} onChange={e => setModalQuantity(e.target.value)} min='1' className='h-11 font-bold text-lg' />
                      </div>
                      <div className='space-y-1.5'>
                        <label className='text-[10px] font-black uppercase text-slate-500 tracking-widest'>Descuento</label>
                        <div className='flex gap-2'>
                          <Input type='number' value={modalDiscount} onChange={e => setModalDiscount(e.target.value)} className='h-11 font-bold' />
                          <Select value={modalDiscountType} onValueChange={setModalDiscountType}>
                            <SelectTrigger className='w-24 h-11'><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value='amount'>Gs</SelectItem><SelectItem value='percent'>%</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className='flex flex-col justify-between items-end text-right border-l pl-6'>
                      <div className='space-y-1'>
                        <p className='text-[10px] font-black uppercase text-slate-400'>Precio Unitario</p>
                        <p className='font-bold text-lg'>{formatCurrency(modalUnitPrice)}</p>
                      </div>
                      <div className='space-y-1'>
                        <p className='text-[10px] font-black uppercase text-red-400'>Descuento Línea</p>
                        <p className='font-bold text-red-500'>-{formatCurrency(modalDiscountValue)}</p>
                      </div>
                      <div className='space-y-1 pt-2 border-t w-full'>
                        <p className='text-[10px] font-black uppercase text-primary'>Total de Línea</p>
                        <p className='font-black text-2xl text-primary'>{formatCurrency(modalLineTotal)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className='flex justify-end gap-3'>
                <Button variant='outline' onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleConfirmAdd} disabled={!modalProduct} className='px-8 font-bold uppercase tracking-widest'>Confirmar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showCancelSaleModal && selectedHistorySale && (
        <div className='fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
          <Card className='w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200'>
            <CardHeader className='border-b bg-red-50'>
              <CardTitle className='text-red-600 flex items-center gap-2'><Ban size={20} /> Anular Venta #{selectedHistorySale.sale_id || selectedHistorySale.id}</CardTitle>
            </CardHeader>
            <CardContent className='p-6 space-y-4'>
              <p className='text-sm text-slate-600'>¿Estás seguro de anular esta venta? Esta acción revertirá el stock y los cobros realizados.</p>
              {cancelPreview && (
                <div className='p-3 bg-slate-50 rounded border text-xs space-y-1'>
                  <p className='font-bold uppercase text-[10px] text-slate-400'>Impacto Estimado</p>
                  <div className='flex justify-between'><span>Cobros a revertir:</span><span className='font-bold'>{cancelPreview.impact_analysis?.payments_to_cancel || 0}</span></div>
                  <div className='flex justify-between'><span>Monto total:</span><span className='font-bold'>{formatCurrency(cancelPreview.impact_analysis?.total_to_reverse || 0)}</span></div>
                </div>
              )}
              <div className='space-y-1.5'>
                <label className='text-xs font-bold uppercase text-slate-500'>Motivo de anulación</label>
                <Input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder='Ej: Error en facturación, devolución...' />
              </div>
              <div className='flex gap-3 pt-2'>
                <Button variant='outline' onClick={() => setShowCancelSaleModal(false)} className='flex-1'>Cancelar</Button>
                <Button onClick={handleConfirmCancelSale} disabled={cancelSubmitting} className='flex-1 bg-red-600 hover:bg-red-700 text-white font-bold'>{cancelSubmitting ? 'Anulando...' : 'Sí, Anular'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showInstantCollection && createdSaleData && (
        <InstantPaymentDialog
          open={showInstantCollection}
          onOpenChange={setShowInstantCollection}
          isSale={true}
          totalAmount={createdSaleData.total}
          currency='PYG'
          paymentMethods={paymentMethods}
          onSubmit={async (data) => {
            try {
              await salePaymentService.processSalePaymentWithCashRegister({
                sales_order_id: createdSaleData.id,
                amount_received: data.amount_received || data.amount,
                payment_method_id: data.paymentMethodId,
                payment_notes: data.notes || null,
              })
              setShowInstantCollection(false); setCreatedSaleData(null); setItems([]); toast.success('Cobro registrado exitosamente')
            } catch (e) { toast.error('Error al registrar cobro') }
          }}
          onLeavePending={() => {
            setShowInstantCollection(false); setCreatedSaleData(null); setItems([]); toast.success('Venta guardada como pendiente')
          }}
        />
      )}

      {showActiveSaleModal && (
        <div className='fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
          <Card className='w-full max-w-lg'>
            <CardHeader className='border-b'>
              <CardTitle>Venta Pendiente Encontrada</CardTitle>
              <CardDescription>El cliente ya tiene una venta activa. ¿Deseas continuarla?</CardDescription>
            </CardHeader>
            <CardContent className='p-6 space-y-4'>
              <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
                <p className='text-sm font-bold text-amber-800'>Venta #{activeSale?.sale_id || activeSale?.id}</p>
                <p className='text-xs text-amber-700'>Monto: {formatCurrency(activeSale?.total_amount)}</p>
              </div>
              <div className='flex gap-3'>
                <Button variant='outline' onClick={() => setShowActiveSaleModal(false)} className='flex-1'>Iniciar Nueva</Button>
                <Button onClick={handleContinueSale} className='flex-1'>Continuar Existente</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  )
}

export default SalesNew
