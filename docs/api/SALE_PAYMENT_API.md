# 💸 Pagos y Cobranzas - Guía de API

**Versión:** 1.0
**Fecha:** 11 de Diciembre de 2025
**Endpoint Base:** `http://localhost:5050`
**Estado:** ✅ Production Ready

---

## 📋 Descripción General

Esta guía documenta los endpoints para el procesamiento de pagos, cobranzas y la consulta del estado de pago de las ventas.

### Características Principales

- ✅ **Procesamiento de Pagos Avanzado**: Maneja pagos parciales, completos y cálculo de vuelto.
- ✅ **Integración con Caja Registradora**: Todos los pagos se asocian a una caja abierta.
- ✅ **Consulta de Estado de Pago**: Endpoints para obtener el estado detallado y resumido de los pagos de una venta.
- ✅ **Consulta de Historial de Pagos**: Permite ver todos los pagos realizados para una venta específica.

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

## 💸 Procesamiento de Pagos

Esta sección cubre cómo procesar pagos para una venta existente.

### 1. Procesar Pago de Venta

**Endpoint:** `POST /payment/process-partial`

Procesa un pago parcial o completo para una orden de venta existente. Este endpoint tiene un manejo avanzado de efectivo que permite registrar la cantidad exacta de dinero recibida del cliente y calcular el vuelto automáticamente.

**Request Body:**

```json
{
  "sales_order_id": "24aBcDeF",
  "amount_received": 200000.00,
  "amount_to_apply": 185500.00,
  "cash_register_id": 6,
  "payment_notes": "Cliente paga con billete de 200.000 Gs."
}
```

**Parámetros del Request:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `sales_order_id` | string | ✅ Sí | ID de la orden de venta a la que se aplica el pago. |
| `amount_received` | number | ✅ Sí | El monto de efectivo físico que el cliente entrega. Debe ser > 0. |
| `amount_to_apply` | number | ❌ No | El monto que se aplicará a la deuda de la venta. Si se omite, el sistema intenta aplicar el `amount_received` completo (o lo que falte para saldar la deuda). |
| `cash_register_id` | number | ⚠️ Condicional | **Obligatorio** si se especifica `amount_to_apply`. Si se omite, el sistema buscará una caja abierta automáticamente. |
| `payment_notes` | string | ❌ No | Notas adicionales sobre el pago. |

> **⚠️ Regla Clave:** `amount_received` debe ser siempre mayor o igual a `amount_to_apply`.

**Response (200 OK con vuelto):**

```json
{
  "success": true,
  "message": "Payment completed",
  "payment_id": 32,
  "payment_summary": {
    "total_sale_amount": 185500.00,
    "previous_payments": 0.00,
    "current_payment": 185500.00,
    "total_paid": 185500.00,
    "remaining_balance": 0.00,
    "sale_status": "PAID"
  },
  "cash_summary": {
    "cash_received": 200000.00,
    "amount_applied": 185500.00,
    "change_given": 14500.00,
    "net_cash_impact": 185500.00
  },
  "payment_complete": true,
  "requires_change": true
}
```

**Estructura del Response de Pago:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `payment_summary` | object | Resumen del estado de la deuda de la venta. |
| `cash_summary` | object | Detalle del movimiento de efectivo (recibido, aplicado, vuelto). |
| `payment_complete` | boolean | `true` si la venta ha sido saldada completamente. |
| `requires_change` | boolean | `true` si se debe entregar vuelto al cliente (`change_given > 0`). |

**Errores Posibles:**

| Error | HTTP Status | Descripción | Solución |
|---|---|-------------|-------------|----------|
| `Sale not found` | 404 | La venta con el `sales_order_id` no existe. | Verificar que el ID de la venta sea correcto. |
| `Sale already fully paid` | 400 | Se intentó pagar una venta que ya está saldada. | Verificar el estado de la venta antes de intentar un pago. Se puede obtener con `GET /sale/{id}/payment-status`. |
| `Cash register is not open` | 400 | La caja registradora asociada está cerrada. | Abrir una caja antes de procesar pagos. |
| `Insufficient cash` | 400 | `amount_to_apply` es mayor que `amount_received`. | Validar en el frontend que el monto a aplicar no supere el recibido. |

---

## 📈 Consulta de Estado de Pagos

Esta sección detalla los endpoints para consultar el estado agregado de los pagos de una o más ventas, permitiendo al frontend conocer el balance pendiente, el progreso del pago y si una venta está totalmente pagada.

### 2. Obtener Estado de Pago de una Venta Individual

**Endpoint:** `GET /sale/{id}/payment-status`

Obtiene el estado de pago completo y detallado para una única venta, incluyendo la lista de todos los pagos realizados.

**Path Parameters:**

| Parámetro | Tipo   | Requerido | Descripción                     |
|-----------|--------|-----------|---------------------------------|
| `id`      | string | ✅ Sí       | ID único de la venta (sales_order_id). |

