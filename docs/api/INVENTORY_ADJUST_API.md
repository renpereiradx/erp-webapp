# 📦 Guía de Integración API - Sistema de Inventarios y Ajustes

## 🎯 Descripción General

Esta documentación especifica la API del sistema de inventarios y ajustes manuales implementada en el sistema de business management. Proporciona información técnica precisa sobre endpoints, modelos de datos, códigos de respuesta y validaciones basada en la implementación actual del código después de la optimización del 6 de Septiembre 2025.

**🔥 NUEVA IMPLEMENTACIÓN OPTIMIZADA**: Sistema completamente limpio con funciones integradas y naming simplificado.

**🚀 ACTUALIZACIÓN**: `manage_inventory` convertido a FUNCIÓN para consistencia arquitectónica total.

---

## 📊 Modelos de Datos

### ManualAdjustment
```typescript
interface ManualAdjustment {
  id: number;                    // ID único del ajuste (int)
  product_id: string;            // ID del producto ajustado (varchar(27))
  old_quantity: number;          // Cantidad anterior (numeric(10,2))
  new_quantity: number;          // Cantidad nueva (numeric(10,2))
  adjustment_date: string;       // Fecha del ajuste (ISO 8601)
  reason: string;                // Motivo del ajuste
  metadata: object | null;       // Metadatos adicionales (JSON)
  user_id: string;               // ID del usuario que realizó el ajuste
}
```

### StockTransaction
```typescript
interface StockTransaction {
  id: number;                    // ID único de la transacción (int)
  product_id: string;            // ID del producto (varchar(27))
  transaction_type: string;      // Tipo: "PURCHASE", "SALE", "ADJUSTMENT", "INVENTORY", etc.
  quantity_change: number;       // Cambio en cantidad (+/-)
  quantity_before: number;       // Cantidad antes del movimiento
  quantity_after: number;        // Cantidad después del movimiento
  unit_price?: number;           // Precio unitario (opcional)
  total_value?: number;          // Valor total (opcional)
  reference_type?: string;       // Tipo de referencia ("ADJUSTMENT", "SALE", etc.)
  reference_id?: string;         // ID de referencia
  user_id: string;               // ID del usuario
  transaction_date: string;      // Fecha de la transacción (ISO 8601)
  reason?: string;               // Motivo del movimiento
  metadata?: object;             // Metadatos adicionales (JSON)
}
```

### StockTransactionHistory (Enriquecido)
```typescript
interface StockTransactionHistory extends StockTransaction {
  product_name: string;          // Nombre del producto (JOIN)
  user_name: string;             // Nombre del usuario (JOIN)
}
```

### StockConsistencyReport
```typescript
interface StockConsistencyReport {
  product_id: string;            // ID del producto
  product_name: string;          // Nombre del producto
  current_stock: number;         // Stock actual registrado
  calculated_stock: number;      // Stock calculado por transacciones
  difference: number;            // Diferencia entre actual y calculado
  is_consistent: boolean;        // Si hay consistencia
  total_purchases: number;       // Total de compras
  total_sales: number;           // Total de ventas
  total_adjustments: number;     // Total de ajustes
  total_inventories: number;     // Total de inventarios
  recommendation: string;        // Recomendación de acción
}
```

### InventoryDiscrepancyReport
```typescript
interface InventoryDiscrepancyReport {
  product_id: string;            // ID del producto
  product_name: string;          // Nombre del producto
  category_name: string;         // Nombre de la categoría
  discrepancies_count: number;   // Número de discrepancias
  total_variance: number;        // Varianza total
  avg_variance: number;          // Varianza promedio
  max_variance: number;          // Varianza máxima
  last_inventory_date: string;   // Fecha del último inventario
  needs_attention: boolean;      // Si necesita atención
}
```

### Inventory (NUEVO)
```typescript
interface Inventory {
  id: number;                    // ID único del inventario (int)
  user_id: string;               // ID del usuario que realizó el inventario
  check_date: string;            // Fecha del conteo (ISO 8601)
  state: boolean;                // Estado del inventario (activo/inválido)
}
```

