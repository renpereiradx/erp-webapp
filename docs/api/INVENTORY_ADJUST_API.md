# 📦 API de Ajustes de Inventario

**Versión:** 4.0  
**Fecha:** 20 de Noviembre de 2025  
**Endpoint Base:** `http://localhost:5050`

---

## 📋 Descripción General

Esta API gestiona el sistema de inventarios y ajustes manuales. Permite realizar ajustes de stock, registrar movimientos, validar la consistencia del inventario y generar reportes de discrepancias. La versión 4.0 introduce un sistema de metadatos obligatorios para todas las operaciones, garantizando una trazabilidad y auditoría completas.

### Características Principales

- ✅ Ajustes de stock manuales con transacciones atómicas.
- ✅ Creación y gestión de inventarios físicos completos.
- ✅ Historial detallado de todos los movimientos y ajustes por producto.
- ✅ Endpoints para validar la consistencia del stock y la integridad del sistema.
- ✅ Requerimiento obligatorio de metadatos para auditoría y trazabilidad.

---

## 🔧 Configuración General

### Base URL
```
http://localhost:5050
```

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## 📊 Modelos de Datos

A continuación se detallan las estructuras de datos principales utilizadas en la API.

### ManualAdjustment
```typescript
interface ManualAdjustment {
  id: number;                    // ID único del ajuste
  product_id: string;            // ID del producto ajustado
  old_quantity: number;          // Cantidad antes del ajuste
  new_quantity: number;          // Cantidad nueva final
  adjustment_date: string;       // Fecha del ajuste (ISO 8601)
  reason: string;                // Motivo del ajuste
  metadata: object | null;       // Metadatos de trazabilidad
  user_id: string;               // ID del usuario que realizó el ajuste
}
```

### Inventory & Items
```typescript
interface Inventory {
  id: number;
  user_id: string;
  check_date: string; // ISO 8601
  state: boolean; // `true` para activo, `false` para invalidado
  metadata: object; // Metadatos obligatorios de la operación
}

interface InventoryItem {
  id: number;
  inventory_id: number;
  product_id: string;
  quantity_checked: number;
  previous_quantity: number;
}

interface DetailedInventory {
  inventory: Inventory;
  items: InventoryItem[];
}
```

### StockTransaction
```typescript
interface StockTransaction {
  id: number;
  product_id: string;
  transaction_type: string; // "PURCHASE", "SALE", "ADJUSTMENT", etc.
  quantity_change: number; // Cambio (+/-)
  quantity_before: number;
  quantity_after: number;
  unit_price?: number;
  total_value?: number;
  reference_type?: string; // "ADJUSTMENT", "SALE", etc.
  reference_id?: string;
  user_id: string;
  transaction_date: string; // ISO 8601
  reason?: string;
  metadata?: object;
}
```

### ProductAdjustmentHistory
```typescript
interface ProductAdjustmentHistory {
  adjustment_id: number;
  adjustment_type: string;
  old_value: number;
  new_value: number;
  value_change: number;
  user_id: string;
  adjustment_date: string; // ISO 8601
  reason: string;
  metadata: object;
  related_transaction_id: number | null;
}
```

---

## 🔗 Endpoints de la API

### Ajustes Manuales

#### 1. Crear Ajuste Manual de Stock

**Endpoint:** `POST /manual_adjustment/`

Crea un nuevo ajuste manual de stock. El sistema genera una transacción de stock de tipo "ADJUSTMENT" de forma automática y atómica.

**Request Body:**
```json
{
  "product_id": "PROD_ABC_001",
  "new_quantity": 150.50,
  "reason": "Ajuste por conteo físico",
  "metadata": {
    "source": "manual_adjustment",
    "timestamp": "2025-11-20T15:00:00Z",
    "operator": "marcelo_p",
    "reason_category": "PHYSICAL_COUNT",
    "approval_level": "supervisor",
    "location": "Almacen Principal"
  }
}
```

**Parámetros:**

| Campo          | Tipo   | Requerido | Descripción                               |
|----------------|--------|-----------|-------------------------------------------|
| `product_id`   | string | ✅ Sí       | ID del producto a ajustar. Debe existir. |
| `new_quantity` | number | ✅ Sí       | La nueva cantidad final del producto (≥ 0). |
| `reason`       | string | ✅ Sí       | Motivo claro y descriptivo del ajuste.    |
| `metadata`     | object | ✅ Sí       | Objeto con datos de trazabilidad. Ver sección de Metadatos. |

