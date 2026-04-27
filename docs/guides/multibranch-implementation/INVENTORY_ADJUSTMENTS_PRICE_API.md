# 📦 API de Ajustes de Inventario

> **Disclaimer:** Esta guía contiene ejemplos JSON y TypeScript/JavaScript para ilustración de payloads y respuestas. Para el modelado de datos en el frontend, utilice las **tablas de definición de campos** como fuente de verdad.

**Versión:** 4.3  
**Fecha:** 31 de Marzo de 2026  
**Endpoint Base:** `http://localhost:5050`

---

## 📋 Descripción General

Esta API gestiona el sistema de inventarios y ajustes manuales. Permite realizar ajustes de stock, registrar movimientos, validar la consistencia del inventario y generar reportes de discrepancias. La versión 4.0 introduce un sistema de metadatos obligatorios para todas las operaciones, garantizando una trazabilidad y auditoría completas.

### Características Principales

- ✅ Ajustes de stock manuales con transacciones atómicas.
- ✅ Creación y gestión de inventarios físicos completos.
- ✅ Historial detallado de todos los movimientos y ajustes por producto.
- ✅ Endpoints para validar la consistencia del stock y la integridad del sistema.
- ✅ Sistema de metadatos con validación opcional y generación automática de plantilla.

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

### Contexto de Sucursal

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restricción: sucursal debe estar en `allowed_branches`

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## 📋 Validación de Metadata

El campo `metadata` en ajustes de stock es validado contra un JSON Schema en el backend. Si la estructura no es válida, el API devuelve un error 400 con detalles.

### Estructura Válida para Metadata de Ajuste de Stock

```json
{
  "system_version": "string (opcional)",
  "adjustment_type": "string enum: INVENTORY_COUNT, DAMAGE, EXPIRY, THEFT, RETURN, CORRECTION, INITIAL_COUNT (opcional)",
  "previous_stock": "number (opcional)",
  "new_stock": "number (opcional)",
  "stock_difference": "number (opcional)",
  "expiry_date": "string ISO date (opcional)",
  "location": "string (opcional)",
  "verified_by": "string (opcional)",
  "approved_by": "string (opcional)",
  "notes": "string (opcional)",
  "reference_document": "string (opcional)"
}
```

### Ejemplo de Metadata Válida

```json
{
  "adjustment_type": "INVENTORY_COUNT",
  "location": "Almacen Principal",
  "verified_by": "supervisor_01",
  "notes": "Conteo físico realizado al final del turno"
}
```

### Ejemplo de Error

```json
{
  "success": false,
  "message": "Invalid metadata: adjustment_type: adjustment_type must be one of the following: INVENTORY_COUNT, DAMAGE, EXPIRY, THEFT, RETURN, CORRECTION, INITIAL_COUNT"
}
```

---

## 📋 Validación de Metadata de Inventario

El campo `metadata` en inventarios es validado contra un JSON Schema en el backend.

### Estructura Válida para Metadata de Inventario

```json
{
  "system_version": "string (opcional)",
  "inventory_type": "string enum: ANNUAL, MONTHLY, WEEKLY, DAILY, SPOT_CHECK, RANDOM, CYCLIC (opcional)",
  "check_date": "string ISO datetime (opcional)",
  "location": "string (opcional)",
  "warehouse": "string (opcional)",
  "shelf": "string (opcional)",
  "verified_by": "string (opcional)",
  "approved_by": "string (opcional)",
  "supervisor_notes": "string (opcional)",
  "items_count": "integer (opcional)",
  "total_products": "integer (opcional)",
  "discrepancies_found": "integer (opcional)",
  "discrepancy_rate": "number 0-100 (opcional)",
  "status": "string enum: PENDING, IN_PROGRESS, COMPLETED, APPROVED, REJECTED (opcional)",
  "reference_document": "string (opcional)",
  "notes": "string (opcional)",
  "operator": "string (opcional)",
  "reason_category": "string (opcional)"
}
```

