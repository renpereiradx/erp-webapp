import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { usePurchasePaymentStore } from '@/store/usePurchasePaymentStore';
import { purchasePaymentService } from '@/services/purchasePaymentService';
import purchaseService from '@/services/purchaseService';
import useSupplierStore from '@/store/useSupplierStore';
import useProductStore from '@/store/useProductStore';

// Payment Components
import CurrencySelector from '@/components/payment/CurrencySelector';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import { 
  ShoppingCart, Plus, CreditCard, Eye, X, Search, Package, Truck, DollarSign, 
  Calendar, CheckCircle, AlertTriangle, BarChart, TrendingUp, TrendingDown,
  RefreshCw, Download, Upload, Clock, Users, AlertCircle, Info, FileText
} from 'lucide-react';

const PurchasePayment = () => {
  const { t } = useI18n();
  const { theme } = useThemeStyles();
  
  const {
    purchaseOrders,
    currentPurchaseOrder,
    paymentHistory,
    cancellationPreview,
    isPurchaseOrdersLoading,
    isCurrentPurchaseOrderLoading,
    isCreatingOrder,
    isProcessingPayment,
    isCancellingOrder,
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    processPayment,
    getPaymentHistory,
    getCancellationPreview,
    cancelPurchaseOrder,
    filterByStatus,
    filterBySupplier
  } = usePurchasePaymentStore();

  const { suppliers, fetchSuppliers } = useSupplierStore();
  const { products, fetchProducts } = useProductStore();

  const [activeTab, setActiveTab] = useState('orders');
  const [createOrderDialog, setCreateOrderDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [orderDetailDialog, setOrderDetailDialog] = useState(false);
  const [cancellationPreviewDialog, setCancellationPreviewDialog] = useState(false);
  const [paymentStatsDialog, setPaymentStatsDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [createOrderForm, setCreateOrderForm] = useState({
    supplier_id: '',
    products: [],
    notes: '',
    expected_delivery_date: '',
    currency_id: null
  });

  const [newProduct, setNewProduct] = useState({
    product_id: '',
    quantity: '',
    unit_cost: '',
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    check_number: '',
    reference_number: '',
    notes: ''
  });

  // Search states similar to Purchases page
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

  const [filters, setFilters] = useState({
    status: '',
    supplier_id: '',
    search: '',
    start_date: '',
    end_date: ''
  });

  const [paymentStats, setPaymentStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Cargar datos iniciales - solo suppliers y productos, no órdenes automáticamente
  useEffect(() => {
    handleLoadSuppliers();
    handleLoadProducts();
  }, []);

  // Cargar estadísticas de pagos cuando sea necesario
  useEffect(() => {
    // Removed dashboard dependency - statistics can be loaded on demand
  }, [activeTab]);

  const loadPaymentStatistics = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await purchasePaymentService.getPaymentStatistics();
      setPaymentStats(stats);
    } catch (error) {
      console.error('Error loading payment statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleLoadOrders = async () => {
    try {
      await getPurchaseOrders(filters);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };

  const handleLoadSuppliers = async () => {
    try {
      await fetchSuppliers();
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleLoadProducts = async () => {
    try {
      await fetchProducts();
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.product_id || !newProduct.quantity || !newProduct.unit_cost) {
      return;
    }

    const product = products.find(p => p.id === parseInt(newProduct.product_id));
    const quantity = parseFloat(newProduct.quantity);
    const unitCost = parseFloat(newProduct.unit_cost);

    setCreateOrderForm(prev => ({
      ...prev,
      products: [...prev.products, {
        product_id: parseInt(newProduct.product_id),
        product_name: product?.name || 'Producto desconocido',
        quantity,
        unit_cost: unitCost,
        total_cost: quantity * unitCost,
        notes: newProduct.notes
      }]
    }));

    setNewProduct({
      product_id: '',
      quantity: '',
      unit_cost: '',
      notes: ''
    });
  };

  const handleRemoveProduct = (index) => {
    setCreateOrderForm(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const calculateOrderTotal = () => {
    return createOrderForm.products.reduce((total, product) => total + product.total_cost, 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (createOrderForm.products.length === 0) {
      alert('Debe agregar al menos un producto');
      return;
    }

    try {
      const orderData = {
        supplier_id: parseInt(createOrderForm.supplier_id),
        products: createOrderForm.products,
        total_amount: calculateOrderTotal(),
        notes: createOrderForm.notes,
        expected_delivery_date: createOrderForm.expected_delivery_date,
        currency_id: createOrderForm.currency_id
      };

      // Debug: verificar valores antes de enviar
      console.log('🔍 Create Order Debug - Form Data:', {
        currency_id: createOrderForm.currency_id,
        type: typeof createOrderForm.currency_id
      });
      console.log('🔍 Create Order Debug - Final Payload:', orderData);

      await createPurchaseOrder(orderData);
      setCreateOrderDialog(false);
      setCreateOrderForm({
        supplier_id: '',
        products: [],
        notes: '',
        expected_delivery_date: '',
        currency_id: null
      });
    } catch (error) {
      console.error('Error creating purchase order:', error);
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    try {
      // Debug: verificar valores antes de enviar
      console.log('🔍 Process Payment Debug - Form Data:', {
        amount_paid: paymentForm.amount_paid,
        check_number: paymentForm.check_number,
        reference_number: paymentForm.reference_number,
        notes: paymentForm.notes
      });

      await processPayment(selectedOrderId, {
        amount_paid: parseFloat(paymentForm.amount_paid),
        check_number: paymentForm.check_number || undefined,
        reference_number: paymentForm.reference_number || undefined,
        notes: paymentForm.notes
      });

      setPaymentDialog(false);
      setPaymentForm({
        amount_paid: '',
        check_number: '',
        reference_number: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const handleViewOrderDetail = async (orderId) => {
    setSelectedOrderId(orderId);
    try {
      await getPurchaseOrderById(orderId);
      await getPaymentHistory(orderId);
      setOrderDetailDialog(true);
    } catch (error) {
      console.error('Error loading order details:', error);
    }
  };

  const handleFilterByStatus = async (status) => {
    setFilters(prev => ({ ...prev, status }));
    try {
      await filterByStatus(status, { supplier_id: filters.supplier_id, search: filters.search });
    } catch (error) {
      console.error('Error filtering by status:', error);
    }
  };

  const handleFilterBySupplier = async (supplierId) => {
    const actualSupplierId = supplierId === 'all' ? '' : supplierId;
    setFilters(prev => ({ ...prev, supplier_id: actualSupplierId }));
    try {
      await filterBySupplier(actualSupplierId, { status: filters.status, search: filters.search });
    } catch (error) {
      console.error('Error filtering by supplier:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG'
    }).format(amount);
  };

  const getPaymentProgress = (paid, total) => {
    return total > 0 ? (paid / total) * 100 : 0;
  };

  const calculatePaymentStats = () => {
    if (!purchaseOrders.length) return { totalOrders: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 };
    
    const totalOrders = purchaseOrders.length;
    const totalAmount = purchaseOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const paidAmount = purchaseOrders.reduce((sum, order) => sum + (order.amount_paid || 0), 0);
    const pendingAmount = totalAmount - paidAmount;

    return { totalOrders, totalAmount, paidAmount, pendingAmount };
  };

  const stats = calculatePaymentStats();

  // Search function similar to Purchases page
  const searchPurchaseOrders = async () => {
    setSearchLoading(true);
    try {
      let response;

      switch (searchMode) {
        case 'supplier':
          if (!supplierSearchTerm.trim()) {
            alert('Por favor ingresa el nombre del proveedor o ID de proveedor');
            setSearchLoading(false);
            return;
          }

          const searchTerm = supplierSearchTerm.trim();
          const filterOptions = { showInactiveSuppliers };

          if (/^\d+$/.test(searchTerm)) {
            // Es un ID numérico, buscar por ID de proveedor
            console.log('🔍 Buscando órdenes por ID de proveedor:', searchTerm);
            response = await purchaseService.getPurchasesBySupplier(searchTerm, filterOptions);
          } else {
            // Es texto, buscar por nombre de proveedor
            console.log('🔍 Buscando órdenes por nombre de proveedor:', searchTerm);
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
    } finally {
      setSearchLoading(false);
    }
  };

  // Clear search results when leaving orders tab
  useEffect(() => {
    if (activeTab !== 'orders') {
      setSearchResults([]);
    }
  }, [activeTab]);

  // Re-execute search when supplier filter changes
  useEffect(() => {
    if (searchResults.length > 0 && (searchMode === 'supplier' || searchMode === 'dateRange' || searchMode === 'recent')) {
      searchPurchaseOrders();
    }
  }, [showInactiveSuppliers]);

  // Reset payment form when dialog closes or order changes
  useEffect(() => {
    if (!paymentDialog) {
      setPaymentForm({
        amount_paid: '',
        check_number: '',
        reference_number: '',
        notes: ''
      });
    }
  }, [paymentDialog]);

  useEffect(() => {
    setPaymentForm(prev => ({ ...prev, amount_paid: '' }));
  }, [selectedOrderId]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { label: 'Pendiente', variant: 'secondary', icon: AlertTriangle },
      'PARTIAL': { label: 'Parcial', variant: 'default', icon: Package },
      'COMPLETED': { label: 'Completada', variant: 'success', icon: CheckCircle },
      'CANCELLED': { label: 'Cancelada', variant: 'destructive', icon: X }
    };

    const config = statusConfig[status] || statusConfig['PENDING'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      'CASH': 'Efectivo',
      'BANK_TRANSFER': 'Transferencia',
      'CHECK': 'Cheque',
      'CREDIT': 'Crédito'
    };
    return methods[method] || method;
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Sistema de Pagos de Compras</h1>
            <p className="text-muted-foreground">Gestión integral de órdenes de compra, pagos y proveedores</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadPaymentStatistics}
            disabled={isLoadingStats}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Dialog open={createOrderDialog} onOpenChange={setCreateOrderDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Crear Orden de Compra</DialogTitle>
                <DialogDescription>
                  Configure los detalles de la nueva orden de compra
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrder} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="supplier">Proveedor</Label>
                    <Select
                      value={createOrderForm.supplier_id}
                      onValueChange={(value) => setCreateOrderForm(prev => ({ ...prev, supplier_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.company_name || supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={handleLoadSuppliers}
                      className="p-0 h-auto"
                    >
                      Cargar proveedores
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="currency">Moneda</Label>
                    <div className="mt-1">
                      <CurrencySelector
                        value={createOrderForm.currency_id}
                        onChange={(currency) => {
                          console.log('🔍 Currency Selected for Order:', currency);
                          setCreateOrderForm(prev => ({
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

                  <div>
                    <Label htmlFor="expected_delivery_date">Fecha de Entrega Esperada</Label>
                    <Input
                      id="expected_delivery_date"
                      type="date"
                      value={createOrderForm.expected_delivery_date}
                      onChange={(e) => setCreateOrderForm(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Add Product Section */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-semibold">Agregar Productos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="product">Producto</Label>
                      <Select 
                        value={newProduct.product_id} 
                        onValueChange={(value) => setNewProduct(prev => ({ ...prev, product_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.filter(product => product.id || product.product_id).map(product => {
                            const productId = product.id || product.product_id;
                            return (
                              <SelectItem key={productId} value={productId.toString()}>
                                {product.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        variant="link" 
                        size="sm" 
                        onClick={handleLoadProducts}
                        className="p-0 h-auto"
                      >
                        Cargar productos
                      </Button>
                    </div>
                    <div>
                      <Label htmlFor="quantity">Cantidad</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="1"
                        value={newProduct.quantity}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit_cost">Costo Unitario</Label>
                      <Input
                        id="unit_cost"
                        type="number"
                        step="0.01"
                        value={newProduct.unit_cost}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, unit_cost: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="button" onClick={handleAddProduct} className="w-full">
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Products List */}
                {createOrderForm.products.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Productos en la Orden</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Costo Unit.</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {createOrderForm.products.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell>{product.product_name}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>{formatCurrency(product.unit_cost)}</TableCell>
                            <TableCell>{formatCurrency(product.total_cost)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProduct(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="font-semibold">Total de la Orden</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(calculateOrderTotal())}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={createOrderForm.notes}
                    onChange={(e) => setCreateOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas adicionales..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOrderDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreatingOrder || createOrderForm.products.length === 0}>
                    {isCreatingOrder ? 'Creando...' : 'Crear Orden'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Órdenes
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>


        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {/* Search Options */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar Órdenes de Compra</CardTitle>
              <CardDescription>Selecciona el método de búsqueda y filtros para encontrar órdenes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Mode Selection */}
              <div className="space-y-4">
                <div className="text-sm font-medium">Método de búsqueda:</div>
                <div className="flex gap-4">
                  <div className="flex gap-2">
                    <Button
                      variant={searchMode === 'recent' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSearchMode('recent');
                        setSearchResults([]);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Recientes
                    </Button>
                    <Button
                      variant={searchMode === 'supplier' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSearchMode('supplier');
                        setSearchResults([]);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Por Proveedor
                    </Button>
                    <Button
                      variant={searchMode === 'dateRange' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSearchMode('dateRange');
                        setSearchResults([]);
                      }}
                      className="flex items-center gap-2"
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
                    Buscar Órdenes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length === 0 && !searchLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No hay órdenes para mostrar</h3>
                  <p className="text-sm">
                    Usa el botón "Buscar Órdenes" arriba para encontrar órdenes de compra existentes.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Results Summary */}
              {searchResults.length > 0 && (
                <div className="border-0 bg-transparent">
                  <div className="px-1 py-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">
                        <strong>{searchResults.length}</strong> órdenes encontradas
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

              {/* Orders List */}
              {searchResults.length > 0 && (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))' }}>
                  {searchResults.map((orderData, index) => {
                    const order = orderData.purchase || orderData;
                    const details = orderData.details || [];
                    const paymentPercentage = getPaymentProgress(order?.amount_paid || 0, order?.total_amount || 0);

                    // Traducir estados
                    const statusLabels = {
                      'COMPLETED': 'Completada',
                      'PENDING': 'Pendiente',
                      'PARTIAL_PAYMENT': 'Pago Parcial',
                      'CANCELLED': 'Cancelada',
                      'PROCESSING': 'En Proceso'
                    };

                    return (
                      <Card key={order?.id || index} className="overflow-hidden border-l-4" style={{
                        borderLeftColor: order?.status === 'COMPLETED' ? 'hsl(var(--chart-2))' :
                                        order?.status === 'PENDING' ? 'hsl(var(--chart-3))' :
                                        'hsl(var(--chart-5))'
                      }}>
                        <div className="p-5">
                          {/* Header Section */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 space-y-3">
                              {/* Title Row */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-lg">Orden #{order?.id}</h3>
                                <Badge
                                  variant={order?.status === 'COMPLETED' ? 'default' : order?.status === 'PENDING' ? 'secondary' : 'outline'}
                                  className="font-medium"
                                >
                                  {statusLabels[order?.status] || order?.status || 'N/A'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {details.length} {details.length === 1 ? 'producto' : 'productos'}
                                </Badge>
                                {order?.supplier_status === false && (
                                  <Badge variant="destructive" className="text-xs">
                                    ⚠ Proveedor Inactivo
                                  </Badge>
                                )}
                              </div>

                              {/* Info Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                {/* Left Column */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-muted-foreground text-xs">Proveedor:</span>
                                      <span className="font-semibold truncate">{order?.supplier_name || 'N/A'}</span>
                                      <span className="text-xs text-muted-foreground">(ID: {order?.supplier_id})</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-muted-foreground text-xs">Fecha:</span>
                                      <span className="font-medium">
                                        {order?.order_date ? new Date(order.order_date).toLocaleDateString('es-ES', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        }) : 'No disponible'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-muted-foreground text-xs">Total:</span>
                                      <span className="font-bold text-base">{formatCurrency(order?.total_amount || 0)}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-muted-foreground text-xs">Creado por:</span>
                                      <span className="font-medium">{order?.user_name || 'No disponible'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewOrderDetail(order?.id)}
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              {/* Botón de Pago - solo para órdenes no completadas */}
                              {order?.status !== 'COMPLETED' && order?.status !== 'CANCELLED' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                                  onClick={() => {
                                    setSelectedOrderId(order?.id);
                                    setPaymentDialog(true);
                                  }}
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Pagar
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Payment Progress Section */}
                          <div className="mt-4 p-3 bg-accent/20 rounded-lg space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-muted-foreground">Progreso de pago</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-base">
                                  {formatCurrency(order?.amount_paid || 0)}
                                </span>
                                <span className="text-muted-foreground">/</span>
                                <span className="font-semibold">
                                  {formatCurrency(order?.total_amount || 0)}
                                </span>
                                <Badge variant="secondary" className="ml-2">
                                  {paymentPercentage.toFixed(0)}%
                                </Badge>
                              </div>
                            </div>
                            <Progress
                              value={paymentPercentage}
                              className="h-2.5"
                            />
                            {paymentPercentage > 0 && paymentPercentage < 100 && (
                              <p className="text-xs text-muted-foreground text-right">
                                Resta: {formatCurrency((order?.total_amount || 0) - (order?.amount_paid || 0))}
                              </p>
                            )}
                          </div>

                          {/* Product Details Preview */}
                          {details.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                Productos ({details.length}):
                              </div>
                              <div className="space-y-1.5">
                                {details.slice(0, 2).map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex justify-between items-start text-xs bg-accent/10 p-2 rounded">
                                    <span className="font-medium flex-1 min-w-0 truncate pr-2">
                                      {item.product_name || `Producto ${itemIndex + 1}`}
                                    </span>
                                    <span className="text-muted-foreground whitespace-nowrap">
                                      {item.quantity} × {formatCurrency(item.unit_price || 0)}
                                    </span>
                                  </div>
                                ))}
                                {details.length > 2 && (
                                  <div className="text-xs text-muted-foreground text-center py-1">
                                    + {details.length - 2} producto{details.length - 2 !== 1 ? 's' : ''} más
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Pagos</CardTitle>
              <CardDescription>Procesamiento y seguimiento de pagos de compras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Seleccione una orden para gestionar pagos</h3>
                <p className="text-muted-foreground">
                  Use la pestaña "Órdenes" para ver las órdenes disponibles y procesar pagos
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Pagos</CardTitle>
              <CardDescription>Análisis financiero y métricas de compras</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Estadísticas de Órdenes</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total de órdenes:</span>
                        <span className="font-medium">{paymentStats.order_statistics?.total_orders || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completamente pagadas:</span>
                        <span className="font-medium text-green-600">{paymentStats.order_statistics?.fully_paid_orders || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Parcialmente pagadas:</span>
                        <span className="font-medium text-orange-600">{paymentStats.order_statistics?.partially_paid_orders || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sin pagar:</span>
                        <span className="font-medium text-red-600">{paymentStats.order_statistics?.unpaid_orders || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Resumen Financiero</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Monto total de órdenes:</span>
                        <span className="font-medium">{formatCurrency(paymentStats.financial_summary?.total_order_amount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total pagado:</span>
                        <span className="font-medium text-green-600">{formatCurrency(paymentStats.financial_summary?.total_paid_amount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total pendiente:</span>
                        <span className="font-medium text-orange-600">{formatCurrency(paymentStats.financial_summary?.total_outstanding || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Porcentaje pagado:</span>
                        <span className="font-medium">{(paymentStats.financial_summary?.payment_percentage || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Cargando estadísticas...</h3>
                  <Button onClick={loadPaymentStatistics} disabled={isLoadingStats}>
                    {isLoadingStats ? 'Cargando...' : 'Cargar Estadísticas'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-2xl" style={{ background: 'var(--background, white)', color: 'var(--foreground, black)' }}>
          <DialogHeader>
            <DialogTitle>Procesar Pago - Orden #{selectedOrderId}</DialogTitle>
            <DialogDescription>
              Registre un pago para la orden de compra seleccionada
            </DialogDescription>
          </DialogHeader>

          {/* Order Information */}
          {selectedOrderId && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Información de la Orden</h4>
              {(() => {
                const selectedOrder = searchResults.find(orderData => {
                  const order = orderData.purchase || orderData;
                  return order?.id === selectedOrderId;
                });

                if (!selectedOrder) return <p className="text-sm text-muted-foreground">Orden no encontrada</p>;

                const order = selectedOrder.purchase || selectedOrder;
                const pendingAmount = (order?.total_amount || 0) - (order?.amount_paid || 0);

                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Proveedor:</span>
                      <div className="font-medium">{order?.supplier_name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <div className="font-medium">{formatCurrency(order?.total_amount || 0)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ya Pagado:</span>
                      <div className="font-medium text-green-600">{formatCurrency(order?.amount_paid || 0)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pendiente:</span>
                      <div className="font-medium text-orange-600">{formatCurrency(pendingAmount)}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div>
              <Label htmlFor="amount_paid">Monto a Pagar</Label>
              <div className="flex gap-2">
                <Input
                  id="amount_paid"
                  type="number"
                  step="0.01"
                  value={paymentForm.amount_paid}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount_paid: e.target.value }))}
                  placeholder="0.00"
                  className="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const selectedOrder = searchResults.find(orderData => {
                      const order = orderData.purchase || orderData;
                      return order?.id === selectedOrderId;
                    });

                    if (selectedOrder) {
                      const order = selectedOrder.purchase || selectedOrder;
                      const pendingAmount = (order?.total_amount || 0) - (order?.amount_paid || 0);
                      setPaymentForm(prev => ({ ...prev, amount_paid: pendingAmount.toString() }));
                    }
                  }}
                >
                  Pagar Total
                </Button>
              </div>
            </div>
            

            {/* Campos adicionales para métodos específicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check_number">Número de Cheque (opcional)</Label>
                <Input
                  id="check_number"
                  value={paymentForm.check_number}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, check_number: e.target.value }))}
                  placeholder="Si aplica"
                />
              </div>
              <div>
                <Label htmlFor="reference_number">Número de Referencia (opcional)</Label>
                <Input
                  id="reference_number"
                  value={paymentForm.reference_number}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Si aplica"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="payment_notes">Notas</Label>
              <Textarea
                id="payment_notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas del pago..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentDialog(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isProcessingPayment}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Procesar Pago
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancellation Preview Dialog */}
      <Dialog open={cancellationPreviewDialog} onOpenChange={setCancellationPreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview de Cancelación</DialogTitle>
            <DialogDescription>
              Análisis del impacto de cancelar esta orden de compra
            </DialogDescription>
          </DialogHeader>
          
          {cancellationPreview && (
            <div className="space-y-6">
              {/* Purchase Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Información de la Orden</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>ID:</strong> {cancellationPreview.purchase_info?.purchase_order_id}</p>
                    <p><strong>Estado:</strong> {cancellationPreview.purchase_info?.current_status}</p>
                    <p><strong>Total:</strong> {formatCurrency(cancellationPreview.purchase_info?.total_amount || 0)}</p>
                    <p><strong>Fecha:</strong> {new Date(cancellationPreview.purchase_info?.order_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Estado de Cancelación</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Puede cancelarse:</strong> 
                      <Badge variant={cancellationPreview.purchase_info?.can_be_cancelled ? 'success' : 'destructive'} className="ml-2">
                        {cancellationPreview.purchase_info?.can_be_cancelled ? 'Sí' : 'No'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              {/* Impact Analysis */}
              {cancellationPreview.impact_analysis && (
                <div>
                  <h3 className="font-semibold mb-2">Análisis de Impacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p><strong>Items totales:</strong> {cancellationPreview.impact_analysis.total_items}</p>
                      <p><strong>Pagos a cancelar:</strong> {cancellationPreview.impact_analysis.payments_to_cancel}</p>
                      <p><strong>Total a revertir:</strong> {formatCurrency(cancellationPreview.impact_analysis.total_to_reverse || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <p><strong>Ajustes de stock requeridos:</strong> {cancellationPreview.impact_analysis.stock_adjustments_required}</p>
                      <p><strong>Requiere reversión de pagos:</strong> {cancellationPreview.impact_analysis.requires_payment_reversal ? 'Sí' : 'No'}</p>
                      <p><strong>Requiere ajuste de stock:</strong> {cancellationPreview.impact_analysis.requires_stock_adjustment ? 'Sí' : 'No'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {cancellationPreview.recommendations && (
                <div>
                  <h3 className="font-semibold mb-2">Recomendaciones</h3>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Acción recomendada: {cancellationPreview.recommendations.action}</AlertTitle>
                    <AlertDescription className="space-y-1">
                      <p>Complejidad estimada: <strong>{cancellationPreview.recommendations.estimated_complexity}</strong></p>
                      {cancellationPreview.recommendations.backup_recommended && (
                        <p>• Se recomienda hacer respaldo antes de proceder</p>
                      )}
                      {cancellationPreview.recommendations.notify_supplier && (
                        <p>• Se notificará automáticamente al proveedor</p>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancellationPreviewDialog(false)}>
              Cerrar
            </Button>
            {cancellationPreview?.purchase_info?.can_be_cancelled && (
              <Button 
                variant="destructive" 
                onClick={() => handleCancelOrder(selectedOrderId, 'Cancelada desde preview')}
                disabled={isCancellingOrder}
              >
                {isCancellingOrder ? 'Cancelando...' : 'Confirmar Cancelación'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={orderDetailDialog} onOpenChange={setOrderDetailDialog}>
        <DialogContent className="max-w-none max-h-none w-[95vw] h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden</DialogTitle>
            <DialogDescription>
              Información completa de la orden de compra y pagos
            </DialogDescription>
          </DialogHeader>
          
          {currentPurchaseOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Información de la Orden</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Número:</strong> {currentPurchaseOrder.order_number || currentPurchaseOrder.id || 'N/A'}</p>
                    <p><strong>Proveedor:</strong> {currentPurchaseOrder.supplier_name || currentPurchaseOrder.supplier?.name || 'N/A'}</p>
                    <p><strong>Fecha:</strong> {currentPurchaseOrder.created_at ? new Date(currentPurchaseOrder.created_at).toLocaleDateString() : (currentPurchaseOrder.order_date ? new Date(currentPurchaseOrder.order_date).toLocaleDateString() : 'N/A')}</p>
                    <p><strong>Estado:</strong> {getStatusBadge(currentPurchaseOrder.status || 'PENDING')}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Información de Pago</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Total:</strong> {formatCurrency(currentPurchaseOrder.total_amount || 0)}</p>
                    <p><strong>Pagado:</strong> {formatCurrency(currentPurchaseOrder.amount_paid || 0)}</p>
                    <p><strong>Pendiente:</strong> {formatCurrency(currentPurchaseOrder.remaining_amount || ((currentPurchaseOrder.total_amount || 0) - (currentPurchaseOrder.amount_paid || 0)))}</p>
                    <div className="mt-2">
                      <Progress
                        value={getPaymentProgress(currentPurchaseOrder.amount_paid || 0, currentPurchaseOrder.total_amount || 0)}
                        className="h-3"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {getPaymentProgress(currentPurchaseOrder.amount_paid || 0, currentPurchaseOrder.total_amount || 0).toFixed(1)}% completado
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products */}
              {currentPurchaseOrder.products && (
                <div>
                  <h3 className="font-semibold mb-2">Productos</h3>
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Costo Unitario</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPurchaseOrder.products.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>{product.product_name || 'N/A'}</TableCell>
                          <TableCell>{product.quantity || 0}</TableCell>
                          <TableCell>{formatCurrency(product.unit_cost || product.unit_price || 0)}</TableCell>
                          <TableCell>{formatCurrency(product.total_cost || ((product.quantity || 0) * (product.unit_cost || product.unit_price || 0)))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Payment History */}
              {paymentHistory.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Historial de Pagos</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((payment, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(payment.payment_date || payment.processed_at).toLocaleDateString()}</TableCell>
                          <TableCell>{formatCurrency(payment.amount_paid)}</TableCell>
                          <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                          <TableCell>{payment.payment_reference || payment.reference_number || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === 'COMPLETED' ? 'success' : 'secondary'}>
                              {payment.status === 'COMPLETED' ? 'Completado' : payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setOrderDetailDialog(false)}>
              Cerrar
            </Button>
            {currentPurchaseOrder?.status !== 'COMPLETED' && currentPurchaseOrder?.status !== 'CANCELLED' && (
              <Button 
                onClick={() => {
                  setOrderDetailDialog(false);
                  setPaymentDialog(true);
                }}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Procesar Pago
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchasePayment;