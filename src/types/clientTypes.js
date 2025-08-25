/**
 * @fileoverview Tipos y definiciones para el sistema de gestión de clientes
 * Seguimiento Wave 1: Arquitectura Base Sólida
 */

/**
 * @typedef {Object} Client
 * @property {number} id - ID único del cliente
 * @property {string} name - Nombre del cliente
 * @property {string} [last_name] - Apellido del cliente
 * @property {string} [document_id] - Documento de identificación
 * @property {string} [contact] - Información de contacto (email/teléfono)
 * @property {string} [address] - Dirección del cliente
 * @property {boolean} [status] - Estado activo/inactivo del cliente
 * @property {string} created_at - Fecha de creación ISO string
 * @property {string} [updated_at] - Fecha de última actualización ISO string
 * @property {number} [user_id] - ID del usuario que creó el cliente
 */

/**
 * @typedef {Object} ClientFormData
 * @property {string} name - Nombre del cliente (requerido)
 * @property {string} [last_name] - Apellido del cliente
 * @property {string} [document_id] - Documento de identificación
 * @property {string} [contact] - Información de contacto
 * @property {string} [address] - Dirección del cliente
 */

/**
 * @typedef {Object} ClientSearchParams
 * @property {string} [search] - Término de búsqueda
 * @property {number} [page] - Número de página (1-based)
 * @property {number} [per_page] - Elementos por página
 * @property {string} [sort_by] - Campo para ordenar
 * @property {string} [sort_order] - Dirección del ordenamiento (asc/desc)
 * @property {boolean} [status] - Filtrar por estado activo/inactivo
 */

/**
 * @typedef {Object} ClientPagination
 * @property {number} current_page - Página actual
 * @property {number} per_page - Elementos por página
 * @property {number} total - Total de elementos
 * @property {number} total_pages - Total de páginas
 * @property {boolean} [has_next] - Indica si hay página siguiente
 * @property {boolean} [has_prev] - Indica si hay página anterior
 */

/**
 * @typedef {Object} ClientResponse
 * @property {Client[]} data - Array de clientes
 * @property {ClientPagination} [pagination] - Información de paginación
 * @property {Object} [meta] - Metadatos adicionales
 */

/**
 * @typedef {Object} ClientStats
 * @property {number} total_orders - Total de pedidos del cliente
 * @property {number} total_spent - Total gastado por el cliente
 * @property {string} [last_order_date] - Fecha del último pedido ISO string
 * @property {number} average_order_value - Valor promedio de pedidos
 * @property {string} [preferred_payment_method] - Método de pago preferido
 * @property {number} [loyalty_points] - Puntos de fidelidad
 */

/**
 * @typedef {Object} ClientOrder
 * @property {number} id - ID del pedido
 * @property {number} client_id - ID del cliente
 * @property {number} total_amount - Monto total del pedido
 * @property {string} status - Estado del pedido
 * @property {string} created_at - Fecha de creación ISO string
 * @property {Object[]} [items] - Items del pedido
 */

/**
 * @typedef {Object} ClientCacheEntry
 * @property {Client} data - Datos del cliente
 * @property {number} timestamp - Timestamp de cache
 * @property {number} ttl - Time to live en ms
 * @property {string} [etag] - ETag para validación
 */

/**
 * @typedef {Object} ClientStoreState
 * @property {Client[]} clients - Lista de clientes
 * @property {boolean} loading - Estado de carga
 * @property {string|null} error - Error actual
 * @property {string} lastSearchTerm - Último término de búsqueda
 * @property {number} currentPage - Página actual
 * @property {number} totalPages - Total de páginas
 * @property {number} totalClients - Total de clientes
 * @property {number} pageSize - Tamaño de página
 * @property {Object} cache - Cache de datos
 * @property {Object} circuit - Estado del circuit breaker
 * @property {boolean} offline - Modo offline activo
 * @property {number} lastSync - Timestamp última sincronización
 */

/**
 * Estados posibles del cliente
 */
export const CLIENT_STATUS = {
  ACTIVE: true,
  INACTIVE: false
};

/**
 * Tipos de operaciones para telemetría
 */
export const CLIENT_OPERATIONS = {
  LOAD: 'load',
  CREATE: 'create', 
  UPDATE: 'update',
  DELETE: 'delete',
  SEARCH: 'search',
  VIEW: 'view',
  EXPORT: 'export',
  IMPORT: 'import'
};

/**
 * Configuración de paginación por defecto
 */
export const CLIENT_PAGINATION_DEFAULTS = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5
};

/**
 * Configuración de cache
 */
export const CLIENT_CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5 minutos
  MAX_ENTRIES: 30,
  STALE_THRESHOLD: 0.5, // 50% del TTL
  PREFETCH_THRESHOLD: 3 // Prefetch cuando quedan 3 elementos
};

/**
 * Configuración del circuit breaker
 */
export const CLIENT_CIRCUIT_CONFIG = {
  FAILURE_THRESHOLD: 4,
  RECOVERY_TIMEOUT: 30000, // 30 segundos
  MONITOR_TIMEOUT: 5000 // 5 segundos
};

/**
 * Validadores de tipos
 */
export const ClientValidators = {
  /**
   * Valida si un objeto es un cliente válido
   * @param {any} obj - Objeto a validar
   * @returns {boolean} True si es válido
   */
  isValidClient: (obj) => {
    return obj && 
           typeof obj === 'object' &&
           typeof obj.id === 'number' &&
           typeof obj.name === 'string' &&
           obj.name.trim().length > 0;
  },

  /**
   * Valida datos de formulario de cliente
   * @param {ClientFormData} formData - Datos del formulario
   * @returns {Object} Resultado de validación con errores
   */
  validateClientForm: (formData) => {
    const errors = {};
    
    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (formData.contact && formData.contact.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
      
      if (!emailRegex.test(formData.contact) && !phoneRegex.test(formData.contact)) {
        errors.contact = 'Ingrese un email o teléfono válido';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default {
  CLIENT_STATUS,
  CLIENT_OPERATIONS,
  CLIENT_PAGINATION_DEFAULTS,
  CLIENT_CACHE_CONFIG,
  CLIENT_CIRCUIT_CONFIG,
  ClientValidators
};
