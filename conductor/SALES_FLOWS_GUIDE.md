# Guía Maestra de Flujos de Venta (End-to-End)

**Versión:** 1.0
**Fecha:** 2026-07-14
**Audiencia:** Frontend
**Propósito:** Documentar todos los flujos de venta posibles — cómo deben hacerse y cómo no —,
unificando sucursal, variantes, unidades, pesables, reservas, pagos y ventas pendientes.

> Esta guía es **integradora**. Para el detalle de cada endpoint, ver las guías referenciadas
> al final. Aquí se explica la **lógica de negocio** y los **antipatrones**.

---

## 1. Conceptos clave que debes tener claros

### 1.1 La venta está anclada a una sucursal

`transactions.sales_orders.branch_id` es **NOT NULL e inmutable** tras la creación (trigger
`trg_set_branch_id_sales_orders`). Una venta pertenece **siempre** a la sucursal donde se creó.

| Implicancia | Regla |
|-------------|-------|
| Stock validado | El de la sucursal de la venta |
| Pagos / caja | Se asocian a la sucursal de la venta |
| Continuar venta pendiente | Se opera en la sucursal de la venta, **no** en la activa del usuario |

### 1.2 El stock vive por sucursal Y por variante

```
stock = (id_product, branch_id, variant_id)
```

- **Producto sin variantes** → stock en `(product_id, branch_id, variant_id NULL)`
- **Producto con variantes activas** → stock en `(product_id, branch_id, variant_id = X)`.
  El stock del padre normalmente es **0**.

### 1.3 `stock_quantity` del search ya es agregado

El campo `stock_quantity` devuelto por `GET /products/search/{name}` y por el detalle enriquecido
**ya suma** padre + variantes activas (ver `productEnrichedFromJoins`). **No lo vuelvas a sumar**
en el frontend o harás doble conteo.

### 1.4 Estados de una venta

| Estado | Significado | ¿Se puede editar? |
|--------|-------------|-------------------|
| `PENDING` | Creada, sin pagar | Sí (agregar productos) |
| `PARTIAL_PAYMENT` | Pagada parcialmente | Sí (agregar productos, más pagos) |
| `PAID` | Pagada totalmente | No (solo lectura) |
| `CANCELLED` | Cancelada | No (bloqueada por trigger) |

---

## 2. Resolución de sucursal (header vs query vs JWT)

Jerarquía (prioridad descendente):

1. `?branch_id=<id>` (query param)
2. `X-Branch-ID: <id>` (header)
3. `active_branch` del JWT
4. Primera de `allowed_branches`

**ADMIN** (`role_id = "F2VLso"`) puede operar en cualquier sucursal sin validación de
`allowed_branches`. **Non-ADMIN** recibe `403` si la sucursal no está en su lista.

Ver `MULTI_BRANCH_CONTEXT_GUIDE.md` para el detalle completo.

---

## 3. Flujo 1 — Venta nueva (el flujo principal)

### Diagrama de decisiones

```
¿Producto pesable? ─── SÍ ──→ Flujo pesable (§3.3) ──→ POST /sales/scan
       │
       NO
       ▼
¿Tiene variantes (has_variant:true)? ─── SÍ ──→ Selector de variantes ──→ variant_id
       │                                                              requerido
       NO
       ▼
¿Es reserva/alquiler (SERVICE + reserve)? ─── SÍ ──→ Flujo reserva (§3.4)
       │
       NO
       ▼
Producto físico simple → POST /sale/with-units
```

### 3.1 Producto físico simple

```json
POST /sale/with-units
X-Branch-ID: 3
{
  "client_id": "CL_xxx",
  "product_details": [
    { "product_id": "ABC123", "quantity": 2, "unit": "unit", "tax_rate_id": 1 }
  ],
  "payment_method_id": 1,
  "currency_id": 1
}
```

### 3.2 Producto con variantes ✅ CORRECTO

