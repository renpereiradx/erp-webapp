// 🚀 Business Management API Client
// Archivo adaptado para nuestra aplicación ERP
// Basado en la documentación del equipo de backend
import { ApiError, toApiError } from '@/utils/ApiError'
import API_CONFIG from '@/config/api.config'

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
  _retry?: boolean;
}

class BusinessManagementAPI {
  baseUrl: string;
  timeout: number;
  defaultHeaders: Record<string, string>;

  constructor(config: { baseUrl?: string; timeout?: number; defaultHeaders?: Record<string, string> } = {}) {
    // Usar configuración centralizada con posibilidad de override
    this.baseUrl = config.baseUrl || API_CONFIG.baseUrl
    this.timeout = config.timeout || API_CONFIG.timeout
    this.defaultHeaders = {
      ...API_CONFIG.defaultHeaders,
      ...config.defaultHeaders,
    }

    // Log de inicialización solo en desarrollo
    if (API_CONFIG.isDevelopment()) {
      console.debug('[BusinessManagementAPI] initialized', {
        baseUrl: this.baseUrl,
        timeout: this.timeout,
      })
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getAuthHeaders(): Record<string, string> {
    // 🔧 FIX: Obtener token FRESCO en cada llamada
    // No cachear el token - siempre leer del localStorage
    // Esto garantiza que si el token se renovó, se use el nuevo
    const token = localStorage.getItem('authToken')
    // Ensure token is a real string and not "null" or "undefined"
    if (!token || token === 'null' || token === 'undefined') {
      return {}
    }

    return { Authorization: `Bearer ${token}` }
  }

  hasValidToken(): boolean {
    return !!localStorage.getItem('authToken')
  }

  async makeRequest(endpoint: string, options: RequestOptions = {}): Promise<any> {
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

    const config: RequestInit = {
      signal: controller.signal,
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...fetchOptions.headers as Record<string, string>,
      },
      ...fetchOptions,
    }

    let response: Response
    try {
      response = await fetch(url, config)
      clearTimeout(timeoutId) // Limpiar timeout si la petición termina
    } catch (err: any) {
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
      if (response.status === 401) {
        // Token inválido o expirado - Intentar refresh primero si hay token de refresh
        // Evitar bucle infinito si la solicitud original ya era a /auth/refresh
        if (!options._retry && !endpoint.includes('/auth/refresh')) {
          options._retry = true;
          const refreshToken = localStorage.getItem('refreshToken');
          
          if (refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined') {
            try {
              // Llamada directa usando fetch para evitar dependencias circulares con authService
              const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
              });
              
              if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                if (data.success && data.access_token) {
                  // Guardar los nuevos tokens
                  localStorage.setItem('authToken', data.access_token);
                  if (data.refresh_token) {
                    localStorage.setItem('refreshToken', data.refresh_token);
                  }
                  
                  // Reintentar la petición original con el nuevo token
                  return await this.makeRequest(endpoint, options);
                }
              }
            } catch (refreshError) {
              console.error('Error auto-refreshing token:', refreshError);
            }
          }
        }
        
        // Si falló el refresh o no había token de refresh
        this.handleUnauthorized()
        throw new ApiError(
          'UNAUTHORIZED',
          'Sesión expirada o token inválido. Por favor, inicie sesión nuevamente.',
        )
      }

