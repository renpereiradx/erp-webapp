/**
 * Página de Ventas - Versión Separada (Post-Migración de Reservas)
 * Solo maneja funcionalidad de ventas, las reservas están ahora en /reservations
 * Mantiene integración opcional con reservas existentes para flujo reserva → venta
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ShoppingCart, Save, Check, AlertCircle, Plus, Package, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageHeader from '@/components/ui/PageHeader';
import { useI18n } from '@/lib/i18n';
import DataState from '@/components/ui/DataState';
import ClientSelector from '@/components/ClientSelector';
import SaleItemsManager from '@/components/SaleItemsManager';
import SalesOfflineBanner from '@/components/Sales/SalesOfflineBanner';

// Custom hooks para lógica de ventas únicamente
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useSalesLogic } from '@/hooks/useSalesLogic';

// Constantes para ventas
import { SYSTEM_MESSAGES } from '@/constants/mockData';

// Servicios
import { saleService } from '@/services/saleService';

// Hook para integración opcional con reservas
import { useReservationIntegration } from '@/hooks/useReservationIntegration';

// Wave 5: Import Sales Store
import useSalesStore from '@/store/useSalesStore';

const Sales = () => {
  const { theme } = useTheme();
  const themeStyles = useThemeStyles(theme);
  const styles = themeStyles.styles || themeStyles;
  const { t } = useI18n();
  
  // Estado local para UI
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');

  // Lógica de ventas mediante custom hook
  const salesLogic = useSalesLogic();
  const {
    saleItems,
    totalAmount,
    addItem,
    removeItem,
    updateQuantity,
    clearItems,
    validations: saleValidations
  } = salesLogic;

  // Integración opcional con reservas (para flujo reserva → venta)
  const {
    linkedReservation,
    canLinkReservation,
    linkReservation,
    unlinkReservation,
    getReservationDetails
  } = useReservationIntegration();

  // Efectos para notificaciones
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Mostrar notificación
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  // Manejar envío de venta
  const handleSaleSubmit = async () => {
    if (!saleValidations.canProceed) {
      showNotification(
        t('sales.error.incomplete_data') || 'Datos incompletos para procesar la venta',
        'error'
      );
      return;
    }

    setLoading(true);
    
    try {
      const saleData = {
        client_id: selectedClient,
        items: saleItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        })),
        total_amount: totalAmount,
        // Incluir reserva vinculada si existe
        ...(linkedReservation && { reservation_id: linkedReservation.id }),
        timestamp: new Date().toISOString()
      };

      const result = await saleService.createSale(saleData);
      
      showNotification(
        t('sales.success.created') || 'Venta registrada exitosamente',
        'success'
      );

      // Limpiar formulario después del éxito
      setSelectedClient('');
      clearItems();
      if (linkedReservation) {
        unlinkReservation();
      }

      console.log('[telemetry] sales.create.success', {
        saleId: result.id,
        clientId: selectedClient,
        itemCount: saleItems.length,
        totalAmount,
        hasLinkedReservation: Boolean(linkedReservation)
      });

    } catch (error) {
      console.error('[telemetry] sales.create.error', {
        error: error.message,
        clientId: selectedClient,
        itemCount: saleItems.length
      });
      
      showNotification(
        error.message || t('sales.error.create_failed') || 'Error al procesar la venta',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejar vinculación con reserva
  const handleLinkReservation = (reservation) => {
    linkReservation(reservation);
    showNotification(
      t('sales.success.reservation_linked') || 'Reserva vinculada a la venta',
      'success'
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: styles?.background }}>
      <PageHeader
        title={t('sales.page.title') || 'Gestión de Ventas'}
        subtitle={t('sales.page.subtitle') || 'Registro y seguimiento de ventas'}
        showBreadcrumb={true}
      />

      {/* Wave 5: Sales Offline Banner */}
      <SalesOfflineBanner />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Notificación */}
        {notification && (
          <Alert className={`mb-6 ${
            notification.type === 'error' ? 'border-red-500 bg-red-50' :
            notification.type === 'success' ? 'border-green-500 bg-green-50' :
            'border-blue-500 bg-blue-50'
          }`}>
            {notification.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {notification.type === 'success' && <Check className="h-4 w-4" />}
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel Principal de Venta */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {t('sales.form.title') || 'Nueva Venta'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selector de Cliente */}
                <ClientSelector
                  selectedClient={selectedClient}
                  onClientChange={setSelectedClient}
                  theme={theme}
                />
                
                {/* Integración con Reservas - Opcional */}
                {canLinkReservation && !linkedReservation && (
                  <Card className="border-dashed border-blue-300 bg-blue-50/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">
                            {t('sales.reservation.link_available') || 'Vincular con reserva'}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* Abrir selector de reservas */}}
                          className="text-blue-600 border-blue-300"
                        >
                          {t('sales.reservation.select') || 'Seleccionar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reserva Vinculada */}
                {linkedReservation && (
                  <Card className="border-green-300 bg-green-50/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              {t('sales.reservation.linked') || 'Reserva vinculada'}
                            </span>
                          </div>
                          <div className="text-xs text-green-700">
                            {getReservationDetails(linkedReservation)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={unlinkReservation}
                          className="text-green-600"
                        >
                          {t('sales.reservation.unlink') || 'Desvincular'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Gestor de Items de Venta */}
                <SaleItemsManager
                  items={saleItems}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                  onUpdateQuantity={updateQuantity}
                  theme={theme}
                />
              </CardContent>
            </Card>

            {/* Botón de confirmar venta */}
            {saleValidations.canProceed && (
              <Button
                onClick={handleSaleSubmit}
                disabled={loading}
                className={`w-full ${styles.button()}`}
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 
                  (t('sales.common.processing') || 'Procesando...') : 
                  (t('sales.confirm') || 'Confirmar Venta')
                }
              </Button>
            )}
          </div>

          {/* Panel de Resumen */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t('sales.summary.title') || 'Resumen de Venta'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cliente Seleccionado */}
                {selectedClient && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {t('sales.summary.client') || 'Cliente'}
                    </div>
                    <Badge variant="outline" className="font-medium">
                      {selectedClient}
                    </Badge>
                  </div>
                )}

                {/* Items de Venta */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {t('sales.summary.items') || 'Items'} ({saleItems.length})
                  </div>
                  {saleItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      {t('sales.summary.no_items') || 'No hay items agregados'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {saleItems.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.name} x{item.quantity}</span>
                          <span className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                {totalAmount > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        {t('sales.summary.total') || 'Total'}
                      </span>
                      <span className="text-lg font-bold">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Validaciones */}
                <div className="pt-4 space-y-2 text-xs">
                  <div className={`flex items-center gap-2 ${
                    saleValidations.hasClient ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {saleValidations.hasClient ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {t('sales.validation.client') || 'Cliente seleccionado'}
                  </div>
                  <div className={`flex items-center gap-2 ${
                    saleValidations.hasItems ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {saleValidations.hasItems ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {t('sales.validation.items') || 'Items agregados'}
                  </div>
                  <div className={`flex items-center gap-2 ${
                    saleValidations.canProceed ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {saleValidations.canProceed ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {t('sales.validation.ready') || 'Listo para procesar'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reserva Vinculada - Info Extendida */}
            {linkedReservation && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                    <Calendar className="h-4 w-4" />
                    {t('sales.reservation.details') || 'Detalles de Reserva'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('sales.reservation.id') || 'ID'}:
                    </span>
                    <span className="font-mono">{linkedReservation.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('sales.reservation.status') || 'Estado'}:
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {linkedReservation.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('sales.reservation.amount') || 'Monto'}:
                    </span>
                    <span className="font-medium">
                      ${linkedReservation.total_amount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
