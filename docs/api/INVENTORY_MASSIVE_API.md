# 📋 Guía de Integración API - Sistema de Inventarios Masivos

## 🎯 Descripción General

Esta documentación especifica la API para el manejo de inventarios masivos (conteos físicos de múltiples productos) en el sistema de business management. El sistema utiliza la nueva función integrada `manage_inventory` que garantiza consistencia automática con las transacciones de stock.

**🚀 NUEVA IMPLEMENTACIÓN**: `manage_inventory` convertido a FUNCIÓN para consistencia arquitectónica total.

---

## 📊 Modelos de Datos

### Inventory
```typescript
interface Inventory {
  id: number;                    // ID único del inventario (int)
  user_id: string;               // ID del usuario que realizó el inventario
  check_date: string;            // Fecha del conteo (ISO 8601)
  state: boolean;                // Estado del inventario (true=activo, false=invalidado)
}
```

### InventoryItem
```typescript
interface InventoryItem {
  id: number;                    // ID único del item (int)
  inventory_id: number;          // ID del inventario padre
  product_id: string;            // ID del producto
  quantity_checked: number;      // Cantidad contada
  previous_quantity: number;     // Cantidad anterior registrada
}
```

### DetailedInventory
```typescript
interface DetailedInventory {
  inventory: Inventory;          // Información del inventario
  items: InventoryItem[];        // Lista de items del inventario
}
```

### Request Bodies
```typescript
interface InventoryCreateRequest {
  action: "insert";              // Acción fija para crear
  check_date?: string;           // Fecha del conteo (opcional, default: now)
  details: InventoryItemInput[]; // Items del inventario (requerido)
}

interface InventoryInvalidateRequest {
  action: "invalidate";          // Acción fija para invalidar
  id_inventory: number;          // ID del inventario a invalidar (requerido)
}

interface InventoryItemInput {
  product_id: string;            // ID del producto (requerido)
  quantity_checked: number;      // Cantidad contada (requerido, ≥ 0)
  cost?: number;                 // Costo opcional
  price?: number;                // Precio opcional
}
```

---

## 🔗 Endpoints de la API

**Todos los endpoints requieren autenticación JWT** 🔒

### 1. Crear Inventario Masivo 🔒
```http
POST /inventory
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Descripción:** Crea un nuevo inventario masivo con múltiples productos. El sistema automáticamente:
- Crea el registro de inventario
- Registra cada item con cantidad anterior y nueva
- Genera transacciones de stock para cada cambio
- Actualiza el stock actual de todos los productos

**Body:** `InventoryCreateRequest`
```json
{
  "action": "insert",
  "check_date": "2025-09-06T14:30:00Z",
  "details": [
    {
      "product_id": "PROD_ABC_001",
      "quantity_checked": 150.50
    },
    {
      "product_id": "PROD_DEF_002", 
      "quantity_checked": 75.25
    },
    {
      "product_id": "PROD_GHI_003",
      "quantity_checked": 200.00
    },
    {
      "product_id": "PROD_JKL_004",
      "quantity_checked": 0.00
    }
  ]
}
```

**Response Success:** `201 Created`
```json
{
  "success": true,
  "inventory_id": 22,
  "message": "Inventory created successfully with 4 items",
  "items_processed": 4,
  "transactions_created": 3,
  "timestamp": "2025-09-06T14:30:15Z"
}
```

**Response Errors:**
- `400 Bad Request`: Datos inválidos
```json
{
  "error": "Invalid request body",
  "details": "Field 'details' is required and cannot be empty"
}
```
- `401 Unauthorized`: Token inválido
- `500 Internal Server Error`: Error del sistema

### 2. Invalidar Inventario 🔒
```http
POST /inventory/invalidate
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Descripción:** Invalida un inventario existente. El sistema automáticamente:
- Marca el inventario como inválido (state = false)
- Crea transacciones de corrección para revertir cambios
- Restaura las cantidades originales de stock
- Mantiene auditoría completa del proceso

**Body:** `InventoryInvalidateRequest`
```json
{
  "action": "invalidate",
  "id_inventory": 22
}
```

**Response Success:** `200 OK`
```json
{
  "success": true,
  "inventory_id": 22,
  "message": "Inventory invalidated successfully",
  "corrections_applied": 3,
  "timestamp": "2025-09-06T15:00:00Z"
}
```

