# PLAN — Alineación "Clasificación y Catálogos" a DESIGN.md + AGENTS.md

Fecha: 2026-09-03
Alcance: las 3 páginas del submenú `Clasificación y Catálogos` (Logística e Inventario):

| Ruta | Página | Estado inicial |
|:-----|:-------|:---------------|
| `/configuracion/categorias` | `pages/CategoriesPage.tsx` + `features/categories/*` | Feature-sliced ✅, pero UI con violaciones DESIGN.md |
| `/configuracion/marcas` | `pages/BrandsPage.tsx` + `features/brands/*` | Feature-sliced ✅, UI con violaciones + 0% i18n |
| `/configuracion/atributos` | `pages/AttributesPage.tsx` + `components/attributes/*` + `hooks/useAttributes.ts` | **NO feature-sliced** ❌, UI con violaciones + 0% i18n |

Referencias: `DESIGN.md` (reglas inviolables §1, recetas §6, checklist §10), `AGENTS.md`
(i18n obligatorio, Feature-Sliced, `.tsx`, domain puro, skill `vercel-react-best-practices`).

## Hallazgos (auditoría previa)

1. **Attributes fuera de Feature-Sliced**: `AttributesTab`/`TagsTab` en `src/components/attributes/`,
   hook en `src/hooks/useAttributes.ts`, tipos en `src/types/{attribute,tag}.ts`,
   `IconPickerModal` en `src/components/modals/`. Consumidores: solo su página → migración segura.
2. **Iconos `material-symbols-outlined`** en todas las páginas del scope (la fuente es un alias
   local a `MaterialIconsRound-Regular.otf`; DESIGN.md manda `lucide-react`). Los *datos* de
   etiquetas guardan nombres de íconos Material (picker) → se conserva el render data-driven,
   se migran los íconos de UI.
3. **Strings hardcoded** en español: BrandsPage/BrandList/BrandDetailForm/useBrands (toasts),
   AttributesPage/TagsTab/AttributesTab/useAttributes (toasts), CategoryTree/CategoryDetailForm/
   TaxRatesPanel/CategoryAttributesManager. `categories.*` ya tenía namespace parcial.
4. **Violaciones DESIGN.md**: hex `#059669`, escalas genéricas (`slate/green/amber/gray`),
   `text-[10px]`, `shadow-sm/md`, `rounded-[16px]`, gradientes (`gradient-primary`), botones
   artesanales (`btn-primary`/`btn-tertiary`), modal artesanal `fixed inset-0` en TaxRatesPanel,
   tablas sin componentes ui, sin estados loading/empty/error estándar, sin `PageHeader`,
   `window.confirm` en flujos destructivos (BrandDetailForm, CategoryAttributesManager).
5. **Lógica en componentes**: slug auto-generado (BrandDetailForm, AttributesTab, TagsTab),
   orquestación SIFEN dentro de TaxRatesPanel (fetch + preselección + auto-classify).
6. **Riesgos de datos**: `useAttributes` sembraba `mockTags` como estado inicial (datos falsos
   visibles antes/despite error de API).

## Plan

### F0 — Prerequisitos
- `src/domain/shared/slugify.ts`: slug/codegen puro + tests (`slugify.test.ts`).
- Namespace i18n nuevo: `brands.*`, `attributes.*` (es + en); extender `categories.*` (es + en).
  Registrar en `locales/{es,en}/index.js`.

### F1 — Attributes → `src/features/attributes/`
```
features/attributes/
├── components/AttributesTab.tsx    (rediseñado: ui Table/Input/Label/Button/Badge, i18n)
├── components/TagsTab.tsx          (ídem; color+icono data-driven se conservan)
├── components/IconPickerModal.tsx  (movido; chrome a lucide, render de datos Material se conserva)
├── hooks/useAttributes.ts          (movido; toasts i18n; mockTags eliminado; refetch)
├── types.ts                        (Attribute, Tag; TagType += 'SEASON')
└── index.ts
```
- Borrar `src/components/attributes/`, `src/hooks/useAttributes.ts`, `src/types/attribute.ts`,
  `src/types/tag.ts`, `mockTags` en `src/data/mockData.ts` (consumidores: solo el feature).
- `AttributesPage.tsx`: PageHeader + `SegmentedControl` (tabs) + acción primaria en header
  + estados loading (skeleton) / error / empty.

### F2 — Categories
- `CategoriesPage.tsx`: plantilla §7 (PageHeader + contenedor + grid 2 columnas), búsqueda al
  header con `Input`, confirmación de borrado con `AlertDialog` (hoy elimina sin confirmar).
- `CategoryTree.tsx`: lucide, Card §6.2, EmptyState, i18n.
- `CategoryDetailForm.tsx`: `Input`/`Label`/Radix `Select`/`Button`, i18n, badge ID data-mono;
  se elimina el hack de mapeo por `id` del DOM (handlers explícitos).
- `TaxRatesPanel.tsx`: **rewriter** — lógica a `hooks/useSifenClassification.ts`; panel
  presentacional con tokens, `Badge`, ui `Table` §6.3, `EnhancedModal` §6.6 para confirmar
  auto-clasificación, estados §6.7, i18n.
- `CategoriesTable` + `CategoryDrawer` + `CategoryManagementModal` (usados por ProductFormModal,
  con tests): alineación conservadora — slate→tokens, `text-[10px] font-black`→tipos §3,
  `bg-white/dark:bg-surface-dark`→`bg-surface`; se preservan `data-testid` y claves `t()`.
- `CategoryAttributesManager.tsx`: i18n + tokens + `AlertDialog` en vez de `window.confirm`.

### F3 — Brands
- `BrandsPage.tsx`: PageHeader (acción primaria "Nueva Marca", se elimina botón gradiente).
- `BrandList.tsx`: lucide, búsqueda con `Input`, paginación con `Button ghost` + aria-label,
  EmptyState en vez de tabla vacía, contadores data-mono, i18n.
- `BrandDetailForm.tsx`: ui `Input`/`Label`/`Button`, `AlertDialog` para eliminar,
  slug vía `domain/shared/slugify`, i18n.
- `useBrands.ts`: toasts i18n, `catch` en fetch inicial + `refetch` para ErrorState.

### F4 — Skill vercel-react-best-practices (reglas aplicadas)
- `rerender-no-inline-components` / hoisting de helpers estáticos fuera del componente.
- `rerender-functional-setstate`, `rerender-lazy-state-init` donde aplique.
- `rendering-conditional-render`: ternarios en vez de `&&` para condicionales de render.
- `js-*`: Sin cambios estructurales requeridos (listas pequeñas); paginación con slices ya existente.

### Fuera de alcance (queda documentado)
- `IconPickerModal` sigue almacenando nombres Material Symbols (formato de dato en DB).
- Consolidar `CategoryDetailForm` (página) con `CategoryDrawer` (modal de productos): duplicado
  funcional, se mantiene ambos para no romper ProductFormModal; candidato a unificación futura.
- Cargar la fuente Material Symbols solo si se mantiene el picker de iconos (data-driven).

## Verificación
- `npx tsc --noEmit` (build de Vite NO typecheckea)
- `pnpm lint:design` (gatea solo código nuevo/cambiado)
- `pnpm test` (baseline: 44 failures pre-existentes; no se aceptan failures nuevos)
- `pnpm build`
