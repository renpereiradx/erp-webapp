/**
 * Componente principal de la aplicación ERP
 * Configura React Router DOM y la estructura general de la aplicación
 * Implementa sistema de autenticación con protección de rutas
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Clients from '@/pages/Clients';
import Login from '@/pages/Login';
import Settings from '@/pages/Settings';
import ThemeDebug from '@/pages/ThemeDebug';
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

// Componente de ruta protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  
  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-black uppercase tracking-wide">
            Cargando Sistema ERP...
          </p>
        </div>
      </div>
    );
  }
  
  // Redirigir al login si no está autenticado
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Componente para manejar redirección desde login
const LoginRedirect = () => {
  const { isAuthenticated } = useAuthStore();
  
  // Si ya está autenticado, redirigir al dashboard
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />;
};

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Verificar autenticación al cargar la aplicación
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          {/* Ruta de login */}
          <Route path="/login" element={<LoginRedirect />} />
          
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
                  <Route path="/theme-debug" element={<ThemeDebug />} />
                  
                  {/* Ruta 404 */}
                  <Route path="*" element={
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-3xl font-black uppercase tracking-wide">Página no encontrada</h1>
                        <p className="text-lg font-bold text-gray-600 uppercase tracking-wide">
                          La página que buscas no existe.
                        </p>
                      </div>
                      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
                        <h2 className="text-xl font-black uppercase mb-2">Error 404</h2>
                        <p className="text-gray-600 font-bold mb-4">
                          Verifica la URL o regresa al dashboard.
                        </p>
                        <a 
                          href="/dashboard" 
                          className="inline-flex items-center px-6 py-3 bg-lime-400 text-black font-black uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
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

