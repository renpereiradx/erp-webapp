# 🛒 Ventas y Pagos - Guía Completa de API

**Versión:** 1.6
**Fecha:** 08 de Diciembre de 2025
**Endpoint Base:** `http://localhost:5050`
**Estado:** ✅ Production Ready

---

## 📋 Descripción General

Esta guía unifica la documentación para todo el ciclo de vida de una venta, desde su creación hasta su pago completo, incluyendo la consulta de ventas históricas. El sistema de ventas es flexible y soporta modificaciones de precios, descuentos por producto, y la integración con reservas de servicios.

El proceso se divide en tres acciones principales, cada una con su propio endpoint:
1.  **Crear una Venta:** A través de `POST /sales/orders`, se registra una nueva orden de venta, especificando cliente, productos, y posibles descuentos o precios especiales.
2.  **Procesar un Pago:** A través de `POST /payment/process-partial`, se registran los pagos (parciales o completos) para una venta ya creada, con manejo avanzado de efectivo y vuelto.
3.  **Consultar Ventas:** A través de `GET /sale/date_range`, se obtienen ventas existentes por rango de fechas con paginación y detalles completos.

### Características Principales

- ✅ **Creación de Ventas Flexibles**: Soporte para productos y servicios.
- ✅ **Modificación de Precios**: Permite ajustar precios manualmente con justificación.
- ✅ **Sistema de Descuentos**: Aplica descuentos por monto fijo o porcentaje a productos individuales.
- ✅ **Integración con Reservas**: Convierte una reserva confirmada en una venta.
- ✅ **Procesamiento de Pagos Avanzado**: Maneja pagos parciales, completos y cálculo de vuelto.
- ✅ **Integración con Caja Registradora**: Todos los pagos se asocian a una caja abierta.
- ✅ **Consulta de Ventas por Rango de Fechas**: Obtiene ventas históricas con paginación y detalles completos.

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

### Formato de Respuesta Estándar

En caso de error, el backend puede devolver un formato de error estándar:
```json
{
  "success": false,
  "error_code": "INSUFFICIENT_STOCK",
  "message": "Error procesando la venta",
  "details": "Stock insuficiente para el producto PROD_A"
}
```

---

## 💳 Creación de Ventas

Esta sección cubre cómo crear una nueva orden de venta.

### 1. Crear Orden de Venta

**Endpoint:** `POST /sales/orders`

Este endpoint crea una nueva venta. Es el punto de entrada para registrar todos los productos que un cliente desea adquirir, aplicando las condiciones comerciales correspondientes (descuentos, precios especiales, etc.).

**Request Body:**

```json
{
  "sale_id": "opcional-custom-id",
  "client_id": "CLIENT_001",
  "reserve_id": 123,
  "allow_price_modifications": true,
  "product_details": [
    {
      "product_id": "PROD_A",
      "quantity": 2,
      "sale_price": 9500,
      "price_change_reason": "Precio especial negociado",
      "discount_percent": 10,
      "discount_reason": "Descuento adicional 10%"
    },
    {
      "product_id": "PROD_B",
      "quantity": 5
    }
  ],
  "payment_method_id": 1,
  "currency_id": 1
}
```

**Parámetros del Request:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `sale_id` | string | ❌ No | ID personalizado para la venta. Si se omite, se genera uno automáticamente. |
| `client_id` | string | ✅ Sí | ID del cliente al que se le realiza la venta. |
| `reserve_id` | number | ❌ No | ID de una reserva confirmada. Si se incluye, los productos de la reserva se añaden a la venta. |
| `allow_price_modifications` | boolean | ✅ Sí | Debe ser `true` para poder usar `sale_price`, `discount_amount` o `discount_percent`. |
| `product_details` | array | ✅ Sí | Lista de productos de la venta. |
| `payment_method_id` | number | ❌ No | ID del método de pago preferido. |
| `currency_id` | number | ❌ No | ID de la moneda de la transacción. |

