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
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': token } : {};
    
    // Debug info
    console.log('🔐 getAuthHeaders llamado:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'N/A'
    });
    
    return headers;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
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
          this.handleUnauthorized();
          throw new Error('Token expirado o inválido');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      // Solo hacer log de errores que no sean de autenticación para reducir ruido
      const isAuthError = error.message.includes('Token expirado') || 
                         error.message.includes('401') ||
                         error.message.includes('Authorization');
      
      const isDebugMode = localStorage.getItem('debug-mode') === 'true';
      
      if (!isAuthError || isDebugMode) {
        console.error('API Request failed:', error);
      }
      
      throw error;
    }
  }

  handleUnauthorized() {
    localStorage.removeItem('authToken');
    // TEMPORAL: Desactivar evento para evitar redirecciones automáticas
    // Solo log si hay debugging activo
    const isDebugMode = localStorage.getItem('debug-mode') === 'true';
    if (isDebugMode) {
      console.warn('🔐 Token expirado o inválido - evento unauthorized desactivado temporalmente');
    }
    /*
    // Emit custom event for unauthorized access
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:unauthorized'));
    }
    */
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
    console.log('🏷️ getCategories llamado');
    const token = localStorage.getItem('authToken');
    console.log('🏷️ Token para categorías:', token ? 'Presente' : 'Ausente');
    
    return this.makeRequest('/categories');
    // Nota: Aunque la documentación indica que es público, el servidor requiere autenticación
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  async getProducts(page = 1, pageSize = 10) {
    return this.makeRequest(`/products/products/${page}/${pageSize}`);
  }

  async getProductById(id) {
    return this.makeRequest(`/products/${id}`);
  }

  async searchProductsByName(name) {
    return this.makeRequest(`/products/products/name/${encodeURIComponent(name)}`);
  }

  // Búsqueda inteligente: por ID o nombre (nuestra implementación)
  async searchProducts(searchTerm) {
    // Si el término parece un ID, intentar búsqueda por ID primero
    const looksLikeId = /^[a-zA-Z0-9_-]{10,}$/.test(searchTerm);
    
    if (looksLikeId) {
      try {
        const product = await this.getProductById(searchTerm);
        return Array.isArray(product) ? product : [product];
      } catch (error) {
        console.log(`ID search failed for "${searchTerm}", trying name search...`);
        return await this.searchProductsByName(searchTerm);
      }
    } else {
      return await this.searchProductsByName(searchTerm);
    }
  }

  async createProduct(productData) {
    console.log('🚀 createProduct llamado con:', productData);
    
    const payload = {
      name: productData.name,
      id_category: productData.id_category || productData.categoryId || productData.category_id
    };
    
    console.log('🚀 Payload a enviar:', payload);
    
    return this.makeRequest('/products/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateProduct(id, productData) {
    return this.makeRequest(`/products/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: productData.name,
        state: productData.state,
        is_active: productData.is_active,
        id_category: productData.categoryId || productData.category_id
      })
    });
  }

  async deleteProduct(id) {
    return this.makeRequest(`/products/products/delete/${id}`, {
      method: 'PUT'
    });
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
