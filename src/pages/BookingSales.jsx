/**
 * Página unificada de Reservas y Ventas - Versión Refactorizada
 * Implementa mejores prácticas de desarrollo:
 * - Separación de lógica de negocio en custom hooks
 * - Componentes reutilizables
 * - Centralización de datos y estilos
 * - Código más mantenible y testeable
 */

import React, { useState } from 'react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useAnnouncement } from '@/contexts/AnnouncementContext';
import { Calendar, ShoppingCart, Save, Check, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import DataState from '@/components/ui/DataState';

// Custom hooks para lógica de negocio
// useThemeStyles removido para MVP - sin hooks problemáticos
import { useReservationLogic } from '@/hooks/useReservationLogic';
import { useSalesLogic } from '@/hooks/useSalesLogic';

// Componentes especializados
import ClientSelector from '@/components/ClientSelector';
import CalendarReservation from '@/components/CalendarReservation';
import SaleItemsManager from '@/components/SaleItemsManager';

// Constantes centralizadas
import { MOCK_SERVICES, SYSTEM_MESSAGES } from '@/constants/mockData';

// Servicios
import reservationService from '@/services/reservationService';
import { saleService } from '@/services/saleService';

const BookingSales = () => {
  // Theming unificado
  const { styles, isMaterial, isFluent } = useThemeStyles();
  const { announceSuccess, announceError } = useAnnouncement();
  const { t } = useI18n();
  
  // Estado local para UI
  const [activeTab, setActiveTab] = useState('reservas');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Lógica de reservas mediante custom hook
  const reservationLogic = useReservationLogic();
  const {
    selectedDate,
    selectedTime,
    selectedService,
    selectedClient: reservationClient,
    validations: reservationValidations,
    setSelectedService,
    setSelectedClient: setReservationClient,
    prepareReservationData,
    resetReservation
  } = reservationLogic;

  // Lógica de ventas mediante custom hook
  const salesLogic = useSalesLogic();
  const {
    saleItems,
    selectedClient: saleClient,
    subtotal,
    tax,
    total,
    validations: salesValidations,
    setSelectedClient: setSaleClient,
    prepareSaleData,
    resetSale
  } = salesLogic;

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Manejar envío de reserva
  const handleReservationSubmit = async () => {
    if (!reservationValidations.canProceed) {
      showNotification(SYSTEM_MESSAGES.ERROR.VALIDATION_ERROR, 'error');
      return;
    }

    setLoading(true);
    try {
      const reservationData = prepareReservationData();
      await reservationService.createReservation(reservationData);
      
        showNotification(SYSTEM_MESSAGES.SUCCESS.RESERVATION_CREATED);
    announceSuccess('Reserva');
        resetReservation();
      } catch (error) {
        showNotification(SYSTEM_MESSAGES.ERROR.NETWORK_ERROR, 'error');
    announceError('Reserva', 'Error creando la reserva');      } finally {
        setLoading(false);
      }
    };
  
    // Manejar envío de venta
    const handleSaleSubmit = async () => {
      if (!salesValidations.canProceed) {
        showNotification(SYSTEM_MESSAGES.ERROR.VALIDATION_ERROR, 'error');
        return;
      }
  
      setLoading(true);
      try {
        const saleData = prepareSaleData();
        await saleService.createSale(saleData);
        
    showNotification(SYSTEM_MESSAGES.SUCCESS.SALE_COMPLETED);
    announceSuccess('Venta');
        resetSale();
      } catch (error) {
        showNotification(SYSTEM_MESSAGES.ERROR.NETWORK_ERROR, 'error');
    announceError('Venta', 'Error completando la venta');    } finally {
      setLoading(false);
    }
  };

  // Componente de notificación
  const NotificationBanner = () => {
    if (!notification) return null;

    const isError = notification.type === 'error';
    const icon = isError ? AlertCircle : Check;
    // Usar variantes semánticas de card según tema
    const cardVariant = isError
      ? (isMaterial ? 'error' : 'error')
      : (isMaterial ? 'success' : 'success');
    const bannerClasses = styles.card(cardVariant, {
      density: 'compact',
      interactive: false,
      extra: 'flex items-center gap-2 mb-6'
    });
    return (
      <div className={bannerClasses} role={isError ? 'alert' : 'status'}>
        {React.createElement(icon, { className: 'w-5 h-5 shrink-0' })}
        <span className="text-sm font-medium leading-snug flex-1">{notification.message}</span>
      </div>
    );
  };

  // Componente del selector de servicios
  const ServiceSelector = () => (
    <div className="space-y-3">
      <label className={styles.label()}>
        <Calendar className="inline w-4 h-4 mr-2" />
        {t('booking.reservation.service.label') || 'Servicio'}
      </label>
      <select
        value={selectedService?.id || ''}
        onChange={(e) => {
          const service = MOCK_SERVICES.find(s => s.id === parseInt(e.target.value));
          setSelectedService(service);
        }}
        className={styles.input(isMaterial ? 'outlined' : 'subtle', { density: 'compact', extra: 'w-full' })}
      >
        <option value="">{t('booking.reservation.select_service.placeholder') || 'Seleccionar servicio...'}</option>
        {MOCK_SERVICES.map((service) => (
          <option key={service.id} value={service.id}>
            {service.name} - ${service.price} ({t('booking.reservation.duration.minutes', { minutes: service.duration }) || `${service.duration}min`})
          </option>
        ))}
      </select>
      {selectedService && (
        <div className={styles.card(isMaterial ? 'tonal' : 'subdued', { density: 'compact', extra: 'p-3 space-y-1' })}>
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-sm leading-tight">{selectedService.name}</h4>
              <p className="text-xs opacity-80 mt-1">{selectedService.description}</p>
            </div>
            <Badge variant="secondary">${selectedService.price}</Badge>
          </div>
        </div>
      )}
    </div>
  );

  // Componente del resumen de reserva
  const ReservationSummary = () => {
    if (!reservationValidations.hasService && !reservationValidations.hasClient) return null;

    return (
      <Card className={styles.card(isMaterial ? 'outlined-soft' : 'outline-soft', { density: 'compact' })}>
        <CardHeader>
          <CardTitle className={styles.cardHeader()}>{t('booking.reservation.summary') || 'Resumen de Reserva'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedService && (
            <div className="flex justify-between">
              <span>{t('booking.summary.service') || 'Servicio:'}</span>
              <span className="font-medium">{selectedService.name}</span>
            </div>
          )}
          {selectedDate && (
            <div className="flex justify-between">
              <span>{t('booking.summary.date') || 'Fecha:'}</span>
              <span className="font-medium">{selectedDate.toLocaleDateString('es-ES')}</span>
            </div>
          )}
          {selectedTime && (
            <div className="flex justify-between">
              <span>{t('booking.summary.time') || 'Hora:'}</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
          )}
          {selectedService && (
            <div className="flex justify-between border-t pt-3">
              <span className="font-medium">{t('booking.summary.total') || 'Total:'}</span>
              <span className="font-bold text-lg">${selectedService.price}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Componente del resumen de venta
  const SaleSummary = () => {
    if (saleItems.length === 0) return null;

    return (
      <Card className={styles.card(isMaterial ? 'outlined-soft' : 'outline-soft', { density: 'compact' })}>
        <CardHeader>
          <CardTitle className={styles.cardHeader()}>{t('booking.sales.summary') || 'Resumen de Venta'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>{t('booking.summary.subtotal') || 'Subtotal:'}</span>
            <span>${subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('booking.summary.tax') || 'IVA (16%):'}</span>
            <span>${tax}</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="font-medium">{t('booking.summary.total') || 'Total:'}</span>
            <span className="font-bold text-lg">${total}</span>
          </div>
          <Badge variant="outline" className="w-full justify-center">
            {saleItems.reduce((sum, item) => sum + item.quantity, 0)} artículos
          </Badge>
        </CardContent>
      </Card>
    );
  };

  return (
  <div className={styles.container('space-y-6')} data-testid="booking-sales-page">
      {/* Breadcrumb discreto para contexto */}
      <nav className="flex items-center text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{t('bookingSales.title', 'Ventas con Reserva')}</span>
      </nav>

      <NotificationBanner />
 
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex gap-2">
          <TabsTrigger value="reservas" className={styles.tab('flex items-center gap-2 px-4 py-2 text-sm font-medium')}>
            <Calendar className="w-4 h-4" />
            {t('booking.tab.reservations') || 'Reservas'}
          </TabsTrigger>
          <TabsTrigger value="ventas" className={styles.tab('flex items-center gap-2 px-4 py-2 text-sm font-medium')}>
            <ShoppingCart className="w-4 h-4" />
            {t('booking.tab.sales') || 'Ventas'}
          </TabsTrigger>
        </TabsList>

        {/* Tab de Reservas */}
        <TabsContent value="reservas" className="space-y-6" data-testid="booking-reservas-tab">
          {loading && !reservationClient && !selectedService ? (
            <DataState variant="loading" skeletonVariant="list" testId="booking-sales-loading" skeletonProps={{ count: 4 }} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel de configuración de reserva */}
              <div className="space-y-6">
                <Card className={styles.card(isMaterial ? 'elevated' : 'elevated', { density: 'comfy' })}>
                  <CardHeader>
                    <CardTitle className={styles.cardHeader()}>{t('booking.reservation.new') || 'Nueva Reserva'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ClientSelector
                      selectedClient={reservationClient}
                      onClientChange={setReservationClient}
                      theme={theme}
                    />
                    
                    <ServiceSelector />
                    
                    {selectedService && (
                      <CalendarReservation
                        selectedService={selectedService}
                        theme={theme}
                        {...reservationLogic}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Botón de confirmar reserva */}
                {reservationValidations.canProceed && (
                  <Button
                    onClick={handleReservationSubmit}
                    disabled={loading}
                    className="w-full"
                    variant={isMaterial ? 'filled' : 'primary'}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? (t('booking.common.processing') || 'Procesando...') : (t('booking.reservation.confirm') || 'Confirmar Reserva')}
                  </Button>
                )}
              </div>

              {/* Panel de resumen */}
              <div className="space-y-6">
                <ReservationSummary />
              </div>
            </div>
          )}
          </TabsContent>

          {/* Tab de Ventas */}
          <TabsContent value="ventas" className="space-y-6" data-testid="booking-ventas-tab">
          {loading && saleItems.length === 0 && !saleClient ? (
            <DataState variant="loading" skeletonVariant="list" testId="booking-sales-sales-loading" skeletonProps={{ count: 4 }} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel de productos */}
              <div className="space-y-6">
                <Card className={styles.card(isMaterial ? 'elevated' : 'elevated', { density: 'comfy' })}>
                  <CardHeader>
                    <CardTitle className={styles.cardHeader()}>{t('booking.sales.new') || 'Nueva Venta'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ClientSelector
                      selectedClient={saleClient}
                      onClientChange={setSaleClient}
                      theme={theme}
                    />
                    
                    <SaleItemsManager
                      theme={theme}
                      {...salesLogic}
                    />
                  </CardContent>
                </Card>

                {/* Botón de completar venta */}
                {salesValidations.canProceed && (
                  <Button
                    onClick={handleSaleSubmit}
                    disabled={loading}
                    className="w-full"
                    variant={isMaterial ? 'filled' : 'primary'}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {loading ? (t('booking.common.processing') || 'Procesando...') : (t('booking.sales.complete') || 'Completar Venta')}
                  </Button>
                )}
              </div>

              {/* Panel de resumen */}
              <div className="space-y-6">
                <SaleSummary />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingSales;
