// 🚀 Business Management API Client
// Archivo: api-client.js (o .ts si usas TypeScript)

class BusinessManagementAPI {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:5050';
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
    return token ? { 'Authorization': `Bearer ${token}` } : {};
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'}] ${endpoint}:`, error);
      
      // Handle specific errors
      if (error.message.includes('401')) {
        this.handleUnauthorized();
      }
      
      throw error;
    }
  }

  handleUnauthorized() {
    localStorage.removeItem('authToken');
    // Redirect to login or emit event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:unauthorized'));
    }
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
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  async getCategories() {
    return this.makeRequest('/categories', {
      headers: {} // No auth needed
    });
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  async getProducts(page = 1, pageSize = 10) {
    return this.makeRequest(`/products/${page}/${pageSize}`);
  }

  async getProductById(id) {
    return this.makeRequest(`/products/${id}`);
  }

  /**
   * 🚀 NUEVO: Obtiene un producto con todos sus detalles relacionados
   * Una sola consulta que incluye: producto, stock, precio, descripción y categoría
   * @param {string} id - ID del producto
   * @returns {Promise<Object>} Producto con todos los detalles
   */
  async getProductDetails(id) {
    return this.makeRequest(`/products/${id}/details`);
  }

  /**
   * 🆕 NUEVO: Busca productos por nombre con todos sus detalles relacionados
   * Devuelve un array de productos que coincidan con el nombre, cada uno con todos sus detalles
   * @param {string} name - Nombre del producto a buscar (búsqueda parcial)
   * @returns {Promise<Array>} Array de productos con todos los detalles
   */
  async searchProductDetailsByName(name) {
    if (!name || name.trim() === '') {
      throw new Error('Name parameter is required');
    }
    return this.makeRequest(`/products/search/details/${encodeURIComponent(name.trim())}`);
  }

  async searchProductsByName(name) {
    return this.makeRequest(`/products/name/${encodeURIComponent(name)}`);
  }

  async createProduct(productData) {
    return this.makeRequest('/products/', {
      method: 'POST',
      body: JSON.stringify({
        name: productData.name,
        id_category: productData.categoryId
      })
    });
  }

  async updateProduct(id, productData) {
    return this.makeRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: productData.name,
        state: productData.state,
        id_category: productData.categoryId
      })
    });
  }

  async deleteProduct(id) {
    return this.makeRequest(`/products/delete/${id}`, {
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
        cost_price: priceData.costPrice,
        sale_price: priceData.salePrice,
        tax: priceData.tax
      })
    });
  }

  async updateProductPrice(productId, priceData) {
    return this.makeRequest(`/product_price/product_id/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({
        cost_price: priceData.costPrice,
        sale_price: priceData.salePrice,
        tax: priceData.tax
      })
    });
  }

  async updateProductPriceById(priceId, priceData) {
    return this.makeRequest(`/product_price/id/${priceId}`, {
      method: 'PUT',
      body: JSON.stringify({
        cost_price: priceData.costPrice,
        sale_price: priceData.salePrice,
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
        exp: stockData.expirationDate,
        entity: {
          name: stockData.entityName || 'FRONTEND'
        }
      })
    });
  }

  async updateStock(stockId, stockData) {
    return this.makeRequest(`/stock/${stockId}`, {
      method: 'PUT',
      body: JSON.stringify({
        quantity: stockData.quantity,
        exp: stockData.expirationDate,
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
        exp: stockData.expirationDate,
        entity: {
          name: stockData.entityName || 'FRONTEND'
        }
      })
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

  async invalidateInventory(inventoryId) {
    return this.makeRequest(`/inventory/${inventoryId}`, {
      method: 'PUT'
    });
  }

  // ============================================================================
  // MANUAL ADJUSTMENTS
  // ============================================================================

  async createManualAdjustment(adjustmentData) {
    return this.makeRequest('/manual_adjustment/', {
      method: 'POST',
      body: JSON.stringify(adjustmentData)
    });
  }

  async getManualAdjustments(page = 1, pageSize = 10) {
    return this.makeRequest(`/manual_adjustment/${page}/${pageSize}`);
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
        last_name: clientData.lastName,
        document_id: clientData.documentId,
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
        last_name: clientData.lastName,
        document_id: clientData.documentId,
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

  async getSuppliers(page = 1, pageSize = 10) {
    return this.makeRequest(`/supplier/${page}/${pageSize}`);
  }

  async getSupplierById(supplierId) {
    return this.makeRequest(`/supplier/${supplierId}`);
  }

  async searchSuppliersByName(name) {
    return this.makeRequest(`/supplier/name/${encodeURIComponent(name)}`);
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
  // TAX RATES
  // ============================================================================

  async getTaxRates(page = 1, pageSize = 10) {
    return this.makeRequest(`/tax_rate/${page}/${pageSize}`);
  }

  async getTaxRateById(taxRateId) {
    return this.makeRequest(`/tax_rate/${taxRateId}`);
  }

  async searchTaxRatesByName(name) {
    return this.makeRequest(`/tax_rate/name/${encodeURIComponent(name)}`);
  }

  async createTaxRate(taxRateData) {
    return this.makeRequest('/tax_rate/', {
      method: 'POST',
      body: JSON.stringify({
        name: taxRateData.name,
        rate: taxRateData.rate,
        description: taxRateData.description
      })
    });
  }

  async updateTaxRate(taxRateId, taxRateData) {
    return this.makeRequest(`/tax_rate/${taxRateId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: taxRateData.name,
        rate: taxRateData.rate,
        description: taxRateData.description
      })
    });
  }

  // ============================================================================
  // SALES
  // ============================================================================

  async createSale(saleData) {
    return this.makeRequest('/sale/', {
      method: 'POST',
      body: JSON.stringify({
        client_id: saleData.clientId,
        total_amount: saleData.totalAmount,
        sale_date: saleData.saleDate || new Date().toISOString(),
        status: saleData.status || 'completed'
      })
    });
  }

  async getSaleById(saleId) {
    return this.makeRequest(`/sale/${saleId}`);
  }

  async cancelSale(saleId) {
    return this.makeRequest(`/sale/${saleId}`, {
      method: 'PUT'
    });
  }

  async getSalesByClientId(clientId) {
    return this.makeRequest(`/sale/client_id/${clientId}`);
  }

  async getSalesByClientName(clientName) {
    return this.makeRequest(`/sale/client_name/${encodeURIComponent(clientName)}`);
  }

  async getSalesByDateRange(startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    return this.makeRequest(`/sale/date_range/?${params}`);
  }

  // ============================================================================
  // PURCHASES
  // ============================================================================

  async createPurchase(purchaseData) {
    return this.makeRequest('/purchase/', {
      method: 'POST',
      body: JSON.stringify({
        supplier_id: purchaseData.supplierId,
        total_amount: purchaseData.totalAmount,
        purchase_date: purchaseData.purchaseDate || new Date().toISOString(),
        status: purchaseData.status || 'completed'
      })
    });
  }

  async getPurchaseById(purchaseId) {
    return this.makeRequest(`/purchase/${purchaseId}`);
  }

  async cancelPurchase(purchaseId) {
    return this.makeRequest(`/purchase/cancel/${purchaseId}`, {
      method: 'PUT'
    });
  }

  async getPurchasesBySupplierId(supplierId) {
    return this.makeRequest(`/purchase/supplier_id/${supplierId}`);
  }

  async getPurchasesBySupplierName(supplierName) {
    return this.makeRequest(`/purchase/supplier_name/${encodeURIComponent(supplierName)}`);
  }

  async getPurchasesByDateRange(startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    return this.makeRequest(`/purchase/date_range/?${params}`);
  }

  // ============================================================================
  // SCHEDULES
  // ============================================================================

  async getScheduleById(scheduleId) {
    return this.makeRequest(`/schedules/${scheduleId}`);
  }

  async getAvailableSchedules(productId, date) {
    return this.makeRequest(`/schedules/product/${productId}/date/${date}/available`);
  }

  async generateDailySchedules() {
    return this.makeRequest('/schedules/generate/daily', {
      method: 'POST'
    });
  }

  async generateSchedulesForDate(date) {
    return this.makeRequest('/schedules/generate/date', {
      method: 'POST',
      body: JSON.stringify({ date })
    });
  }

  async generateSchedulesForNextDays(days) {
    return this.makeRequest('/schedules/generate/next-days', {
      method: 'POST',
      body: JSON.stringify({ days })
    });
  }
}

