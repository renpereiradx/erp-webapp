# Sistema de Diseño Fluent 2 - Guía de Componentes

Documentación de uso para los componentes UI migrados al sistema SCSS Fluent 2.

---

## Button

```jsx
import { Button } from '@/components/ui/button'

// Variantes
<Button variant="primary">Guardar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="ghost">Más opciones</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="success">Confirmar</Button>

// Tamaños
<Button size="sm">Pequeño</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><Icon /></Button>

// Estados especiales
<Button loading>Guardando...</Button>
<Button block>Ancho completo</Button>
<Button pill>Bordes redondeados</Button>
```

### Props

| Prop | Tipo | Default | Descripción |
|:--|:--|:--|:--|
| `variant` | `primary` \| `secondary` \| `ghost` \| `subtle` \| `destructive` \| `danger` \| `success` \| `warning` | `primary` | Estilo visual |
| `size` | `sm` \| `default` \| `lg` \| `icon` | `default` | Tamaño |
| `loading` | `boolean` | `false` | Muestra spinner |
| `block` | `boolean` | `false` | Ancho 100% |
| `circular` | `boolean` | `false` | Forma circular |
| `pill` | `boolean` | `false` | Bordes pill |

---

## Input

```jsx
import { Input } from '@/components/ui/input'

// Variantes
<Input variant="outlined" placeholder="Normal" />
<Input variant="filled" placeholder="Con fondo" />
<Input variant="underlined" placeholder="Minimalista" />

// Estados
<Input state="error" />
<Input state="success" />
<Input state="warning" />

// Tamaños
<Input size="sm" />
<Input size="lg" />
```

### Props

| Prop | Tipo | Default | Descripción |
|:--|:--|:--|:--|
| `variant` | `outlined` \| `filled` \| `underlined` | `outlined` | Estilo visual |
| `state` | `error` \| `success` \| `warning` | - | Estado de validación |
| `size` | `sm` \| `default` \| `lg` | `default` | Tamaño |

---

## Card

```jsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'

<Card variant="elevated" size="comfortable" interactive>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    Contenido de la tarjeta
  </CardContent>
  <CardFooter>
    <Button>Acción</Button>
  </CardFooter>
</Card>

// Estados semánticos
<Card state="success">Operación exitosa</Card>
<Card state="error">Error</Card>
<Card state="warning">Advertencia</Card>
```

### Props de Card

| Prop | Tipo | Default | Descripción |
|:--|:--|:--|:--|
| `variant` | `default` \| `elevated` \| `filled` \| `outlined` \| `ghost` | `default` | Estilo visual |
| `size` | `compact` \| `default` \| `comfortable` \| `spacious` | `default` | Padding |
| `state` | `success` \| `warning` \| `error` \| `info` | - | Borde lateral colorido |
| `interactive` | `boolean` | `false` | Hover/click effects |

### Subcomponentes

- `CardHeader` - Encabezado con borde inferior
- `CardTitle` - Título principal
- `CardDescription` - Subtítulo/descripción
- `CardContent` - Contenido principal
- `CardFooter` - Pie con borde superior
- `CardMedia` - Imagen/video
- `CardDivider` - Separador horizontal

---

## Table

```jsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>ID</TableHead>
      <TableHead>Nombre</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell isId>001</TableCell>
      <TableCell>Producto A</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Props de TableCell

| Prop | Tipo | Default | Descripción |
|:--|:--|:--|:--|
| `isId` | `boolean` | `false` | Aplica estilo monospace azul |

---

## Clases SCSS Disponibles

Los componentes usan estas clases del sistema Fluent que también puedes usar directamente:

### Buttons
`.btn`, `.btn--primary`, `.btn--secondary`, `.btn--ghost`, `.btn--destructive`, `.btn--small`, `.btn--large`, `.btn--loading`, `.btn--block`

### Inputs
`.input`, `.input--filled`, `.input--underlined`, `.input--error`, `.input--success`, `.input--small`, `.input--large`

### Cards
`.card`, `.card--elevated`, `.card--filled`, `.card--outlined`, `.card__header`, `.card__title`, `.card__body`, `.card__footer`

### Tables
`.data-table`, `.data-table__table`, `.data-table__wrapper`, `.id-cell`

---

## Componentes SCSS Adicionales

### Switch

```html
<label class="switch">
  <input type="checkbox" class="switch__input" />
  <span class="switch__track">
    <span class="switch__thumb"></span>
  </span>
  <span class="switch__label">Activar notificaciones</span>
</label>

<!-- Checked -->
<label class="switch switch--checked">...</label>

