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
        value={theme || 'neo-brutalism-light'} 
        onChange={e => setTheme(e.target.value)}
        className="bg-background text-foreground border border-border p-2 rounded w-full brutalist-input"
      >
        <option value="neo-brutalism-light">Neo-Brutalism Light</option>
        <option value="neo-brutalism-dark">Neo-Brutalism Dark</option>
        <option value="material-light">Material Light</option>
        <option value="material-dark">Material Dark</option>
        <option value="fluent-light">Fluent Light</option>
        <option value="fluent-dark">Fluent Dark</option>
      </select>
      
      <div className="mt-4 p-4 bg-secondary rounded">
        <h3 className="text-lg font-bold text-primary mb-2">Vista Previa</h3>
        <p className="text-foreground mb-4">
          Este es un ejemplo de cómo los estilos se aplican dinámicamente.
          El color de fondo, el texto y los bordes cambiarán con el tema.
        </p>
        <button className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded brutalist-button">
          Botón de Ejemplo
        </button>
      </div>
    </div>
  );
};
