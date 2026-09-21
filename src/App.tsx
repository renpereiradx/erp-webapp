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
// H1+H5 (audit react): code-splitting por página — cero React.lazy antes;
// TODO el árbol (incluido recharts ~1 MB) viajaba en un único chunk inicial
// de 3.3 MB para cualquier ruta. Quedan eager solo las landings (login,
// selección de sucursal, pedidos) y los shells; el resto se divide por
// página y recharts cae a un vendor chunk aparte (manualChunks).
// D4 (PLAN_ALINEACION_BI_FRONTEND 2026-09-18): /dashboard también es lazy —
// su import eager arrastraba recharts al chunk inicial.
import { lazy, Suspense, useEffect, useRef } from 'react'

// --- Lazy: una chunk por página/feature ---
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const SalesNew = lazy(() => import('@/pages/SalesNew'))
import Login from '@/pages/Login.tsx'
import BranchSelection from '@/pages/BranchSelection.tsx'
import { CounterOrdersPage } from '@/features/counterorders'

const FinancialSummaryDashboard = lazy(() => import('@/pages/FinancialSummaryDashboard'))
const DetailedKPIs = lazy(() => import('@/pages/DetailedKPIs'))
const SalesHeatmap = lazy(() => import('@/pages/SalesHeatmap'))
const ConsolidatedAlerts = lazy(() => import('@/pages/ConsolidatedAlerts'))
const TopProductsOverview = lazy(() => import('@/pages/TopProductsOverview'))
const Products = lazy(() => import('@/pages/Products'))
const PartiesPage = lazy(() => import('@/pages/PartiesPage'))
const BudgetManagement = lazy(() => import('@/pages/BudgetManagement'))
const BudgetCreate = lazy(() => import('@/pages/BudgetCreate'))
const BudgetDetail = lazy(() => import('@/pages/BudgetDetail'))
const PurchaseRequisitionList = lazy(() => import('@/pages/PurchaseRequisitionList'))
const PurchaseRequisitionCreate = lazy(() => import('@/pages/PurchaseRequisitionCreate'))
const PurchaseRequisitionDetail = lazy(() => import('@/pages/PurchaseRequisitionDetail'))
const ScaleConfigPage = lazy(() => import('@/features/scales/components/ScaleConfigPage'))
const UnitConversionsPage = lazy(() => import('@/features/unit-conversions/components/UnitConversionsPage'))
const PriceAdjustmentNew = lazy(() => import('@/pages/PriceAdjustmentNew'))
const PriceAdjustmentDetail = lazy(() => import('@/pages/PriceAdjustmentDetail'))
const PriceAdjustmentHistory = lazy(() => import('@/pages/PriceAdjustmentHistory'))
const PriceAdjustmentHistoryDetail = lazy(() => import('@/pages/PriceAdjustmentHistoryDetail'))
const BookingUnifiedDashboard = lazy(() => import('@/pages/BookingUnifiedDashboard'))
const StockMovements = lazy(() => import('@/pages/StockMovements'))
const Purchases = lazy(() => import('@/pages/Purchases'))
const PurchasePayments = lazy(() => import('@/pages/PurchasePayments'))
const PurchasePaymentDetail = lazy(() => import('@/pages/PurchasePaymentDetail'))
const NewCashRegister = lazy(() => import('@/pages/NewCashRegister'))
const RegisterCashMovement = lazy(() => import('@/pages/RegisterCashMovement'))
const CashMovements = lazy(() => import('@/pages/CashMovements'))
const SalePayment = lazy(() => import('@/pages/SalePayment'))
const SalesOrderDetail = lazy(() => import('@/pages/SalesOrderDetail'))
const SalesPaymentHistory = lazy(() => import('@/pages/SalesPaymentHistory'))
const Currencies = lazy(() => import('@/pages/Currencies'))
const PaymentMethods = lazy(() => import('@/pages/PaymentMethods'))
const ExchangeRates = lazy(() => import('@/pages/ExchangeRates'))
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'))
const BrandsPage = lazy(() => import('@/pages/BrandsPage').then((m) => ({ default: m.BrandsPage })))
const AttributesPage = lazy(() => import('@/pages/AttributesPage').then((m) => ({ default: m.AttributesPage })))
const PrintersPage = lazy(() => import('@/pages/PrintersPage'))
const Settings = lazy(() => import('@/pages/Settings'))
const BusinessPreferencesPage = lazy(() => import('@/features/settings/components/BusinessPreferencesPage'))
const LicenseStatusPage = lazy(() => import('@/features/settings/components/LicenseStatusPage'))
const BranchManagement = lazy(() => import('@/pages/BranchManagement'))
const TerminalPairing = lazy(() => import('@/features/branches/components/TerminalPairing'))
const DevicesPage = lazy(() => import('@/pages/DevicesPage'))
const TransfersPage = lazy(() => import('@/features/transfers/components/TransfersPage'))
const CatalogBoard = lazy(() => import('@/features/catalog').then((m) => ({ default: m.CatalogBoard })))
const UserManagementList = lazy(() => import('@/pages/UserManagementList.tsx'))
const UserDetailedProfile = lazy(() => import('@/pages/UserDetailedProfile.tsx'))
const MyProfileAndSecurity = lazy(() => import('@/pages/MyProfileAndSecurity.tsx'))
const AuditDashboard = lazy(() => import('@/pages/AuditDashboard'))
const AuditLogs = lazy(() => import('@/pages/AuditLogs'))
const AuditLogDetail = lazy(() => import('@/pages/AuditLogDetail'))
const AuditUserActivity = lazy(() => import('@/pages/AuditUserActivity.tsx'))
const ReceivablesDashboard = lazy(() => import('@/pages/ReceivablesDashboard'))
const PayablesDashboard = lazy(() => import('@/pages/PayablesDashboard'))
const PayablesAgingReport = lazy(() => import('@/pages/PayablesAgingReport'))
const ReceivablesMasterList = lazy(() => import('@/pages/ReceivablesMasterList'))
const InvoicesMasterList = lazy(() => import('@/pages/InvoicesMasterList'))
const InvoiceDetail = lazy(() => import('@/pages/InvoiceDetail'))
const CashFlowProjection = lazy(() => import('@/pages/CashFlowProjection'))
const CashFlowAnalysisDashboard = lazy(() => import('@/pages/CashFlowAnalysisDashboard'))
const TaxManagementDashboard = lazy(() => import('@/pages/TaxManagementDashboard'))
const SkippedNumbersPage = lazy(() => import('@/features/fiscal/pages/SkippedNumbersPage'))
const FiscalOpsDashboard = lazy(() => import('@/features/fiscal/pages/FiscalOpsDashboard'))
const SupplierAnalysis = lazy(() => import('@/pages/SupplierAnalysis'))
const ReceivableDetail = lazy(() => import('@/pages/ReceivableDetail'))
const OverdueAccounts = lazy(() => import('@/pages/OverdueAccounts'))
const ClientCreditProfile = lazy(() => import('@/pages/ClientCreditProfile'))
const AgingReport = lazy(() => import('@/pages/AgingReport'))
const ProfitAndLoss = lazy(() => import('@/pages/ProfitAndLoss'))
const LegalBooks = lazy(() => import('@/pages/LegalBooks'))
const AdminSessionsDashboard = lazy(() => import('@/pages/AdminSessionsDashboard.tsx'))
const ProfitabilityDashboard = lazy(() => import('@/features/profitability').then((m) => ({ default: m.ProfitabilityDashboard })))
const ProductProfitability = lazy(() => import('@/features/profitability').then((m) => ({ default: m.ProductProfitability })))
const CustomerProfitability = lazy(() => import('@/features/profitability').then((m) => ({ default: m.CustomerProfitability })))
const CategoryProfitability = lazy(() => import('@/features/profitability').then((m) => ({ default: m.CategoryProfitability })))
const ProfitabilityTrends = lazy(() => import('@/features/profitability').then((m) => ({ default: m.ProfitabilityTrends })))
const SellerProfitability = lazy(() => import('@/features/profitability').then((m) => ({ default: m.SellerProfitability })))
const DashboardPronosticos = lazy(() => import('@/features/bi-forecasting').then((m) => ({ default: m.DashboardPronosticos })))
const SaludInventario = lazy(() => import('@/features/bi-forecasting').then((m) => ({ default: m.SaludInventario })))
const PronosticoVentas = lazy(() => import('@/features/bi-forecasting').then((m) => ({ default: m.PronosticoVentas })))
const PronosticoDemanda = lazy(() => import('@/features/bi-forecasting').then((m) => ({ default: m.PronosticoDemanda })))
const PronosticoIngresos = lazy(() => import('@/features/bi-forecasting').then((m) => ({ default: m.PronosticoIngresos })))
const SalesAnalyticsDashboard = lazy(() => import('@/pages/sales-analytics/Dashboard'))
const SalesAnalyticsProductsCategories = lazy(() => import('@/pages/sales-analytics/ProductsCategories'))
const SalesAnalyticsInsights = lazy(() => import('@/pages/sales-analytics/CustomerSellerInsights'))
const SalesAnalyticsTrendsVelocity = lazy(() => import('@/pages/sales-analytics/TrendsVelocity'))
const SalesAnalyticsPeriodComparison = lazy(() => import('@/pages/sales-analytics/PeriodComparison'))
const SalesAnalyticsDiscounts = lazy(() => import('@/pages/sales-analytics/Discounts'))
const InventoryTurnoverABC = lazy(() => import('@/pages/InventoryAnalytics/InventoryTurnoverABC'))
const InventoryDashboard = lazy(() => import('@/pages/InventoryAnalytics/InventoryDashboard'))
const StockLevelsReorder = lazy(() => import('@/pages/InventoryAnalytics/StockLevelsReorder'))
const InventoryRisk = lazy(() => import('@/pages/InventoryAnalytics/InventoryRisk'))
import { AuthProvider, useAuth } from '@/contexts/AuthContext.tsx'
import { BranchProvider, useBranch } from '@/contexts/BranchContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import RoleGuard from '@/components/auth/RoleGuard'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { useLocation } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import PriceAdjustmentLayout from '@/layouts/PriceAdjustmentLayout'