**Estructura de `product_details`:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `product_id` | string | ✅ Sí | ID del producto a vender. |
| `quantity` | number | ✅ Sí | Cantidad del producto. Debe ser > 0. |
| `tax_rate_id` | number | ❌ No | ID de la tasa de impuesto a aplicar. Si se omite, usa la del producto. |
| `sale_price` | number | ⚠️ Condicional | **Modificación de Precio:** Precio de venta unitario modificado. Requiere `allow_price_modifications: true`. |
| `price_change_reason` | string | ⚠️ Condicional | Justificación obligatoria si se usa `sale_price`. |
| `discount_amount` | number | ⚠️ Condicional | **Descuento Fijo:** Monto de descuento a restar del precio unitario. |
| `discount_percent` | number | ⚠️ Condicional | **Descuento Porcentual:** Porcentaje de descuento (0-100) a aplicar al precio unitario. |
| `discount_reason` | string | ⚠️ Condicional | Justificación obligatoria si se aplica cualquier tipo de descuento. |

> **💡 Importante:** No se pueden usar `discount_amount` y `discount_percent` en el mismo producto simultáneamente.

**Response (200 OK):**

```json
{
  "success": true,
  "sale_id": "24aBcDeF",
  "total_amount": 185500.50,
  "items_processed": 2,
  "has_price_changes": true,
  "has_discounts": true,
  "reserve_processed": true,
  "reserve_id": 123,
  "message": "Venta procesada exitosamente con reserva y descuentos aplicados"
}
```

**Campos del Response:**

| Campo | Tipo | Descripción |
|---|---|---|
| `success` | boolean | `true` si la venta se creó exitosamente. |
| `sale_id` | string | El ID único de la venta creada. **Guardar este ID para procesar pagos.** |
| `total_amount`| number | El monto total calculado para la venta. |
| `items_processed` | number | El número de productos distintos en la venta. |
| `has_price_changes` | boolean | `true` si se aplicó alguna modificación de precio manual. |
| `has_discounts` | boolean | `true` si se aplicó algún descuento. |
| `reserve_processed`| boolean | `true` si la venta se generó a partir de una reserva. |
| `reserve_id` | number | El ID de la reserva utilizada, si aplica. |
| `message` | string | Un mensaje de confirmación. |


**Errores Posibles:**

| Error | HTTP Status | Descripción | Solución |
|---|-------------|-------------|----------|
| `DISCOUNT_REASON_REQUIRED` | 400 | Se aplicó un descuento sin justificación. | Añadir un valor a `discount_reason` cuando se usa `discount_amount` o `discount_percent`. |
| `PRICE_CHANGE_REASON_REQUIRED` | 400 | Se usó `sale_price` sin justificación. | Añadir un valor a `price_change_reason`. |
| `EXCESSIVE_DISCOUNT_AMOUNT` | 400 | El descuento es mayor que el precio del producto. | Ajustar el monto del descuento para que no supere el precio unitario. |
| `INSUFFICIENT_STOCK` | 409 (Conflict) | No hay suficiente stock para uno de los productos. | Validar el stock disponible antes de crear la venta. El mensaje de error indicará el producto. |
| `INVALID_RESERVATION`| 400 | La reserva especificada no es válida o ya ha sido utilizada. | Asegurarse de que el `reserve_id` es correcto y que la reserva está en estado `CONFIRMED`. |


---

## ✍️ Modificación de Ventas

Esta sección cubre cómo modificar una orden de venta existente que aún no ha sido pagada en su totalidad.

### 2. Agregar Productos a una Venta Existente

**Endpoint:** `POST /sale/{id}/products`

Permite agregar uno o más productos a una venta existente que se encuentra en estado `PENDING`. Esta operación actualiza el monto total de la venta y recalcula los saldos.

**Path Parameters:**

| Parámetro | Tipo   | Descripción                     |
|-----------|--------|---------------------------------|
| `id`      | string | ID único de la venta a modificar. |

**Request Body:**

