# Tarea: Implementar un Sistema Multi-Tema en Proyecto React + Tailwind

## 1. Rol y Objetivo

**Rol:** Eres un desarrollador experto en React, Tailwind CSS y Zustand.

**Objetivo Principal:** Analizar la estructura de archivos de mi proyecto y aplicar los cambios necesarios para implementar un sistema de temas dinámico y escalable. El sistema debe soportar tres temas (Base, Material, Fluent), cada uno con una variante *light* y *dark*.

---

## 2. Estrategia a Implementar

La estrategia se basa en el uso de **variables de CSS** controladas por un atributo `data-theme` en la etiqueta `<html>`. Utilizaremos la librería `next-themes` para gestionar el estado y la persistencia del tema seleccionado.

---

## 3. Instrucciones Detalladas

Sigue estos pasos en orden para modificar el proyecto.

### **Paso 1: Instalar Dependencias**

Ejecuta el siguiente comando en la terminal del proyecto para instalar la librería necesaria:

```bash
npm install next-themes
```

### **Paso 2: Modificar el Archivo CSS Principal**

1.  Localiza el archivo CSS principal de la aplicación (usualmente `src/index.css` o `src/styles/globals.css`).
2.  Añade el siguiente bloque de código al inicio del archivo. Este código define todas las variables para nuestros temas.

```css
/* Asegúrate de que las directivas de Tailwind estén presentes */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* --- TEMA BASE (POR DEFECTO) --- */
  :root {
    --color-primary: #3b82f6; /* blue-500 */
    --color-secondary: #6b7280; /* gray-500 */
    --color-background: #ffffff;
    --color-text: #111827; /* gray-900 */
    --border-radius: 0.5rem;
  }

  [data-theme='base-dark'] {
    --color-primary: #60a5fa; /* blue-400 */
    --color-secondary: #9ca3af; /* gray-400 */
    --color-background: #1f2937; /* gray-800 */
    --color-text: #f9fafb; /* gray-50 */
  }

  /* --- TEMA MATERIAL --- */
  [data-theme='material-light'] {
    --color-primary: #6200ee;
    --color-secondary: #03dac6;
    --color-background: #ffffff;
    --color-text: #000000;
    --border-radius: 0.25rem;
  }

  [data-theme='material-dark'] {
    --color-primary: #bb86fc;
    --color-secondary: #03dac6;
    --color-background: #121212;
    --color-text: #ffffff;
    --border-radius: 0.25rem;
  }

  /* --- TEMA FLUENT --- */
  [data-theme='fluent-light'] {
    --color-primary: #0078d4;
    --color-secondary: #eff6fc;
    --color-background: #ffffff;
    --color-text: #323130;
    --border-radius: 0.125rem;
  }
  
  [data-theme='fluent-dark'] {
    --color-primary: #2899f5;
    --color-secondary: #323130;
    --color-background: #201f1e;
    --color-text: #f3f2f1;
    --border-radius: 0.125rem;
  }
}
```

### **Paso 3: Configurar Tailwind**

1.  Abre el archivo `tailwind.config.js`.
2.  Modifica la sección `theme` para que utilice las variables CSS que definimos.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        // Renombramos 'text-color' para evitar conflictos y usar un nombre más estándar.
        // Tailwind ya tiene una clase 'text', por lo que usamos 'foreground' o similar.
        foreground: 'var(--color-text)', 
      },
      borderRadius: {
        // Permitimos que DEFAULT use nuestra variable, y sm/lg se basen en ella.
        DEFAULT: 'var(--border-radius)',
        sm: 'calc(var(--border-radius) * 0.5)',
        lg: 'calc(var(--border-radius) * 1.5)',
      }
    },
  },
  plugins: [],
}
```

### **Paso 4: Envolver la Aplicación con `ThemeProvider`**

1.  Busca el punto de entrada de tu aplicación (normalmente `src/main.jsx` o `src/index.js`).
2.  Envuelve tu componente `<App />` con el `ThemeProvider` de `next-themes`.

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import App from './App';
import './index.css'; // O la ruta a tu CSS principal

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* El atributo 'data-theme' es el que modificará next-themes */}
    <ThemeProvider attribute="data-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```

### **Paso 5: Crear el Componente `ThemeSwitcher`**

Crea un nuevo archivo en `src/components/ThemeSwitcher.jsx` con el siguiente contenido. Este componente permitirá al usuario cambiar el tema.

```jsx
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect se ejecuta solo en el cliente para evitar errores de hidratación.
  useEffect(() => {
    setMounted(true);
  }, []);

  // No renderizar el componente hasta que esté montado en el cliente.
  if (!mounted) {
    return null;
  }

  return (
    <div className="p-4 bg-background text-foreground">
      <label htmlFor="theme-select" className="block text-sm font-medium mb-2">
        Seleccionar Tema:
      </label>
      <select 
        id="theme-select"
        value={theme} 
        onChange={e => setTheme(e.target.value)}
        className="bg-background text-foreground border border-secondary p-2 rounded-DEFAULT w-full"
      >
        <option value="base-light">Base Light</option>
        <option value="base-dark">Base Dark</option>
        <option value="material-light">Material Light</option>
        <option value="material-dark">Material Dark</option>
        <option value="fluent-light">Fluent Light</option>
        <option value="fluent-dark">Fluent Dark</option>
      </select>
    </div>
  );
};
```

### **Paso 6: Usar el `ThemeSwitcher` en la Aplicación**

1.  Abre tu componente principal, `src/App.jsx`.
2.  Importa y añade el `ThemeSwitcher` para que sea visible.
3.  Añade algunos elementos de ejemplo para verificar que los estilos se aplican correctamente.

```jsx
import { ThemeSwitcher } from './components/ThemeSwitcher';

function App() {
  return (
    // Aplicamos los colores base al contenedor principal de la app
    <main className="bg-background text-foreground min-h-screen p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary">Mi Aplicación</h1>
          <ThemeSwitcher />
        </header>
        
        <div className="bg-secondary/10 p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-primary mb-2">Tarjeta de Ejemplo</h3>
          <p className="text-foreground mb-4">
            Este es un ejemplo de cómo los estilos se aplican dinámicamente.
            El color de fondo, el texto y los bordes cambiarán con el tema.
          </p>
          <button className="bg-primary text-white font-bold py-2 px-4 rounded-DEFAULT hover:opacity-90 transition-opacity">
            Botón Principal
          </button>
        </div>
      </div>
    </main>
  );
}

export default App;
```

---

## 4. Verificación Final

Una vez que hayas completado los cambios, verifica lo siguiente:

- [ ] La aplicación se renderiza sin errores.
- [ ] El componente `ThemeSwitcher` es visible.
- [ ] Al cambiar la opción en el selector, los colores y el radio de los bordes de la página cambian instantáneamente.
- [ ] Al recargar la página, la selección de tema se mantiene.

Proporcióname la lista de archivos que has modificado junto con su contenido final.