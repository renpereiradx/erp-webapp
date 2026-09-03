# AUDIT — Performance React del shell (vercel-react-best-practices)

Fecha: 2026-09-03
Alcance: `src/layouts/MainLayout.tsx`, `src/layouts/main/*`, `src/components/BranchSwitcher.tsx`
Referencia: skill del workspace `vercel-react-best-practices` (70 reglas, 8 categorías).
Contexto del proyecto: SPA Vite sin SSR → las reglas `server-*` no aplican; `async-*`
aplica solo al bootstrap (un solo fetch).

## Resultado: 2 correcciones aplicadas, 14 puntos verificados como conformes o aceptados.

## Correcciones aplicadas

| Regla | Archivo | Hallazgo | Fix |
|:------|:--------|:---------|:----|
| `rendering-conditional-render` | `main/Header.tsx` | `{isOpen && term && (...)}` — `term` es string; la regla exige condición booleana explícita | `{isOpen && term.length > 0 ? (...) : null}` |
| `js-cache-function-results` + `js-early-exit` | `main/search.ts` | `filterSearchResults` renormalizaba nombre y padre de ~150 items en cada tecla (~300 llamadas a `normalize()` + regex por keystroke) | Haystack precomputado por item en un `WeakMap` (se libera con el índice cuando cambia la navegación) + early-exit con término vacío |

## Verificados conformes

| Regla | Evidencia |
|:------|:----------|
| `rerender-no-inline-components` | `BrandMark` y todos los componentes son top-level; no hay componentes definidos dentro de otros |
| `rerender-functional-setstate` | `setExpandedMenus`, `setIsSidebarExpanded`, `setSelectedIndex`, `setShowUserMenu` usan updater funcional |
| `rerender-dependencies` | El listener de `resize` hace `setState` booleano (React hace bail-out si el valor no cambia → re-render solo al cruzar el breakpoint) |
| `client-swr-dedup` | Únicos fetch del shell: bootstrap `GET /settings` (one-shot) y `BranchSwitcher` vía react-query con `staleTime` de 5 min (dedup equivalente a SWR) |
| `js-flatmap-filter` | `filterNavigationItems` y `flattenNavigation` usan `flatMap` (una pasada) |
| `js-set-map-lookups` | Dedupe de rutas buscables con `Set` de hrefs |
| `bundle-barrel-imports` | Imports nombrados de `lucide-react` (tree-shakeable); sin barrels propios nuevos |
| `bundle-dynamic-imports` | Sidebar/Header son shell inicial → no corresponde lazy-load |
| `rerender-lazy-state-init` | Todos los `useState` tienen inicializadores triviales |
| `rerender-simple-expression-in-memo` | `navigation` (build + filtro recursivo) y `searchableItems` justifican el `useMemo` |

## Evaluados y aceptados (con motivo)

| Regla | Punto | Motivo para no aplicar |
|:------|:------|:----------------------|
| `rerender-memo` | `NavList` se re-renderiza en cada render de `MainLayout` | Esos renders son semánticamente necesarios (cambia `location`, `expandedMenus` o `isActive`, de los que depende el estado activo del menú). El estado del Header (búsqueda, user menu) vive dentro de `Header`, así que NO propaga re-renders al shell. `React.memo` no ayudaría: las props cambian identidad en los mismos renders. |
| `client-event-listeners` | `useGlobalSearch` registra `keydown` + `mousedown` globales | El hook se instancia una sola vez (solo `Header`): N=1, no hay duplicación. |
| `rerender-dependencies` (efecto keydown) | El efecto se re-registra cuando cambia `results` (array nuevo por tecla) | Re-registrar un listener cuesta µs; estabilizar con refs añadiría complejidad sin impacto medible. |
| `js-combine-iterations` | `buildSearchableItems` hace 3 pasadas (flatten, dedupe, filtro BI) | Corre una vez por cambio de navegación (memoizado), N≈150; combinar pasadas degradaría legibilidad. |
| `client-passive-event-listeners` | Sin listeners de scroll/touch/wheel en el shell | No aplica. |
| `bundle-barrel-imports` (`@/lib/i18n`) | `useI18n` se importa desde el módulo de compatibilidad que re-exporta | Patrón pre-existente de todo el codebase; migrarlo es otra tarea. |

## Seguimiento sugerido (fuera de alcance)

- Migrar imports de `@/lib/i18n` a rutas directas si algún día se parte el barrel.
- Si el índice de búsqueda creciera órdenes de magnitud (rutas dinámicas), mover el
  filtro a `useDeferredValue` (`rerender-use-deferred-value`).
