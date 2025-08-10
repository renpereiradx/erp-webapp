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

// Custom Hooks
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { usePurchaseLogic } from '@/hooks/usePurchaseLogic';

// Componentes Especializados
import SupplierSelector from '@/components/SupplierSelector';
import PurchaseProductSelector from '@/components/PurchaseProductSelector';
import PurchaseItemsList from '@/components/PurchaseItemsList';
import PurchaseSummary from '@/components/PurchaseSummary';

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
  const [activeTab, setActiveTab] = useState('new-purchase');
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
          Configuración de Compra
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fecha de entrega esperada */}
        <div>
          <label className={styles.label()}>
            <Truck className="inline w-4 h-4 mr-2" />
            Fecha de Entrega Esperada
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
          <label className={styles.label()}>Términos de Pago</label>
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
          <label className={styles.label()}>Método de Entrega</label>
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
          <label className={styles.label()}>Notas</label>
          <textarea
            value={purchaseNotes}
            onChange={(e) => setPurchaseNotes(e.target.value)}
            placeholder="Notas adicionales sobre la compra..."
            rows={3}
            className={styles.input()}
          />
        </div>
      </CardContent>
    </Card>
  );

  // Estadísticas rápidas
  const QuickStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className={styles.card('p-4')}>
        <div className="flex items-center">
          <Package className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <div className="text-2xl font-bold">{uniqueProducts}</div>
            <div className="text-sm text-gray-600">Productos</div>
          </div>
        </div>
      </Card>
      
      <Card className={styles.card('p-4')}>
        <div className="flex items-center">
          <ShoppingCart className="w-8 h-8 text-green-600 mr-3" />
          <div>
            <div className="text-2xl font-bold">{itemCount}</div>
            <div className="text-sm text-gray-600">Cantidad Total</div>
          </div>
        </div>
      </Card>
      
      <Card className={styles.card('p-4')}>
        <div className="flex items-center">
          <Calculator className="w-8 h-8 text-purple-600 mr-3" />
          <div>
            <div className="text-2xl font-bold">${subtotal}</div>
            <div className="text-sm text-gray-600">Subtotal</div>
          </div>
        </div>
      </Card>
      
      <Card className={styles.card('p-4')}>
        <div className="flex items-center">
          <FileText className="w-8 h-8 text-orange-600 mr-3" />
          <div>
            <div className="text-2xl font-bold">${total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className={styles.container()}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={styles.header()}>Gestión de Compras</h1>
        <p className={styles.body()}>
          Administra compras a proveedores, controla inventario y gestiona órdenes de compra
        </p>
      </div>

      <NotificationBanner />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={styles.tab()}>
          <TabsTrigger value="new-purchase" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Compra
          </TabsTrigger>
          <TabsTrigger value="purchases-list" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Lista de Compras
          </TabsTrigger>
        </TabsList>

        {/* Tab de Nueva Compra */}
        <TabsContent value="new-purchase" className="space-y-6">
          <QuickStats />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel principal - Configuración */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selección de proveedor */}
              <Card className={styles.card()}>
                <CardHeader>
                  <CardTitle className={styles.cardHeader()}>
                    Información del Proveedor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SupplierSelector
                    selectedSupplier={selectedSupplier}
                    onSupplierChange={setSelectedSupplier}
                    theme={theme}
                    required={true}
                    error={errors.supplier}
                  />
                </CardContent>
              </Card>

              {/* Selección de productos */}
              {selectedSupplier && (
                <Card className={styles.card()}>
                  <CardHeader>
                    <CardTitle className={styles.cardHeader()}>
                      <Package className="w-5 h-5 mr-2" />
                      Productos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PurchaseProductSelector
                      onProductAdd={addPurchaseItem}
                      theme={theme}
                      supplierId={selectedSupplier.id}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Lista de productos agregados */}
              {purchaseItems.length > 0 && (
                <Card className={styles.card()}>
                  <CardHeader>
                    <CardTitle className={styles.cardHeader()}>
                      Items del Pedido ({purchaseItems.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PurchaseItemsList
                      items={purchaseItems}
                      onQuantityChange={updateItemQuantity}
                      onPriceChange={updateItemPrice}
                      onRemoveItem={removeItem}
                      theme={theme}
                      errors={errors}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Configuración adicional */}
              {purchaseItems.length > 0 && (
                <PurchaseConfiguration />
              )}
            </div>

            {/* Panel lateral - Resumen */}
            <div className="space-y-6">
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
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Creando Compra...' : 'Crear Compra'}
                  </Button>
                  
                  <Button
                    onClick={clearPurchase}
                    variant="outline"
                    className="w-full"
                    disabled={saving}
                  >
                    Limpiar Todo
                  </Button>
                </div>
              )}

              {/* Validaciones */}
              {!validations.canProceed && (
                <Card className={styles.card('border-orange-200 bg-orange-50')}>
                  <CardContent className="p-4">
                    <div className="flex items-center text-orange-800">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Completar para continuar:</span>
                    </div>
                    <ul className="mt-2 text-sm text-orange-700 space-y-1">
                      {!validations.hasSupplier && <li>• Seleccionar proveedor</li>}
                      {!validations.hasItems && <li>• Agregar al menos un producto</li>}
                      {!validations.hasValidItems && <li>• Verificar cantidades y precios</li>}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab de Lista de Compras */}
        <TabsContent value="purchases-list" className="space-y-6">
          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className={styles.cardHeader()}>
                Lista de Compras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Lista de compras - Próximamente</p>
                <p className="text-sm">Esta funcionalidad se implementará en la siguiente fase</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Purchases;
