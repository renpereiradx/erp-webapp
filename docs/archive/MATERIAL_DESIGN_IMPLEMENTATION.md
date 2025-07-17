# Sistema de Diseño Material Design 3.0

Esta implementación del sistema de diseño Material Design 3.0 está basada en las especificaciones oficiales de Google y las directrices detalladas en `MATERIAL_DESIGN.MD`.

## 🎨 Características Principales

### 1. Sistema de Colores Completo
- **Modo Claro y Oscuro**: Paletas optimizadas para ambos modos
- **Colores Semánticos**: Primary, Secondary, Surface, Background, Error
- **Colores "On"**: Colores para texto/iconos que garantizan contraste accesible
- **Variantes de Superficie**: Diferentes niveles de contenedores para crear jerarquía visual

### 2. Tipografía Roboto
- **Escala Tipográfica Completa**: Display, Headline, Title, Body, Label
- **Pesos y Espaciados**: Configurados según especificaciones Material Design
- **Fuente Roboto**: Importada desde Google Fonts

### 3. Sistema de Elevación
- **6 Niveles**: De 0 a 5, cada uno con sombras específicas
- **Sombras Dinámicas**: Diferentes intensidades para modo claro y oscuro

### 4. Espaciado de 8dp
- **Grid Base**: Sistema basado en múltiplos de 8dp (8px en web)
- **Consistencia**: Garantiza alineación y espaciado coherente

### 5. Esquinas Redondeadas
- **Escala de Bordes**: Desde none hasta extra-large
- **Aplicación Contextual**: Diferentes radios para diferentes componentes

## 📁 Estructura de Archivos

```
src/
├── themes/
│   └── materialDesign.css          # CSS Variables y estilos del tema
├── utils/
│   └── materialDesignUtils.js      # Utilidades y helpers JavaScript
├── components/
│   └── MaterialDesignShowcase.jsx  # Componentes de demostración
└── MATERIAL_DESIGN.MD              # Especificaciones detalladas
```

## 🚀 Uso del Sistema

### Activación del Tema
```jsx
// El tema se activa automáticamente cuando se selecciona en ThemeSwitcher
<ThemeSwitcher />
```

### CSS Variables Disponibles
```css
/* Colores Principales */
--md-primary-main: #6200EE;
--md-primary-light: #BB86FC;
--md-primary-dark: #3700B3;
--md-on-primary: #FFFFFF;

/* Colores de Superficie */
--md-surface-main: #FFFFFF;
--md-surface-variant: #F5F5F5;
--md-on-surface: #000000;

/* Elevación */
--md-elevation-1: 0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24);

/* Espaciado */
--md-spacing-1: 8px;
--md-spacing-2: 16px;
--md-spacing-3: 24px;

/* Esquinas */
--md-corner-small: 8px;
--md-corner-medium: 12px;
--md-corner-large: 16px;
```

### Clases CSS Utilitarias
```css
/* Tipografía */
.md-display-large
.md-headline-medium
.md-body-large
.md-label-small

/* Elevación */
.md-elevation-1
.md-elevation-2
.md-elevation-3

/* Colores */
.md-primary
.md-secondary
.md-surface

/* Esquinas */
.md-corner-sm
.md-corner-md
.md-corner-lg
```

### Componentes JavaScript
```jsx
import { MaterialButton, MaterialCard, MaterialTextField } from '@/components/MaterialDesignShowcase';

// Botón Material Design
<MaterialButton variant="filled" color="primary" size="medium">
  <span className="material-symbols-outlined">add</span>
  Nuevo Item
</MaterialButton>

// Tarjeta Material Design
<MaterialCard elevation={2}>
  <h3>Título de la tarjeta</h3>
  <p>Contenido de la tarjeta...</p>
</MaterialCard>

// Campo de texto Material Design
<MaterialTextField 
  label="Email"
  placeholder="Ingresa tu email"
  type="email"
/>
```

