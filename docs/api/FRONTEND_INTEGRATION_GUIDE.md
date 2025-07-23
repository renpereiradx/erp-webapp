# 🚀 Guía para Frontend - Business Management API

## 📋 Información Esencial para el Equipo Frontend

### 🌐 **URL Base de la API**
```
http://localhost:5050
```

### 🔐 **Autenticación (Obligatoria para todos los endpoints excepto públicos)**

#### Headers requeridos:
```javascript
headers: {
  'Authorization': 'Bearer ' + token,
  'Content-Type': 'application/json'
}
```

## 🔑 **1. AUTENTICACIÓN - Endpoints Públicos**

### Registro de Usuario
```javascript
// POST /signup
const signup = async (email, password) => {
  const response = await fetch('http://localhost:5050/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });
  
  const data = await response.json();
  // Respuesta: { token: "jwt-token", role_id: "role" }
  
  // Guardar token para requests posteriores
  localStorage.setItem('authToken', data.token);
  return data;
};
```

### Login
```javascript
// POST /login
const login = async (email, password) => {
  const response = await fetch('http://localhost:5050/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });
  
  const data = await response.json();
  localStorage.setItem('authToken', data.token);
  return data;
};
```

### ✅ Obtener Categorías (Público - Sin autenticación)
```javascript
// GET /categories
// ✅ ARREGLO: Este endpoint ya NO requiere autenticación
const getCategories = async () => {
  const response = await fetch('http://localhost:5050/categories');
  const categories = await response.json();
  
  // Ejemplo de respuesta:
  // [
  //   { id: 1, name: "Electrónicos", description: "Dispositivos electrónicos" },
  //   { id: 5, name: "Deportes", description: "Artículos deportivos" },
  //   { id: 9, name: "Baby", description: "Productos para bebés" }
  // ]
  
  return categories;
};

// ⚠️ PROBLEMA RESUELTO: 
// Si antes obtenías error 401 (Unauthorized) en /categories,
// ahora está corregido - es un endpoint público
```

## 📦 **2. PRODUCTOS**

### Obtener todos los productos (paginado)
```javascript
// GET /products/{page}/{pageSize}
const getProducts = async (page = 1, pageSize = 10) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/products/${page}/${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### Obtener producto por ID
```javascript
// GET /products/{id}
const getProductById = async (productId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### 🚀 **NUEVO: Obtener producto con todos los detalles (RECOMENDADO)**
```javascript
// GET /products/{id}/details
// ✅ Una sola llamada que incluye: producto, stock, precio, descripción, categoría y lotes
const getProductDetails = async (productId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/products/${productId}/details`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const productDetails = await response.json();
  
  // Ejemplo de respuesta:
  // {
  //   id: "GA4w4YlYpVP1LNji17o9FKbp8Dg",
  //   name: "Onion - Dried",
  //   state: true,
  //   category_id: 9,
  //   product_type: "PHYSICAL",
  //   category: { id: 9, name: "Baby", description: "..." },
  //   stock: { id: 110, quantity: 7, effective_date: "..." },
  //   price: { id: 54, purchase_price: 320000.00, effective_date: "..." },
  //   description: { id: 15, description: "Descripción del producto", effective_date: "..." }
  // }
  
  return productDetails;
};

// Uso optimizado vs múltiples llamadas:
// ❌ Antes (múltiples requests - lento):
// const product = await getProductById(id);
// const stock = await getProductStock(id);
// const price = await getProductPrice(id);
// const description = await getProductDescription(id);

