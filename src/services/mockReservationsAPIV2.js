/**
 * MockReservationsAPI V2 - Wave 8: Compatible con RESERVE_API.md
 * Simulador de datos actualizado para desarrollo sin API backend
 * Implementa todos los endpoints de la API documentada
 */

import { RESERVATION_STATUSES, RESERVATION_ACTIONS, CONSISTENCY_ISSUE_TYPES } from '../types/reservationTypes';

// Simulador de delay de red
const networkDelay = (min = 200, max = 800) => 
  new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

// Datos mock de productos/servicios actualizados
const MOCK_PRODUCTS = [
  {
    id: 'BT_Cancha_1_xyz123abc',
    name: 'Cancha de Tenis #1',
    description: 'Cancha profesional de tenis con superficie de arcilla',
    price: 50,
    duration: 1.5,
    category: 'deportes'
  },
  {
    id: 'BT_Cancha_2_def456ghi', 
    name: 'Cancha de Tenis #2',
    description: 'Cancha de tenis con superficie sintética',
    price: 45,
    duration: 1.5,
    category: 'deportes'
  },
  {
    id: 'BT_Salon_Events_jkl789mno',
    name: 'Salón de Eventos',
    description: 'Salón principal para eventos de hasta 100 personas',
    price: 120,
    duration: 4,
    category: 'eventos'
  },
  {
    id: 'BT_Consultorio_pqr012stu',
    name: 'Consultorio Médico',
    description: 'Consultorio equipado para consultas médicas',
    price: 80,
    duration: 1,
    category: 'salud'
  },
  {
    id: 'BT_Sala_Reuniones_vwx345yz',
    name: 'Sala de Reuniones',
    description: 'Sala equipada con proyector y videoconferencia',
    price: 30,
    duration: 2,
    category: 'oficina'
  }
];

// Datos mock de clientes
const MOCK_CLIENTS = [
  {
    id: 'CLI_12345',
    name: 'Ana García Rodríguez',
    email: 'ana.garcia@email.com',
    phone: '+34 666 123 456',
    document: '12345678A'
  },
  {
    id: 'CLI_23456', 
    name: 'Carlos Martínez López',
    email: 'carlos.martinez@email.com',
    phone: '+34 666 234 567',
    document: '23456789B'
  },
  {
    id: 'CLI_34567',
    name: 'María Santos Fernández',
    email: 'maria.santos@email.com',
    phone: '+34 666 345 678',
    document: '34567890C'
  },
  {
    id: 'CLI_45678',
    name: 'David Ruiz González',
    email: 'david.ruiz@email.com',
    phone: '+34 666 456 789',
    document: '45678901D'
  },
  {
    id: 'CLI_56789',
    name: 'Laura Jiménez Moreno',
    email: 'laura.jimenez@email.com',
    phone: '+34 666 567 890',
    document: '56789012E'
  }
];

// Datos mock de usuarios
const MOCK_USERS = [
  {
    id: 'USR_789',
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: 'USR_790',
    name: 'Manager User',
    role: 'manager'
  }
];

// Generar datos mock de reservas usando el nuevo formato
const generateMockReservations = (count = 50) => {
  const reservations = [];
  const now = new Date();
  
  for (let i = 1; i <= count; i++) {
    const product = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
    const client = MOCK_CLIENTS[Math.floor(Math.random() * MOCK_CLIENTS.length)];
    const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
    
    // Fecha aleatoria en próximos 30 días
    const futureDate = new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    // Hora aleatoria entre 9:00 y 18:00
    const hour = Math.floor(Math.random() * 9) + 9;
    const minute = Math.random() > 0.5 ? 0 : 30;
    
    const startTime = new Date(futureDate);
    startTime.setHours(hour, minute, 0, 0);
    
    const duration = product.duration;
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    
    const status = RESERVATION_STATUSES[Math.floor(Math.random() * Object.keys(RESERVATION_STATUSES).length)];
    
    reservations.push({
      id: i,
      product_id: product.id,
      product_name: product.name,
      product_description: product.description,
      client_id: client.id,
      client_name: client.name,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration: duration,
      total_amount: product.price * duration,
      status: Object.values(RESERVATION_STATUSES)[Math.floor(Math.random() * Object.values(RESERVATION_STATUSES).length)],
      user_id: user.id,
      user_name: user.name
    });
  }
  
  return reservations;
};

// Cache de reservas en memoria
let mockReservationsCache = generateMockReservations(50);
let nextId = mockReservationsCache.length + 1;

// Cache de horarios disponibles
let mockSchedulesCache = [];

/**
 * API Mock V2 compatible con RESERVE_API.md
 */
