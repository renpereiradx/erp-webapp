# 💸 API de Ventas y Cobros

**Versión:** 2.0
**Fecha:** Marzo 2026
**Endpoint Base:** `http://localhost:5050`
**Estado:** ✅ Production Ready

---

## 📋 Descripción General

Esta guía documenta los endpoints para **gestión de ventas**, **procesamiento de cobros/pagos**, y **consulta de estado de pagos** con soporte para **multi-moneda** y **desglose de IVA**.

### Características Principales

- ✅ **Ventas Multi-moneda**: Soporte para transacciones en diferentes monedas con conversión automática.
- ✅ **Desglose de IVA**: Información detallada de impuestos en cada línea de venta.
- ✅ **Pagos Parciales**: Manejo de múltiples pagos por venta.
- ✅ **Integración con Caja**: Asociación automática de pagos con cajas registradoras.
- ✅ **Cálculo de Vuelto**: Soporte para pagos con monto mayor al total.

---

## 🔧 Configuración General

### Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## 1️⃣ Gestión de Ventas

### 1.1 Crear Venta

**Endpoint:** `POST /sale`

**Request Body:**
```json
{
  "client_id": "CL123456",
  "product_details": [
    {
      "product_id": "PROD001",
      "quantity": 2,
      "tax_rate_id": 1,
      "sale_price": null,
      "discount_percent": null
    }
  ],
  "payment_method_id": 1,
  "currency_id": 1,
  "allow_price_modifications": false
}
```

**Parámetros del Request:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `client_id` | string | Sí | ID del cliente |
| `product_details` | array | Sí | Array de productos |
| `product_details[].product_id` | string | Sí | ID del producto |
| `product_details[].quantity` | float | Sí | Cantidad (admite decimales) |
| `product_details[].tax_rate_id` | int | No | ID de tasa IVA (usa default si no se especifica) |
| `product_details[].sale_price` | float | No | Precio override (si se permite modificación) |
| `product_details[].discount_percent` | float | No | Porcentaje de descuento |
| `payment_method_id` | int | No | ID del método de pago |
| `currency_id` | int | No | ID de la moneda (default: moneda base) |
| `allow_price_modifications` | bool | No | Permitir cambios de precio |

**Response (201 Created):**
```json
{
  "sale_id": "SALE-20260318-001",
  "client_id": "CL123456",
  "total_amount": 242000,
  "status": "PENDING",
  "items_processed": 2
}
```

---

### 1.2 Obtener Venta por ID

**Endpoint:** `GET /sale/{id}`

**Response (200 OK):**
```json
{
  "sale": {
    "sale_id": "SALE-20260318-001",
    "client_id": "CL123456",
    "client_name": "Juan Pérez",
    "sale_date": "2026-03-18 14:30:00",
    "total_amount": 242000,
    "status": "PAID",
    "user_name": "Vendedor1",
    "payment_method_id": 1,
    "payment_method": "Efectivo",
    "currency_id": 1,
    "currency": "PYG"
  },
  "details": [
    {
      "id": 1,
      "order_id": "SALE-20260318-001",
      "product_id": "PROD001",
      "product_name": "Producto A",
      "quantity": 2,
      "unit": "unidad",
      "base_price": 100000,
      "unit_price": 100000,
      "unit_price_with_tax": 110000,
      "unit_price_without_tax": 100000,
      "discount_amount": 0,
      "subtotal": 200000,
      "tax_amount": 20000,
      "total_with_tax": 220000,
      "applied_tax_rate": 10,
      "price_modified": false,
      "tax_rate_id": 1
    }
  ]
}
```

**Campos con Desglose de IVA (Nuevos):**

| Campo | Descripción |
|-------|-------------|
| `unit_price_with_tax` | Precio unitario con IVA (precio del ticket) |
| `unit_price_without_tax` | Precio unitario sin IVA (valor neto) |
| `tax_amount` | Monto del IVA de la línea |
| `total_with_tax` | Subtotal + IVA (total de línea) |
| `applied_tax_rate` | Tasa de IVA aplicada (ej: 10, 5) |

---

### 1.3 Obtener Ventas por Rango de Fechas

**Endpoint:** `GET /sale/date_range`

**Query Parameters:**

| Parámetro | Tipo | Requerido | Formato | Descripción |
|-----------|------|-----------|---------|-------------|
| `start_date` | string | Sí | YYYY-MM-DD HH:mm:ss | Fecha inicio |
| `end_date` | string | Sí | YYYY-MM-DD HH:mm:ss | Fecha fin |
| `page` | int | No | - | Página (default: 1) |
| `page_size` | int | No | - | Elementos por página (default: 10) |

---

### 1.4 Agregar Productos a Venta Existente

**Endpoint:** `POST /sale/{id}/products`

