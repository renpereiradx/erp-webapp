/**
 * Componente principal de la aplicación ERP
 * Configura React Router DOM y la estructura general de la aplicación
 * Demuestra navegación responsive y gestión de estado global
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Clients from '@/pages/Clients';
import useAuthStore from '@/store/useAuthStore';
import './App.css';

// Componente de página de pedidos (placeholder)
const Orders = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
      <p className="text-muted-foreground">
        Gestiona los pedidos de tus clientes
      </p>
    </div>
    <div className="bg-card rounded-lg border p-8 text-center">
      <h2 className="text-xl font-semibold mb-2">Página en Desarrollo</h2>
      <p className="text-muted-foreground">
        La funcionalidad de pedidos estará disponible próximamente.
      </p>
    </div>
  </div>
);

// Componente de página de reportes (placeholder)
const Reports = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
      <p className="text-muted-foreground">
        Analiza el rendimiento de tu negocio
      </p>
    </div>
    <div className="bg-card rounded-lg border p-8 text-center">
      <h2 className="text-xl font-semibold mb-2">Página en Desarrollo</h2>
      <p className="text-muted-foreground">
        Los reportes avanzados estarán disponibles próximamente.
      </p>
    </div>
  </div>
);

// Componente de página de configuración (placeholder)
const Settings = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      <p className="text-muted-foreground">
        Personaliza tu sistema ERP
      </p>
    </div>
    <div className="bg-card rounded-lg border p-8 text-center">
      <h2 className="text-xl font-semibold mb-2">Página en Desarrollo</h2>
      <p className="text-muted-foreground">
        Las opciones de configuración estarán disponibles próximamente.
      </p>
    </div>
  </div>
);

// Componente de página de login (placeholder)
const Login = () => {
  const { login } = useAuthStore();

  const handleDemoLogin = async () => {
    try {
      // Simular login de demostración
      await login({
        email: 'demo@erp.com',
        password: 'demo123'
      });
    } catch (error) {
      console.error('Error en login de demo:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sistema ERP</h2>
          <p className="mt-2 text-muted-foreground">
            Inicia sesión para acceder al sistema
          </p>
        </div>
        <div className="space-y-4">
          <button
            onClick={handleDemoLogin}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
          >
            Acceso Demo
          </button>
          <p className="text-sm text-muted-foreground text-center">
            Haz clic en "Acceso Demo" para explorar la aplicación
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente de ruta protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  // Para la demostración, permitimos acceso sin autenticación
  // En una aplicación real, esto redirigiría al login
  return children;
  
  // Implementación real:
  // return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Verificar autenticación al cargar la aplicación
    // checkAuth();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Ruta de login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas con layout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  {/* Ruta por defecto - Dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/productos" element={<Products />} />
                  <Route path="/clientes" element={<Clients />} />
                  <Route path="/pedidos" element={<Orders />} />
                  <Route path="/reportes" element={<Reports />} />
                  <Route path="/configuracion" element={<Settings />} />
                  
                  {/* Ruta 404 */}
                  <Route path="*" element={
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-3xl font-bold tracking-tight">Página no encontrada</h1>
                        <p className="text-muted-foreground">
                          La página que buscas no existe.
                        </p>
                      </div>
                      <div className="bg-card rounded-lg border p-8 text-center">
                        <h2 className="text-xl font-semibold mb-2">Error 404</h2>
                        <p className="text-muted-foreground mb-4">
                          Verifica la URL o regresa al dashboard.
                        </p>
                        <a 
                          href="/dashboard" 
                          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Ir al Dashboard
                        </a>
                      </div>
                    </div>
                  } />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