```json
POST /sale/with-units
{
  "client_id": "CL_xxx",
  "product_details": [
    {
      "product_id": "vC0cxl7DR",
      "variant_id": "3kjVkfavR",
      "quantity": 1,
      "unit": "unit"
    }
  ]
}
```

### ❌ INCORRECTO — omitir variant_id

```json
{ "product_id": "vC0cxl7DR", "quantity": 1, "unit": "unit" }
```

**Resultado (tras robustez backend):**
```
variant_id is required for product vC0cxl7DR (CAMISETA ADIDAS FEM):
it has 1 active variant(s). Specify variant_id
```

### 3.3 Producto pesable (balanza)

Usar el flujo de balanza: registro con `scale_code` → precio por unidad → pesaje → escaneo en
POS. Ver `WEIGHABLE_PRODUCTS_GUIDE.md`. Endpoint: `POST /sales/scan`.

### 3.4 Producto con reserva (alquiler por hora)

SERVICE + `reserve_id`. La reserva debe estar `CONFIRMED`. Ver
`RESERVATION_SCHEDULE_FRONTEND_GUIDE.md`.

```json
{
  "product_id": "CANCHA_01",
  "quantity": 1,
  "unit": "hour",
  "reserve_id": 42
}
```

---

## 4. Flujo 2 — Agregar productos a venta existente (PENDING)

### Regla fundamental: el endpoint es **append/increment**

`POST /sale/{id}/products` **agrega** productos, no reemplaza la tabla completa.

### ✅ Cómo debe hacerse

1. Cargar la venta existente: `GET /sale/{id}` → `existingLines`.
2. El usuario agrega items nuevos → `newLines`.
3. Payload **solo de `newLines`**:

```json
POST /sale/SALE-xxx/products
X-Branch-ID: 3
{
  "allow_price_modifications": false,
  "product_details": [
    { "product_id": "vC0cxl7DR", "variant_id": "3kjVkfavR", "quantity": 1 }
  ]
}
```

4. En éxito → **refetch** `GET /sale/{id}` y reemplazar `existingLines`.
5. React key = `detail.id` (NO `saleId-productId`).

### ❌ Antipatrones comunes

- Enviar toda la tabla (persisted + nuevos) → **cantidades infladas**.
- Usar `saleId-productId` como key de React → duplicación de filas.
- Re-submit automático desde un `useEffect` al cambiar estado → loop.
- Omitir `variant_id` para productos con variantes → error de stock.

### `X-Branch-ID` en este flujo

**Usa la sucursal de la venta.** Si el usuario cambió de sucursal activa, el frontend debe
enviar el `branch_id` de la venta (el que viene en `GET /sale/{id}` → `branch_id`), no la
sucursal actualmente seleccionada en la UI.

Ver `SALES_ADD_PRODUCTS_EXISTING_SALE_CONTRACT.md` para el contrato completo.

---

## 5. Flujo 3 — Continuar / reanudar venta pendiente

### Escenario

Una venta quedó `PENDING`. El cliente vuelve (mismo día u otro) para completarla.

### ✅ Flujo correcto

1. `GET /sale/client_id/{client_id}/pending?branch_id=X` → lista pendientes.
2. Seleccionar una venta → `GET /sale/{id}` → obtener `branch_id` de la venta.
3. **Operar en la sucursal de la venta.** El frontend debe:
   - Mostrar la sucursal de la venta al operador (no la activa).
   - Enviar `X-Branch-ID` = `branch_id` de la venta en los POST.
4. Agregar productos si hace falta (`POST /sale/{id}/products`).
5. Pagar (`POST /payment/process` o `PUT /sale/{id}/confirm-payment`).

### ❌ Antipatrón — “continuar desde otra sucursal”

- Cambiar el `X-Branch-ID` a la sucursal activa actual **no re-ancla** la venta.
- El backend valida stock de la sucursal de la venta (vía el `branch_id` del contexto).
- Si el stock está en otra sucursal, el flujo correcto es **transferir inventario**
  (`/branch-transfers/*`), no forzar la venta.

