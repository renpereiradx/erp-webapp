# Multi-Theme System Documentation

**Versión:** 2.0 - Fluent UI 2 + Sass
**Fecha:** 2025-10-29
**Estado:** En migración (de Tailwind a Sass)

---

## Overview

Esta aplicación ERP implementa un sistema de temas basado en **Microsoft Fluent Design System 2** usando **Sass/SCSS**. El sistema soporta **dos modos únicamente**:
- ✅ **Light Mode** (Modo Claro)
- ✅ **Dark Mode** (Modo Oscuro)

### Cambios de Arquitectura (v2.0)

| Aspecto | v1.0 (Anterior) | v2.0 (Actual) |
|---------|-----------------|---------------|
| **Temas** | 6 variantes (Neo, Material, Fluent × Light/Dark) | 2 modos (Light/Dark únicamente) |
| **Estilos** | Tailwind CSS + clases condicionales | Sass/SCSS + BEM |
| **Design System** | Múltiples sistemas mezclados | Fluent UI 2 exclusivo |
| **Theme Provider** | `next-themes` | React Context nativo |
| **Variables** | CSS Variables en `App.css` | Sass variables + CSS vars generadas |
| **Componentes** | Lógica condicional en JSX | Clases BEM adaptables |

---

## Features

✅ **Sistema Simplificado**
- Solo Light/Dark basado en Microsoft Fluent Design System 2
- Cambio instantáneo entre modos
- Persistencia automática en `localStorage`

✅ **Arquitectura Sass Modular**
- Design tokens en variables Sass
- Metodología BEM para nomenclatura de clases
- Mixin `@themify` para estilos adaptativos
- Estructura de carpetas escalable

✅ **Theme-Aware Components**
- Componentes se adaptan automáticamente al modo
- Sin lógica condicional de estilos en JSX
- Estilos definidos completamente en Sass

✅ **Accesibilidad WCAG 2.1**
- Contraste de color garantizado (AA/AAA)
- Focus states visibles
- Soporte para screen readers
- Navegación por teclado completa

---

## Theme Structure

### Arquitectura de Archivos

```
src/
├── styles/
│   └── scss/
│       ├── abstracts/
│       │   ├── _variables.scss      # Design tokens Fluent UI 2
│       │   ├── _functions.scss      # Funciones utilitarias
│       │   ├── _mixins.scss         # Mixins reutilizables
│       │   └── _theme-mixin.scss    # Mixin @themify
│       │
│       ├── base/
│       │   ├── _reset.scss          # Normalize/reset
│       │   ├── _typography.scss     # Estilos tipográficos base
│       │   └── _base.scss           # html, body, etc.
│       │
│       ├── components/
│       │   ├── _button.scss         # Botones
│       │   ├── _card.scss           # Tarjetas
│       │   ├── _input.scss          # Campos de entrada
│       │   ├── _dialog.scss         # Modales/diálogos
│       │   └── ...                  # Otros componentes
│       │
│       ├── layout/
│       │   ├── _navigation.scss     # Barra de navegación
│       │   ├── _sidebar.scss        # Barra lateral
│       │   └── _grid.scss           # Sistema de grid
│       │
│       ├── pages/
│       │   └── ...                  # Estilos específicos de páginas
│       │
│       └── main.scss                # Archivo de importación principal
│
└── contexts/
    └── ThemeContext.jsx             # Context de React simplificado
```

### Design Tokens

Todos los design tokens están definidos en `src/styles/scss/abstracts/_variables.scss`:

```scss
// Colores Neutrales - Light Theme
$neutral-gray-4: #faf9f8;
$neutral-gray-8: #f3f2f1;
$neutral-gray-54: #323130;
$neutral-white: #ffffff;

// Colores Neutrales - Dark Theme
$neutral-gray-6: #242424;
$neutral-gray-60: #d6d6d6;
$neutral-black: #000000;

// Brand Colors (Rampa 10-160)
$brand-60: #0078d4;    // Primary Light
$brand-90: #5caef5;    // Primary Dark

// Semantic Colors
$success-30: #107c10;
$warning-30: #f7630c;
$error-30: #a4262c;
$info-30: #0078d4;

// Typography
$font-size-300: 14px;  // Body base
$font-size-700: 24px;  // Title
$font-weight-semibold: 600;

// Spacing (base-4 system)
$spacing-xs: 4px;
$spacing-s: 8px;
$spacing-m: 12px;
$spacing-l: 16px;
$spacing-xxl: 24px;

// Border Radius
$border-radius-medium: 4px;
$border-radius-large: 6px;

// Shadows
$shadow-2: 0 0 2px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.14);
$shadow-8: 0 0 2px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.14);
```

### Theme Map

El mapa de temas define tokens semánticos para cada modo:

```scss
$themes: (
  light: (
    'bg-primary': $neutral-white,
    'bg-secondary': $neutral-gray-8,
    'text-primary': $neutral-gray-54,
    'text-secondary': $neutral-gray-46,
    'border-default': $neutral-gray-16,
    'action-primary': $brand-60,
    'shadow-card': $shadow-2,
    // ... más tokens
  ),
  dark: (
    'bg-primary': $neutral-gray-6,
    'bg-secondary': $neutral-gray-8-dark,
    'text-primary': $neutral-gray-60,
    'text-secondary': $neutral-gray-46-dark,
    'border-default': $neutral-gray-16-dark,
    'action-primary': $brand-90,
    'shadow-card': $shadow-2-dark,
    // ... más tokens
  )
);
```

---

## Implementation Details

### Theme Provider Setup

