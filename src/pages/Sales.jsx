/**
 * Página de Ventas - Separada de Reservas
 * Siguiendo guía MVP: funcionalidad básica navegable
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Save, Check, AlertCircle, CreditCard, DollarSign, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PageHeader from '@/components/ui/PageHeader';
import { useI18n } from '@/lib/i18n';
import DataState from '@/components/ui/DataState';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useAnnouncement } from '@/contexts/AnnouncementContext';

// Custom hooks para lógica de negocio
import { useSalesLogic } from '@/hooks/useSalesLogic';

// Componentes especializados
import ClientSelector from '@/components/ClientSelector';
import SaleItemsManager from '@/components/SaleItemsManager';

// Constantes centralizadas
import { SYSTEM_MESSAGES } from '@/constants/mockData';

// Store y servicios
import useSaleStore from '@/store/useSaleStore';
import { saleService } from '@/services/saleService';

// Métodos de pago disponibles
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo', icon: DollarSign },
  { value: 'card', label: 'Tarjeta', icon: CreditCard },
  { value: 'transfer', label: 'Transferencia', icon: CreditCard }
];

const Sales = () => {
  const { t } = useI18n();
  const { styles, isMaterial } = useThemeStyles();
  const { announceSuccess, announceError } = useAnnouncement();
  
  // Estado local para UI y pagos
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [amountPaidInput, setAmountPaidInput] = useState('');

  // Store de ventas con funcionalidad de pagos
  const {
    currentSaleData,
    paymentInProgress,
    changeCalculation,
    setCurrentSaleClient,
    setPaymentMethod,
    calculateChange,
    createSale,
    canProcessSale,
    getCurrentSaleTotal,
    getChangeAmount,
    clearCurrentSale
  } = useSaleStore();

  // Lógica de ventas mediante custom hook (para compatibilidad)
  const salesLogic = useSalesLogic();
  const {
    saleItems,
    selectedClient,
    setSelectedClient,
    subtotal,
    tax,
    total,
    validations
  } = salesLogic;

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Efecto para sincronizar cambios de pago
  useEffect(() => {
    const amount = parseFloat(amountPaidInput) || 0;
    const total = getCurrentSaleTotal();
    if (amount > 0 && total > 0) {
      calculateChange(total, amount);
    }
  }, [amountPaidInput, calculateChange, getCurrentSaleTotal]);

  // Manejar cambio de método de pago
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'cash') {
      setShowPaymentSection(true);
    } else {
      setShowPaymentSection(false);
      setAmountPaidInput('');
    }
  };

  // Manejar cambio en monto pagado
  const handleAmountPaidChange = (value) => {
    setAmountPaidInput(value);
  };

  // Manejar envío de venta
  const handleSaleSubmit = async () => {
    if (!canProcessSale()) {
      showNotification(SYSTEM_MESSAGES.ERROR.VALIDATION_ERROR, 'error');
      announceError('Venta', 'Validación');
      return;
    }

    const paymentMethod = currentSaleData.paymentMethod;
    const amountPaid = parseFloat(amountPaidInput) || currentSaleData.totalAmount;
    
    // Validaciones de pago en efectivo
    if (paymentMethod === 'cash' && amountPaid < currentSaleData.totalAmount) {
      showNotification('El monto pagado debe ser mayor o igual al total', 'error');
      return;
    }

    setLoading(true);
    try {
      // Actualizar datos de pago en el store
      currentSaleData.amountPaid = amountPaid;
      
      const response = await createSale();
      
      if (response.success) {
        showNotification(SYSTEM_MESSAGES.SUCCESS.SALE_COMPLETED);
        announceSuccess('Venta');
        
        // Mostrar cambio si es pago en efectivo
        if (paymentMethod === 'cash' && amountPaid > currentSaleData.totalAmount) {
          const change = amountPaid - currentSaleData.totalAmount;
          showNotification(`Venta completada. Cambio: $${change.toFixed(2)}`,'success');
          announceSuccess('Cambio calculado');
        }
        
        // Resetear formulario
        clearCurrentSale();
        setAmountPaidInput('');
        setShowPaymentSection(false);
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      showNotification(SYSTEM_MESSAGES.ERROR.NETWORK_ERROR, 'error');
      announceError('Venta', 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  // Componente de notificación
  const NotificationBanner = () => {
    if (!notification) return null;
    const isError = notification.type === 'error';
    const icon = isError ? AlertCircle : Check;
    const variant = isError ? 'error' : 'success';
    const bannerClasses = styles.card(variant, { density: 'compact', extra: 'flex items-center gap-2 mb-6' });
    return (
      <div className={bannerClasses} role={isError ? 'alert' : 'status'}>
        {React.createElement(icon, { className: 'w-5 h-5 shrink-0' })}
        <span className="text-sm font-medium leading-snug flex-1">{notification.message}</span>
      </div>
    );
  };

  // Componente del resumen de venta
  const SaleSummary = () => {
    if (saleItems.length === 0) return null;

    return (
      <Card className={styles.card(isMaterial ? 'outlined-soft' : 'outline-soft', { density: 'compact' })}>
        <CardHeader>
          <CardTitle className={styles.header('h3')}>{t('sales.summary.title', 'Resumen de Venta')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>{t('sales.summary.subtotal', 'Subtotal:')}</span>
            <span>${subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('sales.summary.tax', 'IVA (16%):')}</span>
            <span>${tax}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span className="font-medium">{t('sales.summary.total', 'Total:')}</span>
            <span className="font-bold text-lg">${total}</span>
          </div>
          <Badge variant="outline" className="w-full justify-center">
            {saleItems.reduce((sum, item) => sum + item.quantity, 0)} {t('sales.summary.items', 'artículos')}
          </Badge>
        </CardContent>
      </Card>
    );
  };

  // Componente de procesamiento de pago
  const PaymentSection = () => {
    if (saleItems.length === 0) return null;

    const changeAmount = getChangeAmount();
    const totalAmount = getCurrentSaleTotal();

    return (
      <Card className={styles.card(isMaterial ? 'outlined-soft' : 'outline-soft', { density: 'compact' })}>
        <CardHeader>
          <CardTitle className={styles.header('h3')}>
            <CreditCard className="w-5 h-5 mr-2" />
            {t('sales.payment.title', 'Procesamiento de Pago')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de método de pago */}
          <div>
            <Label htmlFor="payment-method" className={styles.label()}>{t('sales.payment.method', 'Método de Pago')}</Label>
            <Select
              value={currentSaleData.paymentMethod}
              onValueChange={handlePaymentMethodChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(method => {
                  const IconComponent = method.icon;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center">
                        <IconComponent className="w-4 h-4 mr-2" />
                        {method.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Campo de monto pagado (solo para efectivo) */}
          {showPaymentSection && (
            <div>
              <Label htmlFor="amount-paid" className={styles.label()}>{t('sales.payment.amount_paid', 'Monto Pagado')}</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="amount-paid"
                  type="number"
                  step="0.01"
                  min={totalAmount}
                  value={amountPaidInput}
                  onChange={(e) => handleAmountPaidChange(e.target.value)}
                  placeholder={`Mínimo $${totalAmount}`}
                  className={styles.input(isMaterial ? 'outlined' : 'subtle', { density: 'compact', extra: 'pl-10' })}
                />
              </div>
              
              {/* Mostrar cambio */}
              {amountPaidInput && parseFloat(amountPaidInput) >= totalAmount && (
                <div className={styles.card('success', { density: 'compact', extra: 'mt-2 p-3 flex items-center justify-between' })}>
                  <span className="font-medium flex items-center gap-2 text-sm">
                    <Calculator className="w-4 h-4" />
                    {t('sales.payment.change', 'Cambio:')}
                  </span>
                  <span className="font-bold text-base">{(parseFloat(amountPaidInput) - totalAmount).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Resumen de pago */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t('sales.payment.total', 'Total a Pagar:')}</span>
              <span className="font-bold text-xl">${totalAmount}</span>
            </div>
            {currentSaleData.paymentMethod && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">{t('sales.payment.method', 'Método:')}</span>
                <Badge variant="outline">
                  {PAYMENT_METHODS.find(m => m.value === currentSaleData.paymentMethod)?.label}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
  <div className={styles.page('space-y-6')} data-testid="sales-page">
      <PageHeader
        title={t('sales.title', 'Ventas')}
        subtitle={t('sales.subtitle', 'Gestiona las ventas de productos')}
        breadcrumb={[
          { label: t('navigation.operations', 'Operaciones'), href: '/dashboard' }, 
          { label: t('sales.title', 'Ventas') }
        ]}
      />

      <NotificationBanner />
 
      {loading && saleItems.length === 0 && !selectedClient ? (
        <DataState variant="loading" skeletonVariant="list" testId="sales-loading" skeletonProps={{ count: 4 }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de productos */}
          <div className="space-y-6">
            <Card className={styles.card(isMaterial ? 'elevated' : 'elevated', { density: 'comfy' })}>
              <CardHeader>
                <CardTitle className={styles.header('h3')}>{t('sales.new_sale', 'Nueva Venta')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ClientSelector
                  selectedClient={selectedClient}
                  onClientChange={setSelectedClient}
                />
                
                <SaleItemsManager
                  {...salesLogic}
                />
              </CardContent>
            </Card>

            {/* Botón de completar venta */}
            {canProcessSale() && (
              <Button
                onClick={handleSaleSubmit}
                disabled={loading || paymentInProgress}
                className="w-full"
                variant={isMaterial ? 'filled' : 'primary'}
              >
                <Check className="w-4 h-4 mr-2" />
                {loading || paymentInProgress ? 
                  t('sales.processing', 'Procesando...') : 
                  t('sales.complete', 'Completar Venta')
                }
              </Button>
            )}
          </div>

          {/* Panel de resumen y pago */}
          <div className="space-y-6">
            <SaleSummary />
            <PaymentSection />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;