### Ejemplo de Metadata de Inventario Válida

```json
{
  "inventory_type": "MONTHLY",
  "location": "Almacén Central",
  "warehouse": "A",
  "shelf": "A-1",
  "verified_by": "supervisor_01",
  "items_count": 150,
  "discrepancies_found": 3,
  "status": "COMPLETED"
}
```

### Generación Automática

Si no se envía `metadata` o se envía un objeto vacío `{}`, el backend genera una plantilla por defecto automáticamente.

**Para Ajustes Manuales (`POST /manual_adjustment/`):**

- `operator`: ID del usuario extraído del JWT
- `reason_category`: "MANUAL_ADJUSTMENT"
- `notes`: Copia del campo `reason` si está presente

**Para Inventarios (`POST /inventory/`):**

- `operator`: ID del usuario extraído del JWT
- `reason_category`: "INVENTORY_CHECK"
- `items_count`: Cantidad de items en el inventario
- `status`: "COMPLETED"

---

## 📊 Modelos de Datos

A continuación se detallan las estructuras de datos principales utilizadas en la API.

### ManualAdjustment

```typescript
interface ManualAdjustment {
  id: number // ID único del ajuste
  product_id: string // ID del producto ajustado
  old_quantity: number // Cantidad antes del ajuste
  new_quantity: number // Cantidad nueva final
  adjustment_date: string // Fecha del ajuste (ISO 8601)
  reason: string // Motivo del ajuste
  metadata: object | null // Metadatos de trazabilidad
  user_id: string // ID del usuario que realizó el ajuste
}
```

### Inventory & Items

```typescript
interface Inventory {
  id: number
  user_id: string
  check_date: string // ISO 8601
  state: boolean // `true` para activo, `false` para invalidado
  metadata: object // Metadatos opcionales de la operación
}

interface InventoryItem {
  id: number
  inventory_id: number
  product_id: string
  quantity_checked: number
  previous_quantity: number
}

interface DetailedInventory {
  inventory: Inventory
  items: InventoryItem[]
}
```

### StockTransaction

```typescript
interface StockTransaction {
  id: number
  product_id: string
  transaction_type: string // "PURCHASE", "SALE", "ADJUSTMENT", etc.
  quantity_change: number // Cambio (+/-)
  quantity_before: number
  quantity_after: number
  unit_price?: number
  total_value?: number
  reference_type?: string // "ADJUSTMENT", "SALE", etc.
  reference_id?: string
  user_id: string
  transaction_date: string // ISO 8601
  reason?: string
  metadata?: object
}
```

### ProductAdjustmentHistory

