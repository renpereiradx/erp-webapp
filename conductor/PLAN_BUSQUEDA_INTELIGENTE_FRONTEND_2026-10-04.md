# PLAN_BUSQUEDA_INTELIGENTE_FRONTEND — Robustez, resaltado y convención de búsqueda

**Fecha:** 2026-10-04 · **Estado: EJECUTADO** (2026-10-05, con aprobación del owner; ver
"Resultado de ejecución" al final — 3 desviaciones documentadas)
**Scope:** Frontend React (`erp-webapp`). El BE tiene su propio plan
(`business_management/conductor/PLAN_BUSQUEDA_INTELIGENTE_BACKEND_2026-10-04.md`).
**Sin dependencia dura**: el contract de `searchAdvanced` no cambia en el BE (solo el
orden de resultados), así que este plan puede ejecutarse antes, después o en paralelo.

## Diagnóstico (auditoría 2026-10-04)

Seis superficies de búsqueda de productos, cada una con su propia receta:

| Superficie | Debounce | Mín. chars | Cancela HTTP en vuelo | Fuente |
|---|---|---|---|---|
| /productos (`useProductsLogic`) | 500ms | 3 | No (vía store) | store `searchProducts` → searchAdvanced ps=100 |
| /ventas (`src/pages/SalesNew.tsx:~585`) | 300ms | 3 | **No** | searchAdvanced variant ps=15 |
| /compras (`usePurchasesLogic.ts:553`) | 300ms | 2 | **No** | searchAdvanced variant ps=10 |
| /catalogo (`CatalogBoard`) | 350ms | 0 | react-query ✅ | searchAdvanced units |
| Modal stock-movements (`ProductSearchModal.tsx:54`) | 300ms | 2 | No (solo flag `cancelled`) | searchAdvanced variant ps=20 |
| Picker BI (`SearchableDropdown`) | 300ms | 3 | Solo UI (no pasa signal) | `fetchCatalogSellableUnits` |

Problemas concretos:

1. **Race conditions** en /ventas, /compras y stock-movements: no abortan el HTTP ni
   descartan respuestas viejas. Con WiFi lento de cliente, la respuesta de "cem" puede
   llegar después de la de "cemento" y **pisar los resultados correctos**.
2. **Código muerto**: `src/hooks/useProductSearch.ts` (el ÚNICO con AbortController
   bien hecho) y `src/components/ui/ProductSearchInput.tsx` tienen **cero consumidores**
   (verificado por import). La solución al problema 1 ya estaba escrita y abandonada.
3. **Ningún buscador resalta el término matcheado** en los resultados (el "highlight"
   del comentario de `PurchaseProductSearchInput` es el de teclado, no el de texto).
4. **Parámetros inconsistentes** sin convención documentada (2 vs 3 chars; 300/350/500ms;
   ps 10/15/20/100).
5. `SearchableDropdown.onSearch(term)` no recibe `AbortSignal` → los consumidores no
   pueden abortar el request aunque quieran.

## Fases

### G1 — Hook canónico `useProductSearch` (reescribir el muerto)

- Reescribir `src/hooks/useProductSearch.ts` con el patrón que ya tenía (AbortController)
  + lo que falta, sobre `productService.searchAdvanced`:

  ```ts
  useProductSearch({
    debounceMs = 300,
    minSearchLength = 2,
    pageSize = 20,
    granularity = 'variant',
  }) => { results, isSearching, search(term), clear() }
  ```

  - AbortController por término (abort del anterior en cada disparo).
  - Guard de respuesta vieja (contador de secuencia) además del abort — cinturón y
    tirantes: el abort evita el request, el guard descarta la respuesta si igual llegó.
  - `debounceMs` declarado en la interfaz del hook viejo pero NUNCA usado → esta vez
    implementarlo de verdad.
- **Adoptar** en las 3 superficies manuales: efecto de `SalesNew.tsx` (~585),
  `usePurchasesLogic.ts:543` (modal de producto) y `ProductSearchModal.tsx`
  (stock-movements). El efecto de suppliers (`usePurchasesLogic.ts:457`) queda como
  está (otro dominio); solo si el refactor es trivial, mismo patrón abort.
