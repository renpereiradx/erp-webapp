# Guía de API de Productos para Desarrolladores Frontend

Esta guía proporciona documentación completa de todos los endpoints de productos disponibles para integración con aplicaciones frontend.

## Base URL
```
http://localhost:8080/api
```

## Autenticación
Todos los endpoints requieren autenticación JWT. Incluye el token en el header:
```
Authorization: Bearer <jwt_token>
```

---

## ¿Qué son los Productos Enriquecidos?

Los **Productos Enriquecidos** (`ProductEnriched`) contienen información completa del producto incluyendo:
- **Datos básicos**: ID, nombre, estado, categoría, tipo
- **Información de stock**: Cantidad actual, fechas de actualización, usuario que modificó
- **Información de precios**: Precios generales y precios por unidades específicas
- **Descripción**: Descripción actual del producto
- **Campos calculados**: Estado del stock, precio formateado, validaciones

Esta estructura es ideal para mostrar productos en interfaces de usuario donde necesitas toda la información de una sola vez.

### Endpoints que devuelven Productos Enriquecidos:
- `GET /products/{id}` - Producto enriquecido por ID
- `GET /products/name/{name}` - Búsqueda enriquecida por nombre
- `GET /products/{page}/{pageSize}` - Listado paginado enriquecido
- `GET /products/enriched/all` - Todos los productos enriquecidos

---

## Endpoints de Productos

#### 5. Create Product
`POST /products`

Crea un nuevo producto.

**Request Body:**
```json
{
  "name": "Producto Nuevo",
  "barcode": "7891234567890",
  "category_id": 1,
  "product_type": "PHYSICAL",
  "purchase_price": 15000.00
}
```

**Campos:**
- `name` (string, requerido): Nombre del producto
- `barcode` (string, opcional): Código de barras del producto (máximo 50 caracteres)
- `category_id` (int, requerido): ID de la categoría
- `product_type` (string, opcional): Tipo de producto ("PHYSICAL" o "SERVICE"). Por defecto: "PHYSICAL"
- `purchase_price` (float, requerido): Precio de compra del producto

**Response (200):**
```json
{
  "message": "Product and description added successfully"
}
```

**Response (400):**
```json
{
  "error": "Description is required"
}
```

---

#### 3. Get Product by ID
`GET /products/{id}`

Obtiene un producto específico por su ID.

**Response (200):**
```json
{
  "id": "abc123",
  "name": "Producto Ejemplo",
  "barcode": "7891234567890",
  "state": true,
  "category": {
    "id": 1,
    "name": "Electrónicos"
  },
  "category_id": 1,
  "category_name": "Electrónicos",
  "product_type": "PHYSICAL",
  "user_id": "user123",
  "purchase_price": 15000.00,
  "price_id": 1,
  "price_updated_at": "2024-01-15T10:30:00Z",
  "price_updated_by": "user123",
  "unit_prices": [
    {
      "id": 1,
      "product_id": "abc123",
      "unit": "unidad",
      "price_per_unit": 15000.00,
      "effective_date": "2024-01-15T10:30:00Z"
    }
  ],
  "has_unit_pricing": true,
  "stock_quantity": 25.5,
  "stock_id": 1,
  "stock_updated_at": "2024-01-15T10:30:00Z",
  "stock_updated_by": "user123",
  "description": "Descripción completa del producto",
  "description_id": 1,
  "stock_status": "in_stock",
  "price_formatted": "PYG 15000",
  "has_valid_stock": true,
  "has_valid_price": true
}
```

#### 4. Get Product by Barcode
`GET /products/barcode/{barcode}`

Obtiene un producto específico por su código de barras.

**Parámetros de ruta:**
- `barcode` (string): El código de barras del producto

**Response (200):**
```json
{
  "id": "abc123",
  "name": "Producto Ejemplo",
  "barcode": "7891234567890",
  "state": true,
  "category": {
    "id": 1,
    "name": "Electrónicos"
  },
  "category_id": 1,
  "category_name": "Electrónicos",
  "product_type": "PHYSICAL",
  "user_id": "user123",
  "purchase_price": 15000.00,
  "price_id": 1,
  "price_updated_at": "2024-01-15T10:30:00Z",
  "price_updated_by": "user123",
  "unit_prices": [
    {
      "id": 1,
      "product_id": "abc123",
      "unit": "unidad",
      "price_per_unit": 15000.00,
      "effective_date": "2024-01-15T10:30:00Z"
    }
  ],
  "has_unit_pricing": true,
  "stock_quantity": 25.5,
  "stock_id": 1,
  "stock_updated_at": "2024-01-15T10:30:00Z",
  "stock_updated_by": "user123",
  "description": "Descripción completa del producto",
  "description_id": 1,
  "stock_status": "in_stock",
  "price_formatted": "PYG 15000",
  "has_valid_stock": true,
  "has_valid_price": true
}
```

