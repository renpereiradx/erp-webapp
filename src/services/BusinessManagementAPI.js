// 🚀 Business Management API Client
// Archivo adaptado para nuestra aplicación ERP
// Basado en la documentación del equipo de backend
import { ApiError, toApiError } from '@/utils/ApiError';

class BusinessManagementAPI {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5050';
    this.timeout = config.timeout || 10000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getAuthHeaders() {
    let token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': token } : {};
    return headers;
  }

  async ensureAuthentication() {
    const token = localStorage.getItem('authToken');
    const isAutoLoginEnabled = import.meta.env.VITE_AUTO_LOGIN === 'true';
    
    if (!token && isAutoLoginEnabled) {
      const newToken = await this.autoLogin();
      return !!newToken;
    }
    return !!token;
  }

  async autoLogin() {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'myemail',
          password: 'mypassword'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userData', JSON.stringify({
            id: data.role_id || '1',
            username: 'myemail',
            email: 'myemail',
            role: 'admin',
            role_id: data.role_id || 'admin',
            name: 'Usuario Auto-Login',
            company: 'ERP Systems Inc.',
            lastLogin: new Date().toISOString(),
          }));
          return data.token;
        }
      }
    } catch {
      // Auto-login falló silenciosamente
    }
    return null;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Asegurar autenticación antes de hacer la request
    await this.ensureAuthentication();
    
    const config = {
      timeout: this.timeout,
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers
      },
      ...options
    };

    let response;
    try {
      response = await fetch(url, config);
    } catch (err) {
      // Normalizar errores de red/abort
      const message = err?.message || 'Network error';
      if (message.toLowerCase().includes('abort')) {
        const abort = new Error('AbortError');
        abort.name = 'AbortError';
        throw abort;
      }
      throw toApiError(err, 'Error de red');
    }
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('⚠️ 401 Unauthorized - Intentando auto-login...');
        
        // Intentar auto-login una vez más
        const newToken = await this.autoLogin();
        if (newToken) {
          console.log('✓ Auto-login exitoso, reintentando request...');
          // Reintentar con el nuevo token
          const retryConfig = {
            ...config,
            headers: {
              ...config.headers,
              ...this.getAuthHeaders()
            }
          };
          const retryResponse = await fetch(url, retryConfig);
          if (retryResponse.ok) {
            const contentType = retryResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              return await retryResponse.json();
            }
            
            // Si es texto plano, verificar si es un mensaje de error conocido
            const textResponse = await retryResponse.text();
            if (textResponse === 'Product not found' || textResponse.includes('not found')) {
              throw new Error('Producto no encontrado');
            }
            
            return textResponse;
          }
        } else {
          console.error('❌ Auto-login falló - verifique credenciales o servidor');
        }
        
        this.handleUnauthorized();
        throw new ApiError('UNAUTHORIZED', 
          'Error de autenticación. El sistema no pudo autenticarse automáticamente. ' +
          'Verifique que el servidor esté funcionando y las credenciales sean correctas.');
      }
      
      // Para errores 404 en endpoints específicos, dar información más clara
      if (response.status === 404) {
        if (endpoint.includes('/products/products/')) {
          throw new ApiError('ENDPOINT_NOT_IMPLEMENTED', 
            'El endpoint de productos no está implementado en el servidor. ' +
            'Contacte al administrador del sistema para configurar la API de productos.');
        }
        if (endpoint.includes('/descriptions')) {
          throw new ApiError('NOT_FOUND', 'No hay descripciones disponibles para este producto');
        }
        if (endpoint.includes('/details')) {
          throw new ApiError('NOT_FOUND', 'Detalles del producto no disponibles');
        }
        if (endpoint.includes('/products/') && !endpoint.includes('/products/products/')) {
          throw new ApiError('NOT_FOUND', 'Producto no encontrado');
        }
        if (endpoint.includes('/categories')) {
          throw new ApiError('NOT_FOUND', 'No hay categorías disponibles');
        }
        if (endpoint.includes('/reserve/')) {
          throw new ApiError('ENDPOINT_NOT_IMPLEMENTED', 
            'El sistema de reservas aún no está implementado en el servidor. ' +
            'Contacte al administrador para configurar la API de reservas.');
        }
        if (endpoint.includes('/schedules/')) {
          throw new ApiError('ENDPOINT_NOT_IMPLEMENTED', 
            'El sistema de horarios aún no está implementado en el servidor. ' +
            'Contacte al administrador para configurar la API de horarios.');
        }
        // Endpoint genérico no encontrado
        throw new ApiError('ENDPOINT_NOT_FOUND', 
          `El endpoint ${endpoint} no está disponible en el servidor. ` +
          'Verifique que la API esté correctamente configurada.');
      }

      // Para errores 500, dar información más específica
      if (response.status === 500) {
        if (endpoint.includes('/search')) {
          throw new ApiError('INTERNAL', 'Error interno del servidor al buscar. Intenta con términos diferentes o contacta al administrador.');
        }
        if (endpoint.includes('/categories')) {
          throw new ApiError('INTERNAL', 'Error interno del servidor al cargar categorías. Intenta recargar la página.');
        }
        throw new ApiError('INTERNAL', `Error interno del servidor (${response.status}). Contacta al administrador.`);
      }
      
      throw new ApiError('HTTP_ERROR', `HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    }
    
    // Si es texto plano, verificar si es un mensaje de error conocido
    const textResponse = await response.text();
    if (textResponse === 'Product not found' || textResponse.includes('not found')) {
      throw new ApiError('NOT_FOUND', 'Producto no encontrado');
    }
    
    return textResponse;
  }

  handleUnauthorized() {
    localStorage.removeItem('authToken');
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async signup(email, password) {
    const response = await this.makeRequest('/signup', {
      method: 'POST',
      headers: {}, // No auth needed
      body: JSON.stringify({ email, password })
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  }

  async login(email, password) {
    const response = await this.makeRequest('/login', {
      method: 'POST',
      headers: {}, // No auth needed
      body: JSON.stringify({ email, password })
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  }

  logout() {
    localStorage.removeItem('authToken');
    // Emit logout event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:logout'));
    }
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  async getCategories() {
    return this.makeRequest('/categories');
  }

  // Obtener todas las categorías
  async getAllCategories() {
    return this.makeRequest('/categories');
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  async getProducts(page = 1, pageSize = 10, enriched = true) {
    if (enriched) {
      try {
        return await this.getProductsWithEnrichedDetails(page, pageSize);
      } catch {
        // Fallback a productos básicos
        return this.getProductsWithBasicDetails(page, pageSize);
      }
    }
    return this.getProductsWithBasicDetails(page, pageSize);
  }

  async getProductById(id, options = {}) {
    try {
      const product = await this.makeRequest(`/products/${id}`, options);
      
      // Normalizar el producto para asegurar que tenga la estructura enriquecida correcta
      if (product) {
        const hasEnrichedData = product.has_unit_pricing !== undefined || 
                               product.stock_status !== undefined ||
                               product.price_formatted !== undefined ||
                               product.has_valid_price !== undefined ||
                               product.unit_prices !== undefined;
        
        if (hasEnrichedData) {
          // Si ya tiene datos enriquecidos, normalizarlo para consistencia
          return this.normalizeEnrichedProduct(product);
        } else {
          // Si no tiene datos enriquecidos, devolverlo tal como está
          return product;
        }
      }
      
      return product;
    } catch (error) {
      // Mejorar el manejo de errores específicos
      if (error.status === 404) {
        throw new Error(`Producto no encontrado: ${id}`);
      } else if (error.status === 500) {
        throw new Error(`Error interno del servidor al buscar producto: ${id}`);
      } else if (error.status >= 500) {
        throw new Error(`Error del servidor (${error.status}) al buscar producto: ${id}`);
      }
      
      // Re-lanzar el error original si no es un error específico conocido
      throw error;
    }
  }

  async searchProductsByName(name) {
    // According to PRODUCT_API.md, this endpoint returns enriched data
    return this.makeRequest(`/products/name/${encodeURIComponent(name)}`);
  }

  async searchProductsByNameEnriched(name, options = {}) {
    // Método específico para obtener datos enriquecidos por nombre
    try {
      const products = await this.makeRequest(`/products/name/${encodeURIComponent(name)}`, options);
      
      // Los productos ya vienen con estructura enriquecida del backend
      if (Array.isArray(products)) {
        return products.map(product => this.normalizeEnrichedProduct(product));
      }
      
      return [];
    } catch (error) {
      // Silenciar errores de cancelación (AbortError) en desarrollo
      if (error.name === 'AbortError') {
        return [];
      }
      console.warn('Error en búsqueda enriquecida por nombre:', error.message);
      return [];
    }
  }

  async searchProducts(searchTerm, options = {}) {
    // Detectar si parece un ID: entre 8-30 caracteres alfanuméricos/guiones
    const looksLikeId = /^[a-zA-Z0-9_-]{8,30}$/.test(searchTerm) && 
                       !/\s/.test(searchTerm) && 
                       searchTerm.length >= 8;
    
    if (looksLikeId) {
      try {
        console.log(`🔍 Buscando producto por ID: ${searchTerm}`);
        // Para búsquedas por ID, usar el endpoint de detalles enriquecidos
        const product = await this.getProductWithDetails(searchTerm, options);
        console.log(`✅ Producto encontrado por ID:`, product);
        return Array.isArray(product) ? product : [product];
      } catch (error) {
        console.warn(`⚠️ Error al buscar por ID ${searchTerm}:`, error.message);
        
        // Si es un error 500 (server error) o error de red, intentar fallback por nombre
        if (error.status === 500 || error.status >= 500 || error.message.includes('500') || 
            error.message.includes('Internal Server Error') || 
            error.message.includes('Network Error') || 
            error.message.includes('Failed to fetch')) {
          
          console.log(`🔄 Error 500 detectado, intentando fallback por nombre para: ${searchTerm}`);
          try {
            // Fallback: intentar buscar por nombre si el ID falló por error del servidor
            const fallbackResults = await this.searchProductsByNameEnriched(searchTerm, options);
            console.log(`✅ Fallback por nombre exitoso:`, fallbackResults);
            return fallbackResults;
          } catch (fallbackError) {
            console.warn(`❌ Fallback por nombre también falló:`, fallbackError.message);
            return [];
          }
        }
        
        // Si el error indica que es un ID válido pero inexistente (404), no hacer fallback
        if (error.status === 404 || error.message.includes('Producto no encontrado') || 
            error.message.includes('not found')) {
          console.log(`📭 Producto con ID ${searchTerm} no encontrado (404)`);
          return [];
        }
        
        // Para otros errores, intentar fallback por nombre
        try {
          console.log(`🔄 Intentando fallback por nombre para: ${searchTerm}`);
          const fallbackResults = await this.searchProductsByNameEnriched(searchTerm, options);
          console.log(`✅ Fallback por nombre exitoso:`, fallbackResults);
          return fallbackResults;
        } catch (fallbackError) {
          console.warn(`❌ Fallback por nombre también falló:`, fallbackError.message);
          return [];
        }
      }
    } else {
      try {
        console.log(`🔍 Buscando productos por nombre: ${searchTerm}`);
        // Para búsquedas por nombre, usar el nuevo endpoint enriquecido
        const results = await this.searchProductsByNameEnriched(searchTerm, options);
        console.log(`✅ Productos encontrados por nombre:`, results);
        return results;
      } catch (error) {
        // Silenciar errores de cancelación (AbortError) en desarrollo
        if (error.name === 'AbortError') {
          console.log(`🚫 Búsqueda cancelada: ${searchTerm}`);
          return [];
        }
        console.warn(`⚠️ Error en búsqueda por nombre:`, error.message);
        return [];
      }
    }
  }

  async createProduct(productData) {
    const payload = {
      name: productData.name,
      id_category: productData.id_category || productData.categoryId || productData.category_id,
  state: productData.state !== undefined ? productData.state : true,
  // Incluir product_type si viene (requerido por nuevo contrato API)
  product_type: productData.product_type || 'PHYSICAL'
    };

    if (productData.description && productData.description.trim()) {
      payload.description = productData.description.trim();
    }
    
    return this.makeRequest('/products/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateProduct(id, productData) {
    const payload = {
      name: productData.name,
      state: productData.state,
      id_category: productData.id_category || productData.categoryId || productData.category_id,
      product_type: productData.product_type || productData.productType || 'PHYSICAL'
    };

    if (productData.description !== undefined) {
      payload.description = (productData.description || '').trim();
    }

    // Nuevo contrato: PUT /products/{id}
    return this.makeRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  async deleteProduct(id) {
    // Nuevo contrato actualizado: DELETE /products/{id} (soft delete lógico en backend)
    return this.makeRequest(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  // ============================================================================
  // MÉTODOS OPTIMIZADOS PARA PRODUCTOS CON DETALLES (API Real)
  // ============================================================================

  async getProductsWithBasicDetails(page = 1, pageSize = 10) {
    try {
      // According to PRODUCT_API.md, the correct endpoint is /products/{page}/{pageSize}
      return await this.makeRequest(`/products/${page}/${pageSize}`);
    } catch (error) {
      // If paginated endpoint doesn't exist, try enriched/all endpoint
      if (error.status === 404 || error.code === 'ENDPOINT_NOT_FOUND' || error.code === 'ENDPOINT_NOT_IMPLEMENTED') {
        console.log('🔄 Fallback: trying /products/enriched/all endpoint');
        try {
          const allProducts = await this.makeRequest('/products/enriched/all');
          // Simulate pagination
          if (Array.isArray(allProducts)) {
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedData = allProducts.slice(startIndex, endIndex);
            return {
              data: paginatedData,
              total: allProducts.length,
              page: page,
              pageSize: pageSize,
              totalPages: Math.ceil(allProducts.length / pageSize)
            };
          }
          return allProducts;
        } catch (fallbackError) {
          console.log('🔄 Second fallback: trying basic /products endpoint');
          try {
            const basicProducts = await this.makeRequest('/products');
            // Simulate pagination for basic products
            if (Array.isArray(basicProducts)) {
              const startIndex = (page - 1) * pageSize;
              const endIndex = startIndex + pageSize;
              const paginatedData = basicProducts.slice(startIndex, endIndex);
              return {
                data: paginatedData,
                total: basicProducts.length,
                page: page,
                pageSize: pageSize,
                totalPages: Math.ceil(basicProducts.length / pageSize)
              };
            }
            return basicProducts;
          } catch (finalError) {
            // If all fail, provide empty fallback
            console.warn('⚠️ All products endpoints failed, using empty fallback');
            return {
              data: [],
              total: 0,
              page: page,
              pageSize: pageSize,
              totalPages: 0
            };
          }
        }
      }
      throw error;
    }
  }

  async getProductsWithEnrichedDetails(page = 1, pageSize = 10) {
    // Intentar obtener productos con detalles enriquecidos si está disponible
  try {
      // Este endpoint no existe aún pero podría implementarse en el futuro
      // return this.makeRequest(`/products/products/enriched/${page}/${pageSize}`);
      
      // Por ahora usar el endpoint normal y enriquecer en paralelo
      const products = await this.getProductsWithBasicDetails(page, pageSize);
      
      // Enriquecer productos en paralelo (máximo 5 simultáneos para evitar sobrecarga)
      if (Array.isArray(products.data)) {
        const enrichedProducts = await this.enrichProductsBatch(products.data, 5);
        return {
          ...products,
          data: enrichedProducts
        };
      }
      
      return products;
    } catch {
      // Fallback al método básico
      return this.getProductsWithBasicDetails(page, pageSize);
    }
  }

  async enrichProductsBatch(products, batchSize = 5) {
    const enrichedProducts = [];
    
    // Procesar en lotes para evitar sobrecarga del servidor
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      const enrichedBatch = await Promise.allSettled(
        batch.map(product => this.enrichSingleProduct(product))
      );
      
      // Agregar productos enriquecidos o básicos en caso de error
      enrichedBatch.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          enrichedProducts.push(result.value);
        } else {
          // En caso de error, usar producto básico
          enrichedProducts.push(batch[index]);
        }
      });
    }
    
    return enrichedProducts;
  }

  async enrichSingleProduct(product) {
  try {
      // Intentar obtener el producto con todos los detalles
      const enrichedProduct = await this.getProductWithDetails(product.id);
      return enrichedProduct;
  } catch {
      // En caso de error, intentar enriquecer con requests individuales
      return this.enrichProductManually(product);
    }
  }

  // Normalizar productos que vienen del nuevo endpoint con estructura enriquecida
  normalizeEnrichedProduct(product) {
    return {
      // Datos básicos del producto
      id: product.id,
      name: product.name,
      state: product.state,
      is_active: product.state,
      category_id: product.category_id,
      category_name: product.category_name,
      product_type: product.product_type,
      user_id: product.user_id,
      
      // Datos de precios - priorizando purchase_price y considerando unit_prices
      price: product.price || product.purchase_price,
      purchase_price: product.purchase_price,
      price_id: product.price_id,
      price_updated_at: product.price_updated_at,
      price_updated_by: product.price_updated_by,
      price_formatted: product.price_formatted,
      has_valid_price: product.has_valid_price,
      has_unit_pricing: product.has_unit_pricing,
      unit_prices: product.unit_prices, // Incluir unit_prices del endpoint por ID
      
      // Datos de stock
      stock_quantity: product.stock_quantity,
      stock_id: product.stock_id,
      stock_updated_at: product.stock_updated_at,
      stock_updated_by: product.stock_updated_by,
      stock_status: product.stock_status,
      has_valid_stock: product.has_valid_stock,
      
      // Datos de descripción
      description: product.description,
      description_id: product.description_id,
      
      // Datos de categoría enriquecidos
      category: product.category,
      
      // Metadatos para identificar productos enriquecidos
      _enriched: true,
      _source: 'backend_enriched'
    };
  }

  async enrichProductManually(product) {
    const enrichedProduct = { ...product };
    
    // Obtener datos adicionales en paralelo
    const enrichmentPromises = [
      this.getProductPrice(product.id).catch(() => null),
      this.getProductStock(product.id).catch(() => null),
      this.getProductDescription(product.id).catch(() => null)
    ];
    
    const [price, stock, description] = await Promise.allSettled(enrichmentPromises);
    
    // Agregar datos enriquecidos si están disponibles
    if (price.status === 'fulfilled' && price.value) {
      enrichedProduct.price = price.value;
    }
    
    if (stock.status === 'fulfilled' && stock.value) {
      enrichedProduct.stock = stock.value;
    }
    
    if (description.status === 'fulfilled' && description.value) {
      enrichedProduct.description = description.value;
    }
    
    return enrichedProduct;
  }

  async getProductWithDetails(id, options = {}) {
    // El endpoint /products/{id} ya devuelve datos enriquecidos según el ejemplo de Postman
    const product = await this.getProductById(id, options);
    
    // getProductById ya se encarga de la normalización, solo asegurar que esté enriquecido
    if (product && !product._enriched) {
      const hasEnrichedData = product.has_unit_pricing !== undefined || 
                             product.stock_status !== undefined ||
                             product.price_formatted !== undefined ||
                             product.has_valid_price !== undefined ||
                             product.unit_prices !== undefined;
      
      if (hasEnrichedData) {
        return this.normalizeEnrichedProduct(product);
      }
    }
    
    return product;
  }

  async searchProductsWithDetails(name) {
    try {
      return await this.makeRequest(`/products/search/details/${encodeURIComponent(name)}`);
    } catch {
      // Fallback: buscar productos básicos y enriquecerlos
      const basicProducts = await this.searchProductsByName(name);
      if (Array.isArray(basicProducts)) {
        return this.enrichProductsBatch(basicProducts, 3);
      }
      return basicProducts;
    }
  }

  // Get service courts (according to PRODUCT_API.md)
  async getServiceCourts() {
    try {
      return await this.makeRequest('/products/enriched/service-courts');
    } catch (error) {
      console.warn('Service courts endpoint not available, falling back to enriched all products');
      try {
        const allProducts = await this.makeRequest('/products/enriched/all');
        // Filter for service-type products that might be courts
        if (Array.isArray(allProducts)) {
          return allProducts.filter(product => 
            product.product_type === 'SERVICE' &&
            (product.name?.toLowerCase().includes('cancha') ||
             product.name?.toLowerCase().includes('court') ||
             product.category_name?.toLowerCase().includes('cancha') ||
             product.category_name?.toLowerCase().includes('alquiler'))
          );
        }
        return [];
      } catch (fallbackError) {
        console.warn('Could not get service courts from any endpoint');
        return [];
      }
    }
  }

  // ============================================================================
  // PRODUCT DESCRIPTIONS
  // ============================================================================

  async createProductDescription(productId, description) {
    return this.makeRequest(`/product_description/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ description })
    });
  }

  async getProductDescription(id) {
    return this.makeRequest(`/product_description/${id}`);
  }

  async updateProductDescription(id, description) {
    return this.makeRequest(`/product_description/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ description })
    });
  }

  // ============================================================================
  // PRODUCT PRICES
  // ============================================================================

  async getProductPrice(productId) {
    return this.makeRequest(`/product_price/product_id/${productId}`);
  }

  async setProductPrice(productId, priceData) {
    return this.makeRequest(`/product_price/product_id/${productId}`, {
      method: 'POST',
      body: JSON.stringify({
        cost_price: priceData.costPrice || priceData.cost_price,
        sale_price: priceData.salePrice || priceData.sale_price,
        tax: priceData.tax
      })
    });
  }

  async updateProductPrice(productId, priceData) {
    return this.makeRequest(`/product_price/product_id/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({
        cost_price: priceData.costPrice || priceData.cost_price,
        sale_price: priceData.salePrice || priceData.sale_price,
        tax: priceData.tax
      })
    });
  }

  // ============================================================================
  // STOCK
  // ============================================================================

  async getProductStock(productId) {
    return this.makeRequest(`/stock/product_id/${productId}`);
  }

  async getStockById(stockId) {
    return this.makeRequest(`/stock/${stockId}`);
  }

  async createStock(productId, stockData) {
    return this.makeRequest(`/stock/${productId}`, {
      method: 'POST',
      body: JSON.stringify({
        quantity: stockData.quantity,
        exp: stockData.expirationDate || stockData.exp,
        entity: {
          name: stockData.entityName || 'FRONTEND'
        }
      })
    });
  }

  async updateStockByProductId(productId, stockData) {
    return this.makeRequest(`/stock/product_id/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({
        quantity: stockData.quantity,
        exp: stockData.expirationDate || stockData.exp,
        entity: {
          name: stockData.entityName || 'FRONTEND'
        }
      })
    });
  }

  // ============================================================================
  // CLIENTS
  // ============================================================================

  async getClients(params = {}) {
    const { page = 1, pageSize = 10, search } = params;
    if (search) {
      return this.searchClientsByName(search);
    }
    return this.makeRequest(`/client/${page}/${pageSize}`);
  }

  async getClientById(clientId) {
    return this.makeRequest(`/client/${clientId}`);
  }

  async searchClientsByName(name) {
    try {
      return await this.makeRequest(`/client/name/${encodeURIComponent(name)}`);
    } catch (error) {
      if (error.message && error.message.includes('404')) {
        return []; // Not found is not an error for search, just an empty result.
      }
      throw error; // Re-throw other errors.
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
        status: clientData.status !== undefined ? clientData.status : true
      })
    });
  }

  async updateClient(clientId, clientData) {
    return this.makeRequest(`/client/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: clientData.name,
        last_name: clientData.lastName || clientData.last_name,
        document_id: clientData.documentId || clientData.document_id,
        contact: clientData.contact,
        status: clientData.status
      })
    });
  }

  async deleteClient(clientId) {
    return this.makeRequest(`/client/delete/${clientId}`, {
      method: 'PUT'
    });
  }

  // ============================================================================
  // SUPPLIERS
  // ============================================================================

  async getSuppliers(params = {}) {
    const { page = 1, pageSize = 10, search } = params;
    if (search) {
      return this.searchSuppliersByName(search);
    }
    return this.makeRequest(`/supplier/${page}/${pageSize}`);
  }

  async searchSuppliersByName(name) {
    try {
      return await this.makeRequest(`/supplier/name/${encodeURIComponent(name)}`);
    } catch (error) {
      if (error.message && error.message.includes('404')) {
        return []; // Not found is not an error for search, just an empty result.
      }
      throw error; // Re-throw other errors.
    }
  }

  async createSupplier(supplierData) {
    return this.makeRequest('/supplier/', {
      method: 'POST',
      body: JSON.stringify({
        name: supplierData.name,
        contact: supplierData.contact,
        address: supplierData.address,
        status: supplierData.status !== undefined ? supplierData.status : true
      })
    });
  }

  async updateSupplier(supplierId, supplierData) {
    return this.makeRequest(`/supplier/${supplierId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: supplierData.name,
        contact: supplierData.contact,
        address: supplierData.address,
        status: supplierData.status
      })
    });
  }

  async deleteSupplier(supplierId) {
    return this.makeRequest(`/supplier/delete/${supplierId}`, {
      method: 'PUT'
    });
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
        status: saleData.status || 'completed'
      })
    });
  }

  async getSaleById(saleId) {
    return this.makeRequest(`/sale/${saleId}`);
  }

  async getSalesByClientId(clientId) {
    return this.makeRequest(`/sale/client_id/${clientId}`);
  }

  async getSalesByClientName(clientName) {
    return this.makeRequest(`/sale/client_name/${encodeURIComponent(clientName)}`);
  }

  async cancelSale(saleId) {
    return this.makeRequest(`/sale/${saleId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================================
  // INVENTORY
  // ============================================================================

  async createInventory(inventoryItems) {
    return this.makeRequest('/inventory/', {
      method: 'POST',
      body: JSON.stringify(inventoryItems)
    });
  }

  async getInventoryById(inventoryId) {
    return this.makeRequest(`/inventory/${inventoryId}`);
  }

  async getInventories(page = 1, pageSize = 10) {
    return this.makeRequest(`/inventory/${page}/${pageSize}`);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default BusinessManagementAPI;
