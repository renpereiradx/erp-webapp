# API Unificada: Compras y Pagos de Compras

**Versión:** 2.0  
**Fecha:** 2026-03-06  
**Base URL (Swagger):** `http://localhost:5050`

---

## 1) Alcance

Este documento unifica la operación funcional del módulo de **compras** y **pagos de compras**, incluyendo:

- Alta y consulta de compras
- Procesamiento de compras completas
- Cancelación y previsualización de cancelación
- Pagos de compras
- Estadísticas/totales de pagos
- Integración de pago con caja registradora
- Endpoints de soporte para front de compras (suppliers, métodos de pago)

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
- **Errores de negocio de compra:** pueden devolver `ProcessCompletePurchaseResponse` o `ProcessPurchasePaymentResponse` con `error_code`.
- **Campos monetarios:** `number/double`.
- **Filtros soportados:**
  - `GET /purchase/date_range` soporta `start_date`, `end_date`, `page`, `page_size`.
  - `GET /purchase/supplier_id/{supplier_id}` retorna todas las compras del proveedor.
  - `GET /purchase/supplier_name/{name}` busca compras por nombre de proveedor (paginado).

---

## 4) Índice de endpoints

### Soporte de compras

1. `GET /suppliers`
2. `GET /supplier/{supplier_id}`
3. `GET /supplier/name/{name}`
4. `GET /payment-methods`
5. `GET /payment-methods/{id}`

### Compras

6. `POST /purchase/`
7. `POST /purchase/complete`
8. `GET /purchase/{id}`
9. `GET /purchase/{id}/supplier/{supplier_name}`
10. `GET /purchase/supplier_id/{supplier_id}`
11. `GET /purchase/supplier_name/{name}`
12. `GET /purchase/date_range`
13. `PUT /purchase/{id}/cancel`
14. `POST /purchase/{id}/cancel`
15. `GET /purchase/{id}/preview-cancellation`

### Pagos de compras

16. `POST /purchase/payment/process`
17. `GET /purchase/payment/statistics`
18. `GET /payment/totals/purchases`
19. `POST /cash-registers/payments/purchase`

---

## 5) Detalle completo por endpoint

## 5.1 Soporte de compras

### 1) GET `/suppliers`

- **Objetivo:** listar todos los proveedores disponibles.
- **Path params:** ninguno.
- **Query params:** ninguno.
- **Body:** no aplica.
- **Respuesta exitosa (200):** `Supplier[]`.
- **Errores:**
  - `500`: error interno.

### 2) GET `/supplier/{supplier_id}`

- **Objetivo:** obtener proveedor por ID.
- **Path params:**
  - `supplier_id` (int, requerido).
- **Respuesta exitosa (200):** `Supplier`.
- **Errores:**
  - `400`: ID inválido.
  - `404`: proveedor no encontrado.
  - `500`: error interno.

### 3) GET `/supplier/name/{name}`

- **Objetivo:** obtener proveedor por nombre.
- **Path params:**
  - `name` (string, requerido).
- **Respuesta exitosa (200):** `Supplier`.
- **Errores:**
  - `404`: proveedor no encontrado.
  - `500`: error interno.

### 4) GET `/payment-methods`

- **Objetivo:** listar métodos de pago disponibles.
- **Path params:** ninguno.
- **Query params:** ninguno.
- **Body:** no aplica.
- **Respuesta exitosa (200):** `PaymentMethod[]`.
- **Errores:**
  - `500`: error interno.

### 5) GET `/payment-methods/{id}`

- **Objetivo:** obtener método de pago por ID.
- **Path params:**
  - `id` (int, requerido).
- **Respuesta exitosa (200):** `PaymentMethod`.
- **Errores:**
  - `400`: ID inválido.
  - `404`: método no encontrado.
  - `500`: error interno.

---

## 5.2 Compras

### 6) POST `/purchase/`

- **Objetivo:** procesar y registrar compra.
- **Body (PurchaseRequest):**
  - `supplier_id` (requerido, int)
  - `status` (requerido, string: "PENDING", "RECEIVED", "PARTIAL")
  - `purchase_items` (requerido, JSON array de items)
- **Ejemplo body:**

```json
{
  "supplier_id": 1,
  "status": "PENDING",
  "purchase_items": [
    {
      "product_id": "PRD-001",
      "quantity": 10,
      "unit_price": 5000
    }
  ]
}
```

- **Respuesta exitosa (200):** `MessageResponse`
  - `message`: "Purchase added".
- **Errores:**
  - `400`: body inválido, campos faltantes.
  - `401`: token inválido/ausente.
  - `500`: error de procesamiento.

