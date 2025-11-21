/**
 * Componente principal de la aplicación ERP
 * Sistema de autenticación completo con sistema de temas robusto
 */

import React, { useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import PriceAdjustmentLayout from '@/layouts/PriceAdjustmentLayout'
import Dashboard from '@/pages/Dashboard'
import Products from '@/pages/Products'
import Clients from '@/pages/Clients'
import Suppliers from '@/pages/Suppliers'
import Sales from '@/pages/Sales'
import SalesNew from '@/pages/SalesNew'
import Reservations from '@/pages/Reservations'
// import Schedules from '@/pages/Schedules'
import SchedulesNew from '@/pages/SchedulesNew'
import ReservationsAndSchedules from '@/pages/ReservationsAndSchedules'
import Inventory from '@/pages/Inventory'
import PriceAdjustments from '@/pages/PriceAdjustments'
import PriceAdjustmentNew from '@/pages/PriceAdjustmentNew'
import PriceAdjustmentDetail from '@/pages/PriceAdjustmentDetail'
import PriceAdjustmentHistory from '@/pages/PriceAdjustmentHistory'
import PriceAdjustmentHistoryDetail from '@/pages/PriceAdjustmentHistoryDetail'
import ProductAdjustments from '@/pages/ProductAdjustments'
import InventoryAdjustments from '@/pages/InventoryAdjustments'
import InventoryAdjustmentManual from '@/pages/InventoryAdjustmentManual'
import InventoryManagement from '@/pages/InventoryManagement'
import Reports from '@/pages/Reports'
// ISOLATED IMPORTS - Pages temporarily disabled for refactoring
// import BookingSales from '@/pages/BookingSales';
import Purchases from '@/pages/Purchases'
import PurchasePaymentsMvp from '@/pages/PurchasePaymentsMvp'
import PurchasePaymentsMvpDetail from '@/pages/PurchasePaymentsMvpDetail'
import CashRegister from '@/pages/CashRegister'
import PurchasePayment from '@/pages/PurchasePayment'
import SalePayment from '@/pages/SalePayment'
import PaymentDocumentation from '@/pages/PaymentDocumentation'
import PaymentManagement from '@/pages/PaymentManagement'
import Login from '@/pages/Login'
import Settings from '@/pages/Settings'
// import ProductDetailTest from '@/components/ProductDetailTest';
// import ProductComparisonDebug from '@/components/ProductComparisonDebug';
import PurchaseEndpointsTest from '@/components/PurchaseEndpointsTest'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import './App.css'

// Componente de protección de rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, authLoading } = useAuth()

  if (loading || authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  return children
}

// Componente interno que usa los hooks
function AppContent() {
  const { isAuthenticated, loading, initializeAuth } = useAuth()

  // Inicializar autenticación al cargar la aplicación
  useEffect(() => {
    initializeAuth()
    // Removed auto-login call - authentication must be explicit by user
  }, [initializeAuth])

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background text-foreground'>
        <div className='text-lg'>Inicializando aplicación...</div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className='min-h-screen bg-background text-foreground'>
          <Routes>
            {/* Ruta de login - siempre accesible */}
            <Route
              path='/login'
              element={
                isAuthenticated ? (
                  <Navigate to='/dashboard' replace />
                ) : (
                  <Login />
                )
              }
            />

            {/* Rutas protegidas */}
            <Route
              path='/*'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      {/* Ruta por defecto - Dashboard */}
                      <Route
                        path='/'
                        element={<Navigate to='/dashboard' replace />}
                      />
                      <Route path='/dashboard' element={<Dashboard />} />
                      <Route path='/productos' element={<Products />} />
                      <Route path='/clientes' element={<Clients />} />
                      <Route path='/proveedores' element={<Suppliers />} />
                      <Route path='/ventas' element={<Sales />} />
                      <Route path='/ventas-nueva' element={<SalesNew />} />
                      <Route path='/reportes' element={<Reports />} />
                      <Route
                        path='/gestion-reservas'
                        element={<ReservationsAndSchedules />}
                      />
                      <Route path='/reservas' element={<Reservations />} />
                      <Route path='/horarios' element={<SchedulesNew />} />
                      <Route path='/inventario' element={<Inventory />} />
                      <Route
                        path='/ajustes-precios'
                        element={<PriceAdjustments />}
                      />
                      {/* Rutas con layout de tabs */}
                      <Route
                        path='/ajustes-precios-nuevo'
                        element={<PriceAdjustmentLayout />}
                      >
                        <Route index element={<PriceAdjustmentNew />} />
                        <Route
                          path='historial'
                          element={<PriceAdjustmentHistory />}
                        />
                      </Route>
                      {/* Rutas independientes sin tabs */}
                      <Route
                        path='/ajustes-precios-nuevo/detalle'
                        element={<PriceAdjustmentDetail />}
                      />
                      <Route
                        path='/ajustes-precios-nuevo/historial/:adjustmentId'
                        element={<PriceAdjustmentHistoryDetail />}
                      />
                      <Route
                        path='/ajustes-producto'
                        element={<ProductAdjustments />}
                      />
                      <Route
                        path='/ajustes-inventario'
                        element={<InventoryAdjustments />}
                      />
                      <Route
                        path='/ajuste-inventario-unitario'
                        element={<InventoryAdjustmentManual />}
                      />
                      <Route
                        path='/ajuste-inventario-masivo'
                        element={<InventoryManagement />}
                      />

                      {/* --- RUTAS AISLADAS TEMPORALMENTE PARA REFACTORING --- */}
                      <Route path='/compras' element={<Purchases />} />

                      {/* Nuevas rutas de sistemas de pagos */}
                      <Route
                        path='/caja-registradora'
                        element={<CashRegister />}
                      />
                      <Route
                        path='/pagos-compras'
                        element={<PurchasePayment />}
                      />
                      <Route
                        path='/pagos/compras-mvp'
                        element={<PurchasePaymentsMvp />}
                      />
                      <Route
                        path='/pagos/compras-mvp/:orderId'
                        element={<PurchasePaymentsMvpDetail />}
                      />
                      <Route path='/pagos-ventas' element={<SalePayment />} />
                      <Route
                        path='/pagos/documentacion'
                        element={<PaymentDocumentation />}
                      />
                      <Route
                        path='/pagos/gestion'
                        element={<PaymentManagement />}
                      />

                      <Route path='/configuracion' element={<Settings />} />
                      {/* <Route path="/test-products" element={<ProductDetailTest />} /> */}
                      {/* <Route path="/debug-products" element={<ProductComparisonDebug />} /> */}
                      <Route
                        path='/test-purchase-endpoints'
                        element={<PurchaseEndpointsTest />}
                      />

                      {/* Ruta 404 */}
                      <Route
                        path='*'
                        element={
                          <div className='space-y-6'>
                            <div>
                              <h1 className='text-3xl font-black uppercase tracking-wide'>
                                Página no encontrada
                              </h1>
                              <p className='text-lg font-bold text-muted-foreground uppercase tracking-wide'>
                                La página que buscas no existe.
                              </p>
                            </div>
                            <div className='bg-card text-card-foreground border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center'>
                              <h2 className='text-xl font-black uppercase mb-2'>
                                Error 404
                              </h2>
                              <p className='text-muted-foreground font-bold mb-4'>
                                Verifica la URL o regresa al dashboard.
                              </p>
                              <a
                                href='/dashboard'
                                className='inline-flex items-center px-6 py-3 bg-lime-400 text-black font-black uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all'
                              >
                                Ir al Dashboard
                              </a>
                            </div>
                          </div>
                        }
                      />
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

// Componente principal que provee los contextos
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* AnnouncementProvider temporarily disabled due to React 19 hooks compatibility */}
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
