import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useSalePaymentStore } from '@/store/useSalePaymentStore';
import useClientStore from '@/store/useClientStore';
import { Receipt, CreditCard, Eye, X, Users, DollarSign, CheckCircle, AlertTriangle, Calendar, Package } from 'lucide-react';

const SalePayment = () => {
  const { t } = useI18n();
  const { theme } = useThemeStyles();
  
  const {
    sales,
    currentSale,
    paymentHistory,
    isSalesLoading,
    isProcessingPayment,
    isCancellingSale,
    getSalesByDateRange,
    getSaleById,
    processPayment,
    processSalePaymentWithCashRegister,
    getPaymentDetails,
    getCancellationPreview,
    cancelSale,
    searchSalesByClient,
    searchSalesByStatus
  } = useSalePaymentStore();

  const { clients, getClients } = useClientStore();

  const [saleDetailDialog, setSaleDetailDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [cancellationDialog, setCancellationDialog] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [paymentMode, setPaymentMode] = useState('standard'); // 'standard' or 'cash_register'

  const [paymentForm, setPaymentForm] = useState({
    amount_received: '',
    payment_reference: '',
    payment_notes: ''
  });

  const [cancellationForm, setCancellationForm] = useState({
    reason: '',
    user_id: '1' // TODO: obtener del contexto de usuario
  });

  const [dateFilters, setDateFilters] = useState({
    start_date: '',
    end_date: '',
    page: 1,
    page_size: 20
  });

  const [filters, setFilters] = useState({
    status: '',
    client_id: ''
  });

  const handleLoadSales = async () => {
    try {
      await getSalesByDateRange({ ...dateFilters, ...filters });
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const handleLoadClients = async () => {
    try {
      await getClients();
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedSaleId) return;

    try {
      const paymentData = {
        sales_order_id: selectedSaleId,
        amount_received: parseFloat(paymentForm.amount_received),
        payment_reference: paymentForm.payment_reference,
        payment_notes: paymentForm.payment_notes
      };

      if (paymentMode === 'cash_register') {
        await processSalePaymentWithCashRegister(paymentData);
      } else {
        await processPayment(paymentData);
      }

      setPaymentDialog(false);
      setPaymentForm({
        amount_received: '',
        payment_reference: '',
        payment_notes: ''
      });
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const handleCancelSale = async (e) => {
    e.preventDefault();
    if (!selectedSaleId) return;

    try {
      await cancelSale(selectedSaleId, {
        user_id: cancellationForm.user_id,
        reason: cancellationForm.reason
      });

      setCancellationDialog(false);
      setCancellationForm({
        reason: '',
        user_id: '1'
      });
    } catch (error) {
      console.error('Error cancelling sale:', error);
    }
  };

  const handleViewSaleDetail = async (saleId) => {
    setSelectedSaleId(saleId);
    try {
      await getSaleById(saleId);
      await getPaymentDetails(saleId);
      setSaleDetailDialog(true);
    } catch (error) {
      console.error('Error loading sale details:', error);
    }
  };

  const handleFilterByStatus = async (status) => {
    setFilters(prev => ({ ...prev, status }));
    try {
      await searchSalesByStatus(status, { client_id: filters.client_id, ...dateFilters });
    } catch (error) {
      console.error('Error filtering by status:', error);
    }
  };

  const handleFilterByClient = async (clientId) => {
    const actualClientId = clientId === 'all' ? '' : clientId;
    setFilters(prev => ({ ...prev, client_id: actualClientId }));
    try {
      await searchSalesByClient(actualClientId, { status: filters.status, ...dateFilters });
    } catch (error) {
      console.error('Error filtering by client:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { label: 'Pendiente', variant: 'secondary', icon: AlertTriangle },
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

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Gestión de Pagos de Ventas</h1>
            <p className="text-muted-foreground">Procesar pagos y cancelar ventas existentes</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleLoadSales} disabled={isSalesLoading}>
            {isSalesLoading ? 'Cargando...' : 'Cargar Ventas'}
          </Button>
          <Button onClick={handleLoadClients}>
            <Users className="w-4 h-4 mr-2" />
            Cargar Clientes
          </Button>
        </div>
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Fecha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start_date">Fecha Inicio</Label>
              <Input
                id="start_date"
                type="date"
                value={dateFilters.start_date}
                onChange={(e) => setDateFilters(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="end_date">Fecha Fin</Label>
              <Input
                id="end_date"
                type="date"
                value={dateFilters.end_date}
                onChange={(e) => setDateFilters(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="page_size">Registros por página</Label>
              <Select 
                value={dateFilters.page_size.toString()} 
                onValueChange={(value) => setDateFilters(prev => ({ ...prev, page_size: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleLoadSales} className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status and Client Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Estado y Cliente</CardTitle>
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
                variant={filters.status === 'COMPLETED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterByStatus('COMPLETED')}
              >
                Completadas
              </Button>
              <Button
                variant={filters.status === 'CANCELLED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterByStatus('CANCELLED')}
              >
                Canceladas
              </Button>
            </div>
            
            <Select value={filters.client_id || 'all'} onValueChange={handleFilterByClient}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas para Gestión de Pagos</CardTitle>
          <CardDescription>Lista de ventas existentes para procesar pagos o cancelaciones</CardDescription>
        </CardHeader>
        <CardContent>
          {sales && sales.length > 0 ? (
            <div className="space-y-2">
              {(sales.sales || sales).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">Venta #{sale.id}</h3>
                      {getStatusBadge(sale.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {sale.client_name} •
                      Fecha: {new Date(sale.sale_date || sale.created_at).toLocaleDateString()} •
                      Total: ${sale.total_amount}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSaleDetail(sale.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                    
                    {sale.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSaleId(sale.id);
                          setPaymentDialog(true);
                        }}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Procesar Pago
                      </Button>
                    )}

                    {(sale.status === 'PENDING' || sale.status === 'COMPLETED') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedSaleId(sale.id);
                          setCancellationDialog(true);
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay ventas</h3>
              <p className="text-muted-foreground mb-4">
                Haga clic en "Cargar Ventas" para ver las ventas existentes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Procesar Pago de Venta</DialogTitle>
            <DialogDescription>
              Procese el pago para la venta seleccionada
            </DialogDescription>
          </DialogHeader>

          <div className="mb-4">
            <Label>Modo de Pago</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Pago Estándar</SelectItem>
                <SelectItem value="cash_register">Con Caja Registradora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div>
              <Label htmlFor="amount_received">Monto Recibido</Label>
              <Input
                id="amount_received"
                type="number"
                step="0.01"
                value={paymentForm.amount_received}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount_received: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="payment_reference">Referencia de Pago</Label>
              <Input
                id="payment_reference"
                value={paymentForm.payment_reference}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_reference: e.target.value }))}
                placeholder="Referencia opcional"
              />
            </div>

            <div>
              <Label htmlFor="payment_notes">Notas del Pago</Label>
              <Textarea
                id="payment_notes"
                value={paymentForm.payment_notes}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_notes: e.target.value }))}
                placeholder="Notas adicionales..."
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

      {/* Cancellation Dialog */}
      <Dialog open={cancellationDialog} onOpenChange={setCancellationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Venta</DialogTitle>
            <DialogDescription>
              Esta acción cancelará completamente la venta y revertirá todos los cambios asociados
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCancelSale} className="space-y-4">
            <div>
              <Label htmlFor="cancel_reason">Razón de Cancelación</Label>
              <Textarea
                id="cancel_reason"
                value={cancellationForm.reason}
                onChange={(e) => setCancellationForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Describa la razón de la cancelación..."
                rows={4}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCancellationDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={isCancellingSale}>
                {isCancellingSale ? 'Cancelando...' : 'Confirmar Cancelación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sale Detail Dialog */}
      <Dialog open={saleDetailDialog} onOpenChange={setSaleDetailDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Venta</DialogTitle>
            <DialogDescription>
              Información completa de la venta y pagos asociados
            </DialogDescription>
          </DialogHeader>
          
          {currentSale && (
            <div className="space-y-6">
              {/* Sale Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Información de la Venta</h3>
                  <p className="text-sm"><strong>ID:</strong> {currentSale.id}</p>
                  <p className="text-sm"><strong>Cliente:</strong> {currentSale.client_name}</p>
                  <p className="text-sm"><strong>Fecha:</strong> {new Date(currentSale.sale_date).toLocaleDateString()}</p>
                  <p className="text-sm"><strong>Estado:</strong> {getStatusBadge(currentSale.status)}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Información de Pago</h3>
                  <p className="text-sm"><strong>Total:</strong> ${currentSale.total_amount}</p>
                  <p className="text-sm"><strong>Usuario:</strong> {currentSale.user_name}</p>
                  <p className="text-sm"><strong>Método de Pago:</strong> {currentSale.payment_method || 'N/A'}</p>
                </div>
              </div>

              {/* Products */}
              {currentSale.details && (
                <div>
                  <h3 className="font-semibold mb-2">Productos</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Base</TableHead>
                        <TableHead>Precio Final</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentSale.details.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell>{detail.product_name}</TableCell>
                          <TableCell>{detail.quantity}</TableCell>
                          <TableCell>${detail.base_price}</TableCell>
                          <TableCell>
                            ${detail.unit_price}
                            {detail.price_modified && <Badge variant="warning" className="ml-1">Modificado</Badge>}
                          </TableCell>
                          <TableCell>${detail.total_with_tax}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSaleDetailDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalePayment;