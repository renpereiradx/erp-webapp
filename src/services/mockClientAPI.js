/**
 * @fileoverview Sistema mock robusto para desarrollo independiente del backend
 * Seguimiento Wave 1: Arquitectura Base Sólida
 * 
 * Este mock permite desarrollo 100% independiente con datos consistentes
 * y comportamiento realista del API de clientes.
 */

import { CLIENT_VALIDATION_ERRORS, getClientErrorMessage } from '@/constants/clientErrors';
import { ClientValidators } from '@/types/clientTypes';

/**
 * Base de datos mock en memoria
 */
let mockClients = [
  {
    id: 1,
    name: 'Juan Carlos',
    last_name: 'Pérez González',
    document_id: '12345678-9',
    contact: 'juan.perez@email.com',
    address: 'Av. Principal 123, Santiago',
    status: true,
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-08-20T15:45:00Z',
    user_id: 1
  },
  {
    id: 2,
    name: 'María Isabel',
    last_name: 'Rodríguez Silva',
    document_id: '98765432-1',
    contact: '+56912345678',
    address: 'Calle Los Álamos 456, Valparaíso',
    status: true,
    created_at: '2025-02-20T14:20:00Z',
    updated_at: '2025-08-22T09:15:00Z',
    user_id: 1
  },
  {
    id: 3,
    name: 'Carlos Eduardo',
    last_name: 'Martínez López',
    document_id: '11223344-5',
    contact: 'carlos.martinez@empresa.cl',
    address: 'Pasaje Las Flores 789, Concepción',
    status: false,
    created_at: '2025-03-10T08:45:00Z',
    updated_at: '2025-08-18T11:30:00Z',
    user_id: 2
  },
  {
    id: 4,
    name: 'Ana Patricia',
    last_name: 'Fernández Castro',
    document_id: '55667788-0',
    contact: '+56987654321',
    address: 'Av. Libertador 321, La Serena',
    status: true,
    created_at: '2025-04-05T16:10:00Z',
    updated_at: '2025-08-24T13:20:00Z',
    user_id: 1
  },
  {
    id: 5,
    name: 'Roberto Antonio',
    last_name: 'Sánchez Morales',
    document_id: '33445566-7',
    contact: 'roberto.sanchez@correo.cl',
    address: 'Calle Central 654, Temuco',
    status: true,
    created_at: '2025-05-12T12:35:00Z',
    updated_at: '2025-08-23T07:50:00Z',
    user_id: 3
  },
  {
    id: 6,
    name: 'Luis Miguel',
    last_name: 'Torres Vega',
    document_id: '77889900-2',
    contact: '+56911223344',
    address: 'Plaza Mayor 987, Antofagasta',
    status: true,
    created_at: '2025-06-18T09:25:00Z',
    updated_at: '2025-08-21T14:40:00Z',
    user_id: 2
  },
  {
    id: 7,
    name: 'Carmen Rosa',
    last_name: 'Herrera Díaz',
    document_id: '22334455-8',
    contact: 'carmen.herrera@mail.com',
    address: 'Av. España 147, Valdivia',
    status: false,
    created_at: '2025-07-02T11:15:00Z',
    updated_at: '2025-08-19T16:25:00Z',
    user_id: 1
  },
  {
    id: 8,
    name: 'Fernando José',
    last_name: 'Gutiérrez Ramos',
    document_id: '66778899-3',
    contact: '+56955667788',
    address: 'Calle Norte 258, Iquique',
    status: true,
    created_at: '2025-07-20T15:50:00Z',
    updated_at: '2025-08-25T10:30:00Z',
    user_id: 3
  }
];

/**
 * Configuración del comportamiento mock
 */
