# Mobile Menu Button Visibility Fix

## Problem
El botón del menú móvil con clase `erp-mobile-menu-btn` se estaba mostrando en versión desktop cuando debería estar completamente oculto. Esto causaba que el botón interfiriera con la visualización del sidebar (logo del ERP System y menú de navegación) en pantallas grandes.

## Root Cause
- El botón tenía solo la clase `lg:hidden` de Tailwind
- No había una verificación adicional programática para garantizar que estuviera oculto en pantallas grandes
- Faltaba una lógica reactiva para detectar cambios de tamaño de pantalla

## Solution Implemented

### 1. Hook personalizado para detección de pantalla grande
```jsx
const [isLargeScreen, setIsLargeScreen] = useState(false);

useEffect(() => {
  const checkScreenSize = () => {
    setIsLargeScreen(window.innerWidth >= 1024);
  };

  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
  
  return () => window.removeEventListener('resize', checkScreenSize);
}, []);
```

### 2. Doble verificación en el botón móvil
```jsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => setSidebarOpen(true)}
  className="erp-mobile-menu-btn px-4 block lg:hidden"
  style={{ 
    borderRight: isNeoBrutalist ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
    color: 'var(--foreground)',
    display: isLargeScreen ? 'none' : 'flex'  // ← Verificación programática adicional
  }}
  data-testid="mobile-menu-btn"
  data-component="mobile-menu-btn"
>
  <Menu className="h-6 w-6" />
</Button>
```

## Features Added
- ✅ Detección reactiva del tamaño de pantalla
- ✅ Doble verificación: Tailwind CSS (`lg:hidden`) + JavaScript (`display: isLargeScreen ? 'none' : 'flex'`)
- ✅ Cleanup adecuado del event listener
- ✅ Mantiene todos los data attributes para testing
- ✅ Compatible con todos los temas (Neo-Brutalism, Material, Fluent)

## Elements Affected
- **Desktop (≥1024px)**: Botón completamente oculto, sidebar siempre visible
- **Mobile (<1024px)**: Botón visible, sidebar controlado por estado

## Files Modified
- `/src/layouts/MainLayout.jsx`: Agregado hook de detección de pantalla y doble verificación de visibilidad

## Testing
- ✅ No errors de compilación/lint
- ✅ Build exitoso
- ✅ Lógica responsive funcional
- ✅ Compatible con todos los temas implementados

## Expected Behavior
En **desktop** (≥1024px):
- El botón `erp-mobile-menu-btn` debe estar completamente oculto
- El sidebar debe estar siempre visible con el logo "ERP System" y el menú de navegación
- El contenido principal debe tener margen izquierdo (`lg:pl-72`)

En **mobile** (<1024px):
- El botón `erp-mobile-menu-btn` debe ser visible en la navbar
- El sidebar debe ser un overlay controlado por el estado `sidebarOpen`
- Al hacer click en el botón debe abrir/cerrar el sidebar móvil
