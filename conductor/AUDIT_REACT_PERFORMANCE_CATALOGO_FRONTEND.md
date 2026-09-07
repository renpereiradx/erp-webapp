# AUDIT: Performance React — Feature Catálogo (PLAN_CATALOGO_VENDEDOR FASE 2)

**Fecha:** 2026-09-07
**Alcance:** `src/features/catalog/` (nuevo) + toques en `src/features/products/` (ProductsTable, ProductDetailsModal, ProductsHeader), `src/App.tsx`, `src/layouts/main/navigation.ts`.
**Método:** revisión manual contra las reglas de la skill `vercel-react-best-practices` (familias `rerender-*`, `rendering-*`, `bundle-*`, `client-*`, `js-*`). SPA Vite sin SSR: reglas `server-*` no aplican.

## Resultado: ✅ SIN HALLAZGOS BLOQUEANTES (2 notas menores)

## Verificación por familia

| Familia | Regla aplicada | Resultado |
|:--|:--|:--|
| `rerender-dependencies` | `useDebouncedValue` depende solo de primitivos `[value, delayMs]`; queryKey con primitivos (`search`, `page`) + objeto `filters` que es **estado** (identidad estable entre renders; react-query además hashea la key estructuralmente) | ✅ |
| `rerender-functional-setstate` | Paginación con `setPage(prev => …)`, sin lecturas de estado para actualizar | ✅ |
| `rerender-derived-state` | `categoryOptions`/`brandOptions` derivados vía `useMemo` sobre `query.data` (identidad estable de react-query); sin estado duplicado | ✅ |
| `rerender-lazy-state-init` | Único `useState` booleano (`expanded`), inicialización perezosa innecesaria | n/a |
| `rendering-conditional-render` | Estados de datos exclusivos (`isLoading` / `isError` / vacío / datos); sin fugas de `0`/`''` en `&&` (los conteos van dentro de plantillas con texto) | ✅ |
| `rendering-hoist-jsx` / `js-hoist-regexp` | `SORT_OPTIONS` hoisteado a nivel de módulo; sin regex en render | ✅ |
| `client-swr-dedup` (react-query) | Variantes cargadas solo al expandir (`enabled: productId !== null`) + dedup por queryKey; `placeholderData: previous` evita flicker entre búsquedas | ✅ |
| `bundle-barrel-imports` | `App.tsx` importa `{ CatalogBoard }` desde el barrel de la feature; barrel estáticamente analizable, Rollup lo tree-shakea | ✅ |
| `bundle-dynamic-imports` | Sin dependencias nuevas de terceros; lucide importado por icono | ✅ |
| `client-event-listeners` / `client-passive-*` | Sin listeners manuales (solo onChange/onSubmit sintéticos) | n/a |
| `js-*` | `toCatalogProduct` y mapeos módulo-nivel, puros; `Array.from({length: 12})` fijo para skeleton | ✅ |

## Notas menores (P3, no requieren acción)

1. **`ProductsTable` calcula `purchaseCost` por fila aunque la columna esté oculta** (`canViewCosts === false`). El cálculo es O(1) por fila (un `find` sobre `unit_costs_summary`); moverlo dentro del gate sería un micro-ganancia imperceptible y el archivo es legacy compartido — se documenta y se deja.
2. **`queryKey: ['catalog', search, filters, page]` incluye un objeto.** Es correcto porque react-query hashea las keys estructuralmente (no por identidad) y `filters` además es estado de React. Se documenta para que un futuro refactor no "optimice" eso a campos sueltos por error.

## Cumplimiento DESIGN.md

- Estados de datos obligatorios §6.7: skeleton con forma de grilla (`aria-busy`), `ErrorState` con `onRetry`, `EmptyState`.
- `PageHeader` para el encabezado; botones via `<Button>`; Select/Checkbox de `src/components/ui/`.
- i18n: `t(key, fallbackEs)` en todo el feature; keys en `locales/es/catalog.js`.

## Gates

`npx vitest --run` 578/578 · `npx tsc --noEmit` 0 errores · `pnpm build` OK · `pnpm lint:design` OK ("Código nuevo limpio").
