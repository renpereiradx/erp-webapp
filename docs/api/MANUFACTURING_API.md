# Manufacturing API Documentation

Documentación completa de los endpoints de la API para el Sistema de Manufactura y Control de Insumos.

## Índice

1. [Insumos (Supplies)](#insumos-supplies)
2. [Compras de Insumos](#compras-de-insumos)
3. [Producción Manual](#producción-manual)
4. [Recetas de Productos](#recetas-de-productos)
5. [Reportes](#reportes)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Autenticación

**Todos los endpoints requieren autenticación JWT**

Incluir en headers:
```
Authorization: Bearer <jwt_token>
```

---

## Insumos (Supplies)

### 1. Crear Insumo

**POST** `/manufacturing/supplies`

Crea un nuevo insumo para manufactura.

#### Request Body
```json
{
  "name": "Harina de trigo",
  "description": "Harina 0000 para empanadas",
  "unit": "kg",
  "supplier_name": "Molinera del Sur"
}
```

#### Campos
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | Sí | Nombre del insumo (único) |
| description | string | No | Descripción del insumo |
| unit | string | Sí | Unidad de medida (kg, l, unit, etc.) |
| supplier_name | string | No | Nombre del proveedor predeterminado |

#### Unidades válidas
`kg`, `g`, `l`, `ml`, `unit`, `lb`, `oz`, `ton`, `gal`, `bottle`, `can`, `jar`, `bag`, `pack`

#### Response 200 OK
```json
{
  "id": 1,
  "name": "Harina de trigo",
  "description": "Harina 0000 para empanadas",
  "unit": "kg",
  "supplier_name": "Molinera del Sur",
  "state": true,
  "created_at": "2025-10-07T14:30:00Z",
  "updated_at": "2025-10-07T14:30:00Z"
}
```

---

### 2. Listar Insumos

**GET** `/manufacturing/supplies?active=true`

Obtiene la lista de insumos.

#### Query Parameters
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| active | boolean | Si es `true`, solo devuelve insumos activos |

#### Response 200 OK
```json
[
  {
    "id": 1,
    "name": "Harina de trigo",
    "description": "Harina 0000 para empanadas",
    "unit": "kg",
    "supplier_name": "Molinera del Sur",
    "state": true,
    "created_at": "2025-10-07T14:30:00Z",
    "updated_at": "2025-10-07T14:30:00Z"
  }
]
```

---

### 3. Obtener Insumo por ID

**GET** `/manufacturing/supplies/{id}`

Obtiene un insumo específico por ID.

#### Response 200 OK
```json
{
  "id": 1,
  "name": "Harina de trigo",
  "unit": "kg",
  "state": true
}
```

---

### 4. Actualizar Insumo

**PUT** `/manufacturing/supplies/{id}`

Actualiza un insumo existente.

#### Request Body
```json
{
  "name": "Harina de trigo 0000",
  "description": "Harina especial para empanadas",
  "unit": "kg",
  "supplier_name": "Molinera del Sur SA",
  "state": true
}
```

#### Response 200 OK
```json
{
  "message": "Supply updated successfully"
}
```

---

### 5. Eliminar Insumo (Soft Delete)

**DELETE** `/manufacturing/supplies/{id}`

Desactiva un insumo (soft delete).

#### Response 200 OK
```json
{
  "message": "Supply deleted successfully"
}
```

---

## Compras de Insumos

### 6. Registrar Compra de Insumo

**POST** `/manufacturing/purchases`

Registra una compra de insumo. **NO afecta el inventario**, solo registra la compra para auditoría y control de costos.

#### Request Body
```json
{
  "supply_id": 1,
  "quantity": 50.00,
  "unit_cost": 250.00,
  "supplier_name": "Molinera del Sur",
  "invoice_number": "FAC-2025-001",
  "notes": "Compra mensual de harina"
}
```

#### Campos
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| supply_id | integer | Sí | ID del insumo |
| quantity | float | Sí | Cantidad comprada (>0) |
| unit_cost | float | Sí | Costo por unidad (≥0) |
| supplier_name | string | No | Nombre del proveedor |
| invoice_number | string | No | Número de factura |
| notes | string | No | Notas adicionales |

#### Response 200 OK
```json
{
  "success": true,
  "purchase_id": 1,
  "supply_id": 1,
  "supply_name": "Harina de trigo",
  "quantity": 50.00,
  "unit": "kg",
  "unit_cost": 250.00,
  "total_cost": 12500.00,
  "supplier": "Molinera del Sur",
  "invoice": "FAC-2025-001",
  "message": "Compra de insumo registrada: 50.00 kg de Harina de trigo por $12500.00"
}
```

#### Response 400 Bad Request (Error)
```json
{
  "success": false,
  "error": "SUPPLY_NOT_FOUND: Insumo 999 no encontrado o inactivo",
  "error_code": "P0001"
}
```

---

### 7. Listar Compras de Insumos

**GET** `/manufacturing/purchases?supply_id=1&limit=50&offset=0`

Obtiene el historial de compras de insumos.

#### Query Parameters
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| supply_id | integer | (Opcional) Filtrar por insumo específico |
| limit | integer | Número máximo de resultados (default: 50) |
| offset | integer | Offset para paginación (default: 0) |

#### Response 200 OK
```json
[
  {
    "id": 1,
    "supply_id": 1,
    "supply_name": "Harina de trigo",
    "quantity": 50.00,
    "unit_cost": 250.00,
    "total_cost": 12500.00,
    "supplier_name": "Molinera del Sur",
    "invoice_number": "FAC-2025-001",
    "purchase_date": "2025-10-07T14:00:00Z",
    "user_id": "user123",
    "notes": "Compra mensual de harina"
  }
]
```

---

## Producción Manual

### 8. Registrar Producción Manual

**POST** `/manufacturing/production`

Registra una producción manual de un producto. **SÍ incrementa el stock automáticamente**.

#### Request Body
```json
{
  "product_id": "prod_empanada_carne",
  "quantity_produced": 100.00,
  "batch_code": "EMP-20251007-001",
  "production_cost": 15000.00,
  "notes": "Producción matutina - Lote 1"
}
```

#### Campos
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto (debe ser tipo PRODUCTION o PHYSICAL) |
| quantity_produced | float | Sí | Cantidad producida (>0) |
| batch_code | string | No | Código de lote (se genera automático si no se proporciona) |
| production_cost | float | No | Costo total de producción |
| notes | string | No | Notas sobre la producción |

#### Response 200 OK
```json
{
  "success": true,
  "batch_id": 1,
  "batch_code": "EMP-20251007-001",
  "product_id": "prod_empanada_carne",
  "product_name": "Empanada de carne",
  "product_type": "PRODUCTION",
  "quantity_produced": 100.00,
  "production_cost": 15000.00,
  "cost_per_unit": 150.00,
  "new_stock": 100.00,
  "stock_transaction_id": 210,
  "message": "Producción registrada: 100.00 unidades de Empanada de carne. Stock actual: 100.00"
}
```

#### Response 400 Bad Request (Errores posibles)
```json
{
  "success": false,
  "error": "PRODUCT_NOT_FOUND: Producto prod_xyz no encontrado o inactivo",
  "error_code": "P0001"
}
```

```json
{
  "success": false,
  "error": "INVALID_PRODUCT_TYPE: Producto Servicio de limpieza (prod_service_001) no es tipo PRODUCTION o PHYSICAL. Tipo actual: SERVICE",
  "error_code": "P0001"
}
```

---

### 9. Listar Lotes de Producción

**GET** `/manufacturing/production/batches?product_id=prod_empanada_carne&limit=50&offset=0`

Obtiene el historial de lotes de producción.

#### Query Parameters
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| product_id | string | (Opcional) Filtrar por producto específico |
| limit | integer | Número máximo de resultados (default: 50) |
| offset | integer | Offset para paginación (default: 0) |

#### Response 200 OK
```json
[
  {
    "id": 1,
    "product_id": "prod_empanada_carne",
    "product_name": "Empanada de carne",
    "quantity_produced": 100.00,
    "production_date": "2025-10-07T09:00:00Z",
    "batch_code": "EMP-20251007-001",
    "user_id": "user123",
    "stock_transaction_id": 210,
    "production_cost": 15000.00,
    "cost_per_unit": 150.00,
    "notes": "Producción matutina - Lote 1"
  }
]
```

---

## Recetas de Productos

### 10. Obtener Receta de un Producto

**GET** `/manufacturing/recipes/{product_id}`

Obtiene la receta (lista de insumos) de un producto manufacturado.

#### Response 200 OK
```json
[
  {
    "id": 1,
    "product_id": "prod_empanada_carne",
    "supply_id": 1,
    "supply_name": "Harina de trigo",
    "quantity_per_unit": 0.05,
    "unit": "kg",
    "notes": "50g de harina por empanada",
    "created_at": "2025-10-07T10:00:00Z"
  },
  {
    "id": 2,
    "product_id": "prod_empanada_carne",
    "supply_id": 2,
    "supply_name": "Carne molida",
    "quantity_per_unit": 0.08,
    "unit": "kg",
    "notes": "80g de carne por empanada",
    "created_at": "2025-10-07T10:00:00Z"
  }
]
```

---

### 11. Agregar Ingrediente a Receta

**POST** `/manufacturing/recipes/{product_id}/ingredients`

Agrega un ingrediente a la receta de un producto.

#### Request Body
```json
{
  "supply_id": 1,
  "quantity_per_unit": 0.05,
  "notes": "50g de harina por empanada"
}
```

#### Campos
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| supply_id | integer | Sí | ID del insumo |
| quantity_per_unit | float | Sí | Cantidad de insumo por unidad de producto |
| notes | string | No | Notas sobre el ingrediente |

#### Response 200 OK
```json
{
  "message": "Ingredient added to recipe successfully"
}
```

---

### 12. Eliminar Ingrediente de Receta

**DELETE** `/manufacturing/recipes/{product_id}/ingredients/{supply_id}`

Elimina un ingrediente de la receta de un producto.

#### Response 200 OK
```json
{
  "message": "Ingredient removed from recipe successfully"
}
```

---

## Reportes

### 13. Resumen de Compras de Insumos

**GET** `/manufacturing/reports/supply-purchases`

Obtiene un resumen de todas las compras de insumos.

#### Response 200 OK
```json
[
  {
    "supply_id": 2,
    "supply_name": "Carne molida",
    "unit": "kg",
    "default_supplier": "Frigorífico La Pampa",
    "is_active": true,
    "total_purchases": 3,
    "total_quantity_purchased": 90.00,
    "total_spent": 108000.00,
    "avg_unit_cost": 1200.00,
    "first_purchase_date": "2025-09-01T10:00:00Z",
    "last_purchase_date": "2025-10-07T14:00:00Z",
    "purchased_recently": true
  },
  {
    "supply_id": 1,
    "supply_name": "Harina de trigo",
    "unit": "kg",
    "total_purchases": 2,
    "total_quantity_purchased": 150.00,
    "total_spent": 37500.00,
    "avg_unit_cost": 250.00,
    "purchased_recently": true
  }
]
```

---

### 14. Resumen de Producción

**GET** `/manufacturing/reports/production?product_id=prod_empanada_carne`

Obtiene un resumen de producción por producto.

#### Query Parameters
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| product_id | string | (Opcional) Filtrar por producto específico |

#### Response 200 OK
```json
[
  {
    "product_id": "prod_empanada_carne",
    "product_name": "Empanada de carne",
    "product_type": "PRODUCTION",
    "total_batches": 2,
    "total_produced": 250.00,
    "total_production_cost": 37500.00,
    "avg_cost_per_unit": 150.00,
    "first_production_date": "2025-10-07T09:00:00Z",
    "last_production_date": "2025-10-07T15:00:00Z",
    "current_stock": 200.00,
    "produced_recently": true
  }
]
```

---

### 15. Análisis de Rentabilidad

**GET** `/manufacturing/reports/profitability?product_id=prod_empanada_carne`

Obtiene un análisis de rentabilidad de productos manufacturados.

#### Query Parameters
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| product_id | string | (Opcional) Filtrar por producto específico |

#### Response 200 OK
```json
[
  {
    "product_id": "prod_empanada_carne",
    "product_name": "Empanada de carne",
    "total_produced": 250.00,
    "total_production_cost": 37500.00,
    "avg_production_cost_per_unit": 150.00,
    "sale_price_per_unit": 500.00,
    "sale_unit": "unit",
    "profit_margin_per_unit": 350.00,
    "profit_margin_percentage": 233.33,
    "current_stock": 200.00,
    "inventory_value": 100000.00
  }
]
```

---

## Ejemplos de Uso

### Flujo Completo: Producción de Empanadas

#### 1. Crear insumos
```javascript
// POST /manufacturing/supplies
fetch('/manufacturing/supplies', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Harina de trigo',
    unit: 'kg',
    supplier_name: 'Molinera del Sur'
  })
})
```

#### 2. Registrar compra de insumos
```javascript
// POST /manufacturing/purchases
fetch('/manufacturing/purchases', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    supply_id: 1,
    quantity: 50.00,
    unit_cost: 250.00,
    supplier_name: 'Molinera del Sur',
    invoice_number: 'FAC-001'
  })
})
```

#### 3. Crear producto manufacturado
```javascript
// POST /products (endpoint existente)
fetch('/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Empanada de carne',
    product_type: 'PRODUCTION', // ← Nuevo tipo
    id_category: 1,
    description: 'Empanada artesanal de carne'
  })
})
```

#### 4. Definir receta (opcional)
```javascript
// POST /manufacturing/recipes/prod_empanada_carne/ingredients
fetch('/manufacturing/recipes/prod_empanada_carne/ingredients', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    supply_id: 1, // Harina
    quantity_per_unit: 0.05, // 50g por empanada
    notes: '50g de harina por empanada'
  })
})
```

#### 5. Registrar producción
```javascript
// POST /manufacturing/production
fetch('/manufacturing/production', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product_id: 'prod_empanada_carne',
    quantity_produced: 100.00,
    batch_code: 'EMP-20251007-001',
    production_cost: 15000.00,
    notes: 'Producción matutina'
  })
})
// ✅ Stock se incrementa automáticamente en 100 unidades
```

#### 6. Vender empanadas
```javascript
// POST /sale (endpoint existente)
// El sistema valida stock y reduce automáticamente
fetch('/sale', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    client_id: 'client_001',
    products: [
      {
        product_id: 'prod_empanada_carne',
        quantity: 50
      }
    ]
  })
})
// ✅ Stock se reduce automáticamente en 50 unidades
```

#### 7. Ver reportes
```javascript
// GET /manufacturing/reports/profitability?product_id=prod_empanada_carne
fetch('/manufacturing/reports/profitability?product_id=prod_empanada_carne', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => {
  console.log(`Costo: $${data[0].avg_production_cost_per_unit}`)
  console.log(`Precio venta: $${data[0].sale_price_per_unit}`)
  console.log(`Margen: ${data[0].profit_margin_percentage}%`)
})
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `SUPPLY_NOT_FOUND` | Insumo no encontrado o inactivo |
| `USER_NOT_FOUND` | Usuario no encontrado |
| `PRODUCT_NOT_FOUND` | Producto no encontrado o inactivo |
| `INVALID_PRODUCT_TYPE` | Producto no es tipo PRODUCTION o PHYSICAL |
| `P0001` | Error de validación en PostgreSQL |
| `23514` | Violación de constraint CHECK |

---

## Notas Importantes

1. **Compras de Insumos**: NO afectan el inventario, solo se registran para auditoría y cálculo de costos.

2. **Producción Manual**: SÍ incrementa el stock automáticamente del producto final.

3. **Ventas**: Funcionan igual que siempre, validando y reduciendo stock automáticamente.

4. **Tipos de Producto**:
   - `PHYSICAL`: Productos físicos comprados
   - `SERVICE`: Servicios (canchas, clases, etc.)
   - `PRODUCTION`: Productos manufacturados internamente (**NUEVO**)

5. **Recetas**: Son opcionales e informativas. El sistema NO valida disponibilidad de insumos al producir.

6. **Batch Codes**: Si no se proporciona, se genera automáticamente con formato `PROD-YYYYMMDD-HHMMSS`.

---

## Base URL

```
http://localhost:5050
```

O la URL de tu servidor en producción.