**Response (404):**
```json
{
  "error": "Producto no encontrado"
}
```

**Valores de `stock_status`:**
- `"out_of_stock"`: Sin stock (cantidad <= 0)
- `"low_stock"`: Stock bajo (cantidad <= 5)
- `"medium_stock"`: Stock medio (cantidad <= 20)
- `"in_stock"`: En stock (cantidad > 20)

**Response (404):**
```json
{
  "error": "Product not found"
}
```

---

### 3. Buscar Productos Enriquecidos por Nombre
**GET** `/products/name/{name}`

Busca productos enriquecidos por nombre (búsqueda parcial). Devuelve productos con información completa de stock, precios y descripción.

**Response (200):**
```json
[
  {
    "id": "abc123",
    "name": "Producto Ejemplo",
    "barcode": "7891234567890",
    "state": true,
    "category": {
      "id": 1,
      "name": "Electrónicos"
    },
    "category_id": 1,
    "category_name": "Electrónicos",
    "product_type": "PHYSICAL",
    "user_id": "user123",
    "purchase_price": 15000.00,
    "price_id": 1,
    "price_updated_at": "2024-01-15T10:30:00Z",
    "price_updated_by": "user123",
    "unit_prices": [
      {
        "id": 1,
        "product_id": "abc123",
        "unit": "unidad",
        "price_per_unit": 15000.00,
        "effective_date": "2024-01-15T10:30:00Z"
      }
    ],
    "has_unit_pricing": true,
    "stock_quantity": 25.5,
    "stock_id": 1,
    "stock_updated_at": "2024-01-15T10:30:00Z",
    "stock_updated_by": "user123",
    "description": "Descripción completa del producto",
    "description_id": 1,
    "stock_status": "in_stock",
    "price_formatted": "PYG 15000",
    "has_valid_stock": true,
    "has_valid_price": true
  }
]
```

---

### 4. Obtener Productos Enriquecidos Paginados
**GET** `/products/{page}/{pageSize}`

Obtiene productos enriquecidos con paginación. Devuelve productos con información completa de stock, precios y descripción.

**Parámetros de URL:**
- `page` (int): Número de página (empezando desde 1)
- `pageSize` (int): Cantidad de elementos por página

**Response (200):**
```json
[
  {
    "id": "abc123",
    "name": "Producto 1",
    "state": true,
    "category": {
      "id": 1,
      "name": "Electrónicos"
    },
    "category_id": 1,
    "category_name": "Electrónicos",
    "product_type": "PHYSICAL",
    "user_id": "user123",
    "purchase_price": 15000.00,
    "price_id": 1,
    "price_updated_at": "2024-01-15T10:30:00Z",
    "price_updated_by": "user123",
    "unit_prices": [],
    "has_unit_pricing": false,
    "stock_quantity": 25.5,
    "stock_id": 1,
    "stock_updated_at": "2024-01-15T10:30:00Z",
    "stock_updated_by": "user123",
    "description": "Descripción del producto",
    "description_id": 1,
    "stock_status": "in_stock",
    "price_formatted": "PYG 15000",
    "has_valid_stock": true,
    "has_valid_price": true
  }
]
```

---

### 5. Obtener Todos los Productos Enriquecidos (Sin Paginación)
**GET** `/products/enriched/all`

Obtiene **todos** los productos enriquecidos sin paginación. Útil para componentes como selectores o cuando necesitas la lista completa.

**Response (200):**
```json
[
  {
    "id": "abc123",
    "name": "Producto Ejemplo",
    "state": true,
    "category": {
      "id": 1,
      "name": "Electrónicos"
    },
    "product_type": "PHYSICAL",
    "stock_quantity": 25.5,
    "stock_status": "in_stock",
    "purchase_price": 15000.00,
    "unit_prices": [],
    "has_unit_pricing": false,
    "description": "Descripción del producto",
    "price_formatted": "PYG 15000",
    "has_valid_stock": true,
    "has_valid_price": true
  }
]
```