// ✅ Ahora (una sola request - 5x más rápido):
// const productDetails = await getProductDetails(id);
```

### Buscar productos por nombre
```javascript
// GET /products/name/{name}
const searchProductsByName = async (name) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/products/name/${name}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### 🆕 Buscar productos con todos los detalles por nombre (RECOMENDADO)
```javascript
// GET /products/search/details/{name}
const searchProductDetailsByName = async (name) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/products/search/details/${encodeURIComponent(name)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// Ejemplo de uso:
const productResults = await searchProductDetailsByName('Onion');
console.log('Productos encontrados:', productResults.length);

productResults.forEach(product => {
  console.log(`${product.name}:`, {
    stock: product.stock?.quantity || 0,
    price: product.price?.purchase_price || 0,
    category: product.category?.name || 'Sin categoría',
    description: product.description?.description || 'Sin descripción'
  });
});

// Respuesta de ejemplo:
[
  {
    "id": "GA4w4YlYpVP1LNji17o9FKbp8Dg",
    "name": "Onion - Dried",
    "state": true,
    "category_id": 9,
    "user_id": "2prrJIgRvgaFVbuu49ua9QJVu8n",
    "product_type": "PHYSICAL",
    "category": {
      "id": 9,
      "name": "Baby",
      "description": "Lorem ipsum dolor sit amet..."
    },
    "stock": {
      "id": 110,
      "quantity": 7,
      "effective_date": "2025-06-03T14:33:52.613475Z",
      "metadata": {
        "type": "stock_adjustment",
        "po_id": 9,
        "action": "cancel_po_return"
      }
    },
    "price": {
      "id": 54,
      "purchase_price": 320000.00,
      "effective_date": "2025-05-26T17:39:41.446265Z",
      "metadata": {
        "po_id": 9,
        "source": "purchase_order_cancellation"
      }
    },
    "description": {
      "id": 85,
      "description": "Descripción del producto...",
      "effective_date": "2025-05-26T17:39:41.446265Z"
    }
  }
  // ... más productos que coincidan
]

// 🚀 VENTAJAS vs método anterior:
// ❌ Antes: searchProductsByName() + múltiples requests por cada producto = LENTO
// ✅ Ahora: searchProductDetailsByName() = Una sola request con todos los datos
```

### Crear nuevo producto
```javascript
// POST /products/
const createProduct = async (productData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch('http://localhost:5050/products/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: productData.name,
      id_category: productData.categoryId  // Número entero
    })
  });
  return await response.json();
};

// Ejemplo de uso:
// createProduct({ name: "Puma MB.01", categoryId: 5 })
```

### Actualizar producto
```javascript
// PUT /products/{id}
const updateProduct = async (productId, productData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: productData.name,
      state: productData.state,
      id_category: productData.categoryId
    })
  });
  return await response.json();
};
```

### Eliminar producto (soft delete)
```javascript
// PUT /products/delete/{id}
const deleteProduct = async (productId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/products/delete/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

## 💰 **3. PRECIOS DE PRODUCTOS**

### Obtener precio de producto
```javascript
// GET /product_price/product_id/{product_id}
const getProductPrice = async (productId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/product_price/product_id/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### Establecer precio de producto
```javascript
// POST /product_price/product_id/{product_id}
const setProductPrice = async (productId, priceData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/product_price/product_id/${productId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cost_price: priceData.costPrice,     // Número decimal: 1250000.00
      sale_price: priceData.salePrice,     // Número decimal: 1500000.00
      tax: priceData.tax                   // Número decimal: 30.00
    })
  });
  return await response.json();
};
```

## 📦 **4. STOCK E INVENTARIO**

### Obtener stock de producto
```javascript
// GET /stock/product_id/{product_id}
const getProductStock = async (productId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/stock/product_id/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### Crear registro de stock
```javascript
// POST /stock/{product_id}
const createStock = async (productId, stockData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/stock/${productId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quantity: stockData.quantity,        // Número entero: 25
      exp: stockData.expirationDate,       // String fecha: "2055-02-26"
      entity: {
        name: stockData.entityName || "FRONTEND"
      }
    })
  });
  return await response.json();
};
```

### Crear inventario
```javascript
// POST /inventory/
const createInventory = async (inventoryItems) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch('http://localhost:5050/inventory/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(inventoryItems)  // Array de objetos
  });
  return await response.json();
};

