# Guías y Mejores Prácticas de Layout

Este documento describe las directrices fundamentales para estructurar y diseñar páginas dentro de la aplicación, específicamente cómo trabajar en conjunto con los *layouts* globales para evitar problemas de _responsiveness_ (adaptabilidad en diferentes dispositivos) y márgenes inesperados.

## 1. Regla de Oro: Evitar Divs Estructurales Redundantes en Sub-páginas

El sistema cuenta con un `MainLayout` (o equivalente) que se encarga de definir los paddings, anchos máximos y áreas de seguridad de la aplicación. Por consiguiente, las páginas internas (módulos, dashboards, detalles) no deben reiterar estas construcciones.

### ❌ Lo que NO debes hacer (Anti-patrón)
Implementar clases o contenedores que bloquean o sobrescriben el comportamiento responsivo global:

```jsx
// ANTI-PATRÓN: Contenedores restrictivos
const MiPagina = () => {
  return (
    // EVITAR: forzar min-h-screen, max-w muy fijos y paddings que duplican al layout base
    <div className="bg-background-light dark:bg-background-dark min-h-screen overflow-x-hidden font-display">
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8">
        <div className="layout-content-container">
           {/* Contenido */}
        </div>
      </div>
    </div>
  );
};
```

#### Problemas de esta práctica
1. **Paddings duplicados**: En pantallas medianas y móviles, el espacio real útil se reduce dramáticamente.
2. **Conflictos con `MainLayout`**: El layout padre ya cuenta con una organización por defecto para manejar la barra lateral, navbar y el espacio disponible.
3. **Pérdida de fluidez**: Componentes anidados (como cuadros y tablas) no se expandirán naturalmente al espacio máximo permitido por su ancestro jerárquico.

### ✅ Lo que SÍ debes hacer (Mejor práctica sugerida)
Las páginas deben comportarse como _fragmentos inyectados_ en el layout principal. Deben delegar el "lienzo" entero a su padre y ocuparse únicamente de ordenar sus componentes directos.

```jsx
// BUENA PRÁCTICA: Estructura fluida delegada
const MiPagina = () => {
  return (
    // USAR: un simple contenedor en flexbox flex-col para el contenido, delegando paddings globales al Layout
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        
       {/* Sección de Header / Titulo */}
       <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <h1>Título de Página</h1>
       </div>

       {/* Sección de Contenido Grid/Flex */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9">...</div>
          <div className="lg:col-span-3">...</div>
       </div>

    </div>
  );
};
```

## 2. Puntos Clave a Recordar al Desarrollar

- **Uso exclusivo de `flex flex-col gap-*`**: En el >90% de los casos, la etiqueta superior del compomente de *Página* solo debe necesitar establecerse como columna y proveer un *gap* global uniforme para separar Headers, Filtros y Tablas.
- **Transiciones y Animaciones**: Utiliza de manera consistente `animate-in fade-in duration-500` en el contenedor de entrada para garantizar consistencia visual a lo largo de los módulos.
- **Verifica todas las resoluciones**: Antes de dar por finalizada una página, redimensiona el navegador simulando resolución de iPad (ej. _1024x768_) o laptop clásica (_1366x768_). Excesos de márgenes o _paddings_ rígidos pueden "exprimir" tu contenido en el centro impidiendo que las tablas o cuadros se lean adecuadamente.
- **Delega responsabilidades**: Deja que `MainLayout` establezca los fondos (`bg-background-light`, etc) y las métricas de pantalla a pantalla (`min-h-screen`). Las sub-páginas únicamente manejan contenido.
