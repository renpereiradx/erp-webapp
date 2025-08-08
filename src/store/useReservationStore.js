/**
 * Store de Zustand para gestión de estado de reservas
 * Maneja el estado global de las reservas, incluyendo CRUD operations y estado de la UI
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import reservationService from '@/services/reservationService';

const useReservationStore = create(
  devtools(
    (set, get) => ({
      // Estado inicial
      reservations: [],
      currentReservation: null,
      availableSlots: [],
      schedules: [],
      currentSchedule: null,
      loading: false,
      error: null,
      filters: {
        page: 1,
        limit: 10,
        clientId: '',
        productId: '',
        dateFrom: '',
        dateTo: '',
        status: '',
        sortBy: 'startTime',
        sortOrder: 'asc',
      },
      pagination: {
        total: 0,
        totalPages: 0,
        currentPage: 1,
        hasNext: false,
        hasPrevious: false,
      },
      stats: {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      },

      // Acciones para reservas
      fetchReservations: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const filters = { ...get().filters, ...params };
          const response = await reservationService.getReservations(filters);
          
          set({
            reservations: response.data || [],
            pagination: response.pagination || get().pagination,
            filters,
            loading: false,
          });
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchReservationById: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.getReservationById(id);
          set({
            currentReservation: response.data,
            loading: false,
          });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      createReservation: async (reservationData) => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.createReservation(reservationData);
          
          // Actualizar la lista de reservas
          const reservations = get().reservations;
          set({
            reservations: [response.data, ...reservations],
            loading: false,
          });
          
          // Actualizar estadísticas
          get().updateStats();
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateReservation: async (id, reservationData) => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.updateReservation(id, reservationData);
          
          // Actualizar la reserva en la lista
          const reservations = get().reservations.map(reservation =>
            reservation.id === id ? response.data : reservation
          );
          
          set({
            reservations,
            currentReservation: response.data,
            loading: false,
          });
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      cancelReservation: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.cancelReservation(id);
          
          // Actualizar estado de la reserva
          const reservations = get().reservations.map(reservation =>
            reservation.id === id ? { ...reservation, status: 'cancelled' } : reservation
          );
          
          set({ reservations, loading: false });
          get().updateStats();
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      confirmReservation: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.confirmReservation(id);
          
          // Actualizar estado de la reserva
          const reservations = get().reservations.map(reservation =>
            reservation.id === id ? { ...reservation, status: 'confirmed' } : reservation
          );
          
          set({ reservations, loading: false });
          get().updateStats();
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      completeReservation: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.completeReservation(id);
          
          // Actualizar estado de la reserva
          const reservations = get().reservations.map(reservation =>
            reservation.id === id ? { ...reservation, status: 'completed' } : reservation
          );
          
          set({ reservations, loading: false });
          get().updateStats();
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      rescheduleReservation: async (id, newStartTime, newDuration) => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.rescheduleReservation(id, newStartTime, newDuration);
          
          // Actualizar la reserva en la lista
          const reservations = get().reservations.map(reservation =>
            reservation.id === id ? response.data : reservation
          );
          
          set({ reservations, loading: false });
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchTodayReservations: async () => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.getTodayReservations();
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchAvailableSlots: async (productId, date) => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.getAvailableSlots(productId, date);
          set({
            availableSlots: response.data || [],
            loading: false,
          });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Acciones para schedules (horarios)
      fetchSchedules: async (productId, params = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.getSchedules(productId, params);
          set({
            schedules: response.data || [],
            loading: false,
          });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      createSchedule: async (productId, scheduleData) => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.createSchedule(productId, scheduleData);
          
          // Actualizar la lista de horarios
          const schedules = get().schedules;
          set({
            schedules: [response.data, ...schedules],
            loading: false,
          });
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateScheduleAvailability: async (scheduleId, isAvailable) => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.updateScheduleAvailability(scheduleId, isAvailable);
          
          // Actualizar el horario en la lista
          const schedules = get().schedules.map(schedule =>
            schedule.id === scheduleId ? { ...schedule, is_available: isAvailable } : schedule
          );
          
          set({ schedules, loading: false });
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      checkScheduleAvailability: async (productId, startTime, endTime) => {
        set({ loading: true, error: null });
        try {
          const response = await reservationService.checkScheduleAvailability(productId, startTime, endTime);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchReservationStats: async (params = {}) => {
        try {
          const response = await reservationService.getReservationStats(params);
          set({ stats: response.data || get().stats });
          return response;
        } catch (error) {
          console.error('Error fetching reservation stats:', error);
          throw error;
        }
      },

      // Utilidades y helpers
      updateStats: () => {
        const reservations = get().reservations;
        const today = new Date().toISOString().split('T')[0];
        
        const stats = {
          total: reservations.length,
          today: reservations.filter(r => r.startTime?.startsWith(today)).length,
          pending: reservations.filter(r => r.status === 'pending').length,
          confirmed: reservations.filter(r => r.status === 'confirmed').length,
          completed: reservations.filter(r => r.status === 'completed').length,
          cancelled: reservations.filter(r => r.status === 'cancelled').length,
        };
        
        set({ stats });
      },

      setFilters: (newFilters) => {
        const filters = { ...get().filters, ...newFilters };
        set({ filters });
      },

      resetFilters: () => {
        set({
          filters: {
            page: 1,
            limit: 10,
            clientId: '',
            productId: '',
            dateFrom: '',
            dateTo: '',
            status: '',
            sortBy: 'startTime',
            sortOrder: 'asc',
          }
        });
      },

      clearError: () => set({ error: null }),

      clearCurrentReservation: () => set({ currentReservation: null }),

      // Selectores
      getReservationsByStatus: (status) => {
        return get().reservations.filter(reservation => reservation.status === status);
      },

      getReservationsByClient: (clientId) => {
        return get().reservations.filter(reservation => reservation.clientId === clientId);
      },

      getReservationsByProduct: (productId) => {
        return get().reservations.filter(reservation => reservation.productId === productId);
      },

      getTodayReservationsCount: () => {
        const reservations = get().reservations;
        const today = new Date().toISOString().split('T')[0];
        return reservations.filter(r => r.startTime?.startsWith(today)).length;
      },

      // Utilidades para schedules
      getAvailableSchedulesForDate: (date, productId) => {
        const schedules = get().schedules;
        const dateStr = new Date(date).toISOString().split('T')[0];
        
        return schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.start_time).toISOString().split('T')[0];
          return scheduleDate === dateStr && 
                 schedule.product_id === productId && 
                 schedule.is_available;
        });
      },

      isTimeSlotAvailable: (date, time, productId) => {
        const schedules = get().schedules;
        const dateTime = `${date}T${time}:00`;
        
        const conflictingSchedule = schedules.find(schedule => {
          const scheduleStart = new Date(schedule.start_time);
          const scheduleEnd = new Date(schedule.end_time);
          const requestedTime = new Date(dateTime);
          
          return schedule.product_id === productId &&
                 requestedTime >= scheduleStart &&
                 requestedTime < scheduleEnd &&
                 !schedule.is_available;
        });
        
        return !conflictingSchedule;
      },

      getSchedulesForProduct: (productId) => {
        return get().schedules.filter(schedule => schedule.product_id === productId);
      },
    }),
    { name: 'reservation-store' }
  )
);

export default useReservationStore;
