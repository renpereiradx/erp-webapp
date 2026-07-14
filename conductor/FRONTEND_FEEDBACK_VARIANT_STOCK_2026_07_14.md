# Feedback Técnico Frontend — Variantes, Stock y Continuación de Ventas Pendientes

**Fecha:** 2026-07-14
**Audience:** Team Frontend
**Origen:** Incidente `SALE-1783597844-629` — "insufficient stock for product vC0cxl7DR"
**Severidad:** Bloqueante para ventas de productos con variantes

---

## 1. Resumen ejecutivo

Se reportó un error al agregar un producto a una venta pendiente. El diagnóstico inicial
(“discrepancia de sucursal”) **es incorrecto**. Tras inspección de la base de datos y del
código, la causa raíz es otra: **falta `variant_id` en el payload de venta**.

Adicionalmente, la UI de inventario muestra valores de stock inconsistentes que inducen a
confusión al operador. Este documento detalla ambos problemas y las correcciones requeridas.

> ⚠️ **Importante:** el backend ya fue reforzado (ver §3). Los payloads incompletos ahora
> reciben un error **claro y accionable** en lugar del críptico `insufficient stock ... 0.00`.

---

## 2. El incidente: qué pasó realmente

### Payload enviado por el frontend

```json
POST /api/sale/SALE-1783597844-629/products
X-Branch-ID: 3
{
  "allow_price_modifications": false,
  "product_details": [
    { "product_id": "vC0cxl7DR", "quantity": 1, "unit": "unit" }
  ]
}
```

### Respuesta anterior (críptica)

```
Error adding products to sale: product validation failed:
insufficient stock for product vC0cxl7DR. Available: 0.00, Requested: 1.00
```

### Nueva respuesta (tras robustez del backend)

```
product validation failed: variant_id is required for product vC0cxl7DR
(CAMISETA ADIDAS FEM): it has 1 active variant(s). Specify variant_id
```

### Datos reales en la base (sucursal 3)

| stock.id | product | branch | variant_id | quantity | significado |
|----------|---------|--------|------------|----------|-------------|
| 49 | vC0cxl7DR | 3 | **NULL** | **0.00** | stock del producto **padre** |
| 75 | vC0cxl7DR | 3 | **3kjVkfavR** | **15.00** | stock de la **variante** NEGRO/2XL |

El producto **tiene variantes activas** (`has_variant: true`, `variant_count: 1`). Por diseño
del sistema, **el stock vive a nivel de variante** (`variant_id + branch_id`), no del padre.
Al omitir `variant_id`, la validación consultaba el stock del padre (0.00) y fallaba.

### Veredicto sobre el diagnóstico de “discrepancia de sucursal”

| Afirmación del informe previo | Veredicto |
|-------------------------------|-----------|
| “La venta fue creada en sucursal 1” | ❌ Falso. Está en `branch_id = 3` (verificado en BD) |
| “El `X-Branch-ID: 3` es incorrecto” | ❌ Falso. Coincide con el `branch_id` de la venta |
| “El error es por validar stock en sucursal equivocada” | ❌ Falso. Valida en la sucursal correcta (3) |
| “Fix: usar `branch_id` de la venta” | ❌ No arregla nada; la venta ya está en la branch enviada |
| **Causa real** | ✅ **Falta `variant_id`** en el payload |

---

## 3. Cambio en el backend (ya aplicado)

`services/sale.go` — `ValidateProductsForSale` ahora verifica, **antes de consultar stock**,
si el producto tiene variantes activas. Si las tiene y no se envió `variant_id`, rechaza la
operación con un mensaje claro:

> `variant_id is required for product {id} ({name}): it has {N} active variant(s). Specify variant_id`

Esto aplica a **todos** los flujos que usan `ValidateProductsForSale`:
- `POST /sale/with-units` (creación de venta)
- `POST /sale/{id}/products` (agregar a venta existente)
- `POST /sale/process` (procesamiento con reserva)

### Cobertura de tests
- `PHYSICAL with active variants, no variant_id → error (variant_id required)` ✅
- `PHYSICAL with active variants, variant_id provided → valid` ✅

---

## 4. Correcciones requeridas en el frontend

### 4.1 🔴 Crítico — Enviar `variant_id` al vender productos con variantes

**Regla de oro:** si `has_variant === true` en el producto, el usuario **debe seleccionar
una variante** antes de agregarlo al carrito, y el payload debe incluir `variant_id`.

**Cómo detectarlo:** las respuestas de búsqueda (`GET /products/search/{name}`) y de detalle
ya devuelven:

```json
{ "has_variant": true, "variant_count": 1 }
```

**Flujo correcto del selector de variantes:**

1. Producto con `has_variant: true` → el botón “Agregar” abre un modal/selector.
2. `GET /api/v1/products/{id}/variants` → lista las variantes activas.
3. El usuario elige variante → se obtiene su stock y precio:
   - `GET /api/v1/variants/{variant_id}/stock?branch_id=X`
   - precio en `GET /products/{id}/units` (la fila con `variant_id` coincide)
4. El payload de venta incluye `variant_id`:

