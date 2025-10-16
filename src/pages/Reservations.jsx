/**
 * Página de Reservas con Calendario Integrado
 * Siguiendo guía MVP: funcionalidad básica navegable
 * UX Decision: Calendario y reservas en la misma página para mejor flujo de usuario
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, User, Plus, Search, Edit, Trash2, CheckCircle, XCircle, Settings, RefreshCw, ToggleLeft, ToggleRight, AlertCircle, Eye, X, AlertTriangle, Play, MapPin, ArrowRight, Zap, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataState from '@/components/ui/DataState';
import EmptyState from '@/components/ui/EmptyState';
import EnhancedModal from '@/components/ui/EnhancedModal';
import ApiStatusIndicator from '@/components/ui/ApiStatusIndicator';
import { useI18n } from '@/lib/i18n';
import {
  formatDateInParaguayTimezone,
  formatDateTimeInParaguayTimezone,
  calculateDurationInMinutes,
  convertParaguayTimeToUTC,
  formatReserveForDisplay,
  formatReserveDate
} from '@/utils/timeUtils';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useAnnouncement } from '@/contexts/AnnouncementContext';

// Stores
import useReservationStore from '@/store/useReservationStore';
import useProductStore from '@/store/useProductStore';
import useClientStore from '@/store/useClientStore';

// API
import { apiService as apiClient } from '@/services/api';

// Componentes
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import ClientCardSelector from '@/components/ClientCardSelector';

// Componente de pasos del flujo de reserva
const ReservationSteps = ({ currentStep, steps }) => {
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

const Reservations = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  const { announceSuccess, announceError } = useAnnouncement();

  // Estados del store
  const {
    reservations,
    schedules,
    loading,
    error,
    dateFilter,
    fetchReservations,
    setDateFilter,
    fetchAvailableSchedules,
    fetchAllSchedulesByProductAndDate, // 🆕 Nuevo método para obtener TODOS los horarios
    createReservation,
    updateReservation,
    cancelReservation,
    confirmReservation,
    updateScheduleAvailability,
    generateDailySchedules,
    generateSchedulesForDate,
    generateSchedulesForNextDays,
    generateSchedulesForDateWithCustomRange,
    checkAvailableSchedulesForDate = () => Promise.resolve({ count: 0, schedules: [] }),
    clearError,
    clearSchedules
  } = useReservationStore();

  const { products, fetchProducts, fetchServiceCourts } = useProductStore();
  const { clients, fetchClients } = useClientStore();

  // Estados locales para UI
  const [activeTab, setActiveTab] = useState('create');
  
  // Estados para el flujo de creación de reservas (wizard)
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedClient, setSelectedClient] = useState(''); // String ID, no objeto ni null
  const [selectedDuration, setSelectedDuration] = useState(1); // Duración seleccionada por el usuario
  
  // Helper para obtener los datos completos del cliente seleccionado
  const getSelectedClientData = () => {
    return selectedClient ? clients.find(client => client.id === selectedClient) : null;
  };
  const [searchTerm, setSearchTerm] = useState('');
  // Estados para input inteligente
  const [smartSearchTerm, setSmartSearchTerm] = useState('');
  const [searchType, setSearchType] = useState(null); // 'client_id', 'client_name', 'product_id'
  const [smartSearchLoading, setSmartSearchLoading] = useState(false);

  // Estados para filtro de fechas
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
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
    daysToGenerate: 7,
    customRange: {
      targetDate: '',
      startHour: 6,
      endHour: 23,
      selectedProducts: []
    }
  });

  // Estados para consulta general de horarios
  const [generalQuery, setGeneralQuery] = useState({
    date: new Date().toISOString().split('T')[0],
    isQuerying: false,
    hasChecked: false,
    results: null
  });

  // Definir pasos del flujo
  const reservationSteps = [
    { id: 'service', label: 'Servicio', shortLabel: 'Servicio' },
    { id: 'schedule', label: 'Fecha y Hora', shortLabel: 'Horario' },
    { id: 'client', label: 'Cliente', shortLabel: 'Cliente' },
    { id: 'confirm', label: 'Confirmar', shortLabel: 'Confirmar' }
  ];

  // Estados para modal de horarios
  const [schedulesModal, setSchedulesModal] = useState({
    isOpen: false,
    schedules: [],
    title: '',
    date: ''
  });

  // Estados para modal de selección de servicios
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Estado para tracking si se han buscado horarios
  const [schedulesSearched, setSchedulesSearched] = useState(false);
  const [generatingSchedules, setGeneratingSchedules] = useState(false);
  
  // Función para cargar servicios de canchas
  const handleLoadServices = async () => {
    try {
      const services = await fetchServiceCourts();
      setAvailableServices(Array.isArray(services) ? services : []);
    } catch (error) {
      setAvailableServices([]);
    }
  };

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
    } finally {
      setLoadingData(false);
    }
  };

  // Función para cargar horarios EXPLÍCITAMENTE cuando el usuario lo solicite
  const handleLoadSchedules = async () => {
    if (selectedDate && selectedProduct) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      console.log('🕐 Loading ALL schedules (available + unavailable) for:', { product: selectedProduct.name, date: dateStr });
      setSchedulesSearched(false); // Reset search state

      // 🆕 Usar el nuevo endpoint que devuelve TODOS los horarios
      await fetchAllSchedulesByProductAndDate(selectedProduct.id, dateStr);
      setSchedulesSearched(true); // Mark as searched

      // Debug: verificar disponibilidad
      if (schedules.length > 0) {
        const available = schedules.filter(s => s.is_available).length;
        const unavailable = schedules.filter(s => !s.is_available).length;
        console.log(`📊 Total: ${schedules.length} | Disponibles: ${available} | Ocupados: ${unavailable}`);
      }
    }
  };

  // Función para generar horarios desde el botón de "Sin horarios"
  const handleGenerateSchedulesForButton = async () => {
    if (!selectedDate) return;
    
    setGeneratingSchedules(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Usar la nueva API flexible con auto-descubrimiento
      const result = await generateSchedulesForDate(dateStr);
      
      // Refrescar horarios después de generación
      if (selectedProduct) {
        await handleLoadSchedules();
      }
    } catch (error) {
      setError('Error al generar horarios. Por favor intenta nuevamente.');
    } finally {
      setGeneratingSchedules(false);
    }
  };

  // NO llamar automáticamente a la API - solo cuando el usuario lo solicite explícitamente

  // Filtrar reservas y aplicar formato de auditoría
  const filteredReservations = reservations
    .filter(reservation =>
      reservation.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map(reservation => {
      return formatReserveForDisplay(reservation);
    }); // Agregar información de auditoría formateada

  // Funciones para búsqueda inteligente
  const detectSearchType = (term) => {
    if (!term || term.length < 2) return null;

    // Detectar IDs de cliente (patrones comunes: CLI_, FjQ0Q2xHR, etc.)
    if (term.match(/^(CLI_|[A-Z0-9]{8,})/i)) {
      return 'client_id';
    }

    // Detectar IDs de producto (patrones comunes: CANCHA-01, BT_Cancha_, etc.)
    if (term.match(/^(CANCHA-|BT_|[A-Z]+-[0-9]+|[A-Z_]+[0-9])/i)) {
      return 'product_id';
    }

    // Si contiene espacios o caracteres típicos de nombres, es un nombre
    if (term.match(/[\s\-\.]/)) {
      return 'client_name';
    }

    // Si es solo letras sin guiones ni números, probablemente es un nombre
    if (term.match(/^[a-záéíóúñ\s]+$/i)) {
      return 'client_name';
    }

    // Por defecto, tratar como nombre de cliente
    return 'client_name';
  };

  const performSmartSearch = async (term) => {
    if (!term || term.length < 2) {
      // Si el término está vacío, recargar todas las reservas
      fetchReservations();
      setSearchType(null);
      return;
    }

    setSmartSearchLoading(true);
    const detectedType = detectSearchType(term);
    setSearchType(detectedType);

    try {
      let result = [];

      switch (detectedType) {
        case 'client_id': {
          // Buscar directamente por client_id - validar que el cliente esté activo
          try {
            // Primero verificar que el cliente existe y está activo
            const client = clients.find(c => c.id === term);
            if (client && client.status !== false && client.state !== false) {
              result = await fetchReservationsByClient(term);
            } else if (client && (client.status === false || client.state === false)) {
              setError('El cliente está inactivo. Solo se pueden buscar clientes activos.');
              result = [];
            } else {
              // Si no está en la lista local, intentar buscar de todos modos
              result = await fetchReservationsByClient(term);
            }
          } catch (err) {
            result = [];
          }
          break;
        }

        case 'client_name': {
          // Primero buscar el cliente por nombre, luego sus reservas
          try {
            const clientResult = await apiClient.get(`/client/name/${encodeURIComponent(term)}`);
            // Validar que el cliente exista Y esté activo
            if (clientResult && clientResult.id && clientResult.status !== false && clientResult.state !== false) {
              result = await fetchReservationsByClient(clientResult.id);
            } else if (clientResult && clientResult.id && (clientResult.status === false || clientResult.state === false)) {
              // Cliente encontrado pero inactivo
              setError('El cliente está inactivo. Solo se pueden buscar clientes activos.');
              result = [];
            } else {
              result = [];
            }
          } catch (err) {
            result = [];
          }
          break;
        }

        case 'product_id':
          result = await fetchReservationsByProduct(term);
          break;

        default:
          result = [];
      }

      // Actualizar las reservas mostradas
      setReservations(Array.isArray(result) ? result : []);

    } catch (error) {
      setError(`Error buscando por ${detectedType}: ${error.message}`);
    } finally {
      setSmartSearchLoading(false);
    }
  };

  // Handlers
  // Handlers del flujo de reserva
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setCurrentStep(2);
    setSchedulesSearched(false); // Reset search state when product changes
    clearSchedules(); // Limpiar horarios del servicio anterior
    // NO cargar horarios automáticamente - el usuario debe hacer click en "Buscar Horarios"
  };

  const handleDateChange = (date) => {
    // Si date es undefined, significa que el usuario está deseleccionando
    // En ese caso, no hacemos nada (mantenemos la fecha actual)
    if (date === undefined) {
      return;
    }
    
    // Validate date before setting
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return;
    }
    
    setSelectedDate(date);
    setSelectedTime('');
    setSchedulesSearched(false); // Reset search state when date changes
    // Reset duration to default when date changes
    setSelectedDuration(1);
    setFormData(prev => ({ ...prev, duration: 1 }));
    // NO cargar horarios automáticamente - el usuario debe hacer click en "Buscar Horarios"
  };

  const handleSelectTime = (displayTime, isoTime, endTime) => {
    setSelectedTime(displayTime);
    // isoTime ya viene en UTC desde la API, no necesita conversión adicional
    setFormData(prev => ({ 
      ...prev, 
      start_time: isoTime,
      duration: selectedDuration 
    }));
    setCurrentStep(3);
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    // Auto-avance inmediato al paso final
    setTimeout(() => {
      setCurrentStep(4);
    }, 500); // Pequena pausa para que el usuario vea la selección
  };

  const handleCreateReservation = async () => {
    if (!selectedProduct || !formData.start_time || !selectedClient) {
      alert('Por favor completa todos los campos obligatorios (producto, horario y cliente)');
      return;
    }

    // Si no hay conexión, mostrar mensaje informativo
    if (error) {
      alert('No se puede crear la reserva sin conexión al servidor. Intenta reconectarte primero.');
      return;
    }

    const reservationData = {
      action: 'create',
      product_id: selectedProduct.id,
      client_id: selectedClient, // selectedClient ya es el ID
      start_time: formData.start_time,
      duration: formData.duration || 1
    };

    try {
      const result = await createReservation(reservationData);

      // ⚠️ VERIFICAR SI LA OPERACIÓN FUE EXITOSA
      if (!result || result.success === false) {
        // Error del backend
        const errorMessage = result?.error || 'Error desconocido al crear la reserva';

        // Mostrar error específico según el tipo
        if (errorMessage.includes('No price found')) {
          const productName = selectedProduct?.name || 'este producto';
          announceError(
            `❌ No se puede reservar ${productName}: No tiene precio configurado. ` +
            `Por favor, configura un precio en la sección de Productos antes de crear reservas.`
          );
        } else if (errorMessage.includes('already reserved')) {
          announceError('❌ Este horario ya está reservado. Por favor, selecciona otro horario disponible.');
        } else if (errorMessage.includes('not available')) {
          announceError('❌ El horario seleccionado ya no está disponible. Actualiza la búsqueda.');
        } else {
          announceError(`❌ Error al crear la reserva: ${errorMessage}`);
        }

        // No continuar con el reset del formulario
        return;
      }

      // ✅ Reserva creada exitosamente
      announceSuccess('✅ Reserva creada exitosamente');

      // 🔄 IMPORTANTE: Refrescar horarios después de crear reserva exitosamente
      if (selectedProduct && selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        await fetchAvailableSchedules(selectedProduct.id, dateStr);
      }

      // Reset del formulario
      setSelectedProduct(null);
      setSelectedDate(new Date());
      setSelectedTime('');
      setSelectedClient(null);
      setCurrentStep(1);
      setSchedulesSearched(false); // Reset para que el usuario pueda buscar nuevamente
      setFormData({
        product_id: '',
        client_id: '',
        start_time: '',
        duration: 1
      });

      // Cambiar a la tab de lista para ver la reserva creada
      setActiveTab('list');
    } catch (error) {
      const errorMsg = error?.message || error?.toString() || 'Error desconocido';
      announceError(`❌ Error al crear la reserva: ${errorMsg}. Por favor intenta de nuevo.`);
    }
  };

  const handleCreateReservationModal = () => {
    setEditingReservation(null);
    setFormData({
      product_id: selectedProduct?.id || '',
      client_id: selectedClient || '', // selectedClient ya es el ID string
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
    }
  };

  const handleCancelReservation = async (reservation) => {
    if (window.confirm(t('reservations.confirm_cancel', '¿Cancelar esta reserva?'))) {
      try {
        // Usar reserve_id como campo primario, fallback a id
        const reserveId = reservation.reserve_id || reservation.id;
        const result = await cancelReservation(reserveId);

        // Verificar si la operación fue exitosa
        if (!result || result.success === false) {
          const errorMessage = result?.error || 'Error desconocido al cancelar la reserva';
          announceError(`❌ Error al cancelar la reserva: ${errorMessage}`);
          return;
        }

        announceSuccess('✅ Reserva cancelada exitosamente');
      } catch (error) {
        const errorMsg = error?.message || error?.toString() || 'Error desconocido';
        announceError(`❌ Error al cancelar la reserva: ${errorMsg}`);
      }
    }
  };

  const handleConfirmReservation = async (reservation) => {
    if (window.confirm(t('reservations.confirm_confirm', '¿Confirmar esta reserva?'))) {
      try {
        const result = await confirmReservation(reservation.reserve_id || reservation.id);

        // Verificar si la operación fue exitosa
        if (!result || result.success === false) {
          const errorMessage = result?.error || 'Error desconocido al confirmar la reserva';
          announceError(`❌ Error al confirmar la reserva: ${errorMessage}`);
          return;
        }

        announceSuccess('✅ Reserva confirmada exitosamente');
      } catch (error) {
        const errorMsg = error?.message || error?.toString() || 'Error desconocido';
        announceError(`❌ Error al confirmar la reserva: ${errorMsg}`);
      }
    }
  };

  // Función para verificar horarios disponibles
  const handleCheckAvailableSchedules = async () => {
    if (!generalQuery?.date) return;
    
    setGeneralQuery(prev => ({ ...prev, isQuerying: true }));
    
    try {
      const result = checkAvailableSchedulesForDate ? 
        await checkAvailableSchedulesForDate(generalQuery.date) :
        { count: 0, schedules: [] };
        
      setGeneralQuery(prev => ({
        ...prev,
        isQuerying: false,
        hasChecked: true,
        results: result
      }));
    } catch (error) {
      setGeneralQuery(prev => ({
        ...prev,
        isQuerying: false,
        hasChecked: true,
        results: { count: 0, schedules: [] }
      }));
    }
  };

  // Función para abrir modal de horarios
  const handleOpenSchedulesModal = (schedules = null, title = null) => {
    const schedulesToShow = schedules || generalQuery?.results?.schedules || [];
    const modalTitle = title || `Horarios para ${generalQuery?.date || 'fecha seleccionada'}`;
    
    setSchedulesModal({
      isOpen: true,
      schedules: schedulesToShow,
      title: modalTitle,
      date: generalQuery?.date || ''
    });
  };

  // Función para cerrar modal de horarios
  const handleCloseSchedulesModal = () => {
    setSchedulesModal({
      isOpen: false,
      schedules: [],
      title: '',
      date: ''
    });
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
          // Usar la nueva API flexible - solo fecha
          result = await generateSchedulesForDate(params.date);
          break;
        case 'nextDays':
          result = await generateSchedulesForNextDays(params.days);
          break;
        case 'customRange':
          // Validaciones antes de generar
          if (!params.targetDate) {
            throw new Error('Fecha es requerida para generar con rango personalizado');
          }
          if (params.startHour !== undefined && params.endHour !== undefined && params.startHour >= params.endHour) {
            throw new Error('La hora de inicio debe ser menor que la hora de fin');
          }
          
          // Usar la nueva API flexible con opciones
          const options = {};
          if (params.startHour !== undefined) options.startHour = params.startHour;
          if (params.endHour !== undefined) options.endHour = params.endHour;
          if (params.productIds && params.productIds.length > 0) options.productIds = params.productIds;
          
          result = await generateSchedulesForDate(params.targetDate, options);
          break;
        case 'autoDiscovery':
          // Nuevo: generación con auto-descubrimiento completo
          result = await generateSchedulesForDate(params.targetDate);
          break;
        default:
          throw new Error('Tipo de generación no válido');
      }
      
      if (result && result.success) {
        // Recargar horarios disponibles
        if (selectedDate && selectedProduct) {
          const dateStr = selectedDate.toISOString().split('T')[0];
          fetchAvailableSchedules(selectedProduct.id, dateStr);
        }
      }
    } catch (error) {
      // Mostrar mensaje de error más específico
      setError(error.message || 'Error al generar horarios. Por favor intenta nuevamente.');
    } finally {
      setScheduleManagement(prev => ({ ...prev, generatingSchedules: false }));
    }
  };

  // 🆕 Procesar horarios separando disponibles de ocupados
  const processedSchedules = useMemo(() => {
    if (!schedules || schedules.length === 0 || !selectedProduct) {
      return { availableSlots: [], unavailableSlots: [] };
    }

    // Filtrar por producto
    const productSchedules = schedules.filter(s => s.product_id === selectedProduct.id);

    // Separar disponibles de ocupados ANTES de procesar
    const available = productSchedules.filter(s => s.is_available);
    const unavailable = productSchedules.filter(s => !s.is_available);

    const availableSlots = [];
    const sortedSchedules = available.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    
    // Crear slots consecutivos basados en la duración seleccionada
    for (let i = 0; i < sortedSchedules.length; i++) {
      const currentSchedule = sortedSchedules[i];
      
      // Verificar si hay slots consecutivos suficientes para la duración
      let consecutiveHours = 1;
      let endTime = currentSchedule.end_time;
      
      // Contar horas consecutivas disponibles
      for (let j = i + 1; j < sortedSchedules.length && consecutiveHours < selectedDuration; j++) {
        const nextSchedule = sortedSchedules[j];
        const currentEnd = new Date(endTime);
        const nextStart = new Date(nextSchedule.start_time);
        
        // Si el siguiente slot es inmediatamente después
        if (Math.abs(nextStart - currentEnd) <= 60000) { // 1 minuto de tolerancia
          consecutiveHours++;
          endTime = nextSchedule.end_time;
        } else {
          break;
        }
      }
      
      // Solo agregar si hay suficientes horas consecutivas
      if (consecutiveHours >= selectedDuration) {
        const startDate = new Date(currentSchedule.start_time);
        
        // Calcular el tiempo final basado en la duración seleccionada
        const actualEndDate = new Date(startDate.getTime() + (selectedDuration * 60 * 60 * 1000));
        
        const displayTime = startDate.toISOString().substr(11, 5);
        const displayEndTime = actualEndDate.toISOString().substr(11, 5);
        
        availableSlots.push({
          id: `${currentSchedule.id}-${selectedDuration}h`,
          start_time: currentSchedule.start_time,
          end_time: actualEndDate.toISOString(),
          displayTime,
          displayEndTime,
          duration: selectedDuration,
          durationText: `${selectedDuration} hora${selectedDuration > 1 ? 's' : ''}`,
          timeRange: `${displayTime} - ${displayEndTime}`,
          product_name: currentSchedule.product_name,
          product_id: currentSchedule.product_id,
          consecutiveAvailable: consecutiveHours
        });
      }
    }

    // 🆕 Procesar horarios NO disponibles para mostrarlos
    const unavailableSlots = unavailable
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .map(schedule => {
        const startDate = new Date(schedule.start_time);
        const endDate = new Date(schedule.end_time);
        const displayTime = startDate.toISOString().substr(11, 5);
        const displayEndTime = endDate.toISOString().substr(11, 5);

        return {
          id: `${schedule.id}-unavailable`,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          displayTime,
          displayEndTime,
          timeRange: `${displayTime} - ${displayEndTime}`,
          product_name: schedule.product_name,
          product_id: schedule.product_id,
          is_available: false,
          reserved_by: schedule.reserved_by || 'Ocupado',
          reserve_id: schedule.reserve_id,
          reserve_status: schedule.reserve_status
        };
      });

    return { availableSlots, unavailableSlots };
  }, [schedules, selectedDuration, selectedProduct]);

  // Destructurar para mantener compatibilidad con código existente
  const availableTimeSlots = processedSchedules.availableSlots;
  const unavailableTimeSlots = processedSchedules.unavailableSlots;

  // NO cargar datos automáticamente - solo cuando el usuario lo solicite explícitamente

  // Cargar servicios al inicializar el componente
  useEffect(() => {
    handleLoadServices();

    // Establecer modo básico como estado inicial
    const initTimer = setTimeout(() => {
      setDataLoaded(true);
    }, 100);

    return () => clearTimeout(initTimer);
  }, []);

  // Inicializar fechas del filtro desde el store o usar valores por defecto (último día)
  useEffect(() => {
    if (dateFilter.startDate && dateFilter.endDate) {
      // Usar fechas del store si existen
      setFilterStartDate(dateFilter.startDate);
      setFilterEndDate(dateFilter.endDate);
    } else {
      // Inicializar con último día (ayer a hoy)
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const startDate = yesterday.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      setFilterStartDate(startDate);
      setFilterEndDate(endDate);
    }
  }, [dateFilter]);

  // 🆕 Auto-cargar horarios cuando se selecciona fecha y producto
  useEffect(() => {
    if (selectedDate && selectedProduct && currentStep === 2) {
      handleLoadSchedules();
    }
  }, [selectedDate, selectedProduct, currentStep]);

  // Función para aplicar filtro de fechas
  const handleApplyDateFilter = async () => {
    if (!filterStartDate || !filterEndDate) {
      announceError('Por favor seleccione ambas fechas');
      return;
    }

    // Validar que start_date <= end_date
    if (new Date(filterStartDate) > new Date(filterEndDate)) {
      announceError('La fecha de inicio debe ser anterior o igual a la fecha de fin');
      return;
    }

    try {
      await fetchReservations({
        startDate: filterStartDate,
        endDate: filterEndDate
      });
      announceSuccess(`Reservas cargadas: ${filterStartDate} a ${filterEndDate}`);
    } catch (error) {
      announceError('Error al cargar reservas con el filtro de fechas');
    }
  };

  // Estado inicial: mostrar skeleton mientras carga automáticamente
  if (!dataLoaded && (loading || loadingData)) {
    return (
      <div className={styles.container()} data-testid="reservations-page">
        {/* Breadcrumb discreto para contexto */}
        <nav className="flex items-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{t('reservations.title', 'Reservas')}</span>
        </nav>
        
        {/* Loading skeleton */}
        <div className="space-y-6 animate-pulse">
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-8 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Tabs skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow">
            <div className="flex space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              ))}
            </div>
          </div>
          
          {/* Main content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left panel skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
            
            {/* Calendar skeleton */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/2"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          
          {/* Loading message */}
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
              <span className="font-medium">Cargando sistema de reservas...</span>
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
        {/* Breadcrumb discreto para contexto */}
        <nav className="flex items-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{t('reservations.title', 'Reservas')}</span>
        </nav>
        <DataState variant="loading" skeletonVariant="list" />
      </div>
    );
  }

  // Estado de error: mostrar mensaje útil pero permitir funcionalidad básica
  if (error && !dataLoaded) {
    return (
      <div className={styles.container()} data-testid="reservations-page">
        {/* Breadcrumb discreto para contexto */}
        <nav className="flex items-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{t('reservations.title', 'Reservas')}</span>
        </nav>
        
        <div className="space-y-6">
          {/* Error alert but not blocking */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Conexión con la API limitada
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  No se pudo cargar completamente los datos del servidor. Puedes usar la funcionalidad básica de reservas.
                </p>
                <Button
                  onClick={handleLoadData}
                  disabled={loadingData}
                  size="sm"
                  variant="outline"
                  className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                >
                  {loadingData ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Intentando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Intentar de nuevo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mostrar funcionalidad básica incluso con errores */}
          <div className={`rounded-lg p-6 ${styles.card('warning')}`}>
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <Calendar className="w-12 h-12 text-blue-500 mx-auto" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Modo Básico de Reservas
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm mb-6">
                El servidor no está disponible, pero puedes usar las funciones básicas con datos de ejemplo para explorar la interfaz.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button
                  onClick={() => {
                    setDataLoaded(true);
                    clearError();
                  }}
                  variant="primary"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Continuar en Modo Básico
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Se habilitará automáticamente en 5 segundos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container()} data-testid="reservations-page">
      {/* Breadcrumb discreto para contexto */}
      <nav className="flex items-center text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{t('reservations.title', 'Reservas')}</span>
      </nav>
      
      <div className="flex items-center justify-between mb-6">
        <div></div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            {!dataLoaded ? (
              <Button
                onClick={handleLoadData}
                disabled={loadingData}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {loadingData ? t('action.loading', 'Cargando...') : 'Cargar Datos'}
                </span>
              </Button>
            ) : (
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
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={styles.tab()}>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Reserva
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Lista de Reservas
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Gestión de Horarios
          </TabsTrigger>
        </TabsList>

        {/* Tab Nueva Reserva - Diseño Wizard Mejorado */}
        <TabsContent value="create" className="space-y-6" data-testid="reservations-create-tab">
          {/* Indicador de pasos con diseño mejorado */}
          <ReservationSteps currentStep={currentStep} steps={reservationSteps} />
          
          {/* Contenedor principal del wizard */}
          <div className="max-w-4xl mx-auto">
            {/* Paso 1: Selección de Servicio */}
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
                    Selecciona el Servicio
                  </CardTitle>
                  <p className="text-sm mt-2" style={{
                    color: 'var(--md-on-surface-variant, rgb(73, 69, 79))'
                  }}>
                    Elige el servicio que deseas reservar de la lista disponible
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Botón para abrir modal de selección de servicios */}
                  <div className="text-center">
                    <Button
                      onClick={() => {
                        setShowServiceModal(true);
                        handleLoadServices();
                      }}
                      variant="outline"
                      size="lg"
                      className="w-full h-16 text-lg"
                    >
                      <Search className="w-6 h-6 mr-3" />
                      Buscar y Seleccionar Servicio
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Haz clic para abrir el catálogo completo de servicios
                    </p>
                  </div>
                  
                  {/* Mostrar servicio seleccionado */}
                  {selectedProduct && (
                    <div className="p-4 rounded-lg border-2" style={{
                      background: 'var(--md-primary-container, rgba(233, 221, 255, 0.5))',
                      borderColor: 'var(--md-primary, rgb(103, 80, 164))'
                    }}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-primary text-lg">
                            {selectedProduct.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {selectedProduct.category_name || 'Servicio'} • {selectedProduct.price_formatted || 'Precio a consultar'}
                          </p>
                          {selectedProduct.stock_status && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`w-2 h-2 rounded-full ${
                                selectedProduct.stock_status === 'no_stock_tracking' ? 'bg-blue-500' : 
                                selectedProduct.stock_status === 'available' ? 'bg-green-500' :
                                selectedProduct.stock_status === 'limited_availability' ? 'bg-yellow-500' : 'bg-gray-500'
                              }`} />
                              <span className="text-xs text-muted-foreground">
                                {selectedProduct.stock_status === 'no_stock_tracking' ? 'Sin control de stock' :
                                 selectedProduct.stock_status === 'available' ? 'Disponible' :
                                 selectedProduct.stock_status === 'limited_availability' ? 'Disponibilidad limitada' :
                                 selectedProduct.stock_status === 'unavailable' ? 'No disponible' : selectedProduct.stock_status}
                              </span>
                            </div>
                          )}
                        </div>
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Paso 2: Selección de Fecha y Hora */}
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
                    Selecciona Fecha y Hora
                  </CardTitle>
                  <p className="text-sm mt-2" style={{
                    color: 'var(--md-on-surface-variant, rgb(73, 69, 79))'
                  }}>
                    Servicio: <strong>{selectedProduct?.name}</strong> • Elige cuándo quieres usar el servicio
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calendario mejorado y compacto */}
                    <div className="flex justify-center">
                      <div className="w-full max-w-sm">
                        <h3 className="font-semibold mb-4 flex items-center justify-center gap-2" style={{
                          fontSize: styles.theme?.includes('neo-brutalism') ? '1rem' : '0.9rem',
                          fontWeight: styles.theme?.includes('neo-brutalism') ? '800' : '600',
                          color: 'var(--foreground)',
                          textTransform: styles.theme?.includes('neo-brutalism') ? 'uppercase' : 'none',
                          letterSpacing: styles.theme?.includes('neo-brutalism') ? '0.05em' : 'normal'
                        }}>
                          <Calendar className={`w-5 h-5 ${
                            styles.theme?.includes('neo-brutalism') ? 'animate-bounce' : ''
                          }`} />
                          {styles.theme?.includes('neo-brutalism') ? 'SELECCIONAR FECHA' : 'Seleccionar Fecha'}
                        </h3>
                        
                        <div className={`rounded-lg p-3 ${
                          styles.theme?.includes('neo-brutalism')
                            ? 'border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white'
                            : styles.theme?.includes('material')
                              ? 'border-0 shadow-md bg-white rounded-2xl'
                              : styles.theme?.includes('fluent')
                                ? 'border border-gray-200/50 shadow-lg bg-white/90 backdrop-blur-sm rounded-xl'
                                : 'border shadow-sm bg-white calendar-container'
                        }`} style={{
                          borderColor: styles.theme?.includes('neo-brutalism') 
                            ? 'var(--border)' 
                            : 'var(--border)'
                        }}>
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateChange}
                            className={`w-full ${
                              styles.theme?.includes('neo-brutalism')
                                ? 'calendar-brutalist'
                                : styles.theme?.includes('material')
                                  ? 'calendar-material'
                                  : styles.theme?.includes('fluent')
                                    ? 'calendar-fluent'
                                    : 'calendar-default'
                            }`}
                            disabled={(date) => {
                              const today = new Date();
                              const yesterday = new Date(today);
                              yesterday.setDate(today.getDate() - 1);
                              return date < yesterday;
                            }}
                            modifiers={{
                              today: new Date(),
                              selected: selectedDate
                            }}
                            modifiersStyles={{
                              today: {
                                backgroundColor: styles.theme?.includes('neo-brutalism') 
                                  ? 'var(--secondary)' 
                                  : styles.theme?.includes('material')
                                    ? 'rgba(33, 150, 243, 0.12)'
                                    : 'var(--accent)',
                                color: styles.theme?.includes('neo-brutalism') 
                                  ? 'var(--secondary-foreground)' 
                                  : 'var(--primary)',
                                fontWeight: styles.theme?.includes('neo-brutalism') ? '800' : '700',
                                border: styles.theme?.includes('neo-brutalism') 
                                  ? '2px solid var(--primary)' 
                                  : styles.theme?.includes('material')
                                    ? '1px solid var(--primary)'
                                    : '1px solid var(--primary)',
                                borderRadius: styles.theme?.includes('neo-brutalism') ? '0' : '6px',
                                position: 'relative'
                              },
                              selected: {
                                backgroundColor: 'var(--primary)',
                                color: 'var(--primary-foreground)',
                                fontWeight: styles.theme?.includes('neo-brutalism') ? '800' : '700',
                                border: styles.theme?.includes('neo-brutalism') 
                                  ? '2px solid var(--border)' 
                                  : 'none',
                                borderRadius: styles.theme?.includes('neo-brutalism') ? '0' : '6px',
                                transform: styles.theme?.includes('neo-brutalism') ? 'scale(1.05)' : 'scale(1.02)',
                                boxShadow: styles.theme?.includes('neo-brutalism') 
                                  ? '2px 2px 0px 0px rgba(0,0,0,1)' 
                                  : '0 2px 6px rgba(0,0,0,0.15)'
                              }
                            }}
                            style={{
                              '--rdp-cell-size': '36px',
                              '--rdp-accent-color': 'var(--primary)',
                              '--rdp-background-color': 'var(--background)',
                              '--rdp-outline': '2px solid var(--primary)',
                              fontSize: styles.theme?.includes('neo-brutalism') ? '0.85rem' : '0.8rem',
                              fontWeight: styles.theme?.includes('neo-brutalism') ? '700' : '500'
                            }}
                          />
                          
                        </div>
                      </div>
                    
                    
                    {/* Estilos CSS directos para el calendario */}
                    <style>{`
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} {
                        max-width: 280px;
                        margin: 0 auto;
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-nav_button {
                        width: 36px !important;
                        height: 36px !important;
                        background: var(--primary) !important;
                        color: var(--primary-foreground) !important;
                        border: 2px solid var(--border) !important;
                        border-radius: ${styles.theme?.includes('neo-brutalism') ? '0' : '6px'} !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        font-weight: 600 !important;
                        transition: all 0.15s ease !important;
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-nav_button:hover {
                        transform: scale(1.05) !important;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important;
                        background: var(--accent) !important;
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-day {
                        width: 36px;
                        height: 36px;
                        border-radius: ${styles.theme?.includes('neo-brutalism') ? '0' : '6px'};
                        border: 1px solid transparent;
                        font-weight: ${styles.theme?.includes('neo-brutalism') ? '700' : '500'};
                        font-size: 0.8rem;
                        transition: all 0.15s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-day:hover {
                        background-color: ${styles.theme?.includes('neo-brutalism') ? 'var(--secondary)' : 'var(--accent)'};
                        border-color: ${styles.theme?.includes('neo-brutalism') ? 'var(--border)' : 'var(--primary)'};
                        transform: ${styles.theme?.includes('neo-brutalism') ? 'scale(1.03)' : 'scale(1.05)'};
                        box-shadow: ${styles.theme?.includes('neo-brutalism') ? '1px 1px 0px 0px rgba(0,0,0,1)' : '0 1px 4px rgba(0,0,0,0.1)'};
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-day_disabled {
                        color: var(--muted-foreground);
                        opacity: 0.4;
                        cursor: not-allowed;
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-head_cell {
                        width: 36px;
                        font-weight: ${styles.theme?.includes('neo-brutalism') ? '800' : '600'};
                        color: var(--muted-foreground);
                        font-size: 0.75rem;
                        text-transform: uppercase;
                        letter-spacing: ${styles.theme?.includes('neo-brutalism') ? '0.05em' : '0.02em'};
                        padding: 4px 0;
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-caption {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0.75rem 0;
                        margin-bottom: 0.75rem;
                        border-bottom: ${styles.theme?.includes('neo-brutalism') ? '2px solid var(--border)' : '1px solid var(--border)'};
                        position: relative;
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-caption_label {
                        font-size: ${styles.theme?.includes('neo-brutalism') ? '0.95rem' : '0.9rem'};
                        font-weight: ${styles.theme?.includes('neo-brutalism') ? '800' : '600'};
                        color: var(--foreground);
                        text-transform: ${styles.theme?.includes('neo-brutalism') ? 'uppercase' : 'none'};
                        letter-spacing: ${styles.theme?.includes('neo-brutalism') ? '0.05em' : 'normal'};
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-nav {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        display: flex;
                        gap: 8px;
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-nav:first-child {
                        left: 0;
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-nav:last-child {
                        right: 0;
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-tbody {
                        gap: 2px;
                      }
                      
                      .${styles.theme?.includes('neo-brutalism') ? 'calendar-brutalist' : styles.theme?.includes('material') ? 'calendar-material' : styles.theme?.includes('fluent') ? 'calendar-fluent' : 'calendar-default'} .rdp-row {
                        gap: 2px;
                        margin-bottom: 2px;
                      }
                          `}</style>
                        </div>
                      </div>

                    {/* Horarios disponibles - Auto-carga al seleccionar fecha */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <h3 className="text-sm font-semibold text-gray-700">Horarios Disponibles</h3>
                        {loading && (
                          <div className="ml-auto flex items-center gap-2 text-xs text-blue-600">
                            <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                            Cargando...
                          </div>
                        )}
                      </div>

                      {schedules.length === 0 ? (
                        <div className={`p-4 text-center rounded-lg border-2 border-dashed ${styles.card('secondary')}`}>
                          <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          {!schedulesSearched ? (
                            <>
                              <p className="text-sm font-medium mb-1">Selecciona una fecha en el calendario</p>
                              <p className="text-xs text-muted-foreground">
                                Los horarios se cargarán automáticamente
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium mb-2">No hay horarios disponibles para esta fecha</p>
                              <p className="text-sm text-muted-foreground mb-4">
                                {selectedDate?.toLocaleDateString('es-ES') || 'Sin fecha'} • {selectedProduct?.name}
                              </p>
                              <Button
                                onClick={handleGenerateSchedulesForButton}
                                disabled={generatingSchedules}
                                size="sm"
                                variant="outline"
                                className={styles.button('primary')}
                              >
                                {generatingSchedules ? (
                                  <>
                                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                    Generando...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Generar horarios
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div>
                          {/* Selector de duración */}
                          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                            <label className="block text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                              <Clock className="w-4 h-4 inline mr-2" />
                              Duración de la reserva
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              {[1, 2, 3, 4, 6, 8].map(hours => (
                                <Button
                                  key={hours}
                                  type="button"
                                  size="sm"
                                  variant={selectedDuration === hours ? "default" : "outline"}
                                  onClick={() => {
                                    setSelectedDuration(hours);
                                    setFormData(prev => ({ ...prev, duration: hours }));
                                    setSelectedTime(''); // Reset time selection when duration changes
                                  }}
                                  className={`transition-all ${
                                    selectedDuration === hours 
                                      ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                                      : 'hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                  }`}
                                >
                                  {hours}h
                                </Button>
                              ))}
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                              Selecciona la duración para ver horarios disponibles de {selectedDuration} hora{selectedDuration > 1 ? 's' : ''}
                            </p>
                          </div>
                          
                          {/* ✨ Diseño compacto en grid de 3 columnas */}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto p-1">
                            {availableTimeSlots.map(slot => (
                              <button
                                key={slot.id}
                                onClick={() => handleSelectTime(slot.displayTime, slot.start_time, slot.end_time)}
                                className={`px-3 py-2.5 transition-all border rounded-md text-left ${
                                  selectedTime === slot.displayTime
                                    ? 'bg-green-500 text-white border-green-600 shadow-md ring-2 ring-green-300'
                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-sm'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm truncate">{slot.timeRange}</div>
                                    <div className="text-xs opacity-75 truncate">{slot.durationText}</div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <Clock className={`w-3.5 h-3.5 ${
                                      selectedTime === slot.displayTime
                                        ? 'text-white'
                                        : 'text-green-600 dark:text-green-400'
                                    }`} />
                                  </div>
                                </div>
                                {slot.consecutiveAvailable > selectedDuration && (
                                  <div className="text-[10px] mt-0.5 opacity-75 truncate">
                                    +{slot.consecutiveAvailable - selectedDuration}h disponible
                                  </div>
                                )}
                              </button>
                            ))}
                            
                            {availableTimeSlots.length === 0 && unavailableTimeSlots.length === 0 && (
                              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="font-medium">No hay horarios disponibles</p>
                                <p className="text-sm">para reservas de {selectedDuration} hora{selectedDuration > 1 ? 's' : ''}</p>
                                <p className="text-xs mt-2 text-blue-600 dark:text-blue-400">
                                  💡 Intenta reducir la duración o cambiar la fecha
                                </p>
                              </div>
                            )}

                            {/* 🆕 Mostrar horarios OCUPADOS con diseño diferenciado */}
                            {unavailableTimeSlots.map(slot => (
                              <button
                                key={slot.id}
                                disabled
                                className="px-3 py-2.5 transition-all border rounded-md text-left bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 opacity-60 cursor-not-allowed"
                                title={`Reservado por: ${slot.reserved_by}`}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm truncate line-through text-gray-600 dark:text-gray-400">
                                      {slot.timeRange}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                      Ocupado
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <XCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                                  </div>
                                </div>
                                {slot.reserved_by && slot.reserved_by !== 'Ocupado' && (
                                  <div className="text-[10px] mt-0.5 text-gray-500 dark:text-gray-600 truncate">
                                    {slot.reserved_by}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

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
                    {selectedTime && (
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

            {/* Paso 3: Selección de Cliente */}
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
                    Selecciona Cliente
                  </CardTitle>
                  <p className="text-sm mt-2" style={{
                    color: 'var(--md-on-surface-variant, rgb(73, 69, 79))'
                  }}>
                    {selectedProduct?.name} • {selectedDate?.toLocaleDateString('es-ES') || 'Sin fecha'} • {selectedTime}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Nuevo selector de clientes con búsqueda inteligente y cards */}
                  <div data-testid="client-card-selector">
                    <ClientCardSelector
                      selectedClient={selectedClient}
                      onClientChange={handleSelectClient}
                    />
                  </div>
                  
                  {/* Mostrar información del cliente seleccionado con animación */}
                  {getSelectedClientData() && (
                    <div className="p-4 rounded-lg border-2 transform transition-all duration-500 animate-in fade-in slide-in-from-top-5" style={{
                      background: 'linear-gradient(135deg, var(--md-primary-container, rgba(233, 221, 255, 0.8)), var(--md-tertiary-container, rgba(255, 236, 239, 0.3)))',
                      borderColor: 'var(--md-primary, rgb(103, 80, 164))',
                      boxShadow: '0 4px 20px rgba(103, 80, 164, 0.15)'
                    }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 opacity-20 animate-pulse"></div>
                          <User className="w-6 h-6 text-primary relative z-10" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-primary text-lg">
                            ✅ {getSelectedClientData().name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-medium">
                            Cliente confirmado - ¡Listo para reservar!
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1 flex-1 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-green-600">Validado</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-600 font-bold text-3xl animate-bounce">✓</div>
                          <p className="text-xs text-green-600 font-bold">LISTO</p>
                        </div>
                      </div>
                    </div>
                  )}

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
                    {selectedClient && ( // selectedClient es un string, truthy si tiene valor
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
                    Confirmar Reserva
                  </CardTitle>
                  <p className="text-sm mt-2" style={{
                    color: 'var(--md-on-surface-variant, rgb(73, 69, 79))'
                  }}>
                    Revisa los detalles antes de confirmar
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Resumen de la reserva */}
                  <div className="p-6 rounded-lg border-2" style={{
                    background: 'var(--md-primary-container, rgba(233, 221, 255, 0.5))',
                    borderColor: 'var(--md-primary, rgb(103, 80, 164))'
                  }}>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-primary" />
                      Resumen de Reserva
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Servicio</p>
                            <p className="font-semibold">{selectedProduct?.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Fecha</p>
                            <p className="font-semibold">{selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || 'Fecha no seleccionada'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Hora</p>
                            <p className="font-semibold">{selectedTime}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Cliente</p>
                            <p className="font-semibold">{getSelectedClientData()?.name}</p>
                          </div>
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
                      onClick={handleCreateReservation}
                      variant="primary"
                      size="lg"
                      className="flex items-center gap-2 px-8"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Confirmar Reserva
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab Lista de Reservas */}
        <TabsContent value="list" className="space-y-6" data-testid="reservations-list-tab">
          {/* Búsqueda Inteligente */}
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Búsqueda Inteligente
                  {searchType && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {searchType === 'client_id' ? 'ID Cliente' :
                       searchType === 'client_name' ? 'Nombre Cliente' :
                       searchType === 'product_id' ? 'ID Producto' : ''}
                    </Badge>
                  )}
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSmartSearchTerm('');
                    setSearchType(null);
                    fetchReservations();
                  }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Todas
                </Button>
              </div>

              <div className="flex space-x-2">
                <div className="relative group flex-1">
                  {/* Icono dinámico basado en el tipo detectado */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    {smartSearchLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    ) : searchType === 'client_id' ? (
                      <User className="h-4 w-4 text-blue-500" />
                    ) : searchType === 'client_name' ? (
                      <User className="h-4 w-4 text-green-500" />
                    ) : searchType === 'product_id' ? (
                      <MapPin className="h-4 w-4 text-purple-500" />
                    ) : (
                      <Search className="h-4 w-4 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors" />
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Buscar por cliente (nombre o ID) o producto... Ej: Juan Pérez, CLI_123, CANCHA-01"
                    value={smartSearchTerm}
                    onChange={(e) => {
                      setSmartSearchTerm(e.target.value);
                      const detected = detectSearchType(e.target.value);
                      setSearchType(detected);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        performSmartSearch(smartSearchTerm);
                      }
                    }}
                    className={`${styles.input()} pl-11 pr-24 hover:border-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors w-full h-10`}
                    style={{ paddingLeft: '2.75rem', paddingRight: '6rem' }}
                    disabled={smartSearchLoading}
                  />

                  {/* Indicador del tipo de búsqueda */}
                  {smartSearchTerm && searchType && (
                    <div className="absolute inset-y-0 right-16 flex items-center pointer-events-none">
                      <span className="text-xs text-muted-foreground bg-background px-1 rounded">
                        {searchType === 'client_id' ? 'ID' :
                         searchType === 'client_name' ? 'Nombre' :
                         searchType === 'product_id' ? 'Producto' : ''}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => performSmartSearch(smartSearchTerm)}
                  disabled={smartSearchLoading || !smartSearchTerm || smartSearchTerm.length < 2}
                  variant="outline"
                >
                  {smartSearchLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Ejemplos de uso */}
              {!smartSearchTerm && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Ejemplos:</span>
                  <span className="ml-2">Juan Pérez</span>
                  <span className="mx-2">•</span>
                  <span>CLI_12345</span>
                  <span className="mx-2">•</span>
                  <span>CANCHA-01</span>
                </div>
              )}
            </div>
          </Card>

          {/* Filtro de Rango de Fechas */}
          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-5 h-5" />
                Filtrar por Rango de Fechas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Fecha Inicio
                  </label>
                  <Input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className={styles.input()}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Fecha Fin
                  </label>
                  <Input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className={styles.input()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleApplyDateFilter}
                    variant="primary"
                    className="flex-1"
                    disabled={!filterStartDate || !filterEndDate}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                  <Button
                    onClick={async () => {
                      // Reset a último día (ayer a hoy)
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);
                      const startDate = yesterday.toISOString().split('T')[0];
                      const endDate = today.toISOString().split('T')[0];
                      setFilterStartDate(startDate);
                      setFilterEndDate(endDate);
                      // Aplicar el filtro directamente
                      await fetchReservations({
                        startDate,
                        endDate
                      });
                      announceSuccess('Filtro restablecido al último día');
                    }}
                    variant="outline"
                    title="Restablecer a último día"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {dateFilter.startDate && dateFilter.endDate && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Mostrando reservas desde <strong>{dateFilter.startDate}</strong> hasta <strong>{dateFilter.endDate}</strong>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filtros Locales */}
          <div className="flex justify-between items-center">
            <div className="relative group max-w-md">
              {/* Icono de búsqueda - posición exacta estilo Google */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors" />
              </div>
              {/* Input campo - padding calculado para evitar superposición */}
              <input
                type="text"
                placeholder={t('reservations.search.placeholder', 'Filtrar resultados locales...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${styles.input()} pl-11 hover:border-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors w-full h-10`}
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
            <Button onClick={() => setActiveTab('create')} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Reserva
            </Button>
          </div>

          {/* Lista de reservas */}
          {!loading && filteredReservations.length === 0 ? (
            searchTerm ? (
              <EmptyState
                icon={Calendar}
                title="No se encontraron reservas"
                description="Intenta con otros términos de búsqueda"
                variant="search"
                data-testid="reservations-no-search-results"
              />
            ) : (
              <EmptyState
                icon={Calendar}
                title="No hay reservas"
                description="Comienza creando tu primera reserva de servicio"
                actionLabel="Nueva Reserva"
                onAction={() => setActiveTab('create')}
                variant="instruction"
                data-testid="reservations-empty-state"
              />
            )
          ) : (
            <div className="grid gap-4">
              {filteredReservations.map((reservation, index) => (
                <Card key={reservation.id || reservation.reserve_id || `reservation-${index}`} className={styles.card()}>
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
                            className="flex items-center gap-1"
                          >
                            {reservation.status === 'confirmed' && <span>✅</span>}
                            {reservation.status === 'cancelled' && <span>❌</span>}
                            {reservation.status === 'pending' && <span>⏳</span>}
                            {reservation.status === 'confirmed' ? 'Confirmada' :
                             reservation.status === 'cancelled' ? 'Cancelada' :
                             reservation.status === 'pending' ? 'Pendiente' :
                             t(`reservations.status.${reservation.status}`, reservation.status)}
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
                              <strong>Fecha:</strong> {formatDateInParaguayTimezone(reservation.start_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              <strong>Hora inicio:</strong> {new Date(reservation.start_time).toISOString().substr(11, 5)}
                            </span>
                          </div>
                          {reservation.end_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                <strong>Hora fin:</strong> {new Date(reservation.end_time).toISOString().substr(11, 5)}
                              </span>
                            </div>
                          )}
                          {reservation.duration && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                <strong>Duración:</strong> {reservation.duration} horas
                              </span>
                            </div>
                          )}
                          <div>
                            <strong>Total:</strong> ${reservation.total_amount?.toLocaleString() || '0'}
                          </div>
                          {(reservation.created_relative_display || reservation.reserve_date) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2 mt-2">
                              <History className="w-3 h-3" />
                              <span>
                                <strong>Creada:</strong> {reservation.created_relative_display || new Date(reservation.reserve_date).toLocaleString('es-PY')}
                                {reservation.created_full_display && (
                                  <span className="ml-1">({reservation.created_full_display})</span>
                                )}
                                {reservation.reserve_date && !reservation.created_relative_display && (
                                  <span className="ml-1">({new Date(reservation.reserve_date).toISOString().substr(0, 19).replace('T', ' ')})</span>
                                )}
                              </span>
                            </div>
                          )}
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
                        {reservation.status !== 'CONFIRMED' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleConfirmReservation(reservation)}
                            className="border-2 border-black hover:bg-green-100"
                            title={t('reservations.confirm', 'Confirmar')}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
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

        {/* Tab Gestión de Horarios - COMPACTO */}
        <TabsContent value="schedules" className="space-y-4" data-testid="schedules-management-tab">
          {/* Consultar Disponibilidad - Compacto */}
          <Card className={styles.card('primary')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Search className="w-4 h-4" />
                Consultar Disponibilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={generalQuery.date}
                    onChange={(e) => setGeneralQuery(prev => ({ ...prev, date: e.target.value, hasChecked: false, results: null }))}
                    className="w-full text-sm"
                  />
                </div>
                <Button
                  onClick={handleCheckAvailableSchedules}
                  disabled={generalQuery.isQuerying || !generalQuery.date}
                  size="sm"
                  className="px-4"
                >
                  {generalQuery.isQuerying ? (
                    <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Search className="w-3 h-3 mr-1.5" />
                      Consultar
                    </>
                  )}
                </Button>
              </div>

              {/* Resultados - Compacto */}
              {generalQuery.hasChecked && (
                <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {generalQuery.results?.count > 0 ? (
                    <div>
                      {/* Header compacto */}
                      <div className="bg-green-50 dark:bg-green-950/20 px-3 py-2 flex items-center justify-between border-b">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">
                            {generalQuery.results.count} horarios encontrados
                          </span>
                        </div>
                        <Button
                          onClick={handleOpenSchedulesModal}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver todos
                        </Button>
                      </div>
                        
                      {/* Lista de servicios - Compacto */}
                      <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 border-b">
                        <span className="font-medium">Servicios disponibles</span>
                      </div>
                      <div className="px-3 py-2 max-h-48 overflow-y-auto">
                        <div className="space-y-1.5">
                        {(() => {
                          // Agrupar horarios por servicio
                          const serviceGroups = {};
                          generalQuery.results.schedules?.forEach(schedule => {
                            const name = schedule.product_name;
                            if (!serviceGroups[name]) serviceGroups[name] = { name, available: 0, total: 0 };
                            serviceGroups[name].total++;
                            if (schedule.is_available) serviceGroups[name].available++;
                          });

                          return Object.values(serviceGroups).map((svc, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2">
                              <span className="text-sm font-medium truncate flex-1">{svc.name}</span>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-green-600 dark:text-green-400">{svc.available}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-gray-600 dark:text-gray-400">{svc.total}</span>
                              </div>
                            </div>
                          ));
                        })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-center bg-amber-50 dark:bg-amber-950/20">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Sin horarios para esta fecha
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Usa las herramientas de generación abajo
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Generación de Horarios - Compacto */}
            <Card className={styles.card()}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Generar Horarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Generación rápida */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                    Rápido (Hoy)
                  </label>
                  <Button
                    onClick={() => handleGenerateSchedules('daily')}
                    disabled={scheduleManagement.generatingSchedules}
                    className="w-full"
                    size="sm"
                  >
                    {scheduleManagement.generatingSchedules ? (
                      <>
                        <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-2" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1.5" />
                        Generar Hoy
                      </>
                    )}
                  </Button>
                </div>

                {/* Fecha específica - Compacto */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                    Fecha Específica
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={scheduleManagement.selectedScheduleDate.toISOString().split('T')[0]}
                      onChange={(e) => setScheduleManagement(prev => ({
                        ...prev,
                        selectedScheduleDate: new Date(e.target.value)
                        }))}
                        className={`text-sm ${styles.input()}`}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    <Button
                      onClick={() => handleGenerateSchedules('date', {
                        date: scheduleManagement.selectedScheduleDate.toISOString().split('T')[0]
                      })}
                      disabled={scheduleManagement.generatingSchedules}
                      size="sm"
                      className="px-3"
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Generar
                    </Button>
                  </div>
                </div>

                {/* Generación masiva - Compacto */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                    Generación Masiva (Próximos N días)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={scheduleManagement.daysToGenerate}
                      onChange={(e) => setScheduleManagement(prev => ({
                        ...prev,
                        daysToGenerate: parseInt(e.target.value)
                      }))}
                      className="flex-1 text-sm px-2 py-1.5 border rounded"
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
                      size="sm"
                      className="px-3"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Generar
                    </Button>
                  </div>
                </div>

                {/* Estado de generación */}
                {scheduleManagement.generatingSchedules && (
                  <div className={`rounded-xl p-4 text-center ${styles.card('primary')}`}>
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full text-primary"></div>
                      <div>
                        <p className="font-medium text-primary">Generando horarios...</p>
                        <p className="text-xs text-muted-foreground">Por favor espera mientras procesamos tu solicitud</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 🎨 Panel mejorado de Horarios Disponibles */}
            <Card className={`${styles.card()} bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800`}>
              <CardHeader>
                <CardTitle className={`${styles.header('h3')} text-emerald-900 dark:text-emerald-100`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                      <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold">{t('schedules.available.title', 'Monitor de Horarios')}</span>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-normal mt-0.5">
                        Consulta horarios específicos por servicio y fecha
                      </p>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Selector de producto y fecha */}
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium">Servicio</label>
                      <Button
                        onClick={handleLoadServices}
                        disabled={loadingServices}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        {loadingServices ? (
                          <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                        ) : (
                          <RefreshCw className="w-3 h-3 mr-1" />
                        )}
                        Cargar
                      </Button>
                    </div>
                    <select
                      value={selectedProduct?.id || ''}
                      onChange={(e) => {
                        const productId = e.target.value;
                        let product = availableServices.find(p => p.id === productId) || 
                                     products.find(p => p.id === productId);
                        
                        
                        setSelectedProduct(product);
                      }}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Seleccionar servicio...</option>
                      {/* Servicios enriquecidos */}
                      {availableServices && availableServices.length > 0 && (
                        <optgroup label="Servicios de Canchas">
                          {availableServices
                            .filter(service => service.state) // Solo servicios activos
                            .map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name} - {service.price_formatted || 'Sin precio'}
                              </option>
                            ))
                          }
                        </optgroup>
                      )}
                      {/* Servicios cargados dinámicamente */}
                      {products && products.length > 0 && (
                        <optgroup label="Otros Servicios">
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
                      {(!availableServices || availableServices.length === 0) && (!products || products.length === 0) && (
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
                      value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
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
                                  {new Date(schedule.start_time).toISOString().substr(11, 5)} - {new Date(schedule.end_time).toISOString().substr(11, 5)}
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
                  clients
                    .filter(client => client.status !== false && client.state !== false)
                    .map((client) => (
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
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    start_time: e.target.value ? convertParaguayTimeToUTC(`${e.target.value}:00`) : '' 
                  }))}
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
      
      {/* Modal de Selección de Servicios */}
      <EnhancedModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        title="Seleccionar Servicio"
        subtitle="Elige el servicio que deseas reservar"
        variant="default"
        size="lg"
        loading={loadingServices}
        testId="service-selection-modal"
        footer={
          <div className="flex gap-3 justify-end">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => setShowServiceModal(false)}
              disabled={loadingServices}
            >
              Cancelar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {loadingServices ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando servicios disponibles...</p>
            </div>
          ) : availableServices.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No hay servicios disponibles</h3>
              <p className="text-sm text-muted-foreground">
                No se encontraron servicios de canchas disponibles para reservar.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {availableServices.map((service) => (
                <Card 
                  key={service.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedProduct?.id === service.id ? 'border-2 border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    handleSelectProduct(service);
                    setShowServiceModal(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {service.category_name || 'Servicio'}
                            </Badge>
                            <Badge 
                              variant={service.state ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {service.state ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          
                          {service.price_formatted && (
                            <div className="flex items-center gap-2 text-primary font-medium">
                              <span className="text-base">{service.price_formatted}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span className="text-xs">
                                {service.has_valid_price ? 'Precio válido' : 'Sin precio'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${
                                service.stock_status === 'no_stock_tracking' ? 'bg-blue-500' : 
                                service.stock_status === 'available' ? 'bg-green-500' :
                                service.stock_status === 'limited_availability' ? 'bg-yellow-500' : 'bg-gray-500'
                              }`} />
                              <span className="text-xs capitalize">
                                {service.stock_status === 'no_stock_tracking' ? 'Sin control de stock' :
                                 service.stock_status === 'available' ? 'Disponible' :
                                 service.stock_status === 'limited_availability' ? 'Disponibilidad limitada' :
                                 service.stock_status === 'unavailable' ? 'No disponible' : service.stock_status}
                              </span>
                            </div>
                          </div>
                          
                          {service.description && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {selectedProduct?.id === service.id ? (
                          <CheckCircle className="w-6 h-6 text-primary" />
                        ) : (
                          <div className="w-6 h-6 border-2 border-muted-foreground rounded-full" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
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
                  <Card key={schedule.id || `schedule-${index}`} className={styles.card()}>
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
                              {new Date(schedule.start_time).toISOString().substr(11, 5)} - {new Date(schedule.end_time).toISOString().substr(11, 5)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {formatDateInParaguayTimezone(schedule.start_time, { weekday: 'long', day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            {calculateDurationInMinutes(schedule.start_time, schedule.end_time)} min
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
  </div>
  );
};

export default Reservations;