### 7) POST `/purchase/complete`

- **Objetivo:** procesar una orden de compra completa (con validaciones y procesamiento atómico).
- **Body (ProcessCompletePurchaseRequest):**
  - `supplier_id` (requerido, int)
  - `status` (requerido, string)
  - `order_details` (requerido, array de detalles)
    - `product_id` (requerido)
    - `quantity` (requerido, > 0)
    - `unit_price` (requerido, > 0)
    - `exp_date` (opcional)
- **Ejemplo body:**

```json
{
  "supplier_id": 1,
  "status": "RECEIVED",
  "order_details": [
    {
      "product_id": "PRD-001",
      "quantity": 10,
      "unit_price": 5000,
      "exp_date": "2026-12-31"
    }
  ]
}
```

- **Respuesta exitosa (201):** `ProcessCompletePurchaseResponse`
  - `success`, `purchase_id`, `total_amount`, `items_processed`, `message`, etc.
- **Errores:**
  - `400`: body inválido, validación fallida.
  - `401`: no autorizado.
  - `404`: `SUPPLIER_NOT_FOUND` o `PRODUCT_NOT_FOUND`.
  - `500`: `DATABASE_ERROR` u otro error interno.

### 8) GET `/purchase/{id}`

- **Objetivo:** obtener una compra por ID con datos enriquecidos.
- **Path params:**
  - `id` (int, requerido).
- **Respuesta exitosa (200):** `PurchaseRiched` (compra con detalles de proveedor, usuario, moneda, etc.).
- **Errores:**
  - `400`: ID inválido.
  - `401`: no autorizado.
  - `500`: error interno.

### 9) GET `/purchase/{id}/supplier/{supplier_name}`

- **Objetivo:** obtener compra por ID con validación de nombre de proveedor.
- **Path params:**
  - `id` (int, requerido)
  - `supplier_name` (string, requerido)
- **Respuesta exitosa (200):** `PurchaseRiched`.
- **Errores:**
  - `400`: parámetros inválidos.
  - `404`: compra no encontrada o no pertenece al proveedor.
  - `500`: error interno.

### 10) GET `/purchase/supplier_id/{supplier_id}`

- **Objetivo:** listar todas las compras de un proveedor por su ID.
- **Path params:**
  - `supplier_id` (int, requerido).
- **Respuesta exitosa (200):** `PurchaseRiched[]`.
- **Errores:**
  - `400`: ID inválido.
  - `500`: error interno.

### 11) GET `/purchase/supplier_name/{name}`

- **Objetivo:** listar compras por nombre de proveedor (paginado).
- **Path params:**
  - `name` (string, requerido).
- **Query params:** ninguno.
- **Respuesta exitosa (200):** `PaginatedPurchasesResponse` (`data[]`, `pagination`).
- **Errores:**
  - `400`: parámetro inválido.
  - `500`: error interno.

### 12) GET `/purchase/date_range`

- **Objetivo:** listar compras por rango de fecha (paginado).
- **Query params:**
  - `start_date` (requerido, `YYYY-MM-DD`)
  - `end_date` (requerido, `YYYY-MM-DD`)
  - `page` (default 1)
  - `page_size` (default 50)
- **Respuesta exitosa (200):** `PaginatedPurchasesResponse` (`data[]`, `pagination`).
- **Errores:**
  - `400`: faltan/son inválidas las fechas.
  - `401`: no autorizado.
  - `500`: error interno.

### 13) PUT `/purchase/{id}/cancel`

- **Objetivo:** cancelar una compra.
- **Path params:**
  - `id` (int, requerido).
- **Body:** opcional (`CancelPurchaseRequest` con `reason`).
- **Respuesta exitosa (200):**

```json
{
  "message": "Purchase cancelled successfully"
}
```

- **Errores:**
  - `400`: body inválido.
  - `401`: no autorizado.
  - `404`: `PURCHASE_NOT_FOUND`.
  - `409`: `ALREADY_CANCELLED`.
  - `500`: error interno.

### 14) POST `/purchase/{id}/cancel`

- **Objetivo:** cancelar una compra (alternativa POST).
- **Path params:**
  - `id` (int, requerido).
- **Body:** opcional.
- **Respuesta exitosa (200):** `MessageResponse`.
- **Errores:**
  - `401`: no autorizado.
  - `404`: compra no encontrada.
  - `500`: error interno.

### 15) GET `/purchase/{id}/preview-cancellation`

- **Objetivo:** previsualizar impacto de cancelación antes de ejecutar.
- **Path params:**
  - `id` (int, requerido).
