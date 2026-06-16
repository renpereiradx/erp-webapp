import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import useDashboardStore from '@/store/useDashboardStore'
import useAuthStore from '@/store/useAuthStore'
import { useAuth } from '@/contexts/AuthContext'
import supplierService from '@/services/supplierService'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { CurrencyService } from '@/services/currencyService'
import { productService } from '@/services/productService'
import purchaseService from '@/services/purchaseService'
import {
  fetchPurchasesBySupplierTerm,
  purchasePaymentsMvpService,
} from '@/services/purchasePaymentsMvpService'
import { useToast } from '@/hooks/useToast'
import { calculatePurchaseSalePriceGs, calculateProfitMargin } from '@/domain/purchase/pricing/purchasePricingPolicy'
import { PurchaseWithFullDetails } from '@/types'
import { useBranch } from '@/contexts/BranchContext'

export const usePurchasesLogic = () => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const toast = useToast()
  const { fetchDashboardData } = useDashboardStore()
  const { user } = useAuthStore()
  const { hasPermission } = useAuth()
  const canWrite = hasPermission('purchases:write')
  const { currentBranchId } = useBranch()

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
  const [activeSupplierIndex, setActiveSupplierIndex] = useState<number>(-1)
  const [showSupplierDropdown, setShowSupplierDropdown] = useState<boolean>(false)
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
  const [modalUnit, setModalUnit] = useState<string>('unit')
  const [modalUnitPrice, setModalUnitPrice] = useState<string | number>('')
  const [modalProfitPct, setModalProfitPct] = useState<number>(30)
  const [modalSalePrice, setModalSalePrice] = useState<number>(0)
  const [pricingMode, setPricingMode] = useState<string>('margin')
  const [modalTaxRateId, setModalTaxRateId] = useState<number | null>(null)
  const [modalTaxRatePercent, setModalTaxRatePercent] = useState<number>(0)
  const [modalPriceIncludesTax, setModalPriceIncludesTax] = useState<boolean>(true)
  const [modalVariantId, setModalVariantId] = useState<string | undefined>()
  const [modalVariantName, setModalVariantName] = useState<string | undefined>()
  const [taxRates, setTaxRates] = useState<any[]>([])
  const [purchaseItems, setPurchaseItems] = useState<any[]>([])
  const [purchaseNotes, setPurchaseNotes] = useState<string>('')
  const modalProductSearchRef = useRef<HTMLInputElement>(null)
  const productDropdownRef = useRef<HTMLDivElement>(null)
  const modalQuantityRef = useRef<HTMLInputElement>(null)
  const isSelectingProductRef = useRef<boolean>(false)
  const isSelectingSupplierRef = useRef<boolean>(false)
  const [activeProductIndex, setActiveProductIndex] = useState<number>(-1)

  // UI Support States
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null)
  const [showCancelPreview, setShowCancelPreview] = useState<boolean>(false)
  const [cancelPreviewData, setCancelPreviewData] = useState<any>(null)
  const [orderToCancel, setOrderToCancel] = useState<any>(null)
  const [showInstantPayment, setShowInstantPayment] = useState<boolean>(false)
  const [createdOrderData, setCreatedOrderData] = useState<any>(null)
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false)
  const [latestPurchaseResult, setLatestPurchaseResult] = useState<{
    id: any;
    total_amount: number;
    branch_id: any;
    warnings: any[];
    details: any[];
  } | null>(null)

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
      ['Ã ', 'Á'],
      ['Ã‰', 'É'],
      ['Ã ', 'Í'],
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
      method?.name ||
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

  const getSupplierName = supplier =>
    fixMojibakeText(
      supplier?.first_name || supplier?.name || supplier?.Name || 'Proveedor sin nombre'
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

  useEffect(() => {
    if (modalTaxRateId === null) {
      setModalTaxRatePercent(0)
    } else {
      const selectedTax = taxRates.find(t => t.id === modalTaxRateId)
      if (selectedTax) {
        let finalPercent = Number(selectedTax.rate) || 0
        if (finalPercent > 0 && finalPercent < 1) {
          finalPercent = finalPercent * 100
        }
        setModalTaxRatePercent(finalPercent)
      }
    }
  }, [modalTaxRateId, taxRates])

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

      const hasNextFromMeta = pageResponse?.pagination?.hasNext === true

      const totalPages = pageResponse?.pagination?.totalPages ? Number(pageResponse.pagination.totalPages) : 0
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

        // Cargar configuración base con catch individual para que no bloquee toda la pantalla
        const [methods, currs, taxes] = await Promise.all([
          PaymentMethodService.getAll().catch(() => []),
          CurrencyService.getAll().catch(() => []),
          purchaseService.getTaxRates(1, 100).catch(() => ({ success: false, data: [] })),
        ])

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

        // Cargar órdenes
        try {
          const orders = await fetchPurchaseOrdersByDateRange(start, end)
          setPurchaseOrders(Array.isArray(orders) ? orders : [])
        } catch (ordersErr: any) {
          console.error('Error loading purchase orders:', ordersErr)
          setError(ordersErr.message || 'Error al cargar las compras. Aún puedes registrar nuevas compras.')
          setPurchaseOrders([])
        }
      } catch (err: any) {
        console.error('Error loading initial data:', err)
        setError(err.message || 'Error al cargar datos iniciales')
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Search Hooks
  useEffect(() => {
    if (isSelectingSupplierRef.current) {
      isSelectingSupplierRef.current = false
      return
    }
    if (!supplierSearch || supplierSearch.length < 2) {
      setSupplierResults([])
      setShowSupplierDropdown(false)
      return
    }
    const timer = setTimeout(async () => {
      setSearchingSuppliers(true)
      setShowSupplierDropdown(true)
      try {
        const res = await supplierService.searchByName(supplierSearch)
        setSupplierResults(Array.isArray(res) ? res : res.data || [])
      } catch (err) {
        console.error('Error searching suppliers:', err)
        setSupplierResults([])
      } finally {
        setSearchingSuppliers(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [supplierSearch])

  useEffect(() => {
    if (!showSupplierDropdown || supplierResults.length === 0) {
      setActiveSupplierIndex(-1)
      return
    }
    setActiveSupplierIndex(0)
  }, [showSupplierDropdown, supplierResults])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        supplierSearchRef.current &&
        !supplierSearchRef.current.contains(event.target as Node)
      ) {
        setShowSupplierDropdown(false)
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node) &&
        modalProductSearchRef.current &&
        !modalProductSearchRef.current.contains(event.target as Node)
      ) {
        setShowProductDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        modalProductSearchRef.current?.focus()
      }, 50)
    }
  }, [isModalOpen])

  useEffect(() => {
    if (isSelectingProductRef.current) {
      isSelectingProductRef.current = false
      return
    }
    if (!modalProductSearch.trim() || modalProductSearch.trim().length < 2) {
      setModalProductResults([])
      setShowProductDropdown(false)
      return
    }
    const timer = setTimeout(async () => {
      setSearchingProducts(true)
      setShowProductDropdown(true)
      try {
        const res = await productService.search(
          modalProductSearch.trim(),
          { limit: 10 },
        )
        setModalProductResults(
          (Array.isArray(res) ? res : []).filter(p => p.state !== false),
        )
      } catch (err) {
        console.error('Error searching products:', err)
        setModalProductResults([])
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
    isSelectingSupplierRef.current = true
    setSupplierSearch(getSupplierName(s) || '')
    setSupplierResults([])
    setShowSupplierDropdown(false)
  }

  const handleSupplierSearchKeyDown = event => {
    if (!supplierResults.length) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setShowSupplierDropdown(true)
      setActiveSupplierIndex(prev =>
        prev < supplierResults.length - 1 ? prev + 1 : 0,
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setShowSupplierDropdown(true)
      setActiveSupplierIndex(prev =>
        prev > 0 ? prev - 1 : supplierResults.length - 1,
      )
      return
    }

    if (
      event.key === 'Enter' &&
      showSupplierDropdown &&
      activeSupplierIndex >= 0
    ) {
      event.preventDefault()
      handleSupplierSelect(supplierResults[activeSupplierIndex])
      return
    }

    if (event.key === 'Escape') {
      setShowSupplierDropdown(false)
      setActiveSupplierIndex(-1)
    }
  }

  const handleProductSelect = async (p: any) => {
    const productId = p.id || p.product_id;
    if (!productId) return;

    isSelectingProductRef.current = true;

    try {
      setSearchingProducts(true);
      const fullProduct = await productService.getForPurchase(productId) as any;
      
      const normalizedProduct = {
        ...fullProduct,
        id: fullProduct.product_id || fullProduct.id,
        name: getProductName(fullProduct),
        sku: fullProduct.barcode || fullProduct.sku || '-',
        unit: fullProduct.base_unit || fullProduct.unit || 'unit',
        cost_price: Number(fullProduct.purchase_price || fullProduct.unit_cost || 0),
        stock: Number(fullProduct.stock_quantity || fullProduct.stock || 0),
        last_purchase_cost: fullProduct.unit_costs_summary?.[0]?.last_cost ?? Number(fullProduct.purchase_price || fullProduct.unit_cost || 0),
        sale_price: Number(
          fullProduct.sale_price ||
          fullProduct.price ||
          fullProduct.unit_price ||
          (Array.isArray(fullProduct.unit_prices) && (fullProduct.unit_prices[0]?.price_per_unit || fullProduct.unit_prices[0]?.price || fullProduct.unit_prices[0]?.selling_price)) ||
          0
        ),
        has_variants: Boolean(fullProduct.has_variants),
      };

      setModalVariantId(undefined);
      setModalVariantName(undefined);
      setModalSelectedProduct(normalizedProduct);
      setModalProductSearch(normalizedProduct.name || '');
      setShowProductDropdown(false);
      setModalUnit(normalizedProduct.unit || 'unit');

      const cost = normalizedProduct.cost_price || 0;
      setModalUnitPrice(cost);
      
      // Default pricing: cost * (1 + 0.3)
      setModalSalePrice(Math.ceil((cost * 1.3) / 50) * 50);

      // Jerarquía de impuesto: Impuesto del producto > Impuesto de la categoría
      let taxId = fullProduct.tax?.rate?.id || fullProduct.applicable_tax_rate?.id || fullProduct.tax_rate_id;
      let taxRateValue = fullProduct.tax?.rate?.rate || fullProduct.applicable_tax_rate?.rate || fullProduct.tax_rate;

      if (!taxId && fullProduct.category) {
        const categoryTax = fullProduct.category.default_tax_rate;
        if (categoryTax) {
          taxId = categoryTax.id;
          taxRateValue = categoryTax.rate;
        } else if (fullProduct.category.default_tax_rate_id) {
          taxId = fullProduct.category.default_tax_rate_id;
          const foundTax = taxRates.find(t => t.id === taxId);
          if (foundTax) {
            taxRateValue = foundTax.rate;
          }
        }
      }

      if (taxId) {
        setModalTaxRateId(taxId);
        let finalPercent = Number(taxRateValue) || 0;
        if (finalPercent > 0 && finalPercent < 1) {
          finalPercent = finalPercent * 100;
        }
        setModalTaxRatePercent(finalPercent);
      } else {
        setModalTaxRateId(null);
        setModalTaxRatePercent(0);
      }
      setTimeout(() => {
        modalQuantityRef.current?.focus();
      }, 100);
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
      unit: modalUnit || 'unit',
      profit_pct: pricingMode === 'margin' ? Number(modalProfitPct) : effectiveProfitPct,
      explicit_sale_price: pricingMode === 'sale_price' ? Number(modalSalePrice) : undefined,
      sale_price: effectiveSalePrice,
      pricing_mode: pricingMode,
      tax_rate_id: modalTaxRateId,
      tax_rate: modalTaxRatePercent,
      price_includes_tax: modalPriceIncludesTax, // API v2.6
      variant_id: modalVariantId,
      variant_name: modalVariantName,
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
    setModalUnit('')
    setModalUnitPrice('')
    setModalVariantId(undefined)
    setModalVariantName(undefined)
    setModalTaxRateId(null)
    setModalSelectedProduct(null)
    setModalProductSearch('')
    setModalPriceIncludesTax(true)
  }

  const handleSavePurchase = async () => {
    if (!selectedSupplier || purchaseItems.length === 0) return
    setLoading(true)
    try {
      // Resolver moneda seleccionada para enviar ID
      const selectedCurrency = (currencies || []).find(c => c.currency_code === paymentCurrency);
      
      const orderData = {
        supplier_id: selectedSupplier.id,
        status: 'COMPLETED',
        branch_id: currentBranchId || undefined, // Contexto Multi-sucursal (v1.0)
        payment_method_id: paymentMethod ? Number(paymentMethod) : undefined,
        currency_id: selectedCurrency?.id || undefined,
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
        let dbDetails: any[] = []
        let dbPurchase: any = null
        try {
          const detailRes = await purchaseService.getPurchaseById(result.purchase_order_id)
          if (detailRes.success && detailRes.data) {
            dbDetails = detailRes.data.details || detailRes.data.order_details || []
            dbPurchase = detailRes.data.purchase || detailRes.data
          }
        } catch (err) {
          console.error('Error fetching fresh purchase details:', err)
        }

        setPurchaseItems([])
        setPurchaseNotes('')

        const selectedPaymentMethod = paymentMethods.find(
          method => String(method.id) === String(paymentMethod),
        )

        setCreatedOrderData({
          id: result.purchase_order_id,
          totalAmount: result.total_amount || dbPurchase?.total_amount || purchaseItems.reduce(
            (s, i) => s + i.quantity * i.unit_price,
            0,
          ),
          currencyCode: paymentCurrency,
          paymentMethodId: paymentMethod ? Number(paymentMethod) : null,
          paymentMethodLabel: selectedPaymentMethod
            ? getPaymentMethodLabel(selectedPaymentMethod)
            : null,
        })

        setLatestPurchaseResult({
          id: result.purchase_order_id,
          total_amount: result.total_amount || dbPurchase?.total_amount || 0,
          branch_id: result.branch_id || dbPurchase?.branch_id || currentBranchId || 1,
          warnings: result.warnings || [],
          details: dbDetails
        })

        setShowConfirmationModal(true)
        fetchDashboardData()
      } else {
        // Manejar errores de validación (API v2.7) y NO_CONVERSION
        const errMsg = result.message || result.error || 'Error al guardar la compra';
        if (errMsg.toLowerCase().includes('no existe conversion') || errMsg.toLowerCase().includes('conversión')) {
          toast.error(
            `No existe conversión de unidad: ${errMsg}. Registre la conversión antes de comprar en esta unidad.`,
          )
        } else {
          toast.error(errMsg)
        }
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
      } else {
        toast.error((result as any)?.error || (result as any)?.message || 'Error al anular orden de compra')
      }
    } catch (err: any) {
      console.error('Error in handleConfirmCancellation:', err)
      toast.error(err?.message || 'Error inesperado al anular la compra')
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
      setError((filterError as any).message || 'Error al filtrar compras')
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

  const handleEditItem = async item => {
    setEditingItemId(item.id)
    setIsModalOpen(true)
    
    // Set fallback basic product data immediately so UI renders something
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

    // Background fetch to enrich product data with category and tax definitions for the UI badges
    try {
      const fullProduct = await productService.getForPurchase(item.product_id) as any;
      setModalSelectedProduct(prev => ({
        ...fullProduct,
        ...prev // keep edited values prioritized
      }));
    } catch (e) {
      console.warn("Could not fetch full product data for edit mode", e);
    }
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
          cash_register_id: paymentPayload?.cash_register_id,
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
      const message = (paymentError as any)?.message || 'No se pudo registrar el pago'
      setError(message)
      toast.error(message)
      throw paymentError
    }
  }

  const handleLeavePurchasePending = () => {
    setShowInstantPayment(false)
    setActiveTab('historial')
    handleFilter()
  }


  return {
    activeProductIndex,
    activeSupplierIndex,
    activeTab,
    canWrite,
    cancelPreviewData,
    createdOrderData,
    currencies,
    editingItemId,
    effectiveProfitPct,
    effectiveSalePrice,
    endDate,
    error,
    filteredModalProducts,
    formatDate,
    getCurrencyLabel,
    getPaymentMethodLabel,
    getProductName,
    getStatusText,
    getSupplierName,
    handleCancelPurchase,
    handleConfirmAddProduct,
    handleConfirmCancellation,
    handleEditItem,
    handleFilter,
    handleInstantPaymentConfirm,
    handleLeavePurchasePending,
    handleModalProductSearchKeyDown,
    handleProductSelect,
    handleSavePurchase,
    handleSupplierSearchKeyDown,
    handleSupplierSelect,
    handleViewPurchase,
    isModalOpen,
    latestPurchaseResult,
    loading,
    modalPriceIncludesTax,
    modalProductSearch,
    modalProductSearchRef,
    modalProfitPct,
    modalQuantity,
    modalQuantityRef,
    modalSalePrice,
    modalSelectedProduct,
    modalTaxRateId,
    modalUnit,
    modalUnitPrice,
    modalVariantId,
    setModalVariantId,
    modalVariantName,
    setModalVariantName,
    openActionMenu,
    orderToCancel,
    paymentCurrency,
    paymentMethod,
    paymentMethods,
    pricingMode,
    productDropdownRef,
    purchaseItems,
    purchaseNotes,
    purchaseOrders,
    purchaseTotals,
    searchTerm,
    searchType,
    searchingProducts,
    searchingSuppliers,
    selectedSupplier,
    setActiveProductIndex,
    setActiveSupplierIndex,
    setActiveTab,
    setEndDate,
    setIsModalOpen,
    setModalPriceIncludesTax,
    setModalProductSearch,
    setModalProfitPct,
    setModalQuantity,
    setModalSalePrice,
    setModalTaxRateId,
    setModalUnit,
    setModalUnitPrice,
    setOpenActionMenu,
    setPaymentCurrency,
    setPaymentMethod,
    setPricingMode,
    setPurchaseItems,
    setPurchaseNotes,
    setSearchTerm,
    setSearchType,
    setSelectedSupplier,
    setShowCancelPreview,
    setShowConfirmationModal,
    setShowInstantPayment,
    setShowProductDropdown,
    setShowSupplierDropdown,
    setStartDate,
    setSupplierSearch,
    showCancelPreview,
    showConfirmationModal,
    showInstantPayment,
    showProductDropdown,
    showSupplierDropdown,
    startDate,
    supplierResults,
    supplierSearch,
    supplierSearchRef,
    t,
    taxRates,
    toast
  }
}
