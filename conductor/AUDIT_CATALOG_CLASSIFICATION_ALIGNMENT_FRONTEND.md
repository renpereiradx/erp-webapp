# AUDIT — Alineación "Clasificación y Catálogos" a DESIGN.md + AGENTS.md

Fecha: 2026-09-03 · Plan: `PLAN_CATALOG_CLASSIFICATION_ALIGNMENT_FRONTEND.md` (mismo directorio)
Alcance: `/configuracion/categorias`, `/configuracion/marcas`, `/configuracion/atributos`

## Resultado

| Verificación | Resultado |
|:-------------|:----------|
| `npx tsc --noEmit` | ✅ limpio en el scope (persisten errores pre-existentes en `components/sales/RegisterSalePaymentModal.tsx`, archivo no tocado) |
| `pnpm lint:design` | ✅ "Código nuevo limpio" (legacy: 7228 violaciones en 165 archivos, no bloquea) |
| `pnpm test` | ✅ 44 failures = baseline pre-existente (0 regresiones); feature tests 42/42 (incluye 19 de CategoryManagementModal y los nuevos de `slugify`) |
| `pnpm build` | ✅ |

## Cambios por feature

### Attributes — migración Feature-Sliced (la pieza estructural)
- Nuevo `src/features/attributes/`: `components/{AttributesTab,TagsTab,IconPickerModal}.tsx`,
  `hooks/useAttributes.ts`, `types.ts`, `index.ts`.
- Eliminados: `src/components/attributes/`, `src/hooks/useAttributes.ts`,
  `src/types/attribute.ts`, `src/types/tag.ts`, `src/data/mockData.ts` (solo lo consumía este feature).
- `AttributesPage.tsx`: PageHeader + `SegmentedControl` (tabs) + acción primaria en header +
  Badge contador + estados loading (skeleton) / error (ErrorState+retry).
- `useAttributes`: toasts vía i18n, **mockTags eliminado** (antes se mostraban datos falsos
  antes/despite error de API), estado `error` + `refetch` para ErrorState,
  `category_id` por `Number.isFinite` en vez de lista hardcoded de strings.

### Categories
- `CategoriesPage`: plantilla §7 de DESIGN.md (PageHeader + contenedor + grid), búsqueda con
  `Input`, y **confirmación de borrado con AlertDialog** (antes eliminaba sin confirmar).
- `CategoryTree` / `CategoryDetailForm`: ui components (Input/Label/Select/Badge/Button/EmptyState),
  lucide, i18n; el form eliminó el hack de mapeo por `id` del DOM (handlers explícitos por campo).
- `TaxRatesPanel`: **rewriter completo**. Lógica extraída a `hooks/useSifenClassification.ts`
  (carga de códigos, detección en productos, pre-selección, auto-clasificación); el componente
  queda presentacional. Modal artesanal `fixed inset-0` → `EnhancedModal` §6.6 (variant warning);
  tabla slate → ui `Table` §6.3; badges → `Badge`; `window`-level hex/green/amber → tokens.
- `CategoriesTable` / `CategoryDrawer` / `CategoryManagementModal` (usados por ProductFormModal,
  con tests): alineación conservadora — slate→tokens, `text-[10px] font-black`→`text-label-caps`,
  `bg-white`→`bg-surface`, gradiente del header eliminado (NUNCA gradientes), labels con
  `htmlFor`. **Se preservaron todos los `data-testid` y claves `t()`** (19 tests en verde).
- `CategoryAttributesManager`: i18n, tokens, `AlertDialog` en vez de `window.confirm`,
  `GenericSkeletonList` para carga, Radix Select para data-type.

### Brands
- `BrandsPage`: PageHeader; el botón `gradient-primary` artesanal → `Button variant="primary"` en actions.
- `BrandList`: lucide, `Input` búsqueda, paginación con `Button ghost` + aria-labels,
  EmptyState en vez de tabla vacía, contadores interpolados i18n, icono placeholder `Image`
  (antes nombre de ícono Material del campo `icon`).