- **Respuesta exitosa (200):** `PreviewPurchaseCancellationResponse`
  - `purchase_info`, `impact_analysis`, `recommendations`.
- **Errores:**
  - `400`: ID inválido.
  - `401`: no autorizado.
  - `404`: compra no encontrada.
  - `500`: error interno.

---

## 5.3 Pagos de compras

### 16) POST `/purchase/payment/process`

- **Objetivo:** registrar pago para una orden de compra.
- **Body (ProcessPurchasePaymentRequest):**
  - `purchase_order_id` (requerido, int)
  - `amount_paid` (requerido, `> 0`)
  - `payment_method_id` (requerido, int)
  - opcionales: `payment_reference`, `payment_notes`, `cash_register_id`.
  - **Multimoneda (opcionales):** `currency_id` (int), `exchange_rate` (number, > 0), `original_amount` (number, >= 0).
- **Ejemplo body (Multimoneda):**

```json
{
  "purchase_order_id": 1,
  "amount_paid": 50000,
  "payment_method_id": 1,
  "currency_id": 5,
  "exchange_rate": 7350.50,
  "original_amount": 6.80,
  "payment_reference": "CHK-0001",
  "payment_notes": "Pago parcial en USD"
}
```

- **Respuesta exitosa (200):** `ProcessPurchasePaymentResponse`
  - `success`, `payment_id`, `purchase_order_id`, `payment_details`, `processed_at`, `processed_by`.
- **Errores:**
  - `400`: body inválido o validación de negocio fallida.
  - `401`: no autorizado.
  - `404`: `PURCHASE_ORDER_NOT_FOUND`.
  - `409`: `PURCHASE_ORDER_CANCELLED`.
  - `500`: error interno.

### 17) GET `/purchase/payment/statistics`

- **Objetivo:** estadísticas de pagos de compras en rango de fechas.
- **Query params (opcionales):**
  - `start_date` (`YYYY-MM-DD`)
  - `end_date` (`YYYY-MM-DD`)
  - `supplier_id` (int)
- **Respuesta exitosa (200):** `PurchasePaymentStatisticsResponse`
  - `period`, `order_statistics`, `financial_summary`, `generated_at`.
- **Errores:**
  - `400`: formato de parámetros inválido.
  - `401`: no autorizado.
  - `500`: error interno.

### 18) GET `/payment/totals/purchases`

- **Objetivo:** totales de pagos de compras en rango de fechas.
- **Query params (requeridos):**
  - `start_date` (`YYYY-MM-DD`)
  - `end_date` (`YYYY-MM-DD`)
- **Respuesta exitosa (200):** `PaymentTotalsByDateRangeResponse`
  - `total_payments`, `total_amount`, `completed_*`, `average_payment`, etc.
- **Errores:**
  - `400`: faltan parámetros o formato inválido.
  - `401`: no autorizado.
  - `500`: error interno.

### 19) POST `/cash-registers/payments/purchase`

- **Objetivo:** procesar pago de compra con integración de caja registradora activa.
- **Body (ProcessPurchasePaymentCashRegisterRequest):**
  - `purchase_order_id` (requerido, int)
  - `amount_paid` (requerido)
  - `payment_method_id` (requerido, int)
  - opcionales: `payment_reference`, `payment_notes`.
- **Respuesta exitosa (200):** objeto dinámico con resultado de pago + movimiento de caja.
- **Errores:**
  - `400`: body inválido o validación fallida.
  - `401`: no autorizado.
  - `409`: conflicto de caja (caja no disponible).
  - `500`: error interno.

---

## 6) Catálogo rápido de schemas usados

- Compras: `PurchaseRequest`, `ProcessCompletePurchaseRequest`, `ProcessCompletePurchaseResponse`, `PurchaseRiched`, `PaginatedPurchasesResponse`, `PreviewPurchaseCancellationResponse`, `CancelPurchaseRequest`.
- Pagos: `ProcessPurchasePaymentRequest`, `ProcessPurchasePaymentResponse`, `PurchasePaymentStatisticsResponse`, `PaymentTotalsByDateRangeResponse`.
- Soporte: `Supplier`, `PaymentMethod`, `MessageResponse`.

---

## 7) Referencias

- Swagger principal: `docs/swagger/swagger.yaml`
- Rutas reales del módulo: `routes/routes.go`
- Handlers de compras: `handlers/purchase.go`
- Handler de cuentas por pagar: `handlers/payables.go`
- Modelos: `models/purchase.go`, `models/payables.go`
- Servicios: `services/purchase.go`, `services/payables.go`