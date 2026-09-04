import {
  Activity,
  AlertTriangle,
  Award,
  BarChart,
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  CircleDollarSign,
  ClipboardList,
  Clock as ClockIcon,
  Coins,
  CreditCard,
  DollarSign,
  FileText,
  Flame,
  Gauge,
  LayoutDashboard,
  List,
  Package,
  PieChart,
  PlusCircle,
  Printer,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Tags,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react'
import type { NavigationItem, TFn } from './types'

interface PermissionChecks {
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (...permissions: string[]) => boolean
}

/**
 * Árbol de navegación del sidebar. Los textos se resuelven vía i18n; los
 * módulos gated por negocio (ej. reservas) no generan la entrada.
 */
export const buildNavigation = (t: TFn, reservationsEnabled: boolean): NavigationItem[] => [
  {
    name: t('common.bi', 'Inteligencia de Negocios'),
    href: '#',
    icon: BarChart3,
    permission: 'analytics:read',
    children: [
      {
        name: t('common.dashboard', 'Dashboard'),
        href: '#',
        icon: LayoutDashboard,
        permission: 'dashboard:read',
        children: [
          { name: t('common.home', 'Resumen Ejecutivo'), href: '/dashboard', icon: BarChart3 },
          { name: t('dashboard.kpis', 'KPIs y Rendimiento'), href: '/dashboard/kpis', icon: TrendingUp },
          { name: t('dashboard.heatmap', 'Análisis de Ventas'), href: '/dashboard/sales-heatmap', icon: Flame },
          { name: t('dashboard.alerts', 'Alertas de Negocio'), href: '/dashboard/alerts', icon: AlertTriangle },
          { name: t('dashboard.topProducts', 'Top de Productos'), href: '/dashboard/top-products', icon: Award },
        ],
      },
      {
        name: t('nav.salesAnalytics', 'Analítica de Ventas'),
        href: '#',
        icon: BarChart3,
        children: [
          { name: t('nav.executiveDashboard', 'Dashboard Ejecutivo'), href: '/sales-analytics/dashboard', icon: LayoutDashboard },
          { name: t('nav.productsCategories', 'Productos y Categorías'), href: '/sales-analytics/products-categories', icon: PieChart },
          { name: t('nav.insights', 'Insights Clientes/Vend.'), href: '/sales-analytics/insights', icon: Users },
          { name: t('nav.trendsVelocity', 'Tendencias y Velocidad'), href: '/sales-analytics/trends-velocity', icon: Zap },
          { name: t('nav.periodComparison', 'Comparativa Períodos'), href: '/sales-analytics/period-comparison', icon: Activity },
        ],
      },
      {
        name: t('nav.biForecasts', 'Pronósticos BI (IA)'),
        href: '#',
        icon: Zap,
        children: [
          { name: t('nav.forecastsDashboard', 'Dashboard de Pronósticos'), href: '/bi/pronosticos/dashboard', icon: LayoutDashboard },
          { name: t('nav.inventoryHealth', 'Salud de Inventario'), href: '/bi/pronosticos/inventario', icon: Package },
          { name: t('nav.salesForecast', 'Pronóstico de Ventas'), href: '/bi/pronosticos/ventas', icon: TrendingUp },
          { name: t('nav.demandForecast', 'Pronóstico de Demanda'), href: '/bi/pronosticos/demanda', icon: BarChart3 },
          { name: t('nav.revenueScenarios', 'Escenarios de Ingresos'), href: '/bi/pronosticos/ingresos', icon: BarChart },
        ],
      },
      {
        name: t('nav.profitabilityGroup', 'Analítica de Rentabilidad'),
        href: '#',
        icon: BarChart3,
        children: [
          { name: t('nav.executiveDashboard', 'Dashboard Ejecutivo'), href: '/profitability/dashboard', icon: LayoutDashboard },
          { name: t('nav.profitabilityByProduct', 'Rentabilidad por Producto'), href: '/profitability/products', icon: BarChart3 },
          { name: t('nav.profitabilityByCustomer', 'Rentabilidad por Cliente'), href: '/profitability/customers', icon: Users },
          { name: t('nav.profitabilityByCategory', 'Rentabilidad por Categoría'), href: '/profitability/categories', icon: PieChart },
          { name: t('nav.marginTrends', 'Tendencias de Margen'), href: '/profitability/trends', icon: Zap },
          { name: t('nav.sellerPerformance', 'Desempeño por Vendedor'), href: '/profitability/sellers', icon: UserCheck },
        ],
      },
      {
        name: t('inventory.analytics', 'Analítica de Inventario'),
        href: '#',
        icon: Package,
        permission: 'analytics:read',
        children: [
          { name: t('inventory.analytics.dashboard', 'Dashboard de Inventario'), href: '/inventory-analytics/dashboard', icon: LayoutDashboard },
          { name: t('inventory.analytics.turnover_abc', 'Rotación y Análisis ABC'), href: '/inventory-analytics/turnover-abc', icon: BarChart3 },
          { name: t('inventory.analytics.stock_levels', 'Niveles de Stock'), href: '/inventory-analytics/stock-levels', icon: List },
          { name: t('inventory.analytics.risk', 'Riesgos y Stock Muerto'), href: '/inventory-analytics/risk', icon: AlertTriangle },
        ],
      },
      {
        name: t('receivables.title', 'Cuentas por Cobrar'),
        href: '#',
        icon: CreditCard,
        permission: 'receivables:read',
        children: [
          { name: t('receivables.summary', 'Resumen'), href: '/receivables', icon: BarChart3 },
          { name: t('receivables.list', 'Lista de Cuentas'), href: '/receivables/list', icon: List },
          { name: t('receivables.overdue', 'Cuentas Vencidas'), href: '/receivables/overdue', icon: AlertTriangle },
          { name: t('receivables.agingReport', 'Reporte de Antigüedad'), href: '/receivables/aging-report', icon: ClockIcon },
        ],
      },
      {
        name: t('payables.title', 'Cuentas por Pagar'),
        href: '#',
        icon: CircleDollarSign,
        permission: 'payables:read',
        children: [
          { name: t('payables.summary', 'Resumen Ejecutivo'), href: '/dashboard/payables', icon: BarChart3 },
          { name: t('payables.invoices', 'Lista Maestra de Facturas'), href: '/payables/invoices', icon: FileText },
          { name: t('payables.cashFlow', 'Proyección de Pagos y Flujo'), href: '/payables/cash-flow', icon: TrendingUp },
          { name: t('payables.agingReport', 'Reporte de Antigüedad'), href: '/payables/aging-report', icon: ClockIcon },
        ],
      },
      {
        name: t('nav.financialReports', 'Reportes Financieros'),
        href: '#',
        icon: FileText,
        permission: 'reports:read',
        children: [
          { name: t('nav.financialSummaryBI', 'Resumen Financiero BI'), href: '/dashboard/financial-summary', icon: TrendingUp },
          { name: t('nav.analyticalCashFlow', 'Flujo de Efectivo Analítico'), href: '/finance/analytical-cash-flow', icon: CircleDollarSign },
          { name: t('nav.vatManagement', 'Gestión de IVA / Fiscal'), href: '/finance/tax-management', icon: FileText },
          { name: t('nav.sifenNumberingGaps', 'Saltos de numeración SIFEN'), href: '/finance/sifen-inutilizacion', icon: List, permission: 'sifen:read' },
          { name: t('nav.sifenFiscalDashboard', 'Dashboard Fiscal SIFEN'), href: '/finance/sifen-ops', icon: Gauge, permission: 'sifen:read' },
          { name: t('nav.legalBooks', 'Libros Legales (Ventas y Compras)'), href: '/finance/legal-books', icon: BookOpen },
          { name: t('nav.profitAndLoss', 'Estado de Resultados (P&L)'), href: '/finance/profit-and-loss', icon: BarChart3 },
        ],
      },
      {
        name: t('nav.systemAudit', 'Auditoría de Sistema'),
        href: '#',
        icon: Shield,
        permission: 'audit:read',
        children: [
          { name: t('nav.auditDashboard', 'Dashboard de Auditoría'), href: '/auditoria', icon: LayoutDashboard },
          { name: t('nav.auditLogs', 'Registro de Logs'), href: '/auditoria/logs', icon: List },
        ],
      },
    ],
  },
  {
    name: t('common.commercial', 'Gestión Comercial'),
    href: '#',
    icon: ShoppingCart,
    children: [
      {
        name: t('sales.title', 'Ventas'),
        href: '#',
        icon: ShoppingCart,
        permission: 'sales:read',
        children: [
          { name: t('nav.newSale', 'Nueva Venta'), href: '/ventas', icon: PlusCircle },
          { name: t('nav.budgets', 'Presupuestos'), href: '/comercial/presupuestos', icon: FileText, permission: 'budgets:read' },
          // Gate del módulo: con reservas desactivadas la entrada no existe
          // (no solo se oculta) — el route guard redirige igualmente.
          ...(reservationsEnabled
            ? [
                {
                  name: t('nav.agendaReservations', 'Agenda y Reservas'),
                  href: '/gestion-agenda',
                  icon: Calendar,
                  permission: 'reserves:read',
                },
              ]
            : []),
        ],
      },
      {
        name: t('purchases.title', 'Compras'),
        href: '/compras',
        icon: ShoppingBag,
        permission: 'purchases:read',
      },
      {
        name: t('common.payments', 'Pagos y Cobros'),
        href: '#',
        icon: DollarSign,
        permission: 'payments:read',
        children: [
          { name: t('sales.payments', 'Cobros Ventas'), href: '/cobros-ventas', icon: CreditCard },
          { name: t('purchasePaymentsMvp.title', 'Pagos Compras'), href: '/pagos-compras', icon: CircleDollarSign },
        ],
      },
      {
        name: t('cashRegister.title', 'Caja'),
        href: '#',
        icon: DollarSign,
        permission: 'cash:read',
        children: [
          { name: t('cashRegister.openClose', 'Apertura y Cierre'), href: '/caja-registradora', icon: DollarSign },
          { name: t('cashMovement.title', 'Movimientos Manuales'), href: '/movimientos-caja', icon: Activity },
        ],
      },
    ],
  },
  {
    name: t('common.inventory_logistics', 'Logística e Inventario'),
    href: '#',
    icon: Package,
    permission: 'inventory:read',
    children: [
      { name: t('products.title', 'Productos'), href: '/productos', icon: Package, permission: 'products:read' },
      {
        name: t('nav.classificationCatalogs', 'Clasificación y Catálogos'),
        icon: Tags,
        permission: 'products:read',
        children: [
          { name: t('nav.categoriesTaxes', 'Categorías e Impuestos'), href: '/configuracion/categorias' },
          { name: t('nav.brands', 'Marcas'), href: '/configuracion/marcas' },
          { name: t('nav.attributesTags', 'Atributos y Etiquetas'), href: '/configuracion/atributos' },
        ],
      },
      { name: t('nav.requisitions', 'Requisiciones'), href: '/logistica/requisiciones', icon: ClipboardList },
      {
        name: t('productAdjustments.title', 'Ajustes de Producto'),
        href: '#',
        icon: SlidersHorizontal,
        children: [
          { name: t('priceAdjustment.title', 'Ajustes de Precios'), href: '/ajustes-precios', icon: TrendingUp },
          { name: t('stockMovements.menu', 'Movimientos de Stock'), href: '/movimientos-stock', icon: List },
        ],
      },
    ],
  },
  {
    name: t('common.directory', 'Directorio de Contactos'),
    href: '/parties',
    icon: Users,
    // anyOf: vendedores con clients:read ven el directorio sin parties:read
    permissions: ['parties:read', 'clients:read', 'suppliers:read'],
  },
  // Sección completa gated por el módulo de reservas del negocio.
  ...(reservationsEnabled
    ? [
        {
          name: t('common.services_planning', 'Planificación y Reservas'),
          href: '#',
          icon: Calendar,
          permission: 'reserves:read',
          children: [
            {
              name: t('reservations.title', 'Gestión de Agenda'),
              href: '/gestion-agenda',
              icon: Calendar,
            },
          ],
        },
      ]
    : []),
  {
    name: t('common.system_config', 'Configuración y Sistema'),
    href: '#',
    icon: Settings,
    children: [
      {
        name: t('branches.title', 'Sucursales'),
        href: '/configuracion/sucursales',
        icon: Building2,
        permission: 'branches:read',
      },
      {
        name: t('printers.nav', 'Impresoras de tickets'),
        href: '/configuracion/impresoras',
        icon: Printer,
        permission: 'documents:read',
      },
      {
        name: t('common.financeConfig', 'Config. Financiera'),
        href: '#',
        icon: Coins,
        permission: 'tax:read',
        children: [
          { name: t('currencies.title', 'Monedas'), href: '/configuracion/monedas', icon: Coins },
          { name: t('nav.payment_methods', 'Métodos de Pago'), href: '/configuracion/metodos-pago', icon: CreditCard },
          { name: t('exchangeRates.title', 'Tipos de Cambio'), href: '/configuracion/tipos-cambio', icon: SlidersHorizontal },
        ],
      },
      {
        name: t('nav.usersSecurity', 'Usuarios y Seguridad'),
        href: '#',
        icon: Shield,
        permission: 'users:read',
        children: [
          { name: t('nav.usersManagement', 'Gestión de Usuarios'), href: '/configuracion/usuarios', icon: Users },
          { name: t('nav.sessionControl', 'Control de Sesiones'), href: '/configuracion/sesiones', icon: ClockIcon },
          {
            name: t('nav.myProfile', 'Mi Perfil'),
            href: '/configuracion/perfil',
            icon: User,
            permission: undefined, // Mi perfil es accesible por todos
          },
        ],
      },
      {
        name: t('businessPrefs.title', 'Preferencias del negocio'),
        href: '/configuracion/preferencias',
        icon: SlidersHorizontal,
        permission: 'settings:write',
      },
      { name: t('settings.title', 'Ajustes Generales'), href: '/configuracion', icon: Settings },
    ],
  },
]

/**
 * Filtra el árbol por permisos, inmutable: los padres con gate quedan solo si
 * les queda al menos un hijo; los padres sin gate se mantengan o no tengan hijos.
 */
export const filterNavigationItems = (
  items: NavigationItem[],
  checks: PermissionChecks,
): NavigationItem[] =>
  items.flatMap((item) => {
    if (item.permissions?.length && !checks.hasAnyPermission(...item.permissions)) return []
    if (item.permission && !checks.hasPermission(item.permission)) return []
    if (!item.children) return [item]

    const children = filterNavigationItems(item.children, checks)
    if (children.length === 0 && item.permission) return []
    return [{ ...item, children }]
  })
