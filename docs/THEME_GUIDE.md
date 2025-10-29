# Theme System Quick Start Guide

**Actualizado:** 2025-10-29 | **Sistema:** Fluent UI 2 + Sass

---

## Resumen

El sistema de temas de la aplicación ERP ahora utiliza **Microsoft Fluent Design System 2** con **dos modos únicamente**:
- **Light Mode** (Modo Claro)
- **Dark Mode** (Modo Oscuro)

El cambio entre modos es instantáneo y se persiste automáticamente.

---

## Getting Started

### 1. Acceder a la Configuración de Tema

1. **Login a la aplicación**:
   - Usa credenciales de demo: `demo@erp.com` / `demo123`
   - O cualquier usuario/contraseña válido

2. **Navegar a Settings**:
   - Click en "Settings" en el sidebar
   - O ve directamente a `/settings`

3. **Cambiar Tema**:
   - Encuentra la sección "Theme Selection" o "Modo de Tema"
   - Click en el botón toggle para cambiar entre Light y Dark
   - El cambio es instantáneo

---

## Diferencias entre Modos

### Light Mode (Modo Claro)
- **Fondos**: Blancos y grises muy claros (#FFFFFF, #F3F2F1)
- **Textos**: Grises oscuros (#323130, #605E5C)
- **Acentos**: Azul Fluent (#0078D4)
- **Bordes**: Grises sutiles (#D2D0CE)
- **Uso**: Ideal para entornos bien iluminados
- **Contraste**: Alto contraste para legibilidad

### Dark Mode (Modo Oscuro)
- **Fondos**: Grises muy oscuros y negros (#242424, #1A1A1A)
- **Textos**: Grises claros y blancos (#D6D6D6, #E0E0E0)
- **Acentos**: Azul Fluent claro (#5CAEF5)
- **Bordes**: Grises medios (#424242)
- **Uso**: Ideal para entornos con poca luz o trabajo nocturno
- **Contraste**: Reducción de fatiga visual

---

## Testing Theme Changes

Después de cambiar el modo, verás cambios inmediatos en:

### Componentes UI
- ✅ **Navegación**: Barra de navegación y sidebar
- ✅ **Botones**: Todos los botones (primary, secondary, ghost)
- ✅ **Tarjetas (Cards)**: Fondos, bordes y sombras
- ✅ **Inputs**: Campos de texto y formularios
- ✅ **Modales/Diálogos**: Fondos y overlays
- ✅ **Tablas**: Filas, bordes y headers
- ✅ **Badges**: Etiquetas de estado
- ✅ **Tooltips**: Información contextual

### Páginas
- ✅ **Dashboard**: Gráficos y métricas
- ✅ **Clientes**: Listados y detalles
- ✅ **Productos**: Catálogo e inventario
- ✅ **Ventas**: Transacciones y reportes
- ✅ **Reservaciones**: Calendarios y bookings
- ✅ **Settings**: Configuración

---

## Theme Persistence

- ✅ Tu elección se **guarda automáticamente**
- ✅ El tema persiste al **cerrar/abrir el navegador**
- ✅ Cada navegador/dispositivo mantiene su **configuración independiente**
- ✅ No requiere autenticación para recordar preferencia

---

## Accesibilidad

### Cumplimiento WCAG 2.1 AA/AAA

Ambos modos cumplen con estándares de accesibilidad:

- **Contraste de color**: Mínimo 4.5:1 para texto normal
- **Focus visible**: Todos los elementos interactivos tienen indicador de foco
- **Navegación por teclado**: Tab/Shift+Tab funcionan correctamente
- **Screen readers**: Elementos semánticos y ARIA labels

### Atajos de Teclado

| Acción | Atajo |
|--------|-------|
| Cambiar tema | `Ctrl + Shift + T` (si está implementado) |
| Navegar entre elementos | `Tab` / `Shift+Tab` |
| Activar elemento | `Enter` / `Space` |

---

## Troubleshooting

### El tema no cambia
1. ✅ Verifica que estás en la página Settings (`/settings`)
2. ✅ Comprueba la consola del navegador por errores
3. ✅ Intenta hacer refresh (`F5` o `Ctrl+R`)
4. ✅ Borra caché del navegador y recarga

### Visualización incorrecta
1. ✅ Haz un hard refresh (`Ctrl+F5`)
2. ✅ Verifica que estás en la última versión de la app
3. ✅ Prueba en modo incógnito para descartar extensiones
4. ✅ Comprueba que tu navegador soporta CSS moderno

### El tema no se guarda
1. ✅ Verifica que el navegador permite `localStorage`
2. ✅ Desactiva modo privado/incógnito temporalmente
3. ✅ Comprueba permisos de cookies/almacenamiento

---

## Quick Demo Script

Para probar rápidamente ambos modos:

### Test de Light Mode
1. **Inicia en Light Mode** (por defecto)
2. **Navega a Dashboard** - observa fondos claros, texto oscuro
3. **Ve a Productos** - verifica cards con sombras sutiles
4. **Abre un formulario** - inputs con bordes grises claros
5. **Verifica legibilidad** - todo el texto debe ser fácil de leer

### Test de Dark Mode
1. **Cambia a Dark Mode** en Settings
2. **Regresa a Dashboard** - fondos oscuros, texto claro
3. **Ve a Clientes** - cards con elevación sutil
4. **Abre un modal** - overlay oscuro, contenido visible
5. **Verifica contraste** - textos claros sobre fondos oscuros

### Test de Persistencia
1. **Selecciona Dark Mode**
2. **Cierra el navegador completamente**
3. **Reabre la aplicación**
4. **Verifica**: Debe mantener Dark Mode

---

## Best Practices para Testers

### Checklist de Testing

- [ ] **Cambio instantáneo**: El tema cambia sin delay perceptible
- [ ] **Consistencia visual**: Todos los componentes respetan el tema
- [ ] **Legibilidad**: Texto claramente legible en ambos modos
- [ ] **Contraste suficiente**: No hay texto "fantasma" o difícil de ver
- [ ] **Iconos visibles**: Todos los iconos son claramente visibles
- [ ] **Borders definidos**: Bordes de componentes son distinguibles
- [ ] **Hover states**: Estados hover funcionan en ambos modos
- [ ] **Focus visible**: Indicador de foco claro en elementos interactivos
- [ ] **Persistencia**: Tema se mantiene al recargar página
- [ ] **Responsive**: Tema funciona correctamente en mobile/tablet
- [ ] **Performance**: Sin lag al cambiar de tema
- [ ] **Sin errores**: Console limpia, sin warnings relacionados a temas

### Test en Diferentes Dispositivos

| Dispositivo | Resolución | Light Mode | Dark Mode |
|-------------|-----------|------------|-----------|
| Desktop | 1920x1080 | ☐ | ☐ |
| Laptop | 1366x768 | ☐ | ☐ |
| Tablet | 768x1024 | ☐ | ☐ |
| Mobile | 375x667 | ☐ | ☐ |

### Reportar Issues

Al encontrar problemas, incluir:
1. **Modo**: Light o Dark
2. **Navegador**: Chrome, Firefox, Safari, Edge (con versión)
3. **Página**: URL o nombre de la página
4. **Descripción**: Qué se esperaba vs qué ocurrió
5. **Screenshot**: Captura de pantalla del problema
6. **Pasos**: Cómo reproducir el issue

---

## Características Técnicas (Para Desarrolladores)

### Arquitectura
- **Framework**: React 19 + Vite 6
- **Estilos**: Sass/SCSS con metodología BEM
- **Design System**: Microsoft Fluent UI 2
- **Theme Management**: React Context
- **Persistencia**: `localStorage`

### Tokens de Diseño
- **Colores**: 16 valores neutros + rampa de marca de 16 valores
- **Espaciado**: Sistema base-4 (4px, 8px, 12px, 16px, ...)
- **Tipografía**: Type ramp de 100-1100
- **Sombras**: 6 niveles de elevación
- **Border Radius**: 0, 2px, 4px, 6px, 8px

### Documentación Técnica
- `docs/FLUENT_DESIGN_SYSTEM.md` - Especificaciones completas
- `docs/FLUENT_IMPLEMENTATION_PROGRESS.md` - Roadmap de implementación
- `docs/THEME_SYSTEM.md` - Documentación técnica del sistema

---

## FAQ

**P: ¿Puedo tener temas diferentes para cada pestaña del navegador?**
R: Sí, cada pestaña comparte el mismo tema ya que usa `localStorage` global del dominio.

**P: ¿El tema se sincroniza entre dispositivos?**
R: No, cada navegador/dispositivo mantiene su preferencia localmente.

**P: ¿Hay más temas además de Light y Dark?**
R: No, la aplicación solo soporta estos dos modos basados en Fluent UI 2.

**P: ¿Puedo personalizar los colores?**
R: No desde la UI, pero los desarrolladores pueden ajustar tokens Sass.

**P: ¿El tema afecta la performance?**
R: No, el cambio es instantáneo y no impacta el rendimiento.

**P: ¿Funciona en navegadores antiguos?**
R: Requiere navegadores modernos con soporte para CSS Variables (2016+).

---

## Recursos Adicionales

- **Microsoft Fluent Design**: https://fluent2.microsoft.design/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **BEM Methodology**: https://getbem.com/

---

**Última actualización:** 2025-10-29
**Mantenido por:** Equipo Frontend
**Versión del sistema:** 2.0 (Fluent UI 2 + Sass)