### InventoryItem (NUEVO)
```typescript
interface InventoryItem {
  id: number;                    // ID único del item (int)
  inventory_id: number;          // ID del inventario padre
  product_id: string;            // ID del producto
  quantity_checked: number;      // Cantidad contada
  previous_quantity: number;     // Cantidad anterior registrada
}
```

### DetailedInventory (NUEVO)
```typescript
interface DetailedInventory {
  inventory: Inventory;          // Información del inventario
  items: InventoryItem[];        // Lista de items del inventario
}
```

### ProductAdjustmentHistory
```typescript
interface ProductAdjustmentHistory {
  adjustment_id: number;         // ID del ajuste
  adjustment_type: string;       // Tipo de ajuste
  old_value: number;             // Valor anterior
  new_value: number;             // Valor nuevo
  value_change: number;          // Cambio en valor
  user_id: string;               // ID del usuario
  adjustment_date: string;       // Fecha del ajuste
  reason: string;                // Motivo
  metadata: object;              // Metadatos
  related_transaction_id: number; // ID de transacción relacionada
}
```

### Request Bodies
```typescript
interface ManualAdjustmentRequest {
  product_id: string;            // ID del producto (requerido)
  new_quantity: number;          // Nueva cantidad (requerido)
  reason: string;                // Motivo del ajuste (requerido)
  metadata?: object;             // Metadatos opcionales
}

interface StockTransactionRequest {
  product_id: string;            // ID del producto (requerido)
  transaction_type: string;      // Tipo de transacción (requerido)
  quantity_change: number;       // Cambio en cantidad (requerido)
  unit_price?: number;           // Precio unitario (opcional)
  reference_type?: string;       // Tipo de referencia (opcional)
  reference_id?: string;         // ID de referencia (opcional)
  reason?: string;               // Motivo (opcional)
  metadata?: object;             // Metadatos (opcional)
}

interface InventoryRequest {
  action: "insert" | "invalidate"; // Acción a realizar (requerido)
  id_inventory?: number;         // ID del inventario (para invalidate)
  check_date?: string;           // Fecha del conteo (para insert)
  details?: InventoryItemInput[]; // Items del inventario (para insert)
}

interface InventoryItemInput {
  product_id: string;            // ID del producto (requerido)
  quantity_checked: number;      // Cantidad contada (requerido)
  cost?: number;                 // Costo opcional
  price?: number;                // Precio opcional
}
```

---

## 🎨 Opciones por Defecto para Frontend

### Valores Predeterminados para `reason`
Para facilitar la implementación en el frontend, se recomiendan estos valores por defecto:

```typescript
const DEFAULT_REASONS = {
  // Ajustes Manuales
  MANUAL_ADJUSTMENT: {
    PHYSICAL_COUNT: "Ajuste por conteo físico",
    DAMAGED_GOODS: "Producto dañado o vencido",
    INVENTORY_CORRECTION: "Corrección de inventario",
    SYSTEM_ERROR: "Corrección por error del sistema",
    THEFT_LOSS: "Pérdida por robo o extravío",
    SUPPLIER_ERROR: "Error en entrega del proveedor",
    EXPIRATION: "Producto vencido",
    BREAKAGE: "Producto roto o dañado",
    QUALITY_CONTROL: "Rechazo por control de calidad",
    INITIAL_STOCK: "Configuración de stock inicial",
    RECLASSIFICATION: "Reclasificación de producto",
    OTHER: "Otro motivo (especificar en metadata)"
  },
  
  // Transacciones de Stock
  STOCK_TRANSACTION: {
    PURCHASE: "Entrada por compra",
    SALE: "Salida por venta",
    TRANSFER_IN: "Transferencia entrante",
    TRANSFER_OUT: "Transferencia saliente",
    RETURN: "Devolución de cliente",
    SUPPLIER_RETURN: "Devolución a proveedor",
    PROMOTION: "Salida por promoción",
    SAMPLE: "Muestra gratuita",
    INTERNAL_USE: "Uso interno",
    DESTRUCTION: "Destrucción de producto"
  }
};
```