<!-- Sizes -->
<label class="switch switch--small">...</label>
<label class="switch switch--large">...</label>
```

**Clases:** `.switch`, `.switch--checked`, `.switch--disabled`, `.switch--small`, `.switch--large`

---

### Radio Group

```html
<div class="radio-group">
  <label class="radio radio--checked">
    <input type="radio" class="radio__input" name="option" />
    <span class="radio__indicator"></span>
    <span class="radio__label">Opción 1</span>
  </label>
  <label class="radio">
    <input type="radio" class="radio__input" name="option" />
    <span class="radio__indicator"></span>
    <span class="radio__label">Opción 2</span>
  </label>
</div>

<!-- Horizontal -->
<div class="radio-group radio-group--horizontal">...</div>
```

**Clases:** `.radio-group`, `.radio-group--horizontal`, `.radio`, `.radio--checked`, `.radio--disabled`, `.radio--small`, `.radio--large`

---

### Slider

```html
<div class="slider">
  <input type="range" class="slider__input" />
  <div class="slider__track">
    <div class="slider__range" style="width: 50%"></div>
  </div>
  <div class="slider__thumb" style="left: 50%"></div>
</div>
```

**Clases:** `.slider`, `.slider--disabled`, `.slider--small`, `.slider--large`, `.slider--vertical`

---

### Toggle / Toggle Group

```html
<button class="toggle toggle--pressed">Bold</button>
<button class="toggle">Italic</button>

<!-- Toggle Group -->
<div class="toggle-group">
  <button class="toggle toggle--pressed">Izq</button>
  <button class="toggle">Centro</button>
  <button class="toggle">Der</button>
</div>
```

**Clases:** `.toggle`, `.toggle--pressed`, `.toggle--disabled`, `.toggle-group`, `.toggle-group--vertical`

---

### Breadcrumb

```html
<nav class="breadcrumb">
  <ol class="breadcrumb__list">
    <li class="breadcrumb__item">
      <a href="#" class="breadcrumb__link">Inicio</a>
      <span class="breadcrumb__separator">/</span>
    </li>
    <li class="breadcrumb__item">
      <span class="breadcrumb__current">Página actual</span>
    </li>
  </ol>
</nav>
```

**Clases:** `.breadcrumb`, `.breadcrumb--small`, `.breadcrumb--large`, `.breadcrumb__link`, `.breadcrumb__current`, `.breadcrumb__separator`

---

### Tabs

```html
<div class="tabs">
  <div class="tab-list">
    <button class="tab-trigger tab-trigger--active">Tab 1</button>
    <button class="tab-trigger">Tab 2</button>
    <button class="tab-trigger">Tab 3</button>
  </div>
  <div class="tab-content">
    <div class="tab-panel">Contenido Tab 1</div>
  </div>
</div>

<!-- Variantes -->
<div class="tab-list tab-list--vertical">...</div>
<div class="tab-list tab-list--pill">...</div>
```

**Clases:** `.tabs`, `.tab-list`, `.tab-list--vertical`, `.tab-list--pill`, `.tab-trigger`, `.tab-trigger--active`, `.tab-trigger--disabled`

---

### Accordion

```html
<div class="accordion">
  <div class="accordion-item accordion-item--expanded">
    <button class="accordion-trigger">
      <span>Sección 1</span>
      <span class="accordion-trigger__icon">▼</span>
    </button>
    <div class="accordion-content">
      <div class="accordion-content__inner">Contenido...</div>
    </div>
  </div>
</div>

<!-- Variante sin bordes -->
<div class="accordion accordion--borderless">...</div>
```

**Clases:** `.accordion`, `.accordion--borderless`, `.accordion-item`, `.accordion-item--expanded`, `.accordion-item--disabled`, `.accordion-trigger`

---

### Skeleton

```html
<!-- Texto -->
<div class="skeleton skeleton--text"></div>

<!-- Avatar -->
<div class="skeleton skeleton--avatar"></div>

<!-- Botón -->
<div class="skeleton skeleton--button"></div>

<!-- Card -->
<div class="skeleton skeleton--card"></div>

<!-- Sin animación -->
<div class="skeleton skeleton--text skeleton--no-animation"></div>
```

**Clases:** `.skeleton`, `.skeleton--text`, `.skeleton--heading`, `.skeleton--avatar`, `.skeleton--button`, `.skeleton--image`, `.skeleton--card`, `.skeleton--small`, `.skeleton--large`

---

### Progress & Spinner

```html
<!-- Progress bar -->
<div class="progress">
  <div class="progress__track">
    <div class="progress__fill" style="width: 60%"></div>
  </div>
  <span class="progress__value">60%</span>
