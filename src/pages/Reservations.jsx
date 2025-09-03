/**
 * Página de Reservas con Calendario Integrado
 * Siguiendo guía MVP: funcionalidad básica navegable
 * UX Decision: Calendario y reservas en la misma página para mejor flujo de usuario
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Plus, Search, Edit, Trash2, CheckCircle, XCircle, Settings, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import DataState from '@/components/ui/DataState';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';

// Stores
import useReservationStore from '@/store/useReservationStore';
import useProductStore from '@/store/useProductStore';
import useClientStore from '@/store/useClientStore';

// Componentes
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const Reservations = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  
  // Estados del store
  const {
    reservations,
    schedules,
    loading,
    error,
    fetchReservations,
    fetchAvailableSchedules,
    createReservation,
    cancelReservation,
    updateScheduleAvailability,
    generateDailySchedules,
    generateSchedulesForDate,
    generateSchedulesForNextDays,
    fetchSchedulesByDateRange,
    clearError
  } = useReservationStore();

  const { products, fetchProducts } = useProductStore();
  const { clients, fetchClients } = useClientStore();

  // Estados locales para UI
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    client_id: '',
    start_time: '',
    duration: 1
  });
  
  // Estados para gestión de horarios
  const [scheduleManagement, setScheduleManagement] = useState({
    selectedScheduleDate: new Date(),
    generatingSchedules: false,
    daysToGenerate: 7
  });

  // Cargar datos al montar
  useEffect(() => {
    fetchReservations();
    fetchProducts();
    fetchClients();
  }, [fetchReservations, fetchProducts, fetchClients]);

  // Cargar horarios disponibles cuando cambie la fecha o producto
  useEffect(() => {
    if (selectedDate && selectedProduct) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      fetchAvailableSchedules(selectedProduct.id, dateStr);
    }
  }, [selectedDate, selectedProduct, fetchAvailableSchedules]);

  // Filtrar reservas
  const filteredReservations = reservations.filter(reservation =>
    reservation.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleCreateReservation = () => {
    setEditingReservation(null);
    setFormData({
      product_id: selectedProduct?.id || '',
      client_id: selectedClient?.id || '',
      start_time: formData.start_time || '',
      duration: 1
    });
    setShowModal(true);
  };

  const handleEditReservation = (reservation) => {
    setEditingReservation(reservation);
    setFormData({
      product_id: reservation.product_id,
      client_id: reservation.client_id,
      start_time: reservation.start_time,
      duration: reservation.duration
    });
    setShowModal(true);
  };

  const handleSaveReservation = async (e) => {
    e.preventDefault();
    
    try {
      if (editingReservation) {
        // await updateReservation(editingReservation.id, formData);
        console.log('Update functionality pending');
      } else {
        await createReservation(formData);
      }
      
      setShowModal(false);
      setEditingReservation(null);
      setFormData({
        product_id: '',
        client_id: '',
        start_time: '',
        duration: 1
      });
    } catch (error) {
      console.error('Error saving reservation:', error);
    }
  };

  const handleCancelReservation = async (reservation) => {
    if (window.confirm(t('reservations.confirm_cancel', '¿Cancelar esta reserva?'))) {
      await cancelReservation(reservation.id);
    }
  };

  // Handlers para gestión de horarios
  const handleToggleScheduleAvailability = async (scheduleId, currentAvailability) => {
    const newAvailability = !currentAvailability;
    await updateScheduleAvailability(scheduleId, newAvailability);
    
    // Recargar horarios si hay fecha seleccionada
    if (selectedDate && selectedProduct) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      fetchAvailableSchedules(selectedProduct.id, dateStr);
    }
  };

  const handleGenerateSchedules = async (type, params = {}) => {
    setScheduleManagement(prev => ({ ...prev, generatingSchedules: true }));
    
    try {
      let result;
      switch (type) {
        case 'daily':
          result = await generateDailySchedules();
          break;
        case 'date':
          result = await generateSchedulesForDate(params.date);
          break;
        case 'nextDays':
          result = await generateSchedulesForNextDays(params.days);
          break;
        default:
          throw new Error('Tipo de generación no válido');
      }
      
      if (result.success) {
        // Recargar horarios disponibles
        if (selectedDate && selectedProduct) {
          const dateStr = selectedDate.toISOString().split('T')[0];
          fetchAvailableSchedules(selectedProduct.id, dateStr);
        }
      }
    } catch (error) {
      console.error('Error generando horarios:', error);
    } finally {
      setScheduleManagement(prev => ({ ...prev, generatingSchedules: false }));
    }
  };

  // Utilizar horarios disponibles de la API en lugar de slots generados localmente
  const availableTimeSlots = schedules.map(schedule => ({
    id: schedule.id,
    start_time: schedule.start_time,
    end_time: schedule.end_time,
    is_available: schedule.is_available,
    displayTime: new Date(schedule.start_time).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  })).filter(slot => slot.is_available);

  // Estados de UI
  if (loading && reservations.length === 0) {
    return <DataState variant="loading" skeletonVariant="list" />;
  }

  if (error) {
    return (
      <DataState 
        variant="error" 
        title={t('reservations.error.title', 'Error')}
        message={error}
        onRetry={() => {
          clearError();
          fetchReservations();
        }}
      />
    );
  }

  return (
    <div className={styles.container()} data-testid="reservations-page">
      <PageHeader
        title={t('reservations.title', 'Reservas')}
        subtitle={t('reservations.subtitle', 'Gestiona reservas y horarios de servicios')}
        breadcrumb={[
          { label: t('navigation.operations', 'Operaciones'), href: '/dashboard' }, 
          { label: t('reservations.title', 'Reservas') }
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={styles.tab()}>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t('reservations.tab.calendar', 'Calendario')}
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('reservations.tab.list', 'Lista de Reservas')}
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {t('schedules.tab.management', 'Gestión de Horarios')}
          </TabsTrigger>
        </TabsList>

        {/* Tab Calendario */}
        <TabsContent value="calendar" className="space-y-6" data-testid="reservations-calendar-tab">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de Selección */}
            <div className="lg:col-span-1 space-y-6">
              <Card className={styles.card()}>
                <CardHeader>
                  <CardTitle className={styles.header('h3')}>
                    {t('reservations.new_reservation', 'Nueva Reserva')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selector de Servicio */}
                  <div>
                    <label className={styles.label()}>
                      {t('reservations.service', 'Servicio')}
                    </label>
                    <select
                      value={selectedProduct?.id || ''}
                      onChange={(e) => {
                        const product = products.find(p => p.id === e.target.value);
                        setSelectedProduct(product);
                      }}
                      className={styles.input()}
                    >
                      <option value="">
                        {t('reservations.select_service', 'Seleccionar servicio...')}
                      </option>
                      {products
                        .filter(product => product.type === 'service' || product.reservable)
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${product.price}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  {/* Selector de Cliente */}
                  <div>
                    <label className={styles.label()}>
                      {t('reservations.client', 'Cliente')}
                    </label>
                    <select
                      value={selectedClient?.id || ''}
                      onChange={(e) => {
                        const client = clients.find(c => c.id === e.target.value);
                        setSelectedClient(client);
                      }}
                      className={styles.input()}
                    >
                      <option value="">
                        {t('reservations.select_client', 'Seleccionar cliente...')}
                      </option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Horarios disponibles desde API */}
                  {selectedProduct && selectedDate && (
                    <div>
                      <label className={styles.label()}>
                        <Clock className="w-4 h-4 mr-1 inline" />
                        {t('reservations.available_times', 'Horarios Disponibles')}
                        {loading && <span className="text-sm text-muted-foreground ml-2">(Cargando...)</span>}
                      </label>
                      {availableTimeSlots.length === 0 && !loading ? (
                        <div className="p-4 text-center text-muted-foreground bg-gray-50 rounded-md mt-2">
                          <Clock className="w-6 h-6 mx-auto mb-2" />
                          <p className="text-sm">No hay horarios disponibles para esta fecha</p>
                          <p className="text-xs">Selecciona otra fecha o producto</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {availableTimeSlots.map(slot => (
                            <Button
                              key={slot.id}
                              onClick={() => {
                                setSelectedTime(slot.displayTime);
                                setFormData(prev => ({ 
                                  ...prev, 
                                  start_time: slot.start_time 
                                }));
                              }}
                              className={`p-2 text-xs font-bold border-2 transition-all ${
                                selectedTime === slot.displayTime
                                  ? 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                  : 'hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                              }`}
                              variant={selectedTime === slot.displayTime ? 'primary' : 'secondary'}
                              title={`${slot.displayTime} - ${new Date(slot.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                            >
                              {slot.displayTime}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botón crear reserva */}
                  {selectedProduct && selectedClient && selectedTime && (
                    <Button
                      onClick={handleCreateReservation}
                      className="w-full"
                      variant="primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('reservations.create', 'Crear Reserva')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Calendario */}
            <div className="lg:col-span-2">
              <Card className={styles.card()}>
                <CardHeader>
                  <CardTitle className={styles.header('h3')}>
                    {t('reservations.calendar', 'Calendario de Reservas')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab Lista de Reservas */}
        <TabsContent value="list" className="space-y-6" data-testid="reservations-list-tab">
          {/* Búsqueda */}
          <div className="flex justify-between items-center">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('reservations.search.placeholder', 'Buscar reservas...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${styles.input()}`}
              />
            </div>
            <Button onClick={() => setActiveTab('calendar')} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              {t('reservations.new_reservation', 'Nueva Reserva')}
            </Button>
          </div>

          {/* Lista de reservas */}
          {!loading && filteredReservations.length === 0 ? (
            <DataState
              variant="empty"
              title={t('reservations.empty.title', 'Sin reservas')}
              message={t('reservations.empty.message', 'No hay reservas registradas')}
              actionLabel={t('reservations.new_reservation', 'Nueva Reserva')}
              onAction={() => setActiveTab('calendar')}
            />
          ) : (
            <div className="grid gap-4">
              {filteredReservations.map(reservation => (
                <Card key={reservation.id} className={styles.card()}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{reservation.product_name}</h3>
                          <Badge 
                            variant={
                              reservation.status === 'confirmed' ? 'default' :
                              reservation.status === 'cancelled' ? 'destructive' : 'secondary'
                            }
                          >
                            {t(`reservations.status.${reservation.status}`, reservation.status)}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span><strong>Cliente:</strong> {reservation.client_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              <strong>Fecha:</strong> {new Date(reservation.start_time).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              <strong>Hora:</strong> {new Date(reservation.start_time).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <div>
                            <strong>Total:</strong> ${reservation.total_amount}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditReservation(reservation)}
                          className="border-2 border-black"
                          title={t('action.edit', 'Editar')}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleCancelReservation(reservation)}
                          className="border-2 border-black hover:bg-red-100"
                          title={t('reservations.cancel', 'Cancelar')}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Gestión de Horarios */}
        <TabsContent value="schedules" className="space-y-6" data-testid="schedules-management-tab">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de Generación de Horarios */}
            <Card className={styles.card()}>
              <CardHeader>
                <CardTitle className={styles.header('h3')}>
                  <RefreshCw className="w-5 h-5 mr-2 inline" />
                  {t('schedules.generate.title', 'Generar Horarios')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Generar horarios diarios */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Generación Diaria Automática</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Genera horarios para hoy según la configuración predefinida del sistema.
                  </p>
                  <Button
                    onClick={() => handleGenerateSchedules('daily')}
                    disabled={scheduleManagement.generatingSchedules}
                    variant="primary"
                    className="w-full"
                  >
                    {scheduleManagement.generatingSchedules ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generar Hoy
                      </>
                    )}
                  </Button>
                </div>

                {/* Generar para fecha específica */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Generar para Fecha Específica</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Genera horarios para una fecha específica.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={scheduleManagement.selectedScheduleDate.toISOString().split('T')[0]}
                      onChange={(e) => setScheduleManagement(prev => ({
                        ...prev,
                        selectedScheduleDate: new Date(e.target.value)
                      }))}
                      className="flex-1"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Button
                      onClick={() => handleGenerateSchedules('date', {
                        date: scheduleManagement.selectedScheduleDate.toISOString().split('T')[0]
                      })}
                      disabled={scheduleManagement.generatingSchedules}
                      variant="secondary"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Generar
                    </Button>
                  </div>
                </div>

                {/* Generar para próximos N días */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Generar para Próximos Días</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Genera horarios en lote para los próximos días.
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={scheduleManagement.daysToGenerate}
                      onChange={(e) => setScheduleManagement(prev => ({
                        ...prev,
                        daysToGenerate: parseInt(e.target.value)
                      }))}
                      className="flex-1 p-2 border rounded"
                    >
                      <option value={7}>7 días</option>
                      <option value={14}>14 días</option>
                      <option value={30}>30 días</option>
                      <option value={60}>60 días</option>
                    </select>
                    <Button
                      onClick={() => handleGenerateSchedules('nextDays', {
                        days: scheduleManagement.daysToGenerate
                      })}
                      disabled={scheduleManagement.generatingSchedules}
                      variant="secondary"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Generar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Panel de Horarios Disponibles */}
            <Card className={styles.card()}>
              <CardHeader>
                <CardTitle className={styles.header('h3')}>
                  <Clock className="w-5 h-5 mr-2 inline" />
                  {t('schedules.available.title', 'Horarios del Día')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Selector de producto y fecha */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Servicio</label>
                    <select
                      value={selectedProduct?.id || ''}
                      onChange={(e) => {
                        const product = products.find(p => p.id === e.target.value);
                        setSelectedProduct(product);
                      }}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Seleccionar servicio...</option>
                      {products
                        .filter(product => product.type === 'service' || product.reservable)
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha</label>
                    <Input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Lista de horarios */}
                {selectedProduct && selectedDate ? (
                  <div className="space-y-2">
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Cargando horarios...</p>
                      </div>
                    ) : schedules.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Clock className="w-8 h-8 mx-auto mb-2" />
                        <p>No hay horarios para esta fecha</p>
                        <p className="text-xs">Genera horarios usando el panel de la izquierda</p>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {schedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                              schedule.is_available 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4" />
                              <div>
                                <p className="text-sm font-medium">
                                  {new Date(schedule.start_time).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })} - {new Date(schedule.end_time).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {schedule.is_available ? 'Disponible' : 'No disponible'}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleToggleScheduleAvailability(schedule.id, schedule.is_available)}
                              variant="ghost"
                              size="sm"
                              className="p-1"
                              title={schedule.is_available ? 'Desactivar' : 'Activar'}
                            >
                              {schedule.is_available ? (
                                <ToggleRight className="w-5 h-5 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Settings className="w-8 h-8 mx-auto mb-2" />
                    <p>Selecciona un servicio y fecha</p>
                    <p className="text-xs">Para ver y gestionar horarios</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Enriquecido para Reservas */}
      <EnhancedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingReservation ? 
          t('reservations.modal.edit', 'Editar Reserva') : 
          t('reservations.modal.create', 'Crear Reserva')
        }
        subtitle={editingReservation ? 
          t('reservations.modal.edit_subtitle', 'Modifica los detalles de la reserva') : 
          t('reservations.modal.create_subtitle', 'Programa una nueva reserva de servicio')
        }
        variant="default"
        size="md"
        loading={loading}
        testId="reservation-modal"
        footer={
          <div className="flex gap-3 justify-end">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={loading}
            >
              {t('action.cancel', 'Cancelar')}
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              variant="primary"
              form="reservation-form"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  {t('action.saving', 'Guardando...')}
                </>
              ) : (
                editingReservation ? t('action.update', 'Actualizar') : t('action.create', 'Crear')
              )}
            </Button>
          </div>
        }
      >
        <form id="reservation-form" onSubmit={handleSaveReservation} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className={styles.label()}>
                <Calendar className="w-4 h-4 inline mr-2" />
                {t('reservations.service', 'Servicio')}
              </label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                className={styles.input()}
                required
              >
                <option value="">Seleccionar servicio...</option>
                {products
                  .filter(product => product.type === 'service' || product.reservable)
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.price && `- $${product.price}`}
                    </option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className={styles.label()}>
                <User className="w-4 h-4 inline mr-2" />
                {t('reservations.client', 'Cliente')}
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                className={styles.input()}
                required
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={styles.label()}>
                  <Clock className="w-4 h-4 inline mr-2" />
                  {t('reservations.start_datetime', 'Fecha y Hora de Inicio')}
                </label>
                <Input
                  type="datetime-local"
                  value={formData.start_time ? formData.start_time.slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value ? `${e.target.value}:00Z` : '' }))}
                  className={styles.input()}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formato: DD/MM/AAAA HH:MM
                </p>
              </div>
              
              <div>
                <label className={styles.label()}>
                  <Clock className="w-4 h-4 inline mr-2" />
                  {t('reservations.duration', 'Duración (horas)')}
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className={styles.input()}
                  required
                >
                  <option value={1}>1 hora</option>
                  <option value={2}>2 horas</option>
                  <option value={3}>3 horas</option>
                  <option value={4}>4 horas</option>
                  <option value={6}>6 horas</option>
                  <option value={8}>8 horas</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Duración máxima: 8 horas
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium flex items-center">
                <XCircle className="w-4 h-4 mr-2" />
                {error}
              </p>
            </div>
          )}
        </form>
      </EnhancedModal>
    </div>
  );
};

export default Reservations;