### ¿Qué pasa con el stock?

El stock se valida y descuenta de la sucursal de la venta. Si la venta es de sucursal 1, no
puedes vender stock de sucursal 3 cambiando el header.

---

## 6. Flujo 4 — Pagos

### Pago total

```
POST /payment/process
{ "sale_id": "SALE-xxx", "payment_method_id": 1, "currency_id": 1, "amount": 121500 }
```

### Pago parcial

```
POST /payment/process-partial
```

La venta pasa a `PARTIAL_PAYMENT` hasta completar el total.

### Confirmación de pago (marcar)

```
PUT /sale/{id}/confirm-payment
```

### Pago con caja registradora

```
POST /cash-register/payments/sale
```

Asocia el pago a una sesión de caja abierta en la sucursal. Ver `CASH_REGISTER_API_GUIDE.md`.

---

## 7. Flujo 5 — Cancelación

### Preview (siempre antes de cancelar)

```
GET /sale/{id}/preview-cancellation
```

Devuelve el impacto: stock a reponer, montos, etc.

### Cancelar

```
PUT /sale/{id}
{ "action": "cancel", "reason": "..." }
```

- Una venta `CANCELLED` no puede modificarse (trigger `prevent_cancelled_sale_update`).
- El stock reservado/descontado se revierte según la función SQL.

---

## 8. Matriz de reglas por tipo de producto

| Tipo de producto | ¿`variant_id`? | ¿Unidad? | ¿Reserva? | Endpoint |
|------------------|----------------|----------|-----------|----------|
| Físico simple | No | Opcional (default: base) | No | `/sale/with-units` |
| Físico con variantes | **Sí (obligatorio)** | Opcional | No | `/sale/with-units` |
| Físico pesable | No | Fija (kg/g) | No | `/sales/scan` |
| Servicio/alquiler | No | `hour`/`day` | **Sí** | `/sale/with-units` + reserve |
| Manufacturado | Según variantes | Opcional | No | `/sale/with-units` |

---

## 9. Antipatrones — qué NO hacer

### 9.1 NO omitir `variant_id` en productos con variantes

```json
// ❌ MAL
{ "product_id": "vC0cxl7DR", "quantity": 1 }

// ✅ BIEN
{ "product_id": "vC0cxl7DR", "variant_id": "3kjVkfavR", "quantity": 1 }
```

**Cómo saberlo:** `has_variant: true` en el search/detalle.

### 9.2 NO sumar dos veces el stock en la UI

```ts
// ❌ MAL — stock_quantity YA incluye variantes
const total = product.stock_quantity + sumVariantStock(variants);

// ✅ BIEN — stock_quantity es el total agregado
const total = product.stock_quantity;
```

### 9.3 NO reemplazar toda la tabla al agregar a venta existente

El endpoint `/sale/{id}/products` es **append/increment**. Envía solo lo nuevo.

### 9.4 NO continuar una venta en otra sucursal cambiando el header

La venta está anclada a su `branch_id`. Usa el de la venta.

### 9.5 NO usar `saleId-productId` como React key

Una venta puede tener múltiples líneas del mismo producto. Usa `detail.id`.

### 9.6 NO modificar el precio sin `allow_price_modifications`

Si vas a enviar `sale_price`, manda `"allow_price_modifications": true` y una
`price_change_reason`. Si no, recibirás `PRICE_MODIFICATION_NOT_ALLOWED`.

---

## 10. Manejo de errores comunes

