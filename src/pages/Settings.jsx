import React from 'react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import MaterialDesignShowcase from '../components/MaterialDesignShowcase';
import FluentDesignShowcase from '../components/FluentDesignShowcase';
import { useTheme } from 'next-themes';

const Settings = () => {
  const { theme } = useTheme();
  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Configuración</h1>
          <p className="text-muted-foreground">
            Personaliza la apariencia de tu aplicación ERP
          </p>
        </header>
        
        <div className="grid gap-6">
          <div className="brutalist-card p-6">
            <h2 className="text-2xl font-bold text-primary mb-4">Tema de Apariencia</h2>
            <p className="text-foreground mb-4">
              Selecciona el tema que mejor se adapte a tus preferencias. 
              Cada tema incluye variantes claras y oscuras.
            </p>
            <ThemeSwitcher />
          </div>
          
          {/* Material Design Showcase - Solo visible cuando el tema Material está activo */}
          {isMaterial && (
            <div className="brutalist-card p-6">
              <h2 className="text-2xl font-bold text-primary mb-4">
                Material Design System
              </h2>
              <p className="text-muted-foreground mb-6">
                Explora los componentes y estilos del sistema de diseño Material Design 3.0
              </p>
              <MaterialDesignShowcase />
            </div>
          )}
          
          {/* Fluent Design Showcase - Solo visible cuando el tema Fluent está activo */}
          {isFluent && (
            <div className="brutalist-card p-6">
              <h2 className="text-2xl font-bold text-primary mb-4">
                Fluent Design System 2.0
              </h2>
              <p className="text-muted-foreground mb-6">
                Explora los componentes y estilos del sistema de diseño Fluent 2.0 de Microsoft
              </p>
              <FluentDesignShowcase />
            </div>
          )}
          
          <div className="brutalist-card p-6">
            <h2 className="text-2xl font-bold text-primary mb-4">Configuración Adicional</h2>
            <p className="text-muted-foreground">
              Próximamente: más opciones de personalización estarán disponibles aquí.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;