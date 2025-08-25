/**
 * Simulador de datos para desarrollo sin API backend
 * Proporciona datos mock realistas para reservas
 */

// Simulador de delay de red
const networkDelay = (min = 200, max = 800) => 
  new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

// Datos mock de productos/servicios
const MOCK_PRODUCTS = [
  {
    id: 'CANCHA_TENIS_1',
    name: 'Cancha de Tenis #1',
    price: 50,
    duration: 1.5,
    category: 'deportes',
    description: 'Cancha profesional de tenis con superficie de arcilla'
  },
  {
    id: 'CANCHA_TENIS_2', 
    name: 'Cancha de Tenis #2',
    price: 45,
    duration: 1.5,
    category: 'deportes',
    description: 'Cancha de tenis con superficie sintética'
  },
  {
    id: 'SALON_EVENTOS',
    name: 'Salón de Eventos',
    price: 120,
    duration: 4,
    category: 'eventos',
    description: 'Salón principal para eventos de hasta 100 personas'
  },
  {
    id: 'CONSULTORIO_MED',
    name: 'Consultorio Médico',
    price: 80,
    duration: 1,
    category: 'salud',
    description: 'Consultorio equipado para consultas médicas'
  },
  {
    id: 'SALA_REUNIONES',
    name: 'Sala de Reuniones',
    price: 30,
    duration: 2,
    category: 'oficina',
    description: 'Sala equipada con proyector y videoconferencia'
  }
];

// Datos mock de clientes
const MOCK_CLIENTS = [
  {
    id: 'CLI_001',
    name: 'Ana García Rodríguez',
    email: 'ana.garcia@email.com',
    phone: '+34 666 123 456',
    document: '12345678A'
  },
  {
    id: 'CLI_002', 
    name: 'Carlos Martínez López',
    email: 'carlos.martinez@email.com',
    phone: '+34 666 234 567',
    document: '23456789B'
  },
  {
    id: 'CLI_003',
    name: 'María Santos Fernández',
    email: 'maria.santos@email.com',
    phone: '+34 666 345 678',
    document: '34567890C'
  },
  {
    id: 'CLI_004',
    name: 'David Ruiz González',
    email: 'david.ruiz@email.com',
    phone: '+34 666 456 789',
    document: '45678901D'
  },
  {
    id: 'CLI_005',
    name: 'Laura Jiménez Moreno',
    email: 'laura.jimenez@email.com',
    phone: '+34 666 567 890',
    document: '56789012E'
  }
];

// Estados de reservas
const RESERVATION_STATUSES = ['RESERVED', 'confirmed', 'completed', 'cancelled'];