### Utilidades JavaScript
```jsx
import { 
  getMaterialColors, 
  createMaterialStyles,
  materialSpacing 
} from '@/utils/materialDesignUtils';

// Obtener colores del tema actual
const colors = getMaterialColors('light');

// Crear estilos para componentes
const buttonStyles = createMaterialStyles.button('filled', 'primary', 'medium');

// Usar valores de espaciado
const padding = materialSpacing[2]; // 16px
```

## 🎯 Componentes Disponibles

### 1. MaterialButton
- **Variantes**: filled, outlined, text
- **Colores**: primary, secondary, error
- **Tamaños**: small, medium, large
- **Estados**: hover, focus, pressed, disabled

### 2. MaterialCard
- **Elevación**: Niveles 0-5 configurables
- **Superficie**: Colores automáticos según tema
- **Esquinas**: Redondeadas según especificaciones

### 3. MaterialTextField
- **Estados**: normal, focus, error
- **Etiquetas**: Soporte para labels
- **Texto de ayuda**: Helper text con estados

## 🌓 Modo Oscuro

El sistema incluye soporte completo para modo oscuro con:
- **Colores Optimizados**: Paleta específica para entornos con poca luz
- **Sombras Ajustadas**: Mayor contraste para modo oscuro
- **Transiciones Suaves**: Cambio fluido entre modos

## ♿ Accesibilidad

### Contraste
- **WCAG 2.0 Compliant**: Ratios de contraste mínimos garantizados
- **Texto sobre Colores**: Colores "on" optimizados para legibilidad

### Navegación
- **Focus Visible**: Estados de foco claramente definidos
- **Tamaños de Toque**: Mínimo 48dp x 48dp para elementos interactivos

### Semántica
- **HTML Semántico**: Elementos apropiados para cada contexto
- **ARIA**: Roles y propiedades cuando es necesario

## 📱 Responsividad

- **Diseño Adaptable**: Se ajusta a diferentes tamaños de pantalla
- **Grid System**: Compatible con Tailwind CSS
- **Componentes Flexibles**: Adaptan su comportamiento según el contexto

## 🔧 Personalización

### Colores Personalizados
```css
[data-theme='material-light'] {
  --md-primary-main: #YOUR_COLOR;
  --md-primary-light: #YOUR_LIGHT_COLOR;
  --md-primary-dark: #YOUR_DARK_COLOR;
}
```

### Espaciado Personalizado
```css
:root {
  --md-spacing-custom: 40px;
}
```

### Componentes Personalizados
```jsx
// Extender estilos base
const customButtonStyles = {
  ...createMaterialStyles.button('filled', 'primary'),
  borderRadius: '20px', // Override
  padding: '12px 24px'   // Override
};
```

## 📋 Lista de Verificación de Implementación

- [x] ✅ Sistema de colores completo (light/dark)
- [x] ✅ Tipografía Roboto con escala completa
- [x] ✅ Sistema de elevación (0-5 niveles)
- [x] ✅ Espaciado basado en 8dp grid
- [x] ✅ Esquinas redondeadas variables
- [x] ✅ CSS Variables organizadas
- [x] ✅ Clases utilitarias
- [x] ✅ Componentes base (Button, Card, TextField)
- [x] ✅ Utilidades JavaScript
- [x] ✅ Integración con sistema de temas existente
- [x] ✅ Showcase interactivo
- [x] ✅ Documentación completa

## 🚦 Próximos Pasos

1. **Componentes Adicionales**: Implementar más componentes (Dialog, Menu, Tabs, etc.)
2. **Animaciones**: Agregar transiciones y animaciones Material Motion
3. **Tokens de Diseño**: Considerar uso de Design Tokens para mayor escalabilidad
4. **Herramientas de Desarrollo**: Crear helpers para generar temas personalizados

## 📚 Referencias

- [Material Design Guidelines](https://m3.material.io/)
- [Material Design Colors](https://m3.material.io/styles/color/overview)
- [Material Design Typography](https://m3.material.io/styles/typography/overview)
- [Material Symbols](https://fonts.google.com/icons?icon.set=Material+Symbols)

---

**Nota**: Esta implementación sigue fielmente las especificaciones de Material Design 3.0 mientras mantiene compatibilidad con el sistema de temas existente de la aplicación.
