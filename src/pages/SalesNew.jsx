/**
 * Nueva Página de Ventas - Diseño simplificado y moderno
 * Implementación MVP con tabs para Nueva Venta e Historial
 * Basado en specs/sección_de_ventas/code.html y GUIA_MVP_DESARROLLO.md
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Filter,
  ShoppingCart,
  User,
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import DataState from '@/components/ui/DataState';
import useSaleStore from '@/store/useSaleStore';
import useProductStore from '@/store/useProductStore';
import useClientStore from '@/store/useClientStore';

const SalesNew = () => {
  const { t } = useI18n();

  // Estados del store
  const {
    sales,
    loading,
    error,
    currentSaleData,
    fetchSales,
    createSale,
    addItemToSale,
    removeItemFromSale,
    clearCurrentSale,
    clearError,
  } = useSaleStore();

  const {
    products,
    fetchProducts,
  } = useProductStore();

  const {
    clients,
    fetchClients,
  } = useClientStore();

  // Estados locales de UI
  const [activeTab, setActiveTab] = useState('nueva-venta');
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [lineDiscount, setLineDiscount] = useState(0);

  // Estados para el formulario de venta
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [currency, setCurrency] = useState('PYG');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesperson, setSalesperson] = useState('');
  const [notes, setNotes] = useState('');
  const [generalDiscount, setGeneralDiscount] = useState(0);

  // Estados para historial
  const [historySearch, setHistorySearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Cargar datos al montar
  useEffect(() => {
    fetchProducts();
    fetchClients();
    fetchSales();
  }, [fetchProducts, fetchClients, fetchSales]);

  // Calcular totales
  const subtotal = currentSaleData.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const discounts = currentSaleData.items.reduce((sum, item) => {
    return sum + (item.discount || 0);
  }, 0) + generalDiscount;

  const taxRate = 0.16; // 16% IVA
  const taxes = (subtotal - discounts) * taxRate;
  const total = subtotal - discounts + taxes;

  // Handlers
  const handleAddProduct = () => {
    if (!selectedProduct) return;

    addItemToSale({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity: parseInt(quantity),
      price: selectedProduct.price,
      discount: parseFloat(lineDiscount) || 0,
    });

    // Reset modal
    setShowProductModal(false);
    setSelectedProduct(null);
    setQuantity(1);
    setLineDiscount(0);
  };

  const handleRemoveProduct = (index) => {
    removeItemFromSale(index);
  };

  const handleSaveSale = async () => {
    if (!selectedClient || currentSaleData.items.length === 0) {
      return;
    }

    const saleData = {
      client_id: selectedClient,
      payment_method: paymentMethod,
      currency,
      sale_date: saleDate,
      salesperson,
      notes,
      items: currentSaleData.items,
      subtotal,
      discounts,
      taxes,
      total,
    };

    const result = await createSale(saleData);

    if (result.success) {
      // Limpiar formulario y cambiar a historial
      clearCurrentSale();
      setSelectedClient('');
      setPaymentMethod('cash');
      setNotes('');
      setGeneralDiscount(0);
      setActiveTab('historial-ventas');
    }
  };

  const handleCancel = () => {
    clearCurrentSale();
    setSelectedClient('');
    setNotes('');
    setGeneralDiscount(0);
  };

  // Filtrar productos para búsqueda
  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar ventas para historial
  const filteredSales = sales.filter(sale => {
    const matchesSearch = !historySearch ||
      sale.client_name?.toLowerCase().includes(historySearch.toLowerCase()) ||
      sale.sale_id?.toString().includes(historySearch);

    const matchesDateFrom = !dateFrom || sale.sale_date >= dateFrom;
    const matchesDateTo = !dateTo || sale.sale_date <= dateTo;

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Cliente seleccionado
  const selectedClientData = clients.find(c => c.id === selectedClient);

  return (
    <div className="page">
      {/* Tabs */}
      <div className="tabs">
        <div className="tabs__list">
          <button
            className={`tabs__tab ${activeTab === 'nueva-venta' ? 'tabs__tab--active' : ''}`}
            onClick={() => setActiveTab('nueva-venta')}
          >
            {t('sales.tabs.new', 'Nueva Venta')}
          </button>
          <button
            className={`tabs__tab ${activeTab === 'historial-ventas' ? 'tabs__tab--active' : ''}`}
            onClick={() => setActiveTab('historial-ventas')}
          >
            {t('sales.tabs.history', 'Historial de Ventas')}
          </button>
        </div>
      </div>

      {/* Tab: Nueva Venta */}
      {activeTab === 'nueva-venta' && (
        <div className="sales-new">
          <h2 className="page__title">
            {t('sales.new.title', 'Nueva Venta')}
          </h2>

          <div className="sales-new__grid">
            {/* Columna izquierda: Productos */}
            <div className="sales-new__main">
              {/* Card de productos */}
              <div className="card card--elevated">
                <div className="card__header">
                  <h3 className="card__title">
                    <ShoppingCart className="card__icon" />
                    {t('sales.new.products.title', 'Productos Seleccionados')}
                  </h3>
                </div>

                <div className="card__content">
                  {/* Búsqueda y agregar */}
                  <div className="sales-new__search-row">
                    <div className="search-box flex-1">
                      <Search className="search-box__icon" />
                      <Input
                        placeholder={t('sales.new.products.search', 'Buscar productos para agregar...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-box__input"
                      />
                    </div>
                    <Button
                      onClick={() => setShowProductModal(true)}
                      className="btn btn--primary"
                    >
                      <Plus className="btn__icon" />
                      {t('sales.new.products.add', 'Agregar Producto')}
                    </Button>
                  </div>

                  {/* Tabla de productos */}
                  {currentSaleData.items.length === 0 ? (
                    <DataState
                      variant="empty"
                      title={t('sales.new.products.empty.title', 'Sin productos')}
                      message={t('sales.new.products.empty.message', 'Agregue productos a la venta')}
                      actionLabel={t('sales.new.products.add', 'Agregar Producto')}
                      onAction={() => setShowProductModal(true)}
                    />
                  ) : (
                    <div className="table-container mt-4">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>{t('sales.new.products.table.product', 'Producto')}</th>
                            <th className="text-right">{t('sales.new.products.table.quantity', 'Cantidad')}</th>
                            <th className="text-right">{t('sales.new.products.table.price', 'Precio Unit.')}</th>
                            <th className="text-right">{t('sales.new.products.table.discount', 'Descuento')}</th>
                            <th className="text-right">{t('sales.new.products.table.total', 'Total')}</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentSaleData.items.map((item, index) => (
                            <tr key={index}>
                              <td>{item.product_name}</td>
                              <td className="text-right">{item.quantity}</td>
                              <td className="text-right">${item.price.toFixed(2)}</td>
                              <td className="text-right">${(item.discount || 0).toFixed(2)}</td>
                              <td className="text-right">
                                ${(item.price * item.quantity - (item.discount || 0)).toFixed(2)}
                              </td>
                              <td className="text-right">
                                <button
                                  onClick={() => handleRemoveProduct(index)}
                                  className="btn btn--icon btn--danger btn--small"
                                  title={t('action.delete', 'Eliminar')}
                                >
                                  <Trash2 className="btn__icon" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Card de resumen */}
              <div className="card card--elevated mt-6">
                <div className="card__header">
                  <h3 className="card__title">
                    <DollarSign className="card__icon" />
                    {t('sales.new.summary.title', 'Resumen de la Venta')}
                  </h3>
                </div>

                <div className="card__content">
                  <div className="sales-new__summary">
                    <div className="sales-new__summary-column">
                      <div className="sales-new__summary-row">
                        <span className="text-muted">{t('sales.new.summary.subtotal', 'Subtotal')}</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="sales-new__summary-row">
                        <span className="text-muted">{t('sales.new.summary.taxes', 'Impuestos (IVA 16%)')}</span>
                        <span>${taxes.toFixed(2)}</span>
                      </div>
                      <div className="sales-new__summary-row">
                        <span className="text-muted">{t('sales.new.summary.discounts', 'Descuentos')}</span>
                        <span>${discounts.toFixed(2)}</span>
                      </div>
                      <div className="divider my-3"></div>
                      <div className="sales-new__summary-row sales-new__summary-total">
                        <span className="font-semibold">{t('sales.new.summary.total', 'Total')}</span>
                        <span className="font-semibold text-lg">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="sales-new__summary-actions">
                      <Button
                        variant="outline"
                        onClick={() => setGeneralDiscount(prev => prev + 10)}
                        className="btn btn--secondary w-full"
                      >
                        {t('sales.new.summary.applyDiscount', 'Aplicar Descuento General')}
                      </Button>

                      <div className="flex gap-3 mt-3">
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          className="btn btn--secondary flex-1"
                        >
                          {t('action.cancel', 'Cancelar')}
                        </Button>
                        <Button
                          onClick={handleSaveSale}
                          disabled={!selectedClient || currentSaleData.items.length === 0 || loading}
                          className="btn btn--primary flex-1"
                        >
                          {loading ? t('action.saving', 'Guardando...') : t('sales.new.save', 'Guardar Venta')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha: Información */}
            <div className="sales-new__sidebar">
              {/* Cliente */}
              <div className="card card--elevated">
                <div className="card__header">
                  <h3 className="card__title">
                    <User className="card__icon" />
                    {t('sales.new.client.title', 'Información del Cliente')}
                  </h3>
                </div>

                <div className="card__content space-y-4">
                  <div className="form-field">
                    <Label htmlFor="client">
                      {t('sales.new.client.search', 'Buscar Cliente')}
                    </Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('sales.new.client.select', 'Seleccionar cliente')} />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedClientData && (
                    <div className="client-info p-3 rounded bg-secondary">
                      <p className="text-sm">
                        <strong>{t('field.name', 'Nombre')}:</strong> {selectedClientData.name}
                      </p>
                      <p className="text-sm">
                        <strong>{t('field.email', 'Email')}:</strong> {selectedClientData.email || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <strong>{t('field.phone', 'Teléfono')}:</strong> {selectedClientData.phone || 'N/A'}
                      </p>
                    </div>
                  )}

                  <Button variant="link" className="text-primary w-full">
                    {t('sales.new.client.create', 'Crear nuevo cliente')}
                  </Button>
                </div>
              </div>

              {/* Opciones de Pago */}
              <div className="card card--elevated mt-6">
                <div className="card__header">
                  <h3 className="card__title">
                    <CreditCard className="card__icon" />
                    {t('sales.new.payment.title', 'Opciones de Pago')}
                  </h3>
                </div>

                <div className="card__content space-y-4">
                  <div className="form-field">
                    <Label htmlFor="payment-method">
                      {t('sales.new.payment.method', 'Método de Pago')}
                    </Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{t('payment.cash', 'Efectivo')}</SelectItem>
                        <SelectItem value="card">{t('payment.card', 'Tarjeta')}</SelectItem>
                        <SelectItem value="transfer">{t('payment.transfer', 'Transferencia')}</SelectItem>
                        <SelectItem value="other">{t('payment.other', 'Otro')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="form-field">
                    <Label htmlFor="currency">
                      {t('sales.new.payment.currency', 'Moneda')}
                    </Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PYG">PYG - Guaraní Paraguayo</SelectItem>
                        <SelectItem value="USD">USD - Dólar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div className="card card--elevated mt-6">
                <div className="card__header">
                  <h3 className="card__title">
                    <FileText className="card__icon" />
                    {t('sales.new.details.title', 'Detalles de la Venta')}
                  </h3>
                </div>

                <div className="card__content space-y-4">
                  <div className="form-field">
                    <Label htmlFor="sale-date">
                      {t('sales.new.details.date', 'Fecha de Venta')}
                    </Label>
                    <Input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <Label htmlFor="salesperson">
                      {t('sales.new.details.salesperson', 'Vendedor')}
                    </Label>
                    <Input
                      placeholder={t('sales.new.details.salesperson.placeholder', 'Nombre del vendedor')}
                      value={salesperson}
                      onChange={(e) => setSalesperson(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <Label htmlFor="notes">
                      {t('sales.new.details.notes', 'Notas')}
                    </Label>
                    <textarea
                      className="input w-full min-h-20"
                      placeholder={t('sales.new.details.notes.placeholder', 'Añadir notas sobre la venta...')}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Historial de Ventas */}
      {activeTab === 'historial-ventas' && (
        <div className="sales-history">
          <h2 className="page__title">
            {t('sales.history.title', 'Historial de Ventas')}
          </h2>

          <div className="card card--elevated">
            <div className="card__content">
              {/* Filtros */}
              <div className="sales-history__filters">
                <div className="search-box flex-1">
                  <Search className="search-box__icon" />
                  <Input
                    placeholder={t('sales.history.search', 'Buscar por cliente o ID...')}
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="search-box__input"
                  />
                </div>

                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input"
                  placeholder={t('sales.history.dateFrom', 'Fecha desde')}
                />

                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input"
                  placeholder={t('sales.history.dateTo', 'Fecha hasta')}
                />

                <Button className="btn btn--primary">
                  <Filter className="btn__icon" />
                  {t('action.filter', 'Filtrar')}
                </Button>
              </div>

              {/* Tabla */}
              {loading && sales.length === 0 ? (
                <DataState variant="loading" skeletonVariant="list" />
              ) : filteredSales.length === 0 ? (
                <DataState
                  variant="empty"
                  title={t('sales.history.empty.title', 'Sin ventas')}
                  message={t('sales.history.empty.message', 'No hay ventas registradas')}
                />
              ) : (
                <div className="table-container mt-6">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('sales.history.table.id', 'ID Venta')}</th>
                        <th>{t('sales.history.table.date', 'Fecha')}</th>
                        <th>{t('sales.history.table.client', 'Cliente')}</th>
                        <th className="text-right">{t('sales.history.table.total', 'Total')}</th>
                        <th>{t('sales.history.table.salesperson', 'Vendedor')}</th>
                        <th className="text-center">{t('sales.history.table.status', 'Estado')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map(sale => (
                        <tr key={sale.sale_id || sale.id}>
                          <td className="font-medium">#{sale.sale_id || sale.id}</td>
                          <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                          <td>{sale.client_name}</td>
                          <td className="text-right">${sale.total_amount?.toFixed(2) || '0.00'}</td>
                          <td>{sale.user_name || 'N/A'}</td>
                          <td className="text-center">
                            <Badge
                              className={`badge ${
                                sale.status === 'PAID' || sale.status === 'completed'
                                  ? 'badge--success'
                                  : sale.status === 'CANCELLED' || sale.status === 'cancelled'
                                  ? 'badge--error'
                                  : 'badge--warning'
                              }`}
                            >
                              {sale.status === 'PAID' || sale.status === 'completed'
                                ? t('status.completed', 'Completada')
                                : sale.status === 'CANCELLED' || sale.status === 'cancelled'
                                ? t('status.cancelled', 'Cancelada')
                                : t('status.pending', 'Pendiente')}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agregar Producto */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sales.new.products.modal.title', 'Agregar Producto')}</DialogTitle>
            <DialogDescription>
              {t('sales.new.products.modal.description', 'Seleccione un producto y la cantidad')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Búsqueda de productos */}
            <div className="form-field">
              <Label>{t('sales.new.products.modal.search', 'Buscar Producto')}</Label>
              <Select
                value={selectedProduct?.id}
                onValueChange={(value) => {
                  const product = products.find(p => p.id === value);
                  setSelectedProduct(product);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('sales.new.products.modal.select', 'Seleccionar producto')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ${product.price?.toFixed(2) || '0.00'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="p-3 rounded bg-secondary">
                <p className="font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-muted">
                  {t('sales.new.products.modal.currentPrice', 'Precio actual')}:
                  <span className="font-medium ml-1">${selectedProduct.price?.toFixed(2) || '0.00'}</span>
                </p>
              </div>
            )}

            <div className="form-field">
              <Label htmlFor="quantity">{t('field.quantity', 'Cantidad')}</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="form-field">
              <Label htmlFor="line-discount">
                {t('sales.new.products.modal.lineDiscount', 'Descuento por línea (%)')}
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={lineDiscount}
                onChange={(e) => setLineDiscount(e.target.value)}
                placeholder={t('optional', 'Opcional')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProductModal(false)}
              className="btn btn--secondary"
            >
              {t('action.cancel', 'Cancelar')}
            </Button>
            <Button
              onClick={handleAddProduct}
              disabled={!selectedProduct}
              className="btn btn--primary"
            >
              {t('action.confirm', 'Confirmar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Toast */}
      {error && (
        <div className="alert alert--error">
          <p>{error}</p>
          <button onClick={clearError} className="btn btn--icon btn--small">
            <Trash2 className="btn__icon" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesNew;
