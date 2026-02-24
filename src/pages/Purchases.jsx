import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search,
  Download,
  X,
  Plus,
  User,
  Calendar,
  MoreVertical,
  Eye,
  Ban,
  Package,
  ChevronRight,
  Truck,
  CreditCard,
  Hash,
  Tag,
  Percent,
  DollarSign,
  AlertCircle,
  ShoppingCart,
  FileText,
  ArrowRight,
  Check,
  Minus,
} from 'lucide-react'
import DataState from '@/components/ui/DataState'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { useI18n } from '@/lib/i18n'
import useDashboardStore from '@/store/useDashboardStore'
import useKeyboardShortcutsStore from '@/store/useKeyboardShortcutsStore'
import supplierService from '@/services/supplierService'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { CurrencyService } from '@/services/currencyService'
import { productService } from '@/services/productService'
import purchaseService from '@/services/purchaseService'
import {
  classifySupplierSearchTerm,
  fetchPurchasesBySupplierTerm,
  purchasePaymentsMvpService,
} from '@/services/purchasePaymentsMvpService'
import InstantPaymentDialog from '@/components/ui/InstantPaymentDialog'

/**
 * Purchases Page - Fluent Design System 2
 * Refactored with Tailwind CSS using Fluent 2 design tokens.
 * Modal optimized for low-height desktop screens (720p+).
 */
