# API de Ajustes de Inventario

> **Disclaimer:** Esta guía contiene ejemplos JSON y TypeScript/JavaScript para ilustración de payloads y respuestas. Para el modelado de datos en el frontend, utilice las **tablas de definición de campos** como fuente de verdad.

**Version:** 4.3
**Endpoint Base:** `http://localhost:5050`

---

## Descripcion General

Esta API gestiona el sistema de inventarios y ajustes manuales. Permite realizar ajustes de stock, registrar movimientos, validar la consistencia del inventario y generar reportes de discrepancias. La version 4.0 introduce un sistema de metadatos obligatorios para todas las operaciones, garantizando una trazabilidad y auditoria completas.

### Caracteristicas Principales

- Ajustes de stock manuales con transacciones atomicas.
- Creacion y gestion de inventarios fisicos completos.
- Historial detallado de todos los movimientos y ajustes por producto.
- Endpoints para validar la consistencia del stock y la integridad del sistema.
- Sistema de metadatos con validacion opcional y generacion automatica de plantilla.

## 🔧 Configuración General

### Base URL
http://localhost:5050

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

> **Nota:** `?branch_id` tiene prioridad sobre `X-Branch-ID`. Ver [MULTI_BRANCH_CONTEXT_GUIDE.md](./MULTI_BRANCH_CONTEXT_GUIDE.md).

### Formato de Respuesta Estándar
`{ success: bool, data?, message?, error?, pagination? }`

### Formato de Fechas
- Payloads: ISO 8601 (`2026-03-24T15:30:00Z`)
- Query params: `YYYY-MM-DD`

### Paginación Estándar
`{ page, page_size, total_items, total_pages, has_next, has_prev }`