El ThemeContext simplificado maneja solo light/dark en `/src/contexts/ThemeContext.jsx`:

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('theme-mode') || 'light';
  });

  useEffect(() => {
    // Aplicar clase al body
    document.body.classList.remove('theme--light', 'theme--dark');
    document.body.classList.add(`theme--${mode}`);

    // Guardar en localStorage
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### Themify Mixin

El mixin `@themify` permite escribir estilos que se adaptan al tema:

```scss
// src/styles/scss/abstracts/_theme-mixin.scss

@mixin themify($themes: $themes) {
  @each $theme, $map in $themes {
    .theme--#{$theme} & {
      $theme-map: () !global;
      @each $key, $submap in $map {
        $value: map-get(map-get($themes, $theme), '#{$key}');
        $theme-map: map-merge($theme-map, ($key: $value)) !global;
      }
      @content;
      $theme-map: null !global;
    }
  }
}

@function themed($key) {
  @return map-get($theme-map, $key);
}
```

**Uso:**

```scss
.card {
  padding: $spacing-l;
  border-radius: $border-radius-card;

  @include themify($themes) {
    background-color: themed('bg-secondary');
    color: themed('text-primary');
    border: 1px solid themed('border-default');
    box-shadow: themed('shadow-card');
  }

  &:hover {
    @include themify($themes) {
      box-shadow: themed('shadow-card-hover');
    }
  }
}
```

### BEM Methodology

Los componentes usan nomenclatura BEM (Block Element Modifier):

```scss
// Block
.button { }

// Element
.button__icon { }

// Modifier
.button--primary { }
.button--large { }

// Combinación
.button__icon--left { }
```

**Ejemplo completo:**

```scss
// src/styles/scss/components/_button.scss

.btn {
  display: inline-flex;
  align-items: center;
  padding: $spacing-s $spacing-l;
  border-radius: $border-radius-medium;
  font-weight: $font-weight-semibold;
  cursor: pointer;

  // Adaptación automática al tema
  @include themify($themes) {
    background-color: themed('action-primary');
    color: themed('text-on-primary');
  }

  // Variante primaria
  &--primary {
    @include themify($themes) {
      background-color: themed('action-primary');
    }

    &:hover {
      @include themify($themes) {
        background-color: themed('action-primary-hover');
      }
    }
  }

  // Variante secundaria
  &--secondary {
    @include themify($themes) {
      background-color: transparent;
      color: themed('action-primary');
      border: 1px solid themed('border-default');
    }
  }

  // Estado deshabilitado
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  // Icono dentro del botón
  &__icon {
    width: 16px;
    height: 16px;
    margin-right: $spacing-xs;
  }
}
```

---

## Component Theming

### Pattern Comparison

**❌ Antiguo (Tailwind + condicionales):**

```jsx
import { useTheme } from 'next-themes';

const Button = ({ children }) => {
  const { theme } = useTheme();
  const isNeoBrutalism = theme?.includes('neo-brutalism');

  return (
    <button className={`
      py-2 px-4
      ${isNeoBrutalism
        ? 'border-4 border-black shadow-neo-brutal'
        : 'rounded-lg border shadow-md'}
      ${isNeoBrutalism ? 'font-black uppercase' : 'font-semibold'}
      bg-primary text-primary-foreground
    `}>
      {children}
    </button>
  );
};
```

**✅ Nuevo (Sass + BEM):**

```jsx
const Button = ({ children, variant = 'primary' }) => {
  return (
    <button className={`btn btn--${variant}`}>
      {children}
    </button>
  );
};
```

```scss
// Estilos en Sass (se adaptan automáticamente)
.btn {
  padding: $spacing-s $spacing-l;
  border-radius: $border-radius-medium;
  font-weight: $font-weight-semibold;

  @include themify($themes) {
    background-color: themed('action-primary');
    color: themed('text-on-primary');
  }

  &--primary {
    // Estilos específicos de variante primary
  }
}
```

### Core Components

Todos los componentes UI siguen este patrón:

| Componente | Archivo Sass | Clases BEM |
|------------|-------------|------------|
| Button | `components/_button.scss` | `.btn`, `.btn--primary`, `.btn__icon` |
| Card | `components/_card.scss` | `.card`, `.card__header`, `.card__content` |
| Input | `components/_input.scss` | `.input`, `.input--error` |
| Dialog | `components/_dialog.scss` | `.dialog`, `.dialog-overlay`, `.dialog__header` |
| Badge | `components/_badge.scss` | `.badge`, `.badge--success`, `.badge--error` |

### Component Development Pattern

1. **Crear archivo Sass del componente**
   ```bash
   touch src/styles/scss/components/_my-component.scss
   ```

2. **Implementar estilos con BEM + themify**
   ```scss
   .my-component {
     padding: $spacing-m;

     @include themify($themes) {
       background-color: themed('bg-primary');
       color: themed('text-primary');
     }

     &__element {
       // Estilos del elemento
     }

     &--modifier {
       // Estilos del modificador
     }
   }
   ```

3. **Importar en main.scss**
   ```scss
   @import 'components/my-component';
   ```

4. **Usar en JSX con clases simples**
   ```jsx
   const MyComponent = () => (
     <div className="my-component">
       <div className="my-component__element">Content</div>
     </div>
   );
   ```

---

## Development Guidelines

### Adding New Components

Cuando creates componentes nuevos:

1. **NO uses Tailwind** en nuevos componentes (fase de deprecación)
2. **Usa solo clases BEM** definidas en Sass
3. **Evita lógica condicional de estilos** en JSX
4. **Usa el mixin @themify** para estilos que dependen del tema
5. **Sigue la nomenclatura BEM** estrictamente

**Ejemplo correcto:**

```jsx
// ✅ CORRECTO
const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <h3 className="product-card__title">{product.name}</h3>
      <p className="product-card__price">{product.price}</p>
      <button className="btn btn--primary">Comprar</button>
    </div>
  );
};
```

**Ejemplo incorrecto:**

```jsx
// ❌ INCORRECTO - No hacer esto
import { useTheme } from '@/contexts/ThemeContext';

const ProductCard = ({ product }) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <div className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={isDark ? 'text-white' : 'text-black'}>
        {product.name}
      </h3>
    </div>
  );
};
```

### Theme Detection (Solo para lógica de negocio)

Si necesitas detectar el tema para **lógica de negocio** (no estilos):

```jsx
import { useTheme } from '@/contexts/ThemeContext';

const Analytics = () => {
  const { mode } = useTheme();

  // ✅ OK: Uso para telemetría o lógica
  useEffect(() => {
    telemetry.record('theme.mode', { mode });
  }, [mode]);

  // ❌ NO: Uso para estilos
  return (
    <div className={mode === 'dark' ? 'dark-styles' : 'light-styles'}>
      {/* ... */}
    </div>
  );
};
```

### Responsive Design

Los componentes deben ser responsive usando mixins Sass:

```scss
// Define breakpoints
$breakpoint-mobile: 640px;
$breakpoint-tablet: 768px;
$breakpoint-desktop: 1024px;

// Mixin para media queries
@mixin mobile {
  @media (max-width: $breakpoint-mobile) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: $breakpoint-mobile + 1) and (max-width: $breakpoint-tablet) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: $breakpoint-desktop) {
    @content;
  }
}

// Uso
.card {
  padding: $spacing-xxl;

  @include mobile {
    padding: $spacing-m;
  }

  @include tablet {
    padding: $spacing-l;
  }
}
```

---

## Migration Guide

### Estado de Migración

| Fase | Estado | Descripción |
|------|--------|-------------|
| Fase 1: Configuración Base | ⏳ Pendiente | Instalar Sass, crear estructura |
| Fase 2: Design Tokens | ⏳ Pendiente | Implementar variables y mixins |
| Fase 3: Componentes Base | ⏳ Pendiente | Migrar 11 componentes core |
| Fase 4: Componentes de Layout | ⏳ Pendiente | Migrar navigation, sidebar |
| Fase 5: Migración de Páginas | ⏳ Pendiente | Migrar todas las páginas |
| Fase 6: Deprecación Tailwind | ⏳ Pendiente | Eliminar completamente Tailwind |

### Componentes por Migrar

**Componentes Core:**
- [ ] Button
- [ ] Input
- [ ] Card
- [ ] Dialog/Modal
- [ ] Checkbox
- [ ] Switch
- [ ] Dropdown
- [ ] Badge
- [ ] Tooltip
- [ ] Progress Bar
- [ ] Spinner

**Componentes de Layout:**
- [ ] Navigation Bar
- [ ] Sidebar
- [ ] Grid System
- [ ] Header
- [ ] Footer

**Páginas:**
- [ ] Login
- [ ] Dashboard
- [ ] Products
- [ ] Clients
- [ ] Suppliers
- [ ] Sales
- [ ] Reservations
- [ ] Settings

### Patrón de Migración

Para cada componente:

1. **Leer el componente actual**
   - Identificar todas las variantes
   - Listar todos los estados
   - Documentar clases de Tailwind usadas

2. **Crear archivo SCSS**
   - `src/styles/scss/components/_[nombre].scss`
   - Implementar con BEM
   - Usar mixin `@themify` para estilos adaptativos

3. **Refactorizar JSX**
   - Eliminar todas las clases de Tailwind
   - Aplicar clases BEM simples
   - Eliminar lógica condicional de estilos

4. **Testing**
   - Verificar en light mode
   - Verificar en dark mode
   - Verificar responsive
   - Verificar accesibilidad

5. **Importar en main.scss**
   ```scss
   @import 'components/[nombre]';
   ```

---

## Testing

### Checklist de Testing

- [ ] **Temas funcionan**: Light y dark se aplican correctamente
- [ ] **Persistencia**: Tema se mantiene al recargar
- [ ] **Cambio instantáneo**: Sin delay perceptible
- [ ] **Consistencia**: Todos los componentes respetan el tema
- [ ] **Accesibilidad**: Focus visible, contraste adecuado
- [ ] **Responsive**: Funciona en mobile/tablet/desktop
- [ ] **Performance**: Sin lag, CSS optimizado
- [ ] **Build**: `pnpm build` completa sin errores

### Test Manual

```bash
# Iniciar dev server
pnpm dev

# En otra terminal, ejecutar tests
pnpm test

# Build de producción
pnpm build

# Preview de producción
pnpm preview
```

### Test de Accesibilidad

```bash
# Instalar axe-core (si no está instalado)
pnpm add -D @axe-core/playwright

# Ejecutar tests E2E con accesibilidad
pnpm test:e2e
```

---

## Performance

### Optimizaciones Implementadas

- ✅ **CSS generado una sola vez**: Sass compila en build-time
- ✅ **Sin cálculos runtime**: No JavaScript para calcular estilos
- ✅ **Mínimo overhead**: Solo cambio de clase en `<body>`
- ✅ **CSS critical inlined**: Estilos críticos en el HTML inicial
- ✅ **Lazy loading**: Estilos de páginas cargados bajo demanda

### Métricas Objetivo

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Theme switch time | < 50ms | TBD |
| First Contentful Paint | < 1.5s | TBD |
| Largest Contentful Paint | < 2.5s | TBD |
| Cumulative Layout Shift | < 0.1 | TBD |
| CSS Bundle Size | < 50KB (gzip) | TBD |

---

## Browser Support

El sistema soporta navegadores modernos que tienen:

- ✅ CSS Custom Properties (CSS Variables)
- ✅ ES6 Modules
- ✅ React 19 features
- ✅ Sass-generated CSS

**Navegadores soportados:**
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Opera 74+

---

## Troubleshooting

### Tema no se aplica

**Síntomas:** Los estilos no cambian al toggle del tema

**Soluciones:**
1. Verificar que `ThemeProvider` envuelve la app en `main.jsx`
2. Comprobar que la clase `.theme--light` o `.theme--dark` está en `<body>`
3. Verificar que el mixin `@themify` está importado en el componente
4. Revisar console por errores de Sass

### Estilos incorrectos

**Síntomas:** Componentes no se ven como esperado

**Soluciones:**
1. Verificar que el archivo SCSS está importado en `main.scss`
2. Comprobar que las clases BEM coinciden entre JSX y SCSS
3. Verificar que no hay conflictos con Tailwind (si coexisten temporalmente)
4. Hard refresh (`Ctrl+F5`) para limpiar cache

### Performance issues

**Síntomas:** Lag al cambiar tema o cargar páginas

**Soluciones:**
1. Verificar que no hay cálculos de estilo inline en JSX
2. Comprobar que los mixins no tienen loops innecesarios
3. Usar Chrome DevTools Performance tab para identificar bottlenecks
4. Considerar code splitting si el CSS es muy grande

---

## Documentation

### Documentos Relacionados

- **`FLUENT_DESIGN_SYSTEM.md`** - Especificaciones completas de design tokens y componentes
- **`FLUENT_IMPLEMENTATION_PROGRESS.md`** - Roadmap de migración y checklist
- **`THEME_GUIDE.md`** - Guía rápida para usuarios y testers
- **`GUIA_MVP_DESARROLLO.md`** - Guía de desarrollo MVP actualizada

### Recursos Externos

- [Fluent Design System 2](https://fluent2.microsoft.design/)
- [Microsoft Learn - Fluent UI](https://learn.microsoft.com/en-us/fluent-ui/web-components/)
- [Sass Documentation](https://sass-lang.com/documentation)
- [BEM Methodology](https://getbem.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Changelog

### Version 2.0 (2025-10-29)
- ✨ Migración a Sass + Fluent UI 2
- ✨ Simplificación a solo Light/Dark
- ✨ Implementación de BEM methodology
- ✨ ThemeContext simplificado
- 🗑️ Deprecación de Tailwind CSS
- 🗑️ Eliminación de next-themes
- 🗑️ Eliminación de múltiples temas (Neo, Material)

### Version 1.0 (2025-08-23)
- ✨ Sistema inicial con 6 variantes
- ✨ Tailwind CSS + CSS Variables
- ✨ next-themes integration
- ✨ Neo-Brutalism, Material, Fluent themes

---

**Última actualización:** 2025-10-29
**Mantenido por:** Equipo Frontend
**Versión del sistema:** 2.0 (Fluent UI 2 + Sass)
