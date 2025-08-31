/**
 * Selector de temas usando ThemeContext
 * Actualizado para usar React Context en lugar de Zustand
 */

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeSwitcher = () => {
  const { theme, setTheme, isNeoBrutalism } = useTheme();

  return (
    <div className="erp-theme-switcher p-4 bg-background text-foreground">
      <label htmlFor="theme-select" className={`block text-sm mb-2 ${
        isNeoBrutalism ? 'font-black uppercase tracking-wide' : 'font-medium'
      }`}>
        Seleccionar Tema:
      </label>
      
      <select 
        id="theme-select"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="bg-background text-foreground border border-border p-2 w-full"
        style={{
          border: isNeoBrutalism ? '4px solid var(--border)' : '1px solid var(--border)',
          borderRadius: isNeoBrutalism ? '0' : '6px',
          fontWeight: isNeoBrutalism ? 'bold' : 'normal'
        }}
      >
        <option value="neo-brutalism-light">Neo-Brutalism Light</option>
        <option value="neo-brutalism-dark">Neo-Brutalism Dark</option>
        <option value="material-light">Material Light</option>
        <option value="material-dark">Material Dark</option>
        <option value="fluent-light">Fluent Light</option>
        <option value="fluent-dark">Fluent Dark</option>
      </select>
      
      <div className="mt-4 p-4 bg-muted/50 border rounded text-xs text-muted-foreground">
        <p><strong>Tema actual:</strong> {theme}</p>
        <p><strong>Neo-Brutalism:</strong> {isNeoBrutalism ? 'Activo' : 'Inactivo'}</p>
      </div>
    </div>
  );
};