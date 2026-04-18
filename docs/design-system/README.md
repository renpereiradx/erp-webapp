# Design System - Fluent ERP 2.0 🎨

Bienvenido a la guía centralizada del sistema de diseño para el ERP. Este sistema se basa en **Microsoft Fluent 2.0**, optimizado para alta densidad de datos y interfaces operativas con una estética limpia, espaciosa y moderna.

## 📂 Organización de Archivos

Para facilitar la búsqueda de componentes, el sistema se divide en tres categorías principales:

### 1. [Fundamentos y Estructura](./FLUENT2_FUNDAMENTALS.html)
**Uso:** Definir la base de cualquier página nueva.
- **Layout:** Sidebars, Headers, Command Bars con efectos **Acrylic**.
- **Navegación:** Breadcrumbs (Migas de pan), Menús laterales refinados.
- **Feedback:** Message Bars (Alertas), Shimmers (Skeletons de carga), Indicadores de progreso suaves.
- **Tokens:** Colores semánticos de Fluent 2 y elevación sutil (sombras multi-capa).

### 2. [Componentes y Controles](./FLUENT2_COMPONENTS.html)
**Uso:** Interacción directa del usuario y entrada de datos.
- **Botones:** Primarios (#0f6cbd), Secundarios, Esquema (Outline), Split Buttons.
- **Inputs:** Campos de texto, numéricos con stepper, comboboxes con fondos `#f3f2f1`.
- **Selección:** Toggles (Interruptores), Checkboxes, Selects, Sliders.
- **Información:** Badges (Etiquetas de estado), Avatares, Tarjetas de KPI con sombras `fluent-2`.

### 3. [Visualización de Datos](./FLUENT2_DATA_VISUALIZATION.html)
**Uso:** Gestión de grandes volúmenes de información.
- **Data Grids:** Tablas de alta densidad con espaciado generoso y hovers sutiles.
- **Jerarquías:** Vistas de árbol (Tree views) limpias para departamentos o carpetas.
- **Listas:** Feed de actividad temporal, Listas de directorio con tarjetas de perfil.

---

## 🛠️ Guía de Implementación

### Fuentes Locales
Usamos fuentes locales ubicadas en `/public/fonts/` para mayor velocidad:
- **Inter:** Fuente principal para lectura y UI (Semibold/Bold para jerarquía).
- **JetBrains Mono:** Para datos numéricos y códigos (monofonía).
- **Material Icons Round:** Iconografía base.

### Materiales y Efectos
Se han introducido utilidades CSS para efectos de profundidad modernos:
- **glass-acrylic:** Fondo traslúcido con desenfoque (blur) para headers y sidebars.
- **glass-mica:** Efecto de superficie sólida pero suave para fondos de aplicación.

### Frameworks
- **Tailwind CSS:** Configuración actualizada con el azul oficial de Fluent 2 (`primary: #0f6cbd`).
- **Icons:** Se recomienda usar `Material Symbols Outlined` (vía CDN) o `Material Icons Round` (local).

---
*Última actualización: Abril 2026*