### 3. Obtener Lista de Inventarios 🔒
```http
GET /inventory?page={page}&page_size={size}
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `page_size` (opcional): Elementos por página (default: 10, max: 100)

**Response:** `Inventory[]`
```json
{
  "inventories": [
    {
      "id": 22,
      "user_id": "USR_789",
      "check_date": "2025-09-06T14:30:00Z",
      "state": true
    },
    {
      "id": 21,
      "user_id": "USR_789", 
      "check_date": "2025-09-05T10:30:00Z",
      "state": false
    }
  ],
  "pagination": {
    "current_page": 1,
    "page_size": 10,
    "total_items": 25,
    "total_pages": 3
  }
}
```

### 4. Obtener Inventario Detallado por ID 🔒
```http
GET /inventory/{id}
Authorization: Bearer <jwt_token>
```

**Parámetros:**
- `id` (path): ID del inventario

**Response:** `DetailedInventory`
```json
{
  "inventory": {
    "id": 22,
    "user_id": "USR_789",
    "check_date": "2025-09-06T14:30:00Z",
    "state": true
  },
  "items": [
    {
      "id": 67,
      "inventory_id": 22,
      "product_id": "PROD_ABC_001",
      "quantity_checked": 150,
      "previous_quantity": 120
    },
    {
      "id": 68,
      "inventory_id": 22,
      "product_id": "PROD_DEF_002",
      "quantity_checked": 75,
      "previous_quantity": 80
    },
    {
      "id": 69,
      "inventory_id": 22,
      "product_id": "PROD_GHI_003",
      "quantity_checked": 200,
      "previous_quantity": 200
    },
    {
      "id": 70,
      "inventory_id": 22,
      "product_id": "PROD_JKL_004",
      "quantity_checked": 0,
      "previous_quantity": 5
    }
  ],
  "summary": {
    "total_items": 4,
    "items_with_changes": 3,
    "total_variance": 25,
    "created_transactions": 3
  }
}
```

**Errores:**
- `404 Not Found`: Inventario no existe
```json
{
  "error": "Inventory not found",
  "inventory_id": 999
}
```

---

## 📋 Códigos de Respuesta

| Código | Descripción | Cuándo se produce |
|--------|-------------|-------------------|
| `200` | OK | Operación exitosa |
| `201` | Created | Inventario creado exitosamente |
| `400` | Bad Request | Datos inválidos, JSON malformado |
| `401` | Unauthorized | Token JWT inválido o faltante |
| `404` | Not Found | Inventario no encontrado |
| `422` | Unprocessable Entity | Datos válidos pero reglas de negocio violadas |
| `500` | Internal Server Error | Error del servidor |

---

## ⚡ Validaciones y Restricciones

### Campos Obligatorios

**InventoryCreateRequest:**
- `action`: debe ser "insert"
- `details`: array no vacío
- `details[].product_id`: string no vacío, producto debe existir
- `details[].quantity_checked`: number ≥ 0

**InventoryInvalidateRequest:**
- `action`: debe ser "invalidate"
- `id_inventory`: number > 0, inventario debe existir y estar activo

### Reglas de Negocio
1. **Productos únicos**: No se pueden repetir products_id en el mismo inventario
2. **Cantidad válida**: quantity_checked debe ser ≥ 0
3. **Inventario activo**: Solo se pueden invalidar inventarios con state = true
4. **Usuario válido**: El user_id del token debe existir en la base de datos
5. **Transacciones automáticas**: Cada cambio de cantidad genera una transacción de stock
6. **Auditoría completa**: Todos los cambios son trazables

### Límites del Sistema
- **Máximo 1000 productos** por inventario
- **Máximo 100 inventarios** por página
- **Fecha máxima**: No puede ser futura
- **Cantidad máxima**: 999,999.99 por producto

---

## 🔐 Autenticación

**Todos los endpoints requieren autenticación JWT** mediante header:
```
Authorization: Bearer <jwt_token>
```

- El token debe contener claims válidos
- El `user_id` del token se asigna automáticamente al inventario
- Token inválido o faltante retorna `401 Unauthorized`

---

## 🚀 Integración con Stock Transactions

### Funcionamiento Automático

1. **Crear Inventario**: 
   - Se ejecuta `manage_inventory('insert', ...)`
   - Retorna `inventory_id`
   - Crea automáticamente transacciones tipo "INVENTORY"

2. **Invalidar Inventario**:
   - Se ejecuta `manage_inventory('invalidate', ...)`
   - Retorna `inventory_id`
   - Crea automáticamente transacciones tipo "INVENTORY_CORRECTION"

### Transacciones Generadas

**Para cada producto con cambio de cantidad:**
```json
{
  "transaction_type": "INVENTORY",
  "quantity_change": 30.50,
  "quantity_before": 120.00,
  "quantity_after": 150.50,
  "reference_type": "INVENTORY_COUNT",
  "reference_id": "22",
  "reason": "Physical inventory count",
  "metadata": {
    "type": "inventory",
    "inventory_id": 22,
    "source": "manage_inventory_function",
    "previous_quantity": 120.00,
    "new_quantity": 150.50
  }
}
```

---

## 🎯 Ejemplos de Uso

### Flujo Completo: Inventario Semanal

#### 1. Preparación
```typescript
// Frontend: Preparar datos del conteo físico
const inventoryData = {
  action: "insert" as const,
  check_date: new Date().toISOString(),
  details: [
    { product_id: "PROD_001", quantity_checked: 150.50 },
    { product_id: "PROD_002", quantity_checked: 75.25 },
    { product_id: "PROD_003", quantity_checked: 0.00 }, // Sin stock
  ]
};
```

#### 2. Creación
```typescript
// Frontend: Crear inventario
const response = await fetch('/inventory', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(inventoryData)
});

