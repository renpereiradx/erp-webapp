# BI Variant-Aware — Integridad de datos con variantes, multi-sucursal y dimensiones

> **Resumen:** Este documento describe las correcciones de integridad de datos
> aplicadas al módulo BI después de la incorporación de variantes de producto,
> multi-sucursal, marcas, atributos y etiquetas. Los endpoints de BI ahora
> devuelven datos consistentes con la DB real, respetan el scope de sucursal, y
> exponen nuevas dimensiones de producto.

## Contexto del problema

Los features de variantes (`20260613000001`+), multi-sucursal (`20260402153000`+),
marcas/atributos/etiquetas (`20260612134304`+) modificaron el esquema de tablas
que los queries del BI leen:

- `products.stock`, `products.unit_prices`, `products.unit_costs`,
  `transactions.sales_order_details`, `transactions.purchase_order_details`,
  `products.stock_transactions` ganaron una columna `variant_id`.
- 14 tablas transaccionales ganaron `branch_id NOT NULL`.
- `products.products.brand` (text) fue reemplazado por `brand_id` FK.

Hasta estas correcciones, **ningún query del BI consideraba `variant_id`**, lo que
producía:

1. **Doble conteo de stock** — un producto con N variantes generaba N filas en
   los JOINs de inventario, inflando `COUNT(*)`, `SUM(quantity)` y
   `SUM(quantity * cost)`.
2. **Errores de runtime multi-fila** — los `LATERAL` a `unit_prices`/`unit_costs`
   podían tirar "more than one row returned by a subquery".
3. **COGS/márgenes incorrectos** — el costo siempre se resolvía a nivel de
   producto padre, ignorando costos específicos por variante.
4. **Sin scope de sucursal explícito** — el Admin sin `branch_id` agregaba
   silenciosamente todas las sucursales sin indicarlo en la respuesta.

## Solución aplicada

### Migraciones

| Migración | Descripción |
|-----------|-------------|
| `20260707185244_add_variant_id_to_unit_costs` | Añade `variant_id` a `products.unit_costs` (índice único con `COALESCE(variant_id,'__NULL__')`), backfill desde `metadata`, y nuevas funciones `upsert_unit_cost` (retrocompatible) + `upsert_unit_cost_with_variant`. Reescribe los dos overloads de `process_complete_purchase_order` para que el INSERT de costos sea variant-aware. |
| `20260707190849_add_bi_variant_aware_helper_functions` | Funciones helper STABLE: `get_effective_stock`, `get_cost_for_variant`, `get_price_for_variant`, `has_active_variants`. |

### Helpers SQL (patrón de referencia)

```sql
-- Stock efectivo: fila padre (variant_id IS NULL) + variantes activas
products.get_effective_stock(p_product_id, p_branch_id)  -- NULL = todas

-- Costo por variante con fallback al padre
products.get_cost_for_variant(p_product_id, p_variant_id, p_unit)

-- Precio por variante con fallback al padre
products.get_price_for_variant(p_product_id, p_variant_id, p_unit)

-- ¿Tiene variantes activas?
products.has_active_variants(p_product_id)
```

### Repositorios BI corregidos

Todos los queries de los 5 repositorios BI fueron actualizados al patrón
variant-aware:

- `repository/inventory_analytics.go` — overview, stock-levels, turnover, ABC,
  dead-stock, reorder, aging, forecast, dashboard, movements.
- `repository/dashboard.go` — inventory summary/KPIs, low/out-of-stock,
  negative-margin, top-products, financial KPIs.
- `repository/sales_analytics.go` — performance, trends, by-category/product/
  customer/seller/payment-method, velocity, comparison, dashboard.
- `repository/profitability.go` — overview, products, customers, categories,
  trends, sellers.
- `repository/financial_reports.go` — income statement, profit margins,
  financial overview (inventory_data CTEs + COGS).

**Regla de transformación aplicada sistemáticamente:**

- `JOIN products.stock ON id_product` → CTE `product_stock` con
  `get_effective_stock`, una fila por producto.
