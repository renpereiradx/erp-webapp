/**
 * Custom hook para manejo de lógica de reservas
 * Centraliza la lógica de validación de horarios, cálculos y operaciones de reserva
 * Integra con la estructura de la base de datos de schedules
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export const useReservationLogic = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Validaciones del estado actual
  const validations = useMemo(() => ({
    hasDate: Boolean(selectedDate),
    hasTime: Boolean(selectedTime),
    hasService: Boolean(selectedService),
    hasClient: Boolean(selectedClient),
    canProceed: Boolean(selectedDate && selectedTime && selectedService && selectedClient),
    isValidDate: selectedDate ? selectedDate >= new Date().setHours(0, 0, 0, 0) : false
  }), [selectedDate, selectedTime, selectedService, selectedClient]);

  // Formatear fecha para la API (formato compatible con PostgreSQL)
  const formatDateForAPI = useCallback((date) => {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
  }, []);

  // Formatear hora para la API
  const formatTimeForAPI = useCallback((timeString) => {
    if (!timeString) return null;
    return `${timeString}:00`; // Agregar segundos si es necesario
  }, []);

  // Generar horarios disponibles (8:00 AM - 6:00 PM)
  const generateTimeSlots = useCallback(() => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeString,
          display: `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`,
          available: true // Se actualizará con datos de la API
        });
      }
    }
    return slots;
  }, []);

  // Cargar horarios disponibles para una fecha específica
  const loadAvailableSlots = useCallback(async (date, serviceId) => {
    if (!date || !serviceId) {
      setAvailableSlots([]);
      return;
    }

    setLoading(true);
    try {
      // Generar todos los horarios posibles
      const allSlots = generateTimeSlots();
      
      // Aquí se integraría con la API para obtener horarios ocupados
      // Por ahora, simulamos algunos horarios ocupados
      const formattedDate = formatDateForAPI(date);
      
      // Simulación - en producción esto vendría de la API
      const occupiedSlots = ['09:00', '10:30', '14:00', '15:30'];
      
      const availableSlots = allSlots.map(slot => ({
        ...slot,
        available: !occupiedSlots.includes(slot.time)
      }));

      setAvailableSlots(availableSlots);
    } catch (error) {
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }, [generateTimeSlots, formatDateForAPI]);

  // Cargar horarios cuando cambia la fecha o servicio
  useEffect(() => {
    if (selectedDate && selectedService) {
      loadAvailableSlots(selectedDate, selectedService.id);
    }
  }, [selectedDate, selectedService, loadAvailableSlots]);

  // Calcular duración estimada del servicio
  const getServiceDuration = useCallback((service) => {
    if (!service) return 30; // Duración por defecto en minutos
    return service.duration || 30;
  }, []);

  // Calcular hora de fin basada en el servicio
  const calculateEndTime = useCallback((startTime, service) => {
    if (!startTime || !service) return null;
    
    const duration = getServiceDuration(service);
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + duration * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  }, [getServiceDuration]);

  // Preparar datos para envío a la API
  const prepareReservationData = useCallback(() => {
    if (!validations.canProceed) {
      throw new Error('Faltan datos requeridos para completar la reserva');
    }

    const startTime = formatTimeForAPI(selectedTime);
    const endTime = formatTimeForAPI(calculateEndTime(selectedTime, selectedService));

    return {
      clientId: selectedClient,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: formatDateForAPI(selectedDate),
      startTime,
      endTime,
      duration: getServiceDuration(selectedService),
      price: selectedService.price,
      metadata: {
        timestamp: new Date().toISOString(),
        bookingType: 'standard'
      }
    };
  }, [
    validations.canProceed,
    selectedClient,
    selectedService,
    selectedDate,
    selectedTime,
    formatDateForAPI,
    formatTimeForAPI,
    calculateEndTime,
    getServiceDuration
  ]);

  // Verificar si un horario específico está disponible
  const isTimeSlotAvailable = useCallback((timeString) => {
    const slot = availableSlots.find(slot => slot.time === timeString);
    return slot ? slot.available : false;
  }, [availableSlots]);

  // Reset completo del estado
  const resetReservation = useCallback(() => {
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedService(null);
    setSelectedClient('');
    setAvailableSlots([]);
  }, []);

  // Obtener próximos horarios disponibles
  const getNextAvailableSlots = useCallback((limit = 5) => {
    return availableSlots
      .filter(slot => slot.available)
      .slice(0, limit);
  }, [availableSlots]);

  return {
    // Estado
    selectedDate,
    selectedTime,
    selectedService,
    selectedClient,
    availableSlots,
    loading,

    // Setters
    setSelectedDate,
    setSelectedTime,
    setSelectedService,
    setSelectedClient,

    // Validaciones
    validations,

    // Utilidades
    isTimeSlotAvailable,
    calculateEndTime,
    getServiceDuration,
    getNextAvailableSlots,
    formatDateForAPI,
    formatTimeForAPI,

    // Acciones
    loadAvailableSlots,
    prepareReservationData,
    resetReservation
  };
};

export default useReservationLogic;