const MOCK_CONFIG = {
  // Latencia simulada para operaciones (ms)
  LATENCY: {
    READ: 200,
    write: 500,
    search: 300,
    delete: 400
  },
  
  // Probabilidades de error simulado (0-1)
  ERROR_RATES: {
    network: 0.05,    // 5% errores de red
    server: 0.02,     // 2% errores del servidor
    validation: 0.1   // 10% errores de validación
  },
  
  // Configuración de paginación
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};

/**
 * Helper para simular latencia realista
 * @param {string} operation - Tipo de operación
 * @returns {Promise} Promise que resuelve después de la latencia
 */
const simulateLatency = (operation = 'read') => {
  const latency = MOCK_CONFIG.LATENCY[operation] || MOCK_CONFIG.LATENCY.read;
  return new Promise(resolve => setTimeout(resolve, latency));
};

/**
 * Helper para simular errores aleatorios
 * @param {string} errorType - Tipo de error a simular
 * @returns {boolean} True si debe simular error
 */
const shouldSimulateError = (errorType = 'network') => {
  const rate = MOCK_CONFIG.ERROR_RATES[errorType] || 0;
  return Math.random() < rate;
};

/**
 * Genera un nuevo ID único
 * @returns {number} Nuevo ID
 */
const generateNewId = () => {
  return Math.max(...mockClients.map(c => c.id), 0) + 1;
};

/**
 * Valida y normaliza parámetros de búsqueda
 * @param {Object} params - Parámetros de búsqueda
 * @returns {Object} Parámetros normalizados
 */
const normalizeSearchParams = (params = {}) => {
  return {
    search: params.search || '',
    page: Math.max(1, parseInt(params.page) || 1),
    per_page: Math.min(MOCK_CONFIG.MAX_PAGE_SIZE, parseInt(params.per_page) || MOCK_CONFIG.DEFAULT_PAGE_SIZE),
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order === 'asc' ? 'asc' : 'desc',
    status: params.status !== undefined ? Boolean(params.status) : undefined
  };
};

/**
 * Aplica filtros a la lista de clientes
 * @param {Array} clients - Lista de clientes
 * @param {Object} params - Parámetros de filtro
 * @returns {Array} Lista filtrada
 */
const applyFilters = (clients, params) => {
  let filtered = [...clients];
  
  // Filtro por término de búsqueda
  if (params.search && params.search.trim()) {
    const searchTerm = params.search.toLowerCase().trim();
    filtered = filtered.filter(client => {
      const fullName = `${client.name} ${client.last_name || ''}`.toLowerCase();
      const document = (client.document_id || '').toLowerCase();
      const contact = (client.contact || '').toLowerCase();
      
      return fullName.includes(searchTerm) || 
             document.includes(searchTerm) || 
             contact.includes(searchTerm);
    });
  }
  
  // Filtro por estado
  if (params.status !== undefined) {
    filtered = filtered.filter(client => client.status === params.status);
  }
  
  return filtered;
};

/**
 * Aplica ordenamiento a la lista de clientes
 * @param {Array} clients - Lista de clientes
 * @param {Object} params - Parámetros de ordenamiento
 * @returns {Array} Lista ordenada
 */
