# Fluent UI 2 + Sass - Plan de Implementación y Progreso

**Fecha de inicio:** 2025-10-29
**Estado:** En planificación
**Versión del sistema de diseño:** 2.0 (basado en Microsoft Fluent Design System 2)

---

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Fases de Implementación](#fases-de-implementación)
3. [Fase 1: Configuración Base](#fase-1-configuración-base)
4. [Fase 2: Design Tokens y Theming](#fase-2-design-tokens-y-theming)
5. [Fase 3: Componentes Base](#fase-3-componentes-base)
6. [Fase 4: Componentes de Layout](#fase-4-componentes-de-layout)
7. [Fase 5: Migración de Páginas](#fase-5-migración-de-páginas)
8. [Fase 6: Deprecación de Tailwind](#fase-6-deprecación-de-tailwind)
9. [Checklist de Progreso](#checklist-de-progreso)
10. [Decisiones Técnicas](#decisiones-técnicas)

---

## Resumen Ejecutivo

### Objetivo

Migrar completamente el sistema de temas actual (múltiples temas con Tailwind CSS) a un sistema unificado basado en **Microsoft Fluent Design System 2** implementado con **Sass/SCSS**, soportando únicamente dos modos: **Light** y **Dark**.

### Beneficios Esperados

- ✅ **Consistencia**: Sistema de diseño profesional y coherente basado en estándares de Microsoft
- ✅ **Mantenibilidad**: Código más limpio sin lógica condicional de estilos en JSX
- ✅ **Performance**: CSS optimizado, menos JavaScript en tiempo de ejecución
- ✅ **Accesibilidad**: Cumplimiento WCAG 2.1 AA/AAA garantizado por diseño
- ✅ **Escalabilidad**: Arquitectura modular que facilita el crecimiento
- ✅ **Developer Experience**: Variables semánticas y mixins reutilizables

### Documentación de Referencia

- **Sistema de Diseño Completo**: [`FLUENT_DESIGN_SYSTEM.md`](./FLUENT_DESIGN_SYSTEM.md)
- **Guía de Migración Original**: [`SASS_THEME_MIGRATION_GUIDE.md`](./SASS_THEME_MIGRATION_GUIDE.md)

---

## Fases de Implementación

La implementación se divide en **6 fases** secuenciales para minimizar el riesgo y mantener la aplicación funcional en todo momento.

```
Fase 1: Configuración Base (1-2 días)
   ↓
Fase 2: Design Tokens y Theming (2-3 días)
   ↓
Fase 3: Componentes Base (5-7 días)
   ↓
Fase 4: Componentes de Layout (3-4 días)
   ↓
Fase 5: Migración de Páginas (7-10 días)
   ↓
Fase 6: Deprecación de Tailwind (2-3 días)
```

**Duración estimada total:** 20-29 días de desarrollo

---

## Fase 1: Configuración Base

### Objetivo
Preparar el entorno de desarrollo con Sass y crear la estructura de carpetas base.

### Tareas

#### 1.1. Instalar Dependencias
- [ ] Instalar Sass: `pnpm add -D sass`
- [ ] Verificar compatibilidad con Vite
- [ ] Probar compilación básica de un archivo `.scss`

#### 1.2. Crear Estructura de Carpetas

```bash
mkdir -p src/styles/scss/{abstracts,base,components,layout,pages}
```

Estructura final esperada:
```
src/styles/scss/
├── abstracts/
│   ├── _variables.scss
│   ├── _functions.scss
│   ├── _mixins.scss
│   └── _theme-mixin.scss
├── base/
│   ├── _reset.scss
│   ├── _typography.scss
│   └── _base.scss
├── components/
├── layout/
├── pages/
└── main.scss
```

- [ ] Crear carpeta `src/styles/scss/`
- [ ] Crear subcarpetas: `abstracts/`, `base/`, `components/`, `layout/`, `pages/`
- [ ] Crear archivo `main.scss` (vacío por ahora)

#### 1.3. Configurar Imports
- [ ] Importar `main.scss` en `src/main.jsx`
- [ ] Verificar que no rompa estilos existentes (debería estar vacío)

```javascript
// src/main.jsx
import './styles/scss/main.scss' // ← Añadir esta línea
```

### Criterio de Aceptación
✅ Sass instalado y compilando correctamente
✅ Estructura de carpetas creada
✅ Archivo main.scss importado sin errores

---

## Fase 2: Design Tokens y Theming

### Objetivo
Implementar todos los design tokens de Fluent UI 2 y el sistema de tematización.

### Tareas

#### 2.1. Variables Base (`abstracts/_variables.scss`)

Referencia: [Sección 12.2 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#122-variables-theme-aware)

- [ ] Implementar colores neutrales (light theme)
- [ ] Implementar colores neutrales (dark theme)
- [ ] Implementar colores de marca (brand ramp 10-160)
- [ ] Implementar colores semánticos (success, warning, error, info)
- [ ] Implementar tokens tipográficos
  - [ ] Font families
  - [ ] Font sizes (100-1100)
  - [ ] Line heights
  - [ ] Font weights
- [ ] Implementar tokens de espaciado (sistema base-4)
- [ ] Implementar tokens de border radius
- [ ] Implementar tokens de border widths
- [ ] Implementar tokens de sombras (light y dark)
- [ ] Implementar tokens de animación (duraciones y easing)
- [ ] Crear el mapa `$themes` con tokens semánticos para light y dark

**Archivo de referencia completo:** Ver sección 12.2 de `FLUENT_DESIGN_SYSTEM.md`

#### 2.2. Mixin de Tematización (`abstracts/_theme-mixin.scss`)

- [ ] Implementar mixin `@mixin themify($themes)`
- [ ] Implementar función `@function themed($key)`
- [ ] Probar el mixin con un ejemplo simple

Referencia: [Sección 12.3 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#123-mixin-de-tematización)

#### 2.3. Mixins Comunes (`abstracts/_mixins.scss`)

- [ ] Mixins tipográficos
  - [ ] `@mixin type-caption`
  - [ ] `@mixin type-body`
  - [ ] `@mixin type-body-strong`
  - [ ] `@mixin type-subtitle`
  - [ ] `@mixin type-title`
  - [ ] `@mixin type-display`
- [ ] Mixins de accesibilidad
  - [ ] `@mixin focus-visible`
  - [ ] `@mixin touch-target($size: 44px)`
- [ ] Mixins utilitarios
  - [ ] `@mixin truncate`
  - [ ] `@mixin card-elevation`

Referencia: [Sección 12.4 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#124-mixins-comunes)

#### 2.4. Funciones Utilitarias (`abstracts/_functions.scss`)

- [ ] Función para calcular contraste de color (si es necesario)
- [ ] Función para conversión de unidades (si es necesario)
- [ ] Otras funciones helper según necesidad

#### 2.5. Estilos Base

**`base/_reset.scss`**
- [ ] Implementar reset/normalize moderno (usar modern-normalize o crear uno custom)

**`base/_typography.scss`**
- [ ] Aplicar font-family base al body
- [ ] Definir clases tipográficas reutilizables (.text-caption, .text-body, etc.)

**`base/_base.scss`**
- [ ] Estilos para html (scroll-behavior, etc.)
- [ ] Estilos para body (colores, fuentes)
- [ ] Box-sizing border-box universal

#### 2.6. Actualizar ThemeContext

- [ ] Simplificar `ThemeContext` para solo manejar light/dark
- [ ] Aplicar clase `.theme--light` o `.theme--dark` al `<body>` o `<html>`
- [ ] Sincronizar con localStorage
- [ ] Eliminar toda la lógica de múltiples temas (neo-brutalism, material, fluent)

```jsx
// Ejemplo simplificado
const ThemeContext = () => {
  const [mode, setMode] = useState('light'); // 'light' | 'dark'

  useEffect(() => {
    document.body.classList.remove('theme--light', 'theme--dark');
    document.body.classList.add(`theme--${mode}`);
  }, [mode]);

  // ...
};
```

- [ ] Actualizar hook `useTheme()` para retornar solo `{ mode, toggleTheme }`
- [ ] Eliminar referencias a `theme.name` (neo-brutalism, etc.) en todo el código

#### 2.7. Importar en main.scss

```scss
// main.scss
@import 'abstracts/variables';
@import 'abstracts/functions';
@import 'abstracts/mixins';
@import 'abstracts/theme-mixin';

@import 'base/reset';
@import 'base/typography';
@import 'base/base';
```

- [ ] Importar todos los archivos creados
- [ ] Verificar compilación sin errores
- [ ] Verificar que los temas light/dark se aplican correctamente

### Criterio de Aceptación
✅ Todos los design tokens implementados
✅ Sistema de tematización funcionando (light/dark)
✅ ThemeContext actualizado y simplificado
✅ Estilos base aplicados globalmente

---

## Fase 3: Componentes Base

### Objetivo
Migrar los componentes UI más fundamentales a Sass con BEM y Fluent Design.

### Orden de Migración

1. **Button** (botones)
2. **Input** (campos de texto)
3. **Checkbox** (casillas de verificación)
4. **Switch** (toggle switches)
5. **Badge** (etiquetas/badges)
6. **Spinner/Loader** (indicadores de carga)
7. **Card** (tarjetas)
8. **Dialog/Modal** (cuadros de diálogo)
9. **Dropdown/Select** (menús desplegables)
10. **Tooltip** (tooltips)
11. **Progress Bar** (barras de progreso)

### Patrón de Migración por Componente

Para **cada componente**, seguir estos pasos:

#### Paso 1: Leer el componente actual
- [ ] Identificar todas las variantes y props del componente
- [ ] Listar todos los estados (hover, active, disabled, focus, error)
- [ ] Documentar las clases de Tailwind que se están usando

#### Paso 2: Crear archivo SCSS del componente
- [ ] Crear `src/styles/scss/components/_[nombre].scss`
- [ ] Implementar estilos con nomenclatura BEM
- [ ] Usar el mixin `@themify` para estilos que dependen del tema
- [ ] Implementar todas las variantes
- [ ] Implementar todos los estados
- [ ] Implementar estados de accesibilidad (focus-visible)

Referencia de implementación: [Sección 10 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#10-componentes-ui)

#### Paso 3: Refactorizar el componente JSX
- [ ] Eliminar todas las clases condicionales de Tailwind
- [ ] Aplicar clases BEM simples
- [ ] Mantener la lógica de props (variant, size, disabled, etc.)
- [ ] Verificar que no se usa `useTheme()` para lógica condicional de estilos

#### Paso 4: Testing
- [ ] Verificar visualmente en modo light
- [ ] Verificar visualmente en modo dark
- [ ] Verificar todos los estados interactivos
- [ ] Verificar accesibilidad (navegación por teclado, focus visible)
- [ ] Actualizar tests unitarios si existen

#### Paso 5: Importar en main.scss
```scss
@import 'components/button';
```

### Tareas por Componente

#### 3.1. Button

**Referencia:** [Sección 10.1 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#101-button-botón)

- [ ] Crear `components/_button.scss`
- [ ] Implementar variantes:
  - [ ] Primary
  - [ ] Secondary (outline)
  - [ ] Subtle (ghost)
  - [ ] Danger/Error (si existe)
- [ ] Implementar tamaños: small, medium (default), large
- [ ] Implementar estados: default, hover, active, disabled, focus
- [ ] Refactorizar `src/components/ui/Button.jsx`
- [ ] Testing completo
- [ ] Importar en `main.scss`

**Ubicación del componente actual:** `src/components/ui/Button.jsx` (verificar ruta exacta)

#### 3.2. Input

**Referencia:** [Sección 10.2 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#102-input-campo-de-texto)

- [ ] Crear `components/_input.scss`
- [ ] Implementar tamaños: small, medium, large
- [ ] Implementar estados: default, hover, focus, disabled, error
- [ ] Placeholder styles
- [ ] Refactorizar `src/components/ui/Input.jsx`
- [ ] Testing completo
- [ ] Importar en `main.scss`

#### 3.3. Checkbox

**Referencia:** [Sección 10.5 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#105-checkbox)

- [ ] Crear `components/_checkbox.scss`
- [ ] Implementar estados: unchecked, checked, indeterminate, disabled
- [ ] Custom checkmark icon (CSS puro)
- [ ] Refactorizar componente JSX
- [ ] Testing completo
- [ ] Importar en `main.scss`

#### 3.4. Switch

**Referencia:** [Sección 10.6 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#106-switch-toggle)

- [ ] Crear `components/_switch.scss`
- [ ] Implementar estados: off, on, disabled
- [ ] Animación del thumb
- [ ] Refactorizar componente JSX
- [ ] Testing completo
- [ ] Importar en `main.scss`

#### 3.5. Badge

**Referencia:** [Sección 10.8 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#108-badge)

- [ ] Crear `components/_badge.scss`
- [ ] Implementar variantes: default, success, warning, error, info
- [ ] Implementar tamaños si es necesario
- [ ] Refactorizar componente JSX
- [ ] Testing completo
- [ ] Importar en `main.scss`

#### 3.6. Spinner/Loader

- [ ] Crear `components/_spinner.scss`
- [ ] Implementar animación de loading
- [ ] Implementar tamaños: small, medium, large
- [ ] Variantes de color si es necesario
- [ ] Refactorizar componente JSX
- [ ] Testing completo
- [ ] Importar en `main.scss`

#### 3.7. Card

**Referencia:** [Sección 10.3 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#103-card-tarjeta)

- [ ] Crear `components/_card.scss`
- [ ] Implementar card base con elevation
- [ ] Implementar hover effects
- [ ] Implementar card__header, card__content, card__footer
- [ ] Variante interactive/clickable
- [ ] Refactorizar componente JSX
- [ ] Testing completo
- [ ] Importar en `main.scss`

#### 3.8. Dialog/Modal

**Referencia:** [Sección 10.4 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#104-dialog-cuadro-de-diálogo)

- [ ] Crear `components/_dialog.scss`
- [ ] Implementar overlay con backdrop
- [ ] Implementar dialog con shadow-64
- [ ] Animaciones de entrada/salida
- [ ] Implementar dialog__header, dialog__content, dialog__footer
- [ ] Tamaños: small (480px), medium (640px), large (800px)
- [ ] Refactorizar componente JSX
- [ ] Testing completo (incluir Escape key, click outside)
- [ ] Importar en `main.scss`

#### 3.9. Dropdown/Select

**Referencia:** [Sección 10.7 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#107-dropdown--select)

- [ ] Crear `components/_dropdown.scss`
- [ ] Implementar dropdown__trigger
- [ ] Implementar dropdown__menu con elevation
- [ ] Implementar dropdown__item con hover states
- [ ] Selected state
- [ ] Animación de apertura
- [ ] Refactorizar componente JSX
- [ ] Testing completo (teclado, accesibilidad)
- [ ] Importar en `main.scss`

#### 3.10. Tooltip

**Referencia:** [Sección 10.9 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#109-tooltip)

- [ ] Crear `components/_tooltip.scss`
- [ ] Implementar tooltip con arrow
- [ ] Posicionamiento (top, bottom, left, right)
- [ ] Animación de fade in/out
- [ ] Refactorizar componente JSX
- [ ] Testing completo
- [ ] Importar en `main.scss`

#### 3.11. Progress Bar

**Referencia:** [Sección 10.10 del Sistema de Diseño](./FLUENT_DESIGN_SYSTEM.md#1010-progress-bar)

- [ ] Crear `components/_progress.scss`
- [ ] Implementar progress determinado
- [ ] Implementar progress indeterminado (animación)
- [ ] Refactorizar componente JSX
- [ ] Testing completo
- [ ] Importar en `main.scss`

### Criterio de Aceptación Fase 3
✅ Todos los componentes base migrados a Sass
✅ Nomenclatura BEM consistente en todos los componentes
✅ Componentes JSX limpios sin clases condicionales de Tailwind
✅ Todos los componentes funcionan correctamente en light y dark mode
✅ Accesibilidad verificada (focus states, navegación por teclado)

---

## Fase 4: Componentes de Layout

### Objetivo
Migrar componentes de estructura y navegación.

### Tareas

#### 4.1. Navigation Bar

- [ ] Crear `layout/_navigation.scss`
- [ ] Implementar estilos del navbar
- [ ] Implementar navigation items
- [ ] Estados active/selected
- [ ] Responsive behavior
- [ ] Refactorizar componente JSX
- [ ] Testing completo
- [ ] Importar en `main.scss`

**Ubicación:** Identificar componente de navegación actual (probablemente en `src/components/` o `src/layouts/`)

#### 4.2. Sidebar

- [ ] Crear `layout/_sidebar.scss`
- [ ] Implementar estilos del sidebar
- [ ] Implementar sidebar items
- [ ] Collapsible behavior (si aplica)
- [ ] Estados active/selected
- [ ] Refactorizar componente JSX
- [ ] Testing completo
- [ ] Importar en `main.scss`

#### 4.3. Grid System / Layout Containers

- [ ] Crear `layout/_grid.scss`
- [ ] Implementar sistema de grid (si es necesario)
- [ ] Implementar containers con max-widths
- [ ] Layout spacing y gutters
- [ ] Importar en `main.scss`

#### 4.4. Header / Footer

- [ ] Crear estilos para header si existe
- [ ] Crear estilos para footer si existe
- [ ] Refactorizar componentes JSX
- [ ] Testing completo

### Criterio de Aceptación Fase 4
✅ Componentes de layout migrados
✅ Navegación funcional en ambos temas
✅ Responsive behavior mantenido

---

## Fase 5: Migración de Páginas

### Objetivo
Migrar todas las páginas de la aplicación al nuevo sistema de diseño.

### Estrategia

Las páginas se migrarán en orden de **menor a mayor complejidad** para ganar experiencia con el sistema.

### Lista de Páginas (actualizar según aplicación real)

#### 5.1. Páginas Simples

- [ ] **Login** (`src/pages/Login.jsx`)
  - [ ] Crear `pages/_login.scss` si tiene estilos específicos
  - [ ] Refactorizar JSX para usar componentes migrados
  - [ ] Testing completo

- [ ] **404 / Not Found** (si existe)
  - [ ] Refactorizar con componentes migrados

#### 5.2. Páginas de Listado

- [ ] **Products** (Listado de productos)
  - [ ] Crear `pages/_products.scss` si es necesario
  - [ ] Usar Card components
  - [ ] Usar Button components
  - [ ] Testing completo

- [ ] **Clients** (Listado de clientes)
- [ ] **Suppliers** (Listado de proveedores)
- [ ] **Sales** (Listado de ventas)
- [ ] **Reservations** (Listado de reservaciones)

#### 5.3. Páginas de Detalle/Formularios

- [ ] **Product Detail / Edit**
- [ ] **Client Detail / Edit**
- [ ] **Supplier Detail / Edit**
- [ ] **Sale Detail**
- [ ] **Reservation Detail / Edit**

#### 5.4. Dashboard

- [ ] **Dashboard / Home**
  - Probablemente la página más compleja
  - Cards con estadísticas
  - Gráficos (si aplica)
  - Testing exhaustivo

#### 5.5. Páginas de Settings/Configuración

- [ ] **Settings**
- [ ] **Profile**
- [ ] Otras páginas de configuración

### Patrón de Migración por Página

Para cada página:

1. [ ] Identificar todos los componentes usados en la página
2. [ ] Verificar que esos componentes ya están migrados (deben estar en Fase 3)
3. [ ] Eliminar clases de Tailwind del JSX de la página
4. [ ] Reemplazar con clases BEM y componentes migrados
5. [ ] Crear archivo SCSS específico de la página solo si es necesario
6. [ ] Testing visual en light y dark mode
7. [ ] Verificar responsive behavior
8. [ ] Verificar navegación y flujos de usuario

### Criterio de Aceptación Fase 5
✅ Todas las páginas migradas
✅ No quedan clases de Tailwind en páginas
✅ Todas las páginas funcionales en light y dark mode
✅ Testing de integración completo

---

## Fase 6: Deprecación de Tailwind

### Objetivo
Eliminar completamente Tailwind CSS del proyecto.

### Tareas

#### 6.1. Auditoría Final

- [ ] Buscar todas las clases de Tailwind restantes en el código
  ```bash
  # Buscar clases comunes de Tailwind
  grep -r "className=.*\(bg-\|text-\|p-\|m-\|flex\|grid\)" src/
  ```
- [ ] Crear lista de archivos con clases de Tailwind pendientes
- [ ] Migrar componentes/páginas faltantes

#### 6.2. Limpieza de Código

- [ ] Eliminar imports de estilos de Tailwind en `src/main.jsx` o `src/index.css`
- [ ] Eliminar archivos de configuración:
  - [ ] `tailwind.config.js` (o `.ts`)
  - [ ] `postcss.config.js` (si solo se usaba para Tailwind)
- [ ] Eliminar referencias en `vite.config.js` si existen
- [ ] Limpiar `src/App.css` y `src/index.css` de imports de Tailwind

#### 6.3. Desinstalar Dependencias

- [ ] Desinstalar Tailwind CSS:
  ```bash
  pnpm remove tailwindcss postcss autoprefixer
  ```
- [ ] Verificar que no se rompió nada

#### 6.4. Limpieza del Sistema de Temas Antiguo

- [ ] Eliminar definiciones de múltiples temas en `src/App.css`
- [ ] Eliminar `src/themes/` si existe
- [ ] Eliminar `src/utils/themeUtils.js` si ya no se usa
- [ ] Limpiar `ThemeContext` de toda lógica legacy

#### 6.5. Actualizar Documentación

- [ ] Actualizar `README.md` con nueva arquitectura de estilos
- [ ] Actualizar `CLAUDE.md` con información de Sass
- [ ] Archivar documentos antiguos (moverlos a `docs/archived/`)

#### 6.6. Testing Final

- [ ] Testing completo de toda la aplicación
- [ ] Verificar performance (comparar bundle size antes/después)
- [ ] Verificar que no hay estilos rotos
- [ ] Testing en diferentes navegadores
- [ ] Testing responsive en diferentes dispositivos
- [ ] Testing de accesibilidad con herramientas (axe, WAVE)

#### 6.7. Build de Producción

- [ ] Ejecutar `pnpm build`
- [ ] Verificar que no hay errores ni warnings
- [ ] Analizar bundle size
- [ ] Verificar que la app funciona correctamente en preview: `pnpm preview`

### Criterio de Aceptación Fase 6
✅ Tailwind CSS completamente eliminado
✅ No quedan dependencias de Tailwind
✅ Aplicación funcional al 100%
✅ Bundle size optimizado
✅ Testing completo exitoso

---

## Checklist de Progreso Global

### ☐ Fase 1: Configuración Base
- [ ] 1.1. Instalar Dependencias
- [ ] 1.2. Crear Estructura de Carpetas
- [ ] 1.3. Configurar Imports

### ☐ Fase 2: Design Tokens y Theming
- [ ] 2.1. Variables Base
- [ ] 2.2. Mixin de Tematización
- [ ] 2.3. Mixins Comunes
- [ ] 2.4. Funciones Utilitarias
- [ ] 2.5. Estilos Base
- [ ] 2.6. Actualizar ThemeContext
- [ ] 2.7. Importar en main.scss

### ☐ Fase 3: Componentes Base
- [ ] 3.1. Button
- [ ] 3.2. Input
- [ ] 3.3. Checkbox
- [ ] 3.4. Switch
- [ ] 3.5. Badge
- [ ] 3.6. Spinner/Loader
- [ ] 3.7. Card
- [ ] 3.8. Dialog/Modal
- [ ] 3.9. Dropdown/Select
- [ ] 3.10. Tooltip
- [ ] 3.11. Progress Bar

### ☐ Fase 4: Componentes de Layout
- [ ] 4.1. Navigation Bar
- [ ] 4.2. Sidebar
- [ ] 4.3. Grid System
- [ ] 4.4. Header / Footer

### ☐ Fase 5: Migración de Páginas
- [ ] 5.1. Páginas Simples (Login, 404)
- [ ] 5.2. Páginas de Listado (Products, Clients, etc.)
- [ ] 5.3. Páginas de Detalle/Formularios
- [ ] 5.4. Dashboard
- [ ] 5.5. Páginas de Settings

### ☐ Fase 6: Deprecación de Tailwind
- [ ] 6.1. Auditoría Final
- [ ] 6.2. Limpieza de Código
- [ ] 6.3. Desinstalar Dependencias
- [ ] 6.4. Limpieza del Sistema de Temas Antiguo
- [ ] 6.5. Actualizar Documentación
- [ ] 6.6. Testing Final
- [ ] 6.7. Build de Producción

---

## Decisiones Técnicas

### DT-001: Nomenclatura BEM

**Decisión:** Usar nomenclatura BEM estricta para todos los componentes.

**Formato:**
```scss
.block {}
.block__element {}
.block--modifier {}
.block__element--modifier {}
```

**Ejemplo:**
```scss
.button {}
.button--primary {}
.button--large {}
.button__icon {}
```

### DT-002: Theming

**Decisión:** Usar clase en `<body>` para aplicar temas.

**Clases:**
- `.theme--light`
- `.theme--dark`

**Aplicación:**
```javascript
document.body.classList.add('theme--light');
```

### DT-003: Accesibilidad

**Decisión:** Todos los componentes deben cumplir WCAG 2.1 AA como mínimo.

**Requisitos:**
- Focus visible en todos los elementos interactivos
- Contraste de color mínimo 4.5:1 para texto normal
- Tamaño mínimo de toque 44x44px
- Labels semánticos y ARIA attributes donde sea necesario

### DT-004: Imports en Sass

**Decisión:** Usar `@import` en lugar de `@use` por simplicidad (Sass está deprecando `@import` pero aún es ampliamente usado).

**Nota:** Si el proyecto crece, considerar migrar a `@use` y `@forward` en el futuro.

### DT-005: Responsive Design

**Decisión:** Mantener breakpoints existentes o definir nuevos basados en contenido.

**Breakpoints sugeridos:**
```scss
$breakpoint-xs: 480px;
$breakpoint-s: 640px;
$breakpoint-m: 768px;
$breakpoint-l: 1024px;
$breakpoint-xl: 1280px;
$breakpoint-xxl: 1536px;
```

### DT-006: Animaciones

**Decisión:** Respetar `prefers-reduced-motion` para accesibilidad.

```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Métricas de Éxito

Al finalizar la implementación, deberíamos poder medir:

- **Reducción de Bundle Size**: Comparar tamaño antes/después
- **Performance**: Lighthouse score mejorado
- **Accesibilidad**: Lighthouse accessibility score ≥ 95
- **Mantenibilidad**: Reducción de líneas de código en componentes JSX
- **Consistencia**: 100% de componentes usando design system
- **Cobertura de Tests**: Mantener o mejorar cobertura de tests

---

## Notas y Consideraciones

### Coexistencia Temporal

Durante las fases 3-5, Tailwind y Sass coexistirán. Es importante:
- No mezclar Tailwind y BEM en el mismo componente
- Documentar qué componentes están migrados
- Priorizar componentes más usados primero

### Testing

- Crear tests visuales/snapshot para componentes críticos
- Verificar accesibilidad con herramientas automatizadas
- Testing manual en diferentes navegadores

### Performance

- Monitorear el tamaño del CSS generado
- Verificar que no haya duplicación de estilos
- Considerar code splitting si el CSS crece mucho

### Comunicación

- Comunicar a todo el equipo sobre el nuevo sistema
- Establecer code reviews estrictos durante la migración
- Actualizar guías de estilo para nuevos desarrolladores

---

## Recursos de Referencia

### Documentación Interna

- [Sistema de Diseño Fluent 2](./FLUENT_DESIGN_SYSTEM.md) - Referencia completa de tokens y componentes
- [Guía de Migración Original](./SASS_THEME_MIGRATION_GUIDE.md) - Contexto histórico

### Documentación Externa

- [Fluent 2 Design System](https://fluent2.microsoft.design/)
- [Microsoft Learn - Fluent UI](https://learn.microsoft.com/en-us/fluent-ui/web-components/)
- [Sass Documentation](https://sass-lang.com/documentation)
- [BEM Methodology](https://getbem.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Historial de Cambios

| Fecha | Versión | Cambios | Autor |
|-------|---------|---------|-------|
| 2025-10-29 | 1.0 | Creación inicial del documento | Claude Code |

---

**Próxima revisión programada:** Después de completar Fase 1

**Responsable del proyecto:** [Asignar]

**Estado actual:** ☐ En Planificación | ☐ En Progreso | ☐ Completado
