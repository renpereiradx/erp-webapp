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
 * Purchases Page - 100% Tailwind CSS Refactor.
 * Follows "React Best Practices" and "React Components" skills.
 * Eliminated all Sass dependencies.
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
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-500 pb-20">
      
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 mb-6 md:mb-8 sticky top-0 z-20">
        <div className="max-w-[2560px] mx-auto flex">
          <button 
            className={`px-6 md:px-8 py-4 text-xs md:text-sm font-black uppercase tracking-[0.1em] transition-all border-b-4 ${activeTab === 'nueva-compra' ? 'border-[#137fec] text-[#137fec]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            onClick={() => setActiveTab('nueva-compra')}
          >
            Nueva Compra
          </button>
          <button 
            className={`px-6 md:px-8 py-4 text-xs md:text-sm font-black uppercase tracking-[0.1em] transition-all border-b-4 ${activeTab === 'historial' ? 'border-[#137fec] text-[#137fec]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            onClick={() => setActiveTab('historial')}
          >
            Historial de Órdenes
          </button>
        </div>
      </div>

      <main className="max-w-[2560px] mx-auto px-4 md:px-8">
        
        {activeTab === 'nueva-compra' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            
            {/* Left Column: Items & Summary */}
            <div className="lg:col-span-8 space-y-6 md:space-y-8">
              
              {/* Products Table Card */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 overflow-hidden group">
                <div className="px-6 md:px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight transition-all group-hover:translate-x-1">Productos en la Orden</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Lista detallada de artículos a ingresar</p>
                  </div>
                  <button 
                    className="w-full sm:w-auto bg-[#137fec] hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus size={16} strokeWidth={3} />
                    Agregar Artículo
                  </button>
                </div>
                
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-6 py-4">ID / SKU</th>
                        <th className="px-6 py-4">Producto</th>
                        <th className="px-6 py-4 text-center">Cant.</th>
                        <th className="px-6 py-4 text-right">Costo Unit.</th>
                        <th className="px-6 py-4 text-right">Margen</th>
                        <th className="px-6 py-4 text-right">Subtotal</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {purchaseItems.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-20 text-center">
                            <div className="flex flex-col items-center gap-3 opacity-40 grayscale">
                              <Search size={40} className="text-slate-300" />
                              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No hay artículos seleccionados</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        purchaseItems.map(item => (
                          <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group/row" onDoubleClick={() => handleEditItem(item)}>
                            <td className="px-6 py-5">
                              <div className="text-xs font-mono font-bold text-slate-400">#{item.product_id}</div>
                              <div className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{item.sku}</div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="font-black text-sm text-slate-700 dark:text-slate-200 group-hover/row:text-[#137fec] transition-colors uppercase">{item.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unidad: {item.unit}</div>
                            </td>
                            <td className="px-6 py-5 text-center font-black text-slate-900 dark:text-white">{item.quantity}</td>
                            <td className="px-6 py-5 text-right font-bold text-slate-600 dark:text-slate-400">{formatCurrency(item.unit_price)}</td>
                            <td className="px-6 py-5 text-right font-black text-green-600">{item.profit_pct.toFixed(1)}%</td>
                            <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white text-lg tracking-tighter">{formatCurrency(item.unit_price * item.quantity)}</td>
                            <td className="px-6 py-5 text-right">
                              <button onClick={() => setPurchaseItems(prev => prev.filter(i => i.id !== item.id))} className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><X size={18} /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Purchase Totals Card */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-black text-slate-400 uppercase tracking-widest">Artículos Totales</span>
                      <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">{purchaseItems.reduce((s, i) => s + i.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-black text-slate-400 uppercase tracking-widest">Subtotal Compra</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(purchaseItems.reduce((s, i) => s + (i.quantity * i.unit_price), 0))}</span>
                    </div>
                    <div className="h-px bg-slate-100 dark:border-slate-800 my-4"></div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Total Final</span>
                      <span className="text-3xl font-black text-[#137fec] tracking-tighter">{formatCurrency(purchaseItems.reduce((s, i) => s + (i.quantity * i.unit_price), 0))}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 justify-end">
                    <button 
                      className="w-full py-4 bg-[#137fec] hover:bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none uppercase tracking-widest text-xs"
                      onClick={handleSavePurchase}
                      disabled={!selectedSupplier || purchaseItems.length === 0 || loading}
                    >
                      {loading ? 'PROCESANDO...' : 'CONFIRMAR Y GUARDAR COMPRA'}
                    </button>
                    <button 
                      className="w-full py-4 border-2 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                      onClick={() => { if (confirm('¿Borrar toda la orden?')) { setPurchaseItems([]); setSelectedSupplier(null); setSupplierSearch(''); } }}
                    >
                      CANCELAR TODO
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Configuration & Supplier */}
            <aside className="lg:col-span-4 space-y-6 md:space-y-8">
              
              {/* Supplier Selection Card */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 p-6 md:p-8 group">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Proveedor del Pedido</h3>
                
                <div className="space-y-6">
                  <div className="relative" ref={supplierSearchRef}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Buscar Empresa</label>
                    <div className="relative group/input">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#137fec] transition-colors" size={18} />
                      <input 
                        type="text" 
                        placeholder="Nombre del proveedor..." 
                        className="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-[#137fec1a] transition-all"
                        value={supplierSearch}
                        onChange={e => setSupplierSearch(e.target.value)}
                      />
                      {searchingSuppliers && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>}
                    </div>
                    
                    {supplierResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-30 py-2 animate-in slide-in-from-top-2">
                        {supplierResults.map(s => (
                          <button key={s.id} className="w-full px-6 py-3.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex justify-between items-center group/item" onClick={() => handleSupplierSelect(s)}>
                            <span className="font-bold text-slate-700 dark:text-slate-200 group-hover/item:text-[#137fec] transition-colors">{s.name}</span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: {s.id}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSupplier && (
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-[#137fec1a] rounded-3xl animate-in zoom-in-95 duration-300">
                      <div className="font-black text-[#137fec] text-sm uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#137fec] animate-pulse"></div>
                        {selectedSupplier.name}
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Calendar size={14} /> Registrado: {formatDate(selectedSupplier.created_at)}</div>
                        <div className="text-xs font-bold text-slate-400">ID: {selectedSupplier.id}</div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Payment Config Card */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 p-6 md:p-8">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Configuración Financiera</h3>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block">Método de Pago</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-[#137fec1a] transition-all outline-none"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                    >
                      {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.description}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block">Moneda de Transacción</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-[#137fec1a] transition-all outline-none"
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
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            
            {/* History Filter Toolbar */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center bg-slate-50/30 dark:bg-slate-800/10 gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                  <div className="relative w-full sm:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#137fec] transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar por ID o Proveedor..." 
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-[#137fec1a] focus:border-[#137fec] transition-all outline-none"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleFilter()}
                    />
                  </div>
                  <button 
                    className="w-full sm:w-auto px-8 py-3 bg-[#137fec] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-xs"
                    onClick={handleFilter}
                  >
                    BUSCAR
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
                  <div className="flex p-1.5 bg-slate-100 dark:bg-slate-950 rounded-xl">
                    <button 
                      className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all ${searchType === 'date' ? 'bg-white dark:bg-slate-800 shadow-xl text-[#137fec]' : 'text-slate-400 uppercase tracking-widest'}`}
                      onClick={() => setSearchType('date')}
                    >
                      FECHA
                    </button>
                    <button 
                      className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all ${searchType === 'supplier' ? 'bg-white dark:bg-slate-800 shadow-xl text-[#137fec]' : 'text-slate-400 uppercase tracking-widest'}`}
                      onClick={() => setSearchType('supplier')}
                    >
                      PROVEEDOR
                    </button>
                  </div>
                  
                  {searchType === 'date' && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                      <input type="date" className="bg-transparent border-none text-xs font-black text-slate-600 dark:text-slate-300 outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
                      <span className="text-slate-300 font-black">/</span>
                      <input type="date" className="bg-transparent border-none text-xs font-black text-slate-600 dark:text-slate-300 outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              {/* History Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800">Orden ID</th>
                      <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800">Fecha Pedido</th>
                      <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800">Proveedor Empresa</th>
                      <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 text-right">Monto Total</th>
                      <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 text-center">Estado</th>
                      <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 text-right">Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {purchaseOrders.length === 0 ? (
                      <tr><td colSpan="6" className="py-32 text-center text-slate-300 italic uppercase tracking-widest font-black opacity-30">No se encontraron registros de compra</td></tr>
                    ) : (
                      purchaseOrders.map(orderData => {
                        const order = orderData.purchase || orderData;
                        const isCompleted = order.status?.toUpperCase() === 'COMPLETED' || order.status?.toUpperCase() === 'RECEIVED';
                        const isCancelled = order.status?.toUpperCase() === 'CANCELLED';
                        
                        return (
                          <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-blue-900/10 transition-all group/row">
                            <td className="px-8 py-6 font-black text-[#137fec] text-sm tracking-tight group-hover/row:scale-105 transition-transform origin-left">#{order.id}</td>
                            <td className="px-8 py-6 text-slate-500 dark:text-slate-400 font-bold text-xs">{formatDate(order.order_date)}</td>
                            <td className="px-8 py-6 font-black text-slate-700 dark:text-slate-200 text-sm uppercase">{order.supplier_name || '-'}</td>
                            <td className="px-8 py-6 text-right font-black text-slate-900 dark:text-white text-lg tracking-tighter">{formatCurrency(order.total_amount, order.currency)}</td>
                            <td className="px-8 py-6 text-center">
                              <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                isCancelled ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse'
                              }`}>
                                {getStatusText(order.status)}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="relative inline-block">
                                <button 
                                  onClick={() => setOpenActionMenu(openActionMenu === order.id ? null : order.id)} 
                                  className="p-2.5 text-slate-200 hover:text-[#137fec] hover:bg-[#137fec0d] rounded-xl transition-all shadow-sm active:scale-90"
                                >
                                  <MoreVertical size={20} />
                                </button>
                                {openActionMenu === order.id && (
                                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-40 py-2 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
                                    <button 
                                      onClick={() => handleViewPurchase(order)} 
                                      className="w-full px-6 py-3.5 text-left text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-4 transition-colors uppercase tracking-widest"
                                    >
                                      <Eye size={16} className="text-[#137fec]" /> Ver Auditoría
                                    </button>
                                    {!isCancelled && (
                                      <button 
                                        onClick={() => handleCancelPurchase(order)} 
                                        className="w-full px-6 py-3.5 text-left text-xs font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-4 transition-colors uppercase tracking-widest"
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

      {/* PRODUCT MODAL - 720p OPTIMIZED & 100% TAILWIND */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#1a2632] w-full max-w-5xl max-h-[90vh] md:max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/10">
            
            <header className="px-8 md:px-12 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1a2632] sticky top-0 z-10">
              <div className="group">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-all group-hover:translate-x-1">
                  {editingItemId ? 'Editor de Artículo' : 'Nuevo Artículo de Compra'}
                </h3>
                <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Gestión de costos y márgenes operativos</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-inner active:scale-90"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
                
                {/* Left Section: Catalog Discovery */}
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#137fec] uppercase tracking-[0.3em] block px-1">Explorar Catálogo</label>
                    <div className="relative group" ref={modalProductSearchRef}>
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#137fec] transition-colors" size={22} />
                      <input 
                        type="text" 
                        className="w-full pl-14 pr-14 py-5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[1.5rem] text-sm md:text-base font-bold focus:ring-4 focus:ring-[#137fec1a] transition-all shadow-inner" 
                        placeholder="SKU, EAN o Nombre del producto..." 
                        value={modalProductSearch} 
                        onChange={e => setModalProductSearch(e.target.value)} 
                        onFocus={() => setShowProductDropdown(true)} 
                      />
                      {searchingProducts && <div className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 border-3 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>}
                      
                      {showProductDropdown && filteredModalProducts.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-800 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 overflow-hidden z-50 max-h-[300px] overflow-y-auto animate-in slide-in-from-top-4">
                          {filteredModalProducts.map(p => (
                            <div key={p.id} className="px-8 py-5 hover:bg-blue-50 dark:hover:bg-blue-900/40 cursor-pointer border-b border-slate-50 dark:border-slate-700 last:border-none flex justify-between items-center group/item" onClick={() => handleProductSelect(p)}>
                              <div className="min-w-0">
                                <div className="font-black text-sm md:text-base text-slate-700 dark:text-slate-200 group-hover/item:text-[#137fec] transition-colors uppercase truncate">{p.name || p.product_name}</div>
                                <div className="flex gap-3 mt-1.5">
                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: {p.id}</span>
                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">SKU: {p.sku || '-'}</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(p.cost_price || p.unit_cost || 0)}</div>
                                <div className={`text-[9px] font-black mt-1 uppercase tracking-tighter ${p.stock > 0 ? 'text-green-500' : 'text-red-400'}`}>Stock: {p.stock || 0}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {modalSelectedProduct ? (
                    <div className="p-8 bg-[#137fec0d] border-2 border-dashed border-[#137fec26] rounded-[2rem] animate-in zoom-in-95 duration-500">
                      <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-white dark:bg-[#1a2632] rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-900/10 font-black text-[#137fec] text-3xl shrink-0">{modalSelectedProduct.name?.charAt(0)}</div>
                        <div className="min-w-0">
                          <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase leading-tight truncate">{modalSelectedProduct.name}</h4>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-white/20">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SKU Oficial</p>
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{modalSelectedProduct.sku}</p>
                            </div>
                            <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-white/20">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unidad Medida</p>
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">{modalSelectedProduct.unit}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 opacity-40">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center"><Search size={32} className="text-slate-300" /></div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Pendiente de Selección</p>
                    </div>
                  )}
                </div>

                {/* Right Section: Quantitative Logic */}
                <div className="bg-slate-50 dark:bg-slate-800/30 p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-10 shadow-inner">
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Cantidad</label>
                      <input 
                        type="number" 
                        className="w-full px-6 py-4 bg-white dark:bg-[#1a2632] border-none rounded-2xl text-xl font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-[#137fec1a] transition-all shadow-sm" 
                        value={modalQuantity} 
                        onChange={e => setModalQuantity(e.target.value)} 
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Costo Neto</label>
                      <input 
                        type="number" 
                        className="w-full px-6 py-4 bg-white dark:bg-[#1a2632] border-none rounded-2xl text-xl font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-[#137fec1a] transition-all shadow-sm" 
                        value={modalUnitPrice} 
                        onChange={e => setModalUnitPrice(e.target.value)} 
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex p-1.5 bg-slate-200 dark:bg-slate-950 rounded-[1.25rem]">
                      <button 
                        className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${pricingMode === 'margin' ? 'bg-white dark:bg-slate-800 shadow-xl text-[#137fec]' : 'text-slate-500 uppercase tracking-widest'}`} 
                        onClick={() => setPricingMode('margin')}
                      >
                        MODO MARGEN (%)
                      </button>
                      <button 
                        className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${pricingMode === 'sale_price' ? 'bg-white dark:bg-slate-800 shadow-xl text-[#137fec]' : 'text-slate-500 uppercase tracking-widest'}`} 
                        onClick={() => setPricingMode('sale_price')}
                      >
                        MODO PRECIO FIJO
                      </button>
                    </div>
                    {/* Tax Rate Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">
                        {t('purchases.modal.tax_rate', 'Tasa de Impuesto')}
                      </label>
                      <select
                        className="w-full px-6 py-4 bg-white dark:bg-[#1a2632] border-none rounded-2xl text-lg font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-[#137fec1a] transition-all shadow-sm"
                        value={modalTaxRateId || ''}
                        onChange={e =>
                          setModalTaxRateId(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        disabled={loadingTaxRates}
                      >
                        <option value=''>
                          {loadingTaxRates
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
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 px-2">
                        {t(
                          'purchases.modal.tax_rate_note',
                          'Selecciona la tasa de impuesto aplicable al producto'
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      {/* Dynamic pricing fields */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">{pricingMode === 'margin' ? 'Margen Ganancia' : 'Margen Real'}</label>
                        <div className="relative group/margin">
                          <input 
                            type="number" 
                            className={`w-full pl-6 pr-12 py-4 bg-white dark:bg-[#1a2632] border-none rounded-2xl font-black text-lg transition-all ${pricingMode !== 'margin' ? 'opacity-40 grayscale cursor-not-allowed' : 'focus:ring-4 focus:ring-[#137fec1a] text-[#137fec]'}`} 
                            value={pricingMode === 'margin' ? modalProfitPct : effectiveProfitPct.toFixed(1)} 
                            onChange={e => pricingMode === 'margin' && setModalProfitPct(Number(e.target.value))} 
                            readOnly={pricingMode !== 'margin'} 
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">{pricingMode === 'sale_price' ? 'Precio de Venta' : 'Precio Sugerido'}</label>
                        <input 
                          type="number" 
                          className={`w-full px-6 py-4 bg-white dark:bg-[#1a2632] border-none rounded-2xl font-black text-lg transition-all ${pricingMode !== 'sale_price' ? 'opacity-40 grayscale cursor-not-allowed' : 'focus:ring-4 focus:ring-[#137fec1a] text-[#137fec]'}`} 
                          value={pricingMode === 'sale_price' ? modalSalePrice : effectiveSalePrice.toFixed(0)} 
                          onChange={e => pricingMode === 'sale_price' && setModalSalePrice(Number(e.target.value))} 
                          readOnly={pricingMode !== 'sale_price'} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer className="px-8 md:px-12 py-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a2632] flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="text-left hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Resumen del Renglón</p>
                <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Total: {formatCurrency((modalQuantity || 0) * (modalUnitPrice || 0))}</p>
              </div>
              <div className="flex w-full sm:w-auto gap-4">
                <button 
                  className="flex-1 sm:flex-none px-10 py-4 font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[1.5rem] transition-all uppercase tracking-widest text-[10px]" 
                  onClick={() => setIsModalOpen(false)}
                >
                  DESCARTAR
                </button>
                <button 
                  className="flex-1 sm:flex-none px-12 py-4 bg-[#137fec] text-white font-black rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(19,127,236,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-widest text-[10px]" 
                  onClick={handleConfirmAddProduct} 
                  disabled={!modalSelectedProduct || !modalQuantity || !modalUnitPrice}
                >
                  {editingItemId ? 'GUARDAR CAMBIOS' : 'AÑADIR A LA ORDEN'}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* REUSABLE MODALS - DETALLE Y CANCELACIÓN */}
      {showViewModal && viewOrderData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowViewModal(false)}></div>
          <div className="relative bg-white dark:bg-[#1a2632] w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10">
            <header className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1a2632]">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Auditoría de Orden #{viewOrderData.purchase?.id || viewOrderData.id}</h3>
              <button onClick={() => setShowViewModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-red-500 transition-colors"><X size={20} /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-700">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Proveedor Asociado</div>
                  <div className="font-black text-sm text-[#137fec] uppercase truncate">{viewOrderData.purchase?.supplier_name || '-'}</div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-700">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Estado Actual</div>
                  <div className="inline-flex px-3 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm font-black text-[10px] uppercase tracking-widest">{getStatusText(viewOrderData.purchase?.status || viewOrderData.status)}</div>
                </div>
                <div className="p-6 bg-[#137fec0d] rounded-[1.5rem] border border-[#137fec1a]">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 text-[#137fec]">Monto Consolidado</div>
                  <div className="font-black text-2xl text-[#137fec] tracking-tighter">{formatCurrency(viewOrderData.purchase?.total_amount || viewOrderData.total_amount)}</div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Desglose de Artículos</h4>
                <div className="rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-inner">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <tr><th className="px-6 py-4">Producto</th><th className="px-6 py-4 text-center">Cant.</th><th className="px-6 py-4 text-right">Subtotal</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {viewOrderData.details?.map((d, i) => (
                        <tr key={i}><td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 uppercase text-xs">{d.product_name}</td><td className="px-6 py-4 text-center font-black text-xs">{d.quantity} {d.unit}</td><td className="px-6 py-4 text-right font-black text-[#137fec] text-sm tracking-tight">{formatCurrency(d.line_total || (d.quantity * d.unit_price))}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <footer className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button className="px-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-all" onClick={() => setShowViewModal(false)}>CERRAR AUDITORÍA</button>
            </footer>
          </div>
        </div>
      )}

      {showCancelPreview && cancelPreviewData && orderToCancel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-950/40 backdrop-blur-xl" onClick={() => setShowCancelPreview(false)}></div>
          <div className="relative bg-white dark:bg-[#1a2632] w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 border-2 border-red-100 dark:border-red-900/20 text-center space-y-8 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><Ban size={40} strokeWidth={3} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">¿Anular Orden?</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 px-4">Esta acción afectará los saldos pendientes con <span className="text-red-500 font-black underline underline-offset-4">{orderToCancel.supplier_name}</span>.</p>
            </div>
            <div className="flex gap-4">
              <button className="flex-1 py-4 font-black text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest text-[10px]" onClick={() => setShowCancelPreview(false)}>VOLVER</button>
              <button className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-500/30 active:scale-95 transition-all uppercase tracking-widest text-[10px]" onClick={handleConfirmCancellation}>SÍ, ANULAR</button>
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
