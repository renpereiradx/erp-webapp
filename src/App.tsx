/**
 * Componente principal de la aplicación ERP
 * Sistema de autenticación completo con sistema de temas robusto
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
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
import { lazy, Suspense, useEffect, useRef, useState } from 'react'

// --- Lazy: una chunk por página/feature ---
const SalesNew = lazy(() => import('@/pages/SalesNew'))
// PLAN_REBUILD_BI_UI_FRONTEND F2: pantallas del Dashboard BI (lazy, cada una
// su chunk; sin recharts: heatmap/tablas se renderizan con el design system).
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const DashboardKpisPage = lazy(() => import('@/pages/dashboard/DashboardKpisPage'))
const SalesHeatmapPage = lazy(() => import('@/pages/dashboard/SalesHeatmapPage'))
const AlertasPage = lazy(() => import('@/pages/dashboard/AlertsPage'))
const TopProductsPage = lazy(() => import('@/pages/dashboard/TopProductsPage'))
// PLAN_REBUILD_BI_UI_FRONTEND F3: drill-downs relacionales (4 pantallas lazy).
const ProductBuyersPage = lazy(() => import('@/pages/sales-analytics/ProductBuyersPage'))
const CustomerTopProductsPage = lazy(() => import('@/pages/sales-analytics/CustomerTopProductsPage'))
const SupplierTopProductsPage = lazy(() => import('@/pages/purchase-analytics/SupplierTopProductsPage'))
const ProductSuppliersPage = lazy(() => import('@/pages/purchase-analytics/ProductSuppliersPage'))
// PLAN_REBUILD_BI_UI_FRONTEND F4: Analítica de Ventas (6 pantallas lazy).
const SalesDashboardPage = lazy(() => import('@/pages/sales-analytics/SalesDashboardPage'))
const ProductsCategoriesPage = lazy(() => import('@/pages/sales-analytics/ProductsCategoriesPage'))
const CustomerSellerInsightsPage = lazy(() => import('@/pages/sales-analytics/CustomerSellerInsightsPage'))
const TrendsVelocityPage = lazy(() => import('@/pages/sales-analytics/TrendsVelocityPage'))
const PeriodComparisonPage = lazy(() => import('@/pages/sales-analytics/PeriodComparisonPage'))
const DiscountsPage = lazy(() => import('@/pages/sales-analytics/DiscountsPage'))
import Login from '@/pages/Login.tsx'
import BranchSelection from '@/pages/BranchSelection.tsx'
import { CounterOrdersPage } from '@/features/counterorders'

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
// REQ_BIPACK v2.0: pantalla full-screen de licencia requerida (bloqueo total
// por trial agotado sin licencia). Se monta FUERA del Router (early-return).
const LicenseRequiredGate = lazy(() => import('@/components/license/LicenseRequiredGate'))
const BranchManagement = lazy(() => import('@/pages/BranchManagement'))
const TerminalPairing = lazy(() => import('@/features/branches/components/TerminalPairing'))
const DevicesPage = lazy(() => import('@/pages/DevicesPage'))
const TransfersPage = lazy(() => import('@/features/transfers/components/TransfersPage'))
const Manufacturing = lazy(() => import('@/pages/Manufacturing'))
const CatalogBoard = lazy(() => import('@/features/catalog').then((m) => ({ default: m.CatalogBoard })))
const UserManagementList = lazy(() => import('@/pages/UserManagementList.tsx'))
const UserDetailedProfile = lazy(() => import('@/pages/UserDetailedProfile.tsx'))
const MyProfileAndSecurity = lazy(() => import('@/pages/MyProfileAndSecurity.tsx'))
const SkippedNumbersPage = lazy(() => import('@/features/fiscal/pages/SkippedNumbersPage'))
const FiscalOpsDashboard = lazy(() => import('@/features/fiscal/pages/FiscalOpsDashboard'))
const AdminSessionsDashboard = lazy(() => import('@/pages/AdminSessionsDashboard.tsx'))
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
// S3): con el toggle del negocio en off, /gestion-agenda redirige a /dashboard
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

// HomeRedirect y BiModuleRoute viven en components/auth (testables, F3).
// F2: el grupo BI vuelve a tener landing; BiPermissionGuard compone licencia
// (fuera) + permiso (dentro) — el mismo orden que la cadena BE
// (RequireModule → RequireModulePermission).
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

/**
 * F3 — los 4 drill-downs relacionales comparten la cadena BE
 * `RequireModule('bi')` → `analytics:read` (`biChain("analytics:read", …)`).
 */