### Plantillas de `metadata` por Defecto
Estructuras recomendadas para diferentes tipos de ajustes:

```typescript
const DEFAULT_METADATA_TEMPLATES = {
  // Conteo Físico
  PHYSICAL_COUNT: {
    source: "physical_count",
    operator: "", // A completar por el usuario
    verification: "single_check", // o "double_check"
    location: "", // ubicación del conteo
    counting_method: "manual", // o "scanner"
    timestamp: new Date().toISOString()
  },
  
  // Producto Dañado
  DAMAGED_GOODS: {
    source: "quality_control",
    damage_type: "", // "expired", "broken", "contaminated", etc.
    damage_severity: "total", // "partial", "total"
    disposal_method: "", // "discard", "return_supplier", "repair"
    photos_taken: false,
    insurance_claim: false
  },
  
  // Error del Sistema
  SYSTEM_ERROR: {
    source: "system_correction",
    error_type: "", // "sync_error", "calculation_error", etc.
    original_transaction: "", // ID de transacción original
    detection_method: "audit", // "audit", "user_report", "automatic"
    corrected_by: "", // ID del usuario que corrige
    approval_required: false
  },
  
  // Configuración Inicial
  INITIAL_STOCK: {
    source: "initial_setup",
    migration_date: new Date().toISOString(),
    data_source: "", // "manual", "import", "system_migration"
    verified_by: "", // Usuario que verificó
    cost_basis: "", // Base del costo
    notes: ""
  },
  
  // Transferencia
  TRANSFER: {
    source: "transfer",
    from_location: "",
    to_location: "",
    transfer_type: "internal", // "internal", "external"
    shipping_method: "",
    tracking_number: "",
    expected_delivery: "",
    carrier: ""
  },
  
  // Genérico/Mínimo
  DEFAULT: {
    source: "manual_entry",
    timestamp: new Date().toISOString(),
    notes: ""
  }
};
```

### Función Helper para Frontend

```typescript
// Función helper para generar requests con valores por defecto
function createAdjustmentRequest(
  productId: string, 
  newQuantity: number, 
  reasonType: keyof typeof DEFAULT_REASONS.MANUAL_ADJUSTMENT,
  customReason?: string,
  metadataTemplate?: keyof typeof DEFAULT_METADATA_TEMPLATES,
  customMetadata?: object
): ManualAdjustmentRequest {
  
  const reason = customReason || DEFAULT_REASONS.MANUAL_ADJUSTMENT[reasonType];
  const template = metadataTemplate || 'DEFAULT';
  const baseMetadata = { ...DEFAULT_METADATA_TEMPLATES[template] };
  
  return {
    product_id: productId,
    new_quantity: newQuantity,
    reason: reason,
    metadata: {
      ...baseMetadata,
      reason_type: reasonType,
      ...customMetadata
    }
  };
}

// Ejemplos de uso:
const physicalCountAdjustment = createAdjustmentRequest(
  "PROD_ABC_001", 
  150, 
  "PHYSICAL_COUNT",
  undefined, // usar reason por defecto
  "PHYSICAL_COUNT",
  { operator: "warehouse_manager", location: "A1-B2" }
);

const damagedGoodsAdjustment = createAdjustmentRequest(
  "PROD_DEF_002", 
  0, 
  "DAMAGED_GOODS",
  "Producto vencido - lote XYZ123",
  "DAMAGED_GOODS",
  { damage_type: "expired", disposal_method: "discard" }
);
```

### Selectores de UI Recomendados

