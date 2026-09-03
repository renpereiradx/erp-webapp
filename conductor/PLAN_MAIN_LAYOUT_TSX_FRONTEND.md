# PLAN — Migración de MainLayout a TSX con arquitectura limpia

Fecha: 2026-09-03
Estado: Implementado
Alcance: `erp-webapp/src/layouts/`

## Objetivo

Alinear el shell de la aplicación (`MainLayout`) con las reglas de `AGENTS.md`:

1. Archivos nuevos en TypeScript (`.tsx` / `.ts`).
2. Separación presentación / orquestación / lógica pura (Feature-Sliced):
   componentes visuales puros, hooks de orquestación y funciones puras sin React.

`MainLayout.jsx` (1.159 líneas) mezclaba en un solo archivo: configuración de
navegación, filtrado por permisos, lógica del buscador global (con filtro de
módulos BI), atajos de teclado, sidebar desktop/mobile, header y efectos globales.

## Arquitectura resultante

```
src/layouts/
├── MainLayout.tsx            ← shell: composición, estado de UI, efectos globales, <main>
└── main/
    ├── types.ts              ← NavigationItem, SearchableItem, TFn
    ├── navigation.ts         ← buildNavigation() + filterNavigationItems() (puro, sin React)
    ├── search.ts             ← buildSearchableItems() + filterSearchResults() (puro)
    ├── useGlobalSearch.ts    ← hook: estado del buscador, atajos, click-outside
    ├── NavList.tsx           ← lista de navegación compartida (desktop + mobile)
    ├── Sidebar.tsx           ← aside desktop + overlay mobile (presentacional)
    └── Header.tsx            ← buscador global, BranchSwitcher, notificaciones, menú usuario
```

`navigation.ts` y `search.ts` son módulos puros (sin dependencias de React):
testables sin renderizar y reutilizables. Los componentes reciben todo por props;
el único estado global de UI del shell vive en `MainLayout.tsx`.

## Comportamiento preservado (sin cambios funcionales)

- Filtrado de nav por permisos (`permission` simple y `permissions` anyOf),
  incluyendo la regla de mantener padres sin gate aunque no tengan hijos.
- Gate por módulo de reservas (`reservationsEnabled`).
- Auto-expansión de menús según la ruta actual.
- Colapso/expansión del sidebar (w-72 / w-20) y `--erp-content-inset` para el
  centrado de modales (EnhancedModal / radix-dialog).
- Buscador global: Ctrl+K, flechas, Enter, Escape, click-outside, scroll de la
  opción seleccionada y el filtro que degrada módulos BI (núcleos siempre visibles).
- Refresh del `main` al cambiar sucursal (`key` + `queryClient.clear()`).
- Bootstrap de configuración del negocio post-login (fail-open D-SR-5).
- Estilos DESIGN.md aplicados en la iteración anterior (sin cambios visuales).

## Limpiezas

- `profileBtnRef` / `sidebarRef`: refs sin uso → eliminados.
- El estado del menú de usuario baja a `Header` (solo se usa ahí).
- `filterNavItems` mutaba `item.children` in-place → ahora filtrado inmutable.

## Fuera de alcance

- No se migra `PriceAdjustmentLayout.jsx` (sin cambios en esta iteración).
- No se extraen tests unitarios para `navigation.ts` / `search.ts` (quedan como
  follow-up natural: son puros y triviales de testear).

## Verificación

- `pnpm build`, `npx tsc --noEmit` (sin errores en `src/layouts/`),
  `node scripts/lint-design.mjs` (código nuevo limpio), suite de tests con la
  misma línea base pre-existente, y smoke test visual en el navegador
  (sidebar colapsable, submenús, buscador, menú de usuario, cambio de sucursal).

## Riesgos y rollback

Riesgo bajo: es un refactor estructural sin cambio de comportamiento. Rollback:
revertir el commit (se elimina `main/` y se restaura `MainLayout.jsx`).
