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
  UserCheck,
  LayoutDashboard
} from 'lucide-react'

/**
 * Rutas adicionales que no están en el sidebar pero deben ser buscables
 * Estructura compatible con el sistema de navegación de MainLayout
 */
export const distinctSearchableRoutes = [
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
    href: '/receivables/list',
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
    href: '/finance/invoices',
    icon: FileText,
    category: 'Finanzas / Cuentas por Pagar'
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
    name: 'Gestión de Reservas',
    href: '/reservas',
    icon: CalendarCheck,
    category: 'Reservas'
  },
  {
    name: 'Configuración de Horarios',
    href: '/horarios',
    icon: Clock,
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
  }
]