export const mockReservationsAPIV2 = {
  
  // === ENDPOINTS PRINCIPALES DE LA API ===

  /**
   * 1. Gestionar Reserva - POST /reserve/manage
   */
  async manageReservation(requestData) {
    await networkDelay();
    
    const { action, reserve_id, product_id, client_id, start_time, duration, ...otherData } = requestData;
    
    switch (action) {
      case RESERVATION_ACTIONS.CREATE:
        return this._createReservation({ product_id, client_id, start_time, duration, ...otherData });
        
      case RESERVATION_ACTIONS.UPDATE:
        return this._updateReservation(reserve_id, { product_id, client_id, start_time, duration, ...otherData });
        
      case RESERVATION_ACTIONS.CANCEL:
        return this._updateReservation(reserve_id, { status: RESERVATION_STATUSES.CANCELLED, ...otherData });
        
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  },

  /**
   * 2. Obtener Reserva por ID - GET /reserve/{id}
   */
  async getReservationById(id) {
    await networkDelay();
    
    const reservation = mockReservationsCache.find(r => r.id === parseInt(id));
    if (!reservation) {
      throw new Error(`Reservation with id ${id} not found`);
    }
    
    return this._toReserveFormat(reservation);
  },

  /**
   * 3. Obtener Reservas por Producto - GET /reserve/product/{product_id}
   */
  async getReservationsByProduct(productId) {
    await networkDelay();
    
    const reservations = mockReservationsCache.filter(r => r.product_id === productId);
    return reservations.map(r => this._toReserveRichedFormat(r));
  },

  /**
   * 4. Obtener Reservas por Cliente - GET /reserve/client/{client_id}
   */
  async getReservationsByClient(clientId) {
    await networkDelay();
    
    const reservations = mockReservationsCache.filter(r => r.client_id === clientId);
    return reservations.map(r => this._toReserveRichedFormat(r));
  },

  /**
   * 5. Obtener Reporte de Reservas - GET /reserve/report
   */
  async getReservationReport(params = {}) {
    await networkDelay();
    
    let filteredReservations = [...mockReservationsCache];
    
    // Aplicar filtros
    if (params.start_date) {
      const startDate = new Date(params.start_date);
      filteredReservations = filteredReservations.filter(r => 
        new Date(r.start_time) >= startDate
      );
    }
    
    if (params.end_date) {
      const endDate = new Date(params.end_date);
      endDate.setHours(23, 59, 59, 999); // Incluir todo el día
      filteredReservations = filteredReservations.filter(r => 
        new Date(r.start_time) <= endDate
      );
    }
    
    if (params.product_id) {
      filteredReservations = filteredReservations.filter(r => 
        r.product_id === params.product_id
      );
    }
    
    if (params.client_id) {
      filteredReservations = filteredReservations.filter(r => 
        r.client_id === params.client_id
      );
    }
    
    if (params.status) {
      filteredReservations = filteredReservations.filter(r => 
        r.status === params.status
      );
    }
    
    // Convertir a formato ReservationReport
    return filteredReservations.map(r => this._toReservationReportFormat(r));
  },

  /**
   * 6. Verificar Consistencia - GET /reserve/consistency/check
   */
  async checkConsistency() {
    await networkDelay(300, 600);
    
    const issues = [];
    
    // Simular algunos problemas de consistencia
    const problemReservations = mockReservationsCache.filter(r => Math.random() < 0.1); // 10% de problemas
    
    problemReservations.forEach(reservation => {
      if (Math.random() < 0.5) {
        issues.push({
          issue_type: CONSISTENCY_ISSUE_TYPES.MISSING_SALE,
          reserve_id: reservation.id,
          sales_count: 0,
          details: `Reserva ${reservation.id} sin venta asociada`
        });
      } else {
        issues.push({
          issue_type: CONSISTENCY_ISSUE_TYPES.INVALID_STATUS,
          reserve_id: reservation.id,
          sales_count: 1,
          details: `Reserva ${reservation.id} tiene estado inconsistente`
        });
      }
    });
    
    return issues;
  },

  /**
   * 7. Obtener Horarios Disponibles - GET /reserve/available-schedules
   */
  async getAvailableSchedules(productId, date, durationHours = 1) {
    await networkDelay();
    
    const schedules = [];
    const baseDate = new Date(date);
    
    // Generar horarios disponibles de 9:00 AM a 6:00 PM
    for (let hour = 9; hour <= 18 - durationHours; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = new Date(baseDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + durationHours);
        
        // Verificar si está disponible (simular ocupación)
        const isOccupied = this._isTimeSlotOccupied(productId, startTime, endTime);
        
        if (!isOccupied && Math.random() > 0.2) { // 80% disponibles aleatoriamente
          schedules.push({
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            available_consecutive_hours: durationHours
          });
        }
      }
    }
    
    return schedules;
  },

  // === MÉTODOS PRIVADOS DE UTILIDAD ===

  /**
   * Crear nueva reserva
   * @private
   */
  async _createReservation(data) {
    const product = MOCK_PRODUCTS.find(p => p.id === data.product_id);
    const client = MOCK_CLIENTS.find(c => c.id === data.client_id);
    const user = MOCK_USERS[0]; // Usuario admin por defecto
    
    if (!product) throw new Error(`Product ${data.product_id} not found`);
    if (!client) throw new Error(`Client ${data.client_id} not found`);
    
    const startTime = new Date(data.start_time);
    const endTime = new Date(startTime.getTime() + data.duration * 60 * 60 * 1000);
    
    const newReservation = {
      id: nextId++,
      product_id: data.product_id,
      product_name: product.name,
      product_description: product.description,
      client_id: data.client_id,
      client_name: client.name,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration: data.duration,
      total_amount: product.price * data.duration,
      status: RESERVATION_STATUSES.RESERVED,
      user_id: user.id,
      user_name: user.name
    };
    
    mockReservationsCache.push(newReservation);
    return this._toReserveFormat(newReservation);
  },

  /**
   * Actualizar reserva existente
   * @private
   */
  async _updateReservation(id, updates) {
    const index = mockReservationsCache.findIndex(r => r.id === parseInt(id));
    if (index === -1) {
      throw new Error(`Reservation with id ${id} not found`);
    }
    
    const existing = mockReservationsCache[index];
    
    // Recalcular end_time y total_amount si cambian start_time o duration
    let endTime = existing.end_time;
    let totalAmount = existing.total_amount;
    
    if (updates.start_time || updates.duration) {
      const startTime = new Date(updates.start_time || existing.start_time);
      const duration = updates.duration || existing.duration;
      endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000).toISOString();
      
      const product = MOCK_PRODUCTS.find(p => p.id === existing.product_id);
      if (product) {
        totalAmount = product.price * duration;
      }
    }
    
    mockReservationsCache[index] = {
      ...existing,
      ...updates,
      end_time: endTime,
      total_amount: totalAmount
    };
    
    return this._toReserveFormat(mockReservationsCache[index]);
  },

  /**
   * Verificar si un horario está ocupado
   * @private
   */
  _isTimeSlotOccupied(productId, startTime, endTime) {
    return mockReservationsCache.some(reservation => {
      if (reservation.product_id !== productId) return false;
      if (reservation.status === RESERVATION_STATUSES.CANCELLED) return false;
      
      const resStart = new Date(reservation.start_time);
      const resEnd = new Date(reservation.end_time);
      
      // Verificar superposición
      return (startTime < resEnd && endTime > resStart);
    });
  },

  /**
   * Convertir a formato Reserve
   * @private
   */
  _toReserveFormat(reservation) {
    return {
      id: reservation.id,
      product_id: reservation.product_id,
      client_id: reservation.client_id,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      duration: reservation.duration,
      total_amount: reservation.total_amount,
      status: reservation.status,
      user_id: reservation.user_id
    };
  },

  /**
   * Convertir a formato ReserveRiched
   * @private
   */
  _toReserveRichedFormat(reservation) {
    return {
      ...reservation // Ya incluye todos los campos necesarios
    };
  },

  /**
   * Convertir a formato ReservationReport
   * @private
   */
  _toReservationReportFormat(reservation) {
    const startTime = new Date(reservation.start_time);
    const now = new Date();
    const daysUntil = Math.ceil((startTime - now) / (1000 * 60 * 60 * 24));
    
    return {
      reserve_id: reservation.id,
      product_name: reservation.product_name,
      client_name: reservation.client_name,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      duration_hours: reservation.duration,
      total_amount: reservation.total_amount,
      status: reservation.status,
      created_by: reservation.user_name,
      days_until_reservation: daysUntil
    };
  },

  // === MÉTODOS DE COMPATIBILIDAD ===

  /**
   * Métodos de compatibilidad con la versión anterior para transición gradual
   */
  async createReservation(data) {
    return this.manageReservation({
      action: RESERVATION_ACTIONS.CREATE,
      ...data
    });
  },

  async updateReservation(id, data) {
    return this.manageReservation({
      action: RESERVATION_ACTIONS.UPDATE,
      reserve_id: id,
      ...data
    });
  },

  async deleteReservation(id) {
    return this.manageReservation({
      action: RESERVATION_ACTIONS.CANCEL,
      reserve_id: id
    });
  },

  async getReservations(params = {}) {
    return this.getReservationReport(params);
  }
};

// Exportar también los datos mock actualizados
export { MOCK_PRODUCTS, MOCK_CLIENTS, MOCK_USERS };
export default mockReservationsAPIV2;