```typescript
// Para dropdowns en el frontend
const REASON_OPTIONS = [
  { value: "PHYSICAL_COUNT", label: "Conteo físico", icon: "📊" },
  { value: "DAMAGED_GOODS", label: "Producto dañado", icon: "❌" },
  { value: "INVENTORY_CORRECTION", label: "Corrección de inventario", icon: "🔧" },
  { value: "SYSTEM_ERROR", label: "Error del sistema", icon: "⚠️" },
  { value: "THEFT_LOSS", label: "Pérdida/Robo", icon: "🚫" },
  { value: "SUPPLIER_ERROR", label: "Error del proveedor", icon: "📦" },
  { value: "EXPIRATION", label: "Producto vencido", icon: "⏰" },
  { value: "BREAKAGE", label: "Producto roto", icon: "💥" },
  { value: "QUALITY_CONTROL", label: "Control de calidad", icon: "🔍" },
  { value: "INITIAL_STOCK", label: "Stock inicial", icon: "🏁" },
  { value: "OTHER", label: "Otro motivo", icon: "📝" }
];

const METADATA_TEMPLATES_OPTIONS = [
  { value: "PHYSICAL_COUNT", label: "Conteo físico" },
  { value: "DAMAGED_GOODS", label: "Producto dañado" },
  { value: "SYSTEM_ERROR", label: "Error del sistema" },
  { value: "INITIAL_STOCK", label: "Stock inicial" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "DEFAULT", label: "Básico" }
];
```

---

## 🔗 Endpoints de la API

**Todos los endpoints requieren autenticación JWT** 🔒

### 1. Crear Ajuste Manual de Stock 🔒
```http
POST /manual-adjustment
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Descripción:** Crea un nuevo ajuste manual de stock con transacción integrada automáticamente.

**Body:** `ManualAdjustmentRequest`
```json
{
  "product_id": "PROD_ABC_001",
  "new_quantity": 150.50,
  "reason": "Ajuste por conteo físico",
  "metadata": {
    "source": "physical_count",
    "operator": "warehouse_manager",
    "verification": "double_check",
    "location": "A1-B2",
    "counting_method": "scanner",
    "timestamp": "2025-09-08T14:30:00Z"
  }
}
```

**Ejemplos Adicionales de Requests:**

*Producto Dañado:*
```json
{
  "product_id": "PROD_DEF_002",
  "new_quantity": 0,
  "reason": "Producto dañado o vencido",
  "metadata": {
    "source": "quality_control",
    "damage_type": "expired",
    "damage_severity": "total",
    "disposal_method": "discard",
    "batch_number": "LOT_2025_001",
    "expiration_date": "2025-08-30"
  }
}
```

*Corrección por Error del Sistema:*
```json
{
  "product_id": "PROD_GHI_003",
  "new_quantity": 75.25,
  "reason": "Corrección por error del sistema",
  "metadata": {
    "source": "system_correction",
    "error_type": "sync_error",
    "original_transaction": "TXN_456789",
    "detection_method": "audit",
    "corrected_by": "admin_user",
    "approval_required": true
  }
}
```

**Response:** `ManualAdjustment`
```json
{
  "id": 45,
  "product_id": "PROD_ABC_001",
  "old_quantity": 100.00,
  "new_quantity": 150.50,
  "adjustment_date": "2025-09-06T12:00:00Z",
  "reason": "Ajuste por conteo físico",
  "metadata": {
    "source": "physical_count",
    "operator": "warehouse_manager",
    "verification": "double_checked"
  },
  "user_id": "USR_789"
}
```

**Errores:**
- `400`: "Invalid request body" - JSON malformado o datos inválidos
- `401`: "Unauthorized" - Token inválido
- `500`: "Error creating adjustment: {details}" - Error interno

### 2. Registrar Transacción de Stock 🔒
```http
POST /stock-transaction
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Descripción:** Registra una nueva transacción de movimiento de stock.

**Body:** `StockTransactionRequest`
```json
{
  "product_id": "PROD_ABC_001",
  "transaction_type": "PURCHASE",
  "quantity_change": 50.00,
  "unit_price": 25.50,
  "reference_type": "PURCHASE_ORDER",
  "reference_id": "PO_2025_001",
  "reason": "Compra de mercancía",
  "metadata": {
    "supplier": "SUP_001",
    "batch": "B2025090601"
  }
}
```

