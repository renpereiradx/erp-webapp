// 🚀 Business Management API Client
// Archivo adaptado para nuestra aplicación ERP
// Basado en la documentación del equipo de backend
import { ApiError, toApiError } from '@/utils/ApiError'
import API_CONFIG from '@/config/api.config'

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
  skipBranchContext?: boolean;
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
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getAuthHeaders(endpoint: string, options: RequestOptions = {}): Record<string, string> {
    const token = localStorage.getItem('authToken')
    if (!token || token === 'null' || token === 'undefined') {
      return {}
    }

    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    
    const roleId = localStorage.getItem('roleId')
    const roleName = localStorage.getItem('roleName')
    const activeBranch = localStorage.getItem('activeBranch')
    
    if (roleId) headers['X-Role-ID'] = roleId
    if (roleName) headers['X-Role-Name'] = roleName
    
    // Solo inyectar X-Branch-ID si:
    // 1. Hay una sucursal activa
    // 2. NO se está enviando un branch_id por query params
    // 3. No se ha solicitado explícitamente saltar el contexto de sucursal
    // 4. NO es un endpoint de administración global (sucursales, clientes, usuarios, auth)
    const isBranchManagement = endpoint.includes('/branches/') || endpoint.startsWith('/branches');
    const isClientApi = endpoint.startsWith('/client/') || endpoint === '/client';
    const isAuthEndpoint = endpoint.includes('/auth/') || endpoint.startsWith('/auth') || endpoint === '/login';
    const isUserAdmin = endpoint.includes('/users/') || endpoint.startsWith('/api/v1/users');
    
    if (activeBranch && !options.params?.branch_id && !options.skipBranchContext && 
        !isBranchManagement && !isClientApi && !isAuthEndpoint && !isUserAdmin) {
      headers['X-Branch-ID'] = activeBranch
    }

    return headers
  }

  hasValidToken(): boolean {
    return !!localStorage.getItem('authToken')
  }

  async makeRequest(endpoint: string, options: RequestOptions = {}): Promise<any> {
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

    const authHeaders = options.skipAuth ? {} : this.getAuthHeaders(endpoint, options)

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

        // 🔧 FIX: Intentar refresh silencioso en caso de error de branch_id no autorizado para el rol
        if (response.status === 403) {
          const errorMsg = errorData?.error?.message || errorData?.message || '';
          if (errorMsg.includes('forbidden branch_id') && !options._retry && !endpoint.includes('/auth/refresh')) {
            options._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined') {
              try {
                const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refresh_token: refreshToken })
                });
                
                if (refreshResponse.ok) {
                  const data = await refreshResponse.json();
                  if (data.success && data.access_token) {
                    localStorage.setItem('authToken', data.access_token);
                    if (data.refresh_token) {
                      localStorage.setItem('refreshToken', data.refresh_token);
                    }
                    if (data.allowed_branches) {
                      localStorage.setItem('allowedBranches', JSON.stringify(data.allowed_branches));
                    }
                    if (data.active_branch) {
                      localStorage.setItem('activeBranch', data.active_branch.toString());
                    }
                    
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('auth:token_refreshed', { detail: data }));
                    }
                    
                    return await this.makeRequest(endpoint, options);
                  }
                }
              } catch (refreshError) {
                console.error('Error auto-refreshing token on forbidden branch_id:', refreshError);
              }
            }
          }
        }
        
        // Manejo específico de Rate Limit
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          errorData.retry_after = retryAfter ? parseInt(retryAfter) : 60;
          errorData.code = 'RATE_LIMIT_EXCEEDED';
        }
        
        // Manejo específico de RBAC
        if (response.status === 403 && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api:forbidden', { 
            detail: errorData.message || 'Acceso denegado: No cuentas con los permisos necesarios.' 
          }));
        }
        
        if (response.status === 405 && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api:method_not_allowed', { 
            detail: errorData.message || 'Operación no permitida en este módulo (Solo lectura).' 
          }));
        }
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
    const { limit = 50, ...rest } = options as any;
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

  async getProductFinancial(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/${id}/financial`, options)
  }

  async getProductFinancialByBarcode(barcode: string, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/financial/barcode/${barcode}`, options)
  }

  async searchProductsFinancialByName(name: string, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/financial/search/${encodeURIComponent(name)}`, options)
  }

  async getProductMarginAlert(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/${id}/margin-alert`, options)
  }

  async getProductMarginReport(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/${id}/margin-report`, options)
  }

  async getProductSupplierComparison(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/${id}/supplier-comparison`, options)
  }

  async getProductWeightedAverage(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/products/${id}/weighted-average`, options)
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

  // ============================================================================
  // STOCK METHODS (v3.3.0)
  // ============================================================================

  async createStock(productId: string, data: any, options: RequestOptions = {}): Promise<any> {
    return this.post(`/stock/${productId}`, data, options)
  }

  async getStockById(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/stock/${id}`, options)
  }

  async getStockByProductId(productId: string, options: RequestOptions = {}): Promise<any> {
    return this.get(`/stock/product/${productId}`, options)
  }

  async updateStockById(id: string | number, data: any, options: RequestOptions = {}): Promise<any> {
    return this.put(`/stock/${id}`, data, options)
  }

  async updateStockByProductId(productId: string, data: any, options: RequestOptions = {}): Promise<any> {
    return this.put(`/stock/product/${productId}`, data, options)
  }

  // ============================================================================
  // UNIT CONVERSIONS METHODS (v1.0.0)
  // ============================================================================

  async getUnitConversions(options: RequestOptions = {}): Promise<any> {
    return this.get('/unit-conversions', options)
  }

  async createUnitConversion(data: any, options: RequestOptions = {}): Promise<any> {
    return this.post('/unit-conversions', data, options)
  }

  async deleteUnitConversion(fromUnit: string, toUnit: string, options: RequestOptions = {}): Promise<any> {
    return this.delete(`/unit-conversions/${fromUnit}/${toUnit}`, options)
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

  async getPendingSalesByClientId(clientId: string, options: RequestOptions = {}): Promise<any> {
    return this.get(`/sale/client_id/${clientId}/pending`, options)
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

  async createSaleWithUnits(data: any, options: RequestOptions = {}): Promise<any> {
    return this.post('/sale/with-units', data, options)
  }

  async addProductsToSale(saleId: string | number, data: any, options: RequestOptions = {}): Promise<any> {
    return this.post(`/sale/${saleId}/products`, data, options)
  }

  async previewSaleCancellation(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/sale/${id}/preview-cancellation`, options)
  }

  async cancelSale(id: string | number, reason: string, options: RequestOptions = {}): Promise<any> {
    const updatedOptions = { ...options, params: { ...options.params, reason } }
    return this.put(`/sale/${id}`, {}, updatedOptions)
  }

  async processSalePayment(data: any, options: RequestOptions = {}): Promise<any> {
    return this.post('/sale/payment', data, options)
  }

  async processSalePaymentCashRegister(data: any, options: RequestOptions = {}): Promise<any> {
    return this.post('/cash-registers/payments/sale', data, options)
  }

  async getSalePaymentStatus(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/sale/${id}/payment-status`, options)
  }

  async getSalePaymentDetails(saleId: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/payment/details/${saleId}`, options)
  }

  async getChangeStatistics(options: RequestOptions = {}): Promise<any> {
    return this.get('/payment/statistics/change', options)
  }

  // ============================================================================
  // PURCHASE METHODS
  // ============================================================================

  async createCompletePurchase(data: any, options: RequestOptions = {}): Promise<any> {
    return this.post('/purchase/complete', data, options)
  }

  async cancelPurchaseOrder(data: any, options: RequestOptions = {}): Promise<any> {
    const id = data.purchase_order_id || data.id;
    return this.post(`/purchase/${id}/cancel`, data, options)
  }

  async previewPurchaseCancellation(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/purchase/${id}/preview-cancellation`, options)
  }

  async getPurchasesByDateRange(startDate: string, endDate: string, page = 1, pageSize = 50, options: RequestOptions = {}): Promise<any> {
    return this.get('/purchase/date_range/', {
      ...options,
      params: { ...options.params, start_date: startDate, end_date: endDate, page, page_size: pageSize }
    })
  }

  async getPurchasesBySupplierId(supplierId: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/purchase/supplier_id/${supplierId}`, options)
  }

  async getPurchasesBySupplierName(name: string, options: RequestOptions = {}): Promise<any> {
    return this.get(`/purchase/supplier_name/${encodeURIComponent(name)}`, options)
  }

  async getPurchaseById(id: string | number, options: RequestOptions = {}): Promise<any> {
    return this.get(`/purchase/${id}`, options)
  }

  async processPurchasePayment(data: any, options: RequestOptions = {}): Promise<any> {
    return this.post('/purchase/payment/process', data, options)
  }

  async processPurchasePaymentCashRegister(data: any, options: RequestOptions = {}): Promise<any> {
    return this.post('/cash-registers/payments/purchase', data, options)
  }

  async getPurchasePaymentStatistics(options: RequestOptions = {}): Promise<any> {
    return this.get('/purchase/payment/statistics', options)
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
    localStorage.removeItem('roleId')
    localStorage.removeItem('roleName')
    localStorage.removeItem('activeBranch')
    
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

  // ============================================================================
  // BARCODE & SCALE METHODS (v4.0)
  // ============================================================================

  async salesScan(barcode: string, branchId?: number, options: RequestOptions = {}): Promise<any> {
    return this.post('/sales/scan', { barcode, branch_id: branchId }, options)
  }

  async decodeBarcode(barcode: string, options: RequestOptions = {}): Promise<any> {
    return this.post('/barcode/decode', { barcode }, options)
  }

  async generateBarcode(scaleCode: string, value: number, options: RequestOptions = {}): Promise<any> {
    return this.post('/barcode/generate', { scale_code: scaleCode, value }, options)
  }

  async weighItem(productId: string, weight: number, unit?: string, branchId?: number, options: RequestOptions = {}): Promise<any> {
    return this.post('/scale/weigh-item', { product_id: productId, weight, unit, branch_id: branchId }, options)
  }

  async generateLabel(productId: string, weight: number, totalPrice: number, formatId: number, options: RequestOptions = {}): Promise<any> {
    return this.post('/scale/generate-label', { product_id: productId, weight, total_price: totalPrice, format_id: formatId }, options)
  }

  async getScaleCatalog(branchId?: number, options: RequestOptions = {}): Promise<any> {
    const params = branchId ? { ...options.params, branch_id: branchId } : options.params
    return this.get('/scale/catalog', { ...options, params })
  }

  // CRUD Scales
  async getScales(branchId?: number, options: RequestOptions = {}): Promise<any> {
    const params = branchId ? { ...options.params, branch_id: branchId } : options.params
    return this.get('/scales', { ...options, params })
  }

  async getScaleById(id: number | string, options: RequestOptions = {}): Promise<any> {
    return this.get(`/scales/${id}`, options)
  }

  async createScale(data: any, options: RequestOptions = {}): Promise<any> {
    return this.post('/scales', data, options)
  }

  async updateScale(id: number | string, data: any, options: RequestOptions = {}): Promise<any> {
    return this.put(`/scales/${id}`, data, options)
  }

  async deleteScale(id: number | string, options: RequestOptions = {}): Promise<any> {
    return this.makeRequest(`/scales/${id}`, { method: 'DELETE', ...options })
  }

  // CRUD Label Formats
  async getLabelFormats(options: RequestOptions = {}): Promise<any> {
    return this.get('/label-formats', options)
  }

  async getLabelFormatById(id: number | string, options: RequestOptions = {}): Promise<any> {
    return this.get(`/label-formats/${id}`, options)
  }

  async createLabelFormat(data: any, options: RequestOptions = {}): Promise<any> {
    return this.post('/label-formats', data, options)
  }

  async updateLabelFormat(id: number | string, data: any, options: RequestOptions = {}): Promise<any> {
    return this.put(`/label-formats/${id}`, data, options)
  }

  async deleteLabelFormat(id: number | string, options: RequestOptions = {}): Promise<any> {
    return this.makeRequest(`/label-formats/${id}`, { method: 'DELETE', ...options })
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default BusinessManagementAPI
