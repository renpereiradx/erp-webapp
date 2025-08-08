/**
 * Página unificada de Reservas y Ventas - Versión Refactorizada
 * Implementa mejores prácticas de desarrollo:
 * - Separación de lógica de negocio en custom hooks
 * - Componentes reutilizables
 * - Centralización de datos y estilos
 * - Código más mantenible y testeable
 */

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { Calendar, ShoppingCart, Save, Check, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Custom hooks para lógica de negocio
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useReservationLogic } from '@/hooks/useReservationLogic';
import { useSalesLogic } from '@/hooks/useSalesLogic';

// Componentes especializados
import ClientSelector from '@/components/ClientSelector';
import CalendarReservation from '@/components/CalendarReservation';
import SaleItemsManager from '@/components/SaleItemsManager';

// Constantes centralizadas
import { MOCK_SERVICES, SYSTEM_MESSAGES } from '@/constants/mockData';

// Servicios
import { reservationService } from '@/services/reservationService';
import { saleService } from '@/services/saleService';

const BookingSalesRefactored = () => {
  const { theme } = useTheme();
  const styles = useThemeStyles(theme);
  
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
      resetReservation();
    } catch (error) {
      console.error('Error creating reservation:', error);
      showNotification(SYSTEM_MESSAGES.ERROR.NETWORK_ERROR, 'error');
    } finally {
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
      resetSale();
    } catch (error) {
      console.error('Error creating sale:', error);
      showNotification(SYSTEM_MESSAGES.ERROR.NETWORK_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Componente de notificación
  const NotificationBanner = () => {
    if (!notification) return null;

    const isError = notification.type === 'error';
    const icon = isError ? AlertCircle : Check;
    const bgColor = isError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
    const textColor = isError ? 'text-red-800' : 'text-green-800';

    return (
      <div className={`p-4 rounded-lg border ${bgColor} ${textColor} mb-6 flex items-center`}>
        {React.createElement(icon, { className: 'w-5 h-5 mr-2' })}
        {notification.message}
      </div>
    );
  };

  // Componente del selector de servicios
  const ServiceSelector = () => (
    <div className="space-y-3">
      <label className={styles.label()}>
        <Calendar className="inline w-4 h-4 mr-2" />
        Servicio
      </label>
      <select
        value={selectedService?.id || ''}
        onChange={(e) => {
          const service = MOCK_SERVICES.find(s => s.id === parseInt(e.target.value));
          setSelectedService(service);
        }}
        className={styles.input()}
      >
        <option value="">Seleccionar servicio...</option>
        {MOCK_SERVICES.map((service) => (
          <option key={service.id} value={service.id}>
            {service.name} - ${service.price} ({service.duration}min)
          </option>
        ))}
      </select>
      
      {selectedService && (
        <div className={styles.card('p-3')}>
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{selectedService.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{selectedService.description}</p>
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
      <Card className={styles.card()}>
        <CardHeader>
          <CardTitle className={styles.cardHeader()}>Resumen de Reserva</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedService && (
            <div className="flex justify-between">
              <span>Servicio:</span>
              <span className="font-medium">{selectedService.name}</span>
            </div>
          )}
          {selectedDate && (
            <div className="flex justify-between">
              <span>Fecha:</span>
              <span className="font-medium">{selectedDate.toLocaleDateString('es-ES')}</span>
            </div>
          )}
          {selectedTime && (
            <div className="flex justify-between">
              <span>Hora:</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
          )}
          {selectedService && (
            <div className="flex justify-between border-t pt-3">
              <span className="font-medium">Total:</span>
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
      <Card className={styles.card()}>
        <CardHeader>
          <CardTitle className={styles.cardHeader()}>Resumen de Venta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA (16%):</span>
            <span>${tax}</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="font-medium">Total:</span>
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
    <div className={styles.container()}>
      <div className="mb-8">
        <h1 className={styles.header()}>Sistema de Reservas y Ventas</h1>
        <p className={styles.body()}>
          Gestiona reservas de servicios y ventas de productos de forma integrada
        </p>
      </div>

      <NotificationBanner />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={styles.tab()}>
          <TabsTrigger value="reservas" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Reservas
          </TabsTrigger>
          <TabsTrigger value="ventas" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Ventas
          </TabsTrigger>
        </TabsList>

        {/* Tab de Reservas */}
        <TabsContent value="reservas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de configuración de reserva */}
            <div className="space-y-6">
              <Card className={styles.card()}>
                <CardHeader>
                  <CardTitle className={styles.cardHeader()}>Nueva Reserva</CardTitle>
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
                  className={`w-full ${styles.button()}`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Procesando...' : 'Confirmar Reserva'}
                </Button>
              )}
            </div>

            {/* Panel de resumen */}
            <div className="space-y-6">
              <ReservationSummary />
            </div>
          </div>
        </TabsContent>

        {/* Tab de Ventas */}
        <TabsContent value="ventas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de productos */}
            <div className="space-y-6">
              <Card className={styles.card()}>
                <CardHeader>
                  <CardTitle className={styles.cardHeader()}>Nueva Venta</CardTitle>
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
                  className={`w-full ${styles.button()}`}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {loading ? 'Procesando...' : 'Completar Venta'}
                </Button>
              )}
            </div>

            {/* Panel de resumen */}
            <div className="space-y-6">
              <SaleSummary />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingSalesRefactored;