      // Procesar otros errores
      let errorData
      try {
        errorData = await response.json()
      } catch (e) {
        errorData = { message: `HTTP Error ${response.status}` }
      }
      throw toApiError(errorData)
    }

    // 🔧 FIX: Manejar casos donde la respuesta está vacía (204 No Content)
    if (response.status === 204) {
      return { success: true }
    }

    let parsedResponse
    try {
      parsedResponse = await response.json()
    } catch (jsonParseError) {
      // Si no es JSON válido pero la respuesta fue OK (200), retornar éxito genérico
      return { success: true }
    }

    return parsedResponse
  }

  handleUnauthorized(): void {
    // Limpiar tokens locales
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')

    // 🔧 FIX: Emitir evento para que el AuthContext pueda actualizar su estado
    // Esto asegura que la UI se actualice correctamente cuando el token expira
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:unauthorized'))
    }
  }

  // ============================================================================
  // PRODUCT METHODS
  // ============================================================================

  async getProductsPaginated(page: number, pageSize: number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/list/${page}/${pageSize}`, options)
  }

  async getProductById(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/${id}`, options)
  }

  async getProductInfoById(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/${id}/info`, options)
  }

  async getProductByBarcode(barcode: string, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/barcode/${barcode}`, options)
  }

  async getProductInfoByBarcode(barcode: string, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/info/barcode/${barcode}`, options)
  }

  async searchProducts(name: string, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/search/${encodeURIComponent(name)}`, options)
  }

  async searchProductsInfoByName(name: string, options: RequestOptions = {}): Promise<any> {
    const { limit = 50, ...rest } = options;
    return this.get(`/products/info/search/${encodeURIComponent(name)}`, {
      ...rest,
      params: { ...rest.params, limit }
    })
  }

  async getServiceProducts(options: RequestOptions = {}): Promise<any> {
    return this.get('/products/service-courts', options)
  }

  async getProductForSale(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/${id}/sale`, options)
  }

  async getProductForPurchase(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/${id}/purchase`, options)
  }

  async createProduct(data: any, options: RequestOptions = {}): Promise<any> {
    return this.post('/products', data, options)
  }

  async updateProduct(id: string | number, data: any, options: RequestOptions = {}): Promise<any> {
    return this.put(`/products/${id}`, data, options)
  }

  async deleteProduct(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.delete(`/products/${id}`, options)
  }

  async getAllCategories(options: RequestOptions = {}): Promise<any> {
    return this.get('/products/all-categories', options)
  }

  async getCategories(options: RequestOptions = {}): Promise<any> {
    return this.get('/products/categories', options)
  }

  // ============================================================================
  // SALES METHODS
  // ============================================================================

  async getSalesByDateRange(startDate: string, endDate: string, page = 1, pageSize = 50, options: RequestOptions = {}): Promise<any> {
    return this.get('/sale/date_range', {
      ...options,
      params: { ...options.params, start_date: startDate, end_date: endDate, page, page_size: pageSize }
    })
  }

  async getSalesByClientId(clientId: string, page = 1, pageSize = 50, options: RequestOptions = {}): Promise<any> {
    return this.get(`/sale/client_id/${clientId}`, {
      ...options,
      params: { ...options.params, page, page_size: pageSize }
    })
  }

  async getSalesByClientName(name: string, page = 1, pageSize = 50, options: RequestOptions = {}): Promise<any> {
    return this.get(`/sale/client_name/${encodeURIComponent(name)}`, {
      ...options,
      params: { ...options.params, page, page_size: pageSize }
    })
  }

  async getSaleById(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/sale/${id}`, options)
  }

  async getSaleWithMetadata(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/sale/${id}/with-metadata`, options)
  }

  async createSale(data: any, options: RequestOptions = {}): Promise<any> {
    return this.post('/sale/', data, options)
  }

  async addProductsToSale(saleId: string | number, data: any, options: RequestOptions = {}): Promise<any> {
    return this.post(`/sale/${saleId}/products`, data, options)
  }

  async previewSaleCancellation(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/sale/${id}/preview-cancellation`, options)
  }

  async cancelSale(id: string | number, reason: string, options: RequestOptions = {}): Promise<any> {
    return this.put(`/sale/${id}`, { cancellation_reason: reason }, options)
  }

  async processSalePayment(data: any, options: RequestOptions = {}): Promise<any> {
    return this.post('/sale/payment', data, options)
  }

  async getSalePaymentStatus(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/sale/${id}/payment-status`, options)
  }

  // ============================================================================
  // HTTP VERBS SHORTHANDS
  // ============================================================================

  async get(endpoint: string, options: RequestOptions = {}): Promise<any> {
    return this.makeRequest(endpoint, { ...options, method: 'GET' })
  }

  async post(endpoint: string, data: any = null, options: RequestOptions = {}): Promise<any> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put(endpoint: string, data: any = null, options: RequestOptions = {}): Promise<any> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch(endpoint: string, data: any = null, options: RequestOptions = {}): Promise<any> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete(endpoint: string, options: RequestOptions = {}): Promise<any> {
    return this.makeRequest(endpoint, { ...options, method: 'DELETE' })
  }

  // ============================================================================
  // AUTH HELPERS
  // ============================================================================

  /**
   * Realiza el login de usuario
   * @param usernameOrEmail - Nombre de usuario o email
   * @param password - Contraseña
   */
  async login(usernameOrEmail: string, password: string): Promise<any> {
    // Enviamos ambos campos para máxima compatibilidad con el backend
    // Si el backend es estricto, usará el que corresponda
    const payload = {
      username: usernameOrEmail,
      email: usernameOrEmail,
      password
    };

    return this.makeRequest('/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true // No se requiere token para login
    });
  }

  /**
   * Realiza el registro de usuario (si está habilitado)
   * @param email - Correo electrónico
   * @param password - Contraseña
   */
  async signup(email: string, password: string): Promise<any> {
    return this.makeRequest('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true
    });
  }

  logout(): void {
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    // Emit logout event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:logout'))
    }
  }

  /**
   * Helper para subir archivos
   */
  async upload(endpoint: string, formData: FormData, options: RequestOptions = {}): Promise<any> {
    // Para subir archivos NO debemos enviar Content-Type application/json
    // El navegador establecerá el boundary correcto automáticamente
    const { headers, ...restOptions } = options
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: formData,
      ...restOptions,
    })
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default BusinessManagementAPI
