# Design System - ERP WEBAPP 🎨

Bienvenido a la guía centralizada del sistema de diseño para el ERP. Este sistema se basa en una estética **Professional, Systematic, and Airy**, optimizado para alta densidad de datos e interfaces operativas con una estética limpia, espaciosa y moderna.

## 📂 Organización de Archivos

Para facilitar la búsqueda de componentes, el sistema se divide en tres categorías principales:

### 1. [Fundamentos y Estructura](./FLUENT2_FUNDAMENTALS.html)
**Uso:** Definir la base de cualquier página nueva.
- **Layout:** Sidebars, Headers, Command Bars con efectos **Acrylic**.
- **Navegación:** Breadcrumbs (Migas de pan), Menús laterales refinados.
- **Feedback:** Message Bars (Alertas), Shimmers (Skeletons de carga), Indicadores de progreso suaves.
- **Tokens:** Colores semánticos y elevación sutil (sombras multi-capa).

### 2. [Componentes y Controles](./FLUENT2_COMPONENTS.html)
**Uso:** Interacción directa del usuario y entrada de datos.
- **Botones:** Primarios (con gradiente #005baf a #0074db y base #137fec), Secundarios, Esquema (Outline), Split Buttons y pestañas con borde inferior de 2px.
- **Inputs:** Campos de texto, numéricos con stepper, comboboxes con fondos Surface Container Low (`#f1f3fd`).
- **Selección:** Toggles (Interruptores), Checkboxes, Selects, Sliders.
- **Información:** Badges (Etiquetas de estado), Avatares, Tarjetas de KPI estándar (esquinas redondeadas de 12px) con sombras difusas.

### 3. [Visualización de Datos](./FLUENT2_DATA_VISUALIZATION.html)
**Uso:** Gestión de grandes volúmenes de información.
- **Data Grids:** Tablas de estilo Stitch con bordes separados, espaciado cero, cabeceras redondeadas y efectos de hover sutiles.
- **Jerarquías:** Vistas de árbol (Tree views) limpias para departamentos o carpetas.
- **Listas:** Feed de actividad temporal, Listas de directorio con tarjetas de perfil.

---

## 🛠️ Guía de Implementación

### Fuentes Locales
Usamos fuentes locales ubicadas en `/public/fonts/` para mayor velocidad:
- **Inter:** Fuente principal para lectura y UI (Semibold/Bold/Extrabold/Black para jerarquía).
- **JetBrains Mono:** Para datos numéricos, IDs, timestamps y códigos (monofonía).
- **Material Icons Round:** Iconografía base.

### Materiales y Efectos
Se han introducido utilidades CSS para efectos de profundidad modernos:
- **glass-acrylic:** Fondo traslúcido con desenfoque (blur) para headers y sidebars.
- **glass-mica:** Efecto de superficie sólida pero suave para fondos de aplicación.

### Frameworks
- **Tailwind CSS:** Configuración actualizada con el azul oficial del sistema (`primary: #137fec`), así como fondos de contenedores (`#f9f9ff`, `#f1f3fd`, `#ffffff`).
- **Icons:** Se recomienda usar `Material Symbols Outlined` (vía CDN) o `Material Icons Round` (local).

---
*Última actualización: Junio 2026*
