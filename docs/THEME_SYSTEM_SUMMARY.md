# Resumen del Sistema de Temas

Este documento proporciona un resumen de la arquitectura y el uso del sistema de temas en la aplicación.

## 1. Arquitectura General

El sistema de temas está construido sobre una base de **variables CSS (Custom Properties)** y es gestionado principalmente por la biblioteca `next-themes`, que permite cambiar de tema de forma dinámica y persistir la selección del usuario.

### Puntos Clave de la Arquitectura:

- **Proveedor de Temas**: La aplicación está envuelta en un `ThemeProvider` en `src/main.jsx`. Este proveedor es responsable de aplicar el tema seleccionado al árbol de componentes.
- **Variables CSS**: La base del sistema de temas reside en `src/App.css`. Este archivo define un conjunto de variables CSS para colores, tipografía, espaciado y otros aspectos visuales. Cada tema anula estas variables para aplicar su propio estilo.
- **Detección de Tema**: Los componentes utilizan el hook `useTheme` de `next-themes` para detectar el tema activo y aplicar estilos condicionales.
- **Cambio de Tema**: El componente `src/components/ThemeSwitcher.jsx` proporciona la interfaz de usuario para que los usuarios seleccionen su tema preferido.

## 2. Archivos y Directorios Involucrados

- **`src/main.jsx`**: Aquí se configura el `ThemeProvider`, definiendo los temas disponibles y el tema por defecto.
- **`src/App.css`**: Contiene las definiciones de las variables CSS para todos los temas. Los temas se definen utilizando el selector de atributo `[data-theme='...']`.
- **`src/themes/`**: Este directorio contiene los archivos CSS específicos para cada sistema de diseño (Material, Fluent, Neo-Brutalism), que son importados en `src/App.css`.
- **`src/components/ThemeSwitcher.jsx`**: El componente de React que permite al usuario cambiar entre los temas disponibles.
- **`src/store/themeContext.jsx`**: Proporciona un contexto de tema personalizado, aunque la implementación principal se basa en `next-themes`.

## 3. Fuentes de Referencia y Estilos

El sistema soporta tres sistemas de diseño principales, cada uno con una variante clara y oscura:

1.  **Neo-Brutalism**:
    - **Estilo**: Audaz, angular y de alto contraste.
    - **Características**: Bordes gruesos, sombras pronunciadas y tipografía pesada.
    - **Archivos**: `src/themes/neoBrutalism.css`.

2.  **Material Design**:
    - **Estilo**: Limpio, con capas y elevaciones sutiles.
    - **Características**: Esquinas redondeadas, sombras suaves y una paleta de colores armoniosa.
    - **Archivos**: `src/themes/materialDesign.css`.

3.  **Fluent Design**:
    - **Estilo**: Moderno, translúcido y fluido.
    - **Características**: Colores inspirados en Microsoft, jerarquía de fuentes equilibrada y sombras dependientes de la profundidad.
    - **Archivos**: `src/themes/fluentDesign.css`.

## 4. Cómo Funciona

1.  **Inicialización**: `ThemeProvider` en `src/main.jsx` aplica el tema por defecto (`neo-brutalism-light`) o el tema guardado en el `localStorage` del usuario.
2.  **Aplicación de Estilos**: El atributo `data-theme` se establece en el elemento `<html>`. `src/App.css` utiliza este atributo para aplicar el bloque de variables CSS correspondiente al tema activo.
3.  **Estilos en Componentes**: Los componentes utilizan clases de Tailwind CSS que, a su vez, hacen referencia a las variables CSS del tema (ej. `bg-background`, `text-foreground`).
4.  **Estilos Condicionales**: Para estilos que son únicos de un tema (como las sombras del Neo-Brutalismo), los componentes usan el hook `useTheme` para obtener el nombre del tema actual y aplican clases o estilos en línea de forma condicional.
5.  **Cambio de Tema**: Cuando el usuario selecciona un nuevo tema en `ThemeSwitcher`, se llama a la función `setTheme` de `next-themes`, que actualiza el atributo `data-theme` y guarda la nueva preferencia en `localStorage`.

## 5. Uso en Desarrollo

Para utilizar el sistema de temas al crear o modificar componentes:

- **Usar Variables CSS**: Para colores, fondos, etc., utiliza las clases de utilidad de Tailwind que se asignan a las variables CSS del tema (ej. `bg-primary`, `text-destructive`).
- **Estilos Específicos del Tema**: Si un estilo es exclusivo de un tema, importa `useTheme` de `next-themes`, detecta el tema y aplica la clase o el estilo correspondiente.

```jsx
import { useTheme } from 'next-themes';

const MiComponente = () => {
  const { theme } = useTheme();
  const esNeoBrutalista = theme?.includes('neo-brutalism');

  return (
    <div className={esNeoBrutalista ? 'estilo-brutalista' : 'estilo-moderno'}>
      ...
    </div>
  );
};
```
