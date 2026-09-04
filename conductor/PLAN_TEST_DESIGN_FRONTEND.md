# PLAN — Diseño de Tests Frontend + Cierre del baseline de QA

Repo: `erp-webapp` · Rama: `fix/tests-tsc-baseline` (worktree `worktrees/erp-webapp/tests-tsc-baseline`)
Fecha: 2026-09-04 · Origen: feedback del dev de caja (verificado: tsc área caja 0, lint:design limpio, build verde, suite 40 fallos pre-existentes).

## Objetivo

1. Cerrar el baseline de QA heredado: `npx tsc --noEmit` 0 errores y `npx vitest --run` 0 fallos.
2. Proponer un **diseño de tests** único y binario para que todos los módulos lo implementen, institucionalizado en `AGENTS.md` (workspace) y este plan.

## Estado inicial (baseline verificado en este worktree)

- `npx tsc --noEmit`: **9 errores**, todos en `src/components/sales/RegisterSalePaymentModal.tsx`.
- `npx vitest --run`: **40 fallos en 15 archivos** (454 pasan de 495) + 1 unhandled error de worker (OOM pre-existente).
- `pnpm build` y `pnpm lint:design`: verdes.

### Diagnóstico de los 40 fallos

| Grupo | Archivos | Causa raíz |
| :--- | :--- | :--- |
| Componentes eliminados | `ProductGrid.a11y`, `ProductGrid.keyboard`, `inlineEdit` (features/products) | Importan `ProductGrid`/`ProductCard`, que ya no existen (migración Feature-Sliced → `ProductsTable`). Tests de UI retirada del producto. |
| Contrato del tema | `theme.system.test.jsx` (15 fallos) | Testea el sistema multi-tema (neo-brutalism/material, `THEME_CONFIG.type`, `useThemeHelpers`) eliminado. Hoy: solo `light`/`dark` (`src/config/themes.js`), storage `erp-theme-mode`. |
| Mocks obsoletos | `Products.dataState/delete/telemetry` (6) | Mockean `@/components/ProductDetailsModal`; la página hoy importa el barrel `@/features/products`. El modal real monta y llama `useAuth()` sin provider → crash. |
| Frontera de mock incorrecta | `saleService.dateRange` (5) | Mockea `BusinessManagementAPI` con solo `makeRequest`; hoy `saleService` usa `apiClient.getSalesByDateRange` de `@/services/api`. Además el servicio ya no clampea `page_size` (lo hace el backend). |
| Contrato de servicio | `priceAdjustment.store` (1) | El mock del servicio resuelve el objeto crudo; el store espera `{success, data}` (contrato actual del servicio). |
| Mock incompleto | `priceAdjustment.page` (4) | Mock de `lucide-react` con lista fija de exports sin `Filter` (la página lo usa). |
| Queries frágiles | `MetricsPanel` (1), `GenericSkeletonList` (1) | Regex `getByText` que no tolera label/valor en nodos separados; regex de testid sin anclar que matchea el contenedor. |
| Assert de UI retirada | `Clients.page.test.jsx` (1) | Busca heading `Clientes` que ya no existe (rediseño workspace maestro-detalle). |
| Assert antipatrón | `ErrorState.test.jsx` (1) | `getByText(...) || getByByText(...)` (getByText lanza, `||` es muerto) + keys i18n `errors.code_label`/`errors.hint.label` inexistentes en locales (bug real de UI). |
| Store cambió | `client.store.test.js` (5) | `fetchClients` normaliza clientes (displayName/contact/status), errores se propagan con `throw`, CRUD ya no refresca localmente. |
| Placeholder siempre-verde | `Clients.page.test.js` | Archivo "deprecated" con assert `true === true`: prohibido, se elimina. |

## Diseño de tests (propuesto → institucionalizado)

### 1. Ubicación canónica por tipo de sujeto

