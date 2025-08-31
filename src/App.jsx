/**
 * Componente principal de la aplicación ERP
 * Sistema de autenticación completo con sistema de temas robusto
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Clients from '@/pages/Clients';
import Suppliers from '@/pages/Suppliers';
import Sales from '@/pages/Sales';
import Reservations from '@/pages/Reservations';
import Schedules from '@/pages/Schedules';
// ISOLATED IMPORTS - Pages temporarily disabled for refactoring
// import BookingSales from '@/pages/BookingSales';
import Purchases from '@/pages/Purchases';
import Login from '@/pages/Login';
import Settings from '@/pages/Settings';
// import ProductDetailTest from '@/components/ProductDetailTest';
// import ProductComparisonDebug from '@/components/ProductComparisonDebug';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { apiClient } from '@/services/api';
import ErrorBoundary from '@/components/ErrorBoundary';
import './App.css';

// Componente de protección de rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
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

// Componente interno que usa los hooks
function AppContent() {
  const { isAuthenticated, loading, initializeAuth } = useAuth();
  const { isInitialized } = useTheme(); // El tema se inicializa automáticamente

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
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-lg">Inicializando aplicación...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
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
                    <Route path="/ventas" element={<Sales />} />
                    <Route path="/reservas" element={<Reservations />} />
                    <Route path="/horarios" element={<Schedules />} />

                    {/* --- RUTAS AISLADAS TEMPORALMENTE PARA REFACTORING --- */}
                    <Route path="/compras" element={<Purchases />} />
                    <Route path="/configuracion" element={<Settings />} />
                    {/* <Route path="/test-products" element={<ProductDetailTest />} /> */}
                    {/* <Route path="/debug-products" element={<ProductComparisonDebug />} /> */}
                    
                    {/* Ruta 404 */}
                    <Route path="*" element={
                      <div className="space-y-6">
                        <div>
                          <h1 className="text-3xl font-black uppercase tracking-wide">Página no encontrada</h1>
                          <p className="text-lg font-bold text-muted-foreground uppercase tracking-wide">
                            La página que buscas no existe.
                          </p>
                        </div>
                        <div className="bg-card text-card-foreground border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
                          <h2 className="text-xl font-black uppercase mb-2">Error 404</h2>
                          <p className="text-muted-foreground font-bold mb-4">
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
    </ErrorBoundary>
  );
}

// Componente principal que provee los contextos
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;