- `BrandDetailForm`: ui Input/Label/Button, AlertDialog para eliminar (antes `window.confirm`),
  **overlay falso de "Subir" eliminado** (no tenía handler: affordance muerta); el logo se
  define por el campo Logo URL, igual que antes.
- `useBrands`: toasts i18n, catch del fetch inicial + `error`/`refetch` para ErrorState,
  callbacks estabilizados con `useCallback`.
- `types/brand.ts`: eliminado campo `icon` (ya sin uso).
- Nuevo `index.ts` barrel.

### Compartidos
- `src/domain/shared/slugify.ts` + tests: lógica pura de slug/code (antes duplicada inline en
  BrandDetailForm, AttributesTab y TagsTab) — regla "cálculos en `src/domain/`".
- i18n: namespaces nuevos `attributes.*` y `brands.*` (es+en), ~120 claves nuevas en
  `categories.*` (es+en), `common.close`/`common.delete`/`errors.load_title` (es+en).
  Registrados en `locales/{es,en}/index.js`.
- Componentes ui legacy (`.jsx`): `className` con default `''` en `label`, `checkbox`,
  `select` (7 funciones) y `alert-dialog` (8) — solo tipado (los destructuraba sin default y
  TS los exigía en todo consumidor TSX). Sin cambio visual.

## Auditoría skill `vercel-react-best-practices` (reglas aplicadas / hallazgos)

| Regla | Aplicación |
|:------|:-----------|
| `rerender-no-inline-components` | `renderCategory` (CategoryTree) es render-helper invocado directamente, no componente JSX anidado; OK. |
| `rerender-lazy-state-init` | `expandedNodes` usa `useState(() => new Set())` (evita Set nuevo por render). |
| `rerender-functional-setstate` | updates de formData/options/paginación usan updater funcional. |
| `rerender-derived-state-no-effect` | `filtered*` derivados con `useMemo`, nunca en effects; `isRoot/getChildren` calculados en render (listas pequeñas). |
| `rerender-dependencies` | efecto de detección SIFEN depende de `selectedCategory?.id` (primitivo), no del objeto. |
| `rendering-conditional-render` | condicionales de render con ternarios; `&&` solo donde el lado falso es `null`-safe (Badge dentro de celdas). |
| `rendering-hoist-jsx` | constantes estáticas a nivel módulo (`DATA_TYPES`, `FIXED_TAG_CATEGORIES`, `spanishKeywords`, `GENERAL_CODE`, defaults). |
| `js-set-map-lookups` | expansión del árbol con `Set` de nodos expandidos (pre-existente, conservado). |
| `bundle-barrel-imports` | Las páginas importan por barrel del feature (`@/features/...`) — convención del repo (mismo patrón en products/purchases); el tree-shaking de Vite lo maneja. Documentado, no bloquea. |
| `client-*`/`async-*` | fetch inicial con cleanup/`ignore` (pre-existente en categorías, replicado); sin waterfalls nuevos (attributes + categories en paralelo dentro de cada hook). |

Deuda menor detectada, fuera de scope: `console.error` como único log en catch de detección
SIFEN (estado válido, no requiere UI), y `IconPickerModal` sigue renderizando nombres Material
Symbols (dato almacenado en DB para `tag.icon` — cambiar el formato es migración de datos).

## Notas para el desarrollador

- **Si el dev server Vite estaba corriendo**: reiniciarlo — se eliminaron archivos
  (`mockData.ts`, `components/attributes/`, `hooks/useAttributes.ts`, `types/{attribute,tag}.ts`)
  y el graph stale produce pantalla negra (ver memoria de workspace).
- `BrandDetailForm` ya no muestra el overlay "Subir" (era decorativo sin handler). Si se quiere
  upload real de logos, es feature nueva.
- Pendiente de consolidación futura: `CategoryDetailForm` (página) y `CategoryDrawer` (modal de
  ProductFormModal) duplican el formulario de categoría; unificación recomendada cuando Products
  migre a su fase feature-sliced completa.
