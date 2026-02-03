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
import DetailedKPIs from '@/pages/DetailedKPIs'
import SalesHeatmap from '@/pages/SalesHeatmap'
import ConsolidatedAlerts from '@/pages/ConsolidatedAlerts'
import TopProductsOverview from '@/pages/TopProductsOverview'
import Products from '@/pages/Products'
import Clients from '@/pages/Clients'
import Suppliers from '@/pages/Suppliers'
import SalesNew from '@/pages/SalesNew'
import BookingManagement from '@/pages/BookingManagement'
// import Schedules from '@/pages/Schedules'
import SchedulesNew from '@/pages/SchedulesNew'
import ReservationsAndSchedules from '@/pages/ReservationsAndSchedules'
import AvailableSlots from '@/pages/AvailableSlots'
import PriceAdjustmentNew from '@/pages/PriceAdjustmentNew'
import PriceAdjustmentDetail from '@/pages/PriceAdjustmentDetail'
import PriceAdjustmentHistory from '@/pages/PriceAdjustmentHistory'
import PriceAdjustmentHistoryDetail from '@/pages/PriceAdjustmentHistoryDetail'
import ProductAdjustments from '@/pages/ProductAdjustments'
import InventoryAdjustments from '@/pages/InventoryAdjustments'
import InventoryAdjustmentManual from '@/pages/InventoryAdjustmentManual'
import InventoryManagement from '@/pages/InventoryManagement'
// ISOLATED IMPORTS - Pages temporarily disabled for refactoring
// import BookingSales from '@/pages/BookingSales';
import Purchases from '@/pages/Purchases'
import PurchasePayments from '@/pages/PurchasePayments'
import PurchasePaymentDetail from '@/pages/PurchasePaymentDetail'
// import CashRegister from '@/pages/CashRegister' // Obsoleto - usar NewCashRegister
import NewCashRegister from '@/pages/NewCashRegister'
import RegisterCashMovement from '@/pages/RegisterCashMovement'
import CashMovements from '@/pages/CashMovements'
import SalePayment from '@/pages/SalePayment'
import SalesOrderDetail from '@/pages/SalesOrderDetail'
import SalesPaymentHistory from '@/pages/SalesPaymentHistory'
import Currencies from '@/pages/Currencies'
import ExchangeRates from '@/pages/ExchangeRates'
import Login from '@/pages/Login'
import Settings from '@/pages/Settings'
import UserManagementList from '@/pages/UserManagementList'
import UserDetailedProfile from '@/pages/UserDetailedProfile'
import MyProfileAndSecurity from '@/pages/MyProfileAndSecurity'
// import ProductDetailTest from '@/components/ProductDetailTest';
// import ProductComparisonDebug from '@/components/ProductComparisonDebug';
import PurchaseEndpointsTest from '@/components/PurchaseEndpointsTest'
import ReceivablesDashboard from '@/components/business-intelligence/receivables/ReceivablesDashboard'
import ReceivablesMasterList from '@/pages/ReceivablesMasterList'
import ReceivableDetail from '@/pages/ReceivableDetail'
import OverdueAccounts from '@/pages/OverdueAccounts'
import ClientCreditProfile from '@/pages/ClientCreditProfile'
import AgingReport from '@/pages/AgingReport'
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
                      <Route path='/dashboard/kpis' element={<DetailedKPIs />} />
                      <Route path='/dashboard/sales-heatmap' element={<SalesHeatmap />} />
                      <Route path='/dashboard/alerts' element={<ConsolidatedAlerts />} />
                      <Route path='/dashboard/top-products' element={<TopProductsOverview />} />
                      <Route path='/dashboard/receivables' element={<ReceivablesDashboard />} />
                      <Route path='/receivables' element={<ReceivablesDashboard />} />
                      <Route path='/receivables/list' element={<ReceivablesMasterList />} />
                      <Route path='/receivables/detail/:id' element={<ReceivableDetail />} />
                      <Route path='/receivables/overdue' element={<OverdueAccounts />} />
                      <Route path='/receivables/client-profile/:clientId' element={<ClientCreditProfile />} />
                      <Route path='/receivables/aging-report' element={<AgingReport />} />
                      <Route path='/productos' element={<Products />} />
                      <Route path='/clientes' element={<Clients />} />
                      <Route path='/proveedores' element={<Suppliers />} />
                      <Route path='/ventas' element={<SalesNew />} />
                      <Route
                        path='/gestion-reservas'
                        element={<ReservationsAndSchedules />}
                      />
                      <Route path='/reservas' element={<BookingManagement />} />
                      <Route path='/horarios' element={<SchedulesNew />} />
                      <Route
                        path='/horarios-disponibles'
                        element={<AvailableSlots />}
                      />
                      {/* Rutas con layout de tabs */}
                      <Route
                        path='/ajustes-precios'
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
                        path='/ajustes-precios/detalle'
                        element={<PriceAdjustmentDetail />}
                      />
                      <Route
                        path='/ajustes-precios/historial/:adjustmentId'
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
                        element={<NewCashRegister />}
                      />
                      <Route
                        path='/movimientos-caja'
                        element={<CashMovements />}
                      />
                      <Route
                        path='/movimientos-caja/nuevo'
                        element={<RegisterCashMovement />}
                      />
                      <Route
                        path='/pagos-compras'
                        element={<PurchasePayments />}
                      />
                      <Route
                        path='/pagos-compras/:orderId'
                        element={<PurchasePaymentDetail />}
                      />
                      <Route path='/cobros-ventas' element={<SalePayment />} />
                      <Route
                        path='/cobros-ventas/:saleId'
                        element={<SalesOrderDetail />}
                      />
                      <Route
                        path='/cobros-ventas/:saleId/pagos'
                        element={<SalesPaymentHistory />}
                      />

                      {/* Configuración */}
                      <Route path='/configuracion' element={<Settings />} />
                      <Route path='/perfil' element={<MyProfileAndSecurity />} />
                      <Route path='/usuarios' element={<UserManagementList />} />
                      <Route path='/usuarios/:id' element={<UserDetailedProfile />} />

                      {/* Configuración Financiera */}
                      <Route
                        path='/configuracion/monedas'
                        element={<Currencies />}
                      />
                      <Route
                        path='/configuracion/tipos-cambio'
                        element={<ExchangeRates />}
                      />
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