```typescript
interface ProductAdjustmentHistory {
  adjustment_id: number
  adjustment_type: string
  old_value: number
  new_value: number
  value_change: number
  user_id: string
  adjustment_date: string // ISO 8601
  reason: string
  metadata: object
  related_transaction_id: number | null
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
  "new_quantity": 150.5,
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

| Campo          | Tipo   | Requerido | Descripción                                                                                                  |
| -------------- | ------ | --------- | ------------------------------------------------------------------------------------------------------------ |
| `product_id`   | string | ✅ Sí     | ID del producto a ajustar. Debe existir.                                                                     |
| `new_quantity` | int    | ✅ Sí     | La nueva cantidad final del producto (≥ 0).                                                                  |
| `reason`       | string | ✅ Sí     | Motivo claro y descriptivo del ajuste.                                                                       |
| `metadata`     | object | ❌ No     | Objeto con datos de trazabilidad. Si no se proporciona, se genera automáticamente. Ver sección de Metadatos. |

**Response (200 OK):** `MessageResponse`

```json
{
  "message": "Manual adjustment successful"
}
```

**Errores Posibles:**

| Error                              | HTTP Status | Descripción                                              |
| ---------------------------------- | ----------- | -------------------------------------------------------- |
| `"Invalid request body"`           | 400         | El JSON es inválido o faltan campos requeridos.          |
| `"Unauthorized"`                   | 401         | El token JWT es inválido, ha expirado o no fue provisto. |
| `"Product not found"`              | 404         | El `product_id` enviado no existe.                       |
| `"Error creating adjustment: ..."` | 500         | Error interno del servidor al procesar el ajuste.        |

#### 2. Obtener Historial de Ajustes de Producto

**Endpoint:** `GET /manual_adjustment/product/{productId}/history`

Obtiene todos los ajustes de precio y stock para un producto específico.

**Parámetros de URL:**

| Campo       | Tipo   | Descripción                  |
| ----------- | ------ | ---------------------------- |
| `productId` | string | ID del producto a consultar. |

**Query Parameters:**

| Campo    | Tipo   | Requerido | Descripción                                |
| -------- | ------ | --------- | ------------------------------------------ |
| `limit`  | number | ❌ No     | Número máximo de registros (default: 50).  |
| `offset` | number | ❌ No     | Número de registros a saltar (default: 0). |

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

#### 2.5. Crear Ajuste de Precio Manual

**Endpoint:** `POST /manual_adjustment/price`

Crea un nuevo ajuste de precio para un producto. El sistema registra el cambio de precio con metadatos de trazabilidad.

**Request Body:**

```json
{
  "product_id": "PROD_ABC_001",
  "new_price": 12500.0,
  "unit": "unit",
  "reason": "Actualización de precio de proveedor",
  "metadata": {
    "source": "manual_price_adjustment",
    "operator": "marcelo_p",
    "reason_category": "COST_CHANGE"
  }
}
```

**Parámetros:**

| Campo        | Tipo   | Requerido | Descripción                                 |
| ------------ | ------ | --------- | ------------------------------------------- |
| `product_id` | string | ✅ Sí     | ID del producto a ajustar. Debe existir.    |
| `new_price`  | number | ✅ Sí     | Nuevo precio (debe ser ≥ 0).                |
| `unit`       | string | ❌ No     | Unidad de medida (ej. "unit", "kg").        |
| `reason`     | string | ✅ Sí     | Motivo del ajuste de precio.                |
| `metadata`   | object | ❌ No     | Objeto con datos de trazabilidad. Opcional. |

**Response (200 OK):** `MessageResponse`

```json
{
  "message": "Price adjustment successful"
}
```

**Errores Posibles:**

| Error                                    | HTTP Status | Descripción                                              |
| ---------------------------------------- | ----------- | -------------------------------------------------------- |
| `"Invalid request body"`                 | 400         | El JSON es inválido o faltan campos requeridos.          |
| `"Unauthorized"`                         | 401         | El token JWT es inválido, ha expirado o no fue provisto. |
| `"Product not found"`                    | 404         | El `product_id` enviado no existe.                       |
| `"new_price must be non-negative"`       | 400         | El precio no puede ser negativo.                         |
| `"Error creating price adjustment: ..."` | 500         | Error interno del servidor.                              |

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

| Campo                      | Tipo                   | Requerido | Descripción                                                                        |
| -------------------------- | ---------------------- | --------- | ---------------------------------------------------------------------------------- |
| `items`                    | `InventoryItemInput[]` | ✅ Sí     | Array de productos contados.                                                       |
| `items[].product_id`       | string                 | ✅ Sí     | ID del producto.                                                                   |
| `items[].quantity_checked` | number                 | ✅ Sí     | Cantidad física contada (≥ 0).                                                     |
| `metadata`                 | object                 | ❌ No     | Objeto con datos de trazabilidad. Si no se proporciona, se genera automáticamente. |

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

| Campo | Tipo   | Descripción                    |
| ----- | ------ | ------------------------------ |
| `id`  | number | ID del inventario a invalidar. |

**Response (200 OK):**

```json
{
  "message": "Inventory invalidated"
}
```

#### 5. Obtener Lista de Inventarios

**Endpoint:** `GET /{page}/{pageSize}`

> **Nota:** La ruta real es `/{page}/{pageSize}` sin prefijo `inventory/`.

Obtiene una lista paginada de todos los inventarios realizados.

**Parámetros de URL:**

| Campo      | Tipo   | Descripción                         |
| ---------- | ------ | ----------------------------------- |
| `page`     | number | Número de página a obtener.         |
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

| Campo | Tipo   | Descripción                    |
| ----- | ------ | ------------------------------ |
| `id`  | number | ID del inventario a consultar. |

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

| Campo        | Tipo   | Descripción                  |
| ------------ | ------ | ---------------------------- |
| `product_id` | string | ID del producto a consultar. |

**Response (200 OK):** `StockTransaction[]` (enriquecido)

```json
[
  {
    "id": 123,
    "product_id": "PROD_ABC_001",
    "product_name": "Producto ABC",
    "transaction_type": "ADJUSTMENT",
    "quantity_change": 50.5,
    "quantity_before": 100.0,
    "quantity_after": 150.5,
    "reference_type": "ADJUSTMENT",
    "reference_id": "45",
    "user_id": "USR_789",
    "user_name": "Juan Pérez",
    "transaction_date": "2025-09-06T12:00:00Z",
    "reason": "Ajuste por conteo físico",
    "metadata": {
      "source": "manual_adjustment",
      "operator": "warehouse_manager"
    }
  }
]
```

---

## 🔍 Validaciones y Reglas de Negocio

### Pre-Procesamiento (Validar en Frontend)

1.  ✅ Para **Ajustes Manuales**, `new_quantity` debe ser un número entero mayor o igual a cero.
2.  ✅ Para **Inventarios**, cada `quantity_checked` debe ser un número mayor o igual a cero.
3.  ✅ El campo `reason` para ajustes debe tener entre 5 y 200 caracteres.
4.  ⚠️ El objeto `metadata` es **opcional**. Si no se proporciona, el backend genera una plantilla automáticamente con el ID del operador y categoría "MANUAL_ADJUSTMENT".
5.  ✅ Para **Transacciones de Stock**, `quantity_change` **no puede ser cero**.

### Metadatos (Opcionales)

Todas las operaciones que modifican el stock (`/manual_adjustment`, `/inventory`) soportan un objeto `metadata` con estructura opcional. Si no se proporciona, el backend genera una plantilla automáticamente.

**Estructura Mínima Recomendada para `metadata`:**

```typescript
interface MetadataMinima {
  source: string // Origen de la operación. E.g., "physical_count", "manual_adjustment"
  timestamp?: string // Fecha y hora en formato ISO 8601. E.g., new Date().toISOString()
  operator: string // ID o nombre del usuario/operador que realiza la acción
}
```

**Campos Adicionales Opcionales por Operación:**

- **Para Inventarios (`POST /inventory`):**
  - `location`: string (Ubicación física donde se hizo el conteo).
  - `counting_method`: string (Método usado: `manual`, `barcode_scanner`, `rfid`).
  - `verification`: string (Nivel de verificación: `single_check`, `double_check`).

- **Para Ajustes Manuales (`POST /manual_adjustment`):**
  - `reason_category`: string (Categoría del motivo. Ver `REASON_OPTIONS`).
  - `approval_level`: string (Nivel de aprobación: `operator`, `supervisor`, `manager`).

**Generación Automática:**
Si no se envía `metadata` o se envía un objeto vacío `{}`, el backend genera una plantilla por defecto automáticamente.

**Para Ajustes Manuales (`POST /manual_adjustment/`):**

- `operator`: ID del usuario extraído del JWT
- `reason_category`: "MANUAL_ADJUSTMENT"
- `notes`: Copia del campo `reason` si está presente

**Para Inventarios (`POST /inventory/`):**

- `operator`: ID del usuario extraído del JWT
- `reason_category`: "INVENTORY_CHECK"
- `items_count`: Cantidad de items en el inventario
- `status`: "COMPLETED"

---

## 🎯 Recomendaciones de Implementación

### 1. Selectores de UI para `reason` y `metadata`

Para facilitar la carga de datos, se recomienda usar menús desplegables (selects) en el frontend.

**Opciones para `reason_category` en Ajustes de Stock:**

```javascript
const REASON_OPTIONS = [
  { value: 'INVENTORY_COUNT', label: 'Conteo de inventario', icon: '📊' },
  { value: 'DAMAGE', label: 'Producto dañado', icon: '❌' },
  { value: 'EXPIRY', label: 'Producto vencido', icon: '⏰' },
  { value: 'THEFT', label: 'Pérdida/Robo', icon: '🚫' },
  { value: 'RETURN', label: 'Devolución', icon: '↩️' },
  { value: 'CORRECTION', label: 'Corrección', icon: '🔧' },
  { value: 'INITIAL_COUNT', label: 'Conteo inicial', icon: '🏁' },
  { value: 'MANUAL_ADJUSTMENT', label: 'Ajuste manual (default)', icon: '📝' },
]
```

**Opciones para `adjustment_type` en Metadatos de Stock:**

```javascript
const ADJUSTMENT_TYPE_OPTIONS = [
  { value: 'INVENTORY_COUNT', label: 'Conteo de inventario' },
  { value: 'DAMAGE', label: 'Daño' },
  { value: 'EXPIRY', label: 'Vencimiento' },
  { value: 'THEFT', label: 'Robo/Pérdida' },
  { value: 'RETURN', label: 'Devolución' },
  { value: 'CORRECTION', label: 'Corrección' },
  { value: 'INITIAL_COUNT', label: 'Conteo inicial' },
]
```

### 2. Función Helper para construir `metadata`

Una función helper en el frontend puede simplificar la creación de los `metadata` obligatorios.

```javascript
function createAdjustmentMetadata(reasonCategory, operatorId, customData = {}) {
  // Validación básica en frontend
  if (!reasonCategory || !operatorId) {
    throw new Error('La categoría del motivo y el operador son obligatorios.')
  }

  const baseMetadata = {
    source: 'manual_adjustment',
    timestamp: new Date().toISOString(),
    operator: operatorId,
    reason_category: reasonCategory,
    approval_level: 'operator', // Default, puede ser sobreescrito
  }

  return { ...baseMetadata, ...customData }
}

