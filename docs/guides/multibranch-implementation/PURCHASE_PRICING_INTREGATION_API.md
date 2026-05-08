# Guía de Integración Frontend - Pricing en Compras (actual)

> **Disclaimer:** Esta guía contiene ejemplos JSON y TypeScript/JavaScript para ilustración de payloads y respuestas. Para el modelado de datos en el frontend, utilice las **tablas de definición de campos** como fuente de verdad.

**Versión:** 1.2
**Fecha:** 2026-05-07
**Estado:** Vigente con la API actual (multi-branch)

## Base URL

`http://localhost:5050`

## Autenticación

- Header: `Authorization: Bearer <jwt_token>`

## Headers requeridos (cuando aplica)

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## Resumen

Esta guía define el flujo actual para calcular precio de venta desde compras y cómo cargar datos de producto en frontend.

Principio clave:

- El frontend muestra preview.
- El backend calcula y persiste (fuente de verdad).

---

## Contexto de Sucursal

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restricción: sucursal debe estar en `allowed_branches`

> **Nota:** `?branch_id` tiene prioridad sobre `X-Branch-ID`.

## Formato de fechas

- Payloads: ISO 8601 (`2026-03-24T15:30:00Z`)
- Query params de fecha: `YYYY-MM-DD`

## Respuesta estándar

`{ success: bool, data?, message?, error?, pagination? }`

## Paginación estándar

`{ page, page_size, total_items, total_pages, has_next, has_prev }`

---

## 1. Endpoints que debe usar frontend

Para cargar producto en pantallas de compra/venta:

- `GET /products/{id}/purchase` (flujo de compra)
- `GET /products/{id}/sale` (flujo de venta)
- `GET /products/{id}/info` (detalle general)
- `GET /products/info/barcode/{barcode}`
- `GET /products/info/search/{name}`

Para registrar compra completa:

- `POST /purchase/complete`

---

## 2. Payload soportado hoy en `POST /purchase/complete`

```typescript
interface ProcessCompletePurchaseOrderDetail {
  product_id: string
  quantity: number // > 0
  unit_price: number // costo de compra > 0
  unit?: string // default backend: "unit"
  profit_pct?: number // modo margen automatico
  explicit_sale_price?: number // modo precio explicito (prioridad)
  tax_rate_id?: number // override opcional de IVA
}
```

Campos a nivel request:

- `supplier_id`, `status`, `order_details`
- opcionales: `branch_id`, `payment_method_id`, `currency_id`, `auto_update_prices`, `default_profit_margin`, `metadata`
- `branch_id`: Si se omite, el backend lo inyecta automáticamente del contexto de sucursal (query param `?branch_id=`, header `X-Branch-ID`, o fallback del JWT)

---

## 3. Reglas de cálculo de precio (implementación actual)

### 3.1 Modo precio explícito

Si viene `explicit_sale_price`:

- backend usa ese valor como precio de venta final
- `profit_pct` queda solo como dato de referencia UI

### 3.2 Modo margen automático

Si no viene `explicit_sale_price`:

- backend calcula `sale_price = ROUND(unit_price * (1 + profit_pct/100))`
- si no viene `profit_pct`, usa `default_profit_margin` o default del sistema

### 3.3 Quién calcula el margen

- frontend puede calcular margen para mostrar
- backend recalcula y persiste margen/precio final

---

## 4. IVA en compras (actual)

### 4.0 Price Includes Tax — Dos Modos

El campo `price_includes_tax` en cada línea de detalle (`purchase_order_details`) controla cómo se interpreta el precio:

| `price_includes_tax` | Comportamiento | Ejemplo (IVA 10%) |
|---|---|---|
| `true` (default) | El precio **INCLUYE** IVA → el backend extrae el IVA | Precio 1,210 → Neto 1,100, IVA 110 |
| `false` | El precio **EXCLUYE** IVA → el backend agrega el IVA | Precio 1,000 → Neto 1,000, IVA 100, Total 1,100 |

> El frontend debe enviar este campo explícitamente en cada línea de detalle de compra.

### 4.1 Resolución de tasa

Si no se envía `tax_rate_id`, backend resuelve por jerarquía fiscal (producto/clasificación/categoría/default).

### 4.2 Cálculo fiscal

La API actual discrimina y guarda desglose fiscal por línea en detalles de compra:

- `unit_price_with_tax`
- `unit_price_without_tax`
- `tax_amount`
- `total_line_with_tax`
- `applied_tax_rate`
- `tax_resolution_source`

### 4.3 Dónde ver el desglose

Consultar `GET /purchase/{id}` o endpoints enriquecidos de compra para ver el detalle por ítem.

---

## 5. Ejemplos de request

### 5.1 Margen automático

```json
{
  "supplier_id": "SUP_001",
  "status": "COMPLETED",
  "branch_id": 1,
  "order_details": [
    {
      "product_id": "PROD_BANANA_001",
      "quantity": 50,
      "unit_price": 2500,
      "unit": "kg",
      "profit_pct": 35
    }
  ],
  "auto_update_prices": true,
  "default_profit_margin": 30
}
```

### 5.2 Precio explícito