**Response (200 OK):** `ManualAdjustment`
```json
{
  "id": 45,
  "product_id": "PROD_ABC_001",
  "old_quantity": 100.00,
  "new_quantity": 150.50,
  "adjustment_date": "2025-11-20T15:00:00Z",
  "reason": "Ajuste por conteo físico",
  "metadata": {
    "source": "manual_adjustment",
    "operator": "marcelo_p"
  },
  "user_id": "USR_789"
}
```

**Errores Posibles:**

| Error                          | HTTP Status | Descripción                                                |
|--------------------------------|-------------|------------------------------------------------------------|
| `"Invalid request body"`         | 400         | El JSON es inválido o faltan campos requeridos.            |
| `"Unauthorized"`                 | 401         | El token JWT es inválido, ha expirado o no fue provisto.   |
| `"Product not found"`            | 404         | El `product_id` enviado no existe.                         |
| `"Error creating adjustment: ..."` | 500         | Error interno del servidor al procesar el ajuste.          |

#### 2. Obtener Historial de Ajustes de Producto

**Endpoint:** `GET /manual_adjustment/product/{productId}/history`

Obtiene todos los ajustes de precio y stock para un producto específico.

**Parámetros de URL:**

| Campo         | Tipo   | Descripción                               |
|---------------|--------|-------------------------------------------|
| `productId`   | string | ID del producto a consultar.              |

**Query Parameters:**

| Campo      | Tipo   | Requerido | Descripción                                  |
|------------|--------|-----------|----------------------------------------------|
| `limit`    | number | ❌ No       | Número máximo de registros (default: 50).    |
| `offset`   | number | ❌ No       | Número de registros a saltar (default: 0).   |

**Response (200 OK):**
```json
{
    "count": 2,
    "history": [
        {
            "adjustment_id": 2,
            "adjustment_type": "stock",
            "old_value": 0,
            "new_value": 10,
            "value_change": 10,
            "user_id": "jJkV4F6HR",
            "adjustment_date": "2025-11-20T11:25:49.176714Z",
            "reason": "Configuración de stock inicial",
            "metadata": {
                "notes": "Stock inicial",
                "source": "manual_adjustment",
                "location": "Cantina",
                "operator": "Marcelo"
            },
            "related_transaction_id": 21
        },
        {
            "adjustment_id": 4,
            "adjustment_type": "price",
            "old_value": 0,
            "new_value": 10000,
            "value_change": 10000,
            "user_id": "jJkV4F6HR",
            "adjustment_date": "2025-11-13T13:32:21.305547Z",
            "reason": "Declaración de precio inicial para carga de inventario",
            "metadata": {
                "source": "manual_api",
                "new_price": 10000,
                "change_type": "increase"
            },
            "related_transaction_id": null
        }
    ],
    "limit": 50,
    "offset": 0,
    "product_id": "A-7oarkDR"
}
```

### Gestión de Inventarios

#### 3. Crear un Inventario Físico

**Endpoint:** `POST /inventory/`

Crea un nuevo inventario físico. El sistema compara las cantidades contadas (`quantity_checked`) con el stock actual y genera transacciones de ajuste para cada producto con discrepancias.