**Response:** `StockTransaction`
```json
{
  "id": 123,
  "product_id": "PROD_ABC_001",
  "transaction_type": "PURCHASE",
  "quantity_change": 50.00,
  "quantity_before": 100.00,
  "quantity_after": 150.00,
  "unit_price": 25.50,
  "total_value": 1275.00,
  "reference_type": "PURCHASE_ORDER",
  "reference_id": "PO_2025_001",
  "user_id": "USR_789",
  "transaction_date": "2025-09-06T12:00:00Z",
  "reason": "Compra de mercancía",
  "metadata": {
    "supplier": "SUP_001",
    "batch": "B2025090601"
  }
}
```

### 3. Obtener Historial de Ajustes de Producto 🔒
```http
GET /manual-adjustment/history/{product_id}?limit={limit}&offset={offset}
Authorization: Bearer <jwt_token>
```

**Parámetros:**
- `product_id` (path): ID del producto
- `limit` (query): Número máximo de registros (default: 50)
- `offset` (query): Número de registros a saltar (default: 0)

**Response:** `ProductAdjustmentHistory[]`
```json
[
  {
    "adjustment_id": 45,
    "adjustment_type": "MANUAL_QUANTITY",
    "old_value": 100.00,
    "new_value": 150.50,
    "value_change": 50.50,
    "user_id": "USR_789",
    "adjustment_date": "2025-09-06T12:00:00Z",
    "reason": "Ajuste por conteo físico",
    "metadata": {
      "source": "physical_count"
    },
    "related_transaction_id": 123
  }
]
```

### 4. Obtener Historial de Transacciones de Stock 🔒
```http
GET /stock-transaction/history/{product_id}?limit={limit}&offset={offset}
Authorization: Bearer <jwt_token>
```

**Parámetros:**
- `product_id` (path): ID del producto
- `limit` (query): Número máximo de registros (default: 50)
- `offset` (query): Número de registros a saltar (default: 0)

**Response:** `StockTransactionHistory[]`
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
    "reason": "Ajuste por conteo físico"
  }
]
```

### 5. Validar Consistencia de Stock 🔒
```http
GET /stock-transaction/validate-consistency?product_id={product_id}
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `product_id` (opcional): ID específico del producto. Si se omite, valida todos los productos.

**Response:** `StockConsistencyReport[]`
```json
[
  {
    "product_id": "PROD_ABC_001",
    "product_name": "Producto ABC",
    "current_stock": 150.50,
    "calculated_stock": 150.50,
    "difference": 0.00,
    "is_consistent": true,
    "total_purchases": 5,
    "total_sales": 3,
    "total_adjustments": 2,
    "total_inventories": 1,
    "recommendation": "Stock is consistent"
  }
]
```

### 6. Obtener Reporte de Discrepancias de Inventario 🔒
```http
GET /inventory/discrepancies?date_from={date}&date_to={date}
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `date_from` (opcional): Fecha inicio en formato "YYYY-MM-DD" (default: hace 30 días)
- `date_to` (opcional): Fecha fin en formato "YYYY-MM-DD" (default: hoy)

**Response:** `InventoryDiscrepancyReport[]`
```json
[
  {
    "product_id": "PROD_ABC_001",
    "product_name": "Producto ABC",
    "category_name": "Categoría A",
    "discrepancies_count": 2,
    "total_variance": 15.50,
    "avg_variance": 7.75,
    "max_variance": 10.00,
    "last_inventory_date": "2025-09-01T10:00:00Z",
    "needs_attention": false
  }
]
```

### 7. Verificar Integridad del Sistema 🔒
```http
GET /system/integrity-check
Authorization: Bearer <jwt_token>
```

**Descripción:** Verifica la integridad completa entre ajustes manuales y transacciones de stock.

**Response:** `SystemIntegrityReport`
```json
{
  "integration_status": "OK",
  "verification_results": {
    "adjustments_without_transactions": 0,
    "orphaned_adjustment_transactions": 0,
    "inconsistent_quantities": 0
  },
  "recommendations": [
    "System integrity is optimal",
    "All adjustments have corresponding transactions",
    "No orphaned transactions found"
  ],
  "verified_at": "2025-09-06T12:00:00Z"
}
```

### 8. Obtener Transacciones por Rango de Fechas 🔒
```http
GET /stock-transaction/by-date?start_date={date}&end_date={date}&type={type}&limit={limit}&offset={offset}
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `start_date` (requerido): Fecha inicio "YYYY-MM-DD"
- `end_date` (requerido): Fecha fin "YYYY-MM-DD"
- `type` (opcional): Tipo de transacción ("PURCHASE", "SALE", "ADJUSTMENT", etc.)
- `limit` (opcional): Límite de registros (default: 50)
- `offset` (opcional): Offset de registros (default: 0)

