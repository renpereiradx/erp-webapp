/**
 * Componente principal de la aplicación ERP
 * Sistema de autenticación completo
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Clients from '@/pages/Clients';
import Suppliers from '@/pages/Suppliers';
import Orders from '@/pages/Orders';
import Reports from '@/pages/Reports';
import BookingSales from '@/pages/BookingSales';
import Login from '@/pages/Login';
import Settings from '@/pages/Settings';
import ProductDetailTest from '@/components/ProductDetailTest';
import ProductComparisonDebug from '@/components/ProductComparisonDebug';
import useAuthStore from '@/store/useAuthStore';
import { apiClient } from '@/services/api';
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

// TEMPORAL: Componentes de autenticación eliminados completamente
// para evitar errores con useAuthStore comentado

// Componente de protección de rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const { isAuthenticated, loading, initializeAuth } = useAuthStore();

  // Inicializar autenticación al cargar la aplicación
  useEffect(() => {
    initializeAuth();
    
    const ensureAutoLogin = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        try {
          await apiClient.ensureAuthentication();
        } catch (error) {
          // Auto-login failed
        }
      }
    };
    
    ensureAutoLogin();
  }, [initializeAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-lg">Inicializando aplicación...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          {/* Ruta de login - siempre accesible */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } />
          
          {/* Rutas protegidas */}
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  {/* Ruta por defecto - Dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/productos" element={<Products />} />
                  <Route path="/clientes" element={<Clients />} />
                  <Route path="/proveedores" element={<Suppliers />} />
                  <Route path="/reservas-ventas" element={<BookingSales />} />
                  <Route path="/pedidos" element={<Orders />} />
                  <Route path="/reportes" element={<Reports />} />
                  <Route path="/configuracion" element={<Settings />} />
                  <Route path="/test-products" element={<ProductDetailTest />} />
                  <Route path="/debug-products" element={<ProductComparisonDebug />} />
                  
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

