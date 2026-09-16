/**
 * Componente principal de la aplicación ERP
 * Sistema de autenticación completo con sistema de temas robusto
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import useTaxRateStore from '@/store/useTaxRateStore'
import {
  useReservationsEnabled,
} from '@/store/useBusinessConfigStore'
import { useI18n } from '@/lib/i18n'
import MainLayout from '@/layouts/MainLayout'
import PriceAdjustmentLayout from '@/layouts/PriceAdjustmentLayout'
import Dashboard from '@/pages/Dashboard'
import FinancialSummaryDashboard from '@/pages/FinancialSummaryDashboard'
import DetailedKPIs from '@/pages/DetailedKPIs'
import SalesHeatmap from '@/pages/SalesHeatmap'
import ConsolidatedAlerts from '@/pages/ConsolidatedAlerts'
import TopProductsOverview from '@/pages/TopProductsOverview';
import Products from '@/pages/Products';
import PartiesPage from '@/pages/PartiesPage'
import BudgetManagement from '@/pages/BudgetManagement'
import BudgetCreate from '@/pages/BudgetCreate'
import BudgetDetail from '@/pages/BudgetDetail'
import PurchaseRequisitionList from '@/pages/PurchaseRequisitionList'
import PurchaseRequisitionCreate from '@/pages/PurchaseRequisitionCreate'
import PurchaseRequisitionDetail from '@/pages/PurchaseRequisitionDetail'
import SalesNew from '@/pages/SalesNew'
import ScaleConfigPage from '@/features/scales/components/ScaleConfigPage'
import UnitConversionsPage from '@/features/unit-conversions/components/UnitConversionsPage'
import PriceAdjustmentNew from '@/pages/PriceAdjustmentNew'
import PriceAdjustmentDetail from '@/pages/PriceAdjustmentDetail'
import PriceAdjustmentHistory from '@/pages/PriceAdjustmentHistory'
import PriceAdjustmentHistoryDetail from '@/pages/PriceAdjustmentHistoryDetail'
import BookingUnifiedDashboard from '@/pages/BookingUnifiedDashboard'
import StockMovements from '@/pages/StockMovements'
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
import PaymentMethods from '@/pages/PaymentMethods'
import ExchangeRates from '@/pages/ExchangeRates'
import CategoriesPage from '@/pages/CategoriesPage'
import { BrandsPage } from '@/pages/BrandsPage'
import { AttributesPage } from '@/pages/AttributesPage'
import PrintersPage from '@/pages/PrintersPage'
import Login from '@/pages/Login.tsx'
import BranchSelection from '@/pages/BranchSelection.tsx'
import Settings from '@/pages/Settings'
import BusinessPreferencesPage from '@/features/settings/components/BusinessPreferencesPage'
import BranchManagement from '@/pages/BranchManagement'
import TerminalPairing from '@/features/branches/components/TerminalPairing'
import DevicesPage from '@/pages/DevicesPage'
import TransfersPage from '@/features/transfers/components/TransfersPage'
import { CatalogBoard } from '@/features/catalog'
import { CounterOrdersPage } from '@/features/counterorders'
import UserManagementList from '@/pages/UserManagementList.tsx'
import UserDetailedProfile from '@/pages/UserDetailedProfile.tsx'
import MyProfileAndSecurity from '@/pages/MyProfileAndSecurity.tsx'
import AuditDashboard from '@/pages/AuditDashboard'
import AuditLogs from '@/pages/AuditLogs'
import AuditLogDetail from '@/pages/AuditLogDetail'
import AuditUserActivity from '@/pages/AuditUserActivity.tsx'
// import ProductDetailTest from '@/components/ProductDetailTest';
// import ProductComparisonDebug from '@/components/ProductComparisonDebug';

import ReceivablesDashboard from '@/pages/ReceivablesDashboard'
import PayablesDashboard from '@/pages/PayablesDashboard'
import PayablesAgingReport from '@/pages/PayablesAgingReport'
import ReceivablesMasterList from '@/pages/ReceivablesMasterList'
import InvoicesMasterList from '@/pages/InvoicesMasterList'
import InvoiceDetail from '@/pages/InvoiceDetail'
import CashFlowProjection from '@/pages/CashFlowProjection'
import CashFlowAnalysisDashboard from '@/pages/CashFlowAnalysisDashboard'
import TaxManagementDashboard from '@/pages/TaxManagementDashboard'
import SkippedNumbersPage from '@/features/fiscal/pages/SkippedNumbersPage'
import FiscalOpsDashboard from '@/features/fiscal/pages/FiscalOpsDashboard'
import SupplierAnalysis from '@/pages/SupplierAnalysis'
import ReceivableDetail from '@/pages/ReceivableDetail'
import OverdueAccounts from '@/pages/OverdueAccounts'
import ClientCreditProfile from '@/pages/ClientCreditProfile'
import AgingReport from '@/pages/AgingReport'
import ProfitAndLoss from '@/pages/ProfitAndLoss'
import LegalBooks from '@/pages/LegalBooks'
import AdminSessionsDashboard from '@/pages/AdminSessionsDashboard.tsx'
import {
  ProfitabilityDashboard,
  ProductProfitability,
  CustomerProfitability,
  CategoryProfitability,
  ProfitabilityTrends,
  SellerProfitability,
} from '@/features/profitability'
import {
  DashboardPronosticos,
  SaludInventario,
  PronosticoVentas,
  PronosticoDemanda,
  PronosticoIngresos
} from '@/features/bi-forecasting'
import SalesAnalyticsDashboard from '@/pages/sales-analytics/Dashboard'
import SalesAnalyticsProductsCategories from '@/pages/sales-analytics/ProductsCategories'
import SalesAnalyticsInsights from '@/pages/sales-analytics/CustomerSellerInsights'
import SalesAnalyticsTrendsVelocity from '@/pages/sales-analytics/TrendsVelocity'
import SalesAnalyticsPeriodComparison from '@/pages/sales-analytics/PeriodComparison'
import SalesAnalyticsDiscounts from '@/pages/sales-analytics/Discounts'
import InventoryTurnoverABC from '@/pages/InventoryAnalytics/InventoryTurnoverABC'
import InventoryDashboard from '@/pages/InventoryAnalytics/InventoryDashboard'
import StockLevelsReorder from '@/pages/InventoryAnalytics/StockLevelsReorder'
import InventoryRisk from '@/pages/InventoryAnalytics/InventoryRisk'
import { AuthProvider, useAuth } from '@/contexts/AuthContext.tsx'
import { BranchProvider, useBranch } from '@/contexts/BranchContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import RoleGuard from '@/components/auth/RoleGuard'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'

// Componente de protección de rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, authLoading, user } = useAuth()
  const { currentBranchId, allowedBranches } = useBranch()
  const location = useLocation()

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

  // Si está autenticado pero no tiene sucursal seleccionada y tiene opciones disponibles,
  // redirigir a selección de sucursal (a menos que ya esté allí)
  // Nota: Los admins pueden estar en currentBranchId === null (Visión Global)
  const isSelectingBranch = location.pathname === '/select-branch'
  const hasMultipleOptions = allowedBranches.length > 1
  const hasNoBranchSelected = currentBranchId === null && !localStorage.getItem('activeBranch')

  if (!isSelectingBranch && hasMultipleOptions && hasNoBranchSelected && user?.role_id !== 'admin' && user?.role_id !== 'F2VLso') {
    return <Navigate to='/select-branch' replace />
  }

  return children
}

// Gate de ruta del módulo de reservas (PLAN_SERVICIOS_Y_RESERVAS_CONFIGURABLES
// S3): con el toggle del negocio en off, /gestion-agenda redirige al dashboard
// con un aviso. Fail-open (D-SR-5): solo un `false` explícito bloquea.
const ReservationsModuleRoute = ({ children }: { children: React.ReactNode }) => {
  const { t } = useI18n()
  const reservationsEnabled = useReservationsEnabled()
  const toastShownRef = useRef(false)

  useEffect(() => {
    if (!reservationsEnabled && !toastShownRef.current) {
      toastShownRef.current = true
      import('sonner').then(({ toast }) => {
        toast.error(
          t('reservations.moduleDisabled', 'El módulo de reservas está deshabilitado para este negocio'),
        )
      })
    }
  }, [reservationsEnabled, t])

  if (!reservationsEnabled) {
    return <Navigate to='/dashboard' replace />
  }
  return <>{children}</>
}

// Componente interno que usa los hooks
// PLAN_PEDIDOS_MOSTRADOR FASE 4: la landing del vendor puro es /pedidos.
// "Vendor puro" = puede ver pedidos pero no crear/cobrar ventas
// (counterorders:read sin sales:write). El resto aterriza en /dashboard.
function HomeRedirect() {
  const { hasPermission } = useAuth()
  // PERFIL VENDEDOR v3: sin dashboard:read el usuario no aterriza en el
  // dashboard (su sección de nav está gated por el mismo permiso).
  if (!hasPermission('dashboard:read')) {
    return <Navigate to='/pedidos' replace />
  }
  if (hasPermission('counterorders:read') && !hasPermission('sales:write')) {
    return <Navigate to='/pedidos' replace />
  }
  return <Navigate to='/dashboard' replace />
}

/** Guard del módulo dashboard (dashboard:read; el sidebar ya lo gated). */
const DashboardRoute = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission='dashboard:read'>{children}</PermissionGuard>
)