---

### 6. Obtener Productos de Servicios de Canchas (Enriquecidos)
**GET** `/products/enriched/service-courts`

Obtiene productos de tipo **SERVICE** específicamente de categorías relacionadas con canchas deportivas. Incluye información completa de stock, precios y descripción optimizada para servicios de reserva.

**Filtros aplicados automáticamente:**
- `product_type = 'SERVICE'`
- `state = true` (solo productos activos)
- Categorías: "Alquiler de Canchas", "Sports", o cualquier categoría que contenga "cancha", "court", "field"
- Nombres de productos que contengan "cancha" o "court"

**Response (200):**
```json
[
  {
    "id": "BT_Cancha_1_xyz123abc",
    "name": "Cancha de Beach Tennis 1",
    "state": true,
    "category": {
      "id": 3,
      "name": "Alquiler de Canchas"
    },
    "category_id": 3,
    "category_name": "Alquiler de Canchas",
    "product_type": "SERVICE",
    "user_id": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
    "purchase_price": 70000.00,
    "price_id": 77,
    "price_updated_at": "2025-06-09T14:52:07Z",
    "price_updated_by": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
    "unit_prices": [],
    "has_unit_pricing": false,
    "stock_quantity": null,
    "stock_id": null,
    "stock_updated_at": null,
    "stock_updated_by": null,
    "description": null,
    "description_id": null,
    "stock_status": "no_stock_tracking",
    "price_formatted": "PYG 70000/hora",
    "has_valid_stock": false,
    "has_valid_price": true
  }
]
```

**Estados de `stock_status` para servicios:**
- `"no_stock_tracking"`: Servicio sin control de stock
- `"unavailable"`: Servicio temporalmente no disponible
- `"limited_availability"`: Disponibilidad limitada
- `"available"`: Servicio disponible

**Características especiales para servicios:**
- `price_formatted`: Muestra formato "PYG XXXX/hora" para servicios
- `has_valid_stock`: `false` para servicios sin control de inventario
- `stock_quantity`: Puede ser `null` para servicios

---

### 7. Obtener Productos por Categoría
**GET** `/products/by-category?categories=1,2,3`

Obtiene productos filtrados por categorías específicas con información de precios.

**Query Parameters:**
- `categories` (string, requerido): IDs de categorías separadas por comas

**Response (200):**
```json
{
  "data": [
    {
      "product_id": "abc123",
      "product_name": "Producto Ejemplo",
      "category_name": "Electrónicos",
      "price": 15000.00,
      "unit": "unidad",
      "price_source": "unit_price",
      "has_unit_pricing": true
    }
  ],
  "count": 1
}
```

---

### 8. Actualizar Producto
**PUT** `/products/{id}`

Actualiza un producto existente junto con su descripción.

**Request Body:**
```json
{
  "name": "Nombre Actualizado",
  "state": true,
  "id_category": 2,
  "product_type": "SERVICE",
  "description": "Nueva descripción"
}
```

**Response (200):**
```json
{
  "message": "Product and description updated successfully"
}
```

---

### 9. Eliminar Producto
**DELETE** `/products/{id}`

Elimina un producto (eliminación lógica).

**Response (200):**
```json
{
  "message": "Product and description deleted successfully"
}
```

---

### 7. Actualizar Producto
**PUT** `/products/{id}`

Actualiza un producto existente junto con su descripción.

**Request Body:**
```json
{
  "name": "Nombre Actualizado",
  "state": true,
  "id_category": 2,
  "product_type": "SERVICE",
  "description": "Nueva descripción"
}
```

**Response (200):**
```json
{
  "message": "Product and description updated successfully"
}
```

---

### 8. Eliminar Producto
**DELETE** `/products/{id}`

Elimina un producto (eliminación lógica).

**Response (200):**
```json
{
  "message": "Product and description deleted successfully"
}
```

---

## Endpoints de Inventario y Ajustes

### 10. Crear Inventario
**POST** `/inventory`

Crea un nuevo inventario físico con múltiples productos.

**Request Body:**
```json
{
  "check_date": "2025-09-01T10:00:00Z",
  "details": [
    {
      "id_product": "abc123",
      "quantity_checked": 25.5
    },
    {
      "id_product": "def456", 
      "quantity_checked": 10.0
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "inventory_id": 18,
  "message": "Inventory created successfully",
  "products_processed": 2
}
```

