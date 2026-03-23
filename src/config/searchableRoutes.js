import {
  Settings,
  User,
  Shield,
  FileText,
  Clock,
  CalendarCheck,
  TrendingUp,
  PackagePlus,
  ClipboardList,
  History,
  PlusCircle,
  Users,
  Flame,
  AlertTriangle,
  Award,
  PieChart,
  List,
  Package,
  UserCheck,
  LayoutDashboard,
  BarChart3,
  SlidersHorizontal,
  Activity,
  Zap,
  BarChart
} from 'lucide-react'

/**
 * Rutas adicionales que no están en el sidebar pero deben ser buscables
 * Estructura compatible con el sistema de navegación de MainLayout
 */
export const distinctSearchableRoutes = [
  // Sales Analytics (Business Intelligence)
  {
    name: 'Dashboard Ejecutivo de Ventas (Analítica)',
    href: '/sales-analytics/dashboard',
    icon: LayoutDashboard,
    category: 'BI / Ventas'
  },
  {
    name: 'Análisis de Productos y Categorías (Ventas)',
    href: '/sales-analytics/products-categories',
    icon: PieChart,
    category: 'BI / Ventas'
  },
  {
    name: 'Insights de Clientes y Vendedores',
    href: '/sales-analytics/insights',
    icon: Users,
    category: 'BI / Ventas'
  },
  {
    name: 'Tendencias Temporales y Velocidad de Ventas',
    href: '/sales-analytics/trends-velocity',
    icon: Zap,
    category: 'BI / Ventas'
  },
  {
    name: 'Comparativa de Períodos de Venta',
    href: '/sales-analytics/period-comparison',
    icon: Activity,
    category: 'BI / Ventas'
  },

  // Inventory Analytics (Business Intelligence)
  {
    name: 'Dashboard Ejecutivo de Inventario',
    href: '/inventory-analytics/dashboard',
    icon: LayoutDashboard,
    category: 'BI / Inventario'
  },
  {
    name: 'Análisis de Rotación y Clasificación ABC',
    href: '/inventory-analytics/turnover-abc',
    icon: BarChart3,
    category: 'BI / Inventario'
  },
  {
    name: 'Niveles de Stock y Reabastecimiento',
    href: '/inventory-analytics/stock-levels',
    icon: List,
    category: 'BI / Inventario'
  },
  {
    name: 'Análisis de Riesgos y Stock Muerto',
    href: '/inventory-analytics/risk',
    icon: AlertTriangle,
    category: 'BI / Inventario'
  },

  // Cuentas por Cobrar (Receivables) - Detalle y Reportes específicos
  {
    name: 'Dashboard de Resumen de Cuentas por Cobrar',
    href: '/receivables',
    icon: LayoutDashboard,
    category: 'BI / Cuentas por Cobrar'
  },
  {
    name: 'Lista Maestra de Facturas (Cuentas por Cobrar)',
    href: '/receivables/list',
    icon: List,
    category: 'Finanzas / Cobros'
  },
  {
    name: 'Detalle de Factura e Historial de Pagos',
    href: '/receivables/list',
    icon: History,
    category: 'Finanzas / Cobros'
  },
  {
    name: 'Cuentas Vencidas y Tareas de Cobranza',
    href: '/receivables/overdue',
    icon: AlertTriangle,
    category: 'BI / Cuentas por Cobrar'
  },
  {
    name: 'Perfil Crediticio de Cliente y Análisis de Riesgo',
    href: '/receivables/client-profile/CLI-001',
    icon: UserCheck,
    category: 'BI / Cuentas por Cobrar'
  },
  {
    name: 'Reporte de Envejecimiento y Estadísticas de Cobranza',
    href: '/receivables/aging-report',
    icon: PieChart,
    category: 'BI / Cuentas por Cobrar'
  },

  // Cuentas por Pagar (Payables)
  {
    name: 'Dashboard Ejecutivo de Cuentas por Pagar',
    href: '/dashboard/payables',
    icon: LayoutDashboard,
    category: 'BI / Cuentas por Pagar'
  },
  {
    name: 'Lista Maestra de Facturas',
    href: '/payables/invoices',
    icon: FileText,
    category: 'Finanzas / Cuentas por Pagar'
  },
  {
    name: 'Análisis de Proveedor (Inteligente)',
    href: '/proveedores/PRV-8820/analisis',
    icon: TrendingUp,
    category: 'BI / Cuentas por Pagar'
  },

  // Dashboard & KPIs
  {
    name: 'KPIs Detallados del Negocio',
    href: '/dashboard/kpis',
    icon: TrendingUp,
    category: 'BI / Dashboard'
  },
  {
    name: 'Análisis de Ventas y Mapa de Calor',
    href: '/dashboard/sales-heatmap',
    icon: Flame,
    category: 'BI / Dashboard'
  },
  {
    name: 'Alertas Consolidadas del Sistema',
    href: '/dashboard/alerts',
    icon: AlertTriangle,
    category: 'BI / Dashboard'
  },
  {
    name: 'Top de Productos más Vendidos',
    href: '/dashboard/top-products',
    icon: Award,
    category: 'BI / Dashboard'
  },

  // Reportes Financieros BI
  {
    name: 'Resumen Financiero BI y Salud del Negocio',
    href: '/dashboard/financial-summary',
    icon: TrendingUp,
    category: 'BI / Reportes Financieros'
  },
  {
    name: 'Flujo de Efectivo Analítico',
    href: '/finance/analytical-cash-flow',
    icon: BarChart3,
    category: 'BI / Reportes Financieros'
  },
  {
    name: 'Gestión de IVA, Resumen Fiscal y Formulario 120',
    href: '/finance/tax-management',
    icon: FileText,
    category: 'Finanzas / Impuestos'
  },
  {
    name: 'Libros Legales de Ventas y Compras (Tax Compliance)',
    href: '/finance/legal-books',
    icon: FileText,
    category: 'Finanzas / Impuestos'
  },
  {
    name: 'Análisis de Rentabilidad y Márgenes por BI',
    href: '/profitability',
    icon: BarChart3,
    category: 'BI / Reportes Financieros'
  },
  
  // Profitability Analytics (Detailed)
  {
    name: 'Dashboard de Rentabilidad (Resumen Ejecutivo)',
    href: '/profitability/dashboard',
    icon: LayoutDashboard,
    category: 'BI / Rentabilidad'
  },
  {
    name: 'Rentabilidad por Producto y SKU',
    href: '/profitability/products',
    icon: BarChart3,
    category: 'BI / Rentabilidad'
  },
  {
    name: 'Rentabilidad por Cliente y Segmentación',
    href: '/profitability/customers',
    icon: Users,
    category: 'BI / Rentabilidad'
  },
  {
    name: 'Rentabilidad por Categoría de Producto',
    href: '/profitability/categories',
    icon: PieChart,
    category: 'BI / Rentabilidad'
  },
  {
    name: 'Tendencias de Rentabilidad y Crecimiento',
    href: '/profitability/trends',
    icon: Zap,
    category: 'BI / Rentabilidad'
  },
  {
    name: 'Rentabilidad por Vendedor y Performance',
    href: '/profitability/sellers',
    icon: UserCheck,
    category: 'BI / Rentabilidad'
  },
  
  // BI Forecasting (Business Intelligence)
  {
    name: 'Dashboard de Pronósticos Inteligentes (IA)',
    href: '/bi/pronosticos/dashboard',
    icon: LayoutDashboard,
    category: 'BI / Pronósticos'
  },
  {
    name: 'Análisis de Salud de Inventario y Quiebre de Stock',
    href: '/bi/pronosticos/inventario',
    icon: Package,
    category: 'BI / Pronósticos'
  },
  {
    name: 'Pronóstico de Ventas y Análisis Estacional',
    href: '/bi/pronosticos/ventas',
    icon: TrendingUp,
    category: 'BI / Pronósticos'
  },
  {
    name: 'Pronóstico de Demanda de Unidades y Categorías',
    href: '/bi/pronosticos/demanda',
    icon: BarChart3,
    category: 'BI / Pronósticos'
  },
  {
    name: 'Escenarios Financieros y Pronóstico de Ingresos',
    href: '/bi/pronosticos/ingresos',
    icon: BarChart,
    category: 'BI / Pronósticos'
  },
  
  // Gestión de Usuarios y Perfil
  {
    name: 'Mi Perfil y Seguridad',
    href: '/perfil',
    icon: Shield,
    category: 'Configuración'
  },
  {
    name: 'Gestión de Usuarios',
    href: '/usuarios',
    icon: Users,
    category: 'Configuración'
  },
  {
    name: 'Configuración General',
    href: '/configuracion',
    icon: Settings,
    category: 'Configuración'
  },

  // Reservas y Horarios
  {
    name: 'Gestión Unificada de Horarios y Reservas',
    href: '/horarios',
    icon: Clock,
    category: 'Reservas'
  },
  {
    name: 'Historial y Auditoría de Reservas',
    href: '/historial-reservas',
    icon: History,
    category: 'Reservas'
  },
  {
    name: 'Dashboard de Reservas',
    href: '/reservas',
    icon: CalendarCheck,
    category: 'Reservas'
  },
  {
    name: 'Disponibilidad de Horarios',
    href: '/horarios-disponibles',
    icon: Clock,
    category: 'Reservas'
  },

  // Inventario y Precios
  {
    name: 'Ajustes de Precios',
    href: '/ajustes-precios',
    icon: TrendingUp,
    category: 'Inventario'
  },
  {
    name: 'Historial de Precios',
    href: '/ajustes-precios/historial',
    icon: History,
    category: 'Inventario'
  },
  {
    name: 'Ajustes de Inventario',
    href: '/ajustes-inventario',
    icon: ClipboardList,
    category: 'Inventario'
  },
  {
    name: 'Ajuste Manual Unitario',
    href: '/ajuste-inventario-unitario',
    icon: PackagePlus,
    category: 'Inventario'
  },
  {
    name: 'Ajuste Masivo de Inventario',
    href: '/ajuste-inventario-masivo',
    icon: ClipboardList,
    category: 'Inventario'
  },

  // Caja y Movimientos
  {
    name: 'Nuevo Movimiento de Caja',
    href: '/movimientos-caja/nuevo',
    icon: PlusCircle,
    category: 'Caja'
  },

  // Auditoría de Sistema (Business Intelligence)
  {
    name: 'Dashboard de Auditoría y Seguridad',
    href: '/auditoria',
    icon: Shield,
    category: 'BI / Auditoría'
  },
  {
    name: 'Registro de Logs de Auditoría (Eventos)',
    href: '/auditoria/logs',
    icon: ClipboardList,
    category: 'BI / Auditoría'
  },
  {
    name: 'Reporte de Actividad por Usuario (Auditoría)',
    href: '/auditoria/usuarios/USER001',
    icon: User,
    category: 'BI / Auditoría'
  }
]