**Response:** `StockTransactionHistory[]`

### 9. Crear Inventario Masivo 🔒
```http
POST /inventory
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Descripción:** Crea un nuevo inventario masivo con múltiples productos y transacciones automáticas integradas.

**Body:** `InventoryRequest`
```json
{
  "action": "insert",
  "check_date": "2025-09-06T12:00:00Z",
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
    }
  ]
}
```

**Response:** `{ "inventory_id": number, "message": string }`
```json
{
  "inventory_id": 21,
  "message": "Inventory created successfully with 3 items"
}
```

**Errores:**
- `400`: "Invalid request body" - JSON malformado o datos inválidos
- `401`: "Unauthorized" - Token inválido
- `500`: "Error creating inventory: {details}" - Error interno

### 10. Invalidar Inventario 🔒
```http
POST /inventory/invalidate
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Descripción:** Invalida un inventario existente y revierte automáticamente sus efectos en el stock.

**Body:** `InventoryRequest`
```json
{
  "action": "invalidate",
  "id_inventory": 21
}
```

**Response:** `{ "inventory_id": number, "message": string }`
```json
{
  "inventory_id": 21,
  "message": "Inventory invalidated successfully"
}
```

### 11. Obtener Lista de Inventarios 🔒
```http
GET /inventory?page={page}&page_size={size}
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `page_size` (opcional): Elementos por página (default: 10)

**Response:** `Inventory[]`
```json
[
  {
    "id": 21,
    "user_id": "USR_789",
    "check_date": "2025-09-06T12:00:00Z",
    "state": true
  },
  {
    "id": 20,
    "user_id": "USR_789", 
    "check_date": "2025-09-05T10:30:00Z",
    "state": false
  }
]
```

### 12. Obtener Inventario Detallado por ID 🔒
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
    "id": 21,
    "user_id": "USR_789",
    "check_date": "2025-09-06T12:00:00Z",
    "state": true
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

### 13. Obtener Transacción por ID 🔒
```http
GET /stock-transaction/{id}
Authorization: Bearer <jwt_token>
```

**Parámetros:**
- `id` (path): ID de la transacción

**Response:** `StockTransactionHistory`

---

## 📋 Códigos de Respuesta

| Código | Descripción | Cuándo se produce |
|--------|-------------|-------------------|
| `200` | OK | Operación exitosa |
| `400` | Bad Request | Parámetros inválidos, JSON malformado o validación fallida |
| `401` | Unauthorized | Token JWT inválido o faltante |
| `404` | Not Found | Recurso no encontrado |
| `500` | Internal Server Error | Error del servidor o servicios internos |

---

## ⚡ Validaciones y Restricciones

### Campos Obligatorios

**ManualAdjustmentRequest:**
- `product_id`: string (no vacío, debe existir en products)
- `new_quantity`: number (≥ 0)
- `reason`: string (no vacío) - *Se recomienda usar valores de DEFAULT_REASONS*
- `metadata`: object (opcional) - *Se recomienda usar plantillas de DEFAULT_METADATA_TEMPLATES*

**StockTransactionRequest:**
- `product_id`: string (no vacío, debe existir en products)
- `transaction_type`: string (valores válidos: "PURCHASE", "SALE", "ADJUSTMENT", "INVENTORY", "INITIAL", "LOSS", "FOUND")
- `quantity_change`: number (puede ser negativo para salidas)

### Validaciones de Frontend Recomendadas

**Para `reason` en Ajustes Manuales:**
```javascript
const validateReason = (reason) => {
  const validReasons = Object.values(DEFAULT_REASONS.MANUAL_ADJUSTMENT);
  return reason && reason.length >= 5 && reason.length <= 200;
};