```json
{
  "allow_price_modifications": true,
  "product_details": [
    {
      "product_id": "PROD_C",
      "quantity": 1
    },
    {
      "product_id": "PROD_D",
      "quantity": 2,
      "sale_price": 45000,
      "price_change_reason": "Precio especial por adición"
    }
  ]
}
```

**Parámetros del Request:**

| Campo                       | Tipo    | Requerido | Descripción                                                                                           |
|-----------------------------|---------|-----------|-------------------------------------------------------------------------------------------------------|
| `allow_price_modifications` | boolean | ✅ Sí       | Debe ser `true` para poder usar `sale_price` u otros campos de descuento en los productos añadidos. |
| `product_details`           | array   | ✅ Sí       | Lista de nuevos productos a agregar a la venta. La estructura es idéntica a la de creación de ventas. |

> **💡 Nota:** La estructura del array `product_details` es la misma que la utilizada en el endpoint `POST /sales/orders`. Se pueden aplicar descuentos y modificaciones de precio a los nuevos productos siguiendo las mismas reglas.

**Response (200 OK):**

```json
{
  "success": true,
  "sale_id": "24aBcDeF",
  "message": "2 producto(s) han sido agregados a la venta.",
  "items_added": 2,
  "updated_total_amount": 254500.50,
  "previous_total_amount": 185500.50
}
```

**Campos del Response:**

| Campo                   | Tipo   | Descripción                                           |
|-------------------------|--------|-------------------------------------------------------|
| `success`               | boolean| `true` si los productos se agregaron exitosamente.      |
| `sale_id`               | string | El ID de la venta que fue actualizada.                |
| `message`               | string | Un mensaje de confirmación.                           |
| `items_added`           | number | El número de productos distintos que se agregaron.    |
| `updated_total_amount`  | number | El nuevo monto total de la venta tras la adición.     |
| `previous_total_amount` | number | El monto total de la venta antes de la adición.       |

**Errores Posibles:**

| Error                  | HTTP Status    | Descripción                                                               | Solución                                                                    |
|------------------------|----------------|---------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `Sale not found`       | 404 (Not Found)| La venta con el `id` especificado no existe.                              | Verificar que el ID de la venta sea correcto.                               |
| `SALE_IS_NOT_PENDING`  | 400 (Bad Request) | La venta ya ha sido pagada (`PAID`) o cancelada (`CANCELLED`).           | Solo se pueden agregar productos a ventas con estado `PENDING`.             |
| `INSUFFICIENT_STOCK`   | 409 (Conflict) | No hay suficiente stock para uno de los productos que se intentan agregar. | Validar el stock disponible antes de agregar el producto.                   |
| `MODIFICATIONS_NOT_ALLOWED` | 400 (Bad Request) | Se intentó modificar el precio sin `allow_price_modifications: true`. | Establecer `allow_price_modifications` a `true` si se necesita cambiar precios. |

---

## 🚫 Anulación de Ventas

Esta sección describe el proceso para anular o cancelar una venta. La anulación es un proceso irreversible que revierte el movimiento de stock de los productos vendidos.

### 3. Previsualizar Anulación de Venta

**Endpoint:** `GET /sale/{id}/preview-cancellation`

Antes de anular una venta, es **altamente recomendable** previsualizar el impacto. Este endpoint devuelve un resumen de las acciones que se realizarán, como la devolución de stock, sin ejecutar la anulación.

**Path Parameters:**

| Parámetro | Tipo   | Descripción                     |
|-----------|--------|---------------------------------|
| `id`      | string | ID único de la venta a anular. |

**Response (200 OK):**

```json
{
  "success": true,
  "sale_id": "24aBcDeF",
  "client_name": "Juan Pérez",
  "total_amount": 185500.50,
  "impact_summary": {
    "stock_reversion_count": 2,
    "payment_reversals": 1,
    "cancellation_fee": 0
  },
  "warnings": [
    "La venta ya tiene pagos registrados que serán anulados.",
    "El producto 'PROD_A' será devuelto al inventario."
  ],
  "is_cancellable": true
}
```

