// src/store/useReservationStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { reservationService } from '@/services/reservationService';
import { scheduleService } from '@/services/scheduleService';
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

      // Cargar reservas (usando endpoint /reserve/report según API spec)
      fetchReservations: async (params = {}) => {
        console.log('🔄 Store: Starting fetchReservations to verify data persistence...');
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await reservationService.getReservationReport(params);
          
          // Manejar respuesta según API spec - ReservationReport[]
          let data = [];
          if (result && result.data) {
            data = Array.isArray(result.data) ? result.data : [];
          } else if (Array.isArray(result)) {
            data = result;
          }
          
          console.log('📊 Store: fetchReservations result:', {
            resultType: typeof result,
            hasResultData: !!(result && result.data),
            isResultArray: Array.isArray(result),
            processedDataLength: data.length,
            processedData: data
          });
          
          set({ reservations: data, loading: false });
          
          console.log('✅ Store: Updated reservations state with', data.length, 'items');
          
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

      // Crear reserva usando /reserve/manage con action: "create"
      createReservation: async (data) => {
        console.log('🏪 Store: Starting createReservation with data:', data);
        set({ loading: true, error: null });
        try {
          // Validar campos obligatorios según API spec
          if (!data.product_id || !data.client_id || !data.start_time || !data.duration) {
            console.error('❌ Store: Missing required fields:', { data });
            throw new Error('Faltan campos obligatorios: product_id, client_id, start_time, duration');
          }
          
          // Formatear datos según ReserveRequest
          const reserveRequest = {
            action: 'create',
            product_id: data.product_id,
            client_id: data.client_id,
            start_time: data.start_time,
            duration: parseInt(data.duration) // Asegurar que sea entero
          };
          
          console.log('🌐 Store: Calling reservationService.createReservation with:', reserveRequest);
          const result = await reservationService.createReservation(reserveRequest);
          console.log('📥 Store: Service response:', result);
          console.log('🔍 Store: Checking response success condition:', {
            hasResult: !!result,
            hasData: !!(result && result.data),
            resultData: result?.data,
            resultSuccess: result?.success
          });
          
          if (result && result.data && result.data.success !== false) {
            console.log('✅ Store: Response indicates success, reloading reservations...');
            // Recargar lista después de crear
            get().fetchReservations();
            // 🔄 IMPORTANTE: Limpiar schedules para forzar recarga de disponibilidad
            get().clearSchedules();
            set({ loading: false });
            telemetry.record('feature.reservations.create');
            return { success: true, data: result.data };
          } else {
            // API devolvió error
            const errorMsg = result?.data?.error || 'Error desconocido en la API';
            console.error('❌ Store: API returned error:', errorMsg);
            set({ loading: false, error: errorMsg });
            return { success: false, error: errorMsg };
          }
        } catch (error) {
          set({ error: error.message || 'Error al crear reserva', loading: false });
          telemetry.record('feature.reservations.create.error', { error: error.message });
          return { success: false, error: error.message };
        }
      },

      // Actualizar reserva usando /reserve/manage con action: "update"
      updateReservation: async (id, data) => {
        set({ loading: true, error: null });
        try {
          // Validar campos obligatorios según API spec
          if (!id || !data.product_id || !data.client_id || !data.start_time || !data.duration) {
            throw new Error('Faltan campos obligatorios: reserve_id, product_id, client_id, start_time, duration');
          }
          
          // Formatear datos según ReserveRequest para update
          const reserveRequest = {
            action: 'update',
            reserve_id: parseInt(id), // Convertir a int64
            product_id: data.product_id,
            client_id: data.client_id,
            start_time: data.start_time,
            duration: parseInt(data.duration)
          };
          
          const result = await reservationService.updateReservation(id, reserveRequest);
          
          if (result && result.data) {
            // Recargar lista después de actualizar
            get().fetchReservations();
            set({ loading: false });
            telemetry.record('feature.reservations.update');
            return { success: true, data: result.data };
          }
          
          set({ loading: false });
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al actualizar reserva', loading: false });
          telemetry.record('feature.reservations.update.error', { error: error.message });
          return { success: false, error: error.message };
        }
      },

      // Cancelar reserva usando /reserve/manage con action: "cancel"
      cancelReservation: async (id) => {
        console.log('🚨 Store cancelReservation called with ID:', id, 'type:', typeof id);
        set({ loading: true, error: null });
        try {
          if (!id) {
            console.error('❌ ID is missing or falsy:', id);
            throw new Error('ID de reserva es obligatorio para cancelar');
          }

          // Según API doc, para CANCEL solo necesitamos action y reserve_id
          const cancelRequest = {
            action: 'CANCEL', // API requiere mayúsculas
            reserve_id: parseInt(id)
          };
          
          const result = await reservationService.cancelReservation(cancelRequest);
          
          if (result && result.data) {
            // Actualizar estado local - marcar como CANCELLED
            const reservations = get().reservations.map(item => 
              (item.reserve_id == id || item.id == id) ? { ...item, status: 'CANCELLED' } : item
            );
            set({ reservations, loading: false });
            // 🔄 IMPORTANTE: Limpiar schedules para forzar recarga de disponibilidad
            get().clearSchedules();
            telemetry.record('feature.reservations.cancel');
            return { success: true, data: result.data };
          }
          
          set({ loading: false });
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al cancelar reserva', loading: false });
          telemetry.record('feature.reservations.cancel.error', { error: error.message });
          return { success: false, error: error.message };
        }
      },

      // Confirmar reserva usando /reserve/manage con action: "confirm"
      confirmReservation: async (id) => {
        set({ loading: true, error: null });
        try {
          if (!id) {
            throw new Error('ID de reserva es obligatorio para confirmar');
          }
          
          // Para confirm, necesitamos solo el reserve_id según la API
          const confirmRequest = {
            action: 'CONFIRM', // API requiere mayúsculas
            reserve_id: parseInt(id)
          };
          
          const result = await reservationService.confirmReservation(confirmRequest);
          
          if (result && result.data) {
            // Actualizar estado local - marcar como CONFIRMED
            const reservations = get().reservations.map(item => 
              (item.reserve_id == id || item.id == id) ? { ...item, status: 'CONFIRMED' } : item
            );
            set({ reservations, loading: false });
            // 🔄 IMPORTANTE: Refrescar lista de reservas
            get().fetchReservations();
            telemetry.record('feature.reservations.confirm');
            return { success: true, data: result.data };
          }
          
          set({ loading: false });
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al confirmar reserva', loading: false });
          telemetry.record('feature.reservations.confirm.error', { error: error.message });
          return { success: false, error: error.message };
        }
      },

      // Cargar horarios disponibles (usando Schedule API)
      fetchAvailableSchedules: async (productId, date) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await scheduleService.getAvailableSchedules(productId, date);
          
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

      // Verificar horarios disponibles generales para una fecha
      checkAvailableSchedulesForDate: async (date) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const today = new Date().toISOString().split('T')[0];
          let result;
          
          // Usar el endpoint optimizado para HOY
          if (date === today) {
            result = await scheduleService.getTodaySchedules();
          } else {
            // Para otras fechas usar el endpoint general
            result = await scheduleService.getAvailableSchedulesAll({ 
              date: date, 
              limit: 20 
            });
          }
          
          set({ loading: false });
          
          telemetry.record('feature.schedules.check_available', { 
            duration: Date.now() - startTime,
            count: result.count || 0
          });
          
          return result;
        } catch (error) {
          set({ error: error.message || 'Error verificando horarios', loading: false });
          telemetry.record('feature.schedules.error', { 
            error: error.message 
          });
          throw error;
        }
      },

      // Obtener horarios de hoy
      fetchTodaySchedules: async () => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await scheduleService.getTodaySchedules();
          
          set({ loading: false });
          
          telemetry.record('feature.schedules.load_today', { 
            duration: Date.now() - startTime,
            count: result.count || 0 
          });
          
          return result;
        } catch (error) {
          set({ error: error.message || 'Error al cargar horarios de hoy', loading: false });
          telemetry.record('feature.schedules.error', { 
            error: error.message 
          });
          throw error;
        }
      },

      // REMOVED: fetchSchedulesByDateRange() - The underlying API endpoint does not exist
      // Use multiple calls to fetchAvailableSchedules() for different product/date combinations instead

      // Actualizar disponibilidad de horario
      updateScheduleAvailability: async (scheduleId, isAvailable) => {
        try {
          const result = await scheduleService.updateAvailability(scheduleId, isAvailable);
          
          if (result.success !== false) {
            // Actualizar estado local
            const schedules = get().schedules.map(schedule => 
              schedule.id === scheduleId ? { ...schedule, is_available: isAvailable } : schedule
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
            telemetry.record('feature.schedules.generate_daily');
            return { success: true, data: result };
          }
          throw new Error(result.message || 'Error generando horarios diarios');
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
            telemetry.record('feature.schedules.generate_today');
            return { success: true, data: result };
          }
          throw new Error(result.message || 'Error generando horarios para hoy');
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
            telemetry.record('feature.schedules.generate_tomorrow');
            return { success: true, data: result };
          }
          throw new Error(result.message || 'Error generando horarios para mañana');
        } catch (error) {
          set({ error: error.message || 'Error al generar horarios para mañana' });
          return { success: false, error: error.message };
        }
      },

      // Generar horarios para fecha específica con opciones flexibles
      generateSchedulesForDate: async (targetDate, options = {}) => {
        try {
          const result = await scheduleService.generateForDate(targetDate, options);
          if (result.success !== false) {
            telemetry.record('feature.schedules.generate_date_flexible', {
              has_custom_hours: !!(options.startHour || options.endHour),
              has_product_filter: !!(options.productIds && options.productIds.length > 0),
              auto_discovery: !options.productIds || options.productIds.length === 0
            });
            return { success: true, data: result };
          }
          throw new Error(result.message || 'Error generando horarios para fecha');
        } catch (error) {
          set({ error: error.message || 'Error al generar horarios para fecha' });
          return { success: false, error: error.message };
        }
      },

      // Generar horarios para próximos N días
      generateSchedulesForNextDays: async (days) => {
        try {
          const result = await scheduleService.generateForNextDays(days);
          if (result.success !== false) {
            telemetry.record('feature.schedules.generate_next_days');
            return { success: true, data: result };
          }
          throw new Error(result.message || 'Error generando horarios para próximos días');
        } catch (error) {
          set({ error: error.message || 'Error al generar horarios para próximos días' });
          return { success: false, error: error.message };
        }
      },

      // Método deprecado - usar generateSchedulesForDate con options
      generateSchedulesForDateWithCustomRange: async (targetDate, startHour, endHour, productIds = null) => {
        console.warn('⚠️ generateSchedulesForDateWithCustomRange está deprecado. Use generateSchedulesForDate(targetDate, { startHour, endHour, productIds })');
        return get().generateSchedulesForDate(targetDate, {
          startHour,
          endHour,
          productIds: productIds && Array.isArray(productIds) && productIds.length > 0 ? productIds : undefined
        });
      },
      
      // 🆕 Nueva función para generación con auto-descubrimiento completo
      generateSchedulesWithAutoDiscovery: async (targetDate, startHour = null, endHour = null) => {
        try {
          const options = {};
          if (startHour !== null) options.startHour = startHour;
          if (endHour !== null) options.endHour = endHour;
          // No especificar productIds para activar auto-descubrimiento
          
          const result = await scheduleService.generateForDate(targetDate, options);
          if (result.success !== false) {
            telemetry.record('feature.schedules.generate_auto_discovery', {
              has_custom_hours: !!(startHour || endHour),
              products_found: result.validation?.products_requested || 0,
              schedules_created: result.results?.schedules_created || 0
            });
            return { success: true, data: result };
          }
          throw new Error(result.message || 'Error generando horarios con auto-descubrimiento');
        } catch (error) {
          set({ error: error.message || 'Error al generar horarios con auto-descubrimiento' });
          return { success: false, error: error.message };
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

          // Manejar respuesta según API spec
          let data = [];
          if (result && result.data) {
            data = Array.isArray(result.data) ? result.data : [];
          } else if (Array.isArray(result)) {
            data = result;
          }

          // IMPORTANTE: Actualizar el estado con las reservas del cliente
          set({ reservations: data, loading: false });

          telemetry.record('feature.reservations.load_by_client', {
            duration: Date.now() - startTime,
            count: data.length
          });

          return { data };
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