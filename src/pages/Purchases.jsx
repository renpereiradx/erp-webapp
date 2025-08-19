/**
 * Página Principal de Compras
 * Implementa el sistema completo de gestión de compras siguiendo mejores prácticas
 * - Separación de lógica de negocio en custom hooks
 * - Componentes reutilizables
 * - Integración con API mediante servicios
 * - Validaciones centralizadas
 * - Manejo de errores robusto
 */

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
// Importar iconos necesarios
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

// Custom Hooks
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { usePurchaseLogic } from '@/hooks/usePurchaseLogic';
import DataState from '@/components/ui/DataState';
import { useI18n } from '@/lib/i18n';

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
  const { theme } = useTheme();
  const themeStyles = useThemeStyles();
  const styles = themeStyles.styles || themeStyles;

  // Estado local para UI
  const [activeTab, setActiveTab] = useState('new-purchase'); // Volver a nueva compra como default
  const [notification, setNotification] = useState(null);

  // Lógica de compras mediante custom hook
  const purchaseLogic = usePurchaseLogic();
  const {
    // Estado
    selectedSupplier,
    purchaseItems,
    purchaseNotes,
    expectedDelivery,
    paymentTerms,
    deliveryMethod,
    
    // Estado UI
    loading,
    saving,
    errors,
    
    // Cálculos
    subtotal,
    tax,
    deliveryCost,
    total,
    itemCount,
    uniqueProducts,
    
    // Validaciones
    validations,
    
    // Setters
    setSelectedSupplier,
    setPurchaseNotes,
    setExpectedDelivery,
    setPaymentTerms,
    setDeliveryMethod,
    
    // Acciones
    addPurchaseItem,
    updateItemQuantity,
    updateItemPrice,
    removeItem,
    clearPurchase,
    createPurchase,
    getPurchaseSummary
  } = purchaseLogic;

  const { t } = useI18n();

  // Mostrar notificación
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Manejar envío de compra
  const handleSubmitPurchase = async () => {
    if (!validations.canProceed) {
      showNotification(PURCHASE_MESSAGES.ERROR.CREATE_FAILED, 'error');
      return;
    }

    try {
      const result = await createPurchase();
      if (result.success) {
        showNotification(PURCHASE_MESSAGES.SUCCESS.CREATED);
        setActiveTab('purchases-list'); // Cambiar a lista después de crear
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
      showNotification(error.message || PURCHASE_MESSAGES.ERROR.CREATE_FAILED, 'error');
    }
  };

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
        <CardTitle className={styles.cardHeader()}>
          <FileText className="w-5 h-5 mr-2" />
          {t('purchases.config.title') || 'Configuración de Compra'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fecha de entrega esperada */}
        <div>
          <label className={styles.label()}>
            <Truck className="inline w-4 h-4 mr-2" />
            {t('purchases.config.expected_delivery') || 'Fecha de Entrega Esperada'}
          </label>
          <input
            type="date"
            value={expectedDelivery}
            onChange={(e) => setExpectedDelivery(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={styles.input()}
          />
        </div>

        {/* Términos de pago */}
        <div>
          <label className={styles.label()}>{t('purchases.config.payment_terms') || 'Términos de Pago'}</label>
          <select
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className={styles.input()}
          >
            {PAYMENT_TERMS.map(term => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>

        {/* Método de entrega */}
        <div>
          <label className={styles.label()}>{t('purchases.config.delivery_method') || 'Método de Entrega'}</label>
          <select
            value={deliveryMethod}
            onChange={(e) => setDeliveryMethod(e.target.value)}
            className={styles.input()}
          >
            {DELIVERY_METHODS.map(method => (
              <option key={method.id} value={method.id}>
                {method.name} {method.cost > 0 && `(+$${method.cost})`}
              </option>
            ))}
          </select>
        </div>

        {/* Notas */}
        <div>
          <label className={styles.label()}>{t('purchases.config.notes') || 'Notas'}</label>
          <textarea
            value={purchaseNotes}
            onChange={(e) => setPurchaseNotes(e.target.value)}
            placeholder={t('purchases.config.notes.placeholder') || 'Notas adicionales sobre la compra...'}
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
      <div className={styles.card('p-3')}>
        <div className="flex items-center">
          <Package className={`w-5 h-5 mr-2 ${
            styles.isNeoBrutalism ? 'text-black' : 
            styles.isMaterial ? 'text-blue-600' : 
            styles.isFluent ? 'text-sky-600' : 'text-blue-600'
          }`} />
          <div>
            <div className={`text-lg font-bold ${styles.isNeoBrutalism ? 'font-black' : 'font-semibold'}`}>
              {uniqueProducts}
            </div>
            <div className="text-xs text-muted-foreground">{t('purchases.stats.products') || 'Productos'}</div>
          </div>
        </div>
      </div>
      
      <div className={styles.card('p-3')}>
        <div className="flex items-center">
          <Calculator className={`w-5 h-5 mr-2 ${
            styles.isNeoBrutalism ? 'text-black' : 
            styles.isMaterial ? 'text-green-600' : 
            styles.isFluent ? 'text-emerald-600' : 'text-green-600'
          }`} />
          <div>
            <div className={`text-lg font-bold ${styles.isNeoBrutalism ? 'font-black' : 'font-semibold'}`}>
              {itemCount}
            </div>
            <div className="text-xs text-muted-foreground">{t('purchases.stats.quantity') || 'Cantidad'}</div>
          </div>
        </div>
      </div>
      
      <div className={styles.card('p-3')}>
        <div className="flex items-center">
          <FileText className={`w-5 h-5 mr-2 ${
            styles.isNeoBrutalism ? 'text-black' : 
            styles.isMaterial ? 'text-purple-600' : 
            styles.isFluent ? 'text-violet-600' : 'text-purple-600'
          }`} />
          <div>
            <div className={`text-lg font-bold ${styles.isNeoBrutalism ? 'font-black' : 'font-semibold'}`}>
              ${subtotal}
            </div>
            <div className="text-xs text-muted-foreground">{t('purchases.stats.subtotal') || 'Subtotal'}</div>
          </div>
        </div>
      </div>
      
      <div className={styles.card('p-3')}>
        <div className="flex items-center">
          <ShoppingCart className={`w-5 h-5 mr-2 ${
            styles.isNeoBrutalism ? 'text-black' : 
            styles.isMaterial ? 'text-orange-600' : 
            styles.isFluent ? 'text-amber-600' : 'text-orange-600'
          }`} />
          <div>
            <div className={`text-lg font-bold ${styles.isNeoBrutalism ? 'font-black' : 'font-semibold'}`}>
              ${total}
            </div>
            <div className="text-xs text-muted-foreground">{t('purchases.stats.total') || 'Total'}</div>
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
        <TabsList className={styles.tab()}>
          <TabsTrigger value="new-purchase" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('purchases.tab.new') || 'Nueva Compra'}
          </TabsTrigger>
          <TabsTrigger value="purchases-list" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            {t('purchases.tab.list') || 'Lista de Compras'}
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
              title={t('purchases.empty.title') || 'Comienza una compra'}
              description={t('purchases.empty.description') || 'Selecciona un proveedor para empezar o crea uno nuevo.'}
              actionLabel={t('purchases.empty.action') || 'Seleccionar Proveedor'}
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
                    <CardTitle className={styles.cardHeader()}>
                      {t('purchases.supplier.info') || 'Información del Proveedor'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div data-testid="supplier-selector">
                      <SupplierSelector
                        selectedSupplier={selectedSupplier}
                        onSupplierChange={setSelectedSupplier}
                        theme={theme}
                        required={true}
                        error={errors.supplier}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Selección de productos */}
                {selectedSupplier && (
                  <Card className={styles.card()} data-testid="product-selector-card">
                    <CardHeader>
                      <CardTitle className={styles.cardHeader()}>
                        <Package className="w-5 h-5 mr-2" />
                        {t('purchases.products.title') || 'Productos'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EnhancedPurchaseProductSelector
                        onProductAdd={addPurchaseItem}
                        theme={theme}
                        supplierId={selectedSupplier.id}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Lista de productos agregados */}
                {purchaseItems.length > 0 && (
                  <Card className={styles.card()} data-testid="purchase-items-card">
                    <CardHeader>
                      <CardTitle className={styles.cardHeader()}>
                        {(t('purchases.items.title') || 'Items del Pedido ({count})').replace('{count}', purchaseItems.length)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div data-testid="purchase-items-list">
                        <PurchaseItemsList
                          items={purchaseItems}
                          onQuantityChange={updateItemQuantity}
                          onPriceChange={updateItemPrice}
                          onRemoveItem={removeItem}
                          theme={theme}
                          errors={errors}
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
                  theme={theme}
                />

                {/* Botones de acción */}
                {validations.canProceed && (
                  <div className="space-y-3">
                    <Button
                      onClick={handleSubmitPurchase}
                      disabled={saving}
                      className={`w-full ${styles.button()}`}
                      size="lg"
                      data-testid="purchase-save-button"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? (t('purchases.saving') || 'Creando Compra...') : (t('purchases.create') || 'Crear Compra')}
                    </Button>
                    
                    <Button
                      onClick={clearPurchase}
                      variant="outline"
                      className="w-full"
                      disabled={saving}
                      data-testid="purchase-clear-button"
                    >
                      {t('purchases.clear') || 'Limpiar Todo'}
                    </Button>
                  </div>
                )}

                {/* Validaciones minimalistas */}
                {!validations.canProceed && (
                  <div className={`p-3 ${styles.card('border-orange-200 bg-orange-50')}`}>
                    <div className="flex items-center text-orange-800">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">{t('purchases.todo.title') || 'Por completar:'}</span>
                    </div>
                    <ul className="mt-1 text-xs text-orange-700 space-y-0.5">
                      {!validations.hasSupplier && <li>• {t('purchases.todo.supplier') || 'Seleccionar proveedor'}</li>}
                      {!validations.hasItems && <li>• {t('purchases.todo.items') || 'Agregar productos'}</li>}
                      {!validations.hasValidItems && <li>• {t('purchases.todo.valid_items') || 'Verificar cantidades'}</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
         </TabsContent>

        {/* Tab de Lista de Compras */}
        <TabsContent value="purchases-list" className="space-y-4">
          <PurchaseOrdersList theme={theme} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Purchases;
