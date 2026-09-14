# AUDIT_REACT_PERFORMANCE_BUSQUEDA_VARIANTES_PLANAS_FRONTEND.md

**Fecha**: 2026-09-14
**Alcance**: fases F2–F6 de `PLAN_BUSQUEDA_VARIANTES_PLANAS` (repo raíz `conductor/`).
**Skill**: `vercel-react-best-practices` (reglas `rerender-*`, `rendering-*`, `js-*`, `client-*`; `server-*` no aplica — SPA Vite sin SSR).
**Archivos nuevos/modificados auditados**:

- `src/features/catalog/types.ts` — `CatalogSellableUnit`, `SellableUnitsPageData`
- `src/features/catalog/hooks/useCatalogProducts.ts` — `useCatalogSellableUnits`
- `src/features/counterorders/components/OrderBuilder.tsx` — picker plano
- `src/features/catalog/components/CatalogBoard.tsx` / `CatalogCard.tsx` — tarjetas por unidad
- `src/features/sales/components/ProductSearchPanel.tsx` + `src/pages/SalesNew.tsx` — dropdown plano
- `src/features/purchases/hooks/usePurchasesLogic.ts` + `components/PurchaseProductModal.tsx` — búsqueda plana

## Veredicto: ✅ sin hallazgos de impacto alto en código nuevo

| Regla | Aplicación | Estado |
|:------|:-----------|:-------|
| `rerender-no-inline-components` | `ProductPickCard` definida a nivel de módulo y `memo`-izada; mapeadores (`getUnitDisplay`, `toCatalogSellableUnit`, `groupAdjacentUnits`) fuera de componentes | ✅ |
| `rerender-memo` | `ProductPickCard` memoizada recibe `onAdd` estable (`useCallback([cart])`) y `unit` primitivo-por-fila: la grilla no re-renderiza en cada tecla salvo cambios de datos | ✅ |
| `rerender-lazy-state-init` | `useState(() => new Set())` para `expandedProducts` | ✅ |
| `rerender-functional-setstate` | Toggle de expansión con `setExpandedProducts(prev => …)` sin closure stale | ✅ |
| `js-set-map-lookups` | Dedup de compras por unidad con dos `Set` (`existingBase`/`existingUnits`); expansión por producto con `Set` | ✅ |
| `js-combine-iterations` | `getQuantityInCart` usa `filter().reduce()` (dos pasadas sobre `items`); el array es pequeño (carrito) — impacto trivial, se deja legible | ⚠️ aceptado |
| `client-*` | `useQuery` (React Query) con `queryKey` por (search, filters, page) + `placeholderData` — sin waterfalls: una sola llamada por búsqueda; el endpoint plano elimina el N+1 previo de `getEnrichedVariants` + stock por variante en los 4 pickers | ✅ mejora neta |
| `bundle-*` | Sin imports nuevos de terceros; lucide-react ya tree-shakeado | ✅ |

## Notas

1. **N+1 eliminado (mejora principal)**: antes, elegir variante en pedidos/ventas/compras
   disparaba `getEnrichedVariants` (1 GET de variantes + 1 GET de stock **por variante** +
   `/units`); ahora la fila de búsqueda trae precio y stock de la unidad (1 query backend,
   `AdvancedSearchUnits`, EXPLAIN 1.4 ms en dev).
2. **Cap de densidad** (`MAX_VARIANT_ROWS_PER_PRODUCT = 3`) en pedidos evita que un producto
   con muchas variantes inunde la grilla; el CTA "+n variantes más" expande solo ese grupo.
3. **Keys React**: filas planas comparten `product_id` — keys/testids usan
   `variant_id ?? id` en los 4 pickers y en el catálogo.
4. `CatalogCard` no está memoizada (igual que antes del cambio; grilla de 12 cards, impacto
   no medible). Candidato a `memo` si el catálogo crece — fuera de alcance de este plan.