// Generar datos mock de reservas
const generateMockReservations = (count = 50) => {
  const reservations = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const product = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
    const client = MOCK_CLIENTS[Math.floor(Math.random() * MOCK_CLIENTS.length)];
    const status = RESERVATION_STATUSES[Math.floor(Math.random() * RESERVATION_STATUSES.length)];
    
    // Generar fecha aleatoria (últimos 30 días y próximos 30 días)
    const randomDays = Math.floor(Math.random() * 60) - 30;
    const reservationDate = new Date(now);
    reservationDate.setDate(now.getDate() + randomDays);
    
    // Generar hora aleatoria (8:00 - 20:00)
    const randomHour = Math.floor(Math.random() * 12) + 8;
    const randomMinute = Math.random() < 0.5 ? 0 : 30;
    reservationDate.setHours(randomHour, randomMinute, 0, 0);
    
    const subtotal = product.price * product.duration;
    const tax = subtotal * 0.16;
    const total = subtotal + tax;
    
    reservations.push({
      id: `RES_${String(i + 1).padStart(3, '0')}`,
      product_id: product.id,
      product_name: product.name,
      client_id: client.id,
      client_name: client.name,
      client_email: client.email,
      date: reservationDate.toISOString().split('T')[0],
      start_time: reservationDate.toTimeString().split(' ')[0].substring(0, 5),
      end_time: new Date(reservationDate.getTime() + product.duration * 60 * 60 * 1000)
        .toTimeString().split(' ')[0].substring(0, 5),
      duration: product.duration,
      status,
      notes: Math.random() < 0.3 ? 'Reserva con notas especiales' : '',
      pricing: {
        subtotal,
        tax,
        total
      },
      created_at: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return reservations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

// Cache en memoria para simular persistencia
let mockReservationsCache = generateMockReservations();

// Cache de horarios (schedules)
let mockSchedulesCache = JSON.parse(localStorage.getItem('mockSchedulesCache') || '[]');

// API Simulada
export const mockReservationsAPI = {
  // Obtener reservas con filtros y paginación
  async getReservations({ page = 1, limit = 20, search = '', status = '', dateFrom = '', dateTo = '', productId = '', clientName = '' } = {}) {
    await networkDelay();
    
    let filtered = [...mockReservationsCache];
    
    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.client_name.toLowerCase().includes(searchLower) ||
        r.product_name.toLowerCase().includes(searchLower) ||
        r.id.toLowerCase().includes(searchLower)
      );
    }
    
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    
    if (dateFrom) {
      filtered = filtered.filter(r => r.date >= dateFrom);
    }
    
    if (dateTo) {
      filtered = filtered.filter(r => r.date <= dateTo);
    }
    
    if (productId) {
      filtered = filtered.filter(r => r.product_id === productId);
    }
    
    if (clientName) {
      const clientNameLower = clientName.toLowerCase();
      filtered = filtered.filter(r => r.client_name.toLowerCase().includes(clientNameLower));
    }
    
    // Paginación
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const reservations = filtered.slice(offset, offset + limit);
    
    return {
      data: reservations,
      pagination: {
        current_page: page,
        per_page: limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    };
  },

  // Crear nueva reserva
  async createReservation(reservationData) {
    await networkDelay();
    
    const product = MOCK_PRODUCTS.find(p => p.id === reservationData.product_id);
    const client = MOCK_CLIENTS.find(c => c.id === reservationData.client_id);
    
    if (!product) throw new Error('Producto no encontrado');
    if (!client) throw new Error('Cliente no encontrado');
    
    const subtotal = product.price * reservationData.duration;
    const tax = subtotal * 0.16;
    const total = subtotal + tax;
    
    const newReservation = {
      id: `RES_${String(mockReservationsCache.length + 1).padStart(3, '0')}`,
      product_id: product.id,
      product_name: product.name,
      client_id: client.id,
      client_name: client.name,
      client_email: client.email,
      date: reservationData.date,
      start_time: reservationData.start_time,
      end_time: new Date(new Date(`${reservationData.date}T${reservationData.start_time}:00`).getTime() + 
        reservationData.duration * 60 * 60 * 1000).toTimeString().split(' ')[0].substring(0, 5),
      duration: reservationData.duration,
      status: 'RESERVED',
      notes: reservationData.notes || '',
      pricing: { subtotal, tax, total },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockReservationsCache.unshift(newReservation);
    return newReservation;
  },

  // Actualizar reserva
  async updateReservation(id, updates) {
    await networkDelay();
    
    const index = mockReservationsCache.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reserva no encontrada');
    
    mockReservationsCache[index] = {
      ...mockReservationsCache[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    return mockReservationsCache[index];
  },

  // Cancelar reserva
  async cancelReservation(id) {
    return this.updateReservation(id, { status: 'cancelled' });
  },

  // Confirmar reserva
  async confirmReservation(id) {
    return this.updateReservation(id, { status: 'confirmed' });
  },

  // Obtener estadísticas
  async getStats() {
    await networkDelay(100, 300);
    
    const total = mockReservationsCache.length;
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = mockReservationsCache.filter(r => r.date === today);
    
    const byStatus = RESERVATION_STATUSES.reduce((acc, status) => {
      acc[status] = mockReservationsCache.filter(r => r.status === status).length;
      return acc;
    }, {});
    
    const active = byStatus.RESERVED + byStatus.confirmed;
    const completed = byStatus.completed;
    const cancelled = byStatus.cancelled;
    
    return {
      total,
      today: todayReservations.length,
      active,
      completed,
      cancelled,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      cancellation_rate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      by_status: byStatus
    };
  },

  // =================================
  // SCHEDULE MANAGEMENT ENDPOINTS
  // =================================

  // Obtener horario por ID
  async getScheduleById(id) {
    await networkDelay(100, 300);
    const schedule = mockSchedulesCache.find(s => s.id === parseInt(id));
    if (!schedule) throw new Error('Horario no encontrado');
    return schedule;
  },

  // Obtener horarios disponibles para producto/fecha
  async getAvailableSchedulesForDate(productId, date) {
    await networkDelay(200, 500);
    
    this.ensureSchedulesForDate(productId, date);
    
    return mockSchedulesCache.filter(schedule => {
      const scheduleDate = new Date(schedule.start_time).toISOString().split('T')[0];
      return scheduleDate === date && 
             schedule.product_id === productId && 
             schedule.is_available;
    });
  },

  // Obtener horarios por rango de fechas
  async getSchedulesByDateRange(startDate, endDate, params = {}) {
    await networkDelay(300, 600);
    
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 20;
    
    const filteredSchedules = mockSchedulesCache.filter(schedule => {
      const scheduleDate = new Date(schedule.start_time).toISOString().split('T')[0];
      return scheduleDate >= startDate && scheduleDate <= endDate;
    });
    
    // Enriquecer con nombres de productos
    const enrichedSchedules = filteredSchedules.map(schedule => ({
      ...schedule,
      product_name: MOCK_PRODUCTS.find(p => p.id === schedule.product_id)?.name || 'Producto desconocido'
    }));
    
    // Paginación
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedSchedules = enrichedSchedules.slice(startIndex, endIndex);
    
    return paginatedSchedules;
  },

  // Obtener horarios por producto
  async getSchedulesByProduct(productId, params = {}) {
    await networkDelay(200, 400);
    
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 20;
    
    const filteredSchedules = mockSchedulesCache.filter(schedule => 
      schedule.product_id === productId
    );
    
    // Paginación
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedSchedules = filteredSchedules.slice(startIndex, endIndex);
    
    return paginatedSchedules;
  },

  // Actualizar disponibilidad de horario
  async updateScheduleAvailability(id, isAvailable) {
    await networkDelay(150, 350);
    
    const index = mockSchedulesCache.findIndex(s => s.id === parseInt(id));
    if (index === -1) throw new Error('Horario no encontrado');
    
    mockSchedulesCache[index].is_available = isAvailable;
    
    // Persist to localStorage
    localStorage.setItem('mockSchedulesCache', JSON.stringify(mockSchedulesCache));
    
    return { message: 'Schedule availability updated successfully' };
  },

  // Generar horarios diarios automáticamente
  async generateDailySchedules() {
    await networkDelay(500, 1000);
    
    const today = new Date().toISOString().split('T')[0];
    let generatedCount = 0;
    
    for (const product of MOCK_PRODUCTS) {
      const dailySchedules = this.generateSchedulesForProductAndDate(product.id, today);
      generatedCount += dailySchedules.length;
    }
    
    // Persist to localStorage
    localStorage.setItem('mockSchedulesCache', JSON.stringify(mockSchedulesCache));
    
    return { 
      message: 'Daily schedules generated successfully',
      generated_count: generatedCount,
      date: today
    };
  },

  // Generar horarios para fecha específica
  async generateSchedulesForDate(targetDate) {
    await networkDelay(400, 800);
    
    let generatedCount = 0;
    
    for (const product of MOCK_PRODUCTS) {
      const schedules = this.generateSchedulesForProductAndDate(product.id, targetDate);
      generatedCount += schedules.length;
    }
    
    // Persist to localStorage
    localStorage.setItem('mockSchedulesCache', JSON.stringify(mockSchedulesCache));
    
    return { 
      message: `Schedules generated successfully for ${targetDate}`,
      generated_count: generatedCount,
      date: targetDate
    };
  },

  // Generar horarios para próximos N días
  async generateSchedulesForNextDays(days) {
    await networkDelay(600, 1200);
    
    if (days < 1 || days > 365) {
      throw new Error('Days must be between 1 and 365');
    }
    
    let generatedCount = 0;
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      for (const product of MOCK_PRODUCTS) {
        const schedules = this.generateSchedulesForProductAndDate(product.id, dateStr);
        generatedCount += schedules.length;
      }
    }
    
    // Persist to localStorage
    localStorage.setItem('mockSchedulesCache', JSON.stringify(mockSchedulesCache));
    
    return { 
      message: `Schedules generated successfully for next ${days} days`,
      generated_count: generatedCount,
      days
    };
  },

  // Utilidad: generar horarios para un producto y fecha específica
  generateSchedulesForProductAndDate(productId, date) {
    const schedules = [];
    const baseDate = new Date(date);
    
    // Evitar duplicados
    const existingSchedules = mockSchedulesCache.filter(s => {
      const scheduleDate = new Date(s.start_time).toISOString().split('T')[0];
      return scheduleDate === date && s.product_id === productId;
    });
    
    if (existingSchedules.length > 0) {
      return []; // Ya existen horarios para esta fecha/producto
    }
    
    // Generar horarios de 9:00 AM a 6:00 PM cada 30 minutos
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break; // No después de 6:00 PM
        
        const startTime = new Date(baseDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);
        
        const schedule = {
          id: mockSchedulesCache.length + schedules.length + 1,
          product_id: productId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          is_available: Math.random() > 0.3 // 70% disponibles aleatoriamente
        };
        
        schedules.push(schedule);
      }
    }
    
    mockSchedulesCache.push(...schedules);
    return schedules;
  },

  // Utilidad: asegurar que existan horarios para una fecha
  ensureSchedulesForDate(productId, date) {
    const existingSchedules = mockSchedulesCache.filter(s => {
      const scheduleDate = new Date(s.start_time).toISOString().split('T')[0];
      return scheduleDate === date && s.product_id === productId;
    });
    
    if (existingSchedules.length === 0) {
      this.generateSchedulesForProductAndDate(productId, date);
    }
  }
};

// Exportar también los datos mock para uso directo
export { MOCK_PRODUCTS, MOCK_CLIENTS, RESERVATION_STATUSES };
export default mockReservationsAPI;
