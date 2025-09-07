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
import useSupplierStore from '@/store/useSupplierStore';
import useProductStore from '@/store/useProductStore';
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

  const { suppliers, getSuppliers } = useSupplierStore();
  const { products, getProducts } = useProductStore();

  const [activeTab, setActiveTab] = useState('dashboard');
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
    expected_delivery_date: ''
  });

  const [newProduct, setNewProduct] = useState({
    product_id: '',
    quantity: '',
    unit_cost: '',
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    payment_method: 'BANK_TRANSFER',
    check_number: '',
    reference_number: '',
    notes: ''
  });

  const [filters, setFilters] = useState({
    status: '',
    supplier_id: '',
    search: '',
    start_date: '',
    end_date: ''
  });

  const [paymentStats, setPaymentStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    handleLoadOrders();
    handleLoadSuppliers();
    handleLoadProducts();
  }, []);

  // Cargar estadísticas de pagos
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadPaymentStatistics();
    }
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
      await getSuppliers();
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleLoadProducts = async () => {
    try {
      await getProducts();
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
        expected_delivery_date: createOrderForm.expected_delivery_date
      };

      await createPurchaseOrder(orderData);
      setCreateOrderDialog(false);
      setCreateOrderForm({
        supplier_id: '',
        products: [],
        notes: '',
        expected_delivery_date: ''
      });
    } catch (error) {
      console.error('Error creating purchase order:', error);
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    try {
      await processPayment(selectedOrderId, {
        amount_paid: parseFloat(paymentForm.amount_paid),
        payment_method: paymentForm.payment_method,
        check_number: paymentForm.check_number || undefined,
        reference_number: paymentForm.reference_number || undefined,
        notes: paymentForm.notes
      });

      setPaymentDialog(false);
      setPaymentForm({
        amount_paid: '',
        payment_method: '',
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
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
                            </SelectItem>
                          ))}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
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

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Órdenes activas en el sistema
                </p>
              </CardContent>
            </Card>

            {/* Total Amount */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  Suma de todas las órdenes
                </p>
              </CardContent>
            </Card>

            {/* Paid Amount */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalAmount > 0 ? ((stats.paidAmount / stats.totalAmount) * 100).toFixed(1) : 0}% del total
                </p>
              </CardContent>
            </Card>

            {/* Pending Amount */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monto Pendiente</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pendingAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  Por pagar a proveedores
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Operaciones frecuentes del sistema de pagos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={handleLoadOrders} 
                  disabled={isPurchaseOrdersLoading}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <RefreshCw className={`w-6 h-6 mb-2 ${isPurchaseOrdersLoading ? 'animate-spin' : ''}`} />
                  {isPurchaseOrdersLoading ? 'Cargando...' : 'Actualizar Órdenes'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setCreateOrderDialog(true)}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Plus className="w-6 h-6 mb-2" />
                  Nueva Orden
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => setPaymentStatsDialog(true)}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <BarChart className="w-6 h-6 mb-2" />
                  Ver Estadísticas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          {purchaseOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Órdenes Recientes</CardTitle>
                <CardDescription>Últimas órdenes de compra creadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {purchaseOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Orden #{order.order_number}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.supplier_name} • {formatCurrency(order.total_amount)}
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Progreso de pago</span>
                            <span>{getPaymentProgress(order.amount_paid, order.total_amount).toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={getPaymentProgress(order.amount_paid, order.total_amount)} 
                            className="h-2"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrderDetail(order.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              setPaymentDialog(true);
                            }}
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex gap-2">
                  <Button
                    variant={filters.status === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterByStatus('')}
                  >
                    Todas
                  </Button>
                  <Button
                    variant={filters.status === 'PENDING' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterByStatus('PENDING')}
                  >
                    Pendientes
                  </Button>
                  <Button
                    variant={filters.status === 'PARTIAL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterByStatus('PARTIAL')}
                  >
                    Parciales
                  </Button>
                  <Button
                    variant={filters.status === 'COMPLETED' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterByStatus('COMPLETED')}
                  >
                    Completadas
                  </Button>
                </div>
                
                <Select value={filters.supplier_id || 'all'} onValueChange={handleFilterBySupplier}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Filtrar por proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proveedores</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.company_name || supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Input
                    placeholder="Fecha inicio"
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-40"
                  />
                  <Input
                    placeholder="Fecha fin"
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Orders List */}
          <Card>
            <CardHeader>
              <CardTitle>Órdenes de Compra</CardTitle>
              <CardDescription>Listado de órdenes de compra y su estado de pago</CardDescription>
            </CardHeader>
            <CardContent>
              {purchaseOrders.length > 0 ? (
                <div className="space-y-2">
                  {purchaseOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">Orden #{order.order_number}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Proveedor: {order.supplier_name} • 
                          Fecha: {new Date(order.created_at).toLocaleDateString()} •
                          Total: {formatCurrency(order.total_amount)}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">
                            Pagado: {formatCurrency(order.amount_paid)} / {formatCurrency(order.total_amount)}
                          </span>
                          <div className="flex-1 max-w-32">
                            <Progress 
                              value={getPaymentProgress(order.amount_paid, order.total_amount)} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrderDetail(order.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                        
                        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setPaymentDialog(true);
                              }}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pagar
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCancellationPreview(order.id)}
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay órdenes de compra</h3>
                  <p className="text-muted-foreground mb-4">
                    Haga clic en "Actualizar" para ver las órdenes existentes o cree una nueva orden
                  </p>
                  <Button onClick={handleLoadOrders} disabled={isPurchaseOrdersLoading}>
                    {isPurchaseOrdersLoading ? 'Cargando...' : 'Cargar Órdenes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Registre un pago para la orden de compra seleccionada
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div>
              <Label htmlFor="amount_paid">Monto a Pagar</Label>
              <Input
                id="amount_paid"
                type="number"
                step="0.01"
                value={paymentForm.amount_paid}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount_paid: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="payment_method">Método de Pago</Label>
              <Select 
                value={paymentForm.payment_method} 
                onValueChange={(value) => setPaymentForm(prev => ({ ...prev, payment_method: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="CHECK">Cheque</SelectItem>
                  <SelectItem value="CREDIT">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentForm.payment_method === 'CHECK' && (
              <div>
                <Label htmlFor="check_number">Número de Cheque</Label>
                <Input
                  id="check_number"
                  value={paymentForm.check_number}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, check_number: e.target.value }))}
                  placeholder="Número de cheque"
                  required
                />
              </div>
            )}

            {paymentForm.payment_method === 'BANK_TRANSFER' && (
              <div>
                <Label htmlFor="reference_number">Número de Referencia</Label>
                <Input
                  id="reference_number"
                  value={paymentForm.reference_number}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Número de referencia"
                  required
                />
              </div>
            )}

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
              <Button type="submit" disabled={isProcessingPayment}>
                {isProcessingPayment ? 'Procesando...' : 'Procesar Pago'}
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
        <DialogContent className="max-w-4xl">
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
                    <p><strong>Número:</strong> {currentPurchaseOrder.order_number}</p>
                    <p><strong>Proveedor:</strong> {currentPurchaseOrder.supplier_name}</p>
                    <p><strong>Fecha:</strong> {new Date(currentPurchaseOrder.created_at).toLocaleDateString()}</p>
                    <p><strong>Estado:</strong> {getStatusBadge(currentPurchaseOrder.status)}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Información de Pago</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Total:</strong> {formatCurrency(currentPurchaseOrder.total_amount)}</p>
                    <p><strong>Pagado:</strong> {formatCurrency(currentPurchaseOrder.amount_paid)}</p>
                    <p><strong>Pendiente:</strong> {formatCurrency(currentPurchaseOrder.remaining_amount || (currentPurchaseOrder.total_amount - currentPurchaseOrder.amount_paid))}</p>
                    <div className="mt-2">
                      <Progress 
                        value={getPaymentProgress(currentPurchaseOrder.amount_paid, currentPurchaseOrder.total_amount)} 
                        className="h-3"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {getPaymentProgress(currentPurchaseOrder.amount_paid, currentPurchaseOrder.total_amount).toFixed(1)}% completado
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products */}
              {currentPurchaseOrder.products && (
                <div>
                  <h3 className="font-semibold mb-2">Productos</h3>
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
                          <TableCell>{product.product_name}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>{formatCurrency(product.unit_cost)}</TableCell>
                          <TableCell>{formatCurrency(product.total_cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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