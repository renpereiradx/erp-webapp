# 💳 API de Compras y Pagos a Proveedores

**Versión:** 2.0
**Fecha:** Marzo 2026
**Endpoint Base:** `http://localhost:5050`

---

## 📋 Descripción General

Esta documentación detalla el **sistema de gestión de compras y pagos a proveedores** con soporte para **multi-moneda**, **desglose de IVA (Crédito Fiscal)** y **integración con caja registradora**.

### Características Principales

- ✅ **Pagos Parciales y Completos**: Soporte para múltiples pagos por orden de compra.
- ✅ **Multi-Moneda**: Pago en monedas extranjeras con conversión automática.
- ✅ **Desglose de IVA**: Información detallada del Crédito Fiscal.
- ✅ **Integración con Caja**: Asociación de pagos con cajas registradoras.
- ✅ **Preview de Cancelación**: Análisis de impacto antes de cancelar.

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

## 1️⃣ Gestión de Compras

### 1.1 Procesar Orden de Completa de Compra

**Endpoint:** `POST /purchase/complete`

Registra una compra completa con actualización automática de stock, costos y precios.

**Request Body:**
```json
{
  "supplier_id": 5,
  "status": "COMPLETED",
  "user_id": "user_123",
  "order_details": [
    {
      "product_id": "PROD001",
      "quantity": 10,
      "unit_price": 50000,
      "profit_pct": 25,
      "explicit_sale_price": null,
      "tax_rate_id": 1
    }
  ],
  "payment_method_id": 1,
  "currency_id": 1,
  "auto_update_prices": true
}
```

**Parámetros del Request:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `supplier_id` | int | Sí | ID del proveedor |
| `status` | string | Sí | Estado: COMPLETED, PENDING |
| `user_id` | string | Sí | ID del usuario que registra |
| `order_details` | array | Sí | Array de productos |
| `order_details[].product_id` | string | Sí | ID del producto |
| `order_details[].quantity` | float | Sí | Cantidad (admite decimales) |
| `order_details[].unit_price` | float | Sí | Precio unitario de compra |
| `order_details[].profit_pct` | float | No | Porcentaje de margen (usado si no hay explicit_sale_price) |
| `order_details[].explicit_sale_price` | float | No | Precio de venta explícito (tiene prioridad) |
| `order_details[].tax_rate_id` | int | No | ID de tasa IVA (usa default del producto) |
| `payment_method_id` | int | No | ID del método de pago |
| `currency_id` | int | No | ID de la moneda (default: moneda base) |
| `auto_update_prices` | bool | No | Actualizar precios automáticamente |

**Response (200 OK):**
```json
{
  "success": true,
  "purchase_order_id": 42,
  "total_amount": 550000,
  "items_processed": 1,
  "cost_entries_created": 1,
  "prices_updated": 1,
  "stock_updated": 10,
  "message": "Purchase order processed successfully"
}
```

---

### 1.2 Obtener Compra por ID

**Endpoint:** `GET /purchase/{id}`

**Response (200 OK):**
```json
{
  "purchase": {
    "id": 42,
    "order_date": "2026-03-18T10:00:00Z",
    "total_amount": 550000,
    "status": "COMPLETED",
    "supplier_id": 5,
    "supplier_name": "Proveedor ABC",
    "supplier_status": true,
    "user_id": "user_123",
    "user_name": "Carlos García",
    "payment_method_id": 1,
    "payment_method": "Efectivo",
    "currency_id": 1,
    "currency": "PYG"
  },
  "details": [
    {
      "id": 1,
      "purchase_id": 42,
      "product_id": "PROD001",
      "product_name": "Producto A",
      "quantity": 10,
      "unit": "unidad",
      "unit_price": 50000,
      "unit_price_with_tax": 55000,
      "unit_price_without_tax": 50000,
      "subtotal": 500000,
      "sale_price": 68750,
      "profit_pct": 25,
      "tax_rate": 10,
      "tax_amount": 5000,
      "total_line_with_tax": 55000,
      "applied_tax_rate": 10,
      "exp_date": "2026-12-31"
    }
  ],
  "payments": {
    "total_paid": 300000,
    "outstanding_amount": 250000,
    "payment_count": 1,
    "last_payment_date": "2026-03-18T11:00:00Z",
    "payment_status": "partial",
    "is_fully_paid": false
  },
  "cost_info": {
    "total_cost": 500000,
    "total_sale_value": 687500,
    "average_profit_pct": 25,
    "total_tax_amount": 50000,
    "currency_id": 1,
    "currency_code": "PYG"
  }
}
```

**Campos con Desglose de IVA (Nuevos):**

| Campo | Descripción |
|-------|-------------|
| `unit_price_with_tax` | Precio unitario con IVA (total de factura) |
| `unit_price_without_tax` | Precio unitario sin IVA (crédito fiscal) |
| `tax_amount` | IVA de la línea (Crédito Fiscal) |
| `total_line_with_tax` | Total de línea con IVA |
| `applied_tax_rate` | Tasa de IVA aplicada |