function AppContent() {
  const { isAuthenticated, loading } = useAuth()
  const lastPartialToastRef = useRef(0)

  useEffect(() => {
    // Bootstrap: cache the backend default VAT rate for cart calculators
    // (GET /tax_rate/default). Fire-and-forget; calculators fall back to
    // the offline default (10%) until it resolves.
    const taxStore = useTaxRateStore.getState()
    if (!taxStore.defaultTaxRate) {
      taxStore.fetchDefaultTaxRate().catch(() => {})
    }

    const handleForbidden = (e: any) => {
      import('sonner').then(({ toast }) => {
        toast.error(e.detail || 'Acceso denegado: No cuentas con los permisos necesarios.');
      });
    };
    const handleMethodNotAllowed = (e: any) => {
      import('sonner').then(({ toast }) => {
        toast.warning(e.detail || 'Operación no permitida en este módulo (Solo lectura).');
      });
    };

    // T8 (FASE 1 BE): metadata.partial en la respuesta = algunas sub-consultas
    // fallaron pero el resto del payload es válido. Aviso global no bloqueante
    // con dedupe de 5s (una página dispara varios endpoints en paralelo).
    const handlePartialData = () => {
      const now = Date.now()
      if (now - lastPartialToastRef.current < 5000) return
      lastPartialToastRef.current = now
      import('sonner').then(({ toast }) => {
        toast.warning('Datos parciales: algunas secciones no pudieron cargarse completamente.');
      });
    };

    window.addEventListener('api:forbidden', handleForbidden);
    window.addEventListener('api:method_not_allowed', handleMethodNotAllowed);
    window.addEventListener('api:partial-data', handlePartialData);

    return () => {
      window.removeEventListener('api:forbidden', handleForbidden);
      window.removeEventListener('api:method_not_allowed', handleMethodNotAllowed);
      window.removeEventListener('api:partial-data', handlePartialData);
    };
  }, []);

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
          <Toaster position="top-right" richColors closeButton />
          <Routes>
            {/* Ruta de login - siempre accesible */}
            <Route
              path='/login'
              element={
                isAuthenticated ? (
                  <HomeRedirect />
                ) : (
                  <Login />
                )
              }
            />

            {/* Selección de Sucursal - Protegida pero fuera del MainLayout */}
            <Route
              path='/select-branch'
              element={
                <ProtectedRoute>
                  <BranchSelection />
                </ProtectedRoute>
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
                        element={<HomeRedirect />}
                      />
                      <Route path='/dashboard' element={<DashboardRoute><Dashboard /></DashboardRoute>} />
                      <Route path='/dashboard/financial-summary' element={<DashboardRoute><FinancialSummaryDashboard /></DashboardRoute>} />
                      <Route path='/dashboard/kpis' element={<DashboardRoute><DetailedKPIs /></DashboardRoute>} />
                      <Route path='/dashboard/sales-heatmap' element={<DashboardRoute><SalesHeatmap /></DashboardRoute>} />
                      <Route path='/dashboard/alerts' element={<DashboardRoute><ConsolidatedAlerts /></DashboardRoute>} />
                      <Route path='/dashboard/top-products' element={<DashboardRoute><TopProductsOverview /></DashboardRoute>} />
                      <Route path='/dashboard/receivables' element={<DashboardRoute><ReceivablesDashboard /></DashboardRoute>} />
                      <Route path='/dashboard/payables' element={<DashboardRoute><PayablesDashboard /></DashboardRoute>} />
                      <Route path='/payables/invoices' element={
                        <PermissionGuard permission='payables:read'>
                          <InvoicesMasterList />
                        </PermissionGuard>
                      } />
                      <Route path='/payables/detail/:id' element={
                        <PermissionGuard permission='payables:read'>
                          <InvoiceDetail />
                        </PermissionGuard>
                      } />
                      <Route path='/payables/cash-flow' element={
                        <PermissionGuard permission='payables:read'>
                          <CashFlowProjection />
                        </PermissionGuard>
                      } />
                      <Route path='/payables/aging-report' element={
                        <PermissionGuard permission='payables:read'>
                          <PayablesAgingReport />
                        </PermissionGuard>
                      } />
                      <Route path='/finance/analytical-cash-flow' element={
                        <PermissionGuard permission='reports:read'>
                          <CashFlowAnalysisDashboard />
                        </PermissionGuard>
                      } />
                      <Route path='/finance/tax-management' element={
                        <PermissionGuard permission='reports:read'>
                          <TaxManagementDashboard />
                        </PermissionGuard>
                      } />
                      <Route path='/finance/sifen-inutilizacion' element={
                        <PermissionGuard permission='sifen:read'>
                          <SkippedNumbersPage />
                        </PermissionGuard>
                      } />
                      <Route path='/finance/sifen-ops' element={
                        <PermissionGuard permission='sifen:read'>
                          <FiscalOpsDashboard />
                        </PermissionGuard>
                      } />
                      <Route path='/finance/profit-and-loss' element={
                        <PermissionGuard permission='reports:read'>
                          <ProfitAndLoss />
                        </PermissionGuard>
                      } />
                      <Route path='/finance/legal-books' element={
                        <PermissionGuard permission='reports:read'>
                          <LegalBooks />
                        </PermissionGuard>
                      } />
                      
                      {/* BI Forecasting Routes */}
                      <Route path='/bi/pronosticos/dashboard' element={
                        <PermissionGuard permission='analytics:read'>
                          <DashboardPronosticos />
                        </PermissionGuard>
                      } />
                      <Route path='/bi/pronosticos/inventario' element={
                        <PermissionGuard permission='analytics:read'>
                          <SaludInventario />
                        </PermissionGuard>
                      } />
                      <Route path='/bi/pronosticos/ventas' element={
                        <PermissionGuard permission='analytics:read'>
                          <PronosticoVentas />
                        </PermissionGuard>
                      } />
                      <Route path='/bi/pronosticos/demanda' element={
                        <PermissionGuard permission='analytics:read'>
                          <PronosticoDemanda />
                        </PermissionGuard>
                      } />
                      <Route path='/bi/pronosticos/ingresos' element={
                        <PermissionGuard permission='analytics:read'>
                          <PronosticoIngresos />
                        </PermissionGuard>
                      } />
                      
                      {/* Profitability Analytics Module (Detailed) */}
                      <Route path='/profitability/dashboard' element={<PermissionGuard permission="analytics:read"><ProfitabilityDashboard /></PermissionGuard>} />
                      <Route path='/profitability/products' element={<PermissionGuard permission="analytics:read"><ProductProfitability /></PermissionGuard>} />
                      <Route path='/profitability/customers' element={<PermissionGuard permission="analytics:read"><CustomerProfitability /></PermissionGuard>} />
                      <Route path='/profitability/categories' element={<PermissionGuard permission="analytics:read"><CategoryProfitability /></PermissionGuard>} />
                      <Route path='/profitability/trends' element={<PermissionGuard permission="analytics:read"><ProfitabilityTrends /></PermissionGuard>} />
                      <Route path='/profitability/sellers' element={<PermissionGuard permission="analytics:read"><SellerProfitability /></PermissionGuard>} />

                      <Route path='/receivables' element={
                        <PermissionGuard permission='receivables:read'>
                          <ReceivablesDashboard />
                        </PermissionGuard>
                      } />
                      <Route path='/receivables/list' element={
                        <PermissionGuard permission='receivables:read'>
                          <ReceivablesMasterList />
                        </PermissionGuard>
                      } />
                      <Route path='/receivables/detail/:id' element={
                        <PermissionGuard permission='receivables:read'>
                          <ReceivableDetail />
                        </PermissionGuard>
                      } />
                      <Route path='/receivables/overdue' element={
                        <PermissionGuard permission='receivables:read'>
                          <OverdueAccounts />
                        </PermissionGuard>
                      } />
                      <Route path='/receivables/client-profile/:clientId' element={
                        <PermissionGuard permission='receivables:read'>
                          <ClientCreditProfile />
                        </PermissionGuard>
                      } />
                      <Route path='/receivables/aging-report' element={
                        <PermissionGuard permission='receivables:read'>
                          <AgingReport />
                        </PermissionGuard>
                      } />
                      <Route path='/productos' element={<PermissionGuard permission="products:write"><Products /></PermissionGuard>} />
                      <Route path='/parties' element={<PermissionGuard anyOf={['parties:read', 'clients:read', 'suppliers:read']}><PartiesPage /></PermissionGuard>} />
                      <Route path='/payables/suppliers/:id/analysis' element={
                        <PermissionGuard permission='payables:read'>
                          <SupplierAnalysis />
                        </PermissionGuard>
                      } />
                      <Route path='/ventas' element={<PermissionGuard permission="sales:read"><SalesNew /></PermissionGuard>} />
                      
                      {/* Sales Analytics Routes */}
                      <Route path='/sales-analytics/dashboard' element={
                        <PermissionGuard permission='analytics:read'>
                          <SalesAnalyticsDashboard />
                        </PermissionGuard>
                      } />
                      <Route path='/sales-analytics/products-categories' element={
                        <PermissionGuard permission='analytics:read'>
                          <SalesAnalyticsProductsCategories />
                        </PermissionGuard>
                      } />
                      <Route path='/sales-analytics/insights' element={
                        <PermissionGuard permission='analytics:read'>
                          <SalesAnalyticsInsights />
                        </PermissionGuard>
                      } />
                      <Route path='/sales-analytics/trends-velocity' element={
                        <PermissionGuard permission='analytics:read'>
                          <SalesAnalyticsTrendsVelocity />
                        </PermissionGuard>
                      } />
                      <Route path='/sales-analytics/period-comparison' element={
                        <PermissionGuard permission='analytics:read'>
                          <SalesAnalyticsPeriodComparison />
                        </PermissionGuard>
                      } />
                      <Route path='/sales-analytics/discounts' element={<PermissionGuard permission="reports:read"><SalesAnalyticsDiscounts /></PermissionGuard>} />

                      {/* Inventory Analytics Routes */}
                      <Route path='/inventory-analytics/dashboard' element={
                        <PermissionGuard permission='analytics:read'>
                          <InventoryDashboard />
                        </PermissionGuard>
                      } />
                      <Route path='/inventory-analytics/turnover-abc' element={
                        <PermissionGuard permission='analytics:read'>
                          <InventoryTurnoverABC />
                        </PermissionGuard>
                      } />
                      <Route path='/inventory-analytics/stock-levels' element={
                        <PermissionGuard permission='analytics:read'>
                          <StockLevelsReorder />
                        </PermissionGuard>
                      } />
                      <Route path='/inventory-analytics/risk' element={
                        <PermissionGuard permission='analytics:read'>
                          <InventoryRisk />
                        </PermissionGuard>
                      } />

                      {/* Rutas con layout de tabs */}
                      <Route
                        path='/ajustes-precios'
                        element={
                          <PermissionGuard permission='products:read'>
                            <PriceAdjustmentLayout />
                          </PermissionGuard>
                        }
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
                        element={
                          <PermissionGuard permission='products:read'>
                            <PriceAdjustmentDetail />
                          </PermissionGuard>
                        }
                      />
                      <Route
                        path='/ajustes-precios/historial/:adjustmentId'
                        element={
                          <PermissionGuard permission='products:read'>
                            <PriceAdjustmentHistoryDetail />
                          </PermissionGuard>
                        }
                      />
                      <Route
                        path='/gestion-agenda'
                        element={
                          <ReservationsModuleRoute>
                            <BookingUnifiedDashboard />
                          </ReservationsModuleRoute>
                        }
                      />
                      <Route
                        path='/movimientos-stock'
                        element={
                          <PermissionGuard permission='inventory:read'>
                            <StockMovements />
                          </PermissionGuard>
                        }
                      />
                      {/* Redirects de rutas legacy de ajuste de stock → unificación /stock-transactions/ */}
                      <Route path='/ajustes-inventario' element={<Navigate to='/movimientos-stock' replace />} />
                      <Route path='/ajuste-inventario-unitario' element={<Navigate to='/movimientos-stock' replace />} />
                      <Route path='/ajuste-inventario-masivo' element={<Navigate to='/movimientos-stock' replace />} />

                      {/* Rutas de Requisiciones de Compra */}
                      <Route path='/logistica/requisiciones' element={<PurchaseRequisitionList />} />
                      <Route path='/logistica/requisiciones/nueva' element={<PurchaseRequisitionCreate />} />
                      <Route path='/logistica/requisiciones/:id' element={<PurchaseRequisitionDetail />} />

                      {/* F.4: transferencias entre sucursales */}
                      <Route
                        path='/transferencias'
                        element={
                          <PermissionGuard permission='transfers:read'>
                            <TransfersPage />
                          </PermissionGuard>
                        }
                      />

                      {/* PLAN_CATALOGO_VENDEDOR 3.3: catálogo comercial
                          read-only (vendedor/cajero). products:read, no write. */}
                      <Route
                        path='/catalogo'
                        element={
                          <PermissionGuard permission='products:read'>
                            <CatalogBoard />
                          </PermissionGuard>
                        }
                      />

                      {/* PLAN_PEDIDOS_MOSTRADOR 2.3: pedidos de mostrador —
                          carrito del vendedor que la caja procesa. */}
                      <Route
                        path='/pedidos'
                        element={
                          <PermissionGuard permission='counterorders:read'>
                            <CounterOrdersPage />
                          </PermissionGuard>
                        }
                      />

                      {/* --- RUTAS AISLADAS TEMPORALMENTE PARA REFACTORING --- */}
                      <Route
                        path='/compras'
                        element={
                          <PermissionGuard permission='purchases:read'>
                            <Purchases />
                          </PermissionGuard>
                        }
                      />
                      <Route path='/comercial/presupuestos' element={<BudgetManagement />} />
                      <Route path='/comercial/presupuestos/nuevo' element={<BudgetCreate />} />
                      <Route path='/comercial/presupuestos/:id' element={<BudgetDetail />} />

                      {/* Nuevas rutas de sistemas de pagos */}
                      <Route
                        path='/caja-registradora'
                        element={
                          <PermissionGuard permission='cash:read'>
                            <NewCashRegister />
                          </PermissionGuard>
                        }
                      />
                      <Route
                        path='/movimientos-caja'
                        element={
                          <PermissionGuard permission='cash:read'>
                            <CashMovements />
                          </PermissionGuard>
                        }
                      />
                      <Route
                        path='/movimientos-caja/nuevo'
                        element={
                          <PermissionGuard permission='cash:read'>
                            <RegisterCashMovement />
                          </PermissionGuard>
                        }
                      />
                      <Route
                        path='/pagos-compras'
                        element={
                          <PermissionGuard permission='purchases:read'>
                            <PurchasePayments />
                          </PermissionGuard>
                        }
                      />
                      <Route
                        path='/pagos-compras/:orderId'
                        element={
                          <PermissionGuard permission='purchases:read'>
                            <PurchasePaymentDetail />
                          </PermissionGuard>
                        }
                      />
                      <Route
                        path='/cobros-ventas'
                        element={
                          <PermissionGuard permission='cash:write'>
                            <SalePayment />
                          </PermissionGuard>
                        }
                      />
                      <Route
                        path='/cobros-ventas/:saleId'
                        element={<SalesOrderDetail />}
                      />
                      <Route
                        path='/cobros-ventas/:saleId/pagos'
                        element={
                          <PermissionGuard permission='cash:write'>
                            <SalesPaymentHistory />
                          </PermissionGuard>
                        }
                      />

                      {/* Configuración */}
                      <Route path='/configuracion' element={<Settings />} />
                      <Route path='/configuracion/preferencias' element={
                        <PermissionGuard permission="settings:write">
                          <BusinessPreferencesPage />
                        </PermissionGuard>
                      } />
                      <Route path='/configuracion/perfil' element={<MyProfileAndSecurity />} />
                      <Route path='/configuracion/sucursales' element={
                        <RoleGuard allowedRoles={['F2VLso']}>
                          <BranchManagement />
                        </RoleGuard>
                      } />

                      <Route path='/configuracion/terminal' element={
                        <PermissionGuard permission="branches:switch">
                          <TerminalPairing />
                        </PermissionGuard>
                      } />

                      <Route path='/configuracion/terminales' element={
                        <PermissionGuard permission="branches:write">
                          <DevicesPage />
                        </PermissionGuard>
                      } />
                      
                      <Route path='/configuracion/usuarios' element={
                        <PermissionGuard permission="users:read">
                          <UserManagementList />
                        </PermissionGuard>
                      } />
                      <Route path='/configuracion/usuarios/:id' element={
                        <PermissionGuard permission="users:read">
                          <UserDetailedProfile />
                        </PermissionGuard>
                      } />
                      <Route path='/configuracion/sesiones' element={
                        <PermissionGuard permission="users:read">
                          <AdminSessionsDashboard />
                        </PermissionGuard>
                      } />
                      <Route path='/configuracion/balanzas' element={
                        <PermissionGuard permission="products:write">
                          <ScaleConfigPage />
                        </PermissionGuard>
                      } />
                      <Route path='/configuracion/conversiones' element={
                        <PermissionGuard permission="products:write">
                          <UnitConversionsPage />
                        </PermissionGuard>
                      } />
                      
                      {/* Auditoría */}
                      <Route path='/auditoria' element={
                        <PermissionGuard permission='audit:read'>
                          <AuditDashboard />
                        </PermissionGuard>
                      } />
                      <Route path='/auditoria/logs' element={
                        <PermissionGuard permission='audit:read'>
                          <AuditLogs />
                        </PermissionGuard>
                      } />
                      <Route path='/auditoria/logs/:id' element={
                        <PermissionGuard permission='audit:read'>
                          <AuditLogDetail />
                        </PermissionGuard>
                      } />
                      <Route path='/auditoria/usuarios/:id' element={
                        <PermissionGuard permission='audit:read'>
                          <AuditUserActivity />
                        </PermissionGuard>
                      } />

                      {/* Configuración Financiera */}
                      <Route
                        path='/configuracion/monedas'
                        element={<Currencies />}
                      />
                      <Route
                        path='/configuracion/metodos-pago'
                        element={<PaymentMethods />}
                      />
                      <Route
                        path='/configuracion/tipos-cambio'
                        element={
                          <PermissionGuard permission='payments:read'>
                            <ExchangeRates />
                          </PermissionGuard>
                        }
                      />
                      <Route
                        path='/configuracion/categorias'
                        element={
                          <PermissionGuard permission="products:write">
                            <CategoriesPage />
                          </PermissionGuard>
                        }
                      />
                      <Route
                        path='/configuracion/marcas'
                        element={
                          <PermissionGuard permission="products:write">
                            <BrandsPage />
                          </PermissionGuard>
                        }
                      />
                      <Route
                        path='/configuracion/atributos'
                        element={
                          <PermissionGuard permission="products:write">
                            <AttributesPage />
                          </PermissionGuard>
                        }
                      />
                      <Route
                        path='/configuracion/impresoras'
                        element={
                          <PermissionGuard permission="documents:read">
                            <PrintersPage />
                          </PermissionGuard>
                        }
                      />
                      {/* <Route path="/test-products" element={<ProductDetailTest />} /> */}
                      {/* <Route path="/debug-products" element={<ProductComparisonDebug />} /> */}


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

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Componente principal que provee los contextos
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BranchProvider>
            {/* AnnouncementProvider temporarily disabled due to React 19 hooks compatibility */}
            <AppContent />
          </BranchProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
