/**
 * Página de Compras Mejoradas - Wizard UX Design
 * Implementa un flujo wizard moderno para órdenes de compra siguiendo la API de Purchase Enhanced
 * - Flujo por pasos: Proveedor → Productos → Pago → Confirmación → Procesamiento
 * - Material Design tokens consistentes
 * - Integración con Purchase API Enhanced
 * - Eliminación de llamadas automáticas - solo explícitas
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
  Calculator,
  ArrowRight,
  User,
  CreditCard,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Search,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Custom Hooks and Services
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useAnnouncement } from '@/contexts/AnnouncementContext';
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

// Componente de pasos del flujo de compra
const PurchaseSteps = ({ currentStep, steps }) => {
  const { styles } = useThemeStyles();
  
  return (
    <div className="flex items-center justify-center mb-6 p-4 rounded-lg border" style={{
      background: 'var(--md-primary-container, rgb(233, 221, 255))',
      borderColor: 'var(--md-outline-variant, rgb(202, 196, 208))',
      color: 'var(--md-on-primary-container, rgb(33, 0, 93))'
    }}>
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all ${
              index + 1 === currentStep 
                ? 'shadow-lg' 
                : index + 1 < currentStep 
                ? ''
                : 'opacity-60'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold`}
                   style={{
                     backgroundColor: index + 1 === currentStep 
                       ? 'var(--md-primary, rgb(103, 80, 164))'
                       : index + 1 < currentStep 
                       ? 'var(--md-tertiary, rgb(125, 82, 96))'
                       : 'var(--md-surface-variant, rgb(231, 224, 236))',
                     color: index + 1 === currentStep 
                       ? 'var(--md-on-primary, rgb(255, 255, 255))'
                       : index + 1 < currentStep 
                       ? 'var(--md-on-tertiary, rgb(255, 255, 255))'
                       : 'var(--md-on-surface-variant, rgb(73, 69, 79))'
                   }}>
                {index + 1 < currentStep ? '✓' : index + 1}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
              <span className="text-xs sm:hidden">{step.shortLabel}</span>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className={`w-4 h-4 ${
                index + 1 < currentStep ? '' : 'opacity-50'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const Purchases = () => {
  const { styles } = useThemeStyles();
  const { announceSuccess, announceError } = useAnnouncement();

  // Estado local para UI
  const [activeTab, setActiveTab] = useState('new-purchase'); 
  const [notification, setNotification] = useState(null);
  
  // Estados del wizard de compra
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [purchaseProducts, setPurchaseProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [currency, setCurrency] = useState({ id: 1, code: 'USD', symbol: '$' }); // Default USD
  const [expectedDelivery, setExpectedDeliveryDate] = useState('');
  const [purchaseNotes, setPurchaseNotesState] = useState('');
  const [purchaseMetadata, setPurchaseMetadata] = useState({
    purchase_priority: 'normal',
    delivery_notes: '',
    payment_reference: ''
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Definir pasos del flujo wizard
  const purchaseSteps = [
    { id: 'products', label: 'Productos', shortLabel: 'Products' },
    { id: 'supplier', label: 'Proveedor', shortLabel: 'Proveedor' },
    { id: 'payment', label: 'Pago y Entrega', shortLabel: 'Payment' },
    { id: 'confirm', label: 'Confirmar', shortLabel: 'Confirm' }
  ];

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
  
  // Estados derivados para compatibilidad (usando nombres diferentes para evitar conflictos)
  const purchaseItems = currentOrderData.items;
  const subtotal = currentOrderData.subtotalAmount;
  const tax = currentOrderData.taxAmount;
  const total = currentOrderData.totalAmount;
  const itemCount = getCurrentOrderItemsCount();
  const uniqueProducts = currentOrderData.items.length;
  
  // Validaciones simples (MVP) - adaptadas al nuevo flujo
  const validations = {
    hasProducts: purchaseProducts.length > 0,
    hasValidProducts: purchaseProducts.every(item => item.quantity > 0 && item.unitPrice > 0),
    hasSupplier: !!selectedSupplier,
    hasPaymentMethod: !!paymentMethod,
    canProceed: purchaseProducts.length > 0 && !!selectedSupplier && purchaseProducts.every(item => item.quantity > 0 && item.unitPrice > 0)
  };

  // Funciones del wizard
  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    // No cambiar automáticamente de paso, dejar que el usuario decida
  };

  const handleAddProduct = (product, quantity = 1, unitPrice = 0) => {
    const newProduct = {
      ...product,
      quantity,
      unitPrice,
      total: quantity * unitPrice
    };
    setPurchaseProducts([...purchaseProducts, newProduct]);
  };

  const handleRemoveProduct = (productId) => {
    setPurchaseProducts(purchaseProducts.filter(p => p.id !== productId));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    setPurchaseProducts(purchaseProducts.map(p => 
      p.id === productId ? { ...p, quantity, total: quantity * p.unitPrice } : p
    ));
  };

  const handleUpdatePrice = (productId, unitPrice) => {
    setPurchaseProducts(purchaseProducts.map(p => 
      p.id === productId ? { ...p, unitPrice, total: p.quantity * unitPrice } : p
    ));
  };

  const calculateTotals = () => {
    const subtotal = purchaseProducts.reduce((sum, p) => sum + p.total, 0);
    const tax = subtotal * 0.10; // 10% tax example
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  // Función para crear orden de compra usando la API mejorada
  const handleCreatePurchaseOrder = async () => {
    try {
      const orderData = {
        supplier_id: selectedSupplier.id,
        status: 'pending',
        product_details: purchaseProducts.map(p => ({
          product_id: p.id,
          quantity: p.quantity,
          unit_price: p.unitPrice,
          tax_rate_id: 1, // Default tax
          profit_pct: 0.15 // Default 15% profit
        })),
        payment_method_id: paymentMethod?.id || 1,
        currency_id: currency.id,
        metadata: {
          ...purchaseMetadata,
          delivery_date: expectedDelivery,
          notes: purchaseNotes
        }
      };

      // API call would be here
      console.log('Creating purchase order:', orderData);
      showNotification('Orden de compra creada exitosamente');
      
      // Reset wizard
      setCurrentStep(1);
      setSelectedSupplier(null);
      setPurchaseProducts([]);
      setPurchaseNotesState('');
      setExpectedDeliveryDate('');
      
      // Switch to list tab
      setActiveTab('purchases-list');
      
    } catch (error) {
      showNotification(error.message || 'Error al crear orden de compra', 'error');
    }
  };

  // Función para cargar datos explícitamente
  const handleLoadData = async () => {
    setLoadingData(true);
    try {
      // Simulate API calls for suppliers, products, payment methods, etc.
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
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
  
  // Handlers para el store (eliminados los duplicados)
  
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
      {/* Breadcrumb discreto con botones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <nav className="flex items-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{t('purchases.title') || 'Compras'}</span>
        </nav>
        <div className="flex items-center gap-3">
          {!dataLoaded ? (
            <Button
              onClick={handleLoadData}
              disabled={loadingData}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Search className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {loadingData ? 'Cargando...' : 'Cargar Datos'}
              </span>
            </Button>
          ) : (
            <Button
              onClick={handleLoadData}
              disabled={loadingData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Search className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {loadingData ? 'Actualizando...' : 'Actualizar'}
              </span>
            </Button>
          )}
        </div>
      </div>

      <NotificationBanner />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-2">
          <TabsTrigger value="new-purchase" className={styles.tab('flex items-center gap-2 px-4 py-2 text-sm font-medium')}>
            <Plus className="w-4 h-4" />
            {t('purchases.tab.new', 'Nueva Compra')}
          </TabsTrigger>
          <TabsTrigger value="purchases-list" className={styles.tab('flex items-center gap-2 px-4 py-2 text-sm font-medium')}>
            <ShoppingCart className="w-4 h-4" />
            {t('purchases.tab.list', 'Lista de Compras')}
          </TabsTrigger>
        </TabsList>

        {/* Tab de Nueva Compra - Diseño Wizard Mejorado */}
        <TabsContent value="new-purchase" className="space-y-6" data-testid="purchases-create-tab">
          {/* Indicador de pasos con diseño mejorado */}
          <PurchaseSteps currentStep={currentStep} steps={purchaseSteps} />
          
          {/* Contenedor principal del wizard */}
          <div className="max-w-4xl mx-auto">
            {/* Paso 1: Selección de Productos */}
            {currentStep === 1 && (
              <Card className={styles.card()} style={{
                background: 'var(--md-surface-container-low, rgb(247, 243, 249))',
                borderColor: 'var(--md-outline-variant, rgb(202, 196, 208))'
              }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{
                    color: 'var(--md-on-surface, rgb(29, 27, 32))'
                  }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                      background: 'var(--md-primary, rgb(103, 80, 164))',
                      color: 'var(--md-on-primary, rgb(255, 255, 255))'
                    }}>
                      1
                    </div>
                    Selecciona Productos
                  </CardTitle>
                  <p className="text-sm mt-2" style={{
                    color: 'var(--md-on-surface-variant, rgb(73, 69, 79))'
                  }}>
                    Comienza eligiendo los productos que deseas comprar
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Reutilizar el selector de productos existente - escalable para miles de productos */}
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Seleccionar Productos
                      </h3>
                      <EnhancedPurchaseProductSelector
                        onProductAdd={handleAddProduct}
                        supplierId={null}
                      />
                    </div>

                    {/* Productos agregados */}
                    {purchaseProducts.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5" />
                          Productos Seleccionados ({purchaseProducts.length})
                        </h3>
                        <div className="space-y-3">
                          {purchaseProducts.map((product, index) => (
                            <Card key={product.id} className="border">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{product.name}</h4>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <label className="text-xs text-muted-foreground">Cantidad</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={product.quantity}
                                        onChange={(e) => handleUpdateQuantity(product.id, parseInt(e.target.value) || 1)}
                                        className="w-20 px-2 py-1 border rounded text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">Precio Unit.</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={product.unitPrice}
                                        onChange={(e) => handleUpdatePrice(product.id, parseFloat(e.target.value) || 0)}
                                        className="w-24 px-2 py-1 border rounded text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">Total</label>
                                      <div className="w-24 px-2 py-1 text-center font-bold">
                                        ${product.total.toFixed(2)}
                                      </div>
                                    </div>
                                    <Button
                                      onClick={() => handleRemoveProduct(product.id)}
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        
                        {/* Total calculado */}
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Total estimado:</span>
                            <span className="font-bold text-lg">${calculateTotals().total.toFixed(2)}</span>
                          </div>
                          <div className="text-sm text-muted-foreground flex justify-between">
                            <span>Subtotal: ${calculateTotals().subtotal.toFixed(2)}</span>
                            <span>Impuesto: ${calculateTotals().tax.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        {/* Botón para continuar */}
                        <div className="flex justify-end mt-6">
                          <Button
                            onClick={() => setCurrentStep(2)}
                            variant="primary"
                            className="flex items-center gap-2"
                          >
                            Seleccionar Proveedor
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Paso 2: Selección de Proveedor */}
            {currentStep === 2 && (
              <Card className={styles.card()} style={{
                background: 'var(--md-surface-container-low, rgb(247, 243, 249))',
                borderColor: 'var(--md-outline-variant, rgb(202, 196, 208))'
              }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{
                    color: 'var(--md-on-surface, rgb(29, 27, 32))'
                  }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                      background: 'var(--md-primary, rgb(103, 80, 164))',
                      color: 'var(--md-on-primary, rgb(255, 255, 255))'
                    }}>
                      2
                    </div>
                    Selecciona el Proveedor
                  </CardTitle>
                  <p className="text-sm mt-2" style={{
                    color: 'var(--md-on-surface-variant, rgb(73, 69, 79))'
                  }}>
                    {purchaseProducts.length} productos seleccionados • Ahora elige el proveedor para tu orden de compra
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Resumen de productos seleccionados */}
                  {purchaseProducts.length > 0 && (
                    <div className="p-4 rounded-lg border-2 bg-blue-50">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Productos Seleccionados ({purchaseProducts.length})
                      </h4>
                      <div className="space-y-1 text-sm">
                        {purchaseProducts.slice(0, 3).map((product) => (
                          <div key={product.id} className="flex justify-between">
                            <span>{product.name}</span>
                            <span>Cant: {product.quantity}</span>
                          </div>
                        ))}
                        {purchaseProducts.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            ... y {purchaseProducts.length - 3} productos más
                          </div>
                        )}
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <div className="flex justify-between font-semibold">
                          <span>Total estimado:</span>
                          <span>${calculateTotals().total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Reutilizar el SupplierSelector existente - escalable para miles de proveedores */}
                  <div data-testid="supplier-selector">
                    <SupplierSelector
                      selectedSupplier={selectedSupplier}
                      onSupplierChange={handleSelectSupplier}
                      required={true}
                    />
                  </div>
                  
                  {/* Mostrar información del proveedor seleccionado */}
                  {selectedSupplier && (
                    <div className="p-4 rounded-lg border-2" style={{
                      background: 'var(--md-primary-container, rgba(233, 221, 255, 0.5))',
                      borderColor: 'var(--md-primary, rgb(103, 80, 164))'
                    }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary">
                            {selectedSupplier.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Proveedor seleccionado para la orden de compra
                          </p>
                        </div>
                        <CheckCircle className="w-6 h-6 text-primary ml-auto" />
                      </div>
                    </div>
                  )}
                  
                  {/* Botones de navegación */}
                  <div className="flex justify-between mt-6">
                    <Button
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Anterior
                    </Button>
                    {selectedSupplier && (
                      <Button
                        onClick={() => setCurrentStep(3)}
                        variant="primary"
                        className="flex items-center gap-2"
                      >
                        Siguiente
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Paso 3: Configuración de Pago y Entrega */}
            {currentStep === 3 && (
              <Card className={styles.card()} style={{
                background: 'var(--md-surface-container-low, rgb(247, 243, 249))',
                borderColor: 'var(--md-outline-variant, rgb(202, 196, 208))'
              }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{
                    color: 'var(--md-on-surface, rgb(29, 27, 32))'
                  }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                      background: 'var(--md-primary, rgb(103, 80, 164))',
                      color: 'var(--md-on-primary, rgb(255, 255, 255))'
                    }}>
                      3
                    </div>
                    Configuración de Pago y Entrega
                  </CardTitle>
                  <p className="text-sm mt-2" style={{
                    color: 'var(--md-on-surface-variant, rgb(73, 69, 79))'
                  }}>
                    {selectedSupplier?.name} • {purchaseProducts.length} productos • Total: ${calculateTotals().total.toFixed(2)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Configuración de pago */}
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Método de Pago
                      </h3>
                      <div className="space-y-3">
                        {[
                          { id: 1, name: 'Transferencia Bancaria', description: 'Pago inmediato', icon: '🏦' },
                          { id: 2, name: 'Cheque', description: 'A 30 días', icon: '💰' },
                          { id: 3, name: 'Crédito', description: 'A convenir', icon: '💳' }
                        ].map((method) => (
                          <Card
                            key={method.id}
                            className={`cursor-pointer transition-all border-2 ${
                              paymentMethod?.id === method.id ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/50'
                            }`}
                            onClick={() => setPaymentMethod(method)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{method.icon}</span>
                                <div className="flex-1">
                                  <h4 className="font-medium">{method.name}</h4>
                                  <p className="text-sm text-muted-foreground">{method.description}</p>
                                </div>
                                {paymentMethod?.id === method.id && (
                                  <CheckCircle className="w-5 h-5 text-primary" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Referencia de pago */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">Referencia de Pago</label>
                        <input
                          type="text"
                          placeholder="Ej: REF-2025-001"
                          value={purchaseMetadata.payment_reference}
                          onChange={(e) => setPurchaseMetadata(prev => ({ ...prev, payment_reference: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Configuración de entrega */}
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Entrega
                      </h3>
                      
                      {/* Fecha esperada */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Fecha Esperada de Entrega</label>
                          <input
                            type="date"
                            value={expectedDelivery}
                            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        {/* Prioridad */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Prioridad de Compra</label>
                          <select
                            value={purchaseMetadata.purchase_priority}
                            onChange={(e) => setPurchaseMetadata(prev => ({ ...prev, purchase_priority: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            <option value="low">Baja - No urgente</option>
                            <option value="normal">Normal - Estándar</option>
                            <option value="high">Alta - Urgente</option>
                            <option value="critical">Crítica - Inmediata</option>
                          </select>
                        </div>

                        {/* Notas de entrega */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Notas de Entrega</label>
                          <textarea
                            placeholder="Instrucciones especiales para la entrega..."
                            value={purchaseMetadata.delivery_notes}
                            onChange={(e) => setPurchaseMetadata(prev => ({ ...prev, delivery_notes: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notas generales */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Notas Adicionales</label>
                    <textarea
                      placeholder="Cualquier información adicional sobre la orden de compra..."
                      value={purchaseNotes}
                      onChange={(e) => setPurchaseNotesState(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  {/* Botones de navegación */}
                  <div className="flex justify-between">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Anterior
                    </Button>
                    {paymentMethod && (
                      <Button
                        onClick={() => setCurrentStep(4)}
                        variant="primary"
                        className="flex items-center gap-2"
                      >
                        Siguiente
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Paso 4: Confirmación */}
            {currentStep === 4 && (
              <Card className={styles.card()} style={{
                background: 'var(--md-surface-container-low, rgb(247, 243, 249))',
                borderColor: 'var(--md-outline-variant, rgb(202, 196, 208))'
              }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{
                    color: 'var(--md-on-surface, rgb(29, 27, 32))'
                  }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                      background: 'var(--md-primary, rgb(103, 80, 164))',
                      color: 'var(--md-on-primary, rgb(255, 255, 255))'
                    }}>
                      4
                    </div>
                    Confirmar Orden de Compra
                  </CardTitle>
                  <p className="text-sm mt-2" style={{
                    color: 'var(--md-on-surface-variant, rgb(73, 69, 79))'
                  }}>
                    Revisa todos los detalles antes de crear la orden
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Resumen completo */}
                  <div className="p-6 rounded-lg border-2" style={{
                    background: 'var(--md-primary-container, rgba(233, 221, 255, 0.5))',
                    borderColor: 'var(--md-primary, rgb(103, 80, 164))'
                  }}>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-primary" />
                      Resumen de la Orden de Compra
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Información del proveedor */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Proveedor</p>
                            <p className="font-semibold">{selectedSupplier?.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Entrega Esperada</p>
                            <p className="font-semibold">
                              {expectedDelivery ? new Date(expectedDelivery).toLocaleDateString('es-ES') : 'Sin fecha'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Prioridad</p>
                            <Badge variant="secondary" className="capitalize">
                              {purchaseMetadata.purchase_priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Información del pago */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Método de Pago</p>
                            <p className="font-semibold">{paymentMethod?.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total de la Orden</p>
                            <p className="font-bold text-xl text-primary">${calculateTotals().total.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Productos</p>
                            <p className="font-semibold">{purchaseProducts.length} artículos</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desglose de productos */}
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-3">Productos en la Orden:</h4>
                      <div className="space-y-2">
                        {purchaseProducts.map((product) => (
                          <div key={product.id} className="flex justify-between items-center py-2">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {product.quantity} × ${product.unitPrice} = ${product.total.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="border-t pt-2 font-bold flex justify-between">
                          <span>Total:</span>
                          <span>${calculateTotals().total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de navegación */}
                  <div className="flex justify-between">
                    <Button
                      onClick={() => setCurrentStep(3)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Anterior
                    </Button>
                    <Button
                      onClick={handleCreatePurchaseOrder}
                      variant="primary"
                      size="lg"
                      className="flex items-center gap-2 px-8"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Crear Orden de Compra
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
