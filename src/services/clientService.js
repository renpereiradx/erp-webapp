/**
 * @fileoverview Servicio hardened para gestión de clientes
 * Seguimiento Wave 1: Arquitectura Base Sólida
 * 
 * Features:
 * - Fallback automático API → Mock
 * - Normalización defensiva de respuestas
 * - Validación exhaustiva
 * - Error handling robusto
 * - Retry logic integrado
 */

import { apiClient } from './api';
import { mockClientAPI } from './mockClientAPI';
import { 
  CLIENT_API_ERRORS, 
  CLIENT_VALIDATION_ERRORS,
  getClientErrorMessage,
  isRecoverableError 
} from '@/constants/clientErrors';
import { ClientValidators } from '@/types/clientTypes';

/**
 * Configuración del servicio
 */
const SERVICE_CONFIG = {
  // Fallback automático cuando API falla
  enableMockFallback: process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENABLE_MOCK_FALLBACK === 'true',
  
  // Timeouts
  defaultTimeout: 10000, // 10 segundos
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // 1 segundo base
  
  // Validación de respuestas
  validateResponses: true
};

/**
 * Helper para normalizar respuestas del API
 * Maneja múltiples formatos de respuesta del backend
 */
const normalizeApiResponse = (response, operation = 'unknown') => {
  if (!response) {
    throw new Error(getClientErrorMessage(CLIENT_API_ERRORS.INVALID_RESPONSE));
  }

  // Si es un array directo
  if (Array.isArray(response)) {
    return {
      data: response,
      pagination: null
    };
  }

  // Si tiene estructura estándar
  if (response.data && Array.isArray(response.data)) {
    return {
      data: response.data,
      pagination: response.pagination || response.meta?.pagination || null
    };
  }

  // Si tiene estructura alternativa con clientes
  if (response.clients && Array.isArray(response.clients)) {
    return {
      data: response.clients,
      pagination: response.pagination || null
    };
  }

  // Si es un objeto individual (getById)
  if (response.id && response.name) {
    return response;
  }

  // Buscar arrays anidados como fallback
  const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
  if (possibleArrays.length > 0) {
    console.warn(`[ClientService] Respuesta con formato no estándar en ${operation}, usando fallback`);
    return {
      data: possibleArrays[0],
      pagination: null
    };
  }

  throw new Error(getClientErrorMessage(CLIENT_API_ERRORS.INVALID_RESPONSE));
};

/**
 * Helper para validar datos de cliente
 */
const validateClientData = (clientData, isUpdate = false) => {
  if (!clientData || typeof clientData !== 'object') {
    throw new Error(getClientErrorMessage(CLIENT_VALIDATION_ERRORS.INVALID_DATA));
  }

  // Validación específica usando validators
  const validation = ClientValidators.validateClientForm(clientData);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError);
  }

  return true;
};

/**
 * Helper para implementar retry con backoff exponencial
 */
const withRetry = async (operation, maxRetries = SERVICE_CONFIG.maxRetries) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // No reintentar errores no recuperables
      if (!isRecoverableError(error.code) && error.status < 500) {
        throw error;
      }
      
      // No reintentar en el último intento
      if (attempt === maxRetries) {
        break;
      }
      
      // Backoff exponencial con jitter
      const delay = SERVICE_CONFIG.retryDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.1 * delay;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      
      console.warn(`[ClientService] Reintento ${attempt}/${maxRetries} después de error:`, error.message);
    }
  }
  
  throw lastError;
};

/**
 * Helper para ejecutar operación con fallback a mock
 */
const withMockFallback = async (apiOperation, mockOperation, operationName) => {
  try {
    const result = await withRetry(apiOperation);
    console.log(`[ClientService] ${operationName} exitoso via API`);
    return result;
  } catch (apiError) {
    console.warn(`[ClientService] API falló para ${operationName}:`, apiError.message);
    
    if (SERVICE_CONFIG.enableMockFallback) {
      console.log(`[ClientService] Usando fallback mock para ${operationName}`);
      try {
        const mockResult = await mockOperation();
        console.log(`[ClientService] ${operationName} exitoso via Mock`);
        return mockResult;
      } catch (mockError) {
        console.error(`[ClientService] Mock también falló para ${operationName}:`, mockError.message);
        throw apiError; // Lanzar el error original del API
      }
    }
    
    throw apiError;
  }
};

