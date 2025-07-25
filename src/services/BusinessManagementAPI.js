// 🚀 Business Management API Client
// Archivo adaptado para nuestra aplicación ERP
// Basado en la documentación del equipo de backend

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
    } catch (error) {
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

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Intentar auto-login una vez más
          const newToken = await this.autoLogin();
          if (newToken) {
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
          }
          this.handleUnauthorized();
          throw new Error('Token expirado o inválido');
        }
        
        // Para errores 404 en endpoints específicos, dar información más clara
        if (response.status === 404) {
          if (endpoint.includes('/descriptions')) {
            throw new Error('No hay descripciones disponibles para este producto');
          }
          if (endpoint.includes('/details')) {
            throw new Error('Detalles del producto no disponibles');
          }
          if (endpoint.includes('/products/') && !endpoint.includes('/products/products/')) {
            throw new Error('Producto no encontrado');
          }
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      }
      
      // Si es texto plano, verificar si es un mensaje de error conocido
      const textResponse = await response.text();
      if (textResponse === 'Product not found' || textResponse.includes('not found')) {
        throw new Error('Producto no encontrado');
      }
      
      return textResponse;
    } catch (error) {
      throw error;
    }
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

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  async getProducts(page = 1, pageSize = 10) {
    return this.getProductsWithBasicDetails(page, pageSize);
  }

  async getProductById(id) {
    return this.makeRequest(`/products/${id}`);
  }

  async searchProductsByName(name) {
    return this.makeRequest(`/products/products/name/${encodeURIComponent(name)}`);
  }

  async searchProducts(searchTerm) {
    // Detectar si parece un ID: entre 8-30 caracteres alfanuméricos/guiones
    const looksLikeId = /^[a-zA-Z0-9_-]{8,30}$/.test(searchTerm) && 
                       !/\s/.test(searchTerm) && 
                       searchTerm.length >= 8;
    
    if (looksLikeId) {
      try {
        const product = await this.getProductById(searchTerm);
        return Array.isArray(product) ? product : [product];
      } catch (error) {
        // Solo hacer fallback a nombre si el error NO indica que es un ID válido pero inexistente
        if (!error.message.includes('Producto no encontrado') && !error.message.includes('not found')) {
          try {
            return await this.searchProductsByName(searchTerm);
          } catch (nameError) {
            return [];
          }
        } else {
          return [];
        }
      }
    } else {
      try {
        return await this.searchProductsByName(searchTerm);
      } catch (error) {
        return [];
      }
    }
  }

  async createProduct(productData) {
    const payload = {
      name: productData.name,
      id_category: productData.id_category || productData.categoryId || productData.category_id,
      state: productData.state !== undefined ? productData.state : true
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
      id_category: productData.id_category || productData.categoryId || productData.category_id
    };

    if (productData.description !== undefined) {
      payload.description = productData.description.trim();
    }

    return this.makeRequest(`/products/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  async deleteProduct(id) {
    return this.makeRequest(`/products/products/delete/${id}`, {
      method: 'PUT'
    });
  }

  // ============================================================================
  // MÉTODOS OPTIMIZADOS PARA PRODUCTOS CON DETALLES (API Real)
  // ============================================================================

  async getProductsWithBasicDetails(page = 1, pageSize = 10) {
    return this.makeRequest(`/products/products/${page}/${pageSize}`);
  }

  async getProductWithDetails(id) {
    try {
      return await this.makeRequest(`/products/${id}/details`);
    } catch (error) {
      return await this.getProductById(id);
    }
  }

  async searchProductsWithDetails(name) {
    try {
      return await this.makeRequest(`/products/search/details/${encodeURIComponent(name)}`);
    } catch (error) {
      return await this.searchProductsByName(name);
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

  async getClients(page = 1, pageSize = 10) {
    return this.makeRequest(`/client/${page}/${pageSize}`);
  }

  async getClientById(clientId) {
    return this.makeRequest(`/client/${clientId}`);
  }

  async searchClientsByName(name) {
    return this.makeRequest(`/client/name/${encodeURIComponent(name)}`);
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
