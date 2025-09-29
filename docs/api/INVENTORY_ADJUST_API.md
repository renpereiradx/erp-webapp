# 📦 Guía de Integración API - Sistema de Inventarios y Ajustes

## 🎯 Descripción General

Esta documentación especifica la API del sistema de inventarios y ajustes manuales implementada en el sistema de business management. Proporciona información técnica precisa sobre endpoints, modelos de datos, códigos de respuesta y validaciones basada en la implementación actual del código después de la optimización del 15 de Septiembre 2025.

**🔥 NUEVA IMPLEMENTACIÓN OPTIMIZADA**: Sistema completamente limpio con funciones integradas y naming simplificado.

**🚀 ACTUALIZACIÓN CRÍTICA**: Todos los endpoints ahora requieren metadatos obligatorios para garantizar trazabilidad completa.

**📋 METADATOS OBLIGATORIOS**: Sistema diseñado para auditoría y trazabilidad completa de todas las operaciones.

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

### Inventory (CON METADATA OBLIGATORIA)
```typescript
interface Inventory {
  id: number;                    // ID único del inventario (int)
  user_id: string;               // ID del usuario que realizó el inventario
  check_date: string;            // Fecha del conteo (ISO 8601)
  state: boolean;                // Estado del inventario (activo/inválido)
  metadata: object;              // Metadatos adicionales (JSON) - CAMPO OBLIGATORIO
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
  metadata: object;              // Metadatos obligatorios
}

interface StockTransactionRequest {
  product_id: string;            // ID del producto (requerido)
  transaction_type: string;      // Tipo de transacción (requerido)
  quantity_change: number;       // Cambio en cantidad (requerido)
  unit_price?: number;           // Precio unitario (opcional)
  reference_type?: string;       // Tipo de referencia (opcional)
  reference_id?: string;         // ID de referencia (opcional)
  reason?: string;               // Motivo (opcional)
  metadata: object;              // Metadatos obligatorios
}

interface InventoryRequest {
  items: InventoryItemInput[];   // Items del inventario (requerido)
  metadata: object;              // Metadatos obligatorios
}

interface InventoryItemInput {
  product_id: string;            // ID del producto (requerido)
  quantity_checked: number;      // Cantidad contada (requerido)
}

interface InvalidateInventoryRequest {
  // Se usa el ID en la URL, no hay body necesario
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
POST /manual_adjustment/
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
POST /stock-transactions/
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
    "batch": "B2025090601",
    "timestamp": "2025-09-15T12:00:00Z",
    "operator": "purchasing_manager",
    "source": "purchase_order"
  }
}
```

### 3. Obtener Historial de Ajustes de Producto 🔒
```http
GET /manual_adjustment/product/{productId}/history?limit={limit}&offset={offset}
Authorization: Bearer <jwt_token>
```

