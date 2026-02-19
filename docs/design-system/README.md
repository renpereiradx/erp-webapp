# Sistema de Diseño ERP - Guía de Implementación

Esta documentación detalla el proceso de extracción, adaptación e implementación de interfaces de usuario para el ERP, utilizando **Stitch** como fuente de verdad de diseño.

---

## Flujo de Trabajo Principal

El diseño del ERP se gestiona en Stitch. El rol del desarrollo es extraer la estructura HTML, los tokens visuales y la jerarquía de componentes para integrarlos en la arquitectura de React + SCSS del proyecto.

## Archivos de Documentación

docs/design-system/
├── README.md                      # Índice y visión general
├── component-guide.md             # Guía de componentes extraídos
├── component-inventory.md         # Inventario de mapeo JSX → SCSS
├── review-process.md              # Proceso de revisión de fidelidad
├── implementation-workflow.md     # 🆕 Workflow de extracción desde Stitch
└── templates/
    └── page-implementation-template.md  # Template para documentar nuevas implementaciones

## Documentación

| Documento | Descripción |
|:--|:--|
| [Guía de Componentes](./component-guide.md) | Ejemplos de uso y API de componentes |
| [Inventario](./component-inventory.md) | Mapeo JSX → SCSS de todos los componentes |
| [Proceso de Revisión](./review-process.md) | Checklist y convenciones de nombrado |
| [**Workflow de Implementación**](./implementation-workflow.md) | **Guía paso a paso para nuevas páginas** |
| [Template de Página](./templates/page-implementation-template.md) | Template copiable para cada implementación |

---

## Archivos SCSS Clave

| Archivo | Ubicación |
|:--|:--|
| Variables/Tokens | `src/styles/scss/abstracts/_variables.scss` |
| Mixins | `src/styles/scss/abstracts/_mixins.scss` |
| Entry Point | `src/styles/scss/main.scss` |

---

## Componentes Migrados

| Componente | Clases SCSS | Estado |
|:--|:--|:--|
| Button | `.btn .btn--*` | ✅ |
| Input | `.input .input--*` | ✅ |
| Card | `.card .card__*` | ✅ |
| Table | `.data-table__*` | ✅ |
| Dialog | `.radix-dialog__*` | ✅ |

---

## Requisitos de Implementación

Cada nueva página implementada debe cumplir con:
1. **Fidelidad Stitch**: Seguir al 100% los tokens y layout definidos en Stitch.
2. **Componentes UI**: Usar exclusivamente componentes de `@/components/ui/`.
3. **Buscador Global**: La página DEBE ser integrable y buscable desde la `navbar__search` registrándola en `src/config/searchableRoutes.js`.

---

## Quick Start

```jsx
// Importar componentes
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

// Usar con props Fluent
<Button variant="primary" size="lg">Guardar</Button>
<Input variant="outlined" state="error" />
<Card variant="elevated" interactive>...</Card>
```
