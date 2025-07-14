# Sistema de Diseño Fluent 2.0

Esta implementación del sistema de diseño Fluent 2.0 está basada en las especificaciones oficiales de Microsoft y las directrices detalladas en `FLUENT_2.md`.

## 🎨 Características Principales

### 1. Sistema de Colores Completo
- **Modo Claro y Oscuro**: Paletas optimizadas para ambos modos con ajustes específicos
- **Colores de Marca**: Primary, Secondary con estados interactivos (hover, pressed, selected)
- **Colores Neutros**: Escala completa de grises (grey10 a grey160) para superficies y texto
- **Colores Semánticos**: Success, Warning, Danger, Info para comunicar estados
- **Colores de Superficie**: Múltiples niveles de superficies para jerarquía visual

### 2. Tipografía Segoe UI
- **Escala Tipográfica Completa**: Display, Large Title, Title, Subtitle, Body, Caption
- **Jerarquía Clara**: Pesos y tamaños optimizados para escaneo visual
- **Stack de Fuentes**: Segoe UI con fallbacks multiplataforma

### 3. Sistema de Elevación
- **6 Niveles**: De 2 a 64, con sombras suaves y difusas
- **Adaptación por Tema**: Sombras más intensas para modo oscuro
- **Propósito Claro**: Distinguir superficies y elementos interactivos

### 4. Espaciado por Tokens
- **Sistema Basado en Tokens**: size20 (2px) hasta size560 (56px)
- **Consistencia**: Garantiza espaciado uniforme en toda la aplicación
- **Flexibilidad**: Fácil mantenimiento y escalado

### 5. Esquinas Redondeadas
- **Escala Variable**: None, Small, Medium, Large, XLarge, Circular
- **Aplicación Contextual**: Diferentes radios según el tipo de componente

### 6. Sistema de Movimiento
- **Duraciones**: Ultra-fast (50ms) a Ultra-slow (500ms)
- **Curvas de Animación**: Accelerate, Decelerate, Easy-ease para diferentes contextos
- **Transiciones Fluidas**: Mejoran la experiencia del usuario

## 📁 Estructura de Archivos

```
src/
├── themes/
│   └── fluentDesign.css           # CSS Variables y estilos del tema
├── utils/
│   └── fluentDesignUtils.js       # Utilidades y helpers JavaScript
├── components/
│   └── FluentDesignShowcase.jsx   # Componentes de demostración
└── FLUENT_2.md                    # Especificaciones detalladas
```

## 🚀 Uso del Sistema

### Activación del Tema
```jsx
// El tema se activa automáticamente cuando se selecciona en ThemeSwitcher
<ThemeSwitcher />
```

### CSS Variables Disponibles

#### Colores de Marca
```css
--fluent-brand-primary: #0078D4;
--fluent-brand-primary-hover: #005A9E;
--fluent-brand-primary-pressed: #004578;
--fluent-brand-secondary: #40E0D0;
```

#### Colores de Superficie
```css
--fluent-surface-primary: #FFFFFF;
--fluent-surface-secondary: #FAF9F8;
--fluent-surface-card: #FFFFFF;
--fluent-surface-card-hover: #F8F8F8;
```

#### Colores de Texto
```css
--fluent-text-primary: #212121;
--fluent-text-secondary: #605E5C;
--fluent-text-on-accent: #FFFFFF;
```

#### Elevación
```css
--fluent-shadow-2: 0px 1px 2px rgba(0, 0, 0, 0.14), 0px 0px 2px rgba(0, 0, 0, 0.12);
--fluent-shadow-8: 0px 4px 8px rgba(0, 0, 0, 0.14), 0px 0px 2px rgba(0, 0, 0, 0.12);
--fluent-shadow-28: 0px 14px 28px rgba(0, 0, 0, 0.24), 0px 0px 8px rgba(0, 0, 0, 0.20);
```

#### Espaciado
```css
--fluent-size-80: 8px;
--fluent-size-120: 12px;
--fluent-size-160: 16px;
--fluent-size-240: 24px;
```

#### Esquinas
```css
--fluent-corner-radius-small: 2px;
--fluent-corner-radius-medium: 4px;
--fluent-corner-radius-large: 6px;
--fluent-corner-radius-circular: 10000px;
```

### Clases CSS Utilitarias

