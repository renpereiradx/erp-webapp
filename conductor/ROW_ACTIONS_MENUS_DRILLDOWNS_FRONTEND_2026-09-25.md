# Menús de acciones por fila + picker informativo — drill-downs relacionales (2026-09-25)

Alcance: `/sales-analytics/products/buyers`, `/sales-analytics/customers/top-products`,
`/purchase-analytics/suppliers/top-products`, `/purchase-analytics/products/suppliers`
(RF-BIPACK-021..024). Las 4 páginas comparten `DrilldownPage`, así que el menú se
implementó una vez en el feature y cada página define sus ítems.

## Qué se hizo

- **`src/features/relational-analytics/components/RowActionsMenu.tsx` (nuevo):** menú
  contextual por fila con el dropmenu global (`components/ui/dropdown-menu`, Radix).
  Encabezado informativo (nombre de la entidad + Doc/SKU) e ítems de dos líneas:
  acción + métrica de la fila (unidades · compras · importe). Tipos exportados:
  `DrilldownRowAction`, `DrilldownRowMenu`.
- **`hooks/useRowCopyValue.ts` (nuevo):** copia al portapapeles con toast de
  confirmación (usa `hooks/useToast`).
- **`DrilldownTable`/`DrilldownPage`:** prop opcional `rowMenu` → agrega la columna
  "Acciones" (header + celda con trigger ⋮ `data-testid="drilldown-row-actions"`);
  el colSpan del estado vacío la cuenta. Sin `rowMenu` la tabla no cambia.
- **Menús por página (grafo de pivotes entre los 4 análisis, deep-link por query param):**
  - Compradores (fila=cliente): → Productos que compra (resumen uds./compras/total) + Copiar documento.
  - Productos por Cliente (fila=producto): → Ver compradores + Comparar proveedores (precio prom.) + Copiar SKU.
  - Productos Suministrados (fila=producto): → Comparar proveedores (costo prom.) + Ver compradores + Copiar SKU.
  - Comparar Proveedores (fila=proveedor): → Productos suministrados (último precio · compras) + Copiar documento.
  - SKU/documento vacío: no se muestra subtítulo ni acción de copiar (evita "SKU:" huérfano).
- **i18n:** claves nuevas `bi.relational.action.aria|copyDoc|copySku|copied|copyError`,
  `bi.relational.col.actions`, `bi.relational.menu.docLabel|skuLabel|summary|avgPrice|avgCost|lastPriceSummary`
  en `locales/es/bi.js` y `locales/en/bi.js`. Los pivotes reusan las claves
  `bi.relational.action.*` que ya usaban los modales de detalle.

## 2ª iteración (misma sesión): picker de entidad informativo + variantes

El dropmenu de fila se mantuvo (aprobado por owner); lo que pedía ver era el
**buscador de entidad** ("Elegí Producto...", `EntitySearchSelect`), cuyo
desplegable solo mostraba el nombre — muy pobre junto al patrón de /ventas.

- **`EntitySearchSelect`:** items de dos líneas estilo POS/presupuestos:
  `Nombre (· Variante)` + `SKU: x` + `Stock: n unit` coloreado
  (text-success/text-error) + precio `formatPYG` a la derecha; para personas
  queda nombre + documento. `EntityOption` extiende con
  `variantId/variantName/sku/price/stock/baseUnit` y `onPick(id, option)`.
  Nueva prop `minChars` (default 2).
- **Productos con variantes:** las 2 páginas de producto usan la búsqueda plana
  compartida `searchSellableUnitsFlat` (granularity=variant, mismo camino que
  /ventas y presupuestos) vía mapper `sellableUnitToEntityOption`
  (`features/relational-analytics/sellableUnitOption.ts`), que además dedupe
  el display cuando el nombre de la variante ya embebe el del producto.
- **Pick de variante = filtro real:** el BE de los 4 drill-downs ya aceptaba
  `variant_id` opcional; elegir una variante navega con
  `?product_id=...&variant_id=...`, `DrilldownPage`/`useDrilldownQuery` lo
  agregan a los params y el encabezado muestra `Producto: X · Variante: Y`.
  Fila base (sin variante) → solo product_id. Nuevo i18n
  `bi.relational.entity.variant` (es/en).
- Verificado en vivo: dropdown con datos reales (CAMISETA ADIDAS con stock
  39/8/0 coloreado, SKUs de variante y precios), pick de variante end-to-end
  (URL + header + fetch filtrado). Gates: vitest 1150/1150, tsc 0, build ✓,
  lint:design ✓.

## Verificación (1ª iteración)

- Tests: 3 archivos de página ampliados — el menú abre con sus datos, el pivote navega
  (se renderizan las 4 rutas y se assertiona el fetch del destino con el id de la fila)
  y el copiado escribe en el portapapeles (`Object.defineProperty(navigator, 'clipboard', ...)`).
- Gates finales: vitest 1146/1146 (159 archivos), `tsc --noEmit` 0, `pnpm build` ✓,
  `pnpm lint:design` ✓ (código nuevo limpio; el componente usa tokens, no colores genéricos).
- Smoke visual en vivo (Vite + backend dev, JWT dev BUYR01 con `analytics:read`):
  las 4 páginas renderizan la columna Acciones con datos reales; pivote #1→#2 verificado
  en URL; truncado de nombres largos y caso SKU vacío OK.