**Request Body:**
```json
{
  "items": [
    {
      "product_id": "PROD_ABC_001",
      "quantity_checked": 150
    },
    {
      "product_id": "PROD_DEF_002",
      "quantity_checked": 75
    }
  ],
  "metadata": {
    "source": "physical_count",
    "operator": "warehouse_manager_01",
    "location": "main_warehouse",
    "counting_method": "barcode_scanner",
    "verification": "double_check",
    "timestamp": "2025-11-20T15:30:00Z",
    "notes": "Conteo mensual completo"
  }
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `items` | `InventoryItemInput[]` | ✅ Sí | Array de productos contados. |
| `items[].product_id` | string | ✅ Sí | ID del producto. |
| `items[].quantity_checked` | number | ✅ Sí | Cantidad física contada (≥ 0). |
| `metadata` | object | ✅ Sí | Objeto con datos de trazabilidad del inventario. |

**Response (200 OK):**
```json
{
  "message": "Inventory added"
}
```

#### 4. Invalidar un Inventario

**Endpoint:** `PUT /inventory/{id}`

Invalida un inventario existente y revierte automáticamente todas las transacciones de stock que generó.

**Parámetros de URL:**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | number | ID del inventario a invalidar. |

**Response (200 OK):**
```json
{
  "message": "Inventory invalidated"
}
```

#### 5. Obtener Lista de Inventarios

**Endpoint:** `GET /inventory/{page}/{pageSize}`

Obtiene una lista paginada de todos los inventarios realizados.

**Parámetros de URL:**

| Campo | Tipo | Descripción |
|---|---|---|
| `page` | number | Número de página a obtener. |
| `pageSize` | number | Cantidad de inventarios por página. |

**Response (200 OK):** `Inventory[]`
```json
[
  {
    "id": 21,
    "user_id": "USR_789",
    "check_date": "2025-09-15T12:00:00Z",
    "state": true,
    "metadata": {
      "source": "physical_count",
      "operator": "warehouse_manager",
      "location": "main_warehouse"
    }
  },
  {
    "id": 20,
    "user_id": "USR_789", 
    "check_date": "2025-09-14T10:30:00Z",
    "state": false,
    "metadata": {
      "source": "physical_count",
      "operator": "warehouse_assistant",
      "invalidation_reason": "counting_error"
    }
  }
]
```

#### 6. Obtener Detalles de un Inventario

**Endpoint:** `GET /inventory/{id}`

Obtiene la información detallada de un inventario, incluyendo la cabecera y todos sus items.

**Parámetros de URL:**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | number | ID del inventario a consultar. |

**Response (200 OK):** `DetailedInventory`
```json
{
  "inventory": {
    "id": 21,
    "user_id": "USR_789",
    "check_date": "2025-09-15T12:00:00Z",
    "state": true,
    "metadata": { "source": "physical_count", "operator": "warehouse_manager" }
  },
  "items": [
    {
      "id": 45,
      "inventory_id": 21,
      "product_id": "PROD_ABC_001",
      "quantity_checked": 150,
      "previous_quantity": 120
    },
    {
      "id": 46,
      "inventory_id": 21,
      "product_id": "PROD_DEF_002",
      "quantity_checked": 75,
      "previous_quantity": 80
    }
  ]
}
```

### Reportes y Transacciones

#### 7. Obtener Historial de Transacciones de Stock

**Endpoint:** `GET /stock-transactions/product/{product_id}`

Obtiene el historial completo de movimientos de stock para un producto, enriquecido con nombres de producto y usuario.

**Parámetros de URL:**

| Campo | Tipo | Descripción |
|---|---|---|
| `product_id` | string | ID del producto a consultar. |

**Response (200 OK):** `StockTransaction[]` (enriquecido)
```json
[
  {
    "id": 123,
    "product_id": "PROD_ABC_001",
    "product_name": "Producto ABC",
    "transaction_type": "ADJUSTMENT",
    "quantity_change": 50.50,
    "quantity_before": 100.00,
    "quantity_after": 150.50,
    "reference_type": "ADJUSTMENT",
    "reference_id": "45",
    "user_id": "USR_789",
    "user_name": "Juan Pérez",
    "transaction_date": "2025-09-06T12:00:00Z",
    "reason": "Ajuste por conteo físico",
    "metadata": { "source": "manual_adjustment", "operator": "warehouse_manager" }
  }
]
```

---

## 🔍 Validaciones y Reglas de Negocio

### Pre-Procesamiento (Validar en Frontend)

1.  ✅ Para **Ajustes Manuales**, `new_quantity` debe ser un número mayor o igual a cero.
2.  ✅ Para **Inventarios**, cada `quantity_checked` debe ser un número mayor o igual a cero.
3.  ✅ El campo `reason` para ajustes debe tener entre 5 y 200 caracteres.
4.  ✅ El objeto `metadata` **es siempre obligatorio** y debe contener una estructura válida.

### Metadatos Obligatorios

Todas las operaciones que modifican el stock (`/manual_adjustment`, `/inventory`) requieren un objeto `metadata` con una estructura mínima para garantizar la trazabilidad.

**Estructura Mínima Requerida para TODO `metadata`:**
```typescript
interface MetadataMinima {
  source: string;      // Origen de la operación. E.g., "physical_count", "manual_adjustment"
  timestamp: string;   // Fecha y hora en formato ISO 8601. E.g., new Date().toISOString()
  operator: string;    // ID o nombre del usuario/operador que realiza la acción
}
```

**Campos Adicionales Obligatorios por Operación:**

-   **Para Inventarios (`POST /inventory`):**
    -   `location`: string (Ubicación física donde se hizo el conteo).
    -   `counting_method`: string (Método usado: `manual`, `barcode_scanner`, `rfid`).
    -   `verification`: string (Nivel de verificación: `single_check`, `double_check`).

-   **Para Ajustes Manuales (`POST /manual_adjustment`):**
    -   `reason_category`: string (Categoría del motivo. Ver `REASON_OPTIONS`).
    -   `approval_level`: string (Nivel de aprobación: `operator`, `supervisor`, `manager`).

---

## 🎯 Recomendaciones de Implementación

### 1. Selectores de UI para `reason` y `metadata`

Para facilitar la carga de datos, se recomienda usar menús desplegables (selects) en el frontend.

**Opciones para `reason_category` en Ajustes:**
```javascript
const REASON_OPTIONS = [
  { value: "PHYSICAL_COUNT", label: "Conteo físico", icon: "📊" },
  { value: "DAMAGED_GOODS", label: "Producto dañado", icon: "❌" },
  { value: "INVENTORY_CORRECTION", label: "Corrección de inventario", icon: "🔧" },
  { value: "SYSTEM_ERROR", label: "Error del sistema", icon: "⚠️" },
  { value: "THEFT_LOSS", label: "Pérdida/Robo", icon: "🚫" },
  { value: "EXPIRATION", label: "Producto vencido", icon: "⏰" },
  { value: "INITIAL_STOCK", label: "Stock inicial", icon: "🏁" },
  { value: "OTHER", label: "Otro motivo", icon: "📝" }
];
```

### 2. Función Helper para construir `metadata`

Una función helper en el frontend puede simplificar la creación de los `metadata` obligatorios.

```javascript
function createAdjustmentMetadata(reasonCategory, operatorId, customData = {}) {
  // Validación básica en frontend
  if (!reasonCategory || !operatorId) {
    throw new Error("La categoría del motivo y el operador son obligatorios.");
  }

  const baseMetadata = {
    source: "manual_adjustment",
    timestamp: new Date().toISOString(),
    operator: operatorId,
    reason_category: reasonCategory,
    approval_level: "operator" // Default, puede ser sobreescrito
  };

  return { ...baseMetadata, ...customData };
}

