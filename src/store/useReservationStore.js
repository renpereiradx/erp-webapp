// src/store/useReservationStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { reservationService } from '@/services/reservationService';
import { telemetry } from '@/utils/telemetry';

const useReservationStore = create(
  devtools(
    (set, get) => ({
      // Estado simple (NO normalizar en MVP)
      reservations: [],
      schedules: [],
      loading: false,
      error: null,

      // Acciones básicas
      clearError: () => set({ error: null }),
      
      clearReservations: () => set({ reservations: [], error: null }),
      
      clearSchedules: () => set({ schedules: [], error: null }),

      // Cargar reservas
      fetchReservations: async (params = {}) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await reservationService.getReservations(params);
          
          // Manejar diferentes formatos de respuesta
          let data = [];
          if (result.success !== false) {
            const raw = result.data || result;
            data = Array.isArray(raw) ? raw : 
                   Array.isArray(raw?.data) ? raw.data :
                   Array.isArray(raw?.results) ? raw.results : [];
          }
          
          set({ reservations: data, loading: false });
          
          telemetry.record('feature.reservations.load', { 
            duration: Date.now() - startTime,
            count: data.length 
          });
          
        } catch (error) {
          set({ error: error.message || 'Error al cargar reservas', loading: false });
          telemetry.record('feature.reservations.error', { 
            error: error.message 
          });
        }
      },

      // Obtener reserva por ID
      fetchReservationById: async (id) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await reservationService.getReservationById(id);
          
          telemetry.record('feature.reservations.load_by_id', { 
            duration: Date.now() - startTime 
          });
          
          return result;
        } catch (error) {
          set({ error: error.message || 'Error al cargar reserva', loading: false });
          telemetry.record('feature.reservations.error', { 
            error: error.message 
          });
          throw error;
        }
      },

      // Crear reserva
      createReservation: async (data) => {
        try {
          const result = await reservationService.createReservation(data);
          if (result.success !== false) {
            // Recargar lista después de crear
            get().fetchReservations();
          }
          telemetry.record('feature.reservations.create');
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al crear reserva' });
          return { success: false, error: error.message };
        }
      },

      // Actualizar reserva
      updateReservation: async (id, data) => {
        try {
          const result = await reservationService.updateReservation(id, data);
          if (result.success !== false) {
            // Recargar lista después de actualizar
            get().fetchReservations();
          }
          telemetry.record('feature.reservations.update');
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al actualizar reserva' });
          return { success: false, error: error.message };
        }
      },

      // Cancelar reserva
      cancelReservation: async (id) => {
        try {
          const result = await reservationService.cancelReservation(id);
          if (result.success !== false) {
            // Actualizar estado local
            const reservations = get().reservations.map(item => 
              item.id === id ? { ...item, status: 'cancelled' } : item
            );
            set({ reservations });
          }
          telemetry.record('feature.reservations.cancel');
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al cancelar reserva' });
          return { success: false, error: error.message };
        }
      },

      // Cargar horarios disponibles
      fetchAvailableSchedules: async (productId, date, duration) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await reservationService.getAvailableSchedules(productId, date, duration);
          
          // Manejar diferentes formatos de respuesta
          let data = [];
          if (result.success !== false) {
            const raw = result.data || result;
            data = Array.isArray(raw) ? raw : 
                   Array.isArray(raw?.data) ? raw.data :
                   Array.isArray(raw?.results) ? raw.results : [];
          }
          
          set({ schedules: data, loading: false });
          
          telemetry.record('feature.schedules.load', { 
            duration: Date.now() - startTime,
            count: data.length 
          });
          
          return data;
        } catch (error) {
          set({ error: error.message || 'Error al cargar horarios', loading: false });
          telemetry.record('feature.schedules.error', { 
            error: error.message 
          });
          return [];
        }
      },

      // Obtener reservas por producto
      fetchReservationsByProduct: async (productId) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await reservationService.getReservationsByProduct(productId);
          
          telemetry.record('feature.reservations.load_by_product', { 
            duration: Date.now() - startTime 
          });
          
          return result;
        } catch (error) {
          set({ error: error.message || 'Error al cargar reservas del producto', loading: false });
          telemetry.record('feature.reservations.error', { 
            error: error.message 
          });
          throw error;
        }
      },

      // Obtener reservas por cliente
      fetchReservationsByClient: async (clientId) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await reservationService.getReservationsByClient(clientId);
          
          telemetry.record('feature.reservations.load_by_client', { 
            duration: Date.now() - startTime 
          });
          
          return result;
        } catch (error) {
          set({ error: error.message || 'Error al cargar reservas del cliente', loading: false });
          telemetry.record('feature.reservations.error', { 
            error: error.message 
          });
          throw error;
        }
      },

      // Obtener reporte de reservas
      fetchReservationReport: async (params = {}) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await reservationService.getReservationReport(params);
          
          telemetry.record('feature.reservations.report', { 
            duration: Date.now() - startTime 
          });
          
          return result;
        } catch (error) {
          set({ error: error.message || 'Error al generar reporte', loading: false });
          telemetry.record('feature.reservations.error', { 
            error: error.message 
          });
          throw error;
        }
      }
    }),
    {
      name: 'reservation-store', // Para DevTools
    }
  )
);

export default useReservationStore;