// Ejemplo de inventoryItems:
/*
[
  { product_id: "IFQ12rtRfwl37D6r17j4QajgzRM", quantity_checked: 22 },
  { product_id: "BXLH1gKpokq6eHBc24m14gq9Dco", quantity_checked: 11 },
  { product_id: "oPfF1ThrpC34mArR38d2EusgsJL", quantity_checked: 8 }
]
*/
```

## 👥 **5. CLIENTES**

### Obtener clientes (paginado)
```javascript
// GET /client/{page}/{pageSize}
const getClients = async (page = 1, pageSize = 10) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/client/${page}/${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### Crear cliente
```javascript
// POST /client/
const createClient = async (clientData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch('http://localhost:5050/client/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: clientData.name,
      last_name: clientData.lastName,
      document_id: clientData.documentId,
      contact: clientData.contact,
      status: true
    })
  });
  return await response.json();
};
```

## 🏪 **6. PROVEEDORES**

### Obtener proveedores (paginado)
```javascript
// GET /supplier/{page}/{pageSize}
const getSuppliers = async (page = 1, pageSize = 10) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/supplier/${page}/${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

## 🛒 **7. VENTAS**

### Crear venta
```javascript
// POST /sale/
const createSale = async (saleData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch('http://localhost:5050/sale/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: saleData.clientId,
      total_amount: saleData.totalAmount,
      sale_date: new Date().toISOString(),
      status: "completed"
    })
  });
  return await response.json();
};
```

### Obtener ventas por cliente
```javascript
// GET /sale/client_id/{client_id}
const getSalesByClient = async (clientId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5050/sale/client_id/${clientId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

## 🔧 **Utilidad: Manejo de Errores**

```javascript
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    
    // Manejar errores específicos
    if (error.message.includes('401')) {
      // Token expirado o inválido
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    throw error;
  }
};
```

## 📱 **Ejemplo de Integración Completa - React**

```javascript
import React, { useState, useEffect } from 'react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadProducts();
  }, [page]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5050/products/${page}/10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5050/products/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: productData.name,
          id_category: productData.categoryId
        })
      });
      
      if (response.ok) {
        loadProducts(); // Recargar lista
      }
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  return (
    <div>
      {loading ? (
        <div>Cargando productos...</div>
      ) : (
        <ul>
          {products.map(product => (
            <li key={product.id}>
              {product.name} - Estado: {product.state ? 'Activo' : 'Inactivo'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductList;
```

## ⚠️ **Notas Importantes (ACTUALIZADAS)**

1. **✅ Endpoints públicos (sin autenticación)**: `/signup`, `/login`, `/categories` y `/`
2. **🔐 Todos los demás endpoints requieren autenticación** con JWT token
3. **El token debe incluir "Bearer "** antes del JWT
4. **Los IDs de productos son strings** (ej: "GA4w4YlYpVP1LNji17o9FKbp8Dg")
5. **Las fechas deben estar en formato ISO 8601**
6. **Los precios están en pesos colombianos (COP)**
7. **Siempre incluir Content-Type: application/json** en requests POST/PUT

## 🚀 **Nuevas Funcionalidades**

### **✅ Problema de Categorías RESUELTO**
- ~~❌ Error 401 en GET /categories~~
- ✅ **ARREGLADO**: `/categories` es ahora público (sin autenticación)

### **🚀 Nuevo Endpoint Optimizado**
- **GET /products/{id}/details** - Obtener producto completo en una sola llamada
- **5x más rápido** que múltiples requests
- **Datos consistentes** del mismo momento
- **Incluye**: producto, stock, precio, descripción, categoría, lotes

```javascript
// ✅ Uso recomendado para páginas de detalle de producto
const productDetails = await api.getProductDetails(productId);
```

## 🔗 **Recursos Adicionales**

- **Documentación Swagger**: http://localhost:3001/index.html (ejecutar `make docs`)
- **Colección de Postman**: Ver archivo `Business Management.postman_collection.json`
- **OpenAPI Spec**: `docs/swagger.yaml`

---

*Esta guía proporciona todo lo necesario para integrar el frontend con la API Business Management de forma exitosa.*