// Ejemplo de uso
const metadata = createAdjustmentMetadata(
  "DAMAGED_GOODS", 
  "user_123",
  { supervisor: "super_456", documentation: "REF-001" }
);

// `metadata` está listo para ser incluido en el request body
// de `POST /manual_adjustment/`.
```

### 3. Sincronización de Estado Post-Operación

-   **Después de un ajuste o inventario exitoso**, es crucial invalidar los datos de stock en caché y volver a solicitar el historial de transacciones (`GET /stock-transactions/product/{id}`) para reflejar los cambios.
-   Muestre una notificación al usuario indicando que la operación fue exitosa y que el stock ha sido actualizado.

---

## ❌ Códigos de Error Comunes

| Error                 | HTTP Status | Descripción                                      | Solución                                                     |
|-----------------------|-------------|--------------------------------------------------|--------------------------------------------------------------|
| `Bad Request`         | 400         | Faltan campos, tipos de dato incorrectos o JSON malformado. | Validar el request body en el frontend antes de enviarlo.    |
| `Unauthorized`        | 401         | Token JWT inválido, expirado o no provisto.      | Renovar el token o asegurar que se envíe en el header `Authorization`. |
| `Not Found`           | 404         | El recurso (ej. `product_id`) no existe.         | Verificar que los IDs sean correctos antes de la operación. |
| `Internal Server Error` | 500         | Error inesperado en el backend.                  | Reportar el error. El frontend no puede solucionarlo.        |

---