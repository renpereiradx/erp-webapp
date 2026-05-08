# Guía de API de Órdenes de Compra para Frontend

**Versión:** 1.0  
**Fecha:** 07 de Mayo de 2026  
**Estado:** Vigente (multi-branch)

---

## Base URL
`http://localhost:5050`

## Autenticación
- Header: `Authorization: Bearer <jwt_token>`

## Contexto de Sucursal
- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restricción: sucursal debe estar en `allowed_branches`
- Ver guía completa en `docs/guides/frontend/MULTI_BRANCH_CONTEXT_GUIDE.md`

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/purchase/` | Crear compra (legacy, usa DB procedure) |
| POST | `/purchase/complete` | Crear compra completa (recomendado) |
| GET | `/purchase/{id}` | Obtener compra por ID |
| GET | `/purchase/{id}/supplier/{supplier_name}` | Obtener compra con validación de supplier |
| GET | `/purchase/supplier_id/{supplier_id}` | Listar compras por proveedor |
| GET | `/purchase/supplier_name/{name}` | Listar compras por nombre de proveedor |
| GET | `/purchase/date_range/` | Listar compras por rango de fechas |
| PUT | `/purchase/cancel/{id}` | Cancelar compra (método PUT) |
| POST | `/purchase/{id}/cancel` | Cancelar compra (método POST) |
| GET | `/purchase/{id}/preview-cancellation` | Vista previa de cancelación |
| POST | `/purchase/payment/process` | Procesar pago de compra |
| GET | `/purchase/payment/statistics` | Estadísticas de pagos |

---

## 1. POST /purchase/ — Crear compra (legacy)

### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `supplier_id` | string | Sí | ID del proveedor (Party ID) |
| `status` | string | Sí | `PENDING`, `COMPLETED`, o `CANCELLED` |
| `purchase_items` | json | Sí | Array de items (raw JSON) |
| `branch_id` | int | No | ID de sucursal. Si se omite, auto-inyectado del contexto |

### Items (dentro de `purchase_items`)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `product_id` | string | Sí | ID del producto |
| `quantity` | number | Sí | Cantidad (> 0) |
| `unit_price` | number | Sí | Precio unitario de compra |
| `unit` | string | No | Unidad: `kg`, `l`, `unit`, etc. |
| `tax_rate_id` | int | No | ID de tasa de IVA. Si se omite, se resuelve por jerarquía fiscal |
| `profit_pct` | number | No | Margen de beneficio sugerido |

### Ejemplo

```json
{
  "supplier_id": "SP___________________________1",
  "status": "COMPLETED",
  "branch_id": 1,
  "purchase_items": [
    {
      "product_id": "PROD_001",
      "quantity": 100,
      "unit_price": 5000,
      "unit": "kg",
      "tax_rate_id": 1,
      "profit_pct": 30
    }
  ]
}
```

### Respuesta

```json
{ "message": "Purchase added" }
```

---

## 2. POST /purchase/complete — Crear compra completa (RECOMENDADO)

### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `supplier_id` | string | Sí | ID del proveedor |
| `status` | string | Sí | `PENDING` o `COMPLETED` |
| `order_details` | array | Sí | Array de items (ver abajo) |
| `branch_id` | int | No | ID de sucursal. Auto-inyectado si se omite |
| `payment_method_id` | int | No | ID de método de pago |
| `currency_id` | int | No | ID de moneda |
| `auto_update_prices` | bool | No | Actualizar precios de venta automáticamente |
| `default_profit_margin` | number | No | Margen default si no se especifica por item |
| `metadata` | object | No | Metadatos adicionales |

### Items (`order_details`)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `product_id` | string | Sí | ID del producto |
| `quantity` | number | Sí | Cantidad (> 0) |
| `unit_price` | number | Sí | Precio unitario de compra (> 0) |
| `unit` | string | No | Unidad. Default backend: `"unit"` |
| `profit_pct` | number | No | Margen automático (%) |
| `explicit_sale_price` | number | No | Precio de venta explícito (prioridad sobre profit_pct) |
| `tax_rate_id` | int | No | Override de tasa de IVA |

### Ejemplo

```json
{
  "supplier_id": "SP___________________________1",
  "status": "COMPLETED",
  "branch_id": 1,
  "payment_method_id": 1,
  "currency_id": 1,
  "auto_update_prices": true,
  "default_profit_margin": 30,
  "order_details": [
    {
      "product_id": "PROD_BANANA_001",
      "quantity": 50,
      "unit_price": 2500,
      "unit": "kg",
      "profit_pct": 35
    }
  ]
}
```

### Respuesta

```json
{
  "success": true,
  "purchase_order_id": 31,
  "branch_id": 1,
  "total_amount": 125000,
  "items_processed": 1,
  "cost_entries_created": 1,
  "prices_updated": 1,
  "message": "Purchase order completed successfully",
  "warnings": null
}
```

---

## 3. Endpoints de Consulta

### 3.1 GET /purchase/{id}?branch_id={branch_id}

Obtiene una compra por ID, filtrada por sucursal.

**Respuesta:**

```
PurchaseWithFullDetails {
  purchase: PurchaseRiched {
    id, order_date, total_amount, status,
    branch_id, supplier_id, supplier_name, supplier_status,
    user_id, user_name,
    payment_method_id, payment_method,  // Código real: "CASH", "TRANSFER"
    currency_id, currency,              // Código real: "PYG", "USD"
    metadata
  },
  details: [ PurchaseItemFullRiched {
    id, purchase_order_id, product_id, product_name,
    quantity, unit_price, subtotal,
    sale_price, profit_pct,
    unit_price_with_tax, unit_price_without_tax,
    unit,
    tax_rate_id, tax_rate, tax_amount,
    exp_date, user_id, user_name,
    line_total, total_line_with_tax,
    applied_tax_rate, metadata
  } ],
  payments: [ PurchasePayment { ... } ],
  cost_info: PurchaseCostInfo { total_cost, total_sale_value, average_profit_pct, total_tax_amount },
  metadata: {}
}
```

### 3.2 GET /purchase/supplier_id/{supplier_id}?branch_id={branch_id}

Lista compras por ID de proveedor. Misma estructura de respuesta que `GET /purchase/{id}` (array).

### 3.3 GET /purchase/supplier_name/{name}?branch_id={branch_id}

Lista compras por nombre de proveedor (búsqueda parcial, case-insensitive). Misma estructura de respuesta.

### 3.4 GET /purchase/date_range/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&page=1&page_size=50&branch_id={branch_id}

Lista compras por rango de fechas con paginación. Misma estructura de respuesta.

| Query Param | Tipo | Requerido | Default | Descripción |
|-------------|------|-----------|---------|-------------|
| `start_date` | string | Sí | — | Fecha inicio (`YYYY-MM-DD`) |
| `end_date` | string | Sí | — | Fecha fin (`YYYY-MM-DD`) |
| `page` | int | No | 1 | Número de página |
| `page_size` | int | No | 50 | Items por página |
| `branch_id` | int | No | contexto | Filtro de sucursal |

---

## 4. Cancelar Compra

### 4.1 PUT /purchase/cancel/{id} o POST /purchase/{id}/cancel

Ambos endpoints hacen lo mismo. Incluyen validación de pertenencia a sucursal.

> **Importante:** Si el usuario tiene `allowed_branches` configurados, el sistema valida que la compra pertenezca a una sucursal autorizada. Si no pertenece, devuelve `404 Not Found`.

| Query Param / Header | Tipo | Descripción |
|----------------------|------|-------------|
| `branch_id` | int | Sucursal del usuario |

**Respuesta éxito:**
```json
{ "message": "Purchase cancelled" }
```

**Respuesta error (branch scope):**
```
404: "Purchase order not found or does not belong to this branch"
```

### 4.2 GET /purchase/{id}/preview-cancellation?branch_id={branch_id}

Vista previa del impacto de cancelar una compra (sin ejecutarla).

---

## 5. Pagos de Compra

### 5.1 POST /purchase/payment/process

Procesa un pago parcial o total para una orden de compra.

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `purchase_order_id` | int | Sí | ID de la orden (> 0) |
| `amount_paid` | number | Sí | Monto a pagar (> 0) |
| `payment_method_id` | int | Sí | ID del método de pago (> 0) |
| `branch_id` | int | No | ID de sucursal. Auto-inyectado si se omite |
| `payment_reference` | string | No | Referencia del pago |
| `payment_notes` | string | No | Notas del pago |
| `cash_register_id` | int | No | ID de caja registradora |
| `currency_id` | int | No | ID de moneda (multimoneda) |
| `exchange_rate` | number | No | Tipo de cambio (> 0 si se usa) |
| `original_amount` | number | No | Monto en moneda original |

#### Ejemplo

```json
{
  "purchase_order_id": 30,
  "amount_paid": 50000,
  "payment_method_id": 1,
  "branch_id": 1,
  "payment_reference": "TRF-001",
  "payment_notes": "Pago parcial 50%"
}
```

#### Respuesta

```json
{
  "success": true,
  "payment_id": 11,
  "purchase_order_id": 30,
  "payment_details": {
    "amount_paid": 50000,
    "outstanding_amount": 50000,
    "total_paid_so_far": 50000,
    "total_order_amount": 100000,
    "payment_status": "PARTIALLY_PAID",
    "order_fully_paid": false
  },
  "message": "Payment processed successfully",
  "processed_at": "2026-05-07T12:00:00Z",
  "processed_by": "jJkV4F6HR"
}
```

### 5.2 GET /purchase/payment/statistics?branch_id={branch_id}

Obtiene estadísticas agregadas de pagos de compras.

**Query Params adicionales:** `start_date`, `end_date`, `supplier_id` (todos opcionales).

---

## 6. Cambios Multi-Branch (Mayo 2026)

### Lo que cambió

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| `branch_id` en request | No soportado en varios endpoints | Soporte completo. Auto-inyectado del contexto si se omite |
| `branch_id` en response | `null` en la mayoría de consultas | Valor correcto en todas las consultas |
| `payment_method` | `"Payment Method 1"` (genérico) | `"CASH"`, `"TRANSFER"`, etc. (código real) |
| `currency` | `"Currency 1"` (genérico) | `"PYG"`, `"USD"`, etc. (código real) |
| Filtro por sucursal en consultas | No filtraba (devolvía todas) | Filtra por `branch_id` del contexto |
| Cancelación cross-branch | Permitía cancelar cualquier compra | Valida pertenencia a sucursal (404 si no coincide) |
| Stock por sucursal | No discriminaba por branch | Stock y movimientos con `branch_id` |
| Cancelación de stock | Revertía stock global | Revierte solo en la sucursal correcta |

### Recomendaciones para el frontend

1. **Siempre enviar `branch_id`** en el query param `?branch_id=` o header `X-Branch-ID` en todas las llamadas a endpoints de compras.
2. **Capturar `branch_id` en respuestas** para mostrar la sucursal en la UI (listados, detalle de compra).
3. **Usar `payment_method` y `currency` reales** para mostrar nombres legibles en lugar de IDs.
4. **Manejar el error 404 en cancelación** — significa que la compra no pertenece a la sucursal del usuario.
5. **No es necesario enviar `branch_id` en el body** de POST — el backend lo inyecta automáticamente del contexto. Pero se recomienda enviarlo explícitamente para claridad.

---

## 7. Referencias

- `PURCHASE_PRICING_INTREGATION_API.md` — Guía de pricing en compras
- `MULTI_BRANCH_CONTEXT_GUIDE.md` — Guía completa de contexto multi-sucursal
- `TAX_CLASIFICATION_API.md` — API de clasificación fiscal (IVA)