// ============================================================================
// EXPORT FOR DIFFERENT MODULE SYSTEMS
// ============================================================================

// CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BusinessManagementAPI;
}

// ES6 Modules
if (typeof exports !== 'undefined') {
  exports.BusinessManagementAPI = BusinessManagementAPI;
}

// Browser Global
if (typeof window !== 'undefined') {
  window.BusinessManagementAPI = BusinessManagementAPI;
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Inicializar cliente
const api = new BusinessManagementAPI({
  baseUrl: 'http://localhost:5050',
  timeout: 15000
});

// Autenticación
await api.login('myemail', 'mypassword');

// Obtener productos
const products = await api.getProducts(1, 10);

// Crear producto
const newProduct = await api.createProduct({
  name: 'Nuevo Producto',
  categoryId: 5
});

// Manejar errores de autenticación
window.addEventListener('api:unauthorized', () => {
  // Redirigir a login
  window.location.href = '/login';
});

// Crear venta
const sale = await api.createSale({
  clientId: 'client_123',
  totalAmount: 150000.00
});

// Buscar productos
const searchResults = await api.searchProductsByName('Puma');

// Obtener stock
const stock = await api.getProductStock('bcYdWdKNR');

// 🚀 NUEVO: Obtener producto con todos los detalles (RECOMENDADO)
const productDetails = await api.getProductDetails('GA4w4YlYpVP1LNji17o9FKbp8Dg');
console.log('Producto completo:', {
  name: productDetails.name,
  stock: productDetails.stock?.quantity || 0,
  price: productDetails.price?.purchase_price || 0,
  description: productDetails.description?.description || 'Sin descripción',
  category: productDetails.category?.name || 'Sin categoría'
});

// 🆕 NUEVO: Buscar productos con todos los detalles por nombre
const productsWithDetails = await api.searchProductDetailsByName('Onion');
console.log(`Encontrados ${productsWithDetails.length} productos:`, 
  productsWithDetails.map(p => ({
    id: p.id,
    name: p.name,
    stock: p.stock?.quantity || 0,
    price: p.price?.purchase_price || 0,
    category: p.category?.name || 'Sin categoría'
  }))
);

// Comparación de eficiencia:
// ❌ Método anterior (múltiples requests):
// const basicProducts = await api.searchProductsByName('Onion');
// for (const product of basicProducts) {
//   const stock = await api.getProductStock(product.id);
//   const price = await api.getProductPrice(product.id);
//   const description = await api.getProductDescription(product.id);
//   // 3 requests adicionales por cada producto = LENTO
// }

// ✅ Método nuevo (una sola request):
// const productsWithDetails = await api.searchProductDetailsByName('Onion');
// Ya tienes todos los datos completos - 3x MÁS RÁPIDO
*/