const result = await response.json();
console.log(`Inventario creado: ID ${result.inventory_id}`);
```

#### 3. Verificación
```typescript
// Frontend: Obtener detalles del inventario creado
const inventoryDetails = await fetch(`/inventory/${result.inventory_id}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const details = await inventoryDetails.json();
console.log(`Items procesados: ${details.summary.total_items}`);
console.log(`Transacciones creadas: ${details.summary.created_transactions}`);
```

#### 4. Corrección (si es necesario)
```typescript
// Frontend: Invalidar inventario si hay errores
const invalidateResponse = await fetch('/inventory/invalidate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: "invalidate",
    id_inventory: result.inventory_id
  })
});
```

### Patrón de Validación Previa
```typescript
// Frontend: Validar datos antes de enviar
function validateInventoryData(data: InventoryCreateRequest): string[] {
  const errors: string[] = [];
  
  if (!data.details || data.details.length === 0) {
    errors.push("Al menos un producto es requerido");
  }
  
  if (data.details.length > 1000) {
    errors.push("Máximo 1000 productos por inventario");
  }
  
  const productIds = new Set();
  data.details.forEach((item, index) => {
    if (!item.product_id) {
      errors.push(`Product ID requerido en item ${index + 1}`);
    }
    
    if (productIds.has(item.product_id)) {
      errors.push(`Product ID duplicado: ${item.product_id}`);
    }
    productIds.add(item.product_id);
    
    if (item.quantity_checked < 0) {
      errors.push(`Cantidad inválida en ${item.product_id}`);
    }
  });
  
  return errors;
}
```

---

## 📝 Notas Técnicas

1. **Función integrada**: `manage_inventory` maneja toda la lógica de creación/invalidación
2. **Consistencia automática**: Todas las transacciones se crean automáticamente
3. **Rendimiento optimizado**: Procesamiento en lote en la base de datos
4. **Auditoría completa**: Todas las operaciones son trazables
5. **Rollback automático**: Los errores revierten todos los cambios
6. **Metadata enriquecida**: Información adicional en las transacciones
7. **Estado persistent**: Los inventarios mantienen su estado histórico

---

## 🔍 Troubleshooting

### Errores Comunes

**Error 400: "Product does not exist"**
- Verificar que todos los product_id existan en la base de datos
- Usar endpoint `/products` para validar IDs

**Error 422: "Quantity would result in negative stock"**
- La cantidad ajustada resultaría en stock negativo
- Revisar las cantidades antes del inventario

**Error 500: "Database constraint violation"**
- Error interno del sistema
- Contactar al administrador del sistema

### Debugging
```typescript
// Agregar logging para debugging
console.log('Enviando inventario:', JSON.stringify(inventoryData, null, 2));

fetch('/inventory', options)
  .then(response => {
    console.log('Status:', response.status);
    return response.json();
  })
  .then(result => {
    console.log('Resultado:', result);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

---

**Última actualización**: 6 de Septiembre de 2025  
**Versión**: 1.0 (Nueva API)  
**Estado**: ✅ Sistema completamente integrado  
**Función backend**: `manage_inventory` (FUNCIÓN optimizada)