**Request Body:**
```json
{
  "product_details": [
    {
      "product_id": "PROD002",
      "quantity": 1,
      "sale_price": null,
      "discount_percent": 5
    }
  ],
  "allow_price_modifications": false
}
```

---

## 2️⃣ Procesamiento de Pagos (Cobros)

### 2.1 Procesar Pago de Venta

**Endpoint:** `POST /payment/process-partial`

Este endpoint maneja pagos completos o parciales con soporte para **multi-moneda** y **cálculo de vuelto**.

**Request Body:**
```json
{
  "sales_order_id": "SALE-20260318-001",
  "amount_received": 250000,
  "amount_to_apply": 242000,
  "payment_method_id": 1,
  "cash_register_id": 5,
  "currency_id": 1,
  "exchange_rate": null,
  "original_amount": null,
  "payment_reference": "Pago cliente Juan Pérez",
  "payment_notes": "Cliente paga con billete de 250.000"
}
```

**Parámetros del Request:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `sales_order_id` | string | Sí | ID de la venta |
| `amount_received` | float | Sí | Monto recibido del cliente |
| `amount_to_apply` | float | No | Monto a aplicar (default: total pendiente) |
| `payment_method_id` | int | Sí | ID del método de pago |
| `cash_register_id` | int | No | ID de la caja registradora |
| `currency_id` | int | No | ID de la moneda (default: moneda base) |
| `exchange_rate` | float | No | Tipo de cambio si es moneda extranjera |
| `original_amount` | float | No | Monto original en moneda extranjera |
| `payment_reference` | string | No | Referencia externa del pago |
| `payment_notes` | string | No | Notas adicionales |

> **⚠️ Multi-moneda:** Si `currency_id` es diferente a la moneda base, se debe proporcionar `exchange_rate` y `original_amount`.

**Response (200 OK) con Vuelto:**
```json
{
  "success": true,
  "payment_id": 32,
  "sale_id": "SALE-20260318-001",
  "client_name": "Juan Pérez",
  "payment_summary": {
    "total_sale_amount": 242000,
    "previous_payments": 0,
    "current_payment": 242000,
    "total_paid": 242000,
    "remaining_balance": 0,
    "sale_status": "PAID",
    "currency_code": "PYG",
    "payment_method": "Efectivo"
  },
  "cash_summary": {
    "cash_received": 250000,
    "amount_applied": 242000,
    "change_given": 8000,
    "net_cash_impact": 242000
  },
  "payment_complete": true,
  "requires_change": true
}
```

---

### 2.2 Procesar Pago con Caja (Integrado)

**Endpoint:** `POST /cash-registers/payments/sale`

Procesa un pago y automáticamente registra el movimiento en la caja abierta del usuario.

**Request Body:**
```json
{
  "sales_order_id": "SALE-20260318-001",
  "amount_received": 250000,
  "amount_to_apply": 242000,
  "payment_method_id": 1,
  "notes": "Pago en efectivo"
}
```

---

## 3️⃣ Consulta de Estado de Pagos

### 3.1 Estado de Pago de una Venta

**Endpoint:** `GET /sale/{id}/payment-status`

**Response (200 OK):**
```json
{
  "sale_id": "SALE-20260318-001",
  "client_id": "CL123456",
  "client_name": "Juan Pérez",
  "sale_date": "2026-03-18 14:30:00",
  "total_amount": 242000,
  "status": "PARTIAL_PAYMENT",
  "total_paid": 200000,
  "balance_due": 42000,
  "payment_progress": 82.64,
  "payments": [
    {
      "payment_id": 31,
      "amount_paid": 150000,
      "status": "COMPLETED",
      "payment_date": "2026-03-18 14:35:00",
      "payment_reference": "Pago parcial 1",
      "processed_by": "Vendedor1",
      "processed_by_name": "Carlos García",
      "cash_register_id": 5,
      "cash_register_name": "Caja Principal",
      "payment_method_id": 1,
      "payment_method": "Efectivo",
      "currency_id": 1,
      "exchange_rate": 1.0,
      "original_amount": 150000
    }
  ],
  "payment_count": 2,
  "is_fully_paid": false,
  "requires_payment": true,
  "payment_method_id": 1,
  "payment_method": "Efectivo",
  "currency_id": 1,
  "currency": "PYG"
}
```

**Campos de Multi-Moneda (Nuevos):**

| Campo | Descripción |
|-------|-------------|
| `currency_id` | ID de la moneda del pago |
| `exchange_rate` | Tipo de cambio aplicado |
| `original_amount` | Monto original en moneda extranjera |

---

### 3.2 Ventas con Estado de Pago por Rango de Fechas

