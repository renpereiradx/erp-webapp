# Design tokens — fuente única de verdad

`tokens.json` es la fuente canónica de los tokens de diseño del frontend. El bloque
`@theme` (+ `.dark`) de `src/index.css` se **genera** desde aquí con Tailwind CSS 4
(config CSS-first, sin `tailwind.config.js`). Nunca se edita el bloque de tokens a mano.

## Flujo de trabajo

1. Edita `tokens.json`.
2. `pnpm tokens:generate` → regenera el bloque `@theme` / `.dark` en `src/index.css`.
3. `pnpm tokens:check` → verifica que no haya drift (para CI).
4. `pnpm lint:design` → valida el código contra las reglas de `DESIGN.md`.

## Estructura

| Categoría | Variable CSS emitida | Clases resultantes (ej.) |
|:----------|:---------------------|:-------------------------|
| `color` | `--color-<name>` | `bg-primary`, `text-foreground`, `border-subtle` |
| `spacing` | `--spacing-<name>` | `p-md`, `gap-lg`, `max-w-container-max` |
| `borderRadius` | `--radius-<name>` | `rounded-button`, `rounded-input`, `rounded-xl` |
| `fontSize` | `--text-<name>` (+ `--line-height`, `--font-weight`) | `text-headline-lg`, `text-body-md`, `text-data-mono` |
| `fontFamily` | `--font-<name>` | `font-data-mono`, `font-sans` |
| `boxShadow` | `--shadow-<name>` | `shadow-whisper`, `shadow-fluent-8` |
| `breakpoints` | `--breakpoint-<name>` | `xs:`, `md:`, `lg:` |

## Formato de color y modo oscuro

- `"primary": { "light": "#0078D4", "dark": "#2899F5" }` → flipea con la clase `.dark`.
- `"background-light": "#f8f9ff"` (string) → fijo, independiente del modo.
- Objeto anidado (`DEFAULT` / `hover` / `foreground`) → shades: `--color-primary-hover`, etc.

El modo oscuro se activa con la clase `.dark` en `<html>` (la aplica `ThemeContext`),
que sobreescribe las variables `--color-*` definidas en `@theme`.

## Notas

- Paleta **Fluent 2**: primary `#0078D4` (light) / `#2899F5` (dark), hover
  `#005A9E` / `#479EF5`. Es el único primary del sistema.
- Los nombres de token son los históricos (Material-3: `surface`,
  `foreground`, …). Renombrarlos a nombres semánticos Fluent es una fase posterior
  (migración mecánica de classNames).
- `container-max` (1440px) se usa como `max-w-container-max`; el generador emite
  `--spacing-container-max` para ello.
