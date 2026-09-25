# PLAN_UNITS_FRONTEND — Unidades de medida: selector unificado + precios por unidad

**Fecha:** 2026-09-24 · **Estado:** ✅ Ejecutado (gates: vitest 1132/1132, tsc 0, build, lint:design)
**Par del backend:** `business_management/conductor/PLAN_UNITS_BACKEND.md`
(conversiones por producto + fix de reversa + GET /units + derivación de precio).

## Problema

1. Tres mecanismos distintos de elegir unidad: Select estricto de 35 unidades en
   productos, datalist de texto libre de 8 valores en ventas (`EditItemModal`) y otro
   datalist de 7 en compras — ni siquiera coincidentes entre sí.
2. Cambiar la unidad en una línea de venta NO recalculaba nada: se vendía "2 box"
   al precio por kg sin aviso.
3. Presupuestos enviaban `unit: 'unit'` hardcodeado; requisiciones no enviaban unit
   (el backend ya persiste `purchase_requisition_details.unit`).
4. Stock mostrado a veces con unidad y a veces sin (presupuestos, requisiciones,
   transferencias); transferencias forzaban cantidades enteras (imposible 0,5 kg).
5. Página admin de conversiones solo gestionaba factores globales.

## Cambios

| Archivo | Cambio |
|---|---|
| `src/components/UnitSelect.tsx` | **Nuevo** — selector unificado (Radix Select agrupado por categoría, catálogo `constants/units.js`, `extraUnits` para valores legacy). Evolución pendiente: consumir `GET /units`. |
| `features/sales/components/EditItemModal.tsx` | datalist → `UnitSelect`; prop `unitPrices`; **hint de advertencia** (`unit-no-price-hint`) cuando la unidad elegida difiere de la base y no tiene precio registrado. |
| `pages/SalesNew.tsx` | fetch de `productService.getProductUnitPrices(id)` al abrir el modal; `handleModalUnitChange` **recalcula precio** (y resetea descuento) si la unidad tiene precio en `unit_prices`; payload `unit` normalizado a minúsculas (CHECK SQL case-sensitive). |
| `features/purchases/components/PurchaseProductModal.tsx` | datalist → `UnitSelect` (mismo catálogo que productos/ventas). |
| `pages/BudgetCreate.tsx` | payload envía `unit: base_unit` real; `BudgetItem.base_unit`; stock con unidad en el picker. |
| `pages/PurchaseRequisitionCreate.tsx` | payload `details` incluye `unit` (el puerto Go ya la persistía); stock con unidad. |
| `features/transfers/components/CreateTransferModal.tsx` | cantidades decimales para pesables (`step/min 0.01`, clamp al **submit** — no por tecla, arruina tipear "0.5"); `TransferLine.base_unit`; stock con unidad en picker y tabla. |
| `services/productService.ts` | CRUD duplicado de conversiones ELIMINADO (sin consumers; la fuente es `unit-conversions/services/unitConversionsService`); nuevo `getProductUnitPrices(productId)` (GET /products/{id}/units). |
| `features/unit-conversions/services/unitConversionsService.ts` | `product_id` opcional en create/delete (`?product_id=`), `getByProduct`, tipos. |
| `features/unit-conversions/components/UnitConversionsPage.tsx` | **Alcance por producto**: selector de producto (SearchableDropdown + búsqueda plana) en el modal, columna "Alcance" (Global/Producto), delete con scope, hints de precedencia (específica gana a global). |
| i18n | módulo nuevo `es/unitConversions.js` + `en/unitConversions.js` (registrados en ambos índices); `products.search.stock_label` y `transfers.stockLabel` ahora interpolan `{unit}`. |

## Tests

- `features/sales/__tests__/EditItemModal.units.test.tsx` (nuevo): hint presente/ausente,
  sin hint para la base, y el Select notifica `onUnitChange('box')` (Radix clickeable
  gracias a los stubs de PointerEvent del setup).
- `BranchTransfers.test.tsx`: asserts de stock actualizados (`Stock: 12 unit`) + caso
  nuevo "decimales para kg" (step/min 0.01, tipear 0.5 queda 0.5, clamp en submit).
- Tests de página (Budget/Requisition, trabajo previo): asserts de stock con unidad.

## Deuda

1. `UnitSelect` usa el catálogo local `constants/units.js`; migrar a `GET /units`
   (backend ya lo expone) para fuente única + labels i18n.
2. `UnitConversionsPage` sigue legacy (sin i18n en textos viejos, clases slate/gray);
   los textos NUEVOS usan t() y tokens. Migración full = tarea propia.
3. Doble expresión de stock ("X cajas / Y kg") en pickers: requiere exponer
   conversión+stock por unidad en la búsqueda plana (backend).