**Parámetros:**
- `productId` (path): ID del producto
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
      "source": "physical_count",
      "timestamp": "2025-09-15T12:00:00Z",
      "operator": "warehouse_manager",
      "location": "A1-B2",
      "counting_method": "scanner",
      "verification": "double_check"
    },
    "related_transaction_id": 123
  }
]
```

### 4. Obtener Historial de Transacciones de Stock 🔒
```http
GET /stock-transactions/product/{product_id}?limit={limit}&offset={offset}
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
    "reason": "Ajuste por conteo físico",
    "metadata": {
      "source": "manual_adjustment",
      "timestamp": "2025-09-15T12:00:00Z",
      "operator": "warehouse_manager",
      "reason_category": "physical_count",
      "approval_level": "supervisor"
    }
  }
]
```

### 5. Validar Consistencia de Stock 🔒
```http
GET /stock-transactions/validate-consistency?product_id={product_id}
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
    "recommendation": "Stock is consistent",
    "metadata": {
      "analysis_timestamp": "2025-09-15T12:00:00Z",
      "operator": "system",
      "source": "consistency_check",
      "validation_method": "automatic"
    }
  }
]
```

### 6. Obtener Reporte de Discrepancias de Inventario 🔒
```http
GET /stock-transactions/discrepancy-report?date_from={date}&date_to={date}
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
    "needs_attention": false,
    "metadata": {
      "report_timestamp": "2025-09-15T12:00:00Z",
      "operator": "system",
      "source": "discrepancy_analysis",
      "analysis_period": "30_days",
      "criteria": "variance_threshold"
    }
  }
]
```

### 7. Verificar Integridad del Sistema 🔒
```http
GET /manual_adjustment/integration/verify
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
  "verified_at": "2025-09-15T12:00:00Z",
  "metadata": {
    "verification_timestamp": "2025-09-15T12:00:00Z",
    "operator": "system",
    "source": "integrity_check",
    "check_type": "full_system_audit",
    "validation_method": "automated"
  }
}
```

### 8. Obtener Transacciones por Rango de Fechas 🔒
```http
GET /stock-transactions/by-date?start_date={date}&end_date={date}&type={type}&limit={limit}&offset={offset}
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `start_date` (requerido): Fecha inicio "YYYY-MM-DD"
- `end_date` (requerido): Fecha fin "YYYY-MM-DD"
- `type` (opcional): Tipo de transacción ("PURCHASE", "SALE", "ADJUSTMENT", etc.)
- `limit` (opcional): Límite de registros (default: 50)
- `offset` (opcional): Offset de registros (default: 0)

**Response:** `StockTransactionHistory[]`

### 9. Crear Inventario 🔒
```http
POST /inventory/
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Descripción:** Crea un nuevo inventario con múltiples productos y transacciones automáticas integradas. **Metadatos son obligatorios** para garantizar trazabilidad completa.

**Body:** `InventoryRequest`
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
    },
    {
      "product_id": "PROD_GHI_003",
      "quantity_checked": 200
    }
  ],
  "metadata": {
    "source": "physical_count",
    "operator": "warehouse_manager",
    "location": "main_warehouse",
    "equipment": "barcode_scanner",
    "timestamp": "2025-09-15T12:00:00Z",
    "notes": "Monthly inventory check"
  }
}
```

**Response:** `{ "message": string }`
```json
{
  "message": "Inventory added"
}
```

**Errores:**
- `400`: "Invalid request body" - JSON malformado, datos inválidos o metadata faltante
- `401`: "Unauthorized" - Token inválido
- `500`: "Error creating inventory: {details}" - Error interno

### 10. Invalidar Inventario 🔒
```http
PUT /inventory/{id}
Authorization: Bearer <jwt_token>
```

**Descripción:** Invalida un inventario existente y revierte automáticamente sus efectos en el stock.

**Parámetros:**
- `id` (path): ID del inventario a invalidar

**Body:** No requiere body

**Response:** `{ "message": string }`
```json
{
  "message": "Inventory invalidated"
}
```

