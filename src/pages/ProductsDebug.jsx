/**
 * Página de Productos - Versión Simplificada para Debug
 */

import React from 'react';

const ProductsDebug = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🛒 Productos - Versión Debug
        </h1>
        
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            ✅ La página de productos se está mostrando correctamente
          </h2>
          
          <p className="text-muted-foreground mb-6">
            Si ves este mensaje, significa que:
          </p>
          
          <ul className="text-left max-w-md mx-auto space-y-2 mb-6">
            <li>✅ El enrutamiento funciona</li>
            <li>✅ La autenticación está permitiendo el acceso</li>
            <li>✅ No hay errores de JavaScript bloqueantes</li>
            <li>✅ Los componentes se pueden renderizar</li>
          </ul>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Siguientes pasos:</strong><br/>
              1. Verificar que esta página se mantiene visible<br/>
              2. Revisar la consola del navegador para errores<br/>
              3. Volver a habilitar la página completa gradualmente
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Timestamp: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsDebug;
