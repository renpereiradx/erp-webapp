/**
 * Página Principal de Compras
 * Implementa el sistema completo de gestión de compras siguiendo mejores prácticas
 * - Separación de lógica de negocio en custom hooks
 * - Componentes reutilizables
 * - Integración con API mediante servicios
 * - Validaciones centralizadas
 * - Manejo de errores robusto
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Plus, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Truck,
  FileText,
  Calculator
} from 'lucide-react';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';

// Custom Hooks and Services
import { useThemeStyles } from '@/hooks/useThemeStyles';
import DataState from '@/components/ui/DataState';
import { useI18n } from '@/lib/i18n';
import usePurchaseStore from '@/store/usePurchaseStore';

// Componentes Especializados
import SupplierSelector from '@/components/SupplierSelector';
import EnhancedPurchaseProductSelector from '@/components/EnhancedPurchaseProductSelector';
import PurchaseItemsList from '@/components/PurchaseItemsList';
import PurchaseSummary from '@/components/PurchaseSummary';
import PurchaseOrdersList from '@/components/PurchaseOrdersList';

// Constantes
import { 
  PURCHASE_MESSAGES, 
  PAYMENT_TERMS, 
  DELIVERY_METHODS 
} from '@/constants/purchaseData';

const Purchases = () => {
  const { styles } = useThemeStyles();

  // Estado local para UI
  const [activeTab, setActiveTab] = useState('new-purchase'); // Volver a nueva compra como default
  const [notification, setNotification] = useState(null);

  // Store de compras (MVP patterns)
  const {
    currentOrderData,
    purchaseOrders,
    loading,
    error,
    setCurrentOrderSupplier,
    addItemToCurrentOrder,
    updateItemQuantity,
    updateItemPrice,
    removeItemFromCurrentOrder,
    setOrderNotes,
    setExpectedDelivery,
    clearCurrentOrder,
    createPurchaseOrder,
    canCreateOrder,
    getCurrentOrderItemsCount,
    getCurrentOrderTotal,
    fetchPurchaseOrders
  } = usePurchaseStore();
  
  const { t } = useI18n();
  
  // Estados derivados para compatibilidad
  const selectedSupplier = currentOrderData.supplierId ? 
    { id: currentOrderData.supplierId, name: currentOrderData.supplierName } : null;
  const purchaseItems = currentOrderData.items;
  const purchaseNotes = currentOrderData.notes;
  const expectedDelivery = currentOrderData.expectedDelivery;
  const subtotal = currentOrderData.subtotalAmount;
  const tax = currentOrderData.taxAmount;
  const total = currentOrderData.totalAmount;
  const itemCount = getCurrentOrderItemsCount();
  const uniqueProducts = currentOrderData.items.length;
  
  // Validaciones simples (MVP)
  const validations = {
    hasSupplier: !!currentOrderData.supplierId,
    hasItems: currentOrderData.items.length > 0,
    hasValidItems: currentOrderData.items.every(item => item.quantity > 0 && item.unitPrice > 0),
    canProceed: canCreateOrder()
  };

  // Cargar órdenes al montar el componente
  useEffect(() => {
    if (activeTab === 'purchases-list') {
      fetchPurchaseOrders();
    }
  }, [activeTab, fetchPurchaseOrders]);

  // Mostrar notificación
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Manejar envío de compra
  const handleSubmitPurchase = async () => {
    if (!validations.canProceed) {
      showNotification('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      const result = await createPurchaseOrder();
      if (result.success) {
        showNotification('Orden de compra creada exitosamente');
        setActiveTab('purchases-list'); // Cambiar a lista después de crear
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      showNotification(error.message || 'Error al crear la orden de compra', 'error');
    }
  };
  
  // Handlers para el store
  const setSelectedSupplier = (supplier) => {
    if (supplier) {
      setCurrentOrderSupplier(supplier.id, supplier.name);
    }
  };
  
  const addPurchaseItem = (product, quantity = 1, unitPrice = 0) => {
    addItemToCurrentOrder(product, quantity, unitPrice);
  };
  
  const removeItem = (productId) => {
    removeItemFromCurrentOrder(productId);
  };
  
  const setPurchaseNotes = (notes) => {
    setOrderNotes(notes);
  };
  
  const clearPurchase = () => {
    clearCurrentOrder();
  };
  
  // Mock para getPurchaseSummary (compatibilidad)
  const getPurchaseSummary = () => ({
    subtotal,
    tax,
    total,
    itemCount,
    uniqueProducts
  });

  // Componente de notificación
  const NotificationBanner = () => {
    if (!notification) return null;

    const isError = notification.type === 'error';
    const icon = isError ? AlertCircle : CheckCircle;
    const bgColor = isError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
    const textColor = isError ? 'text-red-800' : 'text-green-800';

    return (
      <div className={`p-4 rounded-lg border ${bgColor} ${textColor} mb-6 flex items-center`}>
        {React.createElement(icon, { className: 'w-5 h-5 mr-2' })}
        {notification.message}
      </div>
    );
  };

  // Componente de configuración de compra
  const PurchaseConfiguration = () => (
    <Card className={styles.card()}>
      <CardHeader>
        <CardTitle className={styles.header('h3')}>
          <FileText className="w-5 h-5 mr-2" />
          {t('purchases.config.title', 'Configuración de Compra')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fecha de entrega esperada */}
        <div>
          <label className={styles.label()}>
            <Truck className="inline w-4 h-4 mr-2" />
            {t('purchases.config.expected_delivery', 'Fecha de Entrega Esperada')}
          </label>
          <input
            type="date"
            value={expectedDelivery || ''}
            onChange={(e) => setExpectedDelivery(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={styles.input()}
          />
        </div>

        {/* Notas */}
        <div>
          <label className={styles.label()}>{t('purchases.config.notes', 'Notas')}</label>
          <textarea
            value={purchaseNotes}
            onChange={(e) => setPurchaseNotes(e.target.value)}
            placeholder={t('purchases.config.notes.placeholder', 'Notas adicionales sobre la compra...')}
            rows={3}
            className={styles.input()}
          />
        </div>
      </CardContent>
    </Card>
  );

  // Estadísticas compactas (minimalista)
  const CompactStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div className={styles.card()}>
        <div className="flex items-center p-3">
          <Package className="w-5 h-5 mr-2 text-blue-600" />
          <div>
            <div className="text-lg font-bold">
              {uniqueProducts}
            </div>
            <div className="text-xs text-muted-foreground">{t('purchases.stats.products', 'Productos')}</div>
          </div>
        </div>
      </div>
      
      <div className={styles.card()}>
        <div className="flex items-center p-3">
          <Calculator className="w-5 h-5 mr-2 text-green-600" />
          <div>
            <div className="text-lg font-bold">
              {itemCount}
            </div>
            <div className="text-xs text-muted-foreground">{t('purchases.stats.quantity', 'Cantidad')}</div>
          </div>
        </div>
      </div>
      
      <div className={styles.card()}>
        <div className="flex items-center p-3">
          <FileText className="w-5 h-5 mr-2 text-purple-600" />
          <div>
            <div className="text-lg font-bold">
              ${subtotal.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">{t('purchases.stats.subtotal', 'Subtotal')}</div>
          </div>
        </div>
      </div>
      
      <div className={styles.card()}>
        <div className="flex items-center p-3">
          <ShoppingCart className="w-5 h-5 mr-2 text-orange-600" />
          <div>
            <div className="text-lg font-bold">
              ${total.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">{t('purchases.stats.total', 'Total')}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container()} data-testid="purchases-page">
      <PageHeader
        title={t('purchases.title') || 'Compras'}
        subtitle={t('purchases.subtitle') || 'Administra compras a proveedores, controla inventario y órdenes de compra'}
        breadcrumb={[{ label: 'Operaciones', href: '/dashboard' }, { label: t('purchases.title') || 'Compras' }]}
      />

      <NotificationBanner />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-purchase" className={`${styles.tab()} flex items-center gap-2`}>
            <Plus className="w-4 h-4" />
            {t('purchases.tab.new', 'Nueva Compra')}
          </TabsTrigger>
          <TabsTrigger value="purchases-list" className={`${styles.tab()} flex items-center gap-2`}>
            <ShoppingCart className="w-4 h-4" />
            {t('purchases.tab.list', 'Lista de Compras')}
          </TabsTrigger>
        </TabsList>

        {/* Tab de Nueva Compra */}
        <TabsContent value="new-purchase" className="space-y-4">
          <CompactStats />
          
          {loading && !purchaseItems.length && !selectedSupplier ? (
            <DataState variant="loading" skeletonVariant="list" testId="purchases-loading" skeletonProps={{ count: 4 }} />
          ) : (!selectedSupplier && purchaseItems.length === 0) ? (
            <DataState
              variant="empty"
              title={t('purchases.empty.title', 'Comienza una compra')}
              description={t('purchases.empty.description', 'Selecciona un proveedor para empezar o crea uno nuevo.')}
              actionLabel={t('purchases.empty.action', 'Seleccionar Proveedor')}
              onAction={() => {
                // foco/abrir selector — fallback: abrir modal de proveedor si existe
                try { document.querySelector('[data-testid="supplier-selector"]')?.focus(); } catch (e) {}
              }}
              testId="purchases-empty-initial"
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Panel principal - Configuración */}
              <div className="lg:col-span-2 space-y-4">
                {/* Selección de proveedor */}
                <Card className={styles.card()} data-testid="supplier-card-wrapper">
                  <CardHeader>
                    <CardTitle className={styles.header('h3')}>
                      {t('purchases.supplier.info', 'Información del Proveedor')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div data-testid="supplier-selector">
                      <SupplierSelector
                        selectedSupplier={selectedSupplier}
                        onSupplierChange={setSelectedSupplier}
                        required={true}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Selección de productos */}
                {selectedSupplier && (
                  <Card className={styles.card()} data-testid="product-selector-card">
                    <CardHeader>
                      <CardTitle className={styles.header('h3')}>
                        <Package className="w-5 h-5 mr-2" />
                        {t('purchases.products.title', 'Productos')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EnhancedPurchaseProductSelector
                        onProductAdd={addPurchaseItem}
                        supplierId={selectedSupplier.id}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Lista de productos agregados */}
                {purchaseItems.length > 0 && (
                  <Card className={styles.card()} data-testid="purchase-items-card">
                    <CardHeader>
                      <CardTitle className={styles.header('h3')}>
                        {t('purchases.items.title', 'Items del Pedido ({count})').replace('{count}', purchaseItems.length)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div data-testid="purchase-items-list">
                        <PurchaseItemsList
                          items={purchaseItems}
                          onQuantityChange={updateItemQuantity}
                          onPriceChange={updateItemPrice}
                          onRemoveItem={removeItem}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Configuración adicional */}
                {purchaseItems.length > 0 && (
                  <PurchaseConfiguration />
                )}
              </div>

              {/* Panel lateral - Resumen */}
              <div className="space-y-4">
                <PurchaseSummary
                  summary={getPurchaseSummary()}
                />

                {/* Botones de acción */}
                {validations.canProceed && (
                  <div className="space-y-3">
                    <Button
                      onClick={handleSubmitPurchase}
                      disabled={loading}
                      className={`w-full ${styles.button('primary')}`}
                      size="lg"
                      data-testid="purchase-save-button"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? t('purchases.saving', 'Creando Compra...') : t('purchases.create', 'Crear Compra')}
                    </Button>
                    
                    <Button
                      onClick={clearPurchase}
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                      data-testid="purchase-clear-button"
                    >
                      {t('purchases.clear', 'Limpiar Todo')}
                    </Button>
                  </div>
                )}

                {/* Validaciones minimalistas */}
                {!validations.canProceed && (
                  <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex items-center text-orange-800">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">{t('purchases.todo.title', 'Por completar:')}</span>
                    </div>
                    <ul className="mt-1 text-xs text-orange-700 space-y-0.5">
                      {!validations.hasSupplier && <li>• {t('purchases.todo.supplier', 'Seleccionar proveedor')}</li>}
                      {!validations.hasItems && <li>• {t('purchases.todo.items', 'Agregar productos')}</li>}
                      {!validations.hasValidItems && <li>• {t('purchases.todo.valid_items', 'Verificar cantidades')}</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
         </TabsContent>

        {/* Tab de Lista de Compras */}
        <TabsContent value="purchases-list" className="space-y-4">
          <PurchaseOrdersList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Purchases;
