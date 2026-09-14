# PLAN — Variantes planas en ajustes de precios, ajustes de stock y página de productos

**Fecha**: 2026-09-14
**Estado**: ✅ Implementado (2026-09-14, FE `4b96136`)
**Alcance**: Solo frontend `erp-webapp/` (el backend ya expone `granularity: "variant"` en
`POST /products/search/advanced` — ver `PLAN_BUSQUEDA_VARIANTES_PLANAS.md`, repo raíz)
**Origen**: Pedido del owner: extender el tratamiento "variante como producto independiente"
a ajuste de precios, ajustes de stock y la página principal de productos; en variantes,
indicar cuál es su producto padre.

---

## 1. Estado actual (verificado 2026-09-14)

| Superficie | Búsqueda hoy | Variantes hoy |
|:-----------|:-------------|:--------------|
| Ajuste de precios (`PriceAdjustmentNew.jsx` → store `usePriceAdjustmentNewStore` → `productStore.searchProducts` → `searchInfo` financiero) | 1 fila por producto | 2º paso: selector de variante en `PriceAdjustmentDetail.jsx` (ya envía `variant_id` en el payload del ajuste) |
| Ajustes de stock (`stock-movements` `ProductSearchModal` → `productService.search`) | 1 fila por producto | 2º paso: `MovementForm.handleSelectProduct` carga variantes con N+1 (`getEnrichedVariants`) y abre modal de edición; el payload ya envía `variant_id` por fila |
| Página productos (`Products.tsx` → `useProductsLogic` → store `useProductStore`) | Paginada: `GET /products/list` (`getProductsPaginated`); búsqueda: `searchInfo` financiero con cadena de fallbacks | Sin filas de variante; edición de variantes vive dentro del modal del producto padre (`ProductVariantsManager`) |

## 2. Diseño

Reutilizar `searchAdvanced({ granularity: 'variant' })` en los tres flujos y preseleccionar
la variante que ya viene en la fila (adiós el 2º paso y el N+1). En todas las filas de
variante se indica el producto padre (chip "Producto padre: {name}"); la fila base lleva el
chip "Producto base".

- **Precio-effective / costo**: la fila plana trae `current_price` (variante-primero,
  fallback padre) y `current_cost` (solo callers con `products:cost` — admin/BUYR01 ok).
- **Ajuste de precios**: el store propio pasa a consumir `searchAdvanced` plano directo
  (paginación server-side real con `total_count`); `PriceAdjustmentDetail` preselecciona
  `selectedVariantId` desde `location.state.selectedProduct.variant_id`.
- **Stock**: `ProductSearchModal` plano (título compuesto + SKU + padre + stock de la unidad);
  `MovementForm.handleSelectProduct` construye la fila con la variante ya elegida
  (sin `getEnrichedVariants`); el payload batch no cambia (ya envía `variant_id`).
- **Página productos**: `useProductStore` — `fetchProductsPaginated` y el primario de
  `fetchInfoWithFallback` pasan a `searchAdvanced` plano (fallbacks legacy solo si el
  endpoint falla); `useProductsLogic` agrega `granularity: 'variant'` a los payloads
  avanzados. `ProductsTable` renderiza filas planas (precio = `current_price`, costo =
  `current_cost`, IVA `—` cuando la fila no trae datos de tasa) y los handlers de
  detalles/edición resuelven el producto PADRE enriquecido (`productService.getById(row.id)`)
  antes de abrir los modales — los modales siguen recibiendo `ProductEnriched` completo.

## 3. Fases y gates

| Fase | Contenido | Gate |
|:-----|:----------|:-----|
| F-A | Ajuste de precios: store plano + preselección en Detail | vitest + tsc |
| F-B | Stock: `ProductSearchModal` plano + fila con variante preseleccionada | vitest (feature tests) |
| F-C | Página productos: store plano + tabla con padre + modales con fetch del padre | vitest (store tests migrados) + tsc |
| F-D | Gates finales: `npx vitest --run` 0, `tsc --noEmit` 0, `pnpm build`, `pnpm lint:design` | verde |

Sin cambios de backend ni migraciones.

## 4. Riesgos

| Riesgo | Mitigación |
|:-------|:-----------|
| Store de productos frágil (circuit breaker, caches, demo) | Cambiar SOLO las llamadas primarias de datos; caches/fallbacks/telemetría intactos; tests del store migrados al nuevo mock |
| Modales admin esperan `ProductEnriched` | Handlers resuelven el padre enriquecido con `getById` antes de abrir |
| Filas fixture sin precio (BI fixtures) | IVA/precio con fallback `—`/0; los guards existentes siguen aplicando |
| Densidad (N variantes por producto) | page_size acotado por página server-side (10-20); búsqueda por SKU encuentra la variante directamente |

## 5. Registro

- 2026-09-14 — Plan creado; implementación F-A..F-D en el mismo día (ver registro al pie).

- 2026-09-14 — **Implementado F-A..F-D** (commit `4b96136`, branch `dev`). F-A: store de
  ajuste de precios plano con paginación server-side real (`total_count`); Detail preselecciona
  la variante de `location.state`. F-B: `ProductSearchModal` plano (título compuesto, SKU,
  hint de padre, stock por unidad); `MovementForm` preselecciona la variante de la fila —
  N+1 de `getEnrichedVariants` eliminado; payload batch intacto. F-C: `useProductStore`
  consume la búsqueda plana en `fetchProductsPaginated` (con `signal` preservado) y como
  fuente primaria de `fetchInfoWithFallback` (cadena legacy solo como fallback ante falla);
  payloads avanzados de `useProductsLogic` con `granularity: 'variant'`; `ProductsTable`
  con chip "Producto padre: {name}" / "Producto base", SKU por fila, `current_price`/
  `current_cost` con fallback y IVA "—" en filas sin datos de tasa; handlers de
  detalles/edición resuelven el padre enriquecido (`getById`) antes de abrir modales.
  Tests migrados a la frontera `searchAdvanced` (cacheRevalidation, circuitBreaker — busca
  con plana+legacy cayendo juntas, ttl.expiration, Products.delete). Nota: el breaker de
  búsqueda ahora registra falla sólo si la capa plana Y la legacy fallan.
  Gates: vitest 626/626 (91 archivos), tsc 0, `pnpm build`, `lint:design`.

- 2026-09-14 (hotfix post-QA) — Tres bugs de la primera pasada, reportados por el owner:
  (1) `usePriceAdjustmentNewStore` sin import de `productService` → "productService is not
  defined" en /ajustes-precios (la edición del import se perdió en un lote fallido).
  (2) El cuadro de búsqueda de /productos usa `fetchProducts` del store — NO `searchProducts`
  ni `fetchProductsPaginated`; ese método seguía en `GET /products/search/{name}` (por-padre).
  Ahora su primaria es la búsqueda plana con fallback por-nombre ante falla. (3) El hook
  `useProductsLogic` de-duplicaba filas por id de producto (guard anti-keys-duplicadas) y
  colapsaba todas las variantes de un producto en una sola fila — la dedup ahora es por
  unidad (producto, variante). Además, en el flujo de ajuste de precios: `select` pasa
  `product_id || id` (la fila plana no trae product_id) y el Detail prefiere el producto
  padre ENRIQUECIDO (resuelto por getById en el handler) sobre la fila cruda del state.
  Verificado contra BD dev: "nike" → 6 filas planas (2 bases + 4 variantes).