**Campos del Response:**

| Campo | Tipo | Descripción |
|---|---|---|
| `sale_id` | string | ID de la venta. |
| `impact_summary` | object | Resumen del impacto de la anulación. |
| `stock_reversion_count` | number | Cantidad de productos cuyo stock será revertido. |
| `warnings` | array | Lista de strings con advertencias importantes. |
| `is_cancellable` | boolean | Indica si la venta puede ser anulada. |

---

### 4. Anular Venta

**Endpoint:** `PUT /sale/{id}`

Anula una venta de forma definitiva. Esto cambiará el estado de la venta a `CANCELLED` y revertirá todas las transacciones de stock asociadas.

**⚠️ Advertencia:** Esta acción es irreversible.

**Path Parameters:**

| Parámetro | Tipo   | Descripción                     |
|-----------|--------|---------------------------------|
| `id`      | string | ID único de la venta a anular. |

**Request Body:**

```json
{
  "cancellation_reason": "El cliente se arrepintió de la compra."
}
```

**Parámetros del Request:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `cancellation_reason`| string | ✅ Sí | Motivo por el cual la venta está siendo anulada. |

**Response (200 OK):**

```json
{
  "success": true,
  "sale_id": "24aBcDeF",
  "new_status": "CANCELLED",
  "message": "La venta ha sido anulada exitosamente. El stock ha sido revertido."
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `SALE_NOT_FOUND` | 404 | La venta no existe. |
| `SALE_ALREADY_CANCELLED` | 400 | La venta ya fue anulada previamente. |
| `CANCELLATION_NOT_ALLOWED` | 403 | La venta no puede ser anulada (ej: por política de tiempo). |
| `REASON_IS_REQUIRED` | 400 | No se proveyó un motivo de anulación. |

---

## 💸 Procesamiento de Pagos

Esta sección cubre cómo procesar pagos para una venta existente.

### 5. Procesar Pago de Venta

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
| `Sale already fully paid` | 400 | Se intentó pagar una venta que ya está saldada. | Verificar el estado de la venta antes de intentar un pago. Se puede obtener con `GET /sales/payment-status/{id}`. |
| `Cash register is not open` | 400 | La caja registradora asociada está cerrada. | Abrir una caja antes de procesar pagos. |
| `Insufficient cash` | 400 | `amount_to_apply` es mayor que `amount_received`. | Validar en el frontend que el monto a aplicar no supere el recibido. |


---

## 📊 Consulta de Ventas

Esta sección cubre cómo consultar ventas existentes por rango de fechas.

### 6. Obtener Historial de Pagos de una Venta

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

### 7. Obtener Ventas por Nombre de Cliente

**Endpoint:** `GET /sale/client_name/{name}`

Obtiene una lista paginada de ventas realizadas a un cliente específico, identificado por su nombre.

**Path Parameters:**

| Parámetro | Tipo   | Descripción                                   |
|-----------|--------|-----------------------------------------------|
| `name`    | string | Nombre completo o parcial del cliente.        |

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `page` | number | ❌ No | Número de página (default: 1). Debe ser > 0. |
| `page_size` | number | ❌ No | Cantidad de registros por página (default: 50). Debe ser > 0. |

**Ejemplo de Request:**

```bash
GET /sale/client_name/Juan%20Perez?page=1&page_size=10
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "sale": {
        "sale_id": "24aBcDeF",
        "client_id": "CLIENT_001",
        "client_name": "Juan Pérez",
        "sale_date": "2025-05-15T14:30:00Z",
        "total_amount": 185500.50,
        "status": "PAID",
        "user_id": "USER_123",
        "user_name": "Carlos González",
        "payment_method_id": 1,
        "payment_method": "Efectivo",
        "currency_id": 1,
        "currency": "Guaraníes",
        "metadata": {
          "reserve_id": 123,
          "notes": "Venta con descuento VIP"
        }
      },
      "details": [
        {
          "id": 501,
          "order_id": "24aBcDeF",
          "product_id": "PROD_A",
          "product_name": "Producto Premium",
          "product_type": "PHYSICAL",
          "quantity": 2.0,
          "base_price": 10000.00,
          "unit_price": 9500.00,
          "discount_amount": 500.00,
          "subtotal": 19000.00,
          "tax_amount": 1900.00,
          "total_with_tax": 20900.00,
          "price_modified": true,
          "reserve_id": 0,
          "tax_rate_id": 1
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total_records": 1,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

**Campos del Response:**

Los campos del `Response` (incluyendo los objetos `sale`, `details` y `pagination`) son idénticos a los descritos en la sección `Obtener Ventas por Rango de Fechas`.

**Errores Posibles:**

| Error | HTTP Status | Descripción | Solución |
|-------|-------------|-------------|----------|
| `client name is required` | 400 | El nombre del cliente no fue proporcionado. | Asegurarse de incluir el nombre del cliente en la URL. |
| `Unauthorized` | 401 | Token JWT inválido o ausente. | Verificar que el header `Authorization: Bearer <token>` esté presente y sea válido. |
| `Internal Server Error` | 500 | Error al procesar la consulta en el servidor. | Contactar a soporte si persiste. |

**Validaciones Recomendadas en Frontend:**

1. ✅ Verificar que el `name` del cliente no esté vacío antes de enviar.
2. ✅ Si se especifica `page`, asegurar que sea un número entero > 0.
3. ✅ Si se especifica `page_size`, asegurar que sea un número entero > 0.
4. 💡 Sugerencia: Limitar `page_size` a un máximo razonable (ej: 100) para evitar respuestas muy grandes.

---

### 8. Obtener Ventas por Rango de Fechas

**Endpoint:** `GET /sale/date_range`

Obtiene una lista paginada de ventas dentro de un rango de fechas específico, con detalles completos de cada venta y sus productos.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string | ✅ Sí | Fecha inicial del rango. Formato: `YYYY-MM-DD` o `YYYY-MM-DD HH:MM:SS` |
| `end_date` | string | ✅ Sí | Fecha final del rango. Formato: `YYYY-MM-DD` o `YYYY-MM-DD HH:MM:SS` |
| `page` | number | ❌ No | Número de página (default: 1). Debe ser > 0. |
| `page_size` | number | ❌ No | Cantidad de registros por página (default: 50). Debe ser > 0. |

> **💡 Nota:** Si las fechas se envían en formato `YYYY-MM-DD` (solo fecha), el sistema automáticamente:
> - Agrega `00:00:00` a `start_date`
> - Agrega `23:59:59` a `end_date`

**Ejemplo de Request:**

```bash
GET /sale/date_range?start_date=2025-05-01&end_date=2025-06-19&page=1&page_size=10
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "sale": {
        "sale_id": "24aBcDeF",
        "client_id": "CLIENT_001",
        "client_name": "Juan Pérez",
        "sale_date": "2025-05-15T14:30:00Z",
        "total_amount": 185500.50,
        "status": "PAID",
        "user_id": "USER_123",
        "user_name": "Carlos González",
        "payment_method_id": 1,
        "payment_method": "Efectivo",
        "currency_id": 1,
        "currency": "Guaraníes",
        "metadata": {
          "reserve_id": 123,
          "notes": "Venta con descuento VIP"
        }
      },
      "details": [
        {
          "id": 501,
          "order_id": "24aBcDeF",
          "product_id": "PROD_A",
          "product_name": "Producto Premium",
          "product_type": "PHYSICAL",
          "quantity": 2.0,
          "base_price": 10000.00,
          "unit_price": 9500.00,
          "discount_amount": 500.00,
          "subtotal": 19000.00,
          "tax_amount": 1900.00,
          "total_with_tax": 20900.00,
          "price_modified": true,
          "reserve_id": 0,
          "tax_rate_id": 1
        },
        {
          "id": 502,
          "order_id": "24aBcDeF",
          "product_id": "PROD_B",
          "product_name": "Servicio de Instalación",
          "product_type": "SERVICE",
          "quantity": 1.0,
          "base_price": 50000.00,
          "unit_price": 50000.00,
          "discount_amount": 0.00,
          "subtotal": 50000.00,
          "tax_amount": 5000.00,
          "total_with_tax": 55000.00,
          "price_modified": false,
          "reserve_id": 123,
          "tax_rate_id": 1
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total_records": 45,
    "total_pages": 5,
    "has_next": true,
    "has_previous": false
  }
}
```

**Campos del Response:**

**Nivel Superior:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `data` | array | Lista de ventas con sus detalles. Cada elemento contiene `sale` y `details`. |
| `pagination` | object | Información de paginación. |

**Objeto `sale`:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sale_id` | string | ID único de la venta. |
| `client_id` | string | ID del cliente. |
| `client_name` | string | Nombre completo del cliente. |
| `sale_date` | string (ISO 8601) | Fecha y hora de la venta. |
| `total_amount` | number | Monto total de la venta. |
| `status` | string | Estado de la venta: `PENDING` \| `PAID` \| `CANCELLED` |
| `user_id` | string | ID del usuario que creó la venta. |
| `user_name` | string | Nombre del usuario que creó la venta. |
| `payment_method_id` | number \| null | ID del método de pago. |
| `payment_method` | string \| null | Nombre del método de pago (ej: "Efectivo", "Tarjeta"). |
| `currency_id` | number \| null | ID de la moneda. |
| `currency` | string \| null | Nombre de la moneda (ej: "Guaraníes"). |
| `metadata` | object \| null | Datos adicionales de la venta (reserve_id, notas, etc.). |

**Objeto `details` (array):**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID único del detalle de venta. |
| `order_id` | string | ID de la orden de venta (coincide con `sale_id`). |
| `product_id` | string | ID del producto. |
| `product_name` | string | Nombre del producto o servicio. |
| `product_type` | string | Tipo: `PHYSICAL` (producto físico) \| `SERVICE` (servicio) |
| `quantity` | number | Cantidad vendida (puede tener decimales). |
| `base_price` | number | Precio base original del producto. |
| `unit_price` | number | Precio unitario final de venta (después de descuentos/modificaciones). |
| `discount_amount` | number | Monto de descuento aplicado por unidad. |
| `subtotal` | number | Subtotal sin impuestos (`quantity × unit_price`). |
| `tax_amount` | number | Monto del impuesto. |
| `total_with_tax` | number | Total con impuestos incluidos. |
| `price_modified` | boolean | `true` si el precio fue modificado manualmente. |
| `reserve_id` | number | ID de reserva asociada (0 si no hay). |
| `tax_rate_id` | number | ID de la tasa de impuesto aplicada. |

**Objeto `pagination`:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `page` | number | Número de página actual. |
| `page_size` | number | Cantidad de registros por página. |
| `total_records` | number | Total de registros encontrados. |
| `total_pages` | number | Total de páginas disponibles. |
| `has_next` | boolean | `true` si existe una página siguiente. |
| `has_previous` | boolean | `true` si existe una página anterior. |

**Errores Posibles:**

| Error | HTTP Status | Descripción | Solución |
|-------|-------------|-------------|----------|
| `start_date and end_date are required` | 400 | Falta uno o ambos parámetros de fecha. | Enviar ambos parámetros `start_date` y `end_date` en el query string. |
| `Unauthorized` | 401 | Token JWT inválido o ausente. | Verificar que el header `Authorization: Bearer <token>` esté presente y sea válido. |
| `Internal Server Error` | 500 | Error al procesar la consulta en el servidor. | Verificar el formato de las fechas y contactar a soporte si persiste. |

**Validaciones Recomendadas en Frontend:**

1. ✅ Verificar que `start_date` y `end_date` no estén vacíos antes de enviar.
2. ✅ Validar que `end_date` sea mayor o igual a `start_date`.
3. ✅ Si se especifica `page`, asegurar que sea un número entero > 0.
4. ✅ Si se especifica `page_size`, asegurar que sea un número entero > 0.
5. 💡 Sugerencia: Limitar `page_size` a un máximo razonable (ej: 100) para evitar respuestas muy grandes.

---

## 🔄 Casos de Uso

### Caso 1: Venta con Descuento por Porcentaje

**Escenario:** Vender un producto con un 15% de descuento por ser cliente VIP.

**Request a `POST /sales/orders`:**
```json
{
  "client_id": "CLIENT_VIP_007",
  "allow_price_modifications": true,
  "product_details": [
    {
      "product_id": "PROD_PREMIUM",
      "quantity": 1,
      "discount_percent": 15,
      "discount_reason": "Descuento 15% Cliente VIP"
    }
  ]
}
```
**Resultado:** El precio final del producto se calculará con un 15% de descuento sobre su precio base.

### Caso 2: Venta con Modificación Manual de Precio

**Escenario:** Vender un producto con un precio especial acordado con el cliente.

**Request a `POST /sales/orders`:**
```json
{
  "client_id": "CLIENT_002",
  "allow_price_modifications": true,
  "product_details": [
    {
      "product_id": "PROD_NEGOCIADO",
      "quantity": 10,
      "sale_price": 8750,
      "price_change_reason": "Acuerdo especial por volumen"
    }
  ]
}
```
**Resultado:** El producto se venderá a 8,750 Gs. la unidad, sin importar su precio original.

### Caso 3: Pago Exacto (Modo Simple)

**Escenario:** Una venta tiene un saldo pendiente de 50.000 Gs. y el cliente paga exactamente eso.

**Request a `POST /payment/process-partial`:**
```json
{
  "sales_order_id": "ID_DE_LA_VENTA",
  "amount_received": 50000.00
}
```
**Resultado:**
- `amount_applied`: 50000.00
- `change_given`: 0.00
- `sale_status`: "PAID"

### Caso 4: Pago con Vuelto (Modo Avanzado)

**Escenario:** Una venta tiene un saldo de 164.000 Gs. El cliente paga con un billete de 200.000 Gs.

**Request a `POST /payment/process-partial`:**
```json
{
  "sales_order_id": "ID_DE_LA_VENTA",
  "amount_received": 200000.00,
  "amount_to_apply": 164000.00,
  "cash_register_id": 1
}
```
**Resultado:**
- `cash_received`: 200000.00
- `amount_applied`: 164000.00
- `change_given`: 36000.00
- `requires_change`: `true` (¡Indicar al cajero que debe dar vuelto!)

### Caso 5: Consultar Ventas del Mes

**Escenario:** Necesitas obtener todas las ventas del mes de mayo de 2025, mostrando 20 registros por página.

**Request a `GET /sale/date_range`:**
```
GET /sale/date_range?start_date=2025-05-01&end_date=2025-05-31&page=1&page_size=20
```

**Resultado:**
- Se obtiene una lista paginada de todas las ventas entre 2025-05-01 00:00:00 y 2025-05-31 23:59:59
- Cada venta incluye información completa del cliente, usuario, y montos
- Cada venta incluye el detalle completo de productos con precios, descuentos y cálculos de impuestos
- El objeto `pagination` indica cuántas páginas hay disponibles y si se puede navegar a la siguiente

**Uso típico:**
- Reportes diarios/mensuales de ventas
- Dashboard de resumen de ventas
- Exportación de datos para contabilidad
- Consulta histórica de transacciones

---

## 🔍 Validaciones del Sistema

### Validaciones en Frontend (Recomendadas)

**Para `POST /sales/orders`:**
1.  ✅ Si se usa `discount_amount` o `discount_percent`, asegurar que `discount_reason` no esté vacío.
2.  ✅ Si se usa `sale_price`, asegurar que `price_change_reason` no esté vacío.
3.  ✅ No permitir `discount_amount` y `discount_percent` en el mismo item.
4.  ✅ Validar que `discount_percent` esté entre 0 y 100.

**Para `POST /payment/process-partial`:**
1.  ✅ `amount_received` debe ser un número positivo.
2.  ✅ Si se usa `amount_to_apply`, validar que `amount_received >= amount_to_apply`.
3.  ✅ Antes de enviar, consultar el saldo de la venta y validar que `amount_to_apply` no lo exceda.

---

## 🎯 Recomendaciones de Implementación

### Flujo Completo de Venta y Pago

1.  **Crear la Venta:** El usuario arma el carrito. Al confirmar, enviar la solicitud a `POST /sales/orders`.
2.  **Guardar el ID:** Al recibir una respuesta exitosa, guardar el `sale_id` retornado.
3.  **Proceder al Pago:** Usar el `sale_id` para realizar una o más llamadas a `POST /payment/process-partial` hasta que la venta esté pagada.
4.  **Manejar el Vuelto:** Si la respuesta de pago incluye `requires_change: true`, mostrar una alerta clara al cajero con el monto de `change_given`.
5.  **Finalizar:** Una vez `payment_complete: true`, se puede imprimir el recibo y finalizar el flujo.

---

## 🔗 Recursos Adicionales

Para una especificación técnica completa y machine-readable de esta API, consulta el siguiente archivo OpenAPI 3.0:

- **OpenAPI Spec:** [`sales.json`](../api/sales.json)

---

## 📝 Historial de Cambios

### v1.6 - 10 de Diciembre de 2025
- ✅ Agregada documentación del endpoint `GET /sales/{id}/payments` para obtener el historial de pagos de una venta.
- ✅ Re-numerados los apartados de la sección "Consulta de Ventas".

### v1.5 - 09 de Diciembre de 2025
- ✅ Agregada documentación del endpoint `GET /sale/client_name/{name}` para obtener ventas por nombre de cliente.
- ✅ Re-numerados los apartados para mantener el orden lógico.
- ✅ Actualizada la versión del documento de 1.4 a 1.5.

### v1.4 - 09 de Diciembre de 2025
- ✅ Agregada documentación para la anulación de ventas (`GET /sale/{id}/preview-cancellation` y `PUT /sale/{id}`).
- ✅ Creada nueva sección "🚫 Anulación de Ventas".
- ✅ Re-numerados los apartados para mantener el orden lógico.
- ✅ Actualizada la versión del documento de 1.3 a 1.4.

### v1.3 - 09 de Diciembre de 2025
- ✅ Agregada documentación del endpoint `POST /sale/{id}/products` para agregar productos a una venta existente.
- ✅ Creada nueva sección "✍️ Modificación de Ventas".
- ✅ Re-numerados los apartados para mantener el orden lógico.
- ✅ Actualizada la versión del documento de 1.2 a 1.3.

### v1.2 - 08 de Diciembre de 2025
- ✅ Agregada documentación del endpoint `GET /sale/date_range` para consulta de ventas por rango de fechas.
- ✅ Incluida nueva sección "📊 Consulta de Ventas" con documentación completa del endpoint.
- ✅ Agregado Caso de Uso 5: "Consultar Ventas del Mes" con ejemplos prácticos.
- ✅ Documentada estructura completa de response con objetos `data`, `sale`, `details` y `pagination`.
- ✅ Especificadas validaciones recomendadas para parámetros de query (query parameters).
- ✅ Aclarado el uso correcto de query parameters en lugar de request body para peticiones GET.

### v1.1 - 08 de Diciembre de 2025
- ✅ Alineado con la guía de documentación `FRONTEND_API_DOCUMENTATION_GUIDE.md`.
- ✅ Agregada tabla de `Campos del Response` para el endpoint de creación de ventas.
- ✅ Movidos los errores a secciones `Errores Posibles` por cada endpoint.
- ✅ Añadida columna `Solución` en las tablas de errores.
- ✅ Eliminada la sección global de errores.
- ✅ Actualizada la versión del documento de 1.0 a 1.1.

### v1.0 - 08 de Noviembre de 2025
- ✅ Versión inicial de la guía unificada de ventas y pagos.