### Contexto de Sucursal

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restriccion: sucursal debe estar en `allowed_branches`

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `inventory:read` |
| POST / PUT / DELETE / PATCH | `inventory:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

## Validacion de Metadata

El campo `metadata` en ajustes de stock es validado contra un JSON Schema en el backend. Si la estructura no es valida, el API devuelve un error 400 con detalles.

### Estructura Valida para Metadata de Ajuste de Stock

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

### Ejemplo de Metadata Valida

```json
{
  "adjustment_type": "INVENTORY_COUNT",
  "location": "Almacen Principal",
  "verified_by": "supervisor_01",
  "notes": "Conteo fisico realizado al final del turno"
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

## Validacion de Metadata de Inventario

El campo `metadata` en inventarios es validado contra un JSON Schema en el backend.

### Estructura Valida para Metadata de Inventario

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

### Ejemplo de Metadata de Inventario Valida

```json
{
  "inventory_type": "MONTHLY",
  "location": "Almacen Central",
  "warehouse": "A",
  "shelf": "A-1",
  "verified_by": "supervisor_01",
  "items_count": 150,
  "discrepancies_found": 3,
  "status": "COMPLETED"
}
```

### Generacion Automatica

Si no se envia `metadata` o se envia un objeto vacio `{}`, el backend genera una plantilla por defecto automaticamente.

**Para Ajustes Manuales (`POST /manual_adjustment/`):**

- `operator`: ID del usuario extraido del JWT
- `reason_category`: "MANUAL_ADJUSTMENT"
- `notes`: Copia del campo `reason` si esta presente

**Para Inventarios (`POST /inventory/`):**

- `operator`: ID del usuario extraido del JWT
- `reason_category`: "INVENTORY_CHECK"
- `items_count`: Cantidad de items en el inventario
- `status`: "COMPLETED"

---

## Modelos de Datos

A continuacion se detallan las estructuras de datos principales utilizadas en la API.

### ManualAdjustment

```typescript
interface ManualAdjustment {
  id: number                    // ID unico del ajuste
  product_id: string            // ID del producto ajustado
  branch_id?: number            // ID de la sucursal (opcional)
  variant_id?: string           // ID de la variante (opcional, para productos con variantes)
  old_quantity: number          // Cantidad antes del ajuste
  new_quantity: number          // Cantidad nueva final
  adjustment_date: string       // Fecha del ajuste (ISO 8601)
  reason: string                // Motivo del ajuste
  metadata: object | null       // Metadatos de trazabilidad
  user_id: string               // ID del usuario que realizo el ajuste
}
```

### Inventory & Items

```typescript
interface Inventory {
  id: number
  user_id: string
  check_date: string // ISO 8601
  state: boolean // `true` para activo, `false` para invalidado
  metadata: object // Metadatos opcionales de la operacion
}

interface InventoryItem {
  id: number
  inventory_id: number
  product_id: string
  variant_id?: string           // ID de la variante (opcional, para conteo por variante)
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
  branch_id?: number            // ID de la sucursal
  variant_id?: string           // ID de la variante (si aplica)
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

## Endpoints de la API

### Ajustes Manuales

#### 1. Crear Ajuste Manual de Stock

**Endpoint:** `POST /manual_adjustment/`

Crea un nuevo ajuste manual de stock. El sistema genera una transaccion de stock de tipo "ADJUSTMENT" de forma automatica y atomica.

**Request Body:**

```json
{
  "product_id": "PROD_ABC_001",
  "variant_id": "VAR_ROJO_M",
  "new_quantity": 150.5,
  "reason": "Ajuste por conteo fisico",
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

**Parametros:**

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `product_id` | string | Si | ID del producto a ajustar. Debe existir. |
| `variant_id` | string | No | ID de la variante. Si el producto tiene variantes activas, se recomienda especificar para ajustar stock de una variante especifica. Si se omite, ajusta el stock del producto padre. |
| `new_quantity` | int | Si | La nueva cantidad final del producto (>= 0). |
| `reason` | string | Si | Motivo claro y descriptivo del ajuste. |
| `metadata` | object | No | Objeto con datos de trazabilidad. Si no se proporciona, se genera automaticamente. Ver seccion de Metadatos. |

**Response (200 OK):** `MessageResponse`

```json
{
  "message": "Manual adjustment successful"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripcion |
|-------|-------------|-------------|
| `"Invalid request body"` | 400 | El JSON es invalido o faltan campos requeridos. |
| `"Unauthorized"` | 401 | El token JWT es invalido, ha expirado o no fue provisto. |
| `"Product not found"` | 404 | El `product_id` enviado no existe. |
| `"Error creating adjustment: ..."` | 500 | Error interno del servidor al procesar el ajuste. |

#### 2. Obtener Historial de Ajustes de Producto

**Endpoint:** `GET /manual_adjustment/product/{productId}/history`

Obtiene todos los ajustes de precio y stock para un producto especifico.

**Parametros de URL:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `productId` | string | ID del producto a consultar. |

**Query Parameters:**

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `limit` | number | No | Numero maximo de registros (default: 50). |
| `offset` | number | No | Numero de registros a saltar (default: 0). |

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
      "reason": "Configuracion de stock inicial",
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
      "reason": "Declaracion de precio inicial para carga de inventario",
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
  "variant_id": "VAR_ROJO_M",
  "new_price": 12500.0,
  "unit": "unit",
  "reason": "Actualizacion de precio de proveedor",
  "metadata": {
    "source": "manual_price_adjustment",
    "operator": "marcelo_p",
    "reason_category": "COST_CHANGE"
  }
}
```

**Parametros:**

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `product_id` | string | Si | ID del producto a ajustar. Debe existir. |
| `variant_id` | string | No | ID de la variante. Si se especifica, ajusta el precio de esa variante. Si se omite, ajusta el precio del producto padre. Respeta la jerarquia de resolucion de precios. |
| `new_price` | number | Si | Nuevo precio (debe ser >= 0). |
| `unit` | string | No | Unidad de medida (ej. "unit", "kg"). |
| `reason` | string | Si | Motivo del ajuste de precio. |
| `metadata` | object | No | Objeto con datos de trazabilidad. Opcional. |

**Response (200 OK):** `MessageResponse`

```json
{
  "message": "Price adjustment successful"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripcion |
|-------|-------------|-------------|
| `"Invalid request body"` | 400 | El JSON es invalido o faltan campos requeridos. |
| `"Unauthorized"` | 401 | El token JWT es invalido, ha expirado o no fue provisto. |
| `"Product not found"` | 404 | El `product_id` enviado no existe. |
| `"new_price must be non-negative"` | 400 | El precio no puede ser negativo. |
| `"Error creating price adjustment: ..."` | 500 | Error interno del servidor. |

### Gestion de Inventarios

#### 3. Crear un Inventario Fisico

**Endpoint:** `POST /inventory/`

Crea un nuevo inventario fisico. El sistema compara las cantidades contadas (`quantity_checked`) con el stock actual y genera transacciones de ajuste para cada producto con discrepancias.

**Request Body:**

```json
{
  "items": [
    {
      "product_id": "PROD_ABC_001",
      "variant_id": "VAR_ROJO_M",
      "quantity_checked": 150
    },
    {
      "product_id": "PROD_ABC_001",
      "variant_id": "VAR_AZUL_S",
      "quantity_checked": 75
    },
    {
      "product_id": "PROD_DEF_002",
      "quantity_checked": 30
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

**Parametros:**

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `items` | `InventoryItemInput[]` | Si | Array de productos contados. |
| `items[].product_id` | string | Si | ID del producto. |
| `items[].variant_id` | string | No | ID de la variante. Para productos con variantes, se recomienda enviar un item por cada variante contada (escaneando su SKU/barcode). |
| `items[].quantity_checked` | number | Si | Cantidad fisica contada (>= 0). |
| `metadata` | object | No | Objeto con datos de trazabilidad. Si no se proporciona, se genera automaticamente. |

**Response (200 OK):**

```json
{
  "message": "Inventory added"
}
```

#### 4. Invalidar un Inventario

**Endpoint:** `PUT /inventory/{id}`

Invalida un inventario existente y revierte automaticamente todas las transacciones de stock que genero.

**Parametros de URL:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | number | ID del inventario a invalidar. |

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

**Parametros de URL:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `page` | number | Numero de pagina a obtener. |
| `pageSize` | number | Cantidad de inventarios por pagina. |

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

Obtiene la informacion detallada de un inventario, incluyendo la cabecera y todos sus items.

**Parametros de URL:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
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

**Parametros de URL:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
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
    "user_name": "Juan Perez",
    "transaction_date": "2025-09-06T12:00:00Z",
    "reason": "Ajuste por conteo fisico",
    "metadata": {
      "source": "manual_adjustment",
      "operator": "warehouse_manager"
    }
  }
]
```

---

#### 8. Registrar Transaccion de Stock

**`POST /stock-transactions/`**

Registra un nuevo movimiento de stock (entrada, salida, ajuste, transferencia).

#### 9. Obtener Transaccion de Stock por ID

**`GET /stock-transactions/{id}`**

Obtiene una transaccion de stock especifica.

#### 10. Validar Consistencia de Stock

**`GET /stock-transactions/validate-consistency`**

Verifica que los saldos de stock sean consistentes con el historial de transacciones.

#### 11. Reporte de Discrepancias

**`GET /stock-transactions/discrepancy-report`**

Reporte de discrepancias entre stock fisico y stock teorico.

#### 12. Resumen de Movimientos

**`GET /stock-transactions/movement-summary`**

Resumen agregado de movimientos de stock (entradas, salidas, neto) por periodo.

#### 13. Transacciones por Rango de Fechas

**`GET /stock-transactions/by-date`**

Lista transacciones de stock filtradas por rango de fechas (`start_date`, `end_date`).

#### 14. Tipos de Transaccion

**`GET /stock-transactions/types`**

Lista los tipos de transaccion de stock soportados.

---

## Validaciones y Reglas de Negocio

### Pre-Procesamiento (Validar en Frontend)

1. Para **Ajustes Manuales**, `new_quantity` debe ser un numero entero mayor o igual a cero.
2. Para **Inventarios**, cada `quantity_checked` debe ser un numero mayor o igual a cero.
3. El campo `reason` para ajustes debe tener entre 5 y 200 caracteres.
4. El objeto `metadata` es **opcional**. Si no se proporciona, el backend genera una plantilla automaticamente con el ID del operador y categoria "MANUAL_ADJUSTMENT".
5. Para **Transacciones de Stock**, `quantity_change` **no puede ser cero**.

### Metadatos (Opcionales)

Todas las operaciones que modifican el stock (`/manual_adjustment`, `/inventory`) soportan un objeto `metadata` con estructura opcional. Si no se proporciona, el backend genera una plantilla automaticamente.

**Estructura Minima Recomendada para `metadata`:**

```typescript
interface MetadataMinima {
  source: string      // Origen de la operacion. E.g., "physical_count", "manual_adjustment"
  timestamp?: string  // Fecha y hora en formato ISO 8601. E.g., new Date().toISOString()
  operator: string    // ID o nombre del usuario/operador que realiza la accion
}
```

**Campos Adicionales Opcionales por Operacion:**

- **Para Inventarios (`POST /inventory`):**
  - `location`: string (Ubicacion fisica donde se hizo el conteo).
  - `counting_method`: string (Metodo usado: `manual`, `barcode_scanner`, `rfid`).
  - `verification`: string (Nivel de verificacion: `single_check`, `double_check`).

- **Para Ajustes Manuales (`POST /manual_adjustment`):**
  - `reason_category`: string (Categoria del motivo. Ver `REASON_OPTIONS`).
  - `approval_level`: string (Nivel de aprobacion: `operator`, `supervisor`, `manager`).

**Generacion Automatica:**
Si no se envia `metadata` o se envia un objeto vacio `{}`, el backend genera una plantilla por defecto automaticamente.

**Para Ajustes Manuales (`POST /manual_adjustment/`):**

- `operator`: ID del usuario extraido del JWT
- `reason_category`: "MANUAL_ADJUSTMENT"
- `notes`: Copia del campo `reason` si esta presente

**Para Inventarios (`POST /inventory/`):**

- `operator`: ID del usuario extraido del JWT
- `reason_category`: "INVENTORY_CHECK"
- `items_count`: Cantidad de items en el inventario
- `status`: "COMPLETED"

---

## Recomendaciones de Implementacion

### 1. Selectores de UI para `reason` y `metadata`

Para facilitar la carga de datos, se recomienda usar menus desplegables (selects) en el frontend.

**Opciones para `reason_category` en Ajustes de Stock:**

```javascript
const REASON_OPTIONS = [
  { value: 'INVENTORY_COUNT', label: 'Conteo de inventario', icon: '📊' },
  { value: 'DAMAGE', label: 'Producto danado', icon: '❌' },
  { value: 'EXPIRY', label: 'Producto vencido', icon: '⏰' },
  { value: 'THEFT', label: 'Perdida/Robo', icon: '🚫' },
  { value: 'RETURN', label: 'Devolucion', icon: '↩️' },
  { value: 'CORRECTION', label: 'Correccion', icon: '🔧' },
  { value: 'INITIAL_COUNT', label: 'Conteo inicial', icon: '🏁' },
  { value: 'MANUAL_ADJUSTMENT', label: 'Ajuste manual (default)', icon: '📝' },
]
```

**Opciones para `adjustment_type` en Metadatos de Stock:**

```javascript
const ADJUSTMENT_TYPE_OPTIONS = [
  { value: 'INVENTORY_COUNT', label: 'Conteo de inventario' },
  { value: 'DAMAGE', label: 'Dano' },
  { value: 'EXPIRY', label: 'Vencimiento' },
  { value: 'THEFT', label: 'Robo/Perdida' },
  { value: 'RETURN', label: 'Devolucion' },
  { value: 'CORRECTION', label: 'Correccion' },
  { value: 'INITIAL_COUNT', label: 'Conteo inicial' },
]
```

### 2. Funcion Helper para construir `metadata`

Una funcion helper en el frontend puede simplificar la creacion de los `metadata` obligatorios.

```javascript
function createAdjustmentMetadata(reasonCategory, operatorId, customData = {}) {
  if (!reasonCategory || !operatorId) {
    throw new Error('La categoria del motivo y el operador son obligatorios.')
  }

  const baseMetadata = {
    source: 'manual_adjustment',
    timestamp: new Date().toISOString(),
    operator: operatorId,
    reason_category: reasonCategory,
    approval_level: 'operator',
  }

  return { ...baseMetadata, ...customData }
}

// Ejemplo de uso
const metadata = createAdjustmentMetadata('DAMAGED_GOODS', 'user_123', {
  supervisor: 'super_456',
  documentation: 'REF-001',
})
```

### 3. Sincronizacion de Estado Post-Operacion

- **Despues de un ajuste o inventario exitoso**, es crucial invalidar los datos de stock en cache y volver a solicitar el historial de transacciones (`GET /stock-transactions/product/{id}`) para reflejar los cambios.
- Muestre una notificacion al usuario indicando que la operacion fue exitosa y que el stock ha sido actualizado.

---

## Codigos de Error Comunes

| Error | HTTP Status | Descripcion | Solucion |
|-------|-------------|-------------|----------|
| `Bad Request` | 400 | Faltan campos, tipos de dato incorrectos o JSON malformado. | Validar el request body en el frontend antes de enviarlo. |
| `Unauthorized` | 401 | Token JWT invalido, expirado o no provisto. | Renovar el token o asegurar que se envie en el header `Authorization`. |
| `Not Found` | 404 | El recurso (ej. `product_id`) no existe. | Verificar que los IDs sean correctos antes de la operacion. |
| `Internal Server Error` | 500 | Error inesperado en el backend. | Reportar el error. El frontend no puede solucionarlo. |

---

## Ver También

- [PRODUCT_UNIT_FLOWS_GUIDE.md](./PRODUCT_UNIT_FLOWS_GUIDE.md) — Flujos operativos con unidades de medida, incluyendo ajustes de stock con decimales vía `POST /stock-transactions/` y limitaciones de `POST /manual_adjustment/`

---

_Ultima actualizacion: 2026-06-09_
