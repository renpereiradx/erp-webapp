# 💳 API de Pagos de Compras

**Versión:** 2.0  
**Fecha:** 17 de Noviembre de 2025  
**Endpoint Base:** `http://localhost:5050`

---

## 📋 Descripción General

Esta documentación detalla el **sistema de pagos de compras**, diseñado para integrarse con órdenes de compra existentes. Permite procesar pagos parciales o completos, obtener estadísticas financieras y garantizar la integridad de los datos de pago.

### Características Principales

- ✅ **Pagos Parciales y Completos**: Soporte para registrar múltiples pagos por cada orden de compra.
- ✅ **Validación Automática**: El sistema verifica que los montos de pago no excedan el saldo pendiente.
- ✅ **Trazabilidad Completa**: Cada pago genera un registro detallado para auditoría.
- ✅ **Estadísticas Financieras**: Endpoints para analizar los pagos realizados en un período determinado.
- ✅ **Integración con Órdenes Existentes**: Compatible con el sistema de órdenes de compra.

> 💡 **Ver también**: Para crear y gestionar órdenes de compra, consulta la guía de la API de Órdenes de Compra.

---

## 📝 Historial de Cambios

### v2.1 - 19 de Noviembre de 2025
- ✅ El campo `cash_register_id` en `POST /purchase/payment/process` ahora es opcional. Esto permite registrar pagos de compras sin asociarlos directamente a una caja registradora.

### v2.0 - 17 de Noviembre de 2025
- ⚠️ **Breaking**: Documentación reestructurada para seguir el estándar de `FRONTEND_API_DOCUMENTATION_GUIDE.md`.
- ✅ Agregadas tablas de parámetros, errores y validaciones para cada endpoint.
- ✅ Reemplazados los modelos de datos de TypeScript con tablas descriptivas.
- ✅ Mejorados los ejemplos con datos más realistas.
- ✅ Estandarizado el uso de emojis y formato.

### v1.0 - 23 de Agosto de 2025
- ✅ Versión inicial del sistema de pagos de compras.

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
La mayoría de los endpoints `POST` retornan una estructura similar a esta:
```json
{
  "success": true,
  "data": {
    "payment_id": 15,
    "message": "Payment processed successfully"
  },
  "error": null
}
```

---

## 💸 Endpoints de Pagos

### 1. Procesar Pago de Compra

**Endpoint:** `POST /purchase/payment/process`

Procesa un pago (parcial o completo) para una orden de compra existente. Si se proporciona un `cash_register_id`, el pago se descuenta del saldo de esa caja. De lo contrario, el pago se registra sin afectar ninguna caja.

