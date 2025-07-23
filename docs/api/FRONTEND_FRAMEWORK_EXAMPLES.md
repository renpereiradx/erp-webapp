# 🎯 Ejemplos de Integración por Framework

## ⚡ React.js

### Hook personalizado para productos
```jsx
// hooks/useProducts.js
import { useState, useEffect } from 'react';
import { BusinessManagementAPI } from '../utils/api-client';

const api = new BusinessManagementAPI();

export const useProducts = (page = 1, pageSize = 10) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [page, pageSize]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProducts(page, pageSize);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    try {
      const newProduct = await api.createProduct(productData);
      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    createProduct,
    refetch: loadProducts
  };
};
```

### Componente de lista de productos
```jsx
// components/ProductList.jsx
import React from 'react';
import { useProducts } from '../hooks/useProducts';

const ProductList = () => {
  const { products, loading, error, createProduct } = useProducts();

  const handleCreateProduct = async () => {
    try {
      await createProduct({
        name: 'Nuevo Producto',
        categoryId: 5
      });
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  if (loading) return <div>Cargando productos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="product-list">
      <button onClick={handleCreateProduct}>
        Crear Producto
      </button>
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>Estado: {product.state ? 'Activo' : 'Inactivo'}</p>
            <p>Categoría: {product.category?.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
```

## 🟢 Vue.js

### Composable para productos
```javascript
// composables/useProducts.js
import { ref, reactive } from 'vue';
import { BusinessManagementAPI } from '../utils/api-client';

const api = new BusinessManagementAPI();

export function useProducts() {
  const products = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const loadProducts = async (page = 1, pageSize = 10) => {
    loading.value = true;
    error.value = null;
    
    try {
      const data = await api.getProducts(page, pageSize);
      products.value = data;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const createProduct = async (productData) => {
    try {
      const newProduct = await api.createProduct(productData);
      products.value.push(newProduct);
      return newProduct;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct
  };
}
```

### Componente Vue
```vue
<!-- components/ProductList.vue -->
<template>
  <div class="product-list">
    <button @click="handleCreateProduct">
      Crear Producto
    </button>
    
    <div v-if="loading">Cargando productos...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    
    <div v-else class="products-grid">
      <div 
        v-for="product in products" 
        :key="product.id" 
        class="product-card"
      >
        <h3>{{ product.name }}</h3>
        <p>Estado: {{ product.state ? 'Activo' : 'Inactivo' }}</p>
        <p>Categoría: {{ product.category?.name }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useProducts } from '../composables/useProducts';

const { products, loading, error, loadProducts, createProduct } = useProducts();

onMounted(() => {
  loadProducts();
});

const handleCreateProduct = async () => {
  try {
    await createProduct({
      name: 'Nuevo Producto',
      categoryId: 5
    });
  } catch (error) {
    console.error('Error creating product:', error);
  }
};
</script>
```

## 🅰️ Angular

### Servicio de productos
```typescript
// services/product.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BusinessManagementAPI } from '../utils/api-client';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = new BusinessManagementAPI();
  private productsSubject = new BehaviorSubject<any[]>([]);
  public products$ = this.productsSubject.asObservable();

  async loadProducts(page: number = 1, pageSize: number = 10): Promise<void> {
    try {
      const products = await this.api.getProducts(page, pageSize);
      this.productsSubject.next(products);
    } catch (error) {
      console.error('Error loading products:', error);
      throw error;
    }
  }

  async createProduct(productData: any): Promise<any> {
    try {
      const newProduct = await this.api.createProduct(productData);
      const currentProducts = this.productsSubject.value;
      this.productsSubject.next([...currentProducts, newProduct]);
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<any> {
    return this.api.getProductById(id);
  }
}
```

### Componente Angular
```typescript
// components/product-list.component.ts
import { Component, OnInit } from '@angular/core';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-list',
  template: `
    <div class="product-list">
      <button (click)="createProduct()">Crear Producto</button>
      
      <div *ngIf="loading">Cargando productos...</div>
      <div *ngIf="error">Error: {{ error }}</div>
      
      <div *ngIf="!loading && !error" class="products-grid">
        <div *ngFor="let product of products" class="product-card">
          <h3>{{ product.name }}</h3>
          <p>Estado: {{ product.state ? 'Activo' : 'Inactivo' }}</p>
          <p>Categoría: {{ product.category?.name }}</p>
        </div>
      </div>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
    
    // Suscribirse a cambios en productos
    this.productService.products$.subscribe(
      products => this.products = products
    );
  }

  async loadProducts() {
    this.loading = true;
    this.error = null;
    
    try {
      await this.productService.loadProducts();
    } catch (error: any) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async createProduct() {
    try {
      await this.productService.createProduct({
        name: 'Nuevo Producto',
        categoryId: 5
      });
    } catch (error) {
      console.error('Error creating product:', error);
    }
  }
}
```

## 📱 React Native

### Hook para productos en React Native
```javascript
// hooks/useProducts.js
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ReactNativeAPI {
  constructor() {
    this.baseUrl = 'http://10.0.2.2:5050'; // Para Android Emulator
    // this.baseUrl = 'http://localhost:5050'; // Para iOS Simulator
  }

  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      Alert.alert('Error', error.message);
      throw error;
    }
  }

  async getProducts(page = 1, pageSize = 10) {
    return this.makeRequest(`/products/${page}/${pageSize}`);
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
}

const api = new ReactNativeAPI();

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return { products, loading, loadProducts };
};
```

## 🔧 Configuración de Interceptors

### Axios Interceptor (alternativa a fetch)
```javascript
// utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5050',
  timeout: 10000
});

// Request interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor para manejar errores
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 🎨 CSS/Styling para componentes

### CSS básico para lista de productos
```css
/* styles/products.css */
.product-list {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.product-card h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.product-card p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 18px;
  color: #666;
}

.error {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 16px;
  border-radius: 4px;
  margin: 16px 0;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s ease;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

## 🔍 Testing

### Jest test para API client
```javascript
// tests/api-client.test.js
import { BusinessManagementAPI } from '../api-client';

// Mock fetch
global.fetch = jest.fn();
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('BusinessManagementAPI', () => {
  let api;

  beforeEach(() => {
    api = new BusinessManagementAPI();
    fetch.mockClear();
    mockLocalStorage.getItem.mockClear();
  });

  test('should login successfully', async () => {
    const mockResponse = { token: 'fake-token', role_id: 'admin' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await api.login('test@example.com', 'password');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5050/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password'
        })
      })
    );
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'fake-token');
    expect(result).toEqual(mockResponse);
  });

  test('should get products with auth header', async () => {
    mockLocalStorage.getItem.mockReturnValue('fake-token');
    const mockProducts = [{ id: '1', name: 'Test Product' }];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    const result = await api.getProducts();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5050/products/1/10',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer fake-token'
        })
      })
    );
    expect(result).toEqual(mockProducts);
  });
});
```

---

*Estos ejemplos cubren las integraciones más comunes para diferentes frameworks frontend. Cada uno está optimizado para las mejores prácticas del framework correspondiente.*