#### Tipografía
```css
.fluent-display        /* 68px / 92px, Semibold */
.fluent-large-title    /* 40px / 52px, Semibold */
.fluent-title          /* 28px / 36px, Semibold */
.fluent-subtitle       /* 20px / 28px, Semibold */
.fluent-body-large     /* 18px / 24px, Regular */
.fluent-body           /* 14px / 20px, Regular */
.fluent-body-strong    /* 14px / 20px, Semibold */
.fluent-caption        /* 12px / 16px, Regular */
.fluent-caption-strong /* 12px / 16px, Semibold */
```

#### Elevación
```css
.fluent-elevation-2
.fluent-elevation-4
.fluent-elevation-8
.fluent-elevation-16
.fluent-elevation-28
.fluent-elevation-64
```

#### Superficies
```css
.fluent-surface-primary
.fluent-surface-secondary
.fluent-surface-card
.fluent-brand-primary
```

#### Esquinas
```css
.fluent-corner-small
.fluent-corner-medium
.fluent-corner-large
.fluent-corner-circular
```

#### Movimiento
```css
.fluent-motion-fade-in
.fluent-motion-slide-up
.fluent-motion-scale-in
```

### Componentes JavaScript

#### FluentButton
```jsx
import { FluentButton } from '@/components/FluentDesignShowcase';

// Variantes de apariencia
<FluentButton appearance="primary">Primary Button</FluentButton>
<FluentButton appearance="outline">Outline Button</FluentButton>
<FluentButton appearance="subtle">Subtle Button</FluentButton>
<FluentButton appearance="transparent">Transparent Button</FluentButton>

// Tamaños
<FluentButton size="small">Small</FluentButton>
<FluentButton size="medium">Medium</FluentButton>
<FluentButton size="large">Large</FluentButton>
```

#### FluentCard
```jsx
import { FluentCard } from '@/components/FluentDesignShowcase';

// Elevación básica
<FluentCard elevation={4}>
  <h3>Título de la tarjeta</h3>
  <p>Contenido de la tarjeta...</p>
</FluentCard>

// Tarjeta interactiva
<FluentCard elevation={8} interactive>
  <h3>Tarjeta Interactiva</h3>
  <p>Responde a hover y click</p>
</FluentCard>
```

#### FluentInput
```jsx
import { FluentInput } from '@/components/FluentDesignShowcase';

// Campo básico
<FluentInput 
  label="Email"
  placeholder="Ingresa tu email"
  type="email"
/>

// Campo con error
<FluentInput 
  label="Campo requerido"
  placeholder="Este campo es obligatorio"
  error={true}
  helperText="Por favor ingresa un valor válido"
/>

// Tamaños
<FluentInput size="small" label="Small Input" />
<FluentInput size="medium" label="Medium Input" />
<FluentInput size="large" label="Large Input" />
```

#### StatusCard
```jsx
import { StatusCard } from '@/components/FluentDesignShowcase';

<StatusCard 
  type="success" 
  title="Operación Completada" 
  description="Los cambios se guardaron exitosamente."
/>

<StatusCard 
  type="warning" 
  title="Advertencia" 
  description="Revisa la configuración antes de continuar."
/>

<StatusCard 
  type="danger" 
  title="Error" 
  description="No se pudo procesar la solicitud."
/>

<StatusCard 
  type="info" 
  title="Información" 
  description="Nuevas funciones disponibles."
/>
```

### Utilidades JavaScript

```jsx
import { 
  getFluentColors, 
  createFluentStyles,
  fluentSpacing,
  applyFluentMotion 
} from '@/utils/fluentDesignUtils';

// Obtener colores del tema
const colors = getFluentColors('light');

// Crear estilos para componentes
const buttonStyles = createFluentStyles.button('default', 'medium', 'primary');
const cardStyles = createFluentStyles.card(8, true);

// Usar tokens de espaciado
const padding = fluentSpacing[160]; // 16px

// Aplicar movimiento
const motionStyles = applyFluentMotion('fade-in');
```

## 🌓 Modo Oscuro

El sistema incluye soporte completo para modo oscuro con:

