# Alineación UI /pedidos + fix deps Vite /catalogo — 2026-09-30

## Alcance

Dos frentes en el mismo diff:

1. **/pedidos (CounterOrdersPage) alineada a DESIGN.md** — receta canónica
   "card con tabla" (§6.3, la misma de /ventas y /compras) + atajo F2 (§12.4).
2. **/catalogo — NS_ERROR_CORRUPTED_CONTENT en `@radix-ui/react-checkbox`**:
   el dep no estaba en `optimizeDeps.include`; se descubría "lazy" al navegar
   una ruta que lo usa y la re-optimización en caliente servía el archivo
   vacío/corrupto (MIME "").

## Cambios

### UI /pedidos

- `OrdersBoard`: de lista de cards `<ul>` a **card con tabla** §6.3 — banda de
  toolbar muted (`px-lg py-md bg-surface-muted border-b border-divider`) que
  recibe filtros/búsqueda por prop `toolbar`, tabla full-bleed con thead
  muted (`text-label-caps uppercase`), números a la derecha en
  `text-data-mono font-data-mono`, hover de fila `duration-150` y **empty
  state DENTRO de la tabla** (fila `colSpan` con ícono en círculo muted +
  acción "Nuevo pedido", §6.7). Loading (skeleton) y error viven dentro de la
  card, así la banda nunca desaparece.
- `CounterOrdersPage`: "Nuevo pedido" pasa a `PageHeader actions` (§6.8,
  único primary de la vista); contenedor alineado a /compras
  (`max-w-container-max`); checkbox nativo → `ui/Checkbox` (design system);
  buscador con `ref` + `useSearchFocusShortcut` (F2, gating por la disyunción
  de builder/detalle/ticket/cancelación, §12.2); placeholder anuncia "(F2)"
  en una sola key i18n (§12.6).
- `CounterOrdersMetricsPanel`: labels sin `truncate` (2 líneas,
  `line-clamp-2`) — ya no se cortan "Tasa de conversión" / "Tiempo medio a
  caja"; valores en `font-data-mono` alineados a la misma línea (`mt-auto`);
  **minutos→horas** (≥120 min → "23,7 h") y formato es-PY vía nuevo dominio
  puro `src/domain/counterorders/metrics.ts` (decimal coma, miles punto);
  loading con skeleton de 6 cards (antes texto pulsante) y error con
  `ErrorState` + retry (§6.7).
- i18n: claves nuevas de columnas de tabla, F2 en placeholder, `metrics.hours`,
  error de métricas (es; en cae al fallback por diseño del spread).

### Fix /catalogo (Vite)

- `vite.config.js`: TODOS los `@radix-ui/react-*` importados en src/ van en
  `optimizeDeps.include` (pre-bundle al arrancar; mantener en sync con los
  imports). Cache limpiada (`rm -rf node_modules/.vite`) + restart del dev
  server. Verificado en browser: el dep sirve `200 text/javascript` con el
  hash nuevo y /catalogo renderiza sin `NS_ERROR_CORRUPTED_CONTENT`.

## Gates

- `npx vitest --run`: 1294/1294 (incluye tests nuevos: formato es-PY/horas,
  skeleton de métricas, error con retry, empty dentro de la card, gating F2).
- `npx tsc --noEmit`: 0 errores.
- `pnpm build` OK · `pnpm lint:design`: código nuevo limpio.
- Smoke visual: /pedidos (empty + poblado con filtro "Todos", F2 enfoca el
  buscador) y /catalogo (render completo) en browser.

## Notas

- El `error: unknown` de `OrdersBoard` no puede ir en un `&&` de JSX
  (TS2322) → ternario.
- Gotcha de tests: `ErrorState` consulta su key sin fallback
  (`t('products.retry')`), con el mock de i18n el botón se busca por
  `data-testid="error-retry"`, no por nombre.