// Validación con sugerencias
const suggestReason = (reasonType) => {
  return DEFAULT_REASONS.MANUAL_ADJUSTMENT[reasonType] || 
         "Especificar motivo del ajuste";
};
```

**Para `metadata` estructura mínima:**
```javascript
const validateMetadata = (metadata, reasonType) => {
  const required = {
    source: true,
    timestamp: true
  };
  
  // Validaciones específicas por tipo
  const typeValidations = {
    PHYSICAL_COUNT: ['operator', 'location'],
    DAMAGED_GOODS: ['damage_type', 'disposal_method'],
    SYSTEM_ERROR: ['error_type', 'detection_method']
  };
  
  const requiredFields = typeValidations[reasonType] || [];
  return requiredFields.every(field => metadata[field]);
};
```

### Tipos de Transacción Válidos
- **PURCHASE**: Entrada por compra
- **SALE**: Salida por venta
- **ADJUSTMENT**: Ajuste manual
- **INVENTORY**: Conteo de inventario
- **INITIAL**: Stock inicial
- **LOSS**: Pérdida/merma
- **FOUND**: Encontrado/sobrante

### InventoryRequest:**
- `action`: string ("insert" o "invalidate") (requerido)
- `check_date`: string (ISO 8601) (requerido para insert)
- `details`: InventoryItemInput[] (requerido para insert)

**InventoryItemInput:**
- `product_id`: string (no vacío, debe existir en products)
- `quantity_checked`: number (≥ 0)

### Reglas de Negocio
1. **Cantidad después del movimiento** debe ser ≥ 0
2. **Ajustes manuales** generan automáticamente una transacción de stock
3. **Inventarios masivos** generan automáticamente múltiples transacciones de stock
4. **Consistencia obligatoria**: quantity_after = quantity_before + quantity_change
5. **Auditoría completa**: Todos los movimientos se registran con trazabilidad
6. **Invalidación de inventarios** revierte automáticamente todos los cambios

---

## 🔐 Autenticación

**Todos los endpoints requieren autenticación JWT** mediante header:
```
Authorization: Bearer <jwt_token>
```

- El token debe contener claims válidos (`*models.TokenClaims`)
- El `user_id` del token se asigna automáticamente a ajustes y transacciones
- Token inválido o faltante retorna `401 Unauthorized`

---

## 🚀 Funciones de Base de Datos Optimizadas

### Funciones Principales (Nuevos Nombres)
1. **`manage_stock_adjustment`** - Función integrada para ajustes manuales (retorna `transaction_id`)
2. **`manage_inventory`** - Función integrada para inventarios masivos (retorna `inventory_id`)
3. **`register_stock_movement`** - Registrar transacciones de stock (retorna `transaction_id`)
4. **`get_adjustment_history`** - Historial de ajustes
5. **`get_stock_history`** - Historial de transacciones
6. **`validate_stock_integrity`** - Validar consistencia
7. **`get_inventory_discrepancies`** - Reportes de discrepancias
8. **`check_system_integrity`** - Verificar integridad del sistema

### Beneficios de la Nueva Implementación
- ✅ **Integración automática** entre ajustes y transacciones
- ✅ **Integración automática** entre inventarios y transacciones  
- ✅ **Naming simplificado** y específico
- ✅ **Consistencia arquitectónica** total (todas son funciones)
- ✅ **Un solo camino** para cada operación
- ✅ **Consistencia garantizada** de datos
- ✅ **Auditoría completa** automática
- ✅ **Performance optimizada**
- ✅ **IDs de retorno** para mejor trazabilidad

---

## 📝 Notas Técnicas

1. **Integración automática**: Los ajustes manuales crean automáticamente transacciones de stock
2. **Inventarios masivos**: Los inventarios crean automáticamente múltiples transacciones de stock
3. **Consistencia arquitectónica**: Todas las operaciones principales son funciones (no procedimientos)
4. **Trazabilidad completa**: Todas las operaciones son auditadas y retornan IDs
5. **Consistencia garantizada**: Validaciones a nivel de base de datos
6. **Metadata flexible**: Soporte para información adicional en formato JSON
7. **Enriquecimiento automático**: Los historiales incluyen nombres de productos y usuarios
8. **Invalidación segura**: Los inventarios pueden invalidarse revirtiendo automáticamente cambios

---

## 🎯 Ejemplos de Uso

### Flujo Típico: Ajuste por Conteo Físico
1. **Realizar conteo físico** del producto
2. **POST /manual_adjustment/** con la nueva cantidad usando valores por defecto:
```javascript
const adjustmentRequest = {
  product_id: "PROD_ABC_001",
  new_quantity: 150.50,
  reason: "Ajuste por conteo físico", // Valor por defecto
  metadata: {
    source: "physical_count",
    operator: "warehouse_manager", 
    verification: "double_check",
    location: "A1-B2",
    counting_method: "scanner",
    timestamp: new Date().toISOString()
  }
};
```
3. **Sistema crea automáticamente** la transacción de stock correspondiente
4. **GET /manual_adjustment/product/{product_id}/history** para verificar el historial

### Flujo Típico: Producto Dañado
1. **Detectar producto dañado** durante inspección
2. **POST /manual_adjustment/** con cantidad 0:
```javascript
const damagedProductRequest = {
  product_id: "PROD_DEF_002",
  new_quantity: 0,
  reason: "Producto dañado o vencido", // Valor por defecto
  metadata: {
    source: "quality_control",
    damage_type: "expired",
    damage_severity: "total",
    disposal_method: "discard",
    batch_number: "LOT_2025_001"
  }
};
```

### Flujo con Helper Function (Frontend)
```javascript
// Usando la función helper recomendada
const adjustment1 = createAdjustmentRequest(
  "PROD_ABC_001", 
  150, 
  "PHYSICAL_COUNT",
  undefined, // usar reason por defecto
  "PHYSICAL_COUNT",
  { operator: "john_doe", location: "warehouse_a" }
);

