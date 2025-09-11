# Manual Price Adjustments - Frontend Integration Guide

## Overview

This guide provides comprehensive instructions for frontend developers to integrate with the Manual Price Adjustments API. The system allows users to create manual price adjustments and view complete adjustment history through a RESTful API.

## Quick Start

### Base URL
```
http://localhost:5050
```

### Authentication
All endpoints require JWT authentication via the `Authorization` header:
```javascript
headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
}
```

## API Endpoints

### 1. Create Manual Price Adjustment

**Endpoint:** `POST /manual_adjustment/price`

**Purpose:** Create a new manual price adjustment for a specific product.

#### Request

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
    "product_id": "PROD_BANANA_001",
    "new_price": 16.50,
    "unit": "UNIT",
    "reason": "Market price adjustment due to supplier cost increase",
    "metadata": {
        "adjustment_category": "market_driven",
        "approval_id": "APPR-123",
        "notes": "Approved by manager John Doe"
    }
}
```

**Field Descriptions:**
- `product_id` (required): Product identifier
- `new_price` (required): New price value (must be positive)
- `unit` (optional): Unit type (defaults to "UNIT")
- `reason` (required): Reason for the price adjustment
- `metadata` (optional): Additional structured data

#### Response

**Success (200 OK):**
```json
{
    "id": 12,
    "product_id": "PROD_BANANA_001",
    "user_id": "user123",
    "old_price": 15.00,
    "new_price": 16.50,
    "price_change": 1.50,
    "price_change_percent": 10.00,
    "unit": "UNIT",
    "reason": "Market price adjustment due to supplier cost increase",
    "effective_date": "2025-09-10T16:18:52Z",
    "currency_id": null,
    "exchange_rate": null,
    "created_at": "2025-09-10T16:18:52Z",
    "unit_price_id": 26,
    "metadata": {
        "adjustment_category": "market_driven",
        "approval_id": "APPR-123",
        "notes": "Approved by manager John Doe"
    },
    "message": "Manual price adjustment successful"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Invalid request data (missing required fields, invalid price format)
- `500 Internal Server Error`: Product not found or database error

#### JavaScript Example

```javascript
async function createPriceAdjustment(productId, newPrice, reason, metadata = {}) {
    try {
        const response = await fetch('/manual_adjustment/price', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId,
                new_price: newPrice,
                unit: 'UNIT',
                reason: reason,
                metadata: metadata
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Price adjustment created:', result);
        return result;
    } catch (error) {
        console.error('Error creating price adjustment:', error);
        throw error;
    }
}

// Usage
createPriceAdjustment(
    'PROD_BANANA_001', 
    16.50, 
    'Market price adjustment',
    { approval_id: 'APPR-123' }
);
```

### 2. Get Product Adjustment History

**Endpoint:** `GET /manual_adjustment/product/{productId}/history`

**Purpose:** Retrieve complete adjustment history for a specific product (both price and stock adjustments).

#### Request

**URL Parameters:**
- `productId`: Product identifier

**Query Parameters:**
- `limit` (optional): Maximum number of records to return (default: 10)
- `offset` (optional): Number of records to skip (default: 0)

**Example URL:**
```
GET /manual_adjustment/product/PROD_BANANA_001/history?limit=20&offset=0
```

#### Response

**Success (200 OK):**
```json
{
    "product_id": "PROD_BANANA_001",
    "history": [
        {
            "adjustment_id": 12,
            "adjustment_type": "price",
            "old_value": 15.00,
            "new_value": 16.50,
            "value_change": 1.50,
            "user_id": "user123",
            "adjustment_date": "2025-09-10T16:18:52Z",
            "reason": "Market price adjustment",
            "metadata": {
                "adjustment_category": "market_driven"
            },
            "related_transaction_id": null
        },
        {
            "adjustment_id": 18,
            "adjustment_type": "stock",
            "old_value": 150.0,
            "new_value": 250.0,
            "value_change": 100.0,
            "user_id": "user456",
            "adjustment_date": "2025-09-08T12:05:41Z",
            "reason": "Inventory recount",
            "metadata": {
                "location": "Warehouse A",
                "approvals": [...]
            },
            "related_transaction_id": 47
        }
    ],
    "limit": 20,
    "offset": 0,
    "count": 2
}
```

**Field Descriptions:**
- `adjustment_type`: Either "price" or "stock"
- `old_value`/`new_value`: Previous and new values
- `value_change`: Calculated difference
- `adjustment_date`: When the adjustment was made
- `related_transaction_id`: Link to stock transactions (for stock adjustments)

#### JavaScript Example

```javascript
async function getProductHistory(productId, limit = 10, offset = 0) {
    try {
        const url = `/manual_adjustment/product/${productId}/history?limit=${limit}&offset=${offset}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const history = await response.json();
        console.log('Product history:', history);
        return history;
    } catch (error) {
        console.error('Error fetching product history:', error);
        throw error;
    }
}