---

### 11. Ajuste Manual de Stock
**POST** `/inventory/manual-adjustment`

Realiza un ajuste manual de stock para un producto específico.

**Request Body:**
```json
{
  "id_product": "abc123",
  "new_quantity": 50.5,
  "reason": "Producto dañado - reducción por calidad",
  "metadata": {
    "source": "quality_control",
    "batch": "LOT-2025-001"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "adjustment_id": 12,
  "old_quantity": 25.5,
  "new_quantity": 50.5,
  "difference": 25.0,
  "message": "Manual adjustment recorded successfully"
}
```

---

### 12. Historial de Inventarios
**GET** `/inventory/history?page=1&pageSize=10`

Obtiene el historial de inventarios realizados.

**Query Parameters:**
- `page` (int, opcional): Número de página (default: 1)
- `pageSize` (int, opcional): Elementos por página (default: 10)

**Response (200):**
```json
{
  "inventories": [
    {
      "id": 17,
      "check_date": "2025-05-27T18:19:36Z",
      "id_user": "user123",
      "state": false,
      "total_products": 4,
      "total_differences": 3
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 15
}
```

---

### 13. Detalles de Inventario
**GET** `/inventory/{id}/details`

Obtiene los detalles específicos de un inventario.

**Response (200):**
```json
{
  "inventory": {
    "id": 17,
    "check_date": "2025-05-27T18:19:36Z",
    "id_user": "user123",
    "state": false
  },
  "details": [
    {
      "id": 71,
      "product": {
        "id": "abc123",
        "name": "Five Alive Citrus"
      },
      "previous_quantity": 25.0,
      "quantity_checked": 22.0,
      "difference": -3.0,
      "difference_percentage": -12.0
    }
  ]
}
```

---

### 14. Historial de Ajustes Manuales
**GET** `/inventory/adjustments?product_id=abc123&page=1&pageSize=10`

Obtiene el historial de ajustes manuales.

**Query Parameters:**
- `product_id` (string, opcional): Filtrar por producto específico
- `page` (int, opcional): Número de página (default: 1)
- `pageSize` (int, opcional): Elementos por página (default: 10)

**Response (200):**
```json
{
  "adjustments": [
    {
      "id": 11,
      "product": {
        "id": "abc123",
        "name": "Tea - Grapefruit Green Tea"
      },
      "old_quantity": 14.0,
      "new_quantity": 88.0,
      "difference": 74.0,
      "reason": "Restock - new shipment",
      "adjustment_date": "2025-05-27T19:11:33Z",
      "id_user": "user123"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 10
}
```

---

### 15. Obtener Detalles Completos del Producto
**GET** `/products/{id}/details`

Obtiene información completa del producto incluyendo stock y precios históricos.

**Response (200):**
```json
{
  "id": "abc123",
  "name": "Producto Ejemplo",
  "state": true,
  "category": {
    "id": 1,
    "name": "Electrónicos"
  },
  "product_type": "PHYSICAL",
  "price": 15000.00,
  "stock_quantity": 25.5,
  "description": "Descripción completa"
}
```

---

### 16. Buscar Detalles de Productos por Nombre
**GET** `/products/search/details/{name}`

Busca productos por nombre y devuelve información detallada.

**Response (200):**
```json
[
  {
    "id": "abc123",
    "name": "Producto Ejemplo",
    "state": true,
    "category": {
      "id": 1,
      "name": "Electrónicos"
    },
    "product_type": "PHYSICAL",
    "price": 15000.00,
    "stock_quantity": 25.5,
    "description": "Descripción completa"
  }
]
```

---

### 17. Obtener Producto con Descripción
**GET** `/products/{id}/with-description`

Obtiene un producto específico con su descripción en formato optimizado.

**Response (200):**
```json
{
  "id": "abc123",
  "name": "Producto Ejemplo",
  "state": true,
  "category": {
    "id": 1,
    "name": "Electrónicos"
  },
  "product_type": "PHYSICAL",
  "description": "Descripción del producto",
  "effective_date": "2024-01-15T10:30:00Z",
  "user_id": "user123"
}
```

---

## Endpoints de Precios de Productos

### 18. Obtener Precio del Producto
**GET** `/products/{id}/price?unit=unidad`

Obtiene información de precios específica para un producto.

