# REPORT — Layout "Workspace" unificado para Clasificación y Catálogos

Fecha: 2026-09-03 · Plan: `PLAN_CATALOG_WORKSPACE_LAYOUT_FRONTEND.md` (mismo directorio)

## Resultado

| Verificación | Resultado |
|:-------------|:----------|
| `npx tsc --noEmit` | ✅ limpio en el scope (solo errores pre-existentes en `RegisterSalePaymentModal.tsx`) |
| `pnpm lint:design` | ✅ "Código nuevo limpio" |
| `pnpm test` | ✅ 44 failures = baseline pre-existente (0 regresiones) |
| `pnpm build` | ✅ |

## Qué cambió (problema → solución)

| Problema detectado | Solución aplicada |
|:-------------------|:------------------|
| Marcas: el listado saltaba de 12 a 8 columnas al seleccionar (reflow) | El detalle **siempre está presente**: placeholder con CTA "Nueva Marca" cuando no hay selección |
| Categorías: dos empty states iguales apilados sin selección | Un único **welcome panel** con CTA; form + panel fiscal solo aparecen con selección |
| Búsqueda en 3 posiciones distintas (toolbar suelta / dentro del listado / dentro de cada tab) | Búsqueda **siempre en la toolbar**, a la derecha; en Atributos bindea al tab activo (una sola caja, no dos) |
| Sin conteo de resultados en Categorías/Marcas | Conteo `{n} categorías / marcas / atributos` visible en la toolbar de las 3 páginas |
| Formularios que se perdían del viewport al scrollear listas largas | Columna corta **sticky** (`lg:sticky lg:top-md`): árbol en Categorías, ficha/editor en Marcas y Atributos |

## Estructura final (idéntica en las 3 páginas)

```
PageHeader (breadcrumb · título · subtítulo · [acción primaria])
Toolbar:  [conteo | tabs] ·························· [búsqueda] [conteo]
Workspace (grid 12):  master izq. ·················  detail der. (sticky)
   Categorías  5 / 7   árbol sticky        →  form + panel fiscal | welcome
   Marcas      7 / 5   directorio paginado →  ficha | placeholder CTA
   Atributos   8 / 4   tabla (tabs)        →  editor | empty state
```

## Archivos

- **NUEVO** `src/components/layout/WorkspaceLayout.tsx`: layout compartido (toolbar slot +
  grid 12-col + sticky configurable). Aísla el patrón para que futuras páginas del submenú
  (o refactor de otras secciones) lo reutilicen sin drift.
- **NUEVO** `features/attributes/components/{AttributesTable,AttributeEditor,TagsTable,TagEditor}.tsx`:
  split de los ex-tabs (cada tab era una grilla 2-col propia, incompatible con el workspace);
  ahora el master/detail los compone la página y el SegmentedControl vive en la toolbar.
- **ELIMINADOS** `features/attributes/components/{AttributesTab,TagsTab}.tsx`.
- `pages/{CategoriesPage,BrandsPage,AttributesPage}.tsx`: adoptan WorkspaceLayout.
- `features/brands/components/BrandList.tsx`: sin búsqueda interna ni prop `totalBrands`
  (API simplificada; la página es su único consumidor, sin tests afectados).
- i18n: `categories.count`, `categories.welcome_*`, `brands.count`, `brands.placeholder_*` (es+en).

## Decisiones de diseño (justificación)

- Proporciones distintas por página (5/7, 7/5, 8/4): la consistencia está en la **estructura**
  (master izq / detail der / toolbar / sticky), no en forzar ratios iguales que obligarían a un
  editor de 3 campos a ocupar media pantalla.
- El welcome/placeholder usa `EmptyState` con `actionLabel` + `onAction` (§6.7): el vacío es una
  invitación a actuar, no un cartel.
- Sin animaciones nuevas más allá de las existentes (`duration-150` en hovers/selects).

## Mejora futura (fuera de scope)
- En mobile (< lg), al tocar un ítem del master no se hace scroll automático al detalle;
  candidato: `scrollIntoView` o drawer en pantallas chicas.