### Colores Optimizados
- **Marca**: Primary más brillante (#2899F5) para mayor visibilidad
- **Superficies**: Tonos grises oscuros para reducir fatiga visual
- **Texto**: Blanco con opacidad para jerarquía clara

### Sombras Ajustadas
- **Mayor Contraste**: Sombras más intensas para modo oscuro
- **Visibilidad**: Mejor definición de elevación en entornos oscuros

## ♿ Accesibilidad

### Contraste
- **Texto Estándar**: ≥ 4.5:1 ratio de contraste
- **Texto Grande**: ≥ 3:1 ratio de contraste
- **Estados de Foco**: Outlines claros y visibles

### Interacción
- **Touch Targets**: Tamaños adecuados para pantallas táctiles
- **Estados Claros**: Hover, focus, pressed bien definidos
- **Navegación por Teclado**: Soporte completo

### Personalización
- **Esquemas Personalizados**: Permite configuración del usuario
- **Múltiples Indicadores**: No depende solo del color para comunicar

## 📱 Responsividad

- **Adaptabilidad Natural**: Se ajusta a diferentes plataformas
- **Grid System**: Compatible con sistemas de diseño modernos
- **Componentes Flexibles**: Adaptan comportamiento según contexto

## 🎬 Movimiento y Animación

### Duraciones Disponibles
```css
--fluent-duration-ultra-fast: 50ms;   /* Micro-interacciones */
--fluent-duration-fast: 150ms;        /* Hover, focus */
--fluent-duration-normal: 200ms;      /* Transiciones estándar */
--fluent-duration-gentle: 250ms;      /* Cambios suaves */
--fluent-duration-slow: 300ms;        /* Transformaciones */
```

### Curvas de Animación
```css
--fluent-curve-accelerate-max;    /* Salidas rápidas */
--fluent-curve-decelerate-mid;    /* Entradas suaves */
--fluent-curve-easy-ease;         /* Transiciones generales */
```

### Animaciones Pre-definidas
- **Fade In**: Aparición suave
- **Slide Up**: Deslizamiento desde abajo
- **Scale In**: Escalado desde el centro

## 🔧 Personalización

### Colores Personalizados
```css
[data-theme='fluent-light'] {
  --fluent-brand-primary: #YOUR_BRAND_COLOR;
  --fluent-brand-primary-hover: #YOUR_HOVER_COLOR;
  --fluent-brand-primary-pressed: #YOUR_PRESSED_COLOR;
}
```

### Espaciado Personalizado
```css
:root {
  --fluent-size-custom: 18px;
}
```

### Componentes Personalizados
```jsx
// Extender estilos base
const customButtonStyles = {
  ...createFluentStyles.button('default', 'medium', 'primary'),
  borderRadius: fluentCorners.xlarge, // Override
  padding: `0 ${fluentSpacing[240]}`   // Override
};
```

## 📋 Lista de Verificación de Implementación

- [x] ✅ Sistema de colores completo (light/dark)
- [x] ✅ Tipografía Segoe UI con escala completa
- [x] ✅ Sistema de elevación (2, 4, 8, 16, 28, 64)
- [x] ✅ Espaciado basado en tokens
- [x] ✅ Esquinas redondeadas variables
- [x] ✅ Sistema de movimiento y animación
- [x] ✅ CSS Variables organizadas
- [x] ✅ Clases utilitarias
- [x] ✅ Componentes base (Button, Card, Input, StatusCard)
- [x] ✅ Utilidades JavaScript
- [x] ✅ Integración con sistema de temas existente
- [x] ✅ Showcase interactivo
- [x] ✅ Estados interactivos (hover, focus, pressed)
- [x] ✅ Documentación completa

## 🚦 Próximos Pasos

1. **Componentes Adicionales**: Implementar más componentes Fluent UI (Dialog, Menu, NavigationView, etc.)
2. **Iconografía**: Integrar Fluent UI Icons
3. **Tokens Avanzados**: Considerar Design Tokens para mayor escalabilidad
4. **Herramientas**: Crear utilidades para generar temas personalizados
5. **Accessibility**: Expandir soporte para lectores de pantalla

## 📚 Referencias

- [Fluent 2 Design System](https://fluent2.microsoft.design/)
- [Fluent UI Documentation](https://developer.microsoft.com/en-us/fluentui)
- [Microsoft Design Guidelines](https://docs.microsoft.com/en-us/windows/apps/design/)
- [Fluent UI Icons](https://github.com/microsoft/fluentui-system-icons)

---

**Nota**: Esta implementación sigue fielmente las especificaciones de Fluent Design 2.0 mientras mantiene compatibilidad con el sistema de temas existente de la aplicación, priorizando la accesibilidad y la experiencia de usuario natural en cada plataforma.