---

### 1.3 Obtener Compras por Proveedor

**Endpoint:** `GET /purchase/supplier_id/{supplier_id}`

---

### 1.4 Obtener Compras por Rango de Fechas

**Endpoint:** `GET /purchase/date_range/`

**Query Parameters:**

| Parámetro | Tipo | Requerido | Formato | Descripción |
|-----------|------|-----------|---------|-------------|
| `start_date` | string | Sí | YYYY-MM-DD HH:mm:ss | Fecha inicio |
| `end_date` | string | Sí | YYYY-MM-DD HH:mm:ss | Fecha fin |
| `page` | int | No | - | Página |
| `page_size` | int | No | - | Elementos por página |

---

### 1.5 Preview de Cancelación

**Endpoint:** `GET /purchase/{id}/preview-cancellation`

Analiza el impacto de cancelar una orden de compra antes de ejecutar la cancelación.

**Response (200 OK):**
```json
{
  "success": true,
  "purchase_info": {
    "purchase_order_id": 42,
    "current_status": "PARTIAL_PAYMENT",
    "total_amount": 550000,
    "order_date": "2026-03-18",
    "can_be_cancelled": true
  },
  "impact_analysis": {
    "total_items": 1,
    "payments_to_cancel": 1,
    "total_to_reverse": 300000,
    "stock_adjustments_required": 10,
    "price_updates_required": 0,
    "requires_payment_reversal": true,
    "requires_stock_adjustment": true
  },
  "recommendations": {
    "action": "CANCEL_WITH_REVERSAL",
    "backup_recommended": true,
    "notify_supplier": true,
    "estimated_complexity": "MEDIUM"
  }
}
```

---

## 2️⃣ Procesamiento de Pagos

### 2.1 Procesar Pago de Compra

**Endpoint:** `POST /purchase/payment/process`

Procesa un pago parcial o completo para una orden de compra existente.

**Request Body:**
```json
{
  "purchase_order_id": 42,
  "amount_paid": 250000,
  "payment_method_id": 1,
  "cash_register_id": 5,
  "currency_id": 1,
  "exchange_rate": null,
  "original_amount": null,
  "payment_reference": "TRANS-2026-0318-001",
  "payment_notes": "Adelanto del 50%"
}
```

**Parámetros del Request:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `purchase_order_id` | int | Sí | ID de la orden de compra |
| `amount_paid` | float | Sí | Monto a pagar (mayor a 0) |
| `payment_method_id` | int | Sí | ID del método de pago |
| `cash_register_id` | int | No | ID de la caja (opcional) |
| `currency_id` | int | No | ID de la moneda (default: moneda base) |
| `exchange_rate` | float | No | Tipo de cambio si es moneda extranjera |
| `original_amount` | float | No | Monto original en moneda extranjera |
| `payment_reference` | string | No | Referencia externa |
| `payment_notes` | string | No | Notas adicionales |

> **Nota Multi-Moneda:** Si `currency_id` es diferente a la moneda base, se debe proporcionar `exchange_rate` y `original_amount`.

**Response (200 OK):**
```json
{
  "success": true,
  "payment_id": 15,
  "purchase_order_id": 42,
  "payment_details": {
    "amount_paid": 250000,
    "outstanding_amount": 300000,
    "total_paid_so_far": 250000,
    "total_order_amount": 550000,
    "payment_status": "partial",
    "order_fully_paid": false
  },
  "message": "Payment processed successfully",
  "processed_at": "2026-03-18T14:00:00Z",
  "processed_by": "user_123"
}
```

---

### 2.2 Procesar Pago con Caja (Integrado)

**Endpoint:** `POST /cash-registers/payments/purchase`

Procesa un pago y registra automáticamente el movimiento en la caja abierta.

**Request Body:**
```json
{
  "purchase_order_id": 42,
  "amount_paid": 250000,
  "payment_method_id": 1,
  "payment_notes": "Pago desde caja principal"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "payment_id": 15,
  "cash_register_id": 5,
  "movement_id": 123,
  "payment_details": {
    "amount_paid": 250000,
    "outstanding_amount": 300000,
    "payment_status": "partial"
  },
  "message": "Payment processed and movement registered"
}
```

---

## 3️⃣ Estadísticas de Pagos

### 3.1 Estadísticas de Pagos por Período

**Endpoint:** `GET /purchase/payment/statistics`

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string | No | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | No | Fecha fin (YYYY-MM-DD) |
| `supplier_id` | int | No | ID del proveedor |

**Response (200 OK):**
```json
{
  "period": {
    "start_date": "2026-03-01",
    "end_date": "2026-03-18",
    "supplier_id": null
  },
  "order_statistics": {
    "total_orders": 25,
    "fully_paid_orders": 18,
    "partially_paid_orders": 5,
    "unpaid_orders": 2
  },
  "financial_summary": {
    "total_order_amount": 15000000,
    "total_paid_amount": 12500000,
    "total_outstanding": 2500000,
    "payment_percentage": 83.33
  },
  "generated_at": "2026-03-18T15:00:00Z"
}
```