**Response (200 OK):**

```json
{
  "sale_id": "SALE-1759430699-12",
  "client_id": "GC1Yr2bHg",
  "client_name": "Charlie Brown",
  "sale_date": "2025-10-02 15:44:59",
  "total_amount": 9100,
  "status": "PARTIAL_PAYMENT",
  "total_paid": 7000,
  "balance_due": 2100,
  "payment_progress": 76.92,
  "payments": [
    {
      "payment_id": 44,
      "amount_paid": 5000,
      "status": "PARTIAL",
      "payment_date": "2025-10-02 15:46:42",
      "payment_reference": "AUTO-PAY-1759430802",
      "payment_notes": " | Recibido: ₲5000 | Aplicado: ₲5000 | PAGO PARCIAL",
      "processed_by": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
      "processed_by_name": "Pedro Sanchez",
      "cash_register_id": 10,
      "cash_register_name": "principal"
    }
  ],
  "payment_count": 2,
  "is_fully_paid": false,
  "requires_payment": true,
  "payment_method_id": 1,
  "payment_method": "Pago en efectivo",
  "currency_id": 1,
  "currency": "Guaranies",
  "metadata": null
}
```

**Campos del Response:**

| Campo | Tipo | Descripción |
|---|---|---|
| `sale_id`| string | ID único de la venta. |
| `total_amount`| number | Monto total de la venta. |
| `status` | string | Estado actual de la venta (`PAID`, `PENDING`, `PARTIAL_PAYMENT`, `CANCELLED`). |
| `total_paid`| number | Suma total de los pagos realizados. |
| `balance_due` | number | Saldo pendiente por pagar (`total_amount` - `total_paid`). |
| `payment_progress`| number | Porcentaje del pago completado (0-100). |
| `payments` | array | Lista de todos los pagos individuales realizados para esta venta. |
| `payment_count` | number | Cantidad total de pagos. |
| `is_fully_paid` | boolean | `true` si la venta está completamente pagada. |
| `requires_payment`| boolean | `true` si la venta todavía requiere pagos. |

**Errores Posibles:**

| Error | HTTP Status | Descripción | Solución |
|---|---|---|---|
| `Sale not found` | 404 | La venta no existe. | Verificar que el `id` de la venta sea correcto. |
| `Unauthorized` | 401 | Token JWT inválido o ausente. | Enviar un token válido en el header `Authorization`. |

### 3. Obtener Estado de Pagos por Rango de Fechas

**Endpoint:** `GET /sale/date_range/payment-status`

Obtiene una lista paginada de ventas con el resumen de su estado de pago dentro de un rango de fechas. **No incluye el detalle de pagos individuales** para mantener la respuesta ligera.

**Query Parameters:**

| Parámetro  | Tipo   | Requerido | Descripción                          | Ejemplo                  |
|------------|--------|-----------|--------------------------------------|--------------------------|
| `start_date` | string | ✅ Sí       | Fecha inicio (Formato: `YYYY-MM-DD HH:mm:ss`)   | `2025-10-02 00:00:00`      |
| `end_date`   | string | ✅ Sí       | Fecha fin (Formato: `YYYY-MM-DD HH:mm:ss`)      | `2025-10-02 23:59:59`      |
| `page`       | int    | ❌ No       | Número de página (default: 1).        | 1                        |
| `page_size`  | int    | ❌ No       | Tamaño de página (default: 10).       | 5                        |

**Response (200 OK):**

```json
{
  "pagination": {
    "page": 1,
    "page_size": 5,
    "total_records": 22,
    "total_pages": 5,
    "has_next": true,
    "has_previous": false
  },
  "data": [
    {
      "sale_id": "SALE-1759430699-12",
      "client_id": "GC1Yr2bHg",
      "client_name": "Charlie Brown",
      "sale_date": "2025-10-02 15:44:59",
      "total_amount": 9100,
      "status": "PARTIAL_PAYMENT",
      "total_paid": 7000,
      "balance_due": 2100,
      "payment_progress": 76.92,
      "payment_count": 2,
      "is_fully_paid": false,
      "requires_payment": true,
      "payment_method_id": 1,
      "payment_method": "Pago en efectivo",
      "currency_id": 1,
      "currency": "Guaranies"
    }
  ]
}
```
> **💡 Nota:** La respuesta está paginada y el campo `data` contiene un array de resúmenes de estado de pago, que es la misma estructura que la del endpoint individual pero **sin el campo `payments`**.

**Errores Posibles:**

| Error | HTTP Status | Descripción | Solución |
|---|---|---|---|
| `start_date and end_date are required` | 400 | Faltan los parámetros de fecha. | Asegurarse de proveer `start_date` y `end_date`. |
| `Invalid date format` | 400 | El formato de fecha no es válido. | Usar el formato `YYYY-MM-DD HH:mm:ss`. |

### 4. Obtener Estado de Pagos por Nombre de Cliente

**Endpoint:** `GET /sale/client_name/{name}/payment-status`

