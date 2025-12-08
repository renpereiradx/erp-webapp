# 🛒 Ventas y Pagos - Guía Completa de API

**Versión:** 1.1
**Fecha:** 08 de Diciembre de 2025
**Endpoint Base:** `http://localhost:5050`
**Estado:** ✅ Production Ready

---

## 📋 Descripción General

Esta guía unifica la documentación para todo el ciclo de vida de una venta, desde su creación hasta su pago completo. El sistema de ventas es flexible y soporta modificaciones de precios, descuentos por producto, y la integración con reservas de servicios.

El proceso se divide en dos acciones principales, cada una con su propio endpoint:
1.  **Crear una Venta:** A través de `POST /sales/orders`, se registra una nueva orden de venta, especificando cliente, productos, y posibles descuentos o precios especiales.
2.  **Procesar un Pago:** A través de `POST /payment/process-partial`, se registran los pagos (parciales o completos) para una venta ya creada, con manejo avanzado de efectivo y vuelto.

### Características Principales

- ✅ **Creación de Ventas Flexibles**: Soporte para productos y servicios.
- ✅ **Modificación de Precios**: Permite ajustar precios manualmente con justificación.
- ✅ **Sistema de Descuentos**: Aplica descuentos por monto fijo o porcentaje a productos individuales.
- ✅ **Integración con Reservas**: Convierte una reserva confirmada en una venta.
- ✅ **Procesamiento de Pagos Avanzado**: Maneja pagos parciales, completos y cálculo de vuelto.
- ✅ **Integración con Caja Registradora**: Todos los pagos se asocian a una caja abierta.

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

## 💸 Procesamiento de Pagos

Esta sección cubre cómo procesar pagos para una venta existente.

### 2. Procesar Pago de Venta

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

## 📝 Historial de Cambios

### v1.1 - 08 de Diciembre de 2025
- ✅ Alineado con la guía de documentación `FRONTEND_API_DOCUMENTATION_GUIDE.md`.
- ✅ Agregada tabla de `Campos del Response` para el endpoint de creación de ventas.
- ✅ Movidos los errores a secciones `Errores Posibles` por cada endpoint.
- ✅ Añadida columna `Solución` en las tablas de errores.
- ✅ Eliminada la sección global de errores.
- ✅ Actualizada la versión del documento de 1.0 a 1.1.

### v1.0 - 08 de Noviembre de 2025
- ✅ Versión inicial de la guía unificada de ventas y pagos.