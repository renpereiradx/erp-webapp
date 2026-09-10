# FIX: filtros de /pedidos sin estilos + estados del historial de ventas + pedido "EN CAJA" obsoleto

**Fecha:** 2026-09-10 · **Alcance:** solo frontend · **Reporte:** usuario (screenshots /pedidos, /ventas, wizard de caja)

Tres bugs reportados juntos tras usar el flujo completo vendedor → caja. Diagnóstico y fix en la misma
sesión; cada fix va en su propio commit para poder revertir independiente.

---

## 1. Filtros de /pedidos sin estilos (`src/index.css`)

**Causa raíz:** `ui/SegmentedControl.jsx` depende de clases BEM (`.segmented-control`, `__option`,
`__option--active`, `__indicator`…) que vivían en SCSS y fueron eliminadas en la migración integral a
Tailwind (`29de862`, 2026-02-26) sin recrearlas en `index.css`. El componente renderizaba como texto
plano desde entonces, no solo en /pedidos: también `AttributesPage`, `RegisterCashMovement`,
`MovementModal` y `RegisterMovementModal`.

**Fix:** estilos restaurados en `index.css` con tokens semánticos (flip con `.dark`): pista
`--color-surface-muted`, indicador `--color-surface` + `--shadow-fluent-2` (posicionado inline por el
componente, que mide rects), focus ring `--color-primary`, hover `color-mix(foreground 8%)`,
variante `--small`, responsive `<480px`, `prefers-reduced-motion` y `prefers-contrast: more`
(con indicador oculto y activo sólido). El original usaba `prefers-contrast: high`, que nunca matcheó
(valor inválido — el correcto es `more`).

**Verificación:** render del CSS compilado en navegador (pista/indicador/small/dark OK).

## 2. Historial de ventas: mapeo de estados (`SalesHistoryView.tsx` + i18n)

**Diagnóstico contra la base (dev):** el "todo Cancelada" era dato real — 73 de 77 ventas 2026 en la
sucursal 1 son tests E2E cancelados; las 9 PAID de Fernando Maciel son de 2025 u otra sucursal. El
mapeo existente (COMPLETED/PAID/PENDING/CANCELLED) era correcto, pero **faltaba `PARTIAL_PAYMENT`**
(3 ventas en la base caían al texto crudo del enum). Estados reales de `transactions.sales_orders`
(`internal/sale/domain.go` + `pos_service.go`): `PENDING` → `PAID | PARTIAL_PAYMENT`, más `CANCELLED`
y `COMPLETED` legacy.

**Fix:** `PARTIAL_PAYMENT` → variante warning + label "Pago parcial"; keys i18n que faltaban agregadas
a `locales/es/sales.js` (`sales.status.paid` no existía — caía al fallback del componente — y
`sales.status.partial_payment`). `en` hereda `es` (spread en `locales/en/index.js`). Test nuevo:
`src/features/sales/__tests__/SalesHistoryView.status.test.tsx` (labels desktop+mobile via
`getAllByText`, estado desconocido muestra el valor crudo sin crash).

## 3. Pedido "EN CAJA" obsoleto al volver de /pedidos (`useCounterOrderCheckout.ts`)

**Causa raíz:** el hook de checkout llama claim/release/convert **por service directo** (sin hooks de
mutación), así que nadie invalidaba `['counter-orders']`. Con el `staleTime` global de 5 min
(`App.tsx`, QueryClient), al volver a /pedidos se servía cache fresco con el estado CLAIMED anterior —
la recarga limpia el cache y por eso ahí sí mostraba PROCESADO.

**Fix:** `invalidateCounterOrders()` (prefijo `['counter-orders']`, cubre bandeja, detalle y
client-active del wizard) tras: claim exitoso (`continueOrder`), release exitoso (`releaseClaimed`)
y convert exitoso — tanto el directo (`convertAfterCheckout`) como el reintento del toast accionable.
Deliberadamente **no** invalida cuando el convert falla: el pedido sigue CLAIMED en el servidor y el
cache de la bandeja sigue siendo correcto. `releaseClaimed` fallido tampoco (fail-open, sweep de 20 min).

**Tests:** harness de `useCounterOrderCheckout.test.tsx` envuelto en `QueryClientProvider` +
`vi.spyOn(queryClient, 'invalidateQueries')`; asserts de invalidación en los 4 caminos (claim OK/409,
release OK/fallido, convert OK/fallido+reintento).

---

## Gates

- `npx vitest --run` → **617/617** (88 archivos, +3 tests)
- `npx tsc --noEmit` → 0 errores
- `pnpm build` → OK (`.segmented-control` presente en el CSS del bundle, tokens emitidos)
- `pnpm lint:design` → "Código nuevo limpio"
- Verificación visual del segmented control con el CSS compilado (light/small/dark)

## Commits

1. `fix(ui)` — estilos `.segmented-control` restaurados (`src/index.css`)
2. `fix(sales)` — mapeo PARTIAL_PAYMENT + keys i18n + test (`SalesHistoryView.tsx`, `es/sales.js`, test nuevo)
3. `fix(counterorders)` — invalidación de `['counter-orders']` en el checkout hook + tests
4. `docs(conductor)` — este registro