**Query Parameters:**
- `unit` (string, opcional): Unidad específica para obtener el precio

**Response (200):**
```json
{
  "data": {
    "product_id": "abc123",
    "product_name": "Producto Ejemplo",
    "category_name": "Electrónicos",
    "price": 15000.00,
    "unit": "unidad",
    "price_source": "unit_price",
    "has_unit_pricing": true
  }
}
```

---

### 19. Obtener Unidades del Producto
**GET** `/products/{id}/units`

Obtiene todas las unidades de medida disponibles para un producto con sus precios.

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "product_id": "abc123",
      "unit": "unidad",
      "price_per_unit": 15000.00,
      "effective_date": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "product_id": "abc123",
      "unit": "docena",
      "price_per_unit": 150000.00,
      "effective_date": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 20. Crear Precio por Unidad
**POST** `/products/{id}/units`

Crea un nuevo precio por unidad para un producto.

**Request Body:**
```json
{
  "unit": "docena",
  "price_per_unit": 150000.00
}
```

**Response (200):**
```json
{
  "message": "Unit price created successfully",
  "data": {
    "product_id": "abc123",
    "unit": "docena",
    "price_per_unit": 150000.00,
    "effective_date": "2024-01-15T10:30:00Z"
  }
}
```

---

## Códigos de Respuesta HTTP

| Código | Descripción |
|--------|-------------|
| 200    | Operación exitosa |
| 400    | Solicitud inválida |
| 401    | No autorizado (token JWT inválido) |
| 404    | Recurso no encontrado |
| 500    | Error interno del servidor |

---

## Cuándo Usar Cada Endpoint

### Productos Enriquecidos (Recomendado para UI)
Usa estos endpoints cuando necesites mostrar productos en la interfaz con toda la información:
- **Catálogo de productos**: `/products/enriched/all` o `/products/{page}/{pageSize}`
- **Búsqueda de productos**: `/products/name/{name}`
- **Detalles de producto**: `/products/{id}`
- **Inventario/Stock**: Cualquier endpoint enriquecido incluye información de stock

### Productos de Servicios de Canchas
- **Listado de canchas**: `/products/enriched/service-courts` - Específico para mostrar canchas deportivas disponibles
- **Sistemas de reservas**: Ideal para integración con el sistema de reservas
- **Precios por hora**: Formato optimizado para servicios de alquiler
- **Disponibilidad de servicios**: Información de estado específica para servicios

### Productos con Información Específica
- **Precios por categoría**: `/products/by-category?categories=1,2,3`
- **Precios específicos**: `/products/{id}/price`
- **Unidades disponibles**: `/products/{id}/units`
- **Solo descripción**: `/products/{id}/with-description`

---

## Ejemplos de Uso con JavaScript/TypeScript

### Obtener productos de servicios de canchas
```typescript
const getServiceCourts = async () => {
  try {
    const response = await fetch('/api/products/enriched/service-courts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const courts = await response.json();
    
    // Procesar específicamente para servicios de canchas
    return courts.map(court => ({
      ...court,
      // Campos útiles para UI de reservas
      isAvailable: court.stock_status !== 'unavailable',
      hourlyRate: court.purchase_price || 0,
      displayName: `${court.name} - ${court.category_name}`,
      priceDisplay: court.price_formatted || 'Precio no disponible',
      // Para integración con sistema de reservas
      reservationEnabled: court.has_valid_price && court.state,
      categoryType: court.category_name || 'Sin categoría'
    }));
  } catch (error) {
    console.error('Error fetching service courts:', error);
    throw error;
  }
};

// Ejemplo de uso en un selector de canchas
const CourtSelector = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadCourts = async () => {
      try {
        const courtsData = await getServiceCourts();
        setCourts(courtsData.filter(court => court.isAvailable));
      } catch (error) {
        console.error('Error loading courts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourts();
  }, []);
  
  if (loading) return <div>Cargando canchas...</div>;
  
  return (
    <select>
      <option value="">Seleccionar cancha</option>
      {courts.map(court => (
        <option key={court.id} value={court.id}>
          {court.displayName} - {court.priceDisplay}
        </option>
      ))}
    </select>
  );
};
```

### Obtener todos los productos enriquecidos
```typescript
const getProducts = async () => {
  try {
    const response = await fetch('/api/products/enriched/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const products = await response.json();
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};
```