### 11. Obtener Lista de Inventarios 🔒
```http
GET /inventory/{page}/{pageSize}
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (path): Número de página
- `pageSize` (path): Elementos por página

**Response:** `Inventory[]`
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
      "location": "main_warehouse",
      "counting_method": "barcode_scanner",
      "verification": "double_check",
      "timestamp": "2025-09-15T12:00:00Z"
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
      "location": "secondary_warehouse",
      "counting_method": "manual",
      "verification": "single_check",
      "timestamp": "2025-09-14T10:30:00Z",
      "invalidation_reason": "counting_error"
    }
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
    "check_date": "2025-09-15T12:00:00Z",
    "state": true,
    "metadata": {
      "source": "physical_count",
      "operator": "warehouse_manager",
      "location": "main_warehouse",
      "counting_method": "barcode_scanner",
      "verification": "double_check",
      "timestamp": "2025-09-15T12:00:00Z",
      "total_items": 2,
      "total_value": 18750.00
    }
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
GET /stock-transactions/{id}
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
- `metadata`: object (obligatorio) - *Debe incluir al menos campos mínimos requeridos*

**StockTransactionRequest:**
- `product_id`: string (no vacío, debe existir en products)
- `transaction_type`: string (valores válidos: "PURCHASE", "SALE", "ADJUSTMENT", "INVENTORY", "INITIAL", "LOSS", "FOUND")
- `quantity_change`: number (puede ser negativo para salidas)
- `metadata`: object (obligatorio) - *Debe incluir información de trazabilidad*

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

**Para `metadata` estructura obligatoria:**
```javascript
const validateMetadata = (metadata, operationType) => {
  // Campos obligatorios para todos los tipos
  const required = {
    source: true,
    timestamp: true,
    operator: true
  };
  
  // Validaciones específicas por tipo de operación
  const typeValidations = {
    PHYSICAL_COUNT: ['location', 'counting_method'],
    DAMAGED_GOODS: ['damage_type', 'disposal_method'],
    SYSTEM_ERROR: ['error_type', 'detection_method'],
    INVENTORY_CHECK: ['equipment', 'verification_method'],
    MANUAL_ADJUSTMENT: ['reason_category', 'approval_level']
  };
  
  // Verificar campos obligatorios básicos
  for (const field in required) {
    if (!metadata[field] || metadata[field] === '') {
      return { valid: false, missing: field };
    }
  }
  
  // Verificar campos específicos del tipo
  const requiredFields = typeValidations[operationType] || [];
  for (const field of requiredFields) {
    if (!metadata[field] || metadata[field] === '') {
      return { valid: false, missing: field };
    }
  }
  
  return { valid: true };
};

// Ejemplo de validación antes de enviar
const metadataValidation = validateMetadata(inventoryMetadata, 'PHYSICAL_COUNT');
if (!metadataValidation.valid) {
  throw new Error(`Campo requerido faltante: ${metadataValidation.missing}`);
}
```

### Tipos de Transacción Válidos
- **PURCHASE**: Entrada por compra
- **SALE**: Salida por venta
- **ADJUSTMENT**: Ajuste manual
- **INVENTORY**: Conteo de inventario
- **INITIAL**: Stock inicial
- **LOSS**: Pérdida/merma
- **FOUND**: Encontrado/sobrante

### InventoryRequest:
- `items`: InventoryItemInput[] (requerido)
- `metadata`: object (obligatorio) - Metadatos completos de trazabilidad

**InventoryItemInput:**
- `product_id`: string (no vacío, debe existir en products)
- `quantity_checked`: number (≥ 0)

### Campos Obligatorios en Metadata
Todos los metadatos deben incluir como mínimo:
- `source`: string (origen de la operación)
- `timestamp`: string (fecha y hora ISO 8601)
- `operator`: string (identificador del operador)
- Campos específicos según el tipo de operación

### Reglas de Negocio
1. **Cantidad después del movimiento** debe ser ≥ 0
2. **Ajustes manuales** generan automáticamente una transacción de stock
3. **Inventarios** generan automáticamente múltiples transacciones de stock
4. **Consistencia obligatoria**: quantity_after = quantity_before + quantity_change
5. **Auditoría completa**: Todos los movimientos se registran con trazabilidad
6. **Invalidación de inventarios** revierte automáticamente todos los cambios
7. **Metadatos obligatorios**: Todas las operaciones requieren metadatos completos para trazabilidad
8. **Validación de metadatos**: El sistema valida que los metadatos contengan los campos mínimos requeridos
9. **Trazabilidad garantizada**: Cada operación debe incluir operador, timestamp y origen

---

## � Metadatos Obligatorios

### Estructura Mínima Requerida
Todos los metadatos deben incluir obligatoriamente:

```typescript
interface MetadataMinima {
  source: string;              // Origen: "physical_count", "system_correction", etc.
  timestamp: string;           // Fecha y hora ISO 8601
  operator: string;            // ID o nombre del operador
}
```

### Plantillas de Metadatos Obligatorias
El sistema ahora requiere metadatos específicos según el tipo de operación:

```typescript
const REQUIRED_METADATA_TEMPLATES = {
  // Inventario Físico (OBLIGATORIO)
  PHYSICAL_COUNT: {
    source: "physical_count",
    timestamp: string,           // OBLIGATORIO
    operator: string,            // OBLIGATORIO
    location: string,            // OBLIGATORIO
    counting_method: string,     // OBLIGATORIO: "manual", "scanner", "rfid"
    verification: string,        // OBLIGATORIO: "single_check", "double_check"
    equipment?: string,          // Opcional: equipo utilizado
    notes?: string              // Opcional: observaciones
  },
  
  // Ajuste Manual (OBLIGATORIO)
  MANUAL_ADJUSTMENT: {
    source: "manual_adjustment",
    timestamp: string,           // OBLIGATORIO
    operator: string,            // OBLIGATORIO
    reason_category: string,     // OBLIGATORIO: categoría del motivo
    approval_level: string,      // OBLIGATORIO: nivel de aprobación
    supervisor?: string,         // Opcional: supervisor que aprueba
    documentation?: string      // Opcional: documentación de respaldo
  },
  
  // Transacción de Stock (OBLIGATORIO)
  STOCK_TRANSACTION: {
    source: "stock_movement",
    timestamp: string,           // OBLIGATORIO
    operator: string,            // OBLIGATORIO
    transaction_origin: string,  // OBLIGATORIO: origen de la transacción
    verification_method: string, // OBLIGATORIO: método de verificación
    reference_document?: string, // Opcional: documento de referencia
    batch_info?: object         // Opcional: información de lote
  }
};
```

### Validación de Frontend Obligatoria
```javascript
function validateRequiredMetadata(metadata, operationType) {
  const baseRequired = ['source', 'timestamp', 'operator'];
  
  const typeSpecific = {
    'PHYSICAL_COUNT': ['location', 'counting_method', 'verification'],
    'MANUAL_ADJUSTMENT': ['reason_category', 'approval_level'],
    'STOCK_TRANSACTION': ['transaction_origin', 'verification_method']
  };
  
  // Validar campos base
  for (const field of baseRequired) {
    if (!metadata[field] || metadata[field].trim() === '') {
      throw new Error(`Campo obligatorio faltante: ${field}`);
    }
  }
  
  // Validar campos específicos
  const specificFields = typeSpecific[operationType] || [];
  for (const field of specificFields) {
    if (!metadata[field] || metadata[field].trim() === '') {
      throw new Error(`Campo específico obligatorio faltante: ${field}`);
    }
  }
  
  // Validar formato de timestamp
  if (!isValidISO8601(metadata.timestamp)) {
    throw new Error('timestamp debe estar en formato ISO 8601');
  }
  
  return true;
}

function isValidISO8601(dateString) {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return iso8601Regex.test(dateString) && !isNaN(Date.parse(dateString));
}
```

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
2. **Metadatos obligatorios**: Todos los inventarios y ajustes requieren metadatos completos
3. **Validación estricta**: El sistema valida que los metadatos contengan todos los campos requeridos
4. **Trazabilidad garantizada**: Cada operación incluye operador, timestamp y origen obligatoriamente
5. **Sin compatibilidad legacy**: Solo se acepta el formato con metadatos para garantizar auditoría completa
6. **Consistencia garantizada**: Validaciones a nivel de base de datos y aplicación
7. **Metadata estructurada**: Soporte para información específica según tipo de operación
8. **Enriquecimiento automático**: Los historiales incluyen nombres de productos y usuarios
9. **Invalidación segura**: Los inventarios pueden invalidarse revirtiendo automáticamente cambios
10. **Endpoints RESTful**: URLs consistentes con convenciones REST (/inventory/, /manual_adjustment/, etc.)

---

## 🎯 Ejemplos de Uso Actualizados

### Inventario con Metadatos Completos (OBLIGATORIO)
```javascript
// Inventario con metadata completa y validación
const createValidatedInventoryRequest = (items, operator, location) => {
  // Validar parámetros requeridos
  if (!operator || !location) {
    throw new Error('Operador y ubicación son obligatorios');
  }
  
  const inventoryRequest = {
    items: items,
    metadata: {
      source: "physical_count",
      timestamp: new Date().toISOString(),
      operator: operator,
      location: location,
      counting_method: "barcode_scanner",
      verification: "double_check",
      equipment: "handheld_scanner_001",
      notes: "Inventory count performed with verification protocol",
      session_id: generateSessionId(),
      environmental_conditions: {
        temperature: "22°C",
        humidity: "45%"
      }
    }
  };
  
  // Validar antes de enviar
  validateRequiredMetadata(inventoryRequest.metadata, 'PHYSICAL_COUNT');
  
  return inventoryRequest;
};

// Uso del inventario validado
const items = [
  { product_id: "PROD_ABC_001", quantity_checked: 150 },
  { product_id: "PROD_DEF_002", quantity_checked: 75 }
];

const validatedRequest = createValidatedInventoryRequest(
  items, 
  "warehouse_manager_001", 
  "main_warehouse_section_a"
);

// Enviar al endpoint
fetch('/inventory/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(validatedRequest)
});
```

### Ajuste Manual con Metadatos Obligatorios
```javascript
const createValidatedAdjustmentRequest = (productId, newQuantity, reasonCategory, operator) => {
  const adjustmentRequest = {
    product_id: productId,
    new_quantity: newQuantity,
    reason: "Ajuste por conteo físico con discrepancia",
    metadata: {
      source: "manual_adjustment",
      timestamp: new Date().toISOString(),
      operator: operator,
      reason_category: reasonCategory,
      approval_level: "supervisor",
      supervisor: "supervisor_001",
      documentation: "FORM_ADJ_2025_001",
      previous_count: {
        system_quantity: 100,
        physical_count: newQuantity,
        variance: newQuantity - 100
      },
      verification_steps: [
        "initial_count",
        "supervisor_verification", 
        "final_approval"
      ]
    }
  };
  
  // Validar metadatos obligatorios
  validateRequiredMetadata(adjustmentRequest.metadata, 'MANUAL_ADJUSTMENT');
  
  return adjustmentRequest;
};
```

### Función Helper para Validación de Metadatos
```javascript
class MetadataValidator {
  static validateInventoryMetadata(metadata) {
    const required = ['source', 'timestamp', 'operator', 'location', 'counting_method', 'verification'];
    
    for (const field of required) {
      if (!metadata[field] || metadata[field].trim() === '') {
        throw new Error(`Campo obligatorio faltante en inventario: ${field}`);
      }
    }
    
    // Validaciones específicas
    const validCountingMethods = ['manual', 'barcode_scanner', 'rfid', 'voice_picking'];
    if (!validCountingMethods.includes(metadata.counting_method)) {
      throw new Error(`Método de conteo inválido: ${metadata.counting_method}`);
    }
    
    const validVerifications = ['single_check', 'double_check', 'triple_check'];
    if (!validVerifications.includes(metadata.verification)) {
      throw new Error(`Método de verificación inválido: ${metadata.verification}`);
    }
    
    return true;
  }
  
  static validateAdjustmentMetadata(metadata) {
    const required = ['source', 'timestamp', 'operator', 'reason_category', 'approval_level'];
    
    for (const field of required) {
      if (!metadata[field] || metadata[field].trim() === '') {
        throw new Error(`Campo obligatorio faltante en ajuste: ${field}`);
      }
    }
    
    const validApprovalLevels = ['operator', 'supervisor', 'manager', 'admin'];
    if (!validApprovalLevels.includes(metadata.approval_level)) {
      throw new Error(`Nivel de aprobación inválido: ${metadata.approval_level}`);
    }
    
    return true;
  }
}

// Uso de la validación
try {
  MetadataValidator.validateInventoryMetadata(inventoryMetadata);
  // Proceder con la operación
} catch (error) {
  console.error('Validación fallida:', error.message);
  // Mostrar error al usuario
}
```

---

**Última actualización**: 15 de Septiembre de 2025  
**Versión**: 4.0 (Metadatos Obligatorios - Trazabilidad Completa)  
**Estado**: ✅ Sistema con metadatos obligatorios para garantizar auditoría y trazabilidad total  
**Basado en**: Implementación con metadatos obligatorios, sin compatibilidad legacy, validación estricta
