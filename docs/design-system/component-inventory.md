# Inventario de Componentes UI

Mapeo completo entre componentes JSX y estilos SCSS en el proyecto.

---

## Leyenda

| Estado | Significado |
|:--|:--|
| ✅ | Integrado correctamente con SCSS Fluent |
| ⚠️ | Usa Tailwind, existe SCSS sin usar |
| ❌ | Usa Tailwind, no existe SCSS |
| 🆕 | SCSS existe, no hay componente JSX |

---

## Categoría: Acción y Triggers (Prioridad Alta)

| Componente JSX | Archivo SCSS | Estado | Notas |
|:--|:--|:--|:--|
| [button.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/button.jsx) | [_button.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_button.scss) | ⚠️ | CVA + Tailwind, ignorando SCSS |
| [switch.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/switch.jsx) | - | ❌ | Solo Tailwind |
| [checkbox.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/checkbox.jsx) | [_checkbox.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_checkbox.scss) | ⚠️ | Verificar integración |
| [radio-group.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/radio-group.jsx) | - | ❌ | Solo Tailwind |
| [slider.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/slider.jsx) | - | ❌ | Solo Tailwind |
| [toggle.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/toggle.jsx) | - | ❌ | Solo Tailwind |

---

## Categoría: Entrada de Datos (Prioridad Alta)

| Componente JSX | Archivo SCSS | Estado | Notas |
|:--|:--|:--|:--|
| [input.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/input.jsx) | [_input.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_input.scss) | ⚠️ | 580 líneas SCSS sin usar |
| [textarea.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/textarea.jsx) | [_input.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_input.scss) | ⚠️ | Incluido en _input.scss |
| [select.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/select.jsx) | [_select.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_select.scss) | ⚠️ | Verificar integración |
| [form.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/form.jsx) | [_input.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_input.scss) | ⚠️ | form-field en _input.scss |
| [label.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/label.jsx) | - | ❌ | Solo Tailwind |
| [ProductSearchInput.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/ProductSearchInput.jsx) | [_input.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_input.scss) | ⚠️ | input-search en SCSS |

---

## Categoría: Navegación (Prioridad Media)

| Componente JSX | Archivo SCSS | Estado | Notas |
|:--|:--|:--|:--|
| [breadcrumb.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/breadcrumb.jsx) | - | ❌ | Solo Tailwind |
| [tabs.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/tabs.jsx) | - | ❌ | Solo Tailwind |
| [navigation-menu.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/navigation-menu.jsx) | - | ❌ | Solo Tailwind |
| [menubar.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/menubar.jsx) | - | ❌ | Solo Tailwind |
| [sidebar.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/sidebar.jsx) | - | ❌ | Componente extenso (19KB) |
| [pagination.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/pagination.jsx) | - | ❌ | Solo Tailwind |

---

## Categoría: Contenido y Layout (Prioridad Media)

| Componente JSX | Archivo SCSS | Estado | Notas |
|:--|:--|:--|:--|
| [card.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/card.jsx) | [_card.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_card.scss) | ⚠️ | SCSS completo sin usar |
| [accordion.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/accordion.jsx) | - | ❌ | Solo Tailwind |
| [table.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/table.jsx) | [_data-table.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_data-table.scss) | ⚠️ | SCSS con action-menu |
| [carousel.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/carousel.jsx) | - | ❌ | Solo Tailwind |
| [separator.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/separator.jsx) | [_divider.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_divider.scss) | ⚠️ | Verificar |
| [skeleton.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/skeleton.jsx) | - | ❌ | Solo Tailwind |

---

## Categoría: Feedback y Estado (Prioridad Alta)

| Componente JSX | Archivo SCSS | Estado | Notas |
|:--|:--|:--|:--|
| [dialog.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/dialog.jsx) | [_radix-dialog.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_radix-dialog.scss) | ✅ | **Correctamente integrado** |
| [alert-dialog.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/alert-dialog.jsx) | [_alert.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_alert.scss) | ⚠️ | Verificar |
| [alert.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/alert.jsx) | [_alert.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_alert.scss) | ⚠️ | Verificar |
| [Toast.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/Toast.jsx) | - | ❌ | Solo Tailwind |
| [tooltip.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/tooltip.jsx) | [_tooltip.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_tooltip.scss) | ⚠️ | Verificar |
| [popover.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/popover.jsx) | - | ❌ | Solo Tailwind |
| [progress.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/progress.jsx) | - | ❌ | Solo Tailwind |
| [StatusBadge.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/StatusBadge.jsx) | [_badge.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_badge.scss) | ⚠️ | Verificar |

---

## Categoría: Menús y Overlays

| Componente JSX | Archivo SCSS | Estado | Notas |
|:--|:--|:--|:--|
| [dropdown-menu.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/dropdown-menu.jsx) | [_dropdown-menu.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_dropdown-menu.scss) | ⚠️ | Verificar |
| [context-menu.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/context-menu.jsx) | - | ❌ | Solo Tailwind |
| [sheet.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/sheet.jsx) | - | ❌ | Solo Tailwind |
| [drawer.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/drawer.jsx) | - | ❌ | Solo Tailwind |

---

## Categoría: Identidad

| Componente JSX | Archivo SCSS | Estado | Notas |
|:--|:--|:--|:--|
| [avatar.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/avatar.jsx) | - | ❌ | Solo Tailwind |
| [badge.jsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/components/ui/badge.jsx) | [_badge.scss](file:///home/darthrpm/dev/web-project/erp-webapp/src/styles/scss/components/_badge.scss) | ⚠️ | Verificar |

---

## Resumen Estadístico

| Métrica | Cantidad |
|:--|--:|
| Total componentes JSX | 65 |
| Total archivos SCSS | 22 |
| ✅ Correctamente integrados | 1 |
| ⚠️ SCSS existe, no usado | 14 |
| ❌ Sin SCSS | 50 |

---

## Prioridad de Migración

### Alta Prioridad (Mayor impacto visual)
1. `button.jsx` → Usar `.btn .btn--*`
2. `input.jsx` → Usar `.input .input--*`
3. `card.jsx` → Usar `.card .card--*`
4. `table.jsx` → Usar `.data-table__*`

### Media Prioridad
5. `select.jsx`
6. `badge.jsx`
7. `tooltip.jsx`
8. `alert.jsx`