</div>

<!-- Variantes -->
<div class="progress progress--success">...</div>
<div class="progress progress--warning">...</div>
<div class="progress progress--error">...</div>
<div class="progress progress--indeterminate">...</div>

<!-- Spinner -->
<div class="spinner spinner--medium">
  <svg class="spinner__svg" viewBox="0 0 50 50">
    <circle class="spinner__track" cx="25" cy="25" r="20" fill="none" stroke-width="4"/>
    <circle class="spinner__fill" cx="25" cy="25" r="20" fill="none" stroke-width="4"/>
  </svg>
</div>
```

**Clases Progress:** `.progress`, `.progress--thin`, `.progress--thick`, `.progress--success`, `.progress--warning`, `.progress--error`, `.progress--indeterminate`

**Clases Spinner:** `.spinner`, `.spinner--small`, `.spinner--medium`, `.spinner--large`, `.spinner--xlarge`

---

### Toast / Message Bar

```html
<!-- Toast container -->
<div class="toast-container toast-container--top-right">
  <div class="toast toast--success">
    <span class="toast__icon">✓</span>
    <div class="toast__content">
      <p class="toast__title">Éxito</p>
      <p class="toast__message">Operación completada</p>
    </div>
    <button class="toast__close">×</button>
  </div>
</div>

<!-- Message Bar (inline) -->
<div class="message-bar message-bar--warning">
  <span class="message-bar__icon">⚠</span>
  <div class="message-bar__content">Advertencia importante</div>
</div>
```

**Clases Toast:** `.toast-container--top-right`, `.toast-container--bottom-left`, `.toast`, `.toast--info`, `.toast--success`, `.toast--warning`, `.toast--error`

**Clases Message Bar:** `.message-bar`, `.message-bar--info`, `.message-bar--success`, `.message-bar--warning`, `.message-bar--error`

---

### Popover

```html
<div class="popover">
  <button class="popover__trigger">Abrir popover</button>
  <div class="popover__content popover__content--bottom">
    <div class="popover__header">
      <span class="popover__title">Título</span>
      <button class="popover__close">×</button>
    </div>
    <div class="popover__body">Contenido del popover</div>
    <div class="popover__arrow"></div>
  </div>
</div>
```

**Clases:** `.popover`, `.popover__content--top`, `.popover__content--bottom`, `.popover__content--left`, `.popover__content--right`, `.popover__arrow`

---

### Tree View

```html
<ul class="tree">
  <li class="tree-item tree-item--expanded">
    <div class="tree-item__content">
      <span class="tree-item__expand-icon">▶</span>
      <span class="tree-item__icon">📁</span>
      <span class="tree-item__label">Carpeta</span>
    </div>
    <ul class="tree-item__children tree--nested">
      <li class="tree-item">
        <div class="tree-item__content">
          <span class="tree-item__label">Archivo.txt</span>
        </div>
      </li>
    </ul>
  </li>
</ul>
```

**Clases:** `.tree`, `.tree--nested`, `.tree--with-lines`, `.tree-item`, `.tree-item--expanded`, `.tree-item--selected`, `.tree-item--disabled`

---

### Avatar / Avatar Group / Persona

```html
<!-- Avatar con iniciales -->
<div class="avatar avatar--48">
  <span class="avatar__initials">JD</span>
</div>

<!-- Avatar con imagen -->
<div class="avatar avatar--48">
  <img class="avatar__image" src="..." alt="..." />
  <span class="avatar__badge avatar__badge--available"></span>
</div>

<!-- Avatar Group -->
<div class="avatar-group">
  <div class="avatar avatar--32">...</div>
  <div class="avatar avatar--32">...</div>
  <div class="avatar-group__overflow avatar--32">+3</div>
</div>

<!-- Persona (Avatar + Texto) -->
<div class="persona">
  <div class="avatar avatar--48">...</div>
  <div class="persona__details">
    <span class="persona__name">Juan Pérez</span>
    <span class="persona__secondary">Desarrollador</span>
  </div>
</div>
```

**Tamaños Avatar:** `.avatar--16`, `.avatar--20`, `.avatar--24`, `.avatar--32`, `.avatar--48`, `.avatar--56`, `.avatar--72`, `.avatar--96`

**Colores Avatar:** `.avatar--neutral`, `.avatar--brand`, `.avatar--colorful-1` a `.avatar--colorful-6`

**Badges:** `.avatar__badge--available`, `.avatar__badge--busy`, `.avatar__badge--away`, `.avatar__badge--offline`