**Endpoint:** `GET /sale/date_range/payment-status`

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string | Sí | Fecha inicio (YYYY-MM-DD HH:mm:ss) |
| `end_date` | string | Sí | Fecha fin (YYYY-MM-DD HH:mm:ss) |
| `page` | int | No | Página (default: 1) |
| `page_size` | int | No | Elementos por página (default: 10) |

---

### 3.3 Ventas con Estado de Pago por Cliente

**Endpoint:** `GET /sale/client_name/{name}/payment-status`

---

## 4️⃣ Totales de Pagos

### 4.1 Totales de Ventas por Rango de Fechas

**Endpoint:** `GET /payment/totals/sales`

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
  "total_payments": 150,
  "total_amount": 25000000,
  "completed_payments": 145,
  "completed_amount": 24500000,
  "refunded_payments": 5,
  "refunded_amount": 500000,
  "average_payment": 166666.67,
  "total_change_given": 150000,
  "payments_with_change": 25
}
```

---

### 4.2 Totales de Compras por Rango de Fechas

**Endpoint:** `GET /payment/totals/purchases`

---

## 5️⃣ Modelos de Datos

### SaleDetailRiched (Detalle de Venta con IVA)

```typescript
interface SaleDetailRiched {
  id: number;
  order_id: string;
  product_id: string;
  product_name: string;
  product_type: string;          // PHYSICAL o SERVICE
  quantity: number;
  unit: string | null;
  base_price: number;            // Precio base sin descuento
  unit_price: number;            // Precio unitario final
  unit_price_with_tax: number;   // Precio con IVA
  unit_price_without_tax: number; // Precio sin IVA
  discount_amount: number;
  subtotal: number;              // Cantidad × precio sin IVA
  tax_amount: number;            // IVA de la línea
  total_with_tax: number;        // Subtotal + IVA
  applied_tax_rate: number;      // Tasa aplicada (10, 5, 0)
  price_modified: boolean;
  tax_rate_id: number;
}
```

### SalePaymentWithDetails (Pago de Venta)

```typescript
interface SalePaymentWithDetails {
  payment_id: number;
  amount_paid: number;
  status: string;               // COMPLETED, PARTIAL, CANCELLED, REFUNDED
  payment_date: string;
  payment_reference: string | null;
  payment_notes: string | null;
  processed_by: string;
  processed_by_name: string;
  cash_register_id: number | null;
  cash_register_name: string;
  payment_method_id: number | null;
  payment_method: string;
  currency_id: number | null;
  exchange_rate: number;
  original_amount: number;
}
```

---

## 📊 Flujo de Trabajo Recomendado

### Flujo de Venta Completa

1. **Crear Venta:** `POST /sale` con productos y cliente.
2. **Consultar Estado:** `GET /sale/{id}/payment-status` para ver el total pendiente.
3. **Procesar Pago:** `POST /payment/process-partial` con el monto recibido.
4. **Verificar Resultado:** Revisar `payment_complete` y `requires_change`.
5. **Entregar Vuelto:** Si `requires_change` es `true`, entregar `cash_summary.change_given`.

### Flujo Multi-Moneda

1. **Seleccionar Moneda:** Usar `GET /currencies` para listar monedas disponibles.
2. **Obtener Tipo de Cambio:** `GET /exchange-rates/latest` para obtener el rate actual.
3. **Procesar Pago:** Incluir `currency_id`, `exchange_rate` y `original_amount` en el request.

---

## ❌ Manejo de Errores

| Código | HTTP | Descripción | Solución |
|--------|------|-------------|----------|
| `SALE_NOT_FOUND` | 404 | La venta no existe | Verificar ID de la venta |
| `SALE_ALREADY_PAID` | 400 | La venta ya está pagada | Consultar estado antes |
| `INSUFFICIENT_PAYMENT` | 400 | El monto es insuficiente | Verificar saldo pendiente |
| `CASH_REGISTER_NOT_OPEN` | 400 | No hay caja abierta | Abrir caja primero |
| `INVALID_CURRENCY` | 400 | Moneda no soportada | Usar moneda activa |
| `EXCHANGE_RATE_NOT_FOUND` | 400 | No hay tipo de cambio | Registrar tipo de cambio |

---

## 📝 Historial de Cambios

### v2.0 - Marzo 2026
- ✅ Soporte para multi-moneda con `currency_id`, `exchange_rate`, `original_amount`.
- ✅ Desglose de IVA con `unit_price_with_tax`, `unit_price_without_tax`, `tax_amount`.
- ✅ Integración completa con caja registradora.
- ✅ Campos de IVA en detalles de venta.

### v1.1 - Diciembre 2025
- ✅ Endpoint unificado de estado de pagos.
- ✅ Soporte para pagos parciales.

### v1.0 - Noviembre 2025
- ✅ Versión inicial.