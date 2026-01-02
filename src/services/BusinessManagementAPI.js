// 🚀 Business Management API Client
// Archivo adaptado para nuestra aplicación ERP
// Basado en la documentación del equipo de backend
import { ApiError, toApiError } from '@/utils/ApiError'
import API_CONFIG from '@/config/api.config'

class BusinessManagementAPI {
  constructor(config = {}) {
    // Usar configuración centralizada con posibilidad de override
    this.baseUrl = config.baseUrl || API_CONFIG.baseUrl
    this.timeout = config.timeout || API_CONFIG.timeout
    this.defaultHeaders = {
      ...API_CONFIG.defaultHeaders,
      ...config.defaultHeaders,
    }

    // Log de inicialización solo en desarrollo
    if (API_CONFIG.isDevelopment()) {
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getAuthHeaders() {
    // 🔧 FIX: Obtener token FRESCO en cada llamada
    // No cachear el token - siempre leer del localStorage
    // Esto garantiza que si el token se renovó, se use el nuevo
    const token = localStorage.getItem('authToken')

    if (!token) {
      return {}
    }

    return { Authorization: `Bearer ${token}` }
  }

  hasValidToken() {
    return !!localStorage.getItem('authToken')
  }

  async makeRequest(endpoint, options = {}) {
    // 🔧 NUEVO: Procesar query params si existen
    let url = `${this.baseUrl}${endpoint}`
    if (options.params) {
      const searchParams = new URLSearchParams()
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value)
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`
      }
    }

    // 🔧 FIX: Obtener token FRESCO en cada request (no solo al inicio)
    // Esto garantiza que si el token cambió o se renovó, se use el nuevo
    // skipAuth permite omitir autenticación para endpoints públicos (login/signup)
    const authHeaders = options.skipAuth ? {} : this.getAuthHeaders()

    // ⚠️ IMPORTANTE: fetch() NO soporta 'timeout' como propiedad
    // Necesitamos usar AbortController para timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    // Remover skipAuth y params de options antes de pasarlo a fetch
    const { skipAuth, params, ...fetchOptions } = options

    const config = {
      signal: controller.signal,
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    }

    let response
    try {
      response = await fetch(url, config)
      clearTimeout(timeoutId) // Limpiar timeout si la petición termina
    } catch (err) {
      // Normalizar errores de red/abort
      const message = err?.message || 'Network error'
      if (message.toLowerCase().includes('abort')) {
        const abort = new Error('AbortError')
        abort.name = 'AbortError'
        throw abort
      }
      throw toApiError(err, 'Error de red')
    }

    if (!response.ok) {
      let rawErrorBody = ''
      try {
        rawErrorBody = await response.clone().text()
      } catch (cloneError) {
        // No se pudo clonar la respuesta; continuar sin cuerpo en crudo
      }

      if (response.status === 401) {
        // Token inválido o expirado - limpiar y redirigir al login
        this.handleUnauthorized()
        throw new ApiError(
          'UNAUTHORIZED',
          'Sesión expirada o token inválido. Por favor, inicie sesión nuevamente.'
        )
      }

      // Para errores 404 en endpoints específicos, dar información más clara
      if (response.status === 404) {
        if (endpoint.includes('/products/products/')) {
          throw new ApiError(
            'ENDPOINT_NOT_IMPLEMENTED',
            'El endpoint de productos no está implementado en el servidor. ' +
              'Contacte al administrador del sistema para configurar la API de productos.'
          )
        }
        if (endpoint.includes('/descriptions')) {
          throw new ApiError(
            'NOT_FOUND',
            'No hay descripciones disponibles para este producto'
          )
        }
        if (endpoint.includes('/details')) {
          throw new ApiError(
            'NOT_FOUND',
            'Detalles del producto no disponibles'
          )
        }
        if (
          endpoint.includes('/products/') &&
          !endpoint.includes('/products/products/')
        ) {
          throw new ApiError('NOT_FOUND', 'Producto no encontrado')
        }
        if (endpoint.includes('/categories')) {
          throw new ApiError('NOT_FOUND', 'No hay categorías disponibles')
        }
        if (endpoint.includes('/reserve/')) {
          throw new ApiError(
            'ENDPOINT_NOT_IMPLEMENTED',
            'El sistema de reservas aún no está implementado en el servidor. ' +
              'Contacte al administrador para configurar la API de reservas.'
          )
        }
        if (endpoint.includes('/schedules/')) {
          throw new ApiError(
            'ENDPOINT_NOT_IMPLEMENTED',
            'El sistema de horarios aún no está implementado en el servidor. ' +
              'Contacte al administrador para configurar la API de horarios.'
          )
        }
        // Endpoint genérico no encontrado
        throw new ApiError(
          'ENDPOINT_NOT_FOUND',
          `El endpoint ${endpoint} no está disponible en el servidor. ` +
            'Verifique que la API esté correctamente configurada.'
        )
      }

      // Para errores 500, dar información más específica
      if (response.status === 500) {
        if (endpoint.includes('/search')) {
          throw new ApiError(
            'INTERNAL',
            'Error interno del servidor al buscar. Intenta con términos diferentes o contacta al administrador.'
          )
        }
        if (endpoint.includes('/categories')) {
          throw new ApiError(
            'INTERNAL',
            'Error interno del servidor al cargar categorías. Intenta recargar la página.'
          )
        }
        throw new ApiError(
          'INTERNAL',
          `Error interno del servidor (${response.status}). Contacta al administrador.`
        )
      }

      // Capturar detalles del error para debugging
      let errorDetails = `HTTP error! status: ${response.status}`
      if (rawErrorBody) {
        try {
          const errorResponse = JSON.parse(rawErrorBody)
          errorDetails =
            errorResponse.message || errorResponse.error || errorDetails
          if (errorResponse.details) {
          }
        } catch (jsonParseError) {
          errorDetails = rawErrorBody.trim()
            ? rawErrorBody
            : `HTTP ${response.status}: ${response.statusText}`
        }
      } else {
        errorDetails = `HTTP ${response.status}: Unable to read response body`
      }

      throw new ApiError('HTTP_ERROR', errorDetails)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      return data
    }

    // Si es texto plano, verificar si es un mensaje de error conocido
    const textResponse = await response.text()
    if (
      textResponse === 'Product not found' ||
      textResponse.includes('not found')
    ) {
      throw new ApiError('NOT_FOUND', 'Producto no encontrado')
    }

    return textResponse
  }

  handleUnauthorized() {
    localStorage.removeItem('authToken')
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async signup(email, password) {
    // 🔧 skipAuth: true para evitar enviar Authorization header en signup
    const response = await this.makeRequest('/signup', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    })

    if (response.token) {
      localStorage.setItem('authToken', response.token)
    }

    return response
  }

  async login(email, password) {
    // 🔧 skipAuth: true para evitar enviar Authorization header en login
    const response = await this.makeRequest('/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    })

    if (response.token) {
      localStorage.setItem('authToken', response.token)
    }

    return response
  }

  logout() {
    localStorage.removeItem('authToken')
    // Emit logout event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:logout'))
    }
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  async getCategories() {
    return this.makeRequest('/categories')
  }

  // Obtener todas las categorías
  async getAllCategories() {
    return this.makeRequest('/categories')
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  /**
   * Obtiene productos paginados ordenados por fecha de creación (más recientes primero)
   * @param {number} page - Número de página (comienza en 1)
   * @param {number} pageSize - Cantidad de productos por página
   * @param {Object} options - Opciones adicionales
   * @param {AbortSignal} options.signal - Signal para cancelar la petición
   * @returns {Promise} Array de productos enriquecidos con timestamps
   */
  async getProductsPaginated(page = 1, pageSize = 10, options = {}) {
    const { signal } = options
    return this.makeRequest(`/products/list/${page}/${pageSize}`, { signal })
  }

  // Crear producto
  async createProduct(productData) {
    return this.makeRequest('/products/', {
      method: 'POST',
      body: JSON.stringify(productData),
    })
  }

  // Actualizar producto
  async updateProduct(id, productData) {
    return this.makeRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    })
  }

  // Eliminar producto (eliminación lógica)
  async deleteProduct(id) {
    return this.makeRequest(`/products/delete/${id}`, {
      method: 'PUT',
    })
  }

  // ============================================================================
  // PRODUCTS - FINANCIAL ENDPOINTS
  // ============================================================================

  /**
   * Obtiene información financiera completa de un producto por ID
   * @param {string} id - ID del producto
   * @returns {Promise} Producto con datos financieros enriquecidos
   */
  async getProductFinancialById(id) {
    return this.makeRequest(`/products/financial/${id}`)
  }

  /**
   * Busca un producto por código de barras con información financiera completa
   * @param {string} barcode - Código de barras del producto
   * @returns {Promise} Producto con datos financieros enriquecidos
   */
  async getProductFinancialByBarcode(barcode) {
    return this.makeRequest(
      `/products/financial/barcode/${encodeURIComponent(barcode)}`
    )
  }

  /**
   * Obtiene productos de tipo SERVICE (servicios reservables como canchas)
   * @returns {Promise} Array de productos de tipo SERVICE
   */
  async getServiceProducts() {
    return this.makeRequest('/products/financial/name/cancha?limit=100')
  }

  /**
   * Busca productos por nombre con información financiera completa
   * @param {string} name - Término de búsqueda (búsqueda parcial)
   * @param {Object} options - Opciones de búsqueda
   * @param {number} options.limit - Número máximo de resultados (default: 50)
   * @param {AbortSignal} options.signal - Signal para cancelar la petición
   * @returns {Promise} Array de productos con datos financieros y score de coincidencia
   */
  async searchProductsFinancialByName(name, options = {}) {
    const { limit = 50, signal } = options
    const url = `/products/financial/name/${encodeURIComponent(
      name
    )}?limit=${limit}`
    return this.makeRequest(url, { signal })
  }

  /**
   * Búsqueda inteligente de productos - detecta automáticamente si es ID, código de barras o nombre
   * @param {string} searchTerm - Término de búsqueda (ID, código de barras o nombre)
   * @param {Object} options - Opciones de búsqueda
   * @param {number} options.limit - Número máximo de resultados (default: 50)
   * @param {AbortSignal} options.signal - Signal para cancelar la petición
   * @returns {Promise} Producto único o array de productos con datos financieros
   */
  async smartSearchProducts(searchTerm, options = {}) {
    if (!searchTerm || !searchTerm.trim()) {
      return []
    }

    const term = searchTerm.trim()

    // Detectar tipo de búsqueda basado en el patrón
    // 1. ID: Formato como "r2XJBtzDR" (alfanumérico, típicamente 8-12 caracteres sin espacios)
    const isLikelyId = /^[a-zA-Z0-9_-]{8,15}$/.test(term) && !/\s/.test(term)

    // 2. Código de barras: Debe ser más específico para evitar falsos positivos
    //    - Mínimo 6 caracteres (los códigos de barras reales son más largos)
    //    - Solo números O formato con guiones (ABC-123-XYZ)
    //    Ejemplos válidos: "123456789", "ABC-123-456", "7501234567890"
    const isLikelyBarcode =
      (/^[0-9]{6,50}$/.test(term) || // Solo números, min 6 dígitos
        /^[A-Z0-9]+-[A-Z0-9]+-?[A-Z0-9]*$/i.test(term)) && // Formato con guiones (ABC-123 o ABC-123-XYZ)
      !isLikelyId

    try {
      // Intentar búsqueda por ID primero si parece un ID
      if (isLikelyId) {
        try {
          const product = await this.getProductFinancialById(term)
          // Si encontramos por ID, devolver como array para consistencia
          return product ? [product] : []
        } catch (error) {
          // Si falla, continuar con otras búsquedas
        }
      }

      // Intentar búsqueda por código de barras si parece un barcode
      if (isLikelyBarcode) {
        try {
          const product = await this.getProductFinancialByBarcode(term)
          // Si encontramos por barcode, devolver como array para consistencia
          return product ? [product] : []
        } catch (error) {
          // Si falla, continuar con búsqueda por nombre
        }
      }

      // Búsqueda por nombre (fallback o búsqueda primaria)
      return await this.searchProductsFinancialByName(term, options)
    } catch (error) {
      console.error('Smart search error:', error)
      return []
    }
  }

  /**
   * Método de búsqueda general de productos - usa búsqueda inteligente
   * @param {string} searchTerm - Término de búsqueda (ID, código de barras o nombre)
   * @param {Object} options - Opciones de búsqueda
   * @returns {Promise} Array de productos con datos financieros
   */
  async searchProducts(searchTerm, options = {}) {
    return this.smartSearchProducts(searchTerm, options)
  }

  // ============================================================================
  // CLIENTS
  // ============================================================================

  async getClients(params = {}) {
    const { page = 1, pageSize = 10, search } = params
    if (search) {
      return this.searchClientsByName(search)
    }
    return this.makeRequest(`/client/${page}/${pageSize}`)
  }

  async getClientById(clientId) {
    return this.makeRequest(`/client/${clientId}`)
  }

  async searchClientsByName(name) {
    try {
      return await this.makeRequest(`/client/name/${encodeURIComponent(name)}`)
    } catch (error) {
      if (error.message && error.message.includes('404')) {
        return [] // Not found is not an error for search, just an empty result.
      }
      throw error // Re-throw other errors.
    }
  }

  async createClient(clientData) {
    return this.makeRequest('/client/', {
      method: 'POST',
      body: JSON.stringify({
        name: clientData.name,
        last_name: clientData.lastName || clientData.last_name,
        document_id: clientData.documentId || clientData.document_id,
        contact: clientData.contact,
        status: clientData.status !== undefined ? clientData.status : true,
      }),
    })
  }

  async updateClient(clientId, clientData) {
    return this.makeRequest(`/client/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: clientData.name,
        last_name: clientData.lastName || clientData.last_name,
        document_id: clientData.documentId || clientData.document_id,
        contact: clientData.contact,
        status: clientData.status,
      }),
    })
  }

  async deleteClient(clientId) {
    return this.makeRequest(`/client/delete/${clientId}`, {
      method: 'PUT',
    })
  }

  // ============================================================================
  // SUPPLIERS
  // ============================================================================

  async getSuppliers(params = {}) {
    const { page = 1, pageSize = 10, search } = params
    if (search) {
      return this.searchSuppliersByName(search)
    }
    return this.makeRequest(`/supplier/${page}/${pageSize}`)
  }

  async searchSuppliersByName(name) {
    try {
      return await this.makeRequest(
        `/supplier/name/${encodeURIComponent(name)}`
      )
    } catch (error) {
      if (error.message && error.message.includes('404')) {
        return [] // Not found is not an error for search, just an empty result.
      }
      throw error // Re-throw other errors.
    }
  }

  async createSupplier(supplierData) {
    return this.makeRequest('/supplier/', {
      method: 'POST',
      body: JSON.stringify({
        name: supplierData.name,
        contact: supplierData.contact,
        address: supplierData.address,
        status: supplierData.status !== undefined ? supplierData.status : true,
      }),
    })
  }

  async updateSupplier(supplierId, supplierData) {
    return this.makeRequest(`/supplier/${supplierId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: supplierData.name,
        contact: supplierData.contact,
        address: supplierData.address,
        status: supplierData.status,
      }),
    })
  }

  async deleteSupplier(supplierId) {
    return this.makeRequest(`/supplier/delete/${supplierId}`, {
      method: 'PUT',
    })
  }

  // ============================================================================
  // SALES
  // ============================================================================

  async createSale(saleData) {
    return this.makeRequest('/sale/', {
      method: 'POST',
      body: JSON.stringify({
        client_id: saleData.clientId || saleData.client_id,
        total_amount: saleData.totalAmount || saleData.total_amount,
        status: saleData.status || 'completed',
      }),
    })
  }

  async getSaleById(saleId) {
    return this.makeRequest(`/sale/${saleId}`)
  }

  async getSalesByClientId(clientId) {
    return this.makeRequest(`/sale/client_id/${clientId}`)
  }

  async getSalesByClientName(clientName) {
    return this.makeRequest(
      `/sale/client_name/${encodeURIComponent(clientName)}`
    )
  }

  async cancelSale(saleId) {
    return this.makeRequest(`/sale/${saleId}`, {
      method: 'DELETE',
    })
  }

  // ============================================================================
  // INVENTORY
  // ============================================================================

  async createInventory(inventoryItems) {
    return this.makeRequest('/inventory/', {
      method: 'POST',
      body: JSON.stringify(inventoryItems),
    })
  }

  async getInventoryById(inventoryId) {
    return this.makeRequest(`/inventory/${inventoryId}`)
  }

  async getInventories(page = 1, pageSize = 10) {
    return this.makeRequest(`/inventory/${page}/${pageSize}`)
  }

  // ============================================================================
  // GENERIC HTTP METHODS (for compatibility with inventoryService)
  // ============================================================================

  async get(endpoint, options = {}) {
    return this.makeRequest(endpoint, {
      method: 'GET',
      ...options,
    })
  }

  async post(endpoint, data, options = {}) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: typeof data === 'string' ? data : JSON.stringify(data),
      ...options,
    })
  }

  async put(endpoint, data, options = {}) {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: typeof data === 'string' ? data : JSON.stringify(data),
      ...options,
    })
  }

  async delete(endpoint, options = {}) {
    return this.makeRequest(endpoint, {
      method: 'DELETE',
      ...options,
    })
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default BusinessManagementAPI
