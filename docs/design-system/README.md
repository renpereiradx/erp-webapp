# Sistema de Diseño Fluent 2

Documentación del sistema de componentes UI basado en Microsoft Fluent Design System 2.

---

## Archivos de Documentación

docs/design-system/
├── README.md                      # Índice actualizado
├── component-guide.md             # Guía de componentes
├── component-inventory.md         # Inventario
├── review-process.md              # Proceso de revisión
├── implementation-workflow.md     # 🆕 Workflow para nuevas páginas
└── templates/
    └── page-implementation-template.md  # 🆕 Template copiable

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
