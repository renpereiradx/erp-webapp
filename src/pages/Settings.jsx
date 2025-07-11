import React from 'react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

const Settings = () => {
  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
      <div className="max-w-4xl mx-auto">
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