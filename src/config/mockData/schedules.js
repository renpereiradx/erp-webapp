/**
 * Mock data for Schedules - Modular and configurable
 * Separated from main demoData.js for better organization
 */

// Schedules data factory
export const createSchedulesData = (options = {}) => {
  const {
    daysAhead = 14, // Generate schedules for next 14 days
    serviceIds = ['SERV_001', 'SERV_002', 'SERV_003'],
    timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
    seed = 3000
  } = options;

  const schedules = [];
  let idCounter = seed;

  // Generate schedules for each day and each service
  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const scheduleDate = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
    
    // Skip weekends for some services (business logic)
    const isWeekend = scheduleDate.getDay() === 0 || scheduleDate.getDay() === 6;
    
    serviceIds.forEach(serviceId => {
      // Business services might not operate on weekends
      if (isWeekend && serviceId === 'SERV_003') return; // Conference room closed on weekends
      
      const slotsForService = serviceId === 'SERV_002' ? 
        timeSlots.slice(0, 6) : // Medical consultations end earlier
        timeSlots;
      
      slotsForService.forEach(timeSlot => {
        const [hours, minutes] = timeSlot.split(':');
        const startTime = new Date(scheduleDate);
        startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const duration = getServiceDuration(serviceId);
        const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
        
        // Random availability (90% available by default)
        const isAvailable = Math.random() > 0.1;
        
        schedules.push({
          id: idCounter++,
          product_id: serviceId,
          product_name: getServiceName(serviceId),
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          is_available: isAvailable,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            auto_generated: true,
            service_type: getServiceType(serviceId),
            day_of_week: scheduleDate.toLocaleDateString('es-ES', { weekday: 'long' })
          }
        });
      });
    });
  }

  return schedules.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
};

// Helper functions
const getServiceName = (serviceId) => {
  const names = {
    'SERV_001': 'Cancha de Tenis Premium',
    'SERV_002': 'Consulta Médica General', 
    'SERV_003': 'Sala de Conferencias Ejecutiva'
  };
  return names[serviceId] || 'Servicio Genérico';
};

const getServiceDuration = (serviceId) => {
  const durations = {
    'SERV_001': 1, // 1 hour tennis court
    'SERV_002': 0.5, // 30 minutes consultation
    'SERV_003': 2 // 2 hours conference room
  };
  return durations[serviceId] || 1;
};

const getServiceType = (serviceId) => {
  const types = {
    'SERV_001': 'sports',
    'SERV_002': 'medical',
    'SERV_003': 'business'
  };
  return types[serviceId] || 'general';
};

// Configuration
export const SCHEDULES_CONFIG = {
  enabled: true,
  useRealAPI: false,
  simulateDelay: true,
  delayMs: 400,
  pageSize: 50, // More schedules per page
  defaultDaysAhead: 14,
  timeSlots: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  businessHours: {
    start: '09:00',
    end: '18:00',
    lunchBreak: { start: '12:00', end: '14:00' }
  }
};

// Export default schedule data
export const DEMO_SCHEDULES_DATA = createSchedulesData({ daysAhead: 14 });