const applySorting = (clients, params) => {
  const { sort_by, sort_order } = params;
  
  return [...clients].sort((a, b) => {
    let valueA = a[sort_by];
    let valueB = b[sort_by];
    
    // Manejo especial para fechas
    if (sort_by.includes('_at')) {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }
    
    // Manejo especial para strings
    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }
    
    let comparison = 0;
    if (valueA > valueB) comparison = 1;
    if (valueA < valueB) comparison = -1;
    
    return sort_order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Aplica paginación a la lista de clientes
 * @param {Array} clients - Lista de clientes
 * @param {Object} params - Parámetros de paginación
 * @returns {Object} Resultado paginado
 */
const applyPagination = (clients, params) => {
  const { page, per_page } = params;
  const total = clients.length;
  const totalPages = Math.ceil(total / per_page);
  const offset = (page - 1) * per_page;
  const paginatedClients = clients.slice(offset, offset + per_page);
  
  return {
    data: paginatedClients,
    pagination: {
      current_page: page,
      per_page: per_page,
      total: total,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1
    }
  };
};

/**
 * API Mock para gestión de clientes
 */
export const mockClientAPI = {
  /**
   * Obtiene lista de clientes con filtros y paginación
   * @param {Object} params - Parámetros de búsqueda
   * @returns {Promise<Object>} Lista paginada de clientes
   */
  async getClients(params = {}) {
    await simulateLatency('read');
    
    // Simular errores ocasionales
    if (shouldSimulateError('network')) {
      throw new Error('Error de conexión simulado');
    }
    
    if (shouldSimulateError('server')) {
      throw new Error('Error del servidor simulado');
    }
    
    const normalizedParams = normalizeSearchParams(params);
    let clients = [...mockClients];
    
    // Aplicar filtros
    clients = applyFilters(clients, normalizedParams);
    
    // Aplicar ordenamiento
    clients = applySorting(clients, normalizedParams);
    
    // Aplicar paginación
    const result = applyPagination(clients, normalizedParams);
    
    console.log(`[MockAPI] getClients: ${result.data.length}/${result.pagination.total} clientes`);
    return result;
  },

  /**
   * Obtiene un cliente por ID
   * @param {number} id - ID del cliente
   * @returns {Promise<Object>} Cliente encontrado
   */
  async getClient(id) {
    await simulateLatency('read');
    
    if (shouldSimulateError('network')) {
      throw new Error('Error de conexión simulado');
    }
    
    const client = mockClients.find(c => c.id === parseInt(id));
    if (!client) {
      const error = new Error(getClientErrorMessage(CLIENT_VALIDATION_ERRORS.INVALID_ID));
      error.status = 404;
      throw error;
    }
    
    console.log(`[MockAPI] getClient: Cliente ${id} encontrado`);
    return client;
  },

  /**
   * Crea un nuevo cliente
   * @param {Object} clientData - Datos del cliente
   * @returns {Promise<Object>} Cliente creado
   */
  async createClient(clientData) {
    await simulateLatency('write');
    
    if (shouldSimulateError('validation')) {
      throw new Error('Error de validación simulado');
    }
    
    // Validar datos
    const validation = ClientValidators.validateClientForm(clientData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      const error = new Error(firstError);
      error.status = 400;
      throw error;
    }
    
    // Verificar duplicados por documento
    if (clientData.document_id) {
      const existing = mockClients.find(c => c.document_id === clientData.document_id);
      if (existing) {
        const error = new Error('Ya existe un cliente con este documento');
        error.status = 409;
        throw error;
      }
    }
    
    const newClient = {
      id: generateNewId(),
      name: clientData.name.trim(),
      last_name: clientData.last_name?.trim() || '',
      document_id: clientData.document_id?.trim() || '',
      contact: clientData.contact?.trim() || '',
      address: clientData.address?.trim() || '',
      status: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 1 // Mock user ID
    };
    
    mockClients.push(newClient);
    console.log(`[MockAPI] createClient: Cliente ${newClient.id} creado`);
    return newClient;
  },

  /**
   * Actualiza un cliente existente
   * @param {number} id - ID del cliente
   * @param {Object} clientData - Datos actualizados
   * @returns {Promise<Object>} Cliente actualizado
   */
  async updateClient(id, clientData) {
    await simulateLatency('write');
    
    if (shouldSimulateError('validation')) {
      throw new Error('Error de validación simulado');
    }
    
    const clientIndex = mockClients.findIndex(c => c.id === parseInt(id));
    if (clientIndex === -1) {
      const error = new Error('Cliente no encontrado');
      error.status = 404;
      throw error;
    }
    
    // Validar datos
    const validation = ClientValidators.validateClientForm(clientData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      const error = new Error(firstError);
      error.status = 400;
      throw error;
    }
    
    // Verificar duplicados por documento (excluyendo el cliente actual)
    if (clientData.document_id) {
      const existing = mockClients.find(c => 
        c.document_id === clientData.document_id && c.id !== parseInt(id)
      );
      if (existing) {
        const error = new Error('Ya existe otro cliente con este documento');
        error.status = 409;
        throw error;
      }
    }
    
    const updatedClient = {
      ...mockClients[clientIndex],
      name: clientData.name.trim(),
      last_name: clientData.last_name?.trim() || '',
      document_id: clientData.document_id?.trim() || '',
      contact: clientData.contact?.trim() || '',
      address: clientData.address?.trim() || '',
      updated_at: new Date().toISOString()
    };
    
    mockClients[clientIndex] = updatedClient;
    console.log(`[MockAPI] updateClient: Cliente ${id} actualizado`);
    return updatedClient;
  },

  /**
   * Elimina un cliente
   * @param {number} id - ID del cliente
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async deleteClient(id) {
    await simulateLatency('delete');
    
    if (shouldSimulateError('network')) {
      throw new Error('Error de conexión simulado');
    }
    
    const clientIndex = mockClients.findIndex(c => c.id === parseInt(id));
    if (clientIndex === -1) {
      const error = new Error('Cliente no encontrado');
      error.status = 404;
      throw error;
    }
    
    const deletedClient = mockClients.splice(clientIndex, 1)[0];
    console.log(`[MockAPI] deleteClient: Cliente ${id} eliminado`);
    return { success: true, deleted: deletedClient };
  },

  /**
   * Busca clientes por término general
   * @param {string} query - Término de búsqueda
   * @returns {Promise<Array>} Lista de clientes encontrados
   */
  async searchClients(query) {
    await simulateLatency('search');
    
    if (!query || query.trim() === '') {
      return mockClients;
    }
    
    const searchTerm = query.toLowerCase().trim();
    const results = mockClients.filter(client => {
      const fullName = `${client.name} ${client.last_name || ''}`.toLowerCase();
      const document = (client.document_id || '').toLowerCase();
      const contact = (client.contact || '').toLowerCase();
      
      return fullName.includes(searchTerm) || 
             document.includes(searchTerm) || 
             contact.includes(searchTerm);
    });
    
    console.log(`[MockAPI] searchClients: ${results.length} resultados para "${query}"`);
    return results;
  },

  /**
   * Obtiene estadísticas mock de un cliente
   * @param {number} clientId - ID del cliente
   * @returns {Promise<Object>} Estadísticas del cliente
   */
  async getClientStats(clientId) {
    await simulateLatency('read');
    
    const client = mockClients.find(c => c.id === parseInt(clientId));
    if (!client) {
      throw new Error('Cliente no encontrado');
    }
    
    // Generar estadísticas mock realistas
    const stats = {
      total_orders: Math.floor(Math.random() * 50),
      total_spent: Math.floor(Math.random() * 100000),
      last_order_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      average_order_value: Math.floor(Math.random() * 5000)
    };
    
    console.log(`[MockAPI] getClientStats: Estadísticas para cliente ${clientId}`);
    return stats;
  },

  /**
   * Resetea los datos mock al estado inicial
   */
  resetMockData() {
    console.log('[MockAPI] Reseteando datos mock...');
    // Aquí podrías recargar desde un archivo o API
    // Por ahora mantenemos los datos en memoria
  },

  /**
   * Obtiene configuración actual del mock
   * @returns {Object} Configuración del mock
   */
  getMockConfig() {
    return { ...MOCK_CONFIG };
  },

  /**
   * Actualiza configuración del mock
   * @param {Object} newConfig - Nueva configuración
   */
  updateMockConfig(newConfig) {
    Object.assign(MOCK_CONFIG, newConfig);
    console.log('[MockAPI] Configuración actualizada:', MOCK_CONFIG);
  }
};

export default mockClientAPI;