**Request Body:**
```json
{
  "purchase_order_id": 42,
  "amount_paid": 150000,
  "payment_reference": "TRANS-2025-11-001",
  "payment_notes": "Adelanto del 50% para la orden de compra #42",
  "cash_register_id": 3
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|---------------------|--------|-----------|--------------------------------------------------------------------------------|
| `purchase_order_id` | number | ✅ Sí | ID de la orden de compra a la que se aplica el pago. |
| `amount_paid` | number | ✅ Sí | Monto a pagar. Debe ser un entero mayor a 0. |
| `payment_reference` | string | ❌ No | Código o referencia externa del pago (ej. número de transferencia). |
| `payment_notes` | string | ❌ No | Notas adicionales sobre el pago. |
| `cash_register_id` | number | ❌ No | ID de la caja registradora para descontar el pago. Si se omite, el pago se registra sin afectar el saldo de ninguna caja. |

**Response (200 OK):**
```json
{
  "success": true,
  "payment_id": 15,
  "purchase_order_id": 42,
  "payment_details": {
    "amount_paid": 150000,
    "outstanding_amount": 75000,
    "total_paid_so_far": 150000,
    "total_order_amount": 225000,
    "payment_status": "partial",
    "order_fully_paid": false
  },
  "message": "Payment processed successfully",
  "processed_at": "2025-11-17T10:00:00Z",
  "processed_by": "usuario_admin"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-----------------------------|-------------|--------------------------------------------------------------------|
| `Purchase order not found` | 404 | La orden de compra con el `purchase_order_id` no existe. |
| `Cash register not found` | 404 | La caja registradora con el `cash_register_id` no existe o no está abierta. |
| `Invalid amount` | 400 | El `amount_paid` es menor o igual a cero. |
| `Payment amount exceeds outstanding balance` | 400 | El `amount_paid` es mayor que el saldo pendiente de la orden. |
| `Insufficient funds in cash register` | 400 | La caja registradora no tiene fondos suficientes para cubrir el pago. |

**Validaciones Recomendadas en Frontend:**

1. ✅ Validar que `amount_paid` sea un número positivo antes de enviar.
2. ✅ Asegurarse de que el `cash_register_id` seleccionado corresponda a una caja abierta.
3. ⚠️ Antes de enviar, se puede consultar el saldo de la orden para advertir al usuario si el monto a pagar es mayor al pendiente.

---

### 2. Obtener Estadísticas de Pagos

**Endpoint:** `GET /purchase/payment/statistics`

Obtiene un resumen consolidado de los pagos de compras, ideal para análisis financiero y reportes.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-------------|--------|-----------|--------------------------------------------------------------------------------|
| `start_date` | string | ❌ No | Fecha de inicio del período de análisis (formato `YYYY-MM-DD`). |
| `end_date` | string | ❌ No | Fecha de fin del período de análisis (formato `YYYY-MM-DD`). |
| `supplier_id`| number | ❌ No | Filtrar estadísticas para un proveedor específico. |

**Ejemplo de Request:**
```bash
GET http://localhost:5050/purchase/payment/statistics?start_date=2025-10-01&end_date=2025-10-31
```

**Response (200 OK):**
```json
{
  "period": {
    "start_date": "2025-10-01",
    "end_date": "2025-10-31",
    "supplier_id": null
  },
  "order_statistics": {
    "total_orders_in_period": 25,
    "fully_paid_orders": 18,
    "partially_paid_orders": 5,
    "unpaid_orders": 2,
    "payment_completion_rate": 0.72
  },
  "financial_summary": {
    "total_order_amount": 12500750,
    "total_paid_amount": 9200500,
    "total_outstanding": 3300250,
    "payment_percentage": 73.6
  },
  "generated_at": "2025-11-17T11:00:00Z"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------------------|-------------|--------------------------------------------------------------------|
| `Invalid date format` | 400 | Las fechas no cumplen con el formato `YYYY-MM-DD`. |
| `Supplier not found` | 404 | El `supplier_id` proporcionado no existe. |

---

## 📊 Estructuras de Datos Clave

### Objeto `payment_details`

Este objeto se retorna en la respuesta de un pago exitoso y detalla el estado de la orden de compra después del pago.

| Campo | Tipo | Descripción |
|----------------------|------------------|--------------------------------------------------------------------|
| `amount_paid` | number | Monto que se pagó en esta transacción específica. |
| `outstanding_amount` | number | Saldo que queda por pagar en la orden después de este pago. |
| `total_paid_so_far` | number | Suma de todos los pagos realizados para esta orden hasta la fecha. |
| `total_order_amount` | number | Costo total original de la orden de compra. |
| `payment_status` | string | Estado del pago de la orden: `partial` \| `complete`. |
| `order_fully_paid` | boolean | `true` si la orden ha sido pagada en su totalidad. |

---

## ❌ Manejo de Errores

### Estructura de Respuesta de Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje de error legible para humanos."
  },
  "data": null
}
```

### Códigos de Error Comunes

| Código de Error | HTTP Status | Causa | Solución / Prevención |
|-----------------------------------------|-------------|------------------------------------------------|------------------------------------------------------------------------------------------------|
| `PURCHASE_ORDER_NOT_FOUND` | 404 | El ID de la orden de compra no existe. | Verificar que el ID sea correcto o seleccionarlo de una lista de órdenes pendientes. |
| `CASH_REGISTER_NOT_FOUND` | 404 | La caja registradora no existe o no está abierta. | Obtener la lista de cajas abiertas desde `GET /cash-registers/active` antes de realizar el pago. |
| `PAYMENT_EXCEEDS_BALANCE` | 400 | El monto del pago es superior al saldo pendiente. | Validar en el frontend que el monto a pagar no supere el `outstanding_amount` de la orden. |
| `INSUFFICIENT_FUNDS` | 400 | La caja no tiene saldo suficiente. | Consultar el saldo de la caja antes de procesar el pago. |
| `INVALID_AMOUNT` | 400 | El monto es cero o negativo. | Validar en el frontend que el monto sea siempre un número positivo. |
| `INSUFFICIENT_PERMISSIONS` | 403 | El usuario no tiene permisos para procesar pagos. | Asegurarse de que el usuario tenga el rol adecuado. |

---

## 🔄 Casos de Uso

### Caso 1: Procesar un Pago Parcial

**Escenario:** Un cliente desea realizar un pago inicial de Gs. 150.000 para una orden de compra de Gs. 225.000.

**Request:**
```json
POST /purchase/payment/process
{
  "purchase_order_id": 42,
  "amount_paid": 150000,
  "payment_reference": "ADELANTO-OC-42",
  "payment_notes": "Primer pago parcial de la orden #42",
  "cash_register_id": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "payment_id": 15,
  "purchase_order_id": 42,
  "payment_details": {
    "amount_paid": 150000,
    "outstanding_amount": 75000,
    "total_paid_so_far": 150000,
    "total_order_amount": 225000,
    "payment_status": "partial",
    "order_fully_paid": false
  },
  "message": "Payment processed successfully",
  "processed_at": "2025-11-17T10:00:00Z",
  "processed_by": "usuario_admin"
}
```

**Resultado:**
- ✅ Se registra el pago de Gs. 150.000.
- ✅ El `outstanding_amount` de la orden se actualiza a Gs. 75.000.
- ✅ El `payment_status` de la orden se mantiene como `partial`.
- ✅ `order_fully_paid` es `false`.

### Caso 2: Completar un Pago Parcial

**Escenario:** El cliente regresa para pagar el saldo restante de Gs. 75.000 para la misma orden de compra #42.

**Request:**
```json
POST /purchase/payment/process
{
  "purchase_order_id": 42,
  "amount_paid": 75000,
  "payment_reference": "SALDO-OC-42",
  "payment_notes": "Pago final de la orden #42",
  "cash_register_id": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "payment_id": 16,
  "purchase_order_id": 42,
  "payment_details": {
    "amount_paid": 75000,
    "outstanding_amount": 0,
    "total_paid_so_far": 225000,
    "total_order_amount": 225000,
    "payment_status": "complete",
    "order_fully_paid": true
  },
  "message": "Payment processed successfully",
  "processed_at": "2025-11-17T11:30:00Z",
  "processed_by": "usuario_admin"
}
```

**Resultado:**
- ✅ Se registra el pago de Gs. 75.000.
- ✅ El `outstanding_amount` de la orden se actualiza a Gs. 0.
- ✅ El `payment_status` de la orden cambia a `complete`.
- ✅ `order_fully_paid` es `true`.

---

## 🔄 Flujo de Trabajo Recomendado

### 1. Procesar un Pago
1.  **Seleccionar Orden**: El usuario elige una orden de compra con saldo pendiente.
2.  **Obtener Datos de la Orden**: (Opcional) Hacer un `GET /purchase/order/{id}` para obtener el `outstanding_amount` y mostrarlo en la UI.
3.  **Ingresar Monto**: El usuario ingresa el monto a pagar y selecciona una caja registradora.
4.  **Enviar Pago**: Llamar a `POST /purchase/payment/process` con los datos.
5.  **Actualizar UI**: Si el pago es exitoso, actualizar el estado de la orden en la UI con la información del objeto `payment_details`.

### 2. Monitoreo y Análisis
1.  **Seleccionar Rango**: El usuario define un rango de fechas o un proveedor para el análisis.
2.  **Consultar Estadísticas**: Llamar a `GET /purchase/payment/statistics` con los parámetros de consulta.
3.  **Mostrar Reporte**: Presentar los datos de `order_statistics` y `financial_summary` en un dashboard o reporte.

---

## 🎯 Recomendaciones de Implementación

1.  **Validación en UI**: Aunque el backend valida todo, es crucial validar los montos y la selección de la caja en el frontend para una mejor experiencia de usuario y para prevenir errores innecesarios.
2.  **Manejo de Decimales**: Todos los montos son manejados como enteros en el backend (guaraníes). Asegúrate de que el frontend no envíe valores decimales para los montos.
3.  **Consistencia con Ventas**: Esta API sigue un patrón muy similar al sistema de pagos de ventas. Reutiliza componentes y lógica siempre que sea posible para acelerar el desarrollo.
4.  **Feedback al Usuario**: Después de cada operación, muestra un mensaje claro (éxito o error) al usuario. Utiliza el campo `message` de la respuesta.