- `/catalogo` NO se toca: react-query ya da cache + dedupe + placeholderData.
- **DELETE** `src/components/ui/ProductSearchInput.tsx` (cero imports, y su test si
  existiera — regla 6 de PLAN_TEST_DESIGN: componente retirado → DELETE del test,
  documentado aquí).
- `SearchableDropdown`: firma opt-in `onSearch(term: string, signal?: AbortSignal)` —
  los consumidores que quieran abortan HTTP; los actuales siguen compilando sin cambios.

### G2 — Componente `HighlightText`

- `src/components/ui/HighlightText.tsx`: recibe `text` + `term`, parte por índices de
  match (case-insensitive, sin regex sobre input del usuario) y envuelve los fragmentos
  en `<mark>` con estilo Fluent (fondo semántico suave, no amarillo crudo).
  **Sin `dangerouslySetInnerHTML`**.
- Adoptar en los dropdowns de resultados: /ventas (render de `SalesNew`),
  /compras (`PurchaseProductSearchInput` / `PurchaseProductModal`), modal
  stock-movements, y el `renderItem` del picker BI donde pinte nombre/SKU.
- Resaltar tanto en el nombre como en el SKU cuando el término matchea el SKU
  (el usuario debe VER por qué el resultado apareció).

### G3 — Convención única + DESIGN.md §13

- Nueva sección **§13 "Búsqueda de productos"** en `DESIGN.md`: mín 2 caracteres,
  debounce 300ms, page_size 20 en dropdowns, abort obligatorio del request anterior,
  `HighlightText` en resultados, SKU siempre visible.
- Unificar parámetros driftados:
  - /productos y /ventas: bajar de 3 → 2 chars mínimos (coincide con compras).
  - /productos: debounce 500 → 300ms.
  - /catalogo: debounce 350 → 300ms (usa `useDebouncedValue`, cambio de constante).
  - **Decisión a marcar durante la ejecución**: el store de /productos usa ps=100
    porque su grilla pagina client-side los resultados; alinearlo a la convención
    (server-side pagination) queda como ajuste menor dentro de G3 o deuda documentada
    si toca demasiadas pantallas.
- Strings nuevos vía `src/lib/i18n.js` (es + en; si un assert de test los necesita,
  la key debe existir en ambos locales — regla 3 de PLAN_TEST_DESIGN).

### G4 — Tests y gates

- `useProductSearch.test.tsx` colocado junto al hook (regla 1: módulos compartidos se
  testean junto al archivo). Mock del service en la frontera (`@/services/api` o el
  módulo `productService`), NO internals. Casos: debounce efectivo (fake timers +
  `advanceTimersByTimeAsync`, ver lección de RTL en memoria), abort al re-tipear,
  guard de respuesta vieja, min length.
- `HighlightText.test.tsx` junto al componente: partición, case-insensitive, término
  con caracteres especiales del regex (tratado literal), texto sin match queda íntegro.
- **Gates de salida**: `npx vitest --run` 0 fallos · `npx tsc --noEmit` 0 errores ·
  `pnpm build` verde · `pnpm lint:design` verde (recordar: `vite build` NO typechequea).
- Auditoría `vercel-react-best-practices` aplicada al hook y componentes nuevos
  (`rerender-*`, hooks con deps estables); reporte en `conductor/` SOLO si el owner
  lo pide (regla de AGENTS.md).

## Verificación funcional (smoke navegador)

- En /ventas, /compras y stock-movements: tipear rápido un término largo sobre WiFi
  throttled (DevTools) y verificar que los resultados finales corresponden al término
  completo (no al prefijo) — el bug de race condition cazado en vivo.
- Resaltado visible del término en las 4 superficies de G2.
- /catalogo sigue idéntico (regresión cero).

## Riesgos y notas

- El cambio de orden por relevancia que viene del plan BE hará que los resultados
  "se muevan" respecto de hoy: esperado y deseado; smoke visual conjunto al cerrar ambos.
- Bajar a 2 chars mínimos aumenta levemente el volumen de búsquedas disparadas: el
  abort + debounce del hook canónico es justamente la contraparte; en combinación con
  los índices trigram del BE el costo por query baja más de lo que sube la frecuencia.
- `SearchableDropdown` es consumido por el picker BI con navegación por teclado:
  la firma opt-in NO puede romper su contrato actual (parámetro opcional).

## No-goals

- No migrar todo a react-query (solo /catalogo ya lo usa; el hook canónico alcanza).
- No redisear visualmente los dropdowns (solo el highlight + SKU visible).
- No tocar búsqueda de clientes/proveedores más allá del patrón abort si es trivial.
- No cambios de i18n masivos: solo keys nuevas puntuales.

## Versionado

Al cerrar y verificar el hito (conjunto con el plan BE): tag **MINOR** `v1.1.0` en
AMBOS repos + `"version"` de `package.json` sincronizada, según AGENTS.md.

---

## Resultado de ejecución (2026-10-05)

Implementado G1–G4 completo. Gates: `tsc` 0 errores · `vitest` **1446/1446** (1433 del
baseline + 13 nuevos: 6 del hook, 7 de HighlightText) · `pnpm build` verde ·
`pnpm lint:design` verde. Smoke de navegador (dev-JWT real, backend :5050 + Vite):

- **/ventas**: "PAPA" → 2 filas (PAPA BR, PAPA KG PY) con nombre, SKU, precio, stock y
  `<mark>PAPA</mark>` en ambas.
- **/compras** (buscador del carrito): "PAPA" → 2 filas con SKU/stock y highlight.
- **/productos**: búsqueda con **2 caracteres** ("PA") dispara resultados en vivo
  (antes 3).
- **/catalogo**: carga idéntico (regresión cero).

### Desviaciones del plan (decididas durante la ejecución)

1. **`ProductSearchInput.tsx` NO se borró** — la verificación previa al DELETE encontró
   **1 consumidor** (`PriceTransactions.jsx:20`, página legacy de ajustes de precios) que
   el diagnóstico del 10-04 dio por inexistente. En lugar de borrarlo se reescribió sobre
   el contrato nuevo: recibe el `signal` del dropmenu, mínimo 2 caracteres y highlight en
   su `renderItem`. Su consumidor no se tocó.
2. **El opt-in de `SearchableDropdown` es `onSearch(term, ctx?: { signal })`, no
   `(term, signal)`** — la forma objeto evita el conflicto de contravarianza con los
   services que exponen `(term, options)` (p. ej. `searchSellableUnitsFlat`, cuyo 2º
   parámetro era `pageSize`: pasarle el signal crudo habría roto el runtime, lo cazó
   `tsc`). `EntitySearchSelect` y los wrappers de drill-down reenvían el ctx.
3. **A11y del highlight**: `dom-accessibility-api` (el motor de nombres accesibles que
   usan los tests) inserta separadores entre elementos hermanos — un `<mark>` a mitad de
   palabra o dentro de un SKU corrompía el nombre accesible de la fila ("Fer nando
   Maciel"). Los botones de fila de `SearchableDropdown` llevan ahora `aria-label`
   construido desde los DATOS (`name (SKU: sku)`), inmune al split visual.

### Notas de implementación

- El guard de respuesta vieja del hook es `seq` + `signal.aborted` (cinturón y
  tirantes como pedía el plan); el spinner (`isSearching`) se prende al llamar
  `search()` (incluye la ventana de debounce).
- Compras tenía **500ms** reales de debounce (el diagnóstico decía 300): unificado a
  300 vía default del hook. El spinner de "cargando detalle del producto seleccionado"
  quedó como estado propio (`fetchingSelectedProduct`) desacoplado del spinner de
  búsqueda.
- `/compras` usa `pageSize: 10` y /ventas `15` (excepción declarada en DESIGN §13.1,
  densidad de sus dropdowns); el resto usa el default 20.
- **Deuda declarada** (§13.3 de DESIGN.md): /productos sigue con `page_size=100` +
  paginación client-side (grilla, no dropdown) — pasarla a server-side queda como
  ajuste posterior.
- Tests ajustados al contrato nuevo (6 aserciones en 5 archivos): los mocks del service
  ahora reciben `(payload, { signal })`, y dos tests que matcheaban texto partido por el
  `<mark>` usan un matcher de textContent hoja.

### Versionado

El tag MINOR `v1.1.0` queda **pendiente** hasta cerrar el plan BE asociado
(`PLAN_BUSQUEDA_INTELIGENTE_BACKEND_2026-10-04.md`, orden por relevancia), tal como
define este plan ("conjunto con el plan BE").
