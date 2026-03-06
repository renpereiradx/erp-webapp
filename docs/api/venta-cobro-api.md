# API Unificada: Ventas y Cobros de Ventas

**Versión:** 2.0  
**Fecha:** 2026-03-05  
**Base URL (Swagger):** `http://localhost:5050`

---

## 1) Alcance

Este documento unifica la operación funcional del módulo de **ventas** y **cobros de ventas**, incluyendo:

- Alta y consulta de ventas
- Estado de pago y confirmación de pago
- Cancelación y previsualización de cancelación
- Cobros completos y parciales
- Estadísticas/totales de cobros
- Integración de cobro con caja registradora
- Endpoints de soporte para front de cobros (bootstrap y métodos de pago)

---

## 2) Autenticación

Todos los endpoints de este documento requieren JWT:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 3) Convenciones de parámetros y respuestas

- **Fechas en query:** `YYYY-MM-DD` (en algunos endpoints también se acepta `YYYY-MM-DD HH:MM:SS`).
- **Paginación estándar:** `page` y `page_size`.
- **Errores de negocio de venta:** pueden devolver objeto estructurado `SaleErrorResponse` con `error_code`.
- **Errores en cobros:** varios endpoints retornan JSON con `success=false`, `error`, `error_code`; otros usan `http.Error` (texto plano).
- **Campos monetarios:** `number/double`.
- **Filtros backend habilitados en endpoints de estado de pago:**
  - `GET /sale/date_range/payment-status` soporta `payment_status` (PAID, PENDING, PARTIAL, CANCELLED).
  - `GET /sale/client_name/{name}/payment-status` soporta `start_date`, `end_date` y `payment_status`.

---

## 4) Índice de endpoints

### Soporte de cobros

1. `GET /payments/bootstrap`
2. `GET /payment-methods`
3. `GET /payment-methods/{id}`
4. `GET /payment-methods/code/{code}`

### Ventas

5. `POST /sale/`
6. `POST /sale/with-units`
7. `GET /sale/price-changes/report`
8. `GET /sale/date_range`
9. `GET /sale/date_range/payment-status`
10. `GET /sale/client_id/{client_id}`
11. `GET /sale/client_id/{client_id}/pending`
12. `GET /sale/client_name/{name}`
13. `GET /sale/client_name/{name}/payment-status`
14. `GET /sale/{id}`
15. `PUT /sale/{id}`
16. `GET /sale/{id}/with-metadata`
17. `GET /sale/{id}/payment-status`
18. `PUT /sale/{id}/confirm-payment`
19. `GET /sale/{id}/preview-cancellation`
20. `POST /sale/{id}/products`

### Cobros de ventas

21. `POST /payment/process`
22. `POST /payment/process-partial`
23. `GET /payment/details/{saleId}`
24. `GET /payment/{paymentId}`
25. `GET /payment/statistics/change`
26. `GET /payment/totals/sales`
27. `POST /cash-registers/payments/sale`

---

## 5) Detalle completo por endpoint

## 5.1 Soporte de cobros

### 1) GET `/payments/bootstrap`

- **Objetivo:** inicializar front de cobros en una sola llamada.
- **Path params:** ninguno.
- **Query params:** ninguno.
- **Body:** no aplica.
- **Respuesta exitosa (200):** `PaymentsBootstrap`
  - `currencies[]`, `payment_methods[]`, `exchange_rates`, `config`, `generated_at`.
- **Errores:**
  - `500`: error interno al consolidar datos.

### 2) GET `/payment-methods`

- **Objetivo:** listar métodos de pago disponibles.
- **Path params:** ninguno.
- **Query params:** ninguno.
- **Body:** no aplica.
- **Respuesta exitosa (200):** `PaymentMethod[]`.
- **Errores:**
  - `500`: error interno.

### 3) GET `/payment-methods/{id}`

- **Objetivo:** obtener método de pago por ID.
- **Path params:**
  - `id` (int, requerido).
- **Respuesta exitosa (200):** `PaymentMethod`.
- **Errores:**
  - `400`: ID inválido.
  - `404`: método no encontrado.
  - `500`: error interno.

### 4) GET `/payment-methods/code/{code}`

- **Objetivo:** obtener método de pago por código.
- **Path params:**
  - `code` (string, requerido).
- **Respuesta exitosa (200):** `PaymentMethod`.
- **Errores:**
  - `404`: método no encontrado.
  - `500`: error interno.

---

## 5.2 Ventas

### 5) POST `/sale/`

- **Objetivo:** procesar y registrar venta.
- **Body (SaleRequest):**
  - `client_id` (requerido)
  - `product_details[]` (requerido salvo cuando se usa `reserve_id`)
  - opcionales: `sale_id`, `reserve_id`, `payment_method_id`, `currency_id`, `allow_price_modifications`.