| Error | Causa | Solución frontend |
|-------|-------|-------------------|
| `variant_id is required for product X` | Producto con variantes, sin variant_id | Abrir selector de variantes |
| `INSUFFICIENT_STOCK` / `insufficient stock ... Available: 0.00` | Stock 0 en la sucursal/variante consultada | Verificar variante y sucursal correctas |
| `PRICE_MODIFICATION_NOT_ALLOWED` | Enviaste `sale_price` sin flag | Enviar `allow_price_modifications: true` |
| `PRICE_CHANGE_REASON_REQUIRED` | Modificaste precio sin razón | Pedir razón al usuario |
| `SALE_CANCELLED` | Operando sobre venta cancelada | Bloquear UI de edición |
| `NO_CONVERSION` | Unidad sin conversión registrada | Registrar en `/unit-conversions` |
| `403 forbidden branch_id` | Sucursal fuera de `allowed_branches` | Restringir selector de sucursal |

---

## 11. Snippets de referencia para el frontend

### 11.1 ¿Requiere este producto selección de variante?

```ts
function requiresVariantSelection(product: ProductEnriched): boolean {
  return product.has_variant && (product.variant_count ?? 0) > 0;
}
```

### 11.2 Stock a mostrar

```ts
function getDisplayStock(product: ProductEnriched): number {
  // stock_quantity del search/detalle YA es agregado (padre + variantes)
  return product.stock_quantity ?? 0;
}
```

### 11.3 Construir payload de línea de venta

```ts
function buildSaleLine(item: CartItem) {
  return {
    product_id: item.productId,
    variant_id: item.variantId ?? undefined, // obligatorio si has_variant
    quantity: item.quantity,
    unit: item.unit ?? "unit",
    tax_rate_id: item.taxRateId,
  };
}
```

---

## 12. Guías relacionadas

| Guía | Cubre |
|------|-------|
| [SALES_API_GUIDE.md](./SALES_API_GUIDE.md) | Referencia completa de endpoints |
| [SALES_ADD_PRODUCTS_EXISTING_SALE_CONTRACT.md](./SALES_ADD_PRODUCTS_EXISTING_SALE_CONTRACT.md) | Contrato append a venta existente |
| [VARIANT_API_GUIDE.md](./VARIANT_API_GUIDE.md) | Sistema de variantes |
| [VARIANT_TAG_USAGE_GUIDE.md](./VARIANT_TAG_USAGE_GUIDE.md) | Flujos prácticos de variantes |
| [MULTI_BRANCH_CONTEXT_GUIDE.md](./MULTI_BRANCH_CONTEXT_GUIDE.md) | Contexto multi-sucursal |
| [WEIGHABLE_PRODUCTS_GUIDE.md](./WEIGHABLE_PRODUCTS_GUIDE.md) | Productos pesables / balanza |
| [UNIT_CONVERSIONS_API_GUIDE.md](./UNIT_CONVERSIONS_API_GUIDE.md) | Conversiones de unidad |
| [CASH_REGISTER_API_GUIDE.md](./CASH_REGISTER_API_GUIDE.md) | Caja registradora |
| [RESERVATION_SCHEDULE_FRONTEND_GUIDE.md](./RESERVATION_SCHEDULE_FRONTEND_GUIDE.md) | Reservas / horarios |
| [BRANCH_TRANSFER_API_GUIDE.md](./BRANCH_TRANSFER_API_GUIDE.md) | Transferencia entre sucursales |
| [FRONTEND_FEEDBACK_VARIANT_STOCK_2026_07_14.md](./FRONTEND_FEEDBACK_VARIANT_STOCK_2026_07_14.md) | Postmortem del incidente |

---

## 13. Cambios recientes relevantes

### 2026-07-14 — Robustez backend de validación de variantes

`ValidateProductsForSale` ahora exige `variant_id` para productos con variantes activas.
Antes, un payload sin `variant_id` validaba el stock del padre (0) y devolvía un error
críptico `insufficient stock ... 0.00`. Ahora el mensaje es explícito:

```
variant_id is required for product {id} ({name}): it has {N} active variant(s).
```

Aplica a `/sale/with-units`, `/sale/process`, y `/sale/{id}/products`.
