// src/store/useScheduleStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { scheduleService } from '@/services/scheduleService';
import { telemetry } from '@/utils/telemetry';

const useScheduleStore = create(
  devtools(
    (set, get) => ({
      // Estado simple (NO normalizar en MVP)
      schedules: [],
      loading: false,
      error: null,

      // Acciones básicas
      clearError: () => set({ error: null }),
      
      clearSchedules: () => set({ schedules: [], error: null }),

      // Cargar horarios
      fetchSchedules: async (params = {}) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await scheduleService.getSchedules(params);
          
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
          
        } catch (error) {
          set({ error: error.message || 'Error al cargar horarios', loading: false });
          telemetry.record('feature.schedules.error', { 
            error: error.message 
          });
        }
      },

      // Obtener horario por ID
      fetchScheduleById: async (id) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await scheduleService.getScheduleById(id);
          
          telemetry.record('feature.schedules.load_by_id', { 
            duration: Date.now() - startTime 
          });
          
          return result;
        } catch (error) {
          set({ error: error.message || 'Error al cargar horario', loading: false });
          telemetry.record('feature.schedules.error', { 
            error: error.message 
          });
          throw error;
        }
      },

      // Actualizar disponibilidad de horario
      updateScheduleAvailability: async (id, isAvailable) => {
        try {
          const result = await scheduleService.updateAvailability(id, isAvailable);
          if (result.success !== false) {
            // Actualizar estado local
            const schedules = get().schedules.map(item => 
              item.id === id ? { ...item, is_available: isAvailable } : item
            );
            set({ schedules });
          }
          telemetry.record('feature.schedules.update_availability');
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al actualizar disponibilidad' });
          return { success: false, error: error.message };
        }
      },

      // Generar horarios diarios
      generateDailySchedules: async () => {
        try {
          const result = await scheduleService.generateDaily();
          if (result.success !== false) {
            // Recargar lista después de generar (opcional - hacer manualmente)
            // get().fetchSchedules();
          }
          telemetry.record('feature.schedules.generate_daily');
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al generar horarios diarios' });
          return { success: false, error: error.message };
        }
      },

      // 🆕 Generar horarios para HOY (nuevo endpoint v2.2)
      generateTodaySchedules: async () => {
        try {
          const result = await scheduleService.generateToday();
          if (result.success !== false) {
            // Recargar lista después de generar (opcional - hacer manualmente)
            // get().fetchSchedules();
          }
          telemetry.record('feature.schedules.generate_today');
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al generar horarios para hoy' });
          return { success: false, error: error.message };
        }
      },

      // 🆕 Generar horarios para MAÑANA (nuevo endpoint v2.2)
      generateTomorrowSchedules: async () => {
        try {
          const result = await scheduleService.generateTomorrow();
          if (result.success !== false) {
            // Recargar lista después de generar (opcional - hacer manualmente)
            // get().fetchSchedules();
          }
          telemetry.record('feature.schedules.generate_tomorrow');
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al generar horarios para mañana' });
          return { success: false, error: error.message };
        }
      },

      // Generar horarios para fecha específica
      generateSchedulesForDate: async (targetDate) => {
        try {
          const result = await scheduleService.generateForDate(targetDate);
          if (result.success !== false) {
            // Recargar lista después de generar (opcional - hacer manualmente)
            // get().fetchSchedules();
          }
          telemetry.record('feature.schedules.generate_for_date');
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al generar horarios para fecha' });
          return { success: false, error: error.message };
        }
      },

      // 🆕 Generar horarios para fecha específica con rango de horas personalizado
      generateSchedulesForDateWithCustomRange: async (targetDate, startHour, endHour, productIds = null) => {
        try {
          const result = await scheduleService.generateForDateWithCustomRange(targetDate, startHour, endHour, productIds);
          if (result.success !== false) {
            // Recargar lista después de generar (opcional - hacer manualmente)
            // get().fetchSchedules();
          }
          telemetry.record('feature.schedules.generate_for_date_custom_range', {
            start_hour: startHour,
            end_hour: endHour,
            has_product_filter: !!productIds
          });
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message || 'Error al generar horarios con rango personalizado' });
          return { success: false, error: error.message };
        }
      },

      // Generar horarios para próximos N días
      generateSchedulesForNextDays: async (days) => {
        try {
          const result = await scheduleService.generateForNextDays(days);
          if (result.success !== false) {
            // Recargar lista después de generar (opcional - hacer manualmente)
            // get().fetchSchedules();
          }
          telemetry.record('feature.schedules.generate_for_next_days');
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al generar horarios para próximos días' });
          return { success: false, error: error.message };
        }
      },

      // Obtener horarios disponibles para producto/fecha
      fetchAvailableSchedules: async (productId, date) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await scheduleService.getAvailableSchedules(productId, date);
          
          telemetry.record('feature.schedules.load_available', { 
            duration: Date.now() - startTime 
          });
          
          return result;
        } catch (error) {
          set({ error: error.message || 'Error al cargar horarios disponibles', loading: false });
          telemetry.record('feature.schedules.error', { 
            error: error.message 
          });
          throw error;
        }
      },

      // Obtener horarios por rango de fechas
      fetchSchedulesByDateRange: async (startDate, endDate, page = 1, pageSize = 20) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await scheduleService.getByDateRange(startDate, endDate, page, pageSize);
          
          telemetry.record('feature.schedules.load_by_date_range', { 
            duration: Date.now() - startTime 
          });
          
          return result;
        } catch (error) {
          set({ error: error.message || 'Error al cargar horarios por rango de fechas', loading: false });
          telemetry.record('feature.schedules.error', { 
            error: error.message 
          });
          throw error;
        }
      },

      // Obtener horarios por producto
      fetchSchedulesByProduct: async (productId, page = 1, pageSize = 20) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await scheduleService.getByProduct(productId, page, pageSize);
          
          telemetry.record('feature.schedules.load_by_product', { 
            duration: Date.now() - startTime 
          });
          
          return result;
        } catch (error) {
          set({ error: error.message || 'Error al cargar horarios del producto', loading: false });
          telemetry.record('feature.schedules.error', { 
            error: error.message 
          });
          throw error;
        }
      }
    }),
    {
      name: 'schedule-store', // Para DevTools
    }
  )
);

export default useScheduleStore;