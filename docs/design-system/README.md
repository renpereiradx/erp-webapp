# Design System - Fluent ERP 2.0 🎨

Bienvenido a la guía centralizada del sistema de diseño para el ERP. Este sistema se basa en **Microsoft Fluent 2.0**, optimizado para alta densidad de datos y interfaces operativas.

## 📂 Organización de Archivos

Para facilitar la búsqueda de componentes, el sistema se divide en tres categorías principales:

### 1. [Fundamentos y Estructura](./FLUENT2_FUNDAMENTALS.html)
**Uso:** Definir la base de cualquier página nueva.
- **Layout:** Sidebars, Headers, Command Bars.
- **Navegación:** Breadcrumbs (Migas de pan), Menús laterales.
- **Feedback:** Message Bars (Alertas), Shimmers (Skeletons de carga), Indicadores de progreso.
- **Tokens:** Colores semánticos y elevación (sombras).

### 2. [Componentes y Controles](./FLUENT2_COMPONENTS.html)
**Uso:** Interacción directa del usuario y entrada de datos.
- **Botones:** Primarios, Secundarios, Esquema (Outline), Split Buttons.
- **Inputs:** Campos de texto, numéricos con stepper, comboboxes multiselect.
- **Selección:** Toggles (Interruptores), Checkboxes, Selects, Sliders.
- **Información:** Badges (Etiquetas de estado), Avatares, Tarjetas de KPI.

### 3. [Visualización de Datos](./FLUENT2_DATA_VISUALIZATION.html)
**Uso:** Gestión de grandes volúmenes de información.
- **Data Grids:** Tablas de alta densidad con selección múltiple y edición masiva.
- **Jerarquías:** Vistas de árbol (Tree views) para departamentos o carpetas.
- **Listas:** Feed de actividad temporal, Listas de directorio con tarjetas de perfil.

---

## 🛠️ Guía de Implementación

### Fuentes Locales
Usamos fuentes locales ubicadas en `/public/fonts/` para mayor velocidad:
- **Inter:** Fuente principal para lectura y UI.
- **JetBrains Mono:** Para datos numéricos y códigos (monofonía).
- **Material Icons Round:** Iconografía base.

Para usarlas, importa el archivo de recursos en tu HTML:
```html
<link rel="stylesheet" href="./FLUENT2_RESOURCES.css">
```

### Frameworks
- **Tailwind CSS:** Se usa la configuración base definida en los archivos HTML para mantener los colores corporativos (`primary: #106ebe`).
- **Icons:** Se recomienda usar `Material Symbols Outlined` (vía CDN) o `Material Icons Round` (local) según la necesidad de conexión.

---
*Última actualización: Marzo 2026*