// Ejemplo de uso
const metadata = createAdjustmentMetadata('DAMAGED_GOODS', 'user_123', {
  supervisor: 'super_456',
  documentation: 'REF-001',
})

// `metadata` está listo para ser incluido en el request body
// de `POST /manual_adjustment/`.
```

### 3. Sincronización de Estado Post-Operación

- **Después de un ajuste o inventario exitoso**, es crucial invalidar los datos de stock en caché y volver a solicitar el historial de transacciones (`GET /stock-transactions/product/{id}`) para reflejar los cambios.
- Muestre una notificación al usuario indicando que la operación fue exitosa y que el stock ha sido actualizado.

---

## ❌ Códigos de Error Comunes

| Error                   | HTTP Status | Descripción                                                 | Solución                                                               |
| ----------------------- | ----------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| `Bad Request`           | 400         | Faltan campos, tipos de dato incorrectos o JSON malformado. | Validar el request body en el frontend antes de enviarlo.              |
| `Unauthorized`          | 401         | Token JWT inválido, expirado o no provisto.                 | Renovar el token o asegurar que se envíe en el header `Authorization`. |
| `Not Found`             | 404         | El recurso (ej. `product_id`) no existe.                    | Verificar que los IDs sean correctos antes de la operación.            |
| `Internal Server Error` | 500         | Error inesperado en el backend.                             | Reportar el error. El frontend no puede solucionarlo.                  |

---