// Usage
getProductHistory('PROD_BANANA_001', 20, 0);
```

### 3. Verify System Integration

**Endpoint:** `GET /manual_adjustment/integration/verify`

**Purpose:** Check the integrity and consistency of the adjustment system.

#### Request

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Response

**Success (200 OK):**
```json
{
    "integration_status": true,
    "summary": {
        "total_stock_transactions": 5,
        "total_manual_adjustments": 4,
        "total_price_adjustments": 6,
        "orphaned_stock_transactions": 0,
        "price_mismatches": 0
    },
    "details": {
        "stock_integration": {
            "status": "OK",
            "orphaned_transactions": 0
        },
        "price_integration": {
            "status": "OK",
            "mismatched_prices": 0
        }
    },
    "timestamp": "2025-09-10T16:18:52Z"
}
```

**Status Indicators:**
- `integration_status`: Overall system health (true/false)
- `status`: Per-component status ("OK" or "ISSUES_FOUND")

#### JavaScript Example

```javascript
async function verifySystemIntegrity() {
    try {
        const response = await fetch('/manual_adjustment/integration/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const status = await response.json();
        console.log('System integrity:', status);
        
        if (!status.integration_status) {
            console.warn('System integrity issues detected:', status.details);
        }
        
        return status;
    } catch (error) {
        console.error('Error checking system integrity:', error);
        throw error;
    }
}
```

## Frontend Implementation Examples

### React Component - Price Adjustment Form

```jsx
import React, { useState } from 'react';

const PriceAdjustmentForm = ({ productId, onSuccess }) => {
    const [formData, setFormData] = useState({
        newPrice: '',
        reason: '',
        unit: 'UNIT'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await createPriceAdjustment(
                productId,
                parseFloat(formData.newPrice),
                formData.reason,
                { source: 'admin_panel' }
            );
            
            onSuccess(result);
            setFormData({ newPrice: '', reason: '', unit: 'UNIT' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="price-adjustment-form">
            <div className="form-group">
                <label>New Price:</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.newPrice}
                    onChange={(e) => setFormData({...formData, newPrice: e.target.value})}
                    required
                />
            </div>
            
            <div className="form-group">
                <label>Unit:</label>
                <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                >
                    <option value="UNIT">Unit</option>
                    <option value="kg">Kilogram</option>
                    <option value="box">Box</option>
                </select>
            </div>
            
            <div className="form-group">
                <label>Reason:</label>
                <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Explain the reason for this price adjustment"
                    required
                />
            </div>
            
            {error && <div className="error">{error}</div>}
            
            <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Price Adjustment'}
            </button>
        </form>
    );
};
```

### React Component - Adjustment History

```jsx
import React, { useState, useEffect } from 'react';

const AdjustmentHistory = ({ productId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        limit: 10,
        offset: 0,
        hasMore: true
    });

    useEffect(() => {
        loadHistory();
    }, [productId, pagination.offset]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const result = await getProductHistory(
                productId, 
                pagination.limit, 
                pagination.offset
            );
            
            if (pagination.offset === 0) {
                setHistory(result.history);
            } else {
                setHistory(prev => [...prev, ...result.history]);
            }
            
            setPagination(prev => ({
                ...prev,
                hasMore: result.history.length === prev.limit
            }));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        setPagination(prev => ({
            ...prev,
            offset: prev.offset + prev.limit
        }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const formatValue = (type, value) => {
        if (type === 'price') {
            return `$${value.toFixed(2)}`;
        }
        return value.toString();
    };

    return (
        <div className="adjustment-history">
            <h3>Adjustment History</h3>
            
            {error && <div className="error">{error}</div>}
            
            <div className="history-list">
                {history.map((adjustment, index) => (
                    <div key={`${adjustment.adjustment_id}-${index}`} className="history-item">
                        <div className="adjustment-header">
                            <span className={`type-badge ${adjustment.adjustment_type}`}>
                                {adjustment.adjustment_type}
                            </span>
                            <span className="date">{formatDate(adjustment.adjustment_date)}</span>
                        </div>
                        
                        <div className="adjustment-details">
                            <div className="value-change">
                                {formatValue(adjustment.adjustment_type, adjustment.old_value)} 
                                → 
                                {formatValue(adjustment.adjustment_type, adjustment.new_value)}
                                <span className={`change ${adjustment.value_change >= 0 ? 'positive' : 'negative'}`}>
                                    ({adjustment.value_change >= 0 ? '+' : ''}{adjustment.value_change})
                                </span>
                            </div>
                            
                            <div className="reason">{adjustment.reason}</div>
                            
                            {adjustment.metadata && Object.keys(adjustment.metadata).length > 0 && (
                                <details className="metadata">
                                    <summary>Additional Details</summary>
                                    <pre>{JSON.stringify(adjustment.metadata, null, 2)}</pre>
                                </details>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            {loading && <div className="loading">Loading...</div>}
            
            {!loading && pagination.hasMore && (
                <button onClick={loadMore} className="load-more">
                    Load More
                </button>
            )}
        </div>
    );
};
```

### Vue.js Example

```vue
<template>
  <div class="price-adjustment">
    <form @submit.prevent="submitAdjustment">
      <div class="form-group">
        <label>New Price:</label>
        <input 
          v-model.number="adjustment.newPrice" 
          type="number" 
          step="0.01" 
          min="0" 
          required 
        />
      </div>
      
      <div class="form-group">
        <label>Reason:</label>
        <textarea 
          v-model="adjustment.reason" 
          placeholder="Reason for price adjustment"
          required
        ></textarea>
      </div>
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'Creating...' : 'Create Adjustment' }}
      </button>
    </form>
    
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">{{ success }}</div>
  </div>
</template>

<script>
export default {
  props: ['productId'],
  data() {
    return {
      adjustment: {
        newPrice: null,
        reason: '',
        unit: 'UNIT'
      },
      loading: false,
      error: null,
      success: null
    };
  },
  methods: {
    async submitAdjustment() {
      this.loading = true;
      this.error = null;
      this.success = null;
      
      try {
        const result = await this.createPriceAdjustment(
          this.productId,
          this.adjustment.newPrice,
          this.adjustment.reason
        );
        
        this.success = 'Price adjustment created successfully!';
        this.adjustment = { newPrice: null, reason: '', unit: 'UNIT' };
        this.$emit('adjustment-created', result);
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    async createPriceAdjustment(productId, newPrice, reason) {
      const response = await fetch('/manual_adjustment/price', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          new_price: newPrice,
          reason: reason,
          unit: this.adjustment.unit
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    },
    
    getAuthToken() {
      return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }
  }
};
</script>
```

## Error Handling

### Common Error Scenarios

1. **Authentication Errors (401)**
```javascript
// Handle expired or missing tokens
if (response.status === 401) {
    // Redirect to login or refresh token
    window.location.href = '/login';
}
```

2. **Validation Errors (400)**
```javascript
// Handle invalid data
if (response.status === 400) {
    const errorData = await response.json();
    showValidationErrors(errorData);
}
```

3. **Product Not Found (500)**
```javascript
// Handle product not found
if (response.status === 500 && response.includes('foreign key constraint')) {
    showError('Product not found. Please verify the product ID.');
}
```

### Robust Error Handling Function

```javascript
async function handleApiResponse(response) {
    if (response.ok) {
        return await response.json();
    }
    
    switch (response.status) {
        case 401:
            throw new Error('Authentication required. Please log in.');
        case 400:
            throw new Error('Invalid request data. Please check your input.');
        case 404:
            throw new Error('Resource not found.');
        case 500:
            const errorText = await response.text();
            if (errorText.includes('foreign key constraint')) {
                throw new Error('Product not found. Please verify the product ID.');
            }
            throw new Error('Server error. Please try again later.');
        default:
            throw new Error(`Unexpected error: ${response.status}`);
    }
}
```

## Best Practices

### 1. Input Validation
```javascript
function validatePriceAdjustment(data) {
    const errors = [];
    
    if (!data.product_id || data.product_id.trim() === '') {
        errors.push('Product ID is required');
    }
    
    if (!data.new_price || data.new_price <= 0) {
        errors.push('New price must be a positive number');
    }
    
    if (!data.reason || data.reason.trim() === '') {
        errors.push('Reason is required');
    }
    
    if (data.reason && data.reason.length > 500) {
        errors.push('Reason must be less than 500 characters');
    }
    
    return errors;
}
```

### 2. Loading States
```javascript
// Show loading indicators during API calls
const [isCreating, setIsCreating] = useState(false);
const [isLoading, setIsLoading] = useState(false);

// Use different loading states for different actions
<button disabled={isCreating}>
    {isCreating ? 'Creating...' : 'Create Adjustment'}
</button>
```

### 3. Success Feedback
```javascript
// Provide clear success feedback
function showSuccess(message, details = null) {
    toast.success(message);
    
    if (details) {
        console.log('Adjustment details:', details);
    }
}
```

### 4. Pagination
```javascript
// Implement efficient pagination
const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: true
});

// Calculate pagination info
const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
const totalPages = Math.ceil(pagination.total / pagination.limit);
```

## Testing

### Unit Tests Example (Jest)

```javascript
describe('Price Adjustment API', () => {
    beforeEach(() => {
        fetchMock.clearMocks();
    });

    test('should create price adjustment successfully', async () => {
        const mockResponse = {
            id: 12,
            product_id: 'PROD_TEST_001',
            new_price: 25.00,
            message: 'Manual price adjustment successful'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await createPriceAdjustment(
            'PROD_TEST_001', 
            25.00, 
            'Test adjustment'
        );

        expect(result.id).toBe(12);
        expect(result.new_price).toBe(25.00);
    });

    test('should handle validation errors', async () => {
        fetchMock.mockResponseOnce('Invalid request data', { 
            status: 400 
        });

        await expect(
            createPriceAdjustment('', -5, '')
        ).rejects.toThrow('Invalid request data');
    });
});
```

## Performance Considerations

### 1. Debouncing Search/Filter
```javascript
import { debounce } from 'lodash';

const debouncedSearch = debounce((searchTerm) => {
    searchProducts(searchTerm);
}, 300);
```

### 2. Caching
```javascript
// Simple cache for product history
const historyCache = new Map();

async function getCachedHistory(productId) {
    if (historyCache.has(productId)) {
        return historyCache.get(productId);
    }
    
    const history = await getProductHistory(productId);
    historyCache.set(productId, history);
    
    return history;
}
```

### 3. Virtual Scrolling for Large Lists
```javascript
// Use libraries like react-window for large adjustment history lists
import { FixedSizeList as List } from 'react-window';

const AdjustmentRow = ({ index, style, data }) => (
    <div style={style}>
        {/* Render adjustment item */}
    </div>
);

<List
    height={400}
    itemCount={adjustments.length}
    itemSize={80}
    itemData={adjustments}
>
    {AdjustmentRow}
</List>
```

## Security Notes

1. **Always validate JWT tokens** before making API calls
2. **Never expose sensitive data** in client-side code
3. **Sanitize user input** before sending to API
4. **Use HTTPS** in production environments
5. **Implement proper CORS** settings

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if JWT token is expired
   - Verify token format
   - Ensure proper Authorization header

2. **Product Not Found**
   - Verify product ID exists in database
   - Check for typos in product ID
   - Ensure product is not deleted

3. **Price Validation Errors**
   - Ensure price is positive number
   - Check decimal precision
   - Verify currency format

### Debug Tools

```javascript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[Price Adjustment] ${message}`, data);
    }
}

// Use in API calls
debugLog('Creating price adjustment', { productId, newPrice, reason });
```

---

**Last Updated**: September 10, 2025  
**API Version**: 1.0  
**Support**: Contact development team for issues