---

### 3.2 Totales de Pagos por Rango de Fechas

**Endpoint:** `GET /payment/totals/purchases`

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string | Sí | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Sí | Fecha fin (YYYY-MM-DD) |

**Response (200 OK):**
```json
{
  "start_date": "2026-03-01",
  "end_date": "2026-03-18",
  "total_payments": 45,
  "total_amount": 12500000,
  "completed_payments": 42,
  "completed_amount": 12000000,
  "cancelled_payments": 3,
  "cancelled_amount": 500000,
  "average_payment": 277777.78,
  "unique_purchases": 25
}
```

---

## 4️⃣ Modelos de Datos

### PurchaseItemFullRiched (Detalle de Compra con IVA)

```typescript
interface PurchaseItemFullRiched {
  id: number;
  purchase_id: number;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;             // Precio de compra (costo)
  unit_price_with_tax: number;    // Precio con IVA (total factura)
  unit_price_without_tax: number; // Precio sin IVA (crédito fiscal)
  subtotal: number;                // Cantidad × precio unitario
  sale_price: number;             // Precio de venta calculado
  profit_pct: number;             // Porcentaje de ganancia
  unit: string;                    // Unidad de medida
  tax_rate_id: number | null;      // ID de tasa IVA
  tax_rate: number;                // Tasa aplicada
  tax_amount: number;              // Monto del IVA (Crédito Fiscal)
  total_line_with_tax: number;     // Total línea con IVA
  applied_tax_rate: number;        // Tasa aplicada
}
```

### PurchasePayment (Pago de Compra)

```typescript
interface PurchasePayment {
  payment_id: number;
  purchase_order_id: number;
  amount_due: number;
  amount_paid: number;
  outstanding_amount: number;
  payment_reference: string | null;
  payment_notes: string | null;
  payment_date: string;
  processed_by: string;
  status: string;              // COMPLETED, PARTIAL, CANCELLED
  created_at: string;
  updated_at: string;
  cash_register_id: number | null;
  payment_method_id: number | null;
  payment_method: string;
  currency_id: number | null;
  exchange_rate: number;
  original_amount: number;
}
```

---

## 📊 Flujo de Trabajo Recomendado

### Flujo de Compra Completa

1. **Crear Orden de Compra:** `POST /purchase/complete` con productos, proveedor y precios.
2. **Verificar Estado de Pago:** `GET /purchase/{id}` para ver `outstanding_amount`.
3. **Procesar Pago:** `POST /purchase/payment/process` con el monto a pagar.
4. **Confirmar Pago Completo:** Verificar que `payment_status` sea `complete`.

### Flujo Multi-Moneda

1. **Seleccionar Moneda:** `GET /currencies` para listar monedas disponibles.
2. **Obtener Tipo de Cambio:** `GET /exchange-rates/latest` para el rate actual.
3. **Procesar Pago:** Incluir `currency_id`, `exchange_rate` y `original_amount`.

---

## ❌ Manejo de Errores

| Código | HTTP | Descripción | Solución |
|--------|------|-------------|----------|
| `PURCHASE_ORDER_NOT_FOUND` | 404 | La orden de compra no existe | Verificar ID de la orden |
| `PAYMENT_EXCEEDS_BALANCE` | 400 | El pago excede el saldo pendiente | Verificar `outstanding_amount` |
| `INSUFFICIENT_FUNDS` | 400 | Caja sin fondos suficientes | Verificar saldo de la caja |
| `CASH_REGISTER_NOT_FOUND` | 404 | Caja no encontrada o cerrada | Verificar que la caja esté abierta |
| `INVALID_AMOUNT` | 400 | Monto inválido (≤ 0) | Ingresar monto positivo |
| `CANNOT_CANCEL_ORDER` | 400 | La orden no puede cancelarse | Verificar estado actual |

**Ejemplo de Error:**
```json
{
  "success": false,
  "message": "Payment amount exceeds outstanding balance",
  "error": "PAYMENT_EXCEEDS_BALANCE"
}
```

---

## 📝 Historial de Cambios

### v2.0 - Marzo 2026
- ✅ Soporte para multi-moneda con `currency_id`, `exchange_rate`, `original_amount`.
- ✅ Desglose de IVA con `unit_price_with_tax`, `unit_price_without_tax`, `tax_amount`.
- ✅ Integración opcional con caja registradora (`cash_register_id` es opcional).
- ✅ Modelo `PurchaseItemFullRiched` con información financiera completa.
- ✅ Preview de cancelación con análisis de impacto.

### v2.1 - Noviembre 2025
- ✅ El campo `cash_register_id` es ahora opcional.
- ✅ Estadísticas de pagos por proveedor.

### v1.0 - Agosto 2025
- ✅ Versión inicial del sistema de pagos de compras.