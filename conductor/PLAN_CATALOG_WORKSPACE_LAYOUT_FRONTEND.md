# PLAN — Layout "Workspace" unificado para Clasificación y Catálogos

Fecha: 2026-09-03 · Antecede: `AUDIT_CATALOG_CLASSIFICATION_ALIGNMENT_FRONTEND.md`
Alcance: `/configuracion/categorias`, `/configuracion/marcas`, `/configuracion/atributos`

## Diagnóstico (causas de la desconformidad)

1. **Salto de layout al seleccionar (Marcas).** La columna de detalle no existe hasta que se
   selecciona una marca: el listado salta de 12 columnas a 8/4 y todo se reacomoda. En
   Atributos no pasa (el editor siempre está presente) y en Categorías hay placeholder: tres
   comportamientos distintos para el mismo patrón.
2. **Doble estado vacío (Categorías).** Sin selección se muestran DOS paneles diciendo lo mismo
   ("Selecciona una categoría…"): el placeholder del formulario y el empty state del panel fiscal.
3. **Búsqueda inconsistente.** Tres patrones distintos en páginas hermanas del mismo submenú:
   Categorías (toolbar flotante sola), Marcas (dentro de la card del listado), Atributos
   (dentro de cada tab).
4. **Falta de contexto.** No hay conteo de resultados en Categorías/Marcas (solo Atributos);
   el usuario no sabe cuántos elementos hay ni cuántos matchea la búsqueda.
5. **Detalle que se pierde al scrollear.** En Marcas/Atributos el listado es largo: al bajar,
   el formulario de edición desaparece del viewport.

## Dirección (dentro del sistema Fluent 2 / DESIGN.md)

Un único patrón **workspace maestro-detalle**, idéntico en estructura en las 3 páginas:

```
PageHeader (breadcrumb · título · subtítulo · [acción primaria])
──────────────────────────────────────────────────────────────
Toolbar:  [contexto: tabs | "N elementos"]      [búsqueda] [conteo]
──────────────────────────────────────────────────────────────
┌ Master (izquierda) ┐ ┌ Detail (derecha, sticky) ┐
│ árbol / listado /  │ │ formulario + panel,      │
│ tabla              │ │ o estado de bienvenida   │
└────────────────────┘ └──────────────────────────┘
```

Reglas del patrón:
- Master SIEMPRE a la izquierda, detalle SIEMPRE a la derecha. Proporción según peso del
  contenido: Categorías 5/7, Marcas 7/5, Atributos 8/4.
- La columna corta va **sticky** (`lg:sticky lg:top-md`): árbol en Categorías, form en
  Marcas/Atributos. Nunca se pierde de vista.
- El detalle **siempre existe**: sin selección muestra UN estado de bienvenida con CTA
  ("Nueva categoría" / "Nueva marca"). Cero saltos de layout, un solo empty state.
- La **búsqueda vive en la toolbar** (derecha), junto al **conteo de resultados**.
  En Atributos la búsqueda se bindea al tab activo y los tabs quedan a la izquierda.

## Implementación

| Archivo | Cambio |
|:--------|:-------|
| `components/layout/WorkspaceLayout.tsx` | **NUEVO** — grid 12-col + toolbar slot + sticky configurable; garantiza consistencia y evita drift. |
| `pages/CategoriesPage.tsx` | Toolbar (conteo izq / búsqueda der); welcome panel único reemplaza los 2 empty states; WorkspaceLayout 5/7 sticky master. |
| `pages/BrandsPage.tsx` | Detalle siempre presente (placeholder con CTA); WorkspaceLayout 7/5 sticky detail; búsqueda a toolbar. |
| `pages/AttributesPage.tsx` | Tabs en toolbar; búsqueda bindea al tab activo; WorkspaceLayout 8/4 sticky detail. |
| `features/attributes/components/AttributesTable.tsx` | **NUEVO** — master (ex-tabla de AttributesTab, sin búsqueda interna). |
| `features/attributes/components/AttributeEditor.tsx` | **NUEVO** — detail (ex-form de AttributesTab). |
| `features/attributes/components/TagsTable.tsx` / `TagEditor.tsx` | **NUEVO** — ídem para etiquetas. |
| `features/attributes/components/{AttributesTab,TagsTab}.tsx` | **ELIMINADOS** (reemplazados por los 4 de arriba). |
| `features/brands/components/BrandList.tsx` | Sin búsqueda interna (pasa a toolbar); sin `totalBrands`. |
| `lib/i18n/locales/{es,en}/` | Claves: `categories.count`, `categories.welcome_*`, `brands.count`, `brands.placeholder_*`. |
| `conductor/` | Este plan + reporte posterior. |

## Verificación
`npx tsc --noEmit` · `pnpm lint:design` · `pnpm test` (baseline 44) · `pnpm build`

## Fuera de alcance
- Navegación en mobile (master→detail sin scroll-into-view automático): queda como mejora futura.
- El contenido interno de los formularios (ya alineado en la auditoría previa).