| Sujeto | Ubicación | Nombre |
| :--- | :--- | :--- |
| Lógica pura (`src/domain/**`) | colocada junto al módulo | `modulo.test.ts` |
| Feature (`src/features/<f>/**`) | `src/features/<f>/__tests__/` (o `components/__tests__/`) | `<Sujeto>.<tipo>.test.(ts\|tsx\|js\|jsx)` |
| Páginas (`src/pages/*`) | `src/pages/__tests__/` | `<Page>.page.test.*` |
| Stores (`src/store/*`) | `src/store/__tests__/` | `<store>.store.test.*` |
| Servicios (`src/services/*`) | `src/services/__tests__/` | `<service>.service.test.*` |
| Componentes compartidos (`src/components/**`) | colocados junto al componente | `Component.test.*` |
| Contexts globales (`src/contexts/*`) | `src/contexts/__tests__/` | `<Context>.test.*` |

Extensión: `.ts/.tsx` por defecto (regla AGENTS.md); se permite `.js/.jsx` solo mientras el módulo bajo test siga en JS.

### 2. Fronteras de mock (la parte que falla hoy)

- **Mockear en la frontera del módulo que consume el sujeto**, nunca internals:
  - Barrel de feature: `vi.mock('@/features/products', async (importOriginal) => ({ ...(await importOriginal()), ProductDetailsModal: () => null }))` para stubs puntuales.
  - Servicios: mockear `@/services/api` (`apiClient`) para tests de servicios; mockear el service module para tests de stores.
  - Stores Zustand: mock selector-compatible `(sel) => sel(state)`.
- **i18n**: en tests de página/componente, `vi.mock('@/lib/i18n')` con `t: (key, fallback, vars) => fallback || key` (fallbacks en español). Si un assert necesita texto real, la key DEBE existir en `locales/es` y `locales/en`; si falta, es un bug de i18n y se agrega en el mismo diff.
- **`lucide-react`: NO mockearlo** (jsdom renderiza SVG). Si algún día hace falta, solo parcial con `importOriginal` — prohibida la lista fija de exports.
- **Auth**: componentes que llaman `useAuth` se renderizan vía `renderWithProviders` (`src/utils/testUtils.tsx`: ThemeProvider + MemoryRouter + `AuthContext.Provider` stub) o mock de `@/contexts/AuthContext`.
- **Router**: `MemoryRouter` por defecto en tests de página.
- **Temporales**: `vi.useFakeTimers` para TTL/debounce; nada de sleeps.

### 3. Asserts contra el contrato actual

- Queries por **rol / aria-label / data-testid**; nunca por clases cosméticas (BEM) ni contadores de render.
- Regex de testid **ancladas**: `/^generic-skeleton-\d+$/`.
- Nunca `getByText(a) || getByText(b)` (getByText lanza): usar `queryBy` para negativos.
- Un test por comportamiento; si el componente bajo test **ya no existe o su comportamiento se retiró → DELETE** (documentado aquí), nunca "skip" ni placeholder siempre-verde.

### 4. Wrapper canónico

`renderWithTheme` (`src/utils/themeTestUtils.jsx`) es el wrapper estándar de render (ThemeProvider). Componentes que llaman `useAuth` se renderizan con `<AuthContext.Provider>` (exportado por `@/contexts/AuthContext`) con un stub completo, o mockeando el módulo cuando el test ya mockea el router. No se crean wrappers alternativos en paralelo.

## Cambios planificados

