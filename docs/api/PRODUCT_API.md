# Manual Price Adjustments - Frontend Integration Guide

This guide provides comprehensive documentation for integrating the Manual Price Adjustments system into frontend applications. It covers API endpoints, data structures, authentication, and implementation guidelines.

## Table of Contents

1. [Quick Start](#quick-start)
2. [API Overview](#api-overview)
3. [Authentication](#authentication)
4. [Product Financial Data Endpoint](#product-financial-data-endpoint)
5. [Manual Price Adjustments API](#manual-price-adjustments-api)
6. [Data Structure Reference](#data-structure-reference)
7. [Helper Functions](#helper-functions)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Performance Optimization](#performance-optimization)
12. [Security Considerations](#security-considerations)

## Quick Start

### Basic Implementation Steps

1. **Authentication**: Obtain JWT token from login endpoint
2. **Fetch Product Data**: Use `/products/financial/{id}` to get current pricing information
3. **Display Price Information**: Extract price from `unit_prices[0].price_per_unit`
4. **Create Price Adjustment**: POST to `/manual-price-adjustments` with new price and reason
5. **Handle Response**: Process success/error responses appropriately

### Essential Endpoints

```
GET  /products/financial/{id}          # Get product with pricing data
GET  /products/financial/name/{name}   # Get product by name
POST /manual-price-adjustments         # Create price adjustment
GET  /manual-price-adjustments         # Get adjustment history
```

## API Overview

### Base Configuration

- **Base URL**: Your API server URL
- **Authentication**: JWT Bearer token
- **Content-Type**: `application/json`
- **Timeout**: Recommended 10 seconds

### Common Headers

```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
Accept: application/json
```

## Authentication

### Getting JWT Token

```http
POST /auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Using Authentication Token

Include the token in all API requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Product Financial Data Endpoint

### Get Product Financial Information

```http
GET /products/financial/{productId}
```

**Example Response:**
```json
{
  "product_id": "bcYdWdKNR",
  "product_name": "Puma MB.01",
  "stock_quantity": 15,
  "description": "Calzado deportivo de alto rendimiento",
  "unit_prices": [
    {
      "id": 20,
      "unit": "unit",
      "price_per_unit": 1625000,
      "effective_date": "2025-05-26T17:39:41.446265Z"
    }
  ],
  "unit_costs_summary": [
    {
      "unit": "unit",
      "last_cost": 1250000,
      "last_purchase_date": "2025-06-03T14:33:52.613475Z",
      "weighted_avg_cost_6m": 1250000,
      "total_purchases": 1,
      "cost_variance_percent": 0
    }
  ],
  "category": {
    "id": 5,
    "name": "Shoes",
    "description": ""
  },
  "financial_health": {
    "has_prices": true,
    "has_costs": true,
    "has_stock": true,
    "price_count": 1,
    "cost_units_count": 1,
    "last_updated": "2025-09-08T12:09:36.744967Z"
  },
  "has_valid_prices": true,
  "has_valid_stock": true,
  "stock_status": "in_stock"
}
```

### Get Product by Name

```http
GET /products/financial/name/{productName}
```

**Note**: Use URL-encoded product names for names with spaces or special characters.

## Manual Price Adjustments API

### Create Price Adjustment

```http
POST /manual-price-adjustments
Content-Type: application/json

{
  "product_id": "bcYdWdKNR",
  "new_price": 1700000,
  "reason": "Competitor pricing analysis - adjusting to maintain market position",
  "metadata": {
    "source": "frontend_app",
    "user_agent": "Mozilla/5.0...",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Response:**
```json
{
  "id": 15,
  "product_id": "bcYdWdKNR",
  "product_name": "Puma MB.01",
  "old_price": 1625000,
  "new_price": 1700000,
  "reason": "Competitor pricing analysis - adjusting to maintain market position",
  "created_at": "2025-01-15T10:30:45.123456Z",
  "user_id": 1,
  "username": "admin",
  "metadata": {
    "source": "frontend_app",
    "user_agent": "Mozilla/5.0...",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

### Get Price Adjustment History

```http
GET /manual-price-adjustments?product_id={productId}&limit=10&offset=0
```

**Query Parameters:**
- `product_id` (optional): Filter by specific product
- `limit` (optional): Number of results per page (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**Response:**
```json
{
  "adjustments": [
    {
      "id": 15,
      "product_id": "bcYdWdKNR",
      "product_name": "Puma MB.01",
      "old_price": 1625000,
      "new_price": 1700000,
      "reason": "Competitor pricing analysis",
      "created_at": "2025-01-15T10:30:45.123456Z",
      "user_id": 1,
      "username": "admin"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

## Data Structure Reference

### Product Financial Data

| Field | Type | Description |
|-------|------|-------------|
| `product_id` | string | Unique product identifier |
| `product_name` | string | Product display name |
| `stock_quantity` | number | Current stock quantity |
| `description` | string | Product description |
| `unit_prices` | array | Current pricing information by unit |
| `unit_costs_summary` | array | Cost analysis summary |
| `category` | object | Product category information |
| `financial_health` | object | Data completeness indicators |
| `has_valid_prices` | boolean | Whether product has pricing data |
| `has_valid_stock` | boolean | Whether product has stock data |
| `stock_status` | string | Stock level indicator |

### Unit Price Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Price record ID |
| `unit` | string | Unit type (unit, kg, box, case) |
| `price_per_unit` | number | Price in cents/smallest currency unit |
| `effective_date` | string | ISO 8601 date when price became effective |

### Unit Cost Summary Object

| Field | Type | Description |
|-------|------|-------------|
| `unit` | string | Unit type |
| `last_cost` | number | Most recent cost |
| `last_purchase_date` | string | Date of last purchase |
| `weighted_avg_cost_6m` | number | 6-month weighted average cost |
| `total_purchases` | number | Total purchase transactions |
| `cost_variance_percent` | number | Cost variance percentage |

## Helper Functions

### Accessing Price Data

```javascript
// Get current selling price
function getCurrentSellingPrice(product) {
    if (product?.unit_prices && product.unit_prices.length > 0) {
        return product.unit_prices[0].price_per_unit;
    }
    return null;
}

// Get current cost price
function getCurrentCostPrice(product) {
    if (product?.unit_costs_summary && product.unit_costs_summary.length > 0) {
        return product.unit_costs_summary[0].last_cost;
    }
    return null;
}

// Safe price access with fallback
function safeGetPrice(product, fallback = null) {
    try {
        return getCurrentSellingPrice(product) || fallback;
    } catch (error) {
        console.warn('Error accessing price data:', error);
        return fallback;
    }
}

// Format price for display
function formatPrice(price, currency = 'COP') {
    if (!price) return 'N/A';
    
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    }).format(price);
}

// Calculate price change percentage
function calculatePriceChange(oldPrice, newPrice) {
    if (!oldPrice || !newPrice) return null;
    
    const change = newPrice - oldPrice;
    const changePercent = (change / oldPrice) * 100;
    
    return {
        absolute: change,
        percent: changePercent,
        direction: change >= 0 ? 'increase' : 'decrease'
    };
}
```

### API Request Helpers

```javascript
// Generic API request function
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        },
        ...options
    };
    
    const response = await fetch(endpoint, config);
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
}

// Fetch product financial data
async function fetchProductFinancial(productId) {
    return apiRequest(`/products/financial/${productId}`);
}

// Create price adjustment
async function createPriceAdjustment(productId, newPrice, reason, metadata = {}) {
    return apiRequest('/manual-price-adjustments', {
        method: 'POST',
        body: JSON.stringify({
            product_id: productId,
            new_price: newPrice,
            reason: reason,
            metadata: {
                timestamp: new Date().toISOString(),
                ...metadata
            }
        })
    });
}

// Get price adjustment history
async function getPriceAdjustmentHistory(productId = null, options = {}) {
    const params = new URLSearchParams({
        ...(productId && { product_id: productId }),
        ...options
    });
    
    return apiRequest(`/manual-price-adjustments?${params}`);
}
```

## Error Handling

### Common HTTP Error Responses

| Status | Error | Description | Solution |
|--------|-------|-------------|----------|
| 400 | Bad Request | Invalid request data | Validate input data format |
| 401 | Unauthorized | Invalid or expired token | Refresh authentication token |
| 404 | Not Found | Product or resource not found | Verify product ID exists |
| 422 | Unprocessable Entity | Validation failed | Check field requirements |
| 500 | Internal Server Error | Server-side error | Retry request or contact support |

### Error Response Format

```json
{
  "error": "Product not found",
  "details": "No product found with ID: invalid_id",
  "timestamp": "2025-01-15T10:30:45.123456Z",
  "path": "/products/financial/invalid_id"
}
```

### Validation Error Response

```json
{
  "error": "Validation failed",
  "validation_errors": {
    "new_price": "Price must be a positive number",
    "reason": "Reason must be at least 10 characters"
  },
  "timestamp": "2025-01-15T10:30:45.123456Z"
}
```

### Error Handling Implementation

```javascript
function handleApiError(error) {
    console.error('API Error:', error);
    
    // Handle specific error types
    if (error.message.includes('401')) {
        // Authentication error
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        return 'Authentication required. Please log in again.';
    }
    
    if (error.message.includes('404')) {
        return 'Product not found. Please check the product ID.';
    }
    
    if (error.message.includes('400') || error.message.includes('422')) {
        return 'Invalid request data. Please check your input.';
    }
    
    // Generic error
    return 'An error occurred. Please try again later.';
}

// Usage in API calls
try {
    const product = await fetchProductFinancial(productId);
    // Handle success
} catch (error) {
    const userMessage = handleApiError(error);
    // Display user message
}
```

## Best Practices

### 1. Data Validation

```javascript
// Validate product data structure
function validateProductData(product) {
    const errors = [];
    
    if (!product) {
        errors.push('Product data is missing');
        return errors;
    }
    
    if (!product.product_id) {
        errors.push('Product ID is required');
    }
    
    if (!product.unit_prices || !Array.isArray(product.unit_prices)) {
        errors.push('Price data structure is invalid');
    }
    
    return errors;
}

// Validate price adjustment form
function validatePriceForm(formData, currentPrice) {
    const errors = {};
    
    if (!formData.newPrice) {
        errors.newPrice = 'New price is required';
    } else {
        const price = parseFloat(formData.newPrice);
        if (isNaN(price) || price <= 0) {
            errors.newPrice = 'Price must be a positive number';
        } else if (price === currentPrice) {
            errors.newPrice = 'New price must be different from current price';
        }
    }
    
    if (!formData.reason || formData.reason.trim().length < 10) {
        errors.reason = 'Reason must be at least 10 characters';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}
```

### 2. Loading States Management

```javascript
class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
        this.listeners = new Set();
    }
    
    setLoading(key, isLoading) {
        this.loadingStates.set(key, isLoading);
        this.notifyListeners();
    }
    
    isLoading(key) {
        return this.loadingStates.get(key) || false;
    }
    
    isAnyLoading() {
        return Array.from(this.loadingStates.values()).some(loading => loading);
    }
    
    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.loadingStates));
    }
}

// Usage
const loadingManager = new LoadingManager();

async function loadProduct(productId) {
    loadingManager.setLoading('product', true);
    try {
        const product = await fetchProductFinancial(productId);
        return product;
    } finally {
        loadingManager.setLoading('product', false);
    }
}
```

### 3. Caching Strategy

```javascript
class APICache {
    constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
        this.cache = new Map();
        this.ttl = ttl;
    }
    
    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    
    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.value;
    }
    
    clear() {
        this.cache.clear();
    }
    
    invalidate(pattern) {
        if (typeof pattern === 'string') {
            this.cache.delete(pattern);
        } else if (pattern instanceof RegExp) {
            for (let key of this.cache.keys()) {
                if (pattern.test(key)) {
                    this.cache.delete(key);
                }
            }
        }
    }
}

// Usage
const productCache = new APICache();

async function fetchProductWithCache(productId) {
    const cacheKey = `product_${productId}`;
    const cached = productCache.get(cacheKey);
    
    if (cached) {
        return cached;
    }
    
    const product = await fetchProductFinancial(productId);
    productCache.set(cacheKey, product);
    
    return product;
}
```

### 4. Optimistic Updates

```javascript
async function createPriceAdjustmentOptimistic(productId, newPrice, reason, onUpdate) {
    // Create optimistic update
    const optimisticUpdate = {
        id: 'temp-' + Date.now(),
        product_id: productId,
        new_price: newPrice,
        reason: reason,
        created_at: new Date().toISOString(),
        status: 'pending'
    };
    
    // Update UI immediately
    onUpdate(optimisticUpdate, 'add');
    
    try {
        // Make actual API call
        const result = await createPriceAdjustment(productId, newPrice, reason);
        
        // Replace optimistic update with real data
        onUpdate(optimisticUpdate, 'remove');
        onUpdate(result, 'add');
        
        return result;
    } catch (error) {
        // Remove optimistic update on error
        onUpdate(optimisticUpdate, 'remove');
        throw error;
    }
}
```

## Troubleshooting Guide

### Issue: "Cannot read property 'price_per_unit' of undefined"

**Cause**: Trying to access price data before it's loaded or when the structure is different than expected.

**Solution**:
```javascript
// Always check data structure before accessing
function getProductPrice(product) {
    if (!product || !product.unit_prices || !Array.isArray(product.unit_prices)) {
        console.warn('Product price data structure is invalid:', product);
        return null;
    }
    
    if (product.unit_prices.length === 0) {
        console.warn('No price data available for product');
        return null;
    }
    
    return product.unit_prices[0].price_per_unit;
}
```

### Issue: "Network request failed"

**Cause**: API endpoint issues, CORS problems, or network connectivity.

**Solution**:
```javascript
// Add retry logic with exponential backoff
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            console.warn(`Attempt ${i + 1} failed:`, error);
            
            if (i === maxRetries - 1) {
                throw error;
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}
```

### Issue: "Price adjustment appears successful but product price doesn't update"

**Cause**: Cache not being invalidated or component not re-fetching data.

**Solution**:
```javascript
async function handleAdjustmentSuccess(result) {
    console.log('Price adjustment successful:', result);
    
    // Clear relevant cache entries
    if (productCache) {
        productCache.invalidate(new RegExp(`product_${result.product_id}`));
    }
    
    // Force data refresh
    await loadProductData(result.product_id);
    
    // Show success message
    showSuccessMessage('Price adjusted successfully');
}
```

### Issue: "Authentication token expired"

**Cause**: Long-running sessions or clock skew.

**Solution**:
```javascript
async function refreshAuthToken() {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        
        const response = await fetch('/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (!response.ok) {
            throw new Error('Token refresh failed');
        }
        
        const { access_token } = await response.json();
        localStorage.setItem('auth_token', access_token);
        
        return access_token;
    } catch (error) {
        // Clear tokens and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        throw error;
    }
}
```

## Performance Optimization

### 1. Debounced Search

```javascript
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Usage for search
const debouncedSearch = debounce(async (query) => {
    if (query.length >= 2) {
        const results = await searchProducts(query);
        updateSearchResults(results);
    }
}, 300);
```

### 2. Request Batching

```javascript
class RequestBatcher {
    constructor(batchSize = 10, delay = 100) {
        this.batchSize = batchSize;
        this.delay = delay;
        this.queue = [];
        this.timeoutId = null;
    }
    
    add(request) {
        return new Promise((resolve, reject) => {
            this.queue.push({ request, resolve, reject });
            
            if (this.queue.length >= this.batchSize) {
                this.flush();
            } else if (!this.timeoutId) {
                this.timeoutId = setTimeout(() => this.flush(), this.delay);
            }
        });
    }
    
    async flush() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        if (this.queue.length === 0) return;
        
        const batch = this.queue.splice(0, this.batchSize);
        
        try {
            // Process batch of requests
            const results = await this.processBatch(batch);
            batch.forEach((item, index) => {
                item.resolve(results[index]);
            });
        } catch (error) {
            batch.forEach(item => {
                item.reject(error);
            });
        }
    }
    
    async processBatch(batch) {
        // Implement batch processing logic
        return Promise.all(batch.map(item => item.request()));
    }
}
```

### 3. Memory Management

```javascript
class ResourceManager {
    constructor() {
        this.resources = new Set();
        this.cleanupCallbacks = new Map();
    }
    
    register(resource, cleanupCallback) {
        this.resources.add(resource);
        if (cleanupCallback) {
            this.cleanupCallbacks.set(resource, cleanupCallback);
        }
    }
    
    unregister(resource) {
        const cleanup = this.cleanupCallbacks.get(resource);
        if (cleanup) {
            cleanup();
            this.cleanupCallbacks.delete(resource);
        }
        this.resources.delete(resource);
    }
    
    cleanup() {
        for (let resource of this.resources) {
            this.unregister(resource);
        }
    }
}

// Usage
const resourceManager = new ResourceManager();

// Register cleanup for event listeners, intervals, etc.
const intervalId = setInterval(() => {}, 1000);
resourceManager.register(intervalId, () => clearInterval(intervalId));

// Cleanup when component unmounts
window.addEventListener('beforeunload', () => {
    resourceManager.cleanup();
});
```

## Security Considerations

### 1. Input Sanitization

```javascript
// Sanitize price input
function sanitizePriceInput(input) {
    // Remove non-numeric characters except decimal point
    const cleaned = input.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }
    
    return cleaned;
}

// Validate price range
function validatePriceRange(price, min = 0, max = 1000000000) {
    const numPrice = parseFloat(price);
    return numPrice >= min && numPrice <= max;
}

// Sanitize text input
function sanitizeTextInput(input, maxLength = 1000) {
    if (typeof input !== 'string') return '';
    
    return input
        .trim()
        .substring(0, maxLength)
        .replace(/[<>]/g, ''); // Basic XSS prevention
}
```

### 2. Rate Limiting

```javascript
class RateLimiter {
    constructor(maxRequests = 10, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }
    
    canMakeRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        
        if (this.requests.length >= this.maxRequests) {
            return false;
        }
        
        this.requests.push(now);
        return true;
    }
    
    getTimeUntilNextRequest() {
        if (this.requests.length < this.maxRequests) {
            return 0;
        }
        
        const oldestRequest = Math.min(...this.requests);
        return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
    }
}

// Usage
const adjustmentRateLimiter = new RateLimiter(5, 60000); // 5 adjustments per minute

async function createAdjustment(data) {
    if (!adjustmentRateLimiter.canMakeRequest()) {
        const waitTime = adjustmentRateLimiter.getTimeUntilNextRequest();
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    return await createPriceAdjustment(data);
}
```

### 3. Secure Storage

```javascript
class SecureStorage {
    constructor() {
        this.prefix = 'secure_';
    }
    
    setItem(key, value, expirationMs = null) {
        const item = {
            value: value,
            timestamp: Date.now(),
            expiration: expirationMs ? Date.now() + expirationMs : null
        };
        
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
        } catch (error) {
            console.warn('Failed to store item:', error);
        }
    }
    
    getItem(key) {
        try {
            const stored = localStorage.getItem(this.prefix + key);
            if (!stored) return null;
            
            const item = JSON.parse(stored);
            
            // Check expiration
            if (item.expiration && Date.now() > item.expiration) {
                this.removeItem(key);
                return null;
            }
            
            return item.value;
        } catch (error) {
            console.warn('Failed to retrieve item:', error);
            return null;
        }
    }
    
    removeItem(key) {
        localStorage.removeItem(this.prefix + key);
    }
    
    clear() {
        const keys = Object.keys(localStorage).filter(key => 
            key.startsWith(this.prefix)
        );
        keys.forEach(key => localStorage.removeItem(key));
    }
}

// Usage
const secureStorage = new SecureStorage();

// Store token with expiration
secureStorage.setItem('auth_token', token, 3600000); // 1 hour

// Retrieve token
const token = secureStorage.getItem('auth_token');
```

### 4. Content Security Policy

Recommend implementing CSP headers:

```http
Content-Security-Policy: default-src 'self'; 
                        script-src 'self' 'unsafe-inline'; 
                        style-src 'self' 'unsafe-inline'; 
                        connect-src 'self' https://api.yourdomain.com;
```

## Debug Tools

### Development Mode Logging

```javascript
class Logger {
    constructor(prefix = 'API', enabled = true) {
        this.prefix = prefix;
        this.enabled = enabled && (process.env.NODE_ENV === 'development' || window.DEBUG);
    }
    
    log(message, data = null) {
        if (!this.enabled) return;
        console.log(`[${this.prefix}] ${message}`, data || '');
    }
    
    warn(message, data = null) {
        if (!this.enabled) return;
        console.warn(`[${this.prefix}] ${message}`, data || '');
    }
    
    error(message, data = null) {
        if (!this.enabled) return;
        console.error(`[${this.prefix}] ${message}`, data || '');
    }
    
    group(label) {
        if (!this.enabled) return;
        console.group(`[${this.prefix}] ${label}`);
    }
    
    groupEnd() {
        if (!this.enabled) return;
        console.groupEnd();
    }
}

// Usage
const logger = new Logger('PriceAdjustment');

logger.group('Creating price adjustment');
logger.log('Product ID:', productId);
logger.log('New Price:', newPrice);
logger.log('Reason:', reason);
logger.groupEnd();
```

### API Request Inspector

```javascript
function createAPIInspector() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
        const [url, options = {}] = args;
        
        console.group(`API Request: ${options.method || 'GET'} ${url}`);
        console.log('Headers:', options.headers);
        if (options.body) {
            console.log('Body:', options.body);
        }
        
        const startTime = performance.now();
        
        try {
            const response = await originalFetch(...args);
            const endTime = performance.now();
            
            console.log(`Status: ${response.status} ${response.statusText}`);
            console.log(`Duration: ${Math.round(endTime - startTime)}ms`);
            
            // Clone response to log body without consuming it
            const clonedResponse = response.clone();
            try {
                const responseBody = await clonedResponse.json();
                console.log('Response:', responseBody);
            } catch {
                console.log('Response: (non-JSON)');
            }
            
            console.groupEnd();
            return response;
        } catch (error) {
            const endTime = performance.now();
            console.error(`Error after ${Math.round(endTime - startTime)}ms:`, error);
            console.groupEnd();
            throw error;
        }
    };
    
    // Return function to restore original fetch
    return () => {
        window.fetch = originalFetch;
    };
}

// Enable in development
if (process.env.NODE_ENV === 'development') {
    const restoreFetch = createAPIInspector();
    
    // Cleanup when needed
    window.addEventListener('beforeunload', restoreFetch);
}
```

---

**Last Updated**: January 2025  
**API Version**: 1.0  
**Support**: Contact development team for issues

This guide provides all the essential information for frontend integration without assuming specific frameworks or technologies. The implementation details are left to the frontend team's preferred tools and patterns.