### Crear un producto
```typescript
const createProduct = async (productData: {
  name: string;
  barcode?: string;
  category_id: number;
  product_type?: 'PHYSICAL' | 'SERVICE';
  purchase_price: number;
}) => {
  try {
    const response = await fetch('/api/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};
```

### Buscar productos enriquecidos por nombre
```typescript
const searchEnrichedProducts = async (searchTerm: string) => {
  try {
    const response = await fetch(`/api/products/name/${encodeURIComponent(searchTerm)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const products = await response.json();
    // Los productos ya incluyen stock, precios, descripción, etc.
    return products.map(product => ({
      ...product,
      // Ejemplo: agregar lógica personalizada basada en campos calculados
      canSell: product.has_valid_stock && product.has_valid_price,
      displayPrice: product.price_formatted || 'Sin precio'
    }));
  } catch (error) {
    console.error('Error searching enriched products:', error);
    throw error;
  }
};
```

### Obtener productos enriquecidos con paginación
```typescript
const getEnrichedProductsPaginated = async (page: number, pageSize: number) => {
  try {
    const response = await fetch(`/api/products/${page}/${pageSize}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const products = await response.json();
    return products.map(product => ({
      ...product,
      // Agregar campos útiles para la UI
      isLowStock: product.stock_status === 'low_stock',
      isOutOfStock: product.stock_status === 'out_of_stock',
      hasDescription: !!product.description,
      categoryDisplayName: product.category?.name || 'Sin categoría'
    }));
  } catch (error) {
    console.error('Error fetching paginated enriched products:', error);
    throw error;
  }
};
```

### Buscar productos por categoría
```typescript
const getProductsByCategory = async (categoryIds: number[]) => {
  try {
    const categoriesParam = categoryIds.join(',');
    const response = await fetch(`/api/products/by-category?categories=${categoriesParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};
```

### Buscar producto por código de barras
```typescript
const getProductByBarcode = async (barcode: string) => {
  try {
    const response = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Producto no encontrado
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const product = await response.json();
    return product;
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    throw error;
  }
};

// Ejemplo de uso en un escáner de código de barras
const handleBarcodeScanned = async (scannedBarcode: string) => {
  try {
    const product = await getProductByBarcode(scannedBarcode);
    if (product) {
      console.log('Producto encontrado:', product);
      // Agregar al carrito, mostrar detalles, etc.
    } else {
      console.log('Producto no encontrado con ese código de barras');
      // Mostrar mensaje al usuario
    }
  } catch (error) {
    console.error('Error al buscar producto:', error);
  }
};
```

---

## Notas Importantes

1. **Autenticación**: Todos los endpoints requieren un token JWT válido.
2. **Productos Enriquecidos**: La mayoría de endpoints devuelven `ProductEnriched` con información completa (stock, precios, descripción).
3. **Tipos de Producto**: Solo se permiten "PHYSICAL" y "SERVICE".
4. **Stock Decimal**: El sistema soporta cantidades decimales para stock (campo `stock_quantity` es `float64`).
5. **Precios por Unidad**: Los productos pueden tener múltiples precios según la unidad de medida en el array `unit_prices`.
6. **Campos Calculados**: Los productos enriquecidos incluyen campos como `stock_status`, `price_formatted`, `has_valid_stock`.
7. **Código de Barras**: El campo `barcode` es opcional, único (si se proporciona), y tiene un máximo de 50 caracteres. Se puede buscar productos específicamente por código de barras usando `/products/barcode/{barcode}`.
8. **Eliminación Lógica**: Los productos eliminados no se borran físicamente de la base de datos.
9. **Paginación vs Sin Paginación**: 
   - Use `/products/{page}/{pageSize}` para listas grandes con paginación
   - Use `/products/enriched/all` para obtener todos los productos de una vez (selectores, etc.)
10. **Optimización**: Los endpoints enriquecidos hacen múltiples consultas internamente, son ideales para UI pero considera el rendimiento.

### Estructura ProductEnriched vs Otros Tipos
- **ProductEnriched**: Información completa, ideal para mostrar en UI
- **ProductWithPricing**: Solo información de precios por categoría  
- **ProductDetails**: Información básica con precios y stock
- **ProductWithDescription**: Solo producto con su descripción

Esta documentación cubre todos los endpoints relacionados con productos incluyendo los productos enriquecidos. Para dudas adicionales, consulte el código fuente en `/handlers/product.go` y `/models/product.go`.