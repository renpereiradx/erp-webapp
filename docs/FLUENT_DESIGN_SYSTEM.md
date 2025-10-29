# Sistema de Diseño Fluent 2 - Guía de Implementación

**Versión:** 2.0
**Fecha:** 2025-10-29
**Basado en:** Microsoft Fluent Design System 2
**Propósito:** Guía profesional completa para desarrolladores web

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Principios de Diseño](#2-principios-de-diseño)
3. [Arquitectura de Design Tokens](#3-arquitectura-de-design-tokens)
4. [Sistema de Color](#4-sistema-de-color)
5. [Tipografía](#5-tipografía)
6. [Espaciado y Layout](#6-espaciado-y-layout)
7. [Elevación y Sombras](#7-elevación-y-sombras)
8. [Bordes y Border Radius](#8-bordes-y-border-radius)
9. [Animaciones y Transiciones](#9-animaciones-y-transiciones)
10. [Componentes UI](#10-componentes-ui)
11. [Accesibilidad](#11-accesibilidad)
12. [Implementación en Sass](#12-implementación-en-sass)

---

## 1. Introducción

### 1.1. ¿Qué es Fluent Design System?

Fluent Design System 2 es el sistema de diseño oficial de Microsoft, diseñado para crear experiencias de usuario coherentes, accesibles e intuitivas a través de todas las plataformas. Se basa en cinco pilares fundamentales: **luz (light)**, **profundidad (depth)**, **movimiento (motion)**, **material** y **escala (scale)**.

### 1.2. Objetivos de este Documento

Este documento proporciona una guía completa para implementar Fluent Design System 2 en aplicaciones web utilizando Sass/SCSS, incluyendo:

- Definición exhaustiva de todos los design tokens
- Especificaciones técnicas precisas para cada componente
- Ejemplos de código prácticos
- Guías de accesibilidad WCAG 2.1 AA/AAA
- Patrones de implementación con Sass

---

## 2. Principios de Diseño

### 2.1. Principios Fundamentales

#### **Innovación**
Utilizar tecnologías modernas y patrones de diseño que anticipen las necesidades futuras del usuario.

#### **Claridad**
Interfaces limpias y enfocadas que eliminan la fricción y facilitan la toma de decisiones.

#### **Inclusividad**
Diseñar para todos, considerando diferentes capacidades, contextos y dispositivos.

#### **Centrado en el Usuario**
Priorizar las necesidades reales del usuario sobre las preferencias estéticas.

#### **Consistencia**
Mantener patrones coherentes que generen familiaridad y reducen la carga cognitiva.

### 2.2. Los Cinco Pilares

#### **Luz (Light)**
Utilizar la luz para dirigir la atención, crear profundidad y revelar jerarquía.

#### **Profundidad (Depth)**
Crear capas visuales que organizan contenido y establecen relaciones espaciales.

#### **Movimiento (Motion)**
Transiciones significativas que guían al usuario y comunican relaciones entre elementos.

#### **Material**
Superficies y texturas que se comportan de manera física y predecible.

#### **Escala (Scale)**
Diseño responsive que se adapta fluidamente a diferentes tamaños de pantalla.

---

## 3. Arquitectura de Design Tokens

### 3.1. Sistema de Dos Capas

Fluent utiliza una arquitectura de tokens de dos niveles:

#### **Global Tokens (Capa 1)**
Tokens agnósticos de contexto que almacenan valores primitivos.

```scss
// Ejemplo de Global Tokens
$color-blue-10: #061724;
$color-blue-60: #0078D4;
$color-gray-10: #faf9f8;
$spacing-xs: 4px;
$font-size-300: 14px;
```

#### **Alias Tokens (Capa 2)**
Tokens semánticos que referencian global tokens y añaden significado contextual.

```scss
// Ejemplo de Alias Tokens
$color-background-primary: $color-gray-10;
$color-text-primary: $color-gray-160;
$color-action-primary: $color-blue-60;
$spacing-component-padding: $spacing-md;
```

### 3.2. Categorías de Tokens

- **Color Tokens**: Paletas neutrales, de marca y semánticas
- **Typography Tokens**: Fuentes, tamaños, pesos, alturas de línea
- **Spacing Tokens**: Sistema de espaciado base-8
- **Border Tokens**: Radios y anchos de borde
- **Shadow Tokens**: Elevaciones y profundidad
- **Animation Tokens**: Duraciones, timing functions

---

## 4. Sistema de Color

### 4.1. Filosofía del Color

El sistema de color de Fluent está construido sobre tres pilares:

1. **Accesibilidad**: Cumple con WCAG 2.1 AA/AAA
2. **Adaptabilidad**: Transición fluida entre modos claro y oscuro
3. **Consistencia Perceptual**: Uniformidad visual en todos los colores

### 4.2. Paleta de Colores Neutrales

#### **Neutral Colors - Light Theme**

```scss
// Escala de grises para tema claro (de más claro a más oscuro)
$neutral-gray-4: #faf9f8;    // Fondos alternativos muy sutiles
$neutral-gray-8: #f3f2f1;    // Fondos de superficie secundaria
$neutral-gray-10: #edebe9;   // Fondos de superficie principal
$neutral-gray-14: #e1dfdd;   // Bordes sutiles
$neutral-gray-16: #d2d0ce;   // Bordes estándar
$neutral-gray-20: #c8c6c4;   // Bordes enfatizados
$neutral-gray-24: #a19f9d;   // Texto terciario, iconos deshabilitados
$neutral-gray-38: #8a8886;   // Texto secundario enfatizado
$neutral-gray-46: #605e5c;   // Texto secundario
$neutral-gray-52: #3b3a39;   // Texto primario alternativo
$neutral-gray-54: #323130;   // Texto primario
$neutral-gray-62: #201f1e;   // Texto de alto contraste
$neutral-gray-82: #000000;   // Negro puro

$neutral-white: #ffffff;     // Blanco puro
```

#### **Neutral Colors - Dark Theme**

```scss
// Escala de grises para tema oscuro (de más oscuro a más claro)
$neutral-gray-2: #0a0a0a;    // Fondo base muy oscuro
$neutral-gray-4-dark: #1a1a1a;    // Fondo base oscuro
$neutral-gray-6: #242424;    // Fondo de superficie principal
$neutral-gray-8-dark: #292929;    // Fondo de superficie secundaria
$neutral-gray-10-dark: #2e2e2e;   // Fondos de componentes
$neutral-gray-12: #333333;   // Fondos elevados
$neutral-gray-14-dark: #383838;   // Bordes sutiles
$neutral-gray-16-dark: #424242;   // Bordes estándar
$neutral-gray-20-dark: #4d4d4d;   // Bordes enfatizados
$neutral-gray-24-dark: #5c5c5c;   // Texto terciario
$neutral-gray-36: #858585;   // Texto secundario
$neutral-gray-46-dark: #a3a3a3;   // Texto secundario enfatizado
$neutral-gray-54-dark: #c7c7c7;   // Texto primario alternativo
$neutral-gray-60: #d6d6d6;   // Texto primario
$neutral-gray-68: #e0e0e0;   // Texto de alto contraste
$neutral-gray-90: #f5f5f5;   // Texto máximo contraste

$neutral-black: #000000;     // Negro puro
```

### 4.3. Paleta de Colores de Marca (Brand)

La paleta de marca utiliza una rampa de 16 valores (10-160) para proporcionar máxima flexibilidad.

#### **Brand Colors - Default Blue (Referencia)**

```scss
// Brand Ramp - Tema Azul por Defecto
$brand-10: #061724;    // Azul más oscuro - fondos en dark mode
$brand-20: #082338;    // Azul muy oscuro
$brand-30: #0a2e4a;    // Azul oscuro
$brand-40: #0c3b5e;    // Azul medio-oscuro
$brand-50: #0e4775;    // Azul medio
$brand-60: #0078d4;    // PRIMARY - Azul Fluent principal
$brand-70: #1890f1;    // Azul claro
$brand-80: #3aa0f3;    // Azul más claro
$brand-90: #5caef5;    // Azul brillante
$brand-100: #7dbcf7;   // Azul muy brillante
$brand-110: #9dcaf9;   // Azul pálido
$brand-120: #b8d8fb;   // Azul muy pálido
$brand-130: #d1e6fc;   // Azul casi blanco
$brand-140: #e7f3fe;   // Azul tinte muy sutil
$brand-150: #f3f9ff;   // Azul tinte mínimo
$brand-160: #fafcff;   // Azul imperceptible (fondos light)
```

#### **Cómo Personalizar los Colores de Marca**

Para crear tu propia paleta de marca, mantén la misma estructura de 16 valores:

```scss
// Ejemplo: Brand Ramp Personalizado - Verde
$brand-custom-10: #001a00;
$brand-custom-20: #002700;
$brand-custom-30: #00360c;
$brand-custom-40: #004612;
$brand-custom-50: #005618;
$brand-custom-60: #00671f;  // Color primario de tu marca
$brand-custom-70: #007826;
$brand-custom-80: #218935;
$brand-custom-90: #3e9949;
$brand-custom-100: #59a85e;
$brand-custom-110: #73b776;
$brand-custom-120: #8ec68f;
$brand-custom-130: #aad5a9;
$brand-custom-140: #c6e4c5;
$brand-custom-150: #e2f2e2;
$brand-custom-160: #f1f8f1;
```

### 4.4. Colores Semánticos

#### **Success (Éxito)**

```scss
// Success Colors - Light Theme
$success-10: #0e3b0e;
$success-20: #135c13;
$success-30: #107c10;  // Success principal
$success-40: #13a10e;
$success-50: #27ac22;
$success-background-light: #dff6dd;
$success-foreground-light: #0e700e;

// Success Colors - Dark Theme
$success-10-dark: #92c353;
$success-20-dark: #9ccf5a;
$success-30-dark: #a7db61;  // Success principal dark
$success-background-dark: #1e3a1e;
$success-foreground-dark: #9ccf5a;
```

#### **Warning (Advertencia)**

```scss
// Warning Colors - Light Theme
$warning-10: #4d3800;
$warning-20: #705000;
$warning-30: #f7630c;  // Warning principal
$warning-40: #ff8c00;
$warning-50: #ffa328;
$warning-background-light: #fff4ce;
$warning-foreground-light: #8a5100;

// Warning Colors - Dark Theme
$warning-10-dark: #f7a800;
$warning-20-dark: #f9b500;
$warning-30-dark: #fcc419;  // Warning principal dark
$warning-background-dark: #3d3000;
$warning-foreground-dark: #f9b500;
```

#### **Error (Error)**

```scss
// Error Colors - Light Theme
$error-10: #4c0d0d;
$error-20: #751818;
$error-30: #a4262c;  // Error principal
$error-40: #c50f1f;
$error-50: #d13438;
$error-background-light: #fde7e9;
$error-foreground-light: #a80000;

// Error Colors - Dark Theme
$error-10-dark: #e74856;
$error-20-dark: #ea5b64;
$error-30-dark: #ee6e75;  // Error principal dark
$error-background-dark: #3d1518;
$error-foreground-dark: #ea5b64;
```

#### **Info (Información)**

```scss
// Info Colors - Light Theme
$info-10: #002c4e;
$info-20: #004377;
$info-30: #0078d4;  // Info principal (usa brand blue)
$info-40: #1890f1;
$info-50: #3aa0f3;
$info-background-light: #e6f4ff;
$info-foreground-light: #004e91;

// Info Colors - Dark Theme
$info-10-dark: #3aa0f3;
$info-20-dark: #5caef5;
$info-30-dark: #7dbcf7;  // Info principal dark
$info-background-dark: #1a2e3d;
$info-foreground-dark: #5caef5;
```

### 4.5. Tokens de Color Semánticos

#### **Light Theme - Semantic Tokens**

```scss
// Backgrounds
$color-background-primary: $neutral-white;
$color-background-secondary: $neutral-gray-8;
$color-background-tertiary: $neutral-gray-10;
$color-background-disabled: $neutral-gray-14;
$color-background-overlay: rgba(0, 0, 0, 0.4);

// Text
$color-text-primary: $neutral-gray-54;
$color-text-secondary: $neutral-gray-46;
$color-text-tertiary: $neutral-gray-38;
$color-text-disabled: $neutral-gray-24;
$color-text-on-primary: $neutral-white;
$color-text-on-error: $neutral-white;

// Borders
$color-border-default: $neutral-gray-16;
$color-border-subtle: $neutral-gray-14;
$color-border-strong: $neutral-gray-20;
$color-border-disabled: $neutral-gray-14;

// Actions (Buttons, Links)
$color-action-primary: $brand-60;
$color-action-primary-hover: $brand-70;
$color-action-primary-pressed: $brand-50;
$color-action-primary-disabled: $neutral-gray-24;

// States
$color-state-hover-overlay: rgba(0, 0, 0, 0.05);
$color-state-pressed-overlay: rgba(0, 0, 0, 0.08);
$color-state-selected-background: $brand-140;
$color-state-focus-border: $brand-60;
```

#### **Dark Theme - Semantic Tokens**

```scss
// Backgrounds
$color-background-primary-dark: $neutral-gray-6;
$color-background-secondary-dark: $neutral-gray-8-dark;
$color-background-tertiary-dark: $neutral-gray-10-dark;
$color-background-disabled-dark: $neutral-gray-14-dark;
$color-background-overlay-dark: rgba(0, 0, 0, 0.6);

// Text
$color-text-primary-dark: $neutral-gray-60;
$color-text-secondary-dark: $neutral-gray-46-dark;
$color-text-tertiary-dark: $neutral-gray-36;
$color-text-disabled-dark: $neutral-gray-24-dark;
$color-text-on-primary-dark: $neutral-black;
$color-text-on-error-dark: $neutral-black;

// Borders
$color-border-default-dark: $neutral-gray-16-dark;
$color-border-subtle-dark: $neutral-gray-14-dark;
$color-border-strong-dark: $neutral-gray-20-dark;
$color-border-disabled-dark: $neutral-gray-14-dark;

// Actions
$color-action-primary-dark: $brand-90;
$color-action-primary-hover-dark: $brand-100;
$color-action-primary-pressed-dark: $brand-80;
$color-action-primary-disabled-dark: $neutral-gray-24-dark;

// States
$color-state-hover-overlay-dark: rgba(255, 255, 255, 0.08);
$color-state-pressed-overlay-dark: rgba(255, 255, 255, 0.12);
$color-state-selected-background-dark: $brand-20;
$color-state-focus-border-dark: $brand-90;
```

---

## 5. Tipografía

### 5.1. Familias de Fuentes

```scss
// Font Families
$font-family-base: 'Segoe UI', -apple-system, BlinkMacSystemFont,
                   'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
                   'Helvetica Neue', sans-serif;

$font-family-monospace: 'Cascadia Code', 'Consolas', 'Courier New', monospace;

$font-family-numeric: 'Bahnschrift', 'DIN Alternate', $font-family-base;
```

### 5.2. Type Ramp (Escala Tipográfica)

Fluent utiliza un sistema de numeración de 100-900 para los tamaños de fuente.

```scss
// Font Sizes
$font-size-100: 10px;   // Caption/Metadata muy pequeño
$font-size-200: 12px;   // Caption/Metadata
$font-size-300: 14px;   // Body/Base - TAMAÑO BASE
$font-size-400: 16px;   // Body Large
$font-size-500: 18px;   // Subtitle 2
$font-size-600: 20px;   // Subtitle 1
$font-size-700: 24px;   // Title 3
$font-size-800: 28px;   // Title 2
$font-size-900: 32px;   // Title 1
$font-size-1000: 40px;  // Large Title
$font-size-1100: 52px;  // Display

// Line Heights (relativas)
$line-height-100: 14px;   // 1.4 ratio
$line-height-200: 16px;   // 1.33 ratio
$line-height-300: 20px;   // 1.43 ratio - BASE
$line-height-400: 22px;   // 1.375 ratio
$line-height-500: 24px;   // 1.33 ratio
$line-height-600: 28px;   // 1.4 ratio
$line-height-700: 32px;   // 1.33 ratio
$line-height-800: 36px;   // 1.29 ratio
$line-height-900: 40px;   // 1.25 ratio
$line-height-1000: 52px;  // 1.3 ratio
$line-height-1100: 64px;  // 1.23 ratio
```

### 5.3. Font Weights

```scss
$font-weight-regular: 400;
$font-weight-medium: 500;   // Usado en subtítulos y énfasis
$font-weight-semibold: 600; // Usado en títulos y botones
$font-weight-bold: 700;     // Raramente usado, solo para énfasis fuerte
```

### 5.4. Type Styles (Estilos Predefinidos)

```scss
// Mixin para aplicar estilos tipográficos completos
@mixin type-caption {
  font-family: $font-family-base;
  font-size: $font-size-200;
  line-height: $line-height-200;
  font-weight: $font-weight-regular;
}

@mixin type-body {
  font-family: $font-family-base;
  font-size: $font-size-300;
  line-height: $line-height-300;
  font-weight: $font-weight-regular;
}

@mixin type-body-strong {
  font-family: $font-family-base;
  font-size: $font-size-300;
  line-height: $line-height-300;
  font-weight: $font-weight-semibold;
}

@mixin type-body-large {
  font-family: $font-family-base;
  font-size: $font-size-400;
  line-height: $line-height-400;
  font-weight: $font-weight-regular;
}

@mixin type-subtitle {
  font-family: $font-family-base;
  font-size: $font-size-500;
  line-height: $line-height-500;
  font-weight: $font-weight-semibold;
}

@mixin type-title-3 {
  font-family: $font-family-base;
  font-size: $font-size-700;
  line-height: $line-height-700;
  font-weight: $font-weight-semibold;
}

@mixin type-title-2 {
  font-family: $font-family-base;
  font-size: $font-size-800;
  line-height: $line-height-800;
  font-weight: $font-weight-semibold;
}

@mixin type-title-1 {
  font-family: $font-family-base;
  font-size: $font-size-900;
  line-height: $line-height-900;
  font-weight: $font-weight-semibold;
}

@mixin type-display {
  font-family: $font-family-base;
  font-size: $font-size-1100;
  line-height: $line-height-1100;
  font-weight: $font-weight-semibold;
}
```

---

## 6. Espaciado y Layout

### 6.1. Sistema de Espaciado Base-4

Fluent utiliza un sistema de espaciado basado en múltiplos de 4px para mantener consistencia y alineación perfecta en pixel.

```scss
// Spacing Scale (múltiplos de 4px)
$spacing-none: 0;
$spacing-xxs: 2px;    // Casos muy excepcionales
$spacing-xs: 4px;     // Espaciado mínimo
$spacing-s-nudge: 6px; // Ajuste sutil
$spacing-s: 8px;      // Espaciado pequeño
$spacing-m-nudge: 10px;
$spacing-m: 12px;     // Espaciado medio
$spacing-l: 16px;     // Espaciado grande - MÁS COMÚN
$spacing-xl: 20px;
$spacing-xxl: 24px;   // Espaciado extra grande
$spacing-xxxl: 32px;  // Secciones
$spacing-huge: 40px;
$spacing-massive: 48px;
$spacing-giant: 64px;
```

### 6.2. Component Spacing (Espaciado de Componentes)

```scss
// Padding interno de componentes
$component-padding-xs: $spacing-xs $spacing-s;     // 4px 8px
$component-padding-s: $spacing-s $spacing-m;       // 8px 12px
$component-padding-m: $spacing-m $spacing-l;       // 12px 16px
$component-padding-l: $spacing-l $spacing-xl;      // 16px 20px

// Gaps entre elementos
$component-gap-xs: $spacing-xs;    // 4px
$component-gap-s: $spacing-s;      // 8px
$component-gap-m: $spacing-m;      // 12px
$component-gap-l: $spacing-l;      // 16px
$component-gap-xl: $spacing-xxl;   // 24px
```

### 6.3. Layout Tokens

```scss
// Container widths
$container-width-xs: 480px;
$container-width-s: 640px;
$container-width-m: 768px;
$container-width-l: 1024px;
$container-width-xl: 1280px;
$container-width-xxl: 1536px;

// Layout spacing
$layout-gutter: $spacing-l;        // 16px
$layout-section-gap: $spacing-xxxl; // 32px
$layout-page-padding: $spacing-xxl; // 24px
```

---

## 7. Elevación y Sombras

### 7.1. Sistema de Elevación

Fluent utiliza un sistema de 64 niveles de elevación, pero en la práctica se utilizan principalmente 8 niveles.

```scss
// Shadow Elevation Levels
$shadow-2: 0 0 2px rgba(0, 0, 0, 0.12),
           0 1px 2px rgba(0, 0, 0, 0.14);

$shadow-4: 0 0 2px rgba(0, 0, 0, 0.12),
           0 2px 4px rgba(0, 0, 0, 0.14);

$shadow-8: 0 0 2px rgba(0, 0, 0, 0.12),
           0 4px 8px rgba(0, 0, 0, 0.14);

$shadow-16: 0 0 2px rgba(0, 0, 0, 0.12),
            0 8px 16px rgba(0, 0, 0, 0.14);

$shadow-28: 0 0 8px rgba(0, 0, 0, 0.12),
            0 14px 28px rgba(0, 0, 0, 0.18);

$shadow-64: 0 0 8px rgba(0, 0, 0, 0.12),
            0 32px 64px rgba(0, 0, 0, 0.24);
```

### 7.2. Dark Theme Shadows

En tema oscuro, las sombras son más sutiles y a veces se complementan con bordes.

```scss
// Dark Theme Shadows (más sutiles)
$shadow-2-dark: 0 0 2px rgba(0, 0, 0, 0.24),
                0 1px 2px rgba(0, 0, 0, 0.28);

$shadow-4-dark: 0 0 2px rgba(0, 0, 0, 0.24),
                0 2px 4px rgba(0, 0, 0, 0.28);

$shadow-8-dark: 0 0 2px rgba(0, 0, 0, 0.24),
                0 4px 8px rgba(0, 0, 0, 0.28);

$shadow-16-dark: 0 0 2px rgba(0, 0, 0, 0.24),
                 0 8px 16px rgba(0, 0, 0, 0.32);

$shadow-28-dark: 0 0 8px rgba(0, 0, 0, 0.24),
                 0 14px 28px rgba(0, 0, 0, 0.36);

$shadow-64-dark: 0 0 8px rgba(0, 0, 0, 0.24),
                 0 32px 64px rgba(0, 0, 0, 0.48);
```

### 7.3. Semantic Elevation Tokens

```scss
// Uso semántico de elevaciones
$elevation-card: $shadow-2;
$elevation-card-hover: $shadow-8;
$elevation-flyout: $shadow-16;
$elevation-dialog: $shadow-28;
$elevation-tooltip: $shadow-8;
$elevation-dropdown: $shadow-16;
```

---

## 8. Bordes y Border Radius

### 8.1. Border Widths

```scss
$border-width-thin: 1px;    // Bordes estándar
$border-width-thick: 2px;   // Bordes enfatizados
$border-width-thicker: 3px; // Estados de foco
```

### 8.2. Border Radius

Fluent 2 utiliza bordes más suaves y redondeados comparado con versiones anteriores.

```scss
// Border Radius Scale
$border-radius-none: 0;
$border-radius-small: 2px;   // Elementos muy pequeños
$border-radius-medium: 4px;  // Botones, inputs - MÁS COMÚN
$border-radius-large: 6px;   // Cards, containers
$border-radius-xlarge: 8px;  // Dialogs, surfaces grandes
$border-radius-circular: 50%; // Avatares, pills

// Semantic Border Radius
$border-radius-button: $border-radius-medium;
$border-radius-input: $border-radius-medium;
$border-radius-card: $border-radius-large;
$border-radius-dialog: $border-radius-xlarge;
```

---

## 9. Animaciones y Transiciones

### 9.1. Duraciones

```scss
// Animation Durations
$duration-ultra-fast: 50ms;    // Feedback inmediato
$duration-faster: 100ms;       // Hover states
$duration-fast: 150ms;         // Transiciones rápidas
$duration-normal: 200ms;       // Duración estándar
$duration-slow: 300ms;         // Transiciones complejas
$duration-slower: 400ms;       // Animaciones elaboradas
$duration-ultra-slow: 500ms;   // Animaciones de entrada/salida
```

### 9.2. Easing Functions (Timing Functions)

Fluent utiliza curvas de aceleración naturales basadas en física.

```scss
// Easing Functions
$ease-linear: linear;
$ease-ease-max: cubic-bezier(0.8, 0, 0.1, 1);        // Movimiento rápido
$ease-ease: cubic-bezier(0.33, 0, 0.67, 1);          // Estándar
$ease-decelerate: cubic-bezier(0.1, 0.9, 0.2, 1);    // Entrada rápida, salida lenta
$ease-accelerate: cubic-bezier(0.9, 0.1, 1, 0.2);    // Entrada lenta, salida rápida
$ease-max-ease-in: cubic-bezier(0.8, 0, 1, 1);       // Aceleración fuerte
$ease-max-ease-out: cubic-bezier(0, 0, 0.2, 1);      // Desaceleración fuerte
```

### 9.3. Transiciones Comunes

```scss
// Transiciones predefinidas
$transition-background: background-color $duration-fast $ease-ease;
$transition-color: color $duration-fast $ease-ease;
$transition-border: border-color $duration-fast $ease-ease;
$transition-shadow: box-shadow $duration-normal $ease-decelerate;
$transition-transform: transform $duration-normal $ease-decelerate;
$transition-opacity: opacity $duration-fast $ease-linear;

// Transición all (usar con precaución)
$transition-all: all $duration-normal $ease-ease;
```

---

## 10. Componentes UI

### 10.1. Button (Botón)

#### **Anatomía**
- Padding: 5px 12px (small), 8px 16px (medium), 11px 20px (large)
- Min-height: 24px (small), 32px (medium), 40px (large)
- Border-radius: $border-radius-medium (4px)
- Font: $font-size-300, $font-weight-semibold

#### **Variantes**

**Primary Button**
```scss
.button--primary {
  background-color: $color-action-primary;
  color: $color-text-on-primary;
  border: none;

  &:hover {
    background-color: $color-action-primary-hover;
  }

  &:active {
    background-color: $color-action-primary-pressed;
  }

  &:disabled {
    background-color: $color-background-disabled;
    color: $color-text-disabled;
    cursor: not-allowed;
  }
}
```

**Secondary Button (Outline)**
```scss
.button--secondary {
  background-color: transparent;
  color: $color-action-primary;
  border: $border-width-thin solid $color-border-default;

  &:hover {
    background-color: $color-state-hover-overlay;
    border-color: $color-action-primary;
  }

  &:active {
    background-color: $color-state-pressed-overlay;
  }
}
```

**Subtle Button (Ghost)**
```scss
.button--subtle {
  background-color: transparent;
  color: $color-text-primary;
  border: none;

  &:hover {
    background-color: $color-state-hover-overlay;
  }

  &:active {
    background-color: $color-state-pressed-overlay;
  }
}
```

#### **Estados de Foco**
```scss
.button:focus-visible {
  outline: $border-width-thick solid $color-state-focus-border;
  outline-offset: 2px;
}
```

### 10.2. Input (Campo de Texto)

#### **Anatomía**
- Padding: 0 12px
- Height: 32px (medium), 24px (small), 40px (large)
- Border-radius: $border-radius-medium (4px)
- Border: 1px solid
- Font: $font-size-300

#### **Estados**

```scss
.input {
  padding: 0 $spacing-m;
  height: 32px;
  border: $border-width-thin solid $color-border-default;
  border-radius: $border-radius-input;
  background-color: $color-background-primary;
  color: $color-text-primary;
  font-size: $font-size-300;
  transition: $transition-border, $transition-shadow;

  &::placeholder {
    color: $color-text-tertiary;
  }

  &:hover {
    border-color: $color-border-strong;
  }

  &:focus {
    border-color: $color-state-focus-border;
    box-shadow: 0 0 0 1px $color-state-focus-border;
    outline: none;
  }

  &:disabled {
    background-color: $color-background-disabled;
    border-color: $color-border-disabled;
    color: $color-text-disabled;
    cursor: not-allowed;
  }

  &.input--error {
    border-color: $error-30;

    &:focus {
      border-color: $error-30;
      box-shadow: 0 0 0 1px $error-30;
    }
  }
}
```

### 10.3. Card (Tarjeta)

#### **Anatomía**
- Padding: 16px (small), 20px (medium), 24px (large)
- Border-radius: $border-radius-large (6px)
- Background: Superficie secundaria
- Border: Opcional, 1px solid
- Shadow: $shadow-2 (default), $shadow-8 (hover)

```scss
.card {
  padding: $spacing-xl;
  border-radius: $border-radius-card;
  background-color: $color-background-secondary;
  border: $border-width-thin solid $color-border-subtle;
  box-shadow: $elevation-card;
  transition: $transition-shadow;

  &:hover {
    box-shadow: $elevation-card-hover;
  }

  &--interactive {
    cursor: pointer;

    &:active {
      transform: translateY(1px);
    }
  }
}

.card__header {
  margin-bottom: $spacing-m;
  @include type-subtitle;
}

.card__content {
  @include type-body;
  color: $color-text-secondary;
}
```

### 10.4. Dialog (Cuadro de Diálogo)

#### **Anatomía**
- Max-width: 480px (small), 640px (medium), 800px (large)
- Padding: 24px
- Border-radius: $border-radius-xlarge (8px)
- Shadow: $shadow-64
- Overlay: rgba(0, 0, 0, 0.4)

```scss
.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: $color-background-overlay;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn $duration-normal $ease-ease;
}

.dialog {
  background-color: $color-background-primary;
  border-radius: $border-radius-dialog;
  box-shadow: $shadow-64;
  padding: $spacing-xxl;
  max-width: 640px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
  animation: scaleIn $duration-slow $ease-decelerate;
}

.dialog__header {
  @include type-title-2;
  margin-bottom: $spacing-l;
}

.dialog__content {
  @include type-body;
  margin-bottom: $spacing-xxl;
}

.dialog__footer {
  display: flex;
  gap: $spacing-s;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 10.5. Checkbox

```scss
.checkbox {
  display: inline-flex;
  align-items: center;
  cursor: pointer;

  &__input {
    appearance: none;
    width: 16px;
    height: 16px;
    border: $border-width-thin solid $color-border-default;
    border-radius: $border-radius-small;
    background-color: $color-background-primary;
    cursor: pointer;
    position: relative;
    transition: $transition-background, $transition-border;

    &:hover {
      border-color: $color-border-strong;
    }

    &:checked {
      background-color: $color-action-primary;
      border-color: $color-action-primary;

      &::after {
        content: '';
        position: absolute;
        left: 4px;
        top: 1px;
        width: 5px;
        height: 9px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
    }

    &:focus-visible {
      outline: $border-width-thick solid $color-state-focus-border;
      outline-offset: 2px;
    }

    &:disabled {
      background-color: $color-background-disabled;
      border-color: $color-border-disabled;
      cursor: not-allowed;
    }
  }

  &__label {
    margin-left: $spacing-s;
    @include type-body;
    cursor: pointer;
  }
}
```

### 10.6. Switch (Toggle)

```scss
.switch {
  display: inline-flex;
  align-items: center;
  cursor: pointer;

  &__track {
    width: 40px;
    height: 20px;
    border-radius: 10px;
    background-color: $color-border-strong;
    position: relative;
    transition: $transition-background;
    cursor: pointer;

    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: white;
      top: 2px;
      left: 2px;
      transition: transform $duration-normal $ease-decelerate;
      box-shadow: $shadow-2;
    }
  }

  &__input {
    display: none;

    &:checked + .switch__track {
      background-color: $color-action-primary;

      &::after {
        transform: translateX(20px);
      }
    }

    &:focus-visible + .switch__track {
      outline: $border-width-thick solid $color-state-focus-border;
      outline-offset: 2px;
    }

    &:disabled + .switch__track {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__label {
    margin-left: $spacing-s;
    @include type-body;
  }
}
```

### 10.7. Dropdown / Select

```scss
.dropdown {
  position: relative;
  width: 100%;

  &__trigger {
    width: 100%;
    padding: 0 $spacing-m;
    height: 32px;
    border: $border-width-thin solid $color-border-default;
    border-radius: $border-radius-medium;
    background-color: $color-background-primary;
    color: $color-text-primary;
    font-size: $font-size-300;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: $transition-border;

    &:hover {
      border-color: $color-border-strong;
    }

    &:focus {
      border-color: $color-state-focus-border;
      box-shadow: 0 0 0 1px $color-state-focus-border;
      outline: none;
    }
  }

  &__menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background-color: $color-background-primary;
    border: $border-width-thin solid $color-border-default;
    border-radius: $border-radius-medium;
    box-shadow: $elevation-dropdown;
    max-height: 300px;
    overflow-y: auto;
    z-index: 100;
    animation: slideDown $duration-fast $ease-decelerate;
  }

  &__item {
    padding: $spacing-s $spacing-m;
    cursor: pointer;
    transition: $transition-background;
    @include type-body;

    &:hover {
      background-color: $color-state-hover-overlay;
    }

    &--selected {
      background-color: $color-state-selected-background;
      color: $color-action-primary;
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 10.8. Badge

```scss
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px $spacing-s;
  border-radius: $border-radius-circular;
  font-size: $font-size-200;
  font-weight: $font-weight-semibold;
  line-height: $line-height-200;

  &--default {
    background-color: $neutral-gray-14;
    color: $color-text-primary;
  }

  &--success {
    background-color: $success-background-light;
    color: $success-foreground-light;
  }

  &--warning {
    background-color: $warning-background-light;
    color: $warning-foreground-light;
  }

  &--error {
    background-color: $error-background-light;
    color: $error-foreground-light;
  }

  &--info {
    background-color: $info-background-light;
    color: $info-foreground-light;
  }
}
```

### 10.9. Tooltip

```scss
.tooltip {
  position: relative;
  display: inline-block;

  &__content {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    padding: $spacing-xs $spacing-s;
    background-color: $neutral-gray-62;
    color: $neutral-white;
    border-radius: $border-radius-small;
    font-size: $font-size-200;
    white-space: nowrap;
    box-shadow: $elevation-tooltip;
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity $duration-fast $ease-ease;

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: $neutral-gray-62;
    }
  }

  &:hover &__content {
    opacity: 1;
  }
}
```

### 10.10. Progress Bar

```scss
.progress {
  width: 100%;
  height: 4px;
  background-color: $neutral-gray-14;
  border-radius: $border-radius-circular;
  overflow: hidden;

  &__bar {
    height: 100%;
    background-color: $color-action-primary;
    border-radius: $border-radius-circular;
    transition: width $duration-slow $ease-ease;
  }

  &--indeterminate &__bar {
    width: 30%;
    animation: progress-indeterminate 1.5s infinite $ease-ease;
  }
}

@keyframes progress-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}
```

---

## 11. Accesibilidad

### 11.1. Contraste de Color (WCAG 2.1)

Todos los tokens de color de Fluent están diseñados para cumplir con WCAG 2.1 Level AA como mínimo.

**Requisitos:**
- **Texto normal (< 18px)**: Ratio de contraste mínimo 4.5:1
- **Texto grande (≥ 18px o ≥ 14px bold)**: Ratio de contraste mínimo 3:1
- **Componentes UI**: Ratio de contraste mínimo 3:1

**Validación:**
```scss
// Ejemplo: Validar contraste entre texto y fondo
// Light theme: #323130 sobre #ffffff = 12.63:1 ✓ AAA
// Dark theme: #d6d6d6 sobre #242424 = 11.77:1 ✓ AAA
```

### 11.2. Estados de Foco

Todos los elementos interactivos DEBEN tener un indicador de foco visible.

```scss
// Estilo de foco estándar
@mixin focus-visible {
  &:focus-visible {
    outline: $border-width-thick solid $color-state-focus-border;
    outline-offset: 2px;
  }
}

// Foco para elementos de superficie oscura
@mixin focus-visible-inverse {
  &:focus-visible {
    outline: $border-width-thick solid $neutral-white;
    outline-offset: 2px;
  }
}
```

### 11.3. Tamaños Mínimos de Toque

Para dispositivos táctiles, los elementos interactivos deben tener al menos 44x44px de área clickeable (WCAG 2.1 AA).

```scss
// Asegurar área de toque mínima
@mixin touch-target($size: 44px) {
  min-width: $size;
  min-height: $size;

  // Si el elemento visual es más pequeño, expandir el área clickeable
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: $size;
    min-height: $size;
  }
}
```

### 11.4. Texto Alternativo y Labels

```html
<!-- Botones con iconos deben tener text alternativo -->
<button aria-label="Cerrar diálogo">
  <svg>...</svg>
</button>

<!-- Inputs siempre deben tener labels asociados -->
<label for="email">Correo electrónico</label>
<input id="email" type="email" />

<!-- Estados dinámicos deben anunciarse -->
<div role="alert" aria-live="polite">
  Formulario enviado exitosamente
</div>
```

### 11.5. Navegación por Teclado

**Orden de tabulación:**
1. Header/Navigation
2. Main content (en orden lógico de lectura)
3. Sidebar (si existe)
4. Footer

**Atajos de teclado comunes:**
- `Tab` / `Shift+Tab`: Navegar entre elementos focusables
- `Enter` / `Space`: Activar botones
- `Escape`: Cerrar modales/dropdowns
- `Arrow keys`: Navegar en listas/menús

---

## 12. Implementación en Sass

### 12.1. Estructura de Archivos Recomendada

```
src/styles/scss/
├── abstracts/
│   ├── _variables.scss          # Todos los design tokens
│   ├── _functions.scss          # Funciones utilitarias
│   ├── _mixins.scss            # Mixins reutilizables
│   └── _theme-mixin.scss       # Mixin de tematización
│
├── base/
│   ├── _reset.scss             # Reset/normalize
│   ├── _typography.scss        # Estilos tipográficos base
│   └── _base.scss              # html, body, etc.
│
├── components/
│   ├── _button.scss
│   ├── _input.scss
│   ├── _card.scss
│   ├── _dialog.scss
│   ├── _checkbox.scss
│   ├── _switch.scss
│   ├── _dropdown.scss
│   ├── _badge.scss
│   ├── _tooltip.scss
│   └── _progress.scss
│
├── layout/
│   ├── _navigation.scss
│   ├── _sidebar.scss
│   └── _grid.scss
│
├── pages/
│   ├── _login.scss
│   └── ...
│
└── main.scss                   # Archivo principal de importación
```

### 12.2. Variables Theme-aware

```scss
// abstracts/_variables.scss

// ==========================================================================
// FLUENT DESIGN SYSTEM - DESIGN TOKENS
// ==========================================================================

// --------------------------------------------------------------------------
// NEUTRAL COLORS
// --------------------------------------------------------------------------

// Light Theme
$neutral-gray-4: #faf9f8;
$neutral-gray-8: #f3f2f1;
$neutral-gray-10: #edebe9;
$neutral-gray-14: #e1dfdd;
$neutral-gray-16: #d2d0ce;
$neutral-gray-20: #c8c6c4;
$neutral-gray-24: #a19f9d;
$neutral-gray-38: #8a8886;
$neutral-gray-46: #605e5c;
$neutral-gray-52: #3b3a39;
$neutral-gray-54: #323130;
$neutral-gray-62: #201f1e;
$neutral-gray-82: #000000;
$neutral-white: #ffffff;

// Dark Theme
$neutral-gray-2: #0a0a0a;
$neutral-gray-4-dark: #1a1a1a;
$neutral-gray-6: #242424;
$neutral-gray-8-dark: #292929;
$neutral-gray-10-dark: #2e2e2e;
$neutral-gray-12: #333333;
$neutral-gray-14-dark: #383838;
$neutral-gray-16-dark: #424242;
$neutral-gray-20-dark: #4d4d4d;
$neutral-gray-24-dark: #5c5c5c;
$neutral-gray-36: #858585;
$neutral-gray-46-dark: #a3a3a3;
$neutral-gray-54-dark: #c7c7c7;
$neutral-gray-60: #d6d6d6;
$neutral-gray-68: #e0e0e0;
$neutral-gray-90: #f5f5f5;
$neutral-black: #000000;

// --------------------------------------------------------------------------
// BRAND COLORS (Default Blue)
// --------------------------------------------------------------------------

$brand-10: #061724;
$brand-20: #082338;
$brand-30: #0a2e4a;
$brand-40: #0c3b5e;
$brand-50: #0e4775;
$brand-60: #0078d4;
$brand-70: #1890f1;
$brand-80: #3aa0f3;
$brand-90: #5caef5;
$brand-100: #7dbcf7;
$brand-110: #9dcaf9;
$brand-120: #b8d8fb;
$brand-130: #d1e6fc;
$brand-140: #e7f3fe;
$brand-150: #f3f9ff;
$brand-160: #fafcff;

// --------------------------------------------------------------------------
// SEMANTIC COLORS
// --------------------------------------------------------------------------

// Success
$success-10: #0e3b0e;
$success-20: #135c13;
$success-30: #107c10;
$success-40: #13a10e;
$success-50: #27ac22;
$success-background-light: #dff6dd;
$success-foreground-light: #0e700e;
$success-10-dark: #92c353;
$success-20-dark: #9ccf5a;
$success-30-dark: #a7db61;
$success-background-dark: #1e3a1e;
$success-foreground-dark: #9ccf5a;

// Warning
$warning-10: #4d3800;
$warning-20: #705000;
$warning-30: #f7630c;
$warning-40: #ff8c00;
$warning-50: #ffa328;
$warning-background-light: #fff4ce;
$warning-foreground-light: #8a5100;
$warning-10-dark: #f7a800;
$warning-20-dark: #f9b500;
$warning-30-dark: #fcc419;
$warning-background-dark: #3d3000;
$warning-foreground-dark: #f9b500;

// Error
$error-10: #4c0d0d;
$error-20: #751818;
$error-30: #a4262c;
$error-40: #c50f1f;
$error-50: #d13438;
$error-background-light: #fde7e9;
$error-foreground-light: #a80000;
$error-10-dark: #e74856;
$error-20-dark: #ea5b64;
$error-30-dark: #ee6e75;
$error-background-dark: #3d1518;
$error-foreground-dark: #ea5b64;

// Info
$info-10: #002c4e;
$info-20: #004377;
$info-30: #0078d4;
$info-40: #1890f1;
$info-50: #3aa0f3;
$info-background-light: #e6f4ff;
$info-foreground-light: #004e91;
$info-10-dark: #3aa0f3;
$info-20-dark: #5caef5;
$info-30-dark: #7dbcf7;
$info-background-dark: #1a2e3d;
$info-foreground-dark: #5caef5;

// --------------------------------------------------------------------------
// TYPOGRAPHY
// --------------------------------------------------------------------------

$font-family-base: 'Segoe UI', -apple-system, BlinkMacSystemFont,
                   'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
                   'Helvetica Neue', sans-serif;
$font-family-monospace: 'Cascadia Code', 'Consolas', 'Courier New', monospace;

$font-size-100: 10px;
$font-size-200: 12px;
$font-size-300: 14px;
$font-size-400: 16px;
$font-size-500: 18px;
$font-size-600: 20px;
$font-size-700: 24px;
$font-size-800: 28px;
$font-size-900: 32px;
$font-size-1000: 40px;
$font-size-1100: 52px;

$line-height-100: 14px;
$line-height-200: 16px;
$line-height-300: 20px;
$line-height-400: 22px;
$line-height-500: 24px;
$line-height-600: 28px;
$line-height-700: 32px;
$line-height-800: 36px;
$line-height-900: 40px;
$line-height-1000: 52px;
$line-height-1100: 64px;

$font-weight-regular: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

// --------------------------------------------------------------------------
// SPACING
// --------------------------------------------------------------------------

$spacing-none: 0;
$spacing-xxs: 2px;
$spacing-xs: 4px;
$spacing-s-nudge: 6px;
$spacing-s: 8px;
$spacing-m-nudge: 10px;
$spacing-m: 12px;
$spacing-l: 16px;
$spacing-xl: 20px;
$spacing-xxl: 24px;
$spacing-xxxl: 32px;
$spacing-huge: 40px;
$spacing-massive: 48px;
$spacing-giant: 64px;

// --------------------------------------------------------------------------
// BORDER RADIUS
// --------------------------------------------------------------------------

$border-radius-none: 0;
$border-radius-small: 2px;
$border-radius-medium: 4px;
$border-radius-large: 6px;
$border-radius-xlarge: 8px;
$border-radius-circular: 50%;

// --------------------------------------------------------------------------
// BORDERS
// --------------------------------------------------------------------------

$border-width-thin: 1px;
$border-width-thick: 2px;
$border-width-thicker: 3px;

// --------------------------------------------------------------------------
// SHADOWS
// --------------------------------------------------------------------------

$shadow-2: 0 0 2px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.14);
$shadow-4: 0 0 2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.14);
$shadow-8: 0 0 2px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.14);
$shadow-16: 0 0 2px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.14);
$shadow-28: 0 0 8px rgba(0, 0, 0, 0.12), 0 14px 28px rgba(0, 0, 0, 0.18);
$shadow-64: 0 0 8px rgba(0, 0, 0, 0.12), 0 32px 64px rgba(0, 0, 0, 0.24);

$shadow-2-dark: 0 0 2px rgba(0, 0, 0, 0.24), 0 1px 2px rgba(0, 0, 0, 0.28);
$shadow-4-dark: 0 0 2px rgba(0, 0, 0, 0.24), 0 2px 4px rgba(0, 0, 0, 0.28);
$shadow-8-dark: 0 0 2px rgba(0, 0, 0, 0.24), 0 4px 8px rgba(0, 0, 0, 0.28);
$shadow-16-dark: 0 0 2px rgba(0, 0, 0, 0.24), 0 8px 16px rgba(0, 0, 0, 0.32);
$shadow-28-dark: 0 0 8px rgba(0, 0, 0, 0.24), 0 14px 28px rgba(0, 0, 0, 0.36);
$shadow-64-dark: 0 0 8px rgba(0, 0, 0, 0.24), 0 32px 64px rgba(0, 0, 0, 0.48);

// --------------------------------------------------------------------------
// ANIMATION
// --------------------------------------------------------------------------

$duration-ultra-fast: 50ms;
$duration-faster: 100ms;
$duration-fast: 150ms;
$duration-normal: 200ms;
$duration-slow: 300ms;
$duration-slower: 400ms;
$duration-ultra-slow: 500ms;

$ease-linear: linear;
$ease-ease-max: cubic-bezier(0.8, 0, 0.1, 1);
$ease-ease: cubic-bezier(0.33, 0, 0.67, 1);
$ease-decelerate: cubic-bezier(0.1, 0.9, 0.2, 1);
$ease-accelerate: cubic-bezier(0.9, 0.1, 1, 0.2);
$ease-max-ease-in: cubic-bezier(0.8, 0, 1, 1);
$ease-max-ease-out: cubic-bezier(0, 0, 0.2, 1);

// --------------------------------------------------------------------------
// THEME MAP
// --------------------------------------------------------------------------

$themes: (
  light: (
    // Backgrounds
    'bg-primary': $neutral-white,
    'bg-secondary': $neutral-gray-8,
    'bg-tertiary': $neutral-gray-10,
    'bg-disabled': $neutral-gray-14,
    'bg-overlay': rgba(0, 0, 0, 0.4),

    // Text
    'text-primary': $neutral-gray-54,
    'text-secondary': $neutral-gray-46,
    'text-tertiary': $neutral-gray-38,
    'text-disabled': $neutral-gray-24,
    'text-on-primary': $neutral-white,
    'text-on-error': $neutral-white,

    // Borders
    'border-default': $neutral-gray-16,
    'border-subtle': $neutral-gray-14,
    'border-strong': $neutral-gray-20,
    'border-disabled': $neutral-gray-14,

    // Actions
    'action-primary': $brand-60,
    'action-primary-hover': $brand-70,
    'action-primary-pressed': $brand-50,
    'action-primary-disabled': $neutral-gray-24,

    // States
    'state-hover-overlay': rgba(0, 0, 0, 0.05),
    'state-pressed-overlay': rgba(0, 0, 0, 0.08),
    'state-selected-bg': $brand-140,
    'state-focus-border': $brand-60,

    // Shadows
    'shadow-card': $shadow-2,
    'shadow-card-hover': $shadow-8,
    'shadow-flyout': $shadow-16,
    'shadow-dialog': $shadow-28,
    'shadow-tooltip': $shadow-8,
    'shadow-dropdown': $shadow-16,

    // Semantic
    'success': $success-30,
    'success-bg': $success-background-light,
    'success-fg': $success-foreground-light,
    'warning': $warning-30,
    'warning-bg': $warning-background-light,
    'warning-fg': $warning-foreground-light,
    'error': $error-30,
    'error-bg': $error-background-light,
    'error-fg': $error-foreground-light,
    'info': $info-30,
    'info-bg': $info-background-light,
    'info-fg': $info-foreground-light,
  ),

  dark: (
    // Backgrounds
    'bg-primary': $neutral-gray-6,
    'bg-secondary': $neutral-gray-8-dark,
    'bg-tertiary': $neutral-gray-10-dark,
    'bg-disabled': $neutral-gray-14-dark,
    'bg-overlay': rgba(0, 0, 0, 0.6),

    // Text
    'text-primary': $neutral-gray-60,
    'text-secondary': $neutral-gray-46-dark,
    'text-tertiary': $neutral-gray-36,
    'text-disabled': $neutral-gray-24-dark,
    'text-on-primary': $neutral-black,
    'text-on-error': $neutral-black,

    // Borders
    'border-default': $neutral-gray-16-dark,
    'border-subtle': $neutral-gray-14-dark,
    'border-strong': $neutral-gray-20-dark,
    'border-disabled': $neutral-gray-14-dark,

    // Actions
    'action-primary': $brand-90,
    'action-primary-hover': $brand-100,
    'action-primary-pressed': $brand-80,
    'action-primary-disabled': $neutral-gray-24-dark,

    // States
    'state-hover-overlay': rgba(255, 255, 255, 0.08),
    'state-pressed-overlay': rgba(255, 255, 255, 0.12),
    'state-selected-bg': $brand-20,
    'state-focus-border': $brand-90,

    // Shadows
    'shadow-card': $shadow-2-dark,
    'shadow-card-hover': $shadow-8-dark,
    'shadow-flyout': $shadow-16-dark,
    'shadow-dialog': $shadow-28-dark,
    'shadow-tooltip': $shadow-8-dark,
    'shadow-dropdown': $shadow-16-dark,

    // Semantic
    'success': $success-30-dark,
    'success-bg': $success-background-dark,
    'success-fg': $success-foreground-dark,
    'warning': $warning-30-dark,
    'warning-bg': $warning-background-dark,
    'warning-fg': $warning-foreground-dark,
    'error': $error-30-dark,
    'error-bg': $error-background-dark,
    'error-fg': $error-foreground-dark,
    'info': $info-30-dark,
    'info-bg': $info-background-dark,
    'info-fg': $info-foreground-dark,
  )
);
```

### 12.3. Mixin de Tematización

```scss
// abstracts/_theme-mixin.scss

// Mixin para aplicar estilos temáticos
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

// Función para obtener un valor del tema actual
@function themed($key) {
  @return map-get($theme-map, $key);
}
```

### 12.4. Mixins Comunes

```scss
// abstracts/_mixins.scss

// Type Styles
@mixin type-caption {
  font-family: $font-family-base;
  font-size: $font-size-200;
  line-height: $line-height-200;
  font-weight: $font-weight-regular;
}

@mixin type-body {
  font-family: $font-family-base;
  font-size: $font-size-300;
  line-height: $line-height-300;
  font-weight: $font-weight-regular;
}

@mixin type-body-strong {
  font-family: $font-family-base;
  font-size: $font-size-300;
  line-height: $line-height-300;
  font-weight: $font-weight-semibold;
}

@mixin type-subtitle {
  font-family: $font-family-base;
  font-size: $font-size-500;
  line-height: $line-height-500;
  font-weight: $font-weight-semibold;
}

@mixin type-title {
  font-family: $font-family-base;
  font-size: $font-size-700;
  line-height: $line-height-700;
  font-weight: $font-weight-semibold;
}

// Focus State
@mixin focus-visible {
  &:focus-visible {
    outline: $border-width-thick solid;
    outline-offset: 2px;

    @include themify($themes) {
      outline-color: themed('state-focus-border');
    }
  }
}

// Touch Target
@mixin touch-target($size: 44px) {
  min-width: $size;
  min-height: $size;
}

// Truncate Text
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Card Elevation
@mixin card-elevation {
  @include themify($themes) {
    box-shadow: themed('shadow-card');
  }

  transition: box-shadow $duration-normal $ease-decelerate;

  &:hover {
    @include themify($themes) {
      box-shadow: themed('shadow-card-hover');
    }
  }
}
```

### 12.5. Archivo Principal main.scss

```scss
// main.scss

// Abstracts (sin output CSS)
@import 'abstracts/variables';
@import 'abstracts/functions';
@import 'abstracts/mixins';
@import 'abstracts/theme-mixin';

// Base
@import 'base/reset';
@import 'base/typography';
@import 'base/base';

// Components
@import 'components/button';
@import 'components/input';
@import 'components/card';
@import 'components/dialog';
@import 'components/checkbox';
@import 'components/switch';
@import 'components/dropdown';
@import 'components/badge';
@import 'components/tooltip';
@import 'components/progress';

// Layout
@import 'layout/navigation';
@import 'layout/sidebar';
@import 'layout/grid';

// Pages (si es necesario)
// @import 'pages/login';
```

### 12.6. Ejemplo de Uso en Componente

```scss
// components/_button.scss
@import '../abstracts/variables';
@import '../abstracts/mixins';
@import '../abstracts/theme-mixin';

.btn {
  // Base styles
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-s $spacing-l;
  min-height: 32px;
  border: none;
  border-radius: $border-radius-medium;
  font-size: $font-size-300;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  transition: background-color $duration-fast $ease-ease,
              color $duration-fast $ease-ease;

  @include focus-visible;
  @include touch-target;

  // Primary variant
  &--primary {
    @include themify($themes) {
      background-color: themed('action-primary');
      color: themed('text-on-primary');
    }

    &:hover:not(:disabled) {
      @include themify($themes) {
        background-color: themed('action-primary-hover');
      }
    }

    &:active:not(:disabled) {
      @include themify($themes) {
        background-color: themed('action-primary-pressed');
      }
    }
  }

  // Secondary variant
  &--secondary {
    @include themify($themes) {
      background-color: transparent;
      color: themed('action-primary');
      border: $border-width-thin solid themed('border-default');
    }

    &:hover:not(:disabled) {
      @include themify($themes) {
        background-color: themed('state-hover-overlay');
        border-color: themed('action-primary');
      }
    }
  }

  // Disabled state
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;

    @include themify($themes) {
      background-color: themed('bg-disabled');
      color: themed('text-disabled');
    }
  }

  // Size variants
  &--small {
    padding: 5px 12px;
    min-height: 24px;
    font-size: $font-size-200;
  }

  &--large {
    padding: 11px 20px;
    min-height: 40px;
    font-size: $font-size-400;
  }
}
```

---

## 13. Conclusión

Este documento proporciona una guía completa para implementar Fluent Design System 2 en aplicaciones web utilizando Sass. Los design tokens, componentes y patrones definidos aquí están alineados con las especificaciones oficiales de Microsoft y están optimizados para:

- **Accesibilidad**: Cumplimiento WCAG 2.1 AA/AAA
- **Mantenibilidad**: Arquitectura modular y escalable
- **Consistencia**: Patrones de diseño coherentes
- **Performance**: CSS optimizado y reutilizable
- **Flexibilidad**: Fácil personalización de marca

### Próximos Pasos

1. Instalar Sass: `pnpm add -D sass`
2. Crear la estructura de carpetas en `src/styles/scss/`
3. Implementar las variables y mixins base
4. Migrar componentes uno por uno
5. Actualizar el ThemeContext para trabajar con las clases `.theme--light` y `.theme--dark`
6. Importar `main.scss` en el entry point de la aplicación

### Recursos Adicionales

- [Fluent 2 Design System](https://fluent2.microsoft.design/)
- [Microsoft Learn - Fluent UI Web Components](https://learn.microsoft.com/en-us/fluent-ui/web-components/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Sass Documentation](https://sass-lang.com/documentation)

---

**Documento mantenido por:** Equipo de Desarrollo
**Última actualización:** 2025-10-29