- **Ejemplo body:**

```json
{
  "client_id": "CLI-001",
  "product_details": [
    {
      "product_id": "PRD-001",
      "quantity": 2,
      "sale_price": 10000
    }
  ],
  "allow_price_modifications": false
}
```

- **Respuesta exitosa (200):** `ProcessSaleEnhancedResponse`
  - `success`, `sale_id`, `total_amount`, `items_processed`, `message`, `validation_summary`, etc.
- **Errores:**
  - `400`: body inválido, `client_id` faltante, reglas de validación (`PRICE_CHANGE_REASON_REQUIRED`, `INVALID_RESERVATION`).
  - `401`: token inválido/ausente.
  - `403`: `PRICE_MODIFICATION_NOT_ALLOWED`.
  - `409`: `INSUFFICIENT_STOCK`.
  - `500`: `PROCESSING_ERROR` u otro error interno.

### 6) POST `/sale/with-units`

- **Objetivo:** calcular venta con unidades/cantidades decimales (no persiste la venta).
- **Body (SaleWithUnitsRequest):**
  - `client_id` (requerido)
  - `details[]` con `product_id`, `quantity`, `unit?`.
- **Respuesta exitosa (200):** `SaleWithUnitsResponse`
  - `message`, `client_id`, `user_id`, `total`, `details[]`.
- **Errores:**
  - `400`: unidad inválida o stock insuficiente.
  - `401`: no autorizado.
  - `500`: error de validación/cálculo interno.

### 7) GET `/sale/price-changes/report`

- **Objetivo:** reporte de cambios de precio aplicados en ventas.
- **Query params (opcionales):**
  - `sale_id`, `start_date`, `end_date`, `user_id`.
- **Respuesta exitosa (200):** `PriceChangesReportResponse` (`report`, `filters`).
- **Errores:**
  - `401`: no autorizado.
  - `500`: error interno.

### 8) GET `/sale/date_range`

- **Objetivo:** listar ventas por rango de fecha (paginado).
- **Query params:**
  - `start_date` (requerido)
  - `end_date` (requerido)
  - `page` (default 1)
  - `page_size` (default 50)
- **Respuesta exitosa (200):** `PaginatedSalesResponse` (`data[]`, `pagination`).
- **Errores:**
  - `400`: faltan/son inválidas las fechas.
  - `401`: no autorizado.
  - `500`: error interno.

### 9) GET `/sale/date_range/payment-status`

- **Objetivo:** ventas por fecha con resumen de estado de pago.
- **Query params:**
  - `start_date` (requerido)
  - `end_date` (requerido)
  - `page` (default 1)
  - `page_size` (default 10)
  - `payment_status` (opcional: PAID, PENDING, PARTIAL, CANCELLED)
- **Respuesta exitosa (200):** `PaginatedSalesPaymentStatusResponse`.
- **Errores:**
  - `400`: fechas faltantes/incorrectas.
  - `401`: no autorizado.
  - `500`: error interno.

### 10) GET `/sale/client_id/{client_id}`

- **Objetivo:** listar ventas de un cliente por ID.
- **Path params:** `client_id` (string, requerido).
- **Respuesta exitosa (200):** `SaleEnhancedResponse[]`.
- **Errores:**
  - `401`: no autorizado.
  - `404`: cliente sin ventas.
  - `500`: error interno.

### 11) GET `/sale/client_id/{client_id}/pending`

- **Objetivo:** ventas pendientes del cliente.
- **Path params:** `client_id` (string, requerido).
- **Respuesta exitosa (200):** `SaleEnhancedResponse[]`.
- **Errores:**
  - `401`: no autorizado.
  - `500`: error interno.

### 12) GET `/sale/client_name/{name}`

- **Objetivo:** buscar ventas por nombre de cliente (paginado).
- **Path params:** `name` (string, requerido).
- **Query params:** `page` (default 1), `page_size` (default 50).
- **Respuesta exitosa (200):** `PaginatedSalesResponse`.
- **Errores:**
  - `400`: parámetro inválido.
  - `401`: no autorizado.
  - `500`: error interno.

### 13) GET `/sale/client_name/{name}/payment-status`

- **Objetivo:** ventas por cliente con estado de pago (paginado).
- **Path params:** `name` (string, requerido).
- **Query params:**
  - `page` (default 1)
  - `page_size` (default 10)
  - `start_date` (opcional, formato `YYYY-MM-DD`)
  - `end_date` (opcional, formato `YYYY-MM-DD`)
  - `payment_status` (opcional: PAID, PENDING, PARTIAL, CANCELLED)
