/**
 * Enhanced Purchase Orders Page - Redesigned with Table View
 * Implements the Purchase Order Enhanced API following MVP patterns
 * Features table-based product selection and enhanced purchase order creation
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  X
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataState from '@/components/ui/DataState';
import EmptyState from '@/components/ui/EmptyState';

// Custom Hooks and Services
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';
import { translatePurchaseStatus } from '@/utils/statusUtils';
import usePurchaseStore from '@/store/usePurchaseStore';
import useProductStore from '@/store/useProductStore';
import useSupplierStore from '@/store/useSupplierStore';

// Modal Components
import SupplierSelectionModal from '@/components/SupplierSelectionModal';
import ProductSelectionModal from '@/components/ProductSelectionModal';
import TaxSelectionModal from '@/components/TaxSelectionModal';
import { PurchaseOrderCancellationModal } from '@/components/PurchaseOrderCancellationModal';

// Payment Components
import CurrencySelector from '@/components/payment/CurrencySelector';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';

const PurchasesPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();

  // Store states
  const {
    purchaseOrders,
    loading,
    error,
    createEnhancedPurchaseOrder,
    fetchPurchaseOrders,
    getPurchaseOrderAnalysis,
    validatePurchaseOrderIntegrity,
    clearError,
    taxRates,
    fetchTaxRates
  } = usePurchaseStore();

  const { products, searchProducts, searchProductByBarcodeFinancial, loading: productsLoading } = useProductStore();
  const { searchResults: suppliers, searchSuppliers, loading: suppliersLoading } = useSupplierStore();

  // Local states
  const [activeTab, setActiveTab] = useState('create');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedTaxRate, setSelectedTaxRate] = useState(null);
  const [orderData, setOrderData] = useState({
    auto_update_prices: true,
    default_profit_margin: 30.0,
    isPaid: false,
    payment_method_id: null,
    currency_id: null
  });
  const [showAnalysis, setShowAnalysis] = useState(null);

  // Cancellation modal states
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // Search states for list tab
  const [searchMode, setSearchMode] = useState('recent'); // 'recent', 'supplier', 'dateRange'
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [showInactiveSuppliers, setShowInactiveSuppliers] = useState(false);
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      startDate: firstDayOfMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      page: 1,
      pageSize: 10
    };
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Records tab state
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsLimit, setRecordsLimit] = useState(5);
  const [recordsData, setRecordsData] = useState([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Modal states
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(null);

  // Load tax rates on component mount
  useEffect(() => {
    fetchTaxRates();
  }, [fetchTaxRates]);

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
      setSearchResults([]);
    }
  }, [activeTab]);

  // Re-execute search when supplier filter changes
  useEffect(() => {
    if (searchResults.length > 0 && (searchMode === 'supplier' || searchMode === 'dateRange' || searchMode === 'recent')) {
      searchPurchaseOrders();
    }
  }, [showInactiveSuppliers]);

  // Legacy fetchRecords function (still used by old system)
  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const { default: purchaseService } = await import('@/services/purchaseService');
      const response = await purchaseService.getPurchaseRecords(recordsPage, recordsLimit);

      if (response.success) {
        setRecordsData(response.data.records || []);
        setRecordsTotal(response.data.total || 0);
      } else {
        setRecordsData([]);
        setRecordsTotal(0);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      setRecordsData([]);
      setRecordsTotal(0);
    }
    setRecordsLoading(false);
  };

  // Buscar compras con los nuevos endpoints enriquecidos
  const searchPurchaseOrders = async () => {
    setSearchLoading(true);
    try {
      const { default: purchaseService } = await import('@/services/purchaseService');
      let response;

      switch (searchMode) {
        case 'supplier':
          if (!supplierSearchTerm.trim()) {
            alert('Por favor ingresa el nombre del proveedor o ID de proveedor');
            setSearchLoading(false);
            return;
          }

          const searchTerm = supplierSearchTerm.trim();

          // Detectar si es un ID numérico o nombre de proveedor
          const filterOptions = { showInactiveSuppliers };

          if (/^\d+$/.test(searchTerm)) {
            // Es un ID numérico, buscar por ID de proveedor
            console.log('🔍 Buscando por ID de proveedor:', searchTerm);
            response = await purchaseService.getPurchasesBySupplier(searchTerm, filterOptions);
          } else {
            // Es texto, buscar por nombre de proveedor
            console.log('🔍 Buscando por nombre de proveedor:', searchTerm);
            response = await purchaseService.getPurchasesBySupplierName(searchTerm, filterOptions);
          }
          break;

        case 'dateRange':
          if (!dateRange.startDate || !dateRange.endDate) {
            alert('Por favor selecciona un rango de fechas válido');
            setSearchLoading(false);
            return;
          }
          response = await purchaseService.getPurchasesByDateRange(
            dateRange.startDate,
            dateRange.endDate,
            dateRange.page,
            dateRange.pageSize,
            { showInactiveSuppliers }
          );
          break;

        case 'recent':
        default:
          response = await purchaseService.getRecentPurchases(30, 1, 20, { showInactiveSuppliers });
          break;
      }

      if (response.success) {
        setSearchResults(response.data || []);
        console.log('📦 Resultados de búsqueda:', response.data);
      } else {
        setSearchResults([]);
        console.warn('⚠️ Error en búsqueda:', response.error);
      }
    } catch (error) {
      console.error('Error buscando órdenes:', error);
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  // Search is now explicit only - no automatic search when changing modes
  // useEffect(() => {
  //   if (activeTab === 'records' && searchMode === 'recent') {
  //     searchPurchaseOrders();
  //   }
  // }, [activeTab, searchMode]);

  // Calculate totals - prices already include IVA
  const orderTotals = useMemo(() => {
    // The total is just the sum of all products (prices already include IVA)
    const total = selectedProducts.reduce((sum, item) =>
      sum + (item.quantity * item.unit_price), 0
    );

    // Calculate informational IVA breakdown for display purposes only
    const ivaBreakdown = selectedProducts.reduce((ivaSum, item) => {
      if (item.tax_rate_id && taxRates.length > 0) {
        const productTaxRate = taxRates.find(tr => tr.id === item.tax_rate_id);
        if (productTaxRate) {
          const rate = (productTaxRate.rate || productTaxRate.tax_rate || 0) / 100;
          // Calculate the IVA portion that's already included in the price
          const ivaAmount = (item.quantity * item.unit_price * rate) / (1 + rate);
          return ivaSum + ivaAmount;
        }
      }
      return ivaSum;
    }, 0);

    // Base amount (without IVA) for informational purposes
    const baseAmount = total - ivaBreakdown;
    const avgTaxRate = total > 0 ? (ivaBreakdown / baseAmount) * 100 : 0;

    return {
      subtotal: baseAmount,  // Base amount without IVA (informational)
      tax: ivaBreakdown,     // IVA amount already included (informational)
      total: total,          // Total to pay (no additional IVA added)
      taxRate: avgTaxRate    // Average IVA rate (informational)
    };
  }, [selectedProducts, taxRates]);

  // Get selected product IDs for modal
  const selectedProductIds = selectedProducts.map(p => p.product_id);

  // Handle modal selections
  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
  };

  const handleSelectProduct = (product) => {
    const existing = selectedProducts.find(p => p.product_id === product.product_id);
    if (existing) {
      setSelectedProducts(prev =>
        prev.map(p =>
          p.product_id === product.product_id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      );
    } else {
      setSelectedProducts(prev => [...prev, {
        product_id: product.product_id,
        name: product.name,
        description: product.description,
        quantity: 1,
        unit_price: 0,
        unit: 'unit',
        profit_pct: orderData.default_profit_margin,
        tax_rate_id: null
      }]);
    }
  };

  const handleSelectTaxRate = (taxRate) => {
    setSelectedTaxRate(taxRate);
  };


  // Update product in order
  const handleUpdateProduct = (productId, field, value) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.product_id === productId
          ? {
              ...p,
              [field]: field === 'quantity' || field === 'unit_price' || field === 'profit_pct'
                ? parseFloat(value) || 0
                : field === 'tax_rate_id'
                  ? value
                  : value
            }
          : p
      )
    );
  };

  // Remove product from order
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.product_id !== productId));
  };

  // Create purchase order
  const handleCreatePurchaseOrder = async () => {
    if (!selectedSupplier || selectedProducts.length === 0) {
      alert('Por favor selecciona un proveedor y al menos un producto');
      return;
    }

    try {
      const orderPayload = {
        supplier_id: selectedSupplier.id,
        status: orderData.isPaid ? 'COMPLETED' : 'PENDING',
        order_details: selectedProducts.map(product => ({
          product_id: product.product_id,
          quantity: product.quantity,
          unit_price: product.unit_price,
          unit: product.unit,
          profit_pct: product.profit_pct,
          tax_rate_id: product.tax_rate_id
        })),
        auto_update_prices: orderData.auto_update_prices,
        default_profit_margin: orderData.default_profit_margin,
        // Campos de pago - incluir siempre, aunque sean null
        payment_method_id: orderData.payment_method_id,
        currency_id: orderData.currency_id
      };

      // Debug: verificar valores antes de enviar
      console.log('🔍 Payment Debug - Order Data:', {
        payment_method_id: orderData.payment_method_id,
        currency_id: orderData.currency_id,
        types: {
          payment_method_id: typeof orderData.payment_method_id,
          currency_id: typeof orderData.currency_id
        }
      });
      console.log('🔍 Payment Debug - Final Payload:', orderPayload);

      // Validar datos antes de enviar
      const invalidItems = orderPayload.order_details.filter(item =>
        !item.product_id ||
        !item.quantity ||
        item.quantity <= 0 ||
        !item.unit_price ||
        item.unit_price <= 0
      );

      if (invalidItems.length > 0) {
        console.error('Items inválidos encontrados:', invalidItems);
        alert('Error: Algunos productos tienen datos inválidos (cantidad o precio)');
        return;
      }

      const result = await createEnhancedPurchaseOrder(orderPayload);

      if (result.success) {
        // Reset form
        setSelectedSupplier(null);
        setSelectedProducts([]);
        setOrderData({
          auto_update_prices: true,
          default_profit_margin: 30.0,
          isPaid: false,
          payment_method_id: null,
          currency_id: null
        });
        alert(`Orden de compra creada exitosamente!\nID: ${result.purchase_order_id}\nEstado: ${translatePurchaseStatus(orderPayload.status, t)}\n${result.message}`);
        // No cambiar a tab 'list' automáticamente para evitar cargar lista inexistente
        // setActiveTab('list');
      } else {
        alert(`Error: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      alert(`Error al crear orden: ${error.message}`);
    }
  };


  // Show order analysis
  const handleShowAnalysis = async (orderId) => {
    try {
      const analysis = await getPurchaseOrderAnalysis(orderId);
      const validation = await validatePurchaseOrderIntegrity(orderId);

      setShowAnalysis({
        order_id: orderId,
        analysis: analysis.data,
        validation: validation.data
      });
    } catch (error) {
      alert(`Error al obtener análisis: ${error.message}`);
    }
  };

  // Show order details with supplier validation
  const handleShowOrderDetails = async (orderId, supplierName) => {
    try {
      const { default: purchaseService } = await import('@/services/purchaseService');
      const response = await purchaseService.getPurchaseOrderWithSupplierValidation(orderId, supplierName);

      if (response.success) {
        setShowOrderDetails({
          order_id: orderId,
          supplier_name: supplierName,
          data: response.data
        });
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (error) {
      alert(`Error al obtener detalles: ${error.message}`);
    }
  };

  // Handle cancellation modal
  const handleOpenCancellationModal = (order) => {
    setOrderToCancel(order);
    setShowCancellationModal(true);
  };

  const handleCloseCancellationModal = () => {
    setShowCancellationModal(false);
    setOrderToCancel(null);
  };

  const handleCancellationComplete = (result) => {
    if (result.success) {
      console.log('Order cancelled successfully:', result);
      // Refresh the search results to show updated status
      try {
        if (supplierSearchTerm.trim()) {
          searchPurchaseOrders(); // Re-ejecutar la búsqueda actual
        } else {
          loadPurchases(); // Recargar todas las compras si no hay búsqueda activa
        }
      } catch (error) {
        console.error('Error refreshing data after cancellation:', error);
        // Still close the modal even if refresh fails
      }
      // Close the modal after successful cancellation
      handleCloseCancellationModal();
    }
  };

  if (loading && products.length === 0) {
    return <DataState variant="loading" skeletonVariant="list" />;
  }

  if (error) {
    return (
      <DataState
        variant="error"
        title="Error al cargar datos"
        message={error}
        onRetry={() => {
          clearError();
          fetchProducts();
          fetchSuppliers();
        }}
      />
    );
  }

  return (
    <div className="py-4 px-2 lg:px-4 w-full max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className={styles.header('h1')}>
            {t('purchases.title', 'Compras')}
          </h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Orden
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Lista de Órdenes
            </TabsTrigger>
          </TabsList>

          {/* Test Button for Development */}
          <Button
            onClick={() => window.open('/test-purchase-endpoints', '_blank')}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Settings className="w-4 h-4 mr-1" />
            Probar Endpoints
          </Button>
        </div>

        {/* Create Purchase Order Tab */}
        <TabsContent value="create" className="space-y-4">
          {/* Configuration Section - Compact */}
          <div className="border-0 bg-transparent">
            <div className="py-2 px-1">
              <div className="flex items-center gap-2 text-lg mb-3">
                <Settings className="w-4 h-4" />
                Configuración de Orden
              </div>
            </div>
            <div className="px-1">
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
              <div className="purchase-config-grid">
                {/* Left Column - Supplier Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proveedor</label>
                  <Button
                    onClick={() => setShowSupplierModal(true)}
                    variant="outline"
                    className="w-full justify-start h-9"
                    size="sm"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {selectedSupplier ? selectedSupplier.name : 'Seleccionar Proveedor'}
                  </Button>
                  {selectedSupplier && (
                    <div className="text-xs text-muted-foreground">
                      ID: {selectedSupplier.id} • {selectedSupplier.email || 'Sin email'}
                    </div>
                  )}
                </div>

                {/* Right Column - Product Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Productos</label>
                  <Button
                    onClick={() => setShowProductModal(true)}
                    variant="outline"
                    className="w-full justify-start h-9"
                    size="sm"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Agregar Productos
                  </Button>
                  {selectedProducts.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {selectedProducts.length} producto(s) seleccionado(s)
                    </div>
                  )}
                </div>
              </div>

              {/* Configuration Section - Compact */}
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-sm">Configuración Avanzada</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoPricing"
                        checked={orderData.auto_update_prices}
                        onChange={(e) => setOrderData(prev => ({
                          ...prev,
                          auto_update_prices: e.target.checked
                        }))}
                        className="w-4 h-4"
                      />
                      <label htmlFor="autoPricing" className="text-sm">
                        Auto-actualizar precios
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPaid"
                        checked={orderData.isPaid}
                        onChange={(e) => setOrderData(prev => ({
                          ...prev,
                          isPaid: e.target.checked
                        }))}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="isPaid" className="text-sm flex items-center gap-1">
                        <span className={orderData.isPaid ? 'text-green-600 font-medium' : ''}>
                          PAGADO
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({orderData.isPaid ? 'COMPLETED' : 'PENDING'})
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Margen de ganancia por defecto (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      value={orderData.default_profit_margin}
                      onChange={(e) => setOrderData(prev => ({
                        ...prev,
                        default_profit_margin: parseFloat(e.target.value) || 30
                      }))}
                      className="mt-1 h-8"
                      size="sm"
                    />
                  </div>

                  <div className="space-y-2">
                    {/* Payment Method Selector */}
                    <div>
                      <label className="text-sm font-medium">Método de Pago</label>
                      <div className="mt-1">
                        <PaymentMethodSelector
                          value={orderData.payment_method_id}
                          onChange={(method) => {
                            console.log('🔍 PaymentMethod Selected:', method);
                            setOrderData(prev => ({
                              ...prev,
                              payment_method_id: method?.id || null
                            }));
                          }}
                          placeholder="Seleccionar método de pago..."
                          showSearch={true}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Currency Selector */}
                    <div>
                      <label className="text-sm font-medium">Moneda</label>
                      <div className="mt-1">
                        <CurrencySelector
                          value={orderData.currency_id}
                          onChange={(currency) => {
                            console.log('🔍 Currency Selected:', currency);
                            setOrderData(prev => ({
                              ...prev,
                              currency_id: currency?.id || null
                            }));
                          }}
                          placeholder="Seleccionar moneda..."
                          showSearch={true}
                          size="sm"
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
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Productos Seleccionados ({selectedProducts.length})
                  </span>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total:</div>
                    <div className="text-lg font-bold">${orderTotals.total.toFixed(2)}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-medium">Producto</th>
                        <th className="text-center p-3 font-medium">Cantidad</th>
                        <th className="text-center p-3 font-medium">Precio Unit.<br/><span className="text-xs text-muted-foreground">(inc. IVA)</span></th>
                        <th className="text-center p-3 font-medium">Unidad</th>
                        <th className="text-center p-3 font-medium">Margen %</th>
                        <th className="text-center p-3 font-medium">IVA<br/><span className="text-xs text-muted-foreground">(referencial)</span></th>
                        <th className="text-center p-3 font-medium">Total</th>
                        <th className="text-center p-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.map(product => (
                        <tr key={product.product_id} className="border-t">
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">{product.product_id}</div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => handleUpdateProduct(product.product_id, 'quantity', e.target.value)}
                              className="w-20 text-center"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={product.unit_price}
                              onChange={(e) => handleUpdateProduct(product.product_id, 'unit_price', e.target.value)}
                              className="w-24 text-center"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={product.unit}
                              onChange={(e) => handleUpdateProduct(product.product_id, 'unit', e.target.value)}
                              className="border rounded px-2 py-1 text-sm"
                            >
                              <option value="unit">unit</option>
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="l">l</option>
                              <option value="ml">ml</option>
                              <option value="box">box</option>
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min="0"
                              max="1000"
                              step="0.1"
                              value={product.profit_pct}
                              onChange={(e) => handleUpdateProduct(product.product_id, 'profit_pct', e.target.value)}
                              className="w-20 text-center"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={product.tax_rate_id || ''}
                              onChange={(e) => handleUpdateProduct(product.product_id, 'tax_rate_id', e.target.value ? parseInt(e.target.value) : null)}
                              className="border rounded px-2 py-1 text-sm w-32"
                            >
                              <option value="">Sin IVA (0%)</option>
                              {taxRates.map(taxRate => (
                                <option key={taxRate.id} value={taxRate.id}>
                                  {taxRate.tax_name || taxRate.name || 'IVA'} - {taxRate.rate}%
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 text-center font-medium">
                            ${(product.quantity * product.unit_price).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveProduct(product.product_id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Order Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="mb-3 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      <span>ℹ️</span>
                      <span>Los precios del proveedor ya incluyen IVA</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Base (sin IVA)</div>
                      <div className="font-medium text-muted-foreground">${orderTotals.subtotal.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        IVA incluido ({orderTotals.taxRate.toFixed(1)}%)
                      </div>
                      <div className="font-medium text-muted-foreground">${orderTotals.tax.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total a Pagar</div>
                      <div className="text-lg font-bold">${orderTotals.total.toFixed(2)}</div>
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
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Resumen de Compra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg text-center mb-6">
                  <div>
                    <div className="text-sm text-muted-foreground">Productos</div>
                    <div className="font-medium">{selectedProducts.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Base (sin IVA)</div>
                    <div className="font-medium text-muted-foreground">${orderTotals.subtotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      IVA incluido ({orderTotals.taxRate.toFixed(1)}%)
                    </div>
                    <div className="font-medium text-muted-foreground">${orderTotals.tax.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total a Pagar</div>
                    <div className="text-lg font-bold">${orderTotals.total.toFixed(2)}</div>
                  </div>
                </div>

                {/* Create Order Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleCreatePurchaseOrder}
                    disabled={!selectedSupplier || selectedProducts.length === 0 || loading}
                    className={`${styles.button('primary')} flex items-center gap-2`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
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
        <TabsContent value="records" className="space-y-4">
          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Registros de Compras - Búsqueda Avanzada
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Mode Selector */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Tipo de consulta:</label>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSearchMode('recent')}
                      variant={searchMode === 'recent' ? 'default' : 'outline'}
                      size="sm"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Recientes (30 días)
                    </Button>
                    <Button
                      onClick={() => setSearchMode('supplier')}
                      variant={searchMode === 'supplier' ? 'default' : 'outline'}
                      size="sm"
                    >
                      <User className="w-4 h-4 mr-1" />
                      Por Proveedor/ID
                    </Button>
                    <Button
                      onClick={() => setSearchMode('dateRange')}
                      variant={searchMode === 'dateRange' ? 'default' : 'outline'}
                      size="sm"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Por Rango de Fechas
                    </Button>
                  </div>
                </div>

                {/* Search by Supplier */}
                {searchMode === 'supplier' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium min-w-fit">Nombre del proveedor o ID:</label>
                      <Input
                        placeholder="Ej: TechBody, Suministros Varios 55... o ID: 123"
                        value={supplierSearchTerm}
                        onChange={(e) => setSupplierSearchTerm(e.target.value)}
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && searchPurchaseOrders()}
                      />
                      <div className="text-xs text-muted-foreground">
                        Busca por nombre de proveedor o ID de proveedor
                      </div>
                    </div>

                    {/* Supplier Status Filter */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showInactiveSuppliers"
                        checked={showInactiveSuppliers}
                        onChange={(e) => setShowInactiveSuppliers(e.target.checked)}
                        className="rounded border border-input bg-background"
                      />
                      <label htmlFor="showInactiveSuppliers" className="text-sm">
                        Incluir proveedores inactivos
                      </label>
                      <div className="text-xs text-muted-foreground ml-2">
                        {showInactiveSuppliers ? 'Mostrando todos los proveedores' : 'Solo proveedores activos'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search by Date Range */}
                {searchMode === 'dateRange' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Fecha inicio:</label>
                      <Input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Fecha fin:</label>
                      <Input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Página:</label>
                      <Input
                        type="number"
                        min="1"
                        value={dateRange.page}
                        onChange={(e) => setDateRange(prev => ({ ...prev, page: parseInt(e.target.value) || 1 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Registros por página:</label>
                      <select
                        value={dateRange.pageSize}
                        onChange={(e) => setDateRange(prev => ({ ...prev, pageSize: parseInt(e.target.value) }))}
                        className="mt-1 w-full border rounded px-3 py-2"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    </div>

                    {/* Supplier Status Filter for Date Range */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showInactiveSuppliersDateRange"
                        checked={showInactiveSuppliers}
                        onChange={(e) => setShowInactiveSuppliers(e.target.checked)}
                        className="rounded border border-input bg-background"
                      />
                      <label htmlFor="showInactiveSuppliersDateRange" className="text-sm">
                        Incluir proveedores inactivos
                      </label>
                      <div className="text-xs text-muted-foreground ml-2">
                        {showInactiveSuppliers ? 'Mostrando todos los proveedores' : 'Solo proveedores activos'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={searchPurchaseOrders}
                    disabled={searchLoading}
                    className="flex items-center gap-2"
                  >
                    {searchLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Search className="w-4 h-4" />
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
              title="No hay registros de compras"
              description="Usa el botón 'Consultar Registros' para buscar compras por proveedor, rango de fechas o ver las recientes (últimos 30 días)"
              actionLabel="Configurar Búsqueda"
              onAction={() => {
                setSearchMode('recent');
                // No automatic search - user must click the search button
              }}
            />
          ) : (
            <div className="space-y-4">
              {/* Results Summary */}
              {searchResults.length > 0 && (
                <div className="border-0 bg-transparent">
                  <div className="px-1 py-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">
                        <strong>{searchResults.length}</strong> registros encontrados
                        {searchMode === 'supplier' && supplierSearchTerm && (
                          <span> - "<strong>{supplierSearchTerm}</strong>"</span>
                        )}
                        {searchMode === 'dateRange' && dateRange.startDate && (
                          <span> - {dateRange.startDate} a {dateRange.endDate}</span>
                        )}
                        {searchMode === 'recent' && (
                          <span> - últimos 30 días</span>
                        )}
                        <span className="text-xs ml-2">
                          ({showInactiveSuppliers ? 'Todos los proveedores' : 'Solo proveedores activos'})
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {searchResults.reduce((total, order) => total + (order.details?.length || 0), 0)} productos
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Records Display */}
              <div className="grid gap-4">
                {searchResults.map((orderData, index) => {
                  const order = orderData.purchase;
                  const details = orderData.details || [];

                  return (
                    <Card key={order?.id || index} className={styles.card()}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold">Registro #{order?.id}</h3>
                              <Badge variant={order?.status === 'COMPLETED' ? 'success' : 'secondary'}>
                                {translatePurchaseStatus(order?.status, t)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {details.length} productos
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span className="font-medium">{order?.supplier_name}</span>
                                  <span className="text-xs">(ID: {order?.supplier_id})</span>
                                  {order?.supplier_status === false && (
                                    <Badge variant="destructive" className="text-xs">
                                      Inactivo
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {order?.order_date ? new Date(order.order_date).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'Fecha no disponible'}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  <span className="font-bold text-green-600 text-base">
                                    ${order?.total_amount?.toLocaleString() || '0'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span>Por: {order?.user_name || 'No disponible'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {order?.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShowAnalysis(order.id)}
                                title="Análisis detallado"
                              >
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShowOrderDetails(order?.id, order?.supplier_name)}
                              title="Ver detalles completos con validación"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {order?.status !== 'CANCELLED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenCancellationModal(order)}
                                title="Cancelar orden de compra"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Enhanced Product Details Table */}
                        {details.length > 0 && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium mb-3">Detalle de productos ({details.length}):</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="text-left p-2 font-medium">Producto</th>
                                    <th className="text-center p-2 font-medium">Cant.</th>
                                    <th className="text-center p-2 font-medium">Precio Unit.<br/><span className="text-xs text-muted-foreground">(inc. IVA)</span></th>
                                    <th className="text-center p-2 font-medium">Unidad</th>
                                    <th className="text-center p-2 font-medium">Subtotal</th>
                                    <th className="text-center p-2 font-medium">Precio Venta</th>
                                    <th className="text-center p-2 font-medium">Fecha Exp.</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {details.slice(0, 5).map((detail, idx) => (
                                    <tr key={detail.id || idx} className="border-t">
                                      <td className="p-2">
                                        <div className="font-medium">{detail.product_name}</div>
                                        <div className="text-xs text-muted-foreground">ID: {detail.product_id}</div>
                                        {detail.metadata && (
                                          <div className="flex gap-1 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                              Enriquecido
                                            </Badge>
                                          </div>
                                        )}
                                      </td>
                                      <td className="p-2 text-center">{detail.quantity}</td>
                                      <td className="p-2 text-center">${detail.unit_price?.toLocaleString()}</td>
                                      <td className="p-2 text-center">
                                        <Badge variant="outline" className="text-xs">
                                          {detail.unit || detail.metadata?.unit || 'unit'}
                                        </Badge>
                                      </td>
                                      <td className="p-2 text-center font-medium text-green-600">
                                        ${detail.subtotal?.toLocaleString()}
                                      </td>
                                      <td className="p-2 text-center font-medium text-blue-600">
                                        {detail.sale_price ? `$${detail.sale_price.toLocaleString()}` : 'N/A'}
                                        {detail.profit_pct && (
                                          <div className="text-xs text-muted-foreground">
                                            {detail.profit_pct}% margen
                                          </div>
                                        )}
                                      </td>
                                      <td className="p-2 text-center text-xs">
                                        {detail.exp_date ? new Date(detail.exp_date).toLocaleDateString() : 'N/A'}
                                      </td>
                                    </tr>
                                  ))}
                                  {details.length > 5 && (
                                    <tr>
                                      <td colSpan="7" className="p-2 text-center text-xs text-muted-foreground">
                                        ... y {details.length - 5} productos más
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination info for date range searches */}
              {searchMode === 'dateRange' && searchResults.length > 0 && (
                <Card className={styles.card()}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Página <strong>{dateRange.page}</strong> de resultados
                        (máximo {dateRange.pageSize} registros por página)
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDateRange(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
                          }}
                          disabled={dateRange.page <= 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDateRange(prev => ({ ...prev, page: prev.page + 1 }));
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
      </Tabs>

      {/* Analysis Modal */}
      {showAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Análisis de Orden #{showAnalysis.order_id}</h2>
                <Button onClick={() => setShowAnalysis(null)}>×</Button>
              </div>

              {showAnalysis.analysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {showAnalysis.analysis.order_items?.length || 0}
                      </div>
                      <div className="text-sm text-blue-600">Productos</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ${showAnalysis.analysis.order_info?.total_amount?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-sm text-green-600">Total</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {showAnalysis.analysis.pricing_impact?.avg_margin_percent?.toFixed(1) || '0.0'}%
                      </div>
                      <div className="text-sm text-purple-600">Margen Promedio</div>
                    </div>
                  </div>

                  {showAnalysis.validation?.validation_passed === false && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        Issues Encontrados
                      </div>
                      {showAnalysis.validation.issues_found?.map((issue, index) => (
                        <div key={index} className="text-sm text-yellow-700">
                          • {issue.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal with Supplier Validation */}
      {showOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Detalles de Orden #{showOrderDetails.order_id}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Proveedor: {showOrderDetails.supplier_name}
                  </p>
                </div>
                <Button onClick={() => setShowOrderDetails(null)}>×</Button>
              </div>

              {showOrderDetails.data && (
                <div className="space-y-6">
                  {/* Order Header */}
                  {showOrderDetails.data.purchase && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5" />
                          Información de la Orden
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">ID de Orden</label>
                            <div className="font-bold">{showOrderDetails.data.purchase.id}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Estado</label>
                            <div>
                              <Badge variant={showOrderDetails.data.purchase.status === 'COMPLETED' ? 'success' : 'secondary'}>
                                {translatePurchaseStatus(showOrderDetails.data.purchase.status, t)}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Total</label>
                            <div className="font-bold text-green-600">
                              ${showOrderDetails.data.purchase.total_amount?.toLocaleString() || '0'}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Fecha</label>
                            <div>
                              {showOrderDetails.data.purchase.order_date
                                ? new Date(showOrderDetails.data.purchase.order_date).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'No disponible'
                              }
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Proveedor</label>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{showOrderDetails.data.purchase.supplier_name}</span>
                              {showOrderDetails.data.purchase.supplier_status === false && (
                                <Badge variant="destructive" className="text-xs">
                                  Inactivo
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">ID: {showOrderDetails.data.purchase.supplier_id}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Creado por</label>
                            <div>{showOrderDetails.data.purchase.user_name || 'No disponible'}</div>
                            <div className="text-sm text-muted-foreground">ID: {showOrderDetails.data.purchase.user_id}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Order Details with Enhanced Metadata */}
                  {showOrderDetails.data.details && showOrderDetails.data.details.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Productos en la Orden ({showOrderDetails.data.details.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left p-3 font-medium">Producto</th>
                                <th className="text-center p-3 font-medium">Cant.</th>
                                <th className="text-center p-3 font-medium">Precio Unit.<br/><span className="text-xs text-muted-foreground">(inc. IVA)</span></th>
                                <th className="text-center p-3 font-medium">Unidad</th>
                                <th className="text-center p-3 font-medium">Subtotal</th>
                                <th className="text-center p-3 font-medium">Precio Venta</th>
                                <th className="text-center p-3 font-medium">Margen %</th>
                                <th className="text-center p-3 font-medium">Fecha Exp.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {showOrderDetails.data.details.map((detail, idx) => (
                                <tr key={detail.id || idx} className="border-t">
                                  <td className="p-3">
                                    <div className="font-medium">{detail.product_name}</div>
                                    <div className="text-xs text-muted-foreground">ID: {detail.product_id}</div>
                                  </td>
                                  <td className="p-3 text-center">{detail.quantity}</td>
                                  <td className="p-3 text-center">${detail.unit_price?.toLocaleString()}</td>
                                  <td className="p-3 text-center">
                                    <Badge variant="outline" className="text-xs">
                                      {detail.unit || 'unit'}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-center font-medium text-green-600">
                                    ${detail.subtotal?.toLocaleString()}
                                  </td>
                                  <td className="p-3 text-center font-medium text-blue-600">
                                    ${detail.sale_price?.toLocaleString() || 'N/A'}
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <Percent className="w-3 h-3" />
                                      {detail.profit_pct || detail.metadata?.profit_pct || '30'}%
                                    </div>
                                  </td>
                                  <td className="p-3 text-center text-xs">
                                    {detail.exp_date ? new Date(detail.exp_date).toLocaleDateString() : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Summary totals */}
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-sm text-muted-foreground">Total Productos</div>
                              <div className="font-bold">{showOrderDetails.data.details.length}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Cantidad Total</div>
                              <div className="font-bold">
                                {showOrderDetails.data.details.reduce((sum, detail) => sum + (detail.quantity || 0), 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Subtotal Productos</div>
                              <div className="font-bold text-green-600">
                                ${showOrderDetails.data.details.reduce((sum, detail) => sum + (detail.subtotal || 0), 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Total Orden</div>
                              <div className="text-lg font-bold text-green-600">
                                ${showOrderDetails.data.purchase?.total_amount?.toLocaleString() || '0'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Metadata Information (if available) */}
                  {showOrderDetails.data.details?.some(detail => detail.metadata) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          Información Técnica
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="success">✅ Datos Enriquecidos</Badge>
                            <Badge variant="outline">Metadata Completo</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Esta orden incluye metadata completo con información detallada de unidades,
                            tasas de impuestos, márgenes de ganancia y precios de venta calculados dinámicamente.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
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
    </div>
  );
};

export default PurchasesPage;