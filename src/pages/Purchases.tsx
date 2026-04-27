import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  Plus,
  Calendar,
  MoreVertical,
  Eye,
  Ban,
  Package,
  AlertCircle,
  ShoppingCart,
  Check,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import useDashboardStore from '@/store/useDashboardStore'
import useAuthStore from '@/store/useAuthStore'
import supplierService from '@/services/supplierService'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { CurrencyService } from '@/services/currencyService'
import { productService } from '@/services/productService'
import purchaseService from '@/services/purchaseService'
import {
  fetchPurchasesBySupplierTerm,
  purchasePaymentsMvpService,
} from '@/services/purchasePaymentsMvpService'
import InstantPaymentDialog from '@/components/ui/InstantPaymentDialog'
import { normalizeCurrencyCode, formatCurrency, formatNumber } from '@/utils/currencyUtils'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/ToastContainer'
import { calculatePurchaseSalePriceGs, calculateProfitMargin } from '@/domain/purchase/pricing/purchasePricingPolicy'
import { PurchaseWithFullDetails } from '@/types'

/**
 * Purchases Page - Fluent Design System 2
 * Refactored with Tailwind CSS using Fluent 2 design tokens.
 * Modal optimized for low-height desktop screens (720p+).
 */
const Purchases = () => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const toast = useToast()
  const { fetchDashboardData } = useDashboardStore()
  const { user } = useAuthStore()

  // Business Logic States
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseWithFullDetails[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('nueva-compra')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [searchType, setSearchType] = useState<string>('date')

  // Supplier States
  const [supplierSearch, setSupplierSearch] = useState<string>('')
  const [supplierResults, setSupplierResults] = useState<any[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [searchingSuppliers, setSearchingSuppliers] = useState<boolean>(false)
  const supplierSearchRef = useRef<HTMLDivElement>(null)

  // Payment Details States
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [paymentCurrency, setPaymentCurrency] = useState<string>('PYG')
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])

  // Product Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [modalProductSearch, setModalProductSearch] = useState<string>('')
  const [modalProductResults, setModalProductResults] = useState<any[]>([])
  const [modalSelectedProduct, setModalSelectedProduct] = useState<any>(null)
  const [searchingProducts, setSearchingProducts] = useState<boolean>(false)
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false)
  const [modalQuantity, setModalQuantity] = useState<string | number>('')
  const [modalUnitPrice, setModalUnitPrice] = useState<string | number>('')
  const [modalProfitPct, setModalProfitPct] = useState<number>(30)
  const [modalSalePrice, setModalSalePrice] = useState<number>(0)
  const [pricingMode, setPricingMode] = useState<string>('margin')
  const [modalTaxRateId, setModalTaxRateId] = useState<number | null>(null)
  const [modalTaxRatePercent, setModalTaxRatePercent] = useState<number>(0)
  const [modalPriceIncludesTax, setModalPriceIncludesTax] = useState<boolean>(true)
  const [taxRates, setTaxRates] = useState<any[]>([])
  const [purchaseItems, setPurchaseItems] = useState<any[]>([])
  const [purchaseNotes, setPurchaseNotes] = useState<string>('')
  const modalProductSearchRef = useRef<HTMLInputElement>(null)
  const productDropdownRef = useRef<HTMLDivElement>(null)
  const [activeProductIndex, setActiveProductIndex] = useState<number>(-1)

  // UI Support States
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null)
  const [showCancelPreview, setShowCancelPreview] = useState<boolean>(false)
  const [cancelPreviewData, setCancelPreviewData] = useState<any>(null)
  const [orderToCancel, setOrderToCancel] = useState<any>(null)
  const [showInstantPayment, setShowInstantPayment] = useState<boolean>(false)
  const [createdOrderData, setCreatedOrderData] = useState<any>(null)

  const fixMojibakeText = value => {
    if (value === null || value === undefined) return ''

    let text = String(value)
    const replacements = [
      ['Ã¡', 'á'],
      ['Ã©', 'é'],
      ['Ã­', 'í'],
      ['Ã³', 'ó'],
      ['Ãº', 'ú'],
      ['Ã¼', 'ü'],
      ['Ã±', 'ñ'],
      ['Ã', 'Á'],
      ['Ã‰', 'É'],
      ['Ã', 'Í'],
      ['Ã“', 'Ó'],
      ['Ãš', 'Ú'],
      ['Ã‘', 'Ñ'],
      ['Ãœ', 'Ü'],
      ['├¡', 'á'],
      ['├⌐', 'é'],
      ['├í', 'í'],
      ['├│', 'ó'],
      ['├║', 'ú'],
      ['├╝', 'ü'],
      ['├▒', 'ñ'],
      ['┬', ''],
    ]

    replacements.forEach(([broken, fixed]) => {
      text = text.split(broken).join(fixed)
    })

    return text.replace(/\s+/g, ' ').trim()
  }

  const getProductName = product =>
    fixMojibakeText(
      product?.name || product?.product_name || product?.description || '',
    )

  const getPaymentMethodLabel = method =>
    fixMojibakeText(
      method?.description ||
        method?.method_code ||
        `Método ${method?.id || ''}`,
    )

  const getCurrencyLabel = currency =>
    fixMojibakeText(
      currency?.currency_name ||
        currency?.name ||
        currency?.description ||
        currency?.currency_code ||
        '',
    )

  // Filtering Logic
  const filteredModalProducts = useMemo(() => {
    if (!modalProductResults) return []
    const existingProductIds = new Set(
      purchaseItems.map(item => item.product_id),
    )
    return modalProductResults.filter(
      product => !existingProductIds.has(product.id || product.product_id),
    )
  }, [modalProductResults, purchaseItems])

  useEffect(() => {
    if (!showProductDropdown || filteredModalProducts.length === 0) {
      setActiveProductIndex(-1)
      return
    }
    setActiveProductIndex(0)
  }, [showProductDropdown, filteredModalProducts])

  useEffect(() => {
    if (
      !showProductDropdown ||
      activeProductIndex < 0 ||
      !productDropdownRef.current
    ) {
      return
    }

    const activeElement = productDropdownRef.current.querySelector(
      `[data-product-index="${activeProductIndex}"]`,
    )

    activeElement?.scrollIntoView({ block: 'nearest' })
  }, [activeProductIndex, showProductDropdown])

  const getInclusiveEndDate = dateValue => {
    if (!dateValue) return dateValue

    const parsedDate = new Date(`${dateValue}T00:00:00`)
    if (Number.isNaN(parsedDate.getTime())) {
      return dateValue
    }

    parsedDate.setDate(parsedDate.getDate() + 1)
    return parsedDate.toISOString().split('T')[0]
  }

  const mergePurchaseOrdersById = (baseOrders: any[] = [], incomingOrders: any[] = []) => {
    const mergedOrders = [...baseOrders]
    const knownIds = new Set(
      baseOrders
        .map(orderData => orderData?.purchase?.id ?? orderData?.id)
        .filter(Boolean)
        .map(id => String(id)),
    )

    incomingOrders.forEach(orderData => {
      const orderId = orderData?.purchase?.id ?? orderData?.id

      if (!orderId) {
        mergedOrders.push(orderData)
        return
      }

      const normalizedId = String(orderId)
      if (!knownIds.has(normalizedId)) {
        mergedOrders.push(orderData)
        knownIds.add(normalizedId)
      }
    })

    return mergedOrders
  }

  const fetchPurchaseOrdersByDateRange = async (fromDate, toDate) => {
    const pageSize = 200
    const maxPages = 20
    const effectiveEndDate = getInclusiveEndDate(toDate)

    let currentPage = 1
    let aggregatedOrders: any[] = []

    while (currentPage <= maxPages) {
      const pageResponse = await purchaseService.getPurchasesByDateRange(
        fromDate,
        effectiveEndDate,
        currentPage,
        pageSize,
        { showInactiveSuppliers: true },
      )

      if (!pageResponse?.success) {
        throw new Error(pageResponse?.error || 'No se pudo obtener compras')
      }

      const pageData = Array.isArray(pageResponse?.data)
        ? pageResponse.data
        : []
      const previousCount = aggregatedOrders.length
      aggregatedOrders = mergePurchaseOrdersById(aggregatedOrders, pageData)

      const hasNextFromMeta =
        pageResponse?.pagination?.hasNext === true ||
        pageResponse?.pagination?.has_next === true ||
        pageResponse?.pagination?.hasMore === true

      const totalPages = Number(pageResponse?.pagination?.totalPages)
      const hasNextByTotalPages =
        Number.isFinite(totalPages) && totalPages > 0
          ? currentPage < totalPages
          : false

      const hasNextByPageSize = pageData.length >= pageSize

      const shouldContinue =
        hasNextFromMeta || hasNextByTotalPages || hasNextByPageSize

      if (!shouldContinue) {
        break
      }

      if (pageData.length === 0 || aggregatedOrders.length === previousCount) {
        break
      }

      currentPage += 1
    }

    return aggregatedOrders
  }

  // Data Loading Hooks
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const end = new Date().toISOString().split('T')[0]
        const start = new Date(new Date().setDate(new Date().getDate() - 30))
          .toISOString()
          .split('T')[0]
        setStartDate(start)
        setEndDate(end)

        const [orders, methods, currs, taxes] = await Promise.all([
          fetchPurchaseOrdersByDateRange(start, end),
          PaymentMethodService.getAll(),
          CurrencyService.getAll(),
          purchaseService.getTaxRates(1, 100),
        ])

        setPurchaseOrders(Array.isArray(orders) ? orders : [])
        setPaymentMethods(methods || [])
        setCurrencies(currs || [])
        if (taxes.success) setTaxRates(taxes.data || [])

        // Set Defaults
        const cash = (methods || []).find(
          m =>
            m.method_code?.toUpperCase() === 'CASH' ||
            m.description?.toLowerCase().includes('efectivo'),
        )
        if (cash) setPaymentMethod(String(cash.id))
        const base = (currs || []).find(c => c.is_base_currency)
        if (base) setPaymentCurrency(base.currency_code)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Search Hooks
  useEffect(() => {
    if (!supplierSearch || supplierSearch.length < 2) {
      setSupplierResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchingSuppliers(true)
      try {
        const res = await supplierService.searchByName(supplierSearch)
        setSupplierResults(Array.isArray(res) ? res : res.data || [])
      } finally {
        setSearchingSuppliers(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [supplierSearch])

  useEffect(() => {
    if (!modalProductSearch.trim() || modalProductSearch.trim().length < 2) {
      setModalProductResults([])
      setShowProductDropdown(false)
      return
    }
    const timer = setTimeout(async () => {
      setSearchingProducts(true)
      setShowProductDropdown(true)
      try {
        const res = await productService.searchProductsInfo(
          modalProductSearch.trim(),
          { limit: 10 },
        )
        setModalProductResults(
          (Array.isArray(res) ? res : []).filter(p => p.state !== false),
        )
      } finally {
        setSearchingProducts(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [modalProductSearch])

  // Pricing Derivations
  const effectiveSalePrice = useMemo(() => {
    const cost = Number(modalUnitPrice) || 0
    return pricingMode === 'margin'
      ? calculatePurchaseSalePriceGs(cost, Number(modalProfitPct))
      : Number(modalSalePrice)
  }, [pricingMode, modalUnitPrice, modalProfitPct, modalSalePrice])

  const effectiveProfitPct = useMemo(() => {
    const cost = Number(modalUnitPrice) || 0
    if (pricingMode === 'sale_price' && cost > 0) {
      return calculateProfitMargin(cost, Number(modalSalePrice))
    }
    return Number(modalProfitPct)
  }, [pricingMode, modalUnitPrice, modalSalePrice, modalProfitPct])

  const purchaseTotals = useMemo(() => {
    return purchaseService.calculatePurchaseTotals(
      purchaseItems.map(item => ({
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        tax_rate: item.tax_rate / 100,
        price_includes_tax: item.price_includes_tax !== false
      })),
      0
    )
  }, [purchaseItems])

  // Handlers
  const handleSupplierSelect = s => {
    setSelectedSupplier(s)
    setSupplierSearch(s.name || '')
    setSupplierResults([])
  }

  const handleProductSelect = async (p: any) => {
    const productId = p.id || p.product_id;
    if (!productId) return;

    try {
      setSearchingProducts(true);
      const fullProduct = await productService.getProductForPurchase(productId);
      
      const normalizedProduct = {
        ...fullProduct,
        id: fullProduct.product_id || fullProduct.id,
        name: getProductName(fullProduct),
        sku: fullProduct.barcode || fullProduct.sku || '-',
        unit: fullProduct.base_unit || fullProduct.unit || 'unit',
        cost_price: Number(fullProduct.purchase_price || fullProduct.unit_cost || 0),
        stock: Number(fullProduct.stock_quantity || fullProduct.stock || 0),
      };

      setModalSelectedProduct(normalizedProduct);
      setModalProductSearch(normalizedProduct.name || '');
      setShowProductDropdown(false);

      const cost = normalizedProduct.cost_price || 0;
      setModalUnitPrice(cost);
      
      // Default pricing: cost * (1 + 0.3)
      setModalSalePrice(Math.ceil((cost * 1.3) / 50) * 50);

      const taxInfo = fullProduct.tax?.rate || fullProduct.applicable_tax_rate;
      if (taxInfo) {
        setModalTaxRateId(taxInfo.id);
        setModalTaxRatePercent(taxInfo.rate || 0);
      }
    } catch (err: any) {
      toast.toast({
        title: 'Error',
        description: 'No se pudo cargar el detalle del producto para compra',
        variant: 'destructive',
      });
    } finally {
      setSearchingProducts(false);
    }
  };

  const handleModalProductSearchKeyDown = event => {
    if (!filteredModalProducts.length) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setShowProductDropdown(true)
      setActiveProductIndex(prev =>
        prev < filteredModalProducts.length - 1 ? prev + 1 : 0,
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setShowProductDropdown(true)
      setActiveProductIndex(prev =>
        prev > 0 ? prev - 1 : filteredModalProducts.length - 1,
      )
      return
    }

    if (
      event.key === 'Enter' &&
      showProductDropdown &&
      activeProductIndex >= 0
    ) {
      event.preventDefault()
      handleProductSelect(filteredModalProducts[activeProductIndex])
      return
    }

    if (event.key === 'Escape') {
      setShowProductDropdown(false)
      setActiveProductIndex(-1)
    }
  }

  const handleConfirmAddProduct = () => {
    if (!modalSelectedProduct || !modalQuantity || !modalUnitPrice) return
    const productId = modalSelectedProduct.id || modalSelectedProduct.product_id
    const itemData = {
      product_id: productId,
      name: modalSelectedProduct.name || modalSelectedProduct.product_name,
      sku: modalSelectedProduct.sku || '-',
      quantity: Number(modalQuantity),
      unit_price: Number(modalUnitPrice),
      unit: modalSelectedProduct.unit || 'unit',
      profit_pct: pricingMode === 'margin' ? Number(modalProfitPct) : effectiveProfitPct,
      explicit_sale_price: pricingMode === 'sale_price' ? Number(modalSalePrice) : undefined,
      sale_price: effectiveSalePrice,
      pricing_mode: pricingMode,
      tax_rate_id: modalTaxRateId,
      tax_rate: modalTaxRatePercent,
      price_includes_tax: modalPriceIncludesTax, // API v2.6
    }
    if (editingItemId)
      setPurchaseItems(prev =>
        prev.map(i => (i.id === editingItemId ? { ...itemData, id: i.id } : i)),
      )
    else
      setPurchaseItems(prev => [
        ...prev,
        { ...itemData, id: `item-${Date.now()}` },
      ])
    setIsModalOpen(false)
    setEditingItemId(null)
    setModalQuantity('')
    setModalUnitPrice('')
    setModalSelectedProduct(null)
    setModalProductSearch('')
    setModalPriceIncludesTax(true)
  }

  const handleSavePurchase = async () => {
    if (!selectedSupplier || purchaseItems.length === 0) return
    setLoading(true)
    try {
      const orderData = {
        supplier_id: selectedSupplier.id,
        status: 'COMPLETED',
        order_details: purchaseItems.map(i => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          unit: (i.unit || 'unit').toLowerCase(),
          profit_pct: i.pricing_mode === 'margin' ? Number(i.profit_pct) : undefined,
          explicit_sale_price: i.pricing_mode === 'sale_price' ? Number(i.explicit_sale_price || i.sale_price) : undefined,
          tax_rate_id: i.tax_rate_id,
          price_includes_tax: i.price_includes_tax !== false,
          metadata: {
            pricing_mode: i.pricing_mode,
            original_profit_pct: i.profit_pct,
            original_sale_price: i.sale_price
          }
        })),
        auto_update_prices: true,
        metadata: {
          purchase_notes: purchaseNotes,
          system_version: '1.1.0-frontend',
          operator_id: user?.id || user?.user_id
        },
      }
      const result =
        await purchaseService.createEnhancedPurchaseOrder(orderData)
      if (result.success) {
        setPurchaseItems([])
        setPurchaseNotes('')
        // Manejar advertencias si existen (API v2.6 / v1.1)
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            console.warn('Purchase Warning:', warning)
            const productName = warning.product_name || warning.name || 'Producto';
            const observedRate = warning.observed_tax_rate || warning.tax_rate;
            toast.warning(
              `Advertencia Fiscal: ${productName} tiene una tasa de IVA observada de ${observedRate}% diferente a la esperada.`,
              { duration: 6000 }
            )
          })
        }

        const selectedPaymentMethod = paymentMethods.find(
          method => String(method.id) === String(paymentMethod),
        )

        setCreatedOrderData({
          id: result.purchase_order_id,
          totalAmount: purchaseItems.reduce(
            (s, i) => s + i.quantity * i.unit_price,
            0,
          ),
          currencyCode: paymentCurrency,
          paymentMethodId: paymentMethod ? Number(paymentMethod) : null,
          paymentMethodLabel: selectedPaymentMethod
            ? getPaymentMethodLabel(selectedPaymentMethod)
            : null,
        })
        setShowInstantPayment(true)
        fetchDashboardData()
      } else {
        // Manejar errores de validación (API v2.7)
        toast.error(
          result.message || result.error || 'Error al guardar la compra',
        )
      }
    } catch (err) {
      console.error('Error in handleSavePurchase:', err)
      toast.error('Error inesperado al procesar la compra')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmCancellation = async () => {
    if (!orderToCancel) return
    setLoading(true)
    setShowCancelPreview(false)
    try {
      const result = await purchaseService.cancelPurchaseOrderWithDetails({
        purchase_order_id: orderToCancel.id,
        user_id: user?.id || user?.user_id || user?.role_id || 'system',
        cancellation_reason: 'ANULADO_POR_USUARIO',
        force_cancel: false,
      })
      if (result.success) {
        const preserved =
          result.data?.cancellation_details?.tax_warnings_preserved || 0
        if (preserved > 0) {
          toast.info(
            `Orden anulada. Se preservaron ${preserved} registros de discrepancia fiscal para auditoría.`,
          )
        } else {
          toast.success('Orden de compra anulada exitosamente.')
        }
        setPurchaseOrders(prev =>
          prev.map(o => {
            const ord = o.purchase || o
            return ord.id === orderToCancel.id
              ? {
                  ...o,
                  purchase: { ...ord, status: 'CANCELLED' },
                  status: 'CANCELLED',
                }
              : o
          }),
        )
        fetchDashboardData()
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = d => (d ? new Date(d).toLocaleDateString('es-PY') : '-')

  // Helper functions for status display
  const getStatusText = status => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Pendiente'
      case 'APPROVED':
        return 'Aprobada'
      case 'RECEIVED':
        return 'Recibida'
      case 'COMPLETED':
        return 'Completada'
      case 'CANCELLED':
        return 'Cancelada'
      default:
        return status || 'Desconocido'
    }
  }

  const handleFilter = async () => {
    setLoading(true)
    setError(null)

    try {
      if (searchType === 'supplier' && searchTerm.trim()) {
        const response = await fetchPurchasesBySupplierTerm(searchTerm.trim(), {
          showInactiveSuppliers: true,
        })

        if (!response?.success) {
          throw new Error(response?.error || 'No se pudo filtrar compras')
        }

        setPurchaseOrders(Array.isArray(response.data) ? response.data : [])
      } else {
        const defaultEnd = new Date().toISOString().split('T')[0]
        const defaultStart = new Date(
          new Date().setDate(new Date().getDate() - 30),
        )
          .toISOString()
          .split('T')[0]

        const effectiveStart = startDate || defaultStart
        const effectiveEnd = endDate || defaultEnd

        const orders = await fetchPurchaseOrdersByDateRange(
          effectiveStart,
          effectiveEnd,
        )
        setPurchaseOrders(Array.isArray(orders) ? orders : [])
      }
    } catch (filterError) {
      setError(filterError.message || 'Error al filtrar compras')
      setPurchaseOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewPurchase = order => {
    const orderId = order.id || order.purchase_id
    if (orderId) {
      navigate(`/pagos-compras/${orderId}`)
    }
  }

  const handleCancelPurchase = async order => {
    setOrderToCancel(order)
    setLoading(true)

    try {
      const previewResult =
        await purchaseService.previewPurchaseOrderCancellation(order.id)
      if (previewResult?.success) {
        setCancelPreviewData(
          previewResult.data || { purchase_info: { id: order.id } },
        )
      } else {
        setCancelPreviewData({ purchase_info: { id: order.id } })
      }
    } catch {
      setCancelPreviewData({ purchase_info: { id: order.id } })
    } finally {
      setLoading(false)
      setShowCancelPreview(true)
    }
  }

  const handleEditItem = item => {
    setEditingItemId(item.id)
    setModalSelectedProduct({
      id: item.product_id,
      name: item.name,
      sku: item.sku,
      unit: item.unit,
      cost_price: item.unit_price,
    })
    setModalQuantity(item.quantity)
    setModalUnitPrice(item.unit_price)
    setModalProfitPct(item.profit_pct)
    setModalSalePrice(item.sale_price)
    setPricingMode(item.pricing_mode)
    setModalTaxRateId(item.tax_rate_id)
    setModalPriceIncludesTax(item.price_includes_tax !== false)
    setIsModalOpen(true)
  }

  const handleInstantPaymentConfirm = async paymentPayload => {
    try {
      const orderId = paymentPayload?.orderId || createdOrderData?.id
      
      await purchasePaymentsMvpService.registerPayment(
        orderId,
        {
          amount: paymentPayload?.amount,
          paymentMethodId: paymentPayload?.paymentMethodId,
          currencyCode: paymentPayload?.currencyCode || paymentCurrency,
          notes: paymentPayload?.notes || null,
        },
      )

      // [INTEGRACION] El endpoint /purchase/{id}/status no existe actualmente en el backend (404).
      // Se comenta la llamada para evitar que el flujo de pago falle. 
      // El estado debería ser gestionado por el backend tras el registro del pago.
      /*
      try {
        await purchaseService.updatePurchaseOrderStatus(orderId, 'COMPLETED', 'Pago inicial registrado tras creación')
      } catch (statusError) {
        console.warn('Could not update order status to COMPLETED:', statusError)
      }
      */

      toast.success('Pago registrado correctamente')
      setShowInstantPayment(false)
      setActiveTab('historial')
      await handleFilter()
    } catch (paymentError) {
      const message = paymentError?.message || 'No se pudo registrar el pago'
      setError(message)
      toast.error(message)
    }
  }

  const handleLeavePurchasePending = () => {
    setShowInstantPayment(false)
    setActiveTab('historial')
    handleFilter()
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
            <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase leading-none'>
              {t('purchases.management.title', 'Gestión de Compras')}
            </h1>
            <p className='text-text-secondary text-sm font-medium mt-1'>
              {t('purchases.management.subtitle', 'Abastecimiento y órdenes de compra a proveedores')}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit'>
          {[
            { id: 'nueva-compra', label: 'Nueva Orden', icon: <Plus size={16} /> },
            { id: 'historial', label: 'Historial', icon: <History size={16} /> },
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
        {error && (
          <div className='mb-6 p-4 bg-error/5 border border-error/20 rounded-xl flex items-center gap-3'>
            <AlertCircle className="text-error" size={18} />
            <p className='text-xs font-bold text-error uppercase tracking-wider'>{error}</p>
          </div>
        )}

        {activeTab === 'nueva-compra' && (
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6'>
            {/* Left Column: Items & Summary */}
            <div className='lg:col-span-8 space-y-4 md:space-y-6'>
              {/* Products Table Card - Fluent 2 Card */}
              <section className='bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] overflow-hidden'>
                <div className='px-5 py-4 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] flex flex-col sm:flex-row justify-between items-center bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] gap-3'>
                  <div>
                    <h3 className='text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                      Productos en la Orden
                    </h3>
                    <p className='text-xs text-[var(--fluent-text-secondary,#605E5C)] mt-0.5'>
                      Artículos a ingresar al inventario
                    </p>
                  </div>
                  <button
                    className='w-full sm:w-auto bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white px-4 py-2 rounded-[var(--fluent-corner-radius-medium,4px)] font-semibold text-sm shadow-[var(--fluent-shadow-2)] active:scale-[0.98] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] flex items-center justify-center gap-2'
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    Agregar Artículo
                  </button>
                </div>

                <div className='overflow-x-auto'>
                  <table className='w-full text-left border-collapse min-w-[800px]'>
                    <thead className='bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] text-xs font-semibold text-[var(--fluent-text-secondary,#605E5C)]'>
                      <tr>
                        <th className='px-4 py-3'>ID / SKU</th>
                        <th className='px-4 py-3'>Producto</th>
                        <th className='px-4 py-3 text-center'>{t('purchases.form.quantity', 'Cant.')}</th>
                        <th className='px-4 py-3 text-right'>{t('purchases.form.unit_price', 'Costo Unit.')}</th>
                        <th className='px-4 py-3 text-right'>{t('purchases.form.profit_margin', 'Margen')}</th>
                        <th className='px-4 py-3 text-right'>{t('purchases.form.subtotal', 'Subtotal')}</th>
                        <th className='px-4 py-3 text-right'>{t('purchases.modal.sale_price', 'Venta Esp.')}</th>
                        <th className='px-4 py-3 w-12'></th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-[var(--fluent-border-neutral,#E1DFDD)] dark:divide-[var(--fluent-neutral-grey-140,#484644)]'>
                      {purchaseItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className='py-12 text-center'>
                            <div className='flex flex-col items-center gap-2 text-[var(--fluent-text-tertiary,#8A8886)]'>
                              <Package size={32} strokeWidth={1.5} />
                              <p className='text-sm'>
                                {t('purchases.form.no_products', 'No hay artículos seleccionados')}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        purchaseItems.map(item => (
                          <tr
                            key={item.id}
                            className='hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] transition-colors duration-[duration:var(--fluent-duration-faster,100ms)] group/row'
                            onDoubleClick={() => handleEditItem(item)}
                          >
                            <td className='px-4 py-3'>
                              <div className='text-xs font-mono text-[var(--fluent-text-secondary,#605E5C)]'>
                                #{item.product_id}
                              </div>
                              <div className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                                {item.sku}
                              </div>
                            </td>
                            <td className='px-4 py-3'>
                              <div className='font-semibold text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white group-hover/row:text-[var(--fluent-brand-primary,#0078D4)] transition-colors'>
                                {item.name}
                              </div>
                              <div className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                                Unidad: {item.unit}
                              </div>
                            </td>
                            <td className='px-4 py-3 text-center font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                              {formatNumber(item.quantity)}
                            </td>
                            <td className='px-4 py-3 text-right text-sm text-[var(--fluent-text-secondary,#605E5C)]'>
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className='px-4 py-3 text-right font-semibold text-[var(--fluent-semantic-success,#107C10)]'>
                              {item.profit_pct.toFixed(1)}%
                            </td>
                            <td className='px-4 py-3 text-right font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                              {formatCurrency(item.unit_price * item.quantity)}
                            </td>
                            <td className='px-4 py-3 text-right'>
                              <div className='font-semibold text-[var(--fluent-brand-primary,#0078D4)]'>
                                {formatCurrency(
                                  item.sale_price * item.quantity,
                                )}
                              </div>
                              <div className='text-[10px] text-[var(--fluent-semantic-success,#107C10)]'>
                                +
                                {formatCurrency(
                                  (item.sale_price - item.unit_price) *
                                    item.quantity,
                                )}
                              </div>
                            </td>
                            <td className='px-4 py-3 text-right'>
                              <button
                                onClick={() =>
                                  setPurchaseItems(prev =>
                                    prev.filter(i => i.id !== item.id),
                                  )
                                }
                                className='p-1.5 text-[var(--fluent-text-tertiary,#8A8886)] hover:text-[var(--fluent-semantic-danger,#D13438)] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[var(--fluent-corner-radius-medium,4px)] transition-all'
                              >
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Purchase Totals Card - Fluent 2 */}
              <section className='bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] p-5'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-3'>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-[var(--fluent-text-secondary,#605E5C)]'>
                        Artículos Totales
                      </span>
                      <span className='font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] px-2.5 py-0.5 rounded-[var(--fluent-corner-radius-medium,4px)]'>
                        {purchaseItems.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                    </div>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-[var(--fluent-text-secondary,#605E5C)]'>
                        Total Compra
                      </span>
                      <span className='text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                        {formatCurrency(purchaseTotals.subtotal)}
                      </span>
                    </div>

                    {/* Liquidación IVA Breakdown */}
                    <div className='pt-1.5 space-y-1 border-t border-[var(--fluent-border-subtle,#F0F0F0)] dark:border-[var(--fluent-neutral-grey-140,#484644)]'>
                      <p className='text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-1'>Liquidación IVA (Incluido)</p>
                      {purchaseTotals.iva10 > 0 && (
                        <div className='flex justify-between items-center'>
                          <span className='text-[11px] text-gray-500 dark:text-gray-400'>IVA 10%</span>
                          <span className='text-[11px] font-medium text-gray-700 dark:text-gray-300'>{formatCurrency(purchaseTotals.iva10)}</span>
                        </div>
                      )}
                      {purchaseTotals.iva5 > 0 && (
                        <div className='flex justify-between items-center'>
                          <span className='text-[11px] text-gray-500 dark:text-gray-400'>IVA 5%</span>
                          <span className='text-[11px] font-medium text-gray-700 dark:text-gray-300'>{formatCurrency(purchaseTotals.iva5)}</span>
                        </div>
                      )}
                      {purchaseTotals.exento > 0 && (
                        <div className='flex justify-between items-center'>
                          <span className='text-[11px] text-gray-500 dark:text-gray-400'>Exento</span>
                          <span className='text-[11px] font-medium text-gray-700 dark:text-gray-300'>{formatCurrency(purchaseTotals.exento)}</span>
                        </div>
                      )}
                    </div>

                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-[var(--fluent-text-secondary,#605E5C)]'>
                        Venta Esperada
                      </span>
                      <span className='font-medium text-[var(--fluent-brand-primary,#0078D4)]'>
                        {formatCurrency(
                          purchaseItems.reduce(
                            (s, i) => s + i.quantity * i.sale_price,
                            0,
                          ),
                        )}
                      </span>
                    </div>
                    <div className='h-px bg-[var(--fluent-border-neutral,#E1DFDD)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] my-2'></div>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                        Ganancia Proyectada
                      </span>
                      <div className='text-right'>
                        <span
                          className={`text-lg font-bold ${purchaseItems.reduce((s, i) => s + i.quantity * i.sale_price, 0) - purchaseItems.reduce((s, i) => s + i.quantity * i.unit_price, 0) >= 0 ? 'text-[var(--fluent-semantic-success,#107C10)]' : 'text-[var(--fluent-semantic-danger,#D13438)]'}`}
                        >
                          {formatCurrency(
                            purchaseItems.reduce(
                              (s, i) => s + i.quantity * i.sale_price,
                              0,
                            ) -
                              purchaseItems.reduce(
                                (s, i) => s + i.quantity * i.unit_price,
                                0,
                              ),
                          )}
                        </span>
                        {purchaseItems.length > 0 &&
                          purchaseItems.reduce(
                            (s, i) => s + i.quantity * i.unit_price,
                            0,
                          ) > 0 && (
                            <span className='ml-1.5 text-xs font-medium text-[var(--fluent-semantic-success,#107C10)]'>
                              (+
                              {(
                                (purchaseItems.reduce(
                                  (s, i) => s + i.quantity * i.sale_price,
                                  0,
                                ) /
                                  purchaseItems.reduce(
                                    (s, i) => s + i.quantity * i.unit_price,
                                    0,
                                  ) -
                                  1) *
                                100
                              ).toFixed(1)}
                              %)
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className='flex flex-col gap-3 justify-end'>
                    <button
                      className='w-full py-3 bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-4)] active:scale-[0.98] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] disabled:opacity-50 disabled:pointer-events-none text-sm'
                      onClick={handleSavePurchase}
                      disabled={
                        !selectedSupplier ||
                        purchaseItems.length === 0 ||
                        loading
                      }
                    >
                      {loading ? 'Procesando...' : 'Confirmar y Guardar Compra'}
                    </button>
                    <button
                      className='w-full py-3 border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] hover:bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] text-[var(--fluent-text-secondary,#605E5C)] font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] text-sm'
                      onClick={() => {
                        if (confirm('¿Borrar toda la orden?')) {
                          setPurchaseItems([])
                          setSelectedSupplier(null)
                          setSupplierSearch('')
                        }
                      }}
                    >
                      Cancelar Todo
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Configuration & Supplier - Fluent 2 */}
            <aside className='lg:col-span-4 space-y-4 md:space-y-6'>
              {/* Supplier Selection Card */}
              <section className='bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] p-5'>
                <h3 className='text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white mb-4'>
                  Proveedor del Pedido
                </h3>

                <div className='space-y-4'>
                  <div className='relative' ref={supplierSearchRef}>
                    <label className='text-xs font-medium text-[var(--fluent-text-secondary,#605E5C)] mb-1.5 block'>
                      Buscar Empresa
                    </label>
                    <div className='relative'>
                      <Search
                        className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fluent-text-tertiary,#8A8886)]'
                        size={16}
                      />
                      <input
                        type='text'
                        placeholder='Nombre del proveedor...'
                        className='w-full pl-9 pr-9 py-2 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all'
                        value={supplierSearch}
                        onChange={e => setSupplierSearch(e.target.value)}
                      />
                      {searchingSuppliers && (
                        <div className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--fluent-brand-primary,#0078D4)] border-t-transparent rounded-full animate-spin'></div>
                      )}
                    </div>

                    {supplierResults.length > 0 && (
                      <div className='absolute top-full left-0 right-0 mt-1 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-16)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] overflow-hidden z-30 py-1'>
                        {supplierResults.map(s => (
                          <button
                            key={s.id}
                            className='w-full px-4 py-2.5 text-left hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] transition-colors flex justify-between items-center'
                            onClick={() => handleSupplierSelect(s)}
                          >
                            <span className='font-medium text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                              {s.name}
                            </span>
                            <span className='text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                              ID: {s.id}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSupplier && (
                    <div className='p-4 bg-[rgba(0,120,212,0.08)] dark:bg-[rgba(0,120,212,0.15)] border border-[rgba(0,120,212,0.2)] rounded-[var(--fluent-corner-radius-large,6px)]'>
                      <div className='font-semibold text-[var(--fluent-brand-primary,#0078D4)] text-sm flex items-center gap-2'>
                        <div className='w-2 h-2 rounded-full bg-[var(--fluent-brand-primary,#0078D4)] animate-pulse'></div>
                        {selectedSupplier.name}
                      </div>
                      <div className='mt-3 space-y-1.5'>
                        <div className='flex items-center gap-2 text-xs text-[var(--fluent-text-secondary,#605E5C)]'>
                          <Calendar size={12} /> Registrado:{' '}
                          {formatDate(selectedSupplier.created_at)}
                        </div>
                        <div className='text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                          ID: {selectedSupplier.id}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Payment Config Card - Fluent 2 */}
              <section className='bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] p-5'>
                <h3 className='text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white mb-4'>
                  Configuración Financiera
                </h3>

                <div className='space-y-4'>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-medium text-[var(--fluent-text-secondary,#605E5C)] block'>
                      Método de Pago
                    </label>
                    <select
                      className='w-full px-3 py-2 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all cursor-pointer'
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                    >
                      {paymentMethods.map(m => (
                        <option key={m.id} value={m.id}>
                          {getPaymentMethodLabel(m)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-medium text-[var(--fluent-text-secondary,#605E5C)] block'>
                      Moneda de Transacción
                    </label>
                    <select
                      className='w-full px-3 py-2 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all cursor-pointer'
                      value={paymentCurrency}
                      onChange={e => setPaymentCurrency(e.target.value)}
                    >
                      {currencies.map(c => (
                        <option key={c.id} value={c.currency_code}>
                          {c.currency_code} - {getCurrencyLabel(c)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='space-y-1.5 pt-2 border-t border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                    <label className='text-xs font-medium text-[var(--fluent-text-secondary,#605E5C)] block'>
                      Notas de la Compra (Opcional)
                    </label>
                    <textarea
                      className='w-full px-3 py-2 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all resize-none'
                      rows={3}
                      placeholder='Ej: Pedido urgente de insumos...'
                      value={purchaseNotes}
                      onChange={e => setPurchaseNotes(e.target.value)}
                    />
                  </div>
                </div>
              </section>
            </aside>
          </div>
        )}

        {activeTab === 'historial' && (
          <div className='space-y-4 md:space-y-6'>
            {/* History Filter Toolbar - Fluent 2 CommandBar style */}
            <section className='bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] overflow-hidden'>
              <div className='p-4 md:p-5 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] flex flex-col xl:flex-row justify-between items-center bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] gap-4'>
                <div className='flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto'>
                  <div className='relative w-full sm:w-80'>
                    <Search
                      className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fluent-text-tertiary,#8A8886)]'
                      size={16}
                    />
                    <input
                      type='text'
                      placeholder='Buscar por ID o Proveedor...'
                      className='w-full pl-9 pr-3 py-2 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleFilter()}
                    />
                  </div>
                  <button
                    className='w-full sm:w-auto px-5 py-2 bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-2)] active:scale-[0.98] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] text-sm'
                    onClick={handleFilter}
                  >
                    Buscar
                  </button>
                </div>

                <div className='flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end'>
                  <div className='flex p-0.5 bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)]'>
                    <button
                      className={`px-4 py-1.5 text-xs font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] ${
                        searchType === 'date'
                          ? 'bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] shadow-[var(--fluent-shadow-2)] text-[var(--fluent-brand-primary,#0078D4)]'
                          : 'text-[var(--fluent-text-secondary,#605E5C)] hover:text-[var(--fluent-text-primary,#212121)]'
                      }`}
                      onClick={() => setSearchType('date')}
                    >
                      Fecha
                    </button>
                    <button
                      className={`px-4 py-1.5 text-xs font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] ${
                        searchType === 'supplier'
                          ? 'bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] shadow-[var(--fluent-shadow-2)] text-[var(--fluent-brand-primary,#0078D4)]'
                          : 'text-[var(--fluent-text-secondary,#605E5C)] hover:text-[var(--fluent-text-primary,#212121)]'
                      }`}
                      onClick={() => setSearchType('supplier')}
                    >
                      Proveedor
                    </button>
                  </div>

                  {searchType === 'date' && (
                    <div className='flex items-center gap-2 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] px-3 py-1.5 rounded-[var(--fluent-corner-radius-medium,4px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                      <input
                        type='date'
                        className='bg-transparent border-none text-xs text-[var(--fluent-text-primary,#212121)] dark:text-white outline-none'
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                      />
                      <span className='text-[var(--fluent-text-tertiary,#8A8886)]'>
                        →
                      </span>
                      <input
                        type='date'
                        className='bg-transparent border-none text-xs text-[var(--fluent-text-primary,#212121)] dark:text-white outline-none'
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* History Table - Fluent 2 DataGrid */}
              <div className='overflow-x-auto'>
                <table className='w-full text-left border-collapse min-w-[900px]'>
                  <thead className='bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] text-xs font-semibold text-[var(--fluent-text-secondary,#605E5C)]'>
                    <tr>
                      <th className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                        Orden ID
                      </th>
                      <th className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                        Fecha Pedido
                      </th>
                      <th className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                        Proveedor
                      </th>
                      <th className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] text-right'>
                        Monto Total
                      </th>
                      <th className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] text-center'>
                        Estado
                      </th>
                      <th className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] text-right w-20'>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-[var(--fluent-border-neutral,#E1DFDD)] dark:divide-[var(--fluent-neutral-grey-140,#484644)]'>
                    {purchaseOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className='py-16 text-center text-[var(--fluent-text-tertiary,#8A8886)] text-sm'
                        >
                          No se encontraron registros de compra
                        </td>
                      </tr>
                    ) : (
                      purchaseOrders.map(orderData => {
                        const order = orderData.purchase || orderData
                        const isCompleted =
                          order.status?.toUpperCase() === 'COMPLETED' ||
                          order.status?.toUpperCase() === 'RECEIVED'
                        const isCancelled =
                          order.status?.toUpperCase() === 'CANCELLED'

                        // Calcular estado de pago si la información está disponible
                        const payments = orderData.payments || {}
                        const totalAmount = order.total_amount || 0
                        const totalPaid = payments.total_paid || 0
                        const isFullyPaid =
                          payments.is_fully_paid ||
                          (totalPaid >= totalAmount && totalAmount > 0)
                        const hasBalance =
                          !isFullyPaid && totalAmount > 0 && !isCancelled

                        return (
                          <tr
                            key={order.id}
                            className='hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] transition-colors duration-[duration:var(--fluent-duration-faster,100ms)]'
                          >
                            <td className='px-5 py-3.5 font-semibold text-[var(--fluent-brand-primary,#0078D4)] text-sm'>
                              #{order.id}
                            </td>
                            <td className='px-5 py-3.5 text-[var(--fluent-text-secondary,#605E5C)] text-sm'>
                              {formatDate(order.order_date)}
                            </td>
                            <td className='px-5 py-3.5 font-medium text-[var(--fluent-text-primary,#212121)] dark:text-white text-sm'>
                              {order.supplier_name || '-'}
                            </td>
                            <td className='px-5 py-3.5 text-right font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                              {formatCurrency(
                                order.total_amount,
                                order.currency,
                              )}
                            </td>
                            <td className='px-5 py-3.5 text-center'>
                              <div className='flex flex-col items-center gap-1'>
                                <span
                                  className={`inline-flex px-2.5 py-1 rounded-[var(--fluent-corner-radius-medium,4px)] text-xs font-semibold ${
                                    isCompleted
                                      ? 'bg-[rgba(16,124,16,0.1)] text-[var(--fluent-semantic-success,#107C10)]'
                                      : isCancelled
                                        ? 'bg-[rgba(209,52,56,0.1)] text-[var(--fluent-semantic-danger,#D13438)]'
                                        : 'bg-[rgba(255,185,0,0.15)] text-[#B87900]'
                                  }`}
                                >
                                  {getStatusText(order.status)}
                                </span>
                                {hasBalance && (
                                  <span className='inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-700 border border-orange-200'>
                                    Saldo Pendiente
                                  </span>
                                )}
                                {isFullyPaid && isCompleted && (
                                  <span className='inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100'>
                                    Pagado
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className='px-5 py-3.5 text-right'>
                              <div className='relative inline-block'>
                                <button
                                  onClick={() =>
                                    setOpenActionMenu(
                                      openActionMenu === order.id
                                        ? null
                                        : order.id,
                                    )
                                  }
                                  className='p-1.5 text-[var(--fluent-text-tertiary,#8A8886)] hover:text-[var(--fluent-text-primary,#212121)] hover:bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)] transition-all'
                                >
                                  <MoreVertical size={18} />
                                </button>
                                {openActionMenu === order.id && (
                                  <div className='absolute right-0 mt-1 w-48 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-16)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] z-40 py-1 overflow-hidden'>
                                    <button
                                      onClick={() => handleViewPurchase(order)}
                                      className='w-full px-4 py-2.5 text-left text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] flex items-center gap-3 transition-colors'
                                    >
                                      <Eye
                                        size={16}
                                        className='text-[var(--fluent-brand-primary,#0078D4)]'
                                      />{' '}
                                      Ver Detalle
                                    </button>
                                    {!isCancelled && (
                                      <button
                                        onClick={() =>
                                          handleCancelPurchase(order)
                                        }
                                        className='w-full px-4 py-2.5 text-left text-sm text-[var(--fluent-semantic-danger,#D13438)] hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors'
                                      >
                                        <Ban size={16} /> Anular Orden
                                      </button>
                                    )}
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
            </section>
          </div>
        )}
      </main>

      {/* PRODUCT MODAL - Fluent 2 Dialog - 2-column layout optimized for 720p+ */}
      {isModalOpen && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4'>
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity'
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className='relative bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] w-full max-w-4xl max-h-[98vh] rounded-[var(--fluent-corner-radius-xlarge,8px)] shadow-[var(--fluent-shadow-64)] overflow-hidden flex flex-col border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)]'>
            {/* Header */}
            <header className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] flex justify-between items-center bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] shrink-0'>
              <div>
                <h3 className='text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                  {editingItemId
                    ? 'Editar Artículo'
                    : 'Agregar Artículo de Compra'}
                </h3>
                <p className='text-xs text-[var(--fluent-text-secondary,#605E5C)] mt-0.5'>
                  Seleccione un producto, configure cantidad, costo y estrategia
                  de precio
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className='w-8 h-8 flex items-center justify-center text-[var(--fluent-text-tertiary,#8A8886)] hover:text-[var(--fluent-semantic-danger,#D13438)] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[var(--fluent-corner-radius-medium,4px)] transition-all'
              >
                <X size={18} />
              </button>
            </header>

            {/* Content - 2-column layout */}
            <div className='flex-1 overflow-y-auto p-5'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
                {/* Column 1: Product Search, Selection & Basic Info */}
                <div className='space-y-4'>
                  {/* Product Search */}
                  <div className='space-y-1.5'>
                    <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                      Buscar Producto
                    </label>
                    <div className='relative' ref={modalProductSearchRef}>
                      <Search
                        className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fluent-text-tertiary,#8A8886)]'
                        size={16}
                      />
                      <input
                        type='text'
                        className='w-full pl-9 pr-9 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all'
                        placeholder='Buscar por SKU, EAN o Nombre...'
                        value={modalProductSearch}
                        onChange={e => setModalProductSearch(e.target.value)}
                        onKeyDown={handleModalProductSearchKeyDown}
                        onFocus={() => setShowProductDropdown(true)}
                      />
                      {searchingProducts && (
                        <div className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--fluent-brand-primary,#0078D4)] border-t-transparent rounded-full animate-spin'></div>
                      )}

                      {showProductDropdown &&
                        filteredModalProducts.length > 0 && (
                          <div
                            ref={productDropdownRef}
                            className='absolute top-full left-0 right-0 mt-1 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-16)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] overflow-hidden z-50 max-h-[220px] overflow-y-auto'
                          >
                            {filteredModalProducts.map((p, index) => {
                              const isActive = activeProductIndex === index

                              return (
                                <div
                                  key={p.id || p.product_id}
                                  data-product-index={index}
                                  role='option'
                                  aria-selected={isActive}
                                  className={`relative px-4 py-2.5 cursor-pointer border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] last:border-none flex justify-between items-center transition-colors ${
                                    isActive
                                      ? 'bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-130,#605E5C)] ring-1 ring-inset ring-[var(--fluent-brand-primary,#0078D4)]'
                                      : 'hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)]'
                                  }`}
                                  onMouseEnter={() =>
                                    setActiveProductIndex(index)
                                  }
                                  onClick={() => handleProductSelect(p)}
                                >
                                  {isActive && (
                                    <span
                                      className='absolute left-0 top-1 bottom-1 w-1 rounded-r bg-[var(--fluent-brand-primary,#0078D4)]'
                                      aria-hidden='true'
                                    />
                                  )}
                                  <div className='min-w-0 flex-1'>
                                    <div
                                      className={`font-medium text-sm truncate ${
                                        isActive
                                          ? 'text-[var(--fluent-brand-primary,#0078D4)]'
                                          : 'text-[var(--fluent-text-primary,#212121)] dark:text-white'
                                      }`}
                                    >
                                      {getProductName(p)}
                                    </div>
                                    <div className='flex gap-2 mt-0.5'>
                                      <span className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                                        ID: {p.id || p.product_id || '-'}
                                      </span>
                                      <span className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                                        SKU: {p.sku || p.product_sku || '-'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className='text-right flex-shrink-0 ml-3'>
                                    {isActive && (
                                      <div className='mb-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--fluent-corner-radius-small,2px)] border border-[var(--fluent-brand-primary,#0078D4)] text-[var(--fluent-brand-primary,#0078D4)] text-[10px] font-semibold'>
                                        <Check size={10} />
                                        Activo
                                      </div>
                                    )}
                                    <div className='text-sm font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                                      {formatCurrency(
                                        p.cost_price || p.unit_cost || 0,
                                      )}
                                    </div>
                                    <div
                                      className={`text-[10px] font-medium ${(p.stock || p.quantity_available || 0) > 0 ? 'text-[var(--fluent-semantic-success,#107C10)]' : 'text-[var(--fluent-semantic-danger,#D13438)]'}`}
                                    >
                                      Stock:{' '}
                                      {p.stock || p.quantity_available || 0}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Selected Product Card */}
                  {modalSelectedProduct ? (
                    <div className='p-4 bg-[rgba(0,120,212,0.06)] dark:bg-[rgba(0,120,212,0.12)] border border-[rgba(0,120,212,0.15)] rounded-[var(--fluent-corner-radius-large,6px)]'>
                      <div className='flex items-start gap-3'>
                        <div className='w-10 h-10 bg-[var(--fluent-brand-primary,#0078D4)] rounded-[var(--fluent-corner-radius-medium,4px)] flex items-center justify-center text-white font-semibold text-lg shrink-0'>
                          {(
                            modalSelectedProduct.name ||
                            modalSelectedProduct.product_name ||
                            '?'
                          )?.charAt(0)}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <h4 className='font-semibold text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white truncate'>
                            {modalSelectedProduct.name ||
                              modalSelectedProduct.product_name ||
                              '-'}
                          </h4>
                          <div className='grid grid-cols-3 gap-2 mt-2'>
                            <div>
                              <p className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                                ID
                              </p>
                              <p className='text-xs text-[var(--fluent-text-secondary,#605E5C)]'>
                                {modalSelectedProduct.id ||
                                  modalSelectedProduct.product_id ||
                                  '-'}
                              </p>
                            </div>
                            <div>
                              <p className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                                SKU
                              </p>
                              <p className='text-xs text-[var(--fluent-text-secondary,#605E5C)]'>
                                {modalSelectedProduct.sku ||
                                  modalSelectedProduct.product_sku ||
                                  '-'}
                              </p>
                            </div>
                            <div>
                              <p className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                                Unidad
                              </p>
                              <p className='text-xs text-[var(--fluent-text-secondary,#605E5C)]'>
                                {modalSelectedProduct.unit ||
                                  modalSelectedProduct.unit_name ||
                                  'unit'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='h-24 border-2 border-dashed border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-large,6px)] flex flex-col items-center justify-center'>
                      <Package
                        size={24}
                        className='text-[var(--fluent-text-tertiary,#8A8886)]'
                      />
                      <p className='text-xs text-[var(--fluent-text-tertiary,#8A8886)] mt-1'>
                        Selecciona un producto
                      </p>
                    </div>
                  )}

                  {/* Quantity & Cost */}
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='space-y-1.5'>
                      <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                        Cantidad
                      </label>
                      <input
                        type='number'
                        className='w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all'
                        value={modalQuantity}
                        onChange={e => setModalQuantity(e.target.value)}
                        placeholder='0'
                      />
                      <p className='text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                        Unidades a comprar
                      </p>
                    </div>
                    <div className='space-y-1.5'>
                      <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                        Costo Unitario
                      </label>
                      <input
                        type='number'
                        className='w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all'
                        value={modalUnitPrice}
                        onChange={e => setModalUnitPrice(e.target.value)}
                        placeholder='0.00'
                      />
                      <p className='text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                        Precio de compra por unidad
                      </p>
                    </div>
                  </div>

                  {/* Tax Rate */}
                  <div className='space-y-1.5'>
                    <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                      {t('purchases.modal.tax_rate', 'Tasa de Impuesto')}
                    </label>
                    <select
                      className='w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all cursor-pointer'
                      value={modalTaxRateId || ''}
                      onChange={e =>
                        setModalTaxRateId(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      disabled={loading}
                    >
                      <option value=''>
                        {loading
                          ? 'Cargando...'
                          : t('purchases.modal.no_tax', 'Sin impuesto')}
                      </option>
                      {taxRates.map(taxRate => (
                        <option key={taxRate.id} value={taxRate.id}>
                          {taxRate.tax_name} - {taxRate.rate}%{' '}
                          {taxRate.country ? `(${taxRate.country})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Includes Tax Toggle */}
                  <div className='flex items-center gap-3 p-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)]'>
                    <input
                      type='checkbox'
                      id='priceIncludesTax'
                      className='w-4 h-4 text-[var(--fluent-brand-primary,#0078D4)] border-[var(--fluent-border-neutral,#E1DFDD)] rounded focus:ring-[var(--fluent-brand-primary,#0078D4)] cursor-pointer'
                      checked={modalPriceIncludesTax}
                      onChange={e => setModalPriceIncludesTax(e.target.checked)}
                    />
                    <label
                      htmlFor='priceIncludesTax'
                      className='text-sm font-medium text-[var(--fluent-text-primary,#212121)] dark:text-white cursor-pointer select-none'
                    >
                      {t(
                        'purchases.modal.price_includes_tax',
                        'Precio incluye IVA',
                      )}
                    </label>
                  </div>
                </div>

                {/* Column 2: Pricing Strategy & Financial Summary */}
                <div className='space-y-4'>
                  {/* Pricing Mode Toggle */}
                  <div className='space-y-1.5'>
                    <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                      Estrategia de Precio de Venta
                    </label>
                    <div className='flex p-0.5 bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)]'>
                      <button
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] ${
                          pricingMode === 'margin'
                            ? 'bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] shadow-[var(--fluent-shadow-2)] text-[var(--fluent-brand-primary,#0078D4)]'
                            : 'text-[var(--fluent-text-secondary,#605E5C)]'
                        }`}
                        onClick={() => setPricingMode('margin')}
                      >
                        Por Margen %
                      </button>
                      <button
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] ${
                          pricingMode === 'sale_price'
                            ? 'bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] shadow-[var(--fluent-shadow-2)] text-[var(--fluent-brand-primary,#0078D4)]'
                            : 'text-[var(--fluent-text-secondary,#605E5C)]'
                        }`}
                        onClick={() => setPricingMode('sale_price')}
                      >
                        Precio Fijo
                      </button>
                    </div>
                  </div>

                  {/* Margin & Price Fields */}
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='space-y-1.5'>
                      <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                        {pricingMode === 'margin'
                          ? 'Margen de Ganancia'
                          : 'Margen Calculado'}
                      </label>
                      <div className='relative'>
                        <input
                          type='number'
                          className={`w-full pl-3 pr-8 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold transition-all ${
                            pricingMode !== 'margin'
                              ? 'opacity-60 cursor-not-allowed text-[var(--fluent-text-tertiary,#8A8886)]'
                              : 'text-[var(--fluent-semantic-success,#107C10)] focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)]'
                          }`}
                          value={
                            pricingMode === 'margin'
                              ? modalProfitPct
                              : effectiveProfitPct.toFixed(1)
                          }
                          onChange={e =>
                            pricingMode === 'margin' &&
                            setModalProfitPct(Number(e.target.value))
                          }
                          readOnly={pricingMode !== 'margin'}
                        />
                        <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fluent-text-tertiary,#8A8886)]'>
                          %
                        </span>
                      </div>
                      <p className='text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                        {pricingMode === 'margin'
                          ? 'Define el % de ganancia deseado'
                          : 'Porcentaje resultante del precio fijo'}
                      </p>
                    </div>
                    <div className='space-y-1.5'>
                      <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                        {pricingMode === 'sale_price'
                          ? 'Precio de Venta'
                          : 'Precio Sugerido'}
                      </label>
                      <input
                        type='number'
                        className={`w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold transition-all ${
                          pricingMode !== 'sale_price'
                            ? 'opacity-60 cursor-not-allowed text-[var(--fluent-text-tertiary,#8A8886)]'
                            : 'text-[var(--fluent-brand-primary,#0078D4)] focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)]'
                        }`}
                        value={
                          pricingMode === 'sale_price'
                            ? modalSalePrice
                            : effectiveSalePrice.toFixed(0)
                        }
                        onChange={e =>
                          pricingMode === 'sale_price' &&
                          setModalSalePrice(Number(e.target.value))
                        }
                        readOnly={pricingMode !== 'sale_price'}
                      />
                      <p className='text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                        {pricingMode === 'sale_price'
                          ? 'Precio final al público'
                          : 'Calculado según margen'}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className='p-4 bg-[rgba(0,120,212,0.06)] dark:bg-[rgba(0,120,212,0.12)] rounded-[var(--fluent-corner-radius-medium,4px)] border border-[rgba(0,120,212,0.15)]'>
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <span className='block text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                          Costo Unitario
                        </span>
                        <span className='text-sm font-medium text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                          {formatCurrency(modalUnitPrice || 0)}
                        </span>
                      </div>
                      <div>
                        <span className='block text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                          Precio Venta Unitario
                        </span>
                        <span className='text-sm font-semibold text-[var(--fluent-semantic-success,#107C10)]'>
                          {formatCurrency(effectiveSalePrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Projection Panel */}
                  <div className='p-4 bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-large,6px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                    <div className='text-xs font-semibold text-[var(--fluent-text-secondary,#605E5C)] uppercase tracking-wide mb-3'>
                      Proyección Financiera
                    </div>
                    <div className='space-y-2'>
                      {/* Resumen de Línea */}
                      <div className='flex justify-between items-center py-2 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                        <span className='text-xs text-[var(--fluent-text-secondary,#605E5C)]'>
                          Subtotal Línea
                        </span>
                        <span className='text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                          {modalQuantity || 0} ×{' '}
                          {formatCurrency(modalUnitPrice || 0)}
                        </span>
                      </div>

                      {/* Total Compra */}
                      <div className='flex justify-between items-center py-2 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                        <span className='text-sm text-[var(--fluent-text-secondary,#605E5C)]'>
                          Total Compra
                        </span>
                        <span className='text-sm font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                          {formatCurrency(
                            (Number(modalQuantity) || 0) * (Number(modalUnitPrice) || 0),
                          )}
                        </span>
                      </div>

                      {/* Total Venta Esperado */}
                      <div className='flex justify-between items-center py-2 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                        <span className='text-sm text-[var(--fluent-text-secondary,#605E5C)]'>
                          Venta Esperada
                        </span>
                        <span className='text-sm font-semibold text-[var(--fluent-brand-primary,#0078D4)]'>
                          {formatCurrency(
                            (Number(modalQuantity) || 0) * effectiveSalePrice,
                          )}
                        </span>
                      </div>

                      {/* Ganancia Esperada */}
                      <div className='flex justify-between items-center pt-2'>
                        <span className='text-sm font-medium text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                          Ganancia Esperada
                        </span>
                        <div className='text-right'>
                          <span
                            className={`text-lg font-bold ${(Number(modalQuantity) || 0) * effectiveSalePrice - (Number(modalQuantity) || 0) * (Number(modalUnitPrice) || 0) >= 0 ? 'text-[var(--fluent-semantic-success,#107C10)]' : 'text-[var(--fluent-semantic-danger,#D13438)]'}`}
                          >
                            {formatCurrency(
                              (Number(modalQuantity) || 0) * effectiveSalePrice -
                                (Number(modalQuantity) || 0) * (Number(modalUnitPrice) || 0),
                            )}
                          </span>
                          {(Number(modalQuantity) || 0) > 0 &&
                            (Number(modalUnitPrice) || 0) > 0 && (
                              <span className='ml-1.5 text-xs font-medium text-[var(--fluent-semantic-success,#107C10)]'>
                                (+{effectiveProfitPct.toFixed(1)}%)
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className='px-5 py-3 border-t border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] flex justify-end items-center gap-3 shrink-0'>
              <button
                className='px-5 py-2 font-medium text-[var(--fluent-text-secondary,#605E5C)] hover:text-[var(--fluent-text-primary,#212121)] hover:bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:hover:bg-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] transition-all text-sm border border-[var(--fluent-border-neutral,#E1DFDD)]'
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className='px-5 py-2 bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none text-sm'
                onClick={handleConfirmAddProduct}
                disabled={
                  !modalSelectedProduct || !modalQuantity || !modalUnitPrice
                }
              >
                {editingItemId ? 'Guardar Cambios' : 'Agregar a la Orden'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* CANCEL ORDER MODAL - Fluent 2 Dialog */}
      {showCancelPreview && cancelPreviewData && orderToCancel && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4'>
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => setShowCancelPreview(false)}
          ></div>
          <div className='relative bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] w-full max-w-sm rounded-[var(--fluent-corner-radius-xlarge,8px)] shadow-[var(--fluent-shadow-64)] p-6 border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] text-center space-y-5'>
            <div className='w-14 h-14 bg-[rgba(209,52,56,0.1)] text-[var(--fluent-semantic-danger,#D13438)] rounded-full flex items-center justify-center mx-auto'>
              <Ban size={28} />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                ¿Anular esta orden?
              </h3>
              <p className='text-sm text-[var(--fluent-text-secondary,#605E5C)] mt-2'>
                Esta acción afectará los saldos con{' '}
                <span className='font-semibold text-[var(--fluent-semantic-danger,#D13438)]'>
                  {orderToCancel.supplier_name}
                </span>
                .
              </p>
              {cancelPreviewData.impact_analysis && (
                <div className='mt-4 p-3 bg-red-50 text-red-700 text-xs rounded text-left'>
                  <p className='font-semibold mb-1'>Impacto de la anulación:</p>
                  <ul className='list-disc pl-4 space-y-1'>
                    {cancelPreviewData.impact_analysis.requires_payment_reversal && <li>Se reversarán {cancelPreviewData.impact_analysis.payments_to_cancel || 0} pagos.</li>}
                    {cancelPreviewData.impact_analysis.requires_stock_adjustment && <li>Se ajustará el stock de {cancelPreviewData.impact_analysis.stock_adjustments_required || 0} items.</li>}
                    <li>Total a reversar: {cancelPreviewData.impact_analysis.total_to_reverse || 0}</li>
                  </ul>
                </div>
              )}
            </div>
            <div className='flex gap-3 pt-2'>
              <button
                className='flex-1 py-2.5 font-medium text-[var(--fluent-text-secondary,#605E5C)] hover:bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] transition-colors text-sm'
                onClick={() => setShowCancelPreview(false)}
              >
                Cancelar
              </button>
              <button
                className='flex-1 py-2.5 bg-[var(--fluent-semantic-danger,#D13438)] hover:bg-[#B52E31] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-4)] active:scale-[0.98] transition-all text-sm'
                onClick={handleConfirmCancellation}
              >
                Sí, Anular
              </button>
            </div>
          </div>
        </div>
      )}

      {showInstantPayment && createdOrderData && (
        <InstantPaymentDialog
          open={showInstantPayment}
          onConfirmPayment={handleInstantPaymentConfirm}
          onLeavePending={handleLeavePurchasePending}
          orderId={createdOrderData.id}
          totalAmount={createdOrderData.totalAmount}
          currencyCode={createdOrderData.currencyCode}
          paymentMethodId={createdOrderData.paymentMethodId}
          paymentMethodLabel={createdOrderData.paymentMethodLabel}
          paymentMethods={paymentMethods}
        />
      )}

      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  )
}

export default Purchases
