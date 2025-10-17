/**
 * Mock data for Reservations - Modular and configurable  
 * Separated from main demoData.js for better organization
 */

// Reservations data factory
export const createReservationsData = (options = {}) => {
  const {
    count = 8,
    dateRange = { future: 30, past: 7 }, // 30 days future, 7 past
    clientIds = [201, 202, 203, 204, 205],
    serviceIds = ['SERV_001', 'SERV_002', 'SERV_003'],
    seed = 2000
  } = options;

  const reservations = [];
  const statuses = ['RESERVED', 'confirmed', 'cancelled'];
  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  
  for (let i = 0; i < count; i++) {
    const id = seed + i;
    
    // Generate dates (mix of future and past)
    const isFuture = Math.random() > 0.3; // 70% future reservations
    const daysOffset = isFuture 
      ? Math.floor(Math.random() * dateRange.future) + 1
      : -Math.floor(Math.random() * dateRange.past);
    
    const reservationDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    const [hours, minutes] = timeSlot.split(':');
    
    reservationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const duration = [1, 1.5, 2][Math.floor(Math.random() * 3)]; // 1, 1.5, or 2 hours
    const endTime = new Date(reservationDate.getTime() + duration * 60 * 60 * 1000);
    
    const serviceId = serviceIds[Math.floor(Math.random() * serviceIds.length)];
    const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
    const status = isFuture && Math.random() > 0.8 ? 'cancelled' : statuses[Math.floor(Math.random() * 2)]; // Less cancelled
    
    // Calculate pricing
    const basePrice = serviceId === 'SERV_001' ? 200 : serviceId === 'SERV_002' ? 800 : 500;
    const totalAmount = basePrice * duration;

    reservations.push({
      id,
      product_id: serviceId,
      product_name: getServiceName(serviceId),
      product_description: getServiceDescription(serviceId),
      client_id: clientId,
      client_name: `Cliente ${clientId - 200}`,
      start_time: reservationDate.toISOString(),
      end_time: endTime.toISOString(),
      duration,
      total_amount: totalAmount,
      status,
      user_id: 'USR_001',
      user_name: 'Usuario Demo',
      created_at: new Date(reservationDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        booking_source: 'web',
        special_requests: Math.random() > 0.7 ? 'Solicitud especial del cliente' : null,
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null
      }
    });
  }

  return reservations.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
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

const getServiceDescription = (serviceId) => {
  const descriptions = {
    'SERV_001': 'Cancha de tenis profesional con iluminación',
    'SERV_002': 'Consulta con médico general',
    'SERV_003': 'Sala equipada para 12 personas con proyector'
  };
  return descriptions[serviceId] || 'Descripción del servicio';
};

// Configuration
export const RESERVATIONS_CONFIG = {
  enabled: true,
  useRealAPI: true, // CHANGED: Use real API instead of mock data
  simulateDelay: false, // DISABLED: No delay for real API
  delayMs: 600,
  pageSize: 20,
  statuses: ['RESERVED', 'confirmed', 'cancelled'],
  timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
};

// Export default reservation data
export const DEMO_RESERVATIONS_DATA = createReservationsData({ count: 10 });