- `LEFT JOIN LATERAL (... unit_costs WHERE product_id = p.id)` → eliminado;
  reemplazado por `get_cost_for_variant(sd.product_id, sd.variant_id)` inline
  (cada línea de venta usa el costo de SU variante).
- `COUNT(*)` → `COUNT(DISTINCT p.id)` para conteos de productos.

## Scope de sucursal (branch)

**Contrato:** toda respuesta BI incluye `metadata.scope`:

```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "generated_at": "...",
    "scope": {
      "consolidated": false,
      "branch_id": 1
    }
  }
}
```

| Quién llama | `branch_id` resuelto | `scope.consolidated` |
|-------------|----------------------|----------------------|
| Admin sin `branch_id` y sin `ActiveBranch` | `nil` | `true` (todas las sucursales) |
| Admin con `branch_id` o `ActiveBranch` | ese id | `false` |
| Non-admin con `AllowedBranches` | su branch activa | `false` |
| Non-admin sin `AllowedBranches` | `nil` → 400 "branch context required" | — |

Los filtros se pasan vía `?branch_id=N` (query) o `X-Branch-ID` (header).

## Nuevas dimensiones de producto

Los reportes detallados por producto exponen ahora:

```json
{
  "product_id": "PROD_001",
  "product_name": "Remera",
  "sku": "PROD_001",
  "category_name": "Indumentaria",
  "brand_id": 5,
  "brand_name": "MarcaX",
  "tags": ["verano", "oferta"],
  "current_stock": 42,
  "unit_cost": 1000,
  "unit_price": 2200,
  "stock_value": 42000
}
```

Reportes enriquecidos con `brand_id`, `brand_name`, `tags`:
- `GET /inventory-analytics/stock-levels`
- `GET /sales-analytics/by-product`
- `GET /profitability/products`
- `GET /dashboard/top-products`

### Filtros por dimensión (query params)

Disponibles en `GET /inventory-analytics/stock-levels`:

| Param | Ejemplo | Semántica |
|-------|---------|-----------|
| `brand_id` | `?brand_id=5` | Filtra por marca |
| `tag` | `?tag=verano&tag=oferta` | Filtra por etiqueta (OR, repetible) |

> **Extensión futura:** replicar `ProductFilters` (`models.ProductFilters`)
> en el resto de reportes detallados sigue el mismo patrón handler → service →
> repository ya establecido en `GetStockLevels`.

## COGS por variante

Antes, todas las métricas de margen/rentabilidad usaban el costo del producto
padre. Ahora, cada línea de venta (`sales_order_details` con `variant_id`)
resuelve su costo específico vía `get_cost_for_variant(sd.product_id, sd.variant_id)`,
con fallback al costo del padre si la variante no tiene costo propio.

Esto afecta: `gross_profit`, `gross_margin_pct`, `cost`, `markup`,
`contribution_pct`, `profit_per_unit` en todos los reportes de ventas,
rentabilidad y financieros.

## Verificación

Tests de integración (`tests/integration/bi_variant_integrity_test.go`):
- `TestBI_VariantIntegrity_StockNoDoubleCounts` — un producto con variantes
  aparece **una sola vez** en stock-levels (antes aparecía una vez por fila de
  stock).
- `TestBI_VariantIntegrity_SaleProfitUsesVariantCost` — el margen de una venta
  variante usa el costo de esa variante, no el del padre.

Ejecución: `make test-integration` (requiere `DATABASE_URL` o `DB_*`).

## Limitaciones conocidas

1. **Agrupamiento por variante (opt-in pendiente):** los reportes siguen
   agrupando por producto padre (`sd.product_id`). El desglose por variante
   (`?group_by_variant=true`) está modelado en `ProductFilters.GroupByVariant`
   pero aún no implementado en los queries.
2. **Filtros `attribute=<code>:<value>`** no implementados todavía (solo
   `brand_id` y `tag`).
3. **`RETURNED` status** no soportado por el esquema (caveat preexistente).