export const clientService = {
  /**
   * Obtiene lista de clientes con paginación y filtros
   * @param {Object} params - Parámetros de búsqueda
   * @returns {Promise<Object>} Lista paginada de clientes
   */
  getClients: async (params = {}) => {
    const apiOperation = async () => {
      const response = await apiClient.getClients(params);
      return normalizeApiResponse(response, 'getClients');
    };
    
    const mockOperation = async () => {
      return await mockClientAPI.getClients(params);
    };
    
    return await withMockFallback(apiOperation, mockOperation, 'getClients');
  },

  /**
   * Obtiene un cliente por ID
   * @param {number} id - ID del cliente
   * @returns {Promise<Object>} Cliente encontrado
   */
  getClientById: async (id) => {
    if (!id || isNaN(parseInt(id))) {
      throw new Error(getClientErrorMessage(CLIENT_VALIDATION_ERRORS.INVALID_ID));
    }
    
    const apiOperation = async () => {
      const response = await apiClient.getClient(id);
      return normalizeApiResponse(response, 'getClientById');
    };
    
    const mockOperation = async () => {
      return await mockClientAPI.getClient(id);
    };
    
    return await withMockFallback(apiOperation, mockOperation, 'getClientById');
  },

  /**
   * Obtiene un cliente por nombre
   * @param {string} name - Nombre del cliente
   * @returns {Promise<Object>} Cliente encontrado
   */
  getClientByName: async (name) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error(getClientErrorMessage(CLIENT_VALIDATION_ERRORS.NAME_REQUIRED));
    }
    
    const apiOperation = async () => {
      const response = await apiClient.makeRequest(`/client/name/${encodeURIComponent(name)}`, { method: 'GET' });
      return normalizeApiResponse(response, 'getClientByName');
    };
    
    const mockOperation = async () => {
      // Buscar en mock API usando searchClients
      const results = await mockClientAPI.searchClients(name);
      const exactMatch = results.find(client => 
        client.name.toLowerCase() === name.toLowerCase() ||
        `${client.name} ${client.last_name || ''}`.toLowerCase() === name.toLowerCase()
      );
      
      if (!exactMatch) {
        const error = new Error('Cliente no encontrado');
        error.status = 404;
        throw error;
      }
      
      return exactMatch;
    };
    
    return await withMockFallback(apiOperation, mockOperation, 'getClientByName');
  },

  /**
   * Crea un nuevo cliente
   * @param {Object} clientData - Datos del cliente
   * @returns {Promise<Object>} Cliente creado
   */
  createClient: async (clientData) => {
    validateClientData(clientData, false);
    
    const apiOperation = async () => {
      const response = await apiClient.createClient(clientData);
      return normalizeApiResponse(response, 'createClient');
    };
    
    const mockOperation = async () => {
      return await mockClientAPI.createClient(clientData);
    };
    
    return await withMockFallback(apiOperation, mockOperation, 'createClient');
  },

  /**
   * Actualiza un cliente existente
   * @param {number} id - ID del cliente
   * @param {Object} clientData - Datos actualizados
   * @returns {Promise<Object>} Cliente actualizado
   */
  updateClient: async (id, clientData) => {
    if (!id || isNaN(parseInt(id))) {
      throw new Error(getClientErrorMessage(CLIENT_VALIDATION_ERRORS.INVALID_ID));
    }
    
    validateClientData(clientData, true);
    
    const apiOperation = async () => {
      const response = await apiClient.updateClient(id, clientData);
      return normalizeApiResponse(response, 'updateClient');
    };
    
    const mockOperation = async () => {
      return await mockClientAPI.updateClient(id, clientData);
    };
    
    return await withMockFallback(apiOperation, mockOperation, 'updateClient');
  },

  /**
   * Elimina un cliente
   * @param {number} id - ID del cliente
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  deleteClient: async (id) => {
    if (!id || isNaN(parseInt(id))) {
      throw new Error(getClientErrorMessage(CLIENT_VALIDATION_ERRORS.INVALID_ID));
    }
    
    const apiOperation = async () => {
      const response = await apiClient.deleteClient(id);
      return response;
    };
    
    const mockOperation = async () => {
      return await mockClientAPI.deleteClient(id);
    };
    
    return await withMockFallback(apiOperation, mockOperation, 'deleteClient');
  },

  /**
   * Busca clientes por término general
   * @param {string} query - Término de búsqueda
   * @returns {Promise<Array>} Lista de clientes encontrados
   */
  searchClients: async (query) => {
    if (!query || typeof query !== 'string') {
      // Si no hay query, devolver lista completa
      const result = await clientService.getClients();
      return Array.isArray(result) ? result : result.data || [];
    }
    
    const apiOperation = async () => {
      // Intentar usar endpoint de búsqueda específico si existe
      try {
        const response = await apiClient.makeRequest(`/clients/search?q=${encodeURIComponent(query)}`, { method: 'GET' });
        return normalizeApiResponse(response, 'searchClients');
      } catch (searchError) {
        // Fallback a getClients con filtro local
        console.log('[ClientService] Usando fallback de búsqueda local');
        const allClients = await apiClient.getClients();
        const normalized = normalizeApiResponse(allClients, 'searchClients');
        const clientsList = Array.isArray(normalized) ? normalized : normalized.data || [];
        
        const searchTerm = query.toLowerCase().trim();
        return clientsList.filter(client => {
          const fullName = `${client.name} ${client.last_name || ''}`.toLowerCase();
          const document = (client.document_id || '').toLowerCase();
          const contact = (client.contact || '').toLowerCase();
          
          return fullName.includes(searchTerm) || 
                 document.includes(searchTerm) || 
                 contact.includes(searchTerm);
        });
      }
    };
    
    const mockOperation = async () => {
      return await mockClientAPI.searchClients(query);
    };
    
    const result = await withMockFallback(apiOperation, mockOperation, 'searchClients');
    return Array.isArray(result) ? result : result.data || [];
  },

  /**
   * Obtiene historial de pedidos de un cliente
   * @param {number} clientId - ID del cliente
   * @param {Object} params - Parámetros de búsqueda
   * @returns {Promise<Object>} Historial de pedidos
   */
  getClientOrders: async (clientId, params = {}) => {
    if (!clientId || isNaN(parseInt(clientId))) {
      throw new Error(getClientErrorMessage(CLIENT_VALIDATION_ERRORS.INVALID_ID));
    }
    
    const apiOperation = async () => {
      try {
        const response = await apiClient.makeRequest(`/clients/${clientId}/orders`, { 
          method: 'GET',
          params 
        });
        return normalizeApiResponse(response, 'getClientOrders');
      } catch (error) {
        // Si no está implementado, devolver estructura vacía
        if (error.status === 404) {
          return {
            data: [],
            pagination: {
              current_page: 1,
              per_page: 10,
              total: 0,
              total_pages: 0
            }
          };
        }
        throw error;
      }
    };
    
    const mockOperation = async () => {
      // Mock devuelve estructura vacía por ahora
      return {
        data: [],
        pagination: {
          current_page: 1,
          per_page: 10,
          total: 0,
          total_pages: 0
        }
      };
    };
    
    return await withMockFallback(apiOperation, mockOperation, 'getClientOrders');
  },

  /**
   * Obtiene estadísticas de un cliente
   * @param {number} clientId - ID del cliente
   * @returns {Promise<Object>} Estadísticas del cliente
   */
  getClientStats: async (clientId) => {
    if (!clientId || isNaN(parseInt(clientId))) {
      throw new Error(getClientErrorMessage(CLIENT_VALIDATION_ERRORS.INVALID_ID));
    }
    
    const apiOperation = async () => {
      try {
        const response = await apiClient.makeRequest(`/clients/${clientId}/stats`, { method: 'GET' });
        return response;
      } catch (error) {
        // Si no está implementado, devolver estadísticas vacías
        if (error.status === 404) {
          return {
            total_orders: 0,
            total_spent: 0,
            last_order_date: null,
            average_order_value: 0
          };
        }
        throw error;
      }
    };
    
    const mockOperation = async () => {
      return await mockClientAPI.getClientStats(clientId);
    };
    
    return await withMockFallback(apiOperation, mockOperation, 'getClientStats');
  },

  /**
   * Obtiene clientes más activos
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>} Lista de top clientes
   */
  getTopClients: async (limit = 10) => {
    const apiOperation = async () => {
      try {
        const response = await apiClient.makeRequest(`/clients/top?limit=${limit}`, { method: 'GET' });
        return normalizeApiResponse(response, 'getTopClients');
      } catch (error) {
        // Fallback a primeros clientes
        const allClients = await apiClient.getClients();
        const normalized = normalizeApiResponse(allClients, 'getTopClients');
        const clientsList = Array.isArray(normalized) ? normalized : normalized.data || [];
        return clientsList.slice(0, limit);
      }
    };
    
    const mockOperation = async () => {
      const allClients = await mockClientAPI.getClients();
      const clientsList = Array.isArray(allClients) ? allClients : allClients.data || [];
      return clientsList.slice(0, limit);
    };
    
    const result = await withMockFallback(apiOperation, mockOperation, 'getTopClients');
    return Array.isArray(result) ? result : result.data || [];
  },

  /**
   * Activa/desactiva un cliente
   * @param {number} id - ID del cliente
   * @param {boolean} status - Nuevo estado
   * @returns {Promise<Object>} Cliente actualizado
   */
  toggleClientStatus: async (id, status) => {
    if (!id || isNaN(parseInt(id))) {
      throw new Error(getClientErrorMessage(CLIENT_VALIDATION_ERRORS.INVALID_ID));
    }
    
    if (typeof status !== 'boolean') {
      throw new Error(getClientErrorMessage(CLIENT_VALIDATION_ERRORS.INVALID_STATUS));
    }
    
    const apiOperation = async () => {
      try {
        const response = await apiClient.makeRequest(`/clients/${id}/toggle-status`, { 
          method: 'PATCH',
          data: { status }
        });
        return normalizeApiResponse(response, 'toggleClientStatus');
      } catch (error) {
        // Fallback a update normal
        return await apiClient.updateClient(id, { status });
      }
    };
    
    const mockOperation = async () => {
      return await mockClientAPI.updateClient(id, { status });
    };
    
    return await withMockFallback(apiOperation, mockOperation, 'toggleClientStatus');
  },

  /**
   * Configuración y utilidades del servicio
   */
  
  /**
   * Obtiene configuración actual del servicio
   * @returns {Object} Configuración actual
   */
  getServiceConfig: () => {
    return { ...SERVICE_CONFIG };
  },

  /**
   * Actualiza configuración del servicio
   * @param {Object} newConfig - Nueva configuración
   */
  updateServiceConfig: (newConfig) => {
    Object.assign(SERVICE_CONFIG, newConfig);
    console.log('[ClientService] Configuración actualizada:', SERVICE_CONFIG);
  },

  /**
   * Habilita/deshabilita fallback a mock
   * @param {boolean} enabled - Estado del fallback
   */
  setMockFallback: (enabled) => {
    SERVICE_CONFIG.enableMockFallback = enabled;
    console.log(`[ClientService] Mock fallback ${enabled ? 'habilitado' : 'deshabilitado'}`);
  },

  /**
   * Resetea configuración a valores por defecto
   */
  resetConfig: () => {
    SERVICE_CONFIG.enableMockFallback = process.env.NODE_ENV === 'development';
    SERVICE_CONFIG.defaultTimeout = 10000;
    SERVICE_CONFIG.maxRetries = 3;
    SERVICE_CONFIG.retryDelay = 1000;
    SERVICE_CONFIG.validateResponses = true;
    console.log('[ClientService] Configuración reseteada a valores por defecto');
  }
};

export default clientService;