- **Respuesta exitosa (200):** `PaginatedSalesPaymentStatusResponse`.
- **Errores:**
  - `400`: parámetro inválido.
  - `401`: no autorizado.
  - `500`: error interno.

### 14) GET `/sale/{id}`

- **Objetivo:** obtener una venta por ID.
- **Path params:** `id` (string, requerido).
- **Respuesta exitosa (200):** `SaleEnhancedResponse`.
- **Errores:**
  - `401`: no autorizado.
  - `404`: venta no encontrada.
  - `500`: error interno.

### 15) PUT `/sale/{id}`

- **Objetivo:** cancelar una venta.
- **Path params:** `id` (string, requerido).
- **Body (opcional):** `CancelSaleRequest` con `reason`.
- **Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Sale cancelled successfully",
  "sale_id": "SALE-001"
}
```

- **Errores:**
  - `401`: no autorizado.
  - `404`: `SALE_NOT_FOUND`.
  - `409`: `ALREADY_CANCELLED`.
  - `500`: `CANCELLATION_ERROR`.

### 16) GET `/sale/{id}/with-metadata`

- **Objetivo:** obtener venta + metadata de precios/impuestos.
- **Path params:** `id` (string, requerido).
- **Respuesta exitosa (200):** `SaleWithMetadataResponse` (`sale`, `metadata`).
- **Errores:**
  - `400`: ID inválido/vacío.
  - `401`: no autorizado.
  - `500`: error interno.

### 17) GET `/sale/{id}/payment-status`

- **Objetivo:** estado completo de pagos de una venta.
- **Path params:** `id` (string, requerido).
- **Respuesta exitosa (200):** `SalePaymentStatusResponse`
  - incluye `total_paid`, `balance_due`, `payment_progress`, `payments[]`, `is_fully_paid`.
- **Errores:**
  - `400`: ID inválido.
  - `401`: no autorizado.
  - `404`: venta no encontrada.
  - `500`: error interno.

### 18) PUT `/sale/{id}/confirm-payment`

- **Objetivo:** confirmar pago de una venta (registro/confirmación operativa).
- **Path params:** `id` (string, requerido).
- **Body (ConfirmSalePaymentRequest):**
  - `payment_reference` (opcional)
  - `payment_notes` (opcional)
- **Respuesta exitosa (200):** `MessageResponse`

```json
{
  "message": "Payment confirmed successfully"
}
```

- **Errores:**
  - `400`: body inválido.
  - `401`: no autorizado.
  - `500`: error interno.

### 19) GET `/sale/{id}/preview-cancellation`

- **Objetivo:** previsualizar impacto de reversión antes de cancelar.
- **Path params:** `id` (string, requerido).
- **Respuesta exitosa (200):** objeto dinámico con impacto de reversión (`additionalProperties: true`).
- **Errores:**
  - `401`: no autorizado.
  - `404`: venta no encontrada (`SaleErrorResponse`).
  - `500`: error interno (`PREVIEW_ERROR`).

### 20) POST `/sale/{id}/products`

- **Objetivo:** agregar productos a una venta existente.
- **Path params:** `id` (string, requerido).
- **Body (AddProductsToSaleRequest):**
  - `product_details[]` (requerido)
  - `allow_price_modifications` (opcional)
- **Respuesta exitosa (200):** `AddProductsToSaleResponse`
  - `products_added`, `previous_total`, `added_amount`, `new_total`, `sale_status`.
- **Errores:**
  - `400`: body inválido, lista vacía o regla de negocio.
  - `401`: no autorizado.
  - `500`: error interno.

---

## 5.3 Cobros de ventas

### 21) POST `/payment/process`

- **Objetivo:** registrar cobro completo de una venta y calcular vuelto.
- **Body (ProcessPaymentRequest):**
  - `sales_order_id` (requerido)
  - `amount_received` (requerido, `>= 0`)
  - opcionales: `payment_reference`, `payment_notes`, `cash_register_id`.
- **Ejemplo body:**

```json
{
  "sales_order_id": "SALE-001",
  "amount_received": 150000,
  "payment_reference": "REC-0001",
  "payment_notes": "Pago contado"
}
```

- **Respuesta exitosa (200):** `ProcessPaymentResponse`
  - `success`, `payment_id`, `sale_id`, `payment_details`, `requires_change`, `processed_at`, `processed_by`.
- **Errores:**
  - `400`: body inválido o validación de negocio (`success=false`, `error`, `error_code`).
  - `401`: no autorizado.
  - `500`: error interno al procesar.

### 22) POST `/payment/process-partial`

- **Objetivo:** registrar cobro parcial y actualizar saldo.
- **Body (ProcessPartialPaymentRequest):**
  - `sales_order_id` (requerido)
  - `amount_received` (requerido, `>= 0`)
  - opcionales: `amount_to_apply`, `cash_register_id`, `payment_reference`, `payment_notes`.
- **Respuesta exitosa (200):** `ProcessPartialPaymentResponse`
  - `payment_summary` (saldo previo, aplicado, restante), `cash_summary`, `payment_complete`.
- **Errores:**
  - `400`: body inválido o validación de negocio (`success=false`, `error`, `error_code`).
  - `401`: no autorizado.
  - `500`: error interno.

### 23) GET `/payment/details/{saleId}`

- **Objetivo:** listar detalles de pagos de ventas con filtros.
- **Path params:**
  - `saleId` (string, requerido en ruta).
- **Query params (opcionales):**
  - `sale_id` (si se envía, sobreescribe filtro de `saleId`)
  - `payment_id` (int)
  - `start_date` (`YYYY-MM-DD`)
  - `end_date` (`YYYY-MM-DD`)
- **Respuesta exitosa (200):** `SalePaymentWithDetails[]`.
- **Errores:**
  - `400`: `payment_id` inválido o fechas en formato incorrecto.
  - `401`: no autorizado.
  - `500`: error interno.

### 24) GET `/payment/{paymentId}`

- **Objetivo:** obtener un pago por ID.
- **Path params:** `paymentId` (int, requerido).
- **Respuesta exitosa (200):** `SalePaymentWithDetails`.
- **Errores:**
  - `400`: ID inválido/faltante.
  - `401`: no autorizado.
  - `404`: pago no encontrado.
  - `500`: error interno.

### 25) GET `/payment/statistics/change`

- **Objetivo:** estadísticas de vuelto en cobros.
- **Query params (opcionales):**
  - `start_date` (`YYYY-MM-DD`)
  - `end_date` (`YYYY-MM-DD`)
- **Respuesta exitosa (200):** `ChangeStatistics` (`period`, `statistics`, `generated_at`).
- **Errores:**
  - `400`: formato de fecha inválido.
  - `401`: no autorizado.
  - `500`: error interno.

### 26) GET `/payment/totals/sales`

- **Objetivo:** totales de cobros de ventas en rango de fechas.
- **Query params (requeridos):**
  - `start_date` (`YYYY-MM-DD`)
  - `end_date` (`YYYY-MM-DD`)
- **Respuesta exitosa (200):** `PaymentTotalsByDateRangeResponse`
  - `total_payments`, `total_amount`, `completed_*`, `refunded_*`, `average_payment`, `total_change_given`.
- **Errores:**
  - `400`: faltan parámetros o formato inválido.
  - `401`: no autorizado.
  - `500`: error interno.

### 27) POST `/cash-registers/payments/sale`

- **Objetivo:** procesar cobro de venta con integración de caja activa.
- **Body (ProcessSalePaymentCashRegisterRequest):**
  - `sales_order_id` (requerido)
  - `amount_received` (requerido)
  - `payment_reference` (opcional)
  - `payment_notes` (opcional)
- **Respuesta exitosa (200):** objeto dinámico con resultado de pago + movimiento de caja.
- **Errores:**
  - `400`: body inválido o validación de negocio (incluye casos como caja no disponible en tiempo de ejecución).
  - `401`: no autorizado.
  - `409`: conflicto de caja (documentado en Swagger para ausencia de caja activa).
  - `500`: error interno.

---

## 6) Catálogo rápido de schemas usados

- Ventas: `SaleRequest`, `ProcessSaleEnhancedResponse`, `SaleEnhancedResponse`, `PaginatedSalesResponse`, `SalePaymentStatusResponse`, `PaginatedSalesPaymentStatusResponse`, `SaleWithMetadataResponse`, `PriceChangesReportResponse`, `AddProductsToSaleRequest`, `AddProductsToSaleResponse`, `SaleErrorResponse`, `ConfirmSalePaymentRequest`.
- Cobros: `ProcessPaymentRequest`, `ProcessPaymentResponse`, `ProcessPartialPaymentRequest`, `ProcessPartialPaymentResponse`, `SalePaymentWithDetails`, `ChangeStatistics`, `PaymentTotalsByDateRangeResponse`.
- Soporte: `PaymentsBootstrap`, `PaymentMethod`, `MessageResponse`.

---

## 7) Referencias

- Swagger principal: `docs/swagger/swagger.yaml`
- Rutas reales del módulo: `routes/routes.go`
- Handlers de ventas: `handlers/sale.go`
- Handlers de cobros: `handlers/payment.go`
- Handler de integración con caja: `handlers/cash_register.go`