const AnalyticsRoute = ({ children }: { children: React.ReactNode }) => (
  <BiPermissionGuard permission='analytics:read'>{children}</BiPermissionGuard>
)

/**
 * F4 — el reporte de descuentos es la única ruta del grupo con otro permiso:
 * el BE la registra con `biChain("reports:read", "discounts")`.
 */
const ReportsRoute = ({ children }: { children: React.ReactNode }) => (
  <BiPermissionGuard permission='reports:read'>{children}</BiPermissionGuard>
)

function AppContent() {
  const { isAuthenticated, loading, refreshEntitlements } = useAuth()
  const { t } = useI18n()
  const lastPartialToastRef = useRef(0)
  const lastModuleToastRef = useRef(0)
  // REQ_BIPACK v2.0: bloqueo total por licencia vencida. Cualquier 403
  // LICENSE_EXPIRED (dispatch del cliente API) swaps the whole app for the
  // license gate; se sale de él instalando una licencia (reload interno del
  // gate) o con un refresh manual del navegador.
  const [licenseBlocked, setLicenseBlocked] = useState(false)

  // Bootstrap de la tasa IVA default del backend (GET /tax_rate/default) para
  // las calculadoras del carrito. SOLO con la sesión restaurada: sin este
  // gate el fetch disparaba 401 en el login screen (sin token) y al recargar
  // con el access token expirado (el intento corría antes de que /me
  // refrescara la sesión). Fire-and-forget; las calculadoras usan el fallback
  // offline (IVA 10%) hasta que resuelve.
  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const taxStore = useTaxRateStore.getState()
    if (!taxStore.defaultTaxRate) {
      taxStore.fetchDefaultTaxRate().catch(() => {})
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
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
    const handleLicenseExpired = () => setLicenseBlocked(true);
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
    window.addEventListener('api:license_expired', handleLicenseExpired);

    return () => {
      window.removeEventListener('api:forbidden', handleForbidden);
      window.removeEventListener('api:method_not_allowed', handleMethodNotAllowed);
      window.removeEventListener('api:partial-data', handlePartialData);
      window.removeEventListener('api:module_not_licensed', handleModuleNotLicensed);
      window.removeEventListener('api:license_expired', handleLicenseExpired);
    };
  }, [refreshEntitlements, t]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background text-foreground'>
        <div className='text-lg'>Inicializando aplicación...</div>
      </div>
    )
  }

  // REQ_BIPACK v2.0: bloqueo total — la app completa se reemplaza por el
  // gate de licencia (fuera del Router: no hay navegación que preserve).
  // aud Fix 8: onRecovered baja el flag cuando el sondeo del gate descubre
  // que la instalación ya fue rescatada (otra pestaña / el proveedor), y el
  // Toaster se monta también aquí para que los toasts del gate existan.
  if (licenseBlocked) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Toaster position="top-right" richColors closeButton />
          <LicenseRequiredGate onRecovered={() => setLicenseBlocked(false)} />
        </Suspense>
      </ErrorBoundary>
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
                      {/* Ruta por defecto */}
                      <Route
                        path='/'
                        element={<HomeRedirect />}
                      />
                      {/* PLAN_REBUILD_BI_UI_FRONTEND F2 — Dashboard BI.
                          Guard: pack BI (BiModuleRoute) + dashboard:read. */}
                      <Route path='/dashboard' element={<DashboardRoute><DashboardPage /></DashboardRoute>} />
                      <Route path='/dashboard/kpis' element={<DashboardRoute><DashboardKpisPage /></DashboardRoute>} />
                      <Route path='/dashboard/sales-heatmap' element={<DashboardRoute><SalesHeatmapPage /></DashboardRoute>} />
                      <Route path='/dashboard/alerts' element={<DashboardRoute><AlertasPage /></DashboardRoute>} />
                      <Route path='/dashboard/top-products' element={<DashboardRoute><TopProductsPage /></DashboardRoute>} />
                      {/* PLAN_REBUILD_BI_UI_FRONTEND F3 — drill-downs relacionales.
                          Guard: pack BI (BiModuleRoute) + analytics:read, el
                          mismo par que la cadena BE de /sales-analytics y
                          /purchase-analytics. La entidad viaja por query param. */}
                      <Route path='/sales-analytics/products/buyers' element={<AnalyticsRoute><ProductBuyersPage /></AnalyticsRoute>} />
                      <Route path='/sales-analytics/customers/top-products' element={<AnalyticsRoute><CustomerTopProductsPage /></AnalyticsRoute>} />
                      <Route path='/purchase-analytics/suppliers/top-products' element={<AnalyticsRoute><SupplierTopProductsPage /></AnalyticsRoute>} />
                      <Route path='/purchase-analytics/products/suppliers' element={<AnalyticsRoute><ProductSuppliersPage /></AnalyticsRoute>} />
                      {/* PLAN_REBUILD_BI_UI_FRONTEND F4 — Analítica de Ventas.
                          Cinco pantallas con analytics:read (misma cadena BE);
                          descuentos con reports:read, como su subrouter. */}
                      <Route path='/sales-analytics/dashboard' element={<AnalyticsRoute><SalesDashboardPage /></AnalyticsRoute>} />
                      <Route path='/sales-analytics/products-categories' element={<AnalyticsRoute><ProductsCategoriesPage /></AnalyticsRoute>} />
                      <Route path='/sales-analytics/insights' element={<AnalyticsRoute><CustomerSellerInsightsPage /></AnalyticsRoute>} />
                      <Route path='/sales-analytics/trends-velocity' element={<AnalyticsRoute><TrendsVelocityPage /></AnalyticsRoute>} />
                      <Route path='/sales-analytics/period-comparison' element={<AnalyticsRoute><PeriodComparisonPage /></AnalyticsRoute>} />
                      <Route path='/sales-analytics/discounts' element={<ReportsRoute><DiscountsPage /></ReportsRoute>} />
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
                      <Route path='/productos' element={<PermissionGuard permission="products:write"><Products /></PermissionGuard>} />
                      <Route path='/parties' element={<PermissionGuard anyOf={['parties:read', 'clients:read', 'suppliers:read']}><PartiesPage /></PermissionGuard>} />
                      <Route path='/ventas' element={<PermissionGuard permission="sales:read"><SalesNew /></PermissionGuard>} />
                      
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

                      {/* PLAN_UNITS_V2 F6.2: manufactura (insumos, recetas, producción) */}
                      <Route
                        path='/manufactura'
                        element={
                          <PermissionGuard permission='manufacturing:read'>
                            <Manufacturing />
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
                                {t('notFound.title', 'Página no encontrada')}
                              </h1>
                              <p className='text-lg font-bold text-muted-foreground uppercase tracking-wide'>
                                {t('notFound.subtitle', 'La página que buscas no existe.')}
                              </p>
                            </div>
                            <div className='bg-card text-card-foreground border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center'>
                              <h2 className='text-xl font-black uppercase mb-2'>
                                Error 404
                              </h2>
                              <p className='text-muted-foreground font-bold mb-4'>
                                {t('notFound.message', 'Verifica la URL o regresa al dashboard.')}
                              </p>
                              <Link
                                to='/dashboard'
                                className='inline-flex items-center px-6 py-3 bg-lime-400 text-black font-black uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all'
                              >
                                {t('notFound.backToDashboard', 'Ir al Dashboard')}
                              </Link>
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
