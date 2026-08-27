# Design tokens — fuente única de verdad

`tokens.json` es la fuente canónica de los tokens de diseño del frontend. Las
secciones `colors`, `spacing`, `borderRadius`, `fontSize` y `boxShadow` de
`tailwind.config.js` se **generan** desde aquí, nunca se editan a mano.

## Flujo de trabajo

1. Edita `tokens.json`.
2. `pnpm tokens:generate` → regenera `tailwind.config.js`.
3. `pnpm tokens:check` → verifica que no haya drift (para CI).
4. `pnpm lint:design` → valida el código contra las reglas de `DESIGN.md`.

## Estructura

| Categoría | Sección generada en `tailwind.config.js` | Clases resultantes (ej.) |
|:----------|:-----------------------------------------|:-------------------------|
| `color` | `theme.extend.colors` | `bg-primary`, `text-on-surface`, `border-subtle` |
| `spacing` | `theme.extend.spacing` | `p-md`, `gap-lg`, `max-w-container-max` |
| `borderRadius` | `theme.extend.borderRadius` | `rounded-button`, `rounded-input`, `rounded-xl` |
| `fontSize` | `theme.extend.fontSize` | `text-headline-lg`, `text-body-md`, `text-data-mono` |
| `boxShadow` | `theme.extend.boxShadow` | `shadow-whisper`, `shadow-fluent-8`, `shadow-fluent-16` |

## Notas

- Los valores son los **efectivos actuales** (cero cambio visual). Al reconciliar,
  se restauraron claves anidadas que estaban rotas por claves duplicadas en el config:
  `primary.hover` (= `primary-container` `#0074db`), `primary.foreground` y
  `secondary.foreground`. Esto arregló hovers/foregrounds silenciosamente rotos en
  ~45 archivos, sin tocar el código de esos archivos.
- Un color puede ser un string (`"surface": "#f8f9ff"`) o un objeto con `DEFAULT`
  y variantes (`"primary": { "DEFAULT": "#005baf", "hover": "#0074db", ... }`).
  Si es objeto, las referencias `theme('colors.X')` en CSS deben usar
  `theme('colors.X.DEFAULT')`.
- `fontFamily`, `screens`, `transitionDuration` y `plugins` **no** viven en
  `tokens.json` todavía (candidatas a una fase posterior).