| # | Archivo | Acción |
| :-- | :--- | :--- |
| 1 | `src/components/sales/RegisterSalePaymentModal.tsx` | Tipar `cashRegisters` (interfaz `OpenCashRegister`), anotar `def`, `Number(activeRegisterId)` → tsc 0. |
| 2 | `src/lib/i18n/locales/{es,en}/common.js` | Agregar `errors.code_label`, `errors.hint.label` (bug real de UI detectado por el test). |
| 3 | `src/contexts/__tests__/ThemeContext.test.jsx` | NUEVO: reescribe `theme.system.test.jsx` contra el contrato actual (light/dark, storage, DOM, hooks). |
| 5 | `src/features/products/components/__tests__/ProductsTable.test.tsx` | NUEVO: reemplaza a11y/keyboard/inlineEdit de ProductGrid/ProductCard (contrato tabla actual). |
| 6 | `src/services/__tests__/saleService.dateRange.test.js` | Reescrito (mock en `@/services/api`, contrato real; sin clamp de `page_size`, es del backend). |
| 7 | `src/pages/__tests__/PriceAdjustmentHistory.page.test.jsx` | Reescrito desde `src/__tests__/priceAdjustment.page.test.jsx` (sin mock de lucide, i18n local mapea `filters.apply/clear`). |
| 8 | `src/store/__tests__/usePriceAdjustmentStore.store.test.js` | Movido desde `src/__tests__/` y mock con `{success, data}`. |
| 9 | `src/pages/__tests__/Products.{dataState,telemetry,delete}.test.jsx` | Barrel mock con `importOriginal`; fuera mocks de `@/components/*Modal`. |
| 10 | `src/pages/__tests__/Clients.page.test.jsx` | Asserts al contrato actual (búsqueda, headers de tabla, fila: displayName/documento/contacto). |
| 11 | `src/pages/__tests__/client.store.test.js` → `src/store/__tests__/useClientStore.store.test.js` | Contrato actual: normalización, throw en error, CRUD sin refetch. |
| 12 | `src/components/MetricsPanel.test.jsx`, `src/components/ui/GenericSkeletonList.test.jsx`, `src/components/ui/ErrorState.test.jsx` | Queries robustas; ErrorState con keys reales. |
| 13 | `src/features/products/__tests__/ProductGrid.*`, `inlineEdit.test.jsx`, `src/pages/__tests__/Clients.page.test.js`, `src/__tests__/theme.system.test.jsx`, `src/__tests__/priceAdjustment.*` | DELETE / movido (reemplazados por 4, 5, 6, 7, 8). |

Fuera de alcance: migrar el resto de tests legacy a ubicaciones canónicas (se hará al tocar cada archivo, patrón Strangler), tests E2E (`tests/e2e`), el unhandled error de worker/OOM (infra ya tuneada en `vite.config.js`).

## Verificación (gate de salida)

- `npx tsc --noEmit` → 0 errores.
- `npx vitest --run` → 0 fallos, 0 suites fallidas, sin tests nuevos rojos.
- `pnpm build` → verde. `pnpm lint:design` → verde (código nuevo).
- Commits convencionales en la rama `fix/tests-tsc-baseline`.

## Resultado

**Gate de salida: en verde.**

- `npx tsc --noEmit`: **0 errores** (9 → 0; `RegisterSalePaymentModal` + `partitionOpenRegisters` genérica).
- `npx vitest --run`: **480/480 tests, 66/66 archivos, 0 fallos y 0 errores de worker** (baseline: 40 fallos en 15 archivos + 1 worker muerto).
- `pnpm build`: verde. `pnpm lint:design`: "✓ Código nuevo limpio".

### Hallazgo adicional durante el cierre

`Suppliers.toasts.test.jsx` (el "1 error" de worker que arrastraba el baseline, antes enmascarado como OOM "flaky") NO era un problema de heap: su mock del store fabricaba un estado nuevo con `vi.fn()` nuevos **en cada llamada**, cambiando la identidad de las funciones del store en cada render → efectos en bucle → heap agotado (48 s y 8 GB antes de morir; en verde: 1,2 s). Regla derivada, incorporada al diseño (§2): **el mock de un store Zustand debe devolver una única instancia de estado estable entre renders** (`vi.hoisted` + estado compartido), imitando la estabilidad de referencias del store real.

### Auditoría `vercel-react-best-practices`

Los cambios en código de producción React se limitan a tipado (`RegisterSalePaymentModal`, `registerSelection`): sin nueva superficie de renders, bundle ni data fetching. En tests aplica `bundle-barrel-imports` solo como ruido de test (no llega a producción). Sin hallazgos que corregir.

### Commits

1. `fix(sales): type cash register options in RegisterSalePaymentModal` — modal tipado + `partitionOpenRegisters<T>` genérica.
2. `fix(i18n): add missing errors.code_label and errors.hint.label keys` — bug real de UI detectado por el test de `ErrorState` (renderizaba la key cruda).
3. `test: adopt frontend test design, rewrite stale suites to current contracts` — reescrituras/movimientos/borrados de este plan + `conductor/PLAN_TEST_DESIGN_FRONTEND.md`.