```json
{
  "supplier_id": "SUP_001",
  "status": "COMPLETED",
  "branch_id": 1,
  "order_details": [
    {
      "product_id": "FL8K0xxRzjX0VAND78u842kzKcM",
      "quantity": 20,
      "unit_price": 5000,
      "unit": "unit",
      "explicit_sale_price": 9000,
      "tax_rate_id": 5
    }
  ]
}
```

---

## 6. Respuesta y warnings

`POST /purchase/complete` devuelve, entre otros:

- `success`
- `purchase_order_id`
- `total_amount`
- `branch_id` — sucursal asignada a la compra
- `items_processed`
- `cost_entries_created`
- `prices_updated`
- `message`
- `warnings` (cuando aplica, por ejemplo discrepancias fiscales)

### 6.1 Consulta de compras (GET)

Todos los endpoints de consulta (`GET /purchase/{id}`, `/purchase/supplier_id/{id}`, `/purchase/supplier_name/{name}`, `/purchase/date_range/`) ahora devuelven:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `branch_id` | int \| null | Sucursal de la compra |
| `payment_method` | string | Código real del método (ej: `CASH`, `TRANSFER`, `CREDIT_CARD`) |
| `currency` | string | Código real de la moneda (ej: `PYG`, `USD`, `BRL`) |
| `payment_method_id` | int \| null | ID del método de pago |
| `currency_id` | int \| null | ID de la moneda |

> **Nota:** Antes los campos `payment_method` y `currency` devolvían strings genéricos como `"Payment Method 1"`. Ahora devuelven los códigos reales de la base de datos.

---

## 7. Endpoints de Órdenes de Compra (CRUD)

> **Nota:** Esta sección documenta los endpoints completos de gestión de compras. La sección 2 (`POST /purchase/complete`) es el endpoint de integración pricing-compra.

### POST /purchase/

**Descripción:** Crea una nueva orden de compra (sin completar).

### GET /purchase/{id}

**Descripción:** Obtiene una orden de compra por ID.

### POST /purchase/complete

**Descripción:** Crea y completa una orden de compra con cálculo de pricing integrado. Ver [sección 2](#2-payload-soportado-hoy-en-post-purchasecomplete) para el payload completo.

### PUT /purchase/cancel/{id}

**Descripción:** Cancela una orden de compra (requiere permisos).

### POST /purchase/{id}/cancel

**Descripción:** Solicita cancelación de orden de compra (flujo de aprobación).

### GET /purchase/{id}/preview-cancellation

**Descripción:** Previsualiza los efectos de cancelar una orden de compra (stock, pagos, IVA).

### GET /purchase/{id}/supplier/{supplier_name}

**Descripción:** Obtiene órdenes de compra de un proveedor por nombre.

### GET /purchase/supplier_id/{supplier_id}

**Descripción:** Obtiene órdenes de compra por ID de proveedor (Party ID).

### GET /purchase/supplier_name/{name}

**Descripción:** Busca órdenes de compra por nombre parcial de proveedor.

### GET /purchase/date_range/

**Descripción:** Lista órdenes de compra en rango de fechas (`start_date`, `end_date`).

### POST /purchase/payment/process

**Descripción:** Procesa un pago total o parcial de una orden de compra.

### GET /purchase/payment/statistics

**Descripción:** Estadísticas de pagos de compras.

---

## 8. Recomendaciones frontend

1. Redondear montos para PYG en UI antes de enviar.
2. Usar `explicit_sale_price` solo cuando usuario fija precio final manual.
3. No confiar en cálculo local para persistencia; usar siempre respuesta backend.
4. Mostrar en UI la tasa y fuente fiscal (`applied_tax_rate`, `tax_resolution_source`) al confirmar compra.
5. Para nuevos desarrollos, usar exclusivamente rutas `info`, `sale`, `purchase`.

---

## 9. Checklist de implementación

- [ ] Soportar selector de modo: margen vs explícito
- [ ] Enviar `explicit_sale_price` solo en modo explícito
- [ ] Enviar `profit_pct` en modo margen
- [ ] Enviar `branch_id` en el body o vía query param `?branch_id=`
- [ ] Consumir `GET /products/{id}/purchase` para precarga de formulario
- [ ] Mostrar desglose fiscal de backend al confirmar
- [ ] Mostrar `branch_id` y sucursal asignada en la UI de confirmación
- [ ] Usar `payment_method` y `currency` reales (no strings genéricos) en pantallas de detalle
- [ ] Manejar `warnings` en respuesta de compra

---

## 10. Referencias

- `PURCHASE_ORDERS_API.md` — API completa de órdenes de compra
- `PRODUCT_API.md` — API de productos
- `MULTI_BRANCH_CONTEXT_GUIDE.md` — Guía de contexto multi-sucursal

---

_Última actualización: 2026-05-07 — Fase 5 bugfix multi-branch. Agregado `branch_id` en request body (auto-inyectado), `branch_id` en response, sección 6.1 (payment_method/currency con códigos reales reemplazando strings genéricos), ejemplos actualizados con `branch_id`, checklist actualizado con ítems de sucursal._
