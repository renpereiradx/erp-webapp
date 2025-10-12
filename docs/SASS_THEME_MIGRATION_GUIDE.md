# Guía de Migración a SASS para el Sistema de Temas

**Versión:** 1.0
**Fecha:** 2025-10-07
**Autor:** Gemini

## 1. Objetivo

Este documento describe el plan y el proceso para migrar el sistema de temas actual, basado en múltiples temas con Tailwind CSS y variables CSS, a un sistema unificado que utiliza **Sass (SCSS)** con un único tema en dos variantes: **claro (light)** y **oscuro (dark)**.

El objetivo es centralizar y modularizar los estilos, mejorar la mantenibilidad y reducir la dependencia de clases de utilidad condicionales en el JSX.

## 2. Análisis del Sistema Actual

El sistema de temas existente se basa en:
- **Múltiples Temas**: Soporta Neo-Brutalism, Material Design y Fluent, cada uno con variantes light/dark.
- **CSS Variables**: La tematización se logra mediante la anulación de un conjunto de variables CSS (`--background`, `--primary`, etc.) definidas en `src/App.css`.
- **Activación de Tema**: Un `ThemeContext` gestiona el tema activo, que se aplica como un atributo `data-theme` en el elemento `<html>`.
- **Estilo de Componentes**: Los componentes utilizan una combinación de clases de utilidad de Tailwind CSS y clases condicionales aplicadas en JSX para adaptarse al tema activo.

Si bien es funcional, este enfoque conduce a una lógica de estilo compleja dentro de los componentes y dificulta la coherencia a largo plazo.

## 3. Arquitectura Propuesta con Sass

Proponemos una arquitectura de Sass modular y escalable.

### 3.1. Estructura de Carpetas

Se creará la siguiente estructura dentro de `src/styles/`:

```
src/styles/
└── scss/
    ├── abstracts/
    │   ├── _variables.scss    # Variables de tema (colores, fuentes, etc.)
    │   ├── _mixins.scss       # Mixins reutilizables
    │   └── _functions.scss    # Funciones de Sass
    │
    ├── base/
    │   ├── _reset.scss        # Reseteo de estilos del navegador
    │   ├── _typography.scss   # Estilos base para la tipografía
    │   └── _base.scss         # Estilos para body, html, etc.
    │
    ├── components/
    │   ├── _button.scss       # Estilos para el componente Button
    │   ├── _card.scss         # Estilos para el componente Card
    │   └── ...                # Otros componentes
    │
    ├── layout/
    │   ├── _navigation.scss   # Estilos para la barra de navegación
    │   ├── _sidebar.scss      # Estilos para la barra lateral
    │   └── _grid.scss         # Estilos para el layout de grid
    │
    ├── pages/
    │   ├── _login.scss        # Estilos específicos para la página de Login
    │   └── ...                # Otras páginas
    │
    └── main.scss              # Archivo principal que importa todo
```

### 3.2. Convenciones
- **Nomenclatura BEM**: Se utilizará la metodología BEM (Block, Element, Modifier) para nombrar las clases CSS y evitar colisiones. Ejemplo: `.card`, `.card__header`, `.card--primary`.
- **Archivos Parciales**: Todos los archivos Sass, excepto `main.scss`, comenzarán con un guion bajo (`_`) para indicar que son parciales y no deben compilarse de forma independiente.

## 4. Configuración e Instalación

Para integrar Sass en el proyecto Vite, solo se necesita un paso.

### 4.1. Instalar Dependencia de Sass

Ejecuta el siguiente comando para añadir Sass como una dependencia de desarrollo:

```bash
pnpm add -D sass
```
Vite detectará automáticamente la dependencia y procesará los archivos `.scss` sin necesidad de configuración adicional en `vite.config.js`.

### 4.2. Importar Estilos Globales

Importa el archivo principal de Sass en el punto de entrada de tu aplicación, `src/main.jsx`:

```javascript
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './App.css'
import './styles/scss/main.scss' // <-- Añadir esta línea

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## 5. Implementación del Nuevo Tema

### 5.1. Definir Variables del Tema

En `src/styles/scss/abstracts/_variables.scss`, definiremos las paletas de colores para los modos claro y oscuro.

```scss
// src/styles/scss/abstracts/_variables.scss

// Paleta de colores base
$primary-color: #007bff;
$secondary-color: #6c757d;
$success-color: #28a745;
$danger-color: #dc3545;
$warning-color: #ffc107;
$info-color: #17a2b8;

$white: #fff;
$black: #000;
$gray-100: #f8f9fa;
$gray-800: #343a40;

// Definición de temas
$themes: (
  light: (
    background: $gray-100,
    text-color: $gray-800,
    primary: $primary-color,
    secondary: $secondary-color,
    card-bg: $white,
    border-color: #dee2e6
  ),
  dark: (
    background: $gray-800,
    text-color: $gray-100,
    primary: lighten($primary-color, 15%),
    secondary: lighten($secondary-color, 20%),
    card-bg: #495057,
    border-color: #495057
  )
);

// Mixin para aplicar temas
@mixin themify($themes) {
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

// Función para obtener un valor del tema actual
@function themed($key) {
  @return map-get($theme-map, $key);
}
```

### 5.2. Aplicar el Tema

El `ThemeContext` actual se simplificará para alternar una clase en el elemento `<body>` o `<html>`.

```jsx
// Lógica simplificada en ThemeContext.jsx
const toggleTheme = () => {
  const newMode = mode === 'light' ? 'dark' : 'light';
  setMode(newMode);
  document.body.classList.remove('theme--light', 'theme--dark');
  document.body.classList.add(`theme--${newMode}`);
  localStorage.setItem('theme-mode', newMode);
};
```

## 6. Proceso de Migración de Componentes

La migración se realizará componente por componente para minimizar el riesgo.

**Ejemplo: Migración de un componente `Button`**

**Antes (con Tailwind):**
```jsx
// src/components/ui/Button.jsx
const Button = ({ children, ...props }) => {
  const { theme } = useTheme(); // Hook del sistema antiguo
  const isNeo = theme?.includes('neo-brutalism');

  const baseClasses = "py-2 px-4 font-bold";
  const themeClasses = isNeo
    ? "border-4 border-black shadow-neo-brutal"
    : "rounded-lg shadow-md";
  const colorClasses = "bg-primary text-primary-foreground hover:bg-primary/90";

  return (
    <button className={`${baseClasses} ${themeClasses} ${colorClasses}`} {...props}>
      {children}
    </button>
  );
};
```

**Después (con Sass):**

**Paso 1: Limpiar el componente JSX**
```jsx
// src/components/ui/Button.jsx
const Button = ({ children, variant = 'primary', ...props }) => {
  return (
    <button className={`btn btn--${variant}`} {...props}>
      {children}
    </button>
  );
};
```

**Paso 2: Crear el archivo SCSS para el componente**
```scss
// src/styles/scss/components/_button.scss
@import '../abstracts/variables';
@import '../abstracts/mixins';

.btn {
  padding: 0.5rem 1rem;
  font-weight: bold;
  border: 2px solid transparent;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  @include themify($themes) {
    background-color: themed('primary');
    color: themed('text-color');
    border-color: themed('primary');
  }

  &:hover {
    @include themify($themes) {
      background-color: darken(themed('primary'), 10%);
    }
  }

  // Modificador de variante
  &--secondary {
    @include themify($themes) {
      background-color: themed('secondary');
      border-color: themed('secondary');

      &:hover {
        background-color: darken(themed('secondary'), 10%);
      }
    }
  }
}
```

**Paso 3: Importar el SCSS en `main.scss`**
```scss
// src/styles/scss/main.scss
// ...
@import 'components/button';
// ...
```

## 7. Directrices para Nuevos Componentes

Todos los nuevos componentes y páginas deben seguir el nuevo enfoque basado en Sass desde el principio:
1.  Crear un archivo `.scss` dedicado en `src/styles/scss/components/` o `src/styles/scss/pages/`.
2.  Utilizar la nomenclatura BEM para las clases.
3.  Aplicar estilos temáticos utilizando el mixin `themify` y la función `themed`.
4.  Importar el nuevo archivo SCSS en `main.scss`.
5.  Mantener el JSX limpio de clases de estilo, utilizando únicamente clases semánticas BEM.

## 8. Plan de Deprecación

1.  **Fase de Migración Activa**: Ambos sistemas (Tailwind y Sass) coexistirán. Las páginas y componentes se migrarán de forma incremental.
2.  **Bloqueo de Nuevos Usos de Tailwind**: Una vez que la mayoría de los componentes principales estén migrados, se desaconsejará el uso de nuevas clases de Tailwind para estilos complejos.
3.  **Limpieza Final**: Cuando todos los componentes hayan sido migrados, se procederá a:
    - Desinstalar `tailwindcss` y sus dependencias.
    - Eliminar la configuración de Tailwind de `vite.config.js`.
    - Eliminar las definiciones de temas y variables CSS de `src/App.css` y `src/index.css`.
    - Refactorizar y eliminar el antiguo `ThemeContext` y los hooks asociados.

Este enfoque gradual garantiza que la aplicación permanezca funcional durante toda la migración y permite que el equipo se adapte progresivamente al nuevo sistema de estilos.