const adjustment2 = createAdjustmentRequest(
  "PROD_DEF_002", 
  0, 
  "DAMAGED_GOODS",
  "Producto vencido - revisar lote completo",
  "DAMAGED_GOODS",
  { damage_type: "expired", batch_affected: "LOT_001" }
);
```

### Flujo Típico: Inventario Masivo
1. **Realizar conteo físico** de múltiples productos
2. **POST /inventory** con la lista de productos y cantidades
3. **Sistema crea automáticamente** el inventario y todas las transacciones
4. **GET /inventory/{id}** para verificar los detalles del inventario
5. **GET /inventory** para ver la lista de inventarios

### Flujo Típico: Compra de Mercancía
1. **POST /stock-transaction** con type="PURCHASE"
2. **Sistema actualiza** automáticamente las cantidades
3. **GET /stock-transaction/history/{product_id}** para ver el historial

### Flujo Típico: Invalidación de Inventario
1. **Identificar inventario** con problemas
2. **POST /inventory/invalidate** con el ID del inventario
3. **Sistema revierte automáticamente** todos los cambios de stock
4. **GET /system/integrity-check** para verificar la corrección

### Verificación de Integridad
1. **GET /system/integrity-check** para verificar estado general
2. **GET /stock-transaction/validate-consistency** para validar productos específicos

---

**Última actualización**: 8 de Septiembre de 2025  
**Versión**: 2.2 (Frontend Defaults + Completamente Optimizada)  
**Estado**: ✅ Sistema completamente limpio y optimizado + Valores por defecto para Frontend  
**Basado en**: Nueva implementación con funciones optimizadas, consistencia total y helpers para frontend
