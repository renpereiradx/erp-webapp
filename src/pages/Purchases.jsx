/**
 * Enhanced Purchase Orders Page - Redesigned with Table View
 * Implements the Purchase Order Enhanced API following MVP patterns
 * Features table-based product selection and enhanced purchase order creation
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ShoppingCart,
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calculator,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  User,
  Calendar,
  FileText,
  Settings,
  Percent,
  X,
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DataState from '@/components/ui/DataState'
import EmptyState from '@/components/ui/EmptyState'

// Custom Hooks and Services
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useI18n } from '@/lib/i18n'
import { translatePurchaseStatus } from '@/utils/statusUtils'
import usePurchaseStore from '@/store/usePurchaseStore'
import useProductStore from '@/store/useProductStore'
import useSupplierStore from '@/store/useSupplierStore'
import { manufacturingService } from '@/services/manufacturingService'

// Modal Components
import SupplierSelectionModal from '@/components/SupplierSelectionModal'
import ProductSelectionModal from '@/components/ProductSelectionModal'
import TaxSelectionModal from '@/components/TaxSelectionModal'
import { PurchaseOrderCancellationModal } from '@/components/PurchaseOrderCancellationModal'

// Payment Components
import CurrencySelector from '@/components/payment/CurrencySelector'
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector'

const PurchasesPage = () => {
  const { t } = useI18n()
  const { styles } = useThemeStyles()

  // Store states
  const {
    loading,
    error,
    createEnhancedPurchaseOrder,
    getPurchaseOrderAnalysis,
    validatePurchaseOrderIntegrity,
    clearError,
    taxRates,
    fetchTaxRates,
  } = usePurchaseStore()

  const { products, fetchProducts } = useProductStore()
  const { fetchSuppliers } = useSupplierStore()

  // Función para formatear moneda en Guaraníes
  const formatGuaranies = amount => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₲0'
    return `₲${Number(amount).toLocaleString('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  const formatDateTime = value => {
    if (!value) return 'Sin fecha'
    try {
      return new Date(value).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      return value
    }
  }

  // Local states
  const [activeTab, setActiveTab] = useState('create')
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectedTaxRate, setSelectedTaxRate] = useState(null)
  const [orderData, setOrderData] = useState({
    auto_update_prices: true,
    default_profit_margin: 30.0,
    isPaid: false,
    payment_method_id: null,
    currency_id: null,
  })
  const [showAnalysis, setShowAnalysis] = useState(null)

  // Cancellation modal states
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState(null)

  // Search states for list tab
  const [searchMode, setSearchMode] = useState('recent') // 'recent', 'supplier', 'dateRange'
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('')
  const [showInactiveSuppliers, setShowInactiveSuppliers] = useState(false)
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return {
      startDate: firstDayOfMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      page: 1,
      pageSize: 10,
    }
  })
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Manufacturing supply purchases states
  const [supplies, setSupplies] = useState([])
  const [suppliesLoading, setSuppliesLoading] = useState(false)
  const [supplyForm, setSupplyForm] = useState({
    supply_id: '',
    quantity: '',
    unit_cost: '',
    supplier_name: '',
    invoice_number: '',
    notes: '',
  })
  const [supplyPurchases, setSupplyPurchases] = useState([])
  const [supplyPurchasesLoading, setSupplyPurchasesLoading] = useState(false)
  const [supplyPurchasesError, setSupplyPurchasesError] = useState(null)
  const [supplyFilters, setSupplyFilters] = useState({
    supplyId: '',
    limit: 20,
    offset: 0,
  })
  const [supplyFiltersDraft, setSupplyFiltersDraft] = useState({
    supplyId: '',
    limit: 20,
    offset: 0,
  })

  // Modal states
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showTaxModal, setShowTaxModal] = useState(false)
  const [showOrderDetails, setShowOrderDetails] = useState(null)

  const orderDetailsMetrics = useMemo(() => {
    if (!showOrderDetails?.data) return null

    const details = showOrderDetails.data.details || []
    const productsCount = details.length
    const totalQuantity = details.reduce(
      (sum, detail) => sum + (detail?.quantity || 0),
      0
    )
    const totalSubtotal = details.reduce((sum, detail) => {
      if (typeof detail?.subtotal === 'number') {
        return sum + detail.subtotal
      }
      const qty = detail?.quantity || 0
      const price = detail?.unit_price || 0
      return sum + qty * price
    }, 0)
    const totalSale = details.reduce((sum, detail) => {
      if (!detail?.sale_price) return sum
      const qty = detail?.quantity || 0
      return sum + detail.sale_price * (qty || 1)
    }, 0)
    const marginValues = details
      .map(detail => detail?.profit_pct ?? detail?.metadata?.profit_pct ?? null)
      .filter(value => typeof value === 'number')

    const averageMargin =
      marginValues.length > 0
        ? marginValues.reduce((sum, value) => sum + value, 0) /
          marginValues.length
        : null

    return {
      details,
      productsCount,
      totalQuantity,
      totalSubtotal,
      totalSale,
      averageMargin,
    }
  }, [showOrderDetails])

  const taxRatesMap = useMemo(() => {
    const map = new Map()
    taxRates.forEach(rate => {
      const key = rate?.id ?? rate?.tax_rate_id
      if (key !== undefined && key !== null) {
        map.set(key, rate)
      }
    })
    return map
  }, [taxRates])

  const selectedProductIds = useMemo(
    () => selectedProducts.map(product => product.product_id),
    [selectedProducts]
  )

  const orderTotals = useMemo(() => {
    if (selectedProducts.length === 0) {
      const fallbackTaxRate =
        selectedTaxRate?.rate ?? selectedTaxRate?.tax_rate ?? 0

      return {
        subtotal: 0,
        tax: 0,
        total: 0,
        taxRate: fallbackTaxRate,
      }
    }

    const totalWithTax = selectedProducts.reduce((sum, product) => {
      const quantity = parseFloat(product.quantity) || 0
      const unitPrice = parseFloat(product.unit_price) || 0
      return sum + quantity * unitPrice
    }, 0)

    const resolvedTaxRate = (() => {
      if (selectedTaxRate) {
        return selectedTaxRate.rate ?? selectedTaxRate.tax_rate ?? 0
      }

      const collectedRates = selectedProducts
        .map(product => {
          if (typeof product.tax_rate === 'number') {
            return product.tax_rate
          }

          if (
            product.tax_rate_id !== null &&
            product.tax_rate_id !== undefined &&
            taxRatesMap.size > 0
          ) {
            const match = taxRatesMap.get(product.tax_rate_id)
            if (match) {
              return match.rate ?? match.tax_rate ?? null
            }
          }

          return null
        })
        .filter(rate => typeof rate === 'number')

      if (collectedRates.length === 0) return 0

      const sum = collectedRates.reduce((acc, rate) => acc + rate, 0)
      return sum / collectedRates.length
    })()

    const taxRateNumber =
      typeof resolvedTaxRate === 'number' ? resolvedTaxRate : 0
    const baseAmount =
      taxRateNumber > 0
        ? totalWithTax / (1 + taxRateNumber / 100)
        : totalWithTax
    const taxAmount = totalWithTax - baseAmount

    return {
      subtotal: baseAmount,
      tax: taxAmount,
      total: totalWithTax,
      taxRate: taxRateNumber,
    }
  }, [selectedProducts, selectedTaxRate, taxRatesMap])

  // Load tax rates on component mount
  useEffect(() => {
    fetchTaxRates()
  }, [fetchTaxRates])

  // Only load purchase orders when switching to list tab
  // Comentado temporalmente hasta que los endpoints estén disponibles
  // useEffect(() => {
  //   if (activeTab === 'list') {
  //     fetchPurchaseOrders();
  //   }
  // }, [activeTab, fetchPurchaseOrders]);

  // Clear search results when leaving records tab
  useEffect(() => {
    if (activeTab !== 'records') {
      setSearchResults([])
    }
  }, [activeTab])

  // Re-execute search when supplier filter changes
  const hasSearchResults = searchResults.length > 0

  const searchPurchaseOrders = useCallback(async () => {
    setSearchLoading(true)
    try {
      const { default: purchaseService } = await import(
        '@/services/purchaseService'
      )
      let response

      switch (searchMode) {
        case 'supplier': {
          if (!supplierSearchTerm.trim()) {
            alert('Por favor ingresa el nombre del proveedor o ID de proveedor')
            return
          }

          const searchTerm = supplierSearchTerm.trim()

          // Detectar si es un ID numérico o nombre de proveedor
          const filterOptions = { showInactiveSuppliers }

          if (/^\d+$/.test(searchTerm)) {
            // Es un ID numérico, buscar por ID de proveedor
            console.log('🔍 Buscando por ID de proveedor:', searchTerm)
            response = await purchaseService.getPurchasesBySupplier(
              searchTerm,
              filterOptions
            )
          } else {
            // Es texto, buscar por nombre de proveedor
            console.log('🔍 Buscando por nombre de proveedor:', searchTerm)
            response = await purchaseService.getPurchasesBySupplierName(
              searchTerm,
              filterOptions
            )
          }
          break
        }

        case 'dateRange': {
          if (!dateRange.startDate || !dateRange.endDate) {
            alert('Por favor selecciona un rango de fechas válido')
            return
          }
          response = await purchaseService.getPurchasesByDateRange(
            dateRange.startDate,
            dateRange.endDate,
            dateRange.page,
            dateRange.pageSize,
            { showInactiveSuppliers }
          )
          break
        }

        case 'recent':
        default: {
          response = await purchaseService.getRecentPurchases(30, 1, 20, {
            showInactiveSuppliers,
          })
          break
        }
      }

      if (response?.success) {
        setSearchResults(response.data || [])
        console.log('📦 Resultados de búsqueda:', response.data)
      } else {
        setSearchResults([])
        console.warn('⚠️ Error en búsqueda:', response?.error)
      }
    } catch (error) {
      console.error('Error buscando órdenes:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [dateRange, searchMode, showInactiveSuppliers, supplierSearchTerm])

  const fetchSuppliesList = useCallback(async () => {
    setSuppliesLoading(true)
    try {
      const supplyResults = await manufacturingService.getSupplies({
        active: true,
        limit: 200,
      })
      setSupplies(supplyResults)
      if (
        supplyFilters.supplyId &&
        !supplyResults.some(
          supply => String(supply.id) === String(supplyFilters.supplyId)
        )
      ) {
        setSupplyFilters(prev => ({ ...prev, supplyId: '' }))
        setSupplyFiltersDraft(prev => ({ ...prev, supplyId: '' }))
      }
    } catch (error) {
      console.error('Error cargando insumos de manufactura:', error)
    } finally {
      setSuppliesLoading(false)
    }
  }, [supplyFilters.supplyId])

  const fetchSupplyPurchases = useCallback(
    async (filtersOverride = null) => {
      const params = filtersOverride ?? supplyFilters
      setSupplyPurchasesLoading(true)
      setSupplyPurchasesError(null)
      try {
        const parsedLimit = Number.parseInt(params.limit, 10)
        const parsedOffset = Number.parseInt(params.offset, 10)
        const purchases = await manufacturingService.getSupplyPurchases({
          supplyId: params.supplyId ? String(params.supplyId) : undefined,
          limit: Number.isNaN(parsedLimit) ? undefined : parsedLimit,
          offset: Number.isNaN(parsedOffset) ? undefined : parsedOffset,
        })
        setSupplyPurchases(purchases)
      } catch (error) {
        console.error('Error cargando compras de insumos:', error)
        setSupplyPurchases([])
        setSupplyPurchasesError(
          error?.message || 'No se pudieron cargar las compras de insumos.'
        )
      } finally {
        setSupplyPurchasesLoading(false)
      }
    },
    [supplyFilters]
  )

  useEffect(() => {
    if (activeTab !== 'supplyPurchases') {
      return
    }

    if (!supplies.length) {
      fetchSuppliesList()
    }

    fetchSupplyPurchases()
  }, [activeTab, fetchSuppliesList, fetchSupplyPurchases, supplies.length])

  useEffect(() => {
    if (
      !hasSearchResults ||
      !['supplier', 'dateRange', 'recent'].includes(searchMode)
    ) {
      return
    }

    searchPurchaseOrders()
  }, [
    hasSearchResults,
    searchMode,
    showInactiveSuppliers,
    searchPurchaseOrders,
  ])

  const loadPurchases = async () => {
    setSearchMode('recent')
    setSupplierSearchTerm('')
    setSearchLoading(true)
    try {
      const { default: purchaseService } = await import(
        '@/services/purchaseService'
      )
      const response = await purchaseService.getRecentPurchases(30, 1, 20, {
        showInactiveSuppliers,
      })

      if (response.success) {
        setSearchResults(response.data || [])
      } else {
        setSearchResults([])
        console.warn('⚠️ Error al cargar compras recientes:', response.error)
      }
    } catch (error) {
      console.error('Error cargando órdenes recientes:', error)
      setSearchResults([])
    }
    setSearchLoading(false)
  }

  const handleSelectSupplier = supplier => {
    if (!supplier) return

    const normalizedSupplier = {
      ...supplier,
      id:
        supplier.id ||
        supplier.ID ||
        supplier.supplier_id ||
        supplier.supplierId ||
        null,
      name:
        supplier.name ||
        supplier.SupplierName ||
        supplier.display_name ||
        'Sin nombre',
      email:
        supplier.email ||
        supplier.contact_info?.email ||
        supplier.contactInfo?.email ||
        '',
    }

    if (!normalizedSupplier.id) {
      console.warn('Proveedor seleccionado sin ID válido:', supplier)
    }

    setSelectedSupplier(normalizedSupplier)
  }

  const handleSelectProduct = product => {
    if (!product) return

    const productId =
      product.product_id || product.id || product.productId || product.ID

    if (!productId) {
      console.warn('Producto seleccionado sin ID válido:', product)
      return
    }

    setSelectedProducts(prev => {
      if (prev.some(item => item.product_id === productId)) {
        return prev
      }

      const resolvedUnitPrice =
        parseFloat(
          product.purchase_price ??
            product.cost_price ??
            product.unit_price ??
            product.price ??
            product.last_purchase_price ??
            product.selling_price ??
            0
        ) || 0

      const defaultProfit =
        product.profit_pct !== undefined && product.profit_pct !== null
          ? parseFloat(product.profit_pct)
          : orderData.default_profit_margin

      const resolvedTaxRateId =
        product.tax_rate_id ??
        product.tax_rate?.id ??
        product.tax_rate ??
        selectedTaxRate?.id ??
        selectedTaxRate?.tax_rate_id ??
        null

      const resolvedTaxRate =
        product.tax_rate?.rate ??
        product.tax_rate ??
        selectedTaxRate?.rate ??
        selectedTaxRate?.tax_rate ??
        null

      const normalizedProduct = {
        product_id: productId,
        name:
          product.name || product.product_name || product.title || 'Sin nombre',
        description:
          product.description ||
          product.product_description ||
          product.desc ||
          '',
        quantity: 1,
        unit_price: resolvedUnitPrice,
        unit: product.unit || product.default_unit || 'unit',
        profit_pct: defaultProfit,
        tax_rate_id: resolvedTaxRateId,
        tax_rate: resolvedTaxRate,
      }

      return [...prev, normalizedProduct]
    })
  }

  const handleUpdateProduct = (productId, field, value) => {
    setSelectedProducts(prev =>
      prev.map(product => {
        if (product.product_id !== productId) {
          return product
        }

        if (field === 'tax_rate_id') {
          const nextTaxId =
            value === null || value === undefined || value === ''
              ? null
              : Number(value)
          const taxInfo =
            (nextTaxId !== null ? taxRatesMap.get(nextTaxId) : null) ||
            taxRates.find(rate => (rate.id ?? rate.tax_rate_id) === nextTaxId)

          return {
            ...product,
            tax_rate_id: nextTaxId,
            tax_rate: taxInfo?.rate ?? taxInfo?.tax_rate ?? null,
          }
        }

        if (field === 'quantity') {
          const nextQuantity = Math.max(1, parseFloat(value) || 1)
          return {
            ...product,
            quantity: nextQuantity,
          }
        }

        if (field === 'unit_price') {
          const nextPrice = Math.max(0, parseFloat(value) || 0)
          return {
            ...product,
            unit_price: nextPrice,
          }
        }

        if (field === 'profit_pct') {
          const nextProfit = parseFloat(value)
          return {
            ...product,
            profit_pct: Number.isNaN(nextProfit)
              ? product.profit_pct
              : nextProfit,
          }
        }

        return {
          ...product,
          [field]: value,
        }
      })
    )
  }

  const handleRemoveProduct = productId => {
    setSelectedProducts(prev =>
      prev.filter(product => product.product_id !== productId)
    )
  }

  const handleSupplyFormChange = (field, value) => {
    setSupplyForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSupplyFiltersDraftChange = (field, value) => {
    setSupplyFiltersDraft(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSupplyFiltersSubmit = event => {
    event.preventDefault()
    const nextFilters = {
      supplyId: supplyFiltersDraft.supplyId,
      limit: supplyFiltersDraft.limit,
      offset: supplyFiltersDraft.offset,
    }

    setSupplyFilters(nextFilters)
    fetchSupplyPurchases(nextFilters)
  }

  const handleRegisterSupplyPurchase = async () => {
    if (!supplyForm.supply_id) {
      alert('Debes seleccionar un insumo antes de registrar la compra.')
      return
    }

    const quantityValue = Number.parseFloat(supplyForm.quantity)
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      alert('La cantidad debe ser un número mayor a 0.')
      return
    }

    const unitCostValue = Number.parseFloat(supplyForm.unit_cost)
    if (!Number.isFinite(unitCostValue) || unitCostValue < 0) {
      alert('El costo unitario no puede ser negativo.')
      return
    }

    const payload = {
      ...supplyForm,
      quantity: quantityValue,
      unit_cost: unitCostValue,
    }

    try {
      const response = await manufacturingService.registerSupplyPurchase(
        payload
      )
      alert(
        response?.message ||
          'Compra de insumo registrada correctamente. El inventario no se ve afectado.'
      )

      const nextFilters = {
        supplyId: supplyForm.supply_id,
        limit: supplyFilters.limit,
        offset: 0,
      }

      setSupplyForm(prev => ({
        ...prev,
        quantity: '',
        unit_cost: '',
        invoice_number: '',
        notes: '',
      }))

      setSupplyFilters(nextFilters)
      setSupplyFiltersDraft(prev => ({
        ...prev,
        supplyId: supplyForm.supply_id,
        offset: 0,
        limit: supplyFilters.limit,
      }))

      fetchSupplyPurchases(nextFilters)
    } catch (error) {
      console.error('Error registrando compra de insumos:', error)
      alert(
        error?.message ||
          'No se pudo registrar la compra de insumos. Intenta nuevamente.'
      )
    }
  }

  const handleSelectTaxRate = taxRate => {
    if (!taxRate) {
      setSelectedTaxRate(null)
      return
    }

    setSelectedTaxRate(taxRate)
    const taxRateId = taxRate.id ?? taxRate.tax_rate_id ?? null
    const taxRateValue = taxRate.rate ?? taxRate.tax_rate ?? null

    setSelectedProducts(prev =>
      prev.map(product => {
        if (product.tax_rate_id) {
          return product
        }

        return {
          ...product,
          tax_rate_id: taxRateId,
          tax_rate: taxRateValue,
        }
      })
    )
  }

  const handleCreatePurchaseOrder = async () => {
    if (!selectedSupplier) {
      alert('Debe seleccionar un proveedor antes de crear la orden.')
      return
    }

    if (selectedProducts.length === 0) {
      alert('Debe agregar al menos un producto a la orden.')
      return
    }

    const supplierId =
      selectedSupplier.id ||
      selectedSupplier.supplier_id ||
      selectedSupplier.supplierId

    if (!supplierId) {
      alert('El proveedor seleccionado no tiene un ID válido.')
      return
    }

    const orderDetails = selectedProducts.map(product => ({
      product_id: product.product_id,
      quantity: parseFloat(product.quantity) || 0,
      unit_price: parseFloat(product.unit_price) || 0,
      unit: product.unit || 'unit',
      profit_pct:
        product.profit_pct === null || product.profit_pct === undefined
          ? null
          : parseFloat(product.profit_pct),
      tax_rate_id:
        product.tax_rate_id ??
        selectedTaxRate?.id ??
        selectedTaxRate?.tax_rate_id ??
        null,
    }))

    const parsedSupplierId = Number.parseInt(supplierId, 10)

    if (Number.isNaN(parsedSupplierId)) {
      alert('El ID del proveedor debe ser numérico para crear la orden.')
      return
    }

    const payload = {
      supplier_id: parsedSupplierId,
      status: orderData.isPaid ? 'COMPLETED' : 'PENDING',
      order_details: orderDetails,
      auto_update_prices: Boolean(orderData.auto_update_prices),
      default_profit_margin:
        parseFloat(orderData.default_profit_margin) || 30.0,
      payment_method_id: orderData.payment_method_id
        ? parseInt(orderData.payment_method_id)
        : null,
      currency_id: orderData.currency_id
        ? parseInt(orderData.currency_id)
        : null,
    }

    try {
      const { default: purchaseService } = await import(
        '@/services/purchaseService'
      )

      const validation = purchaseService.validatePurchaseData(payload)

      if (!validation.isValid) {
        alert(
          `Corrige los siguientes campos antes de continuar:\n- ${validation.errors.join(
            '\n- '
          )}`
        )
        return
      }

      const response = await createEnhancedPurchaseOrder(payload)

      if (response?.success) {
        alert(
          response.message ||
            'Orden de compra creada exitosamente. Puedes consultarla en la pestaña de registros.'
        )
        setSelectedProducts([])
        setSelectedSupplier(null)
        setSelectedTaxRate(null)
        setOrderData({
          auto_update_prices: true,
          default_profit_margin: 30.0,
          isPaid: false,
          payment_method_id: null,
          currency_id: null,
        })
        await loadPurchases()
      } else {
        alert(response?.error || 'No se pudo crear la orden de compra.')
      }
    } catch (error) {
      console.error('Error creando la orden de compra:', error)
      alert(error?.message || 'Ocurrió un error al crear la orden de compra.')
    }
  }

  const handleShowAnalysis = async orderId => {
    if (!orderId) return

    setShowAnalysis({ order_id: orderId })

    try {
      const [analysisResponse, validationResponse] = await Promise.all([
        getPurchaseOrderAnalysis(orderId),
        validatePurchaseOrderIntegrity(orderId),
      ])

      setShowAnalysis({
        order_id: orderId,
        analysis: analysisResponse?.success ? analysisResponse.data : null,
        validation: validationResponse?.success
          ? validationResponse.data
          : null,
      })
    } catch (error) {
      console.error('Error obteniendo análisis de la orden:', error)
      alert('No se pudo cargar el análisis de la orden seleccionada.')
      setShowAnalysis(null)
    }
  }

  const handleShowOrderDetails = async (orderId, supplierName) => {
    if (!orderId) return

    setShowOrderDetails({
      order_id: orderId,
      supplier_name: supplierName,
      data: null,
      loading: true,
    })

    try {
      const { default: purchaseService } = await import(
        '@/services/purchaseService'
      )
      const response =
        await purchaseService.getPurchaseOrderByIdWithSupplierValidation(
          orderId,
          supplierName || ''
        )

      if (response.success) {
        setShowOrderDetails({
          order_id: orderId,
          supplier_name: supplierName,
          data: response.data,
          loading: false,
        })
      } else {
        alert(
          response.error ||
            'No se pudo obtener el detalle completo de la orden.'
        )
        setShowOrderDetails(null)
      }
    } catch (error) {
      console.error('Error obteniendo detalles de la orden:', error)
      alert('Ocurrió un error al obtener los detalles de la orden.')
      setShowOrderDetails(null)
    }
  }

  const handleOpenCancellationModal = order => {
    setOrderToCancel(order)
    setShowCancellationModal(true)
  }

  const handleCloseCancellationModal = () => {
    setShowCancellationModal(false)
    setOrderToCancel(null)
  }

  const handleCancellationComplete = async result => {
    if (result.success) {
      console.log('Order cancelled successfully:', result)
      // Refresh the search results to show updated status
      try {
        if (supplierSearchTerm.trim()) {
          await searchPurchaseOrders() // Re-ejecutar la búsqueda actual
        } else {
          await loadPurchases() // Recargar todas las compras si no hay búsqueda activa
        }
      } catch (error) {
        console.error('Error refreshing data after cancellation:', error)
        // Still close the modal even if refresh fails
      }
      // Close the modal after successful cancellation
      handleCloseCancellationModal()
    }
  }

  if (loading && products.length === 0) {
    return <DataState variant='loading' skeletonVariant='list' />
  }

  if (error) {
    return (
      <DataState
        variant='error'
        title='Error al cargar datos'
        message={error}
        onRetry={() => {
          clearError()
          fetchProducts()
          fetchSuppliers()
        }}
      />
    )
  }

  return (
    <div className='py-4 px-2 lg:px-4 w-full max-w-full'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h1 className={styles.header('h1')}>
            {t('purchases.title', 'Compras')}
          </h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <div className='flex items-center justify-between mb-4'>
          <TabsList className='grid w-full grid-cols-3 max-w-md'>
            <TabsTrigger value='create' className='flex items-center gap-2'>
              <Plus className='w-4 h-4' />
              Nueva Orden
            </TabsTrigger>
            <TabsTrigger value='records' className='flex items-center gap-2'>
              <FileText className='w-4 h-4' />
              Lista de Órdenes
            </TabsTrigger>
            <TabsTrigger
              value='supplyPurchases'
              className='flex items-center gap-2'
            >
              <Package className='w-4 h-4' />
              Compras de Insumos
            </TabsTrigger>
          </TabsList>

          {/* Test Button for Development */}
          <Button
            onClick={() => window.open('/test-purchase-endpoints', '_blank')}
            variant='outline'
            size='sm'
            className='text-xs'
          >
            <Settings className='w-4 h-4 mr-1' />
            Probar Endpoints
          </Button>
        </div>

        {/* Create Purchase Order Tab */}
        <TabsContent value='create' className='space-y-4'>
          {/* Configuration Section - Compact */}
          <div className='border-0 bg-transparent'>
            <div className='py-2 px-1'>
              <div className='flex items-center gap-2 text-lg mb-3'>
                <Settings className='w-4 h-4' />
                Configuración de Orden
              </div>
            </div>
            <div className='px-1'>
              <style>{`
                .purchase-config-grid {
                  display: grid !important;
                  grid-template-columns: 1fr;
                  gap: 1rem;
                }
                @media (min-width: 768px) {
                  .purchase-config-grid {
                    grid-template-columns: 1fr 1fr !important;
                  }
                }
              `}</style>
              <div className='purchase-config-grid'>
                {/* Left Column - Supplier Selection */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Proveedor</label>
                  <Button
                    onClick={() => setShowSupplierModal(true)}
                    variant='outline'
                    className='w-full justify-start h-9'
                    size='sm'
                  >
                    <User className='w-4 h-4 mr-2' />
                    {selectedSupplier
                      ? selectedSupplier.name
                      : 'Seleccionar Proveedor'}
                  </Button>
                  {selectedSupplier && (
                    <div className='text-xs text-muted-foreground'>
                      ID: {selectedSupplier.id} •{' '}
                      {selectedSupplier.email || 'Sin email'}
                    </div>
                  )}
                </div>

                {/* Right Column - Product Selection */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Productos</label>
                  <Button
                    onClick={() => setShowProductModal(true)}
                    variant='outline'
                    className='w-full justify-start h-9'
                    size='sm'
                  >
                    <Package className='w-4 h-4 mr-2' />
                    Agregar Productos
                  </Button>
                  {selectedProducts.length > 0 && (
                    <div className='text-xs text-muted-foreground'>
                      {selectedProducts.length} producto(s) seleccionado(s)
                    </div>
                  )}
                </div>
              </div>

              {/* Configuration Section - Compact */}
              <div className='mt-4'>
                <h4 className='font-medium mb-2 text-sm'>
                  Configuración Avanzada
                </h4>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        id='autoPricing'
                        checked={orderData.auto_update_prices}
                        onChange={e =>
                          setOrderData(prev => ({
                            ...prev,
                            auto_update_prices: e.target.checked,
                          }))
                        }
                        className='w-4 h-4'
                      />
                      <label htmlFor='autoPricing' className='text-sm'>
                        Auto-actualizar precios
                      </label>
                    </div>

                    <div className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        id='isPaid'
                        checked={orderData.isPaid}
                        onChange={e =>
                          setOrderData(prev => ({
                            ...prev,
                            isPaid: e.target.checked,
                          }))
                        }
                        className='w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500'
                      />
                      <label
                        htmlFor='isPaid'
                        className='text-sm flex items-center gap-1'
                      >
                        <span
                          className={
                            orderData.isPaid ? 'text-green-600 font-medium' : ''
                          }
                        >
                          PAGADO
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          ({orderData.isPaid ? 'COMPLETED' : 'PENDING'})
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className='text-sm font-medium'>
                      Margen de ganancia por defecto (%)
                    </label>
                    <Input
                      type='number'
                      min='0'
                      max='1000'
                      step='0.1'
                      value={orderData.default_profit_margin}
                      onChange={e =>
                        setOrderData(prev => ({
                          ...prev,
                          default_profit_margin:
                            parseFloat(e.target.value) || 30,
                        }))
                      }
                      className='mt-1 h-8'
                      size='sm'
                    />
                  </div>

                  <div className='space-y-2'>
                    {/* Payment Method Selector */}
                    <div>
                      <label className='text-sm font-medium'>
                        Método de Pago
                      </label>
                      <div className='mt-1'>
                        <PaymentMethodSelector
                          value={orderData.payment_method_id}
                          onChange={method => {
                            console.log('🔍 PaymentMethod Selected:', method)
                            setOrderData(prev => ({
                              ...prev,
                              payment_method_id: method?.id || null,
                            }))
                          }}
                          placeholder='Seleccionar método de pago...'
                          showSearch={true}
                          size='sm'
                        />
                      </div>
                    </div>

                    {/* Currency Selector */}
                    <div>
                      <label className='text-sm font-medium'>Moneda</label>
                      <div className='mt-1'>
                        <CurrencySelector
                          value={orderData.currency_id}
                          onChange={currency => {
                            console.log('🔍 Currency Selected:', currency)
                            setOrderData(prev => ({
                              ...prev,
                              currency_id: currency?.id || null,
                            }))
                          }}
                          placeholder='Seleccionar moneda...'
                          showSearch={true}
                          size='sm'
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Products Table */}
          {selectedProducts.length > 0 && (
            <Card className={styles.card()}>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span className='flex items-center gap-2'>
                    <ShoppingCart className='w-5 h-5' />
                    Productos Seleccionados ({selectedProducts.length})
                  </span>
                  <div className='text-right'>
                    <div className='text-sm text-muted-foreground'>Total:</div>
                    <div className='text-lg font-bold'>
                      {formatGuaranies(orderTotals.total)}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='text-left p-3 font-medium'>Producto</th>
                        <th className='text-center p-3 font-medium'>
                          Cantidad
                        </th>
                        <th className='text-center p-3 font-medium'>
                          Precio Unit.
                          <br />
                          <span className='text-xs text-muted-foreground'>
                            (inc. IVA)
                          </span>
                        </th>
                        <th className='text-center p-3 font-medium'>Unidad</th>
                        <th className='text-center p-3 font-medium'>
                          Margen %
                        </th>
                        <th className='text-center p-3 font-medium'>
                          IVA
                          <br />
                          <span className='text-xs text-muted-foreground'>
                            (referencial)
                          </span>
                        </th>
                        <th className='text-center p-3 font-medium'>Total</th>
                        <th className='text-center p-3 font-medium'>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.map(product => (
                        <tr key={product.product_id} className='border-t'>
                          <td className='p-3'>
                            <div>
                              <div className='font-medium'>{product.name}</div>
                              <div className='text-sm text-muted-foreground'>
                                {product.product_id}
                              </div>
                            </div>
                          </td>
                          <td className='p-3 text-center'>
                            <Input
                              type='number'
                              min='1'
                              value={product.quantity}
                              onChange={e =>
                                handleUpdateProduct(
                                  product.product_id,
                                  'quantity',
                                  e.target.value
                                )
                              }
                              className='w-20 text-center'
                            />
                          </td>
                          <td className='p-3 text-center'>
                            <Input
                              type='number'
                              min='0'
                              step='0.01'
                              value={product.unit_price}
                              onChange={e =>
                                handleUpdateProduct(
                                  product.product_id,
                                  'unit_price',
                                  e.target.value
                                )
                              }
                              className='w-24 text-center'
                            />
                          </td>
                          <td className='p-3 text-center'>
                            <select
                              value={product.unit}
                              onChange={e =>
                                handleUpdateProduct(
                                  product.product_id,
                                  'unit',
                                  e.target.value
                                )
                              }
                              className='border rounded px-2 py-1 text-sm bg-white hover:bg-gray-50'
                            >
                              <optgroup label='📦 Básicas'>
                                <option value='unit'>unidad</option>
                                <option value='pair'>par</option>
                                <option value='set'>set</option>
                              </optgroup>
                              <optgroup label='⚖️ Peso'>
                                <option value='kg'>kilogramo</option>
                                <option value='g'>gramo</option>
                                <option value='lb'>libra</option>
                                <option value='oz'>onza</option>
                                <option value='ton'>tonelada</option>
                              </optgroup>
                              <optgroup label='💧 Volumen'>
                                <option value='l'>litro</option>
                                <option value='ml'>mililitro</option>
                                <option value='gal'>galón</option>
                              </optgroup>
                              <optgroup label='📏 Longitud/Área'>
                                <option value='meter'>metro</option>
                                <option value='cm'>centímetro</option>
                                <option value='sqm'>metro cuadrado</option>
                                <option value='roll'>rollo</option>
                              </optgroup>
                              <optgroup label='📦 Empaque'>
                                <option value='box'>caja</option>
                                <option value='pack'>paquete</option>
                                <option value='bag'>bolsa</option>
                                <option value='case'>estuche</option>
                                <option value='dozen'>docena</option>
                                <option value='bundle'>bulto</option>
                              </optgroup>
                              <optgroup label='🍽️ Supermercado'>
                                <option value='tray'>bandeja</option>
                                <option value='bottle'>botella</option>
                                <option value='can'>lata</option>
                                <option value='jar'>frasco</option>
                                <option value='carton'>cartón</option>
                                <option value='stick'>barra</option>
                                <option value='slice'>tajada</option>
                                <option value='portion'>porción</option>
                              </optgroup>
                              <optgroup label='⏱️ Tiempo'>
                                <option value='hour'>hora</option>
                                <option value='day'>día</option>
                                <option value='month'>mes</option>
                              </optgroup>
                            </select>
                          </td>
                          <td className='p-3 text-center'>
                            <Input
                              type='number'
                              min='0'
                              max='1000'
                              step='0.1'
                              value={product.profit_pct}
                              onChange={e =>
                                handleUpdateProduct(
                                  product.product_id,
                                  'profit_pct',
                                  e.target.value
                                )
                              }
                              className='w-20 text-center'
                            />
                          </td>
                          <td className='p-3 text-center'>
                            <select
                              value={product.tax_rate_id || ''}
                              onChange={e =>
                                handleUpdateProduct(
                                  product.product_id,
                                  'tax_rate_id',
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : null
                                )
                              }
                              className='border rounded px-2 py-1 text-sm w-32'
                            >
                              <option value=''>Sin IVA (0%)</option>
                              {taxRates.map(taxRate => (
                                <option key={taxRate.id} value={taxRate.id}>
                                  {taxRate.tax_name || taxRate.name || 'IVA'} -{' '}
                                  {taxRate.rate}%
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className='p-3 text-center font-medium'>
                            {formatGuaranies(
                              product.quantity * product.unit_price
                            )}
                          </td>
                          <td className='p-3 text-center'>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() =>
                                handleRemoveProduct(product.product_id)
                              }
                              className='text-red-600 hover:text-red-800'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Order Summary */}
                <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
                  <div className='mb-3 text-center'>
                    <div className='inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'>
                      <span>ℹ️</span>
                      <span>Los precios del proveedor ya incluyen IVA</span>
                    </div>
                  </div>
                  <div className='grid grid-cols-3 gap-4 text-center'>
                    <div>
                      <div className='text-sm text-muted-foreground'>
                        Base (sin IVA)
                      </div>
                      <div className='font-medium text-muted-foreground'>
                        {formatGuaranies(orderTotals.subtotal)}
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-muted-foreground'>
                        IVA incluido ({orderTotals.taxRate.toFixed(1)}%)
                      </div>
                      <div className='font-medium text-muted-foreground'>
                        {formatGuaranies(orderTotals.tax)}
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-muted-foreground'>
                        Total a Pagar
                      </div>
                      <div className='text-lg font-bold'>
                        {formatGuaranies(orderTotals.total)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Summary Section - Below Products */}
          {selectedProducts.length > 0 && (
            <Card className={styles.card()}>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ShoppingCart className='w-5 h-5' />
                  Resumen de Compra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg text-center mb-6'>
                  <div>
                    <div className='text-sm text-muted-foreground'>
                      Productos
                    </div>
                    <div className='font-medium'>{selectedProducts.length}</div>
                  </div>
                  <div>
                    <div className='text-sm text-muted-foreground'>
                      Base (sin IVA)
                    </div>
                    <div className='font-medium text-muted-foreground'>
                      {formatGuaranies(orderTotals.subtotal)}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm text-muted-foreground'>
                      IVA incluido ({orderTotals.taxRate.toFixed(1)}%)
                    </div>
                    <div className='font-medium text-muted-foreground'>
                      {formatGuaranies(orderTotals.tax)}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm text-muted-foreground'>
                      Total a Pagar
                    </div>
                    <div className='text-lg font-bold'>
                      {formatGuaranies(orderTotals.total)}
                    </div>
                  </div>
                </div>

                {/* Create Order Button */}
                <div className='flex justify-end'>
                  <Button
                    onClick={handleCreatePurchaseOrder}
                    disabled={
                      !selectedSupplier ||
                      selectedProducts.length === 0 ||
                      loading
                    }
                    className={`${styles.button(
                      'primary'
                    )} flex items-center gap-2`}
                  >
                    {loading ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className='w-5 h-5' />
                        Crear Orden de Compra
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modal Components */}
          <SupplierSelectionModal
            isOpen={showSupplierModal}
            onClose={() => setShowSupplierModal(false)}
            onSelectSupplier={handleSelectSupplier}
            selectedSupplier={selectedSupplier}
          />

          <ProductSelectionModal
            isOpen={showProductModal}
            onClose={() => setShowProductModal(false)}
            onSelectProduct={handleSelectProduct}
            selectedProductIds={selectedProductIds}
          />

          <TaxSelectionModal
            isOpen={showTaxModal}
            onClose={() => setShowTaxModal(false)}
            onSelectTaxRate={handleSelectTaxRate}
            selectedTaxRate={selectedTaxRate}
          />
        </TabsContent>

        {/* Purchase Records Tab - Enhanced with Rich Data */}
        <TabsContent value='records' className='space-y-4'>
          <style>{`
            .purchase-records-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }
            @media (min-width: 768px) {
              .purchase-records-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }

            .purchase-detail-summary {
              display: grid;
              grid-template-columns: repeat(1, minmax(0, 1fr));
              gap: 0.75rem;
              margin-bottom: 1rem;
            }
            @media (min-width: 640px) {
              .purchase-detail-summary {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }
            @media (min-width: 1024px) {
              .purchase-detail-summary {
                grid-template-columns: repeat(4, minmax(0, 1fr));
              }
            }

            .purchase-detail-summary-item {
              border: 1px solid var(--border, rgba(148, 163, 184, 0.35));
              border-radius: 14px;
              background: color-mix(in srgb, var(--card, #ffffff) 94%, var(--primary, #7c3aed) 6%);
              padding: 0.9rem 1rem;
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
              box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
            }

            .purchase-detail-summary-item span {
              font-size: 0.75rem;
              color: var(--muted-foreground, #6b7280);
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }

            .purchase-detail-summary-item strong {
              font-size: 1rem;
              color: var(--foreground, #111827);
            }

            .purchase-detail-grid {
              display: grid;
              grid-template-columns: repeat(1, minmax(0, 1fr));
              gap: 1rem;
            }
            @media (min-width: 768px) {
              .purchase-detail-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }

            .purchase-detail-card {
              border: 1px solid var(--border, rgba(148, 163, 184, 0.35));
              border-radius: 18px;
              background: linear-gradient(145deg, color-mix(in srgb, var(--card, #ffffff) 98%, var(--primary, #7c3aed) 2%), color-mix(in srgb, var(--card, #ffffff) 92%, var(--primary, #7c3aed) 8%));
              padding: 1rem 1.15rem;
              box-shadow: 0 18px 30px rgba(15, 23, 42, 0.08);
              display: flex;
              flex-direction: column;
              gap: 0.9rem;
              position: relative;
              overflow: hidden;
            }

            .purchase-detail-card::after {
              content: "";
              position: absolute;
              inset: 0;
              border-radius: inherit;
              pointer-events: none;
              border: 1px solid rgba(255, 255, 255, 0.14);
              mix-blend-mode: overlay;
            }

            .purchase-detail-card__header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 1rem;
            }

            .purchase-detail-card__title {
              font-weight: 600;
              font-size: 0.95rem;
              color: var(--foreground, #111827);
            }

            .purchase-detail-card__meta {
              font-size: 0.75rem;
              color: var(--muted-foreground, #6b7280);
            }

            .purchase-detail-rows {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0.8rem;
            }
            @media (max-width: 540px) {
              .purchase-detail-rows {
                grid-template-columns: 1fr;
              }
            }

            .purchase-detail-row {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
              font-size: 0.8rem;
            }

            .purchase-detail-row span {
              font-size: 0.7rem;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              color: var(--muted-foreground, #6b7280);
            }

            .purchase-detail-row strong {
              font-size: 0.95rem;
              color: var(--foreground, #111827);
            }

            .purchase-detail-profit {
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-size: 0.8rem;
              padding-top: 0.4rem;
              border-top: 1px dashed rgba(148, 163, 184, 0.4);
            }

            .purchase-detail-profit span {
              color: var(--muted-foreground, #6b7280);
              font-size: 0.7rem;
            }

            .purchase-detail-profit strong {
              color: var(--primary, #7c3aed);
              font-weight: 600;
            }

            .purchase-detail-more {
              margin-top: 1rem;
              padding: 0.8rem 1rem;
              border: 1px dashed var(--border, rgba(148, 163, 184, 0.45));
              border-radius: 12px;
              font-size: 0.75rem;
              color: var(--muted-foreground, #6b7280);
              text-align: center;
              background: color-mix(in srgb, var(--card, #ffffff) 92%, rgba(124, 58, 237, 0.08) 8%);
            }
          `}</style>
          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='w-5 h-5' />
                Registros de Compras - Búsqueda Avanzada
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Mode Selector */}
              <div className='space-y-4'>
                <div className='flex items-center gap-4'>
                  <label className='text-sm font-medium'>
                    Tipo de consulta:
                  </label>
                  <div className='flex gap-2'>
                    <Button
                      onClick={() => setSearchMode('recent')}
                      variant={searchMode === 'recent' ? 'default' : 'outline'}
                      size='sm'
                    >
                      <Calendar className='w-4 h-4 mr-1' />
                      Recientes (30 días)
                    </Button>
                    <Button
                      onClick={() => setSearchMode('supplier')}
                      variant={
                        searchMode === 'supplier' ? 'default' : 'outline'
                      }
                      size='sm'
                    >
                      <User className='w-4 h-4 mr-1' />
                      Por Proveedor/ID
                    </Button>
                    <Button
                      onClick={() => setSearchMode('dateRange')}
                      variant={
                        searchMode === 'dateRange' ? 'default' : 'outline'
                      }
                      size='sm'
                    >
                      <Calendar className='w-4 h-4 mr-1' />
                      Por Rango de Fechas
                    </Button>
                  </div>
                </div>

                {/* Search by Supplier */}
                {searchMode === 'supplier' && (
                  <div className='space-y-4'>
                    <div className='flex items-center gap-4'>
                      <label className='text-sm font-medium min-w-fit'>
                        Nombre del proveedor o ID:
                      </label>
                      <Input
                        placeholder='Ej: TechBody, Suministros Varios 55... o ID: 123'
                        value={supplierSearchTerm}
                        onChange={e => setSupplierSearchTerm(e.target.value)}
                        className='flex-1'
                        onKeyPress={e =>
                          e.key === 'Enter' && searchPurchaseOrders()
                        }
                      />
                      <div className='text-xs text-muted-foreground'>
                        Busca por nombre de proveedor o ID de proveedor
                      </div>
                    </div>

                    {/* Supplier Status Filter */}
                    <div className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        id='showInactiveSuppliers'
                        checked={showInactiveSuppliers}
                        onChange={e =>
                          setShowInactiveSuppliers(e.target.checked)
                        }
                        className='rounded border border-input bg-background'
                      />
                      <label
                        htmlFor='showInactiveSuppliers'
                        className='text-sm'
                      >
                        Incluir proveedores inactivos
                      </label>
                      <div className='text-xs text-muted-foreground ml-2'>
                        {showInactiveSuppliers
                          ? 'Mostrando todos los proveedores'
                          : 'Solo proveedores activos'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search by Date Range */}
                {searchMode === 'dateRange' && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                      <div>
                        <label className='text-sm font-medium'>
                          Fecha inicio:
                        </label>
                        <Input
                          type='date'
                          value={dateRange.startDate}
                          onChange={e =>
                            setDateRange(prev => ({
                              ...prev,
                              startDate: e.target.value,
                            }))
                          }
                          className='mt-1'
                        />
                      </div>
                      <div>
                        <label className='text-sm font-medium'>
                          Fecha fin:
                        </label>
                        <Input
                          type='date'
                          value={dateRange.endDate}
                          onChange={e =>
                            setDateRange(prev => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                          className='mt-1'
                        />
                      </div>
                      <div>
                        <label className='text-sm font-medium'>Página:</label>
                        <Input
                          type='number'
                          min='1'
                          value={dateRange.page}
                          onChange={e =>
                            setDateRange(prev => ({
                              ...prev,
                              page: parseInt(e.target.value) || 1,
                            }))
                          }
                          className='mt-1'
                        />
                      </div>
                      <div>
                        <label className='text-sm font-medium'>
                          Registros por página:
                        </label>
                        <select
                          value={dateRange.pageSize}
                          onChange={e =>
                            setDateRange(prev => ({
                              ...prev,
                              pageSize: parseInt(e.target.value),
                            }))
                          }
                          className='mt-1 w-full border rounded px-3 py-2'
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>

                    {/* Supplier Status Filter for Date Range */}
                    <div className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        id='showInactiveSuppliersDateRange'
                        checked={showInactiveSuppliers}
                        onChange={e =>
                          setShowInactiveSuppliers(e.target.checked)
                        }
                        className='rounded border border-input bg-background'
                      />
                      <label
                        htmlFor='showInactiveSuppliersDateRange'
                        className='text-sm'
                      >
                        Incluir proveedores inactivos
                      </label>
                      <div className='text-xs text-muted-foreground ml-2'>
                        {showInactiveSuppliers
                          ? 'Mostrando todos los proveedores'
                          : 'Solo proveedores activos'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Button */}
                <div className='flex justify-end'>
                  <Button
                    onClick={searchPurchaseOrders}
                    disabled={searchLoading}
                    className='flex items-center gap-2'
                  >
                    {searchLoading ? (
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current'></div>
                    ) : (
                      <Search className='w-4 h-4' />
                    )}
                    {searchLoading ? 'Consultando...' : 'Consultar Registros'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section with Enhanced Data */}
          {searchResults.length === 0 && !searchLoading ? (
            <EmptyState
              icon={FileText}
              title='No hay registros de compras'
              description="Usa el botón 'Consultar Registros' para buscar compras por proveedor, rango de fechas o ver las recientes (últimos 30 días)"
              actionLabel='Configurar Búsqueda'
              onAction={() => {
                setSearchMode('recent')
                // No automatic search - user must click the search button
              }}
            />
          ) : (
            <div className='space-y-4'>
              {/* Results Summary */}
              {searchResults.length > 0 && (
                <div className='border-0 bg-transparent'>
                  <div className='px-1 py-1'>
                    <div className='flex items-center justify-between text-sm'>
                      <div className='text-muted-foreground'>
                        <strong>{searchResults.length}</strong> registros
                        encontrados
                        {searchMode === 'supplier' && supplierSearchTerm && (
                          <span>
                            {' '}
                            - "<strong>{supplierSearchTerm}</strong>"
                          </span>
                        )}
                        {searchMode === 'dateRange' && dateRange.startDate && (
                          <span>
                            {' '}
                            - {dateRange.startDate} a {dateRange.endDate}
                          </span>
                        )}
                        {searchMode === 'recent' && (
                          <span> - últimos 30 días</span>
                        )}
                        <span className='text-xs ml-2'>
                          (
                          {showInactiveSuppliers
                            ? 'Todos los proveedores'
                            : 'Solo proveedores activos'}
                          )
                        </span>
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {searchResults.reduce(
                          (total, order) =>
                            total + (order.details?.length || 0),
                          0
                        )}{' '}
                        productos
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Records Display */}
              <div className='purchase-records-grid'>
                {searchResults.map((orderData, index) => {
                  const order = orderData.purchase
                  const details = orderData.details || []
                  const topDetails = details.slice(0, 5)
                  const remainingCount = Math.max(
                    details.length - topDetails.length,
                    0
                  )
                  const totalQuantity = details.reduce(
                    (sum, detail) => sum + (detail?.quantity || 0),
                    0
                  )
                  const totalPurchaseAmount = details.reduce((sum, detail) => {
                    const subtotal = detail?.subtotal
                    if (typeof subtotal === 'number') return sum + subtotal
                    const qty = detail?.quantity || 0
                    const price = detail?.unit_price || 0
                    return sum + qty * price
                  }, 0)
                  const potentialSaleAmount = details.reduce((sum, detail) => {
                    if (!detail?.sale_price) return sum
                    const qty = detail?.quantity || 0
                    return sum + detail.sale_price * (qty || 1)
                  }, 0)
                  const marginValues = details
                    .map(
                      detail =>
                        detail?.profit_pct ??
                        detail?.metadata?.profit_pct ??
                        null
                    )
                    .filter(value => typeof value === 'number')
                  const averageMargin =
                    marginValues.length > 0
                      ? marginValues.reduce((sum, value) => sum + value, 0) /
                        marginValues.length
                      : null

                  return (
                    <Card
                      key={order?.id || index}
                      className={`${styles.card()} h-full`}
                    >
                      <CardContent className='p-6'>
                        <div className='flex items-start justify-between mb-4'>
                          <div className='space-y-2'>
                            <div className='flex items-center gap-3'>
                              <h3 className='font-bold'>
                                Registro #{order?.id}
                              </h3>
                              <Badge
                                variant={
                                  order?.status === 'COMPLETED'
                                    ? 'success'
                                    : 'secondary'
                                }
                              >
                                {translatePurchaseStatus(order?.status, t)}
                              </Badge>
                              <Badge variant='outline' className='text-xs'>
                                {details.length} productos
                              </Badge>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground'>
                              <div className='space-y-1'>
                                <div className='flex items-center gap-2'>
                                  <User className='w-4 h-4' />
                                  <span className='font-medium'>
                                    {order?.supplier_name}
                                  </span>
                                  <span className='text-xs'>
                                    (ID: {order?.supplier_id})
                                  </span>
                                  {order?.supplier_status === false && (
                                    <Badge
                                      variant='destructive'
                                      className='text-xs'
                                    >
                                      Inactivo
                                    </Badge>
                                  )}
                                </div>
                                <div className='flex items-center gap-2'>
                                  <Calendar className='w-4 h-4' />
                                  {order?.order_date
                                    ? new Date(
                                        order.order_date
                                      ).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : 'Fecha no disponible'}
                                </div>
                              </div>
                              <div className='space-y-1'>
                                <div className='flex items-center gap-2'>
                                  <DollarSign className='w-4 h-4' />
                                  <span className='font-bold text-green-600 text-base'>
                                    {formatGuaranies(order?.total_amount)}
                                  </span>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <User className='w-4 h-4' />
                                  <span>
                                    Por: {order?.user_name || 'No disponible'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className='flex gap-2'>
                            {order?.id && (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => handleShowAnalysis(order.id)}
                                title='Análisis detallado'
                              >
                                <BarChart3 className='w-4 h-4' />
                              </Button>
                            )}
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                handleShowOrderDetails(
                                  order?.id,
                                  order?.supplier_name
                                )
                              }
                              title='Ver detalles completos con validación'
                            >
                              <Eye className='w-4 h-4' />
                            </Button>
                            {order?.status !== 'CANCELLED' && (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  handleOpenCancellationModal(order)
                                }
                                title='Cancelar orden de compra'
                                className='text-red-600 hover:text-red-700 hover:bg-red-50'
                              >
                                <X className='w-4 h-4' />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Enhanced Product Details Presentation */}
                        {details.length > 0 && (
                          <div className='border-t pt-4'>
                            <h4 className='text-sm font-medium mb-3'>
                              Detalle de productos ({details.length}):
                            </h4>

                            <div className='purchase-detail-summary'>
                              <div className='purchase-detail-summary-item'>
                                <span>Cantidad total</span>
                                <strong>{totalQuantity}</strong>
                              </div>
                              <div className='purchase-detail-summary-item'>
                                <span>Subtotal compra</span>
                                <strong>
                                  {formatGuaranies(totalPurchaseAmount)}
                                </strong>
                              </div>
                              <div className='purchase-detail-summary-item'>
                                <span>Venta estimada</span>
                                <strong>
                                  {potentialSaleAmount > 0
                                    ? formatGuaranies(potentialSaleAmount)
                                    : 'N/A'}
                                </strong>
                              </div>
                              <div className='purchase-detail-summary-item'>
                                <span>Margen promedio</span>
                                <strong>
                                  {averageMargin !== null
                                    ? `${averageMargin.toFixed(1)}%`
                                    : 'N/A'}
                                </strong>
                              </div>
                            </div>

                            <div className='purchase-detail-grid'>
                              {topDetails.map((detail, idx) => {
                                const profit =
                                  detail?.profit_pct ??
                                  detail?.metadata?.profit_pct ??
                                  null
                                const formattedProfit =
                                  typeof profit === 'number'
                                    ? `${profit.toFixed(1)}% margen`
                                    : null
                                const salePriceText = detail?.sale_price
                                  ? `${formatGuaranies(detail.sale_price)}${
                                      formattedProfit
                                        ? ` · ${formattedProfit}`
                                        : ''
                                    }`
                                  : 'N/A'

                                return (
                                  <article
                                    key={detail.id || idx}
                                    className='purchase-detail-card'
                                  >
                                    <div className='purchase-detail-card__header'>
                                      <div>
                                        <div className='purchase-detail-card__title'>
                                          {detail.product_name}
                                        </div>
                                        <div className='purchase-detail-card__meta'>
                                          ID: {detail.product_id}
                                        </div>
                                      </div>
                                      <Badge
                                        variant='outline'
                                        className='text-xs px-2 py-1'
                                      >
                                        {detail.unit ||
                                          detail.metadata?.unit ||
                                          'unit'}
                                      </Badge>
                                    </div>

                                    {detail.metadata && (
                                      <div className='flex gap-2 flex-wrap text-xs text-muted-foreground'>
                                        <Badge
                                          variant='outline'
                                          className='text-xs'
                                        >
                                          Enriquecido
                                        </Badge>
                                        {detail.metadata?.category && (
                                          <Badge
                                            variant='outline'
                                            className='text-xs'
                                          >
                                            {detail.metadata.category}
                                          </Badge>
                                        )}
                                      </div>
                                    )}

                                    <div className='purchase-detail-rows'>
                                      <div className='purchase-detail-row'>
                                        <span>Cantidad</span>
                                        <strong>{detail.quantity}</strong>
                                      </div>
                                      <div className='purchase-detail-row'>
                                        <span>Precio unitario (IVA inc.)</span>
                                        <strong>
                                          {formatGuaranies(detail.unit_price)}
                                        </strong>
                                      </div>
                                      <div className='purchase-detail-row'>
                                        <span>Subtotal</span>
                                        <strong>
                                          {formatGuaranies(
                                            detail.subtotal ??
                                              (detail.quantity || 0) *
                                                (detail.unit_price || 0)
                                          )}
                                        </strong>
                                      </div>
                                      <div className='purchase-detail-row'>
                                        <span>Fecha de vencimiento</span>
                                        <strong>
                                          {detail.exp_date
                                            ? new Date(
                                                detail.exp_date
                                              ).toLocaleDateString()
                                            : 'N/A'}
                                        </strong>
                                      </div>
                                    </div>

                                    <div className='purchase-detail-profit'>
                                      <span>Precio de venta sugerido</span>
                                      <strong>{salePriceText}</strong>
                                    </div>
                                  </article>
                                )
                              })}
                            </div>

                            {remainingCount > 0 && (
                              <div className='purchase-detail-more'>
                                ... y {remainingCount} producto(s) adicional(es)
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Pagination info for date range searches */}
              {searchMode === 'dateRange' && searchResults.length > 0 && (
                <Card className={styles.card()}>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between text-sm text-muted-foreground'>
                      <span>
                        Página <strong>{dateRange.page}</strong> de resultados
                        (máximo {dateRange.pageSize} registros por página)
                      </span>
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            setDateRange(prev => ({
                              ...prev,
                              page: Math.max(1, prev.page - 1),
                            }))
                          }}
                          disabled={dateRange.page <= 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            setDateRange(prev => ({
                              ...prev,
                              page: prev.page + 1,
                            }))
                          }}
                          disabled={searchResults.length < dateRange.pageSize}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value='supplyPurchases' className='space-y-4'>
          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Registrar compra de insumos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className='space-y-4'
                onSubmit={event => {
                  event.preventDefault()
                  handleRegisterSupplyPurchase()
                }}
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Insumo</label>
                    <select
                      value={supplyForm.supply_id}
                      onChange={e =>
                        handleSupplyFormChange('supply_id', e.target.value)
                      }
                      className='border rounded px-3 py-2 text-sm bg-background'
                      disabled={suppliesLoading}
                    >
                      <option value=''>Seleccionar insumo...</option>
                      {suppliesLoading && (
                        <option value='' disabled>
                          Cargando insumos...
                        </option>
                      )}
                      {supplies.map(supply => (
                        <option key={supply.id} value={supply.id}>
                          {supply.name}
                          {supply.unit ? ` (${supply.unit})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className='text-xs text-muted-foreground'>
                      Si no encuentras el insumo, créalo desde el módulo de
                      manufactura.
                    </p>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Cantidad</label>
                      <Input
                        type='number'
                        min='0'
                        step='0.01'
                        value={supplyForm.quantity}
                        onChange={e =>
                          handleSupplyFormChange('quantity', e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>
                        Costo unitario
                      </label>
                      <Input
                        type='number'
                        min='0'
                        step='0.01'
                        value={supplyForm.unit_cost}
                        onChange={e =>
                          handleSupplyFormChange('unit_cost', e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      Proveedor (opcional)
                    </label>
                    <Input
                      value={supplyForm.supplier_name}
                      onChange={e =>
                        handleSupplyFormChange('supplier_name', e.target.value)
                      }
                      placeholder='Nombre del proveedor'
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      Número de factura (opcional)
                    </label>
                    <Input
                      value={supplyForm.invoice_number}
                      onChange={e =>
                        handleSupplyFormChange('invoice_number', e.target.value)
                      }
                      placeholder='Ej: FAC-2025-001'
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Notas</label>
                  <textarea
                    value={supplyForm.notes}
                    onChange={e =>
                      handleSupplyFormChange('notes', e.target.value)
                    }
                    rows={3}
                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary'
                    placeholder='Comentarios adicionales sobre la compra'
                  ></textarea>
                </div>
                <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                  <div className='text-xs text-muted-foreground'>
                    Este registro documenta costos y proveedores. El inventario
                    no se modifica automáticamente.
                  </div>
                  <Button
                    type='submit'
                    className={`${styles.button(
                      'primary'
                    )} flex items-center gap-2`}
                    disabled={suppliesLoading || supplyPurchasesLoading}
                  >
                    <CheckCircle className='w-4 h-4' />
                    Registrar compra
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='w-5 h-5' />
                Historial de compras de insumos
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <form
                className='grid grid-cols-1 lg:grid-cols-4 gap-4'
                onSubmit={handleSupplyFiltersSubmit}
              >
                <div className='space-y-2 lg:col-span-2'>
                  <label className='text-sm font-medium'>
                    Filtrar por insumo
                  </label>
                  <select
                    value={supplyFiltersDraft.supplyId}
                    onChange={e =>
                      handleSupplyFiltersDraftChange('supplyId', e.target.value)
                    }
                    className='border rounded px-3 py-2 text-sm bg-background'
                  >
                    <option value=''>Todos los insumos</option>
                    {supplies.map(supply => (
                      <option key={supply.id} value={supply.id}>
                        {supply.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Límite</label>
                  <Input
                    type='number'
                    min='1'
                    value={supplyFiltersDraft.limit}
                    onChange={e =>
                      handleSupplyFiltersDraftChange('limit', e.target.value)
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Offset</label>
                  <Input
                    type='number'
                    min='0'
                    value={supplyFiltersDraft.offset}
                    onChange={e =>
                      handleSupplyFiltersDraftChange('offset', e.target.value)
                    }
                  />
                </div>
                <div className='flex items-end'>
                  <Button
                    type='submit'
                    variant='outline'
                    className='w-full flex items-center gap-2'
                    disabled={supplyPurchasesLoading}
                  >
                    {supplyPurchasesLoading ? (
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current'></div>
                    ) : (
                      <Search className='w-4 h-4' />
                    )}
                    Consultar
                  </Button>
                </div>
              </form>

              {supplyPurchasesError && (
                <div className='text-sm text-red-600'>
                  {supplyPurchasesError}
                </div>
              )}

              {supplyPurchasesLoading ? (
                <DataState variant='loading' skeletonVariant='table' />
              ) : supplyPurchases.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title='Sin compras registradas'
                  description='Registra tus compras de insumos para llevar control de costos y proveedores.'
                  actionLabel='Registrar compra'
                  onAction={() => setActiveTab('supplyPurchases')}
                />
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='text-left p-3'>Fecha</th>
                        <th className='text-left p-3'>Insumo</th>
                        <th className='text-right p-3'>Cantidad</th>
                        <th className='text-right p-3'>Costo unit.</th>
                        <th className='text-right p-3'>Costo total</th>
                        <th className='text-left p-3'>Proveedor</th>
                        <th className='text-left p-3'>Factura</th>
                        <th className='text-left p-3'>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplyPurchases.map(purchase => {
                        const quantityValue = Number.parseFloat(
                          purchase.quantity ?? 0
                        )
                        const unitCostValue = Number.parseFloat(
                          purchase.unit_cost ?? 0
                        )
                        const totalCostNumber = Number.parseFloat(
                          purchase.total_cost ?? ''
                        )
                        const resolvedTotalCost = Number.isFinite(
                          totalCostNumber
                        )
                          ? totalCostNumber
                          : quantityValue * unitCostValue

                        return (
                          <tr
                            key={purchase.purchase_id || purchase.id}
                            className='border-t'
                          >
                            <td className='p-3 whitespace-nowrap'>
                              {formatDateTime(purchase.purchase_date)}
                            </td>
                            <td className='p-3'>
                              <div className='font-medium'>
                                {purchase.supply_name || 'Sin nombre'}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                ID: {purchase.supply_id}
                              </div>
                            </td>
                            <td className='p-3 text-right'>
                              {Number.isFinite(quantityValue)
                                ? quantityValue.toLocaleString('es-PY', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : purchase.quantity || '0'}{' '}
                              {purchase.unit || ''}
                            </td>
                            <td className='p-3 text-right'>
                              {formatGuaranies(unitCostValue)}
                            </td>
                            <td className='p-3 text-right'>
                              {formatGuaranies(resolvedTotalCost)}
                            </td>
                            <td className='p-3'>
                              {purchase.supplier_name ||
                                purchase.supplier ||
                                '—'}
                            </td>
                            <td className='p-3'>
                              {purchase.invoice_number ||
                                purchase.invoice ||
                                '—'}
                            </td>
                            <td className='p-3 text-xs text-muted-foreground'>
                              {purchase.notes || '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analysis Modal */}
      {showAnalysis && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-bold'>
                  Análisis de Orden #{showAnalysis.order_id}
                </h2>
                <Button onClick={() => setShowAnalysis(null)}>×</Button>
              </div>

              {showAnalysis.analysis && (
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='text-center p-4 bg-blue-50 rounded-lg'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {showAnalysis.analysis.order_items?.length || 0}
                      </div>
                      <div className='text-sm text-blue-600'>Productos</div>
                    </div>
                    <div className='text-center p-4 bg-green-50 rounded-lg'>
                      <div className='text-2xl font-bold text-green-600'>
                        {formatGuaranies(
                          showAnalysis.analysis.order_info?.total_amount
                        )}
                      </div>
                      <div className='text-sm text-green-600'>Total</div>
                    </div>
                    <div className='text-center p-4 bg-purple-50 rounded-lg'>
                      <div className='text-2xl font-bold text-purple-600'>
                        {showAnalysis.analysis.pricing_impact?.avg_margin_percent?.toFixed(
                          1
                        ) || '0.0'}
                        %
                      </div>
                      <div className='text-sm text-purple-600'>
                        Margen Promedio
                      </div>
                    </div>
                  </div>

                  {showAnalysis.validation?.validation_passed === false && (
                    <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                      <div className='flex items-center gap-2 text-yellow-800 font-medium mb-2'>
                        <AlertTriangle className='w-5 h-5' />
                        Issues Encontrados
                      </div>
                      {showAnalysis.validation.issues_found?.map(
                        (issue, index) => (
                          <div key={index} className='text-sm text-yellow-700'>
                            • {issue.message}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Order Cancellation Modal */}
      <PurchaseOrderCancellationModal
        isOpen={showCancellationModal}
        onClose={handleCloseCancellationModal}
        orderId={orderToCancel?.id}
        orderInfo={orderToCancel}
        onCancellationComplete={handleCancellationComplete}
      />

      {showOrderDetails && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 lg:p-6'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[82vh] overflow-y-auto border border-border/40'>
            <style>{`
              .order-details-modal__header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
              }
              .order-details-modal__heading {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
              }
              .order-details-modal__layout {
                display: grid;
                gap: 1.25rem;
              }
              @media (min-width: 1024px) {
                .order-details-modal__layout {
                  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
                  align-items: start;
                }
              }
              .order-details-card {
                border-radius: 20px;
                border: 1px solid rgba(148, 163, 184, 0.25);
                background: linear-gradient(180deg, rgba(249, 250, 255, 0.95) 0%, rgba(255, 255, 255, 1) 100%);
                box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
                overflow: hidden;
              }
              .order-details-card [data-slot='card-header'] {
                padding: 1rem 1.4rem !important;
              }
              .order-details-card [data-slot='card-content'] {
                padding: 1.1rem 1.4rem 1.35rem !important;
              }
              .order-info-grid {
                display: grid;
                gap: 0.75rem;
              }
              .order-info-grid__item {
                display: flex;
                flex-direction: column;
                gap: 0.2rem;
                padding: 0.65rem 0.75rem;
                border-radius: 14px;
                background: rgba(124, 58, 237, 0.05);
                border: 1px solid rgba(124, 58, 237, 0.14);
              }
              .order-info-grid__item span {
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--muted-foreground, #6b7280);
              }
              .order-info-grid__item strong {
                font-size: 1rem;
                color: var(--foreground, #111827);
              }
              .order-info-grid__item--total {
                background: rgba(34, 197, 94, 0.08);
                border-color: rgba(34, 197, 94, 0.35);
              }
              .order-info-meta {
                display: grid;
                gap: 0.5rem;
                margin-top: 0.75rem;
              }
              .order-products-summary {
                display: grid;
                gap: 0.75rem;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                margin-bottom: 1rem;
              }
              .order-products-summary__item {
                border-radius: 14px;
                border: 1px solid rgba(148, 163, 184, 0.25);
                background: rgba(15, 23, 42, 0.02);
                padding: 0.7rem 0.85rem;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
              }
              .order-products-summary__item span {
                font-size: 0.68rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--muted-foreground, #6b7280);
              }
              .order-products-summary__item strong {
                font-size: 0.98rem;
                color: var(--foreground, #111827);
              }
              .order-products-table {
                border-radius: 16px;
                border: 1px solid rgba(148, 163, 184, 0.25);
                overflow: hidden;
              }
              .order-products-table table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
              }
              .order-products-table thead {
                background: rgba(148, 163, 184, 0.1);
              }
              .order-products-table th {
                padding: 0.55rem 0.75rem;
                font-size: 0.74rem;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                color: var(--muted-foreground, #6b7280);
                font-weight: 600;
              }
              .order-products-table td {
                padding: 0.55rem 0.75rem;
                font-size: 0.85rem;
              }
              .order-products-table tbody tr:nth-child(even) {
                background: rgba(248, 250, 255, 0.6);
              }
              .order-products-table tbody tr:hover {
                background: rgba(124, 58, 237, 0.08);
              }
              .order-products-table__product-meta {
                font-size: 0.7rem;
                color: var(--muted-foreground, #6b7280);
              }
            `}</style>
            <div className='p-5 lg:p-6 order-details-modal__body'>
              <div className='order-details-modal__header mb-6'>
                <div className='order-details-modal__heading'>
                  <h2 className='text-xl font-semibold'>
                    Detalles de Orden #{showOrderDetails.order_id}
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Proveedor: {showOrderDetails.supplier_name}
                  </p>
                </div>
                <Button
                  variant='outline'
                  size='icon'
                  className='rounded-full h-9 w-9 border-border/60 hover:bg-primary/10'
                  onClick={() => setShowOrderDetails(null)}
                  aria-label='Cerrar detalles de orden'
                >
                  ×
                </Button>
              </div>

              {showOrderDetails.data ? (
                <div className='order-details-modal__layout'>
                  {showOrderDetails.data.purchase && (
                    <Card className='order-details-card order-details-card--info'>
                      <CardHeader>
                        <div className='flex items-center gap-2'>
                          <div className='rounded-full bg-primary/10 text-primary p-2'>
                            <ShoppingCart className='w-4 h-4' />
                          </div>
                          <div>
                            <CardTitle className='text-base font-semibold'>
                              Información de la Orden
                            </CardTitle>
                            <p className='text-xs text-muted-foreground'>
                              Datos clave de la compra seleccionada
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className='order-info-grid'>
                          <div className='order-info-grid__item'>
                            <span>ID de Orden</span>
                            <strong>{showOrderDetails.data.purchase.id}</strong>
                          </div>
                          <div className='order-info-grid__item order-info-grid__item--total'>
                            <span>Total</span>
                            <strong className='text-green-600'>
                              {formatGuaranies(
                                showOrderDetails.data.purchase?.total_amount
                              )}
                            </strong>
                          </div>
                          <div className='order-info-grid__item'>
                            <span>Estado</span>
                            <strong>
                              {translatePurchaseStatus(
                                showOrderDetails.data.purchase.status,
                                t
                              )}
                            </strong>
                          </div>
                          <div className='order-info-grid__item'>
                            <span>Fecha</span>
                            <strong>
                              {showOrderDetails.data.purchase.order_date
                                ? new Date(
                                    showOrderDetails.data.purchase.order_date
                                  ).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'No disponible'}
                            </strong>
                          </div>
                        </div>

                        <div className='order-info-meta'>
                          <div>
                            <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                              Proveedor
                            </span>
                            <div className='mt-1 flex items-center gap-2'>
                              <span className='font-medium text-sm'>
                                {showOrderDetails.data.purchase.supplier_name}
                              </span>
                              {showOrderDetails.data.purchase
                                .supplier_status === false && (
                                <Badge
                                  variant='destructive'
                                  className='text-2xs px-2 py-0.5'
                                >
                                  Inactivo
                                </Badge>
                              )}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              ID: {showOrderDetails.data.purchase.supplier_id}
                            </div>
                          </div>
                          <div>
                            <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                              Creado por
                            </span>
                            <div className='mt-1 text-sm'>
                              {showOrderDetails.data.purchase.user_name ||
                                'No disponible'}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              ID: {showOrderDetails.data.purchase.user_id}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {orderDetailsMetrics?.details?.length > 0 && (
                    <Card className='order-details-card order-details-card--products'>
                      <CardHeader className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className='rounded-full bg-primary/10 text-primary p-2'>
                            <Package className='w-4 h-4' />
                          </div>
                          <div>
                            <CardTitle className='text-base font-semibold'>
                              Productos en la Orden
                            </CardTitle>
                            <p className='text-xs text-muted-foreground'>
                              Historial completo de artículos ingresados
                            </p>
                          </div>
                        </div>
                        <Badge variant='outline' className='text-xs px-2 py-1'>
                          {orderDetailsMetrics.productsCount} producto(s)
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className='order-products-summary'>
                          <div className='order-products-summary__item'>
                            <span>Total productos</span>
                            <strong>{orderDetailsMetrics.productsCount}</strong>
                          </div>
                          <div className='order-products-summary__item'>
                            <span>Cantidad total</span>
                            <strong>{orderDetailsMetrics.totalQuantity}</strong>
                          </div>
                          <div className='order-products-summary__item'>
                            <span>Subtotal compra</span>
                            <strong className='text-green-600'>
                              {formatGuaranies(
                                orderDetailsMetrics.totalSubtotal
                              )}
                            </strong>
                          </div>
                          <div className='order-products-summary__item'>
                            <span>Venta estimada</span>
                            <strong className='text-blue-600'>
                              {orderDetailsMetrics.totalSale > 0
                                ? formatGuaranies(orderDetailsMetrics.totalSale)
                                : 'N/A'}
                            </strong>
                          </div>
                          <div className='order-products-summary__item'>
                            <span>Margen promedio</span>
                            <strong>
                              {orderDetailsMetrics.averageMargin !== null
                                ? `${orderDetailsMetrics.averageMargin.toFixed(
                                    1
                                  )}%`
                                : 'N/A'}
                            </strong>
                          </div>
                        </div>

                        <div className='order-products-table overflow-x-auto'>
                          <table>
                            <thead>
                              <tr>
                                <th className='text-left'>Producto</th>
                                <th>Cant.</th>
                                <th>
                                  Precio Unit.
                                  <br />
                                  <span>(IVA inc.)</span>
                                </th>
                                <th>Unidad</th>
                                <th>Subtotal</th>
                                <th>Precio Venta</th>
                                <th>Margen %</th>
                                <th>Fecha Exp.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderDetailsMetrics.details.map(
                                (detail, idx) => {
                                  const profit =
                                    detail?.profit_pct ??
                                    detail?.metadata?.profit_pct ??
                                    null

                                  return (
                                    <tr key={detail.id || idx}>
                                      <td>
                                        <div className='font-medium text-sm'>
                                          {detail.product_name}
                                        </div>
                                        <div className='order-products-table__product-meta'>
                                          ID: {detail.product_id}
                                        </div>
                                      </td>
                                      <td className='text-center'>
                                        {detail.quantity}
                                      </td>
                                      <td className='text-center'>
                                        {formatGuaranies(detail.unit_price)}
                                      </td>
                                      <td className='text-center'>
                                        <Badge
                                          variant='outline'
                                          className='text-[0.65rem] px-2 py-0.5'
                                        >
                                          {detail.unit || 'unit'}
                                        </Badge>
                                      </td>
                                      <td className='text-center font-semibold text-green-600'>
                                        {formatGuaranies(
                                          typeof detail.subtotal === 'number'
                                            ? detail.subtotal
                                            : (detail.quantity || 0) *
                                                (detail.unit_price || 0)
                                        )}
                                      </td>
                                      <td className='text-center font-semibold text-blue-600'>
                                        {detail.sale_price
                                          ? formatGuaranies(detail.sale_price)
                                          : 'N/A'}
                                      </td>
                                      <td className='text-center'>
                                        {profit !== null ? `${profit}%` : 'N/A'}
                                      </td>
                                      <td className='text-center text-xs'>
                                        {detail.exp_date
                                          ? new Date(
                                              detail.exp_date
                                            ).toLocaleDateString()
                                          : 'N/A'}
                                      </td>
                                    </tr>
                                  )
                                }
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {orderDetailsMetrics?.details?.some(
                    detail => detail.metadata
                  ) && (
                    <Card className='order-details-card order-details-card--meta lg:col-span-2'>
                      <CardHeader className='flex items-center gap-2'>
                        <div className='rounded-full bg-emerald-100 text-emerald-600 p-2'>
                          <Settings className='w-4 h-4' />
                        </div>
                        <div>
                          <CardTitle className='text-base font-semibold'>
                            Información Técnica
                          </CardTitle>
                          <p className='text-xs text-muted-foreground'>
                            Esta orden incluye metadata enriquecida para control
                            avanzado.
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                          <Badge
                            variant='success'
                            className='text-2xs px-2 py-0.5'
                          >
                            ✅ Datos enriquecidos
                          </Badge>
                          <Badge
                            variant='outline'
                            className='text-2xs px-2 py-0.5'
                          >
                            Metadata completa
                          </Badge>
                          <span>
                            Incluye unidades, tasas de impuestos, márgenes y
                            precios de venta calculados dinámicamente.
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : showOrderDetails.loading ? (
                <div className='py-12 flex justify-center'>
                  <DataState variant='loading' skeletonVariant='table' />
                </div>
              ) : (
                <div className='text-sm text-muted-foreground'>
                  No se encontraron detalles para esta orden.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchasesPage
