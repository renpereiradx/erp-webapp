# Purchase Payments API - Frontend Integration Guide

## 📋 Resumen General

Esta documentación detalla los endpoints del sistema de pagos de compras, diseñado siguiendo el mismo patrón robusto del sistema de ventas. El sistema permite gestionar órdenes de compra mejoradas, procesar pagos, previsualizar cancelaciones y obtener estadísticas financieras.

## 🔐 Autenticación

**Todos los endpoints requieren autenticación JWT.**
```
Authorization: Bearer <token>
```

## 🛠 Endpoints Disponibles

### 1. Crear Orden de Compra Mejorada

**POST** `/purchase/enhanced`

Crea una nueva orden de compra con capacidades mejoradas de pago, divisa y metadatos.

#### Request Body
```json
{
  "supplier_id": 1,
  "status": "pending",
  "product_details": [
    {
      "product_id": "PROD001",
      "quantity": 10.5,
      "unit_price": 25.99,
      "tax_rate_id": 1,
      "profit_pct": 0.15
    }
  ],
  "payment_method_id": 1,
  "currency_id": 1,
  "metadata": {
    "purchase_priority": "high",
    "delivery_date": "2025-09-15",
    "notes": "Urgent order for new product line"
  }
}
```

#### Response (Success)
```json
{
  "success": true,
  "purchase_order_id": 42,
  "total_amount": 273.45,
  "items_processed": 1,
  "message": "Purchase order created successfully"
}
```

#### Response (Error)
```json
{
  "success": false,
  "total_amount": 0,
  "items_processed": 0,
  "message": "Validation failed",
  "error": "supplier with ID 999 not found"
}
```

### 2. Procesar Pago de Compra

**POST** `/purchase/payment/process`

Procesa un pago total o parcial para una orden de compra existente.

#### Request Body
```json
{
  "purchase_order_id": 42,
  "amount_paid": 150.00,
  "payment_reference": "PAY-2025-08-001",
  "payment_notes": "First partial payment - 50% advance"
}
```

#### Response (Success)
```json
{
  "success": true,
  "payment_id": 15,
  "purchase_order_id": 42,
  "payment_details": {
    "amount_paid": 150.00,
    "outstanding_amount": 123.45,
    "total_paid_so_far": 150.00,
    "total_order_amount": 273.45,
    "payment_status": "partial",
    "order_fully_paid": false
  },
  "message": "Payment processed successfully",
  "processed_at": "2025-08-23T20:15:30Z",
  "processed_by": "user123"
}
```

#### Response (Error)
```json
{
  "success": false,
  "purchase_order_id": 42,
  "message": "Payment processing failed",
  "error_code": "INVALID_AMOUNT",
  "details": "Payment amount exceeds outstanding balance"
}
```

### 3. Preview de Cancelación de Compra

**GET** `/purchase/{id}/preview-cancellation`

Genera un análisis detallado del impacto de cancelar una orden de compra específica.

#### Path Parameters
- `id`: ID de la orden de compra (int)

#### Response (Success)
```json
{
  "success": true,
  "purchase_info": {
    "purchase_order_id": 42,
    "current_status": "pending",
    "total_amount": 273.45,
    "order_date": "2025-08-23T18:30:00Z",
    "created_by": "user123",
    "can_be_cancelled": true
  },
  "impact_analysis": {
    "total_items": 1,
    "payments_to_cancel": 1,
    "total_to_reverse": 150.00,
    "stock_adjustments_required": 1,
    "price_updates_required": 0,
    "requires_payment_reversal": true,
    "requires_stock_adjustment": true,
    "requires_price_reversion": false
  },
  "recommendations": {
    "action": "proceed_with_caution",
    "backup_recommended": true,
    "notify_supplier": true,
    "estimated_complexity": "medium"
  },
  "generated_at": "2025-08-23T20:20:15Z"
}
```

#### Response (Error)
```json
{
  "success": false,
  "generated_at": "2025-08-23T20:20:15Z",
  "error": "Purchase order with ID 99999 not found"
}
```

### 4. Cancelación Mejorada de Compra

**PUT** `/purchase/cancel-enhanced/{id}`

Cancela una orden de compra con reversión automática de pagos e inventario.

#### Path Parameters
- `id`: ID de la orden de compra (string)

#### Response (Success)
```json
{
  "success": true,
  "message": "Purchase order cancelled successfully",
  "purchase_id": "42",
  "cancelled_at": "2025-08-23T20:25:30Z",
  "actions_performed": [
    "payment_reversed",
    "stock_adjusted",
    "supplier_notified"
  ]
}
```

### 5. Estadísticas de Pagos de Compras

**GET** `/purchase/payment/statistics`

Obtiene estadísticas consolidadas de pagos de compras para análisis financiero.

#### Query Parameters (Opcionales)
- `start_date`: Fecha de inicio (YYYY-MM-DD)
- `end_date`: Fecha de fin (YYYY-MM-DD) 
- `supplier_id`: ID del proveedor específico

#### Example Request
```
GET /purchase/payment/statistics?start_date=2025-08-01&end_date=2025-08-31&supplier_id=1
```

#### Response (Success)
```json
{
  "period": {
    "start_date": "2025-08-01",
    "end_date": "2025-08-31",
    "supplier_id": 1
  },
  "order_statistics": {
    "total_orders": 25,
    "fully_paid_orders": 18,
    "partially_paid_orders": 5,
    "unpaid_orders": 2,
    "payment_completion_rate": 0.72
  },
  "financial_summary": {
    "total_order_amount": 12500.75,
    "total_paid_amount": 9200.50,
    "total_outstanding": 3300.25,
    "payment_percentage": 73.6
  },
  "generated_at": "2025-08-23T20:30:00Z"
}
```

## 📊 Modelos de Datos Principales

### PurchaseEnhancedProductDetail
```typescript
interface PurchaseEnhancedProductDetail {
  product_id: string;        // ID del producto
  quantity: number;          // Cantidad (soporta decimales)
  unit_price: number;        // Precio unitario
  tax_rate_id?: number;      // ID de tasa de impuesto (opcional)
  profit_pct?: number;       // Porcentaje de ganancia (opcional)
}
```

### PaymentDetail
```typescript
interface PaymentDetail {
  amount_paid: number;           // Monto pagado en esta transacción
  outstanding_amount: number;    // Monto pendiente después del pago
  total_paid_so_far: number;    // Total pagado hasta ahora
  total_order_amount: number;   // Monto total de la orden
  payment_status: 'partial' | 'complete' | 'overpaid';
  order_fully_paid: boolean;    // Si la orden está completamente pagada
}
```

### ImpactAnalysis
```typescript
interface ImpactAnalysis {
  total_items: number;
  payments_to_cancel: number;
  total_to_reverse: number;
  stock_adjustments_required: number;
  price_updates_required: number;
  requires_payment_reversal: boolean;
  requires_stock_adjustment: boolean;
  requires_price_reversion: boolean;
}
```

## ⚠️ Manejo de Errores

### Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| `VALIDATION_FAILED` | Datos de entrada inválidos |
| `SUPPLIER_NOT_FOUND` | Proveedor no existe |
| `PRODUCT_NOT_FOUND` | Producto no existe |
| `PAYMENT_METHOD_NOT_FOUND` | Método de pago no válido |
| `CURRENCY_NOT_FOUND` | Divisa no válida |
| `INSUFFICIENT_PERMISSIONS` | Usuario sin permisos |
| `INVALID_AMOUNT` | Monto de pago inválido |
| `ORDER_NOT_FOUND` | Orden de compra no existe |
| `ORDER_ALREADY_CANCELLED` | Orden ya cancelada |
| `PAYMENT_EXCEEDS_BALANCE` | Pago excede saldo pendiente |

### Estructura de Error Estándar
```json
{
  "success": false,
  "message": "Human readable error message",
  "error_code": "ERROR_CODE",
  "details": "Additional technical details",
  "timestamp": "2025-08-23T20:30:00Z"
}
```

## 🔄 Flujo de Trabajo Recomendado

### 1. Crear Orden de Compra
```
POST /purchase/enhanced → {purchase_order_id}
```

### 2. Procesar Pagos (múltiples pagos permitidos)
```
POST /purchase/payment/process (parcial)
POST /purchase/payment/process (completar)
```

### 3. Cancelación (si es necesaria)
```
GET /purchase/{id}/preview-cancellation (analizar impacto)
PUT /purchase/cancel-enhanced/{id} (ejecutar cancelación)
```

### 4. Monitoreo y Análisis
```
GET /purchase/payment/statistics (periódicamente)
```

## 📋 Notas para el Equipo Frontend

1. **Validación de Campos**: Todos los endpoints incluyen validación del lado del servidor, pero se recomienda validación del lado cliente para mejor UX.

2. **Montos Decimales**: Los campos `quantity` y todos los montos soportan decimales. Usar bibliotecas apropiadas para manejo de precisión decimal.

3. **Estados de Pago**: El sistema maneja estados `partial`, `complete` y `overpaid` automáticamente.

4. **Metadatos Flexibles**: El campo `metadata` acepta cualquier JSON válido para datos adicionales específicos del negocio.

5. **Fechas**: Todas las fechas están en formato ISO 8601 (UTC).

6. **IDs de Productos**: Los product_id son strings para máxima flexibilidad.

7. **Consistencia con Sales**: La API sigue exactamente el mismo patrón que el sistema de ventas para facilitar el desarrollo.

## 🔗 Endpoints Relacionados

- **Proveedores**: `/supplier/*` para obtener información de proveedores
- **Productos**: `/product/*` para validar productos
- **Métodos de Pago**: `/payment-method/*` para opciones de pago
- **Divisas**: `/currency/*` para información de divisas
- **Usuarios**: `/user/*` para información de usuarios

---

**Última actualización**: 23 de Agosto de 2025
**Versión API**: 1.0
**Patrón**: Siguiendo Sales Payment System
