# Proceso de Revisión de Diseño

Guía para mantener la consistencia del sistema de diseño Fluent 2.

---

## Checklist de Revisión de Componentes

### Antes de crear un nuevo componente

- [ ] ¿Existe ya un componente similar en `src/components/ui/`?
- [ ] ¿Existe un archivo SCSS para este componente en `src/styles/scss/components/`?
- [ ] ¿El componente propuesto sigue las guías de Fluent Design?

### Durante el desarrollo

- [ ] ¿El componente usa clases SCSS del sistema (`.btn`, `.input`, `.card`, etc.)?
- [ ] ¿Se evitan los estilos Tailwind inline para estilos base?
- [ ] ¿El componente soporta las variantes definidas en SCSS?
- [ ] ¿El componente soporta temas (light/dark)?

### Al completar

- [ ] ¿Se actualizó el inventario en `docs/design-system/component-inventory.md`?
- [ ] ¿Se agregó documentación en `docs/design-system/component-guide.md`?
- [ ] ¿La página es localizable desde el buscador global (`src/config/searchableRoutes.js`)?
- [ ] ¿El build compila sin errores?

---

## Estructura de Archivos

```
src/
├── components/ui/           # Componentes JSX
│   └── [component].jsx     # Usa clases SCSS
│
└── styles/scss/
    ├── abstracts/          # Variables, mixins, funciones
    │   ├── _variables.scss # Tokens de diseño
    │   ├── _mixins.scss    # Mixins reutilizables
    │   └── _functions.scss # Funciones SCSS
    │
    └── components/         # Estilos por componente
        └── _[component].scss
```

---

## Convención de Nombrado

### Clases SCSS (BEM)

```scss
.component { }           // Bloque base
.component--variant { }  // Modificador de variante
.component--size { }     // Modificador de tamaño
.component__element { }  // Elemento hijo
```

### Props JSX

| Prop | Uso |
|:--|:--|
| `variant` | Estilo visual (primary, secondary, ghost, etc.) |
| `size` | Tamaño (sm, default, lg) |
| `state` | Estado de validación (error, success, warning) |

---

## Tokens de Diseño

Ubicación: `src/styles/scss/abstracts/_variables.scss`

### Colores (usar con `themed()`)
- `text-primary`, `text-secondary`, `text-tertiary`
- `action-primary`, `action-primary-hover`
- `surface-card`, `surface-hover`
- `state-error`, `state-success`, `state-warning`

### Espaciado
- `$spacing-4`, `$spacing-8`, `$spacing-12`, `$spacing-16`, `$spacing-20`, `$spacing-24`

### Tipografía
- `$font-size-200` (12px), `$font-size-300` (14px), `$font-size-400` (15px)
- `$font-weight-regular`, `$font-weight-semibold`, `$font-weight-bold`

### Border Radius
- `$border-radius-small`, `$border-radius-medium`, `$border-radius-large`
