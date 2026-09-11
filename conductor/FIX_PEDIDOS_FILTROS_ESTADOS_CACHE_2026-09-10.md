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

---

# Adenda (misma sesión, tarde): stock-summary undefined + cliente incompleto en Nuevo pedido

## 4. Catálogo: "Query data cannot be undefined" por cada card (`variantService.ts`)

**Causa raíz:** `getStockSummary` devolvía `response.data`, pero `apiClient.get` ya desempaqueta el
body JSON y el handler de Go escribe el resumen **directo** (`writeJSON(w, summary)` en
`internal/catalog/http_variant.go`, sin wrapper `{data: ...}`) → el queryFn resolvía `undefined` y
react-query rechazaba `["catalog","stock-summary",productId,branchId]` por cada tarjeta con
variantes al abrir /catálogo o el builder de /pedidos. Las tarjetas caían al total proyectado por el
fallback (por eso la UI no se notaba rota), pero el desglose base/variantes nunca llegó.

**Fix:** `getStockSummary` retorna el body directo. `getTotalStock`/`getVariantStock` tienen el mismo
patrón latente pero **no tienen consumidores** — se dejan como están. Test de contrato nuevo:
`src/services/__tests__/variantService.service.test.ts` (mock en la frontera `../api`).

## 5. Nuevo pedido: el dropdown de cliente mostraba solo el primer nombre (`OrderBuilder.tsx`)

**Causa raíz:** `normalizeClient` (useClientStore) expone `name` (solo `first_name`) y `displayName`
(nombre + apellido). El builder mapeaba `name: String(c.name)` → "Fernando" en vez de
"Fernando Maciel". El wizard de /ventas (`ClientStep`) ya usaba `displayName || item.name`.

**Fix:** `handleClientSearch` usa `displayName || name`; el cliente seleccionado al carrito también
lleva el nombre completo. Test en `CounterOrdersPage.test.tsx` (mock de `@/services/clientService`
exportando todos los símbolos que el store consume; assertion por rol/nombre accesible del botón).

## Gates (adenda)

`npx vitest --run` → **620/620** (89 archivos, +3 tests) · tsc 0 · build OK · lint:design limpio.

---

# Adenda 2 (2026-09-11): toast "Acceso denegado" en detalle de venta del vendor

**Reporte:** con rol vendor, `/cobros-ventas/:saleId` renderiza completo pero aparece el toast
"Acceso denegado: No cuentas con los permisos necesarios." (screenshot: ~8 GETs 403 bajo `/sale/...`
+ 401s auxiliares en `/tax-rates` y `/api/v1`).

**Causa raíz:** el aviso global `api:forbidden` (App.tsx → toast.error) se disparaba con **cualquier**
403 desde `BusinessManagementAPI.makeRequest`, incluidos GETs auxiliares que el rol no puede traer.
La página ya resuelve esas fallas con catch propio + fallbacks (payment-status, cliente) y el
contenido principal carga — el toast demonizaba un resultado correcto.

**Verificación API (dev):** con JWT de vendor (VNDR01: sales:read, clients:read, payments:read,
tax:read… sin cash:*/sifen:read) los endpoints principales `/sale/{id}` y `/sale/{id}/payment-status`
responden 200 con la sucursal de la venta; los 403 de la consola son llamadas auxiliares. Hallazgo
lateral: `/auth/refresh` re-emite el token con `active_branch` reseteada a la default (1) — se
documenta como deuda de auth, no se toca acá.

**Fix (`BusinessManagementAPI.ts`):** `api:forbidden` solo se dispara para **escrituras** denegadas
(POST/PUT/DELETE/PATCH) — ahí el toast ES el feedback de la acción. En GET/HEAD el error viaja al
llamador (status 403 en el ApiError), que ya pinta su estado. Test de política:
`src/services/__tests__/BusinessManagementAPI.forbidden.test.ts` (GET 403 sin evento; POST 403 con evento).

**Nota dev-DB:** `vnd_88a096d5-efc6-44bd-8067-d9` quedó con password `e2etest123` (hash copiado de
`e2ecaja01`) + acceso branch 3 LIMITED, para reproducir flujos de vendor multi-sucursal.

## Gates (adenda 2)

`npx vitest --run` → **622/622** (90 archivos, +2 tests) · tsc 0 · build OK · lint:design limpio.

---

# Adenda 3 (2026-09-11): historial de ventas mostraba ventas de OTRA sucursal → 404 al abrir

**Reporte (vendor Hernan, active_branch JWT = 1):** el historial mostraba 86 ventas (branch 1) aun
con `X-Branch-ID: 3` en el resto de los requests; al abrir `GET /sale/SALE-1789070908-585` con ese
header → 404 "Venta no encontrada". Además "veo las mismas ventas al seleccionar JUST STYLE y
PRINCIPAL".

**Causa raíz (FE, no backend):** el store Zustand `useSaleStore` cachea `sales` y sobrevive a
logout/login y cambios de sucursal (SPA sin reload). El auto-load del historial solo fetchwhen
`sales.length === 0` — un set cacheado de otra sucursal se mostraba tal cual, y al abrir una de
esas ventas el detalle pedía con el `X-Branch-ID` vigente → 404. Verificado que el backend SÍ
filtra: `/sale/date_range` con branch 1 → 66 (todas branch 1), con branch 3 → 5 (todas branch 3).

**Fix:**
- `useSaleStore`: nuevo campo `salesBranchId` — ancla `localStorage.activeBranch` (misma fuente del
  header que arma apiClient) al set de `sales` en los 3 fetchers; `clearSales` lo resetea.
- `SalesNew`: el auto-load del historial ahora dispara cuando el set está vacío **o**
  `salesBranchId !== currentBranchId` (guard anti-loop: un intento por branch vía ref — un fetch
  fallido no reintenta en cadena).

**Quedó pendiente (observado, no tocado):** `/auth/refresh` resetea `active_branch` del nuevo token
a la default (ver adenda 2) — con localStorage stale puede divergir del resto de los requests.

**Nota sobre "muchos cancelados":** los ~84 registros "Cancelada" de Fernando Maciel (Gs. 3.630,
10/9) son residuos de pruebas del 10/09 (fixes C4/anulaciones) en la dev DB — el backend los lista
correctamente; en producción un historial muestra las anuladas con su estado real.

## Gates (adenda 3)

`npx vitest --run` → **622/622** · tsc 0 · build OK · lint:design limpio.