```json
{
  "allow_price_modifications": false,
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

**Cobertura en la guía:** `VARIANT_API_GUIDE.md § "Transacciones con variantes"` y la nueva
`SALES_FLOWS_GUIDE.md`.

### 4.2 🟠 Importante — No doble-contar stock en la UI de inventario

**El bug visual:** la pantalla mostraba “Stock Producto Base: 15” (el base real es **0**) y
“TOTAL CONSOLIDADO: 30” (doble conteo).

**Por qué pasa:** el campo `stock_quantity` que devuelve `GET /products/search/{name}` **ya es
un agregado** (stock del padre `variant_id IS NULL` + suma de todas las variantes activas).
Esto está confirmado en `database/postgres/product.go`:

```sql
-- productEnrichedFromJoins: LATERAL join con SUM
SELECT COALESCE(SUM(s.quantity), 0) AS quantity
FROM products.stock s
WHERE s.id_product = p.id
  AND (s.variant_id IS NULL
       OR s.variant_id IN (SELECT ... active variants))
  AND branch_id = $branch
```

El frontend estaba interpretando ese 15 como “stock del producto base” y **sumándolo de nuevo**
al stock de variantes → `15 + 15 = 30`.

**Regla para la UI:**

| Producto | Qué mostrar como “stock” | Origen |
|----------|--------------------------|--------|
| Sin variantes (`has_variant: false`) | `stock_quantity` (es el stock directo) | search / detalle |
| Con variantes (`has_variant: true`) | `stock_quantity` **ya es el total**; **no sumar de nuevo** las variantes | search / detalle |
| Por variante específica | stock de esa variante | `GET /api/v1/variants/{id}/stock` |

**Etiqueta recomendada:** para productos con variantes, mostrar `stock_quantity` como
**“Stock total (base + variantes)”** — no como “stock base”. Y al seleccionar una variante
específica, mostrar su stock propio.

### 4.3 🟡 Menor — Mensaje de error accionable en la UI

A partir del cambio del backend, los errores de validación llegan como texto plano en el body
(`http.Error`). Considerar:

- Detectar el patrón `variant_id is required` y mostrar un CTA: **“Este producto requiere
  seleccionar una variante”** que abra el selector.
- Para `insufficient stock`, ya hay `Available`/`Requested` parseable en el mensaje.

---

## 5. Modelo de negocio confirmado: venta y stock por sucursal

Se confirma y mantiene la política: **el stock y las ventas son por sucursal, separados**.

| Regla | Detalle |
|-------|---------|
| `branch_id` de la venta | **Inmutable** tras la creación (trigger `trg_set_branch_id_sales_orders`). Una venta pertenece siempre a su sucursal de origen. |
| Stock validado | El de la sucursal de la venta, a nivel de variante si aplica. |
| `X-Branch-ID` / `?branch_id` | Define la sucursal activa para **crear** ventas nuevas y para **listar/filtrar**. No “mueve” una venta existente de sucursal. |
| Continuar venta pendiente desde otra sucursal | La venta sigue descontando stock de su sucursal de origen. No se debe permitir “re-anclar” la venta a otra sucursal solo cambiando el header. |

**Implicancia para el frontend:** al reanudar/continuar una venta pendiente, la UI debe
operar en el contexto de la sucursal de esa venta (mostrar y usar su `branch_id`), no forzar
la sucursal actualmente activa del usuario.

### ¿Necesitar mercadería de otra sucursal?
Usar el flujo de **transferencia entre sucursales** (`/branch-transfers/*`, ver
`BRANCH_TRANSFER_API_GUIDE.md`), no “continuar la venta desde otro lado”.

---

## 6. Checklist de implementación para el frontend

- [ ] **Selector de variantes obligatorio** para productos con `has_variant: true` antes de agregar al carrito (venta nueva y venta existente).
- [ ] **Payload incluye `variant_id`** en `product_details` para variantes.
- [ ] **No doble-contar stock**: `stock_quantity` del search/detalle ya es agregado total.
- [ ] Etiqueta de stock correcta: “Stock total” (no “stock base”) para productos con variantes.
- [ ] **Continuar venta pendiente**: usar el `branch_id` de la venta, no la sucursal activa del usuario.
- [ ] Parsear mensaje `variant_id is required` y guiar al usuario al selector de variantes.
- [ ] Al mostrar stock de una variante específica, usar `GET /api/v1/variants/{id}/stock?branch_id=X`.

---

## 7. Referencias

- [SALES_FLOWS_GUIDE.md](./SALES_FLOWS_GUIDE.md) — Flujos completos de venta (nueva)
- [SALES_API_GUIDE.md](./SALES_API_GUIDE.md) — Referencia de endpoints de venta
- [SALES_ADD_PRODUCTS_EXISTING_SALE_CONTRACT.md](./SALES_ADD_PRODUCTS_EXISTING_SALE_CONTRACT.md) — Contrato append a venta existente
- [VARIANT_API_GUIDE.md](./VARIANT_API_GUIDE.md) — Sistema de variantes
- [MULTI_BRANCH_CONTEXT_GUIDE.md](./MULTI_BRANCH_CONTEXT_GUIDE.md) — Contexto multi-sucursal

### Código backend relevante

| Archivo | Función | Rol |
|---------|---------|-----|
| `services/sale.go` | `ValidateProductsForSale` | Validación de `variant_id` requerido (nuevo) |
| `services/sale.go:362` | `AddProductsToSale` | Flujo agregar a venta existente |
| `database/postgres/product.go:79` | `productEnrichedFromJoins` | Stock agregado (padre + variantes) |
| `database/postgres/stock.go:75` | `GetStockByProductId` | Stock solo de `variant_id IS NULL` |
| `database/postgres/stock.go:124` | `GetStockByProductIdAndVariant` | Stock de variante específica |
