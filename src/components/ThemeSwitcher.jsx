import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const isNeoBrutalist = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';

  // useEffect se ejecuta solo en el cliente para evitar errores de hidratación.
  useEffect(() => {
    setMounted(true);
  }, []);

  // No renderizar el componente hasta que esté montado en el cliente.
  if (!mounted) {
    return null;
  }

  return (
    <div className="erp-theme-switcher p-4 bg-background text-foreground" data-component="theme-switcher" data-testid="theme-switcher">
      <label htmlFor="theme-select" className={`erp-theme-label block text-sm mb-2 ${
        isNeoBrutalist ? 'font-black uppercase tracking-wide' : 'font-medium'
      }`} style={{ color: 'var(--foreground)' }}>
        Seleccionar Tema:
      </label>
      <select 
        id="theme-select"
        value={theme || 'neo-brutalism-light'} 
        onChange={e => setTheme(e.target.value)}
        className="erp-theme-select bg-background text-foreground border border-border p-2 rounded w-full brutalist-input"
        style={{
          backgroundColor: 'var(--input)',
          color: 'var(--foreground)',
          border: isNeoBrutalist ? '4px solid var(--border)' : '1px solid var(--border)',
          fontWeight: isNeoBrutalist ? 'bold' : 'normal'
        }}
        data-testid="theme-select"
      >
        <option value="neo-brutalism-light">Neo-Brutalism Light</option>
        <option value="neo-brutalism-dark">Neo-Brutalism Dark</option>
        <option value="material-light">Material Light</option>
        <option value="material-dark">Material Dark</option>
        <option value="fluent-light">Fluent Light</option>
        <option value="fluent-dark">Fluent Dark</option>
      </select>
      
      <div className="erp-theme-preview mt-4 p-4 bg-secondary rounded" 
           style={{
             backgroundColor: 'var(--secondary)',
             border: isNeoBrutalist ? '4px solid var(--border)' : '1px solid var(--border)',
             borderRadius: isNeoBrutalist ? '0' : '6px'
           }}
           data-component="theme-preview" data-testid="theme-preview">
        <h3 className={`erp-preview-title text-lg mb-2 text-primary ${
          isNeoBrutalist ? 'font-black uppercase tracking-wide' : 'font-bold'
        }`} style={{ color: 'var(--primary)' }} data-testid="preview-title">Vista Previa</h3>
        <p className={`erp-preview-text text-foreground mb-4 ${
          isNeoBrutalist ? 'font-bold' : 'font-normal'
        }`} style={{ color: 'var(--foreground)' }} data-testid="preview-text">
          Este es un ejemplo de cómo los estilos se aplican dinámicamente.
          El color de fondo, el texto y los bordes cambiarán con el tema.
        </p>
        <button className={`erp-preview-button py-2 px-4 ${
          isNeoBrutalist ? 'brutalist-button font-black uppercase tracking-wide' : 'rounded font-bold'
        }`}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: isNeoBrutalist ? '2px solid var(--border)' : 'none',
                  boxShadow: isNeoBrutalist ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none'
                }}
                data-testid="preview-button">
          Botón de Ejemplo
        </button>
      </div>
    </div>
  );
};
