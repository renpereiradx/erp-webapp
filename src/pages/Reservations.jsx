/**
 * Página de Reservas con Calendario Integrado
 * Siguiendo guía MVP: funcionalidad básica navegable
 * UX Decision: Calendario y reservas en la misma página para mejor flujo de usuario
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Plus, Search, Edit, Trash2, CheckCircle, XCircle, Settings, RefreshCw, ToggleLeft, ToggleRight, AlertCircle, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import DataState from '@/components/ui/DataState';
import EnhancedModal from '@/components/ui/EnhancedModal';
import ApiStatusIndicator from '@/components/ui/ApiStatusIndicator';
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
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

  // Función para cargar datos de forma explícita
  const handleLoadData = async () => {
    setLoadingData(true);
    try {
      await Promise.allSettled([
        fetchReservations(),
        fetchProducts(),
        fetchClients()
      ]);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Función para refrescar datos
  const handleRefreshData = async () => {
    setLoadingData(true);
    try {
      clearError();
      await Promise.allSettled([
        fetchReservations(),
        fetchProducts(),
        fetchClients()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Función para cargar horarios cuando el usuario seleccione fecha y producto
  const handleLoadSchedules = async () => {
    if (selectedDate && selectedProduct) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      await fetchAvailableSchedules(selectedProduct.id, dateStr);
    }
  };

  // Llamar a cargar horarios cuando cambie la fecha o producto (solo si ya hay datos cargados)
  useEffect(() => {
    if (dataLoaded && selectedDate && selectedProduct) {
      handleLoadSchedules();
    }
  }, [selectedDate, selectedProduct, dataLoaded]);

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

  // Estado inicial: sin datos cargados
  if (!dataLoaded && !loading && !error) {
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
        
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {t('reservations.welcome.title', 'Sistema de Reservas')}
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                  {t('reservations.welcome.description', 'Este sistema te permite gestionar reservas y horarios de servicios. Para comenzar, necesitas cargar los datos desde la API.')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleLoadData}
                    disabled={loadingData}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    {loadingData ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        {t('reservations.welcome.loading', 'Cargando...')}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        {t('reservations.welcome.load_data', 'Cargar Datos del Sistema')}
                      </>
                    )}
                  </Button>
                  <div className="sm:ml-2">
                    <ApiStatusIndicator showDetails={false} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estados de UI
  if ((loading || loadingData) && reservations.length === 0) {
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
        <DataState variant="loading" skeletonVariant="list" />
      </div>
    );
  }

  if (error) {
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
        
        <div className="space-y-6">
          <ApiStatusIndicator showDetails={true} className="max-w-2xl" />
          
          <DataState 
            variant="error" 
            title={t('reservations.error.title', 'Error de Conexión')}
            message={
              error.includes('API_UNAVAILABLE') || error.includes('503') ? 
              t('reservations.error.api_unavailable', 'No se pudo conectar con el servidor. Verifique su conexión a internet y que el servidor esté funcionando.') :
              error.includes('ENDPOINT_NOT_IMPLEMENTED') ?
              t('reservations.error.endpoint_not_implemented', 'Los servicios de productos aún no están configurados en el servidor. Contacte al administrador del sistema para completar la configuración de la API.') :
              error.includes('ENDPOINT_NOT_FOUND') ?
              t('reservations.error.endpoint_not_found', 'Algunas funcionalidades aún no están disponibles. El sistema está en proceso de configuración.') :
              error
            }
            onRetry={handleRefreshData}
          />
        </div>
      </div>
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
        extra={
          <div className="flex items-center gap-3">
            {dataLoaded && (
              <Button
                onClick={handleRefreshData}
                disabled={loadingData}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {loadingData ? t('action.refreshing', 'Actualizando...') : t('action.refresh', 'Actualizar')}
                </span>
              </Button>
            )}
            <div className="hidden sm:block">
              <ApiStatusIndicator showDetails={false} />
            </div>
          </div>
        }
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
                        const productId = e.target.value;
                        let product = products.find(p => p.id === productId);
                        
                        // Si no se encuentra en products, crear objeto temporal para IDs conocidos
                        if (!product && productId.startsWith('BT_Cancha_')) {
                          product = {
                            id: productId,
                            name: productId === 'BT_Cancha_1_xyz123abc' ? 'Cancha de Beach Tennis 1' : 'Cancha de Beach Tennis 2',
                            type: 'service',
                            reservable: true
                          };
                        }
                        
                        setSelectedProduct(product);
                      }}
                      className={styles.input()}
                    >
                      <option value="">
                        {t('reservations.select_service', 'Seleccionar servicio...')}
                      </option>
                      {/* Opción temporal: IDs conocidos del sistema */}
                      <optgroup label="Servicios Conocidos (Temporal)">
                        <option value="BT_Cancha_1_xyz123abc">Cancha de Beach Tennis 1</option>
                        <option value="BT_Cancha_2_def456ghi">Cancha de Beach Tennis 2</option>
                      </optgroup>
                      {/* Servicios cargados dinámicamente */}
                      {products && products.length > 0 && (
                        <optgroup label="Servicios Cargados">
                          {products
                            .filter(product => product.type === 'service' || product.reservable)
                            .map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}{product.price ? ` - $${product.price}` : ''}
                              </option>
                            ))
                          }
                        </optgroup>
                      )}
                      {(!products || products.length === 0) && (
                        <option value="" disabled>
                          {t('reservations.no_services_available', 'No hay servicios disponibles')}
                        </option>
                      )}
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
                      {clients && clients.length > 0 ? (
                        clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {t('reservations.no_clients_available', 'No hay clientes disponibles')}
                        </option>
                      )}
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
                        <div className="p-4 text-center text-muted-foreground bg-gray-50 dark:bg-gray-800 rounded-md mt-2 border">
                          <Clock className="w-8 h-8 mx-auto mb-3 text-muted-foreground/60" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              {t('reservations.no_schedules_available', 'Sin horarios disponibles')}
                            </p>
                            <p className="text-xs text-muted-foreground/80">
                              {t('reservations.no_schedules_help', 'Prueba seleccionando otra fecha, producto o contacta al administrador para generar horarios.')}
                            </p>
                          </div>
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
          {/* Nueva sección de verificación de horarios disponibles */}
          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className={styles.header('h3')}>
                <Search className="w-5 h-5 mr-2 inline" />
                Verificar Horarios Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Fecha a consultar</label>
                    <Input
                      type="date"
                      value={generalQuery.date}
                      onChange={(e) => setGeneralQuery(prev => ({ ...prev, date: e.target.value, hasChecked: false, results: null }))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleCheckAvailableSchedules}
                      disabled={generalQuery.isQuerying || !generalQuery.date}
                      variant="primary"
                      className="flex items-center gap-2"
                    >
                      {generalQuery.isQuerying ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Consultar
                    </Button>
                  </div>
                </div>

                {/* Mostrar estado de los horarios */}
                {generalQuery.hasChecked && (
                  <div className="p-4 rounded-lg border">
                    {generalQuery.results?.count > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">
                              {generalQuery.results.count} horarios {
                                generalQuery.date === new Date().toISOString().split('T')[0] 
                                  ? 'programados para hoy' 
                                  : `disponibles para ${generalQuery.date}`
                              }
                            </span>
                          </div>
                          <Button
                            onClick={handleOpenSchedulesModal}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Ver más
                          </Button>
                        </div>
                        
                        {/* Servicios disponibles - agrupados por servicio */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(() => {
                            // Agrupar horarios por servicio
                            const serviceGroups = {};
                            generalQuery.results.schedules?.slice(0, 4).forEach(schedule => {
                              const serviceName = schedule.product_name;
                              if (!serviceGroups[serviceName]) {
                                serviceGroups[serviceName] = {
                                  name: serviceName,
                                  total: 0,
                                  available: 0,
                                  schedules: []
                                };
                              }
                              serviceGroups[serviceName].total += 1;
                              if (schedule.is_available) serviceGroups[serviceName].available += 1;
                              serviceGroups[serviceName].schedules.push(schedule);
                            });
                            
                            return Object.values(serviceGroups).map((service, index) => (
                              <Card key={index} className={styles.card()}>
                                <CardContent className="p-3">
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-medium text-sm mb-1">{service.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {service.total} horarios
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                            {service.available} disponibles
                                          </span>
                                        </div>
                                      </div>
                                      <div className={`w-3 h-3 rounded-full ${
                                        service.available > 0 ? 'bg-green-500' : 'bg-gray-400'
                                      }`}></div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <Badge 
                                        variant={service.available > 0 ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {service.available > 0 ? 'Disponible' : 'Sin disponibilidad'}
                                      </Badge>
                                      
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs"
                                        onClick={() => handleOpenSchedulesModal(service.schedules, `Horarios de ${service.name}`)}
                                      >
                                        <Eye className="w-3 h-3 mr-1" />
                                        Ver
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ));
                          })()
                          }
                        </div>
                        
                        {/* Resumen total */}
                        {generalQuery.results.schedules?.length > 4 && (
                          <div className="text-center text-sm text-muted-foreground">
                            {(() => {
                              const serviceGroups = {};
                              generalQuery.results.schedules?.forEach(schedule => {
                                const serviceName = schedule.product_name;
                                if (!serviceGroups[serviceName]) serviceGroups[serviceName] = true;
                              });
                              const totalServices = Object.keys(serviceGroups).length;
                              return `${totalServices} servicios con ${generalQuery.results.schedules?.length} horarios totales`;
                            })()
                            }
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                          <div className="font-medium">No hay horarios generados para {generalQuery.date}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Utiliza las herramientas de generación para crear horarios para esta fecha.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
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
                        const productId = e.target.value;
                        let product = products.find(p => p.id === productId);
                        
                        // Si no se encuentra en products, crear objeto temporal para IDs conocidos
                        if (!product && productId.startsWith('BT_Cancha_')) {
                          product = {
                            id: productId,
                            name: productId === 'BT_Cancha_1_xyz123abc' ? 'Cancha de Beach Tennis 1' : 'Cancha de Beach Tennis 2',
                            type: 'service',
                            reservable: true
                          };
                        }
                        
                        setSelectedProduct(product);
                      }}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Seleccionar servicio...</option>
                      {/* Opción temporal: IDs conocidos del sistema */}
                      <optgroup label="Servicios Conocidos (Temporal)">
                        <option value="BT_Cancha_1_xyz123abc">Cancha de Beach Tennis 1</option>
                        <option value="BT_Cancha_2_def456ghi">Cancha de Beach Tennis 2</option>
                      </optgroup>
                      {/* Servicios cargados dinámicamente */}
                      {products && products.length > 0 && (
                        <optgroup label="Servicios Cargados">
                          {products
                            .filter(product => product.type === 'service' || product.reservable)
                            .map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))
                          }
                        </optgroup>
                      )}
                      {(!products || products.length === 0) && (
                        <option value="" disabled>
                          {t('reservations.no_services_available', 'No hay servicios disponibles')}
                        </option>
                      )}
                    </select>
                    {selectedProduct?.id?.startsWith('BT_Cancha_') && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        📝 Usando ID directo del sistema (temporal)
                      </p>
                    )}
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
                      <div className="text-center py-8 text-muted-foreground border border-dashed border-muted rounded-lg bg-muted/5">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                        <div className="space-y-2">
                          <p className="font-medium">{t('schedules.no_schedules', 'Sin horarios para esta fecha')}</p>
                          <p className="text-xs text-muted-foreground/70">
                            {t('schedules.generate_help', 'Utiliza el panel de la izquierda para generar horarios o contacta al administrador del sistema')}
                          </p>
                        </div>
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
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-muted rounded-lg bg-muted/5">
                    <Settings className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <div className="space-y-2">
                      <p className="font-medium">{t('schedules.select_service_date', 'Selecciona servicio y fecha')}</p>
                      <p className="text-xs text-muted-foreground/70">
                        {t('schedules.select_help', 'Elige un servicio y una fecha para ver y gestionar los horarios disponibles')}
                      </p>
                    </div>
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
                {/* Opción temporal: IDs conocidos del sistema */}
                <optgroup label="Servicios Conocidos (Temporal)">
                  <option value="BT_Cancha_1_xyz123abc">Cancha de Beach Tennis 1</option>
                  <option value="BT_Cancha_2_def456ghi">Cancha de Beach Tennis 2</option>
                </optgroup>
                {/* Servicios cargados dinámicamente */}
                {products && products.length > 0 && (
                  <optgroup label="Servicios Cargados">
                    {products
                      .filter(product => product.type === 'service' || product.reservable)
                      .map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} {product.price ? `- $${product.price}` : ''}
                        </option>
                      ))
                    }
                  </optgroup>
                )}
                {(!products || products.length === 0) && (
                  <option value="" disabled>
                    {t('reservations.no_services_available', 'No hay servicios disponibles')}
                  </option>
                )}
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
                {clients && clients.length > 0 ? (
                  clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {t('reservations.no_clients_available', 'No hay clientes disponibles')}
                  </option>
                )}
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
      
      {/* Modal de Detalles de Horarios */}
      {schedulesModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseSchedulesModal}
          />
          
          {/* Modal Content */}
          <Card className={`relative w-full max-w-4xl max-h-[90vh] ${styles.card()} shadow-2xl`}>
            {/* Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{schedulesModal.title}</CardTitle>
                <Button
                  onClick={handleCloseSchedulesModal}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Se encontraron {schedulesModal.schedules.length} horarios para {schedulesModal.date}
              </p>
            </CardHeader>
            
            {/* Content */}
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Grid de horarios completo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {schedulesModal.schedules.map((schedule, index) => (
                  <Card key={index} className={styles.card()}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-sm flex-1 pr-2">{schedule.product_name}</h3>
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            schedule.is_available ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(schedule.start_time).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} - {new Date(schedule.end_time).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(schedule.start_time).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            {Math.round((new Date(schedule.end_time) - new Date(schedule.start_time)) / (1000 * 60))} min
                          </span>
                          <Badge 
                            variant={schedule.is_available ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {schedule.is_available ? 'Disponible' : 'Ocupado'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Resumen */}
              <Card className={styles.card()}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">{schedulesModal.schedules.length}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {schedulesModal.schedules.filter(s => s.is_available).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Disponibles</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-600">
                        {schedulesModal.schedules.filter(s => !s.is_available).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Ocupados</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {[...new Set(schedulesModal.schedules.map(s => s.product_name))].length}
                      </div>
                      <div className="text-xs text-muted-foreground">Servicios</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reservations;