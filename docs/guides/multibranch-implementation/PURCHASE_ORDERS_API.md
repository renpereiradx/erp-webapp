# Guía de API de Órdenes de Compra para Frontend

**Versión:** 1.3  
**Fecha:** 26 de Mayo de 2026  
**Estado:** Vigente (multi-branch)

---

## 🔧 Configuración General

### Base URL
http://localhost:5050

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

> **Nota:** `?branch_id` tiene prioridad sobre `X-Branch-ID`. Ver [MULTI_BRANCH_CONTEXT_GUIDE.md](./MULTI_BRANCH_CONTEXT_GUIDE.md).

### Formato de Respuesta Estándar
`{ success: bool, data?, message?, error?, pagination? }`

### Formato de Fechas
- Payloads: ISO 8601 (`2026-03-24T15:30:00Z`)
- Query params: `YYYY-MM-DD`

### Paginación Estándar
`{ page, page_size, total_items, total_pages, has_next, has_prev }`

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `purchases:read` |
| POST / PUT / DELETE / PATCH | `purchases:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

## Unidades Permitidas

El campo `unit` en `order_details` se valida contra la siguiente lista de unidades permitidas:

| Categoría | Unidades |
|-----------|----------|
| **Discretas** | `unit`, `pair`, `set`, `dozen`, `box`, `pack`, `bag`, `case`, `bundle`, `tray`, `bottle`, `can`, `jar`, `carton`, `stick`, `slice`, `portion` |
| **Peso** | `kg`, `g`, `lb`, `oz`, `ton` |
| **Volumen** | `l`, `ml`, `gal` |
| **Longitud** | `meter`, `cm` |
| **Área** | `sqm`, `sqft` |
| **Tiempo** | `hour`, `day`, `month`, `roll` |

> **Nota:** Si el campo `unit` está vacío o no se envía, el sistema usa el `base_unit` del producto como default. Si el producto tampoco tiene `base_unit`, usa `"unit"` como fallback. Para productos de medida variable (ej: productos pesables), se recomienda enviar explícitamente la unidad correcta (ej: `"kg"`).
>
> **Nota técnica (v1.3):** A partir de esta versión, el campo `unit` es una columna nativa de la tabla `purchase_order_details` (no solo metadata JSONB). Esto garantiza consistencia en las consultas y mejor performance. El sistema automáticamente pobla esta columna al crear órdenes de compra y hace backfill de datos históricos.

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

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `supplier_id` | string | **Requerido.** ID del proveedor (Party ID) |
| `status` | string | **Requerido.** `PENDING`, `COMPLETED`, o `CANCELLED` |
| `purchase_items` | json | **Requerido.** Array de items (raw JSON) |
| `branch_id` | int | ID de sucursal. Si se omite, auto-inyectado del contexto |

### Items (dentro de `purchase_items`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `product_id` | string | **Requerido.** ID del producto |
| `quantity` | number | **Requerido.** Cantidad (> 0) |
| `unit_price` | number | **Requerido.** Precio unitario de compra |
| `unit` | string | Unidad: `kg`, `l`, `unit`, etc. Default: `base_unit` del producto |
| `tax_rate_id` | int | ID de tasa de IVA. Si se omite, se resuelve por jerarquía fiscal |
| `profit_pct` | number | Margen de beneficio sugerido |

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

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `supplier_id` | string | **Requerido.** ID del proveedor |
| `status` | string | **Requerido.** `PENDING` o `COMPLETED` |
| `order_details` | array | **Requerido.** Array de items (ver abajo) |
| `branch_id` | int | ID de sucursal. Auto-inyectado si se omite |
| `payment_method_id` | int | ID de método de pago |
| `currency_id` | int | ID de moneda |
| `auto_update_prices` | bool | Actualizar precios de venta automáticamente |
| `default_profit_margin` | number | Margen default si no se especifica por item |
| `metadata` | object | Metadatos adicionales |

### Items (`order_details`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `product_id` | string | **Requerido.** ID del producto |
| `quantity` | number | **Requerido.** Cantidad (> 0) |
| `unit_price` | number | **Requerido.** Precio unitario de compra (> 0) |
| `unit` | string | Unidad. Default backend: `base_unit` del producto (fallback: `"unit"`) |
| `profit_pct` | number | Margen automático (%) |
| `explicit_sale_price` | number | Precio de venta explícito (prioridad sobre profit_pct) |
| `tax_rate_id` | int | Override de tasa de IVA |
| `price_includes_tax` | bool | Si el precio incluye IVA. Default: `true` si el producto ya tiene precio, sino usa `true` |

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
      "profit_pct": 35,
      "tax_rate_id": 1,
      "price_includes_tax": true
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

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `start_date` | string | **Requerido.** Fecha inicio (`YYYY-MM-DD`) |
| `end_date` | string | **Requerido.** Fecha fin (`YYYY-MM-DD`) |
| `page` | int | Default: `1`. Número de página |
| `page_size` | int | Default: `50`. Items por página |
| `branch_id` | int | Default: contexto. Filtro de sucursal |

---

## 4. Cancelar Compra

### 4.1 PUT /purchase/cancel/{id} o POST /purchase/{id}/cancel

Ambos endpoints hacen lo mismo. Incluyen validación de pertenencia a sucursal.

> **Importante:** Si el usuario tiene `allowed_branches` configurados, el sistema valida que la compra pertenezca a una sucursal autorizada. Si no pertenece, devuelve `404 Not Found`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
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

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `purchase_order_id` | int | **Requerido.** ID de la orden (> 0) |
| `amount_paid` | number | **Requerido.** Monto a pagar (> 0) |
| `payment_method_id` | int | **Requerido.** ID del método de pago (> 0) |
| `branch_id` | int | ID de sucursal. Auto-inyectado si se omite |
| `payment_reference` | string | Referencia del pago |
| `payment_notes` | string | Notas del pago |
| `cash_register_id` | int | ID de caja registradora |
| `currency_id` | int | ID de moneda (multimoneda) |
| `exchange_rate` | number | Tipo de cambio (> 0 si se usa) |
| `original_amount` | number | Monto en moneda original |

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

- `PURCHASE_PRICING_INTEGRATION_GUIDE.md` — Guía de pricing en compras
- `MULTI_BRANCH_CONTEXT_GUIDE.md` — Guía completa de contexto multi-sucursal
- `TAX_CLASSIFICATION_API_GUIDE.md` — API de clasificación fiscal (IVA)
- `PAYMENT_METHOD_CURRENCY_CASH_API_GUIDE.md` — API de métodos de pago y monedas
- `PRODUCT_API_GUIDE.md` — API de productos
- `SALES_API_GUIDE.md` — API de ventas

---

_Última actualización: 2026-05-19_