const Purchases = () => {
  const { t } = useI18n()
  const { fetchDashboardData } = useDashboardStore()

  // Business Logic States
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('nueva-compra')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchType, setSearchType] = useState('date')

  // Supplier States
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierResults, setSupplierResults] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [searchingSuppliers, setSearchingSuppliers] = useState(false)
  const supplierSearchRef = useRef(null)

  // Payment Details States
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentCurrency, setPaymentCurrency] = useState('PYG')
  const [paymentMethods, setPaymentMethods] = useState([])
  const [currencies, setCurrencies] = useState([])

  // Product Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [modalProductSearch, setModalProductSearch] = useState('')
  const [modalProductResults, setModalProductResults] = useState([])
  const [modalSelectedProduct, setModalSelectedProduct] = useState(null)
  const [searchingProducts, setSearchingProducts] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [modalQuantity, setModalQuantity] = useState('')
  const [modalUnitPrice, setModalUnitPrice] = useState('')
  const [modalProfitPct, setModalProfitPct] = useState(30)
  const [modalSalePrice, setModalSalePrice] = useState(0)
  const [pricingMode, setPricingMode] = useState('margin')
  const [modalTaxRateId, setModalTaxRateId] = useState(null)
  const [taxRates, setTaxRates] = useState([])
  const [purchaseItems, setPurchaseItems] = useState([])
  const modalProductSearchRef = useRef(null)

  // UI Support States
  const [openActionMenu, setOpenActionMenu] = useState(null)
  const [showCancelPreview, setShowCancelPreview] = useState(false)
  const [cancelPreviewData, setCancelPreviewData] = useState(null)
  const [orderToCancel, setOrderToCancel] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewOrderData, setViewOrderData] = useState(null)
  const [showInstantPayment, setShowInstantPayment] = useState(false)
  const [createdOrderData, setCreatedOrderData] = useState(null)

  // Filtering Logic
  const filteredModalProducts = useMemo(() => {
    if (!modalProductResults) return []
    const existingProductIds = new Set(purchaseItems.map(item => item.product_id))
    return modalProductResults.filter(product => !existingProductIds.has(product.id || product.product_id))
  }, [modalProductResults, purchaseItems])

  // Data Loading Hooks
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const end = new Date().toISOString().split('T')[0]
        const start = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
        setStartDate(start); setEndDate(end);

        const [orders, methods, currs, taxes] = await Promise.all([
          purchaseService.getPurchasesByDateRange(start, end, 1, 50),
          PaymentMethodService.getAll(),
          CurrencyService.getAll(),
          purchaseService.getTaxRates(1, 100)
        ])

        if (orders.success) setPurchaseOrders(orders.data || [])
        setPaymentMethods(methods || [])
        setCurrencies(currs || [])
        if (taxes.success) setTaxRates(taxes.data || [])

        // Set Defaults
        const cash = (methods || []).find(m => m.method_code?.toUpperCase() === 'CASH' || m.description?.toLowerCase().includes('efectivo'))
        if (cash) setPaymentMethod(String(cash.id))
        const base = (currs || []).find(c => c.is_base_currency)
        if (base) setPaymentCurrency(base.currency_code)
      } finally { setLoading(false) }
    }
    loadInitialData()
  }, [])

  // Search Hooks
  useEffect(() => {
    if (!supplierSearch || supplierSearch.length < 2) { setSupplierResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchingSuppliers(true)
      try {
        const res = await supplierService.searchByName(supplierSearch)
        setSupplierResults(Array.isArray(res) ? res : (res.data || []))
      } finally { setSearchingSuppliers(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [supplierSearch])

  useEffect(() => {
    if (!modalProductSearch.trim() || modalProductSearch.trim().length < 2) {
      setModalProductResults([]); setShowProductDropdown(false); return;
    }
    const timer = setTimeout(async () => {
      setSearchingProducts(true); setShowProductDropdown(true);
      try {
        const res = await productService.searchProductsFinancial(modalProductSearch.trim(), { limit: 10 })
        setModalProductResults((Array.isArray(res) ? res : []).filter(p => p.state !== false))
      } finally { setSearchingProducts(false) }
    }, 500)
    return () => clearTimeout(timer)
  }, [modalProductSearch])

  // Pricing Derivations
  const effectiveSalePrice = useMemo(() => {
    const cost = Number(modalUnitPrice) || 0
    return pricingMode === 'margin' ? cost * (1 + modalProfitPct / 100) : modalSalePrice
  }, [pricingMode, modalUnitPrice, modalProfitPct, modalSalePrice])

  const effectiveProfitPct = useMemo(() => {
    const cost = Number(modalUnitPrice) || 0
    if (pricingMode === 'sale_price' && cost > 0) {
      return Math.max(0, ((modalSalePrice - cost) / cost) * 100)
    }
    return modalProfitPct
  }, [pricingMode, modalUnitPrice, modalSalePrice, modalProfitPct])

  // Handlers
  const handleSupplierSelect = s => { setSelectedSupplier(s); setSupplierSearch(s.name || ''); setSupplierResults([]); }
  
  const handleProductSelect = p => {
    setModalSelectedProduct(p); setModalProductSearch(p.name || p.product_name || ''); setShowProductDropdown(false);
    const cost = p.cost_price || p.unit_cost || 0; setModalUnitPrice(cost); setModalSalePrice(cost * 1.3);
    if (p.tax_rate_id) setModalTaxRateId(p.tax_rate_id);
  }

  const handleConfirmAddProduct = () => {
    if (!modalSelectedProduct || !modalQuantity || !modalUnitPrice) return
    const productId = modalSelectedProduct.id || modalSelectedProduct.product_id
    const itemData = {
      product_id: productId, name: modalSelectedProduct.name || modalSelectedProduct.product_name,
      sku: modalSelectedProduct.sku || '-', quantity: Number(modalQuantity),
      unit_price: Number(modalUnitPrice), profit_pct: effectiveProfitPct,
      sale_price: effectiveSalePrice, pricing_mode: pricingMode,
      unit: modalSelectedProduct.unit || 'unit', tax_rate_id: modalTaxRateId
    }
    if (editingItemId) setPurchaseItems(prev => prev.map(i => i.id === editingItemId ? { ...itemData, id: i.id } : i))
    else setPurchaseItems(prev => [...prev, { ...itemData, id: `item-${Date.now()}` }])
    setIsModalOpen(false); setEditingItemId(null); setModalQuantity(''); setModalUnitPrice(''); setModalSelectedProduct(null); setModalProductSearch('');
  }

  const handleSavePurchase = async () => {
    if (!selectedSupplier || purchaseItems.length === 0) return
    setLoading(true)
    try {
      const orderData = {
        supplier_id: selectedSupplier.id,
        order_details: purchaseItems.map(i => ({ ...i, supplier_id: selectedSupplier.id })),
        auto_update_prices: true, payment_method_id: paymentMethod ? parseInt(paymentMethod) : null,
        currency_id: currencies.find(c => c.currency_code === paymentCurrency)?.id || null
      }
      const result = await purchaseService.createEnhancedPurchaseOrder(orderData)
      if (result.success) {
        setCreatedOrderData({ id: result.purchase_order_id, totalAmount: purchaseItems.reduce((s, i) => s + (i.quantity * i.unit_price), 0), currencyCode: paymentCurrency });
        setShowInstantPayment(true); fetchDashboardData();
      }
    } finally { setLoading(false) }
  }

  const handleConfirmCancellation = async () => {
    if (!orderToCancel) return
    setLoading(true); setShowCancelPreview(false);
    try {
      const result = await purchaseService.cancelPurchaseOrderWithDetails({ purchase_order_id: orderToCancel.id, reason: 'CANCELLED_BY_USER' })
      if (result.success) {
        setPurchaseOrders(prev => prev.map(o => {
          const ord = o.purchase || o;
          return ord.id === orderToCancel.id ? { ...o, purchase: { ...ord, status: 'CANCELLED' }, status: 'CANCELLED' } : o;
        }))
        fetchDashboardData();
      }
    } finally { setLoading(false) }
  }

  const formatCurrency = (amt, curr) => new Intl.NumberFormat('es-PY', { style: 'currency', currency: curr || paymentCurrency || 'PYG' }).format(amt || 0)
  const formatDate = d => d ? new Date(d).toLocaleDateString('es-PY') : '-'

  // Helper functions for status display
  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobada';
      case 'RECEIVED': return 'Recibida';
      case 'COMPLETED': return 'Completada';
      case 'CANCELLED': return 'Cancelada';
      default: return status || 'Desconocido';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'badge--warning';
      case 'APPROVED': return 'badge--info';
      case 'RECEIVED': return 'badge--success';
      case 'COMPLETED': return 'badge--success';
      case 'CANCELLED': return 'badge--danger';
      default: return 'badge--secondary';
    }
  };

  const handleFilter = () => {
    // Placeholder for actual filtering logic
    console.log("Filtering with:", { searchTerm, searchType, startDate, endDate });
  };

  const handleViewPurchase = (order) => {
    setViewOrderData({ purchase: order }); // Mock data for now
    setShowViewModal(true);
  };

  const handleCancelPurchase = (order) => {
    setOrderToCancel(order);
    // Mock data for cancellation preview - in a real app, this would be fetched
    setCancelPreviewData({
      impact_analysis: {
        total_items: 5,
        total_paid_amount: 150000,
        payments_to_cancel: 1,
        requires_stock_adjustment: true,
        products_with_insufficient_stock: 0,
      },
      stock_impact: [
        { product_name: "Producto A", current_stock: 10, stock_after_cancellation: 5, quantity_to_revert: 5 },
        { product_name: "Producto B", current_stock: 20, stock_after_cancellation: 15, quantity_to_revert: 5 },
      ],
      payment_impact: [
        { payment_method: "Efectivo", amount: 50000, payment_date: "2023-10-26", current_status: "Pagado" },
        { payment_method: "Transferencia", amount: 100000, payment_date: "2023-10-27", current_status: "Pendiente" },
      ],
      warnings: ["El proveedor podría no haber recibido aún la notificación."],
      cancellation_issues: [],
      recommendations: ["Notificar manualmente al proveedor sobre la cancelación."],
      general_recommendations: { estimated_complexity: "Low", notify_supplier: true, requires_approval: false },
    });
    setShowCancelPreview(true);
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setModalSelectedProduct({ id: item.product_id, name: item.name, sku: item.sku, unit: item.unit, cost_price: item.unit_price });
    setModalQuantity(item.quantity);
    setModalUnitPrice(item.unit_price);
    setModalProfitPct(item.profit_pct);
    setModalSalePrice(item.sale_price);
    setPricingMode(item.pricing_mode);
    setModalTaxRateId(item.tax_rate_id);
    setIsModalOpen(true);
  };
  
  const handleInstantPaymentConfirm = () => {
    setShowInstantPayment(false);
    setActiveTab('historial');
    handleFilter();
  };

  const handleLeavePurchasePending = () => {
    setShowInstantPayment(false);
    setActiveTab('historial');
    handleFilter();
  };
  
  const clearPurchase = () => {
    setPurchaseItems([]);
    setSelectedSupplier(null);
    setSupplierSearch('');
    setModalSelectedProduct(null);
    setModalQuantity('');
    setModalUnitPrice('');
    setModalProfitPct(30);
    setModalSalePrice(0);
    setPricingMode('margin');
    setModalTaxRateId(null);
    setModalProductSearch('');
  };


  return (
    <div className="min-h-screen bg-[var(--fluent-background-canvas,#FAFAFA)] dark:bg-[var(--fluent-neutral-grey-160,#201F1E)] font-sans transition-colors duration-[var(--fluent-duration-normal,200ms)] pb-16">
      
      {/* Tab Navigation - Fluent 2 Pivot Style */}
      <div className="bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] px-4 md:px-6 mb-4 md:mb-6 sticky top-0 z-20">
        <div className="max-w-[1920px] mx-auto flex gap-1">
          <button 
            className={`px-5 py-3 text-sm font-semibold transition-all duration-[var(--fluent-duration-fast,150ms)] border-b-2 ${
              activeTab === 'nueva-compra' 
                ? 'border-[var(--fluent-brand-primary,#0078D4)] text-[var(--fluent-brand-primary,#0078D4)]' 
                : 'border-transparent text-[var(--fluent-text-secondary,#605E5C)] hover:text-[var(--fluent-text-primary,#212121)] hover:bg-[var(--fluent-surface-secondary,#FAF9F8)]'
            }`}
            onClick={() => setActiveTab('nueva-compra')}
          >
            Nueva Compra
          </button>
          <button 
            className={`px-5 py-3 text-sm font-semibold transition-all duration-[var(--fluent-duration-fast,150ms)] border-b-2 ${
              activeTab === 'historial' 
                ? 'border-[var(--fluent-brand-primary,#0078D4)] text-[var(--fluent-brand-primary,#0078D4)]' 
                : 'border-transparent text-[var(--fluent-text-secondary,#605E5C)] hover:text-[var(--fluent-text-primary,#212121)] hover:bg-[var(--fluent-surface-secondary,#FAF9F8)]'
            }`}
            onClick={() => setActiveTab('historial')}
          >
            Historial de Órdenes
          </button>
        </div>
      </div>

      <main className="max-w-[1920px] mx-auto px-4 md:px-6">
        
        {activeTab === 'nueva-compra' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            
            {/* Left Column: Items & Summary */}
            <div className="lg:col-span-8 space-y-4 md:space-y-6">
              
              {/* Products Table Card - Fluent 2 Card */}
              <section className="bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] flex flex-col sm:flex-row justify-between items-center bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white">Productos en la Orden</h3>
                    <p className="text-xs text-[var(--fluent-text-secondary,#605E5C)] mt-0.5">Artículos a ingresar al inventario</p>
                  </div>
                  <button 
                    className="w-full sm:w-auto bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white px-4 py-2 rounded-[var(--fluent-corner-radius-medium,4px)] font-semibold text-sm shadow-[var(--fluent-shadow-2)] active:scale-[0.98] transition-all duration-[var(--fluent-duration-fast,150ms)] flex items-center justify-center gap-2"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    Agregar Artículo
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] text-xs font-semibold text-[var(--fluent-text-secondary,#605E5C)]">
                      <tr>
                        <th className="px-4 py-3">ID / SKU</th>
                        <th className="px-4 py-3">Producto</th>
                        <th className="px-4 py-3 text-center">Cant.</th>
                        <th className="px-4 py-3 text-right">Costo Unit.</th>
                        <th className="px-4 py-3 text-right">Margen</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                        <th className="px-4 py-3 text-right">Venta Esp.</th>
                        <th className="px-4 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--fluent-border-neutral,#E1DFDD)] dark:divide-[var(--fluent-neutral-grey-140,#484644)]">
                      {purchaseItems.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-12 text-center">
                            <div className="flex flex-col items-center gap-2 text-[var(--fluent-text-tertiary,#8A8886)]">
                              <Package size={32} strokeWidth={1.5} />
                              <p className="text-sm">No hay artículos seleccionados</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        purchaseItems.map(item => (
                          <tr key={item.id} className="hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] transition-colors duration-[var(--fluent-duration-faster,100ms)] group/row" onDoubleClick={() => handleEditItem(item)}>
                            <td className="px-4 py-3">
                              <div className="text-xs font-mono text-[var(--fluent-text-secondary,#605E5C)]">#{item.product_id}</div>
                              <div className="text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]">{item.sku}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white group-hover/row:text-[var(--fluent-brand-primary,#0078D4)] transition-colors">{item.name}</div>
                              <div className="text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]">Unidad: {item.unit}</div>
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-sm text-[var(--fluent-text-secondary,#605E5C)]">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-[var(--fluent-semantic-success,#107C10)]">{item.profit_pct.toFixed(1)}%</td>
                            <td className="px-4 py-3 text-right font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white">{formatCurrency(item.unit_price * item.quantity)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-semibold text-[var(--fluent-brand-primary,#0078D4)]">{formatCurrency(item.sale_price * item.quantity)}</div>
                              <div className="text-[10px] text-[var(--fluent-semantic-success,#107C10)]">+{formatCurrency((item.sale_price - item.unit_price) * item.quantity)}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => setPurchaseItems(prev => prev.filter(i => i.id !== item.id))} className="p-1.5 text-[var(--fluent-text-tertiary,#8A8886)] hover:text-[var(--fluent-semantic-danger,#D13438)] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[var(--fluent-corner-radius-medium,4px)] transition-all"><X size={16} /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Purchase Totals Card - Fluent 2 */}
              <section className="bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--fluent-text-secondary,#605E5C)]">Artículos Totales</span>
                      <span className="font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] px-2.5 py-0.5 rounded-[var(--fluent-corner-radius-medium,4px)]">{purchaseItems.reduce((s, i) => s + i.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--fluent-text-secondary,#605E5C)]">Total Compra</span>
                      <span className="text-[var(--fluent-text-primary,#212121)] dark:text-white">{formatCurrency(purchaseItems.reduce((s, i) => s + (i.quantity * i.unit_price), 0))}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--fluent-text-secondary,#605E5C)]">Venta Esperada</span>
                      <span className="font-medium text-[var(--fluent-brand-primary,#0078D4)]">{formatCurrency(purchaseItems.reduce((s, i) => s + (i.quantity * i.sale_price), 0))}</span>
                    </div>
                    <div className="h-px bg-[var(--fluent-border-neutral,#E1DFDD)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] my-2"></div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white">Ganancia Proyectada</span>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${purchaseItems.reduce((s, i) => s + (i.quantity * i.sale_price), 0) - purchaseItems.reduce((s, i) => s + (i.quantity * i.unit_price), 0) >= 0 ? 'text-[var(--fluent-semantic-success,#107C10)]' : 'text-[var(--fluent-semantic-danger,#D13438)]'}`}>
                          {formatCurrency(purchaseItems.reduce((s, i) => s + (i.quantity * i.sale_price), 0) - purchaseItems.reduce((s, i) => s + (i.quantity * i.unit_price), 0))}
                        </span>
                        {purchaseItems.length > 0 && purchaseItems.reduce((s, i) => s + (i.quantity * i.unit_price), 0) > 0 && (
                          <span className="ml-1.5 text-xs font-medium text-[var(--fluent-semantic-success,#107C10)]">
                            (+{(((purchaseItems.reduce((s, i) => s + (i.quantity * i.sale_price), 0) / purchaseItems.reduce((s, i) => s + (i.quantity * i.unit_price), 0)) - 1) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 justify-end">
                    <button 
                      className="w-full py-3 bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-4)] active:scale-[0.98] transition-all duration-[var(--fluent-duration-fast,150ms)] disabled:opacity-50 disabled:pointer-events-none text-sm"
                      onClick={handleSavePurchase}
                      disabled={!selectedSupplier || purchaseItems.length === 0 || loading}
                    >
                      {loading ? 'Procesando...' : 'Confirmar y Guardar Compra'}
                    </button>
                    <button 
                      className="w-full py-3 border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] hover:bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] text-[var(--fluent-text-secondary,#605E5C)] font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] transition-all duration-[var(--fluent-duration-fast,150ms)] text-sm"
                      onClick={() => { if (confirm('¿Borrar toda la orden?')) { setPurchaseItems([]); setSelectedSupplier(null); setSupplierSearch(''); } }}
                    >
                      Cancelar Todo
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Configuration & Supplier - Fluent 2 */}
            <aside className="lg:col-span-4 space-y-4 md:space-y-6">
              
              {/* Supplier Selection Card */}
              <section className="bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] p-5">
                <h3 className="text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white mb-4">Proveedor del Pedido</h3>
                
                <div className="space-y-4">
                  <div className="relative" ref={supplierSearchRef}>
                    <label className="text-xs font-medium text-[var(--fluent-text-secondary,#605E5C)] mb-1.5 block">Buscar Empresa</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fluent-text-tertiary,#8A8886)]" size={16} />
                      <input 
                        type="text" 
                        placeholder="Nombre del proveedor..." 
                        className="w-full pl-9 pr-9 py-2 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all"
                        value={supplierSearch}
                        onChange={e => setSupplierSearch(e.target.value)}
                      />
                      {searchingSuppliers && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--fluent-brand-primary,#0078D4)] border-t-transparent rounded-full animate-spin"></div>}
                    </div>
                    
                    {supplierResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-16)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] overflow-hidden z-30 py-1">
                        {supplierResults.map(s => (
                          <button key={s.id} className="w-full px-4 py-2.5 text-left hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] transition-colors flex justify-between items-center" onClick={() => handleSupplierSelect(s)}>
                            <span className="font-medium text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white">{s.name}</span>
                            <span className="text-xs text-[var(--fluent-text-tertiary,#8A8886)]">ID: {s.id}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSupplier && (
                    <div className="p-4 bg-[rgba(0,120,212,0.08)] dark:bg-[rgba(0,120,212,0.15)] border border-[rgba(0,120,212,0.2)] rounded-[var(--fluent-corner-radius-large,6px)]">
                      <div className="font-semibold text-[var(--fluent-brand-primary,#0078D4)] text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--fluent-brand-primary,#0078D4)] animate-pulse"></div>
                        {selectedSupplier.name}
                      </div>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-[var(--fluent-text-secondary,#605E5C)]"><Calendar size={12} /> Registrado: {formatDate(selectedSupplier.created_at)}</div>
                        <div className="text-xs text-[var(--fluent-text-tertiary,#8A8886)]">ID: {selectedSupplier.id}</div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Payment Config Card - Fluent 2 */}
              <section className="bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] p-5">
                <h3 className="text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white mb-4">Configuración Financiera</h3>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--fluent-text-secondary,#605E5C)] block">Método de Pago</label>
                    <select 
                      className="w-full px-3 py-2 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all cursor-pointer"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                    >
                      {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.description}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--fluent-text-secondary,#605E5C)] block">Moneda de Transacción</label>
                    <select 
                      className="w-full px-3 py-2 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all cursor-pointer"
                      value={paymentCurrency}
                      onChange={e => setPaymentCurrency(e.target.value)}
                    >
                      {currencies.map(c => <option key={c.id} value={c.currency_code}>{c.currency_code} - {c.description}</option>)}
                    </select>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="space-y-4 md:space-y-6">
            
            {/* History Filter Toolbar - Fluent 2 CommandBar style */}
            <section className="bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] overflow-hidden">
              <div className="p-4 md:p-5 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] flex flex-col xl:flex-row justify-between items-center bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fluent-text-tertiary,#8A8886)]" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar por ID o Proveedor..." 
                      className="w-full pl-9 pr-3 py-2 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleFilter()}
                    />
                  </div>
                  <button 
                    className="w-full sm:w-auto px-5 py-2 bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-2)] active:scale-[0.98] transition-all duration-[var(--fluent-duration-fast,150ms)] text-sm"
                    onClick={handleFilter}
                  >
                    Buscar
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                  <div className="flex p-0.5 bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)]">
                    <button 
                      className={`px-4 py-1.5 text-xs font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-[var(--fluent-duration-fast,150ms)] ${
                        searchType === 'date' 
                          ? 'bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] shadow-[var(--fluent-shadow-2)] text-[var(--fluent-brand-primary,#0078D4)]' 
                          : 'text-[var(--fluent-text-secondary,#605E5C)] hover:text-[var(--fluent-text-primary,#212121)]'
                      }`}
                      onClick={() => setSearchType('date')}
                    >
                      Fecha
                    </button>
                    <button 
                      className={`px-4 py-1.5 text-xs font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-[var(--fluent-duration-fast,150ms)] ${
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
                    <div className="flex items-center gap-2 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] px-3 py-1.5 rounded-[var(--fluent-corner-radius-medium,4px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]">
                      <input type="date" className="bg-transparent border-none text-xs text-[var(--fluent-text-primary,#212121)] dark:text-white outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
                      <span className="text-[var(--fluent-text-tertiary,#8A8886)]">→</span>
                      <input type="date" className="bg-transparent border-none text-xs text-[var(--fluent-text-primary,#212121)] dark:text-white outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              {/* History Table - Fluent 2 DataGrid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] text-xs font-semibold text-[var(--fluent-text-secondary,#605E5C)]">
                    <tr>
                      <th className="px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]">Orden ID</th>
                      <th className="px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]">Fecha Pedido</th>
                      <th className="px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]">Proveedor</th>
                      <th className="px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] text-right">Monto Total</th>
                      <th className="px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] text-center">Estado</th>
                      <th className="px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] text-right w-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--fluent-border-neutral,#E1DFDD)] dark:divide-[var(--fluent-neutral-grey-140,#484644)]">
                    {purchaseOrders.length === 0 ? (
                      <tr><td colSpan="6" className="py-16 text-center text-[var(--fluent-text-tertiary,#8A8886)] text-sm">No se encontraron registros de compra</td></tr>
                    ) : (
                      purchaseOrders.map(orderData => {
                        const order = orderData.purchase || orderData;
                        const isCompleted = order.status?.toUpperCase() === 'COMPLETED' || order.status?.toUpperCase() === 'RECEIVED';
                        const isCancelled = order.status?.toUpperCase() === 'CANCELLED';
                        
                        return (
                          <tr key={order.id} className="hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] transition-colors duration-[var(--fluent-duration-faster,100ms)]">
                            <td className="px-5 py-3.5 font-semibold text-[var(--fluent-brand-primary,#0078D4)] text-sm">#{order.id}</td>
                            <td className="px-5 py-3.5 text-[var(--fluent-text-secondary,#605E5C)] text-sm">{formatDate(order.order_date)}</td>
                            <td className="px-5 py-3.5 font-medium text-[var(--fluent-text-primary,#212121)] dark:text-white text-sm">{order.supplier_name || '-'}</td>
                            <td className="px-5 py-3.5 text-right font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white">{formatCurrency(order.total_amount, order.currency)}</td>
                            <td className="px-5 py-3.5 text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-[var(--fluent-corner-radius-medium,4px)] text-xs font-semibold ${
                                isCompleted ? 'bg-[rgba(16,124,16,0.1)] text-[var(--fluent-semantic-success,#107C10)]' :
                                isCancelled ? 'bg-[rgba(209,52,56,0.1)] text-[var(--fluent-semantic-danger,#D13438)]' :
                                'bg-[rgba(255,185,0,0.15)] text-[#B87900]'
                              }`}>
                                {getStatusText(order.status)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="relative inline-block">
                                <button 
                                  onClick={() => setOpenActionMenu(openActionMenu === order.id ? null : order.id)} 
                                  className="p-1.5 text-[var(--fluent-text-tertiary,#8A8886)] hover:text-[var(--fluent-text-primary,#212121)] hover:bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)] transition-all"
                                >
                                  <MoreVertical size={18} />
                                </button>
                                {openActionMenu === order.id && (
                                  <div className="absolute right-0 mt-1 w-48 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-16)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] z-40 py-1 overflow-hidden">
                                    <button 
                                      onClick={() => handleViewPurchase(order)} 
                                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] flex items-center gap-3 transition-colors"
                                    >
                                      <Eye size={16} className="text-[var(--fluent-brand-primary,#0078D4)]" /> Ver Detalle
                                    </button>
                                    {!isCancelled && (
                                      <button 
                                        onClick={() => handleCancelPurchase(order)} 
                                        className="w-full px-4 py-2.5 text-left text-sm text-[var(--fluent-semantic-danger,#D13438)] hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                                      >
                                        <Ban size={16} /> Anular Orden
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] w-full max-w-4xl max-h-[98vh] rounded-[var(--fluent-corner-radius-xlarge,8px)] shadow-[var(--fluent-shadow-64)] overflow-hidden flex flex-col border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)]">
            
            {/* Header */}
            <header className="px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] flex justify-between items-center bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white">
                  {editingItemId ? 'Editar Artículo' : 'Agregar Artículo de Compra'}
                </h3>
                <p className="text-xs text-[var(--fluent-text-secondary,#605E5C)] mt-0.5">Seleccione un producto, configure cantidad, costo y estrategia de precio</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center text-[var(--fluent-text-tertiary,#8A8886)] hover:text-[var(--fluent-semantic-danger,#D13438)] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[var(--fluent-corner-radius-medium,4px)] transition-all"
              >
                <X size={18} />
              </button>
            </header>

            {/* Content - 2-column layout */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Column 1: Product Search, Selection & Basic Info */}
                <div className="space-y-4">
                  {/* Product Search */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]">Buscar Producto</label>
                    <div className="relative" ref={modalProductSearchRef}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fluent-text-tertiary,#8A8886)]" size={16} />
                      <input 
                        type="text" 
                        className="w-full pl-9 pr-9 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all" 
                        placeholder="Buscar por SKU, EAN o Nombre..." 
                        value={modalProductSearch} 
                        onChange={e => setModalProductSearch(e.target.value)} 
                        onFocus={() => setShowProductDropdown(true)} 
                      />
                      {searchingProducts && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--fluent-brand-primary,#0078D4)] border-t-transparent rounded-full animate-spin"></div>}
                      
                      {showProductDropdown && filteredModalProducts.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-16)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] overflow-hidden z-50 max-h-[220px] overflow-y-auto">
                          {filteredModalProducts.map(p => (
                            <div key={p.id} className="px-4 py-2.5 hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] cursor-pointer border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] last:border-none flex justify-between items-center" onClick={() => handleProductSelect(p)}>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white truncate">{p.name || p.product_name}</div>
                                <div className="flex gap-2 mt-0.5">
                                  <span className="text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]">ID: {p.id}</span>
                                  <span className="text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]">SKU: {p.sku || '-'}</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-3">
                                <div className="text-sm font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white">{formatCurrency(p.cost_price || p.unit_cost || 0)}</div>
                                <div className={`text-[10px] font-medium ${p.stock > 0 ? 'text-[var(--fluent-semantic-success,#107C10)]' : 'text-[var(--fluent-semantic-danger,#D13438)]'}`}>Stock: {p.stock || 0}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Product Card */}
                  {modalSelectedProduct ? (
                    <div className="p-4 bg-[rgba(0,120,212,0.06)] dark:bg-[rgba(0,120,212,0.12)] border border-[rgba(0,120,212,0.15)] rounded-[var(--fluent-corner-radius-large,6px)]">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[var(--fluent-brand-primary,#0078D4)] rounded-[var(--fluent-corner-radius-medium,4px)] flex items-center justify-center text-white font-semibold text-lg shrink-0">{modalSelectedProduct.name?.charAt(0)}</div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white truncate">{modalSelectedProduct.name}</h4>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div>
                              <p className="text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]">ID</p>
                              <p className="text-xs text-[var(--fluent-text-secondary,#605E5C)]">{modalSelectedProduct.id}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]">SKU</p>
                              <p className="text-xs text-[var(--fluent-text-secondary,#605E5C)]">{modalSelectedProduct.sku || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]">Unidad</p>
                              <p className="text-xs text-[var(--fluent-text-secondary,#605E5C)]">{modalSelectedProduct.unit || 'unit'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 border-2 border-dashed border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-large,6px)] flex flex-col items-center justify-center">
                      <Package size={24} className="text-[var(--fluent-text-tertiary,#8A8886)]" />
                      <p className="text-xs text-[var(--fluent-text-tertiary,#8A8886)] mt-1">Selecciona un producto</p>
                    </div>
                  )}

                  {/* Quantity & Cost */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]">Cantidad</label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all" 
                        value={modalQuantity} 
                        onChange={e => setModalQuantity(e.target.value)} 
                        placeholder="0"
                      />
                      <p className="text-xs text-[var(--fluent-text-tertiary,#8A8886)]">Unidades a comprar</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]">Costo Unitario</label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all" 
                        value={modalUnitPrice} 
                        onChange={e => setModalUnitPrice(e.target.value)} 
                        placeholder="0.00"
                      />
                      <p className="text-xs text-[var(--fluent-text-tertiary,#8A8886)]">Precio de compra por unidad</p>
                    </div>
                  </div>

                  {/* Tax Rate */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]">
                      {t('purchases.modal.tax_rate', 'Tasa de Impuesto')}
                    </label>
                    <select
                      className="w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all cursor-pointer"
                      value={modalTaxRateId || ''}
                      onChange={e => setModalTaxRateId(e.target.value ? Number(e.target.value) : null)}
                      disabled={loading}
                    >
                      <option value="">{loading ? 'Cargando...' : t('purchases.modal.no_tax', 'Sin impuesto')}</option>
                      {taxRates.map(taxRate => (
                        <option key={taxRate.id} value={taxRate.id}>
                          {taxRate.tax_name} - {taxRate.rate}% {taxRate.country ? `(${taxRate.country})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Column 2: Pricing Strategy & Financial Summary */}
                <div className="space-y-4">
                  {/* Pricing Mode Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]">Estrategia de Precio de Venta</label>
                    <div className="flex p-0.5 bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)]">
                      <button 
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-[var(--fluent-duration-fast,150ms)] ${
                          pricingMode === 'margin' 
                            ? 'bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] shadow-[var(--fluent-shadow-2)] text-[var(--fluent-brand-primary,#0078D4)]' 
                            : 'text-[var(--fluent-text-secondary,#605E5C)]'
                        }`} 
                        onClick={() => setPricingMode('margin')}
                      >
                        Por Margen %
                      </button>
                      <button 
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-[var(--fluent-duration-fast,150ms)] ${
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]">{pricingMode === 'margin' ? 'Margen de Ganancia' : 'Margen Calculado'}</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          className={`w-full pl-3 pr-8 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold transition-all ${
                            pricingMode !== 'margin' 
                              ? 'opacity-60 cursor-not-allowed text-[var(--fluent-text-tertiary,#8A8886)]' 
                              : 'text-[var(--fluent-semantic-success,#107C10)] focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)]'
                          }`} 
                          value={pricingMode === 'margin' ? modalProfitPct : effectiveProfitPct.toFixed(1)} 
                          onChange={e => pricingMode === 'margin' && setModalProfitPct(Number(e.target.value))} 
                          readOnly={pricingMode !== 'margin'} 
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fluent-text-tertiary,#8A8886)]">%</span>
                      </div>
                      <p className="text-xs text-[var(--fluent-text-tertiary,#8A8886)]">{pricingMode === 'margin' ? 'Define el % de ganancia deseado' : 'Porcentaje resultante del precio fijo'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]">{pricingMode === 'sale_price' ? 'Precio de Venta' : 'Precio Sugerido'}</label>
                      <input 
                        type="number" 
                        className={`w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold transition-all ${
                          pricingMode !== 'sale_price' 
                            ? 'opacity-60 cursor-not-allowed text-[var(--fluent-text-tertiary,#8A8886)]' 
                            : 'text-[var(--fluent-brand-primary,#0078D4)] focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)]'
                        }`} 
                        value={pricingMode === 'sale_price' ? modalSalePrice : effectiveSalePrice.toFixed(0)} 
                        onChange={e => pricingMode === 'sale_price' && setModalSalePrice(Number(e.target.value))} 
                        readOnly={pricingMode !== 'sale_price'} 
                      />
                      <p className="text-xs text-[var(--fluent-text-tertiary,#8A8886)]">{pricingMode === 'sale_price' ? 'Precio final al público' : 'Calculado según margen'}</p>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="p-4 bg-[rgba(0,120,212,0.06)] dark:bg-[rgba(0,120,212,0.12)] rounded-[var(--fluent-corner-radius-medium,4px)] border border-[rgba(0,120,212,0.15)]">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-xs text-[var(--fluent-text-tertiary,#8A8886)]">Costo Unitario</span>
                        <span className="text-sm font-medium text-[var(--fluent-text-primary,#212121)] dark:text-white">{formatCurrency(modalUnitPrice || 0)}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-[var(--fluent-text-tertiary,#8A8886)]">Precio Venta Unitario</span>
                        <span className="text-sm font-semibold text-[var(--fluent-semantic-success,#107C10)]">{formatCurrency(effectiveSalePrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Projection Panel */}
                  <div className="p-4 bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-large,6px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]">
                    <div className="text-xs font-semibold text-[var(--fluent-text-secondary,#605E5C)] uppercase tracking-wide mb-3">Proyección Financiera</div>
                    <div className="space-y-2">
                      {/* Resumen de Línea */}
                      <div className="flex justify-between items-center py-2 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]">
                        <span className="text-xs text-[var(--fluent-text-secondary,#605E5C)]">Subtotal Línea</span>
                        <span className="text-xs text-[var(--fluent-text-tertiary,#8A8886)]">{modalQuantity || 0} × {formatCurrency(modalUnitPrice || 0)}</span>
                      </div>
                      
                      {/* Total Compra */}
                      <div className="flex justify-between items-center py-2 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]">
                        <span className="text-sm text-[var(--fluent-text-secondary,#605E5C)]">Total Compra</span>
                        <span className="text-sm font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white">{formatCurrency((modalQuantity || 0) * (modalUnitPrice || 0))}</span>
                      </div>
                      
                      {/* Total Venta Esperado */}
                      <div className="flex justify-between items-center py-2 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]">
                        <span className="text-sm text-[var(--fluent-text-secondary,#605E5C)]">Venta Esperada</span>
                        <span className="text-sm font-semibold text-[var(--fluent-brand-primary,#0078D4)]">{formatCurrency((modalQuantity || 0) * effectiveSalePrice)}</span>
                      </div>
                      
                      {/* Ganancia Esperada */}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-medium text-[var(--fluent-text-primary,#212121)] dark:text-white">Ganancia Esperada</span>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${((modalQuantity || 0) * effectiveSalePrice) - ((modalQuantity || 0) * (modalUnitPrice || 0)) >= 0 ? 'text-[var(--fluent-semantic-success,#107C10)]' : 'text-[var(--fluent-semantic-danger,#D13438)]'}`}>
                            {formatCurrency(((modalQuantity || 0) * effectiveSalePrice) - ((modalQuantity || 0) * (modalUnitPrice || 0)))}
                          </span>
                          {(modalQuantity || 0) > 0 && (modalUnitPrice || 0) > 0 && (
                            <span className="ml-1.5 text-xs font-medium text-[var(--fluent-semantic-success,#107C10)]">
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
            <footer className="px-5 py-3 border-t border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] flex justify-end items-center gap-3 shrink-0">
              <button 
                className="px-5 py-2 font-medium text-[var(--fluent-text-secondary,#605E5C)] hover:text-[var(--fluent-text-primary,#212121)] hover:bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:hover:bg-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] transition-all text-sm border border-[var(--fluent-border-neutral,#E1DFDD)]" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button 
                className="px-5 py-2 bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none text-sm" 
                onClick={handleConfirmAddProduct} 
                disabled={!modalSelectedProduct || !modalQuantity || !modalUnitPrice}
              >
                {editingItemId ? 'Guardar Cambios' : 'Agregar a la Orden'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* VIEW ORDER MODAL - Fluent 2 Dialog */}
      {showViewModal && viewOrderData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewModal(false)}></div>
          <div className="relative bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] w-full max-w-3xl max-h-[90vh] rounded-[var(--fluent-corner-radius-xlarge,8px)] shadow-[var(--fluent-shadow-64)] overflow-hidden flex flex-col border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)]">
            <header className="px-5 py-4 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] flex justify-between items-center bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)]">
              <h3 className="text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white">Detalle de Orden #{viewOrderData.purchase?.id || viewOrderData.id}</h3>
              <button onClick={() => setShowViewModal(false)} className="w-8 h-8 flex items-center justify-center text-[var(--fluent-text-tertiary,#8A8886)] hover:text-[var(--fluent-text-primary,#212121)] hover:bg-[var(--fluent-surface-tertiary,#F3F2F1)] rounded-[var(--fluent-corner-radius-medium,4px)] transition-colors"><X size={18} /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-large,6px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]">
                  <div className="text-xs text-[var(--fluent-text-tertiary,#8A8886)] mb-1">Proveedor</div>
                  <div className="font-semibold text-sm text-[var(--fluent-brand-primary,#0078D4)]">{viewOrderData.purchase?.supplier_name || '-'}</div>
                </div>
                <div className="p-4 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-large,6px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]">
                  <div className="text-xs text-[var(--fluent-text-tertiary,#8A8886)] mb-1">Estado</div>
                  <span className="inline-flex px-2 py-0.5 rounded-[var(--fluent-corner-radius-small,2px)] text-xs font-medium bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-130,#605E5C)]">{getStatusText(viewOrderData.purchase?.status || viewOrderData.status)}</span>
                </div>
                <div className="p-4 bg-[rgba(0,120,212,0.08)] rounded-[var(--fluent-corner-radius-large,6px)] border border-[rgba(0,120,212,0.2)]">
                  <div className="text-xs text-[var(--fluent-text-tertiary,#8A8886)] mb-1">Monto Total</div>
                  <div className="font-bold text-lg text-[var(--fluent-brand-primary,#0078D4)]">{formatCurrency(viewOrderData.purchase?.total_amount || viewOrderData.total_amount)}</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[var(--fluent-text-secondary,#605E5C)]">Artículos</h4>
                <div className="rounded-[var(--fluent-corner-radius-large,6px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] text-xs text-[var(--fluent-text-secondary,#605E5C)]">
                      <tr><th className="px-4 py-2.5">Producto</th><th className="px-4 py-2.5 text-center">Cant.</th><th className="px-4 py-2.5 text-right">Subtotal</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--fluent-border-neutral,#E1DFDD)] dark:divide-[var(--fluent-neutral-grey-140,#484644)]">
                      {viewOrderData.details?.map((d, i) => (
                        <tr key={i}><td className="px-4 py-2.5 text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white">{d.product_name}</td><td className="px-4 py-2.5 text-center text-sm">{d.quantity} {d.unit}</td><td className="px-4 py-2.5 text-right font-semibold text-[var(--fluent-brand-primary,#0078D4)]">{formatCurrency(d.line_total || (d.quantity * d.unit_price))}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <footer className="px-5 py-3 border-t border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] flex justify-end">
              <button className="px-4 py-2 bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-130,#605E5C)] hover:bg-[var(--fluent-surface-quaternary,#EDEBE9)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-120,#797775)] rounded-[var(--fluent-corner-radius-medium,4px)] font-medium text-sm transition-colors" onClick={() => setShowViewModal(false)}>Cerrar</button>
            </footer>
          </div>
        </div>
      )}

      {/* CANCEL ORDER MODAL - Fluent 2 Dialog */}
      {showCancelPreview && cancelPreviewData && orderToCancel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelPreview(false)}></div>
          <div className="relative bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] w-full max-w-sm rounded-[var(--fluent-corner-radius-xlarge,8px)] shadow-[var(--fluent-shadow-64)] p-6 border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] text-center space-y-5">
            <div className="w-14 h-14 bg-[rgba(209,52,56,0.1)] text-[var(--fluent-semantic-danger,#D13438)] rounded-full flex items-center justify-center mx-auto">
              <Ban size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white">¿Anular esta orden?</h3>
              <p className="text-sm text-[var(--fluent-text-secondary,#605E5C)] mt-2">Esta acción afectará los saldos con <span className="font-semibold text-[var(--fluent-semantic-danger,#D13438)]">{orderToCancel.supplier_name}</span>.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="flex-1 py-2.5 font-medium text-[var(--fluent-text-secondary,#605E5C)] hover:bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] transition-colors text-sm" onClick={() => setShowCancelPreview(false)}>Cancelar</button>
              <button className="flex-1 py-2.5 bg-[var(--fluent-semantic-danger,#D13438)] hover:bg-[#B52E31] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-4)] active:scale-[0.98] transition-all text-sm" onClick={handleConfirmCancellation}>Sí, Anular</button>
            </div>
          </div>
        </div>
      )}

      {showInstantPayment && createdOrderData && (
        <InstantPaymentDialog
          isOpen={showInstantPayment}
          onClose={() => { setShowInstantPayment(false); setActiveTab('historial'); handleFilter(); }}
          onConfirm={handleInstantPaymentConfirm}
          orderId={createdOrderData.id}
          totalAmount={createdOrderData.totalAmount}
          currencyCode={createdOrderData.currencyCode}
          paymentMethodId={createdOrderData.paymentMethodId}
          paymentMethodLabel={createdOrderData.paymentMethodLabel}
        />
      )}
    </div>
  )
}

export default Purchases