/** Fallback de Suspense para las rutas lazy (tokens DESIGN §2, sin hex). */
const PageLoader = () => (
  <div className='flex min-h-[50vh] items-center justify-center' role='status' aria-live='polite'>
    <div className='h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent' />
  </div>
)

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

// HomeRedirect y BiModuleRoute viven en components/auth (testables, F3);
// BiPermissionGuard compone licencia (fuera) + permiso (dentro) — el mismo
// orden que la cadena BE (RequireModule → RequireModulePermission).
import HomeRedirect from '@/components/auth/HomeRedirect'
import BiModuleRoute from '@/components/auth/BiModuleRoute'
const BiPermissionGuard = ({
  permission,
  children,
}: {
  permission: string
  children: React.ReactNode
}) => (
  <BiModuleRoute>
    <PermissionGuard permission={permission}>{children}</PermissionGuard>
  </BiModuleRoute>
)

/** Guard del módulo dashboard (dashboard:read + pack BI; el sidebar ya lo gated). */
const DashboardRoute = ({ children }: { children: React.ReactNode }) => (
  <BiPermissionGuard permission='dashboard:read'>{children}</BiPermissionGuard>
)

function AppContent() {
  const { isAuthenticated, loading, refreshEntitlements } = useAuth()
  const { t } = useI18n()
  const lastPartialToastRef = useRef(0)
  const lastModuleToastRef = useRef(0)

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

    // PLAN_BI_PACK_PREMIUM ADR-6/ADR-7: revocación del pack en caliente.
    // El dispatcher emite api:module_not_licensed (también para GET, que
    // silencia api:forbidden); aquí refrescamos entitlements (/me) y avisamos:
    // el cambio de estado hace que BiModuleRoute redirija fuera de la ruta BI.
    const handleModuleNotLicensed = (e: any) => {
      const now = Date.now()
      if (now - lastModuleToastRef.current < 5000) return
      lastModuleToastRef.current = now
      void refreshEntitlements()
      import('sonner').then(({ toast }) => {
        toast.warning(
          e.detail ||
            t(
              'licensing.moduleNotLocked',
              'El módulo de Inteligencia de Negocios no está incluido en la licencia de esta instalación',
            ),
        );
      });
    };

    window.addEventListener('api:forbidden', handleForbidden);
    window.addEventListener('api:method_not_allowed', handleMethodNotAllowed);
    window.addEventListener('api:partial-data', handlePartialData);
    window.addEventListener('api:module_not_licensed', handleModuleNotLicensed);

    return () => {
      window.removeEventListener('api:forbidden', handleForbidden);
      window.removeEventListener('api:method_not_allowed', handleMethodNotAllowed);
      window.removeEventListener('api:partial-data', handlePartialData);
      window.removeEventListener('api:module_not_licensed', handleModuleNotLicensed);
    };
  }, [refreshEntitlements, t]);

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
                    {/* H1: todas las rutas internas son lazy — fallback único */}
                    <Suspense fallback={<PageLoader />}>
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
                      {/* D3 (PLAN_ALINEACION_BI_FRONTEND): contenido CxC — mismo
                          guard receivables:read que /receivables (sin redirect). */}
                      <Route path='/dashboard/receivables' element={
                        <BiPermissionGuard permission='receivables:read'>
                          <ReceivablesDashboard />
                        </BiPermissionGuard>
                      } />
                      <Route path='/dashboard/payables' element={<DashboardRoute><PayablesDashboard /></DashboardRoute>} />
                      <Route path='/payables/invoices' element={
                        <BiPermissionGuard permission='payables:read'>
                          <InvoicesMasterList />
                        </BiPermissionGuard>
                      } />
                      <Route path='/payables/detail/:id' element={
                        <BiPermissionGuard permission='payables:read'>
                          <InvoiceDetail />
                        </BiPermissionGuard>
                      } />
                      <Route path='/payables/cash-flow' element={
                        <BiPermissionGuard permission='payables:read'>
                          <CashFlowProjection />
                        </BiPermissionGuard>
                      } />
                      <Route path='/payables/aging-report' element={
                        <BiPermissionGuard permission='payables:read'>
                          <PayablesAgingReport />
                        </BiPermissionGuard>
                      } />
                      <Route path='/finance/analytical-cash-flow' element={
                        <BiPermissionGuard permission='reports:read'>
                          <CashFlowAnalysisDashboard />
                        </BiPermissionGuard>
                      } />
                      <Route path='/finance/tax-management' element={
                        <BiPermissionGuard permission='reports:read'>
                          <TaxManagementDashboard />
                        </BiPermissionGuard>
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
                        <BiPermissionGuard permission='reports:read'>
                          <ProfitAndLoss />
                        </BiPermissionGuard>
                      } />
                      <Route path='/finance/legal-books' element={
                        <BiPermissionGuard permission='reports:read'>
                          <LegalBooks />
                        </BiPermissionGuard>
                      } />
                      
                      {/* BI Forecasting Routes */}
                      <Route path='/bi/pronosticos/dashboard' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <DashboardPronosticos />
                        </BiPermissionGuard>
                      } />
                      <Route path='/bi/pronosticos/inventario' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <SaludInventario />
                        </BiPermissionGuard>
                      } />
                      <Route path='/bi/pronosticos/ventas' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <PronosticoVentas />
                        </BiPermissionGuard>
                      } />
                      <Route path='/bi/pronosticos/demanda' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <PronosticoDemanda />
                        </BiPermissionGuard>
                      } />
                      <Route path='/bi/pronosticos/ingresos' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <PronosticoIngresos />
                        </BiPermissionGuard>
                      } />
                      
                      {/* Profitability Analytics Module (Detailed) */}
                      <Route path='/profitability/dashboard' element={
                        <BiPermissionGuard permission="analytics:read"><ProfitabilityDashboard /></BiPermissionGuard>
                      } />
                      <Route path='/profitability/products' element={
                        <BiPermissionGuard permission="analytics:read"><ProductProfitability /></BiPermissionGuard>
                      } />
                      <Route path='/profitability/customers' element={
                        <BiPermissionGuard permission="analytics:read"><CustomerProfitability /></BiPermissionGuard>
                      } />
                      <Route path='/profitability/categories' element={
                        <BiPermissionGuard permission="analytics:read"><CategoryProfitability /></BiPermissionGuard>
                      } />
                      <Route path='/profitability/trends' element={
                        <BiPermissionGuard permission="analytics:read"><ProfitabilityTrends /></BiPermissionGuard>
                      } />
                      <Route path='/profitability/sellers' element={
                        <BiPermissionGuard permission="analytics:read"><SellerProfitability /></BiPermissionGuard>
                      } />

                      <Route path='/receivables' element={
                        <BiPermissionGuard permission='receivables:read'>
                          <ReceivablesDashboard />
                        </BiPermissionGuard>
                      } />
                      <Route path='/receivables/list' element={
                        <BiPermissionGuard permission='receivables:read'>
                          <ReceivablesMasterList />
                        </BiPermissionGuard>
                      } />
                      <Route path='/receivables/detail/:id' element={
                        <BiPermissionGuard permission='receivables:read'>
                          <ReceivableDetail />
                        </BiPermissionGuard>
                      } />
                      <Route path='/receivables/overdue' element={
                        <BiPermissionGuard permission='receivables:read'>
                          <OverdueAccounts />
                        </BiPermissionGuard>
                      } />
                      <Route path='/receivables/client-profile/:clientId' element={
                        <BiPermissionGuard permission='receivables:read'>
                          <ClientCreditProfile />
                        </BiPermissionGuard>
                      } />
                      <Route path='/receivables/aging-report' element={
                        <BiPermissionGuard permission='receivables:read'>
                          <AgingReport />
                        </BiPermissionGuard>
                      } />
                      <Route path='/productos' element={<PermissionGuard permission="products:write"><Products /></PermissionGuard>} />
                      <Route path='/parties' element={<PermissionGuard anyOf={['parties:read', 'clients:read', 'suppliers:read']}><PartiesPage /></PermissionGuard>} />
                      <Route path='/payables/suppliers/:id/analysis' element={
                        <BiPermissionGuard permission='payables:read'>
                          <SupplierAnalysis />
                        </BiPermissionGuard>
                      } />
                      <Route path='/ventas' element={<PermissionGuard permission="sales:read"><SalesNew /></PermissionGuard>} />
                      
                      {/* Sales Analytics Routes */}
                      <Route path='/sales-analytics/dashboard' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <SalesAnalyticsDashboard />
                        </BiPermissionGuard>
                      } />
                      <Route path='/sales-analytics/products-categories' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <SalesAnalyticsProductsCategories />
                        </BiPermissionGuard>
                      } />
                      <Route path='/sales-analytics/insights' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <SalesAnalyticsInsights />
                        </BiPermissionGuard>
                      } />
                      <Route path='/sales-analytics/trends-velocity' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <SalesAnalyticsTrendsVelocity />
                        </BiPermissionGuard>
                      } />
                      <Route path='/sales-analytics/period-comparison' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <SalesAnalyticsPeriodComparison />
                        </BiPermissionGuard>
                      } />
                      <Route path='/sales-analytics/discounts' element={
                        <BiPermissionGuard permission="reports:read"><SalesAnalyticsDiscounts /></BiPermissionGuard>
                      } />

                      {/* Inventory Analytics Routes */}
                      <Route path='/inventory-analytics/dashboard' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <InventoryDashboard />
                        </BiPermissionGuard>
                      } />
                      <Route path='/inventory-analytics/turnover-abc' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <InventoryTurnoverABC />
                        </BiPermissionGuard>
                      } />
                      <Route path='/inventory-analytics/stock-levels' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <StockLevelsReorder />
                        </BiPermissionGuard>
                      } />
                      <Route path='/inventory-analytics/risk' element={
                        <BiPermissionGuard permission='analytics:read'>
                          <InventoryRisk />
                        </BiPermissionGuard>
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
                      {/* PLAN_BI_PACK_PREMIUM F4: estado de la licencia (Core, auth-only) */}
                      <Route path='/configuracion/licencia' element={<LicenseStatusPage />} />
                      
                      {/* Auditoría */}
                      <Route path='/auditoria' element={
                        <BiPermissionGuard permission='audit:read'>
                          <AuditDashboard />
                        </BiPermissionGuard>
                      } />
                      <Route path='/auditoria/logs' element={
                        <BiPermissionGuard permission='audit:read'>
                          <AuditLogs />
                        </BiPermissionGuard>
                      } />
                      <Route path='/auditoria/logs/:id' element={
                        <BiPermissionGuard permission='audit:read'>
                          <AuditLogDetail />
                        </BiPermissionGuard>
                      } />
                      <Route path='/auditoria/usuarios/:id' element={
                        <BiPermissionGuard permission='audit:read'>
                          <AuditUserActivity />
                        </BiPermissionGuard>
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
                    </Suspense>
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