Obtiene una lista paginada de ventas con resumen de estado de pago para un cliente específico, buscando por su nombre.

**Path Parameters:**

| Parámetro | Tipo   | Requerido | Descripción                               |
|-----------|--------|-----------|-------------------------------------------|
| `name`    | string | ✅ Sí       | Nombre o apellido del cliente (búsqueda parcial, case-insensitive). |

**Query Parameters:**

| Parámetro  | Tipo | Requerido | Descripción                        | Ejemplo |
|------------|------|-----------|------------------------------------|---------|
| `page`       | int  | ❌ No       | Número de página (default: 1).      | 1       |
| `page_size`  | int  | ❌ No       | Tamaño de página (default: 10).     | 5       |

**Response (200 OK):**
La estructura de la respuesta es idéntica a la del endpoint por rango de fechas, incluyendo paginación y un array `data` con resúmenes de estado de pago.
```json
{
  "pagination": {
    "page": 1,
    "page_size": 1,
    "total_records": 1,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  },
  "data": [
    {
      "sale_id": "SALE-1759430699-12",
      "client_name": "Charlie Brown",
      "status": "PARTIAL_PAYMENT",
      "total_paid": 7000,
      "balance_due": 2100,
      "payment_progress": 76.92
    }
  ]
}
```
**Errores Posibles:**

| Error | HTTP Status | Descripción | Solución |
|---|---|---|---|
| `client name is required` | 400 | El nombre del cliente es requerido. | Proveer un nombre en la URL. |

---

## 📊 Consulta de Historial de Pagos

### 5. Obtener Historial de Pagos de una Venta

**Endpoint:** `GET /sales/{id}/payments`

Obtiene todos los pagos registrados para una venta específica. Es útil para ver el historial de pagos parciales y el detalle de cada transacción.

**Path Parameters:**

| Parámetro | Tipo   | Descripción                     |
|-----------|--------|---------------------------------|
| `id`      | string | ID único de la venta a consultar. |

**Response (200 OK):**
Un array de objetos, donde cada objeto representa un pago.
```json
[
  {
    "id": 101,
    "sales_order_id": "24aBcDeF",
    "client_name": "Juan Pérez",
    "amount_due": 185500.00,
    "amount_received": 100000.00,
    "change_amount": 0.00,
    "currency_code": "PYG",
    "payment_method_code": "CASH",
    "payment_reference": "REF-PARTIAL-1",
    "payment_notes": "Primer pago parcial.",
    "payment_date": "2025-12-10T10:00:00Z",
    "processed_by_name": "Admin User",
    "status": "COMPLETED"
  },
  {
    "id": 102,
    "sales_order_id": "24aBcDeF",
    "client_name": "Juan Pérez",
    "amount_due": 85500.00,
    "amount_received": 100000.00,
    "change_amount": 14500.00,
    "currency_code": "PYG",
    "payment_method_code": "CASH",
    "payment_reference": "REF-FINAL-2",
    "payment_notes": "Pago final para saldar la deuda.",
    "payment_date": "2025-12-10T11:30:00Z",
    "processed_by_name": "Admin User",
    "status": "COMPLETED"
  }
]
```

**Campos del Response (por cada pago en el array):**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | number | ID único del registro de pago. |
| `sales_order_id` | string | ID de la venta a la que pertenece el pago. |
| `client_name` | string | Nombre del cliente de la venta. |
| `amount_due` | number | El monto que se debía al momento de este pago. |
| `amount_received` | number | El monto que se recibió en esta transacción de pago. |
| `change_amount` | number | El vuelto que se entregó en esta transacción. |
| `currency_code` | string | Código de la moneda (ej: "PYG"). |
| `payment_method_code`| string | Código del método de pago (ej: "CASH", "CARD"). |
| `payment_reference` | string \| null | Referencia o código de transacción del pago. |
| `payment_notes` | string \| null | Notas adicionales sobre el pago. |
| `payment_date` | string (ISO 8601) | Fecha y hora en que se registró el pago. |
| `processed_by_name` | string | Nombre del usuario que procesó el pago. |
| `status` | string | Estado del pago (`COMPLETED`, `REFUNDED`, etc.). |

**Errores Posibles:**

| Error | HTTP Status | Descripción | Solución |
|---|---|-------------|-------------|----------|
| `Sale not found` | 404 | La venta con el `id` especificado no existe. | Verificar que el ID de la venta sea correcto. |
| `Unauthorized` | 401 | Token JWT inválido o ausente. | Verificar que el header `Authorization: Bearer <token>` esté presente y sea válido. |

---

## 📝 Historial de Cambios

### v1.0 - 11 de Diciembre de 2025
- ✅ Creación del documento a partir de `SALES_API_GUIDE.md`.
- ✅ Agregada la sección `Consulta de Estado de Pagos` con los endpoints `payment-status`.
- ✅ Centralizada toda la documentación de pagos